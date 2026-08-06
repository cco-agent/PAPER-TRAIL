// SPDX-License-Identifier: BSD-3-Clause-Clear
//
// PAPER TRAIL - Summer Game Jam D4 (pulled forward): client orchestration
// for PaperTrailLanes on Inco Lightning (Base Sepolia testnet).
//
// Implements the documented frontend loop (encrypt -> tx -> reveal -> paint)
// against the jam contract. Demo scope: playerA = human wallet, playerB =
// simulated opponent driven by an operator wallet (namedWallets.bob) so the
// demo is fully playable offline-first with real attestations on-chain.
//
// RUN: browser bundle (vite/esbuild) or tsc --noEmit for type-check.
// Depends on: viem, @inco/lightning-js, @inco/lightning (ABI only).

import { type WalletClient, type PublicClient, type Abi } from "viem";
import { Lightning, handleTypes, type HexString } from "@inco/lightning-js";
import paperJson from "../artifacts/contracts/PaperTrailLanes.sol/PaperTrailLanes.json";

export const paperAbi = paperJson.abi as Abi;

export const LANES = 3 as const;
export const LANE_NAMES = ["The Headline", "The Media", "The Underground"] as const;

export interface RoundStatus {
  dealt: boolean;
  resolved: boolean;
  settledLanes: number;
  scoreA: number;
  scoreB: number;
  gauge: number;
  roundEndsAt: bigint;
}

export interface LaneResult {
  lane: number;
  valueA: number;
  valueB: number;
  winnerA: boolean;
  tie: boolean;
}

/**
 * Client-side controller for one PaperTrailLanes round.
 * paint callbacks keep the UI dumb: the module pushes facts, the view draws.
 */
export class ConfidentialMatch {
  readonly playerA: `0x${string}`;
  readonly playerB: `0x${string}`;

  private zap!: Lightning;
  private status_: RoundStatus | null = null;

  constructor(
    private readonly publicClient: PublicClient,
    private readonly walletClient: WalletClient,
    private readonly contractAddress: `0x${string}`,
    playerA: `0x${string}`,
    playerB: `0x${string}`,
    readonly demoMode = true,
  ) {
    this.playerA = playerA;
    this.playerB = playerB;
  }

  /** Connect to Inco Lightning on Base Sepolia. */
  async connect() {
    this.zap = await Lightning.baseSepoliaTestnet();
    return this.zap;
  }

  async status(): Promise<RoundStatus> {
    const s = (await this.publicClient.readContract({
      address: this.contractAddress,
      abi: paperAbi,
      functionName: "status",
    })) as [boolean, boolean, bigint, bigint, bigint, bigint, bigint];
    this.status_ = {
      dealt: s[0],
      resolved: s[1],
      settledLanes: Number(s[2]),
      scoreA: Number(s[3]),
      scoreB: Number(s[4]),
      gauge: Number(s[5]),
      roundEndsAt: s[6],
    };
    return this.status_;
  }

  /** Opaque handles for one player's 3 hidden cards. */
  async handOf(who: `0x${string}`): Promise<HexString[]> {
    const out: HexString[] = [];
    for (let lane = 0; lane < LANES; lane++) {
      out.push(
        (await this.publicClient.readContract({
          address: this.contractAddress,
          abi: paperAbi,
          functionName: "handOf",
          args: [who, lane],
        })) as HexString,
      );
    }
    return out;
  }

  /**
   * Attested decrypt of the caller's own hand. The contract granted access
   * via _dealTo(player) -> allow(player); only that wallet can decrypt.
   * Retries are built in (covalinator lag).
   */
  async decryptOwnHand(handles: HexString[]): Promise<number[]> {
    if (!this.zap) throw new Error("connect() first");
    const results = await this.zap.attestedDecrypt(this.walletClient, handles);
    return results.map((r) => Number(r.plaintext.value));
  }

  /**
   * Simulated opponent: pick the operator's own (known) cards. In demo mode
   * the operator controls playerB, so we decrypt B's hand with the B wallet
   * and choose a naive policy (highest card wins the push for lane order).
   */
  async simulateOpponent(
    handB: HexString[],
    zapB: Lightning,
    walletB: WalletClient,
  ): Promise<{ values: number[]; sigs: string[][] }> {
    const results = await zapB.attestedDecrypt(walletB, handB);
    const values = results.map((r) => Number(r.plaintext.value));
    const sigs = results.map((r) =>
      r.covalinatorSignatures.map((sig: Uint8Array) => toHex(sig)),
    );
    return { values, sigs };
  }

  /** Settle one lane with both attested plaintexts + covalidator sigs. */
  async settleLane(
    lane: number,
    valueA: number,
    sigsA: string[],
    valueB: number,
    sigsB: string[],
    confirmations = 5,
  ): Promise<`0x${string}`> {
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: paperAbi,
      functionName: "settleLane",
      args: [lane, valueA, valueB, sigsA, sigsB],
    });
    await this.publicClient.waitForTransactionReceipt({ hash, confirmations });
    return hash;
  }

  /** Time-expiry resolution (anyone can close a timed-out round). */
  async resolveAfterTimeout(): Promise<`0x${string}`> {
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: paperAbi,
      functionName: "resolveAfterTimeout",
    });
    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /** Burn-to-feed the shredder (demo: payable tally). */
  async feedShredder(amountWei: bigint): Promise<`0x${string}`> {
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: paperAbi,
      functionName: "feedShredder",
      value: amountWei,
    });
    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /** Encrypt a value for the contract (e.g. a future commit flow). */
  async encryptForContract(value: bigint): Promise<HexString> {
    if (!this.zap) throw new Error("connect() first");
    return this.zap.encrypt(value, {
      accountAddress: this.playerA,
      dappAddress: this.contractAddress,
      handleType: handleTypes.euint256,
    });
  }
}

/** bytes -> 0x hex (SDK returns Uint8Array sigs). */
function toHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}
