import type { Card, CardType, LaneId } from './types.ts';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface GenesisCard extends Card {
  /** 1..77 — the numbered edition of the founding cohort. */
  edition: number;
  rarity: Rarity;
  /** One-line lore. Also feeds the cNFT description. */
  flavor: string;
}

export const GENESIS_SET_SIZE = 77;

export const GENESIS_RARITY_COUNTS: Record<Rarity, number> = {
  common: 30,
  rare: 24,
  epic: 19,
  legendary: 4,
};

/**
 * The GENESIS 77 founding set — 77 numbered cards (Editions 1/77..77/77),
 * one per slot in the presale. The 18 starter-deck cards appear here with
 * identical ids/stats, so the playable deck is a strict subset of the set
 * players actually own.
 */
export const GENESIS_CARDS: GenesisCard[] = [
  // ── THE HEADLINE (Editions 1–26) ────────────────────────────────
  { id: "h01", edition: 1,  rarity: "legendary", name: "The Shredder's First Meal",  lane: "headline", type: "scandal",    power: 8, fuel: 4, volatility: 90, flavor: "The first meal of the machine that eats headlines." },
  { id: "h02", edition: 2,  rarity: "rare",      name: "A Headline Nobody Can Verify", lane: "headline", type: "fabrication", power: 5, fuel: 3, volatility: 80, flavor: "It says a lot. It means nothing. It gets printed anyway." },
  { id: "h03", edition: 3,  rarity: "rare",      name: "Market Panic, Manufactured",   lane: "headline", type: "scandal",    power: 7, fuel: 2, volatility: 95, flavor: "Someone sold the dip before the panic. Someone knew." },
  { id: "h04", edition: 4,  rarity: "common",    name: "Scoop of the Century (Allegedly)", lane: "headline", type: "spin", power: 4, fuel: 4, volatility: 70, flavor: "Every detail confirmed by a source that does not exist." },
  { id: "h05", edition: 5,  rarity: "rare",      name: "The Anonymous Source, On the Record", lane: "headline", type: "leak", power: 6, fuel: 3, volatility: 60, flavor: "On the record, off the record, whatever it takes." },
  { id: "h06", edition: 6,  rarity: "common",    name: "Front Page Fever",            lane: "headline", type: "satire",     power: 3, fuel: 5, volatility: 50, flavor: "Nobody reads the second page. The first one is a trap." },
  { id: "h07", edition: 7,  rarity: "common",    name: "Breaking: Nothing Happened",   lane: "headline", type: "fabrication", power: 4, fuel: 4, volatility: 85, flavor: "Deadline at six. Nothing happened. Headline anyway." },
  { id: "h08", edition: 8,  rarity: "common",    name: "The Clickbait That Ate the Newsroom", lane: "headline", type: "satire", power: 5, fuel: 3, volatility: 60, flavor: "The algorithm wanted outrage. It got a headline." },
  { id: "h09", edition: 9,  rarity: "rare",      name: "Exclusive: Everyone Knew",     lane: "headline", type: "scandal",    power: 6, fuel: 3, volatility: 75, flavor: "Everyone knew. Nobody said it. Now it's a story." },
  { id: "h10", edition: 10, rarity: "common",    name: "Deadline Panic",              lane: "headline", type: "spin",       power: 5, fuel: 4, volatility: 55, flavor: "The newsroom runs on caffeine and fear." },
  { id: "h11", edition: 11, rarity: "rare",      name: "Headline Roulette",           lane: "headline", type: "satire",     power: 6, fuel: 3, volatility: 90, flavor: "Spin the wheel. Print the headline. Apologize tomorrow." },
  { id: "h12", edition: 12, rarity: "common",    name: "The Retraction, 24 Hours Late", lane: "headline", type: "fabrication", power: 3, fuel: 5, volatility: 65, flavor: "Truth arrived late. The retraction ran on page nine." },
  { id: "h13", edition: 13, rarity: "common",    name: "Sources Say: (Empty)",        lane: "headline", type: "leak",       power: 5, fuel: 4, volatility: 70, flavor: "The source is a shadow. The story is a rumor." },
  { id: "h14", edition: 14, rarity: "rare",      name: "The Algorithm's Darling",     lane: "headline", type: "spin",       power: 7, fuel: 3, volatility: 80, flavor: "The feed decides what you fear at noon." },
  { id: "h15", edition: 15, rarity: "epic",      name: "Breaking News Whiplash",      lane: "headline", type: "scandal",    power: 8, fuel: 3, volatility: 88, flavor: "Whiplash is the only constant in the 24-hour news cycle." },
  { id: "h16", edition: 16, rarity: "common",    name: "The Hot Take Factory",        lane: "headline", type: "satire",     power: 4, fuel: 5, volatility: 75, flavor: "They churn hot takes like sausage. No one checks the ingredients." },
  { id: "h17", edition: 17, rarity: "common",    name: "Off-the-Record Onion",        lane: "headline", type: "spin",       power: 6, fuel: 4, volatility: 45, flavor: "The spin is so smooth you forget it's a lie." },
  { id: "h18", edition: 18, rarity: "rare",      name: "The Front Page Curse",        lane: "headline", type: "fabrication", power: 6, fuel: 4, volatility: 85, flavor: "Whoever writes page one writes history." },
  { id: "h19", edition: 19, rarity: "epic",      name: "Viral Before Verified",       lane: "headline", type: "leak",       power: 7, fuel: 4, volatility: 92, flavor: "It trended before anyone read it. That was the point." },
  { id: "h20", edition: 20, rarity: "epic",      name: "The 24-Hour News Cycle",      lane: "headline", type: "scandal",    power: 9, fuel: 3, volatility: 70, flavor: "The cycle never sleeps. Neither do the manipulators." },
  { id: "h21", edition: 21, rarity: "epic",      name: "Headline of the Century",     lane: "headline", type: "fabrication", power: 8, fuel: 5, volatility: 96, flavor: "The greatest story never told — because it was fiction." },
  { id: "h22", edition: 22, rarity: "common",    name: "The Press Conference Circus", lane: "headline", type: "satire",     power: 5, fuel: 4, volatility: 60, flavor: "Microphones out. Candor absent. Cameras rolling." },
  { id: "h23", edition: 23, rarity: "epic",      name: "Mole in the Newsroom",        lane: "headline", type: "leak",       power: 8, fuel: 5, volatility: 55, flavor: "A mole so deep they thought they were the story." },
  { id: "h24", edition: 24, rarity: "epic",      name: "The Unprintable Truth",       lane: "headline", type: "scandal",    power: 9, fuel: 4, volatility: 65, flavor: "Some truths are illegal to print. This one slipped out." },
  { id: "h25", edition: 25, rarity: "legendary", name: "The Last Honest Reporter",    lane: "headline", type: "leak",       power: 10, fuel: 3, volatility: 40, flavor: "She filed the real story. Then the shredder filed her." },
  { id: "h26", edition: 26, rarity: "legendary", name: "Above the Fold, Below the Law", lane: "headline", type: "scandal", power: 10, fuel: 4, volatility: 98, flavor: "Above the fold, below the law. That's where power lives." },

  // ── THE MEDIA (Editions 27–52) ─────────────────────────────────
  { id: "m01", edition: 27, rarity: "common",    name: "The Amplifier",              lane: "media", type: "spin",       power: 6, fuel: 3, volatility: 40, flavor: "Turn the signal up until the signal is the story." },
  { id: "m02", edition: 28, rarity: "common",    name: "Echo Chamber Choir",         lane: "media", type: "satire",     power: 5, fuel: 4, volatility: 55, flavor: "Fifty voices saying the same nothing." },
  { id: "m03", edition: 29, rarity: "common",    name: "Hot Take, Cold Truth",       lane: "media", type: "satire",     power: 4, fuel: 4, volatility: 65, flavor: "The take is hot. The truth is a footnote." },
  { id: "m04", edition: 30, rarity: "rare",      name: "Narrative Arbitrage",        lane: "media", type: "spin",       power: 7, fuel: 2, volatility: 45, flavor: "Buy the narrative low. Sell it amplified." },
  { id: "m05", edition: 31, rarity: "common",    name: "Spinsplainer",               lane: "media", type: "spin",       power: 3, fuel: 5, volatility: 35, flavor: "Explaining the spin with more spin." },
  { id: "m06", edition: 32, rarity: "rare",      name: "Satire, Labeled Real",       lane: "media", type: "fabrication", power: 5, fuel: 3, volatility: 75, flavor: "It was satire. Then it was news. Then it was real." },
  { id: "m07", edition: 33, rarity: "common",    name: "The Retweet Trap",           lane: "media", type: "satire",     power: 6, fuel: 4, volatility: 70, flavor: "Share it, don't read it. That's engagement." },
  { id: "m08", edition: 34, rarity: "rare",      name: "Viral Vector",               lane: "media", type: "leak",       power: 7, fuel: 3, volatility: 88, flavor: "One post. One million views. Zero facts." },
  { id: "m09", edition: 35, rarity: "common",    name: "Comment Section Chaos",      lane: "media", type: "satire",     power: 5, fuel: 5, volatility: 60, flavor: "The comments are where civility goes to die." },
  { id: "m10", edition: 36, rarity: "common",    name: "The Fact-Checker's Dilemma", lane: "media", type: "spin",       power: 4, fuel: 4, volatility: 50, flavor: "The fact-checker found the truth. No one clicked it." },
  { id: "m11", edition: 37, rarity: "common",    name: "Thread That Never Ends",      lane: "media", type: "spin",       power: 6, fuel: 3, volatility: 65, flavor: "The thread loops forever, saying less each time." },
  { id: "m12", edition: 38, rarity: "rare",      name: "Sponsored Truth",            lane: "media", type: "fabrication", power: 7, fuel: 4, volatility: 85, flavor: "This segment brought to you by the truth." },
  { id: "m13", edition: 39, rarity: "common",    name: "The Blue Check Bouncer",     lane: "media", type: "satire",     power: 3, fuel: 4, volatility: 55, flavor: "Verified accounts only. Outrage optional." },
  { id: "m14", edition: 40, rarity: "common",    name: "Quote Mining Incident",      lane: "media", type: "fabrication", power: 5, fuel: 4, volatility: 70, flavor: "The quote is real. The context is a rumor." },
  { id: "m15", edition: 41, rarity: "rare",      name: "The Influencer's Filter",    lane: "media", type: "spin",       power: 8, fuel: 3, volatility: 75, flavor: "Reality, cropped, filtered, and monetized." },
  { id: "m16", edition: 42, rarity: "epic",      name: "Reality, Remastered",        lane: "media", type: "fabrication", power: 7, fuel: 5, volatility: 90, flavor: "The edit bay can fix anything except the story." },
  { id: "m17", edition: 43, rarity: "common",    name: "The Overnight Expert",       lane: "media", type: "spin",       power: 6, fuel: 4, volatility: 60, flavor: "Expertise acquired in a single tweet." },
  { id: "m18", edition: 44, rarity: "rare",      name: "Groupthink Syndicate",       lane: "media", type: "satire",     power: 7, fuel: 4, volatility: 45, flavor: "Everyone agrees. That's the first red flag." },
  { id: "m19", edition: 45, rarity: "rare",      name: "The Leak That Wasn't",       lane: "media", type: "fabrication", power: 4, fuel: 4, volatility: 80, flavor: "The leak was a test. The source was a lie." },
  { id: "m20", edition: 46, rarity: "rare",      name: "Engagement Bait",            lane: "media", type: "scandal",    power: 6, fuel: 4, volatility: 72, flavor: "Outrage is the engagement metric with legs." },
  { id: "m21", edition: 47, rarity: "epic",      name: "The Second Source (A Bot)",  lane: "media", type: "leak",       power: 8, fuel: 4, volatility: 85, flavor: "The second source was a bot named 'Chad'." },
  { id: "m22", edition: 48, rarity: "epic",      name: "Narrative Hijack",           lane: "media", type: "spin",       power: 9, fuel: 3, volatility: 88, flavor: "They didn't change the story. They changed the world it lived in." },
  { id: "m23", edition: 49, rarity: "epic",      name: "The Viral Purge",            lane: "media", type: "scandal",    power: 8, fuel: 4, volatility: 92, flavor: "The purge deleted the accounts, not the screenshots." },
  { id: "m24", edition: 50, rarity: "epic",      name: "The Echo Chamber Collapse",  lane: "media", type: "satire",     power: 9, fuel: 3, volatility: 95, flavor: "The echo chamber collapsed. The sound was deafening." },
  { id: "m25", edition: 51, rarity: "rare",      name: "The Network's Puppet Master", lane: "media", type: "leak", power: 10, fuel: 4, volatility: 70, flavor: "Someone edits the edits. Someone owns the network." },
  { id: "m26", edition: 52, rarity: "epic",      name: "The Story That Sold Itself", lane: "media", type: "scandal",    power: 10, fuel: 3, volatility: 96, flavor: "The story sold itself. Twice." },

  // ── THE UNDERGROUND (Editions 53–77) ───────────────────────────
  { id: "u01", edition: 53, rarity: "rare",      name: "The Hidden Ledger",          lane: "underground", type: "leak",       power: 7, fuel: 3, volatility: 50, flavor: "Numbers don't lie. People with ledgers do." },
  { id: "u02", edition: 54, rarity: "common",    name: "Off the Record (Everything)", lane: "underground", type: "leak", power: 6, fuel: 4, volatility: 60, flavor: "Everything was said. Nothing was recorded." },
  { id: "u03", edition: 55, rarity: "common",    name: "The Deniable File",          lane: "underground", type: "fabrication", power: 5, fuel: 5, volatility: 70, flavor: "The file exists. The file does not exist." },
  { id: "u04", edition: 56, rarity: "common",    name: "Black Market Meme",          lane: "underground", type: "satire",     power: 4, fuel: 4, volatility: 80, flavor: "A meme so underground it's above ground now." },
  { id: "u05", edition: 57, rarity: "rare",      name: "Whistleblower, Silenced",    lane: "underground", type: "scandal",    power: 8, fuel: 2, volatility: 85, flavor: "They silenced the whistle. The whistle got louder." },
  { id: "u06", edition: 58, rarity: "common",    name: "Shadow Edit",                lane: "underground", type: "spin",       power: 3, fuel: 5, volatility: 90, flavor: "The edit was so clean nobody saw the cut." },
  { id: "u07", edition: 59, rarity: "rare",      name: "The Dead Drop",              lane: "underground", type: "leak",       power: 8, fuel: 4, volatility: 65, flavor: "The package changed hands in a crowded café." },
  { id: "u08", edition: 60, rarity: "epic",      name: "Ghost in the Machine",       lane: "underground", type: "fabrication", power: 7, fuel: 4, volatility: 88, flavor: "The machine learns. The machine leaks." },
  { id: "u09", edition: 61, rarity: "rare",      name: "The Burned Hard Drive",      lane: "underground", type: "scandal",    power: 7, fuel: 4, volatility: 75, flavor: "The drive was burned. The cloud remembered." },
  { id: "u10", edition: 62, rarity: "common",    name: "Cipher's Riddle",            lane: "underground", type: "leak",       power: 5, fuel: 5, volatility: 85, flavor: "Solve the riddle. Join the rumor." },
  { id: "u11", edition: 63, rarity: "epic",      name: "The Silk Road Redux",        lane: "underground", type: "scandal",    power: 8, fuel: 5, volatility: 90, flavor: "The road is paved with good denials." },
  { id: "u12", edition: 64, rarity: "common",    name: "Anonymity, Anonymized",      lane: "underground", type: "spin",       power: 5, fuel: 4, volatility: 45, flavor: "Anonymity is a luxury. The trace is a privilege." },
  { id: "u13", edition: 65, rarity: "epic",      name: "The Leak That Shook the Market", lane: "underground", type: "scandal", power: 9, fuel: 4, volatility: 95, flavor: "The leak moved markets before the news did." },
  { id: "u14", edition: 66, rarity: "common",    name: "Deep Web Déjà Vu",           lane: "underground", type: "satire",     power: 6, fuel: 4, volatility: 80, flavor: "You've seen this place before. It's worse now." },
  { id: "u15", edition: 67, rarity: "epic",      name: "The Encrypted Confession",   lane: "underground", type: "leak",       power: 9, fuel: 3, volatility: 70, flavor: "The confession is encrypted. The sender is not." },
  { id: "u16", edition: 68, rarity: "rare",      name: "Counterfeit Consensus",      lane: "underground", type: "fabrication", power: 8, fuel: 4, volatility: 85, flavor: "The consensus was manufactured overnight." },
  { id: "u17", edition: 69, rarity: "rare",      name: "The Dark Pool Dossier",      lane: "underground", type: "scandal",    power: 8, fuel: 5, volatility: 78, flavor: "The pool is dark. The trades are deeper." },
  { id: "u18", edition: 70, rarity: "common",    name: "Hacker's Manifesto, Third Edition", lane: "underground", type: "satire", power: 7, fuel: 4, volatility: 66, flavor: "I am a hacker. This is my third revision." },
  { id: "u19", edition: 71, rarity: "rare",      name: "The Offshore Ledger",        lane: "underground", type: "leak",       power: 9, fuel: 5, volatility: 60, flavor: "The ledger sleeps offshore. The owners don't." },
  { id: "u20", edition: 72, rarity: "common",    name: "Zero-Day Zoo",               lane: "underground", type: "fabrication", power: 7, fuel: 5, volatility: 90, flavor: "The exploit is for sale. The patch is for later." },
  { id: "u21", edition: 73, rarity: "epic",      name: "The Mole in the Machine",    lane: "underground", type: "leak",       power: 10, fuel: 4, volatility: 75, flavor: "The mole lives in the machine. It has your keys." },
  { id: "u22", edition: 74, rarity: "epic",      name: "Satoshi's Ghost",            lane: "underground", type: "fabrication", power: 9, fuel: 5, volatility: 92, flavor: "The founder returned. The story didn't." },
  { id: "u23", edition: 75, rarity: "epic",      name: "The Underground Wire",       lane: "underground", type: "scandal",    power: 10, fuel: 4, volatility: 80, flavor: "The wire hums. The money moves." },
  { id: "u24", edition: 76, rarity: "rare",      name: "The Burner Phone Broadcast", lane: "underground", type: "leak",       power: 10, fuel: 5, volatility: 68, flavor: "One call. No name. Everything burned." },
  { id: "u25", edition: 77, rarity: "legendary", name: "The Kingpin's Last Memo",    lane: "underground", type: "scandal",    power: 10, fuel: 5, volatility: 99, flavor: "The last memo was short: 'They know. Burn it all.'" },
];

/** Look up a genesis card by its edition number (1..77). */
export function genesisByEdition(edition: number): GenesisCard | undefined {
  return GENESIS_CARDS.find((c) => c.edition === edition);
}

export function isGenesisRarity(value: string): value is Rarity {
  return value === "common" || value === "rare" || value === "epic" || value === "legendary";
}
