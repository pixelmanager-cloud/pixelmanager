// Steam store screenshots, captured from the BUILT game in a real browser at 1920x1080.
//
// Not mockups and not a dev server: this serves client/dist, drives the actual shipped bundle through a
// real opening — new game, sign a prospect, choose an agent, play a moment, then the hub, the scouting
// board and the trophy room — and screenshots each. If a screen breaks, the screenshot breaks with it.
//
// Run: `node tools/store_screenshots.mjs` (needs `npm run -w client build` first, and the chromium that
// tools/playtest/browser_smoke.ts already requires). Output: /tmp/gr/shots, copied into
// store/steam/screenshots/ when they are worth keeping.
//
// Two things that cost me time and are worth knowing before editing this:
//   - the onboarding help panels cover the career screen AND swallow clicks; `kill()` dismisses them, and
//     without it an automated run stalls on turn 12 forever;
//   - every panel has its OWN back button (#academy-back, #scouting-back, #trophies-back...), so there is
//     no single "back to hub" selector.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const DIST = join(process.cwd(), 'client', 'dist');
const OUT = '/tmp/gr/shots';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
               '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    const u = (req.url ?? '/').split('?')[0];
    const f = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
    if (!f.startsWith(DIST)) return res.writeHead(403).end();
    res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' }).end(await readFile(f));
  } catch { res.writeHead(404).end(); }
});
await mkdir(OUT, { recursive: true });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('  [pageerror]', String(e.message).slice(0, 90)));
const shot = async (n) => { await page.waitForTimeout(700); await page.screenshot({ path: join(OUT, n) }); console.log('  ' + n); };
const kill = async () => {           // the onboarding panels cover the screen and swallow clicks
  for (const s of ['.cg-help-x', '.help-x', '.onboard-x', '[data-help-close]']) {
    for (const el of await page.$$(s)) { try { await el.click({ timeout: 700 }); } catch {} }
  }
  await page.waitForTimeout(200);
};

await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
await page.waitForSelector('#mm-title', { state: 'visible', timeout: 15000 });
await page.click('#mm-new'); await page.fill('#mm-name', 'Vance'); await page.click('#mm-start');
await page.waitForSelector('#academy:not(.hidden)', { timeout: 20000 });
await shot('01-academy.png');

await page.click('#academy-body button');                 // SIGN HIM
await page.waitForTimeout(1200);
await page.click('[data-dev]');                           // Develop -> career
await page.waitForTimeout(2500); await kill();
await shot('02-agents.png');

const agents = await page.$$('.cg-coach');
if (agents.length) { await agents[2].click(); await page.waitForTimeout(2500); await kill(); }
await shot('03-cardplay.png');

// Hub and the panels reachable from it. Every click is defensive: one control being off-screen must not
// abort the pass and lose the shots that already worked.
const tap = async (sel) => {
  try { const el = await page.$(sel); if (!el) return false; await el.click({ timeout: 2500 }); await page.waitForTimeout(1300); await kill(); return true; }
  catch { return false; }
};
// #cg-back leaves the career for the prospect list, then #academy-back reaches the hub.
await tap('#cg-back');
if (await tap('#academy-back')) await shot('04-hub.png');
else console.log('  could not reach the hub');
if (await tap('#view-scouting')) await shot('05-scouting.png'); else console.log('  no scouting button');
await tap('#scouting-back');            // each panel has its own back control
if (await tap('#view-trophies')) await shot('06-trophies.png'); else console.log('  no trophies button');
await browser.close(); server.close();
