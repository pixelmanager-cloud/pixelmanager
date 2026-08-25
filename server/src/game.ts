// Server-side game logic — reuses the SAME deterministic engine as the client.
import {
  generateClub, autoPickXI, buildXI, MatchEngine, TACTIC_PRESETS, defaultDuty, isDutyForRole,
  type Club, type Duty, type Lineup, type Tactics, type Team, type Formation,
} from '@fm/shared';
import type { StandingOrders } from './db.js';

// Base squads are weak FILLERS (validated filler tier from ladder_sim). Strength/star
// players come only from owned PlayerNFTs, which merge in on top (see loadSquad/nft.ts).
const BASE_QUALITY = 6;

const short = (h: string) => (h.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'FC');
// distinct kit colours so opponents are easy to tell apart on the pitch
const KIT_COLORS = [0xd23b3b, 0x3b6bd2, 0x2fae6a, 0xe08a2a, 0x9b3bd2, 0x2ab0c0, 0xc0392b, 0xd23b7a, 0x7f8c2a];

/** A fresh club + sensible default standing orders for a new account. */
export function makeClub(accountId: string, handle: string): { club: Club; standingOrders: StandingOrders } {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const color = KIT_COLORS[Math.floor(Math.random() * KIT_COLORS.length)];
  const club = generateClub(accountId, `${handle}'s Club`, short(handle), color, BASE_QUALITY, seed);
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

/** Run a full match on the authoritative engine and return the deterministic result. */
export function runMatch(
  homeClub: Club, homeLineup: Lineup, homeTactics: Tactics,
  awayClub: Club, awayLineup: Lineup, awayTactics: Tactics,
): { seed: number; homeTeam: Team; awayTeam: Team; result: [number, number] } {
  const homeTeam = buildXI(homeClub, homeLineup);
  const awayTeam = buildXI(awayClub, awayLineup);
  const seed = Math.floor(Math.random() * 2 ** 31);
  const m = new MatchEngine([homeTeam, awayTeam], seed, [homeTactics, awayTactics]);
  while (!m.state.finished) m.tick();
  return { seed, homeTeam, awayTeam, result: [m.state.score[0], m.state.score[1]] };
}

/** Standard Elo update. scoreHome: 1 win / 0.5 draw / 0 loss. */
export function elo(rHome: number, rAway: number, scoreHome: number, k = 32): [number, number] {
  const expHome = 1 / (1 + 10 ** ((rAway - rHome) / 400));
  const nHome = Math.round(rHome + k * (scoreHome - expHome));
  const nAway = Math.round(rAway + k * ((1 - scoreHome) - (1 - expHome)));
  return [nHome, nAway];
}

export const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '4-1-2-1-2', '5-3-2', '4-5-1'];

export interface TableRow { id: string; handle: string; rating: number; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

/**
 * Football-style league standings from all matches played: 3 points a win, 1 a draw.
 * Every registered club appears (even with 0 games). Computed on the fly — fine at
 * this scale; materialise it later if the match count grows large.
 */
export function buildTable(
  accounts: Array<{ id: string; handle: string; rating: number }>,
  results: Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>,
): TableRow[] {
  const t = new Map<string, TableRow>();
  for (const a of accounts) t.set(a.id, { id: a.id, handle: a.handle, rating: a.rating, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 });
  for (const m of results) {
    const h = t.get(m.home_id), aw = t.get(m.away_id);
    if (!h || !aw) continue;
    h.P++; aw.P++;
    h.GF += m.home_score; h.GA += m.away_score; aw.GF += m.away_score; aw.GA += m.home_score;
    if (m.home_score > m.away_score) { h.W++; h.Pts += 3; aw.L++; }
    else if (m.home_score < m.away_score) { aw.W++; aw.Pts += 3; h.L++; }
    else { h.D++; aw.D++; h.Pts++; aw.Pts++; }
  }
  const rows = [...t.values()].map((r) => ({ ...r, GD: r.GF - r.GA }));
  // sort by points, then goal difference, then goals for, then name (standard tiebreakers)
  rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.handle.localeCompare(b.handle));
  return rows;
}
