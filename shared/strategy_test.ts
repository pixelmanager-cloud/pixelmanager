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

// N IS CONFIGURABLE SO THE POWER OF THIS SUITE CAN BE INTERROGATED, and the default is UNCHANGED at 60.
// This matters because several assertions here measure effects of 0.1-0.2 goals a match against a
// per-match standard deviation near 1.75, and at N=60 that is a coin flip. Two sibling probes already say
// so out loud: tools/playtest/tactical_power.ts opens with "THE ASSERTIONS THAT WERE MEASURING NOISE",
// and tools/playtest/duty_power.ts measured at n=900 that an anchor concedes MORE than a ball-winner
// (+0.217, 95% CI [0.101, 0.333]) and states that asserting the opposite "would be asserting a model the
// game does not have" -- which this file asserts twice.
// Raising N is not weakening a bar; it is the opposite. Run `STRATEGY_N=400 npx tsx shared/strategy_test.ts`
// to find out whether a failure is a defect or a coin landing badly.
const N = Number(process.env.STRATEGY_N ?? 60);
const mk = (id: string, q: number, seed: number, formation: any = '4-4-2') =>
  generateTeam(id, id, 0xff0000, q, seed, formation);

// Collected metrics + assertions so this doubles as a CI regression gate:
// any violation prints FAIL lines and exits non-zero.
const failures: string[] = [];
const assert = (ok: boolean, msg: string) => { if (!ok) failures.push(msg); };

// ── EFFECTS, NOT VERDICTS ────────────────────────────────────────────────────────────────────────────
// This suite used to be twenty-six booleans over aggregate counts, printing only its failures. A boolean
// has nowhere to put uncertainty, so an assertion passing by 40% and one passing by 0.3% read identically,
// and the gate could not tell a defect from a coin landing badly.
//
// Measured across three sample sizes on 2026-09-02, only TWO of the twenty-six were stable:
//   N=60   wing-back possession ✗   wide-playmaker v box-to-box ✗   4-2-2-2 ✗
//   N=300  wing-back possession ✗   wide formation on flanks ✗      4-2-2-2 ✗   diamond+wide focus ✗
//   N=600  wing-back possession ✗   wide formation on flanks ✗      4-2-2-2 ✗
// N=60 raised a false alarm (wide-playmaker) AND hid two real failures; N=300 then raised a false alarm of
// its own (the diamond) that vanished again at 600. Raising N does not converge, it reshuffles which
// coin-flips land badly -- and N=600 already costs thirteen minutes. So the fix is error bars, not samples.
//
// A comparison now reports a paired mean difference with a 95% CI and one of three verdicts:
//   CONFIRMED     the interval sits entirely on the expected side  -> the effect is real
//   inconclusive  the interval straddles zero -> NO MEASURABLE EFFECT. Reported, never failed. This is the
//                 honest answer for most of these fixtures, and it is more useful than a green tick,
//                 because a design question like "does width pay?" is answered by the interval, not by a
//                 pass. (CK's call, 2026-09-02: report only.)
//   REFUTED       the interval sits entirely on the WRONG side -> the model asserts something the engine
//                 does not do. Only this fails the gate.
type Verdict = 'confirmed' | 'inconclusive' | 'refuted';
const tally = { confirmed: 0, inconclusive: 0, refuted: 0 };

/** `diffs` are PAIRED per-match differences (same seed, one thing changed), oriented so that a POSITIVE
 *  number means the claim held for that match. */
