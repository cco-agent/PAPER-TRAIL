# ZeroClaw Bounty — K319 Copy-Paste Kit

> Pre-drafted 2026-08-05 so the **2026-08-07 02:59:59 UTC** deadline is a ~30-minute job, not a research job.
> Deadline in local terms: 2026-08-06 23:59 BRT / 2026-08-07 11:59 JST.

## Step 0 — What you need before starting (~5 min)

1. **Demo video ≤3:00**, recorded per `VIDEO-SCRIPT.md` (real agent on a real channel, one real paid Solana query → match snapshot). **Devnet is acceptable — say "devnet" on camera; never fake mainnet.** Upload (unlisted YouTube / Streamable) and copy the link.
2. GitHub repo (public, ready): `https://github.com/cco-agent/PAPER-TRAIL` — everything lives under `docs/zeroclaw-plugin/`.
3. ZeroClaw Discord access → channel `#solana-bounty`.
4. Superteam form: `https://superteam.fun/earn/listing/zeroclaw`

## Step 1 — Discord `#solana-bounty` showcase post (copy-paste)

```
[PAPER TRAIL Paid Oracle — ZeroClaw plugin, T0 zero-custody]

A payment-gated game-state oracle for PAPER TRAIL, a 3-lane Solana card battler (77 GENESIS cards, 5-sec volatility, 3-min tug-of-war). External agents pay SOL (x402-style proof) and receive exactly one match snapshot per payment: lane scores, volatility window, leader, ELO, burns, locks.

Why not another payment clone: it monetizes real game state — the oracle is the game's price feed, not a payment wrapper.

- Custody: T0 read-only. No keys, no signing, deny-by-default.
- Safety: fail-closed on-chain verification (tx not found / failed / wrong recipient / short delta all reject), replay-protected (one proof = one run), prompt-injection resistant — 36/36 tests, transcript in repo.
- Reproducible: zero-install Node 22, `node --experimental-strip-types --test src/*.test.ts` → 36/36 PASS.
- Repo: https://github.com/cco-agent/PAPER-TRAIL (docs/zeroclaw-plugin/)
- Write-up: https://github.com/cco-agent/PAPER-TRAIL/blob/main/docs/zeroclaw-plugin/WRITEUP.md
- Demo: [VIDEO LINK]

Honest note: demo uses devnet SOL; the on-chain verifier is unit-tested against a mocked RPC and designed for public RPC URLs.
```

## Step 2 — Superteam form (`superteam.fun/earn/listing/zeroclaw`)

| Field | Value |
|---|---|
| Project name | PAPER TRAIL Paid Oracle |
| One-liner | Payment-gated game-state oracle for a Solana card battler — T0 zero-custody ZeroClaw plugin, fail-closed and replay-protected. |
| Description | [paste the Discord body from Step 1] |
| Demo video link (required) | [your video link] |
| Supporting material link (required) | https://github.com/cco-agent/PAPER-TRAIL |
| One-pager (optional) | https://github.com/cco-agent/PAPER-TRAIL/blob/main/docs/zeroclaw-plugin/design.md |

## Step 3 — Final checklist (in order, before deadline)

- [ ] Video recorded ≤3:00 and uploaded (devnet stated plainly if used)
- [ ] Discord `#solana-bounty` showcase post submitted (Step 1)
- [ ] Superteam form submitted (Step 2)
- [ ] **Do NOT open any ZeroClaw registry PR** (official rule — some applicant READMEs are wrong about this)

> Deadline: **2026-08-07 02:59:59 UTC**. Do not wait for the last hour — if the form or Discord post errors, you still need time to recover.
