// A TRANSFER-IN TIER NOBODY CAN BE SIGNED INTO IS PROSE NOBODY CAN READ.
//
// `transfer_in` has exactly ONE emit site — `doBuyPlayer`, the transfer market's confirm — and it builds
// the person out of the listing with `seasonsAtClub: 0` hardcoded, because a man being transferred IN has
// by definition been at the club no seasons. `tierFor` gates `.established` on `yrs >= 4` and `.servant`
// on `yrs >= 8`, so both are unreachable BY CONSTRUCTION at that call site, whatever the shop lists.
//
// `transfer_in.established` held three lines about a returning ex-player. That beat is not mis-wired, it
// is unrepresentable: market ids are minted fresh every season (`mk:season:tier:i` and `hs:season:name`),
// so a man the club sold and re-signed is indistinguishable from a stranger. The three lines are deleted
// (§97) and the idea is written down in docs/game-upgrade-ideas.md instead.
//
// `.veteran` (18 lines) and `.star` (12) are dark ON PURPOSE and are named in DARK_BY_CHOICE below —
// `.veteran` because widening the shop's 18-32 age band is a balance change, not a wiring fix
// (squadRetireAge is 34-37, so a 34-year-old would cost a 30-year-old's fee for one season), and `.star`
// because tools/playtest/star_retirement.ts already records that decision. A dark bank somebody chose is
// a decision; a dark bank nobody chose is a defect, and only a written-down list can tell them apart.
//
// NOT MEASURING ZERO OF ZERO, and mutation-proven both ways:
//   - put one line back under `transfer_in.established` and the undocumented-dark check goes red;
//   - change the emit site's `seasonsAtClub: 0` to a real tenure and the call-site check goes red;
//   - empty a DARK_BY_CHOICE bank and its own line goes red rather than the allowlist rotting silently.
// The reachable set is asserted to contain the two tiers the shop really does hit, so a shop that
// produced nothing would fail here rather than report every bank as dark.
//
// Run: `npx tsx tools/playtest/transfer_in_reach.ts`
import { readFileSync } from 'node:fs';
import { tierFor, type PersonCtx } from '../../shared/src/managerNarrate.js';
import { mergeBanks } from '../../shared/src/prompts/merge.js';
import { BASE_MGR } from '../../shared/src/manager/base.js';
import { MGR_EXTRA_1 } from '../../shared/src/manager/pack_1.js';
import { MGR_EXTRA_2 } from '../../shared/src/manager/pack_2.js';
import { MGR_EXTRA_3 } from '../../shared/src/manager/pack_3.js';
import { MGR_EXTRA_4 } from '../../shared/src/manager/pack_4.js';
import { MGR_EXTRA_5 } from '../../shared/src/manager/pack_5.js';
import { MGR_EXTRA_6 } from '../../shared/src/manager/pack_6.js';
import { transferList } from '../../shared/src/transfermarket.js';
import { houseListings } from '../../shared/src/houses.js';
import { tierStrength } from '../../shared/src/clubseason.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Banks that no signing can reach and that somebody DECIDED to keep, with the decision. */
const DARK_BY_CHOICE: Record<string, string> = {
  'transfer_in.veteran': 'the shop lists 18-32; widening it is a balance change (§97), not a wiring fix',
  'transfer_in.star': 'the star only joins at the take-the-reins handoff, where there is no fee (star_retirement.ts)',
};

console.log('=== Every transfer_in bank is one a signing can actually land in ===');

const BANK = mergeBanks(BASE_MGR, MGR_EXTRA_1, MGR_EXTRA_2, MGR_EXTRA_3, MGR_EXTRA_4, MGR_EXTRA_5, MGR_EXTRA_6);
const authored = Object.keys(BANK).filter((k) => k === 'transfer_in' || k.startsWith('transfer_in.')).sort();
console.log(`  ..   ${authored.length} transfer_in bank(s) authored: ${authored.map((k) => `${k.replace('transfer_in', '') || '(general)'} ${BANK[k].length}`).join(', ')}`);
ok(authored.length >= 4, 'the transfer_in banks are still tiered at all (otherwise everything below is vacuous)');

