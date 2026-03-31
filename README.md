# SigLens

SigLens is a browser extension for EVM selector/signature workflows.

It helps you quickly move between raw calldata/selectors and human-readable signatures without leaving your explorer or dev flow.

## What it does

- Lookup: `0xa9059cbb` -> candidate function signatures (with provider fallback + cache)
- Hash: `transfer(address,uint256)` -> selector, event signature -> topic hash
- Interface Parser: Solidity function declarations -> canonical signatures + selectors
- Decode (best effort): calldata + selected candidate signature -> decoded argument table
- Explorer Enhancement: hover raw selectors on explorer pages to resolve likely signatures

## Explorer support

Content script enhancements are currently enabled for:

- `etherscan.io` (+ common Etherscan-family explorers)
- `blockscout.com`

Use **Settings** to enable/disable explorer enhancement.

## Important accuracy note

Selector lookup and calldata decode are **best-effort** based on public signature databases (Sourcify 4byte + 4byte.directory).

- Results are candidates, not guaranteed verified ABI truth.
- Selector collisions are possible and surfaced in UI.

## Stack

- WXT
- React + TypeScript (strict)
- Zod validation
- Vitest tests

## Project structure

- `src/entrypoints/`
  - `background.ts` shared orchestration + messaging
  - `popup/` main UI
  - `options/` settings UI
  - `explorer-enhancer.content.ts` explorer page augmentation
- `src/features/` domain use-cases
- `src/infrastructure/` API/storage/cache/messaging
- `src/test/` unit tests

## Local development

### Requirements

- Node.js 20+
- pnpm 10+

### Install

```bash
pnpm install
```

### Run in dev mode

```bash
pnpm dev
```

### Build extension

```bash
pnpm build
```

Load unpacked from:

- `.output/chrome-mv3`

## Scripts

```bash
pnpm dev
pnpm build
pnpm zip
pnpm lint
pnpm typecheck
pnpm test
```

## Current milestone status

- Milestone 0: bootstrap/skeleton ✅
- Milestone 1: local hashing ✅
- Milestone 2: selector lookup + provider fallback + cache ✅
- Milestone 3: interface parser ✅
- Milestone 4: history + settings ✅
- Milestone 5: calldata decode (best effort) ✅
- Milestone 6: explorer enhancement (Etherscan + Blockscout) ✅

## Contributing

Issues and PRs are welcome.

When contributing:

- keep business logic out of React components
- keep APIs typed and validated
- run `pnpm lint && pnpm typecheck && pnpm test` before submitting

## Security and privacy

- No account required
- No analytics included by default
- Lookup/history data stored locally in extension storage

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
