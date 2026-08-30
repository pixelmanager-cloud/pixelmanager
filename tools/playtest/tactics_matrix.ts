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
  console.log(`  SPREAD ${(best - worst).toFixed(3)} PPG = ${((best - worst) * 38).toFixed(1)} league points a season` +
    `   (largest ±SE in table ${Math.max(...rows.map((r) => r[1].se)).toFixed(3)})`);
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

// ---------------------------------------------------------------- 6. sweeper-keeper

if (want('gk')) {
  const N = n(400);
  section('6. SWEEPER-KEEPER — is the duty a no-op? bit-for-bit comparison on identical seeds', N * 2);
  let diffScore = 0, diffPos = 0, diffEvents = 0, maxDx = 0;
  const tacHigh: Tactics = { ...DEFAULT_TACTICS, line: 2, mentality: 1 };
  for (let i = 0; i < N; i++) {
    const base = mk('a', 13, i * 7 + 1), opp = mk('b', 13, i * 11 + 3);
    const A = play(withDuty(base, 'GK', 'keeper'), opp, tacHigh, DEFAULT_TACTICS, i * 31 + 5);
    const B = play(withDuty(base, 'GK', 'sweeper-keeper'), opp, tacHigh, DEFAULT_TACTICS, i * 31 + 5);
    matchCount += 2;
    if (A.score[0] !== B.score[0] || A.score[1] !== B.score[1]) diffScore++;
    if (A.events.length !== B.events.length) diffEvents++;
    const ka = A.players[0][0], kb = B.players[0][0];
    const dx = Math.hypot(ka.x - kb.x, ka.y - kb.y);
    if (dx > 1e-9) diffPos++;
    maxDx = Math.max(maxDx, dx);
  }
  console.log(`  ${N} paired matches, high line (line=+2, mentality=+1) — the setup the duty is written for`);
  console.log(`  matches whose SCORE differs:            ${diffScore} / ${N}`);
  console.log(`  matches whose EVENT COUNT differs:      ${diffEvents} / ${N}`);
  console.log(`  matches whose KEEPER END POSITION moved:${diffPos} / ${N}   (max displacement ${maxDx.toFixed(6)} m)`);
  console.log(`  VERDICT: ${diffScore + diffPos + diffEvents === 0 ? 'sweeper-keeper is a BIT-FOR-BIT NO-OP' : 'sweeper-keeper changes the match'}`);
}

console.log(`\n${'-'.repeat(96)}\n${matchCount} matches in ${((Date.now() - started) / 1000).toFixed(0)}s (scale ${SCALE})`);
