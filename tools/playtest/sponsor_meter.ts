// CAN THE SPONSORS METER ACTUALLY FALL, AND DOES FALLING COST ANYTHING?
//
// It could not, and it did not. `Math.max(0, perf)` meant a bad season contributed zero rather than a loss,
// so performance only ever pushed this meter UP, and its mean-reversion ran at half strength -- which,
// below 50, is also an upward push. Meanwhile it was the one meter with no downside branch in
// computeConsequences: every other relationship bites when it is low, this one only paid out above 68. A
// player could watch his commercial standing slide for five seasons and the game would never mention it.
//
// The bar here is deliberately two-sided. A penalty that fires in nearly every career is noise, not a
// consequence; one that fires in none is decoration. It should separate careful play from careless play.
import { Career, mulberry32 } from '../../shared/src/career.js';

const STYLE: any = { name: 'Poacher', pref: { composure: 1, flair: 0.8 }, skill: 0.85 };
const N = 150;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function run(good: boolean) {
  const mins: number[] = [], draws: number[] = [];
  for (let s = 0; s < N; s++) {
    const career: any = new Career(s, 'outfield');
    const rng = mulberry32(s ^ 0x1234567);
    const pref = (c: any) => c.tags.reduce((t: number, g: string) => t + (STYLE.pref[g] ?? 0), 0);
    let lo = 100, hi = 0, draw = 0, guard = 0, seen = false;
    while (!career.finished && guard++ < 3000) {
      const st: any = career.current();
      if (st.phase === 'arc') career.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id);
      else if (st.phase === 'focus') {
        const lowest = [...career.meters].sort((a: any, b: any) => a.value - b.value)[0];
        const pick = good ? (st.focus.find((f: any) => lowest && (f.effects?.[lowest.key] ?? 0) > 0) ?? st.focus[0]) : st.focus[Math.floor(rng() * st.focus.length)];
        career.chooseFocus(pick.id);
      } else if (st.phase === 'offer') career.resolveOffer(good ? 'brand' : ['money', 'brand', 'develop'][Math.floor(rng() * 3)]);
      else if (st.phase === 'coach') career.appointCoach(st.coaches[0].id);
      else if (st.phase === 'draft') career.draft(st.options[0].id);
      else {
        let best = st.hand[0], bs = -Infinity;
        for (const c of st.hand) { const sc = good ? pref(c) * 2 + STYLE.skill * 3 + rng() * 0.05 : rng(); if (sc > bs) { bs = sc; best = c; } }
        career.play(best.id);
      }
      const sp = (career.meters ?? []).find((m: any) => m.key === 'sponsors');
      if (sp) { seen = true; lo = Math.min(lo, sp.value); hi = Math.max(hi, sp.value); draw = Math.max(draw, hi - sp.value); }
    }
    if (seen) { mins.push(lo); draws.push(draw); }
  }
  const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  return { under30: mins.filter((v) => v < 30).length, floor: med(mins), drawdown: med(draws), zeroed: mins.filter((v) => v <= 0).length, n: mins.length };
}

console.log('=== The sponsors meter is a thing you can lose ===');
const g = run(true), b = run(false);
console.log(`  careful:  floor median ${g.floor}, drawdown median ${g.drawdown}, ${g.under30}/${g.n} careers dip under 30`);
console.log(`  careless: floor median ${b.floor}, drawdown median ${b.drawdown}, ${b.under30}/${b.n} careers dip under 30`);
ok(g.drawdown >= 4, `the meter falls from its own peak in a normal career (median drawdown ${g.drawdown})`);
ok(g.under30 >= N * 0.15, `the sub-30 penalty is reachable by a careful player (${g.under30}/${N})`);
ok(g.under30 <= N * 0.60, `but not so common it is just weather (${g.under30}/${N})`);
ok(b.under30 > g.under30, `careless play loses sponsors more often than careful play (${b.under30} vs ${g.under30})`);
ok(g.zeroed === 0, `a careful career never bottoms the meter out (${g.zeroed})`);
console.log(fails ? `\n✗ ${fails} sponsor-meter check(s) failed` : `\n✓ sponsors rises and falls with how the career is going`);
if (fails) process.exitCode = 1;
