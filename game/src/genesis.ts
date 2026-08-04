import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Card, CardType, LaneId } from './types.ts';

/**
 * GENESIS 77 deck loader.
 *
 * Reads the cNFT metadata files in `genesis77/cards/` (new two-digit format
 * `01.json`..`77.json`) and maps them to game `Card` objects. The legacy
 * three-digit files (`001.json`..`003.json`) predate the game-stat format and
 * are skipped — they are preserved as history only.
 */

const LANE_MAP: Record<string, LaneId> = {
  'The Headline': 'headline',
  'The Media': 'media',
  'The Underground': 'underground',
};

const TYPE_MAP: Record<string, CardType> = {
  scandal: 'scandal',
  satire: 'satire',
  leak: 'leak',
  spin: 'spin',
  fabrication: 'fabrication',
  news: 'news',
  meme: 'meme',
  rumor: 'rumor',
};

interface GenesisCardJson {
  name: string;
  attributes: { trait_type: string; value: string }[];
}

function attr(card: GenesisCardJson, trait: string): string | undefined {
  return card.attributes.find((a) => a.trait_type === trait)?.value;
}

function parseNum(value: string | undefined, trait: string, file: string): number {
  const n = Number(value);
  if (value === undefined || !Number.isFinite(n)) {
    throw new Error(`GENESIS ${file}: ${trait} is missing or non-numeric`);
  }
  return n;
}

/** Load all GENESIS 77 cards from a metadata directory, in edition order. */
export function loadGenesisDeck(dir: string): Card[] {
  const files = readdirSync(dir).filter((f) => /^\d{2}\.json$/.test(f)).sort();
  const cards: Card[] = [];

  for (const file of files) {
    const edition = Number(file.slice(0, 2));
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as GenesisCardJson;

    const laneName = attr(raw, 'Lane');
    const lane = laneName !== undefined ? LANE_MAP[laneName] : undefined;
    if (!lane) {
      throw new Error(`GENESIS ${file}: unknown lane "${laneName ?? ''}"`);
    }

    const typeName = (attr(raw, 'Type') ?? '').toLowerCase();
    const type = TYPE_MAP[typeName];
    if (!type) {
      throw new Error(`GENESIS ${file}: unknown type "${typeName}"`);
    }

    const power = parseNum(attr(raw, 'Power'), 'Power', file);
    const fuel = parseNum(attr(raw, 'Fuel'), 'Fuel', file);
    const volatility = parseNum(attr(raw, 'Volatility'), 'Volatility', file);

    const name = raw.name.replace(/^GENESIS 77 #\d+ —\s*/, '');

    cards.push({
      id: `g${String(edition).padStart(2, '0')}`,
      name,
      lane,
      type,
      power,
      fuel,
      volatility,
    });
  }

  return cards;
}
