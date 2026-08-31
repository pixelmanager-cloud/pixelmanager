import { Career, graduate, rollGenes } from '../../shared/src/career.js';
import type { Track } from '../../shared/src/types.js';

const POLICIES: Record<string, (st: any, hand: any[]) => any> = {
  'always first option':   (st, h) => (h.length ? h[0] : st.options?.[0] ?? st.arc?.choices?.[0]),
  'always last option':    (st, h) => (h.length ? h[h.length-1] : st.options?.slice(-1)[0] ?? st.arc?.choices?.slice(-1)[0]),
  'highest power card':    (st, h) => (h.length ? h.reduce((a: any,b: any)=> (b.power??0)>(a.power??0)?b:a) : st.options?.[0] ?? st.arc?.choices?.[0]),
  'lowest power card':     (st, h) => (h.length ? h.reduce((a: any,b: any)=> (b.power??0)<(a.power??0)?b:a) : st.options?.[0] ?? st.arc?.choices?.[0]),
  'best fit to the moment':(st, h) => (h.length ? h.reduce((a: any,b: any)=> score(b,st)>score(a,st)?b:a) : st.options?.[0] ?? st.arc?.choices?.[0]),
  'worst fit deliberately':(st, h) => (h.length ? h.reduce((a: any,b: any)=> score(b,st)<score(a,st)?b:a) : st.options?.[0] ?? st.arc?.choices?.[0]),
};
const score = (c: any, st: any) => { const d = st?.scenario?.demand ?? {}; return (c.tags ?? []).reduce((s: number, t: string) => s + (d[t] ?? 0), 0); };

function run(seed: number, policy: (st: any, h: any[]) => any) {
  const c = new Career(seed, 'outfield' as Track); let step = 0;
  while (!c.finished && step < 600) {
    const st = c.current() as any;
    try {
      if (st.phase === 'arc') c.resolveArc(policy(st, []).id);
      else if (st.phase === 'focus') c.chooseFocus(st.focus[0].id);
      else if (st.phase === 'offer') c.resolveOffer('develop');
      else if (st.phase === 'coach') c.appointCoach(st.coaches[0].id);
      else if (st.phase === 'draft') c.draft(policy(st, []).id);
      else if (st.phase === 'lifestyle') c.buyLifestyle(st.items[0].id);
      else { if (!c.hand.length) break; c.play(policy(st, c.hand).id); }
    } catch { break; }
    step++;
  }
  return graduate(c.log, seed, rollGenes(seed)).overall;
}
const N = 120;
const means: Record<string, number> = {};
for (const [name, p] of Object.entries(POLICIES)) {
  let s = 0; for (let k = 1; k <= N; k++) s += run(k, p);
  means[name] = s / N;
}
const vals = Object.values(means);
console.log('  policy                      mean overall');
for (const [n, v] of Object.entries(means)) console.log(`  ${n.padEnd(26)} ${v.toFixed(3)}`);
console.log(`\n  SPREAD across policies:  ${(Math.max(...vals) - Math.min(...vals)).toFixed(3)}   (doc: 0.300)`);
// seed noise: one policy, spread across seeds
const one: number[] = []; for (let k = 1; k <= N; k++) one.push(run(k, POLICIES['best fit to the moment']));
const mu = one.reduce((a,c)=>a+c,0)/one.length;
const sd = Math.sqrt(one.reduce((a,c)=>a+(c-mu)**2,0)/(one.length-1));
console.log(`  SEED NOISE (sd of one policy across seeds): ${sd.toFixed(3)}   (doc: 1.185)`);
