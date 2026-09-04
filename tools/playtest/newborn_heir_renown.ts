// A NEWBORN HEIR IS NOT A PROFESSIONAL FOOTBALLER, AND THE HOUSES TABLE MUST NOT PRICE HIM AS ONE.
//
// `succeed()` stamps a branch seed onto the PLAYED line's own token — "the played line needs a branch seed
// of its own: if the player takes a cousin at some later succession, THIS is the branch that was passed
// over". That is a seed kept for FUTURE derivation, not the record of a career the game played offscreen.
// `membersOf` scored it anyway, so the house was handed a whole fabricated professional career at every
// birth: on a save that had never offered a single brother, 93 renown before the succession and 514 after,
// with 298 of it credited to "the sons you passed over" — the sentence the Houses panel prints in those
// exact words — and the greatest man in the family's history a ten-year-old with 29 international caps.
// Worse, the shadow row and the real row are compared every time the panel is drawn, so a man whose actual
// career landed under his shadow one was scored on the shadow for the rest of the save. `bloodline()`
// guards this same case for the Family Record and says why; the renown scorer did not.
//
// This drives the real facade to a succession that offers NO brother and NO cousin — so nobody in the whole
// dynasty has ever been passed over and the branch credit can only be 0 — then plays the heir's entire
// career and reads the panel again.
//
// MUTATION TEST — each must turn a named line below red. Drop membersOf's `wasTheLine` guard, i.e. build
// the branch row for anyone holding a seed: FOUR lines go red (both branch-credit lines, the name-rests-on
// line and the his-own-career-is-worth-something line — measured on the pristine tree). Widen the guard the
// other way so a MINTED brother is refused his floor too: the last line goes red, which is the taken-brother
// half of the same promise that renown_monotone.ts holds end to end. Three lines here assert nothing about
// renown at all and exist only so the rest cannot pass over an empty list — that a sole-heir world was
// found inside SLOTS, that the heir really played a career, and that the closing succession really produced
// a brother; set SLOTS to 0 and the first of those goes red instead of the run reporting all-green.
//
// Run: `npx tsx tools/playtest/newborn_heir_renown.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel } from '../../client/src/save.js';

const SLOTS = 16;              // heirCount hands back a lone son ~20% of the time, so 16 worlds is ample
const SEASONS = 4;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Play a card career through to graduation, answering whatever the scenario asks. */
async function playCareer(pid: string): Promise<void> {
  for (let guard = 0; guard < 4000; guard++) {
    const { state } = await api.getCareer(pid) as any;
    if (!state || state.finished) return;
    const s: any = state;
    const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
      : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
      : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
      : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
      : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
      : { type: 'play', cardId: s.hand[0].id };
    if ((await api.careerAct(pid, act) as any).graduated) return;
  }
  throw new Error(`career ${pid} never graduated`);
}
/** The seasons a graduated star plays — where league finishes, apps and seasons are banked. */
async function playSeasons(pid: string, tier: number): Promise<void> {
  for (let s = 0; s < SEASONS; s++) {
    await api.spSeasonReward({ pos: 3, size: 14, wins: 17, draws: 8, losses: 13, tier, starId: pid, kind: 'league' });
    await api.advanceSquadSeason({ trainingLvl: 2, wonSomething: false, goodSeason: true });
  }
}

async function main() {
  console.log('=== A boy born this morning has not earned the family name ===');

  // THE SOLE-HEIR SUCCESSION IS THE CLEAN MEASUREMENT. One son and no cousins means there is not a single
  // passed-over man anywhere in the save, so the branch half of the panel must read zero on its own terms.
  let sole: { slot: string; heir: string; renownAtBirth: number; pid: string } | null = null;
  for (let s = 0; s < SLOTS && !sole; s++) {
    __setBackendForTests(createInMemoryBackend());
    const slot = `probe-newborn-${s}`;
    await api.register('dynasty', 'x', 'Kestrel', 20260902, slot);
    const board: any = await api.scoutProspects(3);
    const pid: string = (await api.signProspect(board.candidates[0].seed) as any).prospect.id;
    await api.startCareer(pid, null);
    await playCareer(pid);
    await playSeasons(pid, 4);
    const r: any = await api.succeed(pid, { seasons: SEASONS, titles: 0, cups: 0, mentorship: 2, inheritance: 'name' });
    if (r.siblings.length) continue;                  // this world gave him brothers; the next one may not
    const h: any = await api.houses();
    sole = { slot, heir: r.prospect.name, renownAtBirth: h.mine.renown, pid: r.prospect.id };
    console.log(`  ..   ${slot}: one son, no cousins — ${sole.heir} is born, house worth ${h.mine.renown}, `
      + `${h.mine.fromBranches} of it credited to sons passed over, the name resting on ${h.mine.greatest?.name ?? '—'}`);
    ok(h.mine.fromBranches === 0,
      `none of the name was earned by sons the player passed over — there are none (got ${h.mine.fromBranches})`);
    ok(h.mine.greatest?.name !== sole.heir,
      `the name does not rest on a boy who has never kicked a ball (it rests on ${h.mine.greatest?.name ?? '—'})`);
  }
  ok(sole !== null, `a sole-heir succession was reached inside ${SLOTS} worlds — the checks above measured a real save`);
  if (!sole) { console.log('\n✗ nothing measured'); process.exitCode = 1; return; }

  // THE OTHER HALF: a fabricated career does not merely appear at the birth, it OUTLIVES the real one.
  const tokens = () => getActiveModel().tokens as any[];
  const peakBefore = tokens().find((t) => t.id === sole!.pid)?.peak_overall ?? 0;
  await api.startCareer(sole.pid, null);
  await playCareer(sole.pid);
  await playSeasons(sole.pid, 3);
  const peakAfter = tokens().find((t) => t.id === sole!.pid)?.peak_overall ?? 0;
  const h: any = await api.houses();
  console.log(`  ..   ${sole.heir} played his career out (peak ${peakBefore} -> ${peakAfter}); house ${sole.renownAtBirth} -> ${h.mine.renown}, branch credit ${h.mine.fromBranches}`);
  ok(peakAfter > peakBefore, 'the heir really did play a career — the two checks below are not measuring a boy who never started');
  ok(h.mine.renown > sole.renownAtBirth,
    `his own career is worth something to the house (${sole.renownAtBirth} -> ${h.mine.renown})`);
  ok(h.mine.fromBranches === 0,
    `and still none of the name was earned by sons passed over (got ${h.mine.fromBranches})`);

  // AND THE FLOOR THE REAL BRANCHES DO GET MUST SURVIVE. A guard that simply refused every derived career
  // would pass everything above while quietly re-breaking the thing membersOf's own comment is about — the
  // brother you passed over is not worth nothing — so run one more succession and check its sons are paid
  // for — and the first check below refuses to let "it offered brothers" be assumed rather than measured.
  const r: any = await api.succeed(sole.pid, { seasons: SEASONS, titles: 0, cups: 0, mentorship: 2, inheritance: 'name' });
  const hb: any = await api.houses();
  console.log(`  ..   next succession offered ${r.siblings.length} passed-over son(s); branch credit now ${hb.mine.fromBranches}`);
  ok(r.siblings.length > 0, 'the next succession did offer a brother — the check below is not measuring an empty list');
  ok(hb.mine.fromBranches > 0,
    'a brother who really was passed over is still worth something — the guard cut the fabrication, not the feature');

  console.log(fails ? `\n✗ ${fails} problem(s) — the house is being paid for careers nobody ever had` : '\n✓ the house is scored on the men who actually played');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