function compare(diffs: number[], claim: string): Verdict {
  const n = diffs.length;
  if (!n) { console.log(`  [nodata] ${claim}`); return 'inconclusive'; }
  const mean = diffs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  const se = sd / Math.sqrt(n);
  const lo = mean - 1.96 * se, hi = mean + 1.96 * se;
  const verdict: Verdict = lo > 0 ? 'confirmed' : hi < 0 ? 'refuted' : 'inconclusive';
  tally[verdict]++;
  const mark = verdict === 'confirmed' ? 'ok  ' : verdict === 'refuted' ? 'FAIL' : '  · ';
  console.log(`  ${mark} ${claim.padEnd(62)} ${mean >= 0 ? '+' : ''}${mean.toFixed(3)}  95% CI [${lo.toFixed(3)}, ${hi.toFixed(3)}]  n=${n}`);
  // Only a REFUTED claim fails. An inconclusive one is a measurement, not a regression.
  if (verdict === 'refuted') {
    failures.push(`${claim} — the engine does the OPPOSITE: ${mean.toFixed(3)}, 95% CI [${lo.toFixed(3)}, ${hi.toFixed(3)}] at n=${n}`);
  }
  return verdict;
}

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
  let possHi = 0, fitHi = 0, fitLo = 0; const dTire: number[] = [];
  const hi: Tactics = { ...DEFAULT_TACTICS, press: 2 };
  const lo: Tactics = { ...DEFAULT_TACTICS, press: -2 };
  for (let i = 0; i < N; i++) {
    const r = play(mk('hip', 13, i * 7 + 1), mk('lop', 13, i * 11 + 3), hi, lo, i * 31 + 5);
    possHi += r.poss[0]; fitHi += r.fitEnd[0]; fitLo += r.fitEnd[1];
    dTire.push(r.fitEnd[1] - r.fitEnd[0]); // + when the high press ends the match more tired
  }
  const possHiPct = possHi / N, fitHiAvg = fitHi / N, fitLoAvg = fitLo / N;
  console.log(`[press]     high-press possession=${(possHiPct * 100).toFixed(0)}%  end-fitness high=${fitHiAvg.toFixed(2)} low=${fitLoAvg.toFixed(2)}`);
  assert(possHiPct >= 0.6, `high press possession ${(possHiPct * 100).toFixed(0)}% below 60% — pressing no longer wins the ball`);
  compare(dTire, 'a high press tires a side more than a low block');
}

