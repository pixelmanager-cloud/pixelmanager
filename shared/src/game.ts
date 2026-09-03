// Game rules shared between server and client: club creation, lineup validation/duty
// cleanup, and the authoritative match-engine wrapper. PvP-only pieces (Elo, league
// table building from live results) stay server-side — see server/src/game.ts.
import { generateClub, autoPickXI, buildXI, type Club, type Lineup } from './teams.js';
import { MatchEngine } from './engine.js';
import { TACTIC_PRESETS } from './tactics.js';
import { defaultDuty, isDutyForRole } from './duties.js';
import type { Formation } from './formations.js';
import { FORMATIONS } from './formations.js';   // the shapes themselves, so PICKABLE_FORMATIONS cannot drift from them
import type { Tactics } from './tactics.js';
import type { Duty, Team, MatchEvent } from './types.js';

// Base squads are weak FILLERS (validated filler tier from ladder_sim). Strength/star
// players come only from owned PlayerNFTs, which merge in on top (see loadSquad/nft.ts).
const BASE_QUALITY = 6;


/** A fresh club + sensible default standing orders for a new account. `seed` and
 *  `shirtColor` are the caller's job to pick (a fresh random draw server-side, or a
 *  fixed value in a test) — kept out of here so this stays a pure function of its inputs. */
export function makeClub(
  accountId: string, handle: string, seed: number, shirtColor: number, clubName?: string,
): { club: Club; standingOrders: { formation: Formation; playerIds: string[]; tactics: Tactics } } {
  const name = clubName?.trim() || `${handle}'s Club`;
  // rich=true — this is the MANAGER'S OWN squad, so every player is a full character the manager can get
  // attached to (15 stats + personality + traits + age), not filler (Living Squad).
  const club = generateClub(accountId, name, shirtColor, BASE_QUALITY, seed, true);
  const lineup = autoPickXI(club, '4-4-2');
  return { club, standingOrders: { formation: '4-4-2', playerIds: lineup.playerIds, tactics: { ...TACTIC_PRESETS.Balanced } } };
}

/** A lineup is valid if it fields 11 distinct players the club actually owns. */
export function validateLineup(club: Club, lineup: Lineup): boolean {
  const owned = new Set(club.players.map((p) => p.id));
  if (!Array.isArray(lineup.playerIds) || lineup.playerIds.length !== 11) return false;
  if (new Set(lineup.playerIds).size !== 11) return false;
  return lineup.playerIds.every((id) => owned.has(id));
}

/**
 * Sanitise manager-supplied duties against each slot's player: an illegal or missing
 * duty falls back to that player's stat-derived default. Returns undefined if none
 * were supplied (the engine then auto-derives — identical behaviour). Assumes the
 * lineup already passed validateLineup, so every playerId is owned.
 */
export function cleanDuties(club: Club, lineup: Lineup): Duty[] | undefined {
  if (!Array.isArray(lineup.duties)) return undefined;
  return lineup.playerIds.map((pid, i) => {
    const p = club.players.find((x) => x.id === pid)!;
    const d = lineup.duties![i];
    return isDutyForRole(p.role, d) ? d : defaultDuty(p);
  });
}

/** Run a full match on the authoritative engine and return the deterministic result.
 *  `seed` is the caller's job (fresh random draw server-side, fixed in a replay/test) —
 *  given the same seed and inputs, this always plays out identically.
 *  Optional per-side conditioning (training-ground fitness-drain multiplier, 1 = normal). */
export function runMatch(
  homeClub: Club, homeLineup: Lineup, homeTactics: Tactics,
  awayClub: Club, awayLineup: Lineup, awayTactics: Tactics,
  seed: number,
  conditioning?: { home?: number; away?: number },
  homeBoost?: number,
): { seed: number; homeTeam: Team; awayTeam: Team; result: [number, number]; homeFitness: number[]; awayFitness: number[]; events: MatchEvent[] } {
  const homeTeam = buildXI(homeClub, homeLineup);
  const awayTeam = buildXI(awayClub, awayLineup);
  if (conditioning?.home != null) homeTeam.conditioning = conditioning.home;
  if (conditioning?.away != null) awayTeam.conditioning = conditioning.away;
  if (homeBoost != null) homeTeam.homeBoost = homeBoost; // Fan Zone home advantage on the host
  const m = new MatchEngine([homeTeam, awayTeam], seed, [homeTactics, awayTactics]);
  while (!m.state.finished) m.tick();
  // end-of-match fitness per XI slot (drives injury rolls — gassed players break down more)
  const homeFitness = m.state.players[0].map((p) => p.fitness);
  const awayFitness = m.state.players[1].map((p) => p.fitness);
  return { seed, homeTeam, awayTeam, result: [m.state.score[0], m.state.score[1]], homeFitness, awayFitness, events: m.state.events };
}

// Named PICKABLE_FORMATIONS to avoid colliding with formations.ts's FORMATIONS (the
// full per-role pitch-anchor map) — this is just the subset offered as a lineup pick.
// DERIVED, NOT HAND-WRITTEN. This was a hand-maintained list of eight that nothing anywhere imported, and
// it had drifted: it omitted 4-2-2-2, 4-1-4-1 and 5-4-1, all three of which the lineup editor offers,
// because the editor takes its list from Object.keys(FORMATION_SHAPES). A second, stale copy of a list is
// how the picker and the validator disagreed once before (see main.ts:222) and silently failed to save
// three shapes. Deriving it means the two can never diverge again.
export const PICKABLE_FORMATIONS: Formation[] = Object.keys(FORMATIONS) as Formation[];
