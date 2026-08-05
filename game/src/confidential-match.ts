// ConfidentialMatch — sealed hands, reveal-on-play, wrapped around the 3-lane tug-of-war
// (PAPER TRAIL x Inco Summer Game Jam, Day 2 integration)
//
// Story: each player's hand is committed SEALED (ConfidentialDeck). No API path exposes
// hand contents without the owner key — the exact surface an Inco Lightning / fhEVM contract
// enforces on-chain. The single decryption event is playCard: a card leaves the hidden state
// and lands on a lane, where it joins the normal game.ts tug-of-war (power, off-lane penalty,
// charge/lock, volatility, ELO).
//
// Bridge: game.ts Card.id is a string; ConfidentialDeck editions are 1..N. This module maps
// array position + 1 -> edition, so the deck array is the single source of truth.

import type { Card, LaneId } from './types.ts';
import { createMatch, advance, endMatch, applyElo, lanePower, controller } from './game.ts';
import type { MatchState } from './game.ts';
import { ConfidentialDeck, mulberry32, drawStarterHand } from './confidential-deck.ts';
import type { RevealEvent } from './confidential-deck.ts';

export type PlayerIdx = 0 | 1;

export interface ConfidentialMatchOptions {
  /** Match length in seconds (defaults to game.ts 180). */
  matchSeconds?: number;
  /** Seed for the deterministic blind draft. */
  seed?: number;
  /** Cards drafted per player (defaults to 5). */
  handSize?: number;
}

export interface SecretPlayResult {
  ok: true;
  card: Card;
  lane: LaneId;
  power: number;
  offLane: boolean;
  revealedCount: number;
  hiddenLeft: number;
}

export class ConfidentialMatch {
  readonly cd: ConfidentialDeck;
  readonly match: MatchState;
  readonly revealLog: RevealEvent[];

  private readonly cards: Card[];
  private readonly editionById: Map<number, Card>;
  private readonly handSize: number;

  constructor(cards: Card[], starterIds: number[], opts: ConfidentialMatchOptions = {}) {
    if (cards.length === 0) throw new Error('empty deck');
    if (starterIds.length === 0) throw new Error('empty starter pool');
    this.cards = cards;
    this.handSize = opts.handSize ?? 5;
    this.editionById = new Map(cards.map((c, i) => [i + 1, c]));
    const refs = cards.map((c, i) => ({ id: i + 1, lane: c.lane }));
    this.cd = new ConfidentialDeck(refs);
    this.match = createMatch([], [], { matchSeconds: opts.matchSeconds });
    const rng = mulberry32(opts.seed ?? 1);
    const h0 = drawStarterHand(rng, starterIds, this.handSize);
    const h1 = drawStarterHand(rng, starterIds, this.handSize);
    this.cd.commitHand(this.ownerId(0), h0);
    this.cd.commitHand(this.ownerId(1), h1);
    this.revealLog = [];
  }

  /** Owner id as the ConfidentialDeck sees it. */
  ownerId(playerIdx: PlayerIdx): string {
    return this.match.players[playerIdx].id;
  }

  /** Simulated TFHE owner key (format defined by ConfidentialDeck). */
  keyOf(playerIdx: PlayerIdx): string {
    return 'key:' + this.ownerId(playerIdx);
  }

  /** Cards still hidden in a player's sealed hand (owner-gated: throws without the key). */
  hiddenCards(playerIdx: PlayerIdx, key: string): number[] {
    return this.cd.peekHand(this.ownerId(playerIdx), key);
  }

  hiddenCount(playerIdx: PlayerIdx, key: string): number {
    return this.hiddenCards(playerIdx, key).length;
  }

  revealedCount(playerIdx: PlayerIdx): number {
    return this.cd.revealedCount(this.ownerId(playerIdx));
  }

  /** Reveal-on-play: the single decrypt event. The card lands on a lane and joins the tug-of-war. */
  play(playerIdx: PlayerIdx, key: string, edition: number, atTick: number, targetLane?: LaneId): SecretPlayResult {
    if (this.match.phase !== 'playing') throw new Error('match over');
    if (atTick > this.match.seconds) throw new Error('reveal after current tick');
    const owner = this.ownerId(playerIdx);
    const reveal = this.cd.playCard(owner, key, edition, atTick);
    const card = this.editionById.get(edition);
    if (!card) throw new Error('edition ' + edition + ' missing from deck');
    const lane: LaneId = targetLane ?? card.lane;
    const offLane = lane !== card.lane;
    const power = Math.max(0, card.power - (offLane ? this.match.opts.offLanePenalty : 0));
    this.match.lanes[lane].base[playerIdx] += power;
    this.match.log.push('p' + playerIdx + ' revealed ' + card.name + ' -> ' + lane + ' (' + power + ' power' + (offLane ? ', off-lane' : '') + ')');
    this.revealLog.push(reveal);
    return {
      ok: true,
      card,
      lane,
      power,
      offLane,
      revealedCount: this.cd.revealedCount(owner),
      hiddenLeft: this.hiddenCount(playerIdx, key),
    };
  }

  /** Lane controller from raw power (game.ts tug-of-war). */
  laneController(lane: LaneId): PlayerIdx | null {
    return controller(this.match, lane);
  }

  /** Revealed base power of a player on a lane. */
  powerOn(playerIdx: PlayerIdx, lane: LaneId): number {
    return lanePower(this.match, lane, playerIdx);
  }

  /** Run the clock: charge builds on controlled lanes, volatility swings, match may end. */
  tick(seconds: number): { volatilityTicks: number } {
    return advance(this.match, seconds);
  }

  /** Run to the end of the match and settle ELO. */
  finish(): { winner: 0 | 1 | null; draw: boolean; score: [number, number]; elo: [number, number] } {
    if (this.match.phase === 'playing' && this.match.seconds < this.match.opts.matchSeconds) {
      advance(this.match, this.match.opts.matchSeconds - this.match.seconds);
    }
    const ended = endMatch(this.match);
    const elo = applyElo(this.match);
    return { winner: ended.winner, draw: ended.draw, score: ended.score, elo };
  }
}
