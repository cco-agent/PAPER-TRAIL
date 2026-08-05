import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfidentialDeck, drawStarterHand, mulberry32 } from './confidential-deck.ts';

// 77-card GENESIS-shaped deck reference (lanes rotated for determinism).
const DECK = Array.from({ length: 77 }, (_, i) => ({
  id: i + 1,
  lane: (i % 3 === 0 ? 'headline' : i % 3 === 1 ? 'media' : 'underground'),
}) as { id: number; lane: 'headline' | 'media' | 'underground' });

const STARTER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function makeDeck(): ConfidentialDeck {
  return new ConfidentialDeck(DECK);
}

test('hand is sealed: no read path leaks ids without owner key', () => {
  const cd = makeDeck();
  cd.commitHand('alice', [1, 2, 3]);
  assert.throws(() => cd.peekHand('alice', 'wrong'), /access denied/);
  assert.throws(() => cd.peekHand('bob', 'key:alice'), /no sealed hand/);
  assert.equal(cd.isSealed('alice'), true);
  assert.equal(cd.revealedCount('alice'), 0);
});

test('owner can peek own hidden hand', () => {
  const cd = makeDeck();
  cd.commitHand('alice', [7, 21, 42]);
  assert.deepEqual(cd.peekHand('alice', 'key:alice').sort((a, b) => a - b), [7, 21, 42]);
  assert.equal(cd.handSize('alice', 'key:alice'), 3);
});

test('playCard is the single reveal event and removes the card from hidden state', () => {
  const cd = makeDeck();
  cd.commitHand('alice', [1, 2, 3]);
  const ev = cd.playCard('alice', 'key:alice', 2, 5);
  assert.equal(ev.card.id, 2);
  assert.equal(ev.player, 'alice');
  assert.equal(ev.atTick, 5);
  assert.equal(ev.lane, 'media'); // id 2 -> i=1 -> media
  assert.deepEqual(cd.peekHand('alice', 'key:alice').sort((a, b) => a - b), [1, 3]);
  assert.equal(cd.revealedCount('alice'), 1);
  assert.throws(() => cd.playCard('alice', 'key:alice', 2, 6), /already played/);
});

test('commit validation: unknown card and duplicates rejected', () => {
  const cd = makeDeck();
  assert.throws(() => cd.commitHand('alice', [1, 999]), /not in deck/);
  assert.throws(() => cd.commitHand('alice', [1, 1]), /duplicate/);
  cd.commitHand('alice', [1]);
  assert.throws(() => cd.commitHand('alice', [2]), /already committed/);
});

test("players are isolated: alice cannot read bob's hand", () => {
  const cd = makeDeck();
  cd.commitHand('alice', [1]);
  cd.commitHand('bob', [2]);
  assert.throws(() => cd.peekHand('bob', 'key:alice'), /access denied/);
  assert.deepEqual(cd.peekHand('bob', 'key:bob'), [2]);
});

test('blind draft is deterministic and distinct', () => {
  const rng = mulberry32(20260805);
  const hand = drawStarterHand(rng, STARTER, 6);
  const rng2 = mulberry32(20260805);
  assert.deepEqual(hand, drawStarterHand(rng2, STARTER, 6));
  assert.equal(hand.length, 6);
  assert.equal(new Set(hand).size, 6);
  for (const id of hand) {
    assert.ok(STARTER.includes(id));
  }
});
