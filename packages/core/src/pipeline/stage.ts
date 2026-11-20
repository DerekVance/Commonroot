import type { ZodType } from 'zod';
import type { LLMRoles, Store } from '../adapters.js';
import type { RunEvent } from '../events.js';
import { StageOutputInvalidError } from '../errors.js';
import { hashValue } from '../ids.js';
import type { RunParams } from '../schema/inputs.js';
import type { StepRecord } from '../schema/comparison.js';

export type StageRole = 'small' | 'large' | 'none';

export interface StageContext {
  readonly runId: string;
  readonly params: RunParams;
  readonly signal: AbortSignal;
  emit(event: RunEvent): void;
  warn(message: string): void;
  progress(done: number, total: number, note?: string): void;
}

export interface StageDef<TInput, TOutput> {
  // Stable stage name, e.g. "extract-claims".
  readonly name: string;
  // Bump when behaviour changes; part of the cache key and provenance.
  readonly version: string;
  // Which LLM role the stage uses, for scheduling and cache keys.
  readonly role: StageRole;
  // Whether outputs may be cached in a Store. Must be false for any stage whose
  // output holds article body text (fetch/extract).
  readonly cacheable: boolean;
  // Validates the output before it is cached or passed on.
  readonly output?: ZodType<TOutput>;
  run(input: TInput, ctx: StageContext): Promise<TOutput>;
}

export function defineStage<TInput, TOutput>(def: StageDef<TInput, TOutput>): StageDef<TInput, TOutput> {
  return def;
}

export interface StageRunnerDeps {
  runId: string;
  params: RunParams;
  signal: AbortSignal;
  emit(event: RunEvent): void;
  store?: Store | undefined;
  llm?: LLMRoles | undefined;
  now?: () => number;
}

// Runs stages with input-hash caching, output validation, timing and provenance.
// One runner per run; `steps` and `warnings` feed the Comparison's provenance.
export class StageRunner {
  readonly steps: StepRecord[] = [];
  readonly warnings: string[] = [];
  private readonly now: () => number;

  constructor(private readonly deps: StageRunnerDeps) {
    this.now = deps.now ?? (() => performance.now());
  }

  async run<TInput, TOutput>(stage: StageDef<TInput, TOutput>, input: TInput): Promise<TOutput> {
    const { deps } = this;
    deps.signal.throwIfAborted();
    const started = this.now();
    deps.emit({ type: 'stage-start', stage: stage.name, at: new Date().toISOString() });

    const inputHash = await hashValue(input);
    const model = stage.role === 'none' ? undefined : deps.llm?.[stage.role]?.model;
    const cacheKey = `stage:${stage.name}@${stage.version}:${model ?? '-'}:${inputHash}`;
    const useCache = stage.cacheable && deps.store !== undefined;

    let output: TOutput | undefined;
    let cached = false;
    if (useCache) {
      output = await deps.store!.get<TOutput>(cacheKey);
      cached = output !== undefined;
    }

    if (!cached) {
      const ctx: StageContext = {
        runId: deps.runId,
        params: deps.params,
        signal: deps.signal,
        emit: deps.emit,
        warn: (message) => {
          this.warnings.push(`[${stage.name}] ${message}`);
          deps.emit({ type: 'warning', stage: stage.name, message });
        },
        progress: (done, total, note) =>
          deps.emit({ type: 'stage-progress', stage: stage.name, done, total, ...(note ? { note } : {}) }),
      };
      output = await stage.run(input, ctx);
    }

    if (stage.output) {
      const parsed = stage.output.safeParse(output);
      if (!parsed.success) throw new StageOutputInvalidError(stage.name, parsed.error.issues);
      output = parsed.data;
    }

    if (useCache && !cached) await deps.store!.set(cacheKey, output);

    const ms = Math.max(0, this.now() - started);
    this.steps.push({ stage: stage.name, inputHash, outputHash: await hashValue(output), ms, cached });
    deps.emit({ type: 'stage-end', stage: stage.name, ms, cached });
    return output as TOutput;
  }
}
