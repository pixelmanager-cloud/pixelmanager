// THE SEND-OFF COUNTED A SEASON HE NEVER PLAYED.
//
// `retireStar` renders the headline figure of the retirement card — "after 13 seasons steering the club" —
// from `const seasons = m.season`, read straight out of the save. That was right until the rollover was made
// to CLOSE the season before handing over: `nextSeason` now saves `season: m.season + 1` (so the retirement
// branch cannot be re-entered for a second prize, a second sponsor bonus and a duplicate title) and only
// THEN calls `retireStar`, which re-reads the counter that save just moved. So the man whose last campaign
// was season 12 was announced as retiring after 13 — wrong on every retirement, in the biggest sentence the
// game ever writes about him. That earlier fix is correct and must stay, so this probe pins BOTH halves:
// the season is still closed before the hand-off, AND the number on the card is the career that was played.
//
// The two ways into `retireStar` reach it with the counter in different states, which is the whole trap:
//   retirement (nextSeason)  — the counter has ALREADY advanced, so the seasons served is `m.season - 1`;
//   sale       (acceptStarBid) — fires mid-season, counter untouched, so it is `m.season` (as shipped).
// A bare `m.season` cannot be right for both, and neither can a bare `m.season - 1`. Both are asserted, so
// neither can be traded for the other.
//
// Checked at the source level because main.ts is a browser module nothing can import: the probe LIFTS the
// derivation and the sentence it feeds out of the file and EVALUATES them against simulated careers, the
// way tools/playtest/mgr_season_rebuild.ts does, rather than pattern-matching the text — so any future
// rewrite is measured the same way. If either can no longer be found, or an argument reaches for something
// this harness cannot supply, the probe FAILS rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/send_off_career_length.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The rollover still closes the season before the send-off ===');

const branch = src.indexOf('if (age >= (m.retireAge ?? 34))');
const handOff = src.indexOf('this.retireStar(', branch);
const close = src.indexOf('season: m.season + 1', branch);
ok(branch > 0 && handOff > branch, 'the rollover still hands a retiring star to retireStar');
ok(close > branch && close < handOff,
   'and still saves `season: m.season + 1` BEFORE that hand-off — undo this and the double rollover is back');

const saleFn = src.indexOf('private acceptStarBid(');
const saleCall = src.indexOf('this.retireStar(', saleFn);
const decl = src.indexOf('private retireStar(');
ok(saleFn > 0 && saleCall > saleFn && saleCall < decl, 'acceptStarBid still reaches retireStar too');
ok(saleFn > 0 && src.slice(saleFn, saleCall).indexOf('season: m.season') < 0,
   'and the sale path still does NOT move the counter first (it fires mid-season)');

console.log('\n=== ...so the number on the card is the seasons he actually played ===');

/** Top-level comma split of the (…) opening at `open`. Quote-aware: the call site being read carries
 *  `{ move: promoted ? 'promoted' : 'relegated', … }`, and a bare depth counter would split inside it. */
function args(text: string, open: number): string[] {
  const out: string[] = [];
  let depth = 0, start = open + 1, q = '';
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) { out.push(text.slice(start, i)); return out; } }
    else if (c === ',' && depth === 1) { out.push(text.slice(start, i)); start = i + 1; }
  }
  return [];
}

/** Each parameter as {name, default}. Depth-aware, because the object type annotations hide colons of their
 *  own — a `p.split(':')[0]` reads `finalMove?: { move: 'promoted'…` as the parameter called `finalMove?: { move`. */
function paramsOf(list: string[]): { name: string; def: string }[] {
  return list.map((p) => {
    let depth = 0, colon = -1, eq = -1, q = '';
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      else if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') depth--;
      else if (depth === 0 && c === ':' && colon < 0) colon = i;
      else if (depth === 0 && c === '=' && eq < 0 && p[i + 1] !== '=' && p[i - 1] !== '!' && p[i - 1] !== '=') eq = i;
    }
    const cut = Math.min(colon < 0 ? p.length : colon, eq < 0 ? p.length : eq);
    return { name: p.slice(0, cut).trim().replace(/\?$/, ''), def: eq < 0 ? '' : p.slice(eq + 1).trim() };
  });
}

/** retireStar's body, brace-matched. Scoped rather than searched from `decl` to the end of the file, so a
 *  deleted declaration cannot be silently answered by the next `const seasons` somewhere else in main.ts. */
