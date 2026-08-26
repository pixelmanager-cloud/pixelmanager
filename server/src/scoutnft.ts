// Scout tiers — off-chain. The game runs 100% off-chain, so scout tiers default to
// 'base' (free). DEV_OPP_TIER / DEV_PLAYER_TIER env overrides still let you preview
// higher tiers without any wallet/chain.

export type Tier = 'base' | 'bronze' | 'silver' | 'gold';
export interface ScoutTiers { opp: Tier; player: Tier }

/** A viewer's effective scout tiers. Off-chain: base, unless a DEV env override wins. */
export async function viewerTiers(_wallet: string | null): Promise<ScoutTiers> {
  const oppDev = process.env.DEV_OPP_TIER as Tier | undefined;
  const playerDev = process.env.DEV_PLAYER_TIER as Tier | undefined;
  return { opp: oppDev ?? 'base', player: playerDev ?? 'base' };
}

export const scoutMintEnabled = () => false;
export const scoutNftInfo = () => ({ address: '', chainId: 0, enabled: false });
