import type { Decision, PolicyCheck, PolicyLimits } from "./types.js";
import type { AgentConfig } from "./config.js";
import { cmpWei } from "./decide.js";

/**
 * Hard gate before ANY execution: kill switch, chain allowlist,
 * recipient allowlist, max spend, cooldown. Never bypassed by modes.
 */
export class PolicyGate {
  private readonly lastActionAt = new Map<string, number>();

  check(decision: Decision, config: AgentConfig, now: number = Date.now()): PolicyCheck {
    const limits: PolicyLimits = {
      maxAmountWei: config.policy.maxAmountWei,
      recipientAllowlist: config.policy.recipientAllowlist,
      chainAllowlist: config.policy.chainAllowlist,
      cooldownMs: config.policy.cooldownMs,
      killSwitch: config.policy.killSwitch
    };
    const action = decision.action;
    const reasons: string[] = [];

    if (action.kind === "noop") return { passed: true, reasons: [], limits };

    if (config.policy.killSwitch) reasons.push("kill switch engaged — all execution disabled");
    if (!config.policy.chainAllowlist.includes(action.chain)) {
      reasons.push(`chain "${action.chain}" not allowlisted (${config.policy.chainAllowlist.join(", ") || "none"})`);
    }
    if (action.to) {
      const allow = config.policy.recipientAllowlist.map((a) => a.toLowerCase());
      if (allow.length > 0 && !allow.includes(action.to.toLowerCase())) {
        reasons.push(`recipient ${action.to} not allowlisted`);
      }
    }
    if (action.amountWei && cmpWei(action.amountWei, config.policy.maxAmountWei) > 0) {
      reasons.push(`amount ${action.amountWei} wei exceeds max ${config.policy.maxAmountWei} wei`);
    }

    const key = `${action.kind}:${action.to ?? "*"}`;
    const last = this.lastActionAt.get(key);
    if (last !== undefined && now - last < config.policy.cooldownMs) {
      reasons.push(`cooldown active for ${key} (${config.policy.cooldownMs}ms)`);
    }

    if (reasons.length === 0) this.lastActionAt.set(key, now);
    return { passed: reasons.length === 0, reasons, limits };
  }
}
