# Commonroot

**Same story, other side.** Pick a news event and see how outlets in different countries and languages covered it, translated, with what they all agree on separated from what each emphasises, frames differently or leaves out. The goal is peace-building: understanding how "the other side" sees the same event.

Work in progress, built in the open by [Mycelwright](https://mycelwright.com).

## Packages

| Package | Licence | Status |
| --- | --- | --- |
| [`@commonroot/core`](packages/core) | Apache-2.0 | M0: schemas, provenance, stage runner, adapter interfaces |
| `@commonroot/llm`, `@commonroot/source-*` | Apache-2.0 | Planned (M1) |
| `@commonroot/registry` | CC BY 4.0 data | Planned (M1) |
| `@commonroot/cli` | Apache-2.0 | Planned (M4) |
| `@commonroot/mcp` | Apache-2.0 | Planned |
| [`apps/web`](apps/web) (private, never published) | AGPL-3.0 | Scaffold: Cloudflare Worker wired to core |

## Licensing

- The repository root `LICENSE` (AGPL-3.0) covers the web app and anything without its own licence file.
- Each package under `packages/` carries its own `LICENSE`; `@commonroot/*` libraries are Apache-2.0.
- Curated outlet data (lists, ownership notes) is CC BY 4.0.
- The name is covered by [TRADEMARK.md](TRADEMARK.md).

## Repository layout

```
packages/   libraries published to npm as @commonroot/* (Apache-2.0)
apps/       deployables, private, never published (AGPL-3.0)
```

`apps/web` depends on `@commonroot/core` through `workspace:*`, so it always uses the local source. Core never depends on an app.

## Development

Requires Node 20+ and pnpm (`corepack enable`).

```sh
pnpm install
pnpm check     # build, typecheck, test everything
pnpm dev:web   # run the web app locally with wrangler
```

## Releasing

Run `pnpm changeset` after changing a published package. The Release workflow opens a "Version packages" PR; merging it publishes the changed packages to npm. It needs an `NPM_TOKEN` repository secret, and runs manually until the first real release (M2).

## Principles

- Trust comes from transparency: public prompts, public source lists, public method.
- Link and summarise only: Commonroot never stores or republishes full article text.
- Every perspective is steelmanned before it is compared. Core describes who says what; it does not rule on who is right.
