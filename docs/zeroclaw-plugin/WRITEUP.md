# ZeroClaw Bounty Submission — PAPER TRAIL Paid Oracle (write-up)

## 1. Purpose

PAPER TRAIL is a 3-lane Solana card battler (The Headline / The Media / The Underground) with 5-second volatility swings, 3-minute tug-of-war rounds, a shredder burn mechanic, and 77,777,777 $PAPERTRAIL supply. This plugin turns the game's live state into a **paid oracle**: an external agent pays (x402-style proof) and receives exactly one match snapshot (lane scores, volatility window, leader, ELO, burns, locks) per payment. The plugin is the game economy's first monetized data product — the house charging for its own intelligence.

## 2. Audience

- Solana agent builders who want payment-gated, reproducible access to game/on-chain state
- Gaming dApps and prediction/oracle markets that need trustworthy match data
- PAPER TRAIL players and collectors who want programmatic access to match state

## 3. ZeroClaw features used

- ZeroClaw plugin manifest (`manifest.toml`: `capabilities = ["tool"]`, `permissions = []` — deny-by-default)
- Tool-style invocation surface (`invoke(headers, args)`)
- T0 / zero-custody posture: the plugin holds no key, signs nothing, and makes no network egress from the core (verification is an injected seam)

## 4. Custom code (all in this repository)

| File | Responsibility |
|---|---|
| `src/payment-gate.ts` | x402-style paywall + proof encode/decode, base58 pubkey validation, injected verifier seam |
| `src/solana-verifier.ts` | Solana JSON-RPC on-chain verification: tx exists, not failed, names recipient, lamport delta ≥ paywall. Fail-closed, replay-protected |
| `src/oracle.ts` | Pure game-state queries over an injected data source; never decides payment |
| `src/plugin.ts` | ZeroClaw tool surface: oracle runs exactly once per paid gate pass |
| `manifest.toml` | ZeroClaw plugin manifest (deny-by-default permissions) |

## 5. Custody tier

**T0 (zero-custody).** The plugin never holds or signs with a private key. Payment verification is read-only (`getTransaction` over public RPC); the plugin cannot move funds, approve anything, or spend. Funds flow directly to the PAPER TRAIL treasury address (`A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH`) via normal Solana transfers — the plugin only *proves* the payment happened.

## 6. Threat model

| Threat | Mitigation |
|---|---|
| Proof forgery (fake signature) | 64-byte base58 signature requirement + on-chain tx existence check |
| Replay (same proof twice) | Replay protection: one signature = one oracle run (in-memory set; persistence documented) |
| Underpayment | BigInt strict comparison; exact/overpayment accepted |
| Fake/laundered tx (failed tx) | `meta.err` rejection |
| Tx not naming recipient | `accountKeys` membership check |
| SPL confusion | Honest rejection (SOL-native only; SPL documented as extension) |
| RPC downtime / malicious RPC | Fail-closed on transport error / RPC error |
| Prompt injection via headers/proofs | All inputs validated before the oracle; garbage → 402, never executed (see TRANSCRIPT.md) |
| Zero free runs | Oracle only reachable behind a paid gate pass |

## 7. Reproducibility (config / SOP / code)

- Zero dependencies. Node ≥22.6 with `--experimental-strip-types`.
- Run the whole suite: `node --experimental-strip-types --test src/*.test.ts` → **36/36 PASS**.
- Swap verifier: `createPaymentVerifier("memory")` for demo, `"chain"` with an RPC URL (`https://api.mainnet-beta.solana.com` or a private endpoint) for production.
- Client flow: `invoke({}, {matchId})` → 402 + paywall → pay → `invoke({x-papertrail-proof}, {matchId})` → 200 + snapshot.
- Replay-set persistence across restarts: documented production concern (SQLite/Redis swap).

## 8. Redacted secrets

No secrets are stored or required. The plugin reads a public RPC endpoint only; any authenticated RPC URL (if used) lives in the deployment environment, never in this repo. The treasury address is public by design (presale wallet).

## Honest status

- Implemented & tested: payment gate, on-chain verifier, oracle, plugin surface, manifest — **36/36 PASS**.
- Not yet done (human/browser — see SUBMISSION.md): ≤3 min demo video of a real agent running a real Solana job, ZeroClaw Discord #solana-bounty showcase post, Superteam form submission. The in-memory verifier is test/demo-only; production uses the RPC verifier.
