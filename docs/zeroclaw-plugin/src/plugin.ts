/**
 * PAPER TRAIL paid-oracle plugin - ZeroClaw plugin entry.
 *
 * Self-hosted TS plugin shape (JS/TS self-hosted agent submissions are accepted
 * in the ZeroClaw bounty, alongside wasm32-wasip2 Rust plugins). The plugin is
 * T0 / zero-custody: it holds no key, signs nothing, and its core makes no
 * network call. Clients pay (x402-style proof) and get exactly one oracle query
 * per verified payment. Unpaid or invalid calls return 402 - the oracle never
 * runs for free.
 */

import {
  type GateResult,
  type PaymentProof,
  type PaymentRequest,
  type PaymentVerifier,
  PaidGate,
  parseProofFromHeaders
} from "./payment-gate.ts";
import {
  type OracleDataSource,
  type OracleQuery,
  type OracleResult,
  GameStateOracle
} from "./oracle.ts";

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  custody: string;
  capabilities: string[];
  permissions: string[];
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, string>;
  }>;
}

export type ToolResult =
  | { status: 402; paywall: PaymentRequest }
  | { status: 200; result: OracleResult };

export interface PaidOraclePluginOptions {
  paymentRequest: PaymentRequest;
  verifier: PaymentVerifier;
  data: OracleDataSource;
}

/**
 * Payment-gated game-state oracle. invoke() runs the oracle exactly once per
 * paid gate pass. Zero free runs: unpaid and invalid calls return 402 without
 * touching the data source.
 */
export class PaperTrailPaidOraclePlugin {
  readonly name = "paper-trail-paid-oracle";
  readonly version = "0.1.0";
  readonly description =
    "Payment-gated PAPER TRAIL game-state oracle. Pay once (SOL/SPL) and read one match snapshot: lane scores, volatility window, leader, ELO, burns, locks.";
  readonly custody = "T0";

  private readonly gate: PaidGate;
  private readonly oracle: GameStateOracle;

  constructor(opts: PaidOraclePluginOptions) {
    this.gate = new PaidGate(opts.paymentRequest, opts.verifier);
    this.oracle = new GameStateOracle(opts.data);
  }

  manifest(): PluginManifest {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      custody: this.custody,
      capabilities: ["tool"],
      permissions: [],
      tools: [
        {
          name: "paper-trail-oracle",
          description:
            "Query a PAPER TRAIL match snapshot. Requires an x-papertrail-proof header; unpaid calls return 402 with the paywall.",
          parameters: { matchId: "string" }
        }
      ]
    };
  }

  async invoke(
    headers: Record<string, string>,
    args: OracleQuery
  ): Promise<ToolResult> {
    const proof: PaymentProof | undefined = parseProofFromHeaders(headers);
    const gate: GateResult = await this.gate.check(proof);
    if (gate.status === "payment_required") {
      return { status: 402, paywall: gate.paywall };
    }
    // Paid -> exactly one oracle query.
    return { status: 200, result: this.oracle.query(args) };
  }
}
