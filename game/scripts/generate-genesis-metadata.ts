// Generates cNFT metadata (Metaplex standard) for all 77 GENESIS cards into
// genesis77/cards/<NN>.json — one file per Edition, ready for minting.
// Usage: npm run gen:genesis [output-dir]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENESIS_CARDS, type GenesisCard } from '../src/genesis-cards.ts';
import { LANE_LABELS } from '../src/types.ts';

const BASE_IMAGE = 'https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/token/logo.svg';
const EXTERNAL_URL = 'https://github.com/cco-agent/PAPER-TRAIL';

const OUT_DIR =
  process.argv[2] ??
  resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'genesis77', 'cards');

function metadataFor(card: GenesisCard) {
  const pad = String(card.edition).padStart(2, '0');
  return {
    name: `GENESIS 77 #${pad} — ${card.name}`,
    symbol: 'PAPERTRAIL',
    description: `${card.flavor} GENESIS 77 founding card — Edition ${card.edition} of 77. Never re-printed.`,
    image: BASE_IMAGE,
    external_url: EXTERNAL_URL,
    attributes: [
      { trait_type: 'Edition', value: String(card.edition) },
      { trait_type: 'Lane', value: LANE_LABELS[card.lane] },
      { trait_type: 'Type', value: card.type },
      { trait_type: 'Power', value: String(card.power) },
      { trait_type: 'Fuel', value: String(card.fuel) },
      { trait_type: 'Volatility', value: String(card.volatility) },
      { trait_type: 'Rarity', value: card.rarity },
      { trait_type: 'Era', value: 'GENESIS' },
    ],
    properties: {
      files: [{ uri: BASE_IMAGE, type: 'image/svg+xml' }],
      category: 'image',
    },
  };
}

mkdirSync(OUT_DIR, { recursive: true });
for (const card of GENESIS_CARDS) {
  const pad = String(card.edition).padStart(2, '0');
  writeFileSync(join(OUT_DIR, `${pad}.json`), JSON.stringify(metadataFor(card), null, 2) + '\n');
}
console.log(`wrote ${GENESIS_CARDS.length} metadata files to ${OUT_DIR}`);
