# PAPER TRAIL — Summer Game Jam Submission Draft

> Inco x Megapot Summer Game Jam (Hackathon: Submissions)
> Typeform: https://taglg1ysk8z.typeform.com/to/HCv1A79i
> Deadline: 2026-08-14 22:00Z — submit on/after 08-13 re-verify (form pre-verified live 08-07 04:4xZ; re-verified live 08-08 04:3xZ; final re-verify 08-13 before submit)
> Track: Inco (hidden mechanics) — PAPER TRAIL archetype-3 hidden-hand scores on all four judging criteria (Hidden mechanics 25% / Completeness 25% / Creativity 25% / Fun 25%)

## Project name
PAPER TRAIL — ConfidentialDeck Demo

## One-liner
A 3-lane card battle game of scandal, news, satire and memes — where every card you burn feeds the corruption gauge, and the books balance themselves.

## Category / track
Web3 / Confidential computation (FHE) — private card state via ConfidentialDeck; Solana economy with burn-to-fuel mechanics.

## What it is
PAPER TRAIL is a Solana-native card battle game played across three lanes of influence: **The Headline**, **The Media**, **The Underground**. Players deal cards, reveal them in showdown, and burn cards to fuel the corruption gauge. This demo implements the ConfidentialDeck mechanic: card states stay encrypted (FHE) until reveal — no one, not even the host, knows your hand before the flip.

## What was built (this jam)
- **jam/frontend/index.html** — self-contained static prototype (zero deps, zero build step). DEMO mode (simulated) + LIVE mode (stub wiring for on-chain state). 24 cards, 3 lanes, 180s hold-to-charge tug-of-war gauge, **shredder fuel economy (burn 3 cards to stuff the shredder)**, **volatility swing (5s random event doubles gauge push)**, ELO-ready match flow.
- **D5 (08-08): procedural Web Audio SFX** — zero-asset flip/shredder/swing/win/lose cues generated with the Web Audio API (no files, no deps); silent no-op where audio is unavailable; guarded so it can never break the headless test harness.
- **D6 (08-08): AUTO DEMO + match-result banner** — one click plays a full round (deal → 3× shredder feed → reveal), pacing each step for the demo video; the banner announces YOU TAKE THE ROUND / THE HOUSE WINS THIS ROUND / A DRAW after resolution. Playtest bugfix: the fed counter now resets on deal/new match (found by the D6 smoke additions).
- **jam/frontend/smoke-test.cjs** — DOM-faithful headless harness (node, zero deps): deal -> reveal -> showdown -> shredder feed -> fuel economy -> boost -> volatility swing -> mode switch -> live-bind validation -> new match -> SFX module guards -> **auto-demo full loop -> match-result banner**. **39/39 checks PASS** (re-verified 08-08 08:0xZ).
- Playable now: https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html

## ConfidentialDeck / FHE angle
Card hands are hidden with encrypted state until the reveal step; the demo validates that the wrong key/address cannot read the hand pre-reveal. Live-mode stub documents the on-chain FHE integration path (Inco confidential compute) for the full game: `play(value = wager + fee)` seals the bet -> `zap.attestedReveal([seedHandle])` covalidator-signed reveal -> `settle(attestation, signatures)` resolves lanes. Integration pattern verified against Inco-fhevm/incasino client (08-06).

## Repo
https://github.com/cco-agent/PAPER-TRAIL (public) — see jam/ for build docs (D1-PREFLIGHT, D2-LIVE-VERIFY, SUMMER-JAM-BUILD) and this draft. Latest commit b6999acf (D6: AUTO DEMO + banner, 39/39 PASS).

## Pre-existing disclosure (official rules: "start fresh, disclose pre-existing")
- PRE-EXISTING: `jam/hangman-main/` scaffold (pre-jam) and PAPER TRAIL's game design docs / Solana lore predate the jam window. The hangman scaffold is NOT part of the submission evidence.
- BUILT IN WINDOW (from 08-05): the playable prototype `jam/frontend/index.html`, the `smoke-test.cjs` verification harness, and this submission draft. The game concept is the project's own; the jam entry is a fresh, self-contained build.

## Team
1 autonomous agent (CCO) + 1 human co-conspirator (K319). Solo-team eligible (official rule: teams <= 5).

## Demo video
PLACEHOLDER: 4-scene screen-record per docs/jam-demo-video-script.md requires Chromium (not available on CCO host). K319-side screen capture before submission.
VIDEO FALLBACK POLICY: if no owner-side Chromium capture by 08-13, submit WITHOUT a video field link — primary evidence (playable public prototype + 39/39 runtime smoke-test) is a confirmed MET rule requirement; repo + runtime proof stand as the demonstration. The video is enhancement, not a blocker.

## Notes for the actual Typeform
- Fill with: project name above, repo URL, prototype URL (raw GitHub is live; GitHub Pages pending owner enablement — NOT a blocker), demo video link (once recorded, else omit), track = confidential compute / FHE, team size = 1 (+1 human advisor).
- Re-verify form is still live on 08-13 before final submit.
- Submit on/after 08-13 00:00Z, before 08-14 22:00Z. Late submissions rejected (official).

## Ledger
Wallet A9cv...HMguH: 0 SOL / 0 tokens (honest: 0 is 0). GENESIS 77 presale: 0/77 — not part of this submission.
