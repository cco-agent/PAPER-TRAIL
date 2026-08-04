import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateRules,
  Guardian,
  InMemoryGuardianState,
  ruleMatches,
  validateThreshold
} from "./guardian.ts";
import { StaticObserver } from "./observe.ts";
import type { BalanceSnapshot, Trigger } from "./types.ts";

const WALLET = "0xabc123";
const WEI_1 = "100000000000000000"; // 0.1 ETH
const WEI_2 = "200000000000000000"; // 0.2 ETH

const balance = (wei: string, symbol = "ETH"): BalanceSnapshot => ({
  chain: "sepolia",
  address: WALLET,
  wei,
  symbol
});

const cfg = {
  source: "guardian:wallet:" + WALLET,
  address: WALLET,
  chain: "sepolia",
  thresholds: [{ symbol: "ETH", op: "lt" as const, wei: WEI_2 }]
};

test("ruleMatches: lt fires below threshold, not above", () => {
  assert.equal(ruleMatches(balance(WEI_1), { symbol: "ETH", op: "lt", wei: WEI_2 }), true);
  assert.equal(ruleMatches(balance(WEI_2), { symbol: "ETH", op: "lt", wei: WEI_2 }), false);
  assert.equal(ruleMatches(balance("300000000000000000"), { symbol: "ETH", op: "lt", wei: WEI_2 }), false);
});

test("ruleMatches: gte fires at and above threshold, ignores other symbols", () => {
  assert.equal(ruleMatches(balance(WEI_2), { symbol: "ETH", op: "gte", wei: WEI_2 }), true);
  assert.equal(ruleMatches(balance("300000000000000000"), { symbol: "ETH", op: "gte", wei: WEI_2 }), true);
  assert.equal(ruleMatches(balance(WEI_1), { symbol: "ETH", op: "gte", wei: WEI_2 }), false);
  assert.equal(ruleMatches(balance(WEI_1, "USDC"), { symbol: "ETH", op: "gte", wei: WEI_2 }), false);
});

test("ruleMatches: malformed wei is never matched", () => {
  assert.equal(ruleMatches(balance("0x1"), { symbol: "ETH", op: "lt", wei: WEI_2 }), false);
  assert.equal(ruleMatches(balance(WEI_1), { symbol: "ETH", op: "lt", wei: "1.5" }), false);
});

test("validateThreshold rejects non-decimal and negative cooldown", () => {
  assert.throws(() => validateThreshold({ symbol: "ETH", op: "lt", wei: "0x10" }), /decimal string/);
  assert.throws(() => validateThreshold({ symbol: "ETH", op: "lt", wei: "1e18" }), /decimal string/);
  assert.throws(() => validateThreshold({ symbol: "ETH", op: "lt", wei: WEI_1, cooldownMs: -1 }), /cooldownMs/);
});

test("evaluateRules fires a crossed threshold", async () => {
  const state = new InMemoryGuardianState();
  const verdicts = await evaluateRules([balance(WEI_1)], cfg.thresholds, cfg, state, 1000);
  assert.equal(verdicts.length, 1);
  assert.equal(verdicts[0].fired, true);
  assert.equal(verdicts[0].reason, "fired");
});

test("evaluateRules reports no_hit / no_balance honestly", async () => {
  const state = new InMemoryGuardianState();
  const high = await evaluateRules([balance("300000000000000000")], cfg.thresholds, cfg, state, 1000);
  assert.equal(high[0].reason, "no_hit");
  const missing = await evaluateRules([], cfg.thresholds, cfg, state, 1000);
  assert.equal(missing[0].reason, "no_balance");
});

test("evaluateRules respects per-rule cooldown", async () => {
  const state = new InMemoryGuardianState();
  const rules = [{ symbol: "ETH", op: "lt" as const, wei: WEI_2, cooldownMs: 10_000 }];
  const first = await evaluateRules([balance(WEI_1)], rules, cfg, state, 1000);
  assert.equal(first[0].fired, true);
  const suppressed = await evaluateRules([balance(WEI_1)], rules, cfg, state, 5000);
  assert.equal(suppressed[0].fired, false);
  assert.equal(suppressed[0].reason, "cooldown");
  assert.ok((suppressed[0].cooldownRemainingMs ?? 0) > 0);
  const refired = await evaluateRules([balance(WEI_1)], rules, cfg, state, 11_000);
  assert.equal(refired[0].fired, true);
});

test("evaluateRules compares huge wei exactly (no float drift)", async () => {
  const big = "123456789012345678901234567890123456789012345678901234567890";
  const state = new InMemoryGuardianState();
  const rules = [{ symbol: "ETH", op: "gte" as const, wei: big }];
  const eq = await evaluateRules([balance(big)], rules, cfg, state, 1);
  assert.equal(eq[0].fired, true);
  const low = "123456789012345678901234567890123456789012345678901234567859";
  const below = await evaluateRules([balance(low)], rules, cfg, state, 1);
  assert.equal(below[0].fired, false);
});

test("guardian loop: fires onTrigger when threshold crossed (runOnStart)", async () => {
  const state = new InMemoryGuardianState();
  const fired: Trigger[] = [];
  const g = new Guardian(
    { ...cfg, pollIntervalMs: 5, runOnStart: true },
    new StaticObserver({
      chain: "sepolia",
      address: WALLET,
      balances: [balance(WEI_1)],
      recentEvents: [],
      observedAt: new Date().toISOString()
    }),
    state,
    (trigger) => fired.push(trigger)
  );
  g.start();
  await new Promise((r) => setTimeout(r, 30));
  g.stop();
  assert.ok(fired.length >= 1, "guardian should fire at least once");
  assert.equal(fired[0].kind, "guardian");
});

test("guardian loop: stops cleanly and keeps the process alive only while running", async () => {
  const state = new InMemoryGuardianState();
  let count = 0;
  const g = new Guardian(
    { ...cfg, pollIntervalMs: 5, runOnStart: true },
    new StaticObserver({
      chain: "sepolia",
      address: WALLET,
      balances: [balance(WEI_1)],
      recentEvents: [],
      observedAt: new Date().toISOString()
    }),
    state,
    () => {
      count++;
    }
  );
  g.start();
  await new Promise((r) => setTimeout(r, 25));
  g.stop();
  const afterStop = count;
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(count, afterStop, "no ticks after stop()");
});
