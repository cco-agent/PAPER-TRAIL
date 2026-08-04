/**
 * Shredder Sentinel — x402 paid endpoint.
 *
 * HTTP-402 payment protocol for agent endpoints. A client pays (native or
 * ERC-20) and gets exactly one guarded agent run in return:
 *
 *   1. Client calls the endpoint with no proof   → HTTP 402 + x402-paywall
 *   2. Client pays the requested amount to the recipient
 *   3. Client retries with an x402-proof header  → HTTP 200 + audit record
 *
 * Amounts are decimal wei strings (no float drift). The PaymentVerifier is
 * injected, so tests and the CLI demo run on a deterministic in-memory
 * verifier while production swaps in an on-chain verifier (RPC / KeeperHub).
 * No silent mocks: the chain verifier refuses to construct without
 * credentials.
 */

import type { Agent } from "./agent.ts";
import type { AuditRecord } from "./types.ts";

export interface X402PaymentRequest {
  requestId: string;
  amountWei: string;
  /** Token to pay in: token address, or "native" for the chain currency. */
  token: string;
  chain: string;
  recipient: string;
  description: string;
}

export interface X402Proof {
  requestId: string;
  payer: string;
  amountWei: string;
  txHash?: string;
}

export type X402Verification =
  | { ok: true; proof: X402Proof }
  | { ok: false; reason: string };

export interface PaymentVerifier {
  verify(proof: X402Proof, request: X402PaymentRequest): Promise<X402Verification>;
}

export type X402Response =
  | { status: 402; paywall: X402PaymentRequest }
  | { status: 200; record: AuditRecord };

export const X402_PAYWALL_HEADER = "x402-paywall";
export const X402_PROOF_HEADER = "x402-proof";

/** Header-safe encoding: base64url(JSON). */
export function encodePaywall(req: X402PaymentRequest): string {
  return Buffer.from(JSON.stringify(req), "utf8").toString("base64url");
}

export function decodePaywall(header: string): X402PaymentRequest {
  const parsed = JSON.parse(
    Buffer.from(header, "base64url").toString("utf8")
  ) as Partial<X402PaymentRequest>;
  if (
    typeof parsed.requestId !== "string" ||
    typeof parsed.amountWei !== "string" ||
    typeof parsed.token !== "string" ||
    typeof parsed.chain !== "string" ||
    typeof parsed.recipient !== "string"
  ) {
    throw new Error("malformed x402-paywall header");
  }
  return {
    requestId: parsed.requestId,
    amountWei: parsed.amountWei,
    token: parsed.token,
    chain: parsed.chain,
    recipient: parsed.recipient,
    description: parsed.description ?? ""
  };
}

export function encodeProof(proof: X402Proof): string {
  return Buffer.from(JSON.stringify(proof), "utf8").toString("base64url");
}

export function decodeProof(header: string): X402Proof {
  const parsed = JSON.parse(
    Buffer.from(header, "base64url").toString("utf8")
  ) as Partial<X402Proof>;
  if (
    typeof parsed.requestId !== "string" ||
    typeof parsed.payer !== "string" ||
    typeof parsed.amountWei !== "string"
  ) {
    throw new Error("malformed x402-proof header");
  }
  return {
    requestId: parsed.requestId,
    payer: parsed.payer,
    amountWei: parsed.amountWei,
    txHash: parsed.txHash
  };
}

/** Case-insensitive proof lookup in a header map. */
export function parseProofFromHeaders(headers: Record<string, string>): X402Proof | undefined {
  const raw = headers[X402_PROOF_HEADER] ?? headers[X402_PROOF_HEADER.toUpperCase()];
  return raw === undefined ? undefined : decodeProof(raw);
}

const PAYER_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * Deterministic in-memory verifier for tests and the CLI demo. Never touches a
 * chain: matches requestId, requires a well-formed payer, and requires
 * amountWei >= the paywall charge.
 */
export class InMemoryPaymentVerifier implements PaymentVerifier {
  async verify(proof: X402Proof, request: X402PaymentRequest): Promise<X402Verification> {
    if (proof.requestId !== request.requestId) {
      return { ok: false, reason: "proof requestId does not match paywall" };
    }
    if (!PAYER_RE.test(proof.payer)) {
      return { ok: false, reason: "payer must be a 0x-prefixed 40-hex address" };
    }
    let paid: bigint;
    try {
      paid = BigInt(proof.amountWei);
    } catch {
      return { ok: false, reason: "amountWei is not a valid wei string" };
    }
    if (paid < BigInt(request.amountWei)) {
      return { ok: false, reason: `paid ${proof.amountWei} wei < required ${request.amountWei} wei` };
    }
    return { ok: true, proof };
  }
}

export interface X402HandlerOptions {
  paymentRequest: X402PaymentRequest;
  verifier: PaymentVerifier;
  agent: Agent;
  /** Called when a proof fails verification (for observability). */
  onRejected?: (reason: string, proof: X402Proof) => void;
}

/**
 * One pay-per-call endpoint. No proof → 402 paywall. Valid proof → exactly one
 * agent run (trigger kind "x402") and the audit record as the paid payload.
 */
export class X402Handler {
  private readonly paymentRequest: X402PaymentRequest;
  private readonly verifier: PaymentVerifier;
  private readonly agent: Agent;
  private readonly onRejected?: (reason: string, proof: X402Proof) => void;

  constructor(opts: X402HandlerOptions) {
    this.paymentRequest = opts.paymentRequest;
    this.verifier = opts.verifier;
    this.agent = opts.agent;
    this.onRejected = opts.onRejected;
  }

  get paywall(): X402PaymentRequest {
    return this.paymentRequest;
  }

  async handle(proof?: X402Proof): Promise<X402Response> {
    if (proof === undefined) {
      return { status: 402, paywall: this.paymentRequest };
    }
    const verification = await this.verifier.verify(proof, this.paymentRequest);
    if (!verification.ok) {
      this.onRejected?.(verification.reason, proof);
      return { status: 402, paywall: this.paymentRequest };
    }
    const record = await this.agent.run({
      kind: "x402",
      source: `x402:${this.paymentRequest.requestId}`,
      at: new Date().toISOString(),
      meta: { payer: proof.payer, amountWei: proof.amountWei, txHash: proof.txHash }
    });
    return { status: 200, record };
  }
}

/**
 * Production seam. "memory" = deterministic demo verifier. "chain" refuses to
 * construct without RPC / KeeperHub credentials — no silent mock, same rule as
 * KeeperHubMcpClient.
 */
export function createPaymentVerifier(mode: "memory" | "chain"): PaymentVerifier {
  if (mode === "memory") return new InMemoryPaymentVerifier();
  throw new Error(
    "chain payment verifier is not configured — needs RPC / KeeperHub credentials (no silent mock)"
  );
}
