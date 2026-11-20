# @commonroot/core

**Same story, other side.** The engine behind Commonroot: give it one news event and it finds how outlets in different countries and languages covered it, separates the claims they share from the ones they contest, and describes each side's framing with a steelman and full provenance.

> Status: **0.1.0-alpha (M0, foundations).** Schemas, hashing, provenance, the stage runner and adapter interfaces are in place. Pipeline stages land in M1 to M3, so `compare()` currently fails with `StageNotImplementedError`.

## Principles

- **Stateless and isomorphic.** Runs on Node 20+, Cloudflare Workers and in browsers. Uses only `fetch` and Web Crypto; no filesystem or database driver.
- **Everything external is an adapter.** News sources, LLMs (small and large roles), embedder, fetcher, extractor, store and outlet registry are supplied by the caller. Bring your own keys, or run everything locally.
- **Link and summarise only.** Article text lives in memory for one run. It is never cached, never part of a `Comparison`, and `assertNoArticleText` catches copied runs in output.
- **Traceable.** Every id is a content hash; every stage records input/output hashes in `provenance`, and `describeMethod()` reports the stages, thresholds and prompts that actually ran.

## Usage (API shape)

```ts
import { createCommonroot, memoryStore } from '@commonroot/core';

const cr = createCommonroot({ sources, llm: { small, large }, embedder, fetcher, registry, store: memoryStore() });

const run = cr.compare({ kind: 'url', url: 'https://…' }, { countries: ['US', 'JP', 'CN', 'TW'] });
for await (const event of run.events) console.log(event);
const comparison = await run.result;
```

## Licence

Apache-2.0. The Commonroot web app is AGPL-3.0, and curated outlet data is CC BY 4.0. The name "Commonroot" is covered by [TRADEMARK.md](../../TRADEMARK.md).
