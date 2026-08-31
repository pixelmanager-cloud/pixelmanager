// QA fuzz harness — MATCH ENGINE edge cases beyond shared/fuzz_test.ts's standard sweep.
// Targets: extreme quality mismatches (1 vs 20), out-of-normal-range tactic sliders, determinism
// (identical inputs replayed must be byte-identical event logs), and input-object immutability
// (MatchEngine must not mutate the Team objects it was constructed with).
// New file — does not modify shared/src. Run: `npx tsx shared/qa_match_edge_fuzz.ts`.

import { MatchEngine, TICK_SEC } from './src/engine.js';
import { generateTeam, generateClub, autoPickXI, buildXI } from './src/teams.js';
import { FORMATIONS, type Formation } from './src/formations.js';
import { makeRng } from './src/rng.js';
import { PITCH, type Team } from './src/types.js';
import type { Tactics } from './src/tactics.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const FORMATION_NAMES = Object.keys(FORMATIONS) as Formation[];
const EXPECTED_TICKS = (90 * 60) / TICK_SEC;
const HARD_TICK_CAP = EXPECTED_TICKS * 2;

function runToEnd(m: MatchEngine): { finished: boolean; ticks: number; err?: string } {
  let ticks = 0;
  try {
    while (ticks < HARD_TICK_CAP && !m.state.finished) { m.tick(); ticks++; }
  } catch (err) {
    return { finished: false, ticks, err: (err as Error).stack ?? String(err) };
  }
  return { finished: m.state.finished, ticks };
}

const deepClone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

// ── 1. EXTREME QUALITY MISMATCH: quality 1 vs 20 across every formation pairing ──
console.log('\n[qa-match] extreme quality mismatch (1 vs 20) across formations...');
{
  let checked = 0;
  for (const fA of FORMATION_NAMES) {
    for (const fB of FORMATION_NAMES) {
      checked++;
      const seed = (checked * 97) >>> 0;
      const ctx = `extreme-quality fA=${fA} fB=${fB} seed=${seed}`;
      try {
        const teamA = generateTeam('A', 'A', 0xff0000, 1, seed, fA);   // worst possible
        const teamB = generateTeam('B', 'B', 0x0000ff, 20, seed + 1, fB); // best possible
        const tA: Tactics = { formation: fA, mentality: -2, line: -2, press: -2, tempo: -2, width: -2 };
        const tB: Tactics = { formation: fB, mentality: 2, line: 2, press: 2, tempo: 2, width: 2 };
        const m = new MatchEngine([teamA, teamB], seed, [tA, tB]);
        const res = runToEnd(m);
        if (res.err) { log(`EXCEPTION: ${res.err}  ${ctx}`); continue; }
        if (!res.finished) { log(`did not finish within ${HARD_TICK_CAP} ticks (possible hang)  ${ctx}`); continue; }
        const [a, b] = m.state.score;
        if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) log(`bad final score [${a},${b}]  ${ctx}`);
        if (b < a) log(`quality-20 team lost to quality-1 team ${a}-${b} (extreme upset — check calibration)  ${ctx}`); // informational: flag if it happens often
      } catch (err) {
        log(`SETUP EXCEPTION: ${(err as Error).stack ?? err}  ${ctx}`);
      }
    }
  }
  console.log(`[qa-match] extreme quality mismatch: ${checked} formation pairs checked`);
}

