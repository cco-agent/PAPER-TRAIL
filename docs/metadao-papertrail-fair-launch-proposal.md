# $PAPERTRAIL Fair-Launch Proposal (MetaDAO / Futardio)

> Status: **DRAFT — proposal for review. No funds move until this is approved via the appropriate channel.**
> Goal: `funding-first` | Task: `task-1785874629-56`
> Recorded by CCO — verified facts only, [未確認] marked where unverified. Ledger at draft time: 0 SOL, GENESIS 77 sold 0/77.

---

## 1. Thesis — why a fair launch, why MetaDAO

- **PAPER TRAIL** is a card battle game of news, memes & corruption on Solana: three lanes (The Headline / The Media / The Underground), 5-second volatility, 3-minute tug-of-war, burn-to-fuel shredders, 77,777,777 $PAPERTRAIL, ELO hell.
- **MetaDAO** (verified 2026-08-04) is a fundraising & governance platform on Solana built on **Futarchy** — prediction markets, not token-weighted votes, control treasury decisions. It runs **early fair token launches (high-float ICOs)** with performance-aligned insider unlocks. ~$25.6M raised across 8 ICOs in year one (Shoal Research); total past ~$39M (2026-08-04). **Futardio** is its fair-launch venue, live as of 2026-08-04.
- **Fit is thematic, not forced**: our game is literally headlines, volatility and market-driven outcomes. MetaDAO is governance as a market. An agent-run game economy is a strong demo of the "ownership coin" narrative MetaDAO has been pitching (2026-07-11).

## 2. Token design

| Parameter | Proposal | Notes |
|---|---|---|
| Name / Symbol | PAPER TRAIL / $PAPERTRAIL | Already defined in `token/PAPERTRAIL.json` |
| Supply | **77,777,777** (fixed) | Matches game lore & existing metadata. No inflation |
| Decimals | 6 | SPL convention for consumer tokens; final call at mint |
| Model | **Ownership coin** — high initial float, no VC pre-allocation | MetaDAO fair-launch standard |
| Burn sink | Shredder burns are **supply-defining** | In-game card burns remove tokens from circulation; feeds the gauge (game economy demand) |
| Mint authority | Revoked at TGE | Non-negotiable for a fair launch; prevents future dilution surprises |

## 3. Treasury split (proposal — subject to community/DAO decision)

> These are **starting numbers for discussion**, not commitments. The final split should itself be a decision-market question (Futarchy handles this well).

| Allocation | % | Purpose / Vesting |
|---|---|---|
| **Fair-launch float** | **60%** | Sold via MetaDAO/Futardio at TGE. High float = the launch itself sets the price |
| **GENESIS 77 presale holders** | **10%** | Early believers (0.1 SOL/card, 77 max). Cards become allocation receipts; claimable at TGE |
| **Game treasury (CCO + ops)** | **20%** | Performance-vested (see §4). Pays for burns, prizes, match rewards, future content |
| **Liquidity / partnership reserve** | **10%** | DEX seeding + strategic partnerships (Colosseum, Superteam, etc.) |

## 4. Unlock schedule

| Tranche | Cliff | Vesting | Notes |
|---|---|---|---|
| Fair-launch float | — | **100% at TGE** | This is the definition of "fair" — no unlock game on the public float |
| GENESIS 77 holders | — | 100% at TGE (claim) | Honoring the earliest capital |
| Game treasury | 6 months | **Linear over 24 months** | Aligned with shipping the game, not dumping |
| Insider / founder | 6 months | **Performance-aligned** (MetaDAO model) | Unlock gated on market-condition KPIs, not calendar alone |
| Liquidity reserve | — | 20% at TGE, rest over 12 months | Keeps the pair alive without a big overhang |

## 5. Decision-market parameters (Futarchy)

Candidates to put to the prediction market once listed (final list = DAO's call):

1. **"Will $PAPERTRAIL maintain > $1M market cap at 30 days post-listing?"** — treasury unlock gate.
2. **"Will the game hit 1,000 daily matches within 60 days of public launch?"** — content-budget gate.
3. **"Should the treasury split be revised?"** — meta-question; Futarchy's self-referential strength.

Suggested mechanics: continuous markets, yes/no binary with SOL collateral, minimum liquidity per market, no market-maker requirement from CCO side.

## 6. Risks & open questions

- **[未確認] MetaDAO submission mechanics** — metadao.fi is browser-required; cannot verify from this host. K319 assist candidate.
- **[未確認] Futardio listing criteria** — observed live (Clytheriq Chain ICO countdown, 2026-08-04) but application path unverified.
- **Sequencing**: GENESIS 77 presale (open now) vs token fair launch — must define mapping (card → allocation) before TGE so there is no double-claim.
- **Compliance**: fair-launch/high-float model not legally reviewed. Geo-restrictions may apply.
- **Execution autonomy**: per A6, wallet-side token operations are fully autonomous for CCO. But **this is a public launch — a commitment.** Plan first, execute later; treat the proposal as the plan.

## 7. Next steps

- [ ] Verify metadao.fi / Futardio submission mechanics (K319 assist — browser required)
- [ ] Run the treasury-split question through community input / DAO vote
- [ ] Draft the 1-page tokenomics summary for the listing application
- [ ] Define GENESIS 77 → allocation mapping in `genesis77/` (mint pipeline already exists)
- [ ] Launch decision: after proposal approval, not before

---

*Recorded by CCO — verified facts only, [未確認] marked where unverified. Wallet: 0 SOL / GENESIS 77: 0/77.*
