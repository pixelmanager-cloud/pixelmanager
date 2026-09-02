import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = 'client/dist', OUT = '/tmp/gr/trailer/src';
mkdirSync(OUT, { recursive: true });
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg' };
const server = createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const f=join(ROOT,p); if(!existsSync(f)){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'content-type':MIME[extname(f)]??'application/octet-stream'}); res.end(readFileSync(f)); });
await new Promise((r)=>server.listen(4322,r));
for (const g of [1,2,3,4]) {
  const model = JSON.parse(readFileSync(`/tmp/gr/trailer/save-g${g}.json`,'utf8'));
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(({model})=>{ window.__p = new Promise((res,rej)=>{ const r=indexedDB.open('fm-saves',1);
    r.onupgradeneeded=()=>{const d=r.result; if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'id'}); if(!d.objectStoreNames.contains('models'))d.createObjectStore('models',{keyPath:'id'});};
    r.onsuccess=()=>{const t=r.result.transaction(['meta','models'],'readwrite'); t.objectStore('models').put({id:'dev-dynasty',model}); t.objectStore('meta').put({id:'dev-dynasty',name:model.profile.name,lastPlayed:Date.now()}); t.oncomplete=res; t.onerror=()=>rej(t.error);}; r.onerror=()=>rej(r.error); }); }, { model });
  await page.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const tap = async (s)=>{ try{const e=await page.$(s); if(!e)return false; await e.click({timeout:2500}); await page.waitForTimeout(1400); return true;}catch{return false;} };
  await tap('#mm-continue'); await tap('#view-trophies');
  const el = await page.$('.family-record');
  if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    await el.screenshot({ path: join(OUT, `tree-g${g}.png`) }); console.log(`  tree-g${g}.png`); }
  else console.log(`  MISS gen ${g}`);
  await b.close();
}
server.close();