// ── the one call site, and the field that decides all of this ────────────────────────────────────────
const src = readFileSync('client/src/main.ts', 'utf8');
/** The Nth argument of the call whose '(' is at `open`, respecting nesting — the person slot is an object
 *  literal full of commas, which a `[^,)]+` capture would cut in half. */
function argAt(text: string, open: number, n: number): string {
  let depth = 0, arg = 0, start = open + 1;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) return arg === n ? text.slice(start, i) : ''; }
    else if (c === ',' && depth === 1) { if (arg === n) return text.slice(start, i); arg++; start = i + 1; }
  }
  return '';
}
const sites = [...src.matchAll(/this\.feed(?:Event|Once)\(\s*(?:'[^']*'\s*,\s*)?'transfer_in'\s*,/g)];
console.log(`  ..   ${sites.length} transfer_in emit site(s) in client/src/main.ts`);
// If a second one ever appears — the returning-player beat is exactly what would add it — the model of
// reachability below is no longer the whole story and this probe has to be rewritten, not extended.
ok(sites.length === 1, 'transfer_in still has exactly one emit site (a second one invalidates the reach model below)');
const person = sites.length === 1 ? argAt(src, src.indexOf('(', sites[0].index!), 2).trim() : '';
ok(/seasonsAtClub:\s*0\b/.test(person), `the signing is narrated with zero seasons at the club — got \`${person.slice(0, 60)}\``);

// ── what the shop can actually put in front of that call site ────────────────────────────────────────
const reachable = new Set<string>();
let listings = 0, minAge = 99, maxAge = 0;
for (let seed = 0; seed < 200; seed++) {
  for (let season = 1; season <= 12; season++) {
    for (const tier of [1, 3, 5, 7, 10]) {
      const s = seed * 7919 + 3;
      for (const l of [...houseListings(s, season, tier, seed % 4, tierStrength(tier)), ...transferList(s, season, tier)]) {
        // Built exactly the way doBuyPlayer builds it, so this measures the shipped call and not a likeness.
        const ctx: PersonCtx = { name: l.player.name, seasonsAtClub: 0, age: l.age, overall: l.ov };
        for (const k of tierFor('transfer_in', ctx)) reachable.add(k);
        listings++; minAge = Math.min(minAge, l.age); maxAge = Math.max(maxAge, l.age);
      }
    }
  }
}
console.log(`  ..   ${listings} shop listing(s) over 200 seeds x 12 seasons x 5 tiers, ages ${minAge}-${maxAge} → banks reached: ${[...reachable].sort().join(', ')}`);
ok(listings > 100000, `the shop actually produced listings (${listings}) — the reach set is not empty of nothing`);
ok(reachable.has('transfer_in.newcomer') && reachable.has('transfer_in.young'),
   'the enumeration really does vary the man (it reaches both .newcomer and .young)');

// ── the check ────────────────────────────────────────────────────────────────────────────────────────
const dark = authored.filter((k) => !reachable.has(k));
const undocumented = dark.filter((k) => !(k in DARK_BY_CHOICE));
ok(undocumented.length === 0,
   `no transfer_in bank is dark by accident${undocumented.length ? ` — ${undocumented.map((k) => `${k} (${BANK[k].length} line(s))`).join(', ')}` : ` (${dark.length} dark, all documented)`}`);
for (const [k, why] of Object.entries(DARK_BY_CHOICE)) {
  ok(!reachable.has(k) && (BANK[k]?.length ?? 0) > 0,
     `${k} is still the dark-by-choice bank this list describes — ${why}`);
}

console.log(fails ? `\n✗ ${fails} — a transfer_in bank nobody can reach` : '\n✓ every transfer_in bank is reachable, or dark on purpose');
if (fails) process.exitCode = 1;