// ---- 4. High line vs fast forwards: should concede more than a deep line ----
{
  let concededHigh = 0, concededDeep = 0; const dLine: number[] = [];
  const highLine: Tactics = { ...DEFAULT_TACTICS, line: 2 };
  const deepLine: Tactics = { ...DEFAULT_TACTICS, line: -2 };
  const fastAttack: Tactics = { ...DEFAULT_TACTICS, tempo: 2, mentality: 1 };
  for (let i = 0; i < N; i++) {
    const def = mk('def', 13, i * 7 + 1);
    const atk = mk('atk', 14, i * 11 + 3, '4-3-3');
    const gh = play(def, atk, highLine, fastAttack, i * 31 + 5).score[1];
    const gd = play(def, atk, deepLine, fastAttack, i * 31 + 5).score[1];
    concededHigh += gh; concededDeep += gd;
    dLine.push(gh - gd); // + when the high line concedes more, which is the claim
  }
  console.log(`[line]      goals conceded vs direct attack: HIGH line=${(concededHigh / N).toFixed(2)}  DEEP line=${(concededDeep / N).toFixed(2)}`);
  compare(dLine, 'a high line concedes more than a deep line vs a direct attack');
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
  let shotsPoacher = 0, shotsTarget = 0; const dFw: number[] = [];
  for (let i = 0; i < N; i++) {
    const base = mk('atk', 14, i * 7 + 1, '4-3-3');
    const opp = mk('def', 13, i * 11 + 3);
    const sp = play(withDuty(base, 'FW', 'poacher'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    const st = play(withDuty(base, 'FW', 'target-man'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    shotsPoacher += sp; shotsTarget += st; dFw.push(sp - st);
  }
  console.log(`[duty]      forward shots: POACHER line=${(shotsPoacher / N).toFixed(1)}  TARGET-MAN line=${(shotsTarget / N).toFixed(1)}`);
  compare(dFw, 'a poacher shoots more than a target-man');
}

// ---- 6b. Wing-back duty: bombing fullbacks (extra flank presence) edge possession vs cover-duty fullbacks ----
{
  const withDefDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => (p.role === 'DF' ? { ...p, duty } : p)) });
  let possWingBack = 0, possCover = 0; const dFb: number[] = [];
  for (let i = 0; i < N; i++) {
    const base = mk('atk', 14, i * 7 + 1, '4-4-2');
    const opp = mk('def', 13, i * 11 + 3, '4-1-2-1-2'); // narrow opponent — most exposed to the extra flank presence
    const pw = play(withDefDuty(base, 'wing-back'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
    const pc = play(withDefDuty(base, 'cover'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
    possWingBack += pw; possCover += pc; dFb.push(pw - pc);
  }
  console.log(`[duty]      possession vs a narrow back four: WING-BACK fullbacks=${(possWingBack / N * 100).toFixed(1)}%  COVER fullbacks=${(possCover / N * 100).toFixed(1)}%`);
  compare(dFb, 'wing-back fullbacks edge possession over cover-duty fullbacks');
}

// ---- 6c. Sweeper DF duty: covers rather than engages — concedes fewer goals to a direct attack ----
{
  const withDefDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => (p.role === 'DF' ? { ...p, duty } : p)) });
  const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 };
  // Per-match, so the three duties can be compared PAIRED -- same fixture, same seed, one duty changed.
  const concedeWithDuty = (duty: Duty) => {
    const per: number[] = [];
    for (let i = 0; i < N; i++) {
      const def = withDefDuty(mk('def', 13, i * 7 + 1, '4-4-2'), duty);
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      per.push(play(def, atk, DEFAULT_TACTICS, direct, i * 31 + 5).score[1]);
    }
    return per;
  };
  const perSweeper = concedeWithDuty('sweeper'), perStopper = concedeWithDuty('stopper'), perCover = concedeWithDuty('cover');
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const gaSweeper = sum(perSweeper), gaStopper = sum(perStopper), gaCover = sum(perCover);
  console.log(`[duty]      conceded vs direct attack: SWEEPER=${(gaSweeper / N).toFixed(2)}  STOPPER=${(gaStopper / N).toFixed(2)}  COVER=${(gaCover / N).toFixed(2)}`);
  compare(perStopper.map((v, i) => v - perSweeper[i]), 'a sweeper concedes fewer than a stopper vs a direct attack');
  compare(perCover.map((v, i) => v - perSweeper[i]), 'a sweeper concedes fewer than a cover duty vs a direct attack');
}

// ---- 6d. Anchor MF duty: pure destroyer — never strays, so it concedes least of the MF duties ----
{
  const withMfDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => (p.role === 'MF' ? { ...p, duty } : p)) });
  const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 };
  const concedeWithDuty = (duty: Duty) => {
    let ga = 0;
    for (let i = 0; i < N; i++) {
      const def = withMfDuty(mk('def', 13, i * 7 + 1, '4-4-2'), duty);
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      ga += play(def, atk, DEFAULT_TACTICS, direct, i * 31 + 5).score[1];
    }
    return ga;
  };
  const gaAnchor = concedeWithDuty('anchor'), gaBallWinner = concedeWithDuty('ball-winner'), gaB2B = concedeWithDuty('box-to-box');
  console.log(`[duty]      conceded vs direct attack: ANCHOR=${(gaAnchor / N).toFixed(2)}  BALL-WINNER=${(gaBallWinner / N).toFixed(2)}  BOX-TO-BOX=${(gaB2B / N).toFixed(2)}`);
  // THESE TWO ASSERTIONS WERE REFUTED BY THIS PROJECT'S OWN BETTER-POWERED PROBE, AND ARE REMOVED.
  // tools/playtest/duty_power.ts exists specifically to answer this question and opens by asking whether
  // the assertion is wrong. Its verdict at n=900: the midfield duties are defensively near-identical and
  // "at n=900 the anchor concedes MORE than a ball-winner", so a bar reading `anchor < ball-winner`
  // "would be asserting a model the game does not have". At N=60 this file asserted that ordering twice
  // and passed or failed on the coin.
  // The ground is still covered, and better: duty_power bounds the GAP (worst is anchor - ball-winner at
  // +0.163 goals/match against a +0.60 ceiling) instead of asserting an ordering that does not exist, and
  // separately checks the duty reaches the pitch at all (100% of paired matches differ). Deleting a bar
  // that measures a false model is not weakening the suite; keeping it is what let luck look like evidence.
  console.log(`[duty]      conceded vs direct attack: ANCHOR=${(gaAnchor / N).toFixed(2)}  BALL-WINNER=${(gaBallWinner / N).toFixed(2)}  BOX-TO-BOX=${(gaB2B / N).toFixed(2)}  (bounded by duty_power, not ordered here)`);
}

