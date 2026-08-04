# Shredder Sentinel — Design Spec

**Date:** 2026-08-04  
**Hackathon:** KeeperHub – Agents Onchain (DoraHacks)  
**Deadline:** 2026-08-13 12:00 UTC+2  
**Status:** Design drafted; implementation in progress

## 1. Goal

Build a **single TypeScript agent** that uses **KeeperHub as the onchain execution layer**, with one execution core and three entry modes:

1. **Guardian** — watch a wallet / position; act when thresholds are crossed
2. **Event responder** — watch protocol/contract events; decide and act
3. **Paid agent API** — other agents call an HTTP endpoint, pay via **x402/MPP**, then the same pipeline runs

Prizes are paid in stablecoins. Judging heavily weights **real onchain execution through KeeperHub** — no mock demos.

## 2. Hard requirements (from hackathon)

- KeeperHub is the onchain execution layer (mandatory)
- Working agent with **real transactions** (not mocks)
- Submission: public GitHub repo + demo video + link to a tx the agent executed via KeeperHub
- Open to solo/teams, 18+, OFAC-compliant jurisdictions

## 3. Architecture

```
Triggers                    Core                         KeeperHub
─────────                   ────                         ─────────
CLI / Web "Run now"   ─┐
Guardian loop         ─┼─►  Observe → Decide (LLM)   ─►  MCP tools
Event listener        ─┤        ↓                        (execute_transfer /
x402 paid HTTP        ─┘     Policy checks                execute_check_and_execute)
                              ↓
                           Audit log + UI feed
```

**Approach:** monolith agent (one service, three triggers). Not micro-agents, not workflow-only.

**Stack:**
- Custom **TypeScript** agent core (thin; no heavy multi-agent framework)
- Optional LLM for action choice + rationale among allowlisted options
- Thin **Next.js** web UI for demo
- **CLI** for run / watch / status / replay
- KeeperHub remote MCP: `https://app.keeperhub.com/mcp` (OAuth or `kh_` API key)

**Chains:**
- Primary build/test: **Sepolia**
- Optional demo bonus: **Ethereum mainnet** tx if KeeperHub gas sponsorship works
- Config supports other EVM chains later; not required for v1

## 4. Components

| Piece | Role |
|---|---|
| `agent-core` | Observe → Decide → Execute → Log. Shared by all modes. |
| `keeperhub-client` | MCP wrapper: auth, transfer, check-and-execute, poll execution status. |
| `guardian` | Schedule: read balances / health / thresholds → emit decision request. |
| `event-watcher` | Watch configured contract events → emit decision request. |
| `x402-gateway` | HTTP endpoint; enforce x402/MPP payment; then call agent-core. |
| `policy` | Hard limits before any tx: max amount, allowlist, cooldown, kill switch. |
| `cli` | `run`, `watch`, `status`, `replay`. |
| `web-ui` | Mode status, last decision, tx links, audit trail, Run now. |
| `config` | Chain, targets, protocol, thresholds, notify channels. |

## 5. Hero action & fallback

- **Hero:** real **transfer** via KeeperHub (`execute_transfer`) with check-and-execute for conditional flows.
- **Fallback:** `execute_check_and_execute` so a real tx ships even if protocol-level actions are unavailable in v1.

## 6. Data flow & decisions

### Observe
Wallet balances, optional position health, recent events, config thresholds.

### Decide
1. **Rules first** (deterministic): threshold crossed? action allowlisted? cooldown clear?
2. **LLM second** (optional): choose among allowed actions; produce a short rationale for UI/demo.
3. **Policy gate last:** max spend, recipient allowlist, chain allowlist, kill switch.

### Execute
`agent-core` → KeeperHub MCP → execution id → poll until tx hash → write audit record.

### Audit record (per run)
`trigger → observation snapshot → decision + rationale → policy result → execution id → tx hash → gas/outcome → timestamp`

### Failure handling
- Prefer validate/simulate before write when KeeperHub supports it
- Retry with backoff on transient gas/RPC failures
- Never blind-retry policy failures or hard reverts; surface in CLI + UI
- Kill switch disables all three modes

### x402 path
Same pipeline after payment settles. Unpaid requests return `402` + challenge and never execute.

## 7. Personas (same product)

| Persona | Mode |
|---|---|
| Solo DeFi user | Guardian on their wallet |
| Protocol / ops team | Event watcher on their contracts |
| Other agents | Paid x402 HTTP API |

All three are first-class; implementation ships the working tx path early (guardian + execute), then event + x402 on the same core.

## 8. Demo, testing & submission

### Must ship
1. Public GitHub repo (this doc lives inside `cco-agent/PAPER-TRAIL`)
2. Demo video: decide → KeeperHub execute → tx visible
3. Explorer link to a real tx executed via KeeperHub

### Demo script (~2 min)
1. UI shows guardian watching a Sepolia wallet
2. Threshold trigger or Run now
3. Decision + rationale appears
4. KeeperHub execution runs
5. Tx hash opens on explorer
6. Short cut: same core via event + x402

### Testing
- Unit: policy, decision parsing, audit shape
- Integration: MCP auth + Sepolia execute
- E2E: one happy path with real tx hash documented in README

## 9. Out of scope (v1)
- Multi-agent debate / heavy orchestration frameworks
- Many DeFi protocols (one transfer/check-and-execute path)
- Production-grade multi-tenant SaaS

## 10. Success criteria
- All three modes wired to the same execution core
- At least one mode produces a **real KeeperHub-backed tx** shown in video + README
- Policy + audit trail visible in UI
- Submission checklist complete before 2026-08-13

## 11. References
- Hackathon: https://dorahacks.io/hackathon/agents-onchain/detail
- Docs: https://docs.keeperhub.com/
- MCP: https://docs.keeperhub.com/ai-tools/mcp-server
- Agentic wallet / x402: https://docs.keeperhub.com/ai-tools/agentic-wallet
- Discord: https://discord.gg/keeperhub
