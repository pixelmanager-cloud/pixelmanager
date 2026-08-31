// The manager's squad orders (formation/tactics/duties/captain/set-piece takers). Was duplicated in
// server/src/store.ts and client/src/api.ts — consolidated here (phase 2 offline migration) so both the
// server Store and the future local GameStore/LocalStore share one definition.
import type { Duty } from './types.js';
import type { Lineup } from './teams.js';
import type { Tactics } from './tactics.js';

export interface StandingOrders {
  formation: Lineup['formation'];
  playerIds: string[];
  tactics: Tactics;
  duties?: Duty[];
  captainIdx?: number;
  takers?: { pen?: number; fk?: number; corner?: number };
}

/** Serialize / parse the manager squad roles (captain + set-piece takers) for the so_roles column. */
export const rolesJson = (so: StandingOrders): string | null =>
  so.captainIdx != null || so.takers ? JSON.stringify({ captainIdx: so.captainIdx, takers: so.takers }) : null;
/** THIS IS ON THE LOAD PATH, so it must never throw and must never return something that is not the shape
 *  it promises. It used to do both: a bare `JSON.parse` threw on `'undefined'`, on whitespace, on a
 *  truncated write like `{"captainIdx":` — which is exactly what an interrupted save looks like — and on
 *  trailing garbage, taking a perfectly recoverable captain down with it. A throw here is the documented
 *  mechanism by which a club becomes permanently unmanageable. It also returned values that violate its
 *  own declared type: `'null'` gave null (so `parseRoles(x).captainIdx` is a TypeError that tsc cannot
 *  see), `'[1,2,3]'` gave an array, `'"hello"'` gave a string — and api.ts:173 already warns that a
 *  non-array payload spread onto a record writes its own characters as keys.
 *
 *  Absent means `{}`. Unreadable also means `{}` — but note nothing here is PERSISTED over the original,
 *  so an unreadable row is only ignored, never destroyed. */
/** SHAPE, NOT RANGE. This guards the things that break a caller — a string, null, an array, an object —
 *  and deliberately preserves any finite number, including a fractional or out-of-range one. Only the
 *  consumer knows how many players are in the squad, so bounding the index is its job; dropping a
 *  designation here because it looks wrong would be silent loss, which is the failure this module is
 *  being hardened against in the first place. */
const isIdx = (v: unknown): v is number => Number.isFinite(v);
export const parseRoles = (s: string | null | undefined): { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } => {
  if (s == null || typeof s !== 'string' || !s.trim()) return {};
  let raw: unknown;
  try { raw = JSON.parse(s); } catch { return {}; }
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as { captainIdx?: unknown; takers?: unknown };
  const out: { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } = {};
  if (isIdx(o.captainIdx)) out.captainIdx = o.captainIdx;
  if (o.takers != null && typeof o.takers === 'object' && !Array.isArray(o.takers)) {
    const t = o.takers as Record<string, unknown>;
    const takers: { pen?: number; fk?: number; corner?: number } = {};
    for (const k of ['pen', 'fk', 'corner'] as const) if (isIdx(t[k])) takers[k] = t[k] as number;
    if (Object.keys(takers).length) out.takers = takers;
  }
  return out;
};
