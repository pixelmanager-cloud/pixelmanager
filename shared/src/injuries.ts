// Injuries — an occasional, deterministic setback that makes squad depth matter.
// After a match, each player who featured is rolled for a knock: likelier the more
// gassed they finished (fatigue) and the lower their STAMINA (durability), and rarer
// the better your Medical Centre. Injured players miss the next N matches (auto-picked
// around) and recover a match at a time. Seeded from the match seed + player id, so it
// replays identically and can never be Math.random. Injuries are AVAILABILITY only —
// never a stat edit — so on-chain NFT stats are untouched.
import type { Team } from './types.js';
import { injuryChanceMult, recoveryCut } from './facilities.js';

const BASE_INJURY = 0.03;             // ~one injury every 3-4 matches for a club (occasional)
const norm = (v: number) => v / 20;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

export interface NewInjury { playerId: string; playerName: string; matches: number }

/** Roll fresh injuries for the XI that just played. endFitness[i] is player i's
 *  end-of-match fitness (0..1). Returns the players who got hurt + how many matches out. */
export function rollMatchInjuries(team: Team, endFitness: number[], medicalLevel: number, seed: number): NewInjury[] {
  const out: NewInjury[] = [];
  const medMult = injuryChanceMult(medicalLevel);
  team.players.forEach((p, i) => {
    const rng = mulberry32(seedFrom(`inj:${seed}:${p.id}`));
    const fit = endFitness[i] ?? 1;
    const fatigue = 0.5 + (1 - fit);                       // gassed players are ~1.5x likelier
    // injury resistance: the explicit `durability` (from the Career Sim) when present, else stamina —
    // so an injury-prone career-built player breaks down more, and existing players are unchanged.
    const durability = 1.4 - 0.8 * norm(p.attrs.durability ?? p.attrs.stamina ?? 10);
    const chance = BASE_INJURY * fatigue * durability * medMult;
    if (rng() < chance) {
      const r = rng();                                     // severity, weighted toward short knocks
      let matches = r < 0.5 ? 1 : r < 0.8 ? 2 : r < 0.95 ? 3 : 4;
      matches = Math.max(1, matches - recoveryCut(medicalLevel));
      out.push({ playerId: p.id, playerName: p.name, matches });
    }
  });
  return out;
}
