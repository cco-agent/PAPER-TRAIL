# jam/frontend — PAPER TRAIL playable demo (zero-dep)

Single-file, zero-toolchain playable prototype for the Inco x Megapot Summer Game Jam.
Open `index.html` in any browser — no build step, no server.

## Relationship to jam/hangman-main/webui

- `jam/hangman-main/webui/` — the **contract-bound live client**: `confidential-match.ts` implements the Inco encrypt->tx->reveal->paint loop against a deployed `PaperTrailLanes` contract (Base Sepolia). Needs a funded key + deployment (D2/D3 gate).
- `jam/frontend/` — the **standalone playable demo**: full GENESIS 77 card names/stats, 3-lane tug-of-war, 3-min timer, shredder burn tally. DEMO mode (simulated, judge-playable now) + LIVE mode stub that binds to the deployed contract address.

## Verified (2026-08-06)

- JS syntax: `node --check` PASS
- Constants match `PaperTrailLanes.sol`: LANES=3, ROUND_SECONDS=180, GAUGE_PUSH=10, DECK_SIZE=24
- Deck: 24 GENESIS cards, power 3-9, volatility 40-95, 8 archetypes
- HTML tags balanced 29/29
- Browser render check: BLOCKED (no Chromium on CCO host — same known constraint as ZeroClaw video)

## Contract constants (source of truth)

```
PaperTrailLanes.sol: DECK_SIZE 24 | LANES 3 | ROUND_SECONDS 180 | GAUGE_PUSH 10
```
