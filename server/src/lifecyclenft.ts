// LifecycleNFT bridge — the on-chain half of the web3 lifecycle loop.
//
// The chain holds OWNERSHIP + lineage (generation, genesSeed); all game state lives off-chain
// keyed by tokenId. This module reads ownership/lineage via viem, and — in DEV (local Anvil) —
// can also submit mint/reborn txs with a server signer so we can prove the whole loop without a
// browser wallet. In prod the USER's wallet mints/reborns (client tx) and the server only reads.
//
// Env:
//   LIFECYCLE_ADDRESS     contract address ('' = feature off)
//   LIFECYCLE_RPC         RPC url (default local Anvil)
//   LIFECYCLE_CHAIN_ID    chain id (default 31337 Anvil; 84532 = Base Sepolia)
//   LIFECYCLE_SIGNER_KEY  server signer private key — enables dev-mode server minting; '' = client-only
import { createPublicClient, createWalletClient, http, getContract, defineChain, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const RPC = process.env.LIFECYCLE_RPC ?? 'http://127.0.0.1:8545';
const CHAIN_ID = Number(process.env.LIFECYCLE_CHAIN_ID ?? 31337);
// Anvil's deterministic first-deploy address is the local default; override per-env once on testnet.
export const LIFECYCLE_ADDRESS = (process.env.LIFECYCLE_ADDRESS ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}` | '';

const chain = CHAIN_ID === baseSepolia.id
  ? baseSepolia
  : defineChain({ id: CHAIN_ID, name: `chain-${CHAIN_ID}`, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });

export const abi = [
  { type: 'function', name: 'mint', stateMutability: 'nonpayable', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'reborn', stateMutability: 'nonpayable', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'uint16' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'tokenOfOwnerByIndex', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'generationOf', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ type: 'uint16' }] },
  { type: 'function', name: 'genesSeedOf', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'lineageOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: 'generation', type: 'uint16' }, { name: 'genesSeed', type: 'uint256' }] },
] as const;

const publicClient = createPublicClient({ chain, transport: http(RPC) });
const read = () => getContract({ address: LIFECYCLE_ADDRESS as `0x${string}`, abi, client: publicClient });

const SIGNER_KEY = process.env.LIFECYCLE_SIGNER_KEY ?? '';
const signer = SIGNER_KEY ? privateKeyToAccount(SIGNER_KEY as `0x${string}`) : null;
const walletClient = signer ? createWalletClient({ account: signer, chain, transport: http(RPC) }) : null;

export const lifecycleEnabled = () => !!LIFECYCLE_ADDRESS;
export const serverSignerEnabled = () => !!walletClient; // dev-mode: server can mint/reborn on behalf
export const lifecycleInfo = () => ({ address: LIFECYCLE_ADDRESS, chainId: CHAIN_ID, rpc: RPC, enabled: lifecycleEnabled(), serverSigner: serverSignerEnabled(), signerAddress: signer?.address ?? null });

export interface OnchainToken { tokenId: string; generation: number; genesSeed: string }

/** All lifecycle tokens a wallet owns on-chain, with lineage. Empty on any failure (chain unreachable). */
export async function ownedTokens(wallet: string | null): Promise<OnchainToken[]> {
  if (!LIFECYCLE_ADDRESS || !wallet || !isAddress(wallet)) return [];
  try {
    const c = read();
    const bal = Number(await c.read.balanceOf([wallet as `0x${string}`]));
    const out: OnchainToken[] = [];
    for (let i = 0; i < bal; i++) {
      const id = await c.read.tokenOfOwnerByIndex([wallet as `0x${string}`, BigInt(i)]);
      const [gen, seed] = await c.read.lineageOf([id]);
      out.push({ tokenId: id.toString(), generation: Number(gen), genesSeed: seed.toString() });
    }
    return out;
  } catch { return []; }
}

/** The current on-chain owner of a token, lowercased — for gating actions. null if unreadable. */
export async function ownerOf(tokenId: string): Promise<string | null> {
  if (!LIFECYCLE_ADDRESS) return null;
  try { return (await read().read.ownerOf([BigInt(tokenId)])).toLowerCase(); }
  catch { return null; }
}

export async function lineageOf(tokenId: string): Promise<{ generation: number; genesSeed: string } | null> {
  if (!LIFECYCLE_ADDRESS) return null;
  try { const [g, s] = await read().read.lineageOf([BigInt(tokenId)]); return { generation: Number(g), genesSeed: s.toString() }; }
  catch { return null; }
}

// ── DEV-mode server signer: mint / reborn on behalf of a wallet (local Anvil only) ──
/** Mint a genesis prospect. In dev the server signer mints then transfers to `to`. Returns the tokenId. */
export async function serverMintTo(to: string): Promise<{ tokenId: string; generation: number; genesSeed: string }> {
  if (!walletClient || !signer) throw new Error('server signer disabled');
  const hash = await walletClient.writeContract({ address: LIFECYCLE_ADDRESS as `0x${string}`, abi, functionName: 'mint', args: [] });
  await publicClient.waitForTransactionReceipt({ hash });
  // the minted token is the highest-index token the signer now owns
  const c = read();
  const bal = Number(await c.read.balanceOf([signer.address]));
  const tokenId = await c.read.tokenOfOwnerByIndex([signer.address, BigInt(bal - 1)]);
  // transfer to the target wallet so on-chain ownership = the player's wallet
  if (to && isAddress(to) && to.toLowerCase() !== signer.address.toLowerCase()) {
    const th = await walletClient.writeContract({ address: LIFECYCLE_ADDRESS as `0x${string}`, abi: [{ type: 'function', name: 'transferFrom', stateMutability: 'nonpayable', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [] }] as const, functionName: 'transferFrom', args: [signer.address, to as `0x${string}`, tokenId] });
    await publicClient.waitForTransactionReceipt({ hash: th });
  }
  const [gen, seed] = await c.read.lineageOf([tokenId]);
  return { tokenId: tokenId.toString(), generation: Number(gen), genesSeed: seed.toString() };
}

/** Reborn a token in place (dev server signer). Requires the signer to own it (owner-gated on-chain). */
export async function serverReborn(tokenId: string): Promise<number> {
  if (!walletClient) throw new Error('server signer disabled');
  const hash = await walletClient.writeContract({ address: LIFECYCLE_ADDRESS as `0x${string}`, abi, functionName: 'reborn', args: [BigInt(tokenId)] });
  await publicClient.waitForTransactionReceipt({ hash });
  return Number(await read().read.generationOf([BigInt(tokenId)]));
}
