// Does each stage's OBJECTIVE actually give the chapter direction? An objective cleared at a third of the
// way through leaves the player nothing to chase; one that can never be cleared is quietly impossible.
// Both read the same to a designer glancing at the table, which is why this measures instead. (PT-703)
import { Career, fit, seedFrom, AGE_BANDS } from '../../shared/src/career.js';
import { seasonObjectives } from '../../shared/src/tokens.js';
const N = Number(process.argv[2] ?? 200);
type S = { done: number; seen: number; idle: number[] };
const stats = new Map<string, S>();
const OBJ_IDS = ['strong', 'big', 'reads', 'flair', 'leadership', 'consistency'];
for (let i = 0; i < N; i++) {
  const c = new Career(seedFrom('obj', i), 'outfield', 'loyal');
  let guard = 0;
  const perBand: Array<{ id: string; target: number; hits: number[]; turns: number }> = [];
  while (!c.finished && guard++ < 3000) {
    const st: any = c.current();
    if (st.phase === 'arc') { c.resolveArc(st.arc.choices[0].id); continue; }
    if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; }
    if (st.phase === 'offer') { c.resolveOffer(st.offers[0].id); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
    // A REALISTIC player, not a perfect oracle. 'reads' asks for the best-fit card, so an always-optimal
    // policy scores 100% on it by definition however high the target goes — the metric could only ever
    // measure the probe. The game marks the right card with 🎯, so an engaged player is close to
    // optimal: best card 92% of the time, second best otherwise.
    const hand = st.hand, sc = st.scenario;
    const ranked = [...hand].sort((a: any, b: any) => fit(b, sc) - fit(a, sc));
    const r = ((i * 2654435761) ^ Math.imul(c.turn + 1, 40503)) >>> 0;
    const choice = (r % 100) < 92 || ranked.length < 2 ? ranked[0] : ranked[1];
    c.play(choice.id);
  }
  // replay the log band by band, applying the same tests the UI applies
  let acc = 0;
  AGE_BANDS.forEach((band, bi) => {
    const bandLog = (c as any).log.slice(acc, acc + band.turns); acc += band.turns;
    // the REAL table, imported — not a copy that drifts
    const deckTags = ((c as any).deck ?? []).flatMap((cd: any) => cd.tags ?? []);
    const defs = seasonObjectives(band, deckTags);
    for (const def of defs) {
      if (!stats.has(def.id)) stats.set(def.id, { done: 0, seen: 0, idle: [] });
      const s = stats.get(def.id)!; s.seen++;
      let hits = 0, at = -1;
      bandLog.forEach((ch: any, k: number) => { if (def.test(ch)) { hits++; if (hits === def.target && at < 0) at = k; } });
      if (at >= 0) { s.done++; s.idle.push(band.turns - at - 1); }
    }
  });
}
console.log(`=== Season objectives — ${N} careers x ${AGE_BANDS.length} stages ===`);
console.log('  objective      completed   idle turns left after completing (mean)');
const rows: Array<[string, number, number]> = [];
for (const id of OBJ_IDS) {
  const s = stats.get(id); if (!s) continue;
  const rate = Math.round(100 * s.done / Math.max(1, s.seen));
  const idle = s.idle.length ? s.idle.reduce((a, b) => a + b, 0) / s.idle.length : 0;
  rows.push([id, rate, +idle.toFixed(1)]);
  console.log(`  ${id.padEnd(14)} ${String(rate).padStart(4)}%      ${idle.toFixed(1)}`);
}
console.log('\n=== verdict ===');
let fails = 0;
// The finding was "either already won or quietly impossible", which is TWO failures, and my first version
// of this check conflated them by ANDing a rate band with an idle ceiling. That flagged `big` at a 58%
// completion rate — an objective you fail 42% of the time is a real target no matter when it lands. Idle
// turns only matter for an objective that almost always completes; on its own it measures nothing.
for (const [id, rate, idle] of rows) {
  const unreachable = rate < 35;
  const gimme = rate > 92 && idle > 7;      // always cleared AND cleared early, with nothing left to chase
  const ok = !unreachable && !gimme;
  const why = unreachable ? 'unreachable' : gimme ? 'a gimme — always cleared, then idle' : '';
  console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${id}: a real target (not <35% done, not >92% with idle turns)  (${rate}%, ${idle} idle)${why ? ' — ' + why : ''}`);
  if (!ok) fails++;
}
console.log(fails ? `\n⚠ ${fails} objective(s) are either a gimme or unreachable` : `\n✓ objectives give each stage real direction`);
