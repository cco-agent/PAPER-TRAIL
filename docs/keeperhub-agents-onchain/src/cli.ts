import { parseArgs } from "node:util";
import { Agent } from "./agent.ts";
import { defaultConfig, loadConfig } from "./config.ts";
import { StaticObserver } from "./observe.ts";
import { BALANCE_ABOVE_MAX, BALANCE_BELOW_MIN, RulesFirstDecider } from "./decide.ts";
import { PolicyGate } from "./policy.ts";
import { LoggingExecutor } from "./execute.ts";
import { JsonlAuditLog } from "./audit.ts";
import { Guardian, InMemoryGuardianState } from "./guardian.ts";
import type { ObservationSnapshot, Trigger } from "./types.ts";

const RULES = [BALANCE_BELOW_MIN, BALANCE_ABOVE_MAX];

function ethToWei(eth: string): string {
  return BigInt(Math.round(parseFloat(eth) * 1e18)).toString();
}

async function buildAgent(configPath: string | undefined, balanceWei: string, address: string | undefined): Promise<{
  config: ReturnType<typeof defaultConfig> extends infer T ? T : never;
  agent: Agent;
}> {
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
  return { config, agent };
}

async function cmdRun(configPath: string | undefined, balanceWei: string, address: string | undefined): Promise<void> {
  const { agent } = await buildAgent(configPath, balanceWei, address);
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

async function cmdWatch(
  configPath: string | undefined,
  balanceWei: string,
  address: string | undefined,
  intervalMs: number
): Promise<void> {
  const { config, agent } = await buildAgent(configPath, balanceWei, address);
  const addr = address ?? config.watch.address;
  const symbol = config.watch.symbol ?? "ETH";
  const guardian = new Guardian(
    {
      source: `guardian:wallet:${addr}`,
      address: addr,
      chain: config.chain,
      // Watch the native balance; the agent core decides top-up vs sweep.
      thresholds: [
        { symbol, op: "lt", wei: config.watch.minBalanceWei },
        ...(config.watch.maxBalanceWei !== "0"
          ? [{ symbol, op: "gt" as const, wei: config.watch.maxBalanceWei }]
          : [])
      ],
      pollIntervalMs: intervalMs,
      runOnStart: true
    },
    // For the CLI demo we observe a fixed snapshot; swap in RpcObserver for live chains.
    new StaticObserver({
      chain: config.chain,
      address: addr,
      balances: [{ chain: config.chain, address: addr, wei: balanceWei, symbol }],
      recentEvents: [],
      observedAt: new Date().toISOString()
    }),
    new InMemoryGuardianState(),
    (trigger) => {
      void agent.run(trigger).then((record) => {
        console.log(
          `${new Date().toISOString()}  action=${record.decision.action.kind}  policy=${record.policy.passed}  exec=${record.execution.status}`
        );
      });
    },
    (err) => console.error("guardian:", err)
  );

  console.log(
    `guardian watching ${addr} (${symbol}) every ${intervalMs}ms — min=${config.watch.minBalanceWei}, max=${config.watch.maxBalanceWei}. Ctrl-C to stop.`
  );
  guardian.start();

  await new Promise<void>((resolve) => {
    const shutdown = (): void => {
      guardian.stop();
      console.log("\nguardian stopped.");
      resolve();
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
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
      limit: { type: "string", default: "5" },
      interval: { type: "string", default: "10000" }
    },
    allowPositionals: true
  });
  const cmd = positionals[0] ?? "run";

  if (cmd === "run") {
    await cmdRun(values.config, ethToWei(values.balance!), values.address);
  } else if (cmd === "watch") {
    const intervalMs = parseInt(values.interval!, 10);
    if (!Number.isFinite(intervalMs) || intervalMs < 100) {
      console.error("--interval must be a number >= 100 (ms)");
      process.exitCode = 1;
      return;
    }
    await cmdWatch(values.config, ethToWei(values.balance!), values.address, intervalMs);
  } else if (cmd === "status") {
    await cmdStatus(values.config, parseInt(values.limit!, 10) || 5);
  } else {
    console.error(`unknown command: ${cmd} (expected: run | watch | status)`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
