import { test } from "node:test";
import assert from "node:assert/strict";

import {
  type PaymentProof,
  type PaymentRequest,
  decodeBase58,
  decodePaywall,
  decodeProof,
  encodePaywall,
  encodeProof,
  InMemoryPaymentVerifier,
  isValidPubkey,
  PaidGate,
  parseProofFromHeaders
} from "./payment-gate.ts";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const RECIPIENT = "A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH";
const PAYER = "Cco1111111111111111111111111111111111111111";

function makeRequest(): PaymentRequest {
  return {
    requestId: "req-1",
    amount: "10000000", // 0.01 SOL in lamports
    mint: SOL_MINT,
    recipient: RECIPIENT,
    description: "one PAPER TRAIL match snapshot",
    chain: "devnet"
  };
}

function makeProof(overrides: Partial<PaymentProof> = {}): PaymentProof {
  return {
    requestId: "req-1",
    payer: PAYER,
    amount: "10000000",
    ...overrides
  };
}

const verifier = new InMemoryPaymentVerifier();

// --- base58 / pubkey ---

test("base58: SOL mint decodes to 32 bytes", () => {
  const decoded = decodeBase58(SOL_MINT);
  assert.ok(decoded !== null);
  assert.equal(decoded.length, 32);
});

test("base58: invalid character returns null", () => {
  assert.equal(decodeBase58("0OIl"), null); // 0, O, I, l are not in the alphabet
});

test("pubkey: 32-byte base58 accepted, wrong lengths rejected", () => {
  assert.equal(isValidPubkey(SOL_MINT), true);
  assert.equal(isValidPubkey(RECIPIENT), true);
  assert.equal(isValidPubkey("1"), false);
  assert.equal(isValidPubkey("11111111111111111111111111111111"), false); // 31 bytes
});

// --- header round-trips ---

test("paywall header round-trips", () => {
  const req = makeRequest();
  const decoded = decodePaywall(encodePaywall(req));
  assert.deepEqual(decoded, req);
});

test("proof header round-trips", () => {
  const proof = makeProof();
  const decoded = decodeProof(encodeProof(proof));
  assert.deepEqual(decoded, proof);
});

test("parseProofFromHeaders is case-insensitive and tolerates garbage", () => {
  const proof = makeProof();
  const encoded = encodeProof(proof);
  assert.deepEqual(parseProofFromHeaders({ "X-PAPERTRAIL-PROOF": encoded }), proof);
  assert.equal(parseProofFromHeaders({ "x-papertrail-proof": "not-base64url-json" }), undefined);
  assert.equal(parseProofFromHeaders({}), undefined);
});

// --- verification ---

test("verifier: requestId mismatch is rejected", async () => {
  const r = await verifier.verify(makeProof({ requestId: "req-2" }), makeRequest());
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /requestId/);
});

test("verifier: invalid payer pubkey is rejected", async () => {
  const r = await verifier.verify(makeProof({ payer: "not-a-pubkey" }), makeRequest());
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /payer/);
});

test("verifier: underpayment is rejected, exact and overpayment accepted", async () => {
  const req = makeRequest();
  const under = await verifier.verify(makeProof({ amount: "9999999" }), req);
  assert.equal(under.ok, false);
  const exact = await verifier.verify(makeProof({ amount: "10000000" }), req);
  assert.equal(exact.ok, true);
  const over = await verifier.verify(makeProof({ amount: "20000000" }), req);
  assert.equal(over.ok, true);
});

test("verifier: non-numeric amount is rejected", async () => {
  const r = await verifier.verify(makeProof({ amount: "1e6" }), makeRequest());
  assert.equal(r.ok, false);
});

// --- gate ---

test("gate: no proof -> payment_required with paywall", async () => {
  const gate = new PaidGate(makeRequest(), verifier);
  const r = await gate.check(undefined);
  assert.equal(r.status, "payment_required");
  if (r.status === "payment_required") assert.equal(r.paywall.amount, "10000000");
});

test("gate: invalid proof -> payment_required, valid proof -> paid", async () => {
  const gate = new PaidGate(makeRequest(), verifier);
  const bad = await gate.check(makeProof({ payer: "garbage" }));
  assert.equal(bad.status, "payment_required");
  const good = await gate.check(makeProof());
  assert.equal(good.status, "paid");
});
