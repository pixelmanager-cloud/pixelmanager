// THE SAME SAVE MUST READ THE SAME ON EVERY MACHINE.
//
// `(1234).toLocaleString()` with no argument formats in the HOST's locale. On a de-DE browser it returns
// '1.234'; on en-US, '1,234'; on some locales, '1 234' with a non-breaking space. The client had 104 bare
// calls, all of them on coins and counts inside English prose — so a German player read "14.000c" in a
// button beside a feed line reading "14,000c", because shared/ groups deterministically by hand.
//
// This is not a localisation feature half-finished. The game has no translations: every string around these
// numbers is English, and the number is the only part changing shape. Pinning the locale makes the whole
// game read one way, and makes a screenshot from one machine match a screenshot from another — which
// matters for a store page and for anyone comparing a bug report against their own run.
//
// The engine is a separate and stricter case, already handled: shared/ must never call toLocaleString at
// all, because there the same seed has to produce the same STRING, not merely a similar-looking one.
// shared_purity.ts owns that rule; this probe owns the client.
//
// Run: `npx tsx tools/playtest/locale_stable_numbers.ts`
import { readFileSync, readdirSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Numbers render the same on every machine ===');

// ── The client: a locale must be named.
let calls = 0, bare = 0;
const bareAt: string[] = [];
for (const f of readdirSync('client/src')) {
  if (!f.endsWith('.ts')) continue;
  readFileSync(`client/src/${f}`, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\.toLocaleString\(\s*([^)]*)\)/g)) {
      calls++;
      if (m[1].trim() === '') { bare++; if (bareAt.length < 5) bareAt.push(`client/src/${f}:${i + 1}`); }
    }
  });
}
console.log(`  ..   ${calls} toLocaleString call(s) in client/src, ${bare} with no locale argument`);
// VACUITY GUARD. If the client ever stops formatting numbers this way the probe would pass over nothing —
// and that is a legitimate end state, but it should be a deliberate one, so it fails loudly instead.
ok(calls > 50, `the client still formats numbers this way (${calls} call sites) — if this drops to 0, retire the probe`);
for (const a of bareAt) console.log(`       ${a}`);
ok(bare === 0, `every call names its locale (${bare} bare)`);

// ── The engine: it must not reach for the host at all. shared_purity covers Date.now/Math.random; this is
// the same class of leak and belongs in the same sweep, so assert it here rather than assume.
let sharedHits = 0;
const walk = (d: string) => {
  for (const n of readdirSync(d, { withFileTypes: true })) {
    if (n.isDirectory()) { walk(`${d}/${n.name}`); continue; }
    if (!n.name.endsWith('.ts')) continue;
    const src = readFileSync(`${d}/${n.name}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const n2 = (src.match(/toLocaleString|toLocaleDateString|Intl\./g) ?? []).length;
    if (n2) { sharedHits += n2; console.log(`       ${d}/${n.name}: ${n2}`); }
  }
};
walk('shared/src');
ok(sharedHits === 0, `the engine never formats through the host locale (${sharedHits} call(s) in shared/src)`);

console.log(fails === 0 ? '\n✓ every number reads the same everywhere' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
