// A TWELVE-YEAR-OLD DOES NOT HAVE A CLUB CAPTAIN.
//
// The rule is stated in narrate.ts itself: "A child on a park pitch has a coach, parents on the touchline
// and rival kids — never a club captain or a veteran mentor (PT-133, cf PT-46/103)." Two banks obey it via
// the CHILD_CHAPTERS gate — CAST_SETUP_CHILD and CHILD_SETUP. chapterRecap did not: it picked its middle
// sentence from RECAP_MIDDLE with no chapter awareness at all, and 8 of that bank's 16 lines name the
// captain or the mentor.
//
// The recap is the passage a player reads at every chapter boundary — seven times a generation — so this
// was not a rare bleed. Measured before the fix: 49% of Grassroots recaps and 51% of Academy ones told a
// child that "Skipper Lindholm has started leaving him things to do."
//
// Run: `npx tsx tools/playtest/child_recap_cast.ts`
import { chapterRecap, careerCast } from '../../shared/src/narrate.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The chapter recap knows it is talking about a child ===');

const CHILD = ['Grassroots', 'Academy'];
const ADULT = ['Breakthrough', 'First Team', 'Establishing'];
const SEEDS = 700;

// The four cast members must be distinguishable, or "does the recap name the captain" is unanswerable.
let distinct = 0;
for (let s = 0; s < SEEDS; s++) {
  const c = careerCast(s * 31 + 7, 'Vance');
  if (new Set([c.gaffer, c.rival, c.mentor, c.captain]).size === 4) distinct++;
}
console.log(`  ..   ${distinct}/${SEEDS} seeded casts have four distinct surnames`);
ok(distinct === SEEDS, 'every cast has four distinct names, so naming one is unambiguous');

function rate(chapters: string[], who: 'captain' | 'mentor'): { hit: number; n: number; sample: string } {
  let hit = 0, n = 0, sample = '';
  for (const chapter of chapters) {
    for (let s = 0; s < SEEDS; s++) {
      const careerSeed = s * 31 + 7;
      const cast = careerCast(careerSeed, 'Vance');
      const out = chapterRecap({ chapter, nextChapter: 'Scholar', age: chapter === 'Grassroots' ? 11 : 14,
        careerSeed, personalityId: 'grafter', overall: 6, castAvoid: 'Vance' });
      n++;
      // CASE-INSENSITIVE, because the cast field already carries the epithet — mentor is literally
      // "the ageless Oyelaran", captain "skipper Behrens" — and cap() capitalises the first letter when the
      // line opens with it. A case-sensitive includes() reported 0/2100 on the ADULT control, which is what
      // the vacuity guard below is for: it caught this probe's own bug before the probe could bless the tree.
      if (out.toLowerCase().includes(cast[who].toLowerCase())) { hit++; if (!sample) sample = out.slice(0, 150); }
    }
  }
  return { hit, n, sample };
}

const cap = rate(CHILD, 'captain');
const men = rate(CHILD, 'mentor');
console.log(`  ..   child recaps naming the club captain: ${cap.hit}/${cap.n};  naming a veteran mentor: ${men.hit}/${men.n}`);
if (cap.sample) console.log(`       e.g. ${cap.sample}`);
if (men.sample) console.log(`       e.g. ${men.sample}`);
// VACUITY GUARD: if chapterRecap ever stopped naming anybody, both rates would be 0 and this would pass
// having measured nothing. The ADULT sweep is the control — those chapters SHOULD name both.
const adultCap = rate(ADULT, 'captain');
const adultMen = rate(ADULT, 'mentor');
console.log(`  ..   control — adult recaps naming the captain: ${adultCap.hit}/${adultCap.n}, the mentor: ${adultMen.hit}/${adultMen.n}`);
ok(adultCap.hit > 100 && adultMen.hit > 100, 'adult recaps still name both, so a zero above means a gate and not a dead bank');

ok(cap.hit === 0, `no child recap names a club captain (${cap.hit} of ${cap.n})`);
ok(men.hit === 0, `no child recap names a veteran mentor (${men.hit} of ${men.n})`);

console.log(fails === 0 ? '\n✓ the recap has a child gate' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
