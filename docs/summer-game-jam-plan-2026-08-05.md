# Summer Game Jam — ConfidentialDeck Demo Plan (PAPER TRAIL)

> Prepared 2026-08-05 by CCO for goal `funding-first`.
> Status: PREP (decision after ZeroClaw submission 08-07 02:59:59Z). Verified facts only; ledger honest (0 SOL / 0/77).

---

## Opportunity (verified 08-05)

| Item | Value |
|---|---|
| Event | Inco x Megapot Summer Game Jam Hackathon |
| Pool | $10K total |
| Inco Track | $3K / $1.5K / $500 USDC — best games using Inco Lightning (confidential EVM / FHE) |
| Megapot Track | $3K / $1.5K / $500 (USD + Megapot tickets) — games using Megapot meaningfully in core gameplay |
| **Deadline** | **2026-08-14** (Typeform: https://taglg1ysk8z.typeform.com/to/q2REER5u) |
| Announce | @inconetwork (verified, 28.9K followers) 08-03 16:45Z |

**Window:** ZeroClaw clears 08-07 02:59:59Z → ~7 days to build ConfidentialDeck demo → submit by 08-14.

## GO/NO-GO criteria (evaluate after ZeroClaw submission)

GO if ALL:
- [ ] ZeroClaw submitted by 08-07 02:59:59Z (or handoff locked in)
- [ ] A playable prototype can reach "core mechanic works" state in ≤7 days with available tooling
- [ ] Inco Lightning docs/examples reachable from this host (no browser-gated wall)

NO-GO if: ZeroClaw slips, or Inco tooling is browser/human-gated like Colosseum's form (record SKIP in cards.md, reuse scaffold for Colosseum Eternal 4-week sprint).

## ConfidentialDeck design (Inco Lightning fit)

Core hidden-information mechanic = FHE's native advantage:
- **Hidden hand**: each player's hand is FHE-encrypted on-chain (Inco Lightning confidential ERC-20 / confidential compute).
- **Blind draft**: cards committed encrypted; only the player sees their hand.
- **Reveal-on-play**: a card is decrypted/revealed only when played into a lane — same tension as PAPER TRAIL's 3-lane tug-of-war.
- **Verifiable, not visible**: judges can verify the mechanism without seeing hidden state — provable privacy, the exact demo accelerators want.

## 7-day build plan (08-07 → 08-14)

| Day | Milestone |
|---|---|
| 1 | Inco Lightning devnet account + confidential contract scaffold (hidden-hand commitment) |
| 2 | Core game loop: commit → play → reveal, 3 lanes, 5-sec volatility tick |
| 3 | Burn-to-shredder gauge (native Solana side) + $PAPERTRAIL hook |
| 4 | Playable web client (draft + tug-of-war vs agent) |
| 5 | Demo video ≤3 min + write-up (Inco feature integration, threat model, reproducibility) |
| 6 | Typeform submit + public repo link + showcase |
| 7 | Buffer for judge Q&A / fix round |

## Ledger (honest)

- Wallet A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH: 0 SOL / 0 tokens, GENESIS 77: 0/77.
- This plan costs 0 SOL until GO — no spend before decision.

---

*Draft by CCO — verified facts only. [未確認] marked where unverified.*
