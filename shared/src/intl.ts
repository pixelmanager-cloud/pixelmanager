// ── International competitions — beyond the domestic league ──────────────────────────────────────
// Three strands, all fully deterministic (hash-seeded, no rng / no wall-clock / no storage), so they
// replay identically from a save seed:
//   1. Continental club cup  — a knockout the club qualifies for by a high league finish.
//   2. National-team call-ups — once the bloodline player is capped, seeded national-team fixtures.
//   3. World-Cup-style finals — a periodic national-team tournament, the bloodline's aspirational peak.
// Strengths are on the same 1-20 quality scale the club league uses, so a scoreline here feels of a piece
// with a league result. Nothing in here touches the MatchEngine's calibration.

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const nameSeed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0;
const frac = (h: number, n: number) => (((h >>> (n & 15)) ^ (h >>> ((n + 7) & 15))) % 1000) / 1000; // 0..1

/** A seeded scoreline for a's home tie vs b, weighted by the strength gap. `neutral` drops the home edge
 *  (used for cup finals / tournaments on neutral ground). Bounded 0..6 like the club league. */
export function tieScore(aStr: number, bStr: number, h: number, neutral = false): [number, number] {
  const diff = (aStr - bStr) * 0.12 + (neutral ? 0 : 0.25);
  const gh = Math.min(6, Math.max(0, Math.round(1.2 + diff + (frac(h, 1) - 0.5) * 2.2)));
  const ga = Math.min(6, Math.max(0, Math.round(1.2 - diff + (frac(h, 2) - 0.5) * 2.2)));
  return [gh, ga];
}
/** Resolve a knockout tie to a single winner — a level score goes to seeded "penalties" (0/1 flag). */
function knockout(aStr: number, bStr: number, h: number, neutral = false): { gh: number; ga: number; aWon: boolean; pens: boolean } {
  const [gh, ga] = tieScore(aStr, bStr, h, neutral);
  if (gh !== ga) return { gh, ga, aWon: gh > ga, pens: false };
  const aWon = frac(h, 5) < (0.5 + (aStr - bStr) * 0.03); // shootout leans slightly to the better side
  return { gh, ga, aWon, pens: true };
}

// ── 1. Continental club cup ──────────────────────────────────────────────────────────────────────
// Stronger, more glamorous fictional clubs than the domestic league — the continent's elite.
const CONT_POOL = [
  'Atlético Verdano', 'Real Solaris', 'FC Nordwind', 'Olympique Marenne', 'Internazio Milano',
  'Sporting Listerra', 'Rot-Weiss Halden', 'Dynamo Volgar', 'AC Fiorina', 'Galata Boru',
  'Ajaccio United', 'Benfica do Sul', 'Zenit Nevsky', 'Bayern Hafen', 'Porto Marinho', 'Sevilla Real',
];
export const CONT_ROUNDS = ['Quarter-final', 'Semi-final', 'Final'] as const;
export type ContRound = 0 | 1 | 2;

export interface ContTie { round: number; label: string; oppName: string; oppStrength: number; neutral: boolean }
/** The club's opponent in continental round `r` (0=QF,1=SF,2=Final). Opponents get stronger each round;
 *  the final is on neutral ground. Deterministic per (seed, season, round). */
export function contOpponent(seed: number, season: number, r: ContRound): ContTie {
  const h = hash32(seed, season * 977 + 41, r * 131);
  const name = CONT_POOL[h % CONT_POOL.length];
  const oppStrength = 12 + r * 2 + (hash32(h, nameSeed(name)) % 5); // QF ~12-16, SF ~14-18, Final ~16-20
  return { round: r, label: CONT_ROUNDS[r], oppName: name, oppStrength, neutral: r === 2 };
}

// ── 2. National-team call-ups (player-career side) ────────────────────────────────────────────────
// The player represents a fictional nation; call-up fixtures are friendlies/qualifiers vs other nations.
export const NATIONS = [
  'Astoria', 'Calderia', 'Vinland', 'Montara', 'Sorvania', 'Kesselund',
  'Norhavn', 'Lechia', 'Trentino', 'Valgard', 'Rhodania', 'Cascar', 'Ferralta', 'Ostmark', 'Bruneland', 'Aldoria',
];
/** A deterministic home nation for a bloodline surname — stable across a player's whole arc. */
export function homeNation(surname: string): string { return NATIONS[nameSeed(surname || 'Astoria') % NATIONS.length]; }

export interface CallUp { oppNation: string; venue: 'H' | 'A' | 'N'; kind: 'friendly' | 'qualifier'; forGoals: number; ourGoals: number; scored: number }
/** A seeded national-team fixture for call-up number `capNo` (1-based). His personal contribution (goals)
 *  scales gently with his overall. Presentational — surfaced as a career moment once he's capped. */
