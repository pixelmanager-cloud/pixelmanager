// Transfer market — an in-game coin economy. Managers list squad players for
// coins; buyers see stats only partially, with more revealed by their player-scout
// tier (info-not-power: you still pay, the scout just lets you buy smarter).
import type { Player, PlayerAttrs, Role } from '@fm/shared';
import { overall } from '@fm/shared';

// ── economy knobs ────────────────────────────────────────────────────────────
export const START_COINS = 500;          // seed balance for a new club
export const WIN_COINS = 100, DRAW_COINS = 40, LOSS_COINS = 15; // match earnings
export const MIN_SQUAD = 14;             // can't sell below this many players
export const MAX_SQUAD = 28;             // can't buy above this many
export const PRICE_MIN = 10, PRICE_MAX = 100000;

// ── scout-gated stat reveal ──────────────────────────────────────────────────
export type PlayerScoutTier = 'base' | 'bronze' | 'silver' | 'gold';
// how many of the 8 attrs a listing shows at each tier (overall is always shown)
const REVEAL_COUNT: Record<PlayerScoutTier, number> = { base: 0, bronze: 2, silver: 5, gold: 8 };
// which attrs matter most per role — revealed first as the tier climbs
const ATTR_PRIORITY: Record<Role, Array<keyof PlayerAttrs>> = {
  GK: ['keeping', 'positioning', 'strength', 'passing', 'workrate', 'pace', 'tackling', 'shooting'],
  DF: ['tackling', 'positioning', 'strength', 'pace', 'workrate', 'passing', 'keeping', 'shooting'],
  MF: ['passing', 'workrate', 'positioning', 'tackling', 'pace', 'shooting', 'strength', 'keeping'],
  FW: ['shooting', 'pace', 'positioning', 'strength', 'workrate', 'passing', 'tackling', 'keeping'],
};

export interface RevealedPlayer {
  name: string; role: Role; overall: number;
  attrs: Partial<Record<keyof PlayerAttrs, number>>; // only the revealed ones
  hidden: number;                                    // how many attrs stay locked
}

/** Show a listed player's stats through the buyer's player-scout tier. */
export function revealPlayer(p: Player, tier: PlayerScoutTier): RevealedPlayer {
  const n = REVEAL_COUNT[tier] ?? 0;
  const order = ATTR_PRIORITY[p.role];
  const attrs: Partial<Record<keyof PlayerAttrs, number>> = {};
  for (let i = 0; i < n && i < order.length; i++) attrs[order[i]] = p.attrs[order[i]];
  return { name: p.name, role: p.role, overall: overall(p), attrs, hidden: Math.max(0, 8 - n) };
}

export function playerScoutTier(): PlayerScoutTier {
  const t = process.env.DEV_PLAYER_TIER as PlayerScoutTier | undefined;
  return t && t in REVEAL_COUNT ? t : 'base';
}
