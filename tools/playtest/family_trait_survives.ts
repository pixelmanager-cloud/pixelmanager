// THE FAMILY ATTRIBUTE HAS TO OUTLIVE THE MAN.
//
// One line on the heir card is the whole claim that this is a bloodline rather than a queue of strangers:
// `🧬 the family ${trait}` (showHeirChoice, client/src/main.ts). mintHeirs backs it with real mechanics —
// the named attribute regresses from the father at KEEP_FAMILY 0.86 while everything else regresses at
// 0.50 — so it is the one attribute that COMPOUNDS down a dynasty, and bloodline.ts states the contract in
// as many words: "Fixed per bloodline, not per child — that is the point."
//
// It was not fixed per bloodline. `succeed()` keyed `familyTrait` on the retiring star's own career seed,
// and `rebornFields` nulls `career_seed` at every succession so a fresh one is minted per generation. The
// family's defining attribute was therefore re-drawn at every handover; `familyTrait` is uniform over
// arbitrary seeds, so the only reason it looked stable was hash correlation on the generation suffix, not
// a designed property. Measured here on the tree that had the bug: five of sixteen dynasties changed
// attribute inside five successions, and KEEP_FAMILY then compounded a DIFFERENT attribute either side of
// the flip.
//
// This reads the trait off `succeed()`'s own return value while driving the REAL facade. It does not
// re-derive the seed maths: guessing at succession internals is the exact mistake family_resemblance.ts
// next door had to be rewritten to stop making.
//
// MUTATION TEST — each of these must turn a named line below red:
//   * key the trait back on the per-generation seed (the original bug) → check 2
//   * make `familyTrait` return a constant, which would trivially satisfy check 2 → check 3
//   * fix only the value `succeed()` RETURNS and leave mintHeirs keyed on the old seed → check 4, because
//     the brothers' own cards are drawn from mintHeirs and would then disagree with the headline
//   * check 1 is what stops checks 2-4 going green over an empty list if this harness ever stops
//     completing successions or stops producing brothers
//
// Run: `npx tsx tools/playtest/family_trait_survives.ts [dynasties] [successions]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';

const DYNASTIES = Math.max(3, Math.min(40, Number(process.argv[2] ?? 16)));
const GENS = Math.max(2, Math.min(8, Number(process.argv[3] ?? 5)));
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

async function main() {
  console.log('=== One bloodline, one family attribute ===');
  const lines: Array<{ slot: string; traits: string[] }> = [];
  let brothersSeen = 0, brothersDisagreeing = 0;
  for (let d = 0; d < DYNASTIES; d++) {
    // A slot id per dynasty, because careerSeedFor mixes the save's slot — sixteen dynasties on one slot
    // would be sixteen copies of one family and the spread check below would be meaningless.
    const slot = `probe-trait-${d}`;
    __setBackendForTests(createInMemoryBackend());
    await api.register('dynasty', 'x', 'Ashcombe', 20260902, slot);
    const { candidates } = await api.scoutProspects(3) as any;
    const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;
    const traits: string[] = [];
    for (let g = 0; g < GENS; g++) {
      await api.startCareer(pid, null);
      await playCareer(pid);
      // Five seasons of a manager career, so the father retires with the record a real succession reads.
      for (let s = 0; s < 5; s++) {
        await api.spSeasonReward({ pos: s < 2 ? 3 : 1, size: 14, wins: 18, draws: 8, losses: 12, tier: 2, starId: pid, kind: 'league' });
      }
      const r: any = await api.succeed(pid, { seasons: 5, titles: 3, cups: 1, mentorship: 2, inheritance: 'name' });
      const trait = String(r.familyTrait ?? '');
      traits.push(trait);
      // The brothers' cards print `h.familyTrait` straight off mintHeirs, not this headline value, so the
      // two have to be one number or the succession screen states two family attributes at once. Cousins
      // are skipped on purpose: a nephew carries his own father's inheritance and the card says so.
      for (const b of (r.siblings ?? []) as Array<{ familyTrait: string; cousin?: boolean }>) {
        if (b.cousin) continue;
        brothersSeen++;
        if (String(b.familyTrait) !== trait) brothersDisagreeing++;
      }
    }
    lines.push({ slot, traits });
  }

  const successions = lines.reduce((n, l) => n + l.traits.length, 0);
  const changed = lines.filter((l) => new Set(l.traits).size > 1);
  const spread = new Set(lines.map((l) => l.traits[0]));
  console.log(`  ..   ${lines.length} dynasties x ${GENS} successions = ${successions} handover(s), ${brothersSeen} brother card(s) read`);
  console.log(`  ..   attributes running in these families: ${[...spread].sort().join(', ')}`);
  for (const l of changed) console.log(`  ..   ${l.slot} changed the family attribute mid-line: ${l.traits.join(' → ')}`);
  if (!changed.length) console.log('  ..   no dynasty changed attribute; every line held the one it was founded on');

  ok(successions === lines.length * GENS && brothersSeen > 0,
     `every dynasty ran to ${GENS} successions and left brothers to read (${successions}/${lines.length * GENS} handovers, ${brothersSeen} brothers) — the checks below are not measuring an empty list`);
  ok(changed.length === 0,
     `the family attribute survives every succession (${changed.length} of ${lines.length} dynasties changed it mid-line)`);
  ok(spread.size === 3,
     `different bloodlines still run on different attributes (${spread.size}/3 seen) — a constant would pass the check above and be worse than the bug`);
  ok(brothersDisagreeing === 0,
     `the brothers' own cards name the same attribute as the headline (${brothersDisagreeing}/${brothersSeen} disagreed) — one screen, one family`);

  console.log(fails ? `\n✗ ${fails} failure(s) — the family attribute is a per-generation roll, not a bloodline` : '\n✓ what runs in the family runs in the family');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
