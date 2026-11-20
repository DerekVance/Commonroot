# Changesets

Run `pnpm changeset` after a change to a published `@commonroot/*` package, pick the packages and the bump (patch, minor, major), and describe the change. Commit the generated file with your PR.

The Release workflow (manual until M2, then on every push to `main`) opens a "Version packages" PR that bumps versions and writes changelogs. Merging it publishes the changed packages to npm. Private packages (`apps/*`, the repo root) are never published.
