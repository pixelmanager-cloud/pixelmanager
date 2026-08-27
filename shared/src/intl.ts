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
export function tieScore(aStrIn: number, bStrIn: number, h: number, neutral = false): [number, number] {
  // guard a non-finite strength (bad upstream) from turning goal columns into NaN (QA M2); finite passes through
  const aStr = Number.isFinite(aStrIn) ? aStrIn : 10, bStr = Number.isFinite(bStrIn) ? bStrIn : 10;
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
  'Marenne', 'Duruvia', 'Halden', 'Poranto', 'Zelmark', 'Ivria', 'Caldros', 'Ostrovia',
  'Menteria', 'Bravanto', 'Nystrand', 'Tavora', 'Groland', 'Escalona', 'Volenza', 'Ardennes',
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
// 16 nations, four groups of four → round-robin → top two into an 8-team knockout (QF → SF → Final).
// The player's nation strength is his overall (his aspirational peak); the rest of the field is seeded
// from the save + tournament edition, so the line-up varies staging to staging.
const WC_FIELD_SIZE = 16;
const WC_GROUPS = 4;
export interface WCGroupRow { nation: string; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number; mine: boolean }
export interface WCTie { round: 'QF' | 'SF' | 'F'; a: string; b: string; gh: number; ga: number; winner: string; pens: boolean; mine: boolean }
export interface WCResult {
  edition: number; myNation: string; field: string[];
  strengths: Record<string, number>;
  groups: { rows: WCGroupRow[] }[];
  quarters: WCTie[];
  semis: WCTie[];
  final: WCTie;
  champion: string;
  myFinish: 'Champions' | 'Runners-up' | 'Semi-finals' | 'Quarter-finals' | 'Group stage' | 'Did not qualify';
  /** legacy multiplier for the bloodline, 1.0 (group) → up to ~2.0 (world champions) */
  legacyMult: number;
}

/** Simulate a full seeded World-Finals-style tournament. `myNation`'s strength is `myStrength` (the star's
 *  overall); every other nation gets a seeded strength. Fully deterministic. */
export function worldCup(seed: number, edition: number, myNation: string, myStrength: number): WCResult {
  const base = hash32(seed, edition * 7919 + 3);
  // seed a field of 16: myNation plus the (WC_FIELD_SIZE-1) best-seeded rivals from the nation pool
  const rivals = NATIONS.filter((n) => n !== myNation)
    .map((n) => ({ n, k: hash32(base, nameSeed(n)) }))
    .sort((a, b) => a.k - b.k).slice(0, WC_FIELD_SIZE - 1).map((x) => x.n);
  const field = [myNation, ...rivals];
  const strength: Record<string, number> = { [myNation]: myStrength };
  for (const n of rivals) strength[n] = 8 + (hash32(base, nameSeed(n) * 2654435761 >>> 0) % 12); // 8..19

  // snake the seeded field into four groups of four
  const groupsN: string[][] = Array.from({ length: WC_GROUPS }, () => []);
  field.forEach((n, i) => groupsN[i % WC_GROUPS].push(n));

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
  const win = (g: number) => groups[g].rows[0].nation, run = (g: number) => groups[g].rows[1].nation; // group winner / runner-up

  const tie = (round: WCTie['round'], a: string, b: string, salt: number): WCTie => {
    const k = knockout(strength[a], strength[b], hash32(base, salt), true);
    return { round, a, b, gh: k.gh, ga: k.ga, winner: k.aWon ? a : b, pens: k.pens, mine: a === myNation || b === myNation };
  };
  // QF — standard cross-bracket: A1-B2, C1-D2, B1-A2, D1-C2 (winners kept on opposite sides)
  const quarters: WCTie[] = [
    tie('QF', win(0), run(1), 4001), tie('QF', win(2), run(3), 4002),
    tie('QF', win(1), run(0), 4003), tie('QF', win(3), run(2), 4004),
  ];
  const semis: WCTie[] = [
    tie('SF', quarters[0].winner, quarters[1].winner, 5001),
    tie('SF', quarters[2].winner, quarters[3].winner, 5002),
  ];
  const final = tie('F', semis[0].winner, semis[1].winner, 9000);
  const champion = final.winner;

  const inQF = quarters.some((q) => q.mine);
  const inSF = semis.some((s) => s.mine);
  const inFinal = final.mine;
  const myFinish: WCResult['myFinish'] = champion === myNation ? 'Champions'
    : inFinal ? 'Runners-up' : inSF ? 'Semi-finals' : inQF ? 'Quarter-finals'
    : field.includes(myNation) ? 'Group stage' : 'Did not qualify';
  const legacyMult = myFinish === 'Champions' ? 2.0 : myFinish === 'Runners-up' ? 1.6 : myFinish === 'Semi-finals' ? 1.3 : myFinish === 'Quarter-finals' ? 1.15 : myFinish === 'Group stage' ? 1.05 : 1.0;

  return { edition, myNation, field, strengths: strength, groups, quarters, semis, final, champion, myFinish, legacyMult };
}

// The star's nation's own route through the knockouts, so those ties can be PLAYED (the rest of the bracket
// auto-resolves). Each round's opponent is read from the seeded bracket's *other* side, so it's independent
// of how the player's own ties actually turn out — keeping a played run consistent with the seeded field.
export interface WCPlayerPath {
  qualified: boolean;
  groupIndex: number;
  groupFinish: 'Winner' | 'Runner-up' | null;
  qf?: { opp: string; oppStrength: number };
  sf?: { opp: string; oppStrength: number };
  final?: { opp: string; oppStrength: number };
  seededChampion: string;
}
export function playerPath(wc: WCResult): WCPlayerPath {
  const me = wc.myNation;
  const gi = wc.groups.findIndex((g) => g.rows.some((r) => r.mine));
  const rank = gi >= 0 ? wc.groups[gi].rows.findIndex((r) => r.mine) : -1; // 0 = group winner, 1 = runner-up
  if (rank !== 0 && rank !== 1) return { qualified: false, groupIndex: gi, groupFinish: null, seededChampion: wc.champion };
  const myQF = wc.quarters.findIndex((q) => q.a === me || q.b === me);
  const qfOpp = wc.quarters[myQF].a === me ? wc.quarters[myQF].b : wc.quarters[myQF].a;
  const otherQF = myQF % 2 === 0 ? myQF + 1 : myQF - 1;     // the sibling QF that feeds the same semi
  const sfOpp = wc.quarters[otherQF].winner;                 // seeded winner of that other QF
  const mySF = Math.floor(myQF / 2);                         // semis[0] = QF0/QF1 winners, semis[1] = QF2/QF3
  const finalOpp = wc.semis[mySF === 0 ? 1 : 0].winner;      // seeded winner of the other semi
  return {
    qualified: true, groupIndex: gi, groupFinish: rank === 0 ? 'Winner' : 'Runner-up',
    qf: { opp: qfOpp, oppStrength: wc.strengths[qfOpp] },
    sf: { opp: sfOpp, oppStrength: wc.strengths[sfOpp] },
    final: { opp: finalOpp, oppStrength: wc.strengths[finalOpp] },
    seededChampion: wc.champion,
  };
}
