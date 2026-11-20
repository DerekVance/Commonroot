import { z } from 'zod';
import { Entity, Id, ISODate, Lang } from './common.js';
import { Seed } from './inputs.js';

export const Event = z.object({
  id: Id,
  // Neutral working title, model written and labelled as such in UIs.
  title: z.string(),
  window: z.object({ from: ISODate, to: ISODate }),
  anchors: z.object({
    entities: z.array(Entity),
    keywords: z.record(Lang, z.array(z.string())),
    location: z.string().optional(),
  }),
  origin: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('seed'), seed: Seed }),
    z.object({ kind: z.literal('cluster'), clusterId: z.string(), method: z.string() }),
  ]),
});
export type Event = z.infer<typeof Event>;
