/**
 * Shredder Sentinel — event responder mode.
 *
 * Bridges an on-chain event source (eth_getLogs) to the agent core. Every
 * unique log becomes a Trigger of kind "event" and runs through
 * observe → decide → policy → execute → audit. Logs are deduplicated by
 * txHash:logIndex (fallback address:blockNumber:logIndex) so a log is never
 * processed twice, even if re-polled.
 */
import type { Agent } from "./agent.ts";
import type { AuditRecord, KnownEvent, Trigger } from "./types.ts";

export interface EventSource {
  poll(): Promise<KnownEvent[]>;
}

/** ERC-20 Transfer topic0 — auto-decoded when matched. */
export const ERC20_TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export interface RpcEventSourceOptions {
  rpcUrl: string;
  address: string; // contract address to watch
  topics?: string[]; // topic0 filter (defaults to ERC-20 Transfer)
  fromBlock?: bigint; // first block to scan (default 0n; cursor advances after each poll)
  fetchImpl?: typeof fetch;
}

/**
 * Decode a standard ERC-20 Transfer log without an ABI library:
 * from = topics[1] (indexed, 32-byte padded address), to = data[0..32], amount = data[32..64].
 */
export function decodeTransferArgs(log: { topics?: string[]; data?: string }): Record<string, string> {
  const topics = log.topics ?? [];
  const data = log.data ?? "0x";
  const from = topics[1] ? `0x${topics[1]!.slice(-40)}` : "";
  const to = data.length >= 66 ? `0x${data.slice(26, 66)}` : ""; // skip 0x + 12 zero bytes
  const amount = data.length >= 130 ? BigInt(`0x${data.slice(66, 130)}`).toString() : "0";
  return { from, to, amount };
}

/** Polls eth_getLogs for a contract address. Dependency-free (global fetch). */
export class RpcEventSource implements EventSource {
  private readonly rpcUrl: string;
  private readonly address: string;
  private readonly topics: string[];
  private readonly fetchImpl: typeof fetch;
  private cursorBlock: bigint;

  constructor(opts: RpcEventSourceOptions) {
    this.rpcUrl = opts.rpcUrl;
    this.address = opts.address;
    this.topics = opts.topics ?? [ERC20_TRANSFER_TOPIC0];
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.cursorBlock = opts.fromBlock ?? 0n;
  }

  async poll(): Promise<KnownEvent[]> {
    const fromBlock = this.cursorBlock;
    const resp = await this.fetchImpl(this.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getLogs",
        params: [
          {
            address: this.address,
            topics: this.topics,
            fromBlock: `0x${fromBlock.toString(16)}`,
            toBlock: "latest"
          }
        ]
      })
    });
    if (!resp.ok) throw new Error(`RPC error ${resp.status}: ${await resp.text()}`);
    const json = (await resp.json()) as { result?: unknown[]; error?: { message?: string } };
    if (json.error) throw new Error(`RPC error: ${json.error.message ?? JSON.stringify(json.error)}`);

    const logs = (json.result ?? []) as Array<{
      address?: string;
      blockNumber?: string;
      logIndex?: string;
      transactionHash?: string;
      topics?: string[];
      data?: string;
    }>;

    const events: KnownEvent[] = logs.map((log) => {
      const blockNumber = Number.parseInt(log.blockNumber ?? "0x0", 16);
      const logIndex = Number.parseInt(log.logIndex ?? "0x0", 16);
      const topic0 = log.topics?.[0] ?? "";
      const isTransfer = topic0 === ERC20_TRANSFER_TOPIC0;
      const args: Record<string, unknown> = isTransfer
        ? decodeTransferArgs(log)
        : { topic0, data: log.data };
      return {
        name: isTransfer ? "Transfer" : topic0 || "log",
        address: log.address ?? this.address,
        blockNumber,
        logIndex,
        txHash: log.transactionHash,
        data: log.data,
        args
      };
    });

    if (events.length > 0) {
      const last = Math.max(...events.map((e) => e.blockNumber));
      this.cursorBlock = BigInt(last) + 1n;
    }
    return events;
  }
}

/** Fixed queue of events — for CLI demos and tests. */
export class StaticEventSource implements EventSource {
  private readonly queue: KnownEvent[];
  private cursor = 0;

  constructor(events: KnownEvent[]) {
    this.queue = events;
  }

  get remaining(): number {
    return this.queue.length - this.cursor;
  }

  async poll(): Promise<KnownEvent[]> {
    const out = this.queue.slice(this.cursor);
    this.cursor = this.queue.length;
    return out;
  }
}

export function eventDedupKey(ev: KnownEvent): string {
  return ev.txHash ? `${ev.txHash}:${ev.logIndex}` : `${ev.address}:${ev.blockNumber}:${ev.logIndex}`;
}

export interface EventResponderOptions {
  agent: Pick<Agent, "run">;
  source: EventSource;
  onEvent?: (event: KnownEvent, record: AuditRecord) => void;
  onError?: (err: unknown) => void;
}

/** Polls an EventSource and runs the agent core once per unique log. */
export class EventResponder {
  private readonly seen = new Set<string>();
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(private readonly opts: EventResponderOptions) {}

  start(intervalMs: number): void {
    const tick = async (): Promise<void> => {
      if (this.stopped) return;
      try {
        const events = await this.opts.source.poll();
        for (const ev of events) {
          const key = eventDedupKey(ev);
          if (this.seen.has(key)) continue;
          this.seen.add(key);
          const trigger: Trigger = {
            kind: "event",
            source: `event:${ev.name}@${ev.address}`,
            at: new Date().toISOString(),
            meta: { event: ev }
          };
          const record = await this.opts.agent.run(trigger);
          this.opts.onEvent?.(ev, record);
        }
      } catch (err) {
        this.opts.onError?.(err);
      }
    };
    void tick();
    this.timer = setInterval(() => void tick(), intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }
}
