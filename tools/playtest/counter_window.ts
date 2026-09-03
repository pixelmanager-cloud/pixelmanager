// THE COUNTER-ATTACK WINDOW ARMS ON A TURNOVER, NOT ON ANY PICKUP.
//
// The engine's own comment states the rule: "possession just turned over in open play ... the winner is on
// the counter for a few seconds." The test was `now !== prevTeam` where `prevTeam = s.carrier?.teamIdx` —
// and on any tick that BEGAN with the ball loose there is no carrier, so prevTeam was `undefined` and the
// comparison was trivially true. Every recovery of a loose ball armed the counter, including by the side
// that had just knocked it loose, with no turnover at any point. In those cases `loser = 1 - now` names a
// team that never had the ball, so the "was he committed high?" test was asked of the wrong side's shape.
//
// Measured at the arming site, both sides set up aggressively so the gate is open: 1,062.0 armings a match
// before, 625.4 after — 41% of every counter in the game was being awarded for a team picking up its own
// loose ball.
//
// WORTH KNOWING WHY NO OTHER PROBE CAUGHT THIS. league_competitiveness, division_balance and attack_reach
// all run DEFAULT_TACTICS, where mentality 0 gives attackPush 6 against a threshold of 9 and line 0 gives
// lineShift 0 against 3. The gate is shut in every one of them, so the counter-attack mechanic is invisible
// to the entire balance suite. This probe is the only thing that opens it.
//
// Run: `npx tsx tools/playtest/counter_window.ts`
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS, deriveMods } from '../../shared/src/tactics.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The counter window opens on a turnover ===');

// deriveMods, not the raw tactics: attackPush = 6 + mentality*3 and lineShift = line*4.5, so a probe that
// passes `attackPush: 10` as an input field sets nothing at all and silently measures a shut gate.
const HIGH = { ...DEFAULT_TACTICS, mentality: 2, line: 1 } as any;
const hm = deriveMods(HIGH), dm = deriveMods(DEFAULT_TACTICS as any);
console.log(`  ..   aggressive: attackPush ${hm.attackPush.toFixed(1)}, lineShift ${hm.lineShift.toFixed(1)}`);
console.log(`  ..   default:    attackPush ${dm.attackPush.toFixed(1)}, lineShift ${dm.lineShift.toFixed(1)}`);
ok(hm.attackPush >= 9 || hm.lineShift >= 3, 'the aggressive shape opens the gate (or this probe measures nothing)');
ok(!(dm.attackPush >= 9 || dm.lineShift >= 3),
   'the DEFAULT shape does NOT — which is why the balance suite never exercises this mechanic');

// Drive real matches and watch the engine's own counter state.
const N = 30;
let armings = 0, looseTicks = 0, ticks = 0;
for (let i = 0; i < N; i++) {
  const a = generateTeam('a', 'A', 0x1, 13, i * 7 + 1, '4-4-2');
  const b = generateTeam('b', 'B', 0x2, 13, i * 11 + 3, '4-4-2');
  const m: any = new MatchEngine([a, b], i * 31 + 5, [HIGH, HIGH]);
  let prevUntil = -1;
  for (let k = 0; k < 20000 && !m.state.finished; k++) {
    const hadCarrier = !!m.state.carrier;
    m.tick();
    ticks++;
    if (!hadCarrier) looseTicks++;
    if (m.counterUntil !== undefined && m.counterUntil !== prevUntil) { armings++; prevUntil = m.counterUntil; }
  }
}
const perMatch = armings / N;
console.log(`  ..   ${ticks} tick(s) across ${N} matches, ${((looseTicks / ticks) * 100).toFixed(1)}% of them starting with a loose ball`);
console.log(`  ..   ${perMatch.toFixed(1)} counter arming(s) per match`);
ok(looseTicks > 0, 'loose-ball ticks occur (the case that produced the defect still exists)');
ok(armings > 0, 'the counter still arms at all — a fix that simply switched it off would be worse');

// THE REGRESSION BOUND. Reinstating the bug roughly doubles this: measured 1,062 before, 625 after. A
// threshold between the two catches a revert without pinning an exact figure that ordinary tuning would
// trip. Deliberately generous.
ok(perMatch < 850, `the counter is not arming on ordinary loose-ball recoveries (${perMatch.toFixed(1)}/match; the defect measured 1,062)`);

console.log(fails ? `\n✗ ${fails} — the counter fires without a turnover` : '\n✓ the counter window means what the comment says');
if (fails) process.exitCode = 1;
