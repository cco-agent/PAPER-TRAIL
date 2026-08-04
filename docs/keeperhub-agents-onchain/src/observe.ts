import type { ObservationSnapshot, Trigger } from "./types.ts";

export interface Observer {
  observe(trigger: Trigger): Promise<ObservationSnapshot>;
}

export interface RpcObserverOptions {
  rpcUrl: string;
  address: string;
  chain: string;
  symbol?: string;
}

/** Native balance via eth_getBalance (JSON-RPC). Dependency-free (global fetch). */
export class RpcObserver implements Observer {
  private readonly rpcUrl: string;
  private readonly address: string;
  private readonly chain: string;
  private readonly symbol: string;

  constructor(opts: RpcObserverOptions) {
    this.rpcUrl = opts.rpcUrl;
    this.address = opts.address;
    this.chain = opts.chain;
    this.symbol = opts.symbol ?? "ETH";
  }

  async observe(_trigger: Trigger): Promise<ObservationSnapshot> {
    const resp = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [this.address, "latest"] })
    });
    if (!resp.ok) throw new Error(`RPC error ${resp.status}: ${await resp.text()}`);
    const json = (await resp.json()) as { result?: string; error?: { message?: string } };
    if (json.error) throw new Error(`RPC error: ${json.error.message ?? JSON.stringify(json.error)}`);
    if (!json.result) throw new Error("RPC error: empty result");
    const wei = BigInt(json.result).toString(); // hex → decimal string
    return {
      chain: this.chain,
      address: this.address,
      balances: [{ chain: this.chain, address: this.address, wei, symbol: this.symbol }],
      recentEvents: [],
      observedAt: new Date().toISOString()
    };
  }
}

/** Fixed snapshot — for CLI demo, x402 payloads and tests. */
export class StaticObserver implements Observer {
  private readonly snapshot: ObservationSnapshot;

  constructor(snapshot: ObservationSnapshot) {
    this.snapshot = snapshot;
  }

  async observe(_trigger: Trigger): Promise<ObservationSnapshot> {
    return this.snapshot;
  }
}
