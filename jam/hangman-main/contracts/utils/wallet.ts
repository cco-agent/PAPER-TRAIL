import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { HexString } from "@inco/lightning-js";

dotenv.config();

// Load private key and ensure it has the "0x" prefix
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith("0x")
  ? (process.env.PRIVATE_KEY as HexString)
  : (`0x${process.env.PRIVATE_KEY}` as HexString);

if (!PRIVATE_KEY || PRIVATE_KEY.length !== 66) {
  throw new Error("Invalid or missing PRIVATE_KEY in .env file");
}

// Deployer account (pays gas + Inco deck fees)
const account = privateKeyToAccount(PRIVATE_KEY);

const RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

// Public client for reads (handles, status, fees)
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC),
});

// Dealer / deployer wallet
export const wallet = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC),
});

console.log(`✅ Dealer wallet: ${account.address}`);

// Player wallets derived from the seed phrase
const MNEMONIC = process.env.SEED_PHRASE;
if (!MNEMONIC) {
  throw new Error("Missing SEED_PHRASE in .env file");
}

export const namedWallets = {
  alice: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/0" }),
    chain: baseSepolia,
    transport: http(RPC),
  }),
  bob: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/1" }),
    chain: baseSepolia,
    transport: http(RPC),
  }),
  dave: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/2" }),
    chain: baseSepolia,
    transport: http(RPC),
  }),
  carol: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/3" }),
    chain: baseSepolia,
    transport: http(RPC),
  }),
  john: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/4" }),
    chain: baseSepolia,
    transport: http(RPC),
  }),
};

console.log("✅ Named player wallets:");
Object.entries(namedWallets).forEach(([name, client]) => {
  console.log(`   - ${name}: ${client.account?.address}`);
});
