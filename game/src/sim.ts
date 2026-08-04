import type { Card, LaneId } from './types.ts';
import { LANES } from './types.ts';
import {
  createMatch, deploy, burn, lock, advance, endMatch, applyElo,
  controller, type MatchState,
} from './game.ts';
import { starterHand } from './cards.ts';

export type BotStrategy = 'greedy' | 'meta' | 'meta2' | 'hoarder';

export interface SimOptions {
  handSize?: number;
  matchSeconds?: number;
  volatilityInterval?: number;
  decisionInterval?: number;
  startElo?: [number, number];
  offLanePenalty?: number;
  weightMin?: number;
  weightMax?: number;
  rng?: () => number;
}

export interface SimResult {
  winner: 0 | 1 | null;
  draw: boolean;
  score: [number, number];
  elo: [number, number];
  deployed: [number, number];
  burned: [number, number];
  locked: [number, number];
  turns: number;
}

/** Deterministic PRNG (mulberry32). Same seed -> same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Action =
  | { kind: 'lock'; lane: LaneId }
  | { kind: 'deploy'; cardId: string; lane: LaneId }
  | { kind: 'burn'; cardId: string }
  | { kind: 'pass' };

export function chooseAction(m: MatchState, idx: 0 | 1, strategy: BotStrategy): Action {
  const p = m.players[idx];
  // 1) Lock the most valuable controlled lane we can afford.
  if (p.fuel >= m.opts.lockFuelCost) {
    let best: LaneId | null = null;
    for (const lane of LANES) {
      if (controller(m, lane) !== idx) continue;
      if (m.lanes[lane].charge[idx] < m.opts.lockMinCharge) continue;
      if (best === null || m.weights[lane] > m.weights[best]) best = lane;
    }
    if (best !== null) return { kind: 'lock', lane: best };
  }
  // 2) Deploy candidates — greedy only plays native lane; meta reads the weights.
  type Candidate = { card: Card; lane: LaneId; power: number; value: number };
  const candidates: Candidate[] = [];
  for (const card of p.hand) {
    const lanes: LaneId[] = strategy === 'greedy' ? [card.lane] : LANES;
    for (const lane of lanes) {
      const offLane = lane !== card.lane;
      const penalty = offLane ? m.opts.offLanePenalty : 0;
      const power = Math.max(0, card.power - penalty);
      // meta2: off-lane plays are only considered when they would take control
      // of the target lane (deployed power must exceed the opponent's there).
      if (strategy === 'meta2' && offLane) {
        const theirs = m.lanes[lane].base[idx === 0 ? 1 : 0];
        if (m.lanes[lane].base[idx] + power <= theirs) continue;
      }
      candidates.push({ card, lane, power, value: power * m.weights[lane] });
    }
  }
  if (candidates.length === 0) return { kind: 'pass' };
  candidates.sort((a, b) => b.value - a.value);
  const best = candidates[0];
  // Hoarder stocks fuel before committing to big plays.
  if (strategy === 'hoarder' && p.hand.length > 3 && p.fuel < m.opts.lockFuelCost * 2) {
    const juicy = [...p.hand].sort(
      (a, b) => b.fuel / Math.max(1, b.power) - a.fuel / Math.max(1, a.power)
    )[0];
    if (juicy.fuel >= best.value * 0.5) return { kind: 'burn', cardId: juicy.id };
  }
  if (best.value >= 1.2) return { kind: 'deploy', cardId: best.card.id, lane: best.lane };
  // The meta hates your hand — feed the shredder the weakest card.
  const worst = [...p.hand].sort((a, b) => a.power * m.weights[a.lane] - b.power * m.weights[b.lane])[0];
  return { kind: 'burn', cardId: worst.id };
}

export function playMatch(
  strategy0: BotStrategy,
  strategy1: BotStrategy,
  opts: SimOptions = {}
): SimResult {
  const rng = opts.rng ?? Math.random;
  const handSize = opts.handSize ?? 6;
  const engineOpts: Record<string, number | (() => number)> = {
    matchSeconds: opts.matchSeconds ?? 180,
    volatilityInterval: opts.volatilityInterval ?? 5,
    rng,
  };
  for (const k of ['offLanePenalty', 'weightMin', 'weightMax'] as const) {
    if (opts[k] !== undefined) engineOpts[k] = opts[k];
  }
  const m = createMatch(starterHand(handSize, rng), starterHand(handSize, rng), engineOpts);
  if (opts.startElo) {
    m.players[0].elo = opts.startElo[0];
    m.players[1].elo = opts.startElo[1];
  }
  const interval = opts.decisionInterval ?? 3;
  const deployed: [number, number] = [0, 0];
  const burned: [number, number] = [0, 0];
  const locked: [number, number] = [0, 0];
  const strategies: [BotStrategy, BotStrategy] = [strategy0, strategy1];
  let turns = 0;
  while (m.phase === 'playing') {
    const step = Math.min(interval, m.opts.matchSeconds - m.seconds);
    advance(m, step);
    if (m.phase !== 'playing') break;
    for (const idx of [0, 1] as const) {
      const act = chooseAction(m, idx, strategies[idx]);
      if (act.kind === 'lock') {
        if (lock(m, idx, act.lane).ok) locked[idx]++;
      } else if (act.kind === 'deploy') {
        if (deploy(m, idx, act.cardId, act.lane).ok) deployed[idx]++;
      } else if (act.kind === 'burn') {
        if (burn(m, idx, act.cardId).ok) burned[idx]++;
      }
    }
    turns++;
  }
  const { winner, draw, score } = endMatch(m);
  const elo = applyElo(m);
  return { winner, draw, score, elo, deployed, burned, locked, turns };
}

export interface SeriesResult {
  strategy0: BotStrategy;
  strategy1: BotStrategy;
  matches: number;
  wins0: number;
  wins1: number;
  draws: number;
  eloStart: [number, number];
  eloEnd: [number, number];
  totalBurned: [number, number];
  totalLocked: [number, number];
}

export function runSeries(
  strategy0: BotStrategy,
  strategy1: BotStrategy,
  n: number,
  opts: SimOptions & { seed?: number } = {}
): SeriesResult {
  const seed = opts.seed ?? 20260804;
  let elo: [number, number] = [1200, 1200];
  const totalBurned: [number, number] = [0, 0];
  const totalLocked: [number, number] = [0, 0];
  let wins0 = 0;
  let wins1 = 0;
  let draws = 0;
  for (let i = 0; i < n; i++) {
    const rng = mulberry32(seed + i);
    const res = playMatch(strategy0, strategy1, { ...opts, rng, startElo: elo });
    if (res.winner === 0) wins0++;
    else if (res.winner === 1) wins1++;
    else draws++;
    totalBurned[0] += res.burned[0];
    totalBurned[1] += res.burned[1];
    totalLocked[0] += res.locked[0];
    totalLocked[1] += res.locked[1];
    elo = res.elo;
  }
  return {
    strategy0, strategy1, matches: n, wins0, wins1, draws,
    eloStart: [1200, 1200], eloEnd: elo, totalBurned, totalLocked,
  };
}
