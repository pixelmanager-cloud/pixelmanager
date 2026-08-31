// PASS_REL decides how much a passer's edge over the defence he is playing carries. Too little and squad
// quality stops mattering; too much and a mismatch turns into a cricket score. This measures both ends.
//
// ── AND UNTIL NOW IT MEASURED BOTH ENDS WITHOUT EVER BEING ABLE TO FAIL ──────────────────────────────
// The file printed three lines and exited 0, so `npm run playtest` counted it among the probes that
// "passed" while it was in fact a report nobody was obliged to read. The event it exists to catch has
// already happened once, and slipped through: the match-engine rebuild reverted in
// docs/decisions-for-ck.md §19 turned THIS EXACT FIXTURE from **+1.76 GD, 73% win** into
// **+3.67 GD, 96% win**, and every gate in the repo stayed green while it did.
//
// So §19's table is the calibration source for the bars below, not a guess: the shipped (pre-rebuild)
// engine's column passes every one of them, and the reverted rebuild's column fails four. This is a
// ratchet on a known-GOOD measurement — unlike the box-geometry numbers in §19/§1, nothing here is a
// blessed catastrophe.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 60);

type Pair = { win: number; draw: number; gd: number; gf: number; ga: number; big: number };

const pair = (qa: number, qb: number): Pair => {
  let win = 0, draw = 0, gd = 0, gf = 0, ga = 0, big = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam(`a${i}`, 'A', 'A', 0x1, qa, i * 7 + 1, '4-4-2');
    const b = generateTeam(`b${i}`, 'B', 'B', 0x2, qb, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    if (m.state.score[0] > m.state.score[1]) win++;
    if (m.state.score[0] === m.state.score[1]) draw++;
    if (Math.abs(m.state.score[0] - m.state.score[1]) >= 6) big++;
    gd += m.state.score[0] - m.state.score[1]; gf += m.state.score[0]; ga += m.state.score[1];
  }
  return { win: 100 * win / N, draw: 100 * draw / N, gd: gd / N, gf: gf / N, ga: ga / N, big: 100 * big / N };
};

const show = (label: string, r: Pair) =>
  console.log(`${label}  win=${r.win.toFixed(0)}% GD=${r.gd.toFixed(2)} (${r.gf.toFixed(2)}-${r.ga.toFixed(2)})  draws=${r.draw.toFixed(0)}%  6+goal wins=${r.big.toFixed(1)}%`);

const wide = pair(15, 11);   // a four-point quality gap — the mismatch
const near = pair(14, 12);   // a two-point gap — the gradient in the middle
const level = pair(13, 13);  // equal squads — the control

show('15v11', wide);
show('14v12', near);
show('13v13', level);

// ── THE BARS ────────────────────────────────────────────────────────────────────────────────────────
// Every number below was MEASURED on this build at N=60 and then given room. Re-measured at N=30/100/200
// to size that room, because a bar tight enough to trip on the sampling spread is a bar that gets
// deleted the first time it fires:
//
//              N=30            N=60            N=100           N=200
//   15v11  GD 1.70 win 70%  GD 1.77 win 72%  GD 1.75 win 74%  GD 1.65 win 75%   conceded 0.33-0.43
//   14v12  GD 0.37 win 53%  GD 0.67 win 55%  GD 0.64 win 51%  GD 0.89 win 59%
//   13v13  GD-0.03 win 23%  GD 0.00 win 30%  GD 0.16 win 37%  GD 0.01 win 36%   2.63-2.80 goals/match
//
// 14v12's goal difference is by far the noisiest number here (0.37 to 0.89 over that range), so its bar
// is the loosest of the set — it asks only that a two-point edge still points the right way.
const MIN_GD_WIDE = 1.10;        // measured 1.77 (lowest seen 1.65) — quality has to carry
const MIN_WIN_WIDE = 55;         // measured 72% (lowest seen 70%)
const MAX_GD_WIDE = 2.60;        // measured 1.77 — §19's reverted rebuild scored 3.67 here
const MAX_WIN_WIDE = 88;         // measured 72% — §19's reverted rebuild won 96% here
const MIN_GA_WIDE = 0.15;        // measured 0.33 — the weaker side must still score sometimes
const MIN_GD_NEAR = 0.15;        // measured 0.67 (lowest seen 0.37)
const MIN_GRADIENT = 0.30;       // measured 1.10 (lowest seen 0.76): GD(15v11) - GD(14v12)
const MAX_GD_LEVEL = 0.40;       // measured 0.00 (widest seen 0.16) — equal squads are level
const MIN_WIN_LEVEL = 15;        // measured 30% (lowest seen 23%) — equal games still get decided
const MIN_GOALS = 1.60;          // measured 2.43 / 2.30 / 2.80 (lowest seen 2.03)
const MAX_BIG = 15;              // measured 0% / 0% / 3.3% (highest seen 6.7% at N=30)

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

