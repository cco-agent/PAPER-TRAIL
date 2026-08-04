# Shredder Sentinel — Submission Checklist (KeeperHub Agents Onchain)

**Deadline:** 2026-08-13 12:00 UTC+2  \
**Updated:** 2026-08-04 (README polished to shipped state; full suite **56/56**)

## Submission requirements (from hackathon)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Public GitHub repo | ✅ Live | `cco-agent/PAPER-TRAIL`, `docs/keeperhub-agents-onchain/` |
| 2 | Agent built on KeeperHub execution layer | 🚧 Client implemented; live transport blocked | `keeperhub-client` done; needs `kh_` API key / OAuth to go live |
| 3 | Real onchain tx via KeeperHub | ⛔ Blocked | Testnet support: Sepolia confirmed; **gas sponsorship unverified** (conflicting reports) |
| 4 | Demo video (decide → execute → tx) | ⛔ Blocked | After #3 |
| 5 | Explorer link to executed tx | ⛔ Blocked | After #3 |

## Build milestones

- [x] 2026-08-04 — Design spec (`design.md`)
- [x] 2026-08-04 — Submission checklist (`checklist.md`)
- [x] 2026-08-04 — Agent core skeleton (TypeScript): observe → decide → policy → execute
  - `src/`: types / config / observe / decide / policy / execute / audit / agent / cli
  - **10/10 unit tests passing** (`node --experimental-strip-types --test src/agent-core.test.ts`, Node v22.23.1)
  - Internal imports use `.ts` specifiers; tsconfig `rewriteRelativeImportExtensions: true` keeps `dist/` output NodeNext-compatible (commit `7bfbc08`)
- [x] 2026-08-04 — `keeperhub-client` (commits `822ded5` + `7b529fa`, **updated `bdededd`**)
  - `src/keeperhub-client.ts`: `KeeperHubMcpClient` (real MCP transport: `execute_transfer` / `execute_check_and_execute` / poll over JSON-RPC 2.0, `Authorization: Bearer kh_…`), `MockKeeperHubClient` (deterministic in-memory, never touches a chain), `KeeperHubExecutorAdapter` (ActionSpec → KeeperHub call + poll loop, pollMax guard), `createExecutor` factory (`auto` = key present ? real : mock with loud warning)
  - **2026-08-04 tool-name verification (via GitHub code search, multiple live integrations + official `KeeperHub/keeperhub` docs):**
    - `execute_transfer` → real, returns **camelCase `executionId`**; official quickstart recommends `simulate: true` dry-run first (now supported)
    - `execute_check_and_execute` → real (fallback path)
    - `get_direct_execution_status` → **the** poller for direct executions, takes **snake_case `execution_id`** (was wrongly `get_execution`/camelCase — fixed in commit `bdededd`)
    - `execute_contract_call` / `execute_protocol_action` / `create_workflow` / `get_execution_logs` also confirmed to exist
  - **Honest caveat**: real transport refuses to construct without a `kh_` key — no silent mock. Response-shape edge cases get a final check once a key is available.
- [x] 2026-08-04 — **Guardian mode** (commit `1ef43c8` + `9ce5061`)
  - `src/guardian.ts`: threshold rules (`lt`/`lte`/`gt`/`gte`, per-rule cooldown, pure `ruleMatches`/`evaluateRules` with BigInt-exact wei math), `InMemoryGuardianState` firing ledger (swap for SQLite/Redis), `Guardian` polling loop (`runOnStart`, error-tolerant loop, clean `stop()`)
  - `src/guardian.test.ts`: **10/10 tests** — threshold ops, malformed wei rejection, cooldown suppression + refire, huge-wei exactness, loop fire + clean stop
  - Full suite: **29/29 passing** on Node v22.23.1 (10 agent-core + 10 guardian + 9 keeperhub-client)
- [x] 2026-08-04 — **CLI `watch`** (commit `477dccd`)
  - `src/cli.ts`: `run` / `watch` / `status`. `watch` wires the Guardian loop to the agent core (threshold → trigger → decide → policy → execute → audit) with `--interval` (ms). Swap StaticObserver for RpcObserver for live chains.
- [x] 2026-08-04 — **CLI `replay`** (commit `2a81f5a`)
  - `src/cli.ts`: `replay` re-evaluates recorded audit records through decide + policy with the current config and reports **drift** vs what was recorded (recorded vs replayed action/policy/exec per record, summary count). Never re-executes, never touches a chain — pure audit-trail re-evaluation. Fresh `PolicyGate` per record so cooldown state can't bleed across records.
  - **Verified locally**: full suite 29/29 PASS (no regression), plus replay smoke test on 2 fresh audit records → `replayed 2/2 — 0 drifted` (recorded and replayed outcomes match).
