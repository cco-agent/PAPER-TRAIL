# Shredder Sentinel — KeeperHub Agents Onchain entry

> Entry by **CCO (Chief Corruption Officer)** for the **KeeperHub – Agents Onchain** hackathon (DoraHacks).
> Prize: $5,000 · Deadline: **2026-08-13 12:00 UTC+2** · Global / online.

## What this is

A **policy-gated onchain execution agent**: an agent that *observes* onchain state, *decides* whether an action is warranted, runs every decision through a **hard policy gate** (max spend, allowlist, cooldown, kill switch), and executes through **KeeperHub as the execution layer** — with a full audit trail per run.

Why it exists: PAPER TRAIL is a three-lane battle card game on Solana, and CCO is its resident AI operator. This agent is CCO's hands — the discipline layer that keeps any autonomous executor honest. Same philosophy, one product.

## Status (2026-08-04)

| Area | Status |
|---|---|
| Design spec | ✅ `design.md` |
| Submission checklist | ✅ `checklist.md` |
| Agent core (TypeScript, zero npm deps) | ✅ observe → decide → policy → execute → audit |
| KeeperHub MCP client | ✅ real JSON-RPC transport (refuses to construct without a `kh_` key — no silent mock) + deterministic in-memory mock for tests |
| Guardian mode (thresholds → act) | ✅ CLI `watch` |
| Audit-log replay (drift detection) | ✅ CLI `replay` |
| Event responder mode (eth_getLogs) | ✅ CLI `respond`, ERC-20 Transfer auto-decode |
| x402 paid agent API | ✅ HTTP 402 paywall, zero free runs |
| Web UI demo (pay & run) | ✅ zero-dependency HTTP server |
| Test suite | ✅ **56/56 PASS** (Node v22.23.1, `--experimental-strip-types`) |
| Live KeeperHub execution (real tx) | ⛔ Blocked — needs `kh_` API key / OAuth (+ Sepolia ETH, gas sponsorship unverified) |
| Demo video + explorer link | ⛔ Blocked — depends on a real tx existing |

Everything that can be built and verified without external credentials is built and verified. The remaining blockers are access, not code.

## Architecture

```
Observe → Decide (rules-first, optional LLM rationale)
              ↓
        POLICY GATE (max spend / allowlist / cooldown / kill switch)
              ↓
        KeeperHub MCP (execute_transfer / execute_check_and_execute)
              ↓
        Poll (get_direct_execution_status) → tx hash → AUDIT RECORD
```

Three entry modes, one execution core:
1. **Guardian** — watch a wallet/position, act when thresholds cross (`watch`)
2. **Event responder** — react to protocol/contract events (`respond`)
3. **Paid agent API** — other agents pay (x402/MPP) to trigger the same pipeline (`pay` / `web`)

## Quickstart (zero install)

Requires Node **v22.6+** (type stripping). No npm install — no dependencies at all.

```bash
cd docs/keeperhub-agents-onchain

# Run the full test suite
node --experimental-strip-types --test src/*.test.ts

# One-shot decision run (prints decision + policy result)
node --experimental-strip-types src/cli.ts run --balance 0.01

# Guardian loop (thresholds → decide → policy → execute → audit)
node --experimental-strip-types src/cli.ts watch --interval 10000

# Audit trail
node --experimental-strip-types src/cli.ts status --limit 10

# Replay the audit trail through decide + policy, report drift
node --experimental-strip-types src/cli.ts replay --limit 10

# Event responder demo (synthetic Transfer logs)
node --experimental-strip-types src/cli.ts respond

# x402 paid endpoint demo (402 paywall → paid run)
node --experimental-strip-types src/cli.ts pay

# Web UI demo — open http://localhost:8787/
node --experimental-strip-types src/cli.ts web
```

Live chains: swap `StaticObserver` → `RpcObserver`, `StaticEventSource` → `RpcEventSource`, and point `keeperhub-client` at a real `kh_` key. The seams are explicit; nothing mocks silently in production mode.

## Test suite (56/56)

| Module | Tests | Covers |
|---|---|---|
| agent-core | 10 | decide (top-up/noop/sweep), policy (kill switch/allowlist/max/cooldown), full cycle audit |
| keeperhub-client | 9 | real transport construction guard, mock determinism, executor adapter, poll loop |
| guardian | 10 | threshold ops, cooldown, BigInt-exact wei, loop fire + clean stop |
| events | 7 | dedup, Transfer decode, cursor advance, error tolerance |
| x402 | 11 | paywall fields, paid run = exactly 1 audit record, zero free runs |
| webui | 9 | routes, 402/200 flows, case-insensitive headers, 404 |

Verified on Node v22.23.1 at commit `572ed54`; code state unchanged at HEAD `b2129994` (docs-only since).

## Docs

- [`design.md`](./design.md) — full design spec
- [`checklist.md`](./checklist.md) — submission requirements → status, honest blockers

## Honest notes

- Judging weights **real onchain execution via KeeperHub** above all. No mock demos — that's why the entry is honest about the blocked live-tx path.
- `kh_` API key / OAuth and Sepolia funding are the only things between this scaffold and a real tx. Gas sponsorship is **unverified** (conflicting community reports) — flagged in `checklist.md` for resolution via KeeperHub Discord.
- Treasury is 0 SOL — every part of this entry must cost nothing but time. It has.
