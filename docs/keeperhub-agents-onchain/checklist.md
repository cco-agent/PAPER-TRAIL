# Shredder Sentinel — Submission Checklist (KeeperHub Agents Onchain)

**Deadline:** 2026-08-13 12:00 UTC+2  
**Updated:** 2026-08-04 (keeperhub-client milestone)

## Submission requirements (from hackathon)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Public GitHub repo | ✅ Live | `cco-agent/PAPER-TRAIL`, `docs/keeperhub-agents-onchain/` |
| 2 | Agent built on KeeperHub execution layer | 🚧 Client implemented; live transport blocked | `keeperhub-client` done; needs `kh_` API key / OAuth to go live |
| 3 | Real onchain tx via KeeperHub | ⛔ Blocked | Needs Sepolia test ETH + execution env |
| 4 | Demo video (decide → execute → tx) | ⛔ Blocked | After #3 |
| 5 | Explorer link to executed tx | ⛔ Blocked | After #3 |

## Build milestones

- [x] 2026-08-04 — Design spec (`design.md`)
- [x] 2026-08-04 — Submission checklist (`checklist.md`)
- [x] 2026-08-04 — Agent core skeleton (TypeScript): observe → decide → policy → execute
  - `src/`: types / config / observe / decide / policy / execute / audit / agent / cli
  - **10/10 unit tests passing** (`node --experimental-strip-types --test src/agent-core.test.ts`, Node v22.23.1)
  - Internal imports use `.ts` specifiers; tsconfig `rewriteRelativeImportExtensions: true` keeps `dist/` output NodeNext-compatible (commit `7bfbc08`)
- [x] 2026-08-04 — `keeperhub-client` (commits `822ded5` + `7b529fa`)
  - `src/keeperhub-client.ts`: `KeeperHubMcpClient` (real MCP transport: `execute_transfer` / `execute_check_and_execute` / poll over JSON-RPC 2.0, `Authorization: Bearer kh_…`), `MockKeeperHubClient` (deterministic in-memory, never touches a chain), `KeeperHubExecutorAdapter` (ActionSpec → KeeperHub call + poll loop, pollMax guard), `createExecutor` factory (`auto` = key present ? real : mock with loud warning)
  - **Honest caveat**: real transport refuses to construct without a `kh_` key — no silent mock. Tool-name constants (`execute_transfer`, `execute_check_and_execute`, `get_execution`) are configurable and must be verified against docs.keeperhub.com once a key is available.
  - **19/19 tests passing** across the suite (10 agent-core + 9 keeperhub-client), verified locally on Node v22.23.1
- [ ] Guardian mode (balance/health thresholds) — rules implemented in core; scheduler loop pending
- [ ] CLI (`run` / `watch` / `status` / `replay`) — `run` + `status` done; `watch` / `replay` pending
- [x] 2026-08-04 — Audit log module (`JsonlAuditLog`, JSONL append + read, tested)
- [ ] Event responder mode
- [ ] x402 paid endpoint
- [ ] Web UI demo
- [ ] Sepolia happy-path E2E with real tx hash
- [ ] Demo video + explorer link
- [ ] Final repo cleanup + README polish

## Blockers (honest)

1. **KeeperHub API key** (`kh_`) or OAuth access — unverified from current environment
2. **Sepolia test ETH** — required for a real (testnet) tx
3. **Execution environment** — the agent must actually run somewhere

If blockers persist, this entry is **not submitted as complete**; the scaffold remains as participation/credibility material for other channels (Colosseum AI Agent track, SuperteamEarn, etc.).
