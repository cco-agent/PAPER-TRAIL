import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createExecutor,
  KeeperHubMcpClient,
  MockKeeperHubClient
} from "./keeperhub-client.ts";
import type { ActionSpec } from "./types.ts";

const TX_AMOUNT = "100000000000000000"; // 0.1 ETH (wei)

const transfer = (over: Partial<ActionSpec> = {}): ActionSpec => ({
  kind: "transfer",
  to: "0xabcd",
  amountWei: TX_AMOUNT,
  chain: "sepolia",
  ...over
});

test("mock executor: transfer confirms with tx hash", async () => {
  const executor = createExecutor({ mode: "mock", quiet: true });
  const res = await executor.execute(transfer(), { runId: "t1" });
  assert.equal(res.status, "confirmed");
  assert.ok(res.executionId, "has execution id");
  assert.ok(res.txHash?.startsWith("0x"), `tx hash present: ${res.txHash}`);
  assert.equal(res.error, undefined);
});

test("noop action is skipped without an execution", async () => {
  const executor = createExecutor({ mode: "mock", quiet: true });
  const res = await executor.execute({ kind: "noop", chain: "sepolia" }, { runId: "t2" });
  assert.equal(res.status, "skipped");
  assert.equal(res.executionId, undefined);
  assert.equal(res.txHash, undefined);
});

test("check_and_execute with passing condition confirms", async () => {
  const executor = createExecutor({ mode: "mock", quiet: true });
  const res = await executor.execute(
    transfer({ kind: "check_and_execute", note: JSON.stringify({ pass: true }) }),
    { runId: "t3" }
  );
  assert.equal(res.status, "confirmed");
  assert.ok(res.txHash);
});

test("check_and_execute with failing condition is rejected", async () => {
  const executor = createExecutor({ mode: "mock", quiet: true });
  const res = await executor.execute(
    transfer({ kind: "check_and_execute", note: JSON.stringify({ pass: false }) }),
    { runId: "t4" }
  );
  assert.equal(res.status, "rejected");
  assert.match(res.error ?? "", /condition/);
  assert.equal(res.txHash, undefined);
});

test("poll timeout surfaces as failed (no infinite loop)", async () => {
  const executor = createExecutor({ mode: "mock", quiet: true, pollMax: 1 });
  const res = await executor.execute(transfer(), { runId: "t5" });
  assert.equal(res.status, "failed");
  assert.match(res.error ?? "", /timeout/);
});

test("real mode without a key refuses to construct", () => {
  assert.throws(() => createExecutor({ mode: "real", quiet: true }), /kh_ API key/);
  assert.throws(() => new KeeperHubMcpClient({}), /requires a kh_/);
});

test("auto mode without a key falls back to mock (loudly)", async () => {
  const executor = createExecutor({ quiet: true });
  const res = await executor.execute(transfer(), { runId: "t6" });
  assert.equal(res.status, "confirmed");
});

test("mock poll transitions pending -> confirmed", async () => {
  const client = new MockKeeperHubClient({ quiet: true });
  const first = await client.transfer({ to: "0x1", amountWei: TX_AMOUNT, chain: "sepolia" });
  assert.equal(first.status, "queued");
  const p1 = await client.poll(first.executionId);
  assert.equal(p1.status, "pending");
  const p2 = await client.poll(first.executionId);
  assert.equal(p2.status, "confirmed");
  assert.ok(p2.txHash?.startsWith("0x"));
});

test("malformed note defaults to a passing condition", async () => {
  const executor = createExecutor({ mode: "mock", quiet: true });
  const res = await executor.execute(
    transfer({ kind: "check_and_execute", note: "not-json" }),
    { runId: "t7" }
  );
  assert.equal(res.status, "confirmed");
});
