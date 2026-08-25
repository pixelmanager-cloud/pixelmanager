// On-chain game token (web3 Step 2) — read-only from the server via viem.
// The token is a thirdweb "Token Drop" (ERC-20 with a free public claim = faucet)
// on Base Sepolia. The server only READS balances here; claiming is a client tx.
import { createPublicClient, http, getContract, formatUnits, erc20Abi, isAddress } from 'viem';
import { baseSepolia } from 'viem/chains';

// Deployed PIXEL TEST (PTEST). Override per-env with TOKEN_ADDRESS.
export const TOKEN_ADDRESS = (process.env.TOKEN_ADDRESS ?? '0x63EF99E736080519b2D8171FEa2bb3346a4Debd7') as `0x${string}`;
export const TOKEN_CHAIN = baseSepolia; // Base Sepolia (84532)

const publicClient = createPublicClient({ chain: TOKEN_CHAIN, transport: http() });
const contract = getContract({ address: TOKEN_ADDRESS, abi: erc20Abi, client: publicClient });

let _meta: { symbol: string; decimals: number } | null = null;
export async function tokenMeta(): Promise<{ symbol: string; decimals: number }> {
  if (!_meta) {
    const [symbol, decimals] = await Promise.all([contract.read.symbol(), contract.read.decimals()]);
    _meta = { symbol, decimals };
  }
  return _meta;
}

/** ERC-20 balance of an address, formatted to a human string (whole-token units). */
export async function tokenBalance(address: string): Promise<string> {
  if (!isAddress(address)) return '0';
  const [bal, meta] = await Promise.all([contract.read.balanceOf([address as `0x${string}`]), tokenMeta()]);
  return formatUnits(bal, meta.decimals);
}

export const tokenInfo = () => ({ address: TOKEN_ADDRESS, chainId: TOKEN_CHAIN.id, chainName: TOKEN_CHAIN.name });
