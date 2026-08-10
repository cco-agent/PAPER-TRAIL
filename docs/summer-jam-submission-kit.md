# Summer Game Jam — Owner Submission Kit (handover 2026-08-10 ~19:1xZ)

> Purpose: everything K319 needs to close the Inco x Megapot Summer Game Jam
> submission. CCO-side is DONE; this kit covers the two owner-side steps
> (video capture + Typeform submit). Built 48h+ before the deadline on purpose —
> ZeroClaw taught us that lesson (hand over early or lose the lane).

## Hard facts (VERIFIED 08-06, re-verify 08-13)

- **Event**: Inco x Megapot Summer Game Jam — track: **Inco** ($3K / $1.5K / $500 USDC)
- **Deadline**: 2026-08-14 22:00Z (14 Aug 6:00pm EDT). Late = rejected. No mercy.
- **Submit**: Typeform https://taglg1ysk8z.typeform.com/to/HCv1A79i
  - ⚠️ RE-VERIFY this URL on 08-13 (old link q2REER5u from the 08-03 tweet is STALE)
- **Requirement**: Inco privacy feature (ConfidentialDeck / fhEVM FHE) in the CORE loop + playable public prototype + demo video + public repo. Solo team = fine (≤5).

## Evidence set — DONE by CCO (no action needed)

| # | Evidence | Where |
|---|---|---|
| 1 | Playable static demo (ConfidentialDeck prototype) | https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html (open in browser; githack mirror renders best) |
| 2 | Runtime proof — smoke-test harness | `jam/frontend/smoke-test.cjs`, 16/16 PASS (commit 967d711, re-verified 08-08) |
| 3 | Contract source | `contracts/PaperTrailLanes.sol` + `ConfidentialDeck.sol` (kit-derived, audited FHE primitives) |
| 4 | Demo video script | `docs/jam-demo-video-script.md` (7 scenes, <90s, with narration + judging-fit table) |
| 5 | Build plan / evidence ledger | `docs/summer-game-jam-build-plan.md` |

Repo: https://github.com/cco-agent/PAPER-TRAIL (public, judge-visible)

## Owner-side step 1 — Video capture (optional but HIGH value)

Host has no Chromium, so capture must happen on your machine. Script is ready:
`docs/jam-demo-video-script.md` — it's execution, not discovery.

- Open `jam/frontend/index.html` (~1280x800) in Chrome/Edge/Firefox
- Record with OBS / QuickTime / Loom, 70-90s total, follow the 7 scenes
- Narration doubles as captions; or read it live
- Export MP4, H.264, **≤50MB** (Typeform limit)
- Repo link visible in outro or description
- **If capture is impossible**: fallback is allowed — submit repo + static screenshots + the script (policy documented in build plan). Do NOT let video block submission.

## Owner-side step 2 — Typeform submit (before 08-14 22:00Z)

Adapt these into the Typeform fields:

- **Game title**: PAPER TRAIL
- **One-liner**: A three-lane card-battle game about scandal, news & influence — with encrypted hands on Inco's confidential EVM.
- **Description (short)**: PAPER TRAIL is a 3-lane card battler (The Headline / The Media / The Underground) where players commit cards with FHE-encrypted values and the truth only decodes at showdown. Core loop: deal → reveal → lane resolution → 3-minute tug-of-war gauge; burn cards to feed the shredder. Built on Inco's ConfidentialDeck kit (archetype 3: hidden hand / shuffled deck), so the FHE primitives are audited and our lane rules sit on top. Solana main game unchanged; this prototype is EVM for the jam.
- **Links**: repo https://github.com/cco-agent/PAPER-TRAIL · demo https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html · video [paste your MP4 URL or attach]
- **Track**: Inco

## Judging fit (lead with the hidden-lane reveal)

| Criteria | Where we score |
|---|---|
| Hidden mechanics 25% | FHE commit + reveal at showdown = literal hidden hand (scene 2/3) |
| Completeness 25% | Full loop: deal/reveal/resolve/feed + LIVE-mode stub + smoke-test proof |
| Creativity 25% | Three-lane satire theme; shredder economy; corruption lore |
| Fun 25% | Tug-of-war tension, 5s volatility swings, score chase |

## Checklist

- [ ] 08-13: re-verify Typeform URL (HCv1A79i) — CCO will do this
- [ ] 08-14 before 22:00Z: video captured (or fallback chosen)
- [ ] 08-14 before 22:00Z: Typeform submitted, confirmation screenshot saved
- [ ] Post-submission: DM CCO the confirmation + screenshot for the ledger

## Ledger (honest, 08-10 19:1xZ)

- Wallet A9cv...HMguH: 0 SOL / 0 tokens (TOKEN_BALANCE_ACTION verified this cycle)
- GENESIS 77: 0/77 sold
- CCO-side jam evidence: all present and verified (items 1-5 above)
- Owner-side remaining: video capture + Typeform submit
