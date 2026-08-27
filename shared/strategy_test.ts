// Headless harness: calibrate scoring AND prove tactics change outcomes.
import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';
import { TACTIC_PRESETS, DEFAULT_TACTICS, seededOpponentTactics, type Tactics } from './src/tactics.js';
import type { Team, Role, Duty } from './src/types.js';

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
      const r = play(mk('a', 13, i * 7 + 1, TACTIC_PRESETS[a].formation), mk('b', 13, i * 11 + 3, TACTIC_PRESETS[b].formation), TACTIC_PRESETS[a], TACTIC_PRESETS[b], i * 31 + 5);
      if (r.score[0] > r.score[1]) wa++; else if (r.score[1] > r.score[0]) wb++; else dr++;
    }
    console.log(`[preset]    ${a} vs ${b}: ${wa}W-${dr}D-${wb}L`);
  }
}

// ---- 6. Duties: a poacher forward line shoots more than a target-man line ----
{
  const withDuty = (t: Team, role: Role, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => (p.role === role ? { ...p, duty } : p)) });
  let shotsPoacher = 0, shotsTarget = 0;
  for (let i = 0; i < N; i++) {
    const base = mk('atk', 14, i * 7 + 1, '4-3-3');
    const opp = mk('def', 13, i * 11 + 3);
    shotsPoacher += play(withDuty(base, 'FW', 'poacher'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    shotsTarget += play(withDuty(base, 'FW', 'target-man'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
  }
  console.log(`[duty]      forward shots: POACHER line=${(shotsPoacher / N).toFixed(1)}  TARGET-MAN line=${(shotsTarget / N).toFixed(1)}`);
  assert(shotsPoacher > shotsTarget, `poacher forwards should shoot more than target-men (got ${shotsPoacher} vs ${shotsTarget})`);
}

// ---- 6b. Wing-back duty: bombing fullbacks (extra flank presence) edge possession vs cover-duty fullbacks ----
{
  const withDefDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => (p.role === 'DF' ? { ...p, duty } : p)) });
  let possWingBack = 0, possCover = 0;
  for (let i = 0; i < N; i++) {
    const base = mk('atk', 14, i * 7 + 1, '4-4-2');
    const opp = mk('def', 13, i * 11 + 3, '4-1-2-1-2'); // narrow opponent — most exposed to the extra flank presence
    possWingBack += play(withDefDuty(base, 'wing-back'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
    possCover += play(withDefDuty(base, 'cover'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
  }
  console.log(`[duty]      possession vs a narrow back four: WING-BACK fullbacks=${(possWingBack / N * 100).toFixed(1)}%  COVER fullbacks=${(possCover / N * 100).toFixed(1)}%`);
  assert(possWingBack > possCover, `wing-back fullbacks should edge possession above cover-duty fullbacks vs a narrow opponent (got ${(possWingBack / N * 100).toFixed(1)}% vs ${(possCover / N * 100).toFixed(1)}%)`);
}

// ---- 7. Anti-spam: no single tactic may dominate the field (equal stats) ----
// Guards against a globally-dominant "spam" strategy (Tiki-Taka used to win ~69% of the
// field with no counter). Every viable tactic must have at least one losing matchup, and
// none may run away with the field — tactics are a bounded edge, stats are king.
{
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
  const spam: string[] = [];
  for (const n of fnames) {
    let sum = 0, worst = 1;
    for (const m of fnames) { if (m === n) continue; const w = winRate(field[n], field[m], 45); sum += w; worst = Math.min(worst, w); }
    const avg = sum / (fnames.length - 1);
    if (avg > maxAvg) { maxAvg = avg; worstOffender = n; }
    if (worst >= 0.52) spam.push(`${n} (no losing matchup; worst ${(worst * 100).toFixed(0)}%)`); // a tactic that never loses = spammable
  }
  console.log(`[anti-spam] highest field-avg tactic: ${worstOffender} ${(maxAvg * 100).toFixed(0)}%  (gate <60%)`);
  assert(maxAvg < 0.60, `a tactic dominates the field: ${worstOffender} avg ${(maxAvg * 100).toFixed(0)}% (>=60% = spammable)`);
  assert(spam.length === 0, `spammable tactic(s) with no counter: ${spam.join(', ')}`);
}

// ---- 8. Zonal shape: a WIDE formation beats a NARROW one on the flanks ----
{
  const wide: Tactics = { ...DEFAULT_TACTICS, formation: '3-4-3' };
  const narrow: Tactics = { ...DEFAULT_TACTICS, formation: '4-1-2-1-2' };
  let w = 0, l = 0;
  for (let i = 0; i < N; i++) {
    const r = play(mk('w', 12, i * 7 + 1, '3-4-3'), mk('n', 12, i * 11 + 3, '4-1-2-1-2'), wide, narrow, i * 31 + 5);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++;
  }
  console.log(`[shape]     wide 3-4-3 vs narrow diamond: wide ${w}W-${l}L (want wide > narrow)`);
  assert(w > l, `a wide formation should beat a narrow one on the flanks (got ${w} vs ${l})`);
}

// ---- 8b. New formation 4-1-4-1: extra central mid should beat an equally narrow rival (the diamond) ----
{
  let w = 0, l = 0;
  for (let i = 0; i < N; i++) {
    const r = play(mk('a', 12, i * 7 + 1, '4-1-4-1'), mk('b', 12, i * 13 + 3, '4-1-2-1-2'), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++;
  }
  console.log(`[shape]     4-1-4-1 vs 4-1-2-1-2 diamond: ${w}W-${l}L (want the extra central body to win the middle)`);
  assert(w > l, `4-1-4-1's extra central midfielder should beat an equally narrow diamond (got ${w} vs ${l})`);
}

// ---- 8c. New formation 5-4-1: a real extra defender should concede fewer goals to a direct attack ----
{
  const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 };
  const concedeVsDirect = (defFormation: any) => {
    let ga = 0;
    for (let i = 0; i < N; i++) {
      const def = mk('def', 13, i * 7 + 1, defFormation);
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      ga += play(def, atk, { ...DEFAULT_TACTICS, formation: defFormation }, direct, i * 31 + 5).score[1];
    }
    return ga;
  };
  const ga541 = concedeVsDirect('5-4-1'), ga442 = concedeVsDirect('4-4-2'), ga451 = concedeVsDirect('4-5-1');
  console.log(`[shape]     conceded vs direct attack: 5-4-1=${(ga541 / N).toFixed(2)}  4-4-2=${(ga442 / N).toFixed(2)}  4-5-1=${(ga451 / N).toFixed(2)}`);
  assert(ga541 < ga442, `5-4-1's extra real defender should concede fewer goals than 4-4-2 vs a direct attack (got ${ga541} vs ${ga442})`);
  assert(ga541 < ga451, `5-4-1 should concede fewer goals than the lone-striker 4-5-1 vs a direct attack (got ${ga541} vs ${ga451})`);
}

// ---- 8d. New formation 4-2-2-2: a very narrow box midfield beats the equally-narrow 4-1-4-1 ----
{
  let w = 0, l = 0;
  for (let i = 0; i < N; i++) {
    const r = play(mk('a', 12, i * 7 + 1, '4-2-2-2'), mk('b', 12, i * 13 + 3, '4-1-4-1'), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++;
  }
  console.log(`[shape]     4-2-2-2 vs 4-1-4-1: ${w}W-${l}L (want two strikers to beat one, other things equal)`);
  assert(w > l, `4-2-2-2's second striker should beat 4-1-4-1's lone-striker shape (got ${w} vs ${l})`);
}

// ---- 9. Seeded opponent tactical profiles: stable per-seed identity, but varied across opponents ----
// Every SP opponent used to play flat DEFAULT_TACTICS 4-4-2 regardless of who they were. Prove the
// fix has real teeth: the same club seed always gets the same style (determinism), and a spread of
// club seeds produces a genuine MIX of presets (not everyone funnelled into one style).
{
  const seeds = Array.from({ length: 40 }, (_, i) => (i * 2654435761) >>> 0);
  const styles = new Set(seeds.map((s) => JSON.stringify(seededOpponentTactics(s))));
  const repeat1 = JSON.stringify(seededOpponentTactics(seeds[3]));
  const repeat2 = JSON.stringify(seededOpponentTactics(seeds[3]));
  console.log(`[opp-style]  ${seeds.length} seeded opponents → ${styles.size} distinct tactical profiles (deterministic: ${repeat1 === repeat2})`);
  assert(repeat1 === repeat2, 'seededOpponentTactics is not deterministic for the same seed');
  assert(styles.size >= 3, `seeded opponents should show real tactical variety (got only ${styles.size} distinct profiles across ${seeds.length} seeds)`);
}

// ---- 10. Offside trap instruction: a high line + trap concedes fewer clear breakaways to an average-pace attack ----
// A new off-by-default INSTRUCTION (Tactics.offsideTrap, only live with line >= 1): the back line steps
// up together, so a through-ball needs a real pace edge to beat it clean. Prove it does what it says
// against a same-quality, ordinary-pace attacking side (no elite pace outlet to blow the trap open).
{
  const highLine: Tactics = { ...DEFAULT_TACTICS, formation: '4-4-2', line: 2 };
  const trapLine: Tactics = { ...highLine, offsideTrap: true };
  const attack: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 }; // direct, springs through-balls
  const runWith = (t: Tactics) => {
    let concededChances = 0;
    for (let i = 0; i < N; i++) {
      const def = mk('def', 13, i * 7 + 1, '4-4-2');
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      const m = new MatchEngine([def, atk], i * 31 + 5, [t, attack]);
      while (!m.state.finished) m.tick();
      concededChances += m.state.events.filter((e) => e.teamIdx === 1 && e.type === 'chance').length;
    }
    return concededChances;
  };
  const noTrap = runWith(highLine);
  const withTrap = runWith(trapLine);
  console.log(`[offside]   high line clear-cut chances conceded: no trap=${noTrap}  with trap=${withTrap}`);
  assert(withTrap < noTrap, `offside trap should concede fewer clear breakaways than a plain high line (got ${withTrap} vs ${noTrap})`);
}

// ---- verdict ----
if (failures.length) {
  console.error('\nENGINE REGRESSION — assertions failed:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\n✓ all engine assertions passed');
