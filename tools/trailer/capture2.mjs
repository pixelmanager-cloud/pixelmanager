// Render the trailer to a numbered JPEG sequence, one frame at a time.
//
// The stage never animates itself: `renderAt(t)` sets every style from the clock, so the capture can take
// as long as it likes per frame and the output is still exactly FPS. Recording the page in real time would
// have tied the trailer's smoothness to how busy this machine happened to be.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';

const FPS = 30;
const OUT = process.argv[2] ?? '/tmp/gr/trailer/frames';
const TREES = process.argv[3] ?? '/tmp/gr/trailer/src';
const plan = JSON.parse(readFileSync('tools/trailer/plan2.json', 'utf8'));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = p === '/' ? 'tools/trailer/stage2.html'
    : p.startsWith('/shot/') ? join('store/steam/screenshots', p.slice(6))
    : p.startsWith('/tree/') ? join(TREES, p.slice(6))
    : p.startsWith('/clip/') ? join('/tmp/gr/trailer/clips', p.slice(6))
    : null;
  if (!f || !existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4327, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:4327/', { waitUntil: 'networkidle' });
// The two faces are the game's own, pulled from Google Fonts. Capturing before they land bakes Courier
// New into every caption — and the fallback is close enough in size that it is easy to miss.
await page.evaluate(() => document.fonts.ready);
const loaded = await page.evaluate(() => document.fonts.check('34px "Press Start 2P"') && document.fonts.check('30px "VT323"'));
if (!loaded) { console.error('the display fonts did not load — captions would render in the fallback face'); process.exit(1); }
await page.evaluate((plan) => window.build(plan), plan);
// Decode every shot before the clock starts, or the first frames of a cut come up blank.
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));

const total = Math.round(plan.duration * FPS);
for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.renderAt(t), f / FPS);   // async: awaits image decode before we grab
  await page.screenshot({ path: join(OUT, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
  if (f % 150 === 0) console.log(`  ${f}/${total} frames (${(f / FPS).toFixed(1)}s)`);
}
console.log(`  ${total}/${total} frames — ${(total / FPS).toFixed(1)}s at ${FPS}fps`);
await browser.close();
server.close();
