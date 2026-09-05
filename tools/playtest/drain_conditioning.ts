// EVERY DRAIN IN A MATCH SPENDS FITNESS AT THE CONDITIONING THE MANAGER PAID FOR.
//
// `drain(ps, p, mods, effort, conditioning = 1)` is the only place fitness is spent, and `conditioning` is
// the club's fitness-drain multiplier — the Training Ground curve, the Fitness Coach's −5% and the team
// talk all reach the match as that one number. `movePlayers` reads it once (`const cond =
// this.teams[teamIdx].conditioning ?? 1`) and hands it to both of its drain sites. The carrier's dribble
// did not. Because the parameter carries a DEFAULT, the missing wire is not a compile error and not a
// runtime error — it silently drains that call at conditioning 1, so a manager's fitness work is skipped
// on every tick a man is running with the ball at his feet. Measured by this probe against the tree that
// had it: 89,044 of 2,592,188 drains (3.4%), and 5.0% of all the fitness a match spends, at conditioning
// 0.75 — nothing a player would notice, and a wire nothing but this could notice either.
//
// That is the shape this repo keeps producing: an optional argument nobody passes, quietly substituted for.
// So this is checked two ways, because either alone lets it back in:
//   1. BEHAVIOUR — instrument the real `drain` through full matches with both sides on a distinctive
//      conditioning, and demand every call received it. This catches a wire that has been dropped.
//   2. SOURCE — every `this.drain(` in the engine passes five arguments. This catches a NEW drain site
//      that this probe's sample happens never to reach.
//
// VACUITY: (1) is "no call fell back to the default", which is free if the carry never happens or if the
// instrumentation missed. Guarded below — all three efforts must be seen with a real call count, and every
// count is printed. Mutation-test it by dropping the last argument at any one of the three call sites in
// shared/src/engine.ts: check 1 goes red naming that effort's share, and check 2 goes red naming its line.
//
// Run: `npx tsx tools/playtest/drain_conditioning.ts`
import { readFileSync } from 'node:fs';
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The man on the ball drains at the same conditioning as everyone else ===');

// Far from the default of 1, and not a number the engine could arrive at by accident.
const COND = 0.75;
const N = 12;

// ── 1: BEHAVIOUR ─────────────────────────────────────────────────────────────────────────────────
const proto = MatchEngine.prototype as unknown as Record<string, unknown>;
const real = proto.drain as (...a: unknown[]) => void;
ok(typeof real === 'function', '`drain` is still a method on MatchEngine.prototype (else there is nothing to instrument)');
if (typeof real !== 'function') { console.log('\n✗ could not instrument the drain — renamed?'); process.exit(1); }

interface Row { calls: number; wrong: number; spent: number; spentWrong: number }
const byEffort = new Map<number, Row>();
// A pass-through wrapper: it forwards exactly the arguments it was handed — including forwarding FOUR when
// four were passed — so the instrumented run drains identically to the real one and stays deterministic.
proto.drain = function (this: unknown, ps: { fitness: number }, p: unknown, mods: unknown, effort: number, ...rest: unknown[]) {
  const row = byEffort.get(effort) ?? { calls: 0, wrong: 0, spent: 0, spentWrong: 0 };
  const before = ps.fitness;
  real.apply(this, [ps, p, mods, effort, ...rest]);
  const lost = before - ps.fitness;
  row.calls++; row.spent += lost;
  if (rest.length === 0 || rest[0] !== COND) { row.wrong++; row.spentWrong += lost; }
  byEffort.set(effort, row);
};

for (let i = 0; i < N; i++) {
  const t = generateTeam('x', 'X', 0x445566, 12, 7000 + i, '4-4-2');
  const xi = buildXI(t, autoPickXI(t, '4-4-2'));
  const e = new MatchEngine([{ ...xi, conditioning: COND }, { ...xi, conditioning: COND }], 9000 + i, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
}
proto.drain = real;

const SITES: [number, string][] = [[1.5, 'chasing the ball  (movePlayers)'], [1, 'holding shape     (movePlayers)'], [1.2, 'carrying the ball (dribble)']];
let calls = 0, wrong = 0, spent = 0, spentWrong = 0;
for (const row of byEffort.values()) { calls += row.calls; wrong += row.wrong; spent += row.spent; spentWrong += row.spentWrong; }
console.log(`  ..   ${N} matches, both sides on conditioning ${COND}: ${calls.toLocaleString()} drains, ${(spent / N).toFixed(1)} fitness spent per match`);

for (const [effort, what] of SITES) {
  const row = byEffort.get(effort);
  // The vacuity guard, and the reason it is per-site: "no call took the default" is satisfied by an empty
  // list, and by a sample in which the carrier never once ran with the ball.
  ok(!!row && row.calls > 0, `effort ${effort} — ${what} — actually fired (else the check below is vacuous)`);
  if (!row) continue;
  console.log(`  ..   effort ${effort}  ${what}  ${row.calls.toLocaleString()} calls (${(row.calls / calls * 100).toFixed(1)}%), ${(row.spent / spent * 100).toFixed(1)}% of the fitness spent`);
  ok(row.wrong === 0,
    `${what} drains at the team's conditioning (${row.wrong.toLocaleString()}/${row.calls.toLocaleString()} calls drained at something other than ${COND}, ${(row.spentWrong / spent * 100).toFixed(1)}% of all the fitness spent)`);
}
ok(wrong === 0, `no drain anywhere in a match silently falls back to conditioning 1 (${wrong.toLocaleString()}/${calls.toLocaleString()} did)`);

// ── 2: SOURCE — a new drain site cannot omit the argument just because this sample never reached it ──
const src = readFileSync('shared/src/engine.ts', 'utf8');
const found: { line: number; args: number; text: string }[] = [];
for (let i = src.indexOf('this.drain('); i >= 0; i = src.indexOf('this.drain(', i + 1)) {
  let depth = 0, args = 1, j = i + 'this.drain'.length;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) break; }
    else if (c === ',' && depth === 1) args++;
  }
  found.push({ line: src.slice(0, i).split('\n').length, args, text: src.slice(i, j + 1) });
}
ok(found.length >= 3, `the engine's \`this.drain(\` call sites are still findable (found ${found.length})`);
for (const f of found) {
  console.log(`  ..   engine.ts:${f.line}  ${f.args} args  ${f.text}`);
  ok(f.args === 5, `engine.ts:${f.line} passes the team's conditioning, not just the effort (${f.args} args)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — some of the fitness a match spends ignores the training ground` : '\n✓ every drain in a match spends fitness at the club\'s conditioning');
if (fails) process.exitCode = 1;
