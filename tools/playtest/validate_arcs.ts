// Story-arc validator — the quality gate for the arc library. Checks every arc for structural + content
// correctness so a bad arc (invalid tag, dangling beat reference, duplicate id, empty prose) can never ship
// or brick a career. Run standalone or via `npm run playtest`.  npx tsx tools/playtest/validate_arcs.ts
import { ARCS } from '../../shared/src/storyarc.js';

const TAGS = new Set(['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair', 'keeping']);
const METERS = new Set(['authority', 'peers', 'family', 'school', 'agent', 'fans', 'sponsors', 'partner']);
const CATEGORIES = new Set(['saga', 'crisis', 'triumph', 'relationship', 'signature', 'offpitch']);

let errors = 0;
const err = (arc: string, msg: string) => { console.log(`  FAIL [${arc}] ${msg}`); errors++; };

const ids = new Set<string>();
for (const a of ARCS) {
  const A = a.id || '<no id>';
  if (!a.id) err(A, 'missing id');
  if (ids.has(a.id)) err(A, `duplicate arc id (each arc id must be globally unique across all category files)`);
  ids.add(a.id);
  if (!a.title || !a.icon) err(A, 'missing title/icon');
  if (!CATEGORIES.has(a.category)) err(A, `invalid category "${a.category}"`);
  if (!(a.minTurn >= 0 && a.maxTurn > a.minTurn && a.maxTurn <= 210)) err(A, `bad turn window ${a.minTurn}..${a.maxTurn}`);
  if (!(a.weight > 0)) err(A, 'weight must be > 0');
  if (!a.beats || !a.beats[a.first]) err(A, `first beat "${a.first}" not found`);
  const beatIds = new Set(Object.keys(a.beats ?? {}));
  for (const [bid, beat] of Object.entries(a.beats ?? {})) {
    if (beat.id !== bid) err(A, `beat "${bid}" has mismatched inner id "${beat.id}"`);
    if (!beat.prompt || beat.prompt.length < 20) err(A, `beat "${bid}" prompt too short/empty`);
    if (!beat.choices?.length || beat.choices.length < 2) err(A, `beat "${bid}" needs ≥2 choices`);
    const cids = new Set<string>();
    for (const ch of beat.choices ?? []) {
      if (!ch.id || !ch.label || !ch.desc || !ch.outcome) err(A, `beat "${bid}" choice "${ch.id ?? '?'}" missing id/label/desc/outcome`);
      if (cids.has(ch.id)) err(A, `beat "${bid}" duplicate choice id "${ch.id}"`);
      cids.add(ch.id);
      if (ch.outcome && ch.outcome.length < 15) err(A, `beat "${bid}" choice "${ch.id}" outcome too short`);
      if (ch.next && !beatIds.has(ch.next)) err(A, `beat "${bid}" choice "${ch.id}" → "${ch.next}" is a dangling reference`);
      const e = ch.effect;
      if (e?.attr) for (const t of Object.keys(e.attr)) if (!TAGS.has(t)) err(A, `beat "${bid}" choice "${ch.id}" invalid attr tag "${t}" (valid: ${[...TAGS].join('/')})`);
      if (e?.meters) for (const m of Object.keys(e.meters)) if (!METERS.has(m)) err(A, `beat "${bid}" choice "${ch.id}" invalid meter "${m}" (valid: ${[...METERS].join('/')})`);
      if (e?.form != null && Math.abs(e.form) > 0.2) err(A, `beat "${bid}" choice "${ch.id}" form ${e.form} out of sane range (±0.2)`);
    }
    // every non-first beat must be reachable from some choice.next
    if (bid !== a.first) { const reachable = Object.values(a.beats).some((b) => b.choices.some((c) => c.next === bid)); if (!reachable) err(A, `beat "${bid}" is unreachable (no choice points to it)`); }
  }
}

console.log(`=== Story-arc validator — ${ARCS.length} arcs, ${[...ids].length} unique ids ===`);
const byCat: Record<string, number> = {};
for (const a of ARCS) byCat[a.category] = (byCat[a.category] ?? 0) + 1;
console.log('  by category: ' + Object.entries(byCat).map(([c, n]) => `${c} ${n}`).join(' · '));
console.log(errors ? `\n✗ ${errors} arc validation error(s)` : `\n✓ all ${ARCS.length} arcs valid`);
if (errors) process.exit(1);