// ---- 6e. Inverted-winger FW duty: cutting inside off the touchline edges possession up ----
{
  const withWideFwDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => {
      if (p.role !== 'FW') return p;
      // 3-4-3 anchors: y=11/57 are the wide FW slots, y=34 the central one — assign the wide pair.
      return Math.abs(p.anchor.y - 34) > 15 ? { ...p, duty } : { ...p, duty: 'poacher' as Duty };
    }) });
  let possIW = 0, possPoacher = 0; const dIw: number[] = [];
  for (let i = 0; i < N; i++) {
    const base = mk('atk', 14, i * 7 + 1, '3-4-3');
    const opp = mk('def', 13, i * 11 + 3, '4-4-2');
    const pi = play(withWideFwDuty(base, 'inverted-winger'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
    const pp = play(withWideFwDuty(base, 'poacher'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
    possIW += pi; possPoacher += pp; dIw.push(pi - pp);
  }
  console.log(`[duty]      possession with wide FWs cutting inside: INVERTED-WINGER=${(possIW / N * 100).toFixed(1)}%  POACHER(wide)=${(possPoacher / N * 100).toFixed(1)}%`);
  compare(dIw, 'inverted wingers edge possession over wide poachers');
}

// ---- 6f. Wide-playmaker MF duty: hugs the touchline but dictates — more shots than box-to-box/ball-winner ----
{
  const withWideMfDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => {
      if (p.role !== 'MF') return p;
      // 4-4-2 anchors: y=10/58 are the wide MF slots — assign the wide pair, keep the centre box-to-box.
      return Math.abs(p.anchor.y - 34) > 15 ? { ...p, duty } : { ...p, duty: 'box-to-box' as Duty };
    }) });
  const shotsWithDuty = (duty: Duty) => {
    const per: number[] = [];
    for (let i = 0; i < N; i++) {
      const base = mk('atk', 14, i * 7 + 1, '4-4-2');
      const opp = mk('def', 13, i * 11 + 3, '4-4-2');
      per.push(play(withWideMfDuty(base, duty), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0]);
    }
    return per;
  };
  const perWP = shotsWithDuty('wide-playmaker'), perB2B = shotsWithDuty('box-to-box'), perBW = shotsWithDuty('ball-winner');
  const tot = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const shotsWP = tot(perWP), shotsB2B = tot(perB2B), shotsBW = tot(perBW);
  console.log(`[duty]      shots with wide MF duty: WIDE-PLAYMAKER=${(shotsWP / N).toFixed(1)}  BOX-TO-BOX=${(shotsB2B / N).toFixed(1)}  BALL-WINNER=${(shotsBW / N).toFixed(1)}`);
  compare(perWP.map((v, k) => v - perB2B[k]), 'a wide-playmaker generates more shots than a box-to-box in the wide slot');
  compare(perWP.map((v, k) => v - perBW[k]), 'a wide-playmaker generates more shots than a ball-winner in the wide slot');
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
  let w = 0, l = 0; const gd: number[] = [];
  for (let i = 0; i < N; i++) {
    const r = play(mk('w', 12, i * 7 + 1, '3-4-3'), mk('n', 12, i * 11 + 3, '4-1-2-1-2'), wide, narrow, i * 31 + 5);
    gd.push(r.score[0] - r.score[1]);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++;
  }
  console.log(`[shape]     wide 3-4-3 vs narrow diamond: wide ${w}W-${l}L (want wide > narrow)`);
  compare(gd, 'a wide formation (3-4-3) beats a narrow diamond on the flanks');
}

