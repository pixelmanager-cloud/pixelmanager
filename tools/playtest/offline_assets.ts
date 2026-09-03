// THE GAME MUST NOT NEED THE NETWORK.
//
// Everything about this build is offline-first — no server, no live service, IndexedDB saves — and it
// shipped for months pulling its two typefaces from fonts.googleapis.com. A Steam player with no connection
// got the whole interface in Courier New: every heading, every stat, every banner. It still WORKED, which
// is exactly why nothing caught it. Nothing failed; it just stopped looking like the game.
//
// This asserts the shipped HTML references no external origin at all, and that anything it does reference
// locally is actually present in the build output.
//
// Run: `npx tsx tools/playtest/offline_assets.ts`
import { readFileSync, existsSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const html = readFileSync('client/index.html', 'utf8');
// Comments may legitimately NAME an origin while explaining why it is no longer used.
const code = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('=== The shipped game reaches no external origin ===');

const externals = [...code.matchAll(/(?:href|src|url\()\s*["']?(https?:\/\/[^"')\s]+)/g)].map((m) => m[1]);
console.log(`  ..   ${externals.length} external reference(s) in the shipped HTML`);
ok(externals.length === 0, externals.length ? `no external URLs (found: ${externals.slice(0, 3).join(', ')})` : 'no external URLs');

// The faces the pixel look depends on must be self-hosted AND actually present.
const faces = [...code.matchAll(/@font-face[\s\S]*?src:\s*url\(['"]?([^'")]+)/g)].map((m) => m[1]);
console.log(`  ..   ${faces.length} self-hosted face(s): ${faces.join(' ')}`);
ok(faces.length >= 2, 'both display faces are declared as @font-face rules');
for (const f of faces) {
  const p = 'client/public' + (f.startsWith('/') ? f : '/' + f);
  ok(existsSync(p), `${f} exists in client/public (it would silently fall back if missing)`);
}

// The OFL is satisfied by shipping the licence beside the fonts.
for (const lic of ['client/public/fonts/OFL-press-start-2p.txt', 'client/public/fonts/OFL-vt323.txt']) {
  ok(existsSync(lic) && readFileSync(lic, 'utf8').includes('SIL OPEN FONT LICENSE'),
     `${lic.split('/').pop()} ships alongside the font, as the OFL requires`);
}

console.log(fails ? `\n✗ ${fails} problem(s) — the game would degrade without a network` : '\n✓ nothing in the shipped game reaches the network');
if (fails) process.exitCode = 1;
