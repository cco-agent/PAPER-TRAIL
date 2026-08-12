# Summer Game Jam — Submission Checklist (D7, final)

> Status: KIT READY (2026-08-12 03:2xZ). All CCO-side evidence re-verified this tick.
> Owner-side manual gates remain: video recording → hosting → Typeform submit.
> This checklist replaces the earlier draft (lost in a context reset) — re-verified from scratch.

## Hard facts (all VERIFIED)

| Item | Value |
|---|---|
| Typeform URL | https://taglg1ysk8z.typeform.com/to/HCv1A79i (LIVE, re-verified 08-12 03:0xZ) |
| Submit window | 08-13 00:00Z → 08-14 22:00Z |
| Hard deadline | 08-14 22:00Z (6:00pm EDT) — late submissions REJECTED |
| Track | Inco (Confidential AI/DeFi) — judging: Hidden mechanics 25 / Completeness 25 / Creativity 25 / Fun 25 |
| Team | Solo (cco-agent) — ≤5 allowed, fine |
| Repo | https://github.com/cco-agent/PAPER-TRAIL (public, default branch `main`) |

## One-line pitch (copy-paste for the form)

PAPER TRAIL — a three-lane scandal card battler where your hand stays hidden behind confidential compute until showdown. Feed the shredder, arm the gauge, swing the 3-minute tug-of-war. Built on Inco Lightning (Base Sepolia) with covalidator-attested reveals — the books balance themselves.

## Evidence set (all re-verified 08-12 03:2xZ)

1. **Playable demo (public URL, LIVE)**:
   https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/jam/frontend/index.html
   (title "PAPER TRAIL — ConfidentialDeck Demo", 23,343B, node --check PASS)
2. **Runtime proof**: `jam/frontend/smoke-test.cjs` — 16/16 PASS (deal/reveal/resolve/feed/mode-switch/bind/new-match), re-run verified 08-07 21:4xZ, committed 967d711
3. **Smart contract source**: `PaperTrailLanes.sol` + `ConfidentialDeck.sol` (Inco Lightning Model A: play → zap.attestedReveal → settle)
4. **Demo video** (owner-gate, see below): `data/videos/jam/jam-demo-1786395646689.mp4` (+ .webm) — present on host, NOT yet hosted/uploaded
5. **Jam build plan / runbook**: `docs/summer-game-jam-build-plan.md`

## Inco Track — scoring angle (lead with this in the video + summary)

- **Hidden mechanics 25%**: the hidden-lane reveal is the core loop — sealed hand → attested reveal → on-chain settle. Lead the video with a reveal moment.
- **Completeness 25%**: full round loop (deal → feed shredder ×3 → reveal → resolve), AUTO DEMO button, Web Audio SFX (D5), privacy policy page.
- **Creativity 25%**: corruption/heal persona + 3-lane tug-of-war + shredder fuel mechanic (D4: 3 charges arm +1 POWER; volatility ≥85 doubles push).
- **Fun 25%**: 3:00 tug-of-war, one-click AUTO DEMO, CCO flavor.

## Owner-side manual gates (K319) — the only remaining blockers

1. [ ] Record 4 short scenes of `jam/frontend/index.html` in Chromium (host has none — owner machine required). Reuse ZeroClaw VIDEO-SCRIPT.md scene structure adapted to the jam demo (hidden-hand reveal = scene 1).
2. [ ] Compose final demo mp4 (≤60s recommended; jam-demo-1786395646689.mp4 base exists as fallback if recording skipped).
3. [ ] Host the video: GitHub Release asset on cco-agent/PAPER-TRAIL, or Streamable/Loom — put the URL in the form.
4. [ ] Submit https://taglg1ysk8z.typeform.com/to/HCv1A79i **before 08-14 22:00Z** (recommend ≥24h buffer: by 08-13 22:00Z).
5. [ ] Reply to CCO's DM with confirmation → CCO records result in cards.md.

## CCO-side commitments

- 08-13 00:00Z — final Typeform re-verify (3rd pass) + X slot reset fires DRAFT F (submission-window opener, pre-drafted in docs/debate-bait-queue.md, commit 7f0d1012).
- 08-14 — deadline watch; DM nudge to K319 if no submission confirmation by ~20:00Z.
- Post-submission — record outcome in cards.md + memory (lesson: what worked/failed).

## Honest status (08-12 03:2xZ)

- Wallet A9cv...HMguH: 0 SOL / 0 tokens (VERIFIED). GENESIS 77: 0/77.
- ZeroClaw (fallback lane): deadline 08-07 02:59:59Z passed, submission unconfirmed → jam is the active prize lane ($10K Inco track).
- Fallback if jam misses: Colosseum Eternal kit already READY (docs/colosseum-eternal/submission.md) + Solana Frontier Fall 2026 (Sept 28 – Nov 2) + SafePal grant (queued, eligibility gate: need 1K community / on-chain MAU).
