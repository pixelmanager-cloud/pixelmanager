import { Career, mulberry32, fit, careerOverall, graduate, rollGenes } from '../../shared/src/career.js';
// Does spending career earnings on lifestyle buy anything? Same careers, same seeds; one policy buys
// everything affordable at every break, the other buys nothing and banks it.
function run(buy: boolean, N = 200) {
  const ov: number[] = [], mk: number[] = [], er: number[] = []; let spent = 0, items = 0;
  for (let s = 0; s < N; s++) {
    const c: any = new Career(s, 'outfield');
    const rng = mulberry32(s ^ 0x1234567);
    let guard = 0;
    while (!c.finished && guard++ < 3000) {
      const st: any = c.current();
      if (st.phase === 'arc') { c.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id); continue; }
      if (st.phase === 'focus') {
        if (buy) {
          for (const it of (c.lifestyleOffer ?? [])) {
            if (c.earnings >= it.cost) { const before = c.earnings; try { c.buyLifestyle(it.id); spent += before - c.earnings; items++; } catch { /* not affordable now */ } }
          }
        }
        c.chooseFocus(st.focus[0].id); continue;
      }
      if (st.phase === 'offer') { c.resolveOffer('develop'); continue; }
      if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
      if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
      const byFit = [...st.hand].sort((a: any, b: any) => fit(b, st.scenario) - fit(a, st.scenario));
      c.play(byFit[0].id);
    }
    const p: any = graduate(c.log, s, rollGenes(s), undefined, c.finContext());
    ov.push(careerOverall(p.attrs, p.role)); mk.push(p.marketability ?? 0); er.push(p.earnings ?? 0);
  }
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  return { ov: mean(ov), mk: mean(mk), er: mean(er), spent: spent / N, items: items / N };
}
const no = run(false), yes = run(true);
console.log(`  buy nothing: overall ${no.ov.toFixed(3)}  marketability ${no.mk.toFixed(2)}  earnings ${no.er.toFixed(0)}`);
console.log(`  buy all:     overall ${yes.ov.toFixed(3)}  marketability ${yes.mk.toFixed(2)}  earnings ${yes.er.toFixed(0)}   (${yes.items.toFixed(1)} items, ${yes.spent.toFixed(0)} coins)`);
console.log(`  spending buys: ${(yes.ov-no.ov>=0?'+':'')}${(yes.ov-no.ov).toFixed(3)} overall, ${(yes.mk-no.mk>=0?'+':'')}${(yes.mk-no.mk).toFixed(2)} marketability`);
