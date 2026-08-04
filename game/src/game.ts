import type { Card, LaneId, PlayerState } from './types.ts';
import { LANES } from './types.ts';
import { updateElo } from './elo.ts';

export interface LaneCore {
  /** Base deployed power per player (0..1). Determines lane control. */
  base: [number, number];
  /** Charge built by holding the lane, per player. */
  charge: [number, number];
  /** Locked-in score, per player. Survives later control loss. */
  locked: [number, number];
}

export interface GameOptions {
  matchSeconds?: number;
  volatilityInterval?: number;
  lockMinCharge?: number;
  lockFuelCost?: number;
  offLanePenalty?: number;
  weightMin?: number;
  weightMax?: number;
  rng?: () => number;
}

export interface ResolvedOptions {
  matchSeconds: number;
  volatilityInterval: number;
  lockMinCharge: number;
  lockFuelCost: number;
  offLanePenalty: number;
  weightMin: number;
  weightMax: number;
  rng: () => number;
}

export interface MatchState {
  players: [PlayerState, PlayerState];
  lanes: Record<LaneId, LaneCore>;
  weights: Record<LaneId, number>;
  seconds: number;
  phase: 'playing' | 'ended';
  winner: 0 | 1 | null;
  opts: ResolvedOptions;
  log: string[];
}

export const DEFAULT_OPTIONS: ResolvedOptions = {
  matchSeconds: 180,
  volatilityInterval: 5,
  lockMinCharge: 3,
  lockFuelCost: 3,
  offLanePenalty: 2,
  weightMin: 0.5,
  weightMax: 1.5,
  rng: Math.random,
};

function resolveOptions(opts: GameOptions): ResolvedOptions {
  return { ...DEFAULT_OPTIONS, ...opts };
}

function emptyLane(): LaneCore {
  return { base: [0, 0], charge: [0, 0], locked: [0, 0] };
}

export function createMatch(hand0: Card[], hand1: Card[], opts: GameOptions = {}): MatchState {
  const players: [PlayerState, PlayerState] = [
    { id: 'p0', hand: [...hand0], fuel: 0, elo: 1200 },
    { id: 'p1', hand: [...hand1], fuel: 0, elo: 1200 },
  ];
  const lanes: Record<LaneId, LaneCore> = {
    headline: emptyLane(),
    media: emptyLane(),
    underground: emptyLane(),
  };
  const weights: Record<LaneId, number> = { headline: 1, media: 1, underground: 1 };
  return {
    players,
    lanes,
    weights,
    seconds: 0,
    phase: 'playing',
    winner: null,
    opts: resolveOptions(opts),
    log: ['match created'],
  };
}

/** Deployed base power — decides who holds the lane (the tug-of-war). */
export function lanePower(m: MatchState, lane: LaneId, playerIdx: 0 | 1): number {
  return m.lanes[lane].base[playerIdx];
}

/** Volatility-weighted lane value — (power + locked) × current lane weight. */
export function laneValue(m: MatchState, lane: LaneId, playerIdx: 0 | 1): number {
  return (m.lanes[lane].base[playerIdx] + m.lanes[lane].locked[playerIdx]) * m.weights[lane];
}

export function controller(m: MatchState, lane: LaneId): 0 | 1 | null {
  const a = lanePower(m, lane, 0);
  const b = lanePower(m, lane, 1);
  if (a === b) return null;
  return a > b ? 0 : 1;
}

function findCard(m: MatchState, playerIdx: 0 | 1, cardId: string): number {
  return m.players[playerIdx].hand.findIndex((c) => c.id === cardId);
}

export type ActionResult =
  | { ok: true; power?: number; fuel?: number; locked?: number }
  | { ok: false; reason: string };

export function deploy(m: MatchState, playerIdx: 0 | 1, cardId: string, targetLane?: LaneId): ActionResult {
  if (m.phase !== 'playing') return { ok: false, reason: 'match over' };
  const idx = findCard(m, playerIdx, cardId);
  if (idx === -1) return { ok: false, reason: 'card not in hand' };
  const card = m.players[playerIdx].hand[idx];
  const lane: LaneId = targetLane ?? card.lane;
  const offLane = lane !== card.lane;
  const power = Math.max(0, card.power - (offLane ? m.opts.offLanePenalty : 0));
  m.lanes[lane].base[playerIdx] += power;
  m.players[playerIdx].hand.splice(idx, 1);
  m.log.push(`p${playerIdx} deployed ${card.id} -> ${lane} (${power} power${offLane ? ', off-lane' : ''})`);
  return { ok: true, power };
}

