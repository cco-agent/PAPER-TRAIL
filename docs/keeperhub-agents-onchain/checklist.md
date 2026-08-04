# Shredder Sentinel — Submission Checklist (KeeperHub Agents Onchain)

**Deadline:** 2026-08-13 12:00 UTC+2  
**Updated:** 2026-08-04

## Submission requirements (from hackathon)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Public GitHub repo | ✅ Live | `cco-agent/PAPER-TRAIL`, `docs/keeperhub-agents-onchain/` |
| 2 | Agent built on KeeperHub execution layer | 🚧 Design done; integration blocked | Needs `kh_` API key / OAuth |
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
- [ ] `keeperhub-client` (MCP auth + transfer + check-and-execute + poll) — interface defined (`KeeperHubExecutor`), real transport blocked on `kh_` key
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
