import { z } from 'zod';
import { Country, Id, ISODateTime, Lang, Translated } from './common.js';

// What Commonroot keeps about an article, metadata and a link, never the body.
export const ArticleRef = z.object({
  id: Id,
  url: z.url(),
  canonicalUrl: z.url().optional(),
  outletId: z.string(),
  country: Country,
  lang: Lang,
  title: z.string(),
  titleTranslated: Translated.optional(),
  publishedAt: ISODateTime.optional(),
  retrievedAt: ISODateTime,
  // Adapter id that found it, e.g. "gdelt-doc".
  discoveredVia: z.string(),
  // Hash of the text that was analysed, for audit without keeping the text.
  textHash: z.string().optional(),
  relevance: z.object({ score: z.number().min(0).max(1), reason: z.string() }).optional(),
  // Set when the article is wire copy collapsed into another article.
  wireOf: Id.optional(),
  fetchStatus: z.enum(['ok', 'paywalled', 'blocked', 'failed', 'title-only']).default('ok'),
});
export type ArticleRef = z.infer<typeof ArticleRef>;

export interface Segment {
  id: string;
  kind: 'title' | 'lede' | 'paragraph';
  start: number;
  end: number;
}

// Article body, in memory for one run only.
// Deliberately not a Zod schema and not serialisable, it must never reach a Store or a Comparison.
export interface ArticleText {
  readonly ref: ArticleRef;
  readonly text: string;
  readonly segments: readonly Segment[];
}