export function burn(m: MatchState, playerIdx: 0 | 1, cardId: string): ActionResult {
  if (m.phase !== 'playing') return { ok: false, reason: 'match over' };
  const idx = findCard(m, playerIdx, cardId);
  if (idx === -1) return { ok: false, reason: 'card not in hand' };
  const card = m.players[playerIdx].hand[idx];
  m.players[playerIdx].hand.splice(idx, 1);
  m.players[playerIdx].fuel += card.fuel;
  m.log.push(`p${playerIdx} burned ${card.id} (+${card.fuel} fuel)`);
  return { ok: true, fuel: card.fuel };
}

export function volatilityTick(m: MatchState): Record<LaneId, number> {
  const { weightMin, weightMax, rng } = m.opts;
  for (const lane of LANES) {
    const w = weightMin + rng() * (weightMax - weightMin);
    m.weights[lane] = Math.round(w * 100) / 100;
  }
  m.log.push(`volatility swing: ${JSON.stringify(m.weights)}`);
  return { ...m.weights };
}

export function advance(m: MatchState, seconds: number): { volatilityTicks: number } {
  let volatilityTicks = 0;
  for (let s = 0; s < seconds && m.phase === 'playing'; s++) {
    m.seconds += 1;
    // Hold-to-charge: whoever controls a lane builds charge every second.
    for (const lane of LANES) {
      const c = controller(m, lane);
      if (c !== null) m.lanes[lane].charge[c] += 1;
    }
    if (m.seconds % m.opts.volatilityInterval === 0) {
      volatilityTick(m);
      volatilityTicks += 1;
    }
    if (m.seconds >= m.opts.matchSeconds) endMatch(m);
  }
  return { volatilityTicks };
}

export function lock(m: MatchState, playerIdx: 0 | 1, lane: LaneId): ActionResult {
  if (m.phase !== 'playing') return { ok: false, reason: 'match over' };
  if (controller(m, lane) !== playerIdx) return { ok: false, reason: 'lane not controlled' };
  const ls = m.lanes[lane];
  if (ls.charge[playerIdx] < m.opts.lockMinCharge) return { ok: false, reason: 'charge too low' };
  if (m.players[playerIdx].fuel < m.opts.lockFuelCost) return { ok: false, reason: 'fuel too low' };
  const gained = ls.charge[playerIdx];
  ls.locked[playerIdx] += gained;
  ls.charge[playerIdx] = 0;
  m.players[playerIdx].fuel -= m.opts.lockFuelCost;
  m.log.push(`p${playerIdx} locked ${lane} (+${gained} locked, -${m.opts.lockFuelCost} fuel)`);
  return { ok: true, locked: gained };
}

/** Total match score per player: Σ (power + locked) × lane weight. */
export function matchScore(m: MatchState): [number, number] {
  const score: [number, number] = [0, 0];
  for (const lane of LANES) {
    score[0] += laneValue(m, lane, 0);
    score[1] += laneValue(m, lane, 1);
  }
  return score;
}

export function endMatch(m: MatchState): { winner: 0 | 1 | null; draw: boolean; score: [number, number] } {
  const score = matchScore(m);
  const draw = score[0] === score[1];
  const winner: 0 | 1 | null = draw ? null : score[0] > score[1] ? 0 : 1;
  m.winner = winner;
  m.phase = 'ended';
  m.log.push(`match ended: ${draw ? 'draw' : `p${winner} wins`} ${score[0]}-${score[1]}`);
  return { winner, draw, score };
}

/** Apply ELO after a finished match (draw splits). Mutates player ratings, returns new pair. */
export function applyElo(m: MatchState, k = 32): [number, number] {
  const outcome: 0 | 0.5 | 1 = m.phase !== 'ended' || m.winner === null ? 0.5 : m.winner === 0 ? 1 : 0;
  const [a, b] = updateElo(m.players[0].elo, m.players[1].elo, outcome, k);
  m.players[0].elo = a;
  m.players[1].elo = b;
  return [a, b];
}
