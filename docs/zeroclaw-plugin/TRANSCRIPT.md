# TRANSCRIPT — Prompt-Injection & Payment-Attack Cases

> Required by the ZeroClaw bounty for funds-touching use cases: a prompt-injection transcript. Every case below is extracted from the automated test suite (`payment-gate.test.ts` ×11, `solana-verifier.test.ts` ×18, `plugin.test.ts` ×7 — **36/36 PASS**). Each row is an executable scenario: attacker input → system response → the boundary that holds. Nothing here is hypothetical; every case runs in `node --experimental-strip-types --test src/*.test.ts`.

## 1. Payment gate (HTTP surface)

| # | Attacker input | System response | Boundary |
|---|---|---|---|
| 1 | No proof header at all | `402 payment_required` + paywall (exact amount, requestId) | Zero free runs — the oracle is only reachable behind a paid gate |
| 2 | `X-PAPERTRAIL-PROOF: not-base64url-json` (garbage) | parse → `undefined` → `402 payment_required` | Malformed headers can never reach verification, let alone the oracle |
| 3 | Lowercase header `x-papertrail-proof` | parsed (case-insensitive) and validated identically | Casing is not a bypass |
| 4 | Proof bound to a different `requestId` | rejected (`requestId` mismatch) | Proofs are bound to one paywall instance; cross-request replay fails |
| 5 | Payer pubkey `not-a-pubkey` | rejected (`payer`) | base58 32-byte pubkey validation (`isValidPubkey`) |
| 6 | Amount below required (9,999,999 < 10,000,000) | rejected | BigInt strict comparison; exact and overpayment accepted (no griefing) |
| 7 | Non-numeric amount `"1e6"` | rejected | No coercion tricks |
| 8 | base58 invalid characters `0OIl` | `decodeBase58` → null | Invalid alphabet never becomes bytes |
| 9 | Pubkey of wrong length (`"1"`, 31×`1`) | `isValidPubkey` false | Only exactly-32-byte decoded pubkeys pass |

## 2. On-chain verifier (Solana JSON-RPC)

| # | Attacker input | System response | Boundary |
|---|---|---|---|
| 10 | Proof with no `signature` field | rejected (`signature`) | Signature is mandatory |
| 11 | requestId mismatch | rejected **before any RPC call** (transport not invoked) | Cheapest failure first; invalid input costs no network egress |
| 12 | Payer `"short"` | rejected (`payer`) | Pubkey validation again at verifier layer |
| 13 | Amount `"1"` (below required) | rejected (`required`) | Defense in depth |
| 14 | Signature `"not-base58!!!"` | rejected (`64-byte`) | Signature must decode to exactly 64 bytes |
| 15 | Signature referencing a **non-existent tx** (`getTransaction` → null) | rejected (`not found`) | Proof must reference a real on-chain transaction |
| 16 | A **failed tx** (`meta.err` set) | rejected (`failed on chain`) | Failed transfers cannot be laundered as payment |
| 17 | Tx that does **not name the recipient** in `accountKeys` | rejected (`not involved`) | The treasury address must be a party to the tx |
| 18 | Recipient's balance delta below required | rejected (`delta`) | `postBalances − preBalances` must cover the paywall |
| 19 | SPL mint (USDC) proof | rejected (`SPL`) — honestly | SOL-native only; SPL is a documented extension, never a silent acceptance |
| 20 | RPC transport down (throws) | rejected (`transport`) | Fail-closed: uncertainty = no payout |
| 21 | RPC error response (e.g. skipped slot) | rejected (`RPC error`) | Fail-closed at the RPC layer |
| 22 | Same signature redeemed twice | 1st accepted, 2nd rejected (`already redeemed`) | Replay protection: one proof = one oracle run (in-memory set; persistence is a documented production concern) |
| 23 | Two distinct signatures | both accepted | Legitimate repeat buyers are not locked out |
| 24 | Constructor without `rpcUrl`/`rpcCall` | throws | No silent mock in production |
| 25 | `createPaymentVerifier("chain", {})` | throws | Factory refuses to build a chain verifier without transport |

## 3. Plugin surface (tool invocation)

- `invoke({}, args)` → `402 payment_required` (no proof).
- `invoke({x-papertrail-proof: <bad>}, args)` → `402 payment_required` (invalid proof).
- `invoke({x-papertrail-proof: <good>}, args)` → `200` + **exactly one** match snapshot. No free runs, no double runs (covered by `plugin.test.ts` ×7).

## Conclusion

The plugin is a zero-trust payment gate: no proof path reaches the oracle without a verified on-chain payment. Every injection surface (headers, proof JSON, amounts, pubkeys, signatures, transaction claims, replay) is closed by validation **before** any game-state query, and RPC uncertainty fails closed. All 36 cases run with zero dependencies.
