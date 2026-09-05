// THE RUN DIES WITH THE POSSESSION — AT EVERY HANDOVER, NOT ONLY THE ONE THE COMMENT SITS ON.
//
// `clearRun` flags the man played in behind, and `shootP` multiplies his chance by CLEAR_RUN_APPETITE
// (x12) from anywhere inside 30m. The engine states the rule in the failed-pass branch — "THE RUN DIES
// WITH THE POSSESSION" — and then broke it at every sibling handover: the tackle-won branch gave the ball
// to the defence without clearing the flag, and so did the three foul restarts that give it to the
// defending keeper. A forward who was clean through, was tackled, and whose side then won the ball
// straight back was still shooting at x12 from thirty metres.
//
// Measured on the unfixed tree, DEFAULT_TACTICS 4-4-2 mirrors, 90 matches, reading the engine's own
// `clearRun` and carrier every tick: 19,518 ticks with one side on the ball while the OTHER side had a
// run armed — 216.9 a match — and 1,232 armed runs outliving a turnover, 23.8% of every arming. Clearing
// the tackle branch alone leaves 117 of those ticks on the foul restarts; clearing all four leaves
// exactly none, which is why the last assertion is a strict zero and not a threshold to be tuned past.
//
// WHY NOTHING ELSE MEASURES IT. `clearRun` is private, and reaches no event, no scoreline and no screen —
// its whole effect is one multiplier inside one probability, worth 0.05 goals a match against a fuzz
// baseline of 4.35. That is inside the noise of every balance probe in the suite, so nothing else here
// can tell a run that ended from a run that never did. This probe reads the flag itself.
//
// Run: `npx tsx tools/playtest/clear_run_possession.ts`   (CLEAR_RUN_N=400 for a bigger sweep)
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A clear run does not outlive the possession it belongs to ===');

const N = Number(process.env.CLEAR_RUN_N ?? 90);
let ticks = 0, armings = 0, handovers = 0, refereeHandovers = 0, staleTicks = 0, staleRuns = 0;

for (let i = 0; i < N; i++) {
  const a = generateTeam('a', 'A', 0x1, 13, i * 7 + 1, '4-4-2');
  const b = generateTeam('b', 'B', 0x2, 13, i * 11 + 3, '4-4-2');
  const m: any = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  const prev: [number, number] = [-1, -1];
  const logged: [boolean, boolean] = [false, false]; // this arming has already been counted as stale
  for (let k = 0; k < 20000 && !m.state.finished; k++) {
    const beforeRun: [number, number] = [m.clearRun[0], m.clearRun[1]];
    const beforeTeam: number = m.state.carrier ? m.state.carrier.teamIdx : -1;
    const nEv = m.state.events.length;
    m.tick();
    ticks++;
    const afterTeam: number = m.state.carrier ? m.state.carrier.teamIdx : -1;
    // A HANDOVER: the side that began the tick on the ball with a run armed does not end it on the ball.
    if (beforeTeam >= 0 && beforeRun[beforeTeam] >= 0 && afterTeam >= 0 && afterTeam !== beforeTeam) {
      handovers++;
      // The referee's three exits — a foul in the box the keeper gathers, a penalty missed, a free kick
      // off target — are the rarest handovers in the engine, about one every eight matches. They get their
      // own counter and their own assertion, because otherwise the strict zero below could sit green for
      // years having never once exercised the awardFoul/takePenalty/takeFreeKick clears.
      // A 'foul' event is pushed unthrottled at the top of awardFoul; 'tackle_won' goes through the
      // commentary throttle and is NOT a reliable marker, so do not classify the tackle branch that way.
      if (m.state.events.slice(nEv).some((e: any) => e.type === 'foul')) refereeHandovers++;
    }
    for (const t of [0, 1] as const) {
      const run: number = m.clearRun[t];
      if (run >= 0 && run !== prev[t]) { armings++; logged[t] = false; }
      prev[t] = run;
    }
    const c = m.state.carrier;
    if (c) {
      const opp = (1 - c.teamIdx) as 0 | 1;
      if (m.clearRun[opp] >= 0) { staleTicks++; if (!logged[opp]) { staleRuns++; logged[opp] = true; } }
    }
  }
}

console.log(`  ..   ${N} matches, ${ticks} ticks: ${(armings / N).toFixed(1)} runs armed per match, ${(handovers / N).toFixed(1)} of them meeting a handover`);
console.log(`  ..   ${refereeHandovers} of those handovers were a referee restart, the rarest path this covers`);
ok(armings > 0, 'clear runs still arm at all — a "fix" that stopped arming them would measure zero here and be worse than the bug');
ok(handovers > 0, 'armed runs still meet a handover, so the case that produced the defect still occurs');
ok(refereeHandovers > 0, 'at least one handover was a referee restart, or the awardFoul/penalty/free-kick clears are untested by this probe');
ok(staleTicks === 0,
   `no side holds an armed run while the OTHER side has the ball (${staleTicks} stale ticks over ${staleRuns} runs; the unfixed tree measured 19518 at this N, and fixing only the tackle branch leaves 117)`);

console.log(fails ? `\n✗ ${fails} — a breakaway is outliving the possession that created it` : '\n✓ the run dies with the possession, on every handover');
if (fails) process.exitCode = 1;
