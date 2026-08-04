/**
 * PAPER TRAIL - ZeroClaw on-chain payment verifier (Solana JSON-RPC).
 *
 * Production `PaymentVerifier` for the paid-oracle plugin. Where the in-memory
 * verifier trusts the proof, this one demands the money on chain:
 *
 *   1. proof must carry a 64-byte ed25519 tx signature (base58)
 *   2. `getTransaction(signature)` must return a transaction that exists,
 *      did not fail, and names the paywall recipient among its account keys
 *   3. the recipient's lamport balance delta (post - pre) must be >= the
 *      paywall amount (native SOL only)
 *
 * Fail-closed: transport errors, malformed responses, failed txs and missing
 * data all reject the proof. No silent mocks: construction without an rpcUrl
 * (or injected rpcCall) throws.
 *
 * Replay protection (one proof = one run): verified signatures are recorded
 * in-memory and a second redemption of the same signature is rejected.
 * Persisting the set across restarts is a production concern (swap Set for
 * Redis/SQLite in a long-lived deployment).
 */

import {
  type PaymentProof,
  type PaymentRequest,
  type PaymentVerifier,
  type Verification,
  InMemoryPaymentVerifier,
  decodeBase58,
  isValidPubkey
} from "./payment-gate.ts";

export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111112";

export interface RpcResponse {
  result?: unknown;
  error?: { code?: number; message?: string };
}

/** Minimal JSON-RPC transport: `(method, params) -> response`. */
export type RpcCall = (
  method: string,
  params: unknown[]
) => Promise<RpcResponse>;

interface SolanaTx {
  transaction?: { message?: { accountKeys?: string[] } };
  meta?: {
    err?: unknown;
    preBalances?: number[];
    postBalances?: number[];
  };
}

type TxLookup = { ok: true; tx: SolanaTx } | { ok: false; reason: string };

export interface SolanaRpcVerifierOptions {
  /** JSON-RPC URL (mainnet-beta / devnet / custom). Required unless rpcCall is given. */
  rpcUrl?: string;
  /** Injectable transport for tests. */
  rpcCall?: RpcCall;
  /** Reject already-redeemed signatures (one proof = one run). Default true. */
  replayProtection?: boolean;
}

export class SolanaRpcPaymentVerifier implements PaymentVerifier {
  private readonly rpc: RpcCall;
  private readonly seen: Set<string>;
  private readonly replay: boolean;

  constructor(opts: SolanaRpcVerifierOptions = {}) {
    if (opts.rpcCall !== undefined) {
      this.rpc = opts.rpcCall;
    } else if (opts.rpcUrl !== undefined && opts.rpcUrl.length > 0) {
      const url = opts.rpcUrl;
      this.rpc = async (method: string, params: unknown[]) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
        });
        return (await res.json()) as RpcResponse;
      };
    } else {
      throw new Error(
        "SolanaRpcPaymentVerifier requires rpcUrl or injected rpcCall - no silent mocks"
      );
    }
    this.seen = new Set<string>();
    this.replay = opts.replayProtection ?? true;
  }

  async verify(
    proof: PaymentProof,
    request: PaymentRequest
  ): Promise<Verification> {
    if (proof.requestId !== request.requestId) {
      return {
        ok: false,
        reason: "proof requestId does not match payment request"
      };
    }
    if (!isValidPubkey(proof.payer)) {
      return { ok: false, reason: "payer must be a 32-byte base58 pubkey" };
    }
    if (!isValidPubkey(request.recipient)) {
      return {
        ok: false,
        reason: "recipient must be a 32-byte base58 pubkey"
      };
    }
    if (!isValidPubkey(request.mint)) {
      return { ok: false, reason: "mint must be a 32-byte base58 pubkey" };
    }
    if (proof.signature === undefined) {
      return {
        ok: false,
        reason: "on-chain verifier requires a tx signature in the proof"
      };
    }
    const sigBytes = decodeBase58(proof.signature);
    if (sigBytes === null || sigBytes.length !== 64) {
      return {
        ok: false,
        reason: "signature must be a 64-byte base58 ed25519 signature"
      };
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
      return {
        ok: false,
        reason: `paid ${proof.amount} < required ${request.amount}`
      };
    }
    if (this.replay && this.seen.has(proof.signature)) {
      return {
        ok: false,
        reason: "signature already redeemed (one proof = one run)"
      };
    }
    if (request.mint !== NATIVE_SOL_MINT) {
      return {
        ok: false,
        reason:
          "SPL token verification not implemented - SolanaRpcPaymentVerifier is SOL native only"
      };
    }

    const lookup = await this.lookupTx(proof.signature);
    if (!lookup.ok) {
      return { ok: false, reason: lookup.reason };
    }
    const tx = lookup.tx;

    if (tx.meta?.err != null) {
      return {
        ok: false,
        reason: `transaction failed on chain: ${JSON.stringify(tx.meta.err)}`
      };
    }
    const keys = tx.transaction?.message?.accountKeys;
    if (!Array.isArray(keys)) {
      return { ok: false, reason: "malformed transaction response" };
    }
    const recipientIndex = keys.findIndex((key) => key === request.recipient);
    if (recipientIndex === -1) {
      return {
        ok: false,
        reason: "recipient is not involved in the transaction"
      };
    }
    const pre = tx.meta?.preBalances?.[recipientIndex];
    const post = tx.meta?.postBalances?.[recipientIndex];
    if (typeof pre !== "number" || typeof post !== "number") {
      return { ok: false, reason: "transaction has no balance data" };
    }
    const delta = BigInt(post) - BigInt(pre);
    if (delta < required) {
      return {
        ok: false,
        reason: `recipient balance delta ${delta} < required ${required} lamports`
      };
    }

    this.seen.add(proof.signature);
    return { ok: true, proof };
  }

  private async lookupTx(signature: string): Promise<TxLookup> {
    let res: RpcResponse;
    try {
      res = await this.rpc("getTransaction", [
        signature,
        { maxSupportedTransactionVersion: 0 }
      ]);
    } catch {
      return {
        ok: false,
        reason: "RPC transport error - payment could not be verified"
      };
    }
    if (res.error !== undefined) {
      return {
        ok: false,
        reason: `RPC error: ${res.error.message ?? "unknown RPC error"}`
      };
    }
    if (res.result === null || res.result === undefined) {
      return { ok: false, reason: "transaction not found on chain" };
    }
    return { ok: true, tx: res.result as SolanaTx };
  }
}

/** Factory: "memory" for tests/demo, "chain" for production (refuses without RPC). */
export function createPaymentVerifier(
  kind: "memory" | "chain",
  opts: SolanaRpcVerifierOptions = {}
): PaymentVerifier {
  if (kind === "memory") return new InMemoryPaymentVerifier();
  return new SolanaRpcPaymentVerifier(opts);
}
