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
import {
  X402Handler,
  InMemoryPaymentVerifier,
  createPaymentVerifier,
  decodePaywall,
  decodeProof,
  encodePaywall,
  encodeProof,
  parseProofFromHeaders,
  X402_PROOF_HEADER
} from "./x402.ts";
import type { ObservationSnapshot, X402PaymentRequest, X402Proof } from "./x402.ts";

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

function makeHandler(): {
  handler: X402Handler;
  paywall: X402PaymentRequest;
  audit: JsonlAuditLog;
} {
  const dir = mkdtempSync(join(tmpdir(), "sentinel-x402-"));
  const audit = new JsonlAuditLog(join(dir, "audit.jsonl"));
  const agent = new Agent(testConfig(), {
    observer: new StaticObserver(snapshot("10000000000000000")), // 0.01 ETH → below min → top-up
    decider: new RulesFirstDecider(RULES),
    policy: new PolicyGate(),
    executor: new LoggingExecutor(),
    audit
  });
  const paywall: X402PaymentRequest = {
    requestId: "req_123",
    amountWei: "1000000000000000", // 0.001 ETH
    token: "native",
    chain: "sepolia",
    recipient: "0xabc",
    description: "one guarded run"
  };
  const handler = new X402Handler({
    paymentRequest: paywall,
    verifier: new InMemoryPaymentVerifier(),
    agent
  });
  return { handler, paywall, audit };
}

function validProof(paywall: X402PaymentRequest, overpay = false): X402Proof {
  return {
    requestId: paywall.requestId,
    payer: "0x1111111111111111111111111111111111111111",
    amountWei: overpay ? "2000000000000000" : paywall.amountWei,
    txHash: `0x${"ab".repeat(32)}`
  };
}

test("x402: no proof → 402 with paywall charge", async () => {
  const { handler, paywall } = makeHandler();
  const res = await handler.handle();
  assert.equal(res.status, 402);
  if (res.status === 402) {
    assert.equal(res.paywall.amountWei, "1000000000000000");
    assert.equal(res.paywall.recipient, "0xabc");
    assert.equal(res.paywall.chain, "sepolia");
    assert.equal(res.paywall.requestId, paywall.requestId);
  }
});

test("x402: valid proof → 200 + audited x402 run, exactly one record", async () => {
  const { handler, paywall, audit } = makeHandler();
  const res = await handler.handle(validProof(paywall));
  assert.equal(res.status, 200);
  if (res.status === 200) {
    assert.equal(res.record.trigger.kind, "x402");
    assert.ok(res.record.trigger.source.includes(paywall.requestId));
    assert.equal(res.record.decision.action.kind, "transfer"); // below-min snapshot → top-up
    assert.equal(res.record.policy.passed, true);
    assert.equal(res.record.execution.status, "skipped"); // no KeeperHub transport yet
  }
  assert.equal((await audit.readAll()).length, 1);
});

test("x402: overpayment is accepted", async () => {
  const { handler, paywall } = makeHandler();
  const res = await handler.handle(validProof(paywall, true));
  assert.equal(res.status, 200);
});

test("x402: underpayment → 402, no audit record (no free runs)", async () => {
  const { handler, paywall, audit } = makeHandler();
  const proof: X402Proof = { ...validProof(paywall), amountWei: "1" };
  const res = await handler.handle(proof);
  assert.equal(res.status, 402);
  assert.equal((await audit.readAll()).length, 0);
});

test("x402: non-numeric amountWei → 402, no audit record", async () => {
  const { handler, paywall, audit } = makeHandler();
  const proof: X402Proof = { ...validProof(paywall), amountWei: "many" };
  const res = await handler.handle(proof);
  assert.equal(res.status, 402);
  assert.equal((await audit.readAll()).length, 0);
});

test("x402: mismatched requestId → 402", async () => {
  const { handler, paywall, audit } = makeHandler();
  const proof = validProof({ ...paywall, requestId: "req_other" });
  const res = await handler.handle(proof);
  assert.equal(res.status, 402);
  assert.equal((await audit.readAll()).length, 0);
});

test("x402: malformed payer → 402", async () => {
  const { handler, paywall, audit } = makeHandler();
  const proof: X402Proof = { ...validProof(paywall), payer: "not-an-address" };
  const res = await handler.handle(proof);
  assert.equal(res.status, 402);
  assert.equal((await audit.readAll()).length, 0);
});

test("x402: paywall header encode/decode roundtrip", () => {
  const req: X402PaymentRequest = {
    requestId: "req_123",
    amountWei: "1000000000000000",
    token: "native",
    chain: "sepolia",
    recipient: "0xabc",
    description: "one guarded run"
  };
  assert.deepEqual(decodePaywall(encodePaywall(req)), req);
});

test("x402: proof encode/decode + parseProofFromHeaders (case-insensitive)", () => {
  const proof: X402Proof = {
    requestId: "req_123",
    payer: "0x1111111111111111111111111111111111111111",
    amountWei: "1000000000000000",
    txHash: `0x${"ab".repeat(32)}`
  };
  assert.deepEqual(decodeProof(encodeProof(proof)), proof);
  const fromHeaders = parseProofFromHeaders({ [X402_PROOF_HEADER.toUpperCase()]: encodeProof(proof) });
  assert.deepEqual(fromHeaders, proof);
  assert.equal(parseProofFromHeaders({}), undefined);
});

test("x402: decodePaywall rejects garbage and missing fields", () => {
  assert.throws(() => decodePaywall("###not-json###"));
  const missing = Buffer.from(JSON.stringify({ requestId: "only" }), "utf8").toString("base64url");
  assert.throws(() => decodePaywall(missing), /malformed/);
});

test("x402: chain verifier refuses to construct without credentials", () => {
  assert.throws(() => createPaymentVerifier("chain"), /not configured/);
});
