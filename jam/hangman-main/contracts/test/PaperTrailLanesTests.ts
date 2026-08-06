// SPDX-License-Identifier: BSD-3-Clause-Clear
//
// PAPER TRAIL - Summer Game Jam D1: end-to-end 3-lane round on Inco testnet.
//
// REQUIREMENTS (contracts/.env):
//   - PRIVATE_KEY: funded account on Base Sepolia (Inco testnet) for gas + deck fees
//   - SEED_PHRASE: mnemonic for the player wallets (alice = path 0/0, bob = path 0/1)
//   - BASE_SEPOLIA_RPC_URL: Base Sepolia RPC (default public one is used if empty)
//
// RUN:  npx hardhat test test/PaperTrailLanesTests.ts
//
// FLOW: deploy -> 6 hidden cards dealt (3 per player) -> each player
//       attested-decrypts their own hand (ACL: allow(player)) ->
//       every lane settles on covalidator-signed attestations (Model A) ->
//       round resolves -> shredder burn tally verified -> winner invariant.
//
// NOTE: the winning card per lane is revealed face-up on-chain (crowd-facing).

import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { Abi, Hex, bytesToHex } from "viem";
import { HexString } from "@inco/lightning-js";
import paperJson from "../artifacts/contracts/PaperTrailLanes.sol/PaperTrailLanes.json";
import { getConfig } from "../utils/IncoHelper";

const paperAbi = paperJson.abi as Abi;
const LANES = 3;
const DECK_SIZE = 24;
const ETypesUint256 = 7; // @inco/lightning ETypes.Uint256
const ZERO = "0x0000000000000000000000000000000000000000";

// Lightning ABI slice needed to price the deck (range + shuffle) fees.
const lightningAbi = [
  {
    type: "function",
    name: "getEListFee",
    inputs: [
      { name: "n", internalType: "uint16", type: "uint16" },
      { name: "t", internalType: "uint8", type: "uint8" },
    ],
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
] as Abi;

describe("PaperTrailLanes: 3-lane hidden-card tug-of-war (Inco testnet)", function () {
  this.timeout(600_000);

  let gameAddress: Hex;
  let inco: ReturnType<typeof getConfig>;
  const alice = namedWallets.alice;
  const bob = namedWallets.bob;

  beforeEach(async () => {
    inco = await getConfig();
  });

  it("deals hidden hands, settles all lanes via attestations, resolves the round", async () => {
    // 1) Price the two shuffled decks: constructor needs >= 2 * deckFee(24)
    //    deckFee(n) = 2 * getEListFee(n, Uint256); send 2x margin on top.
    const listFee = (await publicClient.readContract({
      address: inco.executorAddress,
      abi: lightningAbi,
      functionName: "getEListFee",
      args: [DECK_SIZE, ETypesUint256],
    })) as bigint;
    const deckFund = listFee * 8n; // 2 decks x 2 ops x 2 margin

    // 2) Deploy (dealer = wallet; players = alice/bob)
    const tx0 = await wallet.deployContract({
      abi: paperAbi,
      bytecode: paperJson.bytecode as Hex,
      args: [alice.account.address, bob.account.address],
      value: deckFund,
    });
    const r0 = await publicClient.waitForTransactionReceipt({ hash: tx0 });
    gameAddress = r0.contractAddress!;
    console.log("deployed PaperTrailLanes at", gameAddress);

    // 3) Status: dealt, not resolved, 0 lanes settled
    const s0 = (await publicClient.readContract({
      address: gameAddress,
      abi: paperAbi,
      functionName: "status",
    })) as [boolean, boolean, bigint, bigint, bigint, bigint, bigint];
    expect(s0[0]).to.equal(true); // dealt
    expect(s0[1]).to.equal(false); // not resolved
    expect(s0[2]).to.equal(0n); // settledLanes

    // 4) Read the six opaque handles (3 per player)
    const handlesA: HexString[] = [];
    const handlesB: HexString[] = [];
    for (let lane = 0; lane < LANES; lane++) {
      handlesA.push(
        (await publicClient.readContract({
          address: gameAddress,
          abi: paperAbi,
          functionName: "handOf",
          args: [alice.account.address, lane],
        })) as HexString,
      );
      handlesB.push(
        (await publicClient.readContract({
          address: gameAddress,
          abi: paperAbi,
          functionName: "handOf",
          args: [bob.account.address, lane],
        })) as HexString,
      );
    }

    // 5) Attested decrypt: alice can only decrypt her own cards (ACL allow(player))
    const attA = await inco.attestedDecrypt(alice, handlesA);
    const attB = await inco.attestedDecrypt(bob, handlesB);

    // 6) Settle each lane with verified plaintexts + covalidator signatures
    for (let lane = 0; lane < LANES; lane++) {
      const valueA = attA[lane].plaintext.value;
      const valueB = attB[lane].plaintext.value;
      const sigsA = attA[lane].covalinatorSignatures.map((sig: Uint8Array) => bytesToHex(sig));
      const sigsB = attB[lane].covalinatorSignatures.map((sig: Uint8Array) => bytesToHex(sig));
      await publicClient.waitForTransactionReceipt({
        hash: await wallet.writeContract({
          address: gameAddress,
          abi: paperAbi,
          functionName: "settleLane",
          args: [lane, valueA, valueB, sigsA, sigsB],
        }),
        confirmations: 5,
      });
      console.log("lane", lane, "settled A=", valueA.toString(), "B=", valueB.toString());
    }

    // 7) Round resolved, all lanes settled
    const s1 = (await publicClient.readContract({
      address: gameAddress,
      abi: paperAbi,
      functionName: "status",
    })) as [boolean, boolean, bigint, bigint, bigint, bigint, bigint];
    expect(s1[1]).to.equal(true); // resolved
    expect(s1[2]).to.equal(BigInt(LANES)); // settledLanes == 3

    // 7b) Winner invariant: must be alice, bob, or draw (address(0)) -
    //     never an arbitrary address. Frontend reads this getter directly.
    const winner = (await publicClient.readContract({
      address: gameAddress,
      abi: paperAbi,
      functionName: "winner",
    })) as Hex;
    console.log("winner =", winner);
    expect([alice.account.address, bob.account.address, ZERO]).to.include(winner);

    // 8) Shredder: burn-to-feed tally
    const burn = 123456789n;
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: paperAbi,
        functionName: "feedShredder",
        value: burn,
      }),
      confirmations: 5,
    });
    const totalFed = (await publicClient.readContract({
      address: gameAddress,
      abi: paperAbi,
      functionName: "totalFed",
    })) as bigint;
    expect(totalFed).to.equal(burn);
    console.log("round complete; totalFed =", totalFed.toString());
  });
});
