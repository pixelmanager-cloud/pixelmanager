// STORE SCREENSHOTS OF THE LATE GAME.
//
// `tools/store_screenshots.mjs` drives a fresh save, which is the right way to shoot the screens a new
// player sees. The dynasty screens are not among them: the Family Record, the Hall of Legends and the
// houses ladder only hold anything after several stars have retired and handed the name on, which is hours
// of play per shot and impossible to reproduce exactly.
//
// So this plants a save that `tools/dev_dynasty_save.ts` built by driving the real facade through four
// generations — every number in it is engine output — and photographs the screens it unlocks.
//
// Usage:
//   npm run build --workspace client
//   npx tsx tools/dev_dynasty_save.ts 4 > /tmp/dynasty.json
//   node tools/store_dynasty_screenshots.mjs /tmp/dynasty.json store/steam/screenshots
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const SAVE = process.argv[2] ?? '/tmp/dynasty.json';
const OUT = process.argv[3] ?? 'store/steam/screenshots';
const ROOT = 'client/dist';
if (!existsSync(join(ROOT, 'index.html'))) { console.error(`no build at ${ROOT} — run \`npm run build --workspace client\` first`); process.exit(1); }
if (!existsSync(SAVE)) { console.error(`no save at ${SAVE} — run \`npx tsx tools/dev_dynasty_save.ts 4 > ${SAVE}\` first`); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = join(ROOT, p);
  if (!existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4321, r));

const model = JSON.parse(readFileSync(SAVE, 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// Plant the save in IndexedDB before the app boots. main.ts reconciles SaveMeta rows it does not know into
// its own `fm_saves` index at startup, so it then offers this as an ordinary "Continue".
await page.addInitScript(({ model }) => {
  window.__planted = new Promise((resolve, reject) => {
    const req = indexedDB.open('fm-saves', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('models')) db.createObjectStore('models', { keyPath: 'id' });
    };
    req.onsuccess = () => {
      const t = req.result.transaction(['meta', 'models'], 'readwrite');
      t.objectStore('models').put({ id: 'dev-dynasty', model });
      t.objectStore('meta').put({ id: 'dev-dynasty', name: model.profile.name, lastPlayed: Date.now() });
      t.oncomplete = resolve; t.onerror = () => reject(t.error);
    };
    req.onerror = () => reject(req.error);
  });
}, { model });

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Every overlay in the game intercepts pointer events, so a driven run has to clear each one or it dies on
// the next click.
const dismiss = async () => {
  for (const s of ['.cg-help-x', '.help-x', '#cg-tut-x', '.pc-close', '.set-x']) {
    for (const e of await page.$$(s)) { try { await e.click({ timeout: 400 }); } catch { /* already gone */ } }
  }
  await page.evaluate(() => { for (const id of ['player-card-ov', 'prospect-card-ov']) document.getElementById(id)?.remove(); });
};
const tap = async (sel) => {
  try { const e = await page.$(sel); if (!e) return false; await e.click({ timeout: 2500 }); await page.waitForTimeout(1500); await dismiss(); return true; }
  catch { return false; }
};
const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: join(OUT, name) }); console.log('  ' + name); };
// Centre a section in a full 1080-tall frame rather than cropping to its bounds, so every file is 1920x1080.
const frame = async (sel, name) => {
  const el = await page.$(sel);
  if (!el) { console.log(`  SKIP ${name} — no ${sel} on the page`); return; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await el.boundingBox();
  if (box) await page.evaluate((y) => window.scrollBy(0, y), Math.round(box.y + box.height / 2 - 540));
  await shot(name);
};

if (!(await tap('#mm-continue'))) { console.error('the planted save was not offered as a Continue'); process.exit(1); }
await tap('#view-trophies');
await shot('08-houses-ladder.png');
await frame('.family-record', '07-family-record.png');
await tap('#trophies-back');
await tap('#hub-academy');
await frame('.legends-grid', '09-hall-of-legends.png');
await tap('#academy-back');
await tap('#view-club');
await shot('11-facilities.png');
await tap('#club-back');
await tap('#hub-continue-season');
await shot('10-club-season.png');

await browser.close();
server.close();
