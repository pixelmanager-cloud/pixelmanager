// The injury roll had no caller for the whole life of the project, so its numbers were never once observed
// against a real season. A season should cost a club a handful of knocks — enough that squad depth and the
// Medical Centre matter, few enough that the XI is not a lottery.
//
// IT STATED THAT INVARIANT AND ASSERTED NOTHING. It printed three lines and exited 0 whatever they said, so
// the rate could drift to zero or to thirty and the gate would not notice — the same shape as the four
// other checks-that-cannot-fail found in this project's own guards. It asserts now.
//
// The loop is 38 matches, which is a real football season and NOT this game's: `FIXTURES_PER_SEASON` is
// 2 * (LEAGUE_SIZE - 1) = 18. That is left alone deliberately — the point here is the per-match rate and
// the Medical Centre's effect on it, and 38 matches is simply a larger sample of the same roll. The bands
// below are therefore stated per 38 matches, which is what is measured.
import { generateClub } from '../../shared/src/teams.js';
import { rollMatchInjuries } from '../../shared/src/injuries.js';

const rates: { med: number; per: number; out: number }[] = [];
for (const med of [1, 5, 10]) {
  let outMatches = 0, count = 0, seasons = 200;
  for (let s = 0; s < seasons; s++) {
    const club = generateClub(`inj-${s}`, 'Test', 'TST', 0x445566, 12, s * 7919 + 13, true);
    const xi = { ...club, players: club.players.slice(0, 11) };
    const busy: Record<string, number> = {};
    for (let match = 0; match < 38; match++) {
      for (const k of Object.keys(busy)) if (--busy[k] <= 0) delete busy[k];
      const fit = xi.players.map((_, i) => 0.6 + ((i * 37 + match * 13) % 40) / 100);
      for (const n of rollMatchInjuries(xi as any, fit, med, (s * 1000 + match) >>> 0)) {
        if (busy[n.playerId]) continue;
        busy[n.playerId] = n.matches; count++; outMatches += n.matches;
      }
    }
  }
  const per = count / seasons;
  rates.push({ med, per, out: outMatches / count });
  console.log(`medical L${String(med).padStart(2)}  ${per.toFixed(1)} injuries/38 matches, ${(outMatches / count).toFixed(1)} matches out avg`);
}

console.log('');
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// A handful of knocks. Zero makes squad depth and the Medical Centre pointless; a flood makes the XI a
// lottery and the tactical layer noise.
for (const r of rates) {
  check(r.per >= 1.5 && r.per <= 16,
    `medical L${r.med}: ${r.per.toFixed(1)} injuries per 38 matches is a handful, not none and not a lottery`);
  check(r.out >= 1 && r.out <= 6, `medical L${r.med}: ${r.out.toFixed(1)} matches out on average is a knock, not a season-ender`);
}
// THE FACILITY'S WHOLE CLAIM. If this is not monotone the Medical Centre is decoration, which is exactly
// the state nine of the twelve facilities were found in.
const [l1, l5, l10] = rates;
check(l1.per > l5.per && l5.per > l10.per,
  `the Medical Centre monotonically reduces injuries (${l1.per.toFixed(1)} -> ${l5.per.toFixed(1)} -> ${l10.per.toFixed(1)})`);
check(l1.per - l10.per >= 1.5,
  `maxing it is worth having (${(l1.per - l10.per).toFixed(1)} fewer injuries per 38 matches)`);

console.log(fails ? `\n✗ ${fails} injury-rate check(s) failed` : '\n✓ injuries are a handful a season, and the Medical Centre earns its upkeep');
if (fails) process.exitCode = 1;
