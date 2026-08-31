// ── DOES THE CHOICE COST ANYTHING? ───────────────────────────────────────────────────────────────────
// A story beat where every branch is a win is not a choice, it is a menu. This counts beats where NOT ONE
// option carries a cost — a negative number anywhere in its effect, an injury, or a greed increase.
//
// Measured when this was written: 295 of 735 multi-choice player-arc beats (40.1%), concentrated hard in
// the celebratory banks — signature 81%, triumph 76% — while the manager library, written later, sits at
// 2.6%. So this is not a house style; it is one authoring wave that drifted, and the rest of the game
// already demonstrates the standard.
//
// THAT WAVE HAS SINCE BEEN REPAIRED. Measured on HEAD: 27 of 735 player beats (3.7%) and 22 of 848 manager
// beats (2.6%), and the two banks that were 81% and 76% now read 8% and 3%. This file therefore stopped
// being a report of a defect and became the thing that keeps the repair — which it could not do, because
// it printed the table and exited 0 whatever the table said. It asserts now.
//
// WHAT IT DELIBERATELY DOES NOT DO IS PRICE THE YOUTH MOMENTS. docs/decisions-for-ck.md section 5 records
// the call: the shirt with his name on the back, commentating his own goals in the garden — `youth_joy`
// stays costless on purpose, and this probe "warns rather than fails for exactly this reason". Those beats
// are still counted and still listed below, and every bar is set ABOVE today's rate so that honouring that
// decision can never turn the build red. The bars exist to catch the NEXT drifting wave, not this one.
import { ARCS } from '../../shared/src/storyarc.js';
import { MANAGER_ARCS } from '../../shared/src/managerarc.js';

const costOf = (e: any): boolean => {
  if (!e) return false;
  if (e.injury) return true;
  if (typeof e.greed === 'number' && e.greed > 0) return true;   // wanting more IS the cost
  for (const [k, v] of Object.entries(e)) {
    if (typeof v === 'number' && v < 0) return true;
    if (v && typeof v === 'object' && k !== 'clubLegacy') {
      for (const n of Object.values(v as Record<string, unknown>)) if (typeof n === 'number' && n < 0) return true;
    }
  }
  return false;
};

function survey(label: string, lib: any[]) {
  const byCat: Record<string, { total: number; free: number }> = {};
  let total = 0, free = 0;
  const worst: string[] = [];
  for (const a of lib) {
    const cat = a.category ?? 'manager';
    for (const b of Object.values(a.beats ?? {}) as any[]) {
      const choices = b.choices ?? [];
      if (choices.length < 2) continue;
      total++;
      byCat[cat] ??= { total: 0, free: 0 };
      byCat[cat].total++;
      if (!choices.some((c: any) => costOf(c.effect))) {
        free++; byCat[cat].free++;
        if (worst.length < 12) worst.push(`${a.id}/${b.id}`);
      }
    }
  }
  console.log(`\n[arc-stakes] ${label}: ${free}/${total} beats have NO cost on ANY branch (${(100 * free / total).toFixed(1)}%)`);
  for (const [cat, v] of Object.entries(byCat).sort((a, b) => (b[1].free / b[1].total) - (a[1].free / a[1].total))) {
    console.log(`   ${cat.padEnd(14)} ${String(v.free).padStart(3)}/${String(v.total).padStart(3)}  ${(100 * v.free / v.total).toFixed(0)}%`);
  }
  return { free, total, worst, byCat };
}

const player = survey('player arcs', ARCS as any[]);
const manager = survey('manager arcs', MANAGER_ARCS as any[]);
if (player.worst.length) console.log(`\n   first costless player beats: ${player.worst.join(', ')}`);
console.log(`\n${player.free ? `⚠ ${player.free} player beat(s) ask for a decision and charge nothing for it` : '✓ every multi-choice beat costs something on at least one branch'}`);

