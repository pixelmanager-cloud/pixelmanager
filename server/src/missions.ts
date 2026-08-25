// Scouting Network — dispatch a player-scout to a destination and wait for them to
// travel and (maybe) return with a prospect. Each destination is a risk/reward dial:
// a HIGH hit-rate place returns a player often but rarely a good one; a LOW hit-rate
// place seldom lands anyone, but when it does they can be special. The outcome is
// SEALED deterministically at dispatch (so it can't be re-rolled) and only REVEALED
// once the trip's travel time elapses. A higher player-scout NFT tier lifts both the
// hit rate and the odds of an upgraded prospect. Signed prospects reuse the loanee
// machinery (season-length), so squad balance is unchanged — only how you shop is new.
import { generateTrialist, overall, type Player } from '@fm/shared';
import type { Band } from './scouting.js';

export const TRIPS_PER_SEASON = Math.max(1, Number(process.env.SCOUT_TRIPS_PER_SEASON ?? 3));
// Compresses every travel time (set e.g. 0.01 locally to test the reveal quickly).
const TRAVEL_SCALE = Math.max(0, Number(process.env.SCOUT_TRAVEL_SCALE ?? 1));
const LOANEE_MAX_STAT = 12; // same hard cap as trial loanees — prospects are gap-fillers, not stars

export interface Destination {
  id: string; name: string; blurb: string;
  hitRate: number;                 // base chance of returning ANY player
  weights: Record<Band, number>;   // band distribution WHEN a player is found (sums ~1)
  travelMins: number;              // real-time travel before the result reveals
}

// Bottom → top of the risk/reward ladder. Closer, cheaper places are reliable but
// shallow; distant, elite places are long-shots that can strike gold.
export const DESTINATIONS: Destination[] = [
  { id: 'parks',     name: 'Local Parks',        blurb: 'Sunday-league pitches down the road. Someone almost always turns up — rarely anyone special.', hitRate: 0.90, weights: { raw: 0.70, squad: 0.26, quality: 0.04, gem: 0.00 }, travelMins: 60 },
  { id: 'county',    name: 'County Trials',      blurb: 'Regional open trials. A fair shot at a useful body, the odd standout.',                         hitRate: 0.72, weights: { raw: 0.45, squad: 0.42, quality: 0.11, gem: 0.02 }, travelMins: 120 },
  { id: 'national',  name: 'National Camp',      blurb: 'Invitational youth camp. Fewer players come back, but the level steps up.',                    hitRate: 0.52, weights: { raw: 0.28, squad: 0.44, quality: 0.23, gem: 0.05 }, travelMins: 240 },
  { id: 'foreign',   name: 'Foreign Academies',  blurb: 'Scouting trips abroad. Long odds of anyone signing — but real quality when they do.',           hitRate: 0.34, weights: { raw: 0.14, squad: 0.40, quality: 0.34, gem: 0.12 }, travelMins: 480 },
  { id: 'wonderkid', name: 'Wonderkid Circuit',  blurb: 'Chasing whispers of a generational talent. Most trips come back empty. Some change everything.', hitRate: 0.18, weights: { raw: 0.05, squad: 0.25, quality: 0.40, gem: 0.30 }, travelMins: 720 },
];
export const destinationById = (id: string): Destination | undefined => DESTINATIONS.find((d) => d.id === id);

// Player-scout NFT tier boosts: a hit-rate multiplier and a chance to bump a found
// prospect up one band. 'base' (no NFT) gets nothing; Gold is a real edge.
const HIT_MULT: Record<string, number> = { base: 1.0, bronze: 1.12, silver: 1.25, gold: 1.4 };
const UPGRADE: Record<string, number> = { base: 0.0, bronze: 0.15, silver: 0.28, gold: 0.45 };

/** The tier-adjusted odds to show on a destination card (never mutates config). */
export function previewOdds(dest: Destination, playerTier: string): { hitRate: number; upgradeChance: number } {
  return { hitRate: Math.min(0.95, dest.hitRate * (HIT_MULT[playerTier] ?? 1)), upgradeChance: UPGRADE[playerTier] ?? 0 };
}

const BAND_Q: Record<Band, [number, number]> = { raw: [1, 3], squad: [4, 6], quality: [6, 8], gem: [8, 10] };
const bumpUp: Record<Band, Band> = { raw: 'squad', squad: 'quality', quality: 'gem', gem: 'gem' };
function bandOf(ovr: number): Band { return ovr >= 11 ? 'gem' : ovr >= 9 ? 'quality' : ovr >= 7 ? 'squad' : 'raw'; }

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

export interface MissionOutcome { found: boolean; player: Player | null; band: Band | null; overall: number | null }

/** Deterministically seal a trip's outcome at dispatch. Same (missionId, destination,
 *  playerTier) → same result forever; travel time only controls WHEN it's shown. */
export function rollMission(missionId: string, dest: Destination, playerTier: string): MissionOutcome {
  const rng = mulberry32(seedFrom(`${missionId}:${dest.id}:${playerTier}`));
  const hit = rng() < Math.min(0.95, dest.hitRate * (HIT_MULT[playerTier] ?? 1));
  if (!hit) return { found: false, player: null, band: null, overall: null };
  // pick a band from the destination's distribution
  const r = rng();
  let acc = 0, band: Band = 'raw';
  for (const b of ['gem', 'quality', 'squad', 'raw'] as Band[]) { acc += dest.weights[b]; if (r < acc) { band = b; break; } }
  if (rng() < (UPGRADE[playerTier] ?? 0)) band = bumpUp[band]; // scout-tier upgrade
  const [lo, hi] = BAND_Q[band];
  const q = lo + rng() * (hi - lo);
  const statSeed = (seedFrom(missionId) ^ 0x9e3779b1) >>> 0;
  const player = generateTrialist(`scout-${missionId}`, q, statSeed, LOANEE_MAX_STAT);
  const ovr = overall(player);
  return { found: true, player, band: bandOf(ovr), overall: ovr };
}

/** Travel time in ms for a destination, honouring the test-compression scale. */
export function travelMs(dest: Destination): number { return Math.round(dest.travelMins * 60_000 * TRAVEL_SCALE); }
