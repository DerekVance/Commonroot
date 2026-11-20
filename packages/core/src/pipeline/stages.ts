import { StageNotImplementedError } from '../errors.js';
import type { StageInput, StageName, StageOutput } from './io.js';
import { defineStage, type StageDef, type StageRole } from './stage.js';

export interface StagePlanEntry {
  name: StageName;
  role: StageRole;
  cacheable: boolean;
  milestone: string;
}

// The ten pipeline stages from the spec, in order. Implementations land milestone by milestone.
export const STAGE_PLAN: readonly StagePlanEntry[] = [
  { name: 'resolve-event', role: 'small', cacheable: true, milestone: 'M1' },
  { name: 'expand-queries', role: 'small', cacheable: true, milestone: 'M1' },
  { name: 'discover-coverage', role: 'none', cacheable: true, milestone: 'M1' },
  { name: 'fetch-extract', role: 'none', cacheable: false, milestone: 'M1' },
  { name: 'filter-dedupe', role: 'small', cacheable: false, milestone: 'M2' },
  { name: 'extract-claims', role: 'small', cacheable: true, milestone: 'M2' },
  { name: 'align-claims', role: 'small', cacheable: true, milestone: 'M2' },
  { name: 'analyse-framing', role: 'large', cacheable: true, milestone: 'M3' },
  { name: 'synthesise-perspectives', role: 'large', cacheable: true, milestone: 'M3' },
  { name: 'audit', role: 'large', cacheable: true, milestone: 'M3' },
];

// One implementation per stage, each typed by its entry in StageIO.
export type StageSet = { [Name in StageName]: StageDef<StageInput<Name>, StageOutput<Name>> };

export function planFor(name: StageName): StagePlanEntry {
  const entry = STAGE_PLAN.find((planEntry) => planEntry.name === name);
  if (!entry) throw new Error(`No plan entry for stage "${name}"`);
  return entry;
}

// Placeholder stage that fails loudly until its milestone lands.
export function notImplemented<Name extends StageName>(name: Name): StageDef<StageInput<Name>, StageOutput<Name>> {
  const plan = planFor(name);
  return defineStage<StageInput<Name>, StageOutput<Name>>({
    name,
    version: '0',
    role: plan.role,
    cacheable: false,
    run: async () => {
      throw new StageNotImplementedError(name);
    },
  });
}

export function defaultStages(overrides: Partial<StageSet> = {}): StageSet {
  return {
    'resolve-event': overrides['resolve-event'] ?? notImplemented('resolve-event'),
    'expand-queries': overrides['expand-queries'] ?? notImplemented('expand-queries'),
    'discover-coverage': overrides['discover-coverage'] ?? notImplemented('discover-coverage'),
    'fetch-extract': overrides['fetch-extract'] ?? notImplemented('fetch-extract'),
    'filter-dedupe': overrides['filter-dedupe'] ?? notImplemented('filter-dedupe'),
    'extract-claims': overrides['extract-claims'] ?? notImplemented('extract-claims'),
    'align-claims': overrides['align-claims'] ?? notImplemented('align-claims'),
    'analyse-framing': overrides['analyse-framing'] ?? notImplemented('analyse-framing'),
    'synthesise-perspectives': overrides['synthesise-perspectives'] ?? notImplemented('synthesise-perspectives'),
    audit: overrides.audit ?? notImplemented('audit'),
  };
}
