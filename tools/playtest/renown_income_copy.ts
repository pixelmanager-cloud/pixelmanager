// THE ONE SCREEN WHOSE JOB IS TO EXPLAIN RENOWN MUST NAME ONLY WHAT RENOWN ACTUALLY PAYS.
//
// `renownIncomeMult` is applied in exactly ONE place in the whole game: the league finishing prize in
// api.ts's `spSeasonReward` (`... * tierMult * houseMult`). Everything else in that season's credit is
// added raw — the performance `sponsorBonus`, and all five streams of `seasonFacilityIncome` (gate,
// sponsor, shop, womens, merit).
//
// The Houses panel said "sponsorship and gate follow the family". Those are two of the streams the
// multiplier does NOT touch, and the player sees both itemised under those exact names on the season
// card. On a maxed top-flight club that advertises a x1.39 on ~10,428 coins of facility income and pays
// it on a ~1,779 coin prize — the panel pointed at the biggest streams and delivered on the smallest.
//
// A false mechanic in the screen whose stated job is to answer "what is renown FOR" is worse than no
// screen, because the player budgets around it. This probe is the guard for that class.
//
// Run: `npx tsx tools/playtest/renown_income_copy.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the renown income line names only the stream renown multiplies ===');

// ── 1. THE PREMISE, read from the source rather than assumed. If someone later extends the multiplier
// onto the facility streams, these go red FIRST — at which point the copy below would be allowed to name
// them and this probe wants retiring, rather than the copy wanting another edit.
const api = readFileSync('client/src/api.ts', 'utf8');
const apiCode = api.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const onPrize = /\* tierMult \* houseMult\)/.test(apiCode);
const rawCredit = /const credit = prize \+ sponsorBonus \+ facIncome\.total \+ arcCoins;/.test(apiCode);
// Declaration, the prize expression, and the field handed back to the UI. A FOURTH reference means it
// now multiplies something else, and the sentence the panel prints is no longer the whole truth.
const uses = (apiCode.match(/houseMult/g) ?? []).length;
ok(onPrize && rawCredit, 'houseMult multiplies the league prize, and the rest of the credit is summed raw (the premise)');
ok(uses === 3, `houseMult is referenced ${uses} time(s) in api.ts — the declaration, the prize, the returned field`);
if (!onPrize || !rawCredit || uses !== 3) console.log('  ..   the multiplier moved — re-read this probe before trusting the failure below');

// ── 2. THE PLAYER-FACING LINE, extracted from source. Exactly one span renders the multiplier.
const main = readFileSync('client/src/main.ts', 'utf8');
const rendered = main.split('\n').filter((l) => l.includes('renownIncomeMult('));
console.log(`  ..   ${rendered.length} rendered line(s) found in main.ts`);
for (const l of rendered) console.log(`       ${l.trim()}`);
// VACUITY GUARD. A reworded panel that no longer matches would let this probe pass having read nothing —
// the failure mode that kept four dead `transition: width` rules alive in this codebase for months.
ok(rendered.length === 1, 'exactly one panel line renders renownIncomeMult (not a zero-of-zero pass)');

// Each stream renown leaves alone, tied to the code that credits it un-multiplied.
const EXEMPT: { re: RegExp; what: string }[] = [
  { re: /sponsor/i, what: 'sponsorship — both `sponsorBonus` and `facIncome.sponsor` are credited raw' },
  { re: /\bgate\b|turnstile|attendance/i, what: 'gate receipts — `facIncome.gate` is credited raw' },
  { re: /\bshop\b|merchandis/i, what: 'shop income — `facIncome.shop` is credited raw' },
  { re: /women/i, what: "the women's team — `facIncome.womens` is credited raw" },
  { re: /\bmerit\b/i, what: 'division merit — `facIncome.merit` is credited raw' },
  { re: /commercial|matchday|\brevenue\b/i, what: 'the commercial layer at large — only the finishing prize is multiplied' },
];
const bad: string[] = [];
for (const l of rendered) for (const e of EXEMPT) if (e.re.test(l)) bad.push(`the renown income line names ${e.what}`);
for (const b of bad) console.log(`       ${b}`);
ok(bad.length === 0, `the renown income line names no stream the multiplier leaves untouched (${bad.length} found)`);

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
