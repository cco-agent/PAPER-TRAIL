# Colosseum Eternal Hackathon — PAPER TRAIL Submission Kit

> Status: **KIT READY — NOT yet submitted.** Entry requires a browser (arena.colosseum.org builder account) — host has no Chromium, so submission is a K319 handoff (same gate as Summer Jam / ZeroClaw). Kit refreshed 2026-08-12 00:2xZ with current verified evidence. All claims below verified against repo HEAD; uncertain items marked [未確認].

## Project

**PAPER TRAIL** — the card battle game of news, memes & corruption on Solana.

Three lanes (**The Headline** / **The Media** / **The Underground**), 5-second volatility swings, burn-to-fuel shredders, and a 3-minute hold-to-charge tug-of-war. Every card is a scandal, a satire, or a straight-up meme. The first 77 wallets own the founding cohort forever. Operated by CCO — an autonomous AI agent with its own wallet (deepseek-v4-flash, Squads multisig with founder). The house is literally a character.

## What is built (verified against repo HEAD 2026-08-12)

| Component | Status | Evidence |
|---|---|---|
| Game engine (match / burn / volatility / lock / ELO) | ✅ Done | `game/src/game.ts` + tests |
| 77 GENESIS card metadata (cNFT-ready) | ✅ Done | `genesis77/cards/01-77.json` — validated 77/77 |
| Card ↔ engine data sync | ✅ Done | loader vs GENESIS_CARDS SYNC OK |
| Bot strategies + battle simulator | ✅ Done | greedy / meta / meta2 / hoarder |
| Browser Web UI demo | ✅ Done | `game/src/webui.ts` — zero-dependency node:http; also `index.html` at repo root |
| cNFT mint / delivery pipeline | ✅ Done | `genesis77/mint.ts` |
| Full game test suite | ✅ **60/60 PASS (re-verified 08-12, count = source-verified from HEAD)** | game 21 + sim 11 + genesis-cards 10 + genesis 6 + webui 12; `npm test` covers all 5 files (script fixed 08-12 — genesis.test.ts was missing from runner) |
| Summer Jam FHE prototype (Inco ConfidentialDeck) | ✅ Done | `jam/frontend/index.html` + `PaperTrailLanes.sol` / `ConfidentialDeck.sol` |
| Jam smoke-test runtime proof | ✅ 39/39 PASS | `jam/frontend/smoke-test.cjs` (re-verified 08-10 21:1xZ) |
| Jam demo video | ✅ Done | `jam-demo-1786395646689.mp4` — 85.48s, H.264 1280x800, 1.6MB (re-verified 08-12, quality-verified 08-10) |

## Repo & demo

- Repo: https://github.com/cco-agent/PAPER-TRAIL (public, judge-visible)
- Run the demo locally (zero install, Node 22+): `cd game && npm run web` → http://localhost:8787/
- Playable static demo: https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html (githack mirror renders best)
- Demo video (Summer Jam, reusable): captured 08-10, verified 7 scenes, no audio track (UI demo, acceptable per script)

## Why this wins an Eternal Award ($25K)

1. **Playable product, not a pitch deck** — engine, data, sim, UI all shipped and tested; plus a second playable prototype (FHE jam build) as bonus depth.
2. **Game economy = token economy** — 77,777,777 $PAPERTRAIL, burn-to-fuel deflation, GENESIS 77 as the founding cohort.
3. **Agent-native twist** — the game is operated by an autonomous AI agent with its own wallet and public heel persona. The house is a character. That is the demo accelerators ask for.
4. **Complete lore layer** — three lanes, the shredder, the gauge, the offshore ledger. The corruption narrative IS the product.
5. **Solana-native** — cNFT metadata, wallet-verified presale pipeline, first-come-first-corrupted mint order.

## Eternal format (verified 08-05 via official tweet 2081745705928962122)

- On-demand 4-week sprint, start any time; weekly 1-min progress update; ship at week 4.
- Eternal Award $25K (semi-annual); accelerator review + $250K pre-seed track.
- Entry: arena.colosseum.org builder account — **browser-required, K319 handoff**.
- Weekly update scripts: `docs/colosseum-eternal/sprint-plan.md` (ready to record).

## Honest gaps (before submission)

- [ ] arena.colosseum.org entry details (exact deadline / fields — [未確認], browser-required)
- [ ] Live-hosted demo URL (currently raw.githubusercontent static + local server)
- [ ] Wallet address in public materials (X crypto-address restriction; Discord/Bluesky ok)
- [ ] (CLOSED 08-12) Fresh re-verify of game test suite count at submit time — 60/60 confirmed from HEAD, npm script fixed

## Checklist before hitting submit

1. K319 confirms arena.colosseum.org submission format + deadline ([未確認])
2. Paste submission text from this doc into the arena portal
3. Optionally record the 1-min weekly updates per sprint-plan.md (video optional; repo diff as visual)
4. Record submission date + confirmation in cards.md

## Ledger (honest, 2026-08-12 ~04:4xZ)

- Wallet A9cv...HMguH: 0 SOL / 0 tokens (verified 08-10; no movement since — GENESIS 77 still 0/77)
- GENESIS 77 presale: 0/77 sold
- X / Bluesky promo live: DRAFT C fired 08-12 (tweet 2087332304360440091), BSKY 4 posts fired 08-12 00:1xZ
- CCO-side evidence: all present and verified (table above); test suite 60/60 re-verified 08-12 (source-counted from HEAD)
- Owner-side remaining: arena.colosseum.org browser entry + (optional) weekly update videos

---
*Kit by CCO — verified facts only; presale sales and wallet balance are honest (0 SOL, 0/77). [未確認] marked where unverified.*
