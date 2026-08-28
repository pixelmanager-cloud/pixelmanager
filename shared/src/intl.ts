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
// Widened from the original 16 (audit finding: a continental run can span many seasons in one save,
// and the QF/SF/Final opponent is redrawn each season, so a small pool repeats faces fast). 30 names.
const CONT_POOL = [
  'Atlético Verdano', 'Real Solaris', 'FC Nordwind', 'Olympique Marenne', 'Internazio Milano',
  'Sporting Listerra', 'Rot-Weiss Halden', 'Dynamo Volgar', 'AC Fiorina', 'Galata Boru',
  'Ajaccio United', 'Benfica do Sul', 'Zenit Nevsky', 'Bayern Hafen', 'Porto Marinho', 'Sevilla Real',
  'Vitesse Aurel', 'Crvena Dunja', 'Slavia Bornholm', 'PSK Ostrand', 'Union Kastel',
  'Girondins Vasco', 'Steaua Marn', 'Legia Torvath', 'Anderlecht Bruun', 'Feyenoord Sael',
  'Panathinos Delta', 'Celtic Boru', 'Rangers Kilmoor', 'Standard Reyval',
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
  // offset by edition so the star's nation (field index 0) doesn't land in Group A every single tournament (PT-70)
  field.forEach((n, i) => groupsN[(i + edition) % WC_GROUPS].push(n));

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
// ── Narrative flavour (additive, presentational-only) ─────────────────────────────────────────────
// Deterministic one-line "how it felt" text for continental ties and World-Finals runs — the
// structural math above (tieScore/knockout/worldCup) only ever returns numbers; these functions turn
// a result into a sentence, the same way gaffersDiary.ts does for the domestic league. Pure + seeded,
// so the same tie/edition always reads the same way. Not yet called from client/src/main.ts (that's
// a client-shell change, out of this lane) — ready for a future hookup.
function pick<T>(h: number, arr: readonly T[]): T { return arr[h % arr.length]; }

const CONT_WIN: string[] = [
  'A statement result on the continental stage — the kind that gets the club noticed abroad.',
  'Away from the bread and butter of the league, and the club delivers when it matters.',
  'Continental nights like that are what a season is remembered for.',
  'The kind of European result that lingers in the memory long after the final whistle.',
  'A big scalp on the continental run, and belief is growing that this could go somewhere.',
];
// won the shootout — through to the next round
const CONT_WIN_PENS: string[] = [
  'Settled on penalties — the cruellest way to go through, but a way through all the same.',
  'Nerves shredded from twelve yards, but the club lives to fight another round.',
  'A shootout decided it. Somebody had to blink first, and it wasn\'t us.',
];
// lost the shootout — out on penalties
const CONT_LOSS_PENS: string[] = [
  'Settled on penalties — the cruellest way to go out, inches from the next round.',
  'Nerves shredded from twelve yards, and this time the shootout went against us.',
  'A shootout decided it. Somebody had to blink first, and this time it was us.',
];
const CONT_LOSS: string[] = [
  'The continental run ends here. A step further than some feared, not as far as others hoped.',
  'Outclassed on the night by a side with a bit more continental pedigree.',
  'A tough exit, but a run worth being proud of all the same.',
  'The dream ends, but nights like these are exactly why the club chases this competition.',
];
const CONT_FINAL_WIN: string[] = [
  'Champions of the continent. Whatever else this season holds, that\'s forever in the record books.',
  'A continental trophy for the cabinet — the biggest night in the club\'s history, some say.',
  'The final delivered, and the whole club will remember exactly where they were for this one.',
];
const CONT_FINAL_LOSS: string[] = [
  'So close to continental glory, and it slips away in the final itself. A bitter one.',
  'Runners-up on the biggest stage the club has ever reached. Progress, even if it doesn\'t feel like it tonight.',
  'A final lost is still a final reached. Small comfort tonight, real credit in time.',
];

/** A deterministic "how it felt" line for a continental-cup tie result. `won` null means a draw that
 *  needs `pens` to resolve (knockout ties are always decided, so this covers the shootout framing). */
export function contTieBlurb(seed: number, season: number, round: ContRound, aWon: boolean, pens: boolean): string {
  const h = hash32(seed, season * 977 + 41, round * 131, 8801);
  const isFinal = round === 2;
  if (aWon) return pick(h, isFinal ? CONT_FINAL_WIN : pens ? CONT_WIN_PENS : CONT_WIN);
  return pick(h, isFinal ? CONT_FINAL_LOSS : pens ? CONT_LOSS_PENS : CONT_LOSS);
}

const CALLUP_DEBUT: string[] = [
  'A first cap at last — pulling on the national shirt for the very first time.',
  'International recognition arrives: a maiden call-up, and a proud day for the whole family.',
  'From club football to the national stage — cap number one is in the books.',
];
const CALLUP_SCORED: string[] = [
  'On the scoresheet on the international stage — a night to remember in a national shirt.',
  'Delivers for the national team when it mattered, and the manager will have noticed.',
  'A goal at international level. The kind of moment that gets talked about back home.',
];
const CALLUP_QUIET: string[] = [
  'Another cap added to the collection — steady, if unspectacular, in national colours.',
  'A quieter night in the national shirt, but every cap still counts toward the legacy.',
  'Did a job for the national side without grabbing the headlines.',
];
/** A deterministic "how it felt" line for a national-team call-up. */
export function callUpBlurb(seed: number, capNo: number, nation: string, scored: number): string {
  const h = hash32(seed, capNo * 613 + 17, nameSeed(nation), 9101);
  if (capNo === 1) return pick(h, CALLUP_DEBUT);
  if (scored > 0) return pick(h, CALLUP_SCORED);
  return pick(h, CALLUP_QUIET);
}

const WC_FINISH_BLURB: Record<WCResult['myFinish'], string[]> = {
  'Champions': [
    'World champions. The pinnacle of the international game, and it belongs to us.',
    'Champions of the world — a moment that will be replayed for the rest of a career.',
  ],
  'Runners-up': [
    'So close to the very top — runners-up at a World Finals is still a career-defining run.',
    'A final reached and lost. Heartbreaking tonight, historic in the years to come.',
  ],
  'Semi-finals': [
    'A semi-final exit at the World Finals — agonisingly close to the very biggest stage.',
    'Fell at the semi-final. A superb tournament all the same.',
  ],
  'Quarter-finals': [
    'A quarter-final finish at the World Finals — a run to be proud of, if it ended a round too soon.',
    'Out at the last eight. The tournament stops here, this time.',
  ],
  'Group stage': [
    'A group-stage exit from the World Finals. Plenty to learn from before the next one comes around.',
    'The tournament ends early. A disappointing showing on the biggest stage of all.',
  ],
  'Did not qualify': [
    'Watching the World Finals from home this time. A painful one to sit out.',
    'No World Finals this time around — the next qualifying campaign starts the moment this one ends.',
  ],
};
/** A deterministic "how it felt" line for a national-team tournament finish. */
export function worldCupFinishBlurb(seed: number, edition: number, myNation: string, finish: WCResult['myFinish']): string {
  const h = hash32(seed, edition * 7919 + 3, nameSeed(myNation), 9500);
  return pick(h, WC_FINISH_BLURB[finish]);
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

// ── Rivalry arcs & tournament-stage drama (batch 2) ────────────────────────────────────────────────
// Batch 1 gave continental ties and World-Finals runs a one-off "how it felt" blurb. This section adds
// DEPTH across a save: a stable continental "old enemy" club that recurs season to season (so meeting
// them again means something, the way a domestic rival does in gaffersDiary.ts), plus knife-edge
// drama blurbs for tight group-stage finishes and shootout nerves. All pure + seeded off (seed, …) —
// no persisted meeting history is needed because the "old enemy" is a stable per-save pick, not a
// counted rivalry (the same simplification tieScore/contOpponent already make for the rest of intl.ts).

/** The club's stable continental "bogey side" for this save — the same club every time a save's seed
 *  is queried, so repeat meetings across seasons read as a real, recurring rivalry rather than just
 *  another random draw. Deliberately excludes index 0 bias by hashing seed against a fixed salt. */
export function contRivalClub(seed: number): string {
  const h = hash32(seed, 0x52a1, 0x76b3);
  return CONT_POOL[h % CONT_POOL.length];
}

const CONT_RIVALRY_WIN: string[] = [
  'Beat them again. This rivalry is starting to tilt firmly in our favour.',
  'Another win over the old enemy — the fixture that never feels routine, whatever the stakes.',
  'That\'s the one the fans wanted more than any other. The rivalry stays lopsided, our way.',
  'Bragging rights again over a club that just cannot get the better of us these days.',
];
const CONT_RIVALRY_LOSS: string[] = [
  'Beaten by the old enemy again. That one will sting in the dressing room for a while yet.',
  'The rivalry stings tonight — they have the bragging rights again, and they will let us know it.',
  'A tough one to lose, and to THEM of all sides. The rematch cannot come soon enough.',
  'They have our number in this fixture lately. Something to fix before the next meeting.',
];
/** A deterministic rivalry-arc line for a tie against the save's continental "old enemy"
 *  (`contRivalClub(seed)`), layered ON TOP of the ordinary contTieBlurb for extra colour when the
 *  opponent happens to be that club. Caller decides whether to use this or the plain blurb. */
export function contRivalryBlurb(seed: number, season: number, round: ContRound, aWon: boolean): string {
  const h = hash32(seed, season * 977 + 41, round * 131, 0xb17a1);
  return pick(h, aWon ? CONT_RIVALRY_WIN : CONT_RIVALRY_LOSS);
}

const WC_GROUP_DECIDER: string[] = [
  'Goal difference is doing the talking in this group — every minute of the last game mattered.',
  'A group settled by the finest of margins. Nerve-shredding stuff for anyone watching from home.',
  'Came down to the very last kick of the group stage. Qualification never felt safe until the whistle.',
  'A group that stayed live until the final whistle of the final round — no dead rubbers here.',
];
const WC_GROUP_COMFORTABLE: string[] = [
  'A comfortable passage out of the group, points to spare before the last round even kicked off.',
  'Job done early in the group — the closing matches were about rhythm, not survival.',
  'Cruised through the group stage. The knockouts is where the real tournament starts.',
];
/** A deterministic "how tight was it" line for a World-Finals group, based on the ACTUAL computed
 *  standings (`WCGroupRow[]` from `worldCup().groups[gi].rows`) — a tiny points/GD gap between 2nd
 *  and 3rd reads as squeaky-bum-time; a big gap reads as comfortable. Pure function of that data. */
export function wcGroupDramaBlurb(seed: number, edition: number, groupIndex: number, rows: readonly WCGroupRow[]): string {
  const h = hash32(seed, edition * 7919 + 3, groupIndex * 331, 0xc201);
  const second = rows[1], third = rows[2];
  const tight = !!second && !!third && (second.Pts - third.Pts <= 1) && (Math.abs(second.GD - third.GD) <= 2);
  return pick(h, tight ? WC_GROUP_DECIDER : WC_GROUP_COMFORTABLE);
}

const WC_KNOCKOUT_PENS: string[] = [
  'Settled on penalties. The cruellest way for a tournament run to turn, one way or the other.',
  'A shootout decided it — twelve yards of pure nerve, and somebody had to lose it.',
  'Penalties. The whole nation held its breath for every single kick.',
];
const WC_KNOCKOUT_TIGHT: string[] = [
  'One goal in it. The margins at this stage of a tournament rarely get any finer.',
  'A single strike separated the sides. Knockout football at its most unforgiving.',
  'Backs to the wall for long spells, but the result held by the barest of margins.',
];
const WC_KNOCKOUT_CLEAR: string[] = [
  'A comfortable, controlled knockout performance — no last-minute nerves required tonight.',
  'Dominant from early on. The kind of knockout win that settles a squad for the round ahead.',
];
/** A deterministic "how it went" drama line for a specific World-Finals knockout tie, using the
 *  ACTUAL score margin + whether it went to penalties (from `WCTie`). Pure function of that data. */
export function wcKnockoutDramaBlurb(seed: number, edition: number, tie: WCTie): string {
  const h = hash32(seed, edition * 7919 + 3, nameSeed(tie.a), nameSeed(tie.b), 0xd309);
  if (tie.pens) return pick(h, WC_KNOCKOUT_PENS);
  const margin = Math.abs(tie.gh - tie.ga);
  return pick(h, margin <= 1 ? WC_KNOCKOUT_TIGHT : WC_KNOCKOUT_CLEAR);
}
