// THE SUMMER FOCUS SCREEN HAS TO BE WORTH TAKING. Six times a career the player is asked to spend a
// summer on an attribute family instead of resting. Measured end to end -- same careers, same seeds, only
// the focus policy differing -- taking the attribute focus every time instead of resting was worth
// +0.048 overall. Six deliberate decisions the player could not possibly have detected.
//
// The cause was a unit, not a design: a pick added +1 to `attrFocus`, which reaches the player through
// AWARD_WEIGHT (0.07) AND is averaged across a stat's source tags first, so one pick moved a stat by a few
// hundredths. The coach, by comparison, adds 0.5 per specialty hit about 68 times a career -- the whole
// Focus screen was worth roughly a sixth of one coach appointment.
//
// The bar is two-sided on purpose. A screen worth nothing is decoration; a screen worth more than the card
// play would make the 120 turns of actual football the sideshow.
import { Career, mulberry32, fit, careerOverall, graduate, rollGenes } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function run(useTag: boolean, N = 220) {
  const outs: number[] = [];
  for (let s = 0; s < N; s++) {
    const c: any = new Career(s, 'outfield');
    const rng = mulberry32(s ^ 0x1234567);
    let guard = 0;
    while (!c.finished && guard++ < 3000) {
      const st: any = c.current();
      if (st.phase === 'arc') { c.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id); continue; }
      if (st.phase === 'focus') {
        const tagged = st.focus.filter((f: any) => f.tag);
        c.chooseFocus((useTag && tagged.length ? tagged[0] : st.focus[0]).id); continue;
      }
      if (st.phase === 'offer') { c.resolveOffer('develop'); continue; }
      if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
      if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
      const byFit = [...st.hand].sort((a: any, b: any) => fit(b, st.scenario) - fit(a, st.scenario));
      c.play(byFit[0].id);
    }
    const p: any = graduate(c.log, s, rollGenes(s), undefined, c.finContext());
    outs.push(careerOverall(p.attrs, p.role));
  }
  return outs.reduce((a, b) => a + b, 0) / outs.length;
}

console.log('=== The summer focus is worth taking ===');
const rest = run(false), focus = run(true);
const gain = focus - rest;
console.log(`  resting every summer: ${rest.toFixed(3)}   taking the focus: ${focus.toFixed(3)}   difference ${gain >= 0 ? '+' : ''}${gain.toFixed(3)}`);
ok(gain > 0.25, `the screen is worth taking (${gain >= 0 ? '+' : ''}${gain.toFixed(3)} overall, was +0.048)`);
// Reading the demand across 120 turns pays about +4.15. Six summers must not rival that.
ok(gain < 2.0, `but the football is still where the career is won (${gain.toFixed(3)} against the card play's ~4.15)`);
console.log(fails ? `\n✗ ${fails} focus-screen check(s) failed` : `\n✓ six summers are worth something, and less than 120 matchdays`);
if (fails) process.exitCode = 1;
