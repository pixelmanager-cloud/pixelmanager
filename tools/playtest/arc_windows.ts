// Are arcs actually REACHABLE across the whole career, or do they bunch at the ends? A story library is
// only as good as its eligibility windows: 414 arcs mean nothing if turn 36 can only ever see 18 of them.
import { ARCS } from '../../shared/src/storyarc.js';
const A: any[] = ARCS as any;
console.log(`=== Arc eligibility windows — ${A.length} arcs over a 120-turn career ===`);
console.log('turn : eligible   by category');
let worst = { t: 0, n: 1e9 };
for (let t = 2; t <= 118; t += 2) {
  const el = A.filter((a) => (a.minTurn ?? 0) <= t && (a.maxTurn ?? 999) >= t);
  if (el.length < worst.n) worst = { t, n: el.length };
}
for (const t of [4, 12, 20, 28, 32, 36, 40, 44, 48, 52, 56, 60, 70, 86, 104, 118]) {
  const el = A.filter((a) => (a.minTurn ?? 0) <= t && (a.maxTurn ?? 999) >= t);
  const by: Record<string, number> = {};
  for (const a of el) by[a.category] = (by[a.category] ?? 0) + 1;
  const parts = ['saga', 'crisis', 'signature', 'relationship', 'triumph', 'offpitch']
    .map((c) => `${c.slice(0, 4)} ${String(by[c] ?? 0).padStart(3)}`).join(' · ');
  console.log(`${String(t).padStart(4)} : ${String(el.length).padStart(4)}      ${parts}`);
}
const thin = A.filter((a) => (a.maxTurn ?? 999) < 32).length;
const late = A.filter((a) => (a.minTurn ?? 0) > 56).length;
console.log(`\n  arcs closing before turn 32: ${thin}`);
console.log(`  arcs opening after turn 56:  ${late}`);
console.log(`  thinnest point: turn ${worst.t} with only ${worst.n} eligible`);
// every category should stay pickable everywhere, or the category-balanced picker over-serves the survivors
let fails = 0;
const checks: Array<[string, boolean, string]> = [];
checks.push(['no turn drops below 60 eligible arcs', worst.n >= 60, `turn ${worst.t}: ${worst.n}`]);
// Checked over turns 12-110, not the whole career: the very first turns (age 10) and the very last
// (retirement) are legitimately thin, and demanding five signature arcs for a ten-year-old would only
// teach us to widen windows that are correctly narrow.
for (const c of ['saga', 'crisis', 'signature', 'relationship', 'triumph', 'offpitch']) {
  let low = { t: 0, n: 1e9 };
  for (let t = 12; t <= 110; t += 2) {
    const n = A.filter((a) => a.category === c && (a.minTurn ?? 0) <= t && (a.maxTurn ?? 999) >= t).length;
    if (n < low.n) low = { t, n };
  }
  checks.push([`${c} stays pickable all career (>= 5)`, low.n >= 5, `turn ${low.t}: ${low.n}`]);
}
console.log('\n=== verdict ===');
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails ? `\n✗ ${fails} window problem(s)` : `\n✓ arc windows are healthy`);
if (fails) process.exitCode = 1;   // a probe that cannot fail is scrollback, not a gate
