import { z } from 'zod';
import { Citation, Country, ISODate, Lang } from './common.js';

export const Seed = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('url'), url: z.url() }),
  z.object({ kind: z.literal('headline'), text: z.string().min(3), lang: Lang.optional() }),
  z.object({
    kind: z.literal('topic'),
    query: z.string().min(2),
    from: ISODate.optional(),
    to: ISODate.optional(),
  }),
]);
export type Seed = z.infer<typeof Seed>;

export const Outlet = z.object({
  // Stable slug, e.g. "jp.asahi".
  id: z.string().regex(/^[a-z]{2}\.[a-z0-9-]+$/),
  name: z.string(),
  nameNative: z.string().optional(),
  domains: z.array(z.string()).min(1),
  country: Country,
  langs: z.array(Lang).min(1),
  isWire: z.boolean().default(false),
  feeds: z.array(z.url()).default([]),
  ownership: z.object({
    type: z.enum(['state', 'public-service', 'private', 'party', 'nonprofit', 'unknown']),
    owner: z.string().optional(),
    notes: z.string().optional(),
    sources: z.array(Citation),
  }),
  // Descriptive, cited notes. Never a score.
  editorialNotes: z.array(z.object({ text: z.string(), sources: z.array(Citation).min(1) })).default([]),
  pressFreedomContext: z
    .object({ index: z.string(), year: z.number().int(), value: z.string(), source: Citation })
    .optional(),
  registryVersion: z.string(),
});
export type Outlet = z.infer<typeof Outlet>;

export const RunParams = z.object({
  countries: z.array(Country).min(1),
  perCountry: z.number().int().min(1).max(10).default(4),
  // Days either side of the seed date.
  windowDays: z.number().int().min(0).max(30).default(3),
  thresholds: z
    .object({
      // Countries a claim cluster needs to count as shared.
      sharedMinCountries: z.number().int().min(1).default(3),
      relevanceMin: z.number().min(0).max(1).default(0.5),
      wireSimilarity: z.number().min(0).max(1).default(0.92),
    })
    .default({ sharedMinCountries: 3, relevanceMin: 0.5, wireSimilarity: 0.92 }),
  // Seeds per run shuffles (country order in prompts) so runs are replayable.
  seed: z.number().int().default(0),
});
export type RunParams = z.infer<typeof RunParams>;
export type RunParamsInput = z.input<typeof RunParams>;
