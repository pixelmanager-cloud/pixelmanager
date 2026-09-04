// THE ARMED MATCH PLAN MUST BE EVALUATED ONCE PER TICK, NOT ONCE PER FRAME.
//
// `skipToEnd()` has always run `tick(); if (plan) evalMatchPlan();` — a plan check after EVERY tick.
// `onFrame()` drained as many ticks as the frame delta bought and then checked the plan ONCE, outside the
// drain loop. Those are the same match only when a frame buys exactly one tick, which is true at 1x and
// nowhere else: at 12x a 60fps frame drains 4 ticks, the rAF step ceiling (100ms) drains 24, and the
// hidden-tab timer's ceiling (1000ms) drains 240 — two game-minutes with no plan check inside them.
//
// It matters because `evalMatchPlan` ends in `setTactics`, which re-derives the press/line mods and so
// changes how many `rng()` draws the very next tick makes. An order applied late does not merely arrive
// late: it shifts the whole rng stream from that tick on. Same seed, same tactics, same armed plan, and
// the player got a different match depending on which speed button was lit and whether the tab was in
// front — including "skip to full-time" disagreeing with the match they had been watching.
//
// The structural check at the bottom is the assertion. The measured matrix above it exists so that check
// can never go vacuous: if checking the plan per frame instead of per tick ever stops changing the match,
// the shape check is guarding nothing and should be deleted rather than kept green. Note the matrix has
// to be a SWEEP — divergence is chaotic in the phase between the frame boundary and the trigger tick, so
// individual cells legitimately read 0 (12x at exactly 1000/60ms drains 4 ticks with no remainder and
// happens to land on the trigger). Any single-cell version of this measurement would be a coin flip.
//
// Run: `npx tsx tools/playtest/match_plan_parity.ts`
import { readFileSync } from 'node:fs';
import { MatchEngine, TICK_SEC } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Tactics } from '../../shared/src/tactics.js';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The match plan is evaluated per tick, so every speed plays the same match ===');

/** The body of a method, brace-matched. String- and comment-aware, because these bodies contain both. */
function body(sig: string): string {
  const at = src.indexOf(sig);
  if (at < 0) return '';
  let i = src.indexOf('{', at), depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === "'" || c === '"' || c === '`') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(start + 1, i);
  }
  return '';
}
/** Drop `//` comments from an extracted body. Without this the checks below read the PROSE: the comment
 *  that explains why the call moved names `evalMatchPlan()`, and would satisfy the very test it documents. */
const strip = (s: string) => s.replace(/\/\/[^\n]*/g, '');

