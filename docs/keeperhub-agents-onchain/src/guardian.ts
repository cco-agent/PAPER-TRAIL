/**
 * Shredder Sentinel — Guardian scheduler.
 *
 * Watches a wallet / position through an Observer and, when a configured
 * threshold is crossed (and its cooldown is clear), emits a Trigger for the
 * agent core. All amounts are decimal strings (wei) to avoid float drift.
 */
import type { BalanceSnapshot, ObservationSnapshot, Trigger } from "./types.ts";
import type { Observer } from "./observe.ts";

export type ThresholdOp = "lt" | "lte" | "gt" | "gte";

export interface GuardianThreshold {
  symbol: string; // balance to watch (matched by symbol)
  op: ThresholdOp;
  wei: string; // threshold amount in wei (decimal string)
  cooldownMs?: number; // min gap between firings of this rule
}

export interface GuardianConfig {
  source: string; // e.g. "guardian:wallet:0xabc"
  address: string;
  chain: string;
  thresholds: GuardianThreshold[];
  pollIntervalMs?: number;
  runOnStart?: boolean;
}

export interface GuardianVerdict {
  fired: boolean;
  rule: GuardianThreshold;
  balance?: BalanceSnapshot;
  reason: "fired" | "no_balance" | "no_hit" | "cooldown";
  cooldownRemainingMs?: number;
}

export interface GuardianStateStore {
  lastFiredAt(key: string): Promise<number | null>;
  setFiredAt(key: string, at: number): Promise<void>;
}

/** In-memory firing ledger. Swap for SQLite/Redis on a long-lived guardian. */
export class InMemoryGuardianState implements GuardianStateStore {
  private readonly fired = new Map<string, number>();

  async lastFiredAt(key: string): Promise<number | null> {
    return this.fired.get(key) ?? null;
  }

  async setFiredAt(key: string, at: number): Promise<void> {
    this.fired.set(key, at);
  }
}

const WEI_RE = /^[0-9]+$/;

export function validateThreshold(rule: GuardianThreshold): void {
  if (!WEI_RE.test(rule.wei)) {
    throw new Error(`guardian: invalid threshold wei "${rule.wei}" (decimal string required)`);
  }
  if (rule.cooldownMs !== undefined && (!Number.isInteger(rule.cooldownMs) || rule.cooldownMs < 0)) {
    throw new Error(`guardian: invalid cooldownMs ${rule.cooldownMs}`);
  }
}

function ruleKey(rule: GuardianThreshold, config: GuardianConfig): string {
  return config.source + "#" + rule.symbol + ":" + rule.op + ":" + rule.wei;
}

function compare(actual: bigint, op: ThresholdOp, threshold: bigint): boolean {
  switch (op) {
    case "lt":
      return actual < threshold;
    case "lte":
      return actual <= threshold;
    case "gt":
      return actual > threshold;
    case "gte":
      return actual >= threshold;
  }
}

/** Pure rule check: does this balance cross this threshold? */
export function ruleMatches(balance: BalanceSnapshot, rule: GuardianThreshold): boolean {
  if (balance.symbol !== rule.symbol) return false;
  if (!WEI_RE.test(balance.wei) || !WEI_RE.test(rule.wei)) return false;
  return compare(BigInt(balance.wei), rule.op, BigInt(rule.wei));
}

/**
 * Evaluate all thresholds against a balance set. Fires each crossed rule
 * (respecting per-rule cooldown) and records the firing timestamp.
 */
export async function evaluateRules(
  balances: BalanceSnapshot[],
  thresholds: GuardianThreshold[],
  config: GuardianConfig,
  state: GuardianStateStore,
  now: number = Date.now()
): Promise<GuardianVerdict[]> {
  const verdicts: GuardianVerdict[] = [];
  for (const rule of thresholds) {
    validateThreshold(rule);
    const balance = balances.find((b) => b.symbol === rule.symbol);
    if (!balance) {
      verdicts.push({ fired: false, rule, reason: "no_balance" });
      continue;
    }
    if (!ruleMatches(balance, rule)) {
      verdicts.push({ fired: false, rule, balance, reason: "no_hit" });
      continue;
    }
    const key = ruleKey(rule, config);
    const last = await state.lastFiredAt(key);
    const cooldownMs = rule.cooldownMs ?? 0;
    const remaining = last === null ? 0 : cooldownMs - (now - last);
    if (remaining > 0) {
      verdicts.push({ fired: false, rule, balance, reason: "cooldown", cooldownRemainingMs: remaining });
      continue;
    }
    await state.setFiredAt(key, now);
    verdicts.push({ fired: true, rule, balance, reason: "fired" });
  }
  return verdicts;
}

export type GuardianHandler = (trigger: Trigger, verdict: GuardianVerdict) => void | Promise<void>;
export type GuardianErrorHandler = (err: unknown) => void;

export class Guardian {
  private readonly config: GuardianConfig;
  private readonly observer: Observer;
  private readonly state: GuardianStateStore;
  private readonly onTrigger: GuardianHandler;
  private readonly onError: GuardianErrorHandler;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private running = false;

  constructor(
    config: GuardianConfig,
    observer: Observer,
    state: GuardianStateStore,
    onTrigger: GuardianHandler,
    onError: GuardianErrorHandler = (err) => console.error("guardian:", err)
  ) {
    if (config.thresholds.length === 0) throw new Error("guardian: at least one threshold required");
    for (const t of config.thresholds) validateThreshold(t);
    this.config = config;
    this.observer = observer;
    this.state = state;
    this.onTrigger = onTrigger;
    this.onError = onError;
  }

  /** One poll cycle: observe → evaluate → fire triggers for crossed rules. */
  async tick(): Promise<GuardianVerdict[]> {
    if (this.stopped) return [];
    const trigger: Trigger = { kind: "guardian", source: this.config.source, at: new Date().toISOString() };
    const snapshot: ObservationSnapshot = await this.observer.observe(trigger);
    const verdicts = await evaluateRules(snapshot.balances, this.config.thresholds, this.config, this.state);
    for (const v of verdicts) {
      if (v.fired && v.balance) {
        await this.onTrigger(
          { ...trigger, meta: { address: this.config.address, chain: this.config.chain, rule: v.rule, balance: v.balance } },
          v
        );
      }
    }
    return verdicts;
  }

  /** Start the polling loop. runOnStart runs the first tick immediately. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.stopped = false;
    const intervalMs = this.config.pollIntervalMs ?? 60_000;
    const loop = async (): Promise<void> => {
      if (this.stopped) return;
      try {
        await this.tick();
      } catch (err) {
        this.onError(err); // keep the loop alive; hard failures surface in CLI/UI
      } finally {
        if (!this.stopped) this.timer = setTimeout(loop, intervalMs);
      }
    };
    if (this.config.runOnStart) void loop();
    else this.timer = setTimeout(loop, intervalMs);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
