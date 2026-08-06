// PaperTrailLanes deploy script (Base Sepolia) - Summer Game Jam D3.
// Usage (after `npx hardhat compile`, with a FUNDED key in .env):
//   node scripts/deploy-lanes.cjs <playerA> <playerB>
//   e.g. node scripts/deploy-lanes.cjs 0x<alice> 0x<bob>
// Funds the tx with 2x deck fee + margin (constructor requires msg.value >= 2*deckFee).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const { createWalletClient, createPublicClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');

if (!process.env.PRIVATE_KEY) {
  console.error('DEPLOY FAIL: PRIVATE_KEY missing in .env (funded Base Sepolia key required)');
  process.exit(1);
}
const PRIVATE_KEY = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY;
const account = privateKeyToAccount(PRIVATE_KEY);
const rpc = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(rpc) });

(async () => {
  const [playerA, playerB] = process.argv.slice(2);
  if (!playerA || !playerB) {
    console.error('DEPLOY FAIL: pass playerA and playerB addresses');
    console.error('  node scripts/deploy-lanes.cjs <playerA> <playerB>');
    process.exit(1);
  }
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'PaperTrailLanes.sol', 'PaperTrailLanes.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('DEPLOY FAIL: artifact not found - run `npx hardhat compile` first');
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const { abi, bytecode } = artifact;

  console.log('deployer:', account.address);
  console.log('playerA :', playerA);
  console.log('playerB :', playerB);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('deployer balance (ETH):', balance.toString());
  if (balance < parseEther('0.00005')) {
    console.error('DEPLOY FAIL: deployer balance below ~0.00005 ETH (deck fee 2x + gas)');
    process.exit(1);
  }

  // Constructor funds 2x deck fees (0.00003 ETH per D2 verification) + margin for gas-safe value.
  const txHash = await wallet.deployContract({
    abi,
    bytecode: '0x' + bytecode,
    args: [playerA, playerB],
    value: parseEther('0.00006'),
  });
  console.log('deploy tx:', txHash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('DEPLOY OK  ->', receipt.contractAddress);
  console.log('explorer   -> https://base-sepolia.blockscout.com/address/' + receipt.contractAddress);
  process.exit(0);
})().catch((e) => {
  try { console.error('DEPLOY FAIL:', JSON.stringify(e, Object.getOwnPropertyNames(e).concat(['message', 'shortMessage', 'stack', 'data', 'cause']), 2)); }
  catch (_) { console.error('DEPLOY FAIL raw:', String(e)); }
  process.exit(1);
});
