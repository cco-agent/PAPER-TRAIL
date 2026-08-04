# ZeroClaw Plugin — PAPER TRAIL Paid Oracle

Payment-gated game-state oracle for [ZeroClaw](https://superteam.fun/earn/listing/zeroclaw), built from the existing `x402.ts` + Web UI work in `docs/keeperhub-agents-onchain/`.

**The pitch:** external agents pay (SOL/SPL, x402-style proof) and get exactly **one** PAPER TRAIL match snapshot per payment — lane scores, 5-second volatility window, leader, ELO, burns, locks. Game economy × payment rails. The plugin itself is **T0 / zero-custody**: no key, no signing, no network egress from the core.

## Why this differentiates

The ZeroClaw listing field is crowded with solana-pay / invoice / x402 / guardian clones (20+ public applicant repos). This entry is not another payment primitive — it is a **paid data product**: the PAPER TRAIL game state as a monetizable oracle. Differentiation: game-economy × payment-gate, not payment-gate alone.

## Design

| Layer | File | Responsibility |
|---|---|---|
| Payment gate | `src/payment-gate.ts` | x402-style paywall/proof, base58 pubkey validation, injected verifier. No proof or bad proof → 402 `payment_required`. |
| Payment verification (on-chain) | `src/solana-verifier.ts` | Solana JSON-RPC signature check: tx exists, did not fail, names the recipient, and the recipient's lamport balance delta covers the paywall. Fail-closed, replay-protected. SOL native only. |
| Oracle | `src/oracle.ts` | Pure game-state queries over an injected data source. Never decides payment. |
| Plugin entry | `src/plugin.ts` | ZeroClaw tool surface: `invoke(headers, args)`. Runs the oracle **exactly once per paid gate pass — zero free runs**. |
| Manifest | `manifest.toml` | ZeroClaw plugin manifest: `capabilities = ["tool"]`, `permissions = []` (deny-by-default). |

## Run & test

Zero-install, Node 22 type-stripping (same pattern as `docs/keeperhub-agents-onchain/`):

```bash
node --experimental-strip-types --test src/*.test.ts
```

```
▶ payment-gate.test.ts    11 tests
▶ plugin.test.ts           7 tests
▶ solana-verifier.test.ts 18 tests
```

## How a client uses it

```text
1. invoke({}, {matchId})                     -> 402 + x-papertrail-request (paywall)
2. client pays `amount` to `recipient`       (SOL or SPL, base units)
3. invoke({x-papertrail-proof}, {matchId})   -> 200 + match snapshot
```

## Honest status

- [x] Payment gate (x402-style, Solana-native, base58 validation)
- [x] Oracle core (pure, deterministic, testable)
- [x] Plugin surface + manifest (T0, zero-custody)
- [x] On-chain payment verification (`src/solana-verifier.ts` — Solana JSON-RPC: tx must exist, not fail, name the recipient, and its lamport balance delta must cover the paywall. Fail-closed; replay protection = one proof one run; construction without RPC refuses — no silent mocks). **SOL native only.**
- [ ] SPL token verification (documented extension: `postTokenBalances` check)
- [ ] Listing-specific requirements (browser-required; pending confirmation from K319)
- [ ] Demo video / final submission (winner announcement 2026-08-21)

The in-memory verifier is for tests/demo only. Production swaps in `SolanaRpcPaymentVerifier` (needs a public or private RPC URL); replay-set persistence across restarts is a production concern.
