// THE PRICE ON THE BUY BUTTON MUST BE GROUPED LIKE EVERY OTHER PRICE THE SAME CLICK PRINTS.
//
// The facility card's Upgrade button prints one coin figure four times — an aria-label, a disabled title,
// the affordable label and the "Need …" label — and the confirm that button opens prints it twice more.
// Five of those six went through `.toLocaleString('en-US')`; the affordable label interpolated the number
// raw. A level-10 upgrade therefore read "Upgrade · 💰 14000 ▶" on the card while the disabled twin on the
// card beside it read "Need 💰 14,000c" and the dialog that same click opened said "14,000c" — one price,
// two shapes, on one control (F-277 / F-283).
//
// locale_stable_numbers.ts cannot see this. It audits the calls that ARE toLocaleString and asks whether
// they name a locale; a figure that never calls toLocaleString at all is invisible to it. That is how this
// site survived F-065 and F-203, which closed the same class elsewhere.
//
// Scope is this one screen on purpose, not a sweep for `💰 ${…}`. The scout destinations interpolate raw
// coins too, but BOTH of their states are raw and suffix-less so they never contradict each other, and a
// trip costs 72-140 — permanently below any separator. The facility card is where the engine's own price
// table crosses 1,000 AND the two states of a single control disagree.
//
// Run: `npx tsx tools/playtest/facility_price_grouped.ts`
import { readFileSync } from 'node:fs';
import { upgradeCost, MAX_LEVEL } from '../../shared/src/facilities.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The facility price reads the same in every place one click prints it ===');

const src = readFileSync('client/src/main.ts', 'utf8');

// VACUITY GUARD, and the first thing to mutation-test: every assertion below runs over the interpolations
// found inside renderFacilities. Rename the method or move the confirm and the slice comes back empty, the
// loop measures nothing and the probe reports green. It has to fail HERE instead.
const from = src.indexOf('private renderFacilities(');
const to = src.indexOf('private async mothballFacility(', from);
ok(from >= 0 && to > from, 'renderFacilities still draws the facility cards and the confirm they open');

const span = from >= 0 && to > from ? src.slice(from, to) : '';
// Innermost `${…}` only: the disabled branch is a nested template literal, so a greedy match would swallow
// three of the six figures inside one outer interpolation and never see their shape.
const priced = [...span.matchAll(/\$\{([^{}]*?)\}/g)].map((m) => m[1]).filter((e) => e.includes('upgradeCost'));
console.log(`  ..   ${priced.length} place(s) in renderFacilities interpolate an upgrade price`);
// VACUITY GUARD: four on the button, two in the confirm. Fewer means the screen has been rewritten and
// this probe is guarding a control that no longer exists.
ok(priced.length >= 4, `the button and its confirm still print the price this probe checks (${priced.length} sites)`);

const rawPriced = priced.filter((e) => !e.includes('.toLocaleString('));
for (const e of rawPriced) console.log(`       ungrouped: \${${e}}`);
ok(rawPriced.length === 0, `every upgrade price on the card and in its dialog is grouped (${rawPriced.length} raw)`);
// The client's other coin figures all name en-US so a German browser cannot reshape one of them mid-screen
// — the same rule, asserted at this site rather than left for locale_stable_numbers to notice afterwards.
const hostLocale = priced.filter((e) => /\.toLocaleString\(\s*\)/.test(e));
ok(hostLocale.length === 0, `each grouped price names its locale instead of the host's (${hostLocale.length} bare)`);

// ── The shape only matters if the number is long enough to take a separator.
const prices = Array.from({ length: MAX_LEVEL - 1 }, (_, i) => upgradeCost(i + 1) ?? 0);
const long = prices.filter((p) => p >= 1000);
const dearest = long[long.length - 1] ?? 0;
console.log(`  ..   upgrade prices ${prices.join('/')} — ${long.length} of ${prices.length} run to four digits`
  + (long.length ? ` (the dearest prints "${dearest}" raw against "${dearest.toLocaleString('en-US')}" grouped)` : ''));
// VACUITY GUARD: flatten the cost curve under 1,000 the way scout trips are and grouping stops being
// observable at all — at which point this probe should be retired, not left passing over nothing.
ok(long.length > 0, 'the price table still crosses 1,000, so the grouping is something a player can see');

console.log(fails ? `\n✗ a facility price prints in a different shape from the others on the same click`
                  : `\n✓ the upgrade price reads the same on the card, on its twin and in the dialog`);
if (fails) process.exitCode = 1;
