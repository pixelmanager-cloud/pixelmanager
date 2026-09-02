// REAL GAMEPLAY CAPTURE. The first trailer was stills with Ken Burns pans over them, which reads as a
// slideshow however good the stills are — and a slideshow is what an asset flip ships when there is no game
// to film. This films the game actually running.
//
// Frames come from the CDP screencast (Page.startScreencast), not from screenshot-per-frame: the screencast
// is driven by the compositor, so it captures CSS animations and transitions as they really play. Each
// frame carries a timestamp, so a variable-rate capture can be resampled to an exact 30fps sequence
// afterwards — the jitter of a real-time capture never reaches the cut.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';

const SAVE = process.argv[2] ?? '/tmp/gr/trailer/save-g4.json';
const OUT = process.argv[3] ?? '/tmp/gr/trailer/clips';
const ONLY = process.argv[4] ?? null;
const ROOT = 'client/dist';
const FPS = 30;

const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = join(ROOT, p);
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4325, r));

const model = JSON.parse(readFileSync(SAVE, 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.addInitScript(({ model }) => {
  window.__planted = new Promise((res, rej) => {
    const r = indexedDB.open('fm-saves', 1);
    r.onupgradeneeded = () => { const d = r.result;
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('models')) d.createObjectStore('models', { keyPath: 'id' }); };
    r.onsuccess = () => { const t = r.result.transaction(['meta','models'],'readwrite');
      t.objectStore('models').put({ id: 'dev-dynasty', model });
      t.objectStore('meta').put({ id: 'dev-dynasty', name: model.profile.name, lastPlayed: Date.now() });
      t.oncomplete = res; t.onerror = () => rej(t.error); };
    r.onerror = () => rej(r.error);
  });
}, { model });

const cdp = await page.context().newCDPSession(page);
const dismiss = async () => {
  for (const s of ['.cg-help-x','.help-x','#cg-tut-x','.pc-close','.set-x','#mgr-help-x'])
    for (const e of await page.$$(s)) { try { await e.click({ timeout: 400 }); } catch {} }
  await page.evaluate(() => { for (const id of ['player-card-ov','prospect-card-ov']) document.getElementById(id)?.remove(); });
};
const tap = async (sel, wait = 1200) => {
  try { const e = await page.$(sel); if (!e) return false; await e.click({ timeout: 2500 }); await page.waitForTimeout(wait); await dismiss(); return true; }
  catch { return false; }
};

// Record whatever `action` does, as it happens.
async function record(name, seconds, action) {
  const dir = join(OUT, name);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  const t0 = Date.now();
  await action();
  while (Date.now() - t0 < seconds * 1000) await page.waitForTimeout(100);
  await cdp.send('Page.stopScreencast');
  cdp.removeAllListeners('Page.screencastFrame');
  if (!frames.length) { console.log(`  ${name}: NO FRAMES`); return 0; }

  // Resample to exact FPS: for each output slot take the newest frame at or before its timestamp.
  const base = frames[0].t;
  const span = frames[frames.length - 1].t - base;
  const n = Math.max(1, Math.floor(span * FPS));
  let cursor = 0, distinct = 0, last = null;
  for (let i = 0; i < n; i++) {
    const want = base + i / FPS;
    while (cursor + 1 < frames.length && frames[cursor + 1].t <= want) cursor++;
    if (frames[cursor].data !== last) { distinct++; last = frames[cursor].data; }
    writeFileSync(join(dir, `f${String(i).padStart(5,'0')}.jpg`), Buffer.from(frames[cursor].data, 'base64'));
  }
  console.log(`  ${name}: ${frames.length} raw over ${span.toFixed(1)}s → ${n} frames @${FPS}fps, ${distinct} distinct (${(100*distinct/n).toFixed(0)}% motion)`);
  return n;
}

await page.goto('http://localhost:4325/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await tap('#mm-continue');

// Every shot starts from a fresh load. Backing out of a running match into another screen is a sequence of
// its own that can half-fail silently, and a clip captured from a half-failed state is worse than no clip:
// it looks like the game, so nobody questions it.
const fresh = async () => {
  await page.goto('http://localhost:4325/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await tap('#mm-continue', 1500);
  await dismiss();
};

// Getting to a live match is a five-step path, and four of the steps are easy to miss:
//   season screen -> its onboarding panel sits over the fixture list and eats the click
//   "Play" -> opens the LINEUP, not the match; the button only reads "Kick Off" in match mode
//   "Kick Off" -> raises a TEAM TALK overlay and waits; kickOffMatch() itself returns silently
//                 (`if (!this.spFixture) return;`) so a missed step looks exactly like nothing happening
//   pick a talk -> only then does the match run
const toMatch = async () => {
  await tap('#hub-continue-season');
  await dismiss();
  await tap('#sf-play', 1600);
  await tap('#autopick', 800);
  await tap('#save-team', 1500);          // reads "▶ Kick Off" in match mode
};

const SHOTS = {
  // The decision before kickoff — three team talks with real consequences. A held beat.
  teamtalk: async () => {
    await fresh();
    await toMatch();
    await record('teamtalk', 3, async () => { await page.waitForTimeout(400); });
  },
  // The live match: clock running, commentary streaming, the score able to move. The most genuinely
  // cinematic thing the game does, and the thing a slideshow can never show.
  match: async () => {
    await fresh();
    await toMatch();
    await tap('[data-tt="fire"]', 1200);
    await record('match', 14, async () => { await tap('#spd4', 200); });
  },
  // THE CORE LOOP. A scenario asks for something, four cards answer it differently, and the outcome
  // narration writes itself in underneath. This is the game's actual identity and the thing a stills
  // trailer misrepresents worst — the whole point is that you are choosing.
  hand: async () => {
    await fresh();
    await tap('#hub-academy', 1800);
    await dismiss();
    // Start (or resume) an heir's career from the academy board.
    const devs = await page.$$('[data-dev]');
    console.log(`  hand: ${devs.length} prospect(s) on the academy board`);
    if (!devs.length) return;
    await devs[0].click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(2000);
    await dismiss();
    await tap('.cg-agent, [data-agent]', 1500);   // agent pick, if the career is brand new
    await dismiss();
    await record('hand', 11, async () => {
      for (let i = 0; i < 3; i++) {
        // PLAY WELL. Cycling through the hand blindly produced "✗ Wrong card ✗ Poor" badges, and a trailer
        // that advertises the player misreading the moment is selling the wrong thing. The scenario names
        // the tags it wants; pick the card that carries one.
        const idx = await page.evaluate(() => {
          const askText = document.querySelector('.cg-ask, .cg-demand, [class*="calls"]')?.textContent ?? '';
          const wanted = (askText.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !['this','calls','for','green','amber','best','match','rarer','card','develops','more','when','fits','also','helps'].includes(w));
          const cards = [...document.querySelectorAll('.cg-card')];
          let best = 0, bestScore = -1;
          cards.forEach((c, i) => {
            const t = c.textContent.toLowerCase();
            const score = wanted.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
            if (score > bestScore) { bestScore = score; best = i; }
          });
          return best;
        });
        const cards = await page.$$('.cg-card');
        if (!cards.length) break;
        const pick = cards[Math.min(idx, cards.length - 1)];
        await pick.hover().catch(() => {});
        await page.waitForTimeout(800);
        await pick.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(2400);   // let the outcome narration fade in (narrfade)
      }
    });
  },
  // The card reveal — pcSpin/pcSpark/pcBurst/holoSheen. The most deliberately premium moment in the UI,
  // and it only exists as motion: a still of it is just a card.
  cardreveal: async () => {
    await fresh();
    // Player names are clickable in the full squad table (statsTableHTML), which is where the card comes
    // from — the academy board's prospect rows are not the same control.
    await tap('#hub-continue-season', 1500);
    await dismiss();
    await tap('#sf-teamsheet', 1500);
    const names = await page.$$('#xi [data-card], #bench [data-card]');
    console.log(`  cardreveal: ${names.length} clickable player name(s)`);
    if (!names.length) return;
    await record('cardreveal', 5, async () => {
      await names[0].click({ timeout: 2000 }).catch(() => {});
    });
  },
  // The record DRAWING ITSELF — the animation fires on render, so the recording has to start before the
  // screen does.
  treedraw: async () => {
    await fresh();
    await record('treedraw', 5, async () => {
      await tap('#view-trophies', 300);
      const el = await page.$('.family-record');
      if (el) await el.scrollIntoViewIfNeeded();
    });
  },
  // The Family Record revealing itself as the page scrolls — the centrepiece, but as a move rather than a
  // held still.
  tree: async () => {
    await fresh();
    await tap('#view-trophies', 2000);
    await record('tree', 7, async () => {
      const el = await page.$('.family-record');
      if (!el) return;
      const box = await el.boundingBox();
      const target = box ? box.y + box.height / 2 - 540 : 900;
      // A slow, eased scroll: 90 steps over ~3s so the screencast sees real intermediate frames.
      await page.evaluate(async (target) => {
        const start = window.scrollY, dist = target;
        for (let i = 0; i <= 90; i++) {
          const t = i / 90, e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
          window.scrollTo(0, start + dist * e);
          await new Promise((r) => setTimeout(r, 33));
        }
      }, target);
    });
  },
};

for (const [name, fn] of Object.entries(SHOTS)) {
  if (ONLY && name !== ONLY) continue;
  try { await fn(); } catch (e) { console.log(`  ${name}: FAILED — ${e.message}`); }
}
await browser.close();
server.close();
