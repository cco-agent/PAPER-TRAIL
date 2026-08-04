import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadGenesisDeck } from './genesis.ts';

function cardJson(
  edition: string,
  lane: string,
  type: string,
  power = 5,
  fuel = 3,
  volatility = 60,
): string {
  return JSON.stringify({
    name: `GENESIS 77 #${edition} — Test Card ${edition}`,
    symbol: 'PAPERTRAIL',
    description: 'test fixture',
    image: 'https://example.com/logo.svg',
    attributes: [
      { trait_type: 'Edition', value: edition },
      { trait_type: 'Lane', value: lane },
      { trait_type: 'Type', value: type },
      { trait_type: 'Power', value: String(power) },
      { trait_type: 'Fuel', value: String(fuel) },
      { trait_type: 'Volatility', value: String(volatility) },
      { trait_type: 'Rarity', value: 'common' },
    ],
  });
}

function fixtureDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'pt-genesis-'));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

test('loads cards across all three lanes with genesis types', () => {
  const dir = fixtureDir({
    '01.json': cardJson('1', 'The Headline', 'news', 6, 4, 80),
    '02.json': cardJson('2', 'The Media', 'meme', 5, 3, 70),
    '03.json': cardJson('3', 'The Underground', 'rumor', 7, 2, 90),
  });
  try {
    const deck = loadGenesisDeck(dir);
    assert.equal(deck.length, 3);
    assert.deepEqual(deck.map((c) => c.id), ['g01', 'g02', 'g03']);
    assert.deepEqual(deck.map((c) => c.lane), ['headline', 'media', 'underground']);
    assert.deepEqual(deck.map((c) => c.type), ['news', 'meme', 'rumor']);
    assert.equal(deck[0].name, 'Test Card 1');
    assert.equal(deck[0].power, 6);
    assert.equal(deck[0].volatility, 80);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('skips legacy three-digit files (001.json etc.)', () => {
  const dir = fixtureDir({
    '001.json': cardJson('1', 'The Headline', 'news'),
    '01.json': cardJson('1', 'The Media', 'meme'),
  });
  try {
    const deck = loadGenesisDeck(dir);
    assert.equal(deck.length, 1);
    assert.equal(deck[0].id, 'g01');
    assert.equal(deck[0].lane, 'media');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('throws on unknown lane', () => {
  const dir = fixtureDir({ '01.json': cardJson('1', 'The Vault', 'news') });
  try {
    assert.throws(() => loadGenesisDeck(dir), /unknown lane/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('throws on unknown type', () => {
  const dir = fixtureDir({ '01.json': cardJson('1', 'The Headline', 'clickbait') });
  try {
    assert.throws(() => loadGenesisDeck(dir), /unknown type/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('throws on non-numeric stats', () => {
  const dir = fixtureDir({
    '01.json': cardJson('1', 'The Headline', 'news').replace('"value":"5"', '"value":"NaN"'),
  });
  try {
    assert.throws(() => loadGenesisDeck(dir), /Power/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('sorts by edition order regardless of directory order', () => {
  const dir = fixtureDir({
    '77.json': cardJson('77', 'The Headline', 'news', 9, 5, 92),
    '01.json': cardJson('1', 'The Media', 'meme'),
  });
  try {
    const deck = loadGenesisDeck(dir);
    assert.deepEqual(deck.map((c) => c.id), ['g01', 'g77']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
