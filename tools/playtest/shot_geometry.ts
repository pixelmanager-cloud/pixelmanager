// ── WHERE DO SHOTS COME FROM? ─────────────────────────────────────────────────────────────────────
// Instruments the engine's own shot resolver to record the distance-from-goal the ENGINE ITSELF used
// for every attempt, plus how much time attackers spend inside the box.
//
// THIS PROBE IS AN ALARM, NOT A CERTIFICATE. It ran for days printing a catastrophe and exiting 0, so
// every build it sat in was reported green. The bars at the bottom are RATCHETS pinned to what the
// pre-rebuild engine measures today (2026-08-31, N=200) — most of them bless a number that is nowhere
// near football. Read the constants block before you read a passing run as good news.
//
// The underlying defect is docs/decisions-for-ck.md section 19, and section 1 (the match-engine rebuild
// that was measured, shown to fix exactly this axis, and then REVERTED because it inverted the tactical
// layer — see the long NOTE in shared/src/engine.ts around the through-ball chance). engine.ts states it
// plainly: the through-ball chance is the game's ONLY chance-creation mechanism, so all shot volume is
// faked by an inflated shoot-from-range constant. That is what these numbers are made of.
//
// TWO RE-DERIVATION BUGS WERE FOUND WHILE ARMING THIS, and both mattered:
//   * The probe used to compute shot distance from `state.carrier`'s position. The rebound path calls
//     resolveShot(teamIdx, poacher, ...) for a player who is NOT the carrier, so every close-range
//     rebound was recorded at the carrier's distance instead. That put "shots inside 18m" at 0.2% when
//     the engine's own distGoal says 2.4%. Still a catastrophe — but a different, honest one.
//   * `matches` could silently fall below N: the setup `catch` block `break`s out of the loop, and the
//     per-match averages then divide by however many matches survived. Nothing said so. It is asserted now.
// Both are the defect class this repo keeps finding: a gate that re-derives the thing under test from a
// local copy cannot see the thing under test change. Where the engine hands us a number, we use ITS number.
import { MatchEngine, TICK_SEC } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';

// ── THRESHOLD CONSTANTS ───────────────────────────────────────────────────────────────────────────
// Every bar is set from a measured run and left 10-35% of headroom. Two kinds live here and the failure
// text says which is which:
//
//   [known-bad]  a MUST-NOT-GET-WORSE ceiling/floor around a value that is already broken. Passing one
//                of these does NOT mean the metric is acceptable — the real-football figure is named on
//                the same line. Tripping one means the catastrophe deepened.
//   [football]   an ordinary bar the game does meet. Tripping one is a plain regression.
//
// Measured 2026-08-31 on the pre-rebuild engine, N=200 mirrored 4-4-2 matches, seeds 7919n+13.
const MAX_SHOTS_PER_MATCH = 75.0;   // [known-bad] measured 65.35 — real football is ~25. Ceiling only.
const MIN_SHOTS_PER_MATCH = 12.0;   // [football]  a match has shots in it; a rebuild landing near 25 clears this.
const MIN_GOALS_PER_MATCH = 2.10;   // [football]  measured 2.84 — this axis is genuinely close to real football.
const MAX_GOALS_PER_MATCH = 3.70;   // [football]  the other side of the same band.
const MAX_SHOT_DIST_P50_M = 51.0;   // [known-bad] measured 45.77m — real football median is ~16m. Ceiling only.
const MAX_SHOT_DIST_P10_M = 45.0;   // [known-bad] measured 40.27m — the CLOSEST tenth of shots is still 40m out.
const MIN_INSIDE_18_PCT = 1.60;     // [known-bad] measured 2.43% — real football is >40%. Floor only.
const MIN_CARRIER_IN_BOX_PCT = 1.20;// [known-bad] measured 1.75% of carrier time inside 18m.
const MIN_ATT_IN_BOX = 0.0110;      // [known-bad] measured 0.0162 attackers in the box while attacking. Real: 3-5.
const MIN_SPELL_MEAN_TICKS = 2.60;  // [known-bad] measured 3.46 ticks = 1.73s of possession. Real spells run 5-10s.
const MIN_SPELL_P90_TICKS = 5;      // [known-bad] measured 7 ticks = 3.5s at the 90th percentile.
const MIN_OPEN_PLAY_PER_MATCH = 1.00;// [football] measured 1.58 — the engine must keep more than ONE shot path.
const MAX_THROUGH_SHARE_PCT = 99.0; // [known-bad] measured 97.58% of shots come from the through-ball path alone.
const MIN_FINAL_THIRD_PCT = 30.0;   // [football]  measured 40.09% of attacking time with the ball in the final third.

