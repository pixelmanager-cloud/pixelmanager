import type { Duty, Player, PlayerAttrs, Role, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';
import { FORMATIONS, type Formation } from './formations.js';

const FIRST = ['Jan', 'Marco', 'Luis', 'Kofi', 'Sven', 'Timo', 'Ade', 'Ivan', 'Paulo', 'Ryo', 'Emil', 'Noah', 'Idris', 'Beto', 'Cato', 'Dario', 'Enzo', 'Felix'];
const LAST = ['Berg', 'Silva', 'Okafor', 'Larsen', 'Costa', 'Novak', 'Tanaka', 'Mensah', 'Weber', 'Rossi', 'Dubois', 'Kovac', 'Moreau', 'Santos', 'Vidal', 'Haas', 'Ito', 'Zeman'];

/** Roll 8 stats on a 1-20 scale, biased by role, around a team-quality centre. */
function rollAttrs(rng: () => number, role: Role, quality: number): PlayerAttrs {
  // quality is a 1-20 centre; jitter +-3, then per-stat role bias.
  const s = (bias: number) => Math.max(1, Math.min(20, Math.round(quality + bias + (rng() - 0.5) * 6)));
  switch (role) {
    case 'GK': return { pace: s(-4), strength: s(-1), passing: s(-3), shooting: s(-8), tackling: s(-6), positioning: s(2), workrate: s(-2), keeping: s(6) };
    case 'DF': return { pace: s(0), strength: s(2), passing: s(-1), shooting: s(-5), tackling: s(4), positioning: s(3), workrate: s(1), keeping: s(-10) };
    case 'MF': return { pace: s(1), strength: s(0), passing: s(3), shooting: s(0), tackling: s(0), positioning: s(1), workrate: s(3), keeping: s(-10) };
    case 'FW': return { pace: s(3), strength: s(1), passing: s(0), shooting: s(4), tackling: s(-4), positioning: s(2), workrate: s(0), keeping: s(-10) };
  }
}

/**
 * Generate a squad deterministically from a seed, laid out in a formation.
 * quality ~ team strength on the 1-20 stat scale (11-15 typical).
 */
export function generateTeam(
  id: string, name: string, shortName: string, shirtColor: number,
  quality: number, seed: number, formation: Formation = '4-4-2',
): Team {
  const rng = makeRng(seed);
  const slots = FORMATIONS[formation];
  const players: Player[] = slots.map((slot, i) => ({
    id: `${id}-${i}`,
    name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
    role: slot.role,
    attrs: rollAttrs(rng, slot.role, quality),
    anchor: { x: slot.x, y: slot.y },
  }));
  return { id, name, shortName, shirtColor, players };
}

/** Overall rating 1-20: weighted average of the stats that matter for the role. */
export function overall(p: Player): number {
  const a = p.attrs;
  const avg = (...xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  switch (p.role) {
    case 'GK': return Math.round(avg(a.keeping, a.keeping, a.positioning, a.strength));
    case 'DF': return Math.round(avg(a.tackling, a.positioning, a.strength, a.pace, a.passing));
    case 'MF': return Math.round(avg(a.passing, a.workrate, a.tackling, a.positioning, a.pace));
    case 'FW': return Math.round(avg(a.shooting, a.pace, a.strength, a.positioning, a.passing));
  }
}

/** Mirror an anchor for the team defending the right goal (attacking right -> left). */
export function mirroredAnchor(a: { x: number; y: number }): { x: number; y: number } {
  return { x: PITCH.w - a.x, y: PITCH.h - a.y };
}

// ---- clubs, rosters & lineups ----

/** A club owns a full roster (~20 players); a Lineup selects 11 of them into a formation. */
export type Club = Team;

/** Roster shape: 2 GK, 7 DF, 7 MF, 4 FW = 20 players. */
const ROSTER_ROLES: Role[] = [
  'GK', 'GK',
  'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
  'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
  'FW', 'FW', 'FW', 'FW',
];

/** Generate a full club roster (~20 players) deterministically from a seed. */
export function generateClub(id: string, name: string, shortName: string, shirtColor: number, quality: number, seed: number): Club {
  const rng = makeRng(seed);
  const players: Player[] = ROSTER_ROLES.map((role, i) => ({
    id: `${id}-${i}`,
    name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
    role,
    attrs: rollAttrs(rng, role, quality),
    anchor: { x: 0, y: 0 }, // assigned when placed into a lineup
  }));
  return { id, name, shortName, shirtColor, players };
}

/**
 * Generate one trial/loan player deterministically from a seed. `quality` is the
 * 1-20 stat centre for the loanee's rarity band; every stat is hard-capped at
 * `maxStat` (default 15) so a loanee never rivals a top NFT star.
 */
export function generateTrialist(id: string, quality: number, seed: number, maxStat = 15): Player {
  const rng = makeRng(seed);
  const roles: Role[] = ['DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'GK'];
  const role = roles[Math.floor(rng() * roles.length)];
  const name = `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`;
  const attrs = rollAttrs(rng, role, quality);
  (Object.keys(attrs) as Array<keyof PlayerAttrs>).forEach((k) => { attrs[k] = Math.min(maxStat, attrs[k]); });
  return { id, name, role, attrs, anchor: { x: 0, y: 0 } };
}

/** A lineup: 11 roster player-ids ordered to match FORMATIONS[formation] slots (slot 0 = GK). */
export interface Lineup {
  formation: Formation;
  playerIds: string[]; // length 11
  /** optional per-slot manager duties (parallel to playerIds); absent slots auto-derive from stats */
  duties?: Duty[];
}

/** Auto-select the best available XI for a formation, best player per slot by overall rating. */
export function autoPickXI(club: Club, formation: Formation): Lineup {
  const slots = FORMATIONS[formation];
  const pool = [...club.players].sort((a, b) => overall(b) - overall(a));
  const used = new Set<string>();
  const playerIds = slots.map((slot) => {
    const pick = pool.find((p) => !used.has(p.id) && p.role === slot.role) ?? pool.find((p) => !used.has(p.id))!;
    used.add(pick.id);
    return pick.id;
  });
  return { formation, playerIds };
}

/** Build a match-ready Team (11 players placed at formation anchors) from a club + lineup. */
export function buildXI(club: Club, lineup: Lineup): Team {
  const slots = FORMATIONS[lineup.formation];
  const players: Player[] = lineup.playerIds.map((pid, i) => {
    const p = club.players.find((x) => x.id === pid)!;
    // a manager-assigned duty for this slot overrides the player's stat-derived default
    return { ...p, anchor: { x: slots[i].x, y: slots[i].y }, duty: lineup.duties?.[i] ?? p.duty };
  });
  return { id: club.id, name: club.name, shortName: club.shortName, shirtColor: club.shirtColor, players };
}