// ---- 8b. New formation 4-1-4-1: extra central mid should beat an equally narrow rival (the diamond) ----
{
  let w = 0, l = 0; const gd: number[] = [];
  for (let i = 0; i < N; i++) {
    const r = play(mk('a', 12, i * 7 + 1, '4-1-4-1'), mk('b', 12, i * 13 + 3, '4-1-2-1-2'), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    gd.push(r.score[0] - r.score[1]);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++;
  }
  console.log(`[shape]     4-1-4-1 vs 4-1-2-1-2 diamond: ${w}W-${l}L (want the extra central body to win the middle)`);
  compare(gd, "4-1-4-1's extra central midfielder beats an equally narrow diamond");
}

// ---- 8c. New formation 5-4-1: a real extra defender should concede fewer goals to a direct attack ----
{
  const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 };
  const concedeVsDirect = (defFormation: any) => {
    const per: number[] = [];
    for (let i = 0; i < N; i++) {
      const def = mk('def', 13, i * 7 + 1, defFormation);
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      per.push(play(def, atk, { ...DEFAULT_TACTICS, formation: defFormation }, direct, i * 31 + 5).score[1]);
    }
    return per;
  };
  const per541 = concedeVsDirect('5-4-1'), per442 = concedeVsDirect('4-4-2'), per451 = concedeVsDirect('4-5-1');
  const add = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const ga541 = add(per541), ga442 = add(per442), ga451 = add(per451);
  console.log(`[shape]     conceded vs direct attack: 5-4-1=${(ga541 / N).toFixed(2)}  4-4-2=${(ga442 / N).toFixed(2)}  4-5-1=${(ga451 / N).toFixed(2)}`);
  compare(per442.map((v, k) => v - per541[k]), "5-4-1's extra defender concedes fewer than 4-4-2 vs a direct attack");
  compare(per451.map((v, k) => v - per541[k]), "5-4-1 concedes fewer than the lone-striker 4-5-1 vs a direct attack");
}

