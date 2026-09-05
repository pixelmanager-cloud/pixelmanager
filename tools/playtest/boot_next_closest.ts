// THE LIFE TAB'S "🔒 NEXT" BOOT MUST BE THE CLOSEST UNMET ONE — AND EVERY BOOT MUST BE ABLE TO BE IT.
//
// `computeOffPitch` promises "next = the closest unmet" one line above what was
// `BOOT_CATALOG.find((b) => !met(b))` — the FIRST unmet in DECLARATION order. The catalogue is authored by
// theme, not difficulty, so four of its eleven entries were unreachable BY CONSTRUCTION rather than merely
// rare: `homecoming` (score 300), `iron-will` (600) and `silverware` (700) all sit behind `century` (900),
// and `people-choice` (image 60) behind `signature` (image 80) — any state that reached them in declaration
// order had already met them. A quarter of the collectible's progress hints was a branch that could never
// fire, this codebase's signature defect and the same shape as the four dead `transition: width` rules.
// What the player saw instead was "The Century — Career score 900+ (412/900)" while Iron Will at 600 was
// the boot actually arriving next: the only progress bar on the boots collectible, pointed at the wrong
// goal essentially always.
//
// The three assertions are deliberately different in kind, because "closest" can break in three ways:
//   §2 REACHABILITY — no catalogue entry is dead. Grid-based, so it is also the leg that goes red if a new
//      boot is authored behind an implication it can never escape.
//   §3 CLOSENESS — no unmet boot beats the named one on completion fraction. Fraction, not raw distance:
//      the four gates are in four units, so "3 caps short" would otherwise always beat "488 score short".
//   §4 HONEST NUMBERS — the (progress/target) pair rendered at client/src/main.ts belongs to the gate that
//      is actually blocking, and a LOCKED boot never reads as complete. Without this, `silverware`
//      (a big win AND score 700) reports 700/700 the moment score passes 700 with no big win — a full bar
//      on a locked collectible, and the fastest way to reintroduce the bug §3 just fixed.
//
// MUTATION TEST for whoever doubts it: put `.find((b) => !met(b))` back and §2 and §3 go red together;
// drop the worst-gate loop in `gauge` so it keys on needScore first and §4 goes red on silverware alone.
//
// Run: `npx tsx tools/playtest/boot_next_closest.ts`
import { computeOffPitch, BOOT_CATALOG } from '../../shared/src/offpitch.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the "next boot" hint names the closest unmet boot, and no boot is unnameable ===');

type Boot = typeof BOOT_CATALOG[number];

// The oracle, written out independently of the engine: every gate a boot declares, as a (done/needed)
// pair, with the boot's closeness set by its WORST gate — a two-gate boot is only as close as its blocker.
const gatesOf = (b: Boot, careerScore: number, caps: number, imageScore: number, bigWins: number) => {
  const g: { gate: string; progress: number; target: number }[] = [];
  if (b.needScore != null) g.push({ gate: 'score', progress: careerScore, target: b.needScore });
  if (b.needCaps != null) g.push({ gate: 'caps', progress: caps, target: b.needCaps });
  if (b.needImage != null) g.push({ gate: 'image', progress: imageScore, target: b.needImage });
  if (b.needBigWin != null) g.push({ gate: 'bigWin', progress: bigWins > 0 ? 1 : 0, target: 1 });
  return g;
};
const closeness = (g: { progress: number; target: number }[]) =>
  g.reduce((m, x) => Math.min(m, x.progress / x.target), Infinity);

// ── 1. THE PREMISE. A catalogue of one, or of gates that all share a unit, would make §2 and §3 pass over
// nothing worth measuring — the zero-of-zero green this repo has been bitten by before.
const kinds = new Set(BOOT_CATALOG.flatMap((b) => gatesOf(b, 0, 0, 0, 0).map((g) => g.gate)));
console.log(`  ..   ${BOOT_CATALOG.length} boots in the catalogue, across ${kinds.size} gate unit(s): ${[...kinds].join(', ')}`);
ok(BOOT_CATALOG.length >= 4 && kinds.size >= 3, 'the catalogue has several boots gated in several units (not a zero-of-zero pass)');
const multi = BOOT_CATALOG.filter((b) => gatesOf(b, 0, 0, 0, 0).length > 1);
console.log(`  ..   ${multi.length} boot(s) declare more than one gate: ${multi.map((b) => b.id).join(', ') || '(none)'} — §4's subjects`);

