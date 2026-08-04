import { test } from "node:test";
import assert from "node:assert/strict";

import {
  type MatchSnapshot,
  StaticOracleDataSource
} from "./oracle.ts";
import {
  type PaymentRequest,
  encodeProof,
  InMemoryPaymentVerifier,
  PAYMENT_PROOF_HEADER
} from "./payment-gate.ts";
import { PaperTrailPaidOraclePlugin } from "./plugin.ts";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const RECIPIENT = "A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH";
const PAYER = "Cco1111111111111111111111111111111111111111";

function makeRequest(): PaymentRequest {
  return {
    requestId: "req-plugin-1",
    amount: "5000000",
    mint: SOL_MINT,
    recipient: RECIPIENT,
    description: "one PAPER TRAIL match snapshot",
    chain: "devnet"
  };
}

function makeSnapshot(matchId: string): MatchSnapshot {
  return {
    matchId,
    lanes: {
      "The Headline": { playerA: 12, playerB: 9 },
      "The Media": { playerA: 7, playerB: 11 },
      "The Underground": { playerA: 4, playerB: 3 }
    },
    volatility: 72,
    leader: "A",
    eloA: 1243,
    eloB: 1187,
    burns: 3,
    locks: 1
  };
}

class CountingDataSource extends StaticOracleDataSource {
  calls = 0;
  override snapshot(matchId: string): MatchSnapshot | undefined {
    this.calls++;
    return super.snapshot(matchId);
  }
}

function buildPlugin() {
  const data = new CountingDataSource([makeSnapshot("m-1")]);
  const plugin = new PaperTrailPaidOraclePlugin({
    paymentRequest: makeRequest(),
    verifier: new InMemoryPaymentVerifier(),
    data
  });
  return { plugin, data };
}

function proofHeaders(overrides: Record<string, unknown> = {}) {
  const proof = {
    requestId: "req-plugin-1",
    payer: PAYER,
    amount: "5000000",
    ...overrides
  };
  return { [PAYMENT_PROOF_HEADER]: encodeProof(proof as never) };
}

test("manifest: T0 zero-custody, one tool, no permissions", () => {
  const { plugin } = buildPlugin();
  const m = plugin.manifest();
  assert.equal(m.name, "paper-trail-paid-oracle");
  assert.equal(m.custody, "T0");
  assert.deepEqual(m.capabilities, ["tool"]);
  assert.deepEqual(m.permissions, []);
  assert.equal(m.tools.length, 1);
  assert.equal(m.tools[0].name, "paper-trail-oracle");
});

test("unpaid call -> 402 paywall, oracle never runs (zero free runs)", async () => {
  const { plugin, data } = buildPlugin();
  const r = await plugin.invoke({}, { matchId: "m-1" });
  assert.equal(r.status, 402);
  if (r.status === 402) assert.equal(r.paywall.amount, "5000000");
  assert.equal(data.calls, 0);
});

test("invalid proof -> 402, oracle never runs", async () => {
  const { plugin, data } = buildPlugin();
  const r = await plugin.invoke(
    proofHeaders({ payer: "garbage" }),
    { matchId: "m-1" }
  );
  assert.equal(r.status, 402);
  assert.equal(data.calls, 0);
});

test("paid call -> 200 with snapshot, exactly one oracle query", async () => {
  const { plugin, data } = buildPlugin();
  const r = await plugin.invoke(proofHeaders(), { matchId: "m-1" });
  assert.equal(r.status, 200);
  if (r.status === 200) {
    assert.equal(r.result.ok, true);
    if (r.result.ok) {
      assert.equal(r.result.snapshot.matchId, "m-1");
      assert.equal(r.result.snapshot.leader, "A");
    }
  }
  assert.equal(data.calls, 1);
});

test("paid call for unknown match -> 200 with ok:false reason (still paid)", async () => {
  const { plugin, data } = buildPlugin();
  const r = await plugin.invoke(proofHeaders(), { matchId: "nope" });
  assert.equal(r.status, 200);
  if (r.status === 200) {
    assert.equal(r.result.ok, false);
    assert.match((r.result as { reason: string }).reason, /unknown match/);
  }
  assert.equal(data.calls, 1);
});

test("proof header is case-insensitive at the plugin boundary", async () => {
  const { plugin } = buildPlugin();
  const proof = {
    requestId: "req-plugin-1",
    payer: PAYER,
    amount: "5000000"
  };
  const r = await plugin.invoke(
    { "X-PAPERTRAIL-PROOF": encodeProof(proof as never) },
    { matchId: "m-1" }
  );
  assert.equal(r.status, 200);
});
