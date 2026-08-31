// THE WHOLE TACTICAL LAYER, MEASURED IN ONE PASS.
//
// Every dial a manager can touch — preset, formation, per-role duty, the five sliders, the three
// instructions, and the GK duty — driven directly against MatchEngine over many seeds and printed as
// one set of ranked tables. Nothing here reads the engine's source or reasons about a constant: a
// number in this output is a number from a run.
//
// The point of the file is that it is RERUNNABLE. The engine is being rebuilt; re-running this against
// a new engine and diffing the tables is how you find out which imbalances the rebuild fixed, which it
// left, and which it created. Every table therefore prints n and a standard error, so a difference
// between two runs can be told apart from noise before anyone acts on it.
//
// Usage:
//   tsx tools/playtest/tactics_matrix.ts [scale] [sections]
//     scale     multiplier on every sample count (default 1; 0.05 for a smoke test, 2 for a decider)
//     sections  comma list of presets,formations,duties,sliders,instructions,gk  (default: all)
//   e.g.  tsx tools/playtest/tactics_matrix.ts 1 presets,duties
//
// Sections are independent, so the cheap way to run the whole thing is one process per section in
// parallel. Runtime is ~21ms per match; scale 1 is ~95k matches, about 12 minutes across six processes.
//
// READING THE TABLES
//   PPG      points per game for the LEFT-HAND option, 3/1/0, averaged over every opponent it faced.
//   ±        one standard error on that PPG. Two options differ meaningfully at roughly 2x the larger ±.
//   GD       average goal difference — the SENSITIVE metric. PPG rounds a match to 3/1/0 and throws
//            away magnitude, so a real but small effect shows in GD several hundred matches before it
//            separates in PPG. When GD and PPG disagree about an ordering, GD is the earlier signal
//            and PPG is the one the player experiences; say so rather than picking one.
//   pts/38   the PPG gap expressed as league points across a 38-match season — the unit a player feels.
// A balanced layer is one where no option's PPG sits more than ~2 SE from the middle of its own table,
// and where the underdog columns do not rank the defensive options last.
//
// IT CAN NOW FAIL. Everything above was true of this file before, and it still exited 0 while printing
// `VERDICT: sweeper-keeper is a BIT-FOR-BIT NO-OP`. Section 6 is now a wiring census over every dial on
// the tactics screen, and THE BARS at the foot of the file turn the tables into ratchets: they hold the
// layer to what it measures today and exit 1 if it gets worse. Read the comment block above the bars
// before you touch a constant — several of the numbers they permit are bad ones, recorded on purpose.

import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { TACTIC_PRESETS, DEFAULT_TACTICS, type Tactics } from '../../shared/src/tactics.js';
import { DUTIES_BY_ROLE, defaultDuty } from '../../shared/src/duties.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Duty, Role, Team } from '../../shared/src/types.js';

// ---------------------------------------------------------------- plumbing

const SCALE = Number(process.argv[2] ?? 1) || 1;
const WANT = (process.argv[3] ?? 'all').split(',').map((s) => s.trim());
const want = (s: string) => WANT.includes('all') || WANT.includes(s);
const n = (base: number) => Math.max(4, Math.round(base * SCALE));

/** Three quality pairings. The underdog column is the one that matters: a defensive option that loses
 *  when you are outmatched is worse than useless, because being outmatched is when you reach for it. */
const TIERS: Array<[label: string, qa: number, qb: number]> = [
  ['11v15 underdog', 11, 15],
  ['13v13 even', 13, 13],
  ['15v11 favourite', 15, 11],
];

const mk = (id: string, q: number, seed: number, formation: Formation = '4-4-2'): Team =>
  generateTeam(id, id, id.toUpperCase(), 0xff0000, q, seed, formation);

function play(a: Team, b: Team, ta: Tactics, tb: Tactics, seed: number) {
  const m = new MatchEngine([a, b], seed, [ta, tb]);
  while (!m.state.finished) m.tick();
  return m.state;
}

/** Accumulates points-per-game AND goal difference, each with a standard error, so a table can say
 *  which gaps are real instead of leaving the reader to guess. */
class Acc {
  n = 0; p = 0; p2 = 0; gd = 0; gd2 = 0; gf = 0; ga = 0; w = 0; d = 0; l = 0;
  add(state: any, idx: 0 | 1) {
    const me = state.score[idx], them = state.score[1 - idx];
    const pt = me > them ? 3 : me === them ? 1 : 0;
    if (pt === 3) this.w++; else if (pt === 1) this.d++; else this.l++;
    this.n++; this.p += pt; this.p2 += pt * pt;
    this.gd += me - them; this.gd2 += (me - them) * (me - them);
    this.gf += me; this.ga += them;
  }
  get ppg() { return this.n ? this.p / this.n : 0; }
  get gdAvg() { return this.n ? this.gd / this.n : 0; }
  private static err(sum: number, sumSq: number, n: number) {
    if (n < 2) return 0;
    const mean = sum / n;
    return Math.sqrt(Math.max(0, sumSq / n - mean * mean) / n);
  }
  get se() { return Acc.err(this.p, this.p2, this.n); }
  get gdSe() { return Acc.err(this.gd, this.gd2, this.n); }
}

let matchCount = 0;
const started = Date.now();

// ---------------------------------------------------------------- the bars (see THE BARS at the foot)

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** Every table this run printed, kept so the bars at the foot judge the SAME numbers the reader just
 *  read rather than a second, re-derived measurement. `division_balance.ts` learned this the hard way:
 *  a gate that re-computes its own version of the printed figure can pass while the printed figure is a
 *  catastrophe, and then nobody can tell which of the two numbers the verdict line refers to. */
