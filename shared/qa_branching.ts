// THE FOREST. A dynasty branches, and the two ways that can go wrong are opposite: the branches never
// carry on (so the tree is a chain with decoration and passing a brother over costs nothing), or they all
// carry on (so by the fifth succession the succession screen is a wall of strangers). This walks ten
// generations and checks both ends.
import { heirCount, nephewCount, mintHeirs, BRANCHES_KEPT } from './src/bloodline.js';
import { rollGenes } from './src/career.js';

const GENS = 10, RUNS = 300;
let candTotal = 0, candMax = 0, candMin = 99, sole = 0, everCousin = 0;
const dist = new Map<number, number>();

for (let r = 0; r < RUNS; r++) {
  // seed, genes for each living unplayed brother at the current generation
  let uncles: Array<{ seed: number; genes: any }> = [];
  let playedSeed = (r * 2654435761) >>> 0;
  let playedGenes = rollGenes(playedSeed);
  let sawCousin = false;
  for (let g = 0; g < GENS; g++) {
    const sons = mintHeirs(playedGenes, playedSeed, heirCount(playedSeed, g));
    const cousins: Array<{ seed: number; genes: any }> = [];
    for (const u of uncles) for (const k of mintHeirs(u.genes, u.seed, nephewCount(u.seed))) cousins.push({ seed: k.seed, genes: k.genes });
    const all = [...sons.map((h) => ({ seed: h.seed, genes: h.genes })), ...cousins];
    if (cousins.length) { sawCousin = true; }
    candTotal += all.length; candMax = Math.max(candMax, all.length); candMin = Math.min(candMin, all.length);
    dist.set(all.length, (dist.get(all.length) ?? 0) + 1);
    if (all.length === 1) sole++;
    // the player takes the first; the rest become this generation's unplayed brothers
    playedSeed = all[0].seed; playedGenes = all[0].genes;
    // Sons before cousins, then the cap — the same ordering the succession applies.
    uncles = all.slice(1).slice(0, BRANCHES_KEPT);
  }
  if (sawCousin) everCousin++;
}

const n = RUNS * GENS;
console.log(`=== Branching bloodline — ${RUNS} dynasties × ${GENS} generations ===`);
console.log(`  candidates per succession: avg ${(candTotal / n).toFixed(2)}, min ${candMin}, max ${candMax}`);
console.log('  spread: ' + [...dist].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}→${Math.round((v / n) * 100)}%`).join('  '));
console.log(`  a single heir (no choice at all): ${Math.round((sole / n) * 100)}%`);
console.log(`  dynasties that were ever offered a cousin: ${Math.round((everCousin / RUNS) * 100)}%`);

const fail = (m: string) => { console.log('✗ ' + m); process.exitCode = 1; };
// Bounded: a succession the player cannot hold in their head is a worse screen than a smaller one.
if (candMax > 8) fail(`${candMax} candidates at one succession — the forest is not bounded`);
// But it must actually branch: if cousins never appear, passing a brother over has no future in it.
if (everCousin / RUNS < 0.9) fail(`only ${Math.round((everCousin / RUNS) * 100)}% of dynasties ever saw a cousin`);
// And a choice-less succession must stay the exception rather than the norm.
if (sole / n > 0.25) fail(`${Math.round((sole / n) * 100)}% of successions offer no choice at all`);
if (!process.exitCode) console.log('\n✓ the forest branches and stays bounded');
