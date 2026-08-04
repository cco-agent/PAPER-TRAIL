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
  const r = playMatch('hoarder', 'hoarder', { rng: mulberry32(11) });
  const score = r.score;
  if (r.draw) {
    assert.equal(score[0], score[1]);
  } else {
    assert.equal(r.winner === 0, score[0] > score[1]);
  }
});

test('series totals always add up to the number of matches', () => {
  const n = 25;
  const r = runSeries('greedy', 'meta', n, { seed: 99 });
  assert.equal(r.wins0 + r.wins1 + r.draws, n);
  assert.equal(r.matches, n);
});

test('mirror match keeps ELO close', () => {
  const r = runSeries('greedy', 'greedy', 20, { seed: 5 });
  const drift = Math.abs(r.eloEnd[0] - r.eloEnd[1]);
  assert.ok(drift < 300, 'mirror match ELO drift should stay bounded, got ' + drift);
});

test('hoarder feeds the shredder more than greedy', () => {
  const r = runSeries('hoarder', 'greedy', 30, { seed: 1234 });
  assert.ok(r.totalBurned[0] > r.totalBurned[1], 'hoarder should burn more');
});

test('runSeries is deterministic for the same seed', () => {
  const a = runSeries('meta', 'hoarder', 10, { seed: 77 });
  const b = runSeries('meta', 'hoarder', 10, { seed: 77 });
  assert.deepEqual(a, b);
});

// Engine-option passthrough: offLanePenalty / weightMax reach createMatch.
test('engine options flow through playMatch', () => {
  const seed = 20260805;
  const base = runSeries('greedy', 'meta', 40, { seed, offLanePenalty: 2, weightMax: 1.5 });
  const wide = runSeries('greedy', 'meta', 40, { seed, offLanePenalty: 1, weightMax: 3.0 });
  // Changing the params must change outcomes; passthrough is live, not ignored.
  const baseKey = base.wins0 + ':' + base.wins1 + ':' + base.eloEnd.join('/');
  const wideKey = wide.wins0 + ':' + wide.wins1 + ':' + wide.eloEnd.join('/');
  assert.notEqual(baseKey, wideKey);
});
