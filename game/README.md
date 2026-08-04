# PAPER TRAIL — Game Core

Zero-dependency TypeScript engine for the PAPER TRAIL card battle game, implementing the GENESIS-era rules from WHITEPAPER.md v1.0.

## Rules implemented

- **Three lanes** — The Headline / The Media / The Underground, fought simultaneously.
- **Deploy** — play a card into its lane for full power; off-lane deploys pay a power penalty.
- **Burn-to-fuel shredder** — feed unwanted cards to the shredder to fill your fuel gauge.
- **5-second volatility** — every `volatilityInterval` seconds the lane weights re-roll; effective power shifts and lane control can flip.
- **Hold-to-charge tug-of-war** — the controller of a lane builds charge every second; spend charge + fuel to **lock** the lane.
- **3-minute matches** (configurable) — winner = higher total (locked + effective power) across all lanes.
- **ELO ladder** — standard K=32 rating updates, draws split.

## Quickstart

Requires Node v22.6+ (native TypeScript type-stripping, zero npm installs).

```bash
npm test
# or directly:
node --experimental-strip-types --test src/game.test.ts
```

## Modules

| File | Purpose |
|---|---|
| `src/types.ts` | Core types: `Card`, `LaneId`, `PlayerState`, lane constants |
| `src/cards.ts` | Starter deck — 18 lore cards (6 per lane) + `starterHand()` |
| `src/game.ts` | Match engine: deploy / burn / volatility / advance / lock / endMatch / applyElo |
| `src/elo.ts` | `expectedScore` + `updateElo` (standard logistic, K=32) |
| `src/game.test.ts` | Test suite |

*Burn it. Feed the gauge.*