// ── THE BARS ─────────────────────────────────────────────────────────────────────────────────────────
// Ratchets on a repair, not aspirations. The failure this file was written about was 40.1% of player beats
// costless, so a ceiling anywhere near today's 3.7% would be a bar against ordinary authoring rather than
// against the drift. These sit far enough above HEAD that the deliberate costless youth moments (section 5
// again — they are inside the 27) never trip them, and far enough below the historic 40.1% that the wave
// that produced it would have been caught before it had written twenty beats.
const MAX_PLAYER_COSTLESS_PCT   = 5.5;   // today 3.7% (27/735) — trips at ~41 costless player beats
const MAX_MANAGER_COSTLESS_PCT  = 4.5;   // today 2.6% (22/848) — trips at ~39 costless manager beats
const MAX_CATEGORY_COSTLESS_PCT = 20;    // today's worst bank is player `signature` at 8% (4/48)
const CATEGORY_MIN_BEATS        = 20;    // a bank smaller than this has no meaningful rate, only noise
const MIN_PLAYER_BEATS          = 640;   // today 735 multi-choice player beats  — the denominator
const MIN_MANAGER_BEATS         = 740;   // today 848 multi-choice manager beats

console.log('');
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// THE INSTRUMENT, FIRST. Every bar below is a CEILING on a count produced by `costOf`, so a `costOf` that
// stopped recognising costs would drive that count to zero and paint this gate green while the library
// filled up with free wins — the exact shape of the defect this directory keeps finding (a gate that
// re-derives its own fixture, or measures a model the game does not have, and reports the measurement).
// So the detector is asked the two questions it exists to answer before its answers are trusted.
check(costOf({ fitness: -4 }) && costOf({ injury: true }) && costOf({ greed: 2 }) && costOf({ club: { morale: -3 } }),
  'costOf still recognises a cost (a negative effect, an injury, a greed rise, a nested negative)');
check(!costOf({ morale: 3, reputation: 2, clubLegacy: { fame: 5 } }) && !costOf(undefined),
  'costOf still calls an all-upside branch free — otherwise every ceiling below passes vacuously');

// THE DENOMINATOR. A percentage over a collapsed survey is not a measurement; if the libraries stopped
// loading, `free/total` would be 0/0 and every ceiling would pass on NaN.
check(player.total >= MIN_PLAYER_BEATS && manager.total >= MIN_MANAGER_BEATS,
  `the survey still sees the multi-choice beats (${player.total} player / ${manager.total} manager, floors ${MIN_PLAYER_BEATS}/${MIN_MANAGER_BEATS})`);

// THE THING THE PROBE IS ABOUT. A beat where every branch is a win is a menu, not a decision.
const pPct = 100 * player.free / player.total;
const mPct = 100 * manager.free / manager.total;
check(pPct <= MAX_PLAYER_COSTLESS_PCT,
  `player arcs still charge for their decisions (${pPct.toFixed(1)}% of beats cost nothing on any branch, ceiling ${MAX_PLAYER_COSTLESS_PCT}%)`);
check(mPct <= MAX_MANAGER_COSTLESS_PCT,
  `manager arcs still charge for their decisions (${mPct.toFixed(1)}%, ceiling ${MAX_MANAGER_COSTLESS_PCT}%)`);

// PER BANK, BECAUSE THE FAILURE WAS NEVER SPREAD EVENLY. The 40.1% was two celebratory banks at 81% and
// 76% hiding behind a library-wide average that a total-only ceiling would have absorbed for a long time.
const banks = [...Object.entries(player.byCat).map(([c, v]) => ['player', c, v] as const),
               ...Object.entries(manager.byCat).map(([c, v]) => ['manager', c, v] as const)]
  .filter(([, , v]) => v.total >= CATEGORY_MIN_BEATS);
const worstBank = banks.reduce((w, b) => (b[2].free / b[2].total > w[2].free / w[2].total ? b : w), banks[0]);
check(banks.length > 0 && 100 * worstBank[2].free / worstBank[2].total <= MAX_CATEGORY_COSTLESS_PCT,
  banks.length
    ? `no single bank has drifted back to free wins (worst: ${worstBank[0]} ${worstBank[1]} at ${(100 * worstBank[2].free / worstBank[2].total).toFixed(0)}%, ceiling ${MAX_CATEGORY_COSTLESS_PCT}%)`
    : 'no bank was large enough to rate — the survey saw nothing');

console.log(fails
  ? `\n✗ ${fails} arc-stakes check(s) failed — beats are being authored that ask for a decision and charge nothing, the way the celebratory banks drifted to 81% before`
  : '\n✓ the repair holds: the library still charges for its decisions');
if (fails) process.exit(1);
