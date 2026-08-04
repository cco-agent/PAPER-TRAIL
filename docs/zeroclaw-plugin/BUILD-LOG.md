# BUILD-LOG — ZeroClaw Bounty (PAPER TRAIL Paid Oracle)

Public build log for the ZeroClaw × SuperteamEarn bounty (listing: superteam.fun/earn/listing/zeroclaw).
Per the verified judging criteria, a public build log counts as tiebreak material and reproducibility is explicitly scored (15%). This file is the reproducible record.

## 2026-08-04 — Scaffold + first green suite

- **Payment gate** (`src/payment-gate.ts`): x402-style paywall/proof, base58 pubkey validation, injected verifier. No proof or bad proof → HTTP 402 `payment_required`. Zero free runs by construction.
- **Oracle** (`src/oracle.ts`): pure game-state queries over an injected data source. Never decides payment.
- **Plugin surface** (`src/plugin.ts`) + `manifest.toml`: T0 / zero-custody, deny-by-default permissions.
- Fixed 2 bugs found by actually running the suite: (1) `decodeProof` left a `signature: undefined` key on decoded objects → only attach the key when present; (2) a test used 32×`1` (32 zero bytes = structurally valid-looking System Program address) where 31×`1` was intended. After fixes: **18/18 PASS**.

## 2026-08-04 — On-chain verification

- **`src/solana-verifier.ts`**: Solana JSON-RPC (`getTransaction`) check — tx exists, did not fail, recipient named in accountKeys, recipient lamport balance delta ≥ paywall amount (BigInt exact). Fail-closed: transport error / bad response / failed tx / missing data all reject. Replay protection: verified-signature set, one proof = one run. Construction without an RPC URL throws — no silent mocks.
- Suite: **36/36 PASS** (payment-gate 11 + plugin 7 + solana-verifier 18).

## 2026-08-04 — Verified requirements (deadline correction)

- Deadline is **2026-08-07 02:59:59 UTC** (`validThrough`), winners announced 08-21. Submission = ZeroClaw Discord #solana-bounty showcase post + Superteam form + demo video ≤3 min + write-up + public repo link. A standalone plugin is NOT a valid submission (ours is a working paid-oracle use case). No ZeroClaw registry PR during the bounty period.
- Artifacts: `SUBMISSION.md` (verified checklist + handoff), `TRANSCRIPT.md` (25 prompt-injection cases extracted from the 36-test suite), `WRITEUP.md` (8 required sections), `VIDEO-SCRIPT.md` (≤3 min demo plan, devnet explicitly acceptable).

## Remaining (human/browser handoff)

- Demo video ≤3 min: real agent on a real channel doing a real Solana job (devnet OK if stated on camera).
- ZeroClaw Discord #solana-bounty showcase post.
- Superteam form submission.

## Honest status

- No live mainnet transaction yet; on-chain verification uses an injectable RPC seam (mocked in tests).
- SOL native only; SPL token verification is a documented extension (`postTokenBalances`).
