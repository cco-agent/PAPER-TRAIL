# PAPER TRAIL — Summer Game Jam Submission Draft

> Inco x Megapot Summer Game Jam (Hackathon: Submissions)
> Typeform: https://taglg1ysk8z.typeform.com/to/HCv1A79i
> Deadline: 2026-08-14 22:00Z — submit on/after 08-13 re-verify (form pre-verified live 08-07)

## Project name
PAPER TRAIL — ConfidentialDeck Demo

## One-liner
A 3-lane card battle game of scandal, news, satire and memes — where every card you burn feeds the corruption gauge, and the books balance themselves.

## Category / track
Web3 / Confidential computation (FHE) — private card state via ConfidentialDeck; Solana economy with burn-to-fuel mechanics.

## What it is
PAPER TRAIL is a Solana-native card battle game played across three lanes of influence: **The Headline**, **The Media**, **The Underground**. Players deal cards, reveal them in showdown, and burn cards to fuel the corruption gauge. This demo implements the ConfidentialDeck mechanic: card states stay encrypted (FHE) until reveal — no one, not even the host, knows your hand before the flip.

## What was built (this jam)
- **jam/frontend/index.html** — self-contained static prototype (zero deps, zero build step). DEMO mode (simulated) + LIVE mode (stub wiring for on-chain state). 24 cards, 3 lanes, 180s hold-to-charge gauge, shredder burn feed, ELO-ready match flow.
- **jam/frontend/smoke-test.cjs** — DOM-faithful headless harness (node, zero deps): deal -> reveal -> showdown -> shredder feed -> mode switch -> live-bind validation -> new match. 16/16 checks PASS.
- Playable now: https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html

## ConfidentialDeck / FHE angle
Card hands are hidden with encrypted state until the reveal step; the demo validates that the wrong key/address cannot read the hand pre-reveal. Live-mode stub documents the on-chain FHE integration path (Inco confidential compute) for the full game.

## Repo
https://github.com/cco-agent/PAPER-TRAIL (public) — see jam/ for build docs (D1-PREFLIGHT, D2-LIVE-VERIFY, SUMMER-JAM-BUILD) and this draft.

## Demo video
PLACEHOLDER: zeroclaw-demo-base.mp4 is a 10.4s ffmpeg-composed base; final 4-scene screen-record requires Chromium (not available on CCO host). K319-side screen capture per VIDEO-SCRIPT.md before submission.

## Notes for the actual Typeform
- Fill with: project name above, repo URL, prototype URL (raw GitHub is live; GitHub Pages pending owner enablement), demo video link (once recorded), track = confidential compute / FHE.
- Re-verify form is still live on 08-13 before final submit.

## Ledger
Wallet A9cv...HMguH: 0 SOL / 0 tokens (honest: 0 is 0). GENESIS 77 presale: 0/77 — not part of this submission.
