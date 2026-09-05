// THE DESIGN NOTE A BALANCE PASS READS BEFORE TOUCHING UPKEEP_COEFF MUST QUOTE THE NUMBERS THE CODE
// ACTUALLY PRODUCES.
//
// The UPKEEP block in shared/src/facilities.ts is the only written account of why the coefficient is what
// it is, and it rests the fit on two figures: what all twelve facilities cost at maximum, and what the
// summit earns. Both went stale in place. "6,804" is 12 x facilityUpkeep(10) at weight 1 — the flat total,
// frozen before UPKEEP_WEIGHT took women to 0.45 and community to 0.25, while seasonUpkeep charges 6,067.
// "10,686" predates DIVISION_MERIT, which pays 600 a division and is worth 5,400 at the summit, so the
// real facility income is 13,869. A re-fit against that pair is a re-fit against a bill the game does not
// levy and an income curve 23% short of the real one — and the note's own header records that fitting the
// coefficient to an overstated income is what made levels 6-10 unreachable.
//
// This note has already shipped one defect through exactly that route. F-193 found the How to play copy
// carrying the same stale 6,804, and the fix routed the copy AROUND the note instead of correcting it;
// tools/playtest/help_upkeep_copy.ts prices the UI string and has been green throughout, because nothing
// ever priced the note. This probe does, by the same method as that sibling: it parses the anchor out of
// the comment and prices it through seasonUpkeep and seasonFacilityIncome themselves, so the note is
// checked against the engine it describes rather than against a second hard-coded number that would rot
// the same way the first pair did.
//
// Run: `npx tsx tools/playtest/facilities_note_anchors.ts`
import { readFileSync } from 'node:fs';
import { FACILITY_KEYS, MAX_LEVEL, seasonUpkeep, facilityUpkeep, seasonFacilityIncome } from '../../shared/src/facilities.js';
import { TIERS } from '../../shared/src/clubseason.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the facilities upkeep design note prices through the real functions ===');

const src = readFileSync('shared/src/facilities.ts', 'utf8');
const n = (s: string) => Number(s.replace(/,/g, ''));

// VACUITY GUARD, and the first thing to mutation-test: the note has to say WHICH club it is pricing, or
// its figures cannot be checked against anything. Delete this line from the comment and the probe must go
// red here rather than quietly pricing a scenario the note has stopped describing.
const params = /ANCHOR — all twelve at level (\d+), tierIdx (\d+), (\d+) league titles, neutral brand, (\d+)W\/(\d+)D\/(\d+)L/.exec(src);
ok(!!params, 'the note names the club it prices (level, tierIdx, league titles, record)');

// FALLING BACK RATHER THAN SKIPPING IS DELIBERATE. If that line goes missing the assertion above is
// already red, and skipping the measurement too would mean the run that most needs the margins printed is
// the one that prints none — which is how the stale pair survived. The fallback is the summit best case
// the note has always described: its own "gate 1,223" is nine home wins at a maxed ground, i.e. 18W/0D/0L.
const level = params ? n(params[1]) : MAX_LEVEL;
const tierIdx = params ? n(params[2]) : TIERS - 1;
const trophies = params ? n(params[3]) : 20;
const record = params ? { wins: n(params[4]), draws: n(params[5]), losses: n(params[6]) }
                      : { wins: 18, draws: 0, losses: 0 };

// VACUITY GUARD: the pair has to be readable out of the note at all. Deliberately loose enough to match
// the sentence as it stood when this probe was written — "now costs 6,804 a season against 10,686 of
// income" — so the probe reports that pair's margin rather than going quiet on the very defect it exists
// for.
const figures = /costs? ([\d,]+) a season against ([\d,]+) of (?:facility )?income/.exec(src);
ok(!!figures, 'the note quotes an upkeep/income pair this probe can price');