export function nationalFixture(seed: number, capNo: number, nation: string, overall: number): CallUp {
  const h = hash32(seed, capNo * 613 + 17, nameSeed(nation));
  const opp = NATIONS.filter((n) => n !== nation)[h % (NATIONS.length - 1)];
  const oppStrength = 9 + (hash32(h, 3) % 9); // 9..17
  const kind: 'friendly' | 'qualifier' = h % 3 === 0 ? 'friendly' : 'qualifier';
  const [ourGoals, forGoals] = tieScore(overall, oppStrength, h, false);
  const scored = frac(h, 9) < Math.min(0.6, (overall - 8) * 0.05) ? 1 + (frac(h, 11) < 0.2 ? 1 : 0) : 0;
  return { oppNation: opp, venue: (['H', 'A', 'N'] as const)[h % 3], kind, forGoals, ourGoals, scored };
}

// ── 3. World-Cup-style national-team tournament ───────────────────────────────────────────────────
// 8 nations, two groups of four → round-robin → top two into semis → final. The player's nation strength
// is his overall (his aspirational peak); the field is seeded from the save + tournament edition.
export interface WCGroupRow { nation: string; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number; mine: boolean }
export interface WCResult {
  edition: number; myNation: string; field: string[];
  groups: { rows: WCGroupRow[] }[];
  semis: { a: string; b: string; gh: number; ga: number; winner: string; pens: boolean }[];
  final: { a: string; b: string; gh: number; ga: number; winner: string; pens: boolean };
  champion: string;
  myFinish: 'Champions' | 'Runners-up' | 'Semi-finals' | 'Group stage' | 'Did not qualify';
  /** legacy multiplier for the bloodline, 1.0 (group) → up to ~2.0 (world champions) */
  legacyMult: number;
}

/** Simulate a full seeded World-Cup-style tournament. `myNation`'s strength is `myStrength` (the star's
 *  overall); every other nation gets a seeded strength. Fully deterministic. */
export function worldCup(seed: number, edition: number, myNation: string, myStrength: number): WCResult {
  const base = hash32(seed, edition * 7919 + 3);
  // pick 7 rival nations, seed the field, and drop `myNation` into a stable slot
  const rivals = NATIONS.filter((n) => n !== myNation)
    .map((n) => ({ n, k: hash32(base, nameSeed(n)) }))
    .sort((a, b) => a.k - b.k).slice(0, 7).map((x) => x.n);
  const field = [myNation, ...rivals];
  const strength: Record<string, number> = { [myNation]: myStrength };
  for (const n of rivals) strength[n] = 8 + (hash32(base, nameSeed(n) * 2654435761 >>> 0) % 12); // 8..19

  // snake the seeded field into two groups of four
  const groupsN: string[][] = [[], []];
  field.forEach((n, i) => groupsN[i % 2].push(n));

  const runGroup = (nations: string[], gi: number): { rows: WCGroupRow[] } => {
    const rows: WCGroupRow[] = nations.map((n) => ({ nation: n, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0, mine: n === myNation }));
    const idx = new Map(rows.map((r, i) => [r.nation, i]));
    for (let i = 0; i < nations.length; i++) for (let j = i + 1; j < nations.length; j++) {
      const [gh, ga] = tieScore(strength[nations[i]], strength[nations[j]], hash32(base, gi * 101 + i * 13 + j), true);
      const ri = rows[idx.get(nations[i])!], rj = rows[idx.get(nations[j])!];
      ri.P++; rj.P++; ri.GF += gh; ri.GA += ga; rj.GF += ga; rj.GA += gh;
      if (gh > ga) { ri.W++; rj.L++; ri.Pts += 3; } else if (gh < ga) { rj.W++; ri.L++; rj.Pts += 3; } else { ri.D++; rj.D++; ri.Pts++; rj.Pts++; }
    }
    for (const r of rows) r.GD = r.GF - r.GA;
    rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.nation.localeCompare(b.nation));
    return { rows };
  };
  const groups = groupsN.map(runGroup);
  const [A, B] = groups.map((g) => g.rows);

  // semis: winners cross with runners-up (A1 v B2, B1 v A2)
  const semiPairs: [string, string][] = [[A[0].nation, B[1].nation], [B[0].nation, A[1].nation]];
  const semis = semiPairs.map(([a, b], i) => {
    const k = knockout(strength[a], strength[b], hash32(base, 5000 + i), true);
    return { a, b, gh: k.gh, ga: k.ga, winner: k.aWon ? a : b, pens: k.pens };
  });
  const fa = semis[0].winner, fb = semis[1].winner;
  const fk = knockout(strength[fa], strength[fb], hash32(base, 9000), true);
  const final = { a: fa, b: fb, gh: fk.gh, ga: fk.ga, winner: fk.aWon ? fa : fb, pens: fk.pens };
  const champion = final.winner;

  const inSemis = semis.some((s) => s.a === myNation || s.b === myNation);
  const inFinal = final.a === myNation || final.b === myNation;
  const myFinish: WCResult['myFinish'] = champion === myNation ? 'Champions'
    : inFinal ? 'Runners-up' : inSemis ? 'Semi-finals'
    : field.includes(myNation) ? 'Group stage' : 'Did not qualify';
  const legacyMult = myFinish === 'Champions' ? 2.0 : myFinish === 'Runners-up' ? 1.6 : myFinish === 'Semi-finals' ? 1.3 : myFinish === 'Group stage' ? 1.1 : 1.0;

  return { edition, myNation, field, groups, semis, final, champion, myFinish, legacyMult };
}
