// Scouting Network — dispatch a player-scout to a destination and wait for them to
// travel and (maybe) return with a prospect. Each destination is a risk/reward dial:
// a HIGH hit-rate place returns a player often but rarely a good one; a LOW hit-rate
// place seldom lands anyone, but when it does they can be special. The outcome is
// SEALED deterministically at dispatch (so it can't be re-rolled) and only REVEALED
// once the trip's travel time elapses. A higher player-scout NFT tier lifts both the
// hit rate and the odds of an upgraded prospect. Signed prospects reuse the loanee
// machinery (season-length), so squad balance is unchanged — only how you shop is new.
import { generateTrialist, overall } from './teams.js';
import type { Player } from './types.js';

// Rarity band shared with the trial/loan academy pool (see scouting.ts) — kept here
// so both pure prospect-generation modules can reference it without a cycle.
export type ScoutBand = 'raw' | 'squad' | 'quality' | 'gem';

const LOANEE_MAX_STAT = 12; // same hard cap as trial loanees — prospects are gap-fillers, not stars

export interface Destination {
  id: string; name: string; blurb: string;
  hitRate: number;                 // base chance of returning ANY player
  weights: Record<ScoutBand, number>;   // band distribution WHEN a player is found (sums ~1)
  travelMins: number;              // real-time travel before the result reveals
  cost: number;                    // coins to dispatch (elite places cost more)
}

// Bottom → top of the risk/reward ladder. Closer, cheaper places are reliable but
// shallow; distant, elite places are long-shots that can strike gold — and cost more
// to send a scout to. Costs are small vs a win (100 coins) but the elite trips add up.
export const DESTINATIONS: Destination[] = [
  { id: 'parks',     name: 'Local Parks',        blurb: 'Sunday-league pitches down the road. Someone almost always turns up — rarely anyone special.', hitRate: 0.90, weights: { raw: 0.70, squad: 0.26, quality: 0.04, gem: 0.00 }, travelMins: 60,  cost: 15 },
  { id: 'county',    name: 'County Trials',      blurb: 'Regional open trials. A fair shot at a useful body, the odd standout.',                         hitRate: 0.72, weights: { raw: 0.45, squad: 0.42, quality: 0.11, gem: 0.02 }, travelMins: 120, cost: 30 },
  { id: 'national',  name: 'National Camp',      blurb: 'Invitational youth camp. Fewer players come back, but the level steps up.',                    hitRate: 0.52, weights: { raw: 0.28, squad: 0.44, quality: 0.23, gem: 0.05 }, travelMins: 240, cost: 55 },
  { id: 'continental', name: 'Continental Showcase', blurb: 'A high-profile international youth tournament. Scouts jostle for the standouts — quality is on show, but few sign.', hitRate: 0.42, weights: { raw: 0.20, squad: 0.42, quality: 0.30, gem: 0.08 }, travelMins: 360, cost: 72 },
  { id: 'foreign',   name: 'Foreign Academies',  blurb: 'Scouting trips abroad. Long odds of anyone signing — but real quality when they do.',           hitRate: 0.34, weights: { raw: 0.14, squad: 0.40, quality: 0.34, gem: 0.12 }, travelMins: 480, cost: 90 },
  { id: 'wonderkid', name: 'Wonderkid Circuit',  blurb: 'Chasing whispers of a generational talent. Most trips come back empty. Some change everything.', hitRate: 0.18, weights: { raw: 0.05, squad: 0.25, quality: 0.40, gem: 0.30 }, travelMins: 720, cost: 140 },
];
export const destinationById = (id: string): Destination | undefined => DESTINATIONS.find((d) => d.id === id);

// SCOUTING QUALITY comes from the Scouting HQ facility. It used to come from a player-scout NFT tier, and
// when web3 was removed the caller was hardcoded to 'base' — which the table below gave a hit multiplier of
// 1.0 and an upgrade chance of ZERO. So the band-upgrade mechanic, the thing that makes a scouting trip
// occasionally return someone special, could never fire for anybody. The whole risk/reward dial the module
// was built around was dead, gated behind a paywall that no longer exists.
//
// It now runs off the Scouting HQ the player already levels 1→10 with coins, so investing in the facility
// buys better finds as well as better odds. (user decision, 2026-08-30)
const HIT_MULT: Record<string, number> = { base: 1.0, bronze: 1.12, silver: 1.25, gold: 1.4 };
const UPGRADE: Record<string, number> = { base: 0.0, bronze: 0.15, silver: 0.28, gold: 0.45 };
/** Chance a found prospect is bumped up a quality band, from the Scouting HQ level (1 → 10). */
export function hqUpgradeChance(hqLevel: number): number {
  return Math.max(0, Math.min(0.5, (Math.max(1, hqLevel) - 1) * 0.055));
}

