// A FACE MUST SURVIVE ITS OWNER AGEING.
//
// Portraits are hash-assigned from three age-banded pools. The lookup used to hash `name + band`, putting
// the band inside the key, so every life stage landed on an unrelated index — one man was three different
// people across his career. That is invisible on the Family Record (each node is one man at one stage) and
// glaring anywhere a squad is shown, which is exactly where portraits are heading.
//
// The guarantee now is: the pools are parallel (index k is the same person, generated as an aged triplet),
// and the lookup hashes the NAME alone so the band only selects which age of that person to show.
//
// Run: `npx tsx shared/qa_portraits.ts`
import { portraitUrl, sameIdentityAcrossBands, type Band } from '../client/src/portrait.js';
import { PORTRAITS } from '../client/src/portrait-manifest.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const BANDS: Band[] = ['youth', 'prime', 'veteran'];

console.log('=== A player keeps his face as he ages ===');
const lens = BANDS.map((b) => PORTRAITS[b].length);
console.log(`  ..   pool sizes: youth ${lens[0]}, prime ${lens[1]}, veteran ${lens[2]}`);
ok(sameIdentityAcrossBands(), `the three pools are parallel, so index k is the same man in each (${lens.join('/')})`);

// The index a name resolves to must be identical in all three bands — that IS the guarantee.
const names = ['Nils Ashcombe', 'Enzo Ashcombe', 'Leo Vance', 'Yuki Sato', 'Omar Diaz', 'Rico Frost',
               'Dane Marsh', 'Theo Oakes', 'Milo Reyes', 'Kai Wolfe'];
let stable = 0;
for (const n of names) {
  const idx = BANDS.map((b) => {
    const u = portraitUrl(n, b);
    const m = u.match(/-(\d+)\.png$/);
    return m ? Number(m[1]) : -1;
  });
  if (idx.every((i) => i === idx[0] && i >= 0)) stable++;
  else ok(false, `${n} resolves to indices ${idx.join('/')} across youth/prime/veteran — he changes person as he ages`);
}
ok(stable === names.length, `all ${names.length} sampled names keep one identity across the three bands`);

// And the assignment must still SPREAD: an identity-stable hash that sends everyone to index 0 would pass
// the check above and be useless.
const spread = new Set(names.map((n) => portraitUrl(n, 'prime'))).size;
ok(spread >= Math.min(names.length, 6), `distinct names still land on distinct faces (${spread}/${names.length})`);

console.log(fails ? `\n✗ ${fails} failure(s)` : '\n✓ one name, one man, three ages');
if (fails) process.exitCode = 1;
