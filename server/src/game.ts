// Server-side game logic — reuses the SAME deterministic engine as the client.
import {
  generateClub, autoPickXI, buildXI, MatchEngine, TACTIC_PRESETS,
  type Club, type Lineup, type Tactics, type Team, type Formation,
} from '@fm/shared';
import type { StandingOrders } from './db.js';

const BASE_QUALITY = 12; // baseline squad strength; base/star (NFT) tiers come later

const short = (h: string) => (h.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'FC');

/** A fresh club + sensible default standing orders for a new account. */
export function makeClub(accountId: string, handle: string): { club: Club; standingOrders: StandingOrders } {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const color = 0x3b6bd2;
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

export const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'];