/** The tier-adjusted odds to show on a destination card (never mutates config).
 *  hqMult is the Scouting-HQ facility's extra hit-rate multiplier (1 = no bonus). */
export function previewOdds(dest: Destination, playerTier: string, hqMult = 1, hqLevel = 1): { hitRate: number; upgradeChance: number } {
  return {
    hitRate: Math.min(0.95, dest.hitRate * (HIT_MULT[playerTier] ?? 1) * hqMult),
    upgradeChance: Math.max(UPGRADE[playerTier] ?? 0, hqUpgradeChance(hqLevel)),
  };
}

const BAND_Q: Record<ScoutBand, [number, number]> = { raw: [1, 3], squad: [4, 6], quality: [6, 8], gem: [8, 10] };
const bumpUp: Record<ScoutBand, ScoutBand> = { raw: 'squad', squad: 'quality', quality: 'gem', gem: 'gem' };
function bandOf(ovr: number): ScoutBand { return ovr >= 11 ? 'gem' : ovr >= 9 ? 'quality' : ovr >= 7 ? 'squad' : 'raw'; }

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

export interface MissionOutcome { found: boolean; player: Player | null; band: ScoutBand | null; overall: number | null }

/** Deterministically seal a trip's outcome at dispatch. Same (missionId, destination,
 *  playerTier) → same result forever; travel time only controls WHEN it's shown. */
export function rollMission(missionId: string, dest: Destination, playerTier: string, hqMult = 1, hqLevel = 1): MissionOutcome {
  const rng = mulberry32(seedFrom(`${missionId}:${dest.id}:${playerTier}`));
  const hit = rng() < Math.min(0.95, dest.hitRate * (HIT_MULT[playerTier] ?? 1) * hqMult);
  if (!hit) return { found: false, player: null, band: null, overall: null };
  // pick a band from the destination's distribution
  const r = rng();
  let acc = 0, band: ScoutBand = 'raw';
  for (const b of ['gem', 'quality', 'squad', 'raw'] as ScoutBand[]) { acc += dest.weights[b]; if (r < acc) { band = b; break; } }
  // a good Scouting HQ occasionally turns an ordinary find into a real one — this is the mechanic that
  // was permanently zero while it was gated on the removed NFT tier
  if (rng() < Math.max(UPGRADE[playerTier] ?? 0, hqUpgradeChance(hqLevel))) band = bumpUp[band];
  const [lo, hi] = BAND_Q[band];
  const q = lo + rng() * (hi - lo);
  const statSeed = (seedFrom(missionId) ^ 0x9e3779b1) >>> 0;
  const player = generateTrialist(`scout-${missionId}`, q, statSeed, LOANEE_MAX_STAT);
  const ovr = overall(player);
  return { found: true, player, band: bandOf(ovr), overall: ovr };
}

/** HOW MANY MATCHDAYS A SCOUTING TRIP TAKES. It replaced a wall-clock wait, and `travelMs` -- the
 *  function that produced that wait -- was REMOVED on 2026-09-02 rather than left exported and tested
 *  with no production caller. `dest.travelMins` survives as the ladder's ordering, read below.
 *
 *  The trip used to reveal after `travelMins` of REAL TIME — one to twelve hours — in an offline,
 *  single-player, premium game with no monetisation. That is a free-to-play pacing mechanic with nothing
 *  behind it, and it protected nothing: `rollMission` computes the outcome AT DISPATCH and writes it into
 *  the save, so the result was already sitting in the file for the whole wait, gated on a system clock the
 *  player controls.
 *
 *  A trip now costs matchdays instead, proportional to how far the scout has gone — so the Wonderkid
 *  Circuit really is a commitment and the local parks really are a quick look. `travelMins / 80` keeps the
 *  six destinations distinct (1, 2, 3, 5, 6, 9) and caps the longest at half of an 18-game season. */
export function travelMatchdays(dest: Destination): number {
  return Math.max(1, Math.min(9, Math.round(dest.travelMins / 80)));
}
