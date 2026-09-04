// Which manager-feed events can actually reach a player. The narration banks are authored per event, so
// an event with no call site is a bank of dead lines — and this drifted badly: 8 of 21 events had no
// caller at all, including EVERY injury event, because the injury system's write half was never connected
// (rollMatchInjuries / addInjury / decrementInjuries had no callers anywhere in the project).
//
// Bank keys carry an optional `.tier` suffix — the context tiering that makes selling an eleven-season
// servant read differently from selling a summer signing — so the event name is the part before the dot.
import { readFileSync } from 'node:fs';
import { BASE_MGR } from '../../shared/src/manager/base.js';

const src = readFileSync(new URL('../../client/src/main.ts', import.meta.url), 'utf8');
// The event argument is sometimes a ternary (`n.matches >= 3 ? 'injury_long' : 'injury'`), so take every
// quoted key in the head of the call rather than assuming it is the first token.
const wired = new Set<string>();
for (const m of src.matchAll(/\bfeed(?:Event|Once)\(/g)) {
  for (const q of src.slice(m.index!, m.index! + 220).matchAll(/'([a-z][a-z_]*)'/g)) wired.add(q[1]);
}
const all = [...new Set(Object.keys(BASE_MGR).map((k) => k.split('.')[0]))].sort();
const dead = all.filter((k) => !wired.has(k));
console.log(`=== Manager feed — ${all.length} events, ${all.length - dead.length} wired ===`);
if (dead.length) { console.log('  no call site (authored lines that can never appear):\n' + dead.map((k) => `    ${k}`).join('\n')); process.exitCode = 1; }
else console.log('\n✓ every authored manager event has a call site');

// AND IT HAS TO REACH MORE THAN ONE LINE OF THAT BANK. narrateManager keys its line index on
// (seed, event, person, season) plus whatever the call hands it in `vars`, so a call site that passes
// NEITHER a person NOR a var hashes to one index for a whole season: all three specialists you can hire
// printed the same sentence, out of 81 authored staff_hired lines. A person-less event has to say WHICH
// firing this was — the facility upgraded, the destination scouted, the specialist hired.
console.log('\n=== …and every call site says which firing it was ===');
const bare: string[] = [];
let sites = 0;
for (const m of src.matchAll(/\bfeed(?:Event|Once)\(/g)) {
  sites++;
  const head = src.slice(m.index!, m.index! + 260);
  const end = head.indexOf(');');
  const call = end < 0 ? head : head.slice(0, end + 1);
  // the person argument is the literal `undefined`, and vars is either absent or `{}`
  if (/,\s*undefined\s*(?:,\s*\{\s*\})?\s*\)$/.test(call)) bare.push(call.replace(/\s+/g, ' '));
}
console.log(`  ..   ${sites} feed call site(s) scanned, ${bare.length} with neither a person nor a var`);
// Not vacuous: if the scan ever stops matching call sites it says so rather than passing on an empty set.
if (!sites) { console.log('  FAIL no feed call sites matched — this check is measuring nothing'); process.exitCode = 1; }
for (const c of bare) console.log(`  FAIL ${c} — no person and no vars, so every firing of it draws the same line`);
if (bare.length) process.exitCode = 1;
else if (sites) console.log('  ok   every person-less feed call passes something that varies between firings');
