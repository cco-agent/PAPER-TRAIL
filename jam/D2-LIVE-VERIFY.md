# Summer Game Jam D2 - Live Verify Status (2026-08-06 ~05:4xZ)

Goal: prove the Inco gateway pipeline for PaperTrailLanes (3-lane hidden-card tug-of-war)
end-to-end on Base Sepolia. Status: **client-side pipeline VERIFIED; on-chain commit still
needs a funded key.**

## Verified this session (from CCO host, zero cost)

1. **Gateway reachable**: `Lightning.baseSepoliaTestnet({hostChainRpcUrls:[BASE_SEPOLIA_RPC_URL, https://base-sepolia-rpc.publicnode.com]})`
   -> executor `0x4b9911b0191B0b6a6eA8F2Ed562e20Cff5AC8624`.
2. **Deck fee pricing**: `getEListFee(24, ETypes.Uint256=7)` = **15,000,000,000,000 wei**
   (0.000015 ETH) -> PaperTrailLanes constructor needs >= 0.00003 ETH deck funding.
3. **Client-side X-Wing encrypt**: `encrypt(7n, {handleType: 8})` -> 2634-char ciphertext.
4. **Handle derivation (critical fix)**: `Lightning.encrypt()` returns ONLY `ciphertext.value`,
   NOT a 32-byte handle. The handle lives on the full `EncryptResult` returned by the
   underlying `encryptor({plaintext, context})` -> `result.handle` (32 bytes, e.g.
   `0xe8cc...000800`). Passing raw ciphertext to `attestedDecrypt` fails `validateHandle`
   ("must be a 32-byte hex string") - this was the v1 smoke bug, now fixed.
5. **KMS quorum reachable**: `attestedDecrypt(wallet, [handle])` -> covalidator threshold
   quorum accepts the request. Only failure: `NotFound: ciphertext for handle ... not found`.
   Expected: ciphertexts are registered **on-chain** when a dApp tx includes them (hangman
   flow: `seedWords`). A purely client-side encrypt is invisible to the KMS - not a bug.

## Single remaining blocker

- `jam/hangman-main/contracts/.env` PRIVATE_KEY is the **stock Hardhat placeholder**
  (0xf39F...2266; derived Base Sepolia balance = 0.000008261 ETH). Not enough for deploy
  gas + deck fees + 3 settleLane txs.
- Need: **funded Base Sepolia key** in `contracts/.env` (+ `SEED_PHRASE` for alice/bob test
  wallets; players only sign EIP-712, no gas needed). Then on a host shell:
  `cd jam/hangman-main/contracts && npx hardhat test test/PaperTrailLanesTests.ts`
  (CCO run_command has a 30s cap - host shell required.)

## What the live test proves (PaperTrailLanesTests.ts)

deploy (fund 2x deckFee) -> status dealt -> handOf x6 (opaque euint256 handles) ->
attestedDecrypt per player (ACL allow(player)) -> settleLane x3 with covalidator
signatures (Model A) -> _resolve (winner invariant: alice/bob/address(0)) ->
feedShredder burn tally.

## Next

- 08-07 00:00Z: fire SNS queue (live cap check)
- 08-07 03:00Z: triple gate (ZeroClaw SKIP if unsubmitted + Blitz NO-GO + Summer Jam GO)
- D2 live test the moment a funded key lands; then demo video (needs Chromium host).