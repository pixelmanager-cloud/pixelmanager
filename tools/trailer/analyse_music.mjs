// MEASURE THE MUSIC. Picking a trailer cue by name and vibe is how the first cut ended up splicing two
// tracks in different keys at a point that was probably mid-bar in one of them.
//
// Decodes each bundled OGG through Chromium's WebAudio (the same decoder the game plays them with) and
// reports, per track: duration, tempo estimated by onset autocorrelation, key by Krumhansl chroma
// correlation, the RMS envelope, and — the thing that actually decides a trailer cue — whether it OPENS
// QUIET and where its biggest sustained lift is. A trailer needs a build and a payoff; a track that is
// uniformly loud has neither however good it sounds.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

// Point it at any folder of .ogg — the game's bundled 18 by default, or a slice of the full 1,015-track
// pack when hunting for a trailer cue.
const AUDIO = process.argv[2] ?? 'client/public/audio';
const files = readdirSync(AUDIO).filter((f) => f.endsWith('.ogg')).sort();
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><title>a</title>'); }
  const f = join(AUDIO, p.replace(/^\//, ''));
  if (!existsSync(f) || extname(f) !== '.ogg') { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'audio/ogg' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4328, r));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:4328/');

const out = await page.evaluate(async (files) => {
  const KRUMHANSL_MAJ = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
  const KRUMHANSL_MIN = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const results = [];
  for (const f of files) {
    const ctx = new OfflineAudioContext(1, 48000, 48000);
    const buf = await ctx.decodeAudioData(await fetch('/' + f).then((r) => r.arrayBuffer()));
    const sr = buf.sampleRate, n = buf.length;
    const d = buf.getChannelData(0);

    // RMS envelope at 100ms
    const hop = Math.floor(sr * 0.1), env = [];
    for (let i = 0; i + hop <= n; i += hop) {
      let s = 0; for (let j = 0; j < hop; j++) s += d[i+j]*d[i+j];
      env.push(Math.sqrt(s / hop));
    }
    const db = env.map((v) => v > 0 ? 20*Math.log10(v) : -99);
    const loud = db.filter((v) => v > -60).sort((a,b)=>a-b);
    const med = loud[Math.floor(loud.length/2)] ?? -99;
    const p90 = loud[Math.floor(loud.length*0.9)] ?? -99;
    const p10 = loud[Math.floor(loud.length*0.1)] ?? -99;

    // Opening level over the first 4s, vs the track's own median: a trailer wants to start below it.
    const open4 = db.slice(0, 40).filter((v)=>v>-99);
    const openDb = open4.reduce((a,b)=>a+b,0)/Math.max(1,open4.length);

    // The biggest sustained lift: compare each 3s window to the 3s before it.
    let bestLift = 0, bestAt = 0;
    for (let i = 30; i + 30 < db.length; i++) {
      const before = db.slice(i-30, i).reduce((a,b)=>a+b,0)/30;
      const after  = db.slice(i, i+30).reduce((a,b)=>a+b,0)/30;
      if (after - before > bestLift) { bestLift = after - before; bestAt = i/10; }
    }

    // Tempo: autocorrelate the positive first difference of the envelope (an onset strength curve).
    const flux = env.map((v,i) => i ? Math.max(0, v - env[i-1]) : 0);
    let bestBpm = 0, bestScore = -1;
    for (let bpm = 60; bpm <= 180; bpm += 0.25) {
      const lagF = (60 / bpm) * 10; // envelope frames per beat (10 fps)
      let s = 0, c = 0;
      for (let i = 0; i + Math.round(lagF*4) < flux.length; i++) {
        s += flux[i] * flux[i + Math.round(lagF)] + flux[i] * flux[i + Math.round(lagF*2)];
        c += 2;
      }
      const score = c ? s / c : 0;
      if (score > bestScore) { bestScore = score; bestBpm = bpm; }
    }

    // Key: chroma from a coarse DFT over the whole track, correlated against Krumhansl profiles.
    const chroma = new Array(12).fill(0);
    const step = Math.floor(sr * 0.5), win = 4096;
    for (let s0 = 0; s0 + win < n; s0 += step) {
      for (let midi = 36; midi <= 84; midi++) {
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        let re = 0, im = 0;
        const w = 2 * Math.PI * freq / sr;
        for (let i = 0; i < win; i += 2) { re += d[s0+i] * Math.cos(w*i); im += d[s0+i] * Math.sin(w*i); }
        chroma[midi % 12] += Math.sqrt(re*re + im*im);
      }
    }
    const mean = chroma.reduce((a,b)=>a+b,0)/12;
    const corr = (prof, rot) => {
      let num=0, da=0, db2=0; const pm = prof.reduce((a,b)=>a+b,0)/12;
      for (let i=0;i<12;i++){ const a=chroma[(i+rot)%12]-mean, b=prof[i]-pm; num+=a*b; da+=a*a; db2+=b*b; }
      return num/Math.sqrt(da*db2||1);
    };
    let key='?', kb=-2;
    for (let r=0;r<12;r++){
      const M=corr(KRUMHANSL_MAJ,r), m=corr(KRUMHANSL_MIN,r);
      if (M>kb){kb=M;key=NAMES[r]+' major';}
      if (m>kb){kb=m;key=NAMES[r]+' minor';}
    }
    results.push({ f, secs: n/sr, bpm: bestBpm, bar: 4*60/bestBpm, key, keyConf: kb,
                   medDb: med, p10, p90, openDb, lift: bestLift, liftAt: bestAt });
  }
  return results;
}, files);

console.log('track            len    bpm   bar    key            open   med   p90   dyn   biggest lift');
console.log('-'.repeat(104));
for (const r of out.sort((a,b) => b.lift - a.lift)) {
  console.log(
    `${r.f.replace('.ogg','').padEnd(16)} ${r.secs.toFixed(0).padStart(4)}s ${r.bpm.toFixed(1).padStart(6)} ${r.bar.toFixed(3)}s ` +
    `${(r.key+' ('+r.keyConf.toFixed(2)+')').padEnd(16)} ${r.openDb.toFixed(0).padStart(4)} ${r.medDb.toFixed(0).padStart(5)} ${r.p90.toFixed(0).padStart(5)} ` +
    `${(r.p90-r.p10).toFixed(0).padStart(4)}dB  +${r.lift.toFixed(1)}dB at ${r.liftAt.toFixed(0)}s`);
}
writeFileSync('/tmp/gr/music-analysis.json', JSON.stringify(out, null, 2));
await browser.close(); server.close();
