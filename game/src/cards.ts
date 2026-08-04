import type { Card } from './types.ts';

export const STARTER_DECK: Card[] = [
  // The Headline
  { id: 'h01', name: "The Shredder's First Meal", lane: 'headline', type: 'scandal', power: 8, fuel: 4, volatility: 90 },
  { id: 'h02', name: 'A Headline Nobody Can Verify', lane: 'headline', type: 'fabrication', power: 5, fuel: 3, volatility: 80 },
  { id: 'h03', name: 'Market Panic, Manufactured', lane: 'headline', type: 'scandal', power: 7, fuel: 2, volatility: 95 },
  { id: 'h04', name: 'Scoop of the Century (Allegedly)', lane: 'headline', type: 'spin', power: 4, fuel: 4, volatility: 70 },
  { id: 'h05', name: 'The Anonymous Source, On the Record', lane: 'headline', type: 'leak', power: 6, fuel: 3, volatility: 60 },
  { id: 'h06', name: 'Front Page Fever', lane: 'headline', type: 'satire', power: 3, fuel: 5, volatility: 50 },
  // The Media
  { id: 'm01', name: 'The Amplifier', lane: 'media', type: 'spin', power: 6, fuel: 3, volatility: 40 },
  { id: 'm02', name: 'Echo Chamber Choir', lane: 'media', type: 'satire', power: 5, fuel: 4, volatility: 55 },
  { id: 'm03', name: 'Hot Take, Cold Truth', lane: 'media', type: 'satire', power: 4, fuel: 4, volatility: 65 },
  { id: 'm04', name: 'Narrative Arbitrage', lane: 'media', type: 'spin', power: 7, fuel: 2, volatility: 45 },
  { id: 'm05', name: 'Spinsplainer', lane: 'media', type: 'spin', power: 3, fuel: 5, volatility: 35 },
  { id: 'm06', name: 'Satire, Labeled Real', lane: 'media', type: 'fabrication', power: 5, fuel: 3, volatility: 75 },
  // The Underground
  { id: 'u01', name: 'The Hidden Ledger', lane: 'underground', type: 'leak', power: 7, fuel: 3, volatility: 50 },
  { id: 'u02', name: 'Off the Record (Everything)', lane: 'underground', type: 'leak', power: 6, fuel: 4, volatility: 60 },
  { id: 'u03', name: 'The Deniable File', lane: 'underground', type: 'fabrication', power: 5, fuel: 5, volatility: 70 },
  { id: 'u04', name: 'Black Market Meme', lane: 'underground', type: 'satire', power: 4, fuel: 4, volatility: 80 },
  { id: 'u05', name: 'Whistleblower, Silenced', lane: 'underground', type: 'scandal', power: 8, fuel: 2, volatility: 85 },
  { id: 'u06', name: 'Shadow Edit', lane: 'underground', type: 'spin', power: 3, fuel: 5, volatility: 90 },
];

/** Deal a random hand from the starter deck. */
export function starterHand(size = 6, rng: () => number = Math.random): Card[] {
  const deck = [...STARTER_DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, size);
}
