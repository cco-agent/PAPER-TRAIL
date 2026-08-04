import { randomUUID } from "node:crypto";
import type { AuditRecord, ExecutionResult, Trigger } from "./types.ts";
import type { AgentConfig } from "./config.ts";
import type { Observer } from "./observe.ts";
import type { RationaleFn, RulesFirstDecider } from "./decide.ts";
import type { PolicyGate } from "./policy.ts";
import type { KeeperHubExecutor } from "./execute.ts";
import type { JsonlAuditLog } from "./audit.ts";

export interface AgentDeps {
  observer: Observer;
  decider: RulesFirstDecider;
  policy: PolicyGate;
  executor: KeeperHubExecutor;
  audit: JsonlAuditLog;
  rationaleFn?: RationaleFn;
}

/** The single execution core shared by guardian / event / x402 / manual modes. */
export class Agent {
  private readonly config: AgentConfig;
  private readonly deps: AgentDeps;

  constructor(config: AgentConfig, deps: AgentDeps) {
    this.config = config;
    this.deps = deps;
  }

  async run(trigger: Trigger): Promise<AuditRecord> {
    const runId = randomUUID();
    const started = Date.now();

    const observation = await this.deps.observer.observe(trigger);
    const decision = await this.deps.decider.decide(trigger, observation, this.config, this.deps.rationaleFn);
    const policy = this.deps.policy.check(decision, this.config);

    let execution: ExecutionResult;
    if (!policy.passed) {
      execution = { status: "rejected", error: policy.reasons.join("; "), at: new Date().toISOString() };
    } else if (decision.action.kind === "noop") {
      execution = { status: "skipped", error: "noop decision — nothing executed", at: new Date().toISOString() };
    } else {
      execution = await this.deps.executor.execute(decision.action, { runId });
    }

    const record: AuditRecord = {
      runId,
      trigger,
      observation,
      decision,
      policy,
      execution,
      durationMs: Date.now() - started,
      at: new Date().toISOString()
    };
    await this.deps.audit.append(record);
    return record;
  }
}
