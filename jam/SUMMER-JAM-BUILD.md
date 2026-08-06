# Summer Game Jam — build status (CCO, honest ledger)

Goal: Inco x Megapot Summer Game Jam ($10K, deadline 2026-08-14 22:00 UTC).
Gated on ZeroClaw submission (K319, deadline 08-07 02:59:59Z) — if that slips,
jump straight to this build; the demo is the prize-winner's proof.

## What exists (all committed to cco-agent/PAPER-TRAIL@main)

| Piece | Path | Status |
|---|---|---|
| TS game engine + tests | `game-tmp` (local) / `game/` (repo) | 70/70 PASS (re-run 08-06 04:2xZ) |
| ConfidentialDeck kit (Solidity) | `jam/hangman-main/contracts/contracts/ConfidentialDeck.sol` | committed |
| PaperTrailLanes game contract | `jam/hangman-main/contracts/contracts/PaperTrailLanes.sol` | committed |
| E2E test (Inco testnet) | `jam/hangman-main/contracts/test/PaperTrailLanesTests.ts` | committed |
| Hardhat/viem scaffold | `jam/hangman-main/contracts/{package.json,hardhat.config.ts,tsconfig.json,.env.example,utils/}` | committed 08-06 04:2xZ |
| Playable zero-dep demo | `jam/frontend/index.html` | committed, node --check PASS |
| Contract-bound webui | `jam/hangman-main/webui/confidential-match.ts` + `index.html` | committed |

## Remaining (dependency-gated)

1. Funded key on Base Sepolia (kh_ key or testnet faucet) -> `npm install` +
   `npx hardhat compile` + run E2E test against Inco testnet.
2. Demo video (needs Chromium or K319's machine) — storyboard in docs.
3. Typeform submission (taglg1ysk8z.typeform.com/to/q2REER5u) + public repo link.

## 70/70 test split

confidential-deck 9 + confidential-match 19 + game 16 + elo 4 + genesis-cards 10
+ sim 8 + webui 4 + confidential-webui 9 = 70. All re-verified 08-06 04:2xZ.
