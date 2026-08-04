/**
 * PAPER TRAIL - ZeroClaw payment gate (x402-style, Solana-native).
 *
 * Pay-per-call gate for a ZeroClaw tool. A client pays (SOL or SPL, verified
 * off-chain by an injected verifier) and gets exactly one tool run in return:
 *
 *   1. Client invokes the tool with no proof        -> 402 payment_required
 *   2. Client pays `amount` to `recipient` (base units)
 *   3. Client retries with an x-papertrail-proof header -> 200 + one result
 *
 * Amounts are decimal strings (no float drift). The verifier is injected: the
 * deterministic InMemoryPaymentVerifier serves tests and the demo, while
 * production swaps in an on-chain verifier (Solana RPC signature check). No
 * silent mocks: a chain verifier would refuse to construct without credentials.
 */

export interface PaymentRequest {
  requestId: string;
  /** Amount in base units (lamports for SOL, base units for SPL). Decimal string. */
  amount: string;
  /** Token to pay in: SPL mint, or the native SOL mint. Base58 pubkey. */
  mint: string;
  /** Recipient wallet. Base58 pubkey. */
  recipient: string;
  description: string;
  /** "mainnet" | "devnet" | "localnet" — informational for now. */
  chain: string;
}

export interface PaymentProof {
  requestId: string;
  /** Payer wallet. Base58 pubkey. */
  payer: string;
  /** Paid amount in base units. Decimal string. */
  amount: string;
  /** Optional tx signature, for on-chain verification in production. */
  signature?: string;
}

export type Verification =
  | { ok: true; proof: PaymentProof }
  | { ok: false; reason: string };

export interface PaymentVerifier {
  verify(proof: PaymentProof, request: PaymentRequest): Promise<Verification>;
}

export const PAYMENT_REQUEST_HEADER = "x-papertrail-request";
export const PAYMENT_PROOF_HEADER = "x-papertrail-proof";

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B58_INDEX = new Map<string, number>();
for (let i = 0; i < B58_ALPHABET.length; i++) {
  B58_INDEX.set(B58_ALPHABET[i], i);
}

/** Decode base58 to bytes, or null on invalid input. */
export function decodeBase58(input: string): Uint8Array | null {
  if (input.length === 0) return null;
  let zeros = 0;
  while (zeros < input.length && input[zeros] === "1") zeros++;
  let value = 0n;
  for (const ch of input) {
    const idx = B58_INDEX.get(ch);
    if (idx === undefined) return null;
    value = value * 58n + BigInt(idx);
  }
  const bytes: number[] = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 0xffn));
    value >>= 8n;
  }
  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[zeros + i] = bytes[i];
  return out;
}

/** True if input decodes to exactly 32 bytes (a valid Solana pubkey). */
export function isValidPubkey(input: string): boolean {
  if (input.length < 32 || input.length > 44) return false;
  const decoded = decodeBase58(input);
  return decoded !== null && decoded.length === 32;
}

/** Header-safe encoding: base64url(JSON). */
export function encodePaywall(req: PaymentRequest): string {
  return Buffer.from(JSON.stringify(req), "utf8").toString("base64url");
}

export function decodePaywall(header: string): PaymentRequest {
  const parsed = JSON.parse(
    Buffer.from(header, "base64url").toString("utf8")
  ) as Partial<PaymentRequest>;
  if (
    typeof parsed.requestId !== "string" ||
    typeof parsed.amount !== "string" ||
    typeof parsed.mint !== "string" ||
    typeof parsed.recipient !== "string" ||
    typeof parsed.chain !== "string"
  ) {
    throw new Error("malformed x-papertrail-request header");
  }
  return {
    requestId: parsed.requestId,
    amount: parsed.amount,
    mint: parsed.mint,
    recipient: parsed.recipient,
    chain: parsed.chain,
    description: parsed.description ?? ""
  };
}

export function encodeProof(proof: PaymentProof): string {
  return Buffer.from(JSON.stringify(proof), "utf8").toString("base64url");
}

export function decodeProof(header: string): PaymentProof {
  const parsed = JSON.parse(
    Buffer.from(header, "base64url").toString("utf8")
  ) as Partial<PaymentProof>;
  if (
    typeof parsed.requestId !== "string" ||
    typeof parsed.payer !== "string" ||
    typeof parsed.amount !== "string"
  ) {
    throw new Error("malformed x-papertrail-proof header");
  }
  const proof: PaymentProof = {
    requestId: parsed.requestId,
    payer: parsed.payer,
    amount: parsed.amount
  };
  if (parsed.signature !== undefined) {
    proof.signature = parsed.signature;
  }
  return proof;
}

/** Case-insensitive proof lookup in a header map. Undefined if absent/malformed. */
export function parseProofFromHeaders(
  headers: Record<string, string>
): PaymentProof | undefined {
  const key = Object.keys(headers).find(
    (k) => k.toLowerCase() === PAYMENT_PROOF_HEADER
  );
  if (key === undefined) return undefined;
  try {
    return decodeProof(headers[key]);
  } catch {
    return undefined;
  }
}

/**
 * Deterministic in-memory verifier for tests and the demo. Never touches a
 * chain: matches requestId, requires well-formed pubkeys, requires amount >= the
 * paywall charge.
 */
export class InMemoryPaymentVerifier implements PaymentVerifier {
  async verify(
    proof: PaymentProof,
    request: PaymentRequest
  ): Promise<Verification> {
    if (proof.requestId !== request.requestId) {
      return { ok: false, reason: "proof requestId does not match payment request" };
    }
    if (!isValidPubkey(proof.payer)) {
      return { ok: false, reason: "payer must be a 32-byte base58 pubkey" };
    }
    if (!isValidPubkey(request.recipient)) {
      return { ok: false, reason: "recipient must be a 32-byte base58 pubkey" };
    }
    if (!isValidPubkey(request.mint)) {
      return { ok: false, reason: "mint must be a 32-byte base58 pubkey" };
    }
    let paid: bigint;
    let required: bigint;
    try {
      paid = BigInt(proof.amount);
      required = BigInt(request.amount);
    } catch {
      return { ok: false, reason: "amount must be a decimal string" };
    }
    if (paid < required) {
      return { ok: false, reason: `paid ${proof.amount} < required ${request.amount}` };
    }
    return { ok: true, proof };
  }
}

export type GateResult =
  | { status: "payment_required"; paywall: PaymentRequest }
  | { status: "paid"; proof: PaymentProof };

/**
 * One pay-per-call gate. No proof or invalid proof -> payment_required.
 * Valid proof -> paid. The caller (plugin) runs the tool exactly once per paid
 * gate pass - zero free runs.
 */
export class PaidGate {
  private readonly request: PaymentRequest;
  private readonly verifier: PaymentVerifier;

  constructor(request: PaymentRequest, verifier: PaymentVerifier) {
    this.request = request;
    this.verifier = verifier;
  }

  get paywall(): PaymentRequest {
    return this.request;
  }

  async check(proof: PaymentProof | undefined): Promise<GateResult> {
    if (proof === undefined) {
      return { status: "payment_required", paywall: this.request };
    }
    const verification = await this.verifier.verify(proof, this.request);
    if (!verification.ok) {
      return { status: "payment_required", paywall: this.request };
    }
    return { status: "paid", proof: verification.proof };
  }
}
