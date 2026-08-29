import { Career, AGE_BANDS, bandAt, TOTAL_TURNS } from './shared/src/career.js';
import { ARCS } from './shared/src/storyarc.js';
import { careerSeedFor } from './shared/src/tokens.js';

// How many arcs are even ELIGIBLE in the childhood window?
const gr = ARCS.filter((a) => a.minTurn <= 11);            // can fire during Grassroots (turns 0-11)
const ac = ARCS.filter((a) => a.minTurn <= 27 && a.maxTurn >= 12); // available during Academy
console.log(`eligible pool — Grassroots(0-11): ${gr.length} arcs | Academy(12-27): ${ac.length} arcs`);

function earlyArcs(seed: number): string[] {
  const c = new Career(seed, 'outfield'); const out: string[] = []; let guard = 0;
  while (!c.finished && guard++ < 6000) {
    const st: any = c.current();
    if (st.phase === 'arc') {
      const ch = bandAt(Math.min(c.turn, TOTAL_TURNS - 1)).band.name;
      if (ch === 'Grassroots' || ch === 'Academy') out.push(st.arc.id);
      c.resolveArc(st.arc.choices[0].id); continue;
    }
    if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id, true); continue; }
    if (st.phase === 'offer') { c.resolveOffer(st.offers[0].id); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id, true); continue; }
    if (st.phase === 'draft') { c.draft(st.options[0].id, true); continue; }
    if (st.phase === 'lifestyle') { c.buyLifestyle(st.lifestyle[0].id, true); continue; }
    c.play((c as any).deck[0].id, true);
  }
  return [...new Set(out)];
}

// simulate real DYNASTIES: same bloodline token, generations 0..4 (the actual seeds the game uses)
let totalDraws = 0, distinctSum = 0, dupPairs = 0, pairs = 0;
for (let d = 0; d < 12; d++) {
  const tokenId = `tok-${d}`;
  const gens = [0, 1, 2, 3, 4].map((g) => earlyArcs(careerSeedFor(tokenId, g)));
  const all = gens.flat(); const distinct = new Set(all);
  totalDraws += all.length; distinctSum += distinct.size;
  for (let i = 0; i < gens.length; i++) for (let j = i + 1; j < gens.length; j++) {
    pairs++; if (gens[i].some((x) => gens[j].includes(x))) dupPairs++;
  }
  if (d < 3) console.log(`  dynasty ${d}: ` + gens.map((g, i) => `g${i}[${g.map((x) => x.replace('youth-', '')).join(',')}]`).join(' '));
}
console.log(`across 12 dynasties x 5 generations: ${totalDraws} early-arc draws, ${distinctSum} distinct (${(100*distinctSum/totalDraws).toFixed(0)}% fresh)`);
console.log(`generation-pairs sharing >=1 early arc: ${dupPairs}/${pairs} (${(100*dupPairs/pairs).toFixed(0)}%)`);
