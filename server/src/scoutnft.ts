// ScoutNFT bridge — a wallet's owned scout licenses set its scouting tiers.
// ERC-1155 ids: 1=OppBronze 2=OppSilver 3=OppGold, 4=PlayerBronze 5=PlayerSilver 6=PlayerGold.
// The game takes the HIGHEST tier owned in each track. Env overrides (DEV_OPP_TIER /
// DEV_PLAYER_TIER) still win, for previewing tiers without minting.
import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';

export const SCOUT_ADDRESS = (process.env.SCOUT_ADDRESS ?? '') as `0x${string}` | ''; // set after deploy; '' = off

const abi = [
  {
    type: 'function', name: 'balanceOfBatch', stateMutability: 'view',
    inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'ids', type: 'uint256[]' }],
    outputs: [{ type: 'uint256[]' }],
  },
] as const;

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

export type Tier = 'base' | 'bronze' | 'silver' | 'gold';
export interface ScoutTiers { opp: Tier; player: Tier }

/** Read a wallet's scout tiers straight from chain (highest owned per track). */
async function onChainTiers(wallet: string | null): Promise<ScoutTiers> {
  if (!SCOUT_ADDRESS || !wallet) return { opp: 'base', player: 'base' };
  try {
    const c = getContract({ address: SCOUT_ADDRESS, abi, client: publicClient });
    const w = wallet as `0x${string}`;
    const bals = await c.read.balanceOfBatch([[w, w, w, w, w, w], [1n, 2n, 3n, 4n, 5n, 6n]]);
    const has = bals.map((b) => b > 0n);
    const opp: Tier = has[2] ? 'gold' : has[1] ? 'silver' : has[0] ? 'bronze' : 'base';
    const player: Tier = has[5] ? 'gold' : has[4] ? 'silver' : has[3] ? 'bronze' : 'base';
    return { opp, player };
  } catch {
    return { opp: 'base', player: 'base' }; // chain unreachable → base tiers, never break scouting
  }
}

/** A viewer's effective scout tiers (env override wins over on-chain ownership). */
export async function viewerTiers(wallet: string | null): Promise<ScoutTiers> {
  const chain = await onChainTiers(wallet);
  const oppDev = process.env.DEV_OPP_TIER as Tier | undefined;
  const playerDev = process.env.DEV_PLAYER_TIER as Tier | undefined;
  return { opp: oppDev ?? chain.opp, player: playerDev ?? chain.player };
}

export const scoutMintEnabled = () => !!SCOUT_ADDRESS;
export const scoutNftInfo = () => ({ address: SCOUT_ADDRESS, chainId: baseSepolia.id, enabled: scoutMintEnabled() });
