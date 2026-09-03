// THE LAST CHAPTER GETS A SUMMER TOO.
//
// `rollFocus` fires at a band boundary for the chapter that just ENDED, and the last element of BAND_ENDS is
// TOTAL_TURNS — but the finished-check sat ABOVE the boundary check, so turn 120 ended the career before its
// own boundary could raise one. `Establishing` (turns 104-120) was played and no summer ever followed it.
//
// That made the whole Establishing focus bank unreachable — eight authored options no player had ever seen:
// Sponsor Duties (the only main summer focus that raises the sponsors meter, a meter on screen for the final
// 34 turns and worth ±200/−120 coins at the turn-104 consequence check), Icon of the Terraces, Settle Down,
// Think About Your Legacy, Coach a Grassroots Session, two tag focuses, and the goalkeeper's last keeping
// focus, Become the Last Word.
//
// Two hypotheses were tested and refuted before this fix, recorded in decisions-for-ck §84 so nobody re-runs
// them: merging the bank into First Team collides two ids (chooseFocus resolves by first match, so a tap
// would silently apply the WRONG option), and the banks are not authored for the chapter being entered.
//
// Driven through the FACADE, not the Career class directly: a career is interrupted by story arcs, offers,
// coaches and drafts, and reproducing that state machine in a probe means reproducing its bugs too. This is
// the same loop the UI runs.
//
// Run: `npx tsx tools/playtest/final_summer.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { TOTAL_TURNS, rollFocus } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function bestCard(s: any): string {
  const dem = s.scenario?.demand ?? {};
  let best = s.hand[0], bestScore = -Infinity;
  for (const c of s.hand) {
    let score = 0;
    for (const [tag, w] of Object.entries(dem)) score += (Number((c.tags ?? {})[tag]) || 0) * Number(w);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best.id;
}

async function main() {
  console.log('=== The last chapter gets a summer, and the career still ends ===');

  const bank = rollFocus('Establishing');
  const bankIds = new Set(bank.map((o: any) => o.id));
  console.log(`  ..   rollFocus('Establishing') offers ${bank.length}: ${[...bankIds].join(', ')}`);
  ok(bank.length > 0, 'the bank this fix exists for is still authored (not measuring an empty set)');

  const N = 4;
  let finalSummers = 0, sawBankOption = 0, finished = 0;
  for (let run = 0; run < N; run++) {
    __setBackendForTests(createInMemoryBackend());
    await api.register('fs', 'x', 'Ashcombe', 20260830 + run, `fs-${run}`);
    const { candidates } = await api.scoutProspects(3) as any;
    const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;
    await api.startCareer(pid, null);

    let guard = 0, lastFocusTurn = -1, maxTurn = 0;
    for (;;) {
      if (guard++ > 4000) break;
      const { state } = await api.getCareer(pid) as any;
      if (!state || state.finished) break;
      const s: any = state;
      maxTurn = Math.max(maxTurn, s.turn ?? 0);
      let act: any;
      if (s.phase === 'arc') act = { type: 'arc', cardId: s.arc.choices[0].id };
      else if (s.phase === 'focus') {
        if ((s.turn ?? 0) >= TOTAL_TURNS) {
          lastFocusTurn = s.turn;
          if (s.focus.some((o: any) => bankIds.has(o.id))) sawBankOption++;
        }
        act = { type: 'focus', cardId: s.focus[0].id };
      }
      else if (s.phase === 'offer') act = { type: 'offer', cardId: s.offers[0].id };
      else if (s.phase === 'coach') act = { type: 'coach', cardId: s.coaches[0].id };
      else if (s.phase === 'draft') act = { type: 'draft', cardId: s.options[0].id };
      else act = { type: 'play', cardId: bestCard(s) };
      const r: any = await api.careerAct(pid, act);
      if (r.graduated) break;
    }
    if (lastFocusTurn >= TOTAL_TURNS) finalSummers++;
    const { state: end } = await api.getCareer(pid).catch(() => ({ state: null })) as any;
    if (!end || end.finished) finished++;
    if (maxTurn > TOTAL_TURNS) ok(false, `run ${run}: reached turn ${maxTurn} — a moment past the end was dealt`);
  }

  console.log(`  ..   ${finalSummers}/${N} careers raised a summer at turn ${TOTAL_TURNS}`);
  console.log(`  ..   ${sawBankOption}/${N} of those offered an Establishing option`);
  console.log(`  ..   ${finished}/${N} careers still reached the end`);
  ok(finalSummers === N, 'every career gets its final summer');
  ok(sawBankOption > 0, 'the Establishing bank is reachable — the point of the change');
  ok(finished === N, 'and the career still ends rather than hanging on a summer with no chapter after it');

  console.log(fails ? `\n✗ ${fails} — the last chapter's summer is broken` : '\n✓ the last chapter has a summer and the career closes after it');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
