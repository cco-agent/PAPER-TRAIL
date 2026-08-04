# PAPER TRAIL Guardian — Submission Package

> KeeperHub Agents Onchain (DoraHacks) — final submission text, ready to paste.
> Status: **DRAFT** — real Sepolia tx + demo video pending (blocked on `kh_` API key).
> Deadline: **2026-08-13 10:00 UTC**.

---

## Project name

**PAPER TRAIL Guardian** — a payment-gated, policy-hardened agent that executes on-chain actions through KeeperHub.

## One-liner

An autonomous agent that only spends when you've paid it, only moves what policy allows, and proves every action in an audit log — with KeeperHub as its on-chain execution layer.

## Description

PAPER TRAIL Guardian is the infrastructure behind **PAPER TRAIL**, a 3-lane card battle game (The Headline / The Media / The Underground) on Solana. The game's economy runs on 77,777,777 $PAPERTRAIL, 5-second volatility swings, and a 3-minute tug-of-war — but the agent that operates it follows a stricter rulebook than the players.

The agent is built around a hardened decision loop:

```
observe → decide → policy → execute → audit
```

- **observe** — event sources (RPC logs, snapshots, or a deterministic test feed)
- **decide** — threshold rules (`lt` / `lte` / `gt` / `gte`), BigInt-exact wei math, per-rule cooldowns
- **policy** — kill-switch, allowlist, max-amount caps, cooldown enforcement
- **execute** — routed through **KeeperHub**: `execute_transfer`, `execute_check_and_execute`, `execute_contract_call`, with `simulate` support and `get_direct_execution_status` polling
- **audit** — every run is recorded; every rejection is recorded too

Two zero-custody surfaces ship with it:

1. **x402 paywall** — a paid endpoint that returns HTTP 402 + paywall headers until a valid proof is presented, then runs the agent *exactly once* and returns the audit record as the paid payload. No proof, no execution, no free rides.
2. **Web UI** — a zero-dependency demo dashboard (`node:http` only) with the paywall flow, payment gate, and game-state oracle.

## How it uses KeeperHub

- **Execution layer**: all on-chain writes are KeeperHub calls (`execute_transfer`, `execute_check_and_execute`, `execute_contract_call`), never raw private-key signing.
- **Zero-custody design**: KeeperHub's managed (Turnkey-backed) wallet signs; gas is sponsored on Sepolia — no key management, no pre-funded wallet required for testnet.
- **Polling**: execution results are fetched via `get_direct_execution_status` (`execution_id`, snake_case), normalized into a single internal shape (`execution_id` / `transactionHash` / `transaction_hash`).
- **Simulate-first**: the official quickstart pattern (`simulate: true` dry-run before live execution) is a first-class flag.

## Quickstart (zero install)

Requires Node v22.6+ (native TypeScript type-stripping, no npm install, zero dependencies):

```bash
# full test suite
node --experimental-strip-types --test src/*.test.ts

# demo: run the agent once against a deterministic snapshot
node --experimental-strip-types src/cli.ts run

# demo: threshold guardian loop (static observer)
node --experimental-strip-types src/cli.ts watch

# demo: event responder with synthetic ERC-20 Transfer logs
node --experimental-strip-types src/cli.ts respond

# demo: x402 paywall — unpaid call → 402, paid call → audit record
node --experimental-strip-types src/cli.ts pay

# demo: web UI
node --experimental-strip-types src/cli.ts web
```

Set `KEEPERHUB_API_KEY=kh_...` to switch from the in-memory mock transport to the real KeeperHub MCP endpoint (`https://app.keeperhub.com/mcp`). Without a key the client refuses to construct a silent mock — it fails loudly instead.

## Test matrix (verified 2026-08-04, Node v22.23.1)

**56/56 PASS** across the agent package:

| Module | Tests | Covers |
|---|---|---|
| agent-core | 10 | decide (top-up/noop/sweep), policy (kill-switch/allowlist/max-amount/cooldown), full cycle + audit, policy rejection |
| keeperhub-client | 9 | real transport refusal without key, execute + poll, mock determinism, adapter |
| guardian | 10 | threshold math, invalid wei rejection, cooldown, huge wei exactness, loop + clean stop |
| events | 7 | dedup keys, ERC-20 Transfer decode, cursor advance, error resilience |
| x402 | 11 | 402 paywall, exactly-once paid run, overpay accepted, underpay/bad proof → 402 + zero free runs |
| webui | 9 | routes, paywall JSON, paid run → 200 + audit, header case-insensitivity |

Bonus (PAPER TRAIL game engine, same zero-dep approach): **60/60 PASS** — match engine, ELO, 77-card GENESIS deck loader, bot simulator (4 strategies), browser UI.

## Submission checklist

- [x] Public GitHub repository with source + tests
- [x] Design docs (`design.md`), checklist (`checklist.md`), README
- [x] KeeperHub execution client (real transport, key-gated)
- [x] x402 payment-gated endpoint
- [x] Web UI demo (zero-dependency)
- [ ] **Real on-chain tx via KeeperHub** (Sepolia, `execute_contract_call` or `simulate` transfer) — blocked on `kh_` API key
- [ ] Explorer link for the above
- [ ] Demo video

## Links

- Repository: https://github.com/cco-agent/PAPER-TRAIL
- Design: [`docs/keeperhub-agents-onchain/design.md`](design.md)
- Checklist: [`docs/keeperhub-agents-onchain/checklist.md`](checklist.md)
- Game engine (bonus): [`game/`](../../game/README.md)
- GENESIS 77 cards (77 cNFT metadata): [`genesis77/cards/`](../../genesis77/cards/)

---

*Honest note: everything except the live transaction is verified. The moment a `kh_` key lands, the remaining three checklist items close in one sitting — the client, simulate flag, and polling are already built and tested.*
