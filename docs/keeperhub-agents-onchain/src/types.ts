/**
 * Shredder Sentinel — agent-core types.
 * All amounts are decimal strings (wei) to avoid float drift.
 */

export type TriggerKind = "guardian" | "event" | "x402" | "manual";

export interface Trigger {
  kind: TriggerKind;
  source: string; // e.g. "guardian:wallet:0xabc" | "event:Transfer@0xdef" | "x402:req_123"
  at: string; // ISO timestamp
  meta?: Record<string, unknown>;
}

export interface BalanceSnapshot {
  chain: string;
  address: string;
  wei: string; // raw amount as decimal string
  symbol: string;
  blockNumber?: number;
}

export interface KnownEvent {
  name: string;
  address: string;
  blockNumber: number;
  logIndex: number;
  txHash?: string; // for dedup + explorer links
  data?: string; // raw log data (un-decoded remainder)
  args: Record<string, unknown>;
}

export interface ObservationSnapshot {
  chain: string;
  address: string;
  balances: BalanceSnapshot[];
  recentEvents: KnownEvent[];
  observedAt: string; // ISO
  raw?: Record<string, unknown>;
}

export type ActionKind = "transfer" | "check_and_execute" | "noop";

export interface ActionSpec {
  kind: ActionKind;
  to?: string;
  amountWei?: string;
  token?: string; // absent = native
  chain: string;
  note?: string;
}

export interface Decision {
  trigger: Trigger;
  action: ActionSpec; // "noop" = do nothing
  rationale: string;
  ruleHits: string[];
  llm?: { model: string; raw?: string };
}

export interface PolicyLimits {
  maxAmountWei: string;
  recipientAllowlist: string[];
  chainAllowlist: string[];
  cooldownMs: number;
  killSwitch: boolean;
}

export interface PolicyCheck {
  passed: boolean;
  reasons: string[];
  limits: PolicyLimits;
}

export type ExecutionStatus = "queued" | "pending" | "confirmed" | "failed" | "rejected" | "skipped";

export interface ExecutionResult {
  status: ExecutionStatus;
  executionId?: string; // KeeperHub execution id
  txHash?: string;
  error?: string;
  gasUsed?: string;
  at: string; // ISO
}

export interface AuditRecord {
  runId: string;
  trigger: Trigger;
  observation: ObservationSnapshot;
  decision: Decision;
  policy: PolicyCheck;
  execution: ExecutionResult;
  durationMs: number;
  at: string; // ISO
}
