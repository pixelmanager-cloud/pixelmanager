// Trial/loan academy — an off-chain, free scouting loop. Each season a seeded pool
// of trialists appears; you sign up to LOANEE_CAP of them for the season (they expire
// at rollover). Rarity is gated by scout tier (only 'base' is free/active now; the
// rest are the future paid Scout-NFT tiers). See docs / the design chat.
import { generateTrialist, overall, type Club, type Player, type Tactics } from '@fm/shared';

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

// ── Opposition scout: a tiered reveal ladder (info-not-power, capped) ─────────
// Base is free and shows only who + how they line up. Higher tiers progressively
// unlock ratings, the likely XI, and a capped tactical read — never raw stats.
export type OppTier = 'base' | 'bronze' | 'silver' | 'gold';
export interface OppReveal { overalls: boolean; likelyXI: boolean; intel: boolean }
export const OPP_REVEAL: Record<OppTier, OppReveal> = {
  base:   { overalls: false, likelyXI: false, intel: false }, // names + roles + formation
  bronze: { overalls: true,  likelyXI: false, intel: false }, // + player overalls
  silver: { overalls: true,  likelyXI: true,  intel: false }, // + likely XI
  gold:   { overalls: true,  likelyXI: true,  intel: true },  // + capped tactical intel
};

/** A short, deliberately vague tactical read — a lean, never exact numbers. */
export function describeIntel(club: Club, tactics: Tactics, likelyIds: Set<string>): string {
  const bits: string[] = [];
  const m = tactics.mentality, l = tactics.line, pr = tactics.press, te = tactics.tempo, w = tactics.width;
  bits.push(m >= 1 ? 'attack-minded' : m <= -1 ? 'defensive-minded' : 'balanced');
  if (l >= 1) bits.push('high defensive line'); else if (l <= -1) bits.push('deep line');
  if (pr >= 2) bits.push('gegenpress'); else if (pr >= 1) bits.push('presses high'); else if (pr <= -1) bits.push('sits off');
  if (te >= 1) bits.push('direct tempo'); else if (te <= -1) bits.push('patient build-up');
  if (w >= 1) bits.push('plays wide'); else if (w <= -1) bits.push('plays narrow');
  // one capped squad trait from the likely XI (a lean, not a stat dump)
  const xi = club.players.filter((p) => likelyIds.has(p.id));
  const avg = (rs: string[]) => { const ps = xi.filter((p) => rs.includes(p.role)); return ps.length ? ps.reduce((s, p) => s + p.attrs.pace, 0) / ps.length : 0; };
  const fwPace = avg(['FW']), dfPace = avg(['DF']);
  let trait = '';
  if (fwPace >= 15) trait = 'rapid forwards — wary of balls in behind';
  else if (fwPace && fwPace <= 11) trait = 'slow forwards — hold a high line';
  else if (dfPace && dfPace <= 11) trait = 'slow defenders — pace can hurt them';
  else if (dfPace >= 15) trait = 'quick defenders — hard to run past';
  return `Lean: ${bits.join(', ')}.` + (trait ? ` Read: ${trait}.` : '');
}