interface Measured { title: string; rows: Array<[string, Acc]>; spread: number; maxSe: number; goals: number; n: number }
const MEASURED: Measured[] = [];

/** Ranked table with the spread converted into league points over a 38-match season. */
function table(title: string, rows: Array<[string, Acc]>, note = '') {
  console.log(`\n${title}${note ? `  — ${note}` : ''}`);
  const sorted = [...rows].sort((x, y) => y[1].ppg - x[1].ppg);
  const best = sorted[0][1].ppg, worst = sorted[sorted.length - 1][1].ppg;
  const w = Math.max(...rows.map((r) => r[0].length), 6);
  console.log(`  ${'option'.padEnd(w)}   PPG    ±SE       GD    ±SE      W-D-L          GF    GA   pts/38  n`);
  for (const [name, a] of sorted) {
    console.log(
      `  ${name.padEnd(w)}  ${a.ppg.toFixed(3)} ±${a.se.toFixed(3)}  ` +
      `${(a.gdAvg >= 0 ? '+' : '') + a.gdAvg.toFixed(3)} ±${a.gdSe.toFixed(3)}  ` +
      `${String(a.w).padStart(5)}-${String(a.d).padStart(4)}-${String(a.l).padStart(5)}  ` +
      `${(a.gf / a.n).toFixed(2)}  ${(a.ga / a.n).toFixed(2)}  ${((a.ppg - worst) * 38).toFixed(1).padStart(6)}  ${a.n}`,
    );
  }
  const maxSe = Math.max(...rows.map((r) => r[1].se));
  console.log(`  SPREAD ${(best - worst).toFixed(3)} PPG = ${((best - worst) * 38).toFixed(1)} league points a season` +
    `   (largest ±SE in table ${maxSe.toFixed(3)})`);
  const n = rows.reduce((a, r) => a + r[1].n, 0);
  MEASURED.push({ title, rows: sorted, spread: best - worst, maxSe, n, goals: n ? rows.reduce((a, r) => a + r[1].gf + r[1].ga, 0) / n : 0 });
}

function section(name: string, matches: number) {
  console.log(`\n${'='.repeat(96)}\n${name}   (${matches} matches)\n${'='.repeat(96)}`);
}

// ---------------------------------------------------------------- 1. presets

if (want('presets')) {
  const names = Object.keys(TACTIC_PRESETS);
  const N = n(200);
  section('1. PRESETS — full matrix, every preset against every preset at three quality gaps', names.length * names.length * N * TIERS.length);

  for (const [tier, qa, qb] of TIERS) {
    const all: Record<string, Acc> = {}, mirrorless: Record<string, Acc> = {}, vsBal: Record<string, Acc> = {};
    const matrix: Record<string, Record<string, Acc>> = {};
    for (const p of names) { all[p] = new Acc(); mirrorless[p] = new Acc(); vsBal[p] = new Acc(); matrix[p] = {}; for (const q of names) matrix[p][q] = new Acc(); }

    for (const a of names) for (const b of names) {
      const fa = TACTIC_PRESETS[a].formation, fb = TACTIC_PRESETS[b].formation;
      for (let i = 0; i < N; i++) {
        const s = play(mk('a', qa, i * 7 + 1, fa), mk('b', qb, i * 11 + 3, fb), TACTIC_PRESETS[a], TACTIC_PRESETS[b], i * 31 + 5);
        matchCount++;
        all[a].add(s, 0); matrix[a][b].add(s, 0);
        if (a !== b) mirrorless[a].add(s, 0);
        if (b === 'Balanced') vsBal[a].add(s, 0);
      }
    }
    table(`1.${TIERS.findIndex((t) => t[0] === tier) + 1} presets @ ${tier}`, names.map((p) => [p, mirrorless[p]] as [string, Acc]),
      'PPG against the other five presets (mirror excluded)');
    console.log(`  vs Balanced only: ` + names.map((p) => `${p} ${vsBal[p].ppg.toFixed(3)}`).join('  '));
    console.log(`  matrix (row PPG vs column):`);
    const w = Math.max(...names.map((s) => s.length));
    console.log(`    ${''.padEnd(w)}  ` + names.map((s) => s.slice(0, 9).padStart(9)).join(' '));
    for (const a of names) console.log(`    ${a.padEnd(w)}  ` + names.map((b) => matrix[a][b].ppg.toFixed(3).padStart(9)).join(' '));
  }
}

// ---------------------------------------------------------------- 2. formations

if (want('formations')) {
  const fs = Object.keys(FORMATIONS) as Formation[];
  const N = n(60);
  section('2. FORMATIONS — round-robin, identical default sliders on both sides', fs.length * (fs.length - 1) * N * 2);

  for (const [tier, qa, qb] of [TIERS[0], TIERS[1]]) {
    const acc: Record<string, Acc> = {};
    for (const f of fs) acc[f] = new Acc();
    for (const a of fs) for (const b of fs) {
      if (a === b) continue;
      for (let i = 0; i < N; i++) {
        const s = play(mk('a', qa, i * 7 + 1, a), mk('b', qb, i * 11 + 3, b),
          { ...DEFAULT_TACTICS, formation: a }, { ...DEFAULT_TACTICS, formation: b }, i * 31 + 5);
        matchCount++; acc[a].add(s, 0);
      }
    }
    table(`2. formations @ ${tier}`, fs.map((f) => [f + (f === DEFAULT_TACTICS.formation ? ' (DEFAULT)' : ''), acc[f]] as [string, Acc]),
      'sliders held neutral, so this is the shape alone');
  }
}

