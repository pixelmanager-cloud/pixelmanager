// A SCOUTING TRIP NOBODY CAN EVER LOOK AT AGAIN HAS TO LEAVE THE SAVE.
//
// `createMission` was push-only — there was no delete for the `missions` collection anywhere in the tree
// — while every reader is season-scoped: the Scouting screen reads the current season plus last season's
// unsigned trips, and `profile.season` only ever goes up (one writer, `spSeasonReward`). So a row's
// season stamp falls out of the read window two rollovers after it was dispatched and can never come
// back, and the row — carrying a whole serialized Player in `player_json` — rides in the save for the
// life of the dynasty, deep-cloned on every debounced persist and re-parsed on every load. Measured on
// this probe's own run before the prune existed: 75 rows, 43.1 KiB of a 53.6 KiB save, 72 unreachable.
//
// The rule this enforces, in BOTH directions, because half of it is the trap:
//   - after a rollover, no mission row is left in the save outside the window `api.missions()` reads;
//   - and the trip that window is FOR — last season's unsigned one, which scout_trip_rollover.ts exists
//     to keep on screen — is still in the save, still listed and still signable. A prune that keeps only
//     the current season would pass the first assertion and quietly eat a paid-for trip.
//
// Run: `npx tsx tools/playtest/scout_trip_prune.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel, localStore } from '../../client/src/save.js';
import { destinationById, rollMission } from '../../shared/src/missions.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const SEASONS = 25;

async function roll() {
  await api.spSeasonReward({ pos: 5, size: 10, wins: 6, draws: 5, losses: 7, kind: 'league' });
}

async function main() {
  console.log(`=== ${SEASONS} seasons of scouting must not leave ${SEASONS} seasons of trips in the save ===`);
  __setBackendForTests(createInMemoryBackend());
  await api.register('scout', 'x', 'Prune FC', 20260830, 'scout-prune');

  let dispatched = 0;
  for (let s = 0; s < SEASONS; s++) {
    // Scouting is paid for out of the treasury and this harness plays no matches, so top it up rather
    // than have the probe quietly stop dispatching halfway and measure nothing.
    await localStore.addCoins('local', 500);
    for (let t = 0; t < 3; t++) {
      try { await api.dispatchScout('parks', t); dispatched++; } catch { /* budget or cap — counted, not fatal */ }
    }
    await roll();
  }
  // ANTI-VACUITY: everything below is a claim about rows, so there have to be rows. A run that dispatched
  // nothing would satisfy "no unreachable rows" by having no rows at all.
  ok(dispatched >= SEASONS * 2, `the run actually scouted — ${dispatched} trips dispatched over ${SEASONS} seasons`);

  const model = getActiveModel();
  const cur = String(model.profile.season), prev = String(model.profile.season - 1);
  const stored = model.missions;
  const stranded = stored.filter((r) => r.season_id !== cur && r.season_id !== prev);
  const bytes = JSON.stringify(stored).length;
  console.log(`  ..   season ${model.profile.season}: ${dispatched} dispatched, ${stored.length} row(s) kept `
            + `(${(bytes / 1024).toFixed(1)} KiB of a ${(JSON.stringify(model).length / 1024).toFixed(1)} KiB save), ${stranded.length} stranded`);
  ok(stored.length > 0, 'the save still holds the trips a reader can reach (the prune is not just emptying the table)');
  ok(stranded.length === 0,
     `no trip is stamped with a season outside the ${prev}..${cur} window api.missions() reads — ${stranded.length} stranded row(s)`);

  // THE OTHER DIRECTION. Keeping only the current season would satisfy the assertion above and delete a
  // trip the player paid for and can still sign. Seal this one from a fixed id so the probe measures the
  // prune and never the dice — the same white-box reseal scout_trip_rollover.ts uses.
  console.log('=== and the carried trip the prune must not take ===');
  await localStore.addCoins('local', 500);
  const disp = await api.dispatchScout('parks', 0);
  const row = await localStore.missionById(disp.mission.id);
  const sealed = rollMission('probe-prune-carried', destinationById('parks')!, 'base', 1, 1);
  if (row) { row.found = sealed.found ? 1 : 0; row.player_json = sealed.player ? JSON.stringify(sealed.player) : null; row.band = sealed.band; }
  ok(!!row?.found && !!row?.player_json, 'the carried trip is holding a player to sign (this is not measuring an empty trip)');

  await roll();
  ok(!!(await localStore.missionById(disp.mission.id)), 'last season\'s unsigned trip survived the prune in the save');
  ok((await api.missions()).missions.some((m) => m.id === disp.mission.id), 'and it is still listed on the Scouting screen');
  let signedName = '';
  try { signedName = (await api.signMission(disp.mission.id)).player.name; } catch { /* leaves signedName '' */ }
  ok(!!signedName, `and the facade still signs it${signedName ? ` (${signedName})` : ''}`);

  console.log(fails ? '\n✗ the missions table grows without bound, or the prune ate a live trip'
                    : '\n✓ dead scouting rows leave the save and live ones stay');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
