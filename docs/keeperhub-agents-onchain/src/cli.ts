import { parseArgs } from "node:util";
import { Agent } from "./agent.js";
import { defaultConfig, loadConfig } from "./config.js";
import { StaticObserver } from "./observe.js";
import { BALANCE_ABOVE_MAX, BALANCE_BELOW_MIN, RulesFirstDecider } from "./decide.js";
import { PolicyGate } from "./policy.js";
import { LoggingExecutor } from "./execute.js";
import { JsonlAuditLog } from "./audit.js";
import type { ObservationSnapshot, Trigger } from "./types.js";

const RULES = [BALANCE_BELOW_MIN, BALANCE_ABOVE_MAX];

function ethToWei(eth: string): string {
  return BigInt(Math.round(parseFloat(eth) * 1e18)).toString();
}

async function cmdRun(configPath: string | undefined, balanceWei: string, address: string | undefined): Promise<void> {
  const config = configPath ? await loadConfig(configPath) : defaultConfig();
  const addr = address ?? config.watch.address;
  const snapshot: ObservationSnapshot = {
    chain: config.chain,
    address: addr,
    balances: [{ chain: config.chain, address: addr, wei: balanceWei, symbol: config.watch.symbol ?? "ETH" }],
    recentEvents: [],
    observedAt: new Date().toISOString()
  };
  const agent = new Agent(config, {
    observer: new StaticObserver(snapshot),
    decider: new RulesFirstDecider(RULES),
    policy: new PolicyGate(),
    executor: new LoggingExecutor(),
    audit: new JsonlAuditLog(config.audit.logPath)
  });
  const trigger: Trigger = { kind: "manual", source: "cli:run", at: new Date().toISOString() };
  const record = await agent.run(trigger);
  console.log(
    JSON.stringify(
      {
        runId: record.runId,
        decision: record.decision.action,
        rationale: record.decision.rationale,
        ruleHits: record.decision.ruleHits,
        policyPassed: record.policy.passed,
        policyReasons: record.policy.reasons,
        execution: record.execution.status,
        executionError: record.execution.error ?? undefined
      },
      null,
      2
    )
  );
}

async function cmdStatus(configPath: string | undefined, limit: number): Promise<void> {
  const config = configPath ? await loadConfig(configPath) : defaultConfig();
  const audit = new JsonlAuditLog(config.audit.logPath);
  const records = await audit.readAll();
  for (const r of records.slice(-limit)) {
    console.log(
      `${r.at}  ${r.runId.slice(0, 8)}  action=${r.decision.action.kind}  policy=${r.policy.passed}  exec=${r.execution.status}  ${r.decision.rationale.slice(0, 100)}`
    );
  }
  console.log(`total audit records: ${records.length}`);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      config: { type: "string", short: "c" },
      balance: { type: "string", default: "0.01" },
      address: { type: "string" },
      limit: { type: "string", default: "5" }
    },
    allowPositionals: true
  });
  const cmd = positionals[0] ?? "run";

  if (cmd === "run") {
    await cmdRun(values.config, ethToWei(values.balance!), values.address);
  } else if (cmd === "status") {
    await cmdStatus(values.config, parseInt(values.limit!, 10) || 5);
  } else {
    console.error(`unknown command: ${cmd} (expected: run | status)`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