const N = Number(process.env.N ?? 200);
const dists: number[] = [];         // shooter's own position when the resolver fired (cross-check only)
const engDists: number[] = [];      // the distGoal the ENGINE passed to resolveShot — the authoritative one
let goals = 0, shots = 0, matches = 0, carrierTicks = 0, carrierInBox = 0, attInBoxTicks = 0, tickCount = 0;
const ballDist: number[] = [];
let through = 0, openPlay = 0;
const spells: number[] = [];
let curTeam: number | null = null, curLen = 0;
const fwDist: number[] = [];
let setupError = '';

for (let iter = 0; iter < N; iter++) {
  const seed = (iter * 7919 + 13) >>> 0;
  const mk = (s: number, q: number): Team => {
    const t = generateTeam(`t${s}`, 'Team', 0x445566, q, s);
    const xi = buildXI(t, autoPickXI(t, '4-4-2'), '4-4-2');
    return xi;
  };
  let teams: [Team, Team];
  try { teams = [mk(seed, 12), mk(seed + 1, 12)]; } catch (e) { setupError = String(e).slice(0, 150); console.log('setup', setupError); break; }
  const m: any = new MatchEngine(teams, seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  // instrument the shot resolver
  const proto = Object.getPrototypeOf(m);
  if (!proto.__instr) {
    const orig = proto.resolveShot;
    // If the rebuild renames or removes resolveShot, this probe would otherwise measure an empty set and
    // report a perfect zero on every distance bar. Say so instead of silently gating on nothing.
    if (typeof orig !== 'function') {
      console.log('  FAIL INSTRUMENT DEAD — MatchEngine.prototype.resolveShot is not a function, so this probe');
      console.log('       is measuring nothing. Re-point the hook at whatever resolves shots now.');
      process.exit(1);
    }
    proto.resolveShot = function (...args: any[]) {
      const st = this.state;
      const c = st.carrier;
      if (c) {
        const g = this.goalOf(c.teamIdx);
        const p = st.players[c.teamIdx][c.playerIdx];
        dists.push(Math.hypot(p.x - g.x, p.y - g.y));
      }
      engDists.push(args[2]);   // the engine's own distGoal, not our re-derivation of it
      shots++;
      if (args[3]) through++; else openPlay++;
      return orig.apply(this, args);
    };
    proto.__instr = true;
  }
  for (let t = 0; t < 12000 && !m.state.finished; t++) {
    m.tick(); tickCount++;
    const c = m.state.carrier;
    // possession spell length
    const tnow = c ? c.teamIdx : null;
    if (tnow !== curTeam) { if (curTeam !== null && curLen) spells.push(curLen); curTeam = tnow; curLen = 0; }
    if (tnow !== null) curLen++;
    if (c) {
      carrierTicks++;
      const g = m.goalOf(c.teamIdx);
      const p = m.state.players[c.teamIdx][c.playerIdx];
      if (Math.hypot(p.x - g.x, p.y - g.y) < 18) carrierInBox++;
      ballDist.push(Math.abs(m.state.ball.x - g.x));
      // attackers of the carrying team inside the box
      for (let i = 1; i < 11; i++) {
        const q = m.state.players[c.teamIdx][i];
        if (Math.abs(q.x - g.x) < 16.5 && Math.abs(q.y - 34) < 20) attInBoxTicks++;
        if (teams[c.teamIdx].players[i]?.role === 'FW') fwDist.push(Math.abs(q.x - g.x));
      }
    }
  }
  matches++;
  goals += m.state.score[0] + m.state.score[1];
}

const pct = (n: number, d: number) => (100 * n) / (d || 1);
const sorted = (a: number[]) => a.slice().sort((x, y) => x - y);
const at = (a: number[], p: number) => (a.length ? a[Math.floor(a.length * p)] : NaN);
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

dists.sort((a, b) => a - b);
const eng = sorted(engDists);
ballDist.sort((a, b) => a - b);
spells.sort((a, b) => a - b);
fwDist.sort((a, b) => a - b);

const shotsPerMatch = shots / (matches || 1);
const goalsPerMatch = goals / (matches || 1);
const openPerMatch = openPlay / (matches || 1);
const throughSharePct = pct(through, shots);
const distP10 = at(eng, 0.1), distP50 = at(eng, 0.5), distP90 = at(eng, 0.9);
const inside18Pct = pct(eng.filter((d) => d < 18).length, eng.length);
const carrierInBoxPct = pct(carrierInBox, carrierTicks);
const finalThirdPct = pct(ballDist.filter((d) => d < 35).length, ballDist.length);
const spellMean = mean(spells), spellP90 = at(spells, 0.9), spellP50 = at(spells, 0.5);
const attInBox = attInBoxTicks / (carrierTicks || 1);

console.log(`matches=${matches} shots/match=${shotsPerMatch.toFixed(1)} goals/match=${goalsPerMatch.toFixed(2)}`);
console.log(`  from through-ball: ${(through / (matches || 1)).toFixed(1)}/match (${throughSharePct.toFixed(1)}% of all shots)   from open play: ${openPerMatch.toFixed(1)}/match`);
console.log(`shot distance (engine's own distGoal)  p10 ${distP10.toFixed(1)}  median ${distP50.toFixed(1)}  p90 ${distP90.toFixed(1)}   (metres from goal)`);
console.log(`shots inside 18m: ${inside18Pct.toFixed(2)}%   (${eng.filter((d) => d < 18).length} of ${eng.length})`);
console.log(`  cross-check, shooter's own position at resolve time: median ${at(dists, 0.5).toFixed(1)}m, inside 18m ${pct(dists.filter((d) => d < 18).length, dists.length).toFixed(2)}%`);
console.log(`  (the two disagree because rebound shots are resolved for a player who is not the carrier)`);
console.log(`carrier inside 18m: ${carrierInBoxPct.toFixed(1)}% of carrier time`);
const bq = (p: number) => (ballDist.length ? at(ballDist, p).toFixed(1) : 'n/a');
console.log(`ball dist from attacked goal: p10 ${bq(0.1)} median ${bq(0.5)} p90 ${bq(0.9)}`);
console.log(`ball in final third (<35m): ${finalThirdPct.toFixed(1)}% of attacking time`);
console.log(`possession spell ticks: median ${spellP50}  mean ${spellMean.toFixed(2)}  p90 ${spellP90}  (TICK_SEC=${TICK_SEC})`);
console.log(`FW dist from attacked goal while attacking: p10 ${at(fwDist, 0.1).toFixed(1)} median ${at(fwDist, 0.5).toFixed(1)}`);
console.log(`attackers in box: ${attInBox.toFixed(3)} players on average while attacking`);

// ── BARS ──────────────────────────────────────────────────────────────────────────────────────────
let fails = 0, brokeKnownBad = 0, brokeFootball = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };
const knownBad = (ok: boolean, msg: string) => { if (!ok) brokeKnownBad++; check(ok, `[known-bad] ${msg}`); };
const football = (ok: boolean, msg: string) => { if (!ok) brokeFootball++; check(ok, `[football]  ${msg}`); };

