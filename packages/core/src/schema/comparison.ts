import { z } from 'zod';
import { Country, ISODateTime } from './common.js';
import { ArticleRef } from './article.js';
import { ClaimCluster, FramingFinding, Omission, Perspective } from './analysis.js';
import { Event } from './event.js';
import { Outlet, RunParams } from './inputs.js';

export const StepRecord = z.object({
  stage: z.string(),
  inputHash: z.string(),
  outputHash: z.string(),
  ms: z.number().nonnegative(),
  cached: z.boolean(),
  tokens: z.number().int().nonnegative().optional(),
});
export type StepRecord = z.infer<typeof StepRecord>;

export const Provenance = z.object({
  runId: z.string(),
  startedAt: ISODateTime,
  finishedAt: ISODateTime.optional(),
  coreVersion: z.string(),
  registryVersion: z.string(),
  adapters: z.array(
    z.object({ role: z.string(), id: z.string(), model: z.string().optional(), version: z.string().optional() }),
  ),
  prompts: z.array(z.object({ id: z.string(), version: z.string(), hash: z.string() })),
  params: RunParams,
  steps: z.array(StepRecord),
  warnings: z.array(z.string()),
});
export type Provenance = z.infer<typeof Provenance>;

// The output of a run. JSON serialisable and free of article body text by construction.
export const Comparison = z.object({
  schemaVersion: z.literal('1'),
  event: Event,
  articles: z.array(ArticleRef),
  outlets: z.array(Outlet),
  shared: z.array(ClaimCluster),
  contested: z.array(ClaimCluster),
  perspectives: z.array(Perspective),
  framing: z.array(FramingFinding),
  omissions: z.array(Omission),
  coverageGaps: z.array(z.object({ country: Country, reason: z.string() })),
  provenance: Provenance,
});
export type Comparison = z.infer<typeof Comparison>;
