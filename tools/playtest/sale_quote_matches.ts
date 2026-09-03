// THE PRICE ON THE BUTTON MUST BE THE PRICE THAT IS PAID.
//
// squadSaleValue(ov, age, saleMult = 1) prices a squad sale. api.sellPlayer passes the third argument —
// moraleEffects(p.morale ?? 65).sellMult — so what the club is actually credited swings with the player's
// mood. Both QUOTE sites called the two-argument form, so the sell button and its confirm dialog priced as
// if morale did not exist, and the number changed between reading it and clicking it.
//
// The sign of the error flips with mood, which is what made it survive: at the default morale of 65 the
// player is credited MORE than quoted, so the common case looks like a pleasant rounding artefact rather
// than a bug. An unhappy player is paid up to 20% less than the button promised, which is the case the
// squad-report copy explicitly advertises ("sell for less (up to 20% less)").
//
// This is a re-run of a defect already fixed once in this file: the comment above the confirm dialog
// describes wiring the AGE term into both quotes after a 35-year-old advertised at 380c banked 152c. The
// morale term was added to the credit later and the quotes were not revisited. Hence a probe, not a memo.
//
// Run: `npx tsx tools/playtest/sale_quote_matches.ts`
import { readFileSync } from 'node:fs';
import { squadSaleValue } from '../../shared/src/transfermarket.js';
import { moraleEffects } from '../../shared/src/morale.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A squad sale is quoted at the price it will actually pay ===');

// VACUITY GUARD. If the third argument stopped changing the answer, every assertion below would pass for
// the wrong reason. Prove the term is live before trusting any of it.
const base = squadSaleValue(14, 26);
const sad = squadSaleValue(14, 26, moraleEffects(0).sellMult);
const glad = squadSaleValue(14, 26, moraleEffects(100).sellMult);
const dflt = squadSaleValue(14, 26, moraleEffects(65).sellMult);
console.log(`  ..   ov 14 age 26 — 2-arg ${base}c · morale 0 ${sad}c · morale 65 ${dflt}c · morale 100 ${glad}c`);
ok(sad < base && glad > base, 'the saleMult argument actually moves the price (an unhappy man sells for less)');
ok(dflt !== base, 'it moves it even at the default morale, so the common case is mis-quoted too');

// Every call in the client must supply it. A quote that omits it is a promise the credit will not keep.
// Paren-match the argument list rather than using [^)]*, which stops dead at the `)` of a nested
// `overall(p)` and silently reports a truncated call — the same class of half-measurement that let the
// original bug through the last probe written for this file.
function callArgs(text: string, fn: string): string[] {
  const out: string[] = [];
  for (let i = text.indexOf(fn + '('); i !== -1; i = text.indexOf(fn + '(', i + 1)) {
    let depth = 0;
    for (let j = i + fn.length; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') { depth--; if (depth === 0) { out.push(text.slice(i + fn.length + 1, j).replace(/\s+/g, ' ')); break; } }
    }
  }
  return out;
}
const src = readFileSync('client/src/main.ts', 'utf8');
const calls = callArgs(src, 'squadSaleValue');
console.log(`  ..   ${calls.length} squadSaleValue call site(s) in the client`);
ok(calls.length > 0, 'there are quote sites to check (this is not measuring an empty set)');
for (const c of calls) ok(/sellMult/.test(c), `quote site \`squadSaleValue(${c})\` prices with the morale term`);

// And the credit side must still be the thing we are matching against.
const api = readFileSync('client/src/api.ts', 'utf8');
const credits = callArgs(api, 'squadSaleValue').filter((c) => /sellMult/.test(c));
ok(credits.length > 0, 'sellPlayer still credits through moraleEffects().sellMult (the price the quote must match)');

console.log(fails ? `\n✗ ${fails} problem(s): the game quotes one price and pays another` : '\n✓ quoted price and credited price are computed the same way');
if (fails) process.exitCode = 1;
