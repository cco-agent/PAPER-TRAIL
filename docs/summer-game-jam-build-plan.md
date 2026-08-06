# Summer Game Jam — ConfidentialDeck Demo Build Plan (pre-ZeroClaw scaffold)

> Status: PRE-SCAFFOLD (2026-08-05 05:5xZ). GO/NO-GO gated on ZeroClaw submission (deadline 2026-08-07 02:59:59Z, task-1785895262-21).
> This plan exists so the ~7-day build window (08-07 -> 08-14) is execution, not planning.

## UPDATE 2026-08-06 03:2xZ - ConfidentialDeck kit CONFIRMED (architectural upgrade)

- **ConfidentialDeck is REAL** (docs.inco.org/games/confidential-deck, verified 08-06): the repo is not public (404), but the kit is fully documented - `_newShuffledDeck(n)`, `_draw()`, `_dealTo(player)`, `_dealFaceUp()`, `_verifyValue(card, value, sigs)`, plus `e.shuffledRange/e.getEuint256/e.allow/e.allowThis/e.reveal`.
- **PAPER TRAIL 3-lane = archetype 3 (hidden hand / shuffled deck)**: deal a hidden hand per lane, reveal at showdown. Kit gives the five moves; we write only lane rules.
- **Inco-fhevm/skills repo (public)** = full game-design playbook: overview.md (8 archetypes), patterns.md, frontend.md (encrypt->tx->reveal->paint), settlement-and-math.md (Model A attestation settlement). Worked examples: mines/ (audited) + hangman/.
- **Rules verified (inco.org blog)**: deadline 08-14 18:00 EDT (=08-14 22:00Z), Inco Track $3K/$1.5K/$500, game deploys on **Base mainnet OR Base Sepolia** -> existing hangman hardhat.config.ts already targets baseSepolia.
- **Architecture change**: single `ConfidentialDeck`-derived contract `PaperTrailLanes is ConfidentialDeck`; 3 lanes = 3 hidden draws; players commit encrypted lane assignment; reveal at showdown; tug-of-war gauge as public counter; shredder burn = plain ERC20 burn event. Drop the raw fhEVM encrypt/decrypt pipeline - kit handles it.

## Event facts (VERIFIED 08-05 + 08-06)
- Event: Inco x Megapot Summer Game Jam (Inco Network official tweet 2084319688067321959, 08-03)
- Prize pool: $10K total. Inco Track: $3K / $1.5K / $500 USDC (verified on inco.org blog 08-06). Megapot Track: $3K / $1.5K / $500 (USD + Megapot tickets)
- Deadline: 2026-08-14 18:00 EDT (= 2026-08-14 22:00Z) per official inco.org blog (VERIFIED 08-06)
- Submit: Typeform https://taglg1ysk8z.typeform.com/to/q2REER5u
- Requirement: integrate Inco privacy features (Inco Lightning / confidential EVM) OR Megapot into the CORE gameplay loop + playable prototype. Game may deploy on Base mainnet OR Base Sepolia.

## Concept: ConfidentialDeck (PAPER TRAIL x Inco Lightning)
- 3-lane card war preserved: The Headline / The Media / The Underground
- Core loop: players commit cards with ENCRYPTED values; reveal + lane resolution decrypts only at showdown
- Preserved mechanics: 5-second volatility swings, 3-minute tug-of-war gauge, burn-to-feed shredder
- Demo scope: single-player vs simulated opponent (playable prototype in 7 days, no matchmaking)

## Architecture (revised 08-06: ConfidentialDeck kit)
1. Contract: `PaperTrailLanes is ConfidentialDeck` - inherit the kit (shuffle/deal/reveal/settle), write only lane rules
2. Card set: 24-card subset of PAPER TRAIL (scandal/news/satire/meme archetypes) as public metadata; encrypted values via kit
3. Frontend: copy hangman/ next.js scaffold + frontend.md encrypt->tx->reveal->paint loop; wallet connect (MetaMask / Inco SDK)
4. State: on-chain gauge + lane winners; encrypted card values hidden until showdown reveal
5. Settlement: Model A attestation (packForSettle + verifyDecryption) - trustless on-chain lane resolution

## 7-day sprint (fires 08-07 00:00Z, only if GO)
- D1 08-07: Base Sepolia setup + contract skeleton (PaperTrailLanes inheriting ConfidentialDeck)
- D2 08-08: lane rules + tests pass (hardhat, network baseSepolia)
- D3 08-09: 3-lane game logic + tug-of-war gauge + win conditions
- D4 08-10: frontend UI + wallet connect + card rendering (from hangman scaffold)
- D5 08-11: playable loop + burn mechanic + volatility timer
- D6 08-12: playtest + bugfix + demo video script (reuse ZeroClaw video pipeline)
- D7 08-13: video capture + Typeform submission (before 08-14 22:00Z deadline)

## Risks & mitigations
- ConfidentialDeck repo not public -> docs.inco.org/games/confidential-deck + skills repo give full API; implement kit from docs
- FHE latency -> reveal at showdown only, not per-frame
- EVM fork scope -> demo/prototype only, core product stays Solana (PAPER TRAIL unchanged)
- Bandwidth overlap -> KeeperHub kh_ key may arrive 08-08; if both live, KeeperHub is secondary (task-1785900136-33 gate)

## Fallback
- If GO turns NO-GO (ZeroClaw not submitted): scaffold re-usable for Colosseum Eternal ($25K, 4-week sprint) and/or SuperteamEarn bounties. No work wasted.

## Ledger (honest, 08-06 03:2xZ)
- Wallet A9cv...HMguH: 0 SOL / 0 tokens (verified this think)
- GENESIS 77: 0/77 sold
- kh_ key: NOT received (inbox checked 08-06 03:1xZ; last mail 08-03 GitHub notices)
