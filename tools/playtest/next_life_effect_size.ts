// THE LINE THAT DISCLOSES THE HEIR BONUS IS SIZED LIKE THE TILE IT SITS IN.
//
// The retirement screen asks "what does he do next?" — coaching, media, mentoring — and only mentoring
// hands the heir a mentality head-start. That used to be a blind fake-choice; it was rewritten to state the
// effect on the tile (`.cg-effs`, main.ts), which is the whole point of the screen. But every rule for
// `.cg-effs` in the sheet demands a parent the coach tile does not have (`.cg-offer .cg-effs`,
// `.cg-foc .cg-effs`, …) and there is no bare rule, so the disclosure fell through to the 22px `html, body`
// default — 69% larger than the 13px `.cg-cdesc` sitting directly above it in the same tile, in the same
// face. The tile's hierarchy read backwards: the fine print was the biggest thing on it.
//
// A MISSING rule cannot be caught by reading the stylesheet — there is nothing there to read, and the line
// still renders as text. So this measures: the shipped stylesheet plus the markup the emitter really
// returns, in headless chromium, with getComputedStyle. The reference is not a hard-coded 12px either, it
// is `.cg-cdesc` in the same tile — "no louder than the blurb it annotates" is the actual requirement.
//
// Anti-vacuity: an unstyled `<div>` outside the shell reports the page default, and the `.cg-offer` tile
// (which emits `.cg-effs` identically) reports the treatment the author intended for this class. If the
// stylesheet failed to load, or the markup extraction came back empty, both anchors fail before any
// equality below can report a false green. Mutation-tested: delete `.cg-coach .cg-cdesc` from the sheet as
// well and the blurb rises to the default too — the anchor catches that rather than the sizes agreeing at
// 22px and passing.
//
// Run: `npx tsx tools/playtest/next_life_effect_size.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The retirement next-life tiles size their own effect line ===');

/** Drop `${…}` interpolations, brace-balanced so a nested template literal goes with them. */
function strip(s: string): string {
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] === '$' && s[i + 1] === '{') {
      let d = 1; i += 2;
      while (i < s.length && d) { if (s[i] === '{') d++; else if (s[i] === '}') d--; i++; }
    } else out += s[i++];
  }
  return out;
}
/** Remove the `` ` + ` `` glue between two halves of one emitted element. */
const unglue = (s: string) => s.replace(/`[^`]*`/g, '');

// The next-life tiles, from the emitter rather than retyped here, so a tile that stops emitting .cg-effs is
// measured rather than assumed. `</div>` closes each .cg-effs literal and appears nowhere inside them.
const blockAt = src.indexOf('<div id="cg-nextlife">');
const block = blockAt < 0 ? '' : src.slice(blockAt, src.indexOf(`}).join('')`, blockAt));
const effs = [...block.matchAll(/<div class="cg-effs[\s\S]*?<\/div>/g)].map((m) => m[0]);
const tileAt = block.indexOf('<div class="cg-coach" data-nextlife=');
const tile = tileAt < 0 ? '' : block.slice(tileAt, block.indexOf('`;', tileAt));
const tiles = effs.map((e, n) =>
  strip(tile.replace('${eff}', () => e)).replace('class="cg-coach"', `class="cg-coach" id="nle-tile${n}"`));

// The reference treatment: the sponsor-offer tile, which emits the same class into a parent that HAS a rule.
const offAt = src.indexOf('<div class="cg-offer" data-act="offer"');
const offer = offAt < 0 ? '' : unglue(strip(src.slice(offAt, src.indexOf('</div></div>', offAt) + 12)));

console.log(`  ..   ${effs.length} effect line(s) extracted, ${tiles.length} next-life tile(s) built`);
ok(blockAt > 0 && tileAt >= 0, 'the #cg-nextlife tile emitter was located in main.ts');
ok(effs.length === 2, 'both effect lines (mentoring and the muted pair) were extracted');
ok(tiles.every((t) => t.includes('cg-cdesc') && t.includes('cg-effs')), 'each tile carries its blurb AND its effect line — this is not about to measure an empty set');
ok(offer.includes('cg-effs') && offer.includes('cg-offer'), 'the reference .cg-offer tile was extracted');
if (fails) { console.log('\n✗ the markup could not be read, so nothing below would be measuring anything'); process.exit(1); }

const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
const page = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>`
  + `<div id="app"><div id="academy" class="panel"><div id="academy-body">`
  + `<div class="cg-graduation"><div id="cg-nextlife">${tiles.join('')}</div></div>`
  + `<div id="nle-offer">${offer}</div><div id="nle-bare">bare</div>`
  + `</div></div></div></body></html>`;

async function main() {
  let chromium: any;
  try { ({ chromium } = await import('playwright')); }
  catch { console.log('  FAIL playwright is not installed — `npm i -D playwright && npx playwright install chromium`'); process.exit(1); }
  let browser: any;
  try { browser = await chromium.launch(); }
  catch (e: any) {
    console.log(`  FAIL chromium could not launch (${String(e?.message ?? e).slice(0, 90)})`);
    console.log('       run `npx playwright install chromium`');
    process.exit(1);
  }
  const pg = await browser.newPage();
  await pg.setContent(page, { waitUntil: 'load' });
  const px = (sel: string) => pg.evaluate((s: string) => {
    const el = document.querySelector(s);
    return el ? parseFloat(getComputedStyle(el).fontSize) : null;
  }, sel);

  const bare = await px('#nle-bare');
  const refEff = await px('#nle-offer .cg-effs');
  console.log(`  ..   an unstyled div on this page is ${bare}px; .cg-offer .cg-effs is ${refEff}px`);
  ok(!!bare && bare >= 20, 'the page default was measured (it is what an unreached element falls through to)');
  ok(!!refEff && !!bare && refEff < bare, 'the stylesheet loaded — .cg-effs IS styled where a rule reaches it');
  if (fails) { console.log('\n✗ the page did not render the shipped stylesheet, so the sizes below mean nothing'); process.exit(1); }

  for (let n = 0; n < tiles.length; n++) {
    const desc = await px(`#nle-tile${n} .cg-cdesc`);
    const eff = await px(`#nle-tile${n} .cg-effs`);
    ok(desc !== null && eff !== null, `tile ${n} rendered both its blurb and its effect line`);
    if (desc === null || eff === null) continue;
    console.log(`  ..   tile ${n}: blurb ${desc}px, effect line ${eff}px`);
    ok(desc < bare!, `tile ${n}'s blurb is styled, not the page default (${desc}px vs ${bare}px) — the anchor for the check below`);
    ok(eff <= desc, `tile ${n}'s effect line is no louder than the blurb it annotates (${eff}px vs ${desc}px)`);
  }

  await browser.close();
  console.log(fails ? `\n✗ ${fails} — the next-life tile's fine print outsizes the tile` : '\n✓ every next-life effect line is sized inside its tile');
  if (fails) process.exitCode = 1;
}
void main();
