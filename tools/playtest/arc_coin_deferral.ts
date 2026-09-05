// A PRICE THE PLAYER IS SHOWN MUST BE TAKEN BY THE CODE THAT SHOWS IT, OR NAMED WHERE IT IS TAKEN INSTEAD.
//
// 1,029 of the 2,513 manager-arc options carry a `coins` effect — 612 of them a spend, as deep as −680 —
// and F-089 put that figure on the button ("💰−680c"). The click never moved a coin, though: applyArcEffect
// wrote the delta onto `this.account.coins`, a RENDER mirror that `setMe(await api.me())` replaces wholesale
// at 19 sites — including settleInjuries, which runs after EVERY league fixture — and that renderFacilities
// overwrites outright with the store's balance. So the header dropped 680c on the click and silently climbed
// back one match later, and the most expensive call on the season screen read as free.
//
// The deferral itself is the DESIGN, not the bug (see MgrState.arcCoins): the price is banked and folded
// into the season credit by api.ts's spSeasonReward. What was broken either side of it was the phantom
// decrement on the click, and the silence at the settlement — the bill arrived inside the prize with nothing
// naming it, so a season the player had spent his way through read as a bad payout instead.
//
// Three rules, then:
//   1. applyArcEffect touches no coin display — the click's only coin write is the banked `arcCoins`.
//   2. the rollover NAMES the banked figure, the way it already itemises every other term of the credit.
//   3. the button says WHEN the money moves, and claims nothing about the click that the click does not do.
//
// Run: `npx tsx tools/playtest/arc_coin_deferral.ts`
import { readFileSync } from 'node:fs';
import { MANAGER_ARCS } from '../../shared/src/managerarc.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Arc coin prices — deferred, never phantom, always named ===');

// ── 0. THE LIBRARY, measured rather than quoted. If the packs ever stop pricing options, every check below
// is asking about nothing. Mutation-tested by pointing the walk at `[]`: this line goes red first and says
// the walk broke, instead of the file passing green over an empty set the way arc_effects.ts once did.
let options = 0, priced = 0, deepest = 0;
for (const a of MANAGER_ARCS as any[]) for (const b of Object.values(a.beats ?? {}) as any[])
  for (const o of (b.choices ?? b.options ?? []) as any[]) {
    options++;
    const c = Number(o.effect?.coins ?? 0);
    if (c) { priced++; deepest = Math.min(deepest, c); }
  }
console.log(`  ..   ${priced} of ${options} arc options carry a coins effect, deepest spend ${deepest}c`);
ok(priced >= 500, 'the arc library actually prices options (not a zero-of-zero pass)');

const main = readFileSync('client/src/main.ts', 'utf8');
const api = readFileSync('client/src/api.ts', 'utf8');

// ── 1. THE PREMISE, read from source rather than assumed: the price is deferred, and the deferral lands.
// If either of these goes red the design has moved under this probe — re-read it before believing §2–§4,
// because "no coin write on the click" is only correct while the banked path is still there to take it.
const fnStart = main.indexOf('private applyArcEffect');
ok(fnStart > 0, 'applyArcEffect was located in main.ts');
const impl = main.slice(fnStart, main.indexOf('\n  }', fnStart));
console.log(`  ..   applyArcEffect body is ${impl.length} chars`);
ok(impl.length > 1000, 'the applyArcEffect body was actually read (not a zero-of-zero pass)');
ok(/next\.arcCoins = \(next\.arcCoins \?\? 0\) \+ e\.coins;/.test(impl),
   'applyArcEffect still BANKS the price in arcCoins (the premise: the charge is deferred, not skipped)');
ok(/const credit = prize \+ sponsorBonus \+ facIncome\.total \+ arcCoins;/.test(api),
   'spSeasonReward still folds arcCoins into the season credit (the premise: the deferral lands)');

// ── 2. NO PHANTOM DECREMENT. `this.account` is a render mirror, not the treasury; every write to it from
// here is a number that reverts on the next api.me(). Any reference in CODE is wrong in this method —
// reading the mirror to decide a charge would be the same mistake facing the other way. Comments are
// stripped first, deliberately: the block that replaced the old line has to be free to explain what the
// mirror is and why nothing writes to it, or the fix cannot document itself. The no-colon guard on the
// line stripper is the one arc_gate_comment_truth.ts uses, so a `https://` in a comment is not half-eaten.
const code = impl.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const mirrored = code.split('\n').map((l) => l.trim()).filter((l) => l.includes('this.account'));
for (const l of mirrored) console.log(`       ${l}`);
ok(mirrored.length === 0,
   `applyArcEffect touches the this.account display mirror on ${mirrored.length} line(s) — it must move only arcCoins`);

// ── 3. THE SETTLEMENT IS NAMED. `m.arcCoins` reaches the rollover twice once this is right: as the figure
// handed to spSeasonReward, and inside a line the player reads. One occurrence means the bill is silent —
// folded into `prize + sponsorBonus + facIncome.total + arcCoins` with only the first two ever spoken aloud.
const rs = main.indexOf('private async nextSeason()');
ok(rs > 0, 'nextSeason was located in main.ts');
let depth = 0, re = rs;
for (let i = main.indexOf('{', rs); i < main.length; i++) {
  if (main[i] === '{') depth++;
  else if (main[i] === '}') { depth--; if (depth === 0) { re = i; break; } }
}
const region = main.slice(rs, re);
console.log(`  ..   the rollover body is ${region.length} chars`);
ok(region.length > 2000, 'the rollover body was actually read (not a zero-of-zero pass)');
const refs = (region.match(/m\.arcCoins/g) ?? []).length;
console.log(`  ..   ${refs} m.arcCoins reference(s) inside the rollover`);
ok(/this\.(?:pushFeed|feedEvent|feedOnce)\([^;]*m\.arcCoins[^;]*\);/.test(region),
   `a feed line names what the season's arc decisions cost (${refs} reference(s) in the rollover, the argument alone is silence)`);

// ── 4. THE BUTTON SAYS WHEN, and claims nothing else. The tooltip is the only place a priced option can
// explain that the money leaves at the roll rather than on the click; without that the header not moving
// reads as the click having failed. Located by its own text so a rewrite that drops it goes red here
// rather than passing over a tooltip that no longer exists.
const tips = main.split('\n').filter((l) => l.includes('c of club money'));
console.log(`  ..   ${tips.length} arc-choice cost tooltip line(s) found`);
ok(tips.length === 1, 'exactly one arc-choice cost tooltip renders (not a zero-of-zero pass)');
ok(tips.every((l) => /season/i.test(l)), 'the priced-option tooltip says WHEN the money moves, not just how much');
// The affordability badge tests `coins + d < 0` — that the price exceeds the balance TODAY. It may say that;
// it may not say the click empties anything, because the click takes nothing and the roll clamps the credit
// at `-profile.coins` so the treasury cannot go under either way.
ok(!/⚠ empties the bank/.test(main), 'no arc-choice badge claims the click empties the bank — the click moves no coins');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