console.log('');

// The instrument itself, first. A probe whose hook came loose reports a flawless zero on every distance
// bar below, and 13 of this directory's probes have already been caught reporting exactly that kind of
// nothing. `matches` in particular is NOT N by construction: the setup catch above breaks the loop.
check(!setupError, `every match was set up (setup threw: ${setupError || 'no'})`);
check(matches === N, `all ${N} matches ran (got ${matches}) — the per-match averages divide by this`);
check(shots > 0 && engDists.length === shots && dists.length > 0,
  `the resolveShot hook recorded a distance for all ${shots} attempts (engDists ${engDists.length}, carrier-derived ${dists.length})`);
check(carrierTicks > 0 && ballDist.length === carrierTicks && spells.length > 0,
  `carrier telemetry is live: ${carrierTicks} carrier ticks of ${tickCount}, ${spells.length} possession spells`);

// Volume. The ceiling is the alarm that the fake shoot-from-range constant got MORE inflated; the floor
// is an ordinary football bar that a fixed engine (~25 shots) still clears comfortably.
knownBad(shotsPerMatch <= MAX_SHOTS_PER_MATCH,
  `shots/match has not got worse than ${MAX_SHOTS_PER_MATCH} (now ${shotsPerMatch.toFixed(1)}; real football ~25 — this is a ceiling on a catastrophe, not a pass mark)`);
football(shotsPerMatch >= MIN_SHOTS_PER_MATCH,
  `a match still produces shots (${shotsPerMatch.toFixed(1)}/match, floor ${MIN_SHOTS_PER_MATCH})`);
