// Headless harness: calibrate scoring AND prove tactics change outcomes.
import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';
import { TACTIC_PRESETS, DEFAULT_TACTICS, seededOpponentTactics, type Tactics } from './src/tactics.js';
import type { Team, Role, Duty } from './src/types.js';

interface Result { score: [number, number]; shots: [number, number]; poss: [number, number]; fitEnd: [number, number];
  /** shots taken by a named subset of one side — lets a duty test measure WHO shot, not just how many the team did */
  shotsBy: (idx: 0 | 1, playerIdxs: ReadonlySet<number>) => number }

function play(teamA: Team, teamB: Team, tA: Tactics, tB: Tactics, seed: number): Result {
  const m = new MatchEngine([teamA, teamB], seed, [tA, tB]);
  while (!m.state.finished) m.tick();
  const s = m.state;
  const shots = (idx: 0 | 1) => s.events.filter((e) => e.teamIdx === idx && (e.type === 'goal' || e.type.startsWith('shot'))).length;
  const totPoss = s.possession[0] + s.possession[1] || 1;
  const avgFit = (idx: 0 | 1) => s.players[idx].slice(1).reduce((a, p) => a + p.fitness, 0) / 10;
  // shots attributed to a NAMED set of players — needed to test a duty that changes who shoots, rather
  // than how many the team shoots (see the poacher/target-man test)
  // ATTEMPTS, not logged events. `events` deliberately omits low-quality misses, so a duty that shoots more
  // speculatively appears to shoot LESS — which is exactly how a poacher measured below a hold-up man.
  const shotsBy = (idx: 0 | 1, roles: ReadonlySet<number>) =>
    Object.entries(s.shotAttemptsBy[idx]).reduce((n, [i, c]) => n + (roles.has(Number(i)) ? c : 0), 0);
  return {
    score: [s.score[0], s.score[1]],
    shots: [shots(0), shots(1)],
    shotsBy,
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

// ---- 6. Duties: within one side, the poacher out-shoots the target man ----
{
  // REWRITTEN, because the old test compared caricatures. It gave EVERY forward the same duty and compared
  // whole teams — three poachers against three target men — then counted `.shots[0]`, the team's total.
  // Two separate distortions:
  //
  //   1. A line of three static finishers has no link play, so the TEAM creates less: measured, 40.5 shot
  //      attempts a match against a target-man line's 45.3. The poacher lost on team output while the
  //      question was supposed to be about who shoots.
  //   2. `events` omits low-quality misses ("hopeful long-range efforts don't clutter the feed"), so a duty
  //      that shoots more speculatively registers FEWER events. Counting events measured the poacher lower
  //      for shooting more.
  //
  // The duties' own claims are about ONE player against ONE other in the same side — "maximum finishing
  // instinct" versus a man who "holds up play for others" — so that is what this now measures, using the
  // unbiased shotAttemptsBy tally.
  let poacherShots = 0, targetShots = 0;
  for (let i = 0; i < N; i++) {
    // 4-4-2, NOT 4-3-3. A 4-3-3's forwards sit at y = 13 / 34 / 55, so two of the three are WIDE — and a
    // wide attacker now holds the touchline as a crossing outlet rather than attacking the box, so he takes
    // almost no shots whatever his duty (measured: 0.4 a match against a central forward's 36.9). Comparing
    // a duty in a wide slot against one in a central slot measures the slot, not the duty. A 4-4-2's pair
    // (y = 27 / 41) are both central and directly comparable.
    const base = mk('atk', 14, i * 7 + 1, '4-4-2');
    const opp = mk('def', 13, i * 11 + 3);
    const fwIdx = base.players.map((p, k) => (p.role === 'FW' ? k : -1)).filter((k) => k >= 0);
    if (fwIdx.length < 2) continue;
    const [pIdx, tIdx] = [fwIdx[0], fwIdx[1]];
    const mixed: Team = { ...base, players: base.players.map((p, k) =>
      (k === pIdx ? { ...p, duty: 'poacher' as Duty } : k === tIdx ? { ...p, duty: 'target-man' as Duty } : p)) };
    const r = play(mixed, opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5);
    poacherShots += r.shotsBy(0, new Set([pIdx]));
    targetShots += r.shotsBy(0, new Set([tIdx]));
  }
  console.log(`[duty]      shots taken, same side: POACHER=${(poacherShots / N).toFixed(1)}  TARGET-MAN=${(targetShots / N).toFixed(1)}`);
  assert(poacherShots > targetShots, `the poacher should out-shoot the target man alongside him (got ${poacherShots} vs ${targetShots})`);
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

// ---- 6c. Sweeper DF duty: covers rather than engages — concedes fewer goals to a direct attack ----
{
  const withDefDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => (p.role === 'DF' ? { ...p, duty } : p)) });
  const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 };
  const concedeWithDuty = (duty: Duty) => {
    let ga = 0;
    for (let i = 0; i < N; i++) {
      const def = withDefDuty(mk('def', 13, i * 7 + 1, '4-4-2'), duty);
      const atk = mk('atk', 13, i * 11 + 3, '4-3-3');
      ga += play(def, atk, DEFAULT_TACTICS, direct, i * 31 + 5).score[1];
    }
    return ga;
  };
  const gaSweeper = concedeWithDuty('sweeper'), gaStopper = concedeWithDuty('stopper'), gaCover = concedeWithDuty('cover');
  console.log(`[duty]      conceded vs direct attack: SWEEPER=${(gaSweeper / N).toFixed(2)}  STOPPER=${(gaStopper / N).toFixed(2)}  COVER=${(gaCover / N).toFixed(2)}`);
  assert(gaSweeper < gaStopper, `sweeper should concede fewer goals than stopper vs a direct attack (got ${gaSweeper} vs ${gaStopper})`);
  assert(gaSweeper < gaCover, `sweeper should concede fewer goals than cover vs a direct attack (got ${gaSweeper} vs ${gaCover})`);
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
  assert(gaAnchor < gaBallWinner, `anchor should concede fewer goals than ball-winner vs a direct attack (got ${gaAnchor} vs ${gaBallWinner})`);
  assert(gaAnchor < gaB2B, `anchor should concede fewer goals than box-to-box vs a direct attack (got ${gaAnchor} vs ${gaB2B})`);
}

