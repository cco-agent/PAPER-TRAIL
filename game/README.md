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
node --experimental-strip-types --test src/game.test.ts src/sim.test.ts src/genesis-cards.test.ts src/webui.test.ts
```

## GENESIS 77 — founding card set

`src/genesis-cards.ts` holds the complete GENESIS 77 set: **77 numbered cards** (Editions 1/77–77/77), 35 for The Headline, 21 for The Media, 21 for The Underground. Rarity spread: 5 legendary / 14 epic / 22 rare / 13 uncommon / 23 common.

**Canonical source of truth is the presale cNFT metadata** (`genesis77/cards/01.json`–`77.json`). `genesis-cards.ts` is regenerated from it (2026-08-04, commit `74941f6`) so the playable set matches exactly what presale buyers receive — same names, lanes, types, stats, rarities and lore. The 18-card starter deck is a strict subset (same ids/stats) — everything a player can play is something a holder can own.

Set integrity is enforced by `src/genesis-cards.test.ts` (10 tests): edition uniqueness, id/lane/type validity, stat ranges, rarity distribution, lane split, starter-deck subset.

## Battle simulator

Bot-vs-bot matches to explore balance. Three strategies:

- `greedy` — native-lane deploys only; never off-lane, minimal burning.
- `meta` — volatility-aware: reads the current lane weights and will play off-lane into hot lanes.
- `hoarder` — stocks fuel first, feeds the shredder aggressively, locks late.

```bash
npm run sim          # full 3x3 strategy matrix
npm run sim -- --grid  # balance grid: offLanePenalty x weightMax sweep
npm run web          # browser UI: live sims, match replay, card gallery
# equivalents:
node --experimental-strip-types src/battle.ts
node --experimental-strip-types src/battle.ts --grid
node --experimental-strip-types src/battle.ts web --port 8787
```

The `--grid` mode sweeps `offLanePenalty` × `weightMax` and prints greedy-vs-meta win rates per cell, so balance hypotheses can be tested numerically instead of by feel.

The `web` command serves a zero-dependency browser UI (`node:http` only, no npm installs):

- `GET /` — dark-mode dashboard: run bot series, watch a single match replay (weights, actions, fuel per decision round), browse the full GENESIS 77 card gallery grouped by lane with rarity colors.
- `GET /api/deck` — the canonical 77-card set (editions, stats, rarities, flavor).
- `POST /api/sim` — `{ strategy0, strategy1, matches, seed, seconds }` → series result (deterministic per seed).
- `POST /api/match` — `{ strategy0, strategy1, seed, seconds }` → full per-action trace for one match.
- `GET /health` — liveness probe.

Request routing is a pure `handle(req)` function (no sockets), so every route is covered by the test suite (`src/webui.test.ts`, 12 tests).

| Module | Purpose |
|---|---|
| `src/types.ts` | `Card` / `LaneId` / `PlayerState` / `LANES` constants |
| `src/cards.ts` | Starter deck (18 cards, strict subset of GENESIS 77) + `starterHand()` |
| `src/genesis-cards.ts` | Full GENESIS 77 set, regenerated from canonical cNFT metadata |
| `src/genesis.ts` | Metadata loader (`loadGenesisDeck`), used by tests and tooling |
| `src/game.ts` | Match engine: create/deploy/burn/volatility/lock/score/ELO |
| `src/sim.ts` | Bot strategies + `playMatch` / `runSeries` / `mulberry32` seeded rng |
| `src/webui.ts` | Zero-dep HTTP server: `handle()` + `startServer()` + `traceMatch()` |
| `src/battle.ts` | CLI: full matrix, `--grid` balance sweep, `web` UI server |
| `src/sim.test.ts` | Simulator test suite (8 tests — incl. engine-option passthrough) |
| `src/webui.test.ts` | Web UI test suite (12 tests — routes, sim API, match trace) |
