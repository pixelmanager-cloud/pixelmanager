// REGISTER GUARD for the prompt corpus (PT-404). At ~49,000 authored lines nobody can read them all, and
// the failure mode is not a bad line — it is 500 lines with the same shape, which is exactly what makes
// prose read as generated rather than authored. Volume without this check makes the game worse, not better.
import { KIND_SETUP } from '../../shared/src/prompts/kind_setup.js';
import { DEMAND } from '../../shared/src/prompts/demand.js';
import { FRAME_BY_CHAPTER } from '../../shared/src/prompts/frame.js';
import { CHILD_SETUP } from '../../shared/src/prompts/child_setup.js';
import { SETTINGS } from '../../shared/src/prompts/settings.js';
import { EVENT_PREFIX } from '../../shared/src/prompts/event_prefix.js';
import { BIG_SETTINGS } from '../../shared/src/prompts/big_settings.js';

const all: Array<[string, string]> = [];
for (const [bank, data] of Object.entries({ KIND_SETUP, DEMAND, FRAME_BY_CHAPTER, CHILD_SETUP, SETTINGS, EVENT_PREFIX })) {
  for (const [key, lines] of Object.entries(data as Record<string, string[]>)) for (const l of lines) all.push([`${bank}.${key}`, l]);
}
for (const l of BIG_SETTINGS) all.push(['BIG_SETTINGS', l]);

const checks: Array<[string, boolean, string]> = [];
const say = (name: string, ok: boolean, val: string) => checks.push([name, ok, val]);

// 1. AMERICANISMS — the library is British and has been kept clean by hand; at scale it needs enforcing
const US = /\b(soccer|cleats|mom|gotten|practice field|tryouts?|roster|offense|defense|jersey|field goal|freshman|vacation|apartment|elevator|candy|fall season)\b/i;
const usHits = all.filter(([, l]) => US.test(l));
say('no Americanisms', usHits.length === 0, usHits.length ? `${usHits.length}, e.g. "${usHits[0][1].slice(0, 50)}"` : '0');

// 2. SHAPE CLUSTERING — the same opening three words over and over is the tell
const opens = new Map<string, number>();
for (const [, l] of all) {
  const k = l.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).slice(0, 3).join(' ');
  if (k) opens.set(k, (opens.get(k) ?? 0) + 1);
}
const topOpen = [...opens.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
const openShare = 100 * topOpen[1] / Math.max(1, all.length);
say('no single opening dominates (< 2.5% of lines)', openShare < 2.5, `"${topOpen[0]}" ${openShare.toFixed(1)}%`);

// 3. LENGTH SPREAD — all-same-length lines read mechanical
const lens = all.map(([, l]) => l.split(/\s+/).length);
const mean = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
const sd = Math.sqrt(lens.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, lens.length));
say('sentence length actually varies (sd >= 3.0 words)', sd >= 3.0, `mean ${mean.toFixed(1)}, sd ${sd.toFixed(1)}`);

// 4. THE APPOSITIVE TIC — ", which is …" was already an audible tic once (PT-203)
const tic = all.filter(([, l]) => /,\s*which is\b/i.test(l));
say('the ", which is …" tic stays rare (< 2%)', 100 * tic.length / Math.max(1, all.length) < 2, `${tic.length} lines`);

// 5. SECOND PERSON — prompts are third-person about "he"; "you" leaks from other surfaces
const you = all.filter(([, l]) => /\byou\b|\byour\b/i.test(l));
say('no second person', you.length === 0, you.length ? `${you.length}, e.g. "${you[0][1].slice(0, 50)}"` : '0');

console.log(`=== Prompt register — ${all.length} lines ===`);
let fails = 0;
for (const [n, ok, v] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${n}  (${v})`); if (!ok) fails++; }
console.log(fails ? `\n⚠ ${fails} register concern(s)` : `\n✓ the corpus still reads authored`);
if (fails) process.exitCode = 1;
