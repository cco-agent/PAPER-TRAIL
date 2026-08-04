import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentVerifier,
  NATIVE_SOL_MINT,
  SolanaRpcPaymentVerifier,
  type RpcCall
} from "./solana-verifier.ts";
import {
  InMemoryPaymentVerifier,
  type PaymentProof,
  type PaymentRequest
} from "./payment-gate.ts";

const RECIPIENT = "A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH";
// System Program (32 zero bytes) - structurally valid 32-byte pubkey.
const PAYER = "11111111111111111111111111111111";
// USDC mint (SPL) - used to prove the SPL path is honestly rejected.
const SPL_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
// 64 zero bytes - structurally valid 64-byte ed25519 signature.
const SIG = "1".repeat(64);
// Distinct structurally-valid signature (63 zero bytes + value 2).
const SIG2 = "1".repeat(63) + "2";

function makeRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    requestId: "req-1",
    amount: "100000000", // 0.1 SOL in lamports
    mint: NATIVE_SOL_MINT,
    recipient: RECIPIENT,
    chain: "mainnet",
    description: "oracle query",
    ...overrides
  };
}

function makeProof(overrides: Partial<PaymentProof> = {}): PaymentProof {
  return {
    requestId: "req-1",
    payer: PAYER,
    amount: "100000000",
    signature: SIG,
    ...overrides
  };
}

function txRpc(opts: {
  keys?: string[];
  err?: unknown;
  pre?: number[];
  post?: number[];
  notFound?: boolean;
  rpcError?: { code: number; message: string };
} = {}): RpcCall {
  if (opts.notFound) {
    return async () => ({ result: null });
  }
  if (opts.rpcError !== undefined) {
    return async () => ({ error: opts.rpcError });
  }
  return async () => ({
    result: {
      transaction: {
        message: {
          accountKeys: opts.keys ?? [PAYER, RECIPIENT, "11111111111111111111111111111111"]
        }
      },
      meta: {
        err: opts.err ?? null,
        preBalances: opts.pre ?? [1_000_000_000, 0, 1],
        postBalances: opts.post ?? [899_900_000, 100_000_000, 1]
      },
      slot: 123
    }
  });
}

test("constructor throws without rpcUrl or rpcCall (no silent mocks)", () => {
  assert.throws(() => new SolanaRpcPaymentVerifier({}));
});

test("factory: chain without RPC throws; memory returns InMemory", () => {
  assert.throws(() => createPaymentVerifier("chain", {}));
  const memory = createPaymentVerifier("memory");
  assert.ok(memory instanceof InMemoryPaymentVerifier);
});

test("rejects proof without signature", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const res = await v.verify(makeProof({ signature: undefined }), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /signature/);
});

test("rejects requestId mismatch before touching RPC", async () => {
  let called = false;
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: async () => {
      called = true;
      return { result: null };
    }
  });
  const res = await v.verify(makeProof({ requestId: "other" }), makeRequest());
  assert.equal(res.ok, false);
  assert.equal(called, false);
});

test("rejects invalid payer pubkey", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const res = await v.verify(makeProof({ payer: "short" }), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /payer/);
});

test("rejects amount below required", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const res = await v.verify(makeProof({ amount: "1" }), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /required/);
});

test("rejects invalid signature encoding", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const res = await v.verify(makeProof({ signature: "not-base58!!!" }), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /64-byte/);
});

test("rejects transaction not found on chain", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc({ notFound: true }) });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /not found/);
});

test("rejects failed transaction (meta.err set)", async () => {
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: txRpc({ err: { InstructionError: [0, "Custom"] } })
  });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /failed on chain/);
});

test("rejects when recipient is not in account keys", async () => {
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: txRpc({ keys: [PAYER, "11111111111111111111111111111111"] })
  });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /not involved/);
});

test("rejects when balance delta is below required", async () => {
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: txRpc({ post: [1_000_000_000, 50_000_000, 1] })
  });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /delta/);
});

test("accepts SOL transfer with delta >= required", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, true);
});

test("honestly rejects SPL mint (SOL native only)", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const res = await v.verify(makeProof(), makeRequest({ mint: SPL_MINT }));
  assert.equal(res.ok, false);
  assert.match(res.reason, /SPL/);
});

test("rejects on RPC transport error (fail closed)", async () => {
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: async () => {
      throw new Error("network down");
    }
  });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /transport/i);
});

test("rejects on RPC error response", async () => {
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: txRpc({ rpcError: { code: -32000, message: "Slot 0 was skipped" } })
  });
  const res = await v.verify(makeProof(), makeRequest());
  assert.equal(res.ok, false);
  assert.match(res.reason, /RPC error/);
});

test("replay protection: same signature redeemed twice is rejected", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const first = await v.verify(makeProof(), makeRequest());
  assert.equal(first.ok, true);
  const second = await v.verify(makeProof(), makeRequest());
  assert.equal(second.ok, false);
  assert.match(second.reason, /already redeemed/);
});

test("replay protection: distinct signatures both pass", async () => {
  const v = new SolanaRpcPaymentVerifier({ rpcCall: txRpc() });
  const a = await v.verify(makeProof({ signature: SIG }), makeRequest());
  const b = await v.verify(makeProof({ signature: SIG2 }), makeRequest());
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
});

test("replay protection can be disabled", async () => {
  const v = new SolanaRpcPaymentVerifier({
    rpcCall: txRpc(),
    replayProtection: false
  });
  const first = await v.verify(makeProof(), makeRequest());
  assert.equal(first.ok, true);
  const second = await v.verify(makeProof(), makeRequest());
  assert.equal(second.ok, true);
});
