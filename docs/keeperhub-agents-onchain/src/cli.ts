import { parseArgs } from "node:util";
import { Agent } from "./agent.ts";
import { defaultConfig, loadConfig } from "./config.ts";
import { StaticObserver } from "./observe.ts";
import { BALANCE_ABOVE_MAX, BALANCE_BELOW_MIN, RulesFirstDecider } from "./decide.ts";
import { PolicyGate } from "./policy.ts";
import { LoggingExecutor } from "./execute.ts";
import { JsonlAuditLog } from "./audit.ts";
import { Guardian, InMemoryGuardianState } from "./guardian.ts";
import { EventResponder, StaticEventSource } from "./events.ts";
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

/**
 * Replay: re-evaluate recorded audit records through decide + policy with the
 * current config and report drift vs what was recorded. Never re-executes
 * anything and never touches a chain — pure re-evaluation of the audit trail.
 * Each record gets a fresh PolicyGate so cooldown state cannot bleed across
 * records (mirrors how each original run saw its own gate).
 */
async function cmdReplay(configPath: string | undefined, limit: number): Promise<void> {
  const config = configPath ? await loadConfig(configPath) : defaultConfig();
  const audit = new JsonlAuditLog(config.audit.logPath);
  const records = await audit.readAll();
  const window = records.slice(-limit);
  const decider = new RulesFirstDecider(RULES);
  let drifted = 0;

  for (const r of window) {
    const decision = await decider.decide(r.trigger, r.observation, config);
    const check = new PolicyGate().check(decision, config);
    const drift =
      decision.action.kind !== r.decision.action.kind || check.passed !== r.policy.passed;
    if (drift) drifted++;
    console.log(
      JSON.stringify({
        runId: r.runId.slice(0, 8),
        at: r.at,
        recorded: { action: r.decision.action.kind, policy: r.policy.passed, exec: r.execution.status },
        replayed: { action: decision.action.kind, policy: check.passed, reasons: check.reasons },
        drift
      })
    );
  }
  console.log(`replayed ${window.length}/${records.length} records — ${drifted} drifted`);
}

/**
 * Event responder demo: a static queue of synthetic Transfer logs drives the
 * agent core once per unique log. Swap StaticEventSource for RpcEventSource
 * (eth_getLogs) to respond to live on-chain events.
 */
async function cmdRespond(configPath: string | undefined, intervalMs: number): Promise<void> {
  const config = configPath ? await loadConfig(configPath) : defaultConfig();
  const { agent } = await buildAgent(configPath, "0.01", undefined);
  const addr = config.watch.address || "0xwatched";
  const source = new StaticEventSource([
    {
      name: "Transfer",
      address: addr,
      blockNumber: 1,
      logIndex: 0,
      txHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
      args: { from: "0x0000", to: addr, amount: "1000000000000000000" }
    },
    {
      name: "Transfer",
      address: addr,
      blockNumber: 1,
      logIndex: 1,
      txHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      args: { from: "0x0000", to: addr, amount: "500000000000000000" }
    }
  ]);
  const responder = new EventResponder({
    agent,
    source,
    onEvent: (ev, record) =>
      console.log(
        `${new Date().toISOString()}  event=${ev.name}@${ev.address.slice(0, 10)}  action=${record.decision.action.kind}  policy=${record.policy.passed}  exec=${record.execution.status}`
      ),
    onError: (err) => console.error("responder:", err)
  });

  console.log(
    `event responder watching ${addr} — ${source.remaining} synthetic event(s) queued, poll every ${intervalMs}ms. Ctrl-C to stop.`
  );
  responder.start(intervalMs);

  await new Promise<void>((resolve) => {
    const shutdown = (): void => {
      responder.stop();
      console.log("\nresponder stopped.");
      resolve();
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
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
  } else if (cmd === "replay") {
    await cmdReplay(values.config, parseInt(values.limit!, 10) || 5);
  } else if (cmd === "respond") {
    const intervalMs = parseInt(values.interval!, 10);
    if (!Number.isFinite(intervalMs) || intervalMs < 100) {
      console.error("--interval must be a number >= 100 (ms)");
      process.exitCode = 1;
      return;
    }
    await cmdRespond(values.config, intervalMs);
  } else {
    console.error(`unknown command: ${cmd} (expected: run | watch | status | replay | respond)`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
