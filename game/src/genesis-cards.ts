import type { Card, CardType, LaneId } from './types.ts';

export type Rarity = 'common' | 'rare' | 'uncommon' | 'epic' | 'legendary';

export interface GenesisCard extends Card {
  /** 1..77 — the numbered edition of the founding cohort. */
  edition: number;
  rarity: Rarity;
  /** One-line lore. Also feeds the cNFT description. */
  flavor: string;
}

export const GENESIS_SET_SIZE = 77;

export const GENESIS_RARITY_COUNTS: Record<Rarity, number> = {
  common: 23,
  rare: 22,
  uncommon: 13,
  epic: 14,
  legendary: 5,
};

/**
 * The GENESIS 77 founding set — 77 numbered cards (Editions 1/77..77/77),
 * one per slot in the presale. Regenerated 2026-08-04 from the canonical
 * cNFT metadata (genesis77/cards/*.json) so the playable set matches what
 * presale buyers actually receive. The 18 starter-deck cards appear here
 * with identical ids/stats, so the playable deck is a strict subset.
 */
export const GENESIS_CARDS: GenesisCard[] = [
  { id: "h01", edition: 1, rarity: "legendary", name: "The Shredder's First Meal", lane: "headline", type: "scandal", power: 8, fuel: 4, volatility: 90, flavor: "The first meal of the machine that eats headlines." },
  { id: "h02", edition: 2, rarity: "rare", name: "A Headline Nobody Can Verify", lane: "headline", type: "fabrication", power: 5, fuel: 3, volatility: 80, flavor: "It says a lot. It means nothing. It gets printed anyway." },
  { id: "h03", edition: 3, rarity: "rare", name: "Market Panic, Manufactured", lane: "headline", type: "scandal", power: 7, fuel: 2, volatility: 95, flavor: "Someone sold the dip before the panic. Someone knew." },
  { id: "h04", edition: 4, rarity: "common", name: "Scoop of the Century (Allegedly)", lane: "headline", type: "spin", power: 4, fuel: 4, volatility: 70, flavor: "Every detail confirmed by a source that does not exist." },
  { id: "h05", edition: 5, rarity: "rare", name: "The Anonymous Source, On the Record", lane: "headline", type: "leak", power: 6, fuel: 3, volatility: 60, flavor: "On the record, off the record, whatever it takes." },
  { id: "h06", edition: 6, rarity: "common", name: "Front Page Fever", lane: "headline", type: "satire", power: 3, fuel: 5, volatility: 50, flavor: "Nobody reads the second page. The first one is a trap." },
  { id: "h07", edition: 7, rarity: "common", name: "Breaking: Nothing Happened", lane: "headline", type: "fabrication", power: 4, fuel: 4, volatility: 85, flavor: "Deadline at six. Nothing happened. Headline anyway." },
  { id: "h08", edition: 8, rarity: "common", name: "The Clickbait That Ate the Newsroom", lane: "headline", type: "satire", power: 5, fuel: 3, volatility: 60, flavor: "The algorithm wanted outrage. It got a headline." },
  { id: "h09", edition: 9, rarity: "rare", name: "Exclusive: Everyone Knew", lane: "headline", type: "scandal", power: 6, fuel: 3, volatility: 75, flavor: "Everyone knew. Nobody said it. Now it's a story." },
  { id: "h10", edition: 10, rarity: "common", name: "Deadline Panic", lane: "headline", type: "spin", power: 5, fuel: 4, volatility: 55, flavor: "The newsroom runs on caffeine and fear." },
  { id: "h11", edition: 11, rarity: "rare", name: "Headline Roulette", lane: "headline", type: "satire", power: 6, fuel: 3, volatility: 90, flavor: "Spin the wheel. Print the headline. Apologize tomorrow." },
  { id: "h12", edition: 12, rarity: "common", name: "The Retraction, 24 Hours Late", lane: "headline", type: "fabrication", power: 3, fuel: 5, volatility: 65, flavor: "Truth arrived late. The retraction ran on page nine." },
  { id: "h13", edition: 13, rarity: "common", name: "Sources Say: (Empty)", lane: "headline", type: "leak", power: 5, fuel: 4, volatility: 70, flavor: "The source is a shadow. The story is a rumor." },
  { id: "h14", edition: 14, rarity: "rare", name: "The Algorithm's Darling", lane: "headline", type: "spin", power: 7, fuel: 3, volatility: 80, flavor: "The feed decides what you fear at noon." },
  { id: "h15", edition: 15, rarity: "epic", name: "Breaking News Whiplash", lane: "headline", type: "scandal", power: 8, fuel: 3, volatility: 88, flavor: "Whiplash is the only constant in the 24-hour news cycle." },
  { id: "m01", edition: 16, rarity: "uncommon", name: "The Apology That Was a Threat", lane: "media", type: "satire", power: 5, fuel: 3, volatility: 75, flavor: "Sincerity, weaponized." },
  { id: "u01", edition: 17, rarity: "rare", name: "The Doxxed Pseudonym", lane: "underground", type: "leak", power: 7, fuel: 4, volatility: 80, flavor: "Anonymity is a suggestion in the Underground." },
  { id: "u02", edition: 18, rarity: "common", name: "Liquidity Pool, Meet Cold Pool", lane: "underground", type: "meme", power: 6, fuel: 2, volatility: 65, flavor: "The LP token that needed a jacket." },
  { id: "h16", edition: 19, rarity: "epic", name: "Offshore Motive", lane: "headline", type: "scandal", power: 9, fuel: 3, volatility: 92, flavor: "The money trail leads somewhere warm." },
  { id: "m02", edition: 20, rarity: "common", name: "Pump Signal, Straight to Voicemail", lane: "media", type: "news", power: 4, fuel: 5, volatility: 45, flavor: "Nobody picked up. The chart did anyway." },
  { id: "u03", edition: 21, rarity: "uncommon", name: "The Shredder's Appetite", lane: "underground", type: "rumor", power: 5, fuel: 2, volatility: 70, flavor: "Feed it once, and it remembers the taste." },
  { id: "m03", edition: 22, rarity: "rare", name: "Clickbait Cartel", lane: "media", type: "satire", power: 6, fuel: 4, volatility: 58, flavor: "You won't believe what they did with this headline." },
  { id: "h17", edition: 23, rarity: "uncommon", name: "Burn Rate Gossip", lane: "headline", type: "spin", power: 5, fuel: 3, volatility: 62, flavor: "Their runway is shorter than their patience." },
  { id: "u04", edition: 24, rarity: "epic", name: "Zero-Knowledge Alibi", lane: "underground", type: "leak", power: 8, fuel: 4, volatility: 85, flavor: "I can prove I was nowhere, without revealing where I wasn't." },
  { id: "m04", edition: 25, rarity: "legendary", name: "Screaming Headline, No Sources", lane: "media", type: "news", power: 7, fuel: 3, volatility: 90, flavor: "All caps, zero receipts." },
  { id: "u05", edition: 26, rarity: "common", name: "Gas Fee Guilt Trip", lane: "underground", type: "meme", power: 4, fuel: 5, volatility: 40, flavor: "I paid 4 SOL so you'd know I care." },
  { id: "m05", edition: 27, rarity: "rare", name: "The Retraction That Wasn't", lane: "media", type: "spin", power: 6, fuel: 3, volatility: 66, flavor: "We regret the error we're still publishing." },
  { id: "u06", edition: 28, rarity: "rare", name: "Whale Watching You Watch", lane: "underground", type: "rumor", power: 7, fuel: 5, volatility: 74, flavor: "The whale is watching the whale watchers." },
  { id: "m06", edition: 29, rarity: "common", name: "Editor's Choice: Chaos", lane: "media", type: "satire", power: 5, fuel: 4, volatility: 50, flavor: "The front page was picked by a coin flip. A biased coin." },
  { id: "h18", edition: 30, rarity: "epic", name: "Lane Switching 101", lane: "headline", type: "news", power: 8, fuel: 2, volatility: 88, flavor: "The headline dies, the meme lives on in the Underground." },
  { id: "h19", edition: 31, rarity: "epic", name: "Retraction Published, Sources Unnamed", lane: "headline", type: "scandal", power: 8, fuel: 3, volatility: 86, flavor: "The story was wrong; the damage was right." },
  { id: "u07", edition: 32, rarity: "rare", name: "The Leak That Was a Ledger", lane: "underground", type: "leak", power: 7, fuel: 4, volatility: 78, flavor: "Every row a receipt." },
  { id: "m07", edition: 33, rarity: "common", name: "Diamond Hands, Paper Heart", lane: "media", type: "meme", power: 4, fuel: 2, volatility: 55, flavor: "Holds the bag, loses the lunch." },
  { id: "h20", edition: 34, rarity: "uncommon", name: "Breaking: Nothing Broke", lane: "headline", type: "news", power: 5, fuel: 3, volatility: 64, flavor: "Twenty-four hours of calm, reported breathlessly." },
  { id: "u08", edition: 35, rarity: "rare", name: "Whale Watches Whale Watchers", lane: "underground", type: "rumor", power: 6, fuel: 4, volatility: 70, flavor: "The observer is observed. Position sizes double." },
  { id: "m08", edition: 36, rarity: "common", name: "Sponsored by Our Own Scandal", lane: "media", type: "satire", power: 5, fuel: 2, volatility: 61, flavor: "Traffic is traffic." },
  { id: "h21", edition: 37, rarity: "uncommon", name: "The Spin That Spun Itself", lane: "headline", type: "spin", power: 6, fuel: 3, volatility: 72, flavor: "Nobody believes it, everybody repeats it." },
  { id: "u09", edition: 38, rarity: "common", name: "Street Price of a Rumor", lane: "underground", type: "news", power: 4, fuel: 3, volatility: 58, flavor: "Information is only free until it's useful." },
  { id: "m09", edition: 39, rarity: "epic", name: "The Editor's Other Inbox", lane: "media", type: "leak", power: 8, fuel: 4, volatility: 84, flavor: "Off the record, on the record, somewhere in between." },
  { id: "h22", edition: 40, rarity: "rare", name: "My CEO Is a Meme Now", lane: "headline", type: "meme", power: 6, fuel: 2, volatility: 77, flavor: "Market cap follows the punchline." },
  { id: "u10", edition: 41, rarity: "uncommon", name: "Paper Hands, Iron Alibi", lane: "underground", type: "scandal", power: 6, fuel: 4, volatility: 69, flavor: "Sold at the bottom; the statement says otherwise." },
  { id: "m10", edition: 42, rarity: "common", name: "Fud or Fodder?", lane: "media", type: "rumor", power: 5, fuel: 3, volatility: 52, flavor: "Nobody knows, everybody trades." },
  { id: "h23", edition: 43, rarity: "rare", name: "Satire, No Refunds", lane: "headline", type: "satire", power: 7, fuel: 3, volatility: 80, flavor: "It was a joke until it was a position." },
  { id: "u11", edition: 44, rarity: "legendary", name: "The First Corruption", lane: "underground", type: "spin", power: 9, fuel: 5, volatility: 92, flavor: "Before the lanes, before the shredder, there was a handshake." },
  { id: "m11", edition: 45, rarity: "epic", name: "Deadline at Dawn", lane: "media", type: "news", power: 7, fuel: 4, volatility: 82, flavor: "The story ships with or without you." },
  { id: "h24", edition: 46, rarity: "rare", name: "The Editor Is the Story", lane: "headline", type: "scandal", power: 8, fuel: 3, volatility: 78, flavor: "No byline. No retraction. Just the editor's face on the front page." },
  { id: "m12", edition: 47, rarity: "common", name: "Scoop Filed, Fact-Check Pending", lane: "media", type: "news", power: 5, fuel: 3, volatility: 58, flavor: "It's 90% sourced, 10% vibes — ship it." },
  { id: "u12", edition: 48, rarity: "uncommon", name: "A Source Wants Off the Record", lane: "underground", type: "leak", power: 6, fuel: 2, volatility: 74, flavor: "The envelope is cash, the story is yours, the source is gone." },
  { id: "h25", edition: 49, rarity: "common", name: "Burn the Newsroom, Keep the Tower", lane: "headline", type: "meme", power: 4, fuel: 4, volatility: 66, flavor: "The building is insured. The tower is iconic. Priorities." },
  { id: "m13", edition: 50, rarity: "rare", name: "Both Sides Agree to Disagree", lane: "media", type: "spin", power: 7, fuel: 2, volatility: 62, flavor: "We asked both sides. Both sides were us." },
  { id: "u13", edition: 51, rarity: "uncommon", name: "Rumor: The Shredder Eats First", lane: "underground", type: "rumor", power: 6, fuel: 3, volatility: 88, flavor: "Unconfirmed, unpublishable, and somehow already on every desk." },
  { id: "h26", edition: 52, rarity: "epic", name: "Headline: AI Bribes Its Own Reporter", lane: "headline", type: "satire", power: 8, fuel: 4, volatility: 84, flavor: "The scoop writes itself — and pays itself for the privilege." },
  { id: "m14", edition: 53, rarity: "rare", name: "Slow News Day, Fast Clicks", lane: "media", type: "news", power: 7, fuel: 4, volatility: 70, flavor: "Page one anyway. Slow news day, fast clicks." },
  { id: "u14", edition: 54, rarity: "common", name: "Leaked Memo: Bribes Are Just Gifts", lane: "underground", type: "leak", power: 5, fuel: 2, volatility: 64, flavor: "It's not corruption, it's gifting with extra steps." },
  { id: "h27", edition: 55, rarity: "epic", name: "The Payoff With No Name", lane: "headline", type: "scandal", power: 9, fuel: 3, volatility: 90, flavor: "Everyone knows it happened. No one knows who signed." },
  { id: "m15", edition: 56, rarity: "uncommon", name: "Press Release, Autopsy Pending", lane: "media", type: "satire", power: 6, fuel: 3, volatility: 76, flavor: "The company line, printed in memoriam." },
  { id: "u15", edition: 57, rarity: "rare", name: "A Denial So Detailed It's True", lane: "underground", type: "spin", power: 7, fuel: 4, volatility: 80, flavor: "Paragraphs of 'categorically not' — case closed, sort of." },
  { id: "m16", edition: 58, rarity: "common", name: "Extra! Extra! No One Reads", lane: "media", type: "news", power: 5, fuel: 3, volatility: 60, flavor: "Still printed. Still unread. Still somehow profitable." },
  { id: "h28", edition: 59, rarity: "epic", name: "Byline Bought, Byline Sold", lane: "headline", type: "scandal", power: 8, fuel: 4, volatility: 72, flavor: "Every word signed, sealed, and sponsored." },
  { id: "u16", edition: 60, rarity: "legendary", name: "The Gauge Is Always Hungry", lane: "underground", type: "meme", power: 9, fuel: 5, volatility: 91, flavor: "Feed it. It remembers. It is always polite about seconds." },
  { id: "m17", edition: 61, rarity: "epic", name: "The First Leak", lane: "media", type: "leak", power: 7, fuel: 4, volatility: 78, flavor: "Someone in the newsroom left the window open." },
  { id: "h29", edition: 62, rarity: "uncommon", name: "Don't Read the Comments", lane: "headline", type: "meme", power: 5, fuel: 3, volatility: 66, flavor: "They warned you. You read them anyway." },
  { id: "u17", edition: 63, rarity: "rare", name: "The Anonymous Source", lane: "underground", type: "leak", power: 6, fuel: 3, volatility: 72, flavor: "The source has no name. The source has no face. The source has receipts." },
  { id: "h30", edition: 64, rarity: "common", name: "Breaking: Nothing", lane: "headline", type: "news", power: 4, fuel: 2, volatility: 58, flavor: "Live from the 24-hour desk: absolutely nothing." },
  { id: "m18", edition: 65, rarity: "uncommon", name: "The Retraction", lane: "media", type: "news", power: 5, fuel: 4, volatility: 74, flavor: "The correction runs smaller than the lie. It always does." },
  { id: "u18", edition: 66, rarity: "epic", name: "The Whisper Network", lane: "underground", type: "rumor", power: 8, fuel: 4, volatility: 80, flavor: "Three degrees from the truth and twice as loud." },
  { id: "h31", edition: 67, rarity: "common", name: "Clickbait Kingpin", lane: "headline", type: "satire", power: 4, fuel: 2, volatility: 52, flavor: "You won't believe what this card does to your ELO." },
  { id: "u19", edition: 68, rarity: "rare", name: "The Dark Pool Diner", lane: "underground", type: "spin", power: 7, fuel: 4, volatility: 76, flavor: "Breakfast at midnight. No tabs. No receipts." },
  { id: "m19", edition: 69, rarity: "uncommon", name: "The Fact-Checker's Lament", lane: "media", type: "satire", power: 5, fuel: 3, volatility: 62, flavor: "I verify, therefore I am ignored." },
  { id: "h32", edition: 70, rarity: "common", name: "The Headline That Never Was", lane: "headline", type: "rumor", power: 4, fuel: 3, volatility: 60, flavor: "Almost true is the best kind of true." },
  { id: "u20", edition: 71, rarity: "epic", name: "The Mole", lane: "underground", type: "scandal", power: 8, fuel: 5, volatility: 86, flavor: "They're in the room. They were always in the room." },
  { id: "h33", edition: 72, rarity: "rare", name: "The Comment Section", lane: "headline", type: "meme", power: 6, fuel: 3, volatility: 70, flavor: "A thousand experts who have never played a single match." },
  { id: "m20", edition: 73, rarity: "common", name: "The Deadline", lane: "media", type: "news", power: 4, fuel: 2, volatility: 55, flavor: "Time is the only editor with real power." },
  { id: "m21", edition: 74, rarity: "epic", name: "The Editor's Cut", lane: "media", type: "satire", power: 7, fuel: 4, volatility: 82, flavor: "The story you saw is not the story that was written." },
  { id: "u21", edition: 75, rarity: "uncommon", name: "The Mole's Mole", lane: "underground", type: "leak", power: 6, fuel: 3, volatility: 68, flavor: "The spy is spying on the spy." },
  { id: "h34", edition: 76, rarity: "rare", name: "The Front Page", lane: "headline", type: "scandal", power: 7, fuel: 4, volatility: 74, flavor: "Above the fold, beneath all dignity." },
  { id: "h35", edition: 77, rarity: "legendary", name: "The Final Edition", lane: "headline", type: "news", power: 9, fuel: 5, volatility: 92, flavor: "The press run ends. The trail does not. The last founding card." },
];

/** Look up a genesis card by its edition number (1..77). */
export function genesisByEdition(edition: number): GenesisCard | undefined {
  return GENESIS_CARDS.find((c) => c.edition === edition);
}

export function isGenesisRarity(value: string): value is Rarity {
  return value === 'common' || value === 'rare' || value === 'uncommon' || value === 'epic' || value === 'legendary';
}
