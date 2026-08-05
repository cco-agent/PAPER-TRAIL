import { strict as assert } from 'node:assert';
import { ConfidentialMatch } from './confidential-match.ts';
import type { PlayerIdx } from './confidential-match.ts';
import type { Card } from './types.ts';

function mkCards(): Card[] {
  return [
    { id: 'c1', name: 'Offshore Ledger', lane: 'headline', type: 'scandal', power: 5, fuel: 2, volatility: 40 },
    { id: 'c2', name: 'Shredder Rebrand', lane: 'media', type: 'satire', power: 4, fuel: 3, volatility: 60 },
    { id: 'c3', name: 'Anonymous Tip', lane: 'underground', type: 'leak', power: 6, fuel: 1, volatility: 80 },
    { id: 'c4', name: 'Spin Doctor', lane: 'media', type: 'spin', power: 3, fuel: 2, volatility: 30 },
    { id: 'c5', name: 'Meme Storm', lane: 'headline', type: 'meme', power: 4, fuel: 2, volatility: 90 },
    { id: 'c6', name: 'Rumor Mill', lane: 'underground', type: 'rumor', power: 2, fuel: 4, volatility: 50 },
  ];
}

const CARDS = mkCards();
const STARTER = [1, 2, 3, 4, 5, 6];

function fresh(seed = 7) {
  return new ConfidentialMatch(CARDS, STARTER, { seed });
}

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log('PASS', name);
}

// 1. hands sealed at construction; public match hands stay empty
{
  const m = fresh();
  assert.ok(m.cd.isSealed('p0'));
  assert.ok(m.cd.isSealed('p1'));
  assert.equal(m.match.players[0].hand.length, 0);
  assert.equal(m.match.players[1].hand.length, 0);
  assert.equal(m.hiddenCount(0, m.keyOf(0)), 5);
  assert.equal(m.hiddenCount(1, m.keyOf(1)), 5);
  t('hands sealed at construction, public hand empty', () => {});
}

// 2. sealed hand unreadable without the owner key
{
  const m = fresh();
  assert.throws(() => m.hiddenCards(0, 'key:p1'), /access denied/);
  assert.throws(() => m.hiddenCards(0, 'wrong-key'), /access denied/);
  assert.throws(() => m.cd.peekHand('p0', 'key:p1'), /access denied/);
  t('sealed hand unreadable without owner key', () => {});
}

// 3. reveal-on-play lands power on the lane and logs the reveal
{
  const m = fresh();
  const hand0 = m.hiddenCards(0, m.keyOf(0));
  const edition = hand0[0];
  const res = m.play(0, m.keyOf(0), edition, 0);
  assert.equal(res.ok, true);
  assert.equal(res.hiddenLeft, 4);
  assert.equal(res.revealedCount, 1);
  assert.equal(m.revealLog.length, 1);
  assert.equal(m.revealLog[0].player, 'p0');
  assert.equal(m.revealLog[0].card.id, edition);
  const card = CARDS[edition - 1];
  assert.equal(res.power, card.power);
  assert.equal(m.powerOn(0, card.lane), card.power);
  assert.equal(m.hiddenCount(0, m.keyOf(0)), 4);
  assert.ok(m.match.log.some((l) => l.includes('revealed') && l.includes(card.name)));
  t('reveal-on-play lands power on the lane', () => {});
}

// 4. off-lane play costs the penalty
{
  const m = fresh();
  const edition = m.hiddenCards(0, m.keyOf(0))[0];
  const card = CARDS[edition - 1];
  const target = card.lane === 'headline' ? 'media' : 'headline';
  const res = m.play(0, m.keyOf(0), edition, 0, target);
  assert.equal(res.offLane, true);
  assert.equal(res.power, Math.max(0, card.power - m.match.opts.offLanePenalty));
  assert.equal(m.powerOn(0, target), res.power);
  t('off-lane play costs the penalty', () => {});
}

// 5. double-play rejected
{
  const m = fresh();
  const edition = m.hiddenCards(0, m.keyOf(0))[0];
  m.play(0, m.keyOf(0), edition, 0);
  assert.throws(() => m.play(0, m.keyOf(0), edition, 0), /already played/);
  t('double-play rejected', () => {});
}

// 6. wrong-owner key rejected
{
  const m = fresh();
  const edition = m.hiddenCards(1, m.keyOf(1))[0];
  assert.throws(() => m.play(1, m.keyOf(0), edition, 0), /access denied/);
  t('wrong-owner key rejected', () => {});
}

// 7. reveal must respect the clock (no plays from the future)
{
  const m = fresh();
  const edition = m.hiddenCards(0, m.keyOf(0))[0];
  assert.throws(() => m.play(0, m.keyOf(0), edition, 5), /after current tick/);
  t('reveal cannot come from the future', () => {});
}

// 8. full match: play out both hands, run the clock, settle score + ELO
{
  const m = fresh();
  const h0 = m.hiddenCards(0, m.keyOf(0));
  const h1 = m.hiddenCards(1, m.keyOf(1));
  for (let i = 0; i < h0.length; i++) {
    m.tick(1);
    m.play(0, m.keyOf(0), h0[i], m.match.seconds);
    m.play(1, m.keyOf(1), h1[i], m.match.seconds);
  }
  assert.equal(m.match.players[0].hand.length, 0);
  assert.equal(m.match.players[1].hand.length, 0);
  m.tick(m.match.opts.matchSeconds - m.match.seconds);
  const out = m.finish();
  assert.equal(m.match.phase, 'ended');
  assert.ok(out.winner === 0 || out.winner === 1, 'match should have a winner');
  assert.equal(out.score.length, 2);
  const eloMoved = out.elo[0] !== 1200 || out.elo[1] !== 1200;
  assert.ok(eloMoved, 'ELO should move off baseline');
  console.log('  (seed 7 -> winner p' + out.winner + ' score ' + out.score[0] + '-' + out.score[1] + ' elo ' + out.elo[0] + '/' + out.elo[1] + ')');
  t('full sealed match settles score + ELO', () => {});
}

// 9. no play after the match ends
{
  const m = fresh();
  m.tick(m.match.opts.matchSeconds);
  m.finish();
  assert.throws(() => m.play(0, m.keyOf(0), 1, 999), /match over/);
  t('play rejected after match end', () => {});
}

console.log('TOTAL', passed, 'tests passed');