function body(from: number): string {
  let depth = 0;
  for (let i = src.indexOf('{', src.indexOf(')', from)); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(from, i); }
  }
  return '';
}

const P = paramsOf(args(src, src.indexOf('(', decl)));
const NAMES = P.map((p) => p.name);
console.log(`  ..   retireStar(${NAMES.join(', ')})`);
ok(P.length >= 4 && NAMES[0] === 'titles', 'the parameter list parsed (otherwise every reading below is a guess)');

const fn = body(decl);
const seasonsExpr = (/^[ \t]*const seasons = ([\s\S]*?);[ \t]*$/m.exec(fn) ?? [])[1];
const eraExpr = (/^[ \t]*const era = (`[^`]*`);[ \t]*$/m.exec(fn) ?? [])[1];
ok(!!seasonsExpr, 'retireStar still derives `seasons` in one declaration');
ok(!!eraExpr && /\$\{seasons\}/.test(eraExpr ?? ''), 'and `era` — the phrase printed on the card — is still built from it');
console.log(`  ..   const seasons = ${seasonsExpr};`);

/** Which parameters that derivation actually reads. Those are the only arguments worth evaluating; the rest
 *  of the call site is promotion narration this number does not depend on. */
const used = NAMES.filter((n) => n && new RegExp(`\\b${n}\\b`).test(seasonsExpr ?? ''));
console.log(`  ..   it reads ${used.length ? used.join(', ') : 'no argument at all — only the counter in the save'}`);

/** Run the lifted derivation for one call site. `mgr` is what `loadMgr()` returns INSIDE retireStar at that
 *  moment; the call site's arguments are evaluated in the CALLER's scope, where `m` is the snapshot
 *  nextSeason took before the rollover save. Anything else an argument reaches for is a ReferenceError. */
function evalAt(callOpen: number, mgr: any, caller: { m: any; bid: any }): { seasons: number; era: string } {
  const actual = args(src, callOpen);
  const vals = P.map((p, i) => {
    if (!used.includes(p.name)) return undefined;
    const a = (actual[i] ?? '').trim();
    const text = a === '' || a === 'undefined' ? (p.def || 'undefined') : a;
    return new Function('m', 'bid', `return (${text});`)(caller.m, caller.bid);
  });
  return new Function('m', '__a', `const [${NAMES.join(', ')}] = __a;\nconst seasons = ${seasonsExpr};\nreturn { seasons, era: ${eraExpr} };`)(mgr, vals);
}

// MgrState.season starts at 1 and IS the season being played (the hub renders `Season ${mgr.season}`), so a
// man whose final campaign is season N played N of them. Four lengths, not one: a single point cannot tell
// an off-by-one from a right answer, and season 1 is the only one where the singular "1 season" is on show.
const PLAYED = [1, 2, 12, 20];
let wrongRet = 0, wrongSale = 0, blew = false;
for (const n of PLAYED) {
  try {
    // retirement: the save was moved to `n + 1` a few statements ago; nextSeason's own `m` still reads n.
    const r = evalAt(handOff + 'this.retireStar'.length, { season: n + 1 }, { m: { season: n, contTitles: 0, titles: 0 }, bid: { fee: 1, club: 'X' } });
    // sale: mid-season, nothing has moved.
    const s = evalAt(saleCall + 'this.retireStar'.length, { season: n, titles: 0 }, { m: { season: n, contTitles: 0, titles: 0 }, bid: { fee: 1, club: 'X' } });
    console.log(`  ..   final season ${String(n).padStart(2)}: retirement card says "${r.era}", sale card says "${s.era}"`);
    if (r.seasons !== n) wrongRet++;
    if (s.seasons !== n) wrongSale++;
  } catch (e) {
    ok(false, `the derivation could not be evaluated for a ${n}-season career — ${(e as Error).message}`);
    blew = true;
    break;
  }
}
ok(!blew && PLAYED.length > 1, 'more than one career length was measured (this is not one point proving itself)');
ok(wrongRet === 0, `the retirement send-off counts the seasons he played (${wrongRet} of ${PLAYED.length} careers miscounted)`);
ok(wrongSale === 0, `and the sale send-off still reads the season he is in, as shipped (${wrongSale} of ${PLAYED.length} moved)`);

console.log(fails ? `\n✗ ${fails} — the send-off gets his career length wrong` : '\n✓ the card counts his seasons, on both ways out');
if (fails) process.exitCode = 1;
