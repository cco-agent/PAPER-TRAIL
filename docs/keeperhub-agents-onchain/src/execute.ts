import type { ActionSpec, ExecutionResult } from "./types.ts";

export interface KeeperHubExecutor {
  /** Execute an action via KeeperHub. Returns execution + tx info. */
  execute(action: ActionSpec, ctx: { runId: string }): Promise<ExecutionResult>;
}

/**
 * Honest no-op transport. Logs what WOULD be executed and returns "skipped".
 * The real KeeperHub MCP transport (kh_ key / OAuth → execute_transfer /
 * execute_check_and_execute) plugs in behind this interface without touching
 * the core pipeline.
 */
export class LoggingExecutor implements KeeperHubExecutor {
  private readonly out: (line: string) => void;

  constructor(out?: (line: string) => void) {
    this.out = out ?? ((line: string) => console.log(line));
  }

  async execute(action: ActionSpec, ctx: { runId: string }): Promise<ExecutionResult> {
    this.out(`[LoggingExecutor] run=${ctx.runId} would execute: ${JSON.stringify(action)}`);
    return {
      status: "skipped",
      error: "no KeeperHub transport configured (kh_ API key / OAuth required)",
      at: new Date().toISOString()
    };
  }
}
