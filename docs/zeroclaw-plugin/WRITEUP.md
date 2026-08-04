# ZeroClaw Submission Write-up — PAPER TRAIL Paid Oracle

> Supporting-material body for the ZeroClaw bounty (deadline 2026-08-07 02:59:59 UTC). Requirements mapping: purpose / audience / ZeroClaw features / custom code / custody tier / threat model / reproducible config / redacted secrets.

## Purpose

A payment-gated **game-state oracle**: external AI agents pay a small SOL fee (x402-style) and receive exactly one fresh PAPER TRAIL match snapshot — lane scores, the live 5-second volatility window, current leader, ELO, burns, and locks. It turns a playable card game into a **monetizable data product**: any agent that wants a real-time corruption-market read (scandal, sentiment, volatility) pays per query.

## Audience

- **Agent builders** who want live game-economy data in their decision loops (ELO as a market signal, lane weight as sentiment).
- **Traders / degens** who want a deterministic, replayable snapshot feed instead of scraping a website.
- **ZeroClaw plugin users** who need a safe example of a **paid** tool: how to gate a ZeroClaw tool behind real on-chain payment with fail-closed verification.

## ZeroClaw features used

- **Tool plugin surface** (`invoke(headers, args)` contract) — the plugin is a ZeroClaw tool.
- **Deny-by-default manifest** (`capabilities = ["tool"]`, `permissions = []`).
- **T0 custody model** — no keys, no signing; safe tier for a paid surface.

## Custom code

| File | What it does |
|---|---|
| `src/payment-gate.ts` | x402-style paywall + proof decode + base58 pubkey validation. No proof / bad proof → 402 `payment_required`. **Zero free runs.** |
| `src/solana-verifier.ts` | Solana JSON-RPC verification: tx exists, not failed, names the recipient, recipient lamport delta ≥ paywall. Fail-closed, replay-protected. SOL native (SPL documented as extension). |
| `src/oracle.ts` | Pure game-state queries over an injected data source. Never decides payment. |
| `src/plugin.ts` | ZeroClaw tool entry: runs the oracle exactly once per paid gate pass. |
| `manifest.toml` | Deny-by-default plugin manifest. |

## Custody tier

**T0 — Read-only / zero-custody.** No private keys, no session keys, no signing capability, no transaction submission. The only "money movement" is the client paying the recipient wallet directly; the plugin merely verifies that payment on-chain. Secrets held: none (optional RPC URL is config, not a secret).

## Threat model

| Threat | Mitigation |
|---|---|
| Prompt injection forcing free run | Gate checks proof before any oracle execution; invalid → `payment_required` (transcript: TRANSCRIPT.md) |
| Proof replay | Verified-signature replay set; one proof = one run |
| Fake/not-found tx | RPC verification, fail-closed on transport error |
| Underpayment / tampered amount | BigInt exact compare against paywall amount |
| SPL masquerade | SOL-native verifier rejects SPL claims honestly (documented extension) |
| Secret exfiltration | No secrets to exfiltrate; deny-by-default manifest |

## Reproducible config / SOPs

Zero-install, Node v22.6+ type-stripping, zero npm dependencies:

```bash
node --experimental-strip-types --test src/*.test.ts
# 36/36 PASS (payment-gate 11 + plugin 7 + solana-verifier 18)
```

SOP: client calls `invoke({}, {matchId})` → gets 402 + paywall → pays `amount` to `recipient` → calls `invoke({x-papertrail-proof}, {matchId})` → 200 + one snapshot. Production swaps `InMemoryPaymentVerifier` → `SolanaRpcPaymentVerifier` (needs an RPC URL; public RPC works).

## Redacted secrets

None. No keys, no tokens, no .env required. The only config is an optional public RPC URL. Replay-set persistence (across restarts) is a documented production concern, not shipped by default.

## Honest gaps (no overclaim)

- SPL token verification not implemented (SOL native only; `postTokenBalances` extension documented).
- Live mainnet RPC not exercised in CI (tests use mock `rpcCall`; a public RPC URL works unchanged).
- Replay set is in-memory (production: Redis/SQLite).
- Demo video, Discord showcase post, and the Superteam form are human/browser steps (see SUBMISSION.md handoff checklist).
