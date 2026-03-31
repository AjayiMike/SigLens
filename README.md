# SigLens

SigLens is a WXT browser extension for EVM selector/signature workflows.

## Implemented v1 scope

- Selector lookup with provider fallback:
  - Primary: Sourcify 4byte API
  - Fallback: 4byte.directory API
- Signature hash tab:
  - Function signature -> selector
  - Event signature -> topic0 hash
- Interface parser tab:
  - Parse Solidity function declarations
  - Produce canonical signatures + selectors
  - Copy as plain text, CSV, and Markdown
- Decode tab:
  - Calldata selector extraction
  - Candidate signature resolution
  - Best-effort argument decode from selected signature
- Settings page:
  - Cache TTL (days)
  - Preferred provider order
  - Clear cache
  - Clear history
  - Explorer enhancement toggle
- Explorer enhancement content script:
  - Runs on Etherscan and Blockscout
  - Detects `0x????????` selectors in page text
  - Resolves signature candidates on hover
- Background-centered orchestration:
  - Typed message commands
  - Structured error responses
  - Lookup history persistence
  - Selector cache with TTL

## Quick start

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm zip
pnpm lint
pnpm typecheck
pnpm test
```

## Architecture

- `src/entrypoints/background.ts`: message handling + shared orchestration
- `src/entrypoints/popup/*`: Lookup, Hash, Interface UI
- `src/entrypoints/options/*`: settings UI
- `src/features/*`: hash/lookup/parser use-cases
- `src/infrastructure/*`: API clients, cache/history/storage, messaging
- `src/domain/*`: core types
- `src/test/*`: unit tests

## Notes

Selector lookup and calldata decode are public signature database best-effort flows, not verified ABI truth. Collisions are surfaced in the UI.
