// THE HEIR'S FIRST NAME MUST BELONG TO THE SAVE, NOT TO THE GAME.
//
// `rebornFields` seeded the heir's name off the token id alone — and the played line's token id is the
// constant `nft:1` in every save ever created (`signProspect` mints `nft:${countTokens()+1}` into a
// `tokens: []` fresh save, and `succeed()` reuses that id for every generation). So generation 1's heir was
// "Leo <surname>" in 100% of saves, and the default line ran Leo → Milo → Enzo → Ravi → Jude → Yuki in all
// of them: the seed advances by exactly 16777619 per generation and 16777619 % 16 === 3, a fixed stride
// through FIRST. This is the same defect `careerSeedFor` documents and fixes for `career_seed` ("token ids
// are deterministic counters (`nft:1`, `nft:2`), not UUIDs"); the sibling roll never got the treatment.
//
// It has to be measured THROUGH THE FACADE. Calling `rebornFields(t, world)` directly would pass the moment
// the parameter exists, while `succeed()` kept calling it with one argument and every save kept its Leo —
// the wiring is the whole failure, not the hash. So this drives real saves end to end: register a slot,
// scout, sign, play the founder's career out, and read the name the succession actually writes.
//
// Every save uses the SAME family name on purpose, so the surname is held constant and the only thing that
// can vary is the first name — which is the thing under test. The FOUNDER's own first name is already
// save-mixed (`api.ts` mints him from `${slot}:${id}:genesis`), so the printed lines carry the diagnosis on
// their face: six different founders, one heir name.
//
// NOT AN EMPTY CHECK: the distinct-name count is asserted against a heir list whose length is asserted
// first, so a run that produced no successions fails loudly instead of reporting a vacuous pass. To
// mutation-test it, drop the `world` argument at the `rebornFields(decorated, ...)` call in
// `client/src/api.ts` and this goes red with 1 distinct name.
//
// Run: `npx tsx tools/playtest/heir_name_world.ts [saves]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';

const N = Math.max(2, Math.min(12, Number(process.argv[2] ?? 6)));
const FAMILY = 'Ashcombe';   // one surname across every save, so only the FIRST name can move
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
      : { type: 'play', cardId: bestCard(s) };
    if ((await api.careerAct(pid, act) as any).graduated) return;
  }
  throw new Error('career did not finish');
}

/** One whole save, from a blank slot to the moment its first heir is named. */
async function firstHeirOf(slotId: string): Promise<{ founder: string; heir: string }> {
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', FAMILY, 20260902, slotId);
  const { candidates } = await api.scoutProspects(3) as any;
  const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;
  const founder = String((await localStore.getToken(pid))?.name ?? '');
  await api.startCareer(pid, null);
  await playCareer(pid);
  for (let s = 0; s < 5; s++) {
    await api.spSeasonReward({ pos: s < 2 ? 3 : 1, size: 14, wins: 18, draws: 8, losses: 12, tier: 2, starId: pid, kind: 'league' });
  }
  const r: any = await api.succeed(pid, { seasons: 5, titles: 3, cups: 1, mentorship: 2, inheritance: 'name' });
  return { founder, heir: String(r.prospect.name ?? '') };
}

async function main() {
  console.log('=== Generation 1 is not called Leo in every save ===');
  const first: string[] = [];
  for (let i = 0; i < N; i++) {
    const { founder, heir } = await firstHeirOf(`slot-w1210-${i}`);
    first.push(heir.trim().split(/\s+/)[0] ?? '');
    console.log(`  ..   slot-w1210-${i}: founder ${founder} → heir ${heir}`);
  }
  const distinct = new Set(first);
  console.log(`  ..   ${distinct.size} distinct first name(s) across ${first.length} saves: ${[...distinct].join(', ')}`);

  // Anti-vacuity: the count below means nothing unless every save actually reached a succession.
  ok(first.length === N && first.every((n) => n.length > 0), `all ${N} saves produced a named heir (this is not an empty check)`);
  // 16 names in the pool; N independent saves landing on ONE name is the constant-seed signature.
  ok(distinct.size >= 3, `the heir's first name varies by save (${distinct.size} distinct of ${N}, want ≥3)`);

  console.log(fails ? `\n✗ ${fails} failure(s) — every dynasty is naming its heirs off the same constant seed` : '\n✓ each save names its own heir');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
