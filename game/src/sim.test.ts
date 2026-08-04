import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, playMatch, runSeries } from './sim.ts';

test('mulberry32 is deterministic per seed', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = [a(), a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b(), b()];
  assert.deepEqual(seqA, seqB);
  const c = mulberry32(43);
  assert.notDeepEqual(seqA, [c(), c(), c(), c(), c()]);
});

test('playMatch with a fixed seed is deterministic', () => {
  const r1 = playMatch('greedy', 'meta', { rng: mulberry32(7) });
  const r2 = playMatch('greedy', 'meta', { rng: mulberry32(7) });
  assert.deepEqual(r1, r2);
});

test('playMatch winner is consistent with the final score', () => {
  const r = playMatch('greedy', 'meta', { rng: mulberry32(7) });
  const [a, b] = r.score;
  if (r.winner === 0) assert.ok(a > b);
  if (r.winner === 1) assert.ok(b > a);
  if (r.draw) assert.equal(a, b);
});

test('series totals always add up to the number of matches', () => {
  const r = runSeries('greedy', 'hoarder', 50, { seed: 99 });
  assert.equal(r.wins0 + r.wins1 + r.draws, 50);
  assert.equal(r.matches, 50);
});

test('mirror match keeps ELO close', () => {
  const r = runSeries('greedy', 'greedy', 100, { seed: 5 });
  const drift = Math.abs(r.eloEnd[0] - r.eloEnd[1]);
  assert.ok(drift < 100, 'mirror match ELO drift too high: ' + drift);
  assert.ok(r.eloEnd[0] >= 1100 && r.eloEnd[0] <= 1300, 'elo out of band: ' + r.eloEnd[0]);
});

test('hoarder feeds the shredder more than greedy', () => {
  const r = playMatch('hoarder', 'greedy', { rng: mulberry32(21) });
  assert.ok(r.burned[0] >= r.burned[1], 'hoarder burns: ' + r.burned[0] + ', greedy burns: ' + r.burned[1]);
});

test('runSeries is deterministic for the same seed', () => {
  const a = runSeries('meta', 'greedy', 150, { seed: 4242 });
  const b = runSeries('meta', 'greedy', 150, { seed: 4242 });
  assert.deepEqual(a, b);
});