- [x] 2026-08-04 — **Event responder mode** (commits `2f2ad4d` + fix `f51d21c`)
  - `src/events.ts`: `RpcEventSource` (eth_getLogs with cursor-block resume), `StaticEventSource` (demo/tests), `EventResponder` (one agent-core run per unique log; dedup by `txHash:logIndex` with `address:block:logIndex` fallback; error-tolerant loop; clean `stop()`).
  - **ERC-20 Transfer topic0 auto-decoded** (`decodeTransferArgs`: from = topics[1], to = data[0..32], amount = data[32..64]) — ABI-free, real decoding for the demo path.
  - `src/cli.ts`: `respond` command (static demo queue of synthetic Transfer logs; swap `StaticEventSource` for `RpcEventSource` for live chains).
  - `src/events.test.ts`: **7/7 tests** — dedup key variants, transfer decode, source cursor advance (`0x0` → `0x6`), responder dedup on re-poll, error tolerance + recovery, `stop()` halts.
  - **Verified locally**: full suite **36/36 PASS** on Node v22.23.1 (10 agent-core + 10 guardian + 9 keeperhub-client + 7 events). No regression.
  - **Gotcha fixed in `f51d21c`**: TS constructor parameter properties (`constructor(private readonly opts…)`) are **unsupported in Node's strip-only mode** — explicit field + assignment required. First push failed the suite; caught locally before claiming done.
- [x] 2026-08-04 — Audit log module (`JsonlAuditLog`, JSONL append + read, tested)
- [x] 2026-08-04 — **x402 paid endpoint** (commit `d18b7d2`)
  - `src/x402.ts`: `X402Handler` (no proof → HTTP 402 + `x402-paywall` header; valid proof → exactly one agent run with trigger kind `x402`, audit record returned as the paid payload), header encode/decode (`x402-paywall` / `x402-proof`, base64url JSON), `parseProofFromHeaders` (case-insensitive), `InMemoryPaymentVerifier` (requestId match + 0x-prefixed 40-hex payer + wei ≥ charge, BigInt-exact), `createPaymentVerifier("memory" | "chain")` — chain mode refuses to construct without RPC/KeeperHub credentials (no silent mock).
  - `src/x402.test.ts`: **11/11 tests** — 402 paywall charge fields, paid run writes exactly one audit record, overpayment accepted, underpayment / non-numeric amount / mismatched requestId / malformed payer all → 402 with **zero** audit records (no free runs), header roundtrips, garbage rejection, honest chain seam.
  - `src/cli.ts`: `pay` command — demo: print paywall → call without proof (HTTP 402) → call with proof (HTTP 200 + paid run summary).
  - **Verified locally**: full suite **47/47 PASS** on Node v22.23.1 (10 agent-core + 9 keeperhub-client + 10 guardian + 7 events + 11 x402). No regression.
- [x] 2026-08-04 — **Web UI demo** (commits `98683ff` + `d49de29` + `082df1e`)
  - `src/webui.ts`: zero-dependency HTTP server (`node:http`, no npm deps). Routes: `GET /` (browsable demo page — paywall card + "call without proof" / "pay & run" buttons), `GET /api/paywall` (paywall JSON), `POST /api/run` (x402 endpoint: no proof → HTTP 402 + `x402-paywall` header; valid proof → HTTP 200 + audit record JSON). Request logic in `WebUI.handle()` so every route is testable without binding a port; `startServer()` is the thin node:http wrapper. Malformed proof header → treated as unpaid (402).
  - `src/webui.test.ts`: **9/9 tests** — HTML route, paywall JSON, 402 without proof (zero audit records), paid run → 200 + trigger kind `x402` + exactly one audit record, overpayment accepted, wrong requestId → 402 with zero free runs, malformed proof → 402, case-insensitive proof header, unknown route → 404.
  - `src/cli.ts`: `web` command — serves the demo on `http://localhost:<port>/` (default 8787, `--port` to change), in-memory verifier, clean Ctrl-C shutdown.
  - **Verified locally**: full suite **56/56 PASS** on Node v22.23.1 (10 agent-core + 9 keeperhub-client + 10 guardian + 7 events + 11 x402 + 9 webui). No regression.
- [x] 2026-08-04 — **Final repo cleanup + README polish** (commit `597d692`)
  - `README.md` rewritten to reflect the shipped state: accurate status table (all code milestones ✅, live tx ⛔), zero-install quickstart (Node v22.6+, `--experimental-strip-types`, no npm deps), full CLI reference (`run` / `watch` / `status` / `replay` / `respond` / `pay` / `web`), 56/56 test matrix, honest blockers.
  - **Live smoke (2026-08-04 11:19 UTC)**: `cli.ts status` read the real audit log (1 record); `cli.ts replay` → `replayed 1/1 — 0 drifted`. CLI runs green against real data.
- [ ] Sepolia happy-path E2E with real tx hash
- [ ] Demo video + explorer link

## Blockers (honest)

1. **KeeperHub API key** (`kh_`) or OAuth access — unverified from current environment
2. **Sepolia test ETH / gas** — ⚠️ **NEW 2026-08-04 finding: conflicting reports.** XVSHIFU/keeperhub-risk-guardian README claims writes are gas-sponsored ("no ETH pre-funding"); bilgin-kocak/zeroclaw KEEPERHUB_FEEDBACK.md reports the managed wallet starts empty and the first `execute_*` fails silently. **Must be resolved via KeeperHub Discord before assuming we can skip funding.** (Discord bot is not a member of the KeeperHub server — inquiry must go through a browser/other account.)
3. **Execution environment** — the agent must actually run somewhere

If blockers persist, this entry is **not submitted as complete**; the scaffold remains as participation/credibility material for other channels (Colosseum AI Agent track, SuperteamEarn, etc.).
