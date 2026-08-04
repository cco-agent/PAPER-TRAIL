import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_DECK } from './cards.ts';
import {
  createMatch,
  deploy,
  burn,
  controller,
  lanePower,
  laneValue,
  matchScore,
  volatilityTick,
  advance,
  lock,
  endMatch,
  applyElo,
} from './game.ts';
import { expectedScore, updateElo } from './elo.ts';
import { LANES } from './types.ts';

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function deck(ids: string[]) {
  const byId = new Map(STARTER_DECK.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => c !== undefined);
}

test('createMatch initializes empty lanes and neutral weights', () => {
  const m = createMatch([], []);
  for (const lane of LANES) {
    assert.equal(m.lanes[lane].base[0], 0);
    assert.equal(m.lanes[lane].base[1], 0);
    assert.equal(m.weights[lane], 1);
  }
  assert.equal(m.seconds, 0);
  assert.equal(m.phase, 'playing');
  assert.equal(m.winner, null);
});

test('deploy on-lane adds base power and removes the card from hand', () => {
  const m = createMatch(deck(['h01']), []);
  const res = deploy(m, 0, 'h01');
  assert.ok(res.ok);
  assert.equal(lanePower(m, 'headline', 0), 8);
  assert.equal(m.players[0].hand.length, 0);
});

test('off-lane deploy pays the penalty', () => {
  const card = deck(['m01'])[0];
  const m = createMatch(deck(['m01']), []);
  const res = deploy(m, 0, 'm01', 'headline');
  assert.ok(res.ok);
  // m01 power - 2 penalty (stats from canonical metadata)
  assert.equal(lanePower(m, 'headline', 0), card.power - 2);
});

test('deploy rejects unknown cards and post-end deploys', () => {
  const m = createMatch([], []);
  assert.equal(deploy(m, 0, 'h01').ok, false);
  const m2 = createMatch(deck(['h01']), []);
  endMatch(m2);
  assert.equal(deploy(m2, 0, 'h01').ok, false);
});

test('controller resolves by deployed power and null on tie', () => {
  const m = createMatch(deck(['h01']), deck(['h03'])); // 8 vs 7
  deploy(m, 0, 'h01');
  deploy(m, 1, 'h03');
  assert.equal(controller(m, 'headline'), 0);
  const m2 = createMatch(deck(['h01']), deck(['h01']));
  deploy(m2, 0, 'h01');
  deploy(m2, 1, 'h01');
  assert.equal(controller(m2, 'headline'), null);
});

test('burn adds fuel and removes the card; unknown card rejected', () => {
  const m = createMatch(deck(['h06']), []);
  const res = burn(m, 0, 'h06');
  assert.ok(res.ok);
  assert.equal(m.players[0].fuel, 5);
  assert.equal(m.players[0].hand.length, 0);
  assert.equal(burn(m, 0, 'h06').ok, false);
});

test('volatilityTick re-weights lanes deterministically within bounds', () => {
  const mk = () => createMatch([], [], { rng: seeded(42), weightMin: 0.5, weightMax: 1.5 });
  const m = mk();
  const w = volatilityTick(m);
  for (const lane of LANES) {
    assert.ok(w[lane] >= 0.5 && w[lane] <= 1.5, `weight ${w[lane]}`);
  }
  assert.deepEqual(volatilityTick(mk()), w);
});

test('volatility re-weights lane values and can flip the match', () => {
  const m = createMatch(deck(['h01']), deck(['u04'])); // 8 vs 8 at weight 1:1:1
  deploy(m, 0, 'h01');
  deploy(m, 1, 'u04');
  assert.deepEqual(matchScore(m), [8, 8]);
  m.weights.headline = 1.5; // p0's lane suddenly the whole game
  m.weights.underground = 0.5;
  const s = matchScore(m);
  assert.equal(s[0], 12);
  assert.equal(s[1], 4);
  assert.equal(laneValue(m, 'headline', 0), 12);
  // revert the swing: now p1's lane is the whole game
  m.weights.headline = 0.5;
  m.weights.underground = 1.5;
  const s2 = matchScore(m);
  assert.equal(s2[0], 4);
  assert.equal(s2[1], 12);
});

test('advance accrues charge to the controller per second', () => {
  const m = createMatch(deck(['h01']), []);
  deploy(m, 0, 'h01');
  advance(m, 3);
  assert.equal(m.seconds, 3);
  assert.equal(m.lanes.headline.charge[0], 3);
  assert.equal(m.lanes.headline.charge[1], 0);
});

