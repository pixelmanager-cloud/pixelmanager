// A COUNTER AND THE HIGH-WATER MARK IT IS COMPARED AGAINST MUST BE RESET IN THE SAME PLACE.
//
// maybeOfferArc paces manager story arcs by matchday: `const md = m.results?.length ?? 0;` and then
// `if (md - (m.arcLastMd ?? -3) < 3) return;`. Two operands, one derived from `m.results`, one stored.
// The season rollover resets `results: []` — so `md` returns to 0 — but did NOT reset `arcLastMd`, which
// keeps last season's value (up to FIXTURES_PER_SEASON = 18). From season 2 the gate demanded md >= 21,
// which a season of 18 fixtures can never reach, so the arc offers stopped for the rest of the generation.
// A ~10-season generation drew about 7 arcs from a library of 819, against a design note on the adjacent
// line that says arcs fire 4-6 a season.
//
// The class is what matters: this is the third bug in this file where a rollover reset half of a pair.
// Nothing failed — the gate is a silent `return`, so the symptom is content that simply never appears.
//
// Run: `npx tsx tools/playtest/arc_pacing_reset.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Arc pacing: the matchday counter and its high-water mark reset together ===');

// The gate is what makes the pairing matter. If it stops comparing these two, this probe measures nothing.
const gate = /const md = m\.results\?\.length \?\? 0;[\s\S]{0,900}?m\.arcLastMd/.test(src);
ok(gate, 'maybeOfferArc still paces arcs by comparing results.length against arcLastMd');

// Every saveMgr that clears the counter must clear the mark. Match balanced-ish object literals by scanning
// forward from each `saveMgr({` to its closing brace, so a nested `{ ... }` in the payload cannot truncate it.
const saves: string[] = [];
for (let i = src.indexOf('saveMgr({'); i !== -1; i = src.indexOf('saveMgr({', i + 1)) {
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { saves.push(src.slice(i, j + 1)); break; } }
  }
}
const resets = saves.filter((s) => /results:\s*\[\]/.test(s));
console.log(`  ..   ${saves.length} saveMgr call(s), ${resets.length} of which clear the matchday counter`);
ok(saves.length > 0, 'saveMgr calls were found at all (the scanner still matches this file)');
ok(resets.length > 0, 'at least one save clears results (this is not measuring an empty set)');

for (const s of resets) {
  // Name the site by a distinctive neighbouring field so a failure says WHICH reset is missing the pair.
  const label = (s.match(/(season: m\.season \+ 1|season: 1)/) ?? [, '?'])[1];
  ok(/arcLastMd/.test(s), `the save that clears results near '${label}' also clears arcLastMd`);
}

console.log(fails ? `\n✗ ${fails} reset(s) leave the arc gate holding a stale high-water mark` : '\n✓ every matchday reset clears the mark it is compared against');
if (fails) process.exitCode = 1;
