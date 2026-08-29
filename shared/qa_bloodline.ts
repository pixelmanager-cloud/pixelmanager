// Do the heirs actually behave like SIBLINGS? The design claim is "correlated but distinct" — recognisably
// their father's sons, visibly different from each other. That is a measurable claim, so it is measured
// here rather than asserted in a comment.
import { mintHeirs, heirSeed, familyTrait, HEIRS_PER_GENERATION } from './src/bloodline.js';
import { rollGenes, type Genes } from './src/career.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};
const mid = (g: Genes, k: keyof Genes) => (g[k].floor + g[k].ceiling) / 2;
const KEYS: Array<keyof Genes> = ['pace', 'strength', 'stamina'];
const N = 400;

console.log('=== 1. deterministic ===');
{
  const p = rollGenes(1234);
  const a = JSON.stringify(mintHeirs(p, 999));
  const b = JSON.stringify(mintHeirs(p, 999));
  ok('the same father yields the same heirs every time', a === b);
  ok('a different father yields different heirs', a !== JSON.stringify(mintHeirs(rollGenes(4321), 999)));
  ok('sibling seeds are distinct', new Set([0, 1, 2].map((i) => heirSeed(999, i))).size === 3);
}

console.log('\n=== 2. siblings resemble their FATHER more than a stranger does ===');
{
  let kin = 0, stranger = 0, n = 0;
  for (let s = 0; s < N; s++) {
    const dad = rollGenes(s * 7919 + 3);
    const heirs = mintHeirs(dad, s * 104729 + 11);
    const rando = rollGenes(s * 31337 + 7);
    for (const h of heirs) for (const k of KEYS) {
      kin += Math.abs(mid(h.genes, k) - mid(dad, k));
      stranger += Math.abs(mid(rando, k) - mid(dad, k));
      n++;
    }
  }
  const k = kin / n, st = stranger / n;
  ok('a son is closer to his father than a stranger is', k < st * 0.9, `son ${k.toFixed(2)} vs stranger ${st.toFixed(2)} (lower = closer)`);
}

console.log('\n=== 3. the FAMILY TRAIT runs in the family ===');
{
  let fam = 0, other = 0, nf = 0, no = 0;
  for (let s = 0; s < N; s++) {
    const dad = rollGenes(s * 7919 + 3);
    const pseed = s * 104729 + 11;
    const trait = familyTrait(pseed);
    for (const h of mintHeirs(dad, pseed)) for (const k of KEYS) {
      const d = Math.abs(mid(h.genes, k) - mid(dad, k));
      if (k === trait) { fam += d; nf++; } else { other += d; no++; }
    }
  }
  const f = fam / nf, o = other / no;
  ok('the family attribute is inherited harder than the rest', f < o * 0.75, `family ${f.toFixed(2)} vs other ${o.toFixed(2)}`);
  const traits = new Set(Array.from({ length: 60 }, (_, i) => familyTrait(i * 2654435761)));
  ok('different bloodlines run on different attributes', traits.size === 3, `${traits.size}/3 seen`);
}

console.log('\n=== 4. brothers are DISTINCT, not copies ===');
{
  // Measured SEPARATELY for the family trait and everything else. Averaging them together was my own
  // mistake: the family attribute is deliberately tight across brothers — that is what makes them read as
  // brothers — so folding it into one number hides both properties instead of testing either.
  let famSpread = 0, nf = 0, otherSpread = 0, no = 0, identical = 0, lines = 0;
  for (let s = 0; s < N; s++) {
    const pseed = s * 104729 + 11;
    const heirs = mintHeirs(rollGenes(s * 7919 + 3), pseed);
    const trait = familyTrait(pseed);
    lines++;
    if (new Set(heirs.map((h) => JSON.stringify(h.genes))).size < heirs.length) identical++;
    for (const k of KEYS) {
      const vals = heirs.map((h) => mid(h.genes, k));
      const sp = Math.max(...vals) - Math.min(...vals);
      if (k === trait) { famSpread += sp; nf++; } else { otherSpread += sp; no++; }
    }
  }
  ok('no bloodline produces two identical brothers', identical === 0, `${identical}/${lines} bloodlines`);
  ok('brothers differ meaningfully OUTSIDE the family trait (>= 1.5 pts)', otherSpread / no >= 1.5, `${(otherSpread / no).toFixed(2)} pts`);
  ok('...while staying close ON the family trait (< 1.2 pts)', famSpread / nf < 1.2, `${(famSpread / nf).toFixed(2)} pts`);
}

console.log('\n=== 5. temperament is NOT inherited ===');
{
  let varied = 0;
  for (let s = 0; s < N; s++) {
    const h = mintHeirs(rollGenes(s * 7919 + 3), s * 104729 + 11);
    if (new Set(h.map((x) => x.personality)).size > 1) varied++;
  }
  ok('most sets of brothers have different temperaments', varied / N > 0.75, `${Math.round(100 * varied / N)}% of bloodlines`);
  ok('every generation offers a real choice', HEIRS_PER_GENERATION >= 2);
}

console.log(fails ? `\n✗ ${fails} bloodline check(s) failed` : '\n✓ heirs are correlated but distinct — they read as brothers');
if (fails) process.exit(1);
