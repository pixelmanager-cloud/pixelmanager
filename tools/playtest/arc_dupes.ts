// Five authors wrote the childhood library in parallel and nothing deduped the PREMISES, so pairs of arcs
// tell the same story in different files — one pair even shares a title and writes the same state flag.
// Compares the opening prompt of every arc against every other by content-word overlap. (PT-200)
//
// That title collision is GONE on HEAD: measured today, 414 arcs, 50,778 window-overlapping pairs compared,
// ZERO shared titles among them, worst overlap 0.44, three pairs above the advisory threshold. So the bars
// at the bottom of this file hold a repair rather than bless a defect.
import { ARCS } from '../../shared/src/storyarc.js';
const A: any[] = ARCS as any;
const STOP = new Set(['the','a','an','and','or','but','is','it','he','his','him','to','of','in','on','at','for','with','that','this','they','them','their','as','be','been','has','have','had','was','were','not','no','so','if','when','who','what','which','from','by','out','up','off','all','one','two','into','about','after','before','still','than','then','there','here','its','you','your','are','do','does','did','just','like','over','because','while','very','more','most','some','any','can','could','would','will']);
function words(t: string): Set<string> {
  return new Set(String(t).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
}
const rows = A.map((a) => {
  const first = a.beats?.[a.first] ?? Object.values(a.beats ?? {})[0];
  return { id: a.id, title: a.title, lo: a.minTurn ?? 0, hi: a.maxTurn ?? 999,
           tags: JSON.stringify(a.beats).match(/tag: '([\w-]+)'/g) ?? [], w: words((first as any)?.prompt ?? '') };
});
const pairs: Array<{ a: string; b: string; sim: number; why: string }> = [];
// Counters the assertions at the bottom need. `compared` and `comparable` are the INSTRUMENT: a `words()`
// that stopped returning content words, or a prompt field that moved, would leave every set under six
// words, compare nothing, find zero pairs and print the clean verdict. Zero findings and zero looking read
// identically in the output, so they have to be told apart by the numbers.
const comparable = rows.filter((r) => r.w.size >= 6).length;
let compared = 0, maxSim = 0, titleClashes = 0;
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const x = rows[i], y = rows[j];
    if (x.w.size < 6 || y.w.size < 6) continue;
    // A childhood version and a senior version of the same premise is DELIBERATE — an own goal at eleven
    // and an own goal in front of thirty thousand are different stories. It is only a duplicate if both
    // can reach the same career, so pairs with disjoint turn windows are not a finding.
    if (x.hi < y.lo || y.hi < x.lo) continue;
    compared++;
    let inter = 0; for (const w of x.w) if (y.w.has(w)) inter++;
    const sim = inter / Math.min(x.w.size, y.w.size);
    if (sim > maxSim) maxSim = sim;
    const sameTitle = x.title && x.title.toLowerCase().replace(/[^a-z]/g, '') === y.title.toLowerCase().replace(/[^a-z]/g, '');
    if (sameTitle) titleClashes++;
    const sharedTag = x.tags.some((t: string) => y.tags.includes(t));
    if (sim >= 0.34 || sameTitle || (sharedTag && sim >= 0.22)) {
      pairs.push({ a: `${x.id} "${x.title}" (t${x.lo}-${x.hi})`, b: `${y.id} "${y.title}" (t${y.lo}-${y.hi})`, sim: +sim.toFixed(2), why: [sameTitle ? 'SAME TITLE' : '', sharedTag ? 'shared tag' : ''].filter(Boolean).join(' + ') });
    }
  }
}
pairs.sort((p, q) => q.sim - p.sim);
console.log(`=== Duplicate arc premises — ${A.length} arcs, ${pairs.length} suspicious pair(s) ===`);
for (const p of pairs) console.log(`  ${String(p.sim).padStart(4)}  ${p.a}\n        ${p.b}${p.why ? `   [${p.why}]` : ''}`);
// THE PAIR LIST STAYS ADVISORY. Word overlap cannot tell a duplicate from two different stories that share
// football vocabulary: it rates club captaincy against an international tournament at 0.56 purely on a
// shared stock phrase, and it flags a deliberate callback pair ("the SAME function room, the same chicken
// and chips") as a repeat. Read the pairs, don't obey the number — none of the three standing today is
// asserted away below, and nobody has to "fix" them to keep the build green.
//
// BUT "ADVISORY" WAS DOING TOO MUCH WORK. It is also in `npm run playtest` now (the runner globs the
// directory), and it exited 0 whatever it printed, so a copy-pasted authoring wave would have scrolled past
// as a green probe. The three bars below are the part of this measurement that is NOT a hint:
//   · an exact title collision between two arcs whose turn windows OVERLAP. The file's own claim is that
//     overlap finds these "reliably", and there are none today. The two duplicate titles that DO exist in
//     the library — "The Run In" and "Into His Own Net" — are the deliberate childhood/senior pairs, and
//     they never reach the same career, so the window test already excludes them.
//   · a similarity far above anything ordinary football vocabulary produces.
//   · the RATE of suspicious pairs, per 100 arcs rather than absolute, because the pair count grows with
//     the square of the library and an absolute ceiling would fail on healthy growth alone.
const FAIL_SIM      = 0.60;   // today's worst overlapping pair is 0.44 (captaincy-journey / tri-captain-country)
const MAX_PER_100   = 2.0;    // today 0.72 — 3 suspicious pairs across 414 arcs
const MIN_COMPARABLE_PCT = 90; // today 100% — all 414 arcs have an opening prompt of 6+ content words

const per100 = (100 * pairs.length) / Math.max(1, A.length);
const comparablePct = (100 * comparable) / Math.max(1, A.length);
console.log(`\n[arc-dupes] ${compared} window-overlapping pair(s) compared, worst overlap ${maxSim.toFixed(2)}, ${per100.toFixed(2)} suspicious per 100 arcs`);

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

check(comparablePct >= MIN_COMPARABLE_PCT && compared > 0,
  `the comparison actually ran (${comparable}/${A.length} arcs readable = ${comparablePct.toFixed(0)}%, floor ${MIN_COMPARABLE_PCT}%, ${compared} pairs compared)`);
check(titleClashes === 0,
  `no two arcs that can reach the same career share a title (${titleClashes} collision(s))`);
check(maxSim < FAIL_SIM,
  `no pair of overlapping arcs opens on the same premise (worst overlap ${maxSim.toFixed(2)}, ceiling ${FAIL_SIM})`);
check(per100 <= MAX_PER_100,
  `suspicious pairs have not multiplied (${per100.toFixed(2)} per 100 arcs, ceiling ${MAX_PER_100})`);

console.log(pairs.length ? `\n${pairs.length} pair(s) to READ — overlap is a hint, not a verdict` : '\n✓ no duplicated premises');
console.log(fails
  ? `\n✗ ${fails} arc-dupes check(s) failed — this is not a borderline pair to read, it is the same story authored twice into one career`
  : '\n✓ no arc retells another arc that shares its career window');
if (fails) process.exit(1);
