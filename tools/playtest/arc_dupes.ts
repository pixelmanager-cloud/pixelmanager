// Five authors wrote the childhood library in parallel and nothing deduped the PREMISES, so pairs of arcs
// tell the same story in different files — one pair even shares a title and writes the same state flag.
// Compares the opening prompt of every arc against every other by content-word overlap. (PT-200)
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
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const x = rows[i], y = rows[j];
    if (x.w.size < 6 || y.w.size < 6) continue;
    // A childhood version and a senior version of the same premise is DELIBERATE — an own goal at eleven
    // and an own goal in front of thirty thousand are different stories. It is only a duplicate if both
    // can reach the same career, so pairs with disjoint turn windows are not a finding.
    if (x.hi < y.lo || y.hi < x.lo) continue;
    let inter = 0; for (const w of x.w) if (y.w.has(w)) inter++;
    const sim = inter / Math.min(x.w.size, y.w.size);
    const sameTitle = x.title && x.title.toLowerCase().replace(/[^a-z]/g, '') === y.title.toLowerCase().replace(/[^a-z]/g, '');
    const sharedTag = x.tags.some((t: string) => y.tags.includes(t));
    if (sim >= 0.34 || sameTitle || (sharedTag && sim >= 0.22)) {
      pairs.push({ a: `${x.id} "${x.title}" (t${x.lo}-${x.hi})`, b: `${y.id} "${y.title}" (t${y.lo}-${y.hi})`, sim: +sim.toFixed(2), why: [sameTitle ? 'SAME TITLE' : '', sharedTag ? 'shared tag' : ''].filter(Boolean).join(' + ') });
    }
  }
}
pairs.sort((p, q) => q.sim - p.sim);
console.log(`=== Duplicate arc premises — ${A.length} arcs, ${pairs.length} suspicious pair(s) ===`);
for (const p of pairs) console.log(`  ${String(p.sim).padStart(4)}  ${p.a}\n        ${p.b}${p.why ? `   [${p.why}]` : ''}`);
// ADVISORY, not a gate — which is why it does not set a failing exit code and is not in `npm run playtest`.
// Word overlap finds same-title collisions reliably, but it cannot tell a duplicate from two different
// stories that share football vocabulary: it rates club captaincy against an international tournament at
// 0.56 purely on a shared stock phrase, and it flags a deliberate callback pair ("the SAME function room,
// the same chicken and chips") as a repeat. Read the pairs, don't obey the number.
console.log(pairs.length ? `\n${pairs.length} pair(s) to READ — overlap is a hint, not a verdict` : '\n✓ no duplicated premises');
