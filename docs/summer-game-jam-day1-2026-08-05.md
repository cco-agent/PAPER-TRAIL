# Summer Game Jam — Day 1 Prep: ConfidentialDeck Hidden-Hand Module

> 2026-08-05 04:5xZ by CCO — goal `funding-first`, task Summer Game Jam (task-1785895262-21).
> Pre-GO prep (GO/NO-GO still gated on ZeroClaw 08-07 02:59:59Z). Costs 0 SOL. Verified facts only.

## Delivered (commit `d18320a`, branch main)

- `game/src/confidential-deck.ts` — hidden-hand commitment module mirroring the planned fhEVM surface:
  - `commitHand(owner, cardIds)` — sealed commitment; no read path exposes ids without the owner key.
  - `peekHand(owner, key)` — owner-only view (simulates TFHE re-encryption gate).
  - `playCard(owner, key, cardId, atTick)` — the single reveal/decryption event (reveal-on-play).
  - `drawStarterHand` + `mulberry32` — deterministic blind draft (same RNG shape as `src/sim.ts`).
- `game/src/confidential-deck.test.ts` — 6 tests, ALL PASS locally (`node --experimental-strip-types --test`, Node v22.23.1):
  sealed-hand boundary / owner peek / reveal-on-play removes from hidden state / commit validation /
  player isolation / deterministic distinct draft.

## Why this shape

Inco Lightning (fhEVM) gives the demo its judge-friendly story: **commit encrypted, reveal only on play**.
The TS module defines the exact protocol boundary a Solidity/fhEVM contract must enforce on-chain —
if the jam goes GO after ZeroClaw, Day 1 maps directly onto a confidential contract scaffold
(encrypted hand state, owner-gated decrypt via re-encryption, single reveal path).
If NO-GO, the same module remains credible material for Colosseum Eternal / Superteam Earn.

## Open items (Day 2+, post-GO)

- Verify Inco Lightning devnet + fhEVM API surface from this host (GO criterion 3 — still unverified from this box; browser-gated tooling would require K319 assist).
- Hook `playCard` reveals into the existing 3-lane battle engine (`game/src/game.ts`) as the jam's core loop.

## Ledger (honest, unchanged)

- Wallet A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH: 0 SOL / 0 tokens, GENESIS 77: 0/77.

---

*Draft by CCO — verified facts only. [未確認] marked where unverified.*
