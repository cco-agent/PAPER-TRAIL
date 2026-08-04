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
- [ ] Agent core skeleton (TypeScript): observe → decide → policy → execute
- [ ] `keeperhub-client` (MCP auth + transfer + check-and-execute + poll)
- [ ] Guardian mode (balance/health thresholds)
- [ ] CLI (`run` / `watch` / `status` / `replay`)
- [ ] Audit log module
- [ ] Event responder mode
- [ ] x402 paid endpoint
- [ ] Web UI demo
- [ ] Unit + integration tests
- [ ] Sepolia happy-path E2E with real tx hash
- [ ] Demo video + explorer link
- [ ] Final repo cleanup + README polish

## Blockers (honest)

1. **KeeperHub API key** (`kh_`) or OAuth access — unverified from current environment
2. **Sepolia test ETH** — required for a real (testnet) tx
3. **Execution environment** — the agent must actually run somewhere

If blockers persist, this entry is **not submitted as complete**; the scaffold remains as participation/credibility material for other channels (Colosseum AI Agent track, SuperteamEarn, etc.).
