// RIVALRY — deterministically designate a pod rival for a manager: the pod-mate faced the most
// times all-time (ties broken by closest current rating, then by id for full determinism). No
// persisted "rival" state — it's re-derived from already-known match history every time, so it
// can never drift or need migrating when pods reshuffle at season rollover.

import { makeRng } from './rng.js';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pickFrom<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }

export interface RivalCandidate { id: string; rating: number }

/** Pick the rival from current pod-mates: most all-time meetings, then closest rating, then lowest id. */
export function pickRival(meRating: number, candidates: RivalCandidate[], meetings: Record<string, number>): string | null {
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestMeetings = meetings[best.id] ?? 0;
  let bestGap = Math.abs(best.rating - meRating);
  for (const c of candidates.slice(1)) {
    const m = meetings[c.id] ?? 0;
    const gap = Math.abs(c.rating - meRating);
    const better = m > bestMeetings || (m === bestMeetings && (gap < bestGap || (gap === bestGap && c.id < best.id)));
    if (better) { best = c; bestMeetings = m; bestGap = gap; }
  }
  return best.id;
}

export interface H2HResult { home_id: string; away_id: string; home_score: number; away_score: number }

/** Pick "me"'s pod rival straight from raw match history + pod membership — folds the
 *  all-time meeting count and pickRival's tie-breaking into one call so callers (server
 *  routes) don't duplicate the aggregation. */
export function rivalOf(meId: string, meRating: number, podMembers: RivalCandidate[], allResults: H2HResult[]): string | null {
  const others = podMembers.filter((m) => m.id !== meId);
  if (!others.length) return null;
  const memberIds = new Set(others.map((m) => m.id));
  const meetings: Record<string, number> = {};
  for (const r of allResults) {
    let opp: string | null = null;
    if (r.home_id === meId && memberIds.has(r.away_id)) opp = r.away_id;
    else if (r.away_id === meId && memberIds.has(r.home_id)) opp = r.home_id;
    if (opp) meetings[opp] = (meetings[opp] ?? 0) + 1;
  }
  return pickRival(meRating, others, meetings);
}

export interface HeadToHead { played: number; w: number; d: number; l: number; gf: number; ga: number }

/** A club's all-time record against one specific opponent, from that club's own perspective. */
export function headToHead(meId: string, oppId: string, results: H2HResult[]): HeadToHead {
  const h: HeadToHead = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  for (const r of results) {
    let my: number, opp: number;
    if (r.home_id === meId && r.away_id === oppId) { my = r.home_score; opp = r.away_score; }
    else if (r.away_id === meId && r.home_id === oppId) { my = r.away_score; opp = r.home_score; }
    else continue;
    h.played++; h.gf += my; h.ga += opp;
    if (my > opp) h.w++; else if (my < opp) h.l++; else h.d++;
  }
  return h;
}

const DERBY_LINE: ((me: string, opp: string, r: HeadToHead) => string)[] = [
  (me, opp, r) => `🔥 Derby day: ${me} vs ${opp}. The rivalry stood at ${r.w}W ${r.d}D ${r.l}L coming in.`,
  (me, opp, r) => `The closest thing ${me} have to a derby — ${opp}, ${r.played} meeting${r.played === 1 ? '' : 's'} deep, ${r.w}-${r.d}-${r.l} before kick-off.`,
  (_me, opp, r) => `A rivalry renewed against ${opp}: ${r.w} wins, ${r.d} draws, ${r.l} losses in this fixture's history.`,
];
const DERBY_LINE_FIRST: ((me: string, opp: string) => string)[] = [
  (me, opp) => `🔥 A new rivalry taking shape: ${me}'s pod-mate ${opp} is fast becoming their derby.`,
  (me, opp) => `Not much history yet, but ${me} vs ${opp} is shaping up as the derby of this pod.`,
];

/** A seeded derby flourish line, from "me"'s perspective, keyed off the pre-match head-to-head. */
export function derbyLine(seed: string, meName: string, oppName: string, record: HeadToHead): string {
  const rng = makeRng(hashStr(seed) ^ 0x1e4f7a53);
  return record.played > 0 ? pickFrom(rng, DERBY_LINE)(meName, oppName, record) : pickFrom(rng, DERBY_LINE_FIRST)(meName, oppName);
}
