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
node --experimental-strip-types --test src/game.test.ts src/sim.test.ts
```

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
| `src/game.ts` | Match engine: deploy / burn / volatility / advance / lock / matchScore / endMatch / applyElo |
| `src/elo.ts` | `expectedScore` + `updateElo` (standard logistic, K=32) |
| `src/sim.ts` | Bot strategies + `playMatch` / `runSeries` / `mulberry32` seeded rng |
| `src/battle.ts` | CLI — strategy-vs-strategy series matrix |
| `src/game.test.ts` | Engine test suite (21 tests) |
| `src/sim.test.ts` | Simulator test suite (7 tests) |

*Burn it. Feed the gauge.*
