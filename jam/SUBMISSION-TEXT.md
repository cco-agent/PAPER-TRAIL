# PAPER TRAIL — Ready-to-Paste Typeform Answers (Summer Game Jam)

> Form: https://taglg1ysk8z.typeform.com/to/HCv1A79i (LIVE, re-verified 08-12)
> Window: submit on/after 08-13 00:00Z, before 08-14 22:00Z.
> Purpose: copy these blocks straight into the form. Re-check each link once before pasting.
> UPDATED 08-12 11:3xZ: Q14 demo video link LOCKED (catbox, verified 200/206 this cycle). All links re-verified live 08-12 11:3xZ.

## Project name
PAPER TRAIL — ConfidentialDeck Demo

## One-liner / short description
A Solana-native card battle game of scandal, news, satire and memes. Deal cards across three lanes of influence — The Headline, The Media, The Underground — burn 3 cards to stuff the shredder and fuel the corruption gauge, and ride 5-second volatility swings that double the push. Card hands stay FHE-encrypted (ConfidentialDeck) until reveal: no one, not even the host, reads your hand before the flip.

## Category / track
Web3 / Confidential computation (FHE) — Inco track. Hidden card state via ConfidentialDeck; Solana economy with burn-to-fuel shredder mechanics.

## What was built
Self-contained static prototype (zero deps, zero build step) + draw-aware headless verification harness:
- 3 lanes, 24 cards, 180s hold-to-charge tug-of-war gauge
- Shredder fuel economy (burn 3 cards to stuff the shredder)
- Volatility swing (5s random event doubles gauge push)
- Procedural Web Audio SFX (zero assets) + AUTO DEMO full-round playback
- smoke-test.cjs: 39/39 checks PASS, draw-aware, stable across repeated runs (re-verified 08-10/08-12)

## Links
- Playable prototype: https://raw.githack.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html
- Source mirror (raw): https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html
- Repo: https://github.com/cco-agent/PAPER-TRAIL
- Build + evidence docs: jam/D1-PREFLIGHT-20260806.md, jam/D2-LIVE-VERIFY.md, jam/D3-REVERIFY-20260810.md, jam/SUMMER-JAM-BUILD.md
- Runtime proof: jam/frontend/smoke-test.cjs (39/39, draw-aware)

## Demo video (Q14 — REQUIRED on form)
**https://files.catbox.moe/o3wgxz.mp4**
Public, anonymous, no expiry. CCO-captured: 85.48s, H.264 1280x800, ~1.6MB (<50MB Typeform cap), 7 scenes. Browser-verified HTTP 200 + 206 (video streaming) 08-12 11:3xZ. Paste this URL into the "Demo video link" field.

## Team size
1 autonomous agent (CCO) + 1 human co-conspirator (K319) as advisor. Solo-team eligible (rule: teams <= 5).

## Pre-existing disclosure (official rule: start fresh, disclose pre-existing)
PRE-EXISTING (pre-jam): jam/hangman-main/ scaffold and the PAPER TRAIL game concept docs / Solana lore. The hangman scaffold is NOT submission evidence.
BUILT IN WINDOW (from 08-05): jam/frontend/index.html (playable prototype), jam/frontend/smoke-test.cjs (39/39 harness), this submission text, and the D1-D3 evidence docs.

## Ledger
Wallet A9cv...HMguH: 0 SOL / 0 tokens (verified 08-12). GENESIS 77 presale: 0/77 — not part of this submission.
