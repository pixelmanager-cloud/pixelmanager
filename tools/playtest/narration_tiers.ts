// AN EVENT WITH PERSON-TIERED LINES MUST BE TOLD WHO IT IS ABOUT.
//
// managerNarrate's whole design claim is that "the narration KNOWS WHO IT IS TALKING ABOUT": tierFor
// appends `${event}.star` / `.servant` / `.veteran` / `.young` to the eligible pool, but ONLY inside
// `if (p) { ... }`. Pass `undefined` in the person slot and those keys are never added, so every line
// authored under them is unreachable — silently, with the general bank still producing perfectly good
// prose, which is exactly why nobody noticed.
//
// The four season-rollover climb events — promotion, relegation, the title, the near miss — all passed
// `undefined`. That stranded 30 authored lines: the moment the club goes up, and the game had no way to
// say it about the man who took it up.
//
// Run: `npx tsx tools/playtest/narration_tiers.ts`
import { readFileSync } from 'node:fs';
import { BASE_MGR } from '../../shared/src/manager/base.js';
import { MGR_EXTRA_1 } from '../../shared/src/manager/pack_1.js';
import { MGR_EXTRA_2 } from '../../shared/src/manager/pack_2.js';
import { MGR_EXTRA_3 } from '../../shared/src/manager/pack_3.js';
import { MGR_EXTRA_4 } from '../../shared/src/manager/pack_4.js';
import { MGR_EXTRA_5 } from '../../shared/src/manager/pack_5.js';
import { MGR_EXTRA_6 } from '../../shared/src/manager/pack_6.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Events with person-tiered banks are given a person ===');

const TIERS = ['star', 'servant', 'veteran', 'young'];
const banks: Record<string, string[]> = {
  ...BASE_MGR, ...MGR_EXTRA_1, ...MGR_EXTRA_2, ...MGR_EXTRA_3, ...MGR_EXTRA_4, ...MGR_EXTRA_5, ...MGR_EXTRA_6,
} as any;
// SPREADING A NAME THAT DOES NOT EXIST IS SILENT. The first draft of this probe imported `MGR_PACK_1` and
// `MGR_PACK_2` — names this repo has never had — and `{ ...undefined }` is a legal no-op, so it merged the
// base bank alone, reported seven tiered events instead of eleven, and went green over the exact four
// call sites it was written to catch. Assert the size before trusting anything derived from it.
console.log(`  ..   ${Object.keys(banks).length} bank key(s) merged from base + six packs`);
ok(Object.keys(banks).length > 60, 'the packs actually loaded (base alone is 35 keys; with all six it is 99)');
// Which events actually have tiered lines authored, and how many are riding on the person being present.
const tiered = new Map<string, number>();
for (const [key, lines] of Object.entries(banks)) {
  const dot = key.lastIndexOf('.');
  if (dot < 0) continue;
  if (!TIERS.includes(key.slice(dot + 1))) continue;
  const ev = key.slice(0, dot);
  tiered.set(ev, (tiered.get(ev) ?? 0) + (Array.isArray(lines) ? lines.length : 0));
}
console.log(`  ..   ${tiered.size} event(s) have person-tiered lines authored`);
ok(tiered.size > 0, 'the banks still use person tiering at all (this is not measuring an empty set)');

// Every call site for such an event must pass something in the person slot. feedEvent's signature is
// (event, icon, person?, vars?, season?) and feedOnce's is (key, event, icon, person?, vars?).
let checked = 0;
for (const [ev, n] of [...tiered].sort()) {
  const calls = [
    ...src.matchAll(new RegExp(`this\\.feedEvent\\(\\s*'${ev}'\\s*,\\s*'[^']*'\\s*,\\s*([^,)]+)`, 'g')),
    ...src.matchAll(new RegExp(`this\\.feedOnce\\([^,]+,\\s*'${ev}'\\s*,\\s*'[^']*'\\s*,\\s*([^,)]+)`, 'g')),
  ];
  if (!calls.length) continue; // no caller at all is feed_wired.ts's business, not this probe's
  checked++;
  for (const c of calls) {
    const person = c[1].trim();
    ok(person !== 'undefined',
       `'${ev}' (${n} tiered line(s)) is told who it is about — got \`${person.slice(0, 46)}\``);
  }
}
console.log(`  ..   ${checked} tiered event(s) have a call site to check`);
ok(checked > 0, 'at least one tiered event is actually wired (otherwise this proves nothing)');

console.log(fails ? `\n✗ ${fails} call site(s) strand their event's person-tiered lines` : '\n✓ every tiered event is narrated about somebody');
if (fails) process.exitCode = 1;
