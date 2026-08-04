import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_CARDS,
  GENESIS_RARITY_COUNTS,
  GENESIS_SET_SIZE,
  isGenesisRarity,
  type Rarity,
} from './genesis-cards.ts';
import { STARTER_DECK } from './cards.ts';
import { LANES, type CardType } from './types.ts';

const VALID_TYPES: CardType[] = ['scandal', 'satire', 'leak', 'spin', 'fabrication', 'news', 'meme', 'rumor'];
const VALID_RARITIES: Rarity[] = ['common', 'rare', 'uncommon', 'epic', 'legendary'];

test('GENESIS set has exactly 77 cards', () => {
  assert.equal(GENESIS_CARDS.length, GENESIS_SET_SIZE);
});

test('editions are exactly 1..77, all unique', () => {
  const editions = GENESIS_CARDS.map((c) => c.edition).sort((a, b) => a - b);
  assert.deepEqual(editions, Array.from({ length: 77 }, (_, i) => i + 1));
});

test('ids are unique and lane-prefixed', () => {
  const ids = GENESIS_CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, 77);
  for (const card of GENESIS_CARDS) {
    const prefix = card.lane === 'headline' ? 'h' : card.lane === 'media' ? 'm' : 'u';
    assert.ok(card.id.startsWith(prefix), card.id + ' should start with ' + prefix);
  }
});

test('lanes and types are valid', () => {
  for (const card of GENESIS_CARDS) {
    assert.ok(LANES.includes(card.lane), card.id + ' invalid lane: ' + card.lane);
    assert.ok(VALID_TYPES.includes(card.type), card.id + ' invalid type: ' + card.type);
  }
});

test('stats are integers in range; flavor present; rarity valid', () => {
  for (const card of GENESIS_CARDS) {
    assert.ok(Number.isInteger(card.power) && card.power >= 1 && card.power <= 10, card.id + ' power');
    assert.ok(Number.isInteger(card.fuel) && card.fuel >= 1 && card.fuel <= 6, card.id + ' fuel');
    assert.ok(Number.isInteger(card.volatility) && card.volatility >= 0 && card.volatility <= 100, card.id + ' volatility');
    assert.ok(isGenesisRarity(card.rarity), card.id + ' rarity');
    assert.ok(card.flavor.trim().length > 0, card.id + ' flavor');
    assert.ok(card.name.trim().length > 0, card.id + ' name');
  }
});

test('rarity distribution matches the declared counts', () => {
  const counts: Record<string, number> = {};
  for (const card of GENESIS_CARDS) counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
  assert.deepEqual(counts, GENESIS_RARITY_COUNTS);
});

test('lane distribution matches canonical metadata (35/21/21)', () => {
  const counts: Record<string, number> = {};
  for (const card of GENESIS_CARDS) counts[card.lane] = (counts[card.lane] ?? 0) + 1;
  assert.equal(counts['headline'], 35);
  assert.equal(counts['media'], 21);
  assert.equal(counts['underground'], 21);
});

test('card names are unique', () => {
  assert.equal(new Set(GENESIS_CARDS.map((c) => c.name)).size, 77);
});

test('starter deck is a strict subset of the GENESIS set (by id)', () => {
  const genesisIds = new Set(GENESIS_CARDS.map((c) => c.id));
  for (const card of STARTER_DECK) {
    assert.ok(genesisIds.has(card.id), card.id + ' (' + card.name + ') missing from GENESIS set');
  }
});

test('legendary cards are the set crown jewels (power >= 7)', () => {
  for (const card of GENESIS_CARDS.filter((c) => c.rarity === 'legendary')) {
    assert.ok(card.power >= 7, card.id + ' legendary should have power >= 7');
  }
});
