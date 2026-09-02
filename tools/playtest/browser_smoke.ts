// ── THE EXPENSIVE HALF: LOAD THE BUILT GAME IN A REAL BROWSER AND PLAY IT ───────────────────────────
//
// `browser_safe.ts` is the cheap half. It parses the source for module-scope `process` / node-builtin
// references, because forty of those once made the game a black rectangle while `npm run verify` was green
// -- vite type-checks and bundles without EXECUTING, and every other harness runs in Node. Its own header
// says: "This is still the cheap half. The expensive half is loading the built page in a headless browser,
// and this file does not pretend to be that."
//
// This is that. It serves `client/dist`, opens it in headless chromium, and plays the opening of a real
// game: main menu -> New Game -> type a family name -> Start -> the academy screen. Anything that throws
// on load, fails to render, or breaks the path into the game fails here.
//
// TWO THINGS IT REFUSES TO DO, both of which would make it the kind of check this project keeps finding:
//   - it will not pass when `client/dist` is missing or stale (that is a FAIL, not a skip);
//   - it will not pass when chromium cannot launch (also a FAIL, with the install command).
// A browser gate that quietly skips is worse than none, because it reads as evidence.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIST = join(ROOT, 'client', 'dist');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The built game runs in a real browser ===');

if (!existsSync(join(DIST, 'index.html'))) {
  console.log('  FAIL client/dist is missing — run `npm run -w client build` first.');
  console.log('\n✗ browser smoke could not run, which is a failure and not a skip');
  process.exit(1);
}
// A dist older than the sources it was built from proves nothing about the code being gated -- and this
// check has to walk EVERY source tree the bundle contains, not just main.ts. The first version compared
// only `client/src/main.ts`, so a change under `shared/` (most of the game) left it happily testing an old
// bundle: I caught it when a deliberately broken engine failed to build, dist stayed stale, and this file
// reported four passes on the previous build.
const distAge = statSync(join(DIST, 'index.html')).mtimeMs;
const newestSource = (dir: string): number => {
  let newest = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    newest = Math.max(newest, e.isDirectory() ? newestSource(full) : statSync(full).mtimeMs);
  }
  return newest;
};
const srcAge = Math.max(newestSource(join(ROOT, 'client', 'src')), newestSource(join(ROOT, 'shared', 'src')));
if (srcAge > distAge) {
  console.log(`  FAIL client/dist is STALE — a source under client/src or shared/src is newer than the bundle.`);
  console.log('       Rebuild with `npm run -w client build`; a stale bundle proves nothing about this tree.');
  console.log('\n✗ browser smoke would have tested an old bundle');
  process.exit(1);
}

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const server = createServer(async (req, res) => {
  try {
    const url = (req.url ?? '/').split('?')[0];
    const file = join(DIST, url === '/' ? 'index.html' : decodeURIComponent(url));
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end('not found'); }
});

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as { port: number }).port;

  let chromium: any;
  try { ({ chromium } = await import('playwright')); }
  catch {
    console.log('  FAIL playwright is not installed — `npm i -D playwright && npx playwright install chromium`');
    server.close(); process.exit(1);
  }
  let browser: any;
  try { browser = await chromium.launch(); }
  catch (e: any) {
    console.log(`  FAIL chromium could not launch (${String(e?.message ?? e).slice(0, 90)})`);
    console.log('       run `npx playwright install chromium`');
    server.close(); process.exit(1);
  }

  const page = await browser.newPage();
  // EVERYTHING the page complains about, collected before a single assertion runs.
  const errors: string[] = [];
  page.on('pageerror', (e: any) => errors.push(`pageerror: ${String(e?.message ?? e).slice(0, 160)}`));
  page.on('console', (m: any) => { if (m.type() === 'error') errors.push(`console.error: ${m.text().slice(0, 160)}`); });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });

  // 1. IT RENDERED. The black-rectangle bug threw before a frame drew, so the menu title is the check.
  let titled = false;
  try { await page.waitForSelector('#mm-title', { state: 'visible', timeout: 12000 }); titled = true; } catch { /* stays false */ }
  ok(titled, 'the main menu renders (this is the black-rectangle check)');

  const text = titled ? ((await page.textContent('#mm-title')) ?? '').trim() : '';
  ok(/FOOTBALL ROYALTY/i.test(text), `and it is the game's own menu, not an empty shell (saw "${text.slice(0, 40)}")`);

  // 2. IT PLAYS. Loading is not running: the opening path has to work.
  let reached = false;
  if (titled) {
    try {
      await page.click('#mm-new');
      await page.fill('#mm-name', 'Vance');
      await page.click('#mm-start');
      await page.waitForSelector('#academy:not(.hidden)', { state: 'visible', timeout: 20000 });
      reached = true;
    } catch { /* stays false */ }
  }
  ok(reached, 'New Game -> a family name -> Start reaches the academy screen');

  // 3. IT DID NOT THROW while doing any of it.
  ok(errors.length === 0, `the page raised no errors${errors.length ? `: ${errors.slice(0, 2).join(' | ')}` : ''}`);

  await browser.close();
  server.close();
  console.log(fails ? `\n✗ ${fails} browser-smoke check(s) failed` : `\n✓ the built game loads, renders, and starts a career in a real browser`);
  if (fails) process.exitCode = 1;
}
void main();
