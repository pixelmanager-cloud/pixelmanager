// ── THE LIVING SQUAD — per-season lifecycle for the manager's own players ─────────────────────────
// The bloodline star is only ONE member of the squad. For the manager to get attached to the others,
// they have to LIVE: a 19-year-old you sign improves under you, a 31-year-old fades, contracts run
// down and force a keep-or-lose call, and wages make holding a big squad cost something. This module
// is the pure, deterministic core of that (no rng, no wall-clock) so it's replay-safe and testable.
//
// The bloodline STAR keeps his own token path (age in MgrState, developPlayer, tokenContract) — this
// covers everyone else in club.players: the starting squad, signings and trialists.
import type { Player } from './types.js';
import { developAttrs } from './lifecycle.js';
import { ageSquadAttrs, squadSeasonWage, SQUAD_CONTRACT_SEASONS, SQUAD_PEAK_AGE } from './transfermarket.js';
import { overall } from './teams.js';

/** Below this age a squad player still GROWS; at/after SQUAD_PEAK_AGE he plateaus then declines. */
export const SQUAD_GROWTH_AGE = SQUAD_PEAK_AGE - 1; // grows to 29, plateaus at 30, declines from 31

/** When a squad player hangs up his boots — robust players last longer (34..37, deterministic). */
export function squadRetireAge(p: Player): number {
  const a: any = p.attrs ?? {};
  const robust = (a.durability ?? a.stamina ?? 10) as number;
  return 34 + Math.max(0, Math.min(3, Math.round(robust / 7)));
}

/** Seasons remaining on a squad player's contract (0 = expired/expiring now). */
export function squadSeasonsLeft(p: Player, season: number): number {
  if (p.signedSeason == null || p.contractSeasons == null) return 0;
  return Math.max(0, p.signedSeason + p.contractSeasons - season);
}
/** Give a player a fresh contract as of `season` (signing or renewal). */
export function signSquadContract(p: Player, season: number, seasons = SQUAD_CONTRACT_SEASONS): Player {
  return { ...p, signedSeason: season, contractSeasons: seasons };
}

export interface SquadSeasonChange {
  player: Player;
  ovrBefore: number;
  ovrAfter: number;
  retired: boolean;
  expiring: boolean;   // contract runs out at the end of this rollover → keep-or-lose decision
}
export interface SquadRollover {
  players: Player[];            // everyone still at the club (retirees removed)
  changes: SquadSeasonChange[]; // per-player deltas, for the season report
  wageBill: number;             // total wages to charge for the season just played
  retired: Player[];
  expiring: Player[];
}

/** Advance ONE squad player a season: age +1, then grow (young) / plateau / decline (old).
 *  `trainingLvl` is the club's Training Ground level — better facilities grow youth faster and slow
 *  the fade, so investing in the club visibly pays off in the squad. */
export function advanceSquadPlayer(p: Player, trainingLvl = 1): Player {
  const age = (p.age ?? 24) + 1;
  let attrs = p.attrs as any;
  if (age <= SQUAD_GROWTH_AGE) {
    // reuse the star's own growth curve (genes absent → generic ceilings), so a young squad player
    // develops on the same model the bloodline player does
    attrs = developAttrs(attrs, undefined, Math.min(age, 31), trainingLvl);
  } else if (age > SQUAD_PEAK_AGE) {
    attrs = ageSquadAttrs(attrs, age);
  } // == SQUAD_PEAK_AGE: prime plateau
  return { ...p, age, attrs };
}

/** Roll the WHOLE squad forward one season. Pure: returns the new squad + everything the season
 *  report needs (who grew, who faded, who retired, whose deal is up, and the wage bill). */
export function advanceSquad(players: Player[], season: number, trainingLvl = 1): SquadRollover {
  const out: Player[] = [];
  const changes: SquadSeasonChange[] = [];
  const retired: Player[] = [];
  const expiring: Player[] = [];
  let wageBill = 0;
  for (const p of players) {
    const ovrBefore = overall(p);
    wageBill += squadSeasonWage(ovrBefore); // he was on the books all season
    const adv = advanceSquadPlayer(p, trainingLvl);
    const isRetired = (adv.age ?? 0) >= squadRetireAge(adv);
    const isExpiring = !isRetired && p.signedSeason != null && squadSeasonsLeft(adv, season + 1) <= 0;
    changes.push({ player: adv, ovrBefore, ovrAfter: overall(adv), retired: isRetired, expiring: isExpiring });
    if (isRetired) { retired.push(adv); continue; }
    out.push(adv);
    if (isExpiring) expiring.push(adv);
  }
  return { players: out, changes, wageBill, retired, expiring };
}