// ── 1. the mechanism this parity is about still exists ────────────────────────────────────────────
const rulesAt = src.indexOf('const MATCH_PLAN_RULES');
const ruleCount = rulesAt < 0 ? 0 : (src.slice(rulesAt, src.indexOf('const clampTac')).match(/\{\s*id:\s*'/g) ?? []).length;
console.log(`  ..   ${ruleCount} armed match-plan rule(s) in MATCH_PLAN_RULES`);
ok(ruleCount > 0, 'there are match-plan rules to fire (with none, everything below measures nothing)');
ok(/setTactics\(/.test(body('  private evalMatchPlan()')),
   'a fired rule still pushes new tactics into the live engine — the reason WHEN it fires matters at all');

// ── 2. what the client's own constants say one frame can drain ────────────────────────────────────
const speeds = [...new Set([...src.matchAll(/setSpeed\((\d+),/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const rafClamp = Number((src.match(/matchStep\(now,\s*(\d+)\)/) ?? [])[1] ?? 0);
const bgClamp = Number((src.match(/matchStep\(performance\.now\(\),\s*(\d+)\)/) ?? [])[1] ?? 0);
ok(speeds.length > 0 && rafClamp > 0 && bgClamp > 0,
   `the speed buttons and both frame-step ceilings are still readable (${speeds.join('/')}x, ${rafClamp}ms rAF, ${bgClamp}ms hidden tab)`);
const maxSpeed = Math.max(...speeds, 1);
console.log(`  ..   one frame drains up to ${Math.floor(((bgClamp / 1000) * 10 * maxSpeed) / TICK_SEC)} tick(s) at ${maxSpeed}x in a hidden tab, ${Math.floor(((rafClamp / 1000) * 10 * maxSpeed) / TICK_SEC)} at the rAF ceiling`);

// ── 3. MEASURED: checking the plan once per frame is a different match ────────────────────────────
// One order in the shape every real rule has — a scoreline condition from the 45th minute on — driven
// through the real engine. Reference: skipToEnd's schedule, a check after every tick. Comparison: onFrame's
// accumulator reproduced verbatim, checking once per frame outside the drain loop, across every speed
// button and a spread of realistic frame deltas (a 60fps delta is never exactly 1000/60) plus both ceilings.
const MY: 0 | 1 = 0;
const BASE: Tactics = { ...DEFAULT_TACTICS };
const ORDER: Tactics = { ...DEFAULT_TACTICS, mentality: 2, line: 1, press: 1, tempo: 1 };
const OPP: Tactics = { ...DEFAULT_TACTICS, mentality: -1, line: -1, tempo: 1 };
function play(seed: number, dMs: number | null, speed: number) {
  const home = generateTeam('a', 'A', 0x1, 14, seed * 7 + 1, '4-4-2');
  const away = generateTeam('b', 'B', 0x2, 13, seed * 11 + 3, '4-4-2');
  const e: any = new MatchEngine([home, away], seed * 31 + 5, [BASE, OPP]);
  let fired = false;
  const check = () => {
    if (fired || Math.floor(e.state.clockSec / 60) < 45 || e.state.score[MY] === e.state.score[1 - MY]) return;
    fired = true;
    e.setTactics(MY, ORDER);
  };
  let guard = 0;
  if (dMs === null) { while (!e.state.finished && guard++ < 30000) { e.tick(); check(); } }       // skipToEnd
  else {                                                                                          // onFrame
    let accum = 0;
    while (!e.state.finished && guard++ < 400000) {
      accum += (dMs / 1000) * 10 * speed;
      while (accum >= TICK_SEC && !e.state.finished) { e.tick(); accum -= TICK_SEC; }
      if (!e.state.finished) check();
    }
  }
  return { score: `${e.state.score[0]}-${e.state.score[1]}`, fired };
}
const N = 30;
const deltas: Array<[string, number]> = [['16ms', 16], ['1000/60ms', 1000 / 60], ['17ms', 17], [`${rafClamp}ms`, rafClamp], [`${bgClamp}ms`, bgClamp]];
const refs = Array.from({ length: N }, (_, s) => play(s, null, 1));
const planned = refs.filter((r) => r.fired).length;
console.log(`  ..   the order fires in ${planned}/${N} reference matches`);
ok(planned > 0, 'the armed order actually fires (otherwise every comparison below is a match against itself)');
let worst = 0;
for (const speed of speeds) {
  const row: string[] = [];
  for (const [label, dMs] of deltas) {
    let d = 0;
    for (let s = 0; s < N; s++) if (refs[s].fired && play(s, dMs, speed).score !== refs[s].score) d++;
    worst = Math.max(worst, d);
    row.push(`${label} ${d}`);
  }
  console.log(`  ..   ${String(speed).padStart(2)}x — scorelines differing from the per-tick match, of ${planned}: ${row.join(', ')}`);
}
ok(worst > 0,
   `checking the plan once per frame instead of once per tick still changes the match (worst cell ${worst}/${planned}) — if this ever reads 0 the check below is guarding nothing and should go`);

// ── 4. THE ASSERTION: onFrame checks the plan inside the drain loop, exactly as skipToEnd does ────
const skipLoop = (strip(body('  private skipToEnd()')).match(/while \(![\s\S]*?\}/) ?? [''])[0];
ok(/tick\(\)[\s\S]*evalMatchPlan\(\)/.test(skipLoop),
   'skipToEnd still checks the plan after every tick (the reference this parity is measured against)');

const frame = strip(body('  onFrame(dMs: number)'));
ok(frame.length > 0, 'onFrame is still where the animated match advances');
const loopAt = frame.indexOf('while (this.accum >= TICK_SEC');
ok(loopAt >= 0, 'onFrame still drains ticks in an accumulator loop');
let inner = '';
if (loopAt >= 0) {
  let i = frame.indexOf('{', loopAt), depth = 0;
  const start = i;
  for (; i < frame.length; i++) {
    if (frame[i] === '{') depth++;
    else if (frame[i] === '}' && --depth === 0) { inner = frame.slice(start + 1, i); break; }
  }
}
ok(/evalMatchPlan\(\)/.test(inner), 'the armed plan is checked INSIDE the drain loop — once per tick, not once per frame');
ok(inner.indexOf('this.engine.tick()') >= 0 && inner.indexOf('this.engine.tick()') < inner.indexOf('evalMatchPlan()'),
   'and after the tick, in the same order skipToEnd uses');
ok(!/evalMatchPlan\(\)/.test(inner ? frame.replace(inner, '') : frame),
   'and not a SECOND time per frame outside the loop, which would fire an order on a tick skipToEnd never checks');

console.log(fails ? `\n✗ ${fails} check(s) failed — one seed and one plan give different matches at 1x, 4x, 12x and in a hidden tab`
                  : '\n✓ skip, 1x, 4x, 12x and a backgrounded tab all play the same match');
if (fails) process.exitCode = 1;
