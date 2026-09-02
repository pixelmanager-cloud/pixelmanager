// Cut the trailer's music from tracks the game already owns, sample-accurately.
//
// The edit is two tracks and three joins (see store/steam/trailer/README.md for why each one works):
//
//   0:00-0:24  international-1  0.000 -> 24.000   its band lands at 6s, on the first picture cut, and its
//                                                  quietest second is 23 — the breath before the drop
//   0:24-0:36  legends-1        0.000 -> 12.000   the Hall of Legends motif, alone. Its own 1.45s of true
//                                                  silence lands under "every career ends"
//   0:36-0:54  legends-1       42.000 -> 60.000   the built-in collapse to silence at 43.6 and the hard
//                                                  full-arrangement re-entry at 48.000, in the relative
//                                                  major — under the Family Record filling to FOUR
//   0:54-0:57  legends-1        0.000 ->  3.000   the motif alone again, bookending, under the title card
//   0:57-1:01  legends-1      123.000 -> 127.000   the track's own final cadence: the last chord lands at
//                                                  60.1s, just as the picture fades to black
//
// The bookend was originally one 7-second lift of legends-1 0.000->7.000, but that segment contains the
// track's built-in 1.45s of true silence at 3.000-4.450 — which is a held breath in the middle of a
// trailer and a failure at the end of one. Two seconds of dead air under the title card reads as the
// audio having broken. 123.000 is bar 41 (123/3), so the splice is still on a downbeat.
//
// legends-1 is exactly 80.00 BPM with 3.000s bars and downbeats on exact multiples of 3.000s, so every
// splice above lands on a bar line and stays in time. That is why the joins are where they are.
//
// Rendered through Chromium's WebAudio — the same Vorbis decoder the game itself plays these files with.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const OUT = process.argv[2] ?? '/tmp/gr/trailer/score.wav';
const AUDIO = 'client/public/audio';

const SEGMENTS = [
  { src: 'international-1.ogg', from: 0,  to: 24, at: 0 },
  { src: 'legends-1.ogg',       from: 0,  to: 12, at: 24 },
  { src: 'legends-1.ogg',       from: 42, to: 60, at: 36 },
  { src: 'legends-1.ogg',       from: 0,   to: 3,   at: 54 },
  { src: 'legends-1.ogg',       from: 123, to: 127, at: 57 },
];
const DUR = 61;
// Short enough not to smear a bar line, long enough that a splice does not click.
const JOIN_FADE = 0.012;

for (const s of SEGMENTS) if (!existsSync(join(AUDIO, s.src))) { console.error(`missing ${s.src}`); process.exit(1); }

const server = createServer((req, res) => {
  // The page must be served from this same origin — a page on about:blank has an opaque origin and its
  // fetch of the OGGs is blocked before it ever reaches the decoder.
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><title>score</title>'); }
  const f = join(AUDIO, p.replace(/^\//, ''));
  if (!existsSync(f) || extname(f) !== '.ogg') { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'audio/ogg' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4324, r));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:4324/');

const b64 = await page.evaluate(async ({ SEGMENTS, DUR, JOIN_FADE }) => {
  const SR = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(DUR * SR), SR);
  const cache = new Map();
  for (const s of SEGMENTS) {
    if (!cache.has(s.src)) {
      const buf = await fetch('/' + s.src).then((r) => r.arrayBuffer());
      cache.set(s.src, await ctx.decodeAudioData(buf));
    }
    const node = ctx.createBufferSource();
    node.buffer = cache.get(s.src);
    const g = ctx.createGain();
    const len = s.to - s.from;
    // Equal-power-ish micro fades at both ends of every segment: enough to kill the discontinuity click,
    // far too short to soften the musical edit.
    g.gain.setValueAtTime(0, s.at);
    g.gain.linearRampToValueAtTime(1, s.at + JOIN_FADE);
    g.gain.setValueAtTime(1, s.at + len - JOIN_FADE);
    g.gain.linearRampToValueAtTime(0, s.at + len);
    node.connect(g).connect(ctx.destination);
    node.start(s.at, s.from, len);
  }
  // The picture opens from black over 0.9s and closes to black over the last 0.8s; the music matches it.
  const master = ctx.createGain();
  const rendered = await ctx.startRendering();
  void master;

  // Apply the top-and-tail fades on the rendered buffer — simpler than another graph pass.
  // -1.4 dB of master trim. The raw mix peaks at -0.7 dBFS, which delivers fine but leaves nothing for the
  // AAC encoder — lossy codecs overshoot the PCM peak, so a file mastered to the ceiling can clip after
  // encoding even though the WAV never does.
  const TRIM = 0.85;
  for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
    const d = rendered.getChannelData(ch);
    const inN = Math.floor(0.6 * SR), outN = Math.floor(0.8 * SR); // short out-fade: the cadence should be heard, not swallowed
    for (let i = 0; i < d.length; i++) d[i] *= TRIM;
    for (let i = 0; i < inN; i++) d[i] *= i / inN;
    for (let i = 0; i < outN; i++) d[d.length - 1 - i] *= i / outN;
  }

  // WAV (16-bit PCM) — afconvert takes it from here.
  const n = rendered.length, chs = rendered.numberOfChannels;
  const bytes = new DataView(new ArrayBuffer(44 + n * chs * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) bytes.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); bytes.setUint32(4, 36 + n * chs * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true);
  bytes.setUint16(22, chs, true); bytes.setUint32(24, SR, true);
  bytes.setUint32(28, SR * chs * 2, true); bytes.setUint16(32, chs * 2, true); bytes.setUint16(34, 16, true);
  str(36, 'data'); bytes.setUint32(40, n * chs * 2, true);
  const data = [];
  for (let ch = 0; ch < chs; ch++) data.push(rendered.getChannelData(ch));
  let o = 44, peak = 0;
  for (let i = 0; i < n; i++) for (let ch = 0; ch < chs; ch++) {
    const v = Math.max(-1, Math.min(1, data[ch][i]));
    peak = Math.max(peak, Math.abs(v));
    bytes.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2;
  }
  let bin = ''; const u8 = new Uint8Array(bytes.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { b64: btoa(bin), peak, seconds: n / SR };
}, { SEGMENTS, DUR, JOIN_FADE });

mkdirSync(join(OUT, '..'), { recursive: true });
writeFileSync(OUT, Buffer.from(b64.b64, 'base64'));
console.log(`  ${OUT} — ${b64.seconds.toFixed(3)}s, peak ${(20 * Math.log10(b64.peak)).toFixed(1)} dBFS`);
await browser.close();
server.close();
