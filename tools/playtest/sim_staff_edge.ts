// A COACH YOU PAID FOR MUST COACH THE MATCHES YOU DO NOT WATCH.
//
// The club sells three backroom specialists for 1,200 coins between them, on cards that promise "a small
// finishing edge, home and away" and "a small all-round edge every match". The played path pays out on
// that: fitness → conditioning ×0.95, attack → homeBoost ×1.03, assistant → homeBoost ×1.02 and
// conditioning ×0.98. simOneFixture — the path that plays every SIMMED league fixture — applied the
// facility edges through the same shared curves and then stopped. There was no `staff` in the function at
// all, so a manager who bought all three got nothing for them in any fixture he simmed, and the same
// season played and simmed ran two different squads' worth of edge.
//
// It hid because the roll it replaced still handles them. `simEdge` folds the same three coaches into a
// strength delta and simRemainingFixtures computes it on every matchday — but only READS it in the `else`,
// the fallback for a squad too thin to field an XI. The staff-aware numbers were computed and thrown away
// on every normal matchday, which is the shape that makes dead wiring invisible: the code is there, it
// runs, and nothing consumes it.
//
// Three things are guarded, because fixing one without the others is how this happened:
//   1. the PLAYED path still pays the coaches at all — otherwise "the two agree" agrees about nothing;
//   2. PARITY — the simmed path applies the same three coaches, by the same factors;
//   3. TEETH — those factors are handed to the real engine and change the ninety minutes.
//
// Both blocks are lifted out of client/src/main.ts and EVALUATED, not pattern-matched: a
// `staff.includes('attack')` that multiplied by 1.0 would satisfy any grep and change nothing.
//
// On the size of it, because this moves simmed results and that is a balance change: it is a small one.
// Over 240 full simmed seasons at tier 5, hiring all three moved the table by -0.40 +/- 0.42 points a
// season -- not distinguishable from zero, and bounded well inside one league place. The cleanest reading
// of the edge itself, 2,500 matches per arm with identical elevens, puts its ceiling at about +0.12 ppg,
// or +2 points across an eighteen-fixture season. Either way it is the same edge the PLAYED path has been
// handing out all along; what changes is only that simming a season stops quietly confiscating it.
//
// Points are a noisy way to read an edge that small, so (3) reads it where homeBoost actually lives --
// shot volume -- and reports points only as context.
//
// Run: `npx tsx tools/playtest/sim_staff_edge.ts`
import { readFileSync } from 'node:fs';
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS,
         trainingConditioning, fanHomeBoost, dataEdge, HOME_EDGE } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

console.log('=== The backroom staff coach the simmed fixtures too ===');

const src = readFileSync('client/src/main.ts', 'utf8');

/** One method of the app class, from its declaration to the next one. */
function method(decl: string): string {
  const n = src.split(decl).length - 1;
  ok(n === 1, `\`${decl}\` appears exactly once in client/src/main.ts (found ${n})`);
  if (n !== 1) { console.log('\n✗ could not find the two match paths — renamed?'); process.exit(1); }
  const a = src.indexOf(decl), b = src.indexOf('\n  private ', a + decl.length);
  return src.slice(a, b < 0 ? src.length : b);
}
/** ...and the edge block inside it, between its first and last landmark, ready for `new Function`. */
function span(body: string, from: string, to: string, what: string): string {
  const a = body.indexOf(from), b = body.indexOf(to, a + 1);
  ok(a >= 0 && b > a, `the ${what} path's edge block is where it was`);
  if (!(a >= 0 && b > a)) { console.log('\n✗ could not lift the edge blocks — moved?'); process.exit(1); }
  return body.slice(a, b).replace(/\bthis\./g, 'self.');
}

const simBlock = span(method('private simOneFixture('), 'myTeam.homeBoost = 1.04;', 'const iAmHome', 'simmed');
const playBlock = span(method('private startSpMatchWith('), 'const staff = ', 'const oppTeam = buildXI(', 'played');

const simEdges = new Function('myTeam', 'oppTeam', 'venue', 'self',
  'trainingConditioning', 'fanHomeBoost', 'dataEdge', 'HOME_EDGE', simBlock) as
  (m: any, o: any, v: string, s: any, tc: any, fh: any, de: any, he: number) => void;
const playEdges = new Function('myTeam', 'self', playBlock) as (m: any, s: any) => void;

type Fac = { training: number; fanzone: number; data: number };
const L1: Fac = { training: 1, fanzone: 1, data: 1 };
/** What the SIMMED path hands the engine. AWAY, so myTeam carries no venue term and the only thing
 *  separating two calls here is the coaching. */
function simmed(staff: string[], fac: Fac = L1) {
  const myTeam: any = { homeBoost: 1, conditioning: 1 }, oppTeam: any = { homeBoost: 1 };
  simEdges(myTeam, oppTeam, 'away', { facLevels: fac, loadMgr: () => ({ staff }) },
    trainingConditioning, fanHomeBoost, dataEdge, HOME_EDGE);
  return { boost: myTeam.homeBoost as number, cond: myTeam.conditioning as number };
}
/** ...and what the PLAYED path hands it, from the same starting numbers. */
function played(staff: string[]) {
  const myTeam: any = { homeBoost: 1, conditioning: 1 };
  playEdges(myTeam, { loadMgr: () => ({ staff }) });
  return { boost: myTeam.homeBoost as number, cond: myTeam.conditioning as number };
}

