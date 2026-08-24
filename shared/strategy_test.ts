// Headless harness: calibrate scoring AND prove tactics change outcomes.
import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';
import { TACTIC_PRESETS, DEFAULT_TACTICS, type Tactics } from './src/tactics.js';
import type { Team } from './src/types.js';

interface Result { score: [number, number]; shots: [number, number]; poss: [number, number]; fitEnd: [number, number] }

function play(teamA: Team, teamB: Team, tA: Tactics, tB: Tactics, seed: number): Result {
  const m = new MatchEngine([teamA, teamB], seed, [tA, tB]);
  while (!m.state.finished) m.tick();
  const s = m.state;
  const shots = (idx: 0 | 1) => s.events.filter((e) => e.teamIdx === idx && (e.type === 'goal' || e.type.startsWith('shot'))).length;
  const totPoss = s.possession[0] + s.possession[1] || 1;
  const avgFit = (idx: 0 | 1) => s.players[idx].slice(1).reduce((a, p) => a + p.fitness, 0) / 10;
  return {
    score: [s.score[0], s.score[1]],
    shots: [shots(0), shots(1)],
    poss: [s.possession[0] / totPoss, s.possession[1] / totPoss],
    fitEnd: [avgFit(0), avgFit(1)],
  };
}

const N = 60;
const mk = (id: string, q: number, seed: number, formation: any = '4-4-2') =>
  generateTeam(id, id, id.toUpperCase(), 0xff0000, q, seed, formation);

// Collected metrics + assertions so this doubles as a CI regression gate:
// any violation prints FAIL lines and exits non-zero.
const failures: string[] = [];
const assert = (ok: boolean, msg: string) => { if (!ok) failures.push(msg); };

// ---- 1. Calibration: even sides, default tactics ----
{
  let g = 0, sh = 0; const scores: string[] = [];
  for (let i = 0; i < N; i++) {
    const r = play(mk('hom', 13, i * 7 + 1), mk('awy', 13, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    g += r.score[0] + r.score[1]; sh += r.shots[0] + r.shots[1];
    if (i < 12) scores.push(`${r.score[0]}-${r.score[1]}`);
  }
  const goalsPerMatch = g / N;
  console.log(`[calibration] avg goals/match=${goalsPerMatch.toFixed(2)} avg shots/match=${(sh / N).toFixed(1)}`);
  console.log(`             sample: ${scores.join('  ')}`);
  assert(goalsPerMatch >= 1.6 && goalsPerMatch <= 3.6, `goals/match ${goalsPerMatch.toFixed(2)} outside realistic range [1.6, 3.6]`);
}

// ---- 2. Quality: strong squad should beat weak squad ----
{
  let winsStrong = 0, gd = 0;
  for (let i = 0; i < N; i++) {
    const r = play(mk('str', 15, i * 7 + 1), mk('wek', 11, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    if (r.score[0] > r.score[1]) winsStrong++;
    gd += r.score[0] - r.score[1];
  }
  const winRate = winsStrong / N;
  console.log(`[quality]   strong(15) vs weak(11): strong win rate=${(winRate * 100).toFixed(0)}%  avg GD=${(gd / N).toFixed(2)}`);
  assert(winRate >= 0.62, `stronger squad win rate ${(winRate * 100).toFixed(0)}% below 62% — quality no longer decisive`);
}

// ---- 3. Pressing: high press should win more possession (equal squads) ----
{
  let possHi = 0, fitHi = 0, fitLo = 0;
  const hi: Tactics = { ...DEFAULT_TACTICS, press: 2 };
  const lo: Tactics = { ...DEFAULT_TACTICS, press: -2 };
  for (let i = 0; i < N; i++) {
    const r = play(mk('hip', 13, i * 7 + 1), mk('lop', 13, i * 11 + 3), hi, lo, i * 31 + 5);
    possHi += r.poss[0]; fitHi += r.fitEnd[0]; fitLo += r.fitEnd[1];
  }
  const possHiPct = possHi / N, fitHiAvg = fitHi / N, fitLoAvg = fitLo / N;
  console.log(`[press]     high-press possession=${(possHiPct * 100).toFixed(0)}%  end-fitness high=${fitHiAvg.toFixed(2)} low=${fitLoAvg.toFixed(2)}`);
  assert(possHiPct >= 0.6, `high press possession ${(possHiPct * 100).toFixed(0)}% below 60% — pressing no longer wins the ball`);
  assert(fitHiAvg < fitLoAvg, `high press should tire more than low press (got ${fitHiAvg.toFixed(2)} vs ${fitLoAvg.toFixed(2)})`);
}

// ---- 4. High line vs fast forwards: should concede more than a deep line ----
{
  let concededHigh = 0, concededDeep = 0;
  const highLine: Tactics = { ...DEFAULT_TACTICS, line: 2 };
  const deepLine: Tactics = { ...DEFAULT_TACTICS, line: -2 };
  const fastAttack: Tactics = { ...DEFAULT_TACTICS, tempo: 2, mentality: 1 };
  for (let i = 0; i < N; i++) {
    const def = mk('def', 13, i * 7 + 1);
    const atk = mk('atk', 14, i * 11 + 3, '4-3-3');
    concededHigh += play(def, atk, highLine, fastAttack, i * 31 + 5).score[1];
    concededDeep += play(def, atk, deepLine, fastAttack, i * 31 + 5).score[1];
  }
  console.log(`[line]      goals conceded vs direct attack: HIGH line=${(concededHigh / N).toFixed(2)}  DEEP line=${(concededDeep / N).toFixed(2)}`);
  assert(concededHigh > concededDeep, `high line should concede more than deep line vs a direct attack (got ${concededHigh} vs ${concededDeep})`);
}

// ---- 5. Preset head-to-heads (informational) ----
{
  const matchups: Array<[string, string]> = [['Gegenpress', 'Park the Bus'], ['Tiki-Taka', 'Route One'], ['Counter', 'Gegenpress']];
  for (const [a, b] of matchups) {
    let wa = 0, wb = 0, dr = 0;
    for (let i = 0; i < N; i++) {
      const r = play(mk('a', 13, i * 7 + 1), mk('b', 13, i * 11 + 3), TACTIC_PRESETS[a], TACTIC_PRESETS[b], i * 31 + 5);
      if (r.score[0] > r.score[1]) wa++; else if (r.score[1] > r.score[0]) wb++; else dr++;
    }
    console.log(`[preset]    ${a} vs ${b}: ${wa}W-${dr}D-${wb}L`);
  }
}

// ---- verdict ----
if (failures.length) {
  console.error('\nENGINE REGRESSION — assertions failed:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\n✓ all engine assertions passed');
