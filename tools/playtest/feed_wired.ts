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
