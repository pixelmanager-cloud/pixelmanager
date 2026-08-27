// Dev-only override for your player-scout tier, read from an env var — not part of
// the pure @fm/shared market rules (see shared/src/market.ts for those). Currently
// unused by any live route but kept for local testing.
import type { PlayerScoutTier } from '@fm/shared';

export function playerScoutTier(): PlayerScoutTier {
  const t = process.env.DEV_PLAYER_TIER;
  return t === 'base' || t === 'bronze' || t === 'silver' || t === 'gold' ? t : 'base';
}
