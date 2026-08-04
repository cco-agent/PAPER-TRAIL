import type { ActionSpec, BalanceSnapshot, Decision, ObservationSnapshot, Trigger } from "./types.js";
import type { AgentConfig } from "./config.js";

export type RationaleFn = (action: ActionSpec, observation: ObservationSnapshot, config: AgentConfig) => Promise<string>;

export interface RuleEvaluation {
  hit: boolean;
  note?: string;
}

export interface DecisionRule {
  id: string;
  description: string;
  evaluate(observation: ObservationSnapshot, config: AgentConfig): RuleEvaluation;
  propose(observation: ObservationSnapshot, config: AgentConfig): ActionSpec;
}

export function cmpWei(a: string, b: string): number {
  const ba = BigInt(a);
  const bb = BigInt(b);
  return ba < bb ? -1 : ba > bb ? 1 : 0;
}

function nativeBalance(observation: ObservationSnapshot, config: AgentConfig): BalanceSnapshot | undefined {
  const symbol = config.watch.symbol ?? "ETH";
  return observation.balances.find((b) => b.symbol === symbol);
}

/** Guardian rule: watched wallet drops below min → top it up from the agent wallet. */
export const BALANCE_BELOW_MIN: DecisionRule = {
  id: "balance_below_min",
  description: "Native balance below watch.minBalanceWei → top up the watched address from the agent wallet",
  evaluate(observation, config) {
    const bal = nativeBalance(observation, config);
    if (!bal) return { hit: false, note: "no matching balance snapshot" };
    if (cmpWei(bal.wei, config.watch.minBalanceWei) >= 0) {
      return { hit: false, note: `balance ${bal.wei} wei >= min ${config.watch.minBalanceWei} wei` };
    }
    const topUp = (BigInt(config.watch.minBalanceWei) - BigInt(bal.wei)).toString();
    return { hit: true, note: `balance ${bal.wei} wei < min ${config.watch.minBalanceWei} wei → top-up ${topUp} wei` };
  },
  propose(observation, config) {
    const bal = nativeBalance(observation, config)!;
    const topUp = (BigInt(config.watch.minBalanceWei) - BigInt(bal.wei)).toString();
    return { kind: "transfer", to: config.watch.address, amountWei: topUp, chain: config.chain, note: "guardian top-up" };
  }
};

/** Guardian rule: watched wallet exceeds max → sweep the excess to sweep.to. */
export const BALANCE_ABOVE_MAX: DecisionRule = {
  id: "balance_above_max",
  description: "Native balance above watch.maxBalanceWei → sweep the excess to sweep.to",
  evaluate(observation, config) {
    if (config.watch.maxBalanceWei === "0") return { hit: false, note: "sweep disabled (maxBalanceWei = 0)" };
    const bal = nativeBalance(observation, config);
    if (!bal) return { hit: false, note: "no matching balance snapshot" };
    if (cmpWei(bal.wei, config.watch.maxBalanceWei) <= 0) {
      return { hit: false, note: `balance ${bal.wei} wei <= max ${config.watch.maxBalanceWei} wei` };
    }
    const excess = (BigInt(bal.wei) - BigInt(config.watch.maxBalanceWei)).toString();
    return { hit: true, note: `balance ${bal.wei} wei > max ${config.watch.maxBalanceWei} wei → sweep ${excess} wei` };
  },
  propose(observation, config) {
    const bal = nativeBalance(observation, config)!;
    const excess = (BigInt(bal.wei) - BigInt(config.watch.maxBalanceWei)).toString();
    return { kind: "transfer", to: config.sweep?.to ?? "", amountWei: excess, chain: config.chain, note: "sweep excess" };
  }
};

/** Rules-first decider: first matching rule wins; LLM rationale is an optional hook. */
export class RulesFirstDecider {
  private readonly rules: DecisionRule[];

  constructor(rules: DecisionRule[]) {
    this.rules = rules;
  }

  async decide(
    trigger: Trigger,
    observation: ObservationSnapshot,
    config: AgentConfig,
    rationaleFn?: RationaleFn
  ): Promise<Decision> {
    const hits = this.rules
      .map((rule) => ({ rule, res: rule.evaluate(observation, config) }))
      .filter((entry) => entry.res.hit);

    if (hits.length === 0) {
      return {
        trigger,
        action: { kind: "noop", chain: config.chain },
        rationale: "No rule triggered; nothing to do.",
        ruleHits: []
      };
    }

    const first = hits[0]!;
    const action = first.rule.propose(observation, config);
    let rationale = `${first.rule.description}. ${first.res.note ?? ""}`.trim();
    if (rationaleFn && action.kind !== "noop") {
      const llmLine = await rationaleFn(action, observation, config);
      rationale = `${rationale} [LLM: ${llmLine}]`;
    }
    return { trigger, action, rationale, ruleHits: hits.map((h) => h.rule.id) };
  }
}
