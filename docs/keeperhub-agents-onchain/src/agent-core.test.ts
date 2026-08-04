import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Agent } from "./agent.ts";
import { defaultConfig } from "./config.ts";
import type { AgentConfig } from "./config.ts";
import { StaticObserver } from "./observe.ts";
import { BALANCE_ABOVE_MAX, BALANCE_BELOW_MIN, RulesFirstDecider } from "./decide.ts";
import { PolicyGate } from "./policy.ts";
import { LoggingExecutor } from "./execute.ts";
import { JsonlAuditLog } from "./audit.ts";
import type { Decision, ObservationSnapshot, Trigger } from "./types.ts";

const RULES = [BALANCE_BELOW_MIN, BALANCE_ABOVE_MAX];

function snapshot(wei: string, address = "0xabc"): ObservationSnapshot {
  return {
    chain: "sepolia",
    address,
    balances: [{ chain: "sepolia", address, wei, symbol: "ETH" }],
    recentEvents: [],
    observedAt: new Date().toISOString()
  };
}

function testConfig(): AgentConfig {
  const c = defaultConfig();
  c.watch.address = "0xabc";
  c.watch.minBalanceWei = "100000000000000000"; // 0.1 ETH
  c.watch.maxBalanceWei = "0"; // disabled
  c.sweep = { to: "0xdef" };
  c.policy.recipientAllowlist = ["0xabc", "0xdef"];
  return c;
}

function trigger(): Trigger {
  return { kind: "manual", source: "test", at: new Date().toISOString() };
}

function transferDecision(to: string, amountWei: string): Decision {
  return {
    trigger: trigger(),
    action: { kind: "transfer", to, amountWei, chain: "sepolia" },
    rationale: "test",
    ruleHits: []
  };
}

test("decide: balance below min → top-up transfer proposal", async () => {
  const decider = new RulesFirstDecider(RULES);
  const decision = await decider.decide(trigger(), snapshot("10000000000000000"), testConfig()); // 0.01 ETH
  assert.equal(decision.action.kind, "transfer");
  assert.equal(decision.action.to, "0xabc");
  assert.equal(decision.action.amountWei, "90000000000000000");
  assert.deepEqual(decision.ruleHits, ["balance_below_min"]);
});

test("decide: healthy balance → noop", async () => {
  const decider = new RulesFirstDecider(RULES);
  const decision = await decider.decide(trigger(), snapshot("500000000000000000"), testConfig()); // 0.5 ETH
  assert.equal(decision.action.kind, "noop");
  assert.deepEqual(decision.ruleHits, []);
});

test("decide: balance above max → sweep proposal", async () => {
  const c = testConfig();
  c.watch.maxBalanceWei = "100000000000000000"; // 0.1 ETH
  const decider = new RulesFirstDecider(RULES);
  const decision = await decider.decide(trigger(), snapshot("250000000000000000"), c); // 0.25 ETH
  assert.equal(decision.action.kind, "transfer");
  assert.equal(decision.action.to, "0xdef");
  assert.equal(decision.action.amountWei, "150000000000000000");
});

test("policy: kill switch rejects everything", () => {
  const c = testConfig();
  c.policy.killSwitch = true;
  const gate = new PolicyGate();
  const res = gate.check(transferDecision("0xabc", "1"), c);
  assert.equal(res.passed, false);
  assert.ok(res.reasons.join(" ").includes("kill switch"));
});

test("policy: recipient must be allowlisted", () => {
  const c = testConfig();
  c.policy.recipientAllowlist = ["0xonly"];
  const gate = new PolicyGate();
  const res = gate.check(transferDecision("0xabc", "1"), c);
  assert.equal(res.passed, false);
  assert.ok(res.reasons.join(" ").includes("not allowlisted"));
});

test("policy: max amount enforced", () => {
  const c = testConfig();
  c.policy.maxAmountWei = "1000";
  const gate = new PolicyGate();
  const res = gate.check(transferDecision("0xabc", "5000"), c);
  assert.equal(res.passed, false);
  assert.ok(res.reasons.join(" ").includes("exceeds max"));
});

test("policy: cooldown blocks immediate repeat", () => {
  const c = testConfig();
  const gate = new PolicyGate();
  assert.equal(gate.check(transferDecision("0xabc", "1"), c).passed, true);
  assert.equal(gate.check(transferDecision("0xabc", "1"), c).passed, false);
});

test("policy: allowlisted recipient passes", () => {
  const c = testConfig();
  const gate = new PolicyGate();
  const res = gate.check(transferDecision("0xabc", "1"), c);
  assert.equal(res.passed, true);
  assert.deepEqual(res.reasons, []);
});

test("agent: full cycle writes audit record (top-up path)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sentinel-"));
  const audit = new JsonlAuditLog(join(dir, "audit.jsonl"));
  const agent = new Agent(testConfig(), {
    observer: new StaticObserver(snapshot("10000000000000000")),
    decider: new RulesFirstDecider(RULES),
    policy: new PolicyGate(),
    executor: new LoggingExecutor(),
    audit
  });
  const record = await agent.run(trigger());
  assert.ok(record.runId.length > 0);
  assert.equal(record.decision.action.kind, "transfer");
  assert.equal(record.policy.passed, true);
  assert.equal(record.execution.status, "skipped"); // no transport yet
  const records = await audit.readAll();
  assert.equal(records.length, 1);
});

test("agent: policy rejection still recorded with reasons", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sentinel-"));
  const audit = new JsonlAuditLog(join(dir, "audit.jsonl"));
  const c = testConfig();
  c.policy.recipientAllowlist = ["0xnobody"];
  const agent = new Agent(c, {
    observer: new StaticObserver(snapshot("10000000000000000")),
    decider: new RulesFirstDecider(RULES),
    policy: new PolicyGate(),
    executor: new LoggingExecutor(),
    audit
  });
  const record = await agent.run(trigger());
  assert.equal(record.policy.passed, false);
  assert.equal(record.execution.status, "rejected");
  assert.ok(record.execution.error!.includes("not allowlisted"));
});
