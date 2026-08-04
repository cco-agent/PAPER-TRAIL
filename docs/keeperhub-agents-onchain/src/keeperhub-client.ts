/**
 * keeperhub-client — KeeperHub MCP wrapper for the Shredder Sentinel agent.
 *
 * Transport behind the KeeperHubExecutor interface:
 *   - KeeperHubMcpClient  — real MCP transport (https://app.keeperhub.com/mcp),
 *                           requires a kh_ API key or OAuth bearer token.
 *   - MockKeeperHubClient — deterministic in-memory transport for tests/demo.
 *                           NEVER submits a real transaction.
 *
 * Tool names verified 2026-08-04 against public repos that ran the live MCP
 * (bilgin-kocak/zeroclaw, XVSHIFU/keeperhub-risk-guardian, sejoroajose/swarmfi,
 * Philotheephilix/computepool feedback, official KeeperHub/keeperhub docs):
 *   - execute_transfer            -> returns camelCase executionId
 *   - execute_check_and_execute   -> conditional execution (fallback path)
 *   - get_direct_execution_status -> poller for direct executions; takes
 *                                    snake_case execution_id (NOT get_execution)
 *   - simulate:true               -> dry-run, recommended by official quickstart
 * Final response-shape check still happens once a real kh_ key is available.
 */

import type { ActionSpec, ExecutionResult } from "./types.ts";
import type { KeeperHubExecutor } from "./execute.ts";

export interface KeeperHubExecution {
  executionId: string;
  status: "queued" | "pending" | "confirmed" | "failed" | "rejected";
  txHash?: string;
  error?: string;
}

export interface TransferParams {
  to: string;
  amountWei: string;
  chain: string;
  token?: string; // absent = native
  simulate?: boolean; // KeeperHub dry-run (official quickstart pattern)
}

export interface CheckAndExecuteParams extends TransferParams {
  condition?: Record<string, unknown>;
}

/** Minimal client surface the executor adapter needs. */
export interface KeeperHubClient {
  transfer(params: TransferParams): Promise<KeeperHubExecution>;
  checkAndExecute(params: CheckAndExecuteParams): Promise<KeeperHubExecution>;
  poll(executionId: string): Promise<KeeperHubExecution>;
}

const DEFAULT_ENDPOINT = "https://app.keeperhub.com/mcp";
// Verified 2026-08-04: direct executions are polled via get_direct_execution_status
// with snake_case execution_id (multiple public integrations confirm this).
const DEFAULT_POLL_TOOL = "get_direct_execution_status";

