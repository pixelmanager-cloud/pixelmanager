// AN ARC OFFERED BEFORE THE FACILITY LEVELS LAND COMES OUT OF A SMALLER LIBRARY.
//
// `showSeason()` fires `api.facilities()` and then, 130 lines further down the SAME synchronous call,
// offers the season's story arc. A `.then` is a microtask, so the offer always won that race and was made
// against a `facLevels` still `{}`. `arcFits` reads `(s.facilities?.[w.facility.key] ?? 1) < w.facility.min`,
// so on the first season screen of every page load all 30 `when.facility` arcs were ineligible — and since
// `pickManagerArc` weights each category by `Math.sqrt(pool.length)` over the ELIGIBLE set, a hole in one
// category moves the pick in every category, not just the gated ones. The callback did carry a re-offer,
// guarded on `!arcNow` — which the synchronous call it was written to compensate for had already set. Dead
// from the day it was written.
//
// Nothing failed: a wrong arc is still a real arc. The symptom is a library the player never sees all of,
// and a first-arc-of-the-session that depends on promise ordering rather than on the seed.
//
// Run: `npx tsx tools/playtest/arc_facility_gate.ts`
import { readFileSync } from 'node:fs';
import { MANAGER_ARCS, pickManagerArc, type MgrSituation } from '../../shared/src/managerarc.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Arc facility gate: no arc is offered against facility levels that have not loaded ===');

// ── 1. THE PRICE OF GETTING IT WRONG, measured rather than asserted from the armchair ──────────────
const gated = (MANAGER_ARCS as any[]).filter((a) => a.when?.facility);
console.log(`  ..   ${gated.length} of ${MANAGER_ARCS.length} manager arcs are gated on a facility level`);
ok(gated.length > 0, 'facility-gated arcs exist at all (this is not measuring an empty set)');

const maxed: Record<string, number> = {};
for (const a of gated) maxed[a.when.facility.key] = 10;
const sit = (facilities: Record<string, number> | undefined): MgrSituation => ({
  season: 4, tier: 3, posFrac: 0.4, coins: 900,
  hasWonderkid: true, hasVeteran: true, hasUnhappy: true, squadSize: 20,
  tags: new Set<string>(), temper: 'builder', facilities,
});
const N = 3000;
let moved = 0;
for (let s = 0; s < N; s++) {
  const before = pickManagerArc(s >>> 0, sit(undefined), new Set<string>());
  const after = pickManagerArc(s >>> 0, sit(maxed), new Set<string>());
  if (before !== after) moved++;
}
const pct = (moved / N) * 100;
console.log(`  ..   an unloaded facility set changes which arc a seed offers in ${moved}/${N} cases (${pct.toFixed(1)}%)`);
// Not a balance bar — it is the price tag on the ordering checks below. If `arcFits` ever stops reading
// `facilities`, this goes to 0 and those checks would be guarding nothing at all.
ok(pct >= 10, `an unloaded facility set materially moves the pick (${pct.toFixed(1)}% >= 10%)`);

// ── 2. THE ORDERING ITSELF. Every offer in showSeason waits for the levels. ────────────────────────
const src = readFileSync('client/src/main.ts', 'utf8');

/** [start, end) of the balanced `{...}` block that opens at the first `{` at or after `from` */
function block(text: string, from: number): [number, number] {
  const open = text.indexOf('{', from);
  let depth = 0;
  for (let j = open; j < text.length; j++) {
    if (text[j] === '{') depth++;
    else if (text[j] === '}') { depth--; if (depth === 0) return [open, j + 1]; }
  }
  return [open, text.length];
}

const showAt = src.indexOf('private showSeason() {');
ok(showAt !== -1, 'showSeason() was found (the scanner still matches this file)');
const [sStart, sEnd] = block(src, showAt);
const body = src.slice(sStart, sEnd);

const facAt = body.indexOf('api.facilities().then(');
ok(facAt !== -1, 'showSeason still loads the facility levels');
const [fStart, fEnd] = block(body, facAt);
const facCb = body.slice(fStart, fEnd);

const offers: number[] = [];
for (let i = body.indexOf('this.maybeOfferArc('); i !== -1; i = body.indexOf('this.maybeOfferArc(', i + 1)) offers.push(i);
const deferred = offers.filter((i) => i >= fStart && i < fEnd).length;
console.log(`  ..   ${offers.length} arc offer(s) in showSeason, ${deferred} of them inside the facilities callback`);
ok(offers.length > 0, 'showSeason still offers arcs (this is not measuring an empty set)');

for (const i of offers) {
  const line = body.slice(body.lastIndexOf('\n', i) + 1, body.indexOf('\n', i)).trim();
  const inCallback = i >= fStart && i < fEnd;
  ok(inCallback || /facLoaded/.test(line), `this offer waits for the levels — '${line.slice(0, 64)}'`);
}

// The offer is DRAWN inline by managerArcHtml(), in the body showSeason builds after this callback would
// have run. An offer made in the callback that does not repaint is an arc the player is never shown.
ok(/maybeOfferArc/.test(facCb) && /showSeason\(\)/.test(facCb), 'the deferred offer repaints the season screen');

// And a facilities() read that REJECTS must release the offers on the old level-1 behaviour rather than
// freeze them for the rest of the page session. Content that silently never appears is this file's
// recurring failure mode, not a hypothetical one.
const after = body.slice(fEnd, fEnd + 240);
ok(/\.catch\([\s\S]{0,160}?facLoaded/.test(after), 'a failed facilities read still releases the arc offers');

console.log(fails ? `\n✗ ${fails} check(s) failed — the season screen can offer an arc against level-1 facilities` : '\n✓ arcs are only ever offered against facility levels that have actually loaded');
if (fails) process.exitCode = 1;
