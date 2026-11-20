// @commonroot/core: same story, other side.
// Stateless, isomorphic pipeline. Everything that touches the outside world is an adapter.
export * from './schema/index.js';
export type * from './adapters.js';
export * from './errors.js';
export * from './events.js';
export * from './guard.js';
export * from './ids.js';
export { memoryStore } from './stores/memory.js';
export { defineStage, StageRunner } from './pipeline/stage.js';
export type { StageContext, StageDef, StageRole, StageRunnerDeps } from './pipeline/stage.js';
export { STAGE_PLAN, defaultStages, notImplemented, planFor } from './pipeline/stages.js';
export type { StagePlanEntry, StageSet } from './pipeline/stages.js';
export type { AnalysisDraft, QueryTerms, StageIO, StageInput, StageName, StageOutput } from './pipeline/io.js';
export { createCommonroot } from './pipeline/commonroot.js';
export type { Commonroot, CommonrootConfig, MethodDescription, Run } from './pipeline/commonroot.js';
export { CORE_VERSION } from './version.js';
