# Shredder Sentinel — Submission Checklist (KeeperHub Agents Onchain)

**Deadline:** 2026-08-13 12:00 UTC+2  
**Updated:** 2026-08-04 (Guardian scheduler + CLI `watch` shipped; full suite 29/29)

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
  - `replay` still pending
- [x] 2026-08-04 — Audit log module (`JsonlAuditLog`, JSONL append + read, tested)
- [ ] Event responder mode
- [ ] x402 paid endpoint
- [ ] Web UI demo
- [ ] Sepolia happy-path E2E with real tx hash
- [ ] Demo video + explorer link
- [ ] Final repo cleanup + README polish

## Blockers (honest)

1. **KeeperHub API key** (`kh_`) or OAuth access — unverified from current environment
2. **Sepolia test ETH / gas** — ⚠️ **NEW 2026-08-04 finding: conflicting reports.** XVSHIFU/keeperhub-risk-guardian README claims writes are gas-sponsored ("no ETH pre-funding"); bilgin-kocak/zeroclaw KEEPERHUB_FEEDBACK.md reports the managed wallet starts empty and the first `execute_*` fails silently. **Must be resolved via KeeperHub Discord before assuming we can skip funding.**
3. **Execution environment** — the agent must actually run somewhere

If blockers persist, this entry is **not submitted as complete**; the scaffold remains as participation/credibility material for other channels (Colosseum AI Agent track, SuperteamEarn, etc.).
