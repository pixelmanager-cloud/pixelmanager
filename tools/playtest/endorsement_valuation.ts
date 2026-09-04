// THE LIFE TAB MUST NOT PRINT AN ENDORSEMENT FEE AS MONEY THE PLAYER HAS BEEN PAID.
//
// `computeOffPitch` sizes every endorsement — `(120 + image * 6) * tierMult * (0.8..1.3)`, up to ~5,100c a
// deal and four deals for a global icon, so ~17,900c of headline fees on the screen at once. Nothing adds
// a coin of it. `earnings` is mutated at nine sites in career.ts and not one of them reads an endorsement;
// the only commercial money the game actually pays is the sponsors meter (+200c a chapter above 68).
//
// The tile rendered that figure as `+17,949c` in `var(--good)` — a plus sign, the `c` suffix real career
// earnings are printed with, and the palette's gain colour. Mean lifetime earnings is ~15,500c, so the
// biggest number on the Life tab was a credit bigger than the whole career, and the summer shop's budget
// never moved. A headline the player budgets against has to be true.
//
// The invariant here is deliberately TWO-SIDED, because that is the honest one: EITHER the engine credits
// the payout, OR the tile presents it as a valuation rather than a credit. Wire the money up for real and
// assertion 1 goes red FIRST — telling the next author to re-read this probe and hand the `+` chip back,
// rather than the probe quietly forbidding a sentence that has become true.
//
// Run: `npx tsx tools/playtest/endorsement_valuation.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the endorsement figure reads as a valuation, because nothing pays it ===');

// ── 1. THE PREMISE, read from the sources rather than assumed: no code path turns a payout into money.
// The match is line-local, so a payout summed into a variable on one line and banked on the next slips
// past it. That is deliberate — this leg is a tripwire that tells the next author the invariant has two
// sides; what actually holds the fix in place is sections 2 and 3.
const walk = (d: string, out: string[] = []): string[] => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
};
// STRIP COMMENTS FIRST. This codebase quotes the bug inside the comment that explains the fix, so a raw
// scan reports the post-mortem as the crime — destructive_delete and phantom_mechanics both learned this.
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const CREDITS_MONEY = /\b(?:earnings|coins|balance|budget)\b\s*[+\-]?=|\badd(?:Coins|Money|Earnings)\s*\(/;

const payoutLines: string[] = [];
const credited: string[] = [];
for (const f of [...walk('shared/src'), ...walk('client/src')]) {
  for (const line of strip(readFileSync(f, 'utf8')).split('\n')) {
    if (!/\bpayout\b/.test(line)) continue;
    payoutLines.push(f);
    if (CREDITS_MONEY.test(line)) credited.push(`${f}: ${line.trim().slice(0, 120)}`);
  }
}
console.log(`  ..   ${payoutLines.length} code line(s) mention an endorsement payout, across ${new Set(payoutLines).size} file(s)`);
// VACUITY GUARD. A renamed field leaves the loop above reading nothing and this probe passing over an
// empty list — the failure mode that kept four dead `transition: width` rules alive here for months.
ok(payoutLines.length >= 5, 'the payout field was actually found in the sources (not a zero-of-zero pass)');
for (const c of credited) console.log(`       ${c}`);
ok(credited.length === 0, `no code path adds an endorsement payout to money (${credited.length} found)`);
if (credited.length) console.log('  ..   endorsements pay for real now — re-read this probe; the tile may claim the credit again');

// The one commercial stream that DOES pay, which is what the tile's tooltip points the player at. If this
// moves, the tooltip is making a promise the engine no longer keeps.
const career = readFileSync('shared/src/career.ts', 'utf8');
ok(/if \(v\.sponsors > 68\) \{ earn \+= 200;/.test(career),
   'the sponsors meter still pays real coins above 68 — the stream the tile now points at');

// ── 2. THE CHIP, extracted from source. Exactly one span renders the figure.
const main = readFileSync('client/src/main.ts', 'utf8');
const rendered = main.split('\n').filter((l) => l.includes('op-deal-pay'));
console.log(`  ..   ${rendered.length} line(s) render the op-deal-pay chip`);
ok(rendered.length === 1, 'exactly one span renders the endorsement figure (not a zero-of-zero pass)');
const chip = (rendered[0] ?? '').match(/class="op-deal-pay"[^>]*>([^<]*)</)?.[1] ?? '';
console.log(`       chip text: ${chip}`);
ok(chip.length > 0, 'the chip text was parsed out of the render (not a zero-of-zero pass)');
ok(!/^\s*\+/.test(chip), 'the figure carries no `+` credit prefix — nothing is coming in');
ok(/\bworth\b|\bvalu/i.test(chip), 'the figure is labelled as a valuation of the deal, not as income');

// ── 3. AND THE COLOUR. `+`, the `c` suffix and the gain colour together are what made it read as money
// banked; relabelling while leaving it painted like a credit only half-fixes the sentence.
const css = readFileSync('client/index.html', 'utf8');
const rule = css.match(/\.op-deal-pay\s*\{([^}]*)\}/)?.[1] ?? '';
console.log(`       .op-deal-pay {${rule} }`);
ok(rule.length > 0, 'the .op-deal-pay rule still exists (not a zero-of-zero pass)');
ok(!/var\(--good\)/.test(rule), 'the figure is not painted in the palette gain colour reserved for things going the player\'s way');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
