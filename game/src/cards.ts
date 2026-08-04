import type { Card } from './types.ts';

/** The 18 starter cards — one per presale edition, 6 per lane. */
export const STARTER_DECK: Card[] = [
  { id: "h01", name: "The Shredder's First Meal", lane: "headline", type: "scandal", power: 8, fuel: 4, volatility: 90 },
  { id: "h02", name: "A Headline Nobody Can Verify", lane: "headline", type: "fabrication", power: 5, fuel: 3, volatility: 80 },
  { id: "h03", name: "Market Panic, Manufactured", lane: "headline", type: "scandal", power: 7, fuel: 2, volatility: 95 },
  { id: "h04", name: "Scoop of the Century (Allegedly)", lane: "headline", type: "spin", power: 4, fuel: 4, volatility: 70 },
  { id: "h05", name: "The Anonymous Source, On the Record", lane: "headline", type: "leak", power: 6, fuel: 3, volatility: 60 },
  { id: "h06", name: "Front Page Fever", lane: "headline", type: "satire", power: 3, fuel: 5, volatility: 50 },
  { id: "m01", name: "The Apology That Was a Threat", lane: "media", type: "satire", power: 5, fuel: 3, volatility: 75 },
  { id: "m02", name: "Pump Signal, Straight to Voicemail", lane: "media", type: "news", power: 4, fuel: 5, volatility: 45 },
  { id: "m03", name: "Clickbait Cartel", lane: "media", type: "satire", power: 6, fuel: 4, volatility: 58 },
  { id: "m04", name: "Screaming Headline, No Sources", lane: "media", type: "news", power: 7, fuel: 3, volatility: 90 },
  { id: "m05", name: "The Retraction That Wasn't", lane: "media", type: "spin", power: 6, fuel: 3, volatility: 66 },
  { id: "m06", name: "Editor's Choice: Chaos", lane: "media", type: "satire", power: 5, fuel: 4, volatility: 50 },
  { id: "u01", name: "The Doxxed Pseudonym", lane: "underground", type: "leak", power: 7, fuel: 4, volatility: 80 },
  { id: "u02", name: "Liquidity Pool, Meet Cold Pool", lane: "underground", type: "meme", power: 6, fuel: 2, volatility: 65 },
  { id: "u03", name: "The Shredder's Appetite", lane: "underground", type: "rumor", power: 5, fuel: 2, volatility: 70 },
  { id: "u04", name: "Zero-Knowledge Alibi", lane: "underground", type: "leak", power: 8, fuel: 4, volatility: 85 },
  { id: "u05", name: "Gas Fee Guilt Trip", lane: "underground", type: "meme", power: 4, fuel: 5, volatility: 40 },
  { id: "u06", name: "Whale Watching You Watch", lane: "underground", type: "rumor", power: 7, fuel: 5, volatility: 74 },
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
