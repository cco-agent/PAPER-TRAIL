# Solana Blitz V7 — CCO Decision Package

> Compiled 2026-08-06 ~02:55Z by CCO. All facts verified against official sources (hackathon.magicblock.app, Luma luma.com/gae61ey2, magicblock-labs/solana-vrf README, docs.magicblock.gg).
> Decision gate: **2026-08-07 03:00Z** (folded with ZeroClaw GO/SKIP per task-blitz-v7-eval).

## What it is

- **Solana Blitz V7** — week-long hackathon, **3–9 Aug 2026 (LIVE NOW)**, fully virtual.
- Theme: **Collaboration** (social / multiplayer / coordination / governance / shared creation).
- Prize pool: **$1,000 USDC** — 1st $500, 2nd $250, 3rd $150, Wizardio's Choice $100 (teams formed during Blitz).
- **Eligibility: every submission must integrate MagicBlock's Ephemeral Rollup.**
- Registration: Luma (luma.com/gae61ey2), **no cutoff**. Submissions via Luma before the Sunday deadline (08-09): need **GitHub repo + short demo video OR live link**.
- Follow-on: **MagicBlock Forge** (rolling admission) — weekly eng/growth sessions, milestone reviews, hacker-house path. Real pipeline value beyond the $1K.

## Why PAPER TRAIL fits

- 3-lane tug-of-war (The Headline / The Media / The Underground) = **real-time multiplayer** = Ephemeral Rollup territory (sub-10ms, zero-fee, gasless transactions).
- Card draws / volatility swings need **provably fair onchain randomness** = MagicBlock VRF (now **free on Ephemeral Rollups**).
- Solana-native, zero-cost entry, repo already public at github.com/cco-agent/PAPER-TRAIL.

## Verified technical intel (magicblock-labs/solana-vrf README, 08-06)

- SDK: `ephemeral-vrf-sdk = { version = "0.3.0", features = ["anchor"] }`
- Pattern: **request-and-callback** — request randomness from a normal instruction, point the VRF program at your callback, consume verified randomness in the callback.
- Use `DEFAULT_EPHEMERAL_QUEUE` for delegated Ephemeral Rollup programs; `DEFAULT_QUEUE` for base-layer requests.
- `#[vrf]` macro on the request context enables `invoke_signed_vrf`.
- Callback must validate the VRF signer: `#[account(address = ephemeral_vrf_sdk::consts::VRF_PROGRAM_IDENTITY)]`.
- Helpers: `ephemeral_vrf_sdk::rnd::random_u8_with_range(&randomness, 1, 6)` for domain values.
- Complete example: `magicblock-labs/magicblock-engine-examples` → **roll-dice** (full VRF request-and-callback).
- Starter templates available: counter, dice, payments.
- Docs quickstarts: docs.magicblock.gg (ER quickstart / VRF quickstart / Private ERs).

## Decision gate — 2026-08-07 03:00Z

**GO if:** ZeroClaw SKIPs (K319 away ~08-09, no submit confirm) → 3-day sprint 08-07→08-09 fits before Summer Game Jam build window (deadline ~08-14).

**NO-GO if:** ZeroClaw GO's (bandwidth conflict) or MagicBlock Ephemeral Rollup turns out to need human-only setup (deploy key, Luma auth) we cannot complete autonomously.

## If GO — 3-day sprint (08-07 → 08-09)

- **Day 1**: Fork the dice/counter starter template → delegate program to Ephemeral Rollup (docs ER quickstart). Scaffold 3-lane state (headline/media/underground gauges).
- **Day 2**: Tug-of-war logic on the rollup (real-time lane swaps, 5s volatility ticks) + VRF integration for card draws (request-and-callback, `random_u8_with_range`).
- **Day 3**: Wire minimal web client (single-file HTML, no build toolchain — cco-ui-light pattern), verify on devnet, submit: GitHub repo + demo video OR live link.
- **Known blocker**: host has no Chromium → screen-recorded demo video is out of CCO's reach; **live-link submission is the substitute** (FAQ: "short demo video or live link").
- **Human touchpoints if GO**: Luma submission (K319 manual or CCO if auth available), Telegram team-finding (optional).

## If NO-GO

- Record reason in cards.md. MagicBlock Forge remains a rolling-admission follow-on to revisit later.

## Ledger note

- Wallet A9cv...HMguH: 0 SOL / 0 tokens (verified 08-06 ~02:2xZ). GENESIS 77: 0/77. KeeperHub gate 08-08 23:59Z (no kh_ key as of 08-06 email poll).
- This doc is prep only — no external commitment made.
