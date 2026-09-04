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
import { readdirSync, statSync, lstatSync } from 'node:fs';
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
//
// `md` is in that list because the NEXT one through was a note, not a page. A drop-folder README sat in
// client/public/audio and shipped to client/dist/audio/README.md — three `*(title not recorded)*`
// placeholders, a developer TODO and three `main.ts:NNNN` source coordinates, served to a paying player at
// /audio/README.md. It tripped neither test above: it IS a file, but it is nested inside a declared asset
// directory, so the isDir check never sees it. The note now lives at docs/audio-tracks.md. Deliberately NOT
// `txt` — client/public/fonts/OFL-*.txt must ship, because the SIL Open Font License requires its text to
// travel with the fonts.
const strays: string[] = [];
const walk = (d: string, depth = 0) => {
  if (depth > 3) return;
  for (const n of readdirSync(d)) {
    const full = join(d, n);
    if (statSync(full).isDirectory()) walk(full, depth + 1);
    else if (/\.(html?|ts|tsx|map|log|md)$/i.test(n)) strays.push(full);
  }
};
walk(dir);
console.log(`  ..   ${strays.length} html/source/log/note file(s) found under ${dir}`);
ok(strays.length === 0, `no page, source file or developer note is sitting in the asset tree${strays.length ? ` (${strays.join(', ')} — move it under docs/ and delete it here)` : ''}`);

// And nothing agent-shaped anywhere the repo tracks. The first sweep of this class caught two files under
// client/public and missed a third sitting in the repo root, because the probe only looked where the last
// incident happened. Look where the NEXT one will be.
const rootStrays = readdirSync('.').filter((n) => /probe.*\.html?$/i.test(n) || /^_{1,2}.*\.html?$/i.test(n));
console.log(`  ..   ${rootStrays.length} probe-shaped file(s) in the repo root`);
ok(rootStrays.length === 0, `no scratch page is sitting in the repo root${rootStrays.length ? ` (${rootStrays.join(', ')})` : ''}`);

// AND NO SYMLINKS IN THE SOURCE TREE. An agent working in a scratch clone left `shared/shared -> shared`
// behind in the real repo — a self-referential loop. It ships nothing and git does not track it, so it was
// invisible to every check here, but it made field_wiring.ts's directory walk recurse until the OS threw
// ELOOP, which failed the playtest leg and cost a full gate cycle to diagnose. A source tree has no
// legitimate symlinks in it; node_modules is where they belong and is excluded.
const links: string[] = [];
const linkWalk = (d: string, depth = 0) => {
  if (depth > 4) return;
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n === '.git' || n === 'dist') continue;
    const full = join(d, n);
    let st;
    try { st = lstatSync(full); } catch { continue; }
    if (st.isSymbolicLink()) { links.push(full); continue; }   // never follow it — that is the failure mode
    if (st.isDirectory()) linkWalk(full, depth + 1);
  }
};
linkWalk('.');
console.log(`  ..   ${links.length} symlink(s) in the source tree (node_modules excluded)`);
ok(links.length === 0, `no symlink is sitting in the source tree${links.length ? ` (${links.join(', ')})` : ''}`);

console.log(fails ? `\n✗ ${fails} — something that is not a game asset would ship` : '\n✓ only declared game assets are in the bundle');
if (fails) process.exitCode = 1;
