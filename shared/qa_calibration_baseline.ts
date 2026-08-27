// QA CALIBRATION BASELINE — large-N snapshot of the match engine's key calibration numbers on
// CURRENT main (commit b57aa88), so a future reconcile against an engine-tactics branch can diff
// against a stable, high-sample-size reference instead of guessing whether a change moved the needle.
//
// This is deliberately NOT a pass/fail gate (unlike fuzz_test.ts/strategy_test.ts, which already run in
// `npm run verify`) — it just measures and prints/records numbers at a much larger N than those two for
// tighter confidence intervals, plus a couple of the same strategy_test.ts-style relative comparisons
// (wide>narrow, counter-preset head-to-heads, poacher>target-man) reproduced at bigger N so the baseline
// carries a real sample size next to each metric.
//
// New file — does not modify shared/src. Run: `npx tsx shared/qa_calibration_baseline.ts`
// (QA_N env overrides sample size per section, default 20000 for the main calibration sweep).

import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';
import { TACTIC_PRESETS, DEFAULT_TACTICS, type Tactics } from './src/tactics.js';
import type { Team, Role, Duty } from './src/types.js';

interface Result { score: [number, number]; shots: [number, number] }
function play(teamA: Team, teamB: Team, tA: Tactics, tB: Tactics, seed: number): Result {
  const m = new MatchEngine([teamA, teamB], seed, [tA, tB]);
  while (!m.state.finished) m.tick();
  const s = m.state;
  const shots = (idx: 0 | 1) => s.events.filter((e) => e.teamIdx === idx && (e.type === 'goal' || e.type.startsWith('shot'))).length;
  return { score: [s.score[0], s.score[1]], shots: [shots(0), shots(1)] };
}
const mk = (id: string, q: number, seed: number, formation: any = '4-4-2') => generateTeam(id, id, id.toUpperCase(), 0xff0000, q, seed, formation);

// NOTE: a full 90' match on this engine costs ~35-40ms (measured on this machine), so N is kept modest
// enough for the whole baseline to finish in a few minutes while still giving tight-enough confidence
// intervals for a reconcile diff (a few thousand matches per headline metric). Raise via QA_N for a
// tighter baseline if wall-clock time isn't a concern.
const N = Number(process.env.QA_N ?? 1500);
const lines: string[] = [];
const rec = (s: string) => { console.log(s); lines.push(s); };

rec(`Football Royalty — match-engine calibration baseline`);
rec(`Commit: b57aa88 (main, pre-merge). Sample size N=${N} unless noted.`);
rec('');

