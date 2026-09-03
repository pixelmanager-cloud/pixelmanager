// THE TWELVE CARDS MUST ADD UP TO THE HEADER PRINTED ABOVE THEM.
//
// The Club screen renders a "Season upkeep" total and, directly beneath it, one card per facility carrying
// that facility's own running cost. The total goes through seasonUpkeep, which applies UPKEEP_WEIGHT
// (women 0.45, community 0.25 — a women's team and a community trust are cheaper to run than a stadium).
// The per-card figures did not: they called facilityUpkeep with no weight. So a Women's Team at level 10
// advertised 567c a season and was billed 255c, and the twelve cards summed to 6,804c under a header
// reading 6,067c.
//
// It is the kind of error nobody reports as a bug — the player simply believes the club is more expensive
// to run than it is, and scales back the wrong department because the card told them it was the costly one.
//
// Run: `npx tsx tools/playtest/upkeep_parity.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { facilityUpkeep, UPKEEP_WEIGHT } from '../../shared/src/facilities.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

async function main() {
  console.log('=== The facility cards price what the club is actually billed ===');
  __setBackendForTests(createInMemoryBackend());
  await api.register('upkeep', 'x', 'Ashcombe', 20260830, 'upkeep');

  // Build the club up so the weighted facilities are above level 1 — at level 1 across the board the
  // weights barely separate and this would pass without measuring anything.
  for (let season = 0; season < 40; season++) {
    // Win the league in the top tier every year so the club can actually afford to build. A club stuck at
    // level 1-2 makes this probe's tolerance larger than the numbers it is comparing.
    await api.spSeasonReward({ pos: 1, size: 14, wins: 24, draws: 6, losses: 4, tier: 1, kind: 'league' });
    for (let i = 0; i < 12; i++) {
      const d: any = await api.facilities();
      const next = d.facilities.filter((f: any) => f.canAfford).sort((a: any, b: any) => a.level - b.level)[0];
      if (!next) break;
      try { await api.upgradeFacility(next.key); } catch { break; }
    }
  }

  const d: any = await api.facilities();
  const cards: any[] = d.facilities;
  const levels = cards.map((f) => f.level);
  console.log(`  ..   ${cards.length} facilities, levels ${Math.min(...levels)}-${Math.max(...levels)}`);
  ok(cards.length > 0, 'there are facility cards to check (this is not measuring an empty set)');
  ok(Math.min(...levels) > 3, 'the club was built up past level 3, where the weights genuinely separate');

  const summed = cards.reduce((n, f) => n + (Number(f.upkeep) || 0), 0);
  const header = Number(d.upkeep) || 0;
  console.log(`  ..   cards sum to ${summed.toLocaleString()}c · the "Season upkeep" header reads ${header.toLocaleString()}c`);
  // Rounding is per-facility on both sides, so allow a coin or two of drift — not 700.
  // VACUITY GUARD: a tolerance of a coin per card is meaningless if the bill itself is a handful of coins.
  ok(header > 500, `the bill is large enough for the comparison to mean something (${header}c)`);
  ok(Math.abs(summed - header) <= cards.length,
     `the cards add up to the header (within per-card rounding: |${summed} - ${header}| <= ${cards.length})`);

  // And the weighting must actually be ON each card, or the parity above could be satisfied by both sides
  // being wrong in the same way. Compare each card against the unweighted price at its own level.
  let weighted = 0;
  for (const f of cards) {
    const w = UPKEEP_WEIGHT[f.key as keyof typeof UPKEEP_WEIGHT];
    if (w == null || w === 1) continue;
    weighted++;
    const bare = facilityUpkeep(f.level);
    console.log(`  ..   ${f.key} L${f.level}: card ${f.upkeep}c · unweighted would be ${bare}c · weight ${w}`);
    ok(f.upkeep < bare, `the ${f.key} card is priced at its weight, not the flat rate`);
  }
  ok(weighted > 0, 'some facility actually carries a weight (otherwise the whole check is inert)');

  console.log(fails ? `\n✗ the club screen advertises a running cost the club is not charged` : '\n✓ every card prices what the club is billed');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
