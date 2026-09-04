// THE ONE RETIREMENT THE WHOLE GAME IS ABOUT HAD NO WORDS FOR ITSELF.
//
// `retirement.star` is 23 authored lines written for exactly one moment — 'The bloodline player hangs them
// up. The family name goes on; his part in it does not.' — and `tierFor` only reaches that bank when the
// person handed to the narrator carries `isStar`. The event had a single emitter: the squad report's
// per-player loop, which narrates `advanceSquad`'s retired list. That list is built from the RAW
// `club.players`, and the bloodline star is a Token that is never in it (he is merged in for display by
// `mergedClub`), so no man that loop can name is ever him. Meanwhile his real retirement — `retireStar`,
// the send-off card the dynasty turns on — pushed no feed line at all. 23 lines, unreachable, in a game
// whose one subject is this family.
//
// Same failure shape as the four climb events (tools/playtest/narration_tiers.ts), a disjoint set of call
// sites. This probe asserts the retirement half and PRINTS the rest as a `..` inventory, because two
// sibling banks are still out of reach on purpose and a reader should be able to see that without digging:
//   transfer_in.star  — the star only ever joins at the take-the-reins handoff, where there is no fee, and
//                       6 of the 104 lines in that pool spend a `{fee}` the call site could not supply.
//   transfer_out.star — his only exit is `acceptStarBid`, whose send-off deliberately renders no season
//                       report (see retireStar), so a line written there lands in a (season, gen) pair the
//                       save can never show again. Both are content decisions, not one-line wirings.
//
// Run: `npx tsx tools/playtest/star_retirement.ts`
import { readFileSync } from 'node:fs';
import { eligible } from '../../shared/src/managerNarrate.js';
import { mergeBanks } from '../../shared/src/prompts/merge.js';
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

console.log('=== The bloodline player retires, and the feed has words for it ===');

// mergeBanks, not a spread: three packs each define `retirement.star`, and `{ ...a, ...b }` keeps only the
// last one's lines — which would report this bank as 10 lines rather than 23.
const BANK = mergeBanks(BASE_MGR, MGR_EXTRA_1, MGR_EXTRA_2, MGR_EXTRA_3, MGR_EXTRA_4, MGR_EXTRA_5, MGR_EXTRA_6);
console.log(`  ..   ${Object.keys(BANK).length} bank key(s) merged from base + six packs`);
ok(Object.keys(BANK).length > 60, 'the packs actually loaded (base alone is 35 keys; with all six it is 100)');

/** The Nth argument of the call whose '(' is at `open`, respecting nesting. A `[^,)]+` capture would read
 *  `this.personCtx(rp, rp.id === this.loadMgr().starId)` as `this.personCtx(rp` — and the half it throws
 *  away is the half this probe exists to look at. */
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

/** Can what this call site passes in the person slot ever carry `isStar`? `personCtx`'s flag DEFAULTS TO
 *  FALSE, so an omitted second argument is not star-capable — which is precisely how 23 lines went dark. */
function starCapable(person: string): boolean {
  if (/this\.starCtx\(\)/.test(person) || /isStar\s*:\s*true/.test(person)) return true;
  for (let i = person.indexOf('this.personCtx('); i >= 0; i = person.indexOf('this.personCtx(', i + 1)) {
    const flag = argAt(person, i + 'this.personCtx'.length, 1).trim();
    if (flag !== '' && flag !== 'false') return true;
  }
  return false;
}

type Site = { event: string; person: string; at: number };
const sites: Site[] = [];
for (const m of src.matchAll(/this\.(feedEvent|feedOnce)\(/g)) {
  const open = m.index! + m[0].length - 1;
  const evSlot = m[1] === 'feedOnce' ? 1 : 0;   // feedOnce(key, event, icon, person), feedEvent(event, icon, person)
  const person = argAt(src, open, evSlot + 2).trim();
  // The event slot is a literal at every real call site but one, where it is a ternary picking between two
  // literals — take every literal it can produce, and skip feedOnce's own forwarding call, which has none.
  for (const e of argAt(src, open, evSlot).matchAll(/'([a-z_]+)'/g)) sites.push({ event: e[1], person, at: m.index! });
}
console.log(`  ..   ${sites.length} feed call site(s) parsed out of client/src/main.ts`);
ok(sites.length > 10, 'the call-site scan found the feed writers (otherwise everything below is vacuous)');

const starEvents = [...new Set(Object.keys(BANK).filter((k) => k.endsWith('.star')).map((k) => k.slice(0, -5)))].sort();
for (const ev of starEvents) {
  const all = sites.filter((s) => s.event === ev);
  console.log(`  ..   ${ev}.star: ${String((BANK[`${ev}.star`] ?? []).length).padStart(2)} line(s), ${all.filter((s) => starCapable(s.person)).length}/${all.length} call site(s) can carry the star`);
}

const retirement = sites.filter((s) => s.event === 'retirement');
console.log(`  ..   ${retirement.length} retirement call site(s)`);
ok(retirement.length > 0, 'retirement is emitted at all');
ok((BANK['retirement.star'] ?? []).length >= 20, `retirement.star still carries its lines (${(BANK['retirement.star'] ?? []).length})`);

// NOT MEASURING ZERO OF ZERO. If the star tier were empty, or tierFor stopped appending it, every
// assertion below could be satisfied by a call site that reaches the same prose everyone else gets.
const P = { name: 'Ravi Kestrel', role: 'MID', age: 34, morale: 70, seasonsAtClub: 12 };
const starPool = eligible('retirement', { ...P, isStar: true }).length;
const plainPool = eligible('retirement', P).length;
console.log(`  ..   retirement pool: ${starPool} line(s) for the bloodline player vs ${plainPool} for anybody else`);
ok(starPool > plainPool, 'the star tier adds prose nothing else can reach');

const carriers = retirement.filter((s) => starCapable(s.person));
ok(carriers.length > 0, `a retirement call site is told the man is the bloodline star — got ${retirement.map((s) => `\`${s.person.slice(0, 40)}\``).join(', ')}`);

// WHERE it is written decides whether anybody reads it. The rollover's retirement branch saves the season
// on, then hands off to retireStar, and the send-off is the last screen that (season, gen) pair ever gets —
// so a line written anywhere else in that path is filed under a season the save can never show again.
const branch = src.indexOf('if (age >= (m.retireAge ?? 34))');
const handOff = src.indexOf('this.retireStar(', branch);
ok(branch > 0 && handOff > branch, 'the season rollover still hands a retiring star to retireStar (the anchor this probe measures against)');
ok(carriers.some((s) => s.at > branch && s.at < handOff),
   'and that line is written on the rollover, before the send-off — the only screen it is ever read on');
ok(/const finalReport = sold \? '' : this\.seasonFeedHtml\(/.test(src),
   "the send-off still reads the season's feed on the retirement path (that is what makes the line visible)");

console.log(fails ? `\n✗ ${fails} — the dynasty's own retirement is narrated as a stranger's` : '\n✓ the bloodline player retires in his own words');
if (fails) process.exitCode = 1;
