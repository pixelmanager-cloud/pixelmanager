// A LIFESTYLE PURCHASE THAT MAKES HIM GREEDIER MUST SAY SO ON THE TILE THAT SELLS IT.
//
// `greed` is a top-level field on LifestyleItem, not a member of `perks`, so `perkLabel` cannot reach it —
// and the summer shop's effect line printed cost, recovery, market and perks only. Seven items carry
// `greed: 1` (agent-din, wardrobe, watch, mansion, restaurant, flash-jewellery, entourage) and
// `buyLifestyle` applies every one of them to `greedBonus`, which graduates into the player's `greed` and
// from there into `contractCost` (+~5.7% on every future extension wage per point) and `contractLength`
// (−0.18 seasons per point). Permanent, compounding, and invisible on the screen he bought it from.
//
// The game already discloses this exact field: the financial-offer tile renders `o.greed > 0 ? '· greedier '`.
// So the shop was the one render path that read the field and said nothing.
//
// This RUNS the tile's effect-line expression over the real catalogue rather than grepping for `li.greed`,
// because a grep passes on `${li.greed ? '' : ''}` — a clause that reads the field and still discloses
// nothing. Both halves are pinned: the greed-carrying items must speak, and the greed-free ones must stay
// silent, so a blanket word pasted into the line cannot satisfy this.
//
// Run: `npx tsx tools/playtest/lifestyle_greed_disclosed.ts`
import { readFileSync } from 'node:fs';
import { LIFESTYLE } from '../../shared/src/career.js';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The lifestyle shop discloses the greed a purchase adds ===');

const at = src.indexOf('const effs = li.clubInvest');
ok(at > 0, 'the summer shop tile still builds its effect line as `const effs = li.clubInvest ? … : …`');

// `perkLabel` is stubbed to a placeholder that provably contains no "greed": the real one can only render
// MeterKey icons and greed is not a meter, so stubbing keeps this measuring the line's own greed clause.
const perkLabel = () => '<perks/>';
const expr = at > 0 ? src.slice(src.indexOf('=', at) + 1, src.indexOf(';', at)) : "''";
const effs = new Function('li', 'perkLabel', `return (${expr});`) as (li: unknown, p: () => string) => string;
ok(!/greed/i.test(perkLabel()), 'the perk stub says nothing about greed, so only the tile can');

const greedy = LIFESTYLE.filter((i) => (i.greed ?? 0) !== 0);
const rest = LIFESTYLE.filter((i) => !(i.greed ?? 0));
// Guard against the assertion below running over an empty list and reporting green for nothing.
ok(greedy.length >= 7, `${greedy.length} of ${LIFESTYLE.length} items move his greed (7 today) — the check has something to run over`);
console.log(`  ..   ${rest.length} items leave greed alone and must stay silent about it`);

const silent = greedy.filter((i) => !/greed/i.test(effs(i, perkLabel)));
for (const i of silent.slice(0, 8)) console.log(`         ${i.id} (greed ${i.greed}) tile reads: ${effs(i, perkLabel)}`);
ok(silent.length === 0, `every greed-carrying item prints it (${greedy.length - silent.length}/${greedy.length})`);

const liars = rest.filter((i) => /greed/i.test(effs(i, perkLabel)));
ok(liars.length === 0, `and no greed-free item claims it (${liars.map((i) => i.id).join(', ') || 'none do'})`);

// The precedent the shop is being held to. If this ever goes, the shop is no longer the odd one out.
ok(/o\.greed > 0 \? '· greedier '/.test(src), 'the financial-offer tile still discloses the same field');

console.log(fails ? `\n✗ ${fails} check(s) failed — the shop is charging greed without printing it` : '\n✓ the shop names the greed it adds, as the offer tile does');
if (fails) process.exitCode = 1;
