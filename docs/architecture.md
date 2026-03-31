# Architecture

SigLens uses a layered extension architecture:

1. UI layer
- Popup entrypoint for Lookup/Hash/Interface.
- Options entrypoint for settings and maintenance actions.

2. Application layer
- Message command handlers in background.
- Lookup/hash/parse orchestration and history writes.

3. Domain layer
- Typed models for selector candidates, lookup results, parse results, settings, and history.

4. Infrastructure layer
- HTTP clients for Sourcify + 4byte.directory.
- Storage adapters for settings/cache/history.
- Hash utility (Keccak-256 via `viem`).

## Runtime flow (lookup)

1. Popup sends `LOOKUP_SELECTOR` command.
2. Background validates selector.
3. Cache is checked first.
4. Providers are queried in configured order.
5. Candidates are merged, deduped, ranked.
6. Result is cached with TTL and written to history.
7. Structured response returns to popup.