// ── 2. OUT-OF-RANGE TACTIC SLIDERS: sliders documented as [-2,2] — probe well beyond ──
console.log('\n[qa-match] out-of-range tactic sliders...');
{
  const EXTREME_SLIDERS = [-100, -10, -3, 3, 10, 100, NaN];
  let checked = 0;
  for (const slider of EXTREME_SLIDERS) {
    checked++;
    const seed = 555 + checked;
    const ctx = `extreme-slider=${slider} seed=${seed}`;
    try {
      const teamA = generateTeam('A', 'A', 0xff0000, 12, seed, '4-4-2');
      const teamB = generateTeam('B', 'B', 0x0000ff, 12, seed + 1, '4-4-2');
      const tA: Tactics = { formation: '4-4-2', mentality: slider, line: slider, press: slider, tempo: slider, width: slider };
      const tB: Tactics = { formation: '4-4-2', mentality: 0, line: 0, press: 0, tempo: 0, width: 0 };
      const m = new MatchEngine([teamA, teamB], seed, [tA, tB]);
      const res = runToEnd(m);
      if (res.err) { log(`EXCEPTION on extreme slider: ${res.err}  ${ctx}`); continue; }
      if (!res.finished) { log(`did not finish with extreme slider (possible hang)  ${ctx}`); continue; }
      // players must stay on pitch and finite even with garbage tactics input
      for (const t of [0, 1] as const) for (const ps of m.state.players[t]) {
        if (!finite(ps.x) || !finite(ps.y) || ps.x < 0 || ps.x > PITCH.w || ps.y < 0 || ps.y > PITCH.h)
          log(`player off-pitch/non-finite with extreme slider input: (${ps.x},${ps.y})  ${ctx}`);
      }
      if (!Number.isInteger(m.state.score[0]) || !Number.isInteger(m.state.score[1]))
        log(`non-integer score with extreme/NaN slider input: ${JSON.stringify(m.state.score)}  ${ctx}`);
    } catch (err) {
      log(`SETUP EXCEPTION: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  console.log(`[qa-match] out-of-range sliders: ${checked} values checked`);
}

// ── 3. DETERMINISM: identical (teams, matchSeed, tactics) must replay byte-identical ──
console.log('\n[qa-match] determinism replay (same inputs twice)...');
{
  let mismatches = 0, checked = 0;
  for (let i = 0; i < 40; i++) {
    checked++;
    const seed = (i * 1234577) >>> 0;
    const formation = FORMATION_NAMES[i % FORMATION_NAMES.length];
    const rng = makeRng(seed);
    const q = 3 + Math.floor(rng() * 18);
    const buildOne = () => {
      const teamA = generateTeam('A', 'A', 0xff0000, q, seed, formation);
      const teamB = generateTeam('B', 'B', 0x0000ff, q, seed + 1, formation);
      const t: Tactics = { formation, mentality: 1, line: -1, press: 2, tempo: 0, width: -2 };
      const m = new MatchEngine([teamA, teamB], seed, [t, t]);
      runToEnd(m);
      return m.state;
    };
    const s1 = deepClone(buildOne());
    const s2 = deepClone(buildOne());
    if (JSON.stringify(s1) !== JSON.stringify(s2)) {
      mismatches++;
      log(`DETERMINISM BREAK: identical match inputs (seed=${seed}, formation=${formation}, q=${q}) produced different final states`);
    }
  }
  console.log(`[qa-match] determinism: ${mismatches} mismatch(es) out of ${checked}`);
}

// ── 4. INPUT IMMUTABILITY: MatchEngine must not mutate the Team objects passed to its constructor ──
console.log('\n[qa-match] input-team immutability...');
{
  let checked = 0;
  for (let i = 0; i < 30; i++) {
    checked++;
    const seed = (i * 7919) >>> 0;
    const formation = FORMATION_NAMES[i % FORMATION_NAMES.length];
    const club = generateClub('C', 'C', 0x33aa55, 10 + (i % 10), seed);
    const lineup = autoPickXI(club, formation);
    const teamA = buildXI(club, lineup);
    const teamB = generateTeam('B', 'B', 0x0000ff, 12, seed + 1, formation);
    const beforeA = JSON.stringify(teamA);
    const beforeB = JSON.stringify(teamB);
    const m = new MatchEngine([teamA, teamB], seed, [
      { formation, mentality: 0, line: 0, press: 1, tempo: -1, width: 0 },
      { formation, mentality: 0, line: 0, press: -1, tempo: 1, width: 0 },
    ]);
    runToEnd(m);
    const afterA = JSON.stringify(teamA);
    const afterB = JSON.stringify(teamB);
    if (beforeA !== afterA) log(`MatchEngine mutated input teamA during play  seed=${seed} formation=${formation}`);
    if (beforeB !== afterB) log(`MatchEngine mutated input teamB during play  seed=${seed} formation=${formation}`);
  }
  console.log(`[qa-match] immutability: ${checked} matches checked`);
}

// ── 5. SAME-SEED, DIFFERENT-TACTICS sanity: tactics must actually influence outcomes (not ignored) ──
console.log('\n[qa-match] tactics-are-not-ignored sanity...');
{
  const seed = 0xC0FFEE;
  const teamA = generateTeam('A', 'A', 0xff0000, 13, seed, '4-4-2');
  const teamB = generateTeam('B', 'B', 0x0000ff, 13, seed + 1, '4-4-2');
  const ultraAttack: Tactics = { formation: '4-4-2', mentality: 2, line: 2, press: 2, tempo: 2, width: 2 };
  const ultraDefend: Tactics = { formation: '4-4-2', mentality: -2, line: -2, press: -2, tempo: -2, width: -2 };
  const runWith = (tA: Tactics) => {
    const m = new MatchEngine([deepClone(teamA), deepClone(teamB)], seed, [tA, ultraDefend]);
    runToEnd(m);
    return m.state.score[0];
  };
  const attackGoals = runWith(ultraAttack);
  const defendGoals = runWith(ultraDefend);
  if (attackGoals === defendGoals) log(`tactics appear to have NO EFFECT on outcome: ultra-attack and ultra-defend produced identical goals(${attackGoals}) for team A with the same seed/opponent (possible tactics no-op bug)`);
}

if (failures.length) {
  console.error(`\n[qa-match] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-match] clean — no invariant violations found.');
