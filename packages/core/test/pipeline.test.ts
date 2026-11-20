import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  CORE_VERSION,
  StageNotImplementedError,
  StageOutputInvalidError,
  StageRunner,
  createCommonroot,
  defineStage,
  memoryStore,
  RunParams,
  type RunEvent,
  type StageInput,
  type StageOutput,
} from '../src/index.js';
import pkg from '../package.json' with { type: 'json' };
import { config } from './fixtures.js';

const params = RunParams.parse({ countries: ['US', 'JP'] });

function makeRunner(store = memoryStore()) {
  const events: RunEvent[] = [];
  const stageRunner = new StageRunner({
    runId: 'test',
    params,
    signal: new AbortController().signal,
    emit: (event) => events.push(event),
    store,
    llm: config().llm,
  });
  return { stageRunner, events, store };
}

describe('StageRunner', () => {
  it('caches by input hash and records provenance steps', async () => {
    let calls = 0;
    const double = defineStage<{ count: number }, { count: number }>({
      name: 'double',
      version: '1',
      role: 'small',
      cacheable: true,
      output: z.object({ count: z.number() }),
      run: async ({ count }) => {
        calls++;
        return { count: count * 2 };
      },
    });
    const { stageRunner, events, store } = makeRunner();
    expect(await stageRunner.run(double, { count: 2 })).toEqual({ count: 4 });
    expect(await stageRunner.run(double, { count: 2 })).toEqual({ count: 4 });
    expect(calls).toBe(1);
    expect(store.size()).toBe(1);
    expect(stageRunner.steps.map((step) => step.cached)).toEqual([false, true]);
    expect(stageRunner.steps[0]!.inputHash).toBe(stageRunner.steps[1]!.inputHash);
    expect(events.filter((event) => event.type === 'stage-end')).toHaveLength(2);
  });

  it('never caches non-cacheable stages', async () => {
    const fetchLike = defineStage<string, { text: string }>({
      name: 'fetch-like',
      version: '1',
      role: 'none',
      cacheable: false,
      run: async (url) => ({ text: `body of ${url}` }),
    });
    const { stageRunner, store } = makeRunner();
    await stageRunner.run(fetchLike, 'https://example.com');
    expect(store.size()).toBe(0);
  });

  it('rejects invalid stage output', async () => {
    const bad = defineStage<null, { count: number }>({
      name: 'bad',
      version: '1',
      role: 'none',
      cacheable: true,
      output: z.object({ count: z.number() }),
      run: async () => ({ count: 'nope' }) as unknown as { count: number },
    });
    const { stageRunner, store } = makeRunner();
    await expect(stageRunner.run(bad, null)).rejects.toBeInstanceOf(StageOutputInvalidError);
    expect(store.size()).toBe(0);
  });

  it('collects warnings', async () => {
    const warns = defineStage<null, null>({
      name: 'warns',
      version: '1',
      role: 'none',
      cacheable: false,
      run: async (_input, ctx) => {
        ctx.warn('no Russian coverage found');
        return null;
      },
    });
    const { stageRunner } = makeRunner();
    await stageRunner.run(warns, null);
    expect(stageRunner.warnings).toEqual(['[warns] no Russian coverage found']);
  });
});

describe('createCommonroot', () => {
  it('streams events and fails clearly while stages are unimplemented', async () => {
    const cr = createCommonroot(config());
    const run = cr.compare({ kind: 'headline', text: 'Test event' }, { countries: ['US', 'JP'] });
    const seen: string[] = [];
    for await (const event of run.events) seen.push(event.type);
    expect(seen).toEqual(['run-start', 'stage-start', 'run-end']);
    await expect(run.result).rejects.toBeInstanceOf(StageNotImplementedError);
  });

  it('validates inputs up front', () => {
    const cr = createCommonroot(config());
    expect(() => cr.compare({ kind: 'url', url: 'nope' } as never, { countries: ['US'] })).toThrow();
  });

  it('describes its method from the code that runs', () => {
    const cr = createCommonroot(config());
    const method = cr.describeMethod();
    expect(method.coreVersion).toBe(CORE_VERSION);
    expect(method.stages).toHaveLength(10);
    expect(method.stages.every((stage) => !stage.implemented)).toBe(true);
    expect(method.registryVersion).toBe('test-0');
  });

  it('records adapter identities for provenance', () => {
    const roles = createCommonroot(config()).adapters().map((adapter) => adapter.role);
    expect(roles).toEqual(['source', 'llm.small', 'llm.large', 'embedder', 'fetcher']);
  });

  it('keeps CORE_VERSION in sync with package.json', () => {
    expect(CORE_VERSION).toBe(pkg.version);
  });
});

describe('typed stage overrides', () => {
  it('runs an overridden stage and reports it as implemented', async () => {
    const resolveEvent = defineStage<StageInput<'resolve-event'>, StageOutput<'resolve-event'>>({
      name: 'resolve-event',
      version: 'test',
      role: 'small',
      cacheable: false,
      run: async ({ seed }) => ({
        id: 'aaaaaaaaaaaaaaaa',
        title: seed.kind === 'headline' ? seed.text : 'event',
        window: { from: '2026-11-17', to: '2026-11-23' },
        anchors: { entities: [], keywords: {} },
        origin: { kind: 'seed', seed },
      }),
    });
    const cr = createCommonroot(config(), { 'resolve-event': resolveEvent });
    expect(cr.describeMethod().stages.find((stage) => stage.name === 'resolve-event')?.implemented).toBe(true);
    const run = cr.compare({ kind: 'headline', text: 'Test event' }, { countries: ['US'] });
    await expect(run.result).rejects.toMatchObject({ code: 'PIPELINE_INCOMPLETE' });
  });
});
