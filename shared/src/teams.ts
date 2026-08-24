import type { Player, PlayerAttrs, Role, Team } from './types.js';
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
