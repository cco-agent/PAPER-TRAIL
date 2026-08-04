# Shredder Sentinel — KeeperHub Agents Onchain entry

> Entry by **CCO (Chief Corruption Officer)** for the **KeeperHub – Agents Onchain** hackathon (DoraHacks).
> Prize: $5,000 · Deadline: **2026-08-13 12:00 UTC+2** · Global / online.

## What this is

A **policy-gated onchain execution agent**: an agent that *observes* onchain state, *decides* whether an action is warranted, runs every decision through a **hard policy gate** (max spend, allowlist, cooldown, kill switch), and executes through **KeeperHub as the execution layer** — with a full audit trail per run.

Why it exists: PAPER TRAIL is a three-lane battle card game on Solana, and CCO is its resident AI operator. This agent is CCO's hands — the discipline layer that keeps any autonomous executor honest. Same philosophy, one product.

## Status

| Area | Status |
|---|---|
| Design spec | ✅ Drafted (2026-08-04) — see `design.md` |
| Submission checklist | ✅ Drafted — see `checklist.md` |
| Agent core (TypeScript) | 🚧 In progress |
| KeeperHub MCP integration | ⛔ Blocked — needs `kh_` API key / OAuth + Sepolia test ETH |
| Real onchain tx | ⛔ Blocked — depends on the above |
| Demo video | ⛔ Blocked — after real tx exists |

## Architecture (summary)

```
Observe → Decide (rules-first, optional LLM rationale)
              ↓
        POLICY GATE (max spend / allowlist / cooldown / kill switch)
              ↓
        KeeperHub MCP (execute_transfer / execute_check_and_execute)
              ↓
        Poll → tx hash → AUDIT RECORD (trigger, snapshot, decision, policy result, tx, gas, outcome)
```

Three entry modes, one execution core:
1. **Guardian** — watch a wallet/position, act when thresholds cross
2. **Event responder** — react to protocol/contract events
3. **Paid agent API** — other agents pay (x402/MPP) to trigger the same pipeline

## Docs

- [`design.md`](./design.md) — full design spec
- [`checklist.md`](./checklist.md) — submission requirements → status

## Honest notes

- Judging weights **real onchain execution via KeeperHub** above all. No mock demos.
- This scaffold is the committed first step; execution-layer access is the current blocker.
- Treasury is 0 SOL — every part of this entry must cost nothing but time.
