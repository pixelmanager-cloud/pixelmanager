// DOES THE COACH SCREEN ASK A REAL QUESTION? Six times a career the player is offered a choice of
// specialists. The bonus attached to them lifted SUCCESS on a matching card, and success barely reaches the
// graduated attributes -- measured over 120 careers, appointing the best-fitting coach instead of the
// worst-fitting one produced a BYTE-IDENTICAL player in 106 of them, mean difference 0.117 overall. The
// screen asked you to pick a specialist and then made the pick almost irrelevant.
//
// A specialty now also leans development through attrFocus, so drilling with a finishing coach makes you a
// finisher. This holds that the choice keeps mattering, and -- the other half of the bar -- that it does
// not matter so much that one screen decides the career.
import { Career, mulberry32, graduate, rollGenes, careerOverall } from '../../shared/src/career.js';

const STYLE: any = { name: 'Poacher', pref: { composure: 1, flair: 0.8 }, skill: 0.85 };
const N = 120;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function run(seed: number, which: 'best' | 'worst') {
  const career: any = new Career(seed, 'outfield');
  const rng = mulberry32(seed ^ 0x1234567);
  const pref = (c: any) => c.tags.reduce((t: number, g: string) => t + (STYLE.pref[g] ?? 0), 0);
  let guard = 0;
  while (!career.finished && guard++ < 3000) {
    const st: any = career.current();
    if (st.phase === 'arc') career.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id);
    else if (st.phase === 'focus') career.chooseFocus(st.focus[0].id);
    else if (st.phase === 'offer') career.resolveOffer('develop');
    else if (st.phase === 'coach') {
      const sc = st.coaches.map((c: any) => ({ c, s: c.specialty.reduce((t: number, g: string) => t + (STYLE.pref[g] ?? 0), 0) }));
      sc.sort((a: any, b: any) => b.s - a.s);
      career.appointCoach((which === 'best' ? sc[0] : sc[sc.length - 1]).c.id);
    } else if (st.phase === 'draft') {
      let b = st.options[0], bs = -Infinity;
      for (const c of st.options) { const s2 = pref(c); if (s2 > bs) { bs = s2; b = c; } }
      career.draft(b.id);
    } else {
      let b = st.hand[0], bs = -Infinity;
      for (const c of st.hand) { const s2 = pref(c) * 2 + STYLE.skill * 3 + rng() * 0.05; if (s2 > bs) { bs = s2; b = c; } }
      career.play(b.id);
    }
  }
  const p: any = graduate(career.log, seed, rollGenes(seed), undefined, career.finContext());
  return careerOverall(p.attrs, p.role);
}

console.log('=== The coach you appoint changes the player you get ===');
let bSum = 0, wSum = 0, same = 0, bWon = 0;
for (let s = 0; s < N; s++) {
  const b = run(s, 'best'), w = run(s, 'worst');
  bSum += b; wSum += w;
  if (b === w) same++; else if (b > w) bWon++;
}
const diff = (bSum - wSum) / N;
console.log(`  best-fit ${(bSum / N).toFixed(2)} vs worst-fit ${(wSum / N).toFixed(2)} — identical in ${same}/${N}, best won ${bWon}/${N}`);
ok(same <= N * 0.45, `the appointment usually changes the graduate (identical in ${same}/${N})`);
ok(diff >= 0.35, `and fitting the coach to the player is worth something (${diff.toFixed(3)} overall)`);
// The other side of the bar. A career is 200 turns of card play; six coach screens must not eclipse it.
ok(diff <= 2.5, `but one screen does not decide the career (${diff.toFixed(3)} overall)`);
ok(bWon >= N * 0.5, `the best-fitting coach is the better pick more often than not (${bWon}/${N})`);
console.log(fails ? `\n✗ ${fails} coach check(s) failed` : `\n✓ the coach appointment is a decision`);
if (fails) process.exitCode = 1;
