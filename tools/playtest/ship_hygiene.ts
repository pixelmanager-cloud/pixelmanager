// WHAT IS IN client/public IS IN THE SHIPPED GAME.
//
// Vite copies that directory verbatim into the bundle, so anything left there goes to Steam. Two 200KB
// scratch files — `_probe.html` and `__probe.html`, copies of index.html written by an audit agent so it
// could render the stylesheet in a browser — were committed into it without anyone noticing, because
// nothing looks at that directory and a 400KB build is not obviously wrong.
//
// The rule: client/public holds ASSET DIRECTORIES the game actually loads, and nothing else. A new asset
// kind is a one-line change here and should be a deliberate one; a stray file is caught the same day.
//
// Run: `npx tsx tools/playtest/ship_hygiene.ts`
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** The asset directories the game loads. Adding one is deliberate; add it here too. */
const EXPECTED = ['audio', 'badges', 'flags', 'fonts', 'icons', 'kits', 'portraits', 'scenes', 'trophies'];

console.log('=== Nothing rides along into the shipped bundle ===');

const dir = 'client/public';
const entries = readdirSync(dir).filter((n) => n !== '.DS_Store');
console.log(`  ..   ${entries.length} entr(ies) in ${dir}`);
ok(entries.length > 0, 'the public directory still exists and has content (this is not measuring an empty set)');

for (const name of entries) {
  const isDir = statSync(join(dir, name)).isDirectory();
  ok(isDir, `'${name}' is a directory — a loose file here ships as-is`);
  ok(EXPECTED.includes(name), `'${name}' is a declared asset directory (add it to EXPECTED if it is meant to ship)`);
}
for (const name of EXPECTED) {
  ok(entries.includes(name), `the declared asset directory '${name}' is still present`);
}

// The specific shape that got through: an HTML file anywhere under public would be served as a page.
const strays: string[] = [];
const walk = (d: string, depth = 0) => {
  if (depth > 3) return;
  for (const n of readdirSync(d)) {
    const full = join(d, n);
    if (statSync(full).isDirectory()) walk(full, depth + 1);
    else if (/\.(html?|ts|tsx|map|log)$/i.test(n)) strays.push(full);
  }
};
walk(dir);
console.log(`  ..   ${strays.length} html/source/log file(s) found under ${dir}`);
ok(strays.length === 0, `no page or source file is sitting in the asset tree${strays.length ? ` (${strays.join(', ')})` : ''}`);

console.log(fails ? `\n✗ ${fails} — something that is not a game asset would ship` : '\n✓ only declared game assets are in the bundle');
if (fails) process.exitCode = 1;
