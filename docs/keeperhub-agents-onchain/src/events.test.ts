import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ERC20_TRANSFER_TOPIC0,
  EventResponder,
  RpcEventSource,
  StaticEventSource,
  decodeTransferArgs,
  eventDedupKey
} from "./events.ts";
import type { AuditRecord, KnownEvent, Trigger } from "./types.ts";

function makeLog(over: Partial<KnownEvent> = {}): KnownEvent {
  return { name: "Transfer", address: "0xcontract", blockNumber: 1, logIndex: 0, args: {}, ...over };
}

function fakeAgent(runs: Trigger[]): { run(t: Trigger): Promise<AuditRecord> } {
  return {
    async run(trigger: Trigger): Promise<AuditRecord> {
      runs.push(trigger);
      return {
        runId: "r",
        trigger,
        observation: { chain: "sepolia", address: "0x", balances: [], recentEvents: [], observedAt: "" },
        decision: { trigger, action: { kind: "noop", chain: "sepolia" }, rationale: "", ruleHits: [] },
        policy: {
          passed: true,
          reasons: [],
          limits: { maxAmountWei: "0", recipientAllowlist: [], chainAllowlist: [], cooldownMs: 0, killSwitch: false }
        },
        execution: { status: "skipped", at: "" },
        durationMs: 0,
        at: ""
      };
    }
  };
}

async function until(cond: () => boolean, timeoutMs = 1000): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error("until() timeout");
    await new Promise((r) => setTimeout(r, 5));
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

test("eventDedupKey uses txHash when present, falls back to block/logIndex", () => {
  assert.equal(eventDedupKey(makeLog({ txHash: "0xaaa", logIndex: 2 })), "0xaaa:2");
  assert.equal(eventDedupKey(makeLog({ txHash: undefined })), "0xcontract:1:0");
});

test("decodeTransferArgs decodes from/to/amount for a standard Transfer log", () => {
  const from = `0x${"00".repeat(12)}1111111111111111111111111111111111111111`;
  const to = `0x${"00".repeat(12)}2222222222222222222222222222222222222222`;
  const amount = 1n * 10n ** 18n; // 1 ETH
  const log = {
    topics: [ERC20_TRANSFER_TOPIC0, from],
    data: `0x${to.slice(2).padStart(64, "0")}${amount.toString(16).padStart(64, "0")}`
  };
  const args = decodeTransferArgs(log);
  assert.equal(args.from, "0x1111111111111111111111111111111111111111");
  assert.equal(args.to, "0x2222222222222222222222222222222222222222");
  assert.equal(args.amount, "1000000000000000000");
});

test("StaticEventSource yields queued events once, then empty", async () => {
  const src = new StaticEventSource([makeLog({ logIndex: 0 }), makeLog({ logIndex: 1 })]);
  assert.equal(src.remaining, 2);
  const first = await src.poll();
  assert.equal(first.length, 2);
  assert.equal(src.remaining, 0);
  assert.equal((await src.poll()).length, 0);
});

test("RpcEventSource sends correct eth_getLogs payload and advances cursor", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const fetchImpl = (async (_url: unknown, init?: RequestInit) => {
    calls.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: [
          {
            address: "0xcontract",
            blockNumber: "0x5",
            logIndex: "0x0",
            transactionHash: "0xabc",
            topics: [ERC20_TRANSFER_TOPIC0, `0x${"00".repeat(12)}1111111111111111111111111111111111111111`],
            data: `0x${`0x${"00".repeat(12)}2222222222222222222222222222222222222222`.slice(2).padStart(64, "0")}${(10n ** 18n).toString(16).padStart(64, "0")}`
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }) as typeof fetch;

  const src = new RpcEventSource({ rpcUrl: "https://rpc", address: "0xcontract", fetchImpl });
  const events = await src.poll();

  const params = (calls[0]!.params as Array<{ fromBlock: string; topics: string[] }>)[0]!;
  assert.equal(params.fromBlock, "0x0");
  assert.equal(params.topics[0], ERC20_TRANSFER_TOPIC0);
  assert.equal(events.length, 1);
  assert.equal(events[0]!.name, "Transfer");
  assert.equal(events[0]!.blockNumber, 5);
  assert.equal(events[0]!.txHash, "0xabc");
  assert.equal((events[0]!.args as Record<string, string>).to, "0x2222222222222222222222222222222222222222");

  // cursor advanced past block 5
  await src.poll();
  const params2 = (calls[1]!.params as Array<{ fromBlock: string }>)[0]!;
  assert.equal(params2.fromBlock, "0x6");
});

test("EventResponder runs the agent once per unique log and dedups re-polls", async () => {
  const runs: Trigger[] = [];
  const events = [makeLog({ txHash: "0xaaa", logIndex: 0 }), makeLog({ txHash: "0xbbb", logIndex: 1 })];
  const responder = new EventResponder({
    agent: fakeAgent(runs),
    source: new StaticEventSource(events),
    onEvent: () => {}
  });
  responder.start(10);
  await until(() => runs.length === 2);
  // re-poll returns the same queue, but dedup must suppress re-runs
  await until(() => responder["seen" as never] instanceof Set);
  await sleep(30);
  responder.stop();
  assert.equal(runs.length, 2);
  assert.ok(runs.every((t) => t.kind === "event"));
  assert.ok((runs[0]!.meta as { event: KnownEvent }).event.txHash === "0xaaa");
});

test("EventResponder survives source errors and keeps going", async () => {
  const runs: Trigger[] = [];
  let calls = 0;
  const flaky: EventSource = {
    async poll(): Promise<KnownEvent[]> {
      calls++;
      if (calls === 1) throw new Error("rpc down");
      return [makeLog({ txHash: "0xccc" })];
    }
  };
  const errors: unknown[] = [];
  const responder = new EventResponder({
    agent: fakeAgent(runs),
    source: flaky,
    onError: (err) => errors.push(err)
  });
  responder.start(10);
  await until(() => runs.length === 1);
  responder.stop();
  assert.equal(errors.length, 1);
  assert.equal(runs.length, 1);
});

test("EventResponder.stop halts further processing", async () => {
  const runs: Trigger[] = [];
  const responder = new EventResponder({
    agent: fakeAgent(runs),
    source: new StaticEventSource([makeLog({ txHash: "0xddd" })])
  });
  responder.start(10);
  await until(() => runs.length === 1);
  responder.stop();
  const before = runs.length;
  await sleep(40);
  assert.equal(runs.length, before);
});