if (figures) {
  const saysUpkeep = n(figures[1]);
  const saysIncome = n(figures[2]);
  const allAt = (l: number) => Object.fromEntries(FACILITY_KEYS.map((k) => [k, l])) as any;
  const fac = allAt(level);
  const upkeep = seasonUpkeep(fac);
  const flat = FACILITY_KEYS.length * facilityUpkeep(level);
  const inc = seasonFacilityIncome(fac, tierIdx, trophies, 10, record);
  const offU = Math.abs(saysUpkeep - upkeep) / upkeep;
  const offI = Math.abs(saysIncome - inc.total) / inc.total;

  console.log(`  ..   note says ${saysUpkeep.toLocaleString()}c upkeep · seasonUpkeep charges `
    + `${upkeep.toLocaleString()}c · unweighted would be ${flat.toLocaleString()}c · note off by ${(offU * 100).toFixed(1)}%`);
  console.log(`  ..   note says ${saysIncome.toLocaleString()}c income · seasonFacilityIncome at level ${level}, `
    + `tierIdx ${tierIdx}, ${trophies} titles, ${record.wins}W/${record.draws}D/${record.losses}L pays `
    + `${inc.total.toLocaleString()}c (gate ${inc.gate} + sponsor ${inc.sponsor} + shop ${inc.shop} + women's `
    + `${inc.womens} + merit ${inc.merit}) · note off by ${(offI * 100).toFixed(1)}%`);

  // VACUITY GUARD: at level 1 every facility is free and pays nothing, so 0 == 0 would pass without
  // measuring anything. The anchor must be a level with a real bill and a real income.
  ok(level > 1 && upkeep > 0 && inc.total > 0, `the anchor has a bill and an income to compare (${upkeep}c vs ${inc.total}c)`);
  // VACUITY GUARD: if UPKEEP_WEIGHT were ever emptied, the flat and weighted totals would coincide and the
  // upkeep assertion could not tell 6,804 from 6,067 — which is exactly the confusion that produced this.
  ok(flat !== upkeep, `the weighting still bites at level ${level} (flat ${flat}c vs weighted ${upkeep}c)`);
  // VACUITY GUARD: likewise, if DIVISION_MERIT were ever zeroed the merit-free 10,686 would be within
  // tolerance again and this probe would bless the number it was written to catch.
  ok(inc.merit > 0, `the merit term the note omitted is still paid at tierIdx ${tierIdx} (${inc.merit}c)`);

  // Both figures are quoted flat, not hedged, and any honest rounding of these totals is well inside 2%.
  // The defects are 12% and 23% out.
  ok(offU <= 0.02, `the note's upkeep figure is the bill seasonUpkeep charges (${saysUpkeep}c vs ${upkeep}c, within 2%)`);
  ok(offI <= 0.02, `the note's income figure is what seasonFacilityIncome pays (${saysIncome}c vs ${inc.total}c, within 2%)`);

  // THE NOTE'S LOAD-BEARING CONCLUSION, not just its arithmetic. DIVISION_MERIT pays in every division, so
  // the claim that only the top flight can carry all twelve stopped being true when it was introduced —
  // measure where the bill is actually clearable and refuse the sentence if it is anywhere but the summit.
  // MUTATION-TEST: paste that sentence back into the note and this line has to go red.
  let lowest = -1;
  for (let t = 0; t < TIERS; t++) {
    if (seasonFacilityIncome(fac, t, trophies, 10, record).total >= upkeep) { lowest = t; break; }
  }
  const carried = lowest >= 0 ? seasonFacilityIncome(fac, lowest, trophies, 10, record).total : 0;
  console.log(`  ..   lowest division a maxed club with ${trophies} titles can carry all twelve in: tierIdx `
    + `${lowest} (${carried.toLocaleString()}c against ${upkeep.toLocaleString()}c of upkeep), top flight is tierIdx ${TIERS - 1}`);
  ok(!(lowest >= 0 && lowest < TIERS - 1 && /nothing below the top flight can hold all twelve/.test(src)),
    `the note does not still claim only the top flight can hold all twelve (it is affordable from tierIdx ${lowest})`);
}

console.log(fails ? `\n✗ the upkeep design note rests its fit on figures the code does not produce`
                  : `\n✓ the design note's anchors match seasonUpkeep and seasonFacilityIncome`);
if (fails) process.exitCode = 1;
