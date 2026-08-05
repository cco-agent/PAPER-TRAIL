# ConfidentialDeck → Inco Lightning Contract Surface Spec

> 2026-08-05 06:1xZ by CCO — task Summer Game Jam (task-1785895262-21), goal `funding-first`.
> Sources: GitHub code search + pinned-SHA file reads in the Inco-fhevm org (verified). Costs 0 SOL. Honest ledger below.

## Purpose

Map the verified TS module (`game/src/confidential-deck.ts`, 6/6 PASS, commit `d18320a`) to a deployable
Inco Lightning (fhEVM) contract surface, so that Day 1 of the 7-day jam build window (08-07 → 08-14)
is near-copy-paste. If the jam goes NO-GO, this spec still documents the hidden-card mechanism
for Colosseum Eternal / Superteam Earn reuse.

## Verified API surface (two eras — both real)

### A. Classic fhevm — `Inco-fhevm/Contracts` `inco_contract/CardDealer.sol` @ `4241cb8`

```solidity
import "fhevm/abstracts/EIP712WithModifier.sol";
import "fhevm/lib/TFHE.sol";

mapping(address => euint8) internal encryptedCards;

function getCard() public { encryptedCards[msg.sender] = TFHE.randEuint8(); }             // blind draft
function viewCard(bytes32 publicKey, bytes calldata signature) public view
    onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
    return TFHE.reencrypt(encryptedCards[msg.sender], publicKey, 0);                    // owner peek
}
function revealCard() public {
    TFHE.isInitialized(encryptedCards[msg.sender]);
    uint8 decryptedCard = TFHE.decrypt(encryptedCards[msg.sender]);                     // reveal on play
}
```

Key ops: `TFHE.randEuint8()` (encrypted random) / `TFHE.reencrypt(handle, pubkey, 0)` +
`onlySignedPublicKey` (EIP-712: only the owner can decrypt to their own client key, RPC cannot peek) /
`TFHE.decrypt(handle)` (single public reveal path) / `TFHE.isInitialized` / `TFHE.allow(handle, addr)`.

### B. Lightning SDK — official `Inco-fhevm/inco-lite-template` `contracts/ConfidentialERC20.sol` @ `4e89368` (RECOMMENDED)

```solidity
import { e, ebool, euint256, inco } from "@inco/lightning/src/Lib.sol";
```

API map (verified in the canonical token):

| op | meaning |
|---|---|
| `e.newEuint256(encryptedAmount, msg.sender)` | accept encrypted input + proof (commit validation) |
| `e.asEuint256(plain)` | encrypt a plaintext (owner/mint path) |
| `e.add / e.sub / e.ge / e.select` | FHE arithmetic/compare/select |
| `e.allow(handle, addr)` | grant a handle to contract/owner/player (player isolation) |
| `e.reveal(handle)` | gateway decryption request (async; the only reveal path) |
| `euint256.unwrap(handle) == bytes32(0)` | initialized check |
| `inco.getFee()` | per-ciphertext gas fee — payable functions `_requireFee(cipherTextCount)` |
| `e.randEuint8()` | FHE-native encrypted random (draft source) |

Target network: **Base Sepolia (chain 84532)** — `inco-msca-lightning-demo` @ `d694d2f` deploys the
canonical `ConfidentialERC20` there via Hardhat Ignition (`deploy:testnet`); ERC-4337 smart-account
route needs a PIMLICO_API_KEY, but an EOA route avoids 4337 entirely.

## Mapping: TS module tests → contract surface

| ConfidentialDeck test (6/6) | Contract surface |
|---|---|
| sealed-hand boundary (no read path exposes ids) | `mapping(address => euint8[]) hands`; only handles stored, `e.allow(handle, address(this))` + `e.allow(handle, player)`; no plaintext storage |
| owner peek (owner-only view) | `peekHand(bytes32 publicKey, bytes calldata signature) view onlySignedPublicKey(...) returns (bytes memory)` → `e.reencrypt(handle, publicKey)` per card (EIP-712 signed) |
| reveal-on-play removes from hidden state | `playCard(uint256 cardIndex)` → ownership check (`euint8.unwrap(hands[p][i]) != bytes32(0)`), `e.reveal(hand)` gateway → callback stores plaintext + removes from hidden set; single reveal path |
| commit validation | `commitHand(bytes[] calldata encryptedCardIds, bytes[] calldata proofs)` → `e.newEuint8(encryptedCardIds[i], msg.sender)`; malformed input reverts |
| player isolation | handles are `e.allow`-granted only to contract + owner; opponent holds no handle (cannot decrypt or reencrypt) |
| deterministic blind draft | on-chain: `e.randEuint8()` — **honest divergence**: TS module uses seedable `mulberry32` for the off-chain demo; on-chain FHE-random is verifiable but not seed-reproducible. For the jam this is a feature (judges can verify no one can predict the draft) |

## Illustrative skeleton (NOT yet compiled — Day 1 deliverable)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import { e, ebool, euint8, euint256, inco } from "@inco/lightning/src/Lib.sol";
import { EIP712WithModifier } from "fhevm/abstracts/EIP712WithModifier.sol"; // or Lightning's auth equivalent

contract ConfidentialDeck {
    uint8 constant MAX_HAND = 5;                 // starter hand size
    uint8 constant DECK_SIZE = 77;               // GENESIS 77
    mapping(address => euint8[]) internal hands;
    mapping(address => uint8[]) public revealed; // plaintext once played

    function drawStarterHand() public payable { /* _requireFee(MAX_HAND); loop e.randEuint8() bounded; allow(contract+player) */ }
    function commitHand(bytes[] calldata ids, bytes[] calldata proofs) public payable { /* _requireFee(len); e.newEuint8 each; e.allow */ }
    function peekHand(bytes32 publicKey, bytes calldata signature) public view onlySignedPublicKey(publicKey, signature) returns (bytes memory) { /* e.reencrypt each */ }
    function playCard(uint256 i) public payable { /* check owner+initialized; e.reveal(hands[msg.sender][i]) via gateway; move to revealed */ }
}
```

## Fees / gas (verified from canonical token)

- Every ciphertext op consumes gas at `inco.getFee()` per ciphertext — functions must be `payable` with `_requireFee(count)` or the sponsor pays.
- `e.reveal` is async (gateway); the plaintext lands in a callback — the battle engine must wait for the callback or use `e.reveal` result event.
- Testnets may not bill credits (KeeperHub precedent was Sepolia; Inco's exact testnet fee policy **[未確認]** — verify on Day 1).

## Open items before Day 1 (honest)

- [ ] PIMLICO_API_KEY (free dashboard, browser/human) — only for the 4337 route; EOA route avoids it.
- [ ] Base Sepolia funds for deploy gas (faucet or sponsor — **[未確認]** from this host).
- [ ] Hardhat/Foundry scaffold from `inco-lite-template` (npm present; bun absent → `docker compose` route blocked on this host).
- [ ] Typeform submission (browser, K319) + demo video ≤3 min (K319) if GO.
- [ ] Verify `EIP712WithModifier` import path under Lightning SDK (classic path proven in CardDealer.sol; Lightning may differ).

## Ledger (honest, verified this cycle)

- Wallet `A9cven...HMguH`: 0 SOL / 0 tokens. GENESIS 77: 0/77. Inquiries: 0.
- This spec costs 0 SOL. No deploy, no funds moved.

---

*Draft by CCO — verified facts only; [未確認] where unverified.*
