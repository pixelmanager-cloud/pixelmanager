// A SCOUTING TRIP MUST COME HOME IN THE SEASON IT WAS SENT OUT IN.
//
// `travelMatchdays()` prices a trip at 1-9 MATCHDAYS, the Scouting screen renders "back in N more
// matches", and the facade stamps `ready_at = matchesPlayed() + travelMatchdays(dest)`. But
// `matchesPlayed()` reads the LIFETIME W/D/L off the durable profile, and that has exactly one writer:
// `spSeasonReward`, which `nextSeason()` calls ONCE a season with the whole campaign batched. Playing a
// match does not touch it — the result goes into MgrState.results in localStorage — so the counter every
// trip is measured against stood perfectly still for the entire season the trip was dispatched in. A
// 1-matchday trip to the Local Parks read "back in 1 more match" from dispatch to the rollover, and then
// every outstanding trip landed together. The risk/reward ladder the destinations are built around was
// flat: all six cost the same thing, one season.
//
// Half A drives the real facade and watches the number the player is shown, so it stays honest if the
// counter is re-derived somewhere else. Half B pins the season boundary, because the obvious fix has an
// obvious way to go wrong. Half C checks the WIRING: the facade cannot read localStorage, so the client
// hands it the count, and a call site that quietly stopped would leave half A green and the game broken.
//
// Run: `npx tsx tools/playtest/scout_travel_ticks.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { destinationById, travelMatchdays } from '../../shared/src/missions.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** How many matchdays `signMission` still refuses over — null if it is not refusing on travel at all.
 *  Read off the guard rather than the list view because the list is filtered to the CURRENT season, and
 *  half B deliberately crosses a rollover. */
async function travelRefusal(id: string, md: number): Promise<number | null> {
  try { await api.signMission(id, md); return null; }
  catch (e: any) {
    const m = /travelling — (\d+) more/.exec(String(e?.body?.error ?? e?.message ?? ''));
    return m ? Number(m[1]) : null;
  }
}

/** Paren-matched argument lists for `fn(...)`, lifted from sale_quote_matches.ts — a `[^)]*` scan stops
 *  dead at the `)` of a nested `this.loadMgr()` and would report every call site as passing nothing. */
function callArgs(text: string, fn: string): string[] {
  const out: string[] = [];
  for (let i = text.indexOf(fn + '('); i !== -1; i = text.indexOf(fn + '(', i + 1)) {
    let depth = 0;
    for (let j = i + fn.length; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') { depth--; if (depth === 0) { out.push(text.slice(i + fn.length + 1, j).replace(/\s+/g, ' ')); break; } }
    }
  }
  return out;
}

