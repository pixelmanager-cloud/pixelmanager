// RENOWN ONLY EVER GOES UP. The game says so in two places, and it is the load-bearing promise of the
// whole Houses feature:
//
//   shared/src/renown.ts   "IT ONLY EVER GOES UP ... the game should not be able to retroactively make
//                           him smaller."
//   client/src/main.ts     "Renown never falls — a quiet generation adds little, it never takes anything
//                           back."  (rendered on the Houses screen, where the player reads it)
//
// It fell. At the succession — the single most emotionally loaded moment in the game — and again at the
// heir's graduation. Two independent mechanisms, both in the same read path:
//
//   1. membersOf scored the house off `model.tokens`, and the played line is ONE token reused forever
//      (succeed reworks it in place, generation +1). rebornFields zeroes ach_league / ach_cup /
//      ach_seasons at the handover, so a six-title career's 600 points simply left the family.
//   2. rebornFields did NOT clear career_honours_json, so the heir was scored on his FATHER's peak, caps
//      and big nights until he graduated — at which point his own, smaller record replaced them and the
//      house shrank a second time.
//
// The second one is the mechanism behind F-017, which was logged with a different suspect (lineageRenown's
// quadratic). That suspicion is refuted here by construction: this probe reports the generation count at
// every sample, and the fall happens with it unchanged.
//
// WIDENED after this probe missed one. It drove only the DIRECT-heir path — succeed(), which reworks the
// same token — and never the other half of the succession screen, "or, from the brother you passed over".
// Taking a brother or cousin runs startCareer on HIS token, which flips `branch` from 'sibling' to 'played'
// one way and never back, and membersOf then stopped scoring him off his notional branch career: measured
// 1239 -> 1033 on a gen-1 brother, 420 of renown gone at gen 2, persisting across a save and reload. An
// invariant probe that exercises one of the two paths through the screen it guards is half a probe.
//
// This asserts the INVARIANT, not the mechanism — it drives the real facade and watches the number the
// player would be looking at, so it stays honest if someone rewrites how renown is derived.
//
// Run: `npx tsx tools/playtest/renown_monotone.ts [generations]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { getActiveModel } from '../../client/src/save.js';

const GENS = Math.max(2, Math.min(6, Number(process.argv[2] ?? 4)));
const SEASONS = 5;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

async function renown(): Promise<{ r: number; g: number }> {
  const d: any = await api.houses();
  return { r: Math.round(d.mine.renown), g: d.mine.generations ?? 0 };
}
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
/** Play the card career to graduation. Returns the renown reading either side of the graduation itself. */
async function playCareer(pid: string): Promise<{ before: number; after: number; g: number }> {
  let guard = 0, before = (await renown()).r;
  for (;;) {
    if (guard++ > 4000) throw new Error('career did not finish');
    const { state } = await api.getCareer(pid) as any;
    if (!state || state.finished) break;
    const s: any = state;
    const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
      : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
      : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
      : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
      : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
      : { type: 'play', cardId: bestCard(s) };
    // Sample immediately BEFORE the act that graduates him, so the pair brackets graduation alone and
    // nothing else — a sample taken a turn earlier would fold in the last card's own effects.
    before = (await renown()).r;
    const r: any = await api.careerAct(pid, act);
    if (r.graduated) break;
  }
  const a = await renown();
  return { before, after: a.r, g: a.g };
}

async function main() {
  console.log('=== Renown never falls: measured across successions and graduations ===');
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Ashcombe', 20260830, 'renown-monotone');
  const { candidates } = await api.scoutProspects(3) as any;
  const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;

  let samples = 0, drops = 0;
  for (let g = 0; g < GENS; g++) {
    await api.startCareer(pid, null);
    const grad = await playCareer(pid);
    samples++;
    console.log(`  ..   gen ${g} graduation: ${grad.before} -> ${grad.after} (generations ${grad.g})`);
    if (grad.after < grad.before) drops++;
    ok(grad.after >= grad.before, `gen ${g}: the heir's graduation does not shrink the house`);

    let titles = 0;
    for (let s = 0; s < SEASONS; s++) {
      // THE LINE MUST WIN THINGS, or the succession path is never exercised: the terms that vanish at a
      // handover are ach_league (100 each), ach_cup (40) and ach_seasons (8), so a trophyless dynasty
      // hands over nothing and the drop cannot appear. Three titles a generation.
      const pos = s < 2 ? 3 : 1;
      if (pos === 1) titles++;
      const pre = (await renown()).r;
      await api.spSeasonReward({ pos, size: 14, wins: 20 - pos, draws: 8, losses: 10 + pos,
        tier: Math.max(1, 4 - g), starId: pid, kind: 'league' });
      const post = (await renown()).r;
      samples++;
      if (post < pre) { drops++; ok(false, `gen ${g} season ${s}: renown fell ${pre} -> ${post}`); }
    }
    if (g === GENS - 1) break;
    const pre = await renown();
    await api.succeed(pid, { seasons: SEASONS, titles, cups: g, mentorship: 2, inheritance: 'name' });
    const post = await renown();
    samples++;
    console.log(`  ..   gen ${g} succession: ${pre.r} -> ${post.r} (generations ${pre.g} -> ${post.g}, ${titles} title(s) handed over)`);
    if (post.r < pre.r) drops++;
    ok(post.r >= pre.r, `gen ${g}: handing the name on does not shrink the house`);
  }

  // ── THE OTHER PATH THROUGH THE SUCCESSION SCREEN ────────────────────────────────────────────────────
  // The player can decline the direct heir and take a passed-over brother instead. That is a click on the
  // same screen, so it is bound by the same promise.
  const model: any = getActiveModel();
  const brothers = (model.tokens ?? []).filter((t: any) => (t.branch ?? 'played') === 'sibling' && t.state === 'prospect' && t.career_seed == null);
  console.log(`  ..   ${brothers.length} passed-over brother(s) available to take`);
  ok(brothers.length > 0, 'the dynasty produced a brother to take (otherwise this half measures nothing)');
  for (const b of brothers.slice(0, 3)) {
    const pre = await renown();
    await api.startCareer(b.id, null);
    const post = await renown();
    samples++;
    console.log(`  ..   taking ${b.name} (${b.id}): ${pre.r} -> ${post.r}`);
    if (post.r < pre.r) drops++;
    ok(post.r >= pre.r, `taking a passed-over brother onto the line does not shrink the house`);
  }

  // VACUITY GUARD. A run that never actually moved the number would satisfy "never fell" trivially.
  console.log(`  ..   ${samples} transition(s) sampled, ${drops} of them downward`);
  ok(samples >= GENS * 2, 'enough transitions were sampled to mean anything');
  const end = await renown();
  ok(end.r > 0, `the dynasty ended with renown on the board (${end.r}) rather than a flat zero`);

  console.log(fails ? `\n✗ renown fell at ${drops} transition(s) — the Houses screen promises it cannot`
                    : '\n✓ renown never fell across the whole dynasty');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
