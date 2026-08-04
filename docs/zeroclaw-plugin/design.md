# ZeroClaw Paid Oracle — design notes

## 1. Why this plugin

The ZeroClaw bounty (SuperteamEarn, total 5,000 USDG, winner announcement 2026-08-21) rewards Solana-native agent plugins. Applicant repos (20+) cluster around: solana-pay request builders, x402 payment wrappers, invoice tools, guardians, monitoring. Saturated territory.

This entry takes the **PAPER TRAIL game economy** as the product: a paid oracle that sells one game-state snapshot per payment. It reuses the already-tested x402 pattern from `docs/keeperhub-agents-onchain/src/x402.ts` (11 tests) and the zero-dependency Web UI approach, adapted to Solana:

- payer/recipient/mint are **base58 32-byte pubkeys** (not 0x hex)
- amounts are **base units** (lamports / SPL base units), decimal strings, BigInt math
- custody tier **T0** (read-only, no keys) — matches the ZeroClaw T0-T1 theme

## 2. Trust model

| Concern | Handling |
|---|---|
| Keys | None held. Core makes no network call, signs nothing. |
| Prompt injection | Worst case is a free 402 — the oracle never runs unpaid. |
| Payment verification | Injected `PaymentVerifier`. In-memory = tests/demo. Production = on-chain (RPC signature/balance check). |
| Replay | Out of scope for the scaffold: one proof = one run is enforced by the verifier contract, but true replay protection (nonce/consumed-request tracking) is a production concern for the on-chain verifier. |
| Data source | Injected `OracleDataSource`. The plugin is a delivery mechanism; the source (RPC watcher / game engine) is swappable. |

## 3. Why JS/TS self-hosted (not wasm)

ZeroClaw plugins are canonically wasm32-wasip2 WIT components (Rust). But the applicant pool includes multiple **JS/TS and Python self-hosted agent submissions** (shubham5080 JS / him09227 JS / Barmaley26 JS / augstentatious Python / ceciliagalvaoo JS — verified via public repos). The JS route keeps the submission zero-install (`node --experimental-strip-types`), consistent with the KeeperHub submission, and lets the payment-gate code be shared verbatim between the two entries.

## 4. Integration path to ZeroClaw

```text
ZeroClaw host
  └─ plugin: paper-trail-paid-oracle  (manifest.toml, capabilities=["tool"], permissions=[])
       └─ tool: paper-trail-oracle
            ├─ headers: x-papertrail-proof
            ├─ args: { matchId }
            ├─ PaidGate (payment-gate.ts)  -> 402 | paid
            └─ GameStateOracle (oracle.ts)  -> snapshot (paid only)
```

A real deployment swaps:

1. `StaticOracleDataSource` → live source (PAPER TRAIL match engine or RPC watcher)
2. `InMemoryPaymentVerifier` → on-chain verifier (Solana RPC: confirm `signature`, check amount & recipient)
3. manifest `permissions` only if a live source needs `http_client` (keep deny-by-default otherwise)

## 5. Honest blockers

- Listing-specific requirements (application flow, deadline, submission format) are **browser-required** — confirmation requested from K319 (co-conspirator).
- On-chain payment verification needs RPC credentials — not wired in the scaffold by design (no silent mocks, same rule as `KeeperHubMcpClient`).
- This is a **participation scaffold**, not a finished submission. Value: presence in the field + reusable payment-gate primitive for both bounties.