async function main() {
  console.log('=== A scouting trip is measured in matchdays that actually pass ===');

  // ── A. the countdown moves as the season is played ──────────────────────────────────────────────────
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Travelport', 20260904, 'scout-travel-ticks');
  const dest = destinationById('national')!;
  const travel = travelMatchdays(dest);
  const r: any = await api.dispatchScout(dest.id, 0);
  const id = r.mission.id;
  const seq: Array<{ md: number; left: number; revealed: boolean }> = [];
  for (let md = 0; md <= travel + 1; md++) {
    const d: any = await api.missions(md);
    const t = d.missions.find((x: any) => x.id === id);
    if (!t) { ok(false, `the dispatched trip is still listed after ${md} matchday(s)`); break; }
    seq.push({ md, left: t.matchdaysLeft, revealed: t.revealed });
  }
  console.log(`  ..   ${dest.name} costs ${travel} matchdays — ${seq.map((s) => `md${s.md}:${s.left}${s.revealed ? '*' : ''}`).join(' ')}  (* = home)`);
  // VACUITY GUARDS. Every assertion below is about a sequence: an empty one would satisfy them for free,
  // a one-matchday destination would make "counts down" indistinguishable from "lands immediately", and a
  // trip revealed at dispatch would satisfy "comes home" without anything having moved.
  ok(seq.length === travel + 2, `all ${travel + 2} samples were taken (this is not measuring an empty set)`);
  ok(travel > 1, `${dest.name} really does cost more than one matchday (${travel})`);
  ok(seq.length > 0 && !seq[0].revealed, 'a trip is sealed at dispatch, not already home');
  ok(seq.length > 0 && seq[0].left === travel, `it is dispatched with its full ${travel} matchdays to run (got ${seq[0]?.left})`);
  for (const s of seq.slice(1)) {
    const want = Math.max(0, travel - s.md);
    ok(s.left === want, `after ${s.md} matchday(s) played it has ${want} to run (got ${s.left})`);
  }
  ok(!!seq[travel - 1] && !seq[travel - 1].revealed, 'it is NOT home a matchday early');
  ok(!!seq[travel] && seq[travel].revealed, `it IS home after ${travel} matchdays of the SAME season — no rollover needed`);

  // AND THE STAMP HAS TO BE ON THE SAME CLOCK AS THE COMPARISON. The trip above left on matchday 0, the one
  // instant where the lifetime total and the season count agree — so it cannot tell the two apart: leave the
  // `ready_at` stamp on the frozen lifetime counter and every assertion above still passes. Verified by
  // reverting that one hunk: the probe stayed green while a National Camp trip dispatched on matchday 2 came
  // home a matchday early with `left` already down to 1. A trip dispatched mid-season is the only shape that
  // separates them, and it is also the normal case — nobody scouts only on the first whistle of a season.
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Midport', 20260904, 'scout-travel-midseason');
  const SENT_AT = 2;
  const mid: any = await api.dispatchScout(dest.id, SENT_AT);
  const midId = mid.mission.id;
  const atDispatch: any = await api.missions(SENT_AT);
  const midT = atDispatch.missions.find((x: any) => x.id === midId);
  const midLeft = midT ? midT.matchdaysLeft : -1;
  const landing: any = await api.missions(SENT_AT + travel - 1);
  const early = landing.missions.find((x: any) => x.id === midId);
  console.log(`  ..   sent on matchday ${SENT_AT}: left=${midLeft} at dispatch, revealed=${early ? early.revealed : 'gone'} one matchday early`);
  ok(midLeft === travel, `a trip dispatched mid-season is still charged its full travel (left ${midLeft}, should be ${travel})`);
  ok(!!early && early.revealed === false, 'and it is not home before it has been paid for');

  // ── B. a trip in flight keeps its due date across a season rollover ──────────────────────────────────
  // The two halves of the count hand over to each other: the lifetime total goes up by exactly the
  // season's result count at the instant that count is reset to zero. A fix that double-counts, or that
  // drops one half, makes a trip's remaining travel jump at the rollover — the same defect in a costume,
  // so it is measured rather than reasoned about.
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Crossover', 20260904, 'scout-travel-rollover');
  const far = destinationById('wonderkid')!;
  const SENT_ON = 2, PLAYED = 6;              // dispatched 2 matchdays in; 6 played before the season closed
  const r2: any = await api.dispatchScout(far.id, SENT_ON);
  const before = await travelRefusal(r2.mission.id, PLAYED);
  await api.spSeasonReward({ pos: 5, size: 10, wins: 2, draws: 2, losses: 2, tier: 1, kind: 'league' });
  const after = await travelRefusal(r2.mission.id, 0);
  console.log(`  ..   ${far.name} (${travelMatchdays(far)} matchdays) sent on matchday ${SENT_ON}, ${PLAYED} played — ${before} left before the rollover, ${after} after`);
  ok(before !== null && after !== null, 'the trip was still travelling on both sides of the rollover (otherwise this measures nothing)');
  ok(before === after, `its remaining travel is untouched by the rollover (${before} → ${after})`);

  // ── C. the client has to hand the facade the count ───────────────────────────────────────────────────
  // matchesPlayed() reads the durable profile; the matchdays played SO FAR THIS SEASON live in MgrState in
  // localStorage, which the facade cannot see. Half A can only be true in the running game if every call
  // site passes them.
  const src = readFileSync('client/src/main.ts', 'utf8');
  for (const fn of ['api.missions', 'api.dispatchScout', 'api.signMission']) {
    const calls = callArgs(src, fn);
    ok(calls.length > 0, `${fn}() is called from the client at all (nothing to check otherwise)`);
    for (const c of calls) ok(/results\.length/.test(c), `\`${fn}(${c})\` passes the matchdays played this season`);
  }

  console.log(fails ? `\n✗ ${fails} problem(s): a scouting trip is priced in matchdays it cannot spend`
                    : '\n✓ a trip counts down as matches are played, and the rollover does not move its due date');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