test('advance triggers volatility at the configured interval', () => {
  const m = createMatch([], [], { volatilityInterval: 2, rng: seeded(7) });
  const { volatilityTicks } = advance(m, 5);
  assert.equal(volatilityTicks, 2); // at seconds 2 and 4
  assert.equal(m.seconds, 5);
});

test('lock requires control, charge and fuel; converts charge into locked score', () => {
  const m = createMatch(deck(['h01', 'h06']), []);
  deploy(m, 0, 'h01');
  burn(m, 0, 'h06'); // +5 fuel
  advance(m, 3); // charge 3
  const res = lock(m, 0, 'headline');
  assert.ok(res.ok);
  assert.equal(m.lanes.headline.locked[0], 3);
  assert.equal(m.lanes.headline.charge[0], 0);
  assert.equal(m.players[0].fuel, 2); // 5 - 3 cost
});

test('lock fails without control', () => {
  const m = createMatch(deck(['h01']), []);
  deploy(m, 0, 'h01');
  advance(m, 3);
  assert.equal(lock(m, 1, 'headline').ok, false);
});

test('lock fails when fuel is too low', () => {
  const m = createMatch(deck(['h01']), []);
  deploy(m, 0, 'h01');
  advance(m, 3); // charge 3 but fuel 0
  assert.equal(lock(m, 0, 'headline').ok, false);
});

test('lock fails when charge is below the minimum', () => {
  const m = createMatch(deck(['h01', 'h06']), []);
  deploy(m, 0, 'h01');
  burn(m, 0, 'h06');
  advance(m, 2); // charge 2 < 3
  assert.equal(lock(m, 0, 'headline').ok, false);
});

test('endMatch scores weighted lane values and picks a winner', () => {
  const m = createMatch(deck(['h01']), deck(['h03'])); // 8 vs 7
  deploy(m, 0, 'h01');
  deploy(m, 1, 'h03');
  const { winner, draw, score } = endMatch(m);
  assert.equal(winner, 0);
  assert.equal(draw, false);
  assert.deepEqual(score, [8, 7]);
  assert.equal(m.phase, 'ended');
});

test('endMatch declares a draw on equal scores', () => {
  const m = createMatch(deck(['h01']), deck(['h01']));
  deploy(m, 0, 'h01');
  deploy(m, 1, 'h01');
  const { winner, draw } = endMatch(m);
  assert.equal(winner, null);
  assert.equal(draw, true);
});

test('mini-match: burn, deploy, hold, lock, end — full loop', () => {
  const m = createMatch(deck(['h01', 'h06']), deck(['h03']), {
    matchSeconds: 6,
    volatilityInterval: 2,
    lockMinCharge: 1,
    lockFuelCost: 1,
    rng: seeded(1),
  });
  deploy(m, 0, 'h01'); // p0 takes The Headline
  burn(m, 0, 'h06'); // +5 fuel
  advance(m, 2); // charge 2 on headline
  lock(m, 0, 'headline'); // locked 2, fuel 4
  advance(m, 4); // ends at 6s
  assert.equal(m.phase, 'ended');
  assert.equal(m.winner, 0);
  assert.ok(m.lanes.headline.locked[0] >= 2);
});

test('applyElo updates ratings after a decided match', () => {
  const m = createMatch([], []);
  const r = endMatch(m);
  assert.equal(r.winner, null);
  const [a, b] = applyElo(m);
  assert.deepEqual([a, b], [1200, 1200]); // draw splits
});

test('elo: expectedScore is the standard logistic', () => {
  assert.equal(expectedScore(1200, 1200), 0.5);
  const e = expectedScore(1200, 1400);
  assert.ok(Math.abs(e - 1 / (1 + 10 ** (200 / 400))) < 1e-9);
});

test('elo: winner gains, loser loses, draw splits (K=32)', () => {
  assert.deepEqual(updateElo(1200, 1200, 1), [1216, 1184]);
  assert.deepEqual(updateElo(1200, 1200, 0), [1184, 1216]);
  assert.deepEqual(updateElo(1200, 1200, 0.5), [1200, 1200]);
});

test('elo: upset hurts the favorite more than an expected loss', () => {
  const [a1, b1] = updateElo(1200, 1500, 1); // 1200 beats 1500 (upset)
  const [a2, b2] = updateElo(1500, 1200, 1); // 1500 beats 1200 (expected)
  assert.ok(a1 - 1200 > a2 - 1500); // underdog gain > favorite gain
  assert.ok(b1 > b2); // losing favorite drops more than losing underdog
  assert.ok(b1 < 1500 && b2 < 1200);
});
