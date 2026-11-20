import { z } from 'zod';
import { Country, Entity, Id, SpanRef } from './common.js';

export const ClaimKind = z.enum(['event', 'statement', 'number', 'attribution', 'causal', 'evaluative']);
export const Hedging = z.enum(['asserted', 'reported', 'alleged', 'denied', 'speculative']);

export const Claim = z.object({
  id: Id,
  articleId: Id,
  kind: ClaimKind,
  // Original-language paraphrase of the proposition (not a quote), 25 words or fewer.
  textOriginal: z.string(),
  // Normalised English proposition used for alignment.
  textEn: z.string(),
  span: SpanRef,
  speaker: Entity.optional(),
  hedging: Hedging,
});
export type Claim = z.infer<typeof Claim>;

export const ClaimCluster = z.object({
  id: Id,
  canonicalEn: z.string(),
  members: z.array(
    z.object({ claimId: Id, stance: z.enum(['supports', 'contradicts', 'qualifies']) }),
  ),
  support: z.object({ outlets: z.number().int().nonnegative(), countries: z.array(Country) }),
  status: z.enum(['shared', 'contested', 'partial', 'single-source']),
});
export type ClaimCluster = z.infer<typeof ClaimCluster>;

export const FramingDimension = z.enum([
  'emphasis',
  'actor-portrayal',
  'causal-story',
  'terminology',
  'sourcing',
  'headline-angle',
  'context-included',
  'tone',
]);

export const FramingFinding = z.object({
  id: Id,
  outletId: z.string(),
  dimension: FramingDimension,
  description: z.string(),
  evidence: z.object({ claimIds: z.array(Id), spans: z.array(SpanRef) }),
  comparedTo: z.array(z.string()).optional(),
});
export type FramingFinding = z.infer<typeof FramingFinding>;

// A claim cluster that other outlets reported but this outlet's retrieved coverage does not contain.
// "Not in the coverage we retrieved" is not proof the outlet left it out: discovery can miss a
// follow-up piece or live blog, paywalls and failed extraction can cut an article short, the
// article can change after we fetched it, and alignment can fail to match differently worded or
// translated claims. Saying an outlet omitted something reads as an accusation of bias, so this
// is always reported cautiously.
export const Omission = z.object({
  // The shared or partial claim cluster the outlet's coverage lacks.
  clusterId: Id,
  outletId: z.string(),
  // Capped at "medium" on purpose, so no stage, prompt or UI can ever claim certainty.
  //   low:    1-2 articles found from this outlet for the event, or any of its fetches failed,
  //           were paywalled or came back title-only.
  //   medium: 3 or more full-text articles found from this outlet for the event, all fetched
  //           and extracted, and none contain a claim aligned to the cluster.
  // With no retrieved articles from the outlet, no omission is reported at all; that is a coverage gap.
  confidence: z.enum(['low', 'medium']),
  // Short, neutral wording in the "not in the coverage we retrieved" form, never "suppressed",
  // "ignored" or "failed to mention".
  note: z.string(),
});
export type Omission = z.infer<typeof Omission>;

export const Perspective = z.object({
  country: Country,
  outletIds: z.array(z.string()),
  summary: z.string(),
  steelman: z.string(),
  keyTerms: z.array(z.object({ term: z.string(), termOriginal: z.string(), gloss: z.string() })),
  evidence: z.array(SpanRef),
});
export type Perspective = z.infer<typeof Perspective>;