// ---------------------------------------------------------------- 3. duties

/** Force every player in a role onto one duty. `undefined` restores defaultDuty()'s pick. */
const withDuty = (t: Team, role: Role, duty: Duty | undefined): Team =>
  ({ ...t, players: t.players.map((p) => (p.role === role ? { ...p, duty } : p)) });

if (want('duties')) {
  const roles: Role[] = ['GK', 'DF', 'MF', 'FW'];
  // Ranking six duties inside one role needs far more games than ranking six presets, because the
  // effect is one role's worth of behaviour rather than a whole shape plus five sliders.
  const N13 = n(900), N11 = n(400);
  const cells = roles.reduce((a, r) => a + DUTIES_BY_ROLE[r].length + 1, 0);
  section('3. DUTIES — one duty forced across a whole role, vs an auto-duty opponent', cells * (N13 + N11) + n(700) * 4);

  for (const [tier, qa, qb] of [TIERS[1], TIERS[0]]) {
    const N = tier === TIERS[1][0] ? N13 : N11;
    for (const role of roles) {
      const opts: Array<Duty | undefined> = [...DUTIES_BY_ROLE[role], undefined];
      const rows: Array<[string, Acc]> = [];
      for (const d of opts) {
        const a = new Acc();
        for (let i = 0; i < N; i++) {
          const base = mk('a', qa, i * 7 + 1);
          const s = play(withDuty(base, role, d), mk('b', qb, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
          matchCount++; a.add(s, 0);
        }
        rows.push([d ?? '<< defaultDuty() >>', a]);
      }
      table(`3. ${role} duties @ ${tier}`, rows, 'whole role forced onto one duty; opponent left on auto');
    }
  }

  // What hand-setting the duties is actually worth: the best pick in every role at once, against the
  // squad the game hands you. This is the number that says whether the duty screen is a trap.
  console.log('\n3.x DEFAULT vs HAND-SET — how many points a season the duty screen is worth');
  const M = n(700);
  const combos: Array<[string, Partial<Record<Role, Duty | undefined>>]> = [
    ['auto (defaultDuty)', {}],
    ['hand-set: BPD / playmaker / pressing-fwd', { DF: 'ball-playing-defender', MF: 'playmaker', FW: 'pressing-forward' }],
    ['hand-set: stopper / box-to-box / poacher', { DF: 'stopper', MF: 'box-to-box', FW: 'poacher' }],
    ['worst-case: cover / anchor / target-man', { DF: 'cover', MF: 'anchor', FW: 'target-man' }],
  ];
  const rows: Array<[string, Acc]> = [];
  for (const [label, map] of combos) {
    const a = new Acc();
    for (let i = 0; i < M; i++) {
      let t = mk('a', 13, i * 7 + 1);
      for (const [r, d] of Object.entries(map)) t = withDuty(t, r as Role, d as Duty);
      const s = play(t, mk('b', 13, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
      matchCount++; a.add(s, 0);
    }
    rows.push([label, a]);
  }
  table('3.x whole-squad duty policies @ 13v13', rows, 'opponent always on auto');

  // What defaultDuty() actually picks, so a bad ranking can be traced to the rule that produced it.
  const hist: Record<string, number> = {};
  for (let i = 0; i < 400; i++) for (const p of mk('h', 13, i * 13 + 7).players) {
    const d = defaultDuty(p); hist[`${p.role}:${d}`] = (hist[`${p.role}:${d}`] ?? 0) + 1;
  }
  console.log('\n3.y what defaultDuty() actually assigns over 400 generated squads:');
  for (const k of Object.keys(hist).sort()) console.log(`    ${k.padEnd(28)} ${hist[k]}`);
}

// ---------------------------------------------------------------- 4. sliders

if (want('sliders')) {
  const keys = ['mentality', 'line', 'press', 'tempo', 'width'] as const;
  // "This slider is noise" and "this slider is non-monotone" are claims about gaps of ~0.05 PPG, so
  // they need ~1000 games a notch before they mean anything.
  const N13 = n(1100), N11 = n(450);
  section('4. SLIDERS — one slider swept -2..+2, everything else neutral, opponent fully neutral', keys.length * 5 * (N13 + N11));

  for (const [tier, qa, qb] of [TIERS[1], TIERS[0]]) {
    const N = tier === TIERS[1][0] ? N13 : N11;
    for (const k of keys) {
      const rows: Array<[string, Acc]> = [];
      for (let v = -2; v <= 2; v++) {
        const a = new Acc();
        for (let i = 0; i < N; i++) {
          const s = play(mk('a', qa, i * 7 + 1), mk('b', qb, i * 11 + 3), { ...DEFAULT_TACTICS, [k]: v }, DEFAULT_TACTICS, i * 31 + 5);
          matchCount++; a.add(s, 0);
        }
        rows.push([`${k} = ${v > 0 ? '+' : ''}${v}${v === 0 ? '  (DEFAULT)' : ''}`, a]);
      }
      // Print in slider order too, so non-monotonicity is visible rather than sorted away. A slider
      // that is a real dial reads left-to-right as a trend; a switch reads as a step; noise reads as
      // a zigzag inside the error bars.
      console.log(`\n4. ${k} @ ${tier} -2..+2 in slider order`);
      console.log(`     PPG: ` + rows.map(([, a]) => a.ppg.toFixed(3)).join(' -> ') + `   (±${rows[0][1].se.toFixed(3)} each)`);
      console.log(`     GD : ` + rows.map(([, a]) => (a.gdAvg >= 0 ? '+' : '') + a.gdAvg.toFixed(3)).join(' -> ') + `   (±${rows[0][1].gdSe.toFixed(3)} each)`);
      table(`4. ${k} @ ${tier}`, rows, 'ranked');
    }
  }
}

// ---------------------------------------------------------------- 5. instructions

if (want('instructions')) {
  const N = n(800);
  const variants: Array<[string, Partial<Tactics>]> = [
    ['none (default)', {}],
    ['offsideTrap (line +2)', { offsideTrap: true, line: 2 }],
    ['line +2 alone', { line: 2 }],
    ['playOutOfDefence', { playOutOfDefence: true }],
    ['attackFocus wide', { attackFocus: 'wide' }],
    ['attackFocus central', { attackFocus: 'central' }],
  ];
  section('5. INSTRUCTIONS — the three checkbox dials', variants.length * N);
  const rows: Array<[string, Acc]> = [];
  for (const [label, patch] of variants) {
    const a = new Acc();
    for (let i = 0; i < N; i++) {
      const s = play(mk('a', 13, i * 7 + 1), mk('b', 13, i * 11 + 3), { ...DEFAULT_TACTICS, ...patch }, DEFAULT_TACTICS, i * 31 + 5);
      matchCount++; a.add(s, 0);
    }
    rows.push([label, a]);
  }
  table('5. instructions @ 13v13', rows, 'against a fully neutral opponent');
}

// ---------------------------------------------------------------- 6. wiring census

/** A bit-for-bit fingerprint of a finished match: the score, how many events it produced, and where all
 *  22 players ended up. Two runs on the same seed that agree on this agree on everything a player could
 *  ever see. Comparing SCORES alone is not enough in either direction — a change that moves ten players
 *  a metre and flips no result is still wired, and a change that moves nobody is a dead control on the
 *  tactics screen no matter what the PPG table says, because a PPG table with n behind it can print a
 *  gap that is pure sampling noise. This is the one measurement in the file with no error bar on it. */
const fingerprint = (s: any): string =>
  `${s.score[0]}-${s.score[1]}|${s.events.length}|` +
  s.players.map((side: any[]) => side.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(';')).join('|');

type Side = { tac: Tactics; formation?: Formation; duty?: [Role, Duty | undefined] };
const build = (seed: number, s: Side): Team => {
  const t = mk('a', 13, seed, s.formation ?? DEFAULT_TACTICS.formation);
  return s.duty ? withDuty(t, s.duty[0], s.duty[1]) : t;
};

const NEUTRAL = DEFAULT_TACTICS;
/** The setup the sweeper-keeper duty is written for — its doc comment says line >= 1. */
const HIGH: Tactics = { ...DEFAULT_TACTICS, line: 2, mentality: 1 };

/** EVERY dial a manager can touch, each as a paired A/B on identical seeds against an identical
 *  opponent. One representative setting per dial: this asks "is this control connected to anything?",
 *  not "is it good", which is what the PPG tables above are for. */
const CENSUS: Array<{ label: string; from: Side; to: Side }> = [
  { label: 'preset Balanced -> Park the Bus', from: { tac: TACTIC_PRESETS['Balanced'] }, to: { tac: TACTIC_PRESETS['Park the Bus'] } },
  { label: 'preset Balanced -> Gegenpress', from: { tac: TACTIC_PRESETS['Balanced'] }, to: { tac: TACTIC_PRESETS['Gegenpress'], formation: TACTIC_PRESETS['Gegenpress'].formation } },
  { label: 'formation 4-4-2 -> 3-5-2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, formation: '3-5-2' }, formation: '3-5-2' } },
  { label: 'formation 4-4-2 -> 4-1-4-1', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, formation: '4-1-4-1' }, formation: '4-1-4-1' } },
  { label: 'slider mentality 0 -> +2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, mentality: 2 } } },
  { label: 'slider mentality 0 -> -2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, mentality: -2 } } },
  { label: 'slider line 0 -> +2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, line: 2 } } },
  { label: 'slider line 0 -> -2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, line: -2 } } },
  { label: 'slider press 0 -> +2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, press: 2 } } },
  { label: 'slider press 0 -> -2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, press: -2 } } },
  { label: 'slider tempo 0 -> +2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, tempo: 2 } } },
  { label: 'slider tempo 0 -> -2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, tempo: -2 } } },
  { label: 'slider width 0 -> +2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, width: 2 } } },
  { label: 'slider width 0 -> -2', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, width: -2 } } },
  // offsideTrap is tested ON TOP OF the high line it needs, because that is the only place it claims to
  // do anything. Section 19 of docs/decisions-for-ck.md records it as "exactly inert" on the rebuild
  // branch that was reverted; on the shipped engine it must be measured, not assumed either way.
  { label: 'instruction offsideTrap (on line +2)', from: { tac: HIGH }, to: { tac: { ...HIGH, offsideTrap: true } } },
  { label: 'instruction playOutOfDefence', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, playOutOfDefence: true } } },
  { label: 'instruction attackFocus wide', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, attackFocus: 'wide' } } },
  { label: 'instruction attackFocus central', from: { tac: NEUTRAL }, to: { tac: { ...NEUTRAL, attackFocus: 'central' } } },
  // BOTH SIDES NAMED, never `undefined`. The first draft of this census compared auto-duty against a
  // forced duty and reported `duty FW auto -> poacher  1 / 8 pairs differ`, one pair off being called a
  // dead control. It is not: 3.y shows defaultDuty() already picks poacher for 716 of 800 generated
  // forwards, so the comparison was mostly a squad against itself. A wiring test whose baseline is
  // sometimes the thing under test measures the generator, not the dial.
  { label: 'duty DF cover -> stopper', from: { tac: NEUTRAL, duty: ['DF', 'cover'] }, to: { tac: NEUTRAL, duty: ['DF', 'stopper'] } },
  { label: 'duty DF cover -> sweeper', from: { tac: NEUTRAL, duty: ['DF', 'cover'] }, to: { tac: NEUTRAL, duty: ['DF', 'sweeper'] } },
  { label: 'duty MF box-to-box -> anchor', from: { tac: NEUTRAL, duty: ['MF', 'box-to-box'] }, to: { tac: NEUTRAL, duty: ['MF', 'anchor'] } },
  { label: 'duty MF box-to-box -> playmaker', from: { tac: NEUTRAL, duty: ['MF', 'box-to-box'] }, to: { tac: NEUTRAL, duty: ['MF', 'playmaker'] } },
  { label: 'duty FW poacher -> target-man', from: { tac: NEUTRAL, duty: ['FW', 'poacher'] }, to: { tac: NEUTRAL, duty: ['FW', 'target-man'] } },
  { label: 'duty FW poacher -> pressing-forward', from: { tac: NEUTRAL, duty: ['FW', 'poacher'] }, to: { tac: NEUTRAL, duty: ['FW', 'pressing-forward'] } },
];

const census: Array<{ label: string; diff: number; pairs: number }> = [];
// kept only so the reporting block below has something to skip; the GK duty it measured is retired.
let gkPaired: { n: number; score: number; events: number; pos: number; maxDx: number } | null = null;

if (want('gk')) {
  // Bit-for-bit divergence is a yes/no fact about a seed, not an average with an error bar, so this needs
  // a couple of dozen pairs rather than the hundreds the PPG tables need. Capped so the census stays a
  // rounding error on the run time even at scale 1.
  const P = Math.max(6, Math.min(24, n(400)));
  section('6. WIRING CENSUS — which tactical dials are bit-for-bit no-ops? paired on identical seeds', CENSUS.length * P * 2);

  for (const c of CENSUS) {
    let diff = 0;
    for (let i = 0; i < P; i++) {
      const opp = mk('b', 13, i * 11 + 3), seed = i * 31 + 5;
      const A = play(build(i * 7 + 1, c.from), opp, c.from.tac, DEFAULT_TACTICS, seed);
      const B = play(build(i * 7 + 1, c.to), opp, c.to.tac, DEFAULT_TACTICS, seed);
      matchCount += 2;
      if (fingerprint(A) !== fingerprint(B)) diff++;
    }
    census.push({ label: c.label, diff, pairs: P });
  }
  const w = Math.max(...CENSUS.map((c) => c.label.length));
  console.log(`\n  ${P} paired matches per dial; a dial is INERT when not one pair diverges by so much as a metre\n`);
  for (const r of [...census].sort((x, y) => x.diff - y.diff)) {
    console.log(`  ${r.label.padEnd(w)}  ${String(r.diff).padStart(3)} / ${r.pairs} pairs differ  ` +
      `${r.diff === 0 ? '<<<< INERT — this control does nothing' : ''}`);
  }

  // SECTION 6.x REMOVED. It played `keeper` against `sweeper-keeper` and printed
  //   VERDICT: sweeper-keeper is a BIT-FOR-BIT NO-OP
  // on every green build for days. That verdict was correct, it was acted on, and the duty has been
  // retired — so there is no longer a second GK duty to compare against. The census above is what
  // watches this ground now: it would fail if a dial that still EXISTS went inert.
}

console.log(`\n${'-'.repeat(96)}\n${matchCount} matches in ${((Date.now() - started) / 1000).toFixed(0)}s (scale ${SCALE})`);

// ================================================================================================
// THE BARS — why this file now exits non-zero
// ================================================================================================
//
// This file used to print `VERDICT: sweeper-keeper is a BIT-FOR-BIT NO-OP` and exit 0. It had found a
// dead control on the tactics screen, said so in plain English, and then told the runner everything was
// fine. A gate that reports a catastrophe and exits 0 is worse than a gate with a hole, because the hole
// at least does not claim to have looked.
//
// WHAT THESE BARS ARE AND ARE NOT. They are RATCHETS, calibrated against what this engine measures
// TODAY. Several of the numbers they bless are bad — see the constants, each of which names its own
// figure. Passing them does not mean the tactical layer is balanced or that every dial works. It means
// the layer has not got WORSE than the state recorded in docs/decisions-for-ck.md sections 19 (the
// reverted match-engine rebuild), 35 (the defensive presets are traps) and 11/15 (the duties are
// defensively indistinguishable). Tighten them when the engine work in section 1 is done; do not widen
// them to make a red run green.
//
// SCALE. This file is a research run excluded from `npm run playtest` for cost (47.7 min at scale 1),
// and it takes `scale` as argv[2]. Every bar below therefore has to hold at 0.05 and at 1 alike, and a
// PPG spread does not: with four matches behind an option the printed spread is mostly sampling noise
// and shrinks as n grows. So the spread bars (a) are skipped entirely on any table whose largest ±SE is
// above SE_GATE, because such a table cannot support a claim about balance in either direction, and
// (b) judge the spread with the expected noise range subtracted. Both are stated in the output.

const SE_GATE = 0.15;          // PPG. Above this a table is a smoke test, not evidence.
const RANGE_SIGMA = 2.5;       // E[range] of k~6 equal options each measured with error s is about 2.5s.
const netSpread = (m: Measured) => Math.max(0, m.spread - RANGE_SIGMA * m.maxSe);

/** PER-TABLE CEILINGS on the noise-corrected PPG spread — "no single dial may be worth more than this
 *  many points a season". Every entry is a CEILING THAT MUST NOT RISE, not a target, and four of them
 *  are frankly bad numbers that are recorded here because they are what the shipped engine does today.
 *
 *  HOW THEY WERE SET. From a SCALE-1 run of this exact file — the default, ~112k matches, taken in two
 *  halves and logged — as `max(0.15, 1.05 x the table's printed SPREAD)`, cross-checked against a full
 *  scale-0.25 run. Note what is on each side of that: the bar is on the spread with the expected noise
 *  range SUBTRACTED, while the ceiling is 5% over the spread as PRINTED. That gap is deliberate. The
 *  corrected figure RISES toward the printed one as the scale goes up (the correction shrinks with n),
 *  so a ceiling set on the corrected figure at one scale goes red at a larger one; setting it just over
 *  the printed spread makes the bar hold at every scale, at the cost of only tripping once a table's
 *  printed spread grows by roughly a fifth. The 0.15 floor (5.7 pts/38) keeps the ceiling off zero for
 *  the tables that currently measure a flat nothing, so that WIRING UP A DEAD DIAL — the GK duty, most
 *  of all — cannot turn the gate red.
 *
 *  THE FOUR BAD ONES, named rather than buried. At scale 1 the choice of preset is worth 28.1 league
 *  points a season at 13-v-13 and 22.2 as the favourite; the choice of FORMATION, with every slider held
 *  neutral, is worth 26.2. A tactical layer in which the shape you pick before kick-off is worth two
 *  thirds of a title race is not balanced, and this file's own header says so: "no option's PPG sits
 *  more than ~2 SE from the middle of its own table". These four sit twenty and thirty SE out. They are
 *  a KNOWN OPEN ITEM — docs/decisions-for-ck.md section 19 (the match-engine rebuild was reverted, and
 *  with it the chance creation that would have changed which shapes work) and section 35 (the engine
 *  gives a low press and a deep line no defensive value at all, which is what ranks the shapes). The
 *  bars below say ONLY that they must not get worse. They are not an endorsement of any of it. */
const CEILING: Record<string, number> = {
  '1.1 presets @ 11v15 underdog': 0.29,
  '1.2 presets @ 13v13 even': 0.89,             // 28.1 pts/38 today. KNOWN BAD — see above.
  '1.3 presets @ 15v11 favourite': 0.72,        // 22.2 pts/38 today. KNOWN BAD — see above.
  '2. formations @ 11v15 underdog': 0.38,
  '2. formations @ 13v13 even': 0.88,           // 26.2 pts/38 today. KNOWN BAD — see above.
  '3. GK duties @ 13v13 even': 0.15,            // one duty now; the table is a single row and cannot spread.
  '3. DF duties @ 13v13 even': 0.15,
  '3. MF duties @ 13v13 even': 0.20,
  '3. FW duties @ 13v13 even': 0.22,
  '3. GK duties @ 11v15 underdog': 0.15,        // 0.000 today, same reason.
  '3. DF duties @ 11v15 underdog': 0.15,
  '3. MF duties @ 11v15 underdog': 0.15,
  '3. FW duties @ 11v15 underdog': 0.15,
  '3.x whole-squad duty policies @ 13v13': 0.15,
  '4. mentality @ 13v13 even': 0.37,
  '4. line @ 13v13 even': 0.46,                 // 12.7 pts/38 today; section 35 says line 0 is optimal at every gap
  '4. press @ 13v13 even': 0.46,                // 12.8 pts/38 today; section 35 says press < 0 is a pure penalty
  '4. tempo @ 13v13 even': 0.30,
  '4. width @ 13v13 even': 0.15,                // raw 0.084 — the width slider barely does anything, see section 1
  '4. mentality @ 11v15 underdog': 0.15,
  '4. line @ 11v15 underdog': 0.26,
  '4. press @ 11v15 underdog': 0.32,
  '4. tempo @ 11v15 underdog': 0.15,
  '4. width @ 11v15 underdog': 0.15,
  '5. instructions @ 13v13': 0.36,
};
/** A table with no line above has never been calibrated, so it is judged against the loosest ceiling
 *  any table has — never a free pass, and the output says which tables landed here. Derived, not typed,
 *  so adding a row above cannot silently widen it. */
const DEFAULT_CEILING = Math.max(...Object.values(CEILING));

/** Fraction of paired matches a WIRED dial must still diverge in. A dial that changes the match in two
 *  seeds out of twenty-four is most of the way to being another sweeper-keeper. */
const WIRED_FLOOR = 0.50;

/** How many dials the census must still cover. Pinned so that deleting a row from CENSUS cannot be used
 *  to make a red run green — the only honest ways out are to fix the dial or to move it to KNOWN_INERT
 *  in a commit somebody has to justify. */
// 24, not 26: the two GK-duty rows were REMOVED, not hidden — the sweeper-keeper duty itself was
// retired (it was byte-for-byte inert and wiring it would have been a free win). Lowering this to
// silence a dead dial would be the dishonest move; deleting the dial and the rows together is not.
const CENSUS_MIN_DIALS = 24;

/** Dials that are ALREADY no-ops on this engine. This list is a confession, not a specification.
 *
 *  THE GK DUTY DOES NOTHING. Not "does little" — keeper and sweeper-keeper produce byte-identical
 *  matches on every seed tried, at a neutral line and at the high line the duty's own doc comment says
 *  it needs, and section 3's GK duty table prints SPREAD 0.000 PPG as a result. The player is offered a
 *  choice on the tactics screen that the engine never reads. This is a KNOWN OPEN ITEM
 *  (docs/decisions-for-ck.md section 19 — the match-engine rebuild that would have given the keeper
 *  something to do was reverted, and section 1 — the shot-geometry branch it lives on is unmerged).
 *  Grandfathering it here is what lets the rest of this file gate at all. It is not an endorsement, and
 *  if it is ever wired up the bar keeps passing, because the bar only forbids the list GROWING. */
// EMPTY, and that is the point: every dial the tactics screen still offers now does something. The two
// entries that used to live here were the GK duty, which has been retired rather than grandfathered.
const KNOWN_INERT: string[] = [];

/** How far behind the best preset the two defensive presets may sit at 11-v-15, PPG, noise-corrected.
 *  See bar 2b. At scale 1 this fixture measures 0.206 (7.9 pts/38); docs/decisions-for-ck.md section 35
 *  measures the same idea at 0.310 PPG on a different fixture (paired, both orderings, n=3000), so the
 *  ceiling is set above BOTH — a bar under a figure the project has already published would be red the
 *  first time anyone reproduced it. 0.32 PPG is 12.2 league points a season, which is what it costs a
 *  player to reach for Park the Bus when he is outmatched. It is a ceiling on a KNOWN TRAP, not a
 *  statement that the trap is acceptable; section 35 says the fix is an engine mechanism that rewards
 *  sitting deep, and until that exists no bar here can do anything but stop it deepening. */
const TRAP_CEILING = 0.32;

/** Goals per match, per table. Not a balance bar — a "the engine is still playing football" bar, and it
 *  is here because UPPER BOUNDS CANNOT SEE THE WORST FAILURE. `division_balance.ts` was passed cleanly
 *  by a mutation that disabled one of the engine's four goal paths and left 80% of matches goalless: no
 *  goals, no gaps between options, every spread ceiling satisfied. Across the two calibration runs
 *  (scale 0.02, 0.25 and 1) every table in this file sits between 2.12 and 4.49 goals a match; the band
 *  is that, opened out by about a quarter at each end. */
const GOALS_FLOOR = 1.7, GOALS_CEIL = 5.7;

console.log(`\n${'='.repeat(96)}\nTHE BARS   (SE gate ${SE_GATE.toFixed(2)} PPG, noise allowance ${RANGE_SIGMA}x the table's largest ±SE)\n${'='.repeat(96)}\n`);

// A run that measured nothing must not pass. `want()` takes an arbitrary comma list, so a typo in the
// sections argument silently selects no section at all — and every bar below is written as "for each
// thing measured", which is vacuously true over an empty list. This is the defect `division_balance.ts`
// found in its own worst-tier records: a gate whose happy path is reachable by not looking.
if (matchCount === 0 || (MEASURED.length === 0 && census.length === 0)) {
  console.log(`  FAIL nothing was measured (matchCount ${matchCount}, ${MEASURED.length} tables, ${census.length} dials).`);
  console.log(`       sections argument was "${process.argv[3] ?? 'all'}" — valid: presets,formations,duties,sliders,instructions,gk`);
  process.exit(1);
}

// ---- 1. the wiring census: no dial may join the ones that already do nothing --------------------
if (census.length) {
  // NOT `census.length === CENSUS.length` — that compares a list to itself and is true however short the
  // list gets, so the cheapest way to make a red census green would be to delete the offending row. The
  // count is pinned to what the tactics screen actually offers today.
  check(census.length >= CENSUS_MIN_DIALS && census.every((c) => c.pairs >= 6),
    `the census still covers all ${CENSUS_MIN_DIALS} dials at ${census[0].pairs} pairs each (found ${census.length})`);
  const inert = census.filter((c) => c.diff === 0);
  const newlyInert = inert.filter((c) => !KNOWN_INERT.includes(c.label));
  // READ THIS BEFORE TRUSTING THE ok. Passing means "no NEW dead control appeared". The GK duty is dead
  // RIGHT NOW: keeper and sweeper-keeper produce byte-identical matches, the same 22 end positions and
  // the same events, and section 3's GK table prints SPREAD 0.000 because of it. That is a known open
  // item (docs/decisions-for-ck.md §19, and §1 — the engine rebuild that would have given the keeper
  // something to do was reverted). It is grandfathered here so the rest of the file can gate; it is not
  // blessed, and if it is ever fixed this check keeps passing, which is the correct direction.
  check(newlyInert.length === 0,
    `no NEW dead control on the tactics screen — ${inert.length} dial(s) inert, all known` +
    `${newlyInert.length ? `; REGRESSION, these are new: ${newlyInert.map((c) => c.label).join(', ')}` : ''}` +
    `  [known-inert today: ${KNOWN_INERT.length ? KNOWN_INERT.join(' | ') : 'none'}]`);
  const feeble = census.filter((c) => c.diff > 0 && c.diff / c.pairs < WIRED_FLOOR);
  check(feeble.length === 0,
    `every wired dial still changes at least ${(100 * WIRED_FLOOR).toFixed(0)}% of paired matches` +
    `${feeble.length ? ` — fading toward inert: ${feeble.map((c) => `${c.label} ${c.diff}/${c.pairs}`).join(', ')}` : ''}`);
  if (gkPaired && gkPaired.n) {
    console.log(`  note GK close-up stands at score ${gkPaired.score}/${gkPaired.n}, events ${gkPaired.events}/${gkPaired.n}, ` +
      `keeper moved ${gkPaired.pos}/${gkPaired.n} (max ${gkPaired.maxDx.toFixed(6)} m)`);
  }
}

// ---- 2. no dial may be worth more of the season than it already is ------------------------------
let judged = 0;
for (const m of MEASURED) {
  const known = m.title in CEILING;
  const ceil = known ? CEILING[m.title] : DEFAULT_CEILING;
  const net = netSpread(m);
  if (m.maxSe > SE_GATE) {
    console.log(`  skip ${m.title}: ±SE ${m.maxSe.toFixed(3)} > ${SE_GATE} — too few matches to judge balance (raise scale)`);
    continue;
  }
  judged++;
  check(net <= ceil,
    `${m.title}: ${(38 * net).toFixed(1)} pts/38 of real spread, ceiling ${(38 * ceil).toFixed(1)}${known ? '' : ' (UNCALIBRATED table — loosest ceiling in the file)'}` +
    `   [raw ${m.spread.toFixed(3)} - ${RANGE_SIGMA}x${m.maxSe.toFixed(3)} = ${net.toFixed(3)} vs ${ceil.toFixed(3)} PPG]`);
}
if (MEASURED.length && judged === 0) {
  console.log(`  note every table was below the SE gate — this run is a smoke test of the plumbing, not a`);
  console.log(`       measurement of balance. Run at scale 0.25 or higher for the spread bars to mean anything.`);
}

// ---- 2b. the underdog column: the defensive presets are traps, and must not become worse traps ---
// The file's own header says a balanced layer is one "where the underdog columns do not rank the
// defensive options last". They ARE last: docs/decisions-for-ck.md §35 measured Park the Bus at 0.074
// PPG and Counter at 0.125 against Balanced's 0.384 at 11-v-15, n=3000 — because the engine gives a low
// press and a deep line no defensive value at all, so both presets are built out of the two settings
// that measure as pure penalties. This cannot be asserted away; it is an engine mechanism that does not
// exist yet. What CAN be held is the size of the trap.
const underdog = MEASURED.find((m) => m.title.endsWith('presets @ 11v15 underdog'));
if (underdog && underdog.maxSe <= SE_GATE) {
  const ppg = (name: string) => underdog.rows.find(([r]) => r === name)?.[1].ppg ?? NaN;
  const best = Math.max(...underdog.rows.map(([, a]) => a.ppg));
  const worstDef = Math.min(ppg('Park the Bus'), ppg('Counter'));
  const gap = best - worstDef - RANGE_SIGMA * underdog.maxSe;
  check(Number.isFinite(gap) && gap <= TRAP_CEILING,
    `reaching for a defensive preset when outmatched costs at most ${(38 * TRAP_CEILING).toFixed(1)} pts/38 ` +
    `(today ${(38 * Math.max(0, gap)).toFixed(1)}: best ${best.toFixed(3)}, worst of Park the Bus/Counter ${worstDef.toFixed(3)} PPG) ` +
    `— they are still the worst options in the table, which is §35, not a regression`);
}

// ---- 3. the game is still a game of football ----------------------------------------------------
// UPPER BOUNDS ALONE ARE NOT A GATE. An engine that stopped scoring would sail through every spread
// ceiling above — with no goals there are no gaps between options — and `division_balance.ts` was passed
// by exactly that mutation before it grew this floor. Every table in this file reports GF and GA, so the
// cheapest honest floor is the one they already print.
// PER TABLE, not pooled. A pooled average is dragged back over the line by the sections that still
// score, so one dead cell in the matrix would hide inside it — and the 11-v-15 preset tables run at
// 4.5 goals a match while the duty tables run at 2.4, which is a spread a single pooled bar cannot
// bracket tightly enough to catch anything.
if (MEASURED.length) {
  const bad = MEASURED.filter((m) => m.goals < GOALS_FLOOR || m.goals > GOALS_CEIL);
  const lo = MEASURED.reduce((a, m) => (m.goals < a.goals ? m : a));
  const hi = MEASURED.reduce((a, m) => (m.goals > a.goals ? m : a));
  check(bad.length === 0,
    `every table is still playing football: ${lo.goals.toFixed(2)} (${lo.title}) to ${hi.goals.toFixed(2)} (${hi.title}) goals a match, band ${GOALS_FLOOR}-${GOALS_CEIL}` +
    `${bad.length ? ` — OUTSIDE: ${bad.map((m) => `${m.title} ${m.goals.toFixed(2)}`).join(', ')}` : ''}`);
}

// The pass line has to keep saying what is wrong, or the next reader takes a green run as a clean bill
// of health — which is exactly how `VERDICT: sweeper-keeper is a BIT-FOR-BIT NO-OP` came to be printed
// on green builds for days without anyone acting on it.
const stillInert = census.filter((c) => c.diff === 0).length;
console.log(fails
  ? `\n✗ ${fails} tactics-matrix bar(s) failed — the tactical layer moved, and not in the direction the ratchet allows`
  : `\n✓ ${judged} table(s) judged, ${census.length} dial(s) censused, ${stillInert} still inert` +
    `${stillInert ? ' (the GK duty does nothing — known, docs/decisions-for-ck.md §19/§1)' : ''}` +
    ` — no worse than the state recorded in docs/decisions-for-ck.md §19/§35, which is all this file claims`);
if (fails) process.exit(1);
