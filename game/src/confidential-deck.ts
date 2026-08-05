// ConfidentialDeck — hidden-hand commitment module (PAPER TRAIL x Inco Summer Game Jam)
// Zero-dependency TypeScript, erasable syntax only (node --experimental-strip-types).
// Mirrors the fhEVM contract surface planned for Day 1 of the jam plan:
//   commitHand  -> encrypted (sealed) commitment; no path exposes it without owner key
//   peekHand    -> owner-only view (simulates TFHE re-encryption gate)
//   playCard    -> the single reveal/decryption event (reveal-on-play)
// The sealed boundary here is what an Inco Lightning contract enforces on-chain.

export type PlayerId = string;

export interface CardRef {
  id: number; // GENESIS 77 edition 1..77
  lane: 'headline' | 'media' | 'underground';
}

export interface RevealEvent {
  player: PlayerId;
  card: CardRef;
  lane: string;
  atTick: number;
}

interface SealedHand {
  owner: PlayerId;
  cardIds: number[];
  revealed: Set<number>;
}

export class ConfidentialDeck {
  private sealed: Map<PlayerId, SealedHand> = new Map();
  private deck: CardRef[];

  constructor(deck: CardRef[]) {
    this.deck = deck;
  }

  // Owner commits their drawn card ids. The hand is sealed from this point:
  // every read path requires the owner key.
  commitHand(owner: PlayerId, cardIds: number[]): void {
    if (this.sealed.has(owner)) {
      throw new Error('hand already committed for ' + owner);
    }
    const seen = new Set<number>();
    for (const id of cardIds) {
      if (!this.deck.some((c) => c.id === id)) {
        throw new Error('card ' + id + ' not in deck');
      }
      if (seen.has(id)) {
        throw new Error('duplicate card ' + id);
      }
      seen.add(id);
    }
    this.sealed.set(owner, { owner, cardIds: [...cardIds], revealed: new Set() });
  }

  // Simulated TFHE gate: without the owner key, sealed state is unreadable.
  private hand(owner: PlayerId, key: string): SealedHand {
    const h = this.sealed.get(owner);
    if (!h) {
      throw new Error('no sealed hand for ' + owner);
    }
    if (key !== 'key:' + owner) {
      throw new Error('access denied: not the hand owner');
    }
    return h;
  }

  // Owner-only view of the still-hidden portion of their hand.
  peekHand(owner: PlayerId, key: string): number[] {
    const h = this.hand(owner, key);
    return h.cardIds.filter((id) => !h.revealed.has(id));
  }

  handSize(owner: PlayerId, key: string): number {
    return this.peekHand(owner, key).length;
  }

  // The single decryption event: a card leaves the hidden state and hits the table.
  playCard(owner: PlayerId, key: string, cardId: number, atTick: number): RevealEvent {
    const h = this.hand(owner, key);
    if (h.revealed.has(cardId)) {
      throw new Error('card ' + cardId + ' already played');
    }
    if (h.cardIds.indexOf(cardId) === -1) {
      throw new Error('card ' + cardId + ' not in hand');
    }
    h.revealed.add(cardId);
    const card = this.deck.find((c) => c.id === cardId);
    if (!card) {
      throw new Error('card ' + cardId + ' missing from deck reference');
    }
    return { player: owner, card, lane: card.lane, atTick };
  }

  isSealed(owner: PlayerId): boolean {
    return this.sealed.has(owner);
  }

  revealedCount(owner: PlayerId): number {
    return this.sealed.get(owner)?.revealed.size ?? 0;
  }
}

// Deterministic blind draft: draw `count` distinct ids from the starter pool.
// Same mulberry32 shape as src/sim.ts so series stay reproducible.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawStarterHand(rng: () => number, starterIds: number[], count: number): number[] {
  const pool = [...starterIds];
  const out: number[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const j = Math.floor(rng() * pool.length);
    out.push(pool.splice(j, 1)[0]);
  }
  return out;
}