function iso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Real transport. Throws at construction if no key — never silently mocks. */
export class KeeperHubMcpClient implements KeeperHubClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly pollToolName: string;
  private readonly quiet: boolean;

  constructor(opts: { endpoint?: string; apiKey?: string; pollToolName?: string; quiet?: boolean } = {}) {
    if (!opts.apiKey) {
      throw new Error(
        "KeeperHubMcpClient requires a kh_ API key or OAuth bearer token. " +
          "Set KH_API_KEY (or pass apiKey) to enable real onchain execution."
      );
    }
    this.endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
    this.apiKey = opts.apiKey;
    this.pollToolName = opts.pollToolName ?? DEFAULT_POLL_TOOL;
    this.quiet = opts.quiet ?? false;
  }

  private log(line: string): void {
    if (!this.quiet) console.log(line);
  }

  /** MCP tools/call over streamable HTTP (JSON-RPC 2.0). */
  private async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `cco-${Date.now()}`,
        method: "tools/call",
        params: { name, arguments: args }
      })
    });
    if (!res.ok) {
      throw new Error(`KeeperHub MCP call "${name}" failed: HTTP ${res.status} ${res.statusText}`);
    }
    const body = await res.json();
    if (body?.error) throw new Error(`KeeperHub MCP error on "${name}": ${JSON.stringify(body.error)}`);
    return body?.result ?? body;
  }

  /** Tolerant extraction of execution fields from MCP tool result content. */
  private normalize(raw: any): KeeperHubExecution {
    const content = Array.isArray(raw?.content) ? raw.content : [];
    let parsed: Record<string, unknown> = {};
    for (const item of content) {
      if (item?.type === "text" && typeof item.text === "string") {
        try {
          parsed = { ...parsed, ...JSON.parse(item.text) };
        } catch {
          parsed = { ...parsed, text: item.text };
        }
      }
    }
    // Accept camelCase (execute_* responses) and snake_case (poll responses).
    const src = parsed.executionId || parsed.id || parsed.execution_id ? parsed : raw ?? {};
    const txHash = String(src.transactionHash ?? src.transaction_hash ?? src.txHash ?? "");
    return {
      executionId: String(src.executionId ?? src.execution_id ?? src.id ?? "unknown"),
      status: (src.status ?? "pending") as KeeperHubExecution["status"],
      txHash: txHash || undefined,
      error: src.error ? String(src.error) : undefined
    };
  }

  async transfer(params: TransferParams): Promise<KeeperHubExecution> {
    const mode = params.simulate ? "simulate" : "execute";
    this.log(`[keeperhub-client] ${mode}_transfer ${params.amountWei} -> ${params.to} (${params.chain})`);
    return this.normalize(await this.callTool("execute_transfer", params));
  }

  async checkAndExecute(params: CheckAndExecuteParams): Promise<KeeperHubExecution> {
    this.log(`[keeperhub-client] execute_check_and_execute ${params.amountWei} -> ${params.to} (${params.chain})`);
    return this.normalize(await this.callTool("execute_check_and_execute", params));
  }

  async poll(executionId: string): Promise<KeeperHubExecution> {
    // get_direct_execution_status takes snake_case execution_id (verified).
    return this.normalize(await this.callTool(this.pollToolName, { execution_id: executionId }));
  }
}

/** Deterministic in-memory transport. Never touches a real chain. */
export class MockKeeperHubClient implements KeeperHubClient {
  private counter = 0;
  private pollCount = new Map<string, number>();
  private readonly quiet: boolean;

  constructor(opts: { quiet?: boolean } = {}) {
    this.quiet = opts.quiet ?? false;
  }

  private log(line: string): void {
    if (!this.quiet) console.log(line);
  }

  private newExecution(status: KeeperHubExecution["status"], extra?: Partial<KeeperHubExecution>): KeeperHubExecution {
    this.counter++;
    return { executionId: `exe_mock_${this.counter}`, status, ...extra };
  }

  async transfer(params: TransferParams): Promise<KeeperHubExecution> {
    this.log(`[keeperhub-client:mock] transfer ${params.amountWei} -> ${params.to} (${params.chain}) — MOCK, no real tx`);
    const execution = this.newExecution("queued");
    this.pollCount.set(execution.executionId, 0);
    return execution;
  }

  async checkAndExecute(params: CheckAndExecuteParams): Promise<KeeperHubExecution> {
    if (params.condition?.pass !== true) {
      this.log("[keeperhub-client:mock] check_and_execute condition NOT met — rejected (no tx)");
      return this.newExecution("rejected", { error: "condition not met (mock)" });
    }
    this.log("[keeperhub-client:mock] check_and_execute condition met — executing transfer");
    return this.transfer({ to: params.to, amountWei: params.amountWei, chain: params.chain, token: params.token });
  }

  async poll(executionId: string): Promise<KeeperHubExecution> {
    const n = (this.pollCount.get(executionId) ?? 0) + 1;
    this.pollCount.set(executionId, n);
    if (n === 1) return { executionId, status: "pending" };
    const txHash = `0x${executionId.replace("exe_mock_", "mock").slice(0, 56).padStart(64, "0")}`;
    return { executionId, status: "confirmed", txHash };
  }
}

