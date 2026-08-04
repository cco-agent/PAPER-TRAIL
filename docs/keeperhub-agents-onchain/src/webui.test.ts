/**
 * Web UI demo — tests. Exercises WebUI.handle() directly (no port binding):
 * route mapping, paywall JSON, the x402 flow (402 → paid 200), zero free
 * runs on invalid proofs, case-insensitive proof headers, and 404s.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { Agent } from "./agent.ts";
import { defaultConfig } from "./config.ts";
import { StaticObserver } from "./observe.ts";
import { BALANCE_ABOVE_MAX, BALANCE_BELOW_MIN, RulesFirstDecider } from "./decide.ts";
import { PolicyGate } from "./policy.ts";
import { LoggingExecutor } from "./execute.ts";
import { JsonlAuditLog } from "./audit.ts";
import {
  X402Handler,
  createPaymentVerifier,
  encodeProof,
  X402_PAYWALL_HEADER,
  X402_PROOF_HEADER
} from "./x402.ts";
import { WebUI } from "./webui.ts";
import type { AuditRecord, ObservationSnapshot } from "./types.ts";
import type { X402PaymentRequest } from "./x402.ts";

const RULES = [BALANCE_BELOW_MIN, BALANCE_ABOVE_MAX];
const PROOF_PAYER = "0x1111111111111111111111111111111111111111";

function ethToWei(eth: string): string {
  return BigInt(Math.round(parseFloat(eth) * 1e18)).toString();
}

function build(): { ui: WebUI; paywall: X402PaymentRequest; logPath: string } {
  const config = defaultConfig();
  const logPath = join(mkdtempSync(join(tmpdir(), "webui-test-")), "audit.jsonl");
  config.audit.logPath = logPath;
  const addr = config.watch.address || "0xwatched";
  const snapshot: ObservationSnapshot = {
    chain: config.chain,
    address: addr,
    balances: [{ chain: config.chain, address: addr, wei: ethToWei("0.01"), symbol: config.watch.symbol ?? "ETH" }],
    recentEvents: [],
    observedAt: new Date().toISOString()
  };
  const agent = new Agent(config, {
    observer: new StaticObserver(snapshot),
    decider: new RulesFirstDecider(RULES),
    policy: new PolicyGate(),
    executor: new LoggingExecutor(),
    audit: new JsonlAuditLog(logPath)
  });
  const paywall: X402PaymentRequest = {
    requestId: randomUUID(),
    amountWei: ethToWei("0.001"),
    token: "native",
    chain: config.chain,
    recipient: "0xpaywall",
    description: "web UI test paywall"
  };
  const handler = new X402Handler({
    paymentRequest: paywall,
    verifier: createPaymentVerifier("memory"),
    agent
  });
  return { ui: new WebUI(handler), paywall, logPath };
}

test("GET / serves the demo HTML page", async () => {
  const { ui } = build();
  const res = await ui.handle({ method: "GET", url: "/", headers: {} });
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"] ?? "", /text\/html/);
  assert.match(res.body, /Shredder Sentinel/);
});

test("GET /api/paywall returns the paywall JSON", async () => {
  const { ui, paywall } = build();
  const res = await ui.handle({ method: "GET", url: "/api/paywall", headers: {} });
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body) as X402PaymentRequest;
  assert.equal(parsed.requestId, paywall.requestId);
  assert.equal(parsed.amountWei, paywall.amountWei);
});

test("POST /api/run without proof → 402 + x402-paywall header, zero audit records", async () => {
  const { ui, logPath } = build();
  const res = await ui.handle({ method: "POST", url: "/api/run", headers: {} });
  assert.equal(res.status, 402);
  assert.ok(res.headers[X402_PAYWALL_HEADER]);
  const audit = new JsonlAuditLog(logPath);
  assert.equal((await audit.readAll()).length, 0);
});

test("POST /api/run with valid proof → 200 audit record, trigger kind x402", async () => {
  const { ui, paywall, logPath } = build();
  const proof = { requestId: paywall.requestId, payer: PROOF_PAYER, amountWei: paywall.amountWei };
  const res = await ui.handle({
    method: "POST",
    url: "/api/run",
    headers: { [X402_PROOF_HEADER]: encodeProof(proof) }
  });
  assert.equal(res.status, 200);
  const record = JSON.parse(res.body) as AuditRecord;
  assert.equal(record.trigger.kind, "x402");
  // 0.01 ETH < min 0.1 ETH → the balance-below-min rule fires → top-up transfer.
  assert.equal(record.decision.action.kind, "transfer");
  const audit = new JsonlAuditLog(logPath);
  assert.equal((await audit.readAll()).length, 1); // exactly one paid run
});

test("POST /api/run with overpayment → accepted (200)", async () => {
  const { ui, paywall } = build();
  const overpaid = (BigInt(paywall.amountWei) + 1n).toString();
  const proof = { requestId: paywall.requestId, payer: PROOF_PAYER, amountWei: overpaid };
  const res = await ui.handle({
    method: "POST",
    url: "/api/run",
    headers: { [X402_PROOF_HEADER]: encodeProof(proof) }
  });
  assert.equal(res.status, 200);
});

test("POST /api/run with wrong requestId → 402, zero audit records (no free runs)", async () => {
  const { ui, paywall, logPath } = build();
  const proof = { requestId: "req_wrong", payer: PROOF_PAYER, amountWei: paywall.amountWei };
  const res = await ui.handle({
    method: "POST",
    url: "/api/run",
    headers: { [X402_PROOF_HEADER]: encodeProof(proof) }
  });
  assert.equal(res.status, 402);
  const audit = new JsonlAuditLog(logPath);
  assert.equal((await audit.readAll()).length, 0);
});

test("POST /api/run with malformed proof header → 402, zero audit records", async () => {
  const { ui, logPath } = build();
  const res = await ui.handle({
    method: "POST",
    url: "/api/run",
    headers: { [X402_PROOF_HEADER]: "not-base64url-json" }
  });
  assert.equal(res.status, 402);
  const audit = new JsonlAuditLog(logPath);
  assert.equal((await audit.readAll()).length, 0);
});

test("POST /api/run with uppercase x402-proof header key → accepted (case-insensitive)", async () => {
  const { ui, paywall } = build();
  const proof = { requestId: paywall.requestId, payer: PROOF_PAYER, amountWei: paywall.amountWei };
  const res = await ui.handle({
    method: "POST",
    url: "/api/run",
    headers: { [X402_PROOF_HEADER.toUpperCase()]: encodeProof(proof) }
  });
  assert.equal(res.status, 200);
});

test("unknown route → 404", async () => {
  const { ui } = build();
  const res = await ui.handle({ method: "GET", url: "/nope", headers: {} });
  assert.equal(res.status, 404);
});
