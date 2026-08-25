// Pod Cup — a deterministic single-elimination knockout run alongside the league.
// Pure function of (season number, the pod's members, their squads + standing orders),
// so it's a stable projection that firms up as managers tweak their teams. Draws go to a
// penalty shootout keyed off the setPiece + keeping stats — cup drama, and a real use for
// setPiece. Reuses the SAME deterministic match engine as everything else.
import { MatchEngine, buildXI, autoPickXI, type Club, type Lineup, type Player, type Tactics } from '@fm/shared';
import { validateLineup } from './game.js';
import type { LeaderRow, StandingOrders } from './store.js';

export interface CupTie {
  homeId: string; awayId: string; homeHandle: string; awayHandle: string;
  homeScore: number; awayScore: number; pens: [number, number] | null; winnerId: string;
}
export interface CupRound { name: string; ties: CupTie[]; byes: { id: string; handle: string }[] }
export interface Cup { size: number; rounds: CupRound[]; championId: string | null; championHandle: string }

export type SquadMap = Map<string, { club: Club; standingOrders: StandingOrders }>;

const norm = (v: number) => v / 20;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function seedFrom(...parts: Array<string | number>): number {
  let h = 2166136261;
  const s = parts.join(':');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

/** Standard tournament seeding order for a bracket of `n` (1 vs n, 2 vs n-1, …, snaked). */
function seedOrder(n: number): number[] {
  let order = [1, 2];
  while (order.length < n) {
    const len = order.length * 2 + 1;
    const next: number[] = [];
    for (const p of order) { next.push(p); next.push(len - p); }
    order = next;
  }
  return order;
}

const ROUND_NAMES: Record<number, string> = { 2: 'Final', 4: 'Semi-finals', 8: 'Quarter-finals', 16: 'Round of 16', 32: 'Round of 32', 64: 'Round of 64' };

/** A valid lineup for a club — the saved XI if still valid, else an auto-pick. */
function lineupFor(c: { club: Club; standingOrders: StandingOrders }): Lineup {
  const l: Lineup = { formation: c.standingOrders.formation, playerIds: c.standingOrders.playerIds, duties: c.standingOrders.duties };
  return validateLineup(c.club, l) ? l : autoPickXI(c.club, c.standingOrders.formation);
}

function keeperOf(club: Club, lineup: Lineup): Player {
  const xi = lineup.playerIds.map((id) => club.players.find((p) => p.id === id)).filter(Boolean) as Player[];
  return xi.find((p) => p.role === 'GK') ?? club.players[0];
}
function takersOf(club: Club, lineup: Lineup): Player[] {
  const xi = lineup.playerIds.map((id) => club.players.find((p) => p.id === id)).filter(Boolean) as Player[];
  const out = xi.filter((p) => p.role !== 'GK');
  return out.sort((a, b) => b.attrs.setPiece - a.attrs.setPiece); // best set-piece takers first
}

/** Penalty shootout: 5 each then sudden death. setPiece (taker) vs keeping (goalkeeper). */
function shootout(a: { club: Club }, b: { club: Club }, la: Lineup, lb: Lineup, seed: number): [number, number] {
  const rng = mulberry32(seed);
  const ta = takersOf(a.club, la), tb = takersOf(b.club, lb);
  const gkA = keeperOf(a.club, la), gkB = keeperOf(b.club, lb);
  const scores = (taker: Player, gk: Player) => rng() < clamp(0.72 + norm(taker.attrs.setPiece) * 0.2 - norm(gk.attrs.keeping) * 0.22, 0.4, 0.94);
  let ga = 0, gb = 0;
  for (let i = 0; i < 5; i++) { if (scores(ta[i % ta.length], gkB)) ga++; if (scores(tb[i % tb.length], gkA)) gb++; }
  for (let i = 5; ga === gb && i < 30; i++) { if (scores(ta[i % ta.length], gkB)) ga++; if (scores(tb[i % tb.length], gkA)) gb++; }
  if (ga === gb) ga++; // guarantee a winner (astronomically rare)
  return [ga, gb];
}

function simulateTie(a: LeaderRow, b: LeaderRow, clubs: SquadMap, seasonNumber: number, round: number): CupTie {
  const ca = clubs.get(a.id), cb = clubs.get(b.id);
  const base: Omit<CupTie, 'homeScore' | 'awayScore' | 'pens' | 'winnerId'> = { homeId: a.id, awayId: b.id, homeHandle: a.handle, awayHandle: b.handle };
  if (!ca || !cb) return { ...base, homeScore: 0, awayScore: 0, pens: null, winnerId: (ca ? a.id : b.id) }; // forfeit
  const seed = seedFrom('cup', seasonNumber, round, a.id, b.id) & 0x7fffffff;
  const la = lineupFor(ca), lb = lineupFor(cb);
  const m = new MatchEngine([buildXI(ca.club, la), buildXI(cb.club, lb)], seed, [ca.standingOrders.tactics as Tactics, cb.standingOrders.tactics as Tactics]);
  while (!m.state.finished) m.tick();
  const [hs, as] = m.state.score;
  if (hs !== as) return { ...base, homeScore: hs, awayScore: as, pens: null, winnerId: hs > as ? a.id : b.id };
  const pens = shootout(ca, cb, la, lb, seed ^ 0x51ed270b);
  return { ...base, homeScore: hs, awayScore: as, pens, winnerId: pens[0] > pens[1] ? a.id : b.id };
}

/** Build + play the whole cup deterministically. */
export function computeCup(seasonNumber: number, members: LeaderRow[], clubs: SquadMap): Cup {
  const seeded = [...members].sort((x, y) => y.rating - x.rating || x.id.localeCompare(y.id));
  if (seeded.length < 2) return { size: 0, rounds: [], championId: seeded[0]?.id ?? null, championHandle: seeded[0]?.handle ?? '' };
  const N = Math.min(16, seeded.length);
  let size = 2; while (size < N) size *= 2; // bracket size = next power of two ≥ N (≤16)
  const players = seeded.slice(0, N);
  const slots: (LeaderRow | null)[] = seedOrder(size).map((o) => players[o - 1] ?? null);

  const rounds: CupRound[] = [];
  let current = slots;
  let round = 0;
  while (current.length > 1) {
    const name = ROUND_NAMES[current.length] ?? `Round of ${current.length}`;
    const ties: CupTie[] = [];
    const byes: { id: string; handle: string }[] = [];
    const next: (LeaderRow | null)[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i], b = current[i + 1];
      if (!a && !b) { next.push(null); continue; }
      if (a && !b) { byes.push({ id: a.id, handle: a.handle }); next.push(a); continue; }
      if (!a && b) { byes.push({ id: b.id, handle: b.handle }); next.push(b); continue; }
      const tie = simulateTie(a!, b!, clubs, seasonNumber, round);
      ties.push(tie);
      next.push(tie.winnerId === a!.id ? a! : b!);
    }
    rounds.push({ name, ties, byes });
    current = next;
    round++;
  }
  const champion = current[0];
  return { size, rounds, championId: champion?.id ?? null, championHandle: champion?.handle ?? '' };
}
