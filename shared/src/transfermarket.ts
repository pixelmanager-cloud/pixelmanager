// ── Transfer market — buy/sell fictional players + incoming bids for your star ────────────────────────
// Single-player, deterministic, coin-based. A per-season market of fictional players (quality scaled to
// the club's pyramid TIER — you can only shop at your level), so buying strengthens the squad and helps
// you climb. Plus occasional rival BIDS for the bloodline star (cash in, or keep the dynasty player). Pure
// + seeded (no rng/wall-clock); the coin economy and squad live in the save.
import type { Player } from './types.js';
import { overall } from './teams.js';
import { generateClub } from './teams.js';
import { tierStrength } from './clubseason.js';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hash32(...nums: number[]): number { let h = 2166136261 >>> 0; for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); } return h >>> 0; }

export const TRANSFER_LIST_SIZE = 12;   // fictional players offered for sale each season
// squad bounds (MIN_SQUAD/MAX_SQUAD) live in market.ts — reused by the buy/sell facade

/** Transfer FEE (coins) to buy a player — ability-driven, tuned to the season-prize economy so a couple of
 *  buys a season is realistic. A rising fee is the cost of climbing the pyramid. */
export function transferFee(ov: number): number { return Math.round(Math.pow(clamp(ov, 1, 20), 2) * 2.4 + 40); }
/** SELL value (coins) for offloading a squad player — a bit under the buy fee (you take a haircut). */
export function sellValue(ov: number): number { return Math.round(Math.pow(clamp(ov, 1, 20), 2) * 1.6 + 20); }

export interface Listing { player: Player; fee: number; age: number; ov: number }

/** The fictional players available to BUY this season — quality scaled to the club's tier (shop at your
 *  level), across all four positions, deterministic per (seed, season, tier). */
export function transferList(seed: number, season: number, tier: number, size = TRANSFER_LIST_SIZE): Listing[] {
  const quality = clamp(tierStrength(tier) + 1, 4, 18);   // market is a touch above the tier baseline
  // generate a couple of squads' worth at this quality, then take a spread across positions
  const club = generateClub(`market-${season}-${tier}`, 'Free Agents', 'FA', 0x888888, quality, hash32(seed, season * 7919, tier * 131));
  const pool = club.players.slice();
  const out: Listing[] = [];
  for (let i = 0; i < size && i < pool.length; i++) {
    const p = pool[i];
    const ov = overall(p);
    const age = 18 + (hash32(seed, season, i * 97) % 15);          // 18..32, flavour + fee nudge
    const youthPremium = age <= 23 ? 1.25 : age >= 30 ? 0.8 : 1;    // young + able = dearer
    out.push({ player: { ...p, id: `mk:${season}:${tier}:${i}` }, fee: Math.round(transferFee(ov) * youthPremium), age, ov });
  }
  return out.sort((a, b) => b.ov - a.ov);
}

// ── incoming bids for your star ────────────────────────────────────────────────────────────────────
const BIDDER_CLUBS = ['Real Valmonte', 'Internazionale Brava', 'Atlético Kesport', 'Bayern Hoffung',
  'Olympique Marenne', 'Sporting Duruvia', 'AC Trentia', 'FC Norhavn', 'Club Volenza', 'Ajax Poranto'];

export interface Bid { club: string; fee: number }
/** An occasional rival BID for the bloodline star — the drama of cashing in vs keeping the dynasty player.
 *  Only fires for a genuinely good star, and not every season (deterministic ~1-in-3). Null = no bid. */
export function incomingBid(seed: number, season: number, starOverall: number, starAge: number): Bid | null {
  if (starOverall < 13 || starAge > 31) return null;             // only real assets attract bids
  const h = hash32(seed, season * 104729, Math.round(starOverall));
  if (h % 3 !== 0) return null;                                   // ~1 season in 3
  const club = BIDDER_CLUBS[h % BIDDER_CLUBS.length];
  // a strong offer — above the plain sell value, scaled by how good he is (youth premium too)
  const premium = starAge <= 24 ? 1.6 : starAge <= 28 ? 1.3 : 1.05;
  const fee = Math.round(sellValue(starOverall) * premium * (1 + (h % 40) / 100)); // + up to ~40% variance
  return { club, fee };
}