// ── VACUITY GUARD ────────────────────────────────────────────────────────────────────────────────
// Everything below is a ratio against these baselines. If the lifted blocks silently did nothing —
// extraction drifted, `new Function` swallowed the body — every ratio would be 1/1 and every comparison
// would pass by agreeing about nothing. Maxing the facilities has to move the simmed block, and the
// played block has to start from the neutral numbers it is handed.
const simBase = simmed([]), playBase = played([]);
const maxed = simmed([], { training: 5, fanzone: 5, data: 5 });
console.log(`  ..   simmed, no staff, facilities L1 → homeBoost ${simBase.boost.toFixed(4)} · conditioning ${simBase.cond.toFixed(4)}   (L5 → ${maxed.boost.toFixed(4)} · ${maxed.cond.toFixed(4)})`);
ok(maxed.boost !== simBase.boost && maxed.cond !== simBase.cond,
  'the lifted simmed block really runs — maxing the facilities moves both numbers');
ok(playBase.boost === 1 && playBase.cond === 1,
  'and the lifted played block is the staff lines alone, so its output IS the coaching factor');

// ── 1 + 2: the played path pays the coaches, and the simmed path pays them identically ───────────
const COACHES: [string, string][] = [['fitness', 'Fitness Coach'], ['attack', 'Attacking Coach'], ['assistant', 'Assistant Manager']];
for (const [id, name] of COACHES) {
  const p = played([id]), s = simmed([id]);
  const sb = s.boost / simBase.boost, sc = s.cond / simBase.cond;
  console.log(`  ..   ${name.padEnd(17)} played ×${p.boost.toFixed(4)} shots / ×${p.cond.toFixed(4)} drain — simmed ×${sb.toFixed(4)} / ×${sc.toFixed(4)}`);
  ok(!near(p.boost, 1) || !near(p.cond, 1),
    `the ${name} is worth something in a PLAYED match (else the parity check below is vacuous)`);
  ok(near(sb, p.boost) && near(sc, p.cond),
    `the ${name} is worth the same in a SIMMED one (×${sb.toFixed(4)}/×${sc.toFixed(4)} vs ×${p.boost.toFixed(4)}/×${p.cond.toFixed(4)})`);
}
const all = COACHES.map(([id]) => id);
const pAll = played(all), sAll = simmed(all);
const boostF = sAll.boost / simBase.boost, condF = sAll.cond / simBase.cond;
console.log(`  ..   all three (1,200c)  played ×${pAll.boost.toFixed(4)} / ×${pAll.cond.toFixed(4)} — simmed ×${boostF.toFixed(4)} / ×${condF.toFixed(4)}`);
ok(near(boostF, pAll.boost) && near(condF, pAll.cond),
  'a manager who buys the whole backroom gets the whole backroom in a simmed fixture');

// ── 3: TEETH — the factors reach the engine and change the match, without deciding it ────────────
// Identical elevens on both sides, so the only difference between the two arms is the coaching stack the
// simmed path just produced. A staff that changed no scoreline at all would mean the numbers were handed
// over and then dropped inside the engine — the same defect one layer down.
const N = 200, SHOT = new Set(['goal', 'shot_saved', 'shot_missed', 'woodwork']);
function arm(boost: number, cond: number) {
  const lines: string[] = []; let pts = 0, shots = 0;
  for (let i = 0; i < N; i++) {
    const t: any = generateTeam('x', 'X', 0x445566, 12, 7000 + i, '4-4-2');
    const xi: any = buildXI(t, autoPickXI(t, '4-4-2'));
    const e: any = new MatchEngine([{ ...xi, homeBoost: boost, conditioning: cond }, { ...xi }], 9000 + i, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    lines.push(`${e.state.score[0]}-${e.state.score[1]}`);
    pts += e.state.score[0] > e.state.score[1] ? 3 : e.state.score[0] === e.state.score[1] ? 1 : 0;
    for (const ev of e.state.events as any[]) if (ev.teamIdx === 0 && SHOT.has(ev.type)) shots++;
  }
  return { lines, ppg: pts / N, shots: shots / N };
}
const bare = arm(1, 1), staffed = arm(boostF, condF);
const moved = bare.lines.filter((l, i) => l !== staffed.lines[i]).length;
const rise = staffed.shots / bare.shots - 1, dPpg = staffed.ppg - bare.ppg;
console.log(`  ..   ${N} matches, same eleven both sides: ${bare.shots.toFixed(2)} shots/match without the backroom, ${staffed.shots.toFixed(2)} with it (${rise >= 0 ? '+' : ''}${(rise * 100).toFixed(1)}%) — ${moved}/${N} scorelines changed`);
console.log(`  ..   in points: ${bare.ppg.toFixed(3)} → ${staffed.ppg.toFixed(3)} ppg (${dPpg >= 0 ? '+' : ''}${dPpg.toFixed(3)}) — one standard error is ~0.13 ppg at this n, which is why the bars below are on shot volume`);
ok(moved >= N * 0.4, `the coaching reaches the engine (${moved}/${N} matches came out differently)`);
// `homeBoost` IS a shot-probability multiplier, so a ×1.0506 stack has to show up as shot volume — that
// is the least noisy place to read it. Below 2% would mean the numbers arrived and the engine shrugged.
ok(rise > 0.02, `the ×${boostF.toFixed(4)} shows up where homeBoost lives — shot volume (+${(rise * 100).toFixed(1)}%)`);
// And the other side of the bar: 1,200 coins buys an edge, not a promotion. The played path's stack is
// ~5%, so 25% catches someone "fixing" this with a multiplier several times what a played match gives.
ok(rise < 0.25, `but the whole backroom is an edge, not a promotion (+${(rise * 100).toFixed(1)}% shot volume for 1,200 coins)`);

console.log(fails ? `\n✗ ${fails} check(s) failed — a coach you paid for is not coaching the fixtures you sim` : '\n✓ the backroom staff work the same whether you watch the match or sim it');
if (fails) process.exitCode = 1;
