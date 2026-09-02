// Preview a player/prospect card tier in isolation, without driving a whole career to reach it.
//
// Written to check `tier-heir` against `tier-bronze` side by side, because the heir card is otherwise only
// reachable after a full succession — roughly two hours of play per look. It proves the CSS; the wiring
// (`born && gen > 0` in showProspectCard) is a code read, not something this can show.
//
// Run: node tools/preview_card.mjs   → /tmp/gr/card-<tier>.png for each tier listed below.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT='client/dist';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,p);if(!existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'});s.end(readFileSync(f));});
await new Promise(r=>server.listen(4331,r));
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1200,height:900}});
await page.goto('http://localhost:4331/',{waitUntil:'networkidle'});
await page.waitForTimeout(1200);
for (const tier of (process.argv.slice(2).length ? process.argv.slice(2) : ['tier-bronze','tier-heir','tier-gold','tier-legend'])) {
  await page.evaluate((tier) => {
    document.getElementById('probe-ov')?.remove();
    const el = document.createElement('div');
    el.id = 'probe-ov';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#0a0a15;';
    const sparks = tier === 'tier-heir' ? Array.from({length:7},(_,i)=>
      `<i class="pc-spark" style="left:${8+i*12}%;top:${12+((i*29)%74)}%;animation-delay:${(i*0.27).toFixed(2)}s">✦</i>`).join('') : '';
    el.innerHTML = `<div class="pc-card ${tier}" style="transform:scale(1.25)">`
      + (tier==='tier-heir' ? '<div class="pc-ring"></div><div class="pc-burst"></div>'+sparks : '')
      + `<div class="pc-top"><div class="pc-ovr">10<span>YRS</span></div><div class="pc-tier">🌱<span>PROSPECT</span></div></div>`
      + `<div class="pc-name">Dane Ashcombe</div><div class="pc-role">Youth Prospect · gen 4</div>`
      + `<div class="pc-flash">🌳 THE ASHCOMBE NAME LIVES ON</div>`
      + `<div class="pc-contract retired"><div class="pc-legend">Potential ★★★☆☆ · carries the family name</div></div>`
      + `</div>`;
    document.body.appendChild(el);
  }, tier);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `/tmp/gr/card-${tier}.png` });
  console.log(`  /tmp/gr/card-${tier}.png`);
}
await b.close(); server.close();