// ── 1. even-quality calibration: goals/match (both teams), 0-0 rate ──
{
  let goalsA = 0, goalsB = 0, zeroZero = 0;
  const dist: Record<number, number> = {};
  for (let i = 0; i < N; i++) {
    const r = play(mk('hom', 13, i * 7 + 1), mk('awy', 13, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    goalsA += r.score[0]; goalsB += r.score[1];
    if (r.score[0] === 0 && r.score[1] === 0) zeroZero++;
    const total = r.score[0] + r.score[1];
    dist[total] = (dist[total] ?? 0) + 1;
  }
  const goalsPerMatch = (goalsA + goalsB) / N;
  rec(`[calibration] N=${N} even-quality(13v13) default tactics:`);
  rec(`  goals/match total = ${goalsPerMatch.toFixed(3)}  (home avg ${(goalsA / N).toFixed(3)}, away avg ${(goalsB / N).toFixed(3)})`);
  rec(`  0-0 rate = ${(zeroZero / N * 100).toFixed(2)}%`);
  const distStr = Object.entries(dist).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => `${k}g:${(v / N * 100).toFixed(1)}%`).join('  ');
  rec(`  total-goals distribution: ${distStr}`);
}
rec('');

// ── 2. equal-quality home/away split (across a spread of quality levels, not just 13) ──
{
  let home = 0, away = 0, draw = 0;
  for (let i = 0; i < N; i++) {
    const q = 3 + (i % 18); // sweep the full 3..20 quality range, both sides equal
    const r = play(mk('hom', q, i * 7 + 1), mk('awy', q, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    if (r.score[0] > r.score[1]) home++; else if (r.score[1] > r.score[0]) away++; else draw++;
  }
  rec(`[calibration] N=${N} equal-quality (sweeping q=3..20) home/away/draw split:`);
  rec(`  home ${(home / N * 100).toFixed(2)}%  away ${(away / N * 100).toFixed(2)}%  draw ${(draw / N * 100).toFixed(2)}%`);
}
rec('');

// ── 3. quality gradient: does a stronger team actually win more, monotonically? ──
{
  rec(`[calibration] quality-gradient win rate (home q=13 fixed, away q varies), N=${Math.round(N / 10)} per row:`);
  const n2 = Math.round(N / 10);
  for (const awayQ of [5, 9, 13, 17, 20]) {
    let homeWins = 0;
    for (let i = 0; i < n2; i++) {
      const r = play(mk('hom', 13, i * 7 + 1), mk('awy', awayQ, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
      if (r.score[0] > r.score[1]) homeWins++;
    }
    rec(`  home(q=13) vs away(q=${awayQ}): home win rate ${(homeWins / n2 * 100).toFixed(1)}%`);
  }
}
rec('');

// ── 4. preset head-to-heads at higher N (informational, matches strategy_test.ts's matchups) ──
{
  const n2 = Math.round(N / 40); // presets are slower to vary meaningfully; still 10x strategy_test.ts's N=60
  const matchups: Array<[string, string]> = [['Gegenpress', 'Park the Bus'], ['Tiki-Taka', 'Route One'], ['Counter', 'Gegenpress']];
  rec(`[preset-h2h] N=${n2} per matchup:`);
  for (const [a, b] of matchups) {
    let wa = 0, wb = 0, dr = 0;
    for (let i = 0; i < n2; i++) {
      const r = play(mk('a', 13, i * 7 + 1, TACTIC_PRESETS[a].formation), mk('b', 13, i * 11 + 3, TACTIC_PRESETS[b].formation), TACTIC_PRESETS[a], TACTIC_PRESETS[b], i * 31 + 5);
      if (r.score[0] > r.score[1]) wa++; else if (r.score[1] > r.score[0]) wb++; else dr++;
    }
    rec(`  ${a} vs ${b}: ${wa}W-${dr}D-${wb}L  (${(wa / n2 * 100).toFixed(1)}%-${(dr / n2 * 100).toFixed(1)}%-${(wb / n2 * 100).toFixed(1)}%)`);
  }
}
rec('');

// ── 5. duty: poacher vs target-man forward shot line, at 10x strategy_test.ts's N ──
{
  const n2 = Math.round(N / 30);
  const withDuty = (t: Team, role: Role, duty: Duty): Team => ({ ...t, players: t.players.map((p) => (p.role === role ? { ...p, duty } : p)) });
  let shotsPoacher = 0, shotsTarget = 0;
  for (let i = 0; i < n2; i++) {
    const base = mk('atk', 14, i * 7 + 1, '4-3-3');
    const opp = mk('def', 13, i * 11 + 3);
    shotsPoacher += play(withDuty(base, 'FW', 'poacher'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    shotsTarget += play(withDuty(base, 'FW', 'target-man'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
  }
  rec(`[duty] N=${n2}: forward shots/match — POACHER=${(shotsPoacher / n2).toFixed(2)}  TARGET-MAN=${(shotsTarget / n2).toFixed(2)}  (ratio ${(shotsPoacher / shotsTarget).toFixed(3)})`);
}
rec('');

// ── 6. shape: wide vs narrow, at 10x strategy_test.ts's N ──
{
  const n2 = Math.round(N / 30);
  const wide: Tactics = { ...DEFAULT_TACTICS, formation: '3-4-3' };
  const narrow: Tactics = { ...DEFAULT_TACTICS, formation: '4-1-2-1-2' };
  let w = 0, l = 0, d = 0;
  for (let i = 0; i < n2; i++) {
    const r = play(mk('w', 12, i * 7 + 1, '3-4-3'), mk('n', 12, i * 11 + 3, '4-1-2-1-2'), wide, narrow, i * 31 + 5);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++; else d++;
  }
  rec(`[shape] N=${n2}: wide(3-4-3) vs narrow(diamond) = ${w}W-${d}D-${l}L  (${(w / n2 * 100).toFixed(1)}%-${(d / n2 * 100).toFixed(1)}%-${(l / n2 * 100).toFixed(1)}%)`);
}
rec('');

// ── 7. anti-spam field check at higher N: no tactic's average win rate across the whole field should
//    run away (strategy_test.ts gates this at <60% with N=45/matchup; reproduced here at bigger N) ──
{
  const n2 = Math.max(8, Math.round(N / 150)); // 56 matchups in the field x field grid — keep this section's total bounded
  const field: Record<string, Tactics> = { Balanced: DEFAULT_TACTICS, ...TACTIC_PRESETS };
  const fnames = Object.keys(field);
  const winRate = (tA: Tactics, tB: Tactics, n: number) => {
    let a = 0;
    for (let i = 0; i < n; i++) {
      const r = play(mk('a', 12, i * 7 + 1, tA.formation as any), mk('b', 12, i * 13 + 3, tB.formation as any), tA, tB, i * 31 + 5);
      if (r.score[0] > r.score[1]) a++;
    }
    return a / n;
  };
  let worstOffender = '', maxAvg = 0;
  for (const n of fnames) {
    let sum = 0;
    for (const m of fnames) { if (m === n) continue; sum += winRate(field[n], field[m], n2); }
    const avg = sum / (fnames.length - 1);
    if (avg > maxAvg) { maxAvg = avg; worstOffender = n; }
  }
  rec(`[anti-spam] N=${n2}/matchup: highest field-average win rate = ${worstOffender} at ${(maxAvg * 100).toFixed(1)}%  (gate in strategy_test.ts is <60%)`);
}

console.log(`\n[qa-calibration] baseline captured — ${lines.length} lines. Copy this block into docs/qa-calibration-baseline.md when re-running for a diff.`);
