import type { ArticleRef, ArticleText } from './schema/article.js';
import type { Country, Lang } from './schema/common.js';
import type { Event } from './schema/event.js';
import type { Outlet } from './schema/inputs.js';

// Minimal JSON Schema shape passed to LLMs for structured output.
export type JSONSchema = Record<string, unknown>;

export interface AdapterInfo {
  // Stable adapter id, recorded in provenance, e.g. "gdelt-doc", "openai-compatible".
  readonly id: string;
  readonly version?: string;
}

// ---- News discovery --------------------------------------------------------

export interface SearchRequest {
  event: Event;
  country: Country;
  lang: Lang;
  terms: string[];
  window: { from: string; to: string };
  limit: number;
  // Restrict to domains in the registry when the source supports it.
  domains?: string[];
  signal?: AbortSignal;
}

export interface CandidateRef {
  url: string;
  title: string;
  lang?: Lang;
  country?: Country;
  domain: string;
  publishedAt?: string;
  // Adapter specific extras (tone, image), kept out of the Comparison.
  meta?: Record<string, unknown>;
}

export interface NewsSourceCapabilities {
  countries: Country[] | 'any';
  langs: Lang[] | 'any';
  // How far back the source can search, in days.
  maxWindowDays: number;
  returnsBodyText: boolean;
  // Requests per second the adapter will not exceed.
  rateLimitRps?: number;
}

export interface NewsSource extends AdapterInfo {
  readonly capabilities: NewsSourceCapabilities;
  search(request: SearchRequest): AsyncIterable<CandidateRef>;
}

// ---- LLMs ------------------------------------------------------------------

export interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export interface Usage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface GenerateRequest {
  system: string;
  messages: Msg[];
  schema: JSONSchema;
  // Default to 0 for replayability.
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface GenerateResult<TValue> {
  value: TValue;
  raw: string;
  usage?: Usage;
}

export interface LLM extends AdapterInfo {
  readonly model: string;
  generate<TValue>(request: GenerateRequest): Promise<GenerateResult<TValue>>;
}

// Tiered roles. The same instance may fill both.
export interface LLMRoles {
  small: LLM;
  large: LLM;
}

export interface Embedder extends AdapterInfo {
  readonly model: string;
  readonly dimensions?: number;
  embed(texts: string[], opts?: { signal?: AbortSignal }): Promise<number[][]>;
}

export interface Translator extends AdapterInfo {
  translate(texts: string[], to: Lang, from?: Lang): Promise<string[]>;
}

// ---- Fetching, storage, registry ------------------------------------------

export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  contentType?: string;
  html?: string;
  error?: string;
}

export interface Fetcher extends AdapterInfo {
  fetch(url: string, opts?: { signal?: AbortSignal }): Promise<FetchResult>;
}

// Article text extraction from fetched HTML. Lives behind an interface so core
// does not depend on a DOM implementation.
export interface Extractor extends AdapterInfo {
  extract(ref: ArticleRef, html: string): Promise<ArticleText | null>;
}

// Optional cache for stage outputs, keyed by input hash.
// Core never passes ArticleText to a Store.
export interface Store extends AdapterInfo {
  get<TValue>(key: string): Promise<TValue | undefined>;
  set<TValue>(key: string, value: TValue, opts?: { ttlSeconds?: number }): Promise<void>;
}

export interface Registry {
  readonly version: string;
  outlets(): readonly Outlet[];
  byCountry(country: Country): readonly Outlet[];
  byDomain(domain: string): Outlet | undefined;
}
