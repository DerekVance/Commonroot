import { z } from 'zod';

// BCP-47 language tag, e.g. "ja", "zh-Hans", "zh-Hant".
export const Lang = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'BCP-47 language tag');
export type Lang = z.infer<typeof Lang>;

// ISO 3166-1 alpha-2 country code.
export const Country = z.string().regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2 code');
export type Country = z.infer<typeof Country>;

export const ISODate = z.iso.date();
export const ISODateTime = z.iso.datetime({ offset: true });

// Content-hash id: 16 lowercase base32 chars.
export const Id = z.string().regex(/^[a-z2-7]{16}$/, 'content-hash id');

export const Citation = z.object({
  title: z.string().optional(),
  url: z.url(),
  accessed: ISODate.optional(),
});
export type Citation = z.infer<typeof Citation>;

export const Entity = z.object({
  name: z.string(),
  nameNative: z.string().optional(),
  type: z.enum(['person', 'org', 'place', 'event', 'other']),
});
export type Entity = z.infer<typeof Entity>;

// Machine translation of a short string (titles, claim propositions). Never a full article.
export const Translated = z.object({
  text: z.string(),
  from: Lang,
  by: z.string(),
});
export type Translated = z.infer<typeof Translated>;

// Pointer into article text the caller can refetch. Never carries the text itself.
export const SpanRef = z.object({
  articleId: Id,
  segmentId: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});
export type SpanRef = z.infer<typeof SpanRef>;
