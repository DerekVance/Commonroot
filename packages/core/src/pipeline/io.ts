import type { ArticleRef, ArticleText } from '../schema/article.js';
import type { Claim, ClaimCluster, FramingFinding, Omission, Perspective } from '../schema/analysis.js';
import type { Country, Lang } from '../schema/common.js';
import type { Event } from '../schema/event.js';
import type { RunParams, Seed } from '../schema/inputs.js';

// Search terms for one country and language, produced by expand-queries.
export interface QueryTerms {
  country: Country;
  lang: Lang;
  terms: string[];
}

// Draft output of stages 8-9, checked and revised by the audit stage.
export interface AnalysisDraft {
  event: Event;
  articles: ArticleRef[];
  claims: Claim[];
  clusters: ClaimCluster[];
  framing: FramingFinding[];
  omissions: Omission[];
  perspectives: Perspective[];
}

// Input and output type of every pipeline stage, keyed by stage name.
// Stage overrides are checked against this map, so a stage cannot be swapped
// for one with a different shape.
export interface StageIO {
  'resolve-event': { input: { seed: Seed; params: RunParams }; output: Event };
  'expand-queries': { input: { event: Event; params: RunParams }; output: QueryTerms[] };
  'discover-coverage': { input: { event: Event; queries: QueryTerms[]; params: RunParams }; output: ArticleRef[] };
  // Holds article text, so never cached.
  'fetch-extract': { input: { articles: ArticleRef[] }; output: ArticleText[] };
  // Holds article text, so never cached.
  'filter-dedupe': { input: { event: Event; texts: ArticleText[]; params: RunParams }; output: ArticleText[] };
  'extract-claims': { input: { text: ArticleText }; output: Claim[] };
  'align-claims': { input: { articles: ArticleRef[]; claims: Claim[]; params: RunParams }; output: ClaimCluster[] };
  'analyse-framing': {
    input: { event: Event; texts: ArticleText[]; claims: Claim[]; clusters: ClaimCluster[] };
    output: { framing: FramingFinding[]; omissions: Omission[] };
  };
  'synthesise-perspectives': {
    input: { event: Event; country: Country; texts: ArticleText[]; claims: Claim[] };
    output: Perspective;
  };
  audit: { input: { draft: AnalysisDraft }; output: { draft: AnalysisDraft; warnings: string[] } };
}

export type StageName = keyof StageIO;
export type StageInput<Name extends StageName> = StageIO[Name]['input'];
export type StageOutput<Name extends StageName> = StageIO[Name]['output'];
