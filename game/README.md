# PAPER TRAIL — Game Core

Zero-dependency TypeScript engine for the PAPER TRAIL card battle game, implementing the GENESIS-era rules from WHITEPAPER.md v1.0.

## Rules implemented

- **Three lanes** — The Headline / The Media / The Underground, fought simultaneously.
- **Deploy** — play a card into its lane for full power; off-lane deploys pay a power penalty. Deployed power decides who **holds** a lane (the tug-of-war).
- **Burn-to-fuel shredder** — feed unwanted cards to the shredder to fill your fuel gauge.
- **5-second volatility** — every `volatilityInterval` seconds the lane weights re-roll, re-weighting **lane values**. Control is power; worth is volatility. A lane you ignored can suddenly be the whole game.
- **Hold-to-charge tug-of-war** — the controller of a lane builds charge every second; spend charge + fuel to **lock** the lane. Locked score survives later control loss.
- **3-minute matches** (configurable) — winner = higher total **weighted value** Σ (power + locked) × lane weight across all lanes. Draws split.
- **ELO ladder** — standard K=32 rating updates, draws split.

## Quickstart

Requires Node v22.6+ (native TypeScript type-stripping, zero npm installs).

```bash
npm test
# or directly:
node --experimental-strip-types --test src/game.test.ts src/sim.test.ts src/genesis-cards.test.ts
```

## GENESIS 77 — founding card set

`src/genesis-cards.ts` holds the complete GENESIS 77 set: **77 numbered cards** (Editions 1/77–77/77), 35 for The Headline, 21 for The Media, 21 for The Underground. Rarity spread: 5 legendary / 14 epic / 22 rare / 13 uncommon / 23 common.

**Canonical source of truth is the presale cNFT metadata** (`genesis77/cards/01.json`–`77.json`). `genesis-cards.ts` is regenerated from it (2026-08-04, commit `74941f6`) so the playable set matches exactly what presale buyers receive — same names, lanes, types, stats, rarities and lore. The 18-card starter deck is a strict subset (same ids/stats) — everything a player can play is something a holder can own.

Set integrity is enforced by `src/genesis-cards.test.ts` (10 tests): edition uniqueness, id/lane/type validity, stat ranges, rarity distribution, lane split, starter-deck subset.

## Battle simulator

Bot-vs-bot matches to explore balance. Three strategies:

- `greedy` — native-lane deploys only; never off-lane, minimal burning.
- `meta` — volatility-aware: reads the current lane weights and will play off-lane into hot lanes.
- `hoarder` — stocks fuel first, feeds the shredder aggressively, locks lanes hard.

```bash
npm run sim
node --experimental-strip-types src/battle.ts --matches 500 --seed 42 --seconds 120
```

Prints a win-rate matrix with ELO drift, shredder burns and lane locks per pairing. Deterministic given a seed (mulberry32).

## Modules

| File | Purpose |
|---|---|
| `src/types.ts` | Core types: `Card`, `LaneId`, `PlayerState`, lane constants |
| `src/cards.ts` | Starter deck — 18 lore cards (6 per lane) + `starterHand()` |
| `src/genesis-cards.ts` | GENESIS 77 founding set — 77 numbered cards + rarity/flavor + lookups |
| `src/game.ts` | Match engine: deploy / burn / volatility / advance / lock / matchScore / endMatch / applyElo |
| `src/elo.ts` | `expectedScore` + `updateElo` (standard logistic, K=32) |
| `src/sim.ts` | Bot strategies + `playMatch` / `runSeries` / `mulberry32` seeded rng |
| `src/battle.ts` | CLI — strategy-vs-strategy series matrix |
| `scripts/generate-genesis-metadata.ts` | cNFT metadata JSON generator (GENESIS 77) |
| `src/game.test.ts` | Engine test suite (21 tests) |
| `src/sim.test.ts` | Simulator test suite (7 tests) |
| `src/genesis-cards.test.ts` | GENESIS 77 set integrity suite (10 tests) |

*Burn it. Feed the gauge.*
