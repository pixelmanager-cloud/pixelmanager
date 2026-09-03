// EVERY MILESTONE BANK MUST BE ABLE TO FIRE, AND THE ONE THAT CANNOT MUST STAY DEAD ON PURPOSE.
//
// narrate.ts authors five MILESTONE flourish banks. careerMilestone could originally return only two of
// them, so `first_big_win`, `first_start` and `first_goal` were written and never once selected. Two are
// now wired. The fifth is deliberately unreachable, and this probe asserts BOTH halves — because the
// interesting failure here is not a bank going dark, it is `first_goal` being wired by someone who reads
// the missing case as an oversight.
//
// WHY first_goal STAYS DEAD. The tag vocabulary has no shooting or finishing tag, and ACTION_NOUN keys off
// those same tags — so the sentence a goal flourish sits on is structurally guaranteed to describe a pass,
// a challenge or a run. Measured over 200 careers, the turn that would be branded his first goal carries
// `teamwork` 98 times: "⚽ His first-ever goal... he made the space for the option out wide because he saw
// the better option and it was not his." A goal announced over a description of not shooting. On the
// goalkeeper track 111 of 120 such turns carry `keeping` — a keeper's first goal is a save. Making it
// honest needs a ninth tag, which moves demand -> fit -> success -> the phase sequence. The real beat
// already exists as the `tri-first-senior-goal` story arc. See decisions-for-ck §86.
//
// Run: `npx tsx tools/playtest/milestone_reach.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { MILESTONE } from '../../shared/src/narrate.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const WIRED = ['debut', 'cup_final', 'first_big_win', 'first_start'];
const DELIBERATELY_DEAD = ['first_goal'];

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
  console.log('=== Every milestone bank fires, except the one that must not ===');

  const banks = MILESTONE as Record<string, string[]>;
  console.log(`  ..   ${Object.keys(banks).length} bank(s): ${Object.keys(banks).join(', ')}`);
  ok(Object.keys(banks).length > 0, 'the banks are still authored (not measuring an empty set)');
  for (const k of [...WIRED, ...DELIBERATELY_DEAD]) ok(!!banks[k]?.length, `the '${k}' bank still has lines`);

  // CONTAINS, not starts-with. narratePlay assembles `${tension}${milestone}${lead}...`, and `tension` is
  // non-empty exactly when stakes === 3 — which is the ONLY case `cup_final` fires. So a cup-final narration
  // never begins with its own flourish. The first version of this probe tested startsWith, found no
  // cup_final in ten full careers, and would have reported a live bank as unreachable. The flourishes are
  // distinctive enough that a substring match is not ambiguous.
  const prefixOf = (k: string) => banks[k].map((l) => l.trim());
  const seen = new Set<string>();
  // cup_final needs a stakes-3 moment, which only the late bands can raise and which a short sample can
  // miss entirely — the first run of this probe reported it unreachable on four careers when it was fine.
  const N = 10;
  for (let run = 0; run < N; run++) {
    __setBackendForTests(createInMemoryBackend());
    await api.register('ms', 'x', 'Ashcombe', 20260830 + run, `ms-${run}`);
    const { candidates } = await api.scoutProspects(3) as any;
    const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;
    await api.startCareer(pid, null);
    for (let guard = 0; guard < 4000; guard++) {
      const { state } = await api.getCareer(pid) as any;
      if (!state || state.finished) break;
      const s: any = state;
      const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
        : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
        : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
        : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
        : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
        : { type: 'play', cardId: bestCard(s) };
      const r: any = await api.careerAct(pid, act);
      const text: string = r?.narration ?? r?.choice?.narration ?? '';
      if (text) for (const k of Object.keys(banks)) if (prefixOf(k).some((p) => text.includes(p))) seen.add(k);
      if (r.graduated) break;
    }
  }
  console.log(`  ..   milestones observed across ${N} careers: ${[...seen].sort().join(', ') || '(none)'}`);

  for (const k of WIRED) ok(seen.has(k), `'${k}' can actually reach the player`);
  for (const k of DELIBERATELY_DEAD) {
    ok(!seen.has(k),
       `'${k}' is still unreachable ON PURPOSE — it would announce a goal over a description of a pass (§86)`);
  }

  console.log(fails ? `\n✗ ${fails} — a milestone bank is unreachable, or a deliberately dead one fired` : '\n✓ four banks reach the player and the fifth stays dead by design');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
