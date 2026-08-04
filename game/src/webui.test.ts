import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, traceMatch } from './webui.ts';
import { GENESIS_RARITY_COUNTS } from './genesis-cards.ts';

const post = (url: string, body: unknown) =>
  handle({ method: 'POST', url, body: typeof body === 'string' ? body : JSON.stringify(body) });
const get = (url: string) => handle({ method: 'GET', url });

function jsonOf(res: { status: number; body: string }) {
  return JSON.parse(res.body) as Record<string, unknown>;
}

test('GET / serves the simulator HTML page', () => {
  const res = get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'] ?? '', /text\/html/);
  assert.match(res.body, /PAPER/);
  assert.match(res.body, /Battle Simulator/);
  assert.match(res.body, /deck-headline/);
  assert.match(res.body, /deck-media/);
  assert.match(res.body, /deck-underground/);
});

test('GET /api/deck reports the canonical 77-card set', () => {
  const res = get('/api/deck');
  assert.equal(res.status, 200);
  const d = jsonOf(res);
  assert.equal(d.setSize, 77);
  const lanes = d.lanes as Record<string, number>;
  assert.equal(lanes.headline, 35);
  assert.equal(lanes.media, 21);
  assert.equal(lanes.underground, 21);
  assert.deepEqual(d.rarityCounts, GENESIS_RARITY_COUNTS);
  assert.equal((d.cards as unknown[]).length, 77);
});

test('POST /api/sim runs a deterministic series', () => {
  const res = post('/api/sim', { strategy0: 'greedy', strategy1: 'meta', matches: 50, seed: 7 });
  assert.equal(res.status, 200);
  const r = jsonOf(res);
  assert.equal(r.strategy0, 'greedy');
  assert.equal(r.strategy1, 'meta');
  assert.equal(r.matches, 50);
  assert.equal((r.wins0 as number) + (r.wins1 as number) + (r.draws as number), 50);
  const again = jsonOf(post('/api/sim', { strategy0: 'greedy', strategy1: 'meta', matches: 50, seed: 7 }));
  assert.deepEqual(again, r);
});

test('POST /api/sim rejects invalid strategies with 400', () => {
  const res = post('/api/sim', { strategy0: 'brainless', strategy1: 'meta', matches: 10 });
  assert.equal(res.status, 400);
  assert.match(res.body, /strategy/);
});

test('POST /api/sim rejects malformed JSON with 400', () => {
  const res = post('/api/sim', 'not json at all');
  assert.equal(res.status, 400);
});

test('POST /api/sim with no body is a 400', () => {
  const res = handle({ method: 'POST', url: '/api/sim' });
  assert.equal(res.status, 400);
});

test('POST /api/match returns a full replay trace', () => {
  const res = post('/api/match', { strategy0: 'greedy', strategy1: 'hoarder', seed: 20260804, seconds: 60 });
  assert.equal(res.status, 200);
  const t = jsonOf(res);
  assert.ok((t.events as unknown[]).length > 0, 'trace should have events');
  assert.ok((t.turns as number) >= 1);
  const [s0, s1] = t.score as [number, number];
  if (t.winner === 0) assert.ok(s0 > s1);
  if (t.winner === 1) assert.ok(s1 > s0);
  if (t.draw) assert.equal(s0, s1);
});

test('traceMatch is deterministic for the same seed', () => {
  const a = traceMatch('meta', 'greedy', { seed: 42, matchSeconds: 90 });
  const b = traceMatch('meta', 'greedy', { seed: 42, matchSeconds: 90 });
  assert.deepEqual(a, b);
});

test('POST /api/match rejects invalid strategy with 400', () => {
  const res = post('/api/match', { strategy0: 'greedy', strategy1: 'whale', seed: 1 });
  assert.equal(res.status, 400);
});

test('GET /health reports ok', () => {
  const res = get('/health');
  assert.equal(res.status, 200);
  assert.equal(jsonOf(res).ok, true);
});

test('unknown routes return 404', () => {
  assert.equal(get('/nope').status, 404);
  assert.equal(get('/api/nope').status, 404);
});

test('trace events carry weights, fuel and lane snapshots', () => {
  const t = traceMatch('greedy', 'hoarder', { seed: 3, matchSeconds: 45 });
  const ev = t.events[0];
  assert.ok(ev.weights.headline >= 0.5 && ev.weights.headline <= 1.5);
  assert.ok(ev.weights.media >= 0.5 && ev.weights.media <= 1.5);
  assert.ok(ev.weights.underground >= 0.5 && ev.weights.underground <= 1.5);
  assert.ok(Array.isArray(ev.fuel) && ev.fuel.length === 2);
  assert.ok(ev.lanes.headline && typeof ev.lanes.headline.base[0] === 'number');
  assert.ok(ev.t >= 1);
});
