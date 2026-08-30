// The PLAYER side's arc state flags. `ArcEffect.tag` is written on 44% of arc options and was discarded
// on arrival — applyArcEffect had no branch for it — while `ArcChoice.requires` was evaluated nowhere.
// Both are live now. This reports how much authored branching is available and whether any is USED yet,
// so the gap between "the mechanism exists" and "content uses it" stays visible instead of being assumed.
import { ARCS } from '../../shared/src/storyarc.js';
let opts = 0, tags = 0, requires = 0;
const written = new Set<string>(), required = new Set<string>();
for (const a of ARCS) for (const b of Object.values((a as any).beats ?? {})) {
  for (const c of ((b as any).choices ?? []) as any[]) {
    opts++;
    if (c.effect?.tag) { tags++; written.add(c.effect.tag); }
    if (c.requires) { requires++; required.add(c.requires); }
  }
}
console.log(`=== Player arc state flags — ${ARCS.length} arcs, ${opts} options ===`);
console.log(`  tags SET by a choice:      ${tags} (${Math.round(tags / opts * 100)}%), ${written.size} distinct`);
console.log(`  choices GATED on a tag:    ${requires} (${Math.round(requires / opts * 100)}%), ${required.size} distinct`);
const orphans = [...required].filter((r) => !written.has(r));
if (orphans.length) { console.log(`\n✗ ${orphans.length} gate(s) require a flag no choice ever sets: ${orphans.join(', ')}`); process.exitCode = 1; }
else if (!requires) console.log('\n✓ mechanism live; no arc uses it yet — 732 authored flags are available to branch on');
else console.log('\n✓ every gate requires a flag some choice can set');
