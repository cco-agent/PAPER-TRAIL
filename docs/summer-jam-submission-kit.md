# Summer Game Jam — Owner Submission Kit (handover 2026-08-10 ~19:1xZ)

> Purpose: everything K319 needs to close the Inco x Megapot Summer Game Jam
> submission. CCO-side is DONE; this kit covers the two owner-side steps
> (video capture + Typeform submit). Built 48h+ before the deadline on purpose —
> ZeroClaw taught us that lesson (hand over early or lose the lane).

> **UPDATE 2026-08-12 00:2xZ — 08-13 re-verify gate CLEARED a day early.**
> Typeform https://taglg1ysk8z.typeform.com/to/HCv1A79i fetched via HTTP:
> title "Summer Game Jam Hackathon: Submissions" — LIVE, no redirect, not stale.
> Demo evidence re-confirmed in repo (jam/frontend/index.html present).
> Submit window opens 08-13 00:00Z. Owner-side: capture video (or fallback) +
> submit any time in window. Nudge DM sent to K319 08-12.

> **UPDATE 2026-08-12 ~04:2xZ — Video gate CLOSED.** CCO's mp4 verified on host:
> 1,686,155 bytes (~1.6MB), valid MP4 (ISO 14496-12), H.264 1280x800, 85.48s —
> comfortably under Typeform's 50MB attach limit. No compression needed. The
> CCO-captured video is submission-valid as-is; recapture remains optional.

> **UPDATE 2026-08-12 ~05:0xZ — Q11 "Live prototype URL" LOCKED (browser-verified).**
> Chromium now runs on the CCO host, so the playable demo was load-tested for real:
> https://raw.githack.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html
> renders correctly (scoreboard, 03:00 tug-of-war timer, shredder fuel gauge,
> hand + encrypted House cards) and AUTO DEMO plays a full round end-to-end:
> "ROUND RESOLVED 3-0. YOU take the round." — all three lanes resolved, shredder
> fed 2× (fuel gauge), volatility swing logged (vol 92 doubles push), +1 POWER
> armed after shredder stuffed. Console clean (only favicon 404s). One-click
> githack interstitial ("Open the page") is acceptable for judges. Backup live
> surface: https://cco-agent.github.io/PAPER-TRAIL/ (marketing + GENESIS ledger,
> also verified live this tick). Use the githack URL as the Q11 answer.

## Hard facts (VERIFIED 08-06, re-verify 08-12 DONE)

- **Event**: Inco x Megapot Summer Game Jam — track: **Inco** ($3K / $1.5K / $500 USDC)
- **Deadline**: 2026-08-14 22:00Z (14 Aug 6:00pm EDT). Late = rejected. No mercy.
- **Submit**: Typeform https://taglg1ysk8z.typeform.com/to/HCv1A79i
  - ✅ RE-VERIFIED LIVE 08-12 00:2xZ (old link q2REER5u from the 08-03 tweet is STALE — HCv1A79i confirmed)
- **Requirement**: Inco privacy feature (ConfidentialDeck / fhEVM FHE) in the CORE loop + playable public prototype + demo video + public repo. Solo team = fine (≤5).

## Evidence set — DONE by CCO (no action needed)

| # | Evidence | Where |
|---|---|---|
| 1 | Playable static demo (ConfidentialDeck prototype) | https://raw.githack.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html (browser-verified LIVE + AUTO DEMO round resolved 3-0, 08-12) |
| 2 | Runtime proof — smoke-test harness | `jam/frontend/smoke-test.cjs`, 39/39 PASS (re-verified 08-10; expanded D5/D6 paths) |
| 3 | Contract source | `contracts/PaperTrailLanes.sol` + `ConfidentialDeck.sol` (kit-derived, audited FHE primitives) |
| 4 | Demo video (CCO-captured, submission-valid) | `jam-demo-1786395646689.mp4` — 85.48s, H.264 1280x800, 1.6MB (<50MB cap, verified 08-12), 7 scenes, vision-verified 08-10 (host-local at /opt/cco/data/videos/jam/; upload/attach at submit) |
| 5 | Video script (optional higher-fidelity recapture) | `docs/jam-demo-video-script.md` (7 scenes, <90s, with narration + judging-fit table) |
| 6 | Build plan / evidence ledger | `docs/summer-game-jam-build-plan.md` |

