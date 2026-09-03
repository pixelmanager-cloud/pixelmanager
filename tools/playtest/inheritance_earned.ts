// A FATHER'S CAREER MUST REACH HIS SONS.
//
// legacyBoost turns a playing record into what the next generation starts with. One of its three outputs is
// `ceilingLift` — clamp(round(longevity * 2 + winner), 0, 3), documented in career.ts as "+0..3 to the
// son's inherited physical ceilings" — and it had NO production consumer. Every reference outside the QA
// and sim harnesses was rebornFields', and the succession overwrote rebornFields' genes roll wholesale.
//
// The overwrite was itself a fix: the played heir was the one son minted outside the family model, so he
// alone carried no family resemblance to his brothers. Repairing that severed the earned-inheritance
// channel — a fix that quietly broke a second mechanism, which is this codebase's most common defect and
// is invisible precisely because both halves look right in isolation.
//
// The second operand was wrong too. mintHeirs was handed `decorated.genes_json`, the bands the father was
// BORN with. Nothing ever refreshes that field from a career, so twenty years of football changed nothing
// about what he passed down; rebornFields derives the bands from what he BECAME, and that derivation was
// the part being discarded.
//
// What this measures: two identical bloodlines whose fathers differ ONLY in what they achieved.
//
// Run: `npx tsx tools/playtest/inheritance_earned.ts`
import { readFileSync } from 'node:fs';
import { legacyBoost } from '../../shared/src/career.js';
import { heirGeneBasis } from '../../shared/src/tokens.js';
import { mintHeirs } from '../../shared/src/bloodline.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== What a father earns reaches his children ===');

// ── the mechanism is live at all ─────────────────────────────────────────────────────────────────────
const modest = legacyBoost({ seasons: 2, apps: 30, leagueTitles: 0, cupTitles: 0, promotions: 0, highestTierIdx: 0 });
const great  = legacyBoost({ seasons: 16, apps: 480, leagueTitles: 6, cupTitles: 3, promotions: 2, highestTierIdx: 4 });
console.log(`  ..   ceilingLift — a modest career ${modest.ceilingLift}, a great one ${great.ceilingLift}`);
ok(great.ceilingLift > modest.ceilingLift, 'legacyBoost still rates a decorated, durable career above a thin one');

// ── it is WIRED: the succession must mint the sibling set with it ────────────────────────────────────
const api = readFileSync('client/src/api.ts', 'utf8');
const call = (api.match(/mintHeirs\([^)]*\)/) ?? [''])[0];
console.log(`  ..   succession call: ${call}`);
ok(/ceilingLift/.test(call), 'succeed() passes the earned lift into mintHeirs');
// BIND-SITE, not mere presence. An earlier version of this line tested `/heirGeneBasis/.test(api)` and a
// mutation walked through it: rebinding `const parentGenes = JSON.parse(decorated.genes_json)` under the
// same identifier left the import untouched, so the probe went on reporting green over the restored bug.
// Check what the name is actually bound FROM.
ok(/const \{ parentGenes, ceilingLift \} = heirGeneBasis\(decorated\)/.test(api),
   "the father's bands come from what he became, not from his own birth genes");
// Scoped to the PLAYED line. The nephew path (an uncle's children) legitimately mints off genes_json: a
// brother who was never played has no attrs_json to derive bands from and no ach_* to have earned a lift,
// so his birth genes are the only record of him that exists. Asserting a blanket ban would have forced
// that correct call to be rewritten to look like the broken one.
const playedCall = (api.match(/const heirs = mintHeirs\([^)]*\)/) ?? [''])[0];
ok(/parentGenes/.test(playedCall) && !/genes_json/.test(playedCall),
   'the played line mints from the derived basis, not from the father\'s birth genes');

// ── and it CHANGES the sons. Same father, same seed, different record. ───────────────────────────────
const attrs = JSON.stringify({ pace: 14, strength: 13, stamina: 15 });
const tok = (ach: any) => ({ id: 'p1', name: 'A B', generation: 1, attrs_json: attrs, ...ach } as any);
const thin = heirGeneBasis(tok({ ach_seasons: 2, ach_apps: 30, ach_league: 0, ach_cup: 0, ach_promotions: 0, ach_tier: 0 }));
const rich = heirGeneBasis(tok({ ach_seasons: 16, ach_apps: 480, ach_league: 6, ach_cup: 3, ach_promotions: 2, ach_tier: 4 }));
const SEED = 20260830;
const ceilSum = (h: any) => (['pace', 'strength', 'stamina'] as const).reduce((n, k) => n + h.genes[k].ceiling, 0);
const thinSons = mintHeirs(thin.parentGenes, SEED, 3, thin.ceilingLift);
const richSons = mintHeirs(rich.parentGenes, SEED, 3, rich.ceilingLift);
const thinAvg = thinSons.reduce((n, h) => n + ceilSum(h), 0) / thinSons.length;
const richAvg = richSons.reduce((n, h) => n + ceilSum(h), 0) / richSons.length;
console.log(`  ..   summed genetic ceiling across ${thinSons.length} sons — thin record ${thinAvg.toFixed(1)}, great record ${richAvg.toFixed(1)}`);
ok(richSons.length === thinSons.length && thinSons.length > 1, 'both fathers left the same number of sons to compare (a like-for-like test)');
ok(richAvg > thinAvg, "the decorated father's sons start with the higher ceilings");

// VACUITY GUARD: the two fathers must actually differ in the input, or the comparison proves nothing.
ok(rich.ceilingLift !== thin.ceilingLift, 'the two fathers genuinely earned different lifts');

console.log(fails ? `\n✗ ${fails} — a father's record does not reach his children` : '\n✓ the earned inheritance survives the succession');
if (fails) process.exitCode = 1;
