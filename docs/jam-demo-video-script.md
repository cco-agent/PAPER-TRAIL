# PAPER TRAIL — Summer Game Jam Demo Video Script

> Purpose: record a <90s screen-capture demo of the playable prototype
> (`jam/frontend/index.html`) for the Inco x Megapot Summer Game Jam submission
> (deadline 2026-08-14 22:00Z, Typeform re-verified 08-13).
> Captured OWNER-SIDE (host has no Chromium). CCO produced this script so D7
> is execution, not discovery.

## Setup (before recording)

1. Open `jam/frontend/index.html` in a desktop browser (Chrome/Edge/Firefox, window ~1280x800).
2. Use a screen recorder (OBS, macOS QuickTime, or Loom) capturing the full window.
3. Record narration live OR overlay subtitles later (script below doubles as captions).
4. Target total runtime: **70-90 seconds**. Trim per scene if needed.

## Scene 1 — Title card (0:00-0:07)

**Visual:** Header "PAPER TRAIL — ConfidentialDeck Demo" + tagline "CCO presents: the books balance themselves."

**Narration:**
"PAPER TRAIL is a three-lane card-battle game about scandal, news, and influence. This is the ConfidentialDeck prototype — built for the Inco Summer Game Jam on fully homomorphic encryption."

## Scene 2 — Three lanes + hidden hand (0:07-0:22)

**Visual:** Hover each lane title: THE HEADLINE / THE MEDIA / THE UNDERGROUND. Show the house hand face-down.

**Narration:**
"Three lanes: The Headline, The Media, and The Underground. You play cards face-down — committed in encrypted form on-chain. The house hand stays hidden until reveal. That's the core loop: FHE lets both sides commit without revealing, and the truth only comes out at showdown."

## Scene 3 — Deal + reveal (0:22-0:42)

**Visual:** Click DEAL. Show player hand rendered (POWER values). Click REVEAL. House cards flip. Winning lanes glow gold, losers dim.

**Narration:**
"Deal. Each card carries power in a lane. Now reveal — the encrypted cards decrypt at showdown, winner takes the lane. This is archetype three of the Inco game design playbook: a hidden hand over a shuffled confidential deck."

## Scene 4 — Tug-of-war gauge + timer (0:42-0:58)

**Visual:** Point at the tug-of-war gauge filling, the 03:00 countdown clock, and the score 0:0 -> updated after round.

**Narration:**
"Behind the cards is the tug-of-war: a three-minute gauge that swings with every resolved lane, and a 5-second volatility window where a single card can flip the whole board. Win two of three lanes and the gauge tips."

## Scene 5 — Shredder burn (0:58-1:10)

**Visual:** Trigger the shredder (feed counter increments). Log line appears.

**Narration:**
"And the shredder — burn cards to feed the gauge. In the full game, burn-to-fuel is the economy. In this prototype, it's the pressure valve. The books balance themselves."

## Scene 6 — LIVE mode + contracts (1:10-1:30)

**Visual:** Switch to LIVE mode; show the live panel with on-chain flow (play -> attestedReveal -> settle). Optionally cut to `PaperTrailLanes.sol` in the editor.

**Narration:**
"LIVE mode wires to the real Inco Lightning flow: play(value=wager+fee), then zap.attestedReveal, then settle with attestation and signatures. The contract — PaperTrailLanes — derives from Inco's ConfidentialDeck, so the FHE primitives are audited and the lane rules are ours."

## Scene 7 — Outro (1:30-1:40)

**Visual:** End on header + score.

**Narration:**
"PAPER TRAIL on confidential EVM. Hidden lanes, public chaos. Playable prototype and full source in the repo — link in the submission. CCO out."

## Post-production checklist

- [ ] Total runtime 70-90s
- [ ] Captions/subtitles match narration
- [ ] No cut-away longer than 2s
- [ ] Repo link visible in outro or description (https://github.com/cco-agent/PAPER-TRAIL)
- [ ] Export MP4 (H.264, <=50MB for Typeform)
- [ ] If capture impossible: fallback = repo + static screenshots + this script (documented in build plan)

## Judging fit (why this demo)

| Criteria (Inco track) | Coverage |
|---|---|
| Hidden mechanics (25%) | Scene 2/3: FHE commit + reveal at showdown |
| Completeness (25%) | Full loop: deal/reveal/resolve/feed + LIVE stub |
| Creativity (25%) | Three-lane satire theme; shredder economy |
| Fun (25%) | Tug-of-war tension; 5s volatility; score chase |
