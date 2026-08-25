// Trial/loan academy — an off-chain, free scouting loop. Each season a seeded pool
// of trialists appears; you sign up to LOANEE_CAP of them for the season (they expire
// at rollover). Rarity is gated by scout tier (only 'base' is free/active now; the
// rest are the future paid Scout-NFT tiers). See docs / the design chat.
import { generateTrialist, overall, type Player } from '@fm/shared';

export const LOANEE_CAP = 3;   // max loanees a club can sign per season
export const POOL_SIZE = 6;    // trialists shown per season

export type Band = 'raw' | 'squad' | 'quality' | 'gem';
// probability of each band per scout tier (rows sum to 1)
export const SCOUT_TIERS: Record<string, Record<Band, number>> = {
  base:   { raw: 0.62, squad: 0.30, quality: 0.07, gem: 0.01 },
  bronze: { raw: 0.45, squad: 0.38, quality: 0.14, gem: 0.03 },
  silver: { raw: 0.28, squad: 0.44, quality: 0.22, gem: 0.06 },
  gold:   { raw: 0.12, squad: 0.43, quality: 0.33, gem: 0.12 },
};
// stat centre per band. NOTE: realized OVERALL runs ~2 higher than the centre
// (role-biased stats + the overall formula), so centres are set low on purpose —
// the displayed band is then derived from the real overall so the label matches.
const BAND_Q: Record<Band, [number, number]> = { raw: [3, 6], squad: [7, 9], quality: [10, 12], gem: [13, 14] };
/** classify a realized overall into a band, so the badge always matches the rating shown. */
function bandOf(ovr: number): Band { return ovr >= 15 ? 'gem' : ovr >= 13 ? 'quality' : ovr >= 10 ? 'squad' : 'raw'; }

function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Deterministically roll the trialist at a given pool index (same inputs → same player). */
function rollAt(accountId: string, seasonNumber: number, index: number, tier: string): { player: Player; band: Band; overall: number } {
  const base = seedFrom(`${accountId}:${seasonNumber}:${tier}`);
  const s = (base ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  const bandRng = (Math.imul(s, 2654435761) >>> 0) / 2 ** 32;
  const dist = SCOUT_TIERS[tier] ?? SCOUT_TIERS.base;
  let acc = 0, rolled: Band = 'raw';
  for (const b of ['gem', 'quality', 'squad', 'raw'] as Band[]) { acc += dist[b]; if (bandRng < acc) { rolled = b; break; } }
  const [lo, hi] = BAND_Q[rolled];
  const q = lo + ((s % 997) / 997) * (hi - lo);
  const player = generateTrialist(`loan-s${seasonNumber}-${index}`, q, s);
  const ovr = overall(player);
  return { player, band: bandOf(ovr), overall: ovr }; // display band from the ACTUAL rating
}

export interface TrialInfo { index: number; id: string; name: string; role: string; overall: number; band: Band }
export function generatePool(accountId: string, seasonNumber: number, tier = 'base'): TrialInfo[] {
  return Array.from({ length: POOL_SIZE }, (_, i) => {
    const { player, band, overall: ovr } = rollAt(accountId, seasonNumber, i, tier);
    return { index: i, id: player.id, name: player.name, role: player.role, overall: ovr, band };
  });
}
export function trialistAt(accountId: string, seasonNumber: number, index: number, tier = 'base'): Player | null {
  if (index < 0 || index >= POOL_SIZE) return null;
  return rollAt(accountId, seasonNumber, index, tier).player;
}
