// A dynasty is the point of the game, so the question is not "is one career varied" but "does the FIFTH
// heir read like new text". Measures the share of sentences a generation shows that an EARLIER generation
// in the same bloodline already showed. (PT-404)
import { Career, fit, seedFrom } from '../../shared/src/career.js';
import { actWithNarration } from '../../shared/src/tokens.js';
import { scenarioStory } from '../../shared/src/narrate.js';
const BLOODLINES = Number(process.argv[2] ?? 8), GENS = 5;
const sentences = (t: string) => String(t).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 12);
const seen: number[][] = Array.from({ length: GENS }, () => []);
for (let b = 0; b < BLOODLINES; b++) {
  const before = new Set<string>();
  for (let g = 0; g < GENS; g++) {
    const c = new Career(seedFrom(`dyn${b}`, g), 'outfield', 'loyal');
    const mine: string[] = []; const prompts: string[] = []; const outcomes: string[] = []; let guard = 0;
    while (!c.finished && guard++ < 3000) {
      const st: any = c.current();
      if (st.phase === 'arc') { c.resolveArc(st.arc.choices[0].id); continue; }
      if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; }
      if (st.phase === 'offer') { c.resolveOffer(st.offers[0].id); continue; }
      if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
      if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
      const sc = st.scenario, hand = st.hand;
      const topTag = (Object.entries(sc.demand).sort((a: any, x: any) => x[1] - a[1])[0]?.[0]) ?? 'teamwork';
      const sd = (c as any).seed >>> 0;
      const ps = sentences(scenarioStory(sc.kind, topTag, null, { seed: (sd + c.turn * 40503) >>> 0, age: c.age, chapter: c.chapter, seasonEventId: c.seasonEvent?.id ?? null, careerSeed: sd, turn: c.turn })); prompts.push(...ps); mine.push(...ps);
      const pick = hand.reduce((bb: any, x: any) => (fit(x, sc) > fit(bb, sc) ? x : bb), hand[0]);
      const os = sentences(actWithNarration(c, { type: 'play', cardId: pick.id }) ?? ''); outcomes.push(...os); mine.push(...os);
    }
    const repeat = mine.filter((x) => before.has(x)).length;
    seen[g].push(100 * repeat / Math.max(1, mine.length));
    if (g === GENS - 1 && b === 0) {
      const rp = prompts.filter((x) => before.has(x)).length, ro = outcomes.filter((x) => before.has(x)).length;
      console.log(`  [surface split, gen 5] prompts ${(100*rp/Math.max(1,prompts.length)).toFixed(0)}% reused of ${prompts.length} · outcomes ${(100*ro/Math.max(1,outcomes.length)).toFixed(0)}% reused of ${outcomes.length}`);
    }
    for (const x of mine) before.add(x);
  }
}
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
console.log(`=== Cross-generation reuse — ${BLOODLINES} bloodlines x ${GENS} generations ===`);
seen.forEach((a, g) => console.log(`  gen ${g + 1}: ${avg(a).toFixed(1)}% of sentences already read in an earlier generation`));
const worst = avg(seen[GENS - 1]);
console.log(`\n  ${worst <= 45 ? 'OK  ' : 'FLAG'} the fifth heir still reads mostly fresh (<= 45%)  (${worst.toFixed(1)}%)`);
if (worst > 45) process.exitCode = 1;
