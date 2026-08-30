// THE FOREST. A dynasty branches, and the two ways that can go wrong are opposite: the branches never
// carry on (so the tree is a chain with decoration and passing a brother over costs nothing), or they all
// carry on (so by the fifth succession the succession screen is a wall of strangers). This walks ten
// generations and checks both ends.
import { heirCount, nephewCount, mintHeirs, BRANCHES_KEPT, MAX_HEIRS } from './src/bloodline.js';
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
// A LITERAL 8 WAS UNREACHABLE BY CONSTRUCTION. This harness builds its own candidate list from
// `BRANCHES_KEPT`, so the ceiling is `MAX_HEIRS + BRANCHES_KEPT * nephewMax` = 3 + 2*2 = 7 — the bound
// could never fire, and the observed maximum is 6. Deriving it from the constants means it moves when they
// do, instead of quietly going slack.
//
// And an upper bound alone only guards one direction. A change that collapsed the forest to sons-only —
// no cousins, no branching, the whole premise gone — scored perfectly on "the forest is bounded". So there
// is a lower bound too.
//
// Scope, stated because it was not: this file tests `bloodline.ts` ARITHMETIC. The behavioural bound lives
// in `client/src/api.ts`'s `sameGen.slice(0, BRANCHES_KEPT)`, which this file does not import and cannot
// see — removing that cap leaves this harness byte-identical. `qa_branch_switch` is what covers it.
// TWO BOUNDS, AND THE ABSOLUTE ONE IS THE POINT.
//
// A ceiling derived from `BRANCHES_KEPT` moves when `BRANCHES_KEPT` moves — so raising the constant from 2
// to 20, which is exactly the cap its own twenty-line doc-comment exists to enforce, raises the bound with
// it and passes. I wrote that version first: it is the same "re-derives its expectation from the thing
// under test" defect I had just removed from division_balance, reintroduced an hour later.
//
// So the derived bound stays, to catch the arithmetic drifting out of line with the constants — and an
// ABSOLUTE one sits above it, because "how many sons and cousins can a player be offered at one
// succession" is a question about a human reading a screen, not about a constant. Eight is already a lot.
const CEILING = MAX_HEIRS + BRANCHES_KEPT * 2;
if (candMax > CEILING) fail(`${candMax} candidates at one succession (ceiling ${CEILING}) — the forest is not bounded`);
// Seven, not eight, and the margin is the finding. `BRANCHES_KEPT` is barely load-bearing: raising it
// TENFOLD, 2 to 20, moves the widest succession only from 6 to 8 and the average from 2.69 to 2.78,
// because `nephewCount` returns zero for about seven uncles in ten and does the real bounding. So a bound
// at 8 sits exactly on the value a tenfold change produces and cannot see it. At 7 there is one candidate
// of headroom over the observed maximum of 6, the harness is seed-deterministic so that margin is stable,
// and a change that genuinely widens the forest fails.
if (candMax > 7) fail(`${candMax} candidates at one succession — more than a player can meaningfully choose between, whatever BRANCHES_KEPT says`);
if (candMax <= MAX_HEIRS) fail(`widest succession offered only ${candMax} candidates — the forest has stopped branching entirely`);
// But it must actually branch: if cousins never appear, passing a brother over has no future in it.
if (everCousin / RUNS < 0.9) fail(`only ${Math.round((everCousin / RUNS) * 100)}% of dynasties ever saw a cousin`);
// And a choice-less succession must stay the exception rather than the norm.
if (sole / n > 0.25) fail(`${Math.round((sole / n) * 100)}% of successions offer no choice at all`);
if (!process.exitCode) console.log('\n✓ the forest branches and stays bounded');
