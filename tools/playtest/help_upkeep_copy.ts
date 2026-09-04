// HOW TO PLAY MUST QUOTE THE BILL THE CLUB IS ACTUALLY CHARGED.
//
// The "🏛️ Upkeep" bullet in managerHelpRows() is where the player learns to budget for the one recurring
// cost that can take a facility off them, and it anchors that with two figures: all twelve facilities at
// level 5, and at level 10. Both were written before UPKEEP_WEIGHT existed, so both quoted the flat total
// (12 x facilityUpkeep(l)) — 1,344c and 6,804c against a real 1,198c and 6,067c, overstating the bill by
// 12% at each anchor. That is F-044 — copy priced at weight 1 while the club is billed with UPKEEP_WEIGHT,
// the same defect upkeep_parity.ts guards on the facility cards — surviving at the two surfaces that fix
// did not reach: the one-time manager card, and Settings -> How to play, which never goes away.
//
// So this does NOT check the sentence against a second hard-coded number, which would rot the same way the
// first pair did. It parses the levels and the figures out of the sentence and prices those levels through
// seasonUpkeep itself, so the copy is checked against the engine that bills the player.
//
// Run: `npx tsx tools/playtest/help_upkeep_copy.ts`
import { readFileSync } from 'node:fs';
import { FACILITY_KEYS, seasonUpkeep, facilityUpkeep } from '../../shared/src/facilities.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== How to play quotes the upkeep the club is actually billed ===');

const src = readFileSync('client/src/main.ts', 'utf8');

// VACUITY GUARD, and the first thing to mutation-test: if this regex ever stops matching — the sentence is
// reworded, the figures lose their <b>, the bullet is deleted — every assertion below would run over an
// empty list and the probe would go green having measured nothing. It has to fail HERE instead.
const quoted = /all twelve at level (\d+) runs about <b>([\d,]+)c<\/b> a season, at level (\d+) about <b>([\d,]+)c<\/b>/.exec(src);
ok(!!quoted, 'the upkeep bullet still quotes two "all twelve at level N" anchors this probe can price');

if (quoted) {
  const n = (s: string) => Number(s.replace(/,/g, ''));
  const anchors = [{ level: n(quoted[1]), says: n(quoted[2]) }, { level: n(quoted[3]), says: n(quoted[4]) }];

  // A synthetic club with every facility at the same level — the exact thing the sentence describes.
  const allAt = (l: number) => Object.fromEntries(FACILITY_KEYS.map((k) => [k, l])) as any;

  for (const a of anchors) {
    const real = seasonUpkeep(allAt(a.level));
    const flat = FACILITY_KEYS.length * facilityUpkeep(a.level);
    const off = Math.abs(a.says - real) / real;
    console.log(`  ..   level ${a.level}: copy says ${a.says.toLocaleString()}c · seasonUpkeep charges `
      + `${real.toLocaleString()}c · unweighted would be ${flat.toLocaleString()}c · copy is off by ${(off * 100).toFixed(1)}%`);

    // VACUITY GUARD: at level 1 upkeep is 0 for every facility and 0 == 0 would pass without measuring the
    // weighting at all. The anchors must be levels where the bill exists.
    ok(a.level > 1 && real > 0, `level ${a.level} is an anchor with a real bill to compare against (${real}c)`);
    // VACUITY GUARD: if UPKEEP_WEIGHT were ever emptied, weighted and flat would coincide and the check
    // below could not tell the two apart — which is precisely the confusion that produced this bug.
    ok(flat !== real, `the weighting still bites at level ${a.level} (flat ${flat}c vs weighted ${real}c)`);
    // The sentence hedges with "about", so a rounded figure is fine. A whole weight class is not: the
    // defect this catches is 12% out, and any honest rounding of these totals is well inside 2%.
    ok(off <= 0.02, `the level ${a.level} figure is what the club is billed (${a.says}c vs ${real}c, within 2%)`);
  }
}

console.log(fails ? `\n✗ How to play tells the manager to budget for a bill the club is not charged`
                  : `\n✓ the explainer's upkeep anchors match seasonUpkeep`);
if (fails) process.exitCode = 1;
