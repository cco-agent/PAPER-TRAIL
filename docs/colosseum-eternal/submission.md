# Colosseum Eternal Hackathon — PAPER TRAIL Submission Scaffold

> Status: **scaffold ready — NOT yet submitted.** Entry requires browser access (arena.colosseum.org); submission format details pending (K319 assist candidate). All claims below verified against repo HEAD as of 2026-08-04.

## Project

**PAPER TRAIL** — the card battle game of news, memes & corruption on Solana.

Three lanes (**The Headline** / **The Media** / **The Underground**), 5-second volatility swings, burn-to-fuel shredders, and a 3-minute hold-to-charge tug-of-war. Every card is a scandal, a satire, or a straight-up meme. The first 77 wallets own the founding cohort forever.

## What is built (verified)

| Component | Status | Evidence |
|---|---|---|
| Game engine (match / burn / volatility / lock / ELO) | ✅ Done | `game/src/game.ts` + 21 tests |
| 77 GENESIS card metadata (cNFT-ready) | ✅ Done | `genesis77/cards/01-77.json` — validated 77/77 |
| Card ↔ engine data sync | ✅ Done | loader vs GENESIS_CARDS SYNC OK (35/21/21 lanes) |
| Bot strategies + battle simulator | ✅ Done | greedy / meta / meta2 / hoarder — 11 tests |
| Browser Web UI demo | ✅ Done | `game/src/webui.ts` — zero-dependency node:http |
| cNFT mint / delivery pipeline | ✅ Done | `genesis77/mint.ts` — 8 tests |
| Full test suite | ✅ **60/60 PASS** | game 21 + sim 11 + genesis-cards 10 + genesis 6 + webui 12 |

## Repo & demo

- Repo: https://github.com/cco-agent/PAPER-TRAIL
- Run the demo locally (zero install, Node 22+): `cd game && npm run web` → http://localhost:8787/
- Card gallery + live match trace + bot series simulation, all in the browser.

## Why this wins an Eternal Award ($25K)

1. **Playable product, not a pitch deck** — engine, data, sim, and UI all shipped and tested.
2. **Game economy = token economy** — 77,777,777 $PAPERTRAIL, burn-to-fuel deflation, GENESIS 77 as the founding cohort.
3. **Complete lore layer** — the corruption narrative is the product (three lanes, the shredder, the gauge).
4. **Solana-native** — cNFT metadata, wallet-verified presale pipeline, first-come-first-corrupted mint order.

## Honest gaps (before submission)

- [ ] Live-hosted demo URL (currently local-only; hosting is infra-dependent)
- [ ] Demo video (needs a runnable/recordable environment)
- [ ] arena.colosseum.org entry details (deadline, submission format — browser-required, K319 assist candidate)
- [ ] Wallet address in public materials (X still under 7-day crypto-address restriction — Discord/Bluesky only for now)

## Checklist before hitting submit

1. K319 confirms arena.colosseum.org submission format + deadline
2. Live URL or demo video (or honest "run locally" instructions)
3. Paste submission text from this doc into the arena portal
4. Record submission date + tx/log in cards.md
