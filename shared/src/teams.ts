import type { Player, PlayerAttrs, Role, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';

const FIRST = ['Jan', 'Marco', 'Luis', 'Kofi', 'Sven', 'Timo', 'Ade', 'Ivan', 'Paulo', 'Ryo', 'Emil', 'Noah', 'Idris', 'Beto', 'Cato', 'Dario', 'Enzo', 'Felix'];
const LAST = ['Berg', 'Silva', 'Okafor', 'Larsen', 'Costa', 'Novak', 'Tanaka', 'Mensah', 'Weber', 'Rossi', 'Dubois', 'Kovac', 'Moreau', 'Santos', 'Vidal', 'Haas', 'Ito', 'Zeman'];

// 4-4-2 anchors for a team attacking left -> right
const FORMATION_442: Array<{ role: Role; x: number; y: number }> = [
  { role: 'GK', x: 5, y: 34 },
  { role: 'DF', x: 22, y: 10 },
  { role: 'DF', x: 20, y: 26 },
  { role: 'DF', x: 20, y: 42 },
  { role: 'DF', x: 22, y: 58 },
  { role: 'MF', x: 45, y: 10 },
  { role: 'MF', x: 42, y: 26 },
  { role: 'MF', x: 42, y: 42 },
  { role: 'MF', x: 45, y: 58 },
  { role: 'FW', x: 68, y: 26 },
  { role: 'FW', x: 68, y: 42 },
];

function rollAttrs(rng: () => number, role: Role, quality: number): PlayerAttrs {
  const base = (bias: number) => Math.max(30, Math.min(95, Math.round(quality + bias + (rng() - 0.5) * 24)));
  switch (role) {
    case 'GK': return { pace: base(-15), pass: base(-10), shoot: base(-30), defend: base(-5), keeping: base(10) };
    case 'DF': return { pace: base(-2), pass: base(-5), shoot: base(-20), defend: base(10), keeping: base(-40) };
    case 'MF': return { pace: base(0), pass: base(8), shoot: base(-5), defend: base(0), keeping: base(-40) };
    case 'FW': return { pace: base(5), pass: base(-2), shoot: base(10), defend: base(-15), keeping: base(-40) };
  }
}

/** Generate a squad deterministically from a seed. quality ~ team strength (55-80 typical). */
export function generateTeam(id: string, name: string, shortName: string, shirtColor: number, quality: number, seed: number): Team {
  const rng = makeRng(seed);
  const players: Player[] = FORMATION_442.map((slot, i) => ({
    id: `${id}-${i}`,
    name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
    role: slot.role,
    attrs: rollAttrs(rng, slot.role, quality),
    anchor: { x: slot.x, y: slot.y },
  }));
  return { id, name, shortName, shirtColor, players };
}

/** Mirror an anchor for the team defending the right goal (attacking right -> left). */
export function mirroredAnchor(a: { x: number; y: number }): { x: number; y: number } {
  return { x: PITCH.w - a.x, y: PITCH.h - a.y };
}