// ── THE SWEEP, over computeOffPitch's own inputs. `imageScore` is read back off the result rather than
// re-derived here, so retuning the maturity clamp cannot silently desynchronise the oracle from the engine.
const shown = new Map<string, number>();
let states = 0, withNext = 0;
const misPicks: string[] = [];
const badNumbers: string[] = [];
let worstMiss: { msg: string; gap: number } | null = null;

for (let careerScore = 0; careerScore <= 1400; careerScore += 10)
 for (const caps of [0, 1, 2, 3, 4, 5, 10])
  for (const bigWins of [0, 1, 2])
   for (const turn of [70, 90, 120])
    for (const flair of [0, 10, 20]) {
      states++;
      const o = computeOffPitch({ careerScore, caps, seed: 7, turn, tags: {}, bigWins, flair });
      const imageScore = o.image.score;
      const ownedIds = new Set(o.boots.owned.map((b) => b.id));
      const unmet = BOOT_CATALOG.filter((b) => !ownedIds.has(b.id));
      const n = o.boots.next;
      if (!n) { if (unmet.length) badNumbers.push(`no "next" shown while ${unmet.length} boot(s) are unmet`); continue; }
      withNext++;
      shown.set(n.boot.id, (shown.get(n.boot.id) ?? 0) + 1);

      // §3's measurement: is anything strictly closer than what was named?
      const mine = closeness(gatesOf(BOOT_CATALOG.find((b) => b.id === n.boot.id)!, careerScore, caps, imageScore, bigWins));
      let best = { id: n.boot.id, f: mine };
      for (const b of unmet) {
        const f = closeness(gatesOf(b, careerScore, caps, imageScore, bigWins));
        if (f > best.f + 1e-9) best = { id: b.id, f };
      }
      if (best.id !== n.boot.id) {
        const msg = `score ${careerScore}, caps ${caps}, image ${imageScore}, bigWins ${bigWins}: showed ${n.boot.id} at ${(mine * 100).toFixed(0)}% — ${best.id} is at ${(best.f * 100).toFixed(0)}%`;
        misPicks.push(msg);
        if (!worstMiss || best.f - mine > worstMiss.gap) worstMiss = { msg, gap: best.f - mine };
      }

      // §4's measurement: the pair rendered must be the blocking gate's, and a locked boot is never full.
      const blocker = gatesOf(BOOT_CATALOG.find((b) => b.id === n.boot.id)!, careerScore, caps, imageScore, bigWins)
        .reduce((w, g) => (g.progress / g.target < w.progress / w.target ? g : w));
      if (n.progress >= n.target)
        badNumbers.push(`${n.boot.id} renders (${n.progress}/${n.target}) — a full bar on a locked boot`);
      else if (n.progress !== Math.min(blocker.progress, blocker.target) || n.target !== blocker.target)
        badNumbers.push(`${n.boot.id} renders (${n.progress}/${n.target}) but its blocker is ${blocker.gate} (${blocker.progress}/${blocker.target})`);
    }

console.log(`  ..   swept ${states} input states; ${withNext} named a "next" boot`);
ok(withNext > states / 2, 'most swept states actually produced a "next" hint (not a zero-of-zero pass)');

// ── 2. REACHABILITY: no entry in the catalogue is a hint that can never be shown.
const dead = BOOT_CATALOG.filter((b) => !shown.has(b.id)).map((b) => b.id);
console.log(`  ..   named as "next" somewhere: ${BOOT_CATALOG.filter((b) => shown.has(b.id)).map((b) => `${b.id}×${shown.get(b.id)}`).join(' ')}`);
for (const d of dead) console.log(`       ${d} is never shown as "next" in any swept state — a dead progress hint`);
ok(dead.length === 0, `every boot in the catalogue can be named as "next" (${dead.length} of ${BOOT_CATALOG.length} cannot)`);

// ── 3. CLOSENESS: nothing unmet is nearer to done than the boot the player is told to chase.
console.log(`  ..   ${misPicks.length} of ${withNext} states named a boot another unmet boot beats on completion`);
for (const m of misPicks.slice(0, 5)) console.log(`       ${m}`);
if (misPicks.length > 5) console.log(`       … and ${misPicks.length - 5} more`);
if (worstMiss) console.log(`       worst: ${worstMiss.msg}`);
ok(misPicks.length === 0, 'the boot named is the closest unmet one, in every swept state');

// ── 4. HONEST NUMBERS: the bar belongs to the gate that is actually blocking, and never reads as full.
console.log(`  ..   ${badNumbers.length} state(s) rendered a progress pair that is not the blocking gate's`);
for (const m of [...new Set(badNumbers)].slice(0, 5)) console.log(`       ${m}`);
ok(badNumbers.length === 0, 'the (progress/target) shown is the blocking gate\'s, and a locked boot never reads as complete');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