Repo: https://github.com/cco-agent/PAPER-TRAIL (public, judge-visible)

## Owner-side step 1 — Video capture (optional but HIGH value)

Chromium now runs on the CCO host (fixed 08-12), so capture can happen
CCO-side; your machine is still fine. Script is ready:
`docs/jam-demo-video-script.md` — it's execution, not discovery.

- Open `jam/frontend/index.html` (~1280x800) in Chrome/Edge/Firefox
- Record with OBS / QuickTime / Loom, 70-90s total, follow the 7 scenes
- Narration doubles as captions; or read it live
- Export MP4, H.264, **≤50MB** (Typeform limit)
- Repo link visible in outro or description
- **If capture is impossible**: fallback is allowed — submit repo + static screenshots + the script (policy documented in build plan). Do NOT let video block submission.
- NOTE: CCO's own captured mp4 (85.48s, 1.6MB, verified 08-12) is submission-valid — use it if your recapture doesn't happen.

## Owner-side step 2 — Typeform submit (window 08-13 00:00Z → 08-14 22:00Z)

Adapt these into the Typeform fields:

- **Game title**: PAPER TRAIL
- **One-liner**: A three-lane card-battle game about scandal, news & influence — with encrypted hands on Inco's confidential EVM.
- **Description (short)**: PAPER TRAIL is a 3-lane card battler (The Headline / The Media / The Underground) where players commit cards with FHE-encrypted values and the truth only decodes at showdown. Core loop: deal → reveal → lane resolution → 3-minute tug-of-war gauge; burn cards to feed the shredder. Built on Inco's ConfidentialDeck kit (archetype 3: hidden hand / shuffled deck), so the FHE primitives are audited and our lane rules sit on top. Solana main game unchanged; this prototype is EVM for the jam.
- **Links**: repo https://github.com/cco-agent/PAPER-TRAIL · live prototype https://raw.githack.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html (browser-verified, AUTO DEMO plays full round) · marketing https://cco-agent.github.io/PAPER-TRAIL/ · video [paste your MP4 URL or attach — CCO mp4 is 1.6MB, attachable]
- **Track**: Inco

## Judging fit (lead with the hidden-lane reveal)

| Criteria | Where we score |
|---|---|
| Hidden mechanics 25% | FHE commit + reveal at showdown = literal hidden hand (scene 2/3) |
| Completeness 25% | Full loop: deal/reveal/resolve/feed + LIVE-mode stub + smoke-test proof |
| Creativity 25% | Three-lane satire theme; shredder economy; corruption lore |
| Fun 25% | Tug-of-war tension, 5s volatility swings, score chase |

## Checklist

- [x] 08-12: re-verify Typeform URL (HCv1A79i) — DONE early, LIVE confirmed
- [x] 08-12: video gate verified — CCO mp4 = 1.6MB < 50MB cap, attachable as-is
- [x] 08-12: Q11 live prototype URL browser-verified (githack render + AUTO DEMO 3-0; GH Pages backup live)
- [ ] 08-14 before 22:00Z: video attached (CCO mp4 valid; recapture optional)
- [ ] 08-14 before 22:00Z: Typeform submitted, confirmation screenshot saved
- [ ] Post-submission: DM CCO the confirmation + screenshot for the ledger

## Ledger (honest, 08-12 ~05:0xZ)

- Wallet A9cv...HMguH: 0 SOL / 0 tokens (unchanged; GENESIS 77 = 0/77)
- CCO-side jam evidence: all present and verified (items 1-6 above; video gate closed 08-12; Q11 URL browser-verified 08-12)
- Typeform URL: LIVE (HCv1A79i, verified 08-12)
- Owner-side remaining: video attach (optional recapture) + Typeform submit (window 08-13 00:00Z → 08-14 22:00Z)
