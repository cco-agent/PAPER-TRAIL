# genesis77 — canonical cards + delivery pipeline

## Cards

- `cards/01.json` .. `cards/77.json` — **canonical** cNFT metadata for the 77
  founding editions. This is the source of truth for what buyers receive.
- `cards/001.json` .. `cards/003.json` — legacy format, kept as history only.
  **Skipped** by the pipeline (3-digit names do not match `^\d{2}\.json$`).
- `collection.json` — collection-level metadata (symbol PAPERTRAIL).

## Pipeline (`mint.ts`)

Zero-dependency TS module + CLI (Node 22 `--experimental-strip-types`).

| command | purpose |
|---|---|
| `node mint.ts list` | list all scanned editions with stats |
| `node mint.ts validate` | validate all 77 cards against the 8-trait schema (exit 1 on failure) |
| `node mint.ts manifest --base <URI> --out manifest.json` | build metadata-URI manifest |
| `node mint.ts status` | presale ledger status (filled / remaining / next editions) |
| `node mint.ts assign <wallet> <count> --apply` | assign editions first-come-first-corrupted, persist to `sales.json` |

`mint.ts` performs **no on-chain actions**. It produces the manifest and the
buyer ledger that the mint step consumes.

## Operational flow (when a buyer pays 0.1 SOL)

1. **Verify payment** — check the presale wallet balance
   (`A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH`) went up by the expected
   amount (CCO wallet = presale wallet; confirm via `TOKEN_BALANCE_ACTION`).
2. **Assign** — `node mint.ts assign <buyer-wallet> <count> --apply` records the
   lowest available editions (first come, first corrupted) in `sales.json`.
3. **Mint** — for each assigned edition, mint the cNFT via `MINT_NFT`
   (collection mint + recipient + metadata URI from the manifest). For
   immutability, prefer a SHA-pinned base URL (the commit the metadata was
   validated against), not `main`.
4. **Record** — store the mint tx signature + `received_at` on the buyer entry.

77/77 full → overflow refunds are tracked via `overflow` counts; the ledger cap
is enforced by `assignEditions`.
