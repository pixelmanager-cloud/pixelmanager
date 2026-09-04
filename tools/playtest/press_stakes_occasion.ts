// THE OCCASION HAS TO REACH THE PRE-MATCH PRESSER, NOT JUST THE SQUAD-STRENGTH GAP.
//
// `pressConferenceLine` at timing 'pre' has exactly one door into PRE_STAKES_HIGH: `stakes >= 3`
// (shared/src/press.ts). `PressInput.stakes` says what belongs behind it — "3 = season-defining (title
// decider, relegation six-pointer, cup final, World-Finals knockout)".
//
// The pre-match call site derived `preStakes` from squad strength alone, so the OCCASION could never open
// that door: a Continental Cup Final against a side less than 2 stronger than you scored 1, "routine
// fixture", and the manager walked into the biggest night of the season talking about team news. The
// post-match call site on the SAME fixture already reads `spFixture.comp` and scores it 3 — so the two
// ends of one tie disagreed about what it was. F-146 fixed `competition` on this exact call and left
// `stakes` behind; this is the surviving half of it.
//
// Both values are ternaries inside a private method of a 9k-line class, so this lifts the two expressions
// out of the source and evaluates them, rather than trying to stand up the app to reach them. That means
// the check is on the ACTUAL arithmetic the game runs, not on a pattern that a rewrite could satisfy
// while changing the answer.
//
// Run: `npx tsx tools/playtest/press_stakes_occasion.ts`
import { readFileSync } from 'node:fs';
import { pressConferenceLine, type PressCompetition, type PressForm } from '../../shared/src/press.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A cup night is scored as a cup night before kick-off, not just after it ===');

// ── VACUITY GUARD ────────────────────────────────────────────────────────────────────────────────
// Everything below is worth nothing if stakes 3 no longer unlocks any pre-match prose. Prove the door
// exists by set difference: collect every pre-match line reachable at stakes 1 and 2, then every line
// reachable at stakes 3, and show the second set contains prose the first can never produce. If this
// ever prints 0, the probe is measuring nothing and the assertions below are decoration.
const COMPS: PressCompetition[] = ['league', 'continental', 'international', 'cup'];
const FORMS: PressForm[] = ['hot', 'cold', 'level'];
const reach = (stakes: 1 | 2 | 3) => {
  const seen = new Set<string>();
  for (let seed = 0; seed < 400; seed++) for (const competition of COMPS) for (const form of FORMS)
    seen.add(pressConferenceLine(seed, seed % 40, { timing: 'pre', competition, stakes, form }));
  return seen;
};
const low = new Set([...reach(1), ...reach(2)]);
const onlyHigh = [...reach(3)].filter((l) => !low.has(l));
console.log(`  ..   ${onlyHigh.length} pre-match lines are reachable ONLY at stakes 3 (e.g. "${onlyHigh[0] ?? '—'}")`);
ok(onlyHigh.length > 0, 'stakes 3 unlocks pre-match prose that stakes 1 and 2 cannot reach');

// ── The two call sites, lifted from source ───────────────────────────────────────────────────────
const src = readFileSync('client/src/main.ts', 'utf8');
function expr(decl: string): string {
  const n = src.split(decl).length - 1;
  ok(n === 1, `\`${decl.trim()}\` appears exactly once in client/src/main.ts (found ${n})`);
  if (n !== 1) return '';
  const i = src.indexOf(decl) + decl.length;
  return src.slice(i, src.indexOf(';', i));
}
const preSrc = expr('const preStakes: 1 | 2 | 3 = ');
const postSrc = expr('const stakes: 1 | 2 | 3 = ');
if (!preSrc || !postSrc) { console.log('\n✗ could not find both press-stakes call sites — rename?'); process.exit(1); }
console.log(`  ..   pre : ${preSrc}`);
console.log(`  ..   post: ${postSrc}`);

