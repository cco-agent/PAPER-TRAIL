# ZeroClaw Bounty — Verified Requirements & Submission Package

> Verified 2026-08-04 (UTC) from: IagoPrandi/zeroclaw-plugin COMPETITION_REQUIREMENTS.md (live listing capture, rechecked 07-29), ertanyeni/zeroclaw-solana-plugins SUBMISSION.md, zeroclaw-labs/zeroclaw-plugins README (official registry), Triwidodo99/redisinaga/annaumixyz applicant repos.

## Timeline (CORRECTED — was misrecorded in cards.md)

| Item | Value |
|---|---|
| **Submission deadline** | **2026-08-07 02:59:59 UTC** (2026-08-06 23:59 BRT) — **~3 days from verification date** |
| Winner announcement | 2026-08-21 02:59:59 UTC |
| Prize pool | 5,000 USDG total (1st $1,800 / 2nd $1,200 / 3rd $1,000 / 4×$250 honorable) |
| Posted | 2026-07-16T21:42:01.525Z |
| Field | ~70 submissions as of 07-29 (crowded — differentiation required) |

**Priority note: this closes BEFORE the KeeperHub deadline (08-13). ZeroClaw is now the #1 deadline.**

## Official requirements (verified)

1. **Submission format: showcase post in the ZeroClaw Discord `#solana-bounty` channel.**
2. **Demo video ≤3 minutes** showing a real agent on a real channel doing a real Solana-related job. Slides alone are NOT accepted.
3. **Write-up** covering: purpose, audience, ZeroClaw features, custom code, custody tier, threat model, reproducible config/SOPs/skills/code, redacted secrets.
4. **GitHub repository link required** for custom plugin code.
5. **Superteam form**: demo video link (required) + supporting-material link (required); one-pager optional.
6. **A standalone plugin is NOT a valid submission** — the plugin must support a working use case.
7. **Do NOT open a ZeroClaw registry PR during the bounty.** (Contradicts some applicant READMEs that claim PR submission is the path — official requirements win.)
8. **Reproducibility is explicitly scored.**
9. **Prompt-injection test transcript required** when the use case touches funds (ours does).
10. No additional source-license/IP-assignment term; MIT is fine; respect dependency licenses.

## Judging criteria (verified)

| Criterion | Weight |
|---|---|
| Use case | 30% |
| Safety & custody design | 25% |
| Craft | 20% |
| Reproducibility | 15% |
| Showcase | 10% |
| Tiebreak | Public build logs on X during the bounty |

## Our entry: PAPER TRAIL Paid Oracle (T0, zero-custody)

External agents pay (SOL, x402-style proof) → get exactly **one** PAPER TRAIL match snapshot per payment (lane scores, 5-sec volatility window, leader, ELO, burns, locks). Game economy × payment rails — not another payment clone.

| Requirement | Status | Evidence |
|---|---|---|
| Working use case (not standalone plugin) | ✅ Paid game-state oracle = real, monetizable use case | design.md + plugin.ts + README |
| Custody tier declared | ✅ T0 / zero-custody (no key, no signing, deny-by-default) | manifest.toml + README |
| Threat model | ✅ Fail-closed, replay-protected, injection-resistant | README + solana-verifier.ts + tests |
| Prompt-injection transcript (funds-touching) | ✅ | payment-gate.test.ts (reject_unsafe_intent cases) — extract transcript into submission write-up |
| Reproducible config / SOPs | ✅ Zero-install Node 22, `node --experimental-strip-types --test`, no deps | README run section |
| Tests | ✅ 36/36 PASS (payment-gate 11 + plugin 7 + solana-verifier 18) | verified locally |
| Demo video ≤3 min, real agent, real channel | ⛔ **BLOCKED (human/browser)** | CCO cannot record video or run a live Discord agent |
| Discord #solana-bounty showcase post | ⛔ **BLOCKED (external server)** | CCO bot not in ZeroClaw server |
| Superteam form submit | ⛔ **BLOCKED (browser + Discord)** | K319 handoff required |

## What CCO can do autonomously (done or next)

- [x] Verified requirements (this file)
- [x] Scaffold: payment-gate + solana-verifier + oracle + plugin + manifest (36/36 tests)
- [x] Differentiation angle: paid game-state oracle, not payment clone
- [ ] Extract prompt-injection transcript into a `TRANSCRIPT.md` (from payment-gate.test.ts cases)
- [ ] Write the submission write-up body (purpose/audience/features/custody/threat/SOPs) as `WRITEUP.md`
- [ ] Public build log on X (tiebreak) — use 08-05 X slot if not claimed by higher-priority queue

## K319 handoff checklist (browser/human required — THE only remaining blockers)

1. Record ≤3 min demo video: real agent (this plugin surface) on a real channel doing one real paid Solana query → match snapshot. Script in `VIDEO-SCRIPT.md` (CCO can draft).
2. Post showcase to ZeroClaw Discord `#solana-bounty` with write-up + repo link + video link.
3. Fill Superteam form: https://superteam.fun/earn/listing/zeroclaw — video link + supporting material (this repo).
4. Deadline: **2026-08-07 02:59:59 UTC.** Do not open a registry PR.

## Honest gaps

- SPL token verification not implemented (SOL native only) — documented extension.
- Replay-set persistence across restarts not implemented (production concern; in-memory for demo).
- Live RPC integration not exercised (mock rpcCall in tests; public RPC URL works).
- Video/ Discord/ form submission fully human-dependent.
