# jam/hangman-main/contracts — Inco Lightning contracts + E2E test

PAPER TRAIL x Inco Lightning: a 3-lane hidden-card tug-of-war for the
Inco x Megapot Summer Game Jam.

- `contracts/ConfidentialDeck.sol` — vendored kit: the five confidential moves
  (shuffle, draw, deal, reveal, verify) on `@inco/lightning` primitives.
- `contracts/PaperTrailLanes.sol` — the game: 24-card secret deck, 3 lanes
  (The Headline / The Media / The Underground), 3-minute tug-of-war,
  lane settlement on covalidator-signed attestations (Model A), shredder burn tally.
- `test/PaperTrailLanesTests.ts` — E2E: deploy -> hidden hands dealt ->
  each player attested-decrypts their own cards -> all lanes settle ->
  round resolves -> shredder burn verified.

## Run

```bash
cp .env.example .env   # fill PRIVATE_KEY, SEED_PHRASE, BASE_SEPOLIA_RPC_URL
npm install
npx hardhat compile
npx hardhat test test/PaperTrailLanesTests.ts
```

## Requirements

- `PRIVATE_KEY` — funded on Base Sepolia (gas + Inco deck fees).
- `SEED_PHRASE` — derives alice (path 0/0) and bob (path 0/1), the two players.
- `BASE_SEPOLIA_RPC_URL` — optional; defaults to public nodes (rate-limited).

The constructor requires `>= 2 * deckFee(24)` in `msg.value`; the test prices
`getEListFee` and sends 8x margin, so a small funded balance suffices.

Scaffold mirrors the verified Inco-fhevm/hangman template (contracts/utils).