/** Adapts any KeeperHubClient to the core's KeeperHubExecutor interface. */
export class KeeperHubExecutorAdapter implements KeeperHubExecutor {
  private readonly client: KeeperHubClient;
  private readonly pollMax: number;
  private readonly pollIntervalMs: number;

  constructor(client: KeeperHubClient, opts: { pollMax?: number; pollIntervalMs?: number } = {}) {
    this.client = client;
    this.pollMax = opts.pollMax ?? 10;
    this.pollIntervalMs = opts.pollIntervalMs ?? 0;
  }

  private async pollUntil(executionId: string): Promise<ExecutionResult> {
    for (let i = 0; i < this.pollMax; i++) {
      const current = await this.client.poll(executionId);
      if (current.status === "confirmed" || current.status === "failed" || current.status === "rejected") {
        return {
          status: current.status,
          executionId: current.executionId,
          txHash: current.txHash,
          error: current.error,
          at: iso()
        };
      }
      await sleep(this.pollIntervalMs);
    }
    return { status: "failed", executionId, error: "poll timeout", at: iso() };
  }

  async execute(action: ActionSpec, _ctx: { runId: string }): Promise<ExecutionResult> {
    const at = iso();
    if (action.kind === "noop") {
      return { status: "skipped", at };
    }
    if (action.kind !== "transfer" && action.kind !== "check_and_execute") {
      return { status: "rejected", error: `unsupported action kind: ${action.kind}`, at };
    }
    if (!action.to || !action.amountWei) {
      return { status: "rejected", error: "action requires to + amountWei", at };
    }
    const base: TransferParams = { to: action.to, amountWei: action.amountWei, chain: action.chain, token: action.token };
    let first: KeeperHubExecution;
    if (action.kind === "transfer") {
      first = await this.client.transfer(base);
    } else {
      first = await this.client.checkAndExecute({ ...base, condition: parseCondition(action.note) });
    }
    if (first.status === "rejected" || first.status === "failed") {
      return { status: first.status, executionId: first.executionId, error: first.error, at };
    }
    return this.pollUntil(first.executionId);
  }
}

/** check_and_execute conditions ride on ActionSpec.note as JSON (documented). */
function parseCondition(note?: string): Record<string, unknown> {
  if (!note) return { pass: true };
  try {
    const parsed = JSON.parse(note);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { pass: true };
  } catch {
    return { pass: true };
  }
}

export interface ExecutorOptions {
  mode?: "auto" | "mock" | "real";
  apiKey?: string;
  endpoint?: string;
  quiet?: boolean;
  pollMax?: number;
  pollIntervalMs?: number;
}

/**
 * Factory. "auto" uses the real transport when KH_API_KEY is present,
 * otherwise falls back to the mock and says so loudly (honesty first).
 */
export function createExecutor(opts: ExecutorOptions = {}): KeeperHubExecutor {
  const mode = opts.mode ?? "auto";
  if (mode === "mock") {
    return new KeeperHubExecutorAdapter(new MockKeeperHubClient({ quiet: opts.quiet }), opts);
  }
  if (mode === "real") {
    const client = new KeeperHubMcpClient({ apiKey: opts.apiKey, endpoint: opts.endpoint, quiet: opts.quiet });
    return new KeeperHubExecutorAdapter(client, opts);
  }
  if (opts.apiKey) {
    const client = new KeeperHubMcpClient({ apiKey: opts.apiKey, endpoint: opts.endpoint, quiet: opts.quiet });
    return new KeeperHubExecutorAdapter(client, opts);
  }
  if (!opts.quiet) {
    console.log(
      "[keeperhub-client] WARNING: no kh_ API key — falling back to MOCK transport. " +
        "Set KH_API_KEY for real onchain execution."
    );
  }
  return new KeeperHubExecutorAdapter(new MockKeeperHubClient({ quiet: opts.quiet }), opts);
}
