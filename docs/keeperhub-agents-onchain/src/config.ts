import { readFile } from "node:fs/promises";

export interface AgentConfig {
  chain: string;
  rpcUrl?: string;
  watch: {
    address: string;
    minBalanceWei: string;
    maxBalanceWei: string; // "0" disables the sweep rule
    symbol?: string;
  };
  sweep?: { to: string };
  decide: {
    rules: string[];
    llm: { enabled: boolean; model?: string };
  };
  policy: {
    killSwitch: boolean;
    maxAmountWei: string;
    recipientAllowlist: string[]; // empty = allow any recipient
    chainAllowlist: string[];
    cooldownMs: number;
  };
  audit: { logPath: string };
}

export function defaultConfig(): AgentConfig {
  return {
    chain: "sepolia",
    rpcUrl: "",
    watch: {
      address: "",
      minBalanceWei: "100000000000000000", // 0.1 ETH
      maxBalanceWei: "0", // disabled
      symbol: "ETH"
    },
    sweep: { to: "" },
    decide: {
      rules: ["balance_below_min", "balance_above_max"],
      llm: { enabled: false, model: "deepseek-v4-flash" }
    },
    policy: {
      killSwitch: false,
      maxAmountWei: "1000000000000000000", // 1 ETH hard cap
      recipientAllowlist: [],
      chainAllowlist: ["sepolia"],
      cooldownMs: 60000
    },
    audit: { logPath: "./audit.jsonl" }
  };
}

export async function loadConfig(path: string): Promise<AgentConfig> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as Partial<AgentConfig>;
  const base = defaultConfig();
  return {
    ...base,
    ...parsed,
    watch: { ...base.watch, ...parsed.watch },
    sweep: { ...base.sweep, ...parsed.sweep },
    decide: {
      ...base.decide,
      ...parsed.decide,
      llm: { ...base.decide.llm, ...parsed.decide?.llm }
    },
    policy: { ...base.policy, ...parsed.policy },
    audit: { ...base.audit, ...parsed.audit }
  };
}