// Both read `this.spFixture`; the pre one also closes over `myStr`, the post one over `rivalName`.
type Fx = { comp?: 'league' | 'cont' | 'wc'; oppStrength: number; oppName: string };
const pre = new Function('myStr', `return (${preSrc});`) as (this: { spFixture: Fx }, m: number) => 1 | 2 | 3;
const post = new Function('rivalName', `return (${postSrc});`) as (this: { spFixture: Fx }, r: string | null) => 1 | 2 | 3;
const preStakes = (f: Fx, myStr: number) => pre.call({ spFixture: f }, myStr);
const postStakes = (f: Fx, rival: string | null) => post.call({ spFixture: f }, rival);

// ── The occasions PressInput names as stakes 3 ───────────────────────────────────────────────────
// Continental opponents are `12 + r * 2 + (hash % 5)` — QF 12-16, SF 14-18, Final 16-20 (shared/src/intl.ts).
// World-Finals nations are `8 + (hash % 12)` — 8-19 (worldCup, same file). `myStr` is clubLeagueStrength(),
// which for a side good enough to qualify sits around 13-18. Every cell of that grid is a cup night.
const MY = [13, 14, 15, 16, 17, 18];
const cases: { f: Fx; myStr: number; what: string }[] = [];
for (const myStr of MY) {
  for (let s = 12; s <= 20; s++) cases.push({ f: { comp: 'cont', oppStrength: s, oppName: 'Steaua Marn' }, myStr, what: `Continental tie opp ${s} vs my ${myStr}` });
  for (let s = 8; s <= 19; s++) cases.push({ f: { comp: 'wc', oppStrength: s, oppName: 'Calderia' }, myStr, what: `World-Finals tie opp ${s} vs my ${myStr}` });
}
const wrong = cases.filter((c) => preStakes(c.f, c.myStr) !== 3);
console.log(`  ..   ${cases.length - wrong.length}/${cases.length} cup nights reach stakes 3 before kick-off`);
ok(cases.length > 0, 'there are cup nights to check (this is not measuring an empty grid)');
ok(wrong.length === 0, wrong.length
  ? `${wrong.length} cup night(s) are scored routine pre-match, e.g. ${wrong[0].what} → ${preStakes(wrong[0].f, wrong[0].myStr)}`
  : 'every Continental / World-Finals tie is stakes 3 before kick-off, whatever the strength gap');

// The same fixture must not change what it was between the team sheet and full time.
const split = cases.filter((c) => preStakes(c.f, c.myStr) !== postStakes(c.f, 'Steaua Marn'));
ok(split.length === 0, split.length
  ? `${split.length} fixture(s) are scored one way pre-match and another post-match, e.g. ${split[0].what}`
  : 'pre- and post-match agree on what the occasion was worth');

// ── MUTATION GUARD ───────────────────────────────────────────────────────────────────────────────
// A fix that just returns 3 would pass everything above and make every Tuesday league game read like a
// final — the opposite bug, and the reason PRE_ROUTINE exists at all. The strength ladder has to survive.
const lg = (s: number) => ({ comp: 'league' as const, oppStrength: s, oppName: 'Northvale Town' });
console.log(`  ..   league, my 15 — opp 13 → ${preStakes(lg(13), 15)} · opp 15 → ${preStakes(lg(15), 15)} · opp 18 → ${preStakes(lg(18), 15)}`);
ok(preStakes(lg(13), 15) === 1, 'a comfortable league fixture is still routine (1)');
ok(preStakes(lg(15), 15) === 2, 'an even league fixture is still a big occasion (2)');
ok(preStakes(lg(18), 15) === 3, 'a league game against a far stronger side is still season-defining (3)');

console.log(fails ? `\n✗ ${fails} check(s) failed — the pre-match presser cannot tell a cup final from a Tuesday` : '\n✓ the occasion sets the pre-match stakes, and the strength ladder still works underneath it');
if (fails) process.exitCode = 1;