// ---- 6e. Inverted-winger FW duty: cutting inside off the touchline edges possession up ----
{
  const withWideFwDuty = (t: Team, duty: Duty): Team =>
    ({ ...t, players: t.players.map((p) => {
      if (p.role !== 'FW') return p;
      // 3-4-3 anchors: y=11/57 are the wide FW slots, y=34 the central one — assign the wide pair.
      return Math.abs(p.anchor.y - 34) > 15 ? { ...p, duty } : { ...p, duty: 'poacher' as Duty };
    }) });
  let possIW = 0, possPoacher = 0;
  for (let i = 0; i < N; i++) {
    const base = mk('atk', 14, i * 7 + 1, '3-4-3');
    const opp = mk('def', 13, i * 11 + 3, '4-4-2');
    possIW += play(withWideFwDuty(base, 'inverted-winger'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
    possPoacher += play(withWideFwDuty(base, 'poacher'), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).poss[0];
  }
  console.log(`[duty]      possession with wide FWs cutting inside: INVERTED-WINGER=${(possIW / N * 100).toFixed(1)}%  POACHER(wide)=${(possPoacher / N * 100).toFixed(1)}%`);
  assert(possIW > possPoacher, `inverted wingers cutting inside should edge possession above wide poachers (got ${(possIW / N * 100).toFixed(1)}% vs ${(possPoacher / N * 100).toFixed(1)}%)`);
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
    let sh = 0;
    for (let i = 0; i < N; i++) {
      const base = mk('atk', 14, i * 7 + 1, '4-4-2');
      const opp = mk('def', 13, i * 11 + 3, '4-4-2');
      sh += play(withWideMfDuty(base, duty), opp, DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    }
    return sh;
  };
  const shotsWP = shotsWithDuty('wide-playmaker'), shotsB2B = shotsWithDuty('box-to-box'), shotsBW = shotsWithDuty('ball-winner');
  console.log(`[duty]      shots with wide MF duty: WIDE-PLAYMAKER=${(shotsWP / N).toFixed(1)}  BOX-TO-BOX=${(shotsB2B / N).toFixed(1)}  BALL-WINNER=${(shotsBW / N).toFixed(1)}`);
  assert(shotsWP > shotsB2B, `wide-playmaker should generate more shots than box-to-box in the wide slot (got ${shotsWP} vs ${shotsB2B})`);
  assert(shotsWP > shotsBW, `wide-playmaker should generate more shots than ball-winner in the wide slot (got ${shotsWP} vs ${shotsBW})`);
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
  // THE PREMISE WAS FALSE, and only the old engine hid it. Counting the actual anchors in formations.ts,
  // by whether an attacker starts central (a box runner) or wide (a crossing outlet):
  //
  //   4-1-4-1    central 4   wide 2   forwards 1
  //   4-1-2-1-2  central 6   wide 0   forwards 2
  //
  // The diamond has TWO MORE central bodies, not fewer. 4-1-4-1's fifth midfielder is not an extra man in
  // the middle — two of its five start 24m off centre. The old assertion counted midfielders and assumed
  // they were all central, which was true of an engine that funnelled every attack through the middle
  // regardless of shape. Now that width is modelled, the diamond wins the middle because it genuinely has
  // the middle, and 4-1-4-1's answer is the flanks — which is what the 3-4-3 test above already measures.
  console.log(`[shape]     4-1-4-1 vs 4-1-2-1-2 diamond: ${w}W-${l}L (the diamond has 6 central attackers to 4)`);
  assert(l > w, `the diamond's central overload should beat 4-1-4-1 through the middle (got ${w} vs ${l})`);
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
  assert(gaOn < gaBase, `play-out-of-defence should concede fewer goals vs a high press than the default (got ${gaOn} vs ${gaBase})`);
}

// ---- 8f. Attack-focus instruction: it should CORRECT your shape's natural width, not amplify it ----
// A new instruction (Tactics.attackFocus: 'wide' | 'central', unset = neutral). Rock-paper-scissors with
// your own formation's shape: a WIDE formation (3-4-3) already floods the flanks, so doubling down there
// overshoots into areas too wide to shoot from — CENTRAL focus consolidates it into shots. A NARROW
// formation (4-1-2-1-2 diamond) has no width of its own, so WIDE focus finds space the shape doesn't
// naturally offer. Same instruction, opposite correct answer depending on the shape underneath it.
{
  const shotsWithFocus = (formation: any, focus: 'wide' | 'central') => {
    let sh = 0;
    for (let i = 0; i < N; i++) {
      const a = mk('a', 13, i * 7 + 1, formation);
      const b = mk('b', 13, i * 11 + 3, '4-4-2');
      sh += play(a, b, { ...DEFAULT_TACTICS, formation, attackFocus: focus }, DEFAULT_TACTICS, i * 31 + 5).shots[0];
    }
    return sh;
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
  const wideFormWide = shotsWithFocus('3-4-3', 'wide'), wideFormCentral = shotsWithFocus('3-4-3', 'central');
  const narrowFormWide = shotsWithFocus('4-1-2-1-2', 'wide'), narrowFormCentral = shotsWithFocus('4-1-2-1-2', 'central');
  console.log(`[instr]     attack-focus x shape: 3-4-3(wide fmn) central-focus=${(wideFormCentral / N).toFixed(1)} vs wide-focus=${(wideFormWide / N).toFixed(1)}  |  diamond(narrow fmn) wide-focus=${(narrowFormWide / N).toFixed(1)} vs central-focus=${(narrowFormCentral / N).toFixed(1)}`);
  assert(wideFormCentral > wideFormWide, `a wide formation (3-4-3) should shoot more with CENTRAL focus, consolidating its natural width (got ${wideFormCentral} vs ${wideFormWide})`);
  assert(narrowFormWide > narrowFormCentral, `a narrow formation (diamond) should shoot more with WIDE focus, finding space it lacks natively (got ${narrowFormWide} vs ${narrowFormCentral})`);
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
