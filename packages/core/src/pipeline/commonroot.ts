import type {
  Embedder,
  Extractor,
  Fetcher,
  LLMRoles,
  NewsSource,
  Registry,
  Store,
  Translator,
} from '../adapters.js';
import { CommonrootError } from '../errors.js';
import { EventChannel, type RunEvent } from '../events.js';
import { Seed, RunParams, type RunParamsInput } from '../schema/inputs.js';
import type { Comparison, Provenance } from '../schema/comparison.js';
import { CORE_VERSION } from '../version.js';
import { StageRunner } from './stage.js';
import { defaultStages, STAGE_PLAN, type StageSet } from './stages.js';

export interface CommonrootConfig {
  sources: NewsSource[];
  llm: LLMRoles;
  embedder: Embedder;
  registry: Registry;
  fetcher: Fetcher;
  extractor?: Extractor;
  translator?: Translator;
  store?: Store;
  // Scheduling hints for local model servers that hold one model at a time.
  schedule?: { batchByRole?: boolean; concurrency?: { small?: number; large?: number } };
}

export interface Run {
  readonly runId: string;
  // Progress events. Single consumer.
  readonly events: AsyncIterable<RunEvent>;
  readonly result: Promise<Comparison>;
  cancel(reason?: string): void;
}

export interface MethodDescription {
  coreVersion: string;
  registryVersion: string;
  stages: { name: string; version: string; role: string; cacheable: boolean; implemented: boolean }[];
  defaults: RunParams['thresholds'];
  prompts: { id: string; version: string; hash: string }[];
}

export interface Commonroot {
  compare(seed: Seed, params: RunParamsInput): Run;
  // Stage implementations, callable one at a time (CLI, MCP, tests).
  readonly stages: Readonly<StageSet>;
  describeMethod(): MethodDescription;
  // Adapter identities, as recorded in provenance.
  adapters(): Provenance['adapters'];
}

export function createCommonroot(config: CommonrootConfig, overrides: Partial<StageSet> = {}): Commonroot {
  const stages = defaultStages(overrides);

  function adapters(): Provenance['adapters'] {
    return [
      ...config.sources.map((source) => ({
        role: 'source',
        id: source.id,
        ...(source.version ? { version: source.version } : {}),
      })),
      { role: 'llm.small', id: config.llm.small.id, model: config.llm.small.model },
      { role: 'llm.large', id: config.llm.large.id, model: config.llm.large.model },
      { role: 'embedder', id: config.embedder.id, model: config.embedder.model },
      { role: 'fetcher', id: config.fetcher.id },
      ...(config.extractor ? [{ role: 'extractor', id: config.extractor.id }] : []),
      ...(config.translator ? [{ role: 'translator', id: config.translator.id }] : []),
      ...(config.store ? [{ role: 'store', id: config.store.id }] : []),
    ];
  }

  function compare(seedInput: Seed, paramsInput: RunParamsInput): Run {
    const seed = Seed.parse(seedInput);
    const params = RunParams.parse(paramsInput);
    const runId = crypto.randomUUID();
    const channel = new EventChannel<RunEvent>();
    const controller = new AbortController();
    const startedAt = new Date().toISOString();
    const runner = new StageRunner({
      runId,
      params,
      signal: controller.signal,
      emit: (event) => channel.push(event),
      store: config.store,
      llm: config.llm,
    });

    const result = (async (): Promise<Comparison> => {
      channel.push({ type: 'run-start', runId, at: startedAt });
      try {
        // M0: only the first stage is wired. Later milestones extend this chain.
        await runner.run(stages['resolve-event'], { seed, params });
        throw new CommonrootError('Pipeline wiring after resolve-event lands in M1', 'PIPELINE_INCOMPLETE');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        channel.push({ type: 'run-end', runId, at: new Date().toISOString(), ok: false, error: message });
        throw error;
      } finally {
        channel.close();
      }
    })();
    // Prevent unhandled-rejection noise when callers only consume events.
    result.catch(() => {});

    return {
      runId,
      events: channel,
      result,
      cancel: (reason) => controller.abort(reason),
    };
  }

  function describeMethod(): MethodDescription {
    return {
      coreVersion: CORE_VERSION,
      registryVersion: config.registry.version,
      stages: STAGE_PLAN.map((plan) => {
        const implementation = stages[plan.name];
        return {
          name: plan.name,
          version: implementation.version,
          role: plan.role,
          cacheable: implementation.cacheable,
          implemented: overrides[plan.name] !== undefined,
        };
      }),
      defaults: RunParams.parse({ countries: ['US'] }).thresholds,
      prompts: [],
    };
  }

  return { compare, stages, describeMethod, adapters };
}
