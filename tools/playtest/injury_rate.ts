// The injury roll had no caller for the whole life of the project, so its numbers were never once
// observed against a real season. A 38-match season should cost a club a handful of knocks — enough that
// squad depth and the Medical Centre matter, few enough that the XI is not a lottery.
import { generateClub } from '../../shared/src/teams.js';
import { rollMatchInjuries } from '../../shared/src/injuries.js';

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
  console.log(`medical L${String(med).padStart(2)}  ${(count / seasons).toFixed(1)} injuries/season, ${(outMatches / count).toFixed(1)} matches out avg`);
}
