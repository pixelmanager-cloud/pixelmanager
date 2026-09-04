// A TRIP THE FACADE WILL STILL SIGN HAS TO BE ON THE SCOUTING SCREEN.
//
// A scouting trip is stamped with the season it was DISPATCHED in, and the Scouting screen reads
// `missionsInSeason(current season)` — while the reveal is measured against the lifetime match count,
// which only moves at the season rollover. So the rollover that finally lands a late trip is the same
// event that files it under last season, and the trip vanishes from the screen at the exact moment it
// had something to show. Nothing else in the game references it again: the row is still in the save,
// `api.signMission` still accepts it, the player it found is still there to sign — the screen is simply
// the only place he could have been signed from, and it stopped drawing him.
//
// The rule this enforces: a trip that crosses one rollover unsigned is still listed, still revealed, and
// still carries the player the facade would hand over.
//
// Run: `npx tsx tools/playtest/scout_trip_rollover.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { destinationById, rollMission } from '../../shared/src/missions.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

async function main() {
  console.log('=== A trip dispatched before the rollover is still signable on the screen after it ===');
  __setBackendForTests(createInMemoryBackend());
  await api.register('scout', 'x', 'Rollover FC', 20260830, 'scout-rollover');

  const before = await api.missions();
  const dest = before.destinations.find((d) => d.id === 'parks') ?? before.destinations[0];
  const disp = await api.dispatchScout(dest.id);
  ok((await api.missions()).missions.some((m) => m.id === disp.mission.id),
     'the trip is listed in the season it was dispatched in (so the check below is about the crossing)');

  // A mission id is a crypto.randomUUID and the outcome is sealed off it, so roughly one Local Parks trip
  // in ten comes home empty and there would be nothing left to sign. Re-seal this row from a FIXED id so
  // the probe measures the rollover and never the dice — white-box, the same way qa_facade_scout_kit_fuzz
  // forces `ready_at` to drive the sign path without waiting.
  const row = await localStore.missionById(disp.mission.id);
  ok(!!row, 'the dispatched trip is in the save to begin with');
  const sealed = rollMission('probe-carried-trip', destinationById('parks')!, 'base', 1, 1);
  if (row) { row.found = sealed.found ? 1 : 0; row.player_json = sealed.player ? JSON.stringify(sealed.player) : null; row.band = sealed.band; }
  ok(!!row?.found && !!row?.player_json, 'the trip is holding a player to sign (this is not measuring an empty trip)');

  // The rollover. spSeasonReward is the only writer of profile.season and of the lifetime W/D/L the
  // reveal is measured against — nextSeason() calls it exactly like this, once, with the season batched.
  const seasonBefore = before.season;
  await api.spSeasonReward({ pos: 5, size: 10, wins: 6, draws: 5, losses: 7, kind: 'league' });
  const after = await api.missions();
  ok(after.season === seasonBefore + 1, 'the season rolled over (the crossing this probe exists for actually happened)');

  const stored = await localStore.missionById(disp.mission.id);
  ok(!!stored && stored.status !== 'signed', 'the trip row survived the rollover in the save — it is not the store that drops it');

  const carried = after.missions.find((m) => m.id === disp.mission.id);
  console.log(`  ..   season ${after.season}: ${after.missions.length} trip(s) listed, budget ${after.tripsUsed}/${after.tripsPerSeason} used`);
  ok(!!carried, 'the trip is still on the Scouting screen after the rollover');
  ok(!!carried?.revealed, 'and it is revealed, so the player can see what his coins bought');
  ok(!!carried?.player, 'and the found player is on the card, which is what main.ts hangs the Sign button off');

  // The LIST is widened; the BUDGET is not. tripsUsed/tripsLeft are a per-season allowance and the
  // carried trip was already paid for out of the season it left in.
  ok(after.tripsUsed === 0, 'a carried trip does not spend the new season\'s trip budget');

  // The half that was never broken, asserted so the pair can never drift apart again: the facade signs it.
  let signedName = '';
  try { signedName = (await api.signMission(disp.mission.id)).player.name; } catch { /* leaves signedName '' */ }
  ok(!!signedName, `the facade still signs the carried trip${signedName ? ` (${signedName})` : ''} — which is why hiding it is a bug and not a rule`);

  console.log(fails ? '\n✗ a live, signable trip is invisible on the Scouting screen' : '\n✓ a trip that crosses the rollover is still on screen and still signable');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
