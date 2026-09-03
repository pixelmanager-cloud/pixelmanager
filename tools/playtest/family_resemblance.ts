// THE SON YOU PLAY MUST LOOK LIKE HIS BROTHERS.
//
// mintHeirs models a family on purpose: every attribute gets a family MEAN shared by all the brothers, plus
// a per-child deviation that is deliberately tiny on the family attribute and wide on the others — "the
// family attribute regresses far LESS from the father than the others do, that is what makes it the
// family's, rather than merely a trait the brothers happen to share" (shared/src/bloodline.ts).
//
// It mints nHeirs of them and the succession's sibling loop consumes heirs[1..n-1], because heirs[0] IS the
// played heir. But his genes used to come from rebornFields' own plain inheritGenes roll, so every brother
// carried the family attribute and the boy the player actually embodies did not — the model missing at
// exactly its centre, and invisible because he still had perfectly reasonable-looking genes.
//
// ── WHY THIS PROBE WAS REWRITTEN ─────────────────────────────────────────────────────────────────────
// The first version GUESSED which attribute was the family's, by picking the one the brothers happened to
// agree on most, because reproducing succeed()'s seed derivation looked risky. Measured over 400 families,
// that guess is wrong 23.5% of the time. The probe then compared 4 family samples against 8 others — so a
// single misidentified family, which contributes a large distance to the wrong column, could flip the
// verdict on its own.
//
// It duly did. An unrelated change to which OPERANDS the succession mints from turned the reading from
// "family 0.44 vs other 1.81" into "family 1.56 vs other 1.13" and the probe went red, while the mechanism
// it guards was measurably untouched: over 400 families under both sets of operands, family 0.313/0.320 vs
// other 1.292/1.298. The probe had been passing on luck, and its failure was luck running out.
//
// There is no need to guess: `succeed()` RETURNS `familyTrait` — the real one, off the real parentSeed. So
// this now measures the true column, and the sample size stops being load-bearing.
//
// Run: `npx tsx tools/playtest/family_resemblance.ts [successions]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';

const N = Math.max(2, Math.min(12, Number(process.argv[2] ?? 5)));
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const mid = (g: any) => ((g?.floor ?? 0) + (g?.ceiling ?? 0)) / 2;
const ATTRS = ['pace', 'strength', 'stamina'] as const;

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

async function main() {
  console.log('=== The played heir carries the family attribute ===');
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Ashcombe', 20260902, 'fam');
  const { candidates } = await api.scoutProspects(3) as any;
  const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;

  const famGaps: number[] = [], otherGaps: number[] = [];
  let withBrothers = 0, successions = 0;
  for (let g = 0; g < N; g++) {
    await api.startCareer(pid, null);
    await playCareer(pid);
    // Five seasons so the father has a record; heirCount legitimately returns 1 at the earliest
    // successions, and a dynasty that never produces brothers measures nothing at all.
    for (let s = 0; s < 5; s++) {
      await api.spSeasonReward({ pos: s < 2 ? 3 : 1, size: 14, wins: 18, draws: 8, losses: 12, tier: 2, starId: pid, kind: 'league' });
    }
    const r: any = await api.succeed(pid, { seasons: 5, titles: 3, cups: 1, mentorship: 2, inheritance: 'name' });
    successions++;
    // THE TRUE COLUMN, returned by the succession itself rather than inferred from the brothers.
    const fam = String(r.familyTrait ?? '');
    const played = await localStore.getToken(pid);
    const gen = (played as any)?.generation ?? 0;
    const brothers: any[] = [];
    for (let i = 1; i <= 4; i++) {
      const b = await localStore.getToken(`${pid}:b${gen}.${i}`);
      if (b) brothers.push(b);
    }
    if (!played || !fam || brothers.length < 2) continue;
    withBrothers++;
    const pg = JSON.parse((played as any).genes_json);
    const bg = brothers.map((b: any) => JSON.parse(b.genes_json));
    for (const a of ATTRS) {
      const m = bg.reduce((n: number, x: any) => n + mid(x[a]), 0) / bg.length;
      const d = Math.abs(mid(pg[a]) - m);
      (a === fam ? famGaps : otherGaps).push(d);
    }
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  console.log(`  ..   ${withBrothers}/${successions} successions produced two or more brothers to compare against`);
  console.log(`  ..   ${famGaps.length} family-attribute samples, ${otherGaps.length} other-attribute samples`);
  console.log(`  ..   played heir's distance from his brothers' mean: family ${avg(famGaps).toFixed(2)}, other ${avg(otherGaps).toFixed(2)}`);
  ok(famGaps.length >= 3, 'enough successions produced brothers to measure (this is not an empty check)');
  ok(avg(famGaps) < avg(otherGaps),
     `he resembles his brothers MORE on the family attribute than on the others (${avg(famGaps).toFixed(2)} < ${avg(otherGaps).toFixed(2)})`);

  console.log(fails ? `\n✗ ${fails} failure(s) — the played heir is not part of his own family` : '\n✓ the boy you play is one of the brothers');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