football(goalsPerMatch >= MIN_GOALS_PER_MATCH && goalsPerMatch <= MAX_GOALS_PER_MATCH,
  `goals/match stays in the football band ${MIN_GOALS_PER_MATCH}-${MAX_GOALS_PER_MATCH} (now ${goalsPerMatch.toFixed(2)}) — the ONE axis here that is genuinely right`);

// Geometry. This is the thing the probe exists to watch.
knownBad(distP50 <= MAX_SHOT_DIST_P50_M,
  `median shot distance has not got worse than ${MAX_SHOT_DIST_P50_M}m (now ${distP50.toFixed(1)}m; real football ~16m — STILL BROKEN, this bar only stops it deepening)`);
knownBad(distP10 <= MAX_SHOT_DIST_P10_M,
  `even the closest tenth of shots has not got worse than ${MAX_SHOT_DIST_P10_M}m (now ${distP10.toFixed(1)}m; the engine has a hard wall at 25-30m)`);
knownBad(inside18Pct >= MIN_INSIDE_18_PCT,
  `shots taken inside 18m has not fallen below ${MIN_INSIDE_18_PCT}% (now ${inside18Pct.toFixed(2)}%; real football >40% — this floor is set at a catastrophic value ON PURPOSE)`);

// Where the players are, which is why the geometry is what it is.
knownBad(carrierInBoxPct >= MIN_CARRIER_IN_BOX_PCT,
  `carrier time inside 18m has not fallen below ${MIN_CARRIER_IN_BOX_PCT}% (now ${carrierInBoxPct.toFixed(2)}%; engine.ts names this as the structural cause)`);
knownBad(attInBox >= MIN_ATT_IN_BOX,
  `attackers in the box while attacking has not fallen below ${MIN_ATT_IN_BOX} (now ${attInBox.toFixed(4)}; a real attack puts 3-5 bodies in there — this is two-hundredths of one player)`);
football(finalThirdPct >= MIN_FINAL_THIRD_PCT,
  `the ball still reaches the final third (${finalThirdPct.toFixed(1)}% of attacking time, floor ${MIN_FINAL_THIRD_PCT}%)`);

// Possession. 3.46 ticks is 1.73 seconds on the ball; nothing can be built in that.
knownBad(spellMean >= MIN_SPELL_MEAN_TICKS,
  `mean possession spell has not fallen below ${MIN_SPELL_MEAN_TICKS} ticks (now ${spellMean.toFixed(2)} = ${(spellMean * TICK_SEC).toFixed(2)}s; real spells run 5-10s)`);
knownBad(spellP90 >= MIN_SPELL_P90_TICKS,
  `p90 possession spell has not fallen below ${MIN_SPELL_P90_TICKS} ticks (now ${spellP90})`);

// More than one way to have a shot. division_balance was mutated into a one-goal-path engine and passed
// every bound it had; this is the same shape of hole, so both sides of the split are pinned.
football(openPerMatch >= MIN_OPEN_PLAY_PER_MATCH,
  `open play still produces shots (${openPerMatch.toFixed(2)}/match, floor ${MIN_OPEN_PLAY_PER_MATCH}) — if this hits zero the engine has exactly one shot path`);
knownBad(throughSharePct <= MAX_THROUGH_SHARE_PCT,
  `the through-ball path has not swallowed more than ${MAX_THROUGH_SHARE_PCT}% of all shots (now ${throughSharePct.toFixed(1)}%; engine.ts calls it "the game's ONLY chance-creation mechanism" and this number is why)`);

console.log('');
if (fails) {
  if (brokeKnownBad) console.log(`  !! ${brokeKnownBad} known-bad ratchet(s) tripped — a measured catastrophe got WORSE. These bars bless nothing;`);
  if (brokeKnownBad) console.log(`     they exist so the engine cannot rot further while the rebuild (decisions-for-ck.md s.1, s.19) is parked.`);
  if (brokeFootball) console.log(`  !! ${brokeFootball} ordinary football bar(s) tripped — a plain regression in something that used to work.`);
  console.log(`\n✗ ${fails} shot-geometry check(s) failed`);
  process.exit(1);
}
console.log('✓ shot geometry has not got worse — and is still nowhere near football:');
console.log(`  ${shotsPerMatch.toFixed(1)} shots/match (real ~25), median ${distP50.toFixed(1)}m (real ~16m), ${inside18Pct.toFixed(2)}% inside the box (real >40%).`);
console.log('  A green run here means "no new damage", not "this is fine". See docs/decisions-for-ck.md s.19.');
