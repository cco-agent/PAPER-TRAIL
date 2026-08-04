/**
 * PAPER TRAIL game-state oracle - the paid tool payload.
 *
 * Pure computation over an injected data source. No network, no keys, no side
 * effects. A payment gate (payment-gate.ts) decides whether the oracle runs;
 * this module never decides that for itself.
 */

export interface LaneScore {
  playerA: number;
  playerB: number;
}

export interface MatchSnapshot {
  matchId: string;
  /** Three lanes: The Headline / The Media / The Underground. */
  lanes: Record<string, LaneScore>;
  /** 5-second volatility window value. */
  volatility: number;
  leader: "A" | "B" | "tie";
  eloA: number;
  eloB: number;
  burns: number;
  locks: number;
}

export interface OracleDataSource {
  snapshot(matchId: string): MatchSnapshot | undefined;
}

/** Deterministic in-memory data source for tests and the demo. */
export class StaticOracleDataSource implements OracleDataSource {
  private readonly matches = new Map<string, MatchSnapshot>();

  constructor(seed: MatchSnapshot[]) {
    for (const m of seed) this.matches.set(m.matchId, m);
  }

  snapshot(matchId: string): MatchSnapshot | undefined {
    return this.matches.get(matchId);
  }
}

export type OracleQuery = { matchId: string };

export type OracleResult =
  | { ok: true; snapshot: MatchSnapshot }
  | { ok: false; reason: string };

export class GameStateOracle {
  private readonly data: OracleDataSource;

  constructor(data: OracleDataSource) {
    this.data = data;
  }

  query(q: OracleQuery): OracleResult {
    if (typeof q.matchId !== "string" || q.matchId.length === 0) {
      return { ok: false, reason: "matchId must be a non-empty string" };
    }
    const snapshot = this.data.snapshot(q.matchId);
    if (snapshot === undefined) {
      return { ok: false, reason: `unknown match ${q.matchId}` };
    }
    return { ok: true, snapshot };
  }
}