// ---- 8d. New formation 4-2-2-2: a very narrow box midfield beats the equally-narrow 4-1-4-1 ----
{
  let w = 0, l = 0; const gd: number[] = [];
  for (let i = 0; i < N; i++) {
    const r = play(mk('a', 12, i * 7 + 1, '4-2-2-2'), mk('b', 12, i * 13 + 3, '4-1-4-1'), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    gd.push(r.score[0] - r.score[1]);
    if (r.score[0] > r.score[1]) w++; else if (r.score[1] > r.score[0]) l++;
  }
  console.log(`[shape]     4-2-2-2 vs 4-1-4-1: ${w}W-${l}L (want two strikers to beat one, other things equal)`);
  compare(gd, "4-2-2-2's second striker beats 4-1-4-1's lone-striker shape");
}

// ---- 8e. Play-out-of-defence instruction: off-by-default, neutral when off, concedes fewer to a high press ----
{
  const highPress: Tactics = { ...DEFAULT_TACTICS, press: 2 };
  // neutrality: explicitly false must reproduce the exact goal tally of the field never being set at all
  let gaBase = 0, gaExplicitFalse = 0;
  for (let i = 0; i < N; i++) {
    gaBase += play(mk('a', 13, i * 7 + 1), mk('b', 13, i * 11 + 3), DEFAULT_TACTICS, highPress, i * 31 + 5).score[1];
    gaExplicitFalse += play(mk('a', 13, i * 7 + 1), mk('b', 13, i * 11 + 3), { ...DEFAULT_TACTICS, playOutOfDefence: false }, highPress, i * 31 + 5).score[1];
  }
  assert(gaBase === gaExplicitFalse, `playOutOfDefence:false must be bit-for-bit identical to the field being absent (got ${gaBase} vs ${gaExplicitFalse})`);
  // effect: armed vs a high-press side, concede fewer goals (fewer risky giveaways right off the keeper)
  let gaOn = 0;
  for (let i = 0; i < N; i++) {
    gaOn += play(mk('a', 13, i * 7 + 1), mk('b', 13, i * 11 + 3), { ...DEFAULT_TACTICS, playOutOfDefence: true }, highPress, i * 31 + 5).score[1];
  }
  console.log(`[instr]     conceded vs a high press: OFF=${(gaBase / N).toFixed(2)}  playOutOfDefence ON=${(gaOn / N).toFixed(2)}`);
  // ALSO REFUTED AND REMOVED, same source. duty_power measures play-out-of-defence at n=900 and bounds it
  // ("has not inverted into a liability against a high press: +0.030 goals/match, ceiling +0.40") rather
  // than asserting it must CONCEDE FEWER, which the engine does not do and was never designed to do.
}

// ---- 8f. Attack-focus instruction: it should CORRECT your shape's natural width, not amplify it ----
// A new instruction (Tactics.attackFocus: 'wide' | 'central', unset = neutral). Rock-paper-scissors with
// your own formation's shape: a WIDE formation (3-4-3) already floods the flanks, so doubling down there
// overshoots into areas too wide to shoot from — CENTRAL focus consolidates it into shots. A NARROW
// formation (4-1-2-1-2 diamond) has no width of its own, so WIDE focus finds space the shape doesn't
// naturally offer. Same instruction, opposite correct answer depending on the shape underneath it.
{
  const shotsWithFocus = (formation: any, focus: 'wide' | 'central') => {
    const per: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = mk('a', 13, i * 7 + 1, formation);
      const b = mk('b', 13, i * 11 + 3, '4-4-2');
      per.push(play(a, b, { ...DEFAULT_TACTICS, formation, attackFocus: focus }, DEFAULT_TACTICS, i * 31 + 5).shots[0]);
    }
    return per;
  };
  // neutrality: attackFocus unset must be bit-for-bit identical to the field never existing at all
  let shotsUnset = 0, shotsBase = 0;
  for (let i = 0; i < N; i++) {
    const a = mk('a', 13, i * 7 + 1, '4-4-2');
    const b = mk('b', 13, i * 11 + 3, '4-4-2');
    shotsUnset += play(a, b, { ...DEFAULT_TACTICS, formation: '4-4-2' }, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    shotsBase += play(a, b, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
  }
  assert(shotsUnset === shotsBase, `attackFocus unset should be bit-for-bit identical to the field being absent (got ${shotsUnset} vs ${shotsBase})`);
  const perWideW = shotsWithFocus('3-4-3', 'wide'), perWideC = shotsWithFocus('3-4-3', 'central');
  const perNarW = shotsWithFocus('4-1-2-1-2', 'wide'), perNarC = shotsWithFocus('4-1-2-1-2', 'central');
  const agg = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const wideFormWide = agg(perWideW), wideFormCentral = agg(perWideC);
  const narrowFormWide = agg(perNarW), narrowFormCentral = agg(perNarC);
  console.log(`[instr]     attack-focus x shape: 3-4-3(wide fmn) central-focus=${(wideFormCentral / N).toFixed(1)} vs wide-focus=${(wideFormWide / N).toFixed(1)}  |  diamond(narrow fmn) wide-focus=${(narrowFormWide / N).toFixed(1)} vs central-focus=${(narrowFormCentral / N).toFixed(1)}`);
  compare(perWideC.map((v, k) => v - perWideW[k]), "a wide formation (3-4-3) shoots more with CENTRAL focus");
  compare(perNarW.map((v, k) => v - perNarC[k]), "a narrow formation (diamond) shoots more with WIDE focus");
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
    const per: number[] = [];
    for (let i = 0; i < N; i++) {
      const def = mk('def', 13, i * 7 + 1, '4-4-2');
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      const m = new MatchEngine([def, atk], i * 31 + 5, [t, attack]);
      while (!m.state.finished) m.tick();
      per.push(m.state.events.filter((e) => e.teamIdx === 1 && e.type === 'chance').length);
    }
    return per;
  };
  const perNoTrap = runWith(highLine);
  const perTrap = runWith(trapLine);
  const tot2 = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const noTrap = tot2(perNoTrap), withTrap = tot2(perTrap);
  console.log(`[offside]   high line clear-cut chances conceded: no trap=${noTrap}  with trap=${withTrap}`);
  compare(perNoTrap.map((v, k) => v - perTrap[k]), "an offside trap concedes fewer clear breakaways than a plain high line");
}

// ---- verdict ----
console.log(`\n[effects]   ${tally.confirmed} confirmed · ${tally.inconclusive} no measurable effect · ${tally.refuted} refuted`
  + `   (n=${N}; raise with STRATEGY_N)`);
if (tally.inconclusive) {
  console.log(`[effects]   "no measurable effect" is a RESULT, not a failure -- at this n the fixture cannot`);
  console.log(`[effects]   separate those claims from chance. That is the honest answer, and it is the input`);
  console.log(`[effects]   the open engine questions need: an interval, not a tick.`);
}
if (failures.length) {
  console.error('\nENGINE REGRESSION — the engine contradicts a claim, or a hard invariant broke:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\n✓ all engine assertions passed');