console.log('');
// ── the "too little" end: if PASS_REL stops carrying, squad quality stops mattering and every transfer,
//    every academy graduate and every wage bill in the game becomes decoration.
check(wide.gd >= MIN_GD_WIDE,
  `a four-point quality edge is worth a goal (GD ${wide.gd.toFixed(2)}, floor ${MIN_GD_WIDE})`);
check(wide.win >= MIN_WIN_WIDE,
  `the better squad wins the mismatch more often than not (${wide.win.toFixed(0)}%, floor ${MIN_WIN_WIDE}%)`);
check(near.gd >= MIN_GD_NEAR,
  `a two-point edge still points the right way (GD ${near.gd.toFixed(2)}, floor ${MIN_GD_NEAR})`);
check(wide.gd - near.gd >= MIN_GRADIENT,
  `a wider gap is worth more than a narrow one (${wide.gd.toFixed(2)} - ${near.gd.toFixed(2)} = ${(wide.gd - near.gd).toFixed(2)}, floor ${MIN_GRADIENT})`);

// ── the "too much" end: this is the §19 regression, and these two are the bars that would have refused
//    the rebuild on the night it landed instead of a fortnight later.
check(wide.gd <= MAX_GD_WIDE,
  `REGRESSION BAR — a mismatch is not a cricket score (GD ${wide.gd.toFixed(2)}, ceiling ${MAX_GD_WIDE}; the reverted §19 rebuild hit 3.67)`);
check(wide.win <= MAX_WIN_WIDE,
  `REGRESSION BAR — a 15v11 is a hard game, not a formality (${wide.win.toFixed(0)}% win, ceiling ${MAX_WIN_WIDE}%; the reverted §19 rebuild hit 96%)`);
check(wide.ga >= MIN_GA_WIDE,
  `the outgunned side still scores (${wide.ga.toFixed(2)} conceded per match, floor ${MIN_GA_WIDE}; the reverted §19 rebuild conceded 0.14)`);

// ── the control, and the direction upper bounds alone cannot see. `division_balance` found a mutation
//    that killed one of the engine's four goal paths and passed every ceiling in the repo, because a
//    league where nobody scores is never a thrashing. So: equal squads must be level, and the match must
//    still be a football match.
check(Math.abs(level.gd) <= MAX_GD_LEVEL,
  `equal squads finish level on aggregate (GD ${level.gd.toFixed(2)}, bound +/-${MAX_GD_LEVEL})`);
check(level.win >= MIN_WIN_LEVEL,
  `an equal fixture still gets decided (${level.win.toFixed(0)}% home wins, floor ${MIN_WIN_LEVEL}%)`);
const leanest = Math.min(...[wide, near, level].map((r) => r.gf + r.ga));
check(leanest >= MIN_GOALS,
  `every pairing is still a football match (leanest ${leanest.toFixed(2)} goals/match, floor ${MIN_GOALS})`);
const worstBig = Math.max(...[wide, near, level].map((r) => r.big));
check(worstBig <= MAX_BIG,
  `six-goal wins stay rare in every pairing (worst ${worstBig.toFixed(1)}%, ceiling ${MAX_BIG}%)`);

console.log(fails
  ? `\n✗ ${fails} mismatch check(s) failed — squad quality no longer converts the way the shipped engine converts it`
  : '\n✓ quality carries, and a mismatch is still a match');
if (fails) process.exit(1);
