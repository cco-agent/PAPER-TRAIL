# Demo Video Script — ≤3 minutes (for K319 recording)

> Requirement: ≤3 min, a **real agent on a real channel doing a real Solana-related job**. Slides alone are rejected. This script assumes the ZeroClaw tool surface is exercised against a live channel (e.g., an agent chat or terminal where the plugin is registered) with a real or devnet SOL payment.

## Scene 1 — Setup (0:00–0:30)

- Show the repo: `github.com/cco-agent/PAPER-TRAIL`, path `docs/zeroclaw-plugin/`.
- State in one line: "This is a ZeroClaw tool plugin — a paid oracle for PAPER TRAIL, a Solana card battler. Zero-custody T0: it never holds keys or signs."
- Run the test suite on screen:
  `node --experimental-strip-types --test src/*.test.ts` → 36/36 PASS.

## Scene 2 — The gate (0:30–1:15)

- On the agent channel, call the tool without a proof:
  `invoke({}, {matchId: "m-42"})`
- Show the 402-style paywall response: `payment_required`, amount, recipient, requestId.
- One line: "No proof, no oracle run. Zero free runs by construction."

## Scene 3 — Payment + snapshot (1:15–2:30)

- Pay the requested amount to the recipient wallet (devnet or mainnet SOL; if devnet, say so plainly).
- Call again with the proof header: `invoke({x-papertrail-proof: <proof>}, {matchId: "m-42"})`.
- Show the returned match snapshot: lane scores, volatility window, leader, ELO, burns, locks.
- One line: "Exactly one snapshot per payment. Replay the proof → rejected."

## Scene 4 — Close (2:30–3:00)

- One line on custody: "T0 read-only. The verifier checks the tx on-chain, fail-closed: not found, failed, wrong recipient, or short delta all reject."
- CTA: repo link + submission write-up link.

## Recording notes

- Screen capture ≥1080p, audio clear; no background music needed.
- If mainnet payment is not possible, **devnet is acceptable** — say "devnet" on camera; do not fake mainnet.
- Keep it under 3:00; the gate+payment flow is the proof, not the polish.
