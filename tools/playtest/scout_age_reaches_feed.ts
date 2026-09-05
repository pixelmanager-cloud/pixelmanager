// A SCOUT WHO COMES HOME WITH A BOY AND A SCOUT WHO COMES HOME WITH AN OLD PRO MUST NOT READ THE SAME.
//
// `tierFor` turns an event plus the man it happened to into a bank key, and for a scouted signing it
// reads his age: 33+ is `scout_found.veteran`, 20-or-under is `scout_found.young`. But it reads it as
// `p?.age ?? 0`, and 0 clears neither gate — so a find whose age never arrives is silently tiered out of
// the general bank, and the six lines written for the two ends of the age range (4 young, 2 veteran) can
// never print. `mintSquadPlayer` gives every trialist an age in 18..33, so roughly one find in five is a
// boy and one in sixteen is an old head: both tiers would fire regularly if the age got through.
//
// THIS IS THE SECOND TIME. The repair was recorded against the ledger once already (F-115) and only half
// of it was ever written: main.ts read `(r.player as any).age` while `api.signMission`'s DTO returned
// `{ name, role }` and nothing else. The cast is what made that survivable — it silenced the one
// TS2339 that would have said the field does not exist — so a half-wire typechecked, shipped, and was
// marked fixed. The cast is now gone, which makes the api half a compile error; this probe covers what
// the compiler cannot see, that a real signing arrives at the narration carrying a real number.
//
// MUTATION TEST — all four verified by hand against a patched tree:
//   * drop `age` from the DTO   -> the two DTO assertions go red (and `npm run build --workspace=client`
//                                  fails with TS2339 at the main.ts read, which is the point of the cast
//                                  removal);
//   * return `age: 0`           -> the DTO assertions and both tier assertions go red;
//   * empty `scout_found.young` -> the first assertion goes red, so the line-count arithmetic below can
//                                  never pass by measuring an empty bank;
//   * delete `age:` from main.ts's feedEvent call -> the last assertion goes red.
//
// Run: `npx tsx tools/playtest/scout_age_reaches_feed.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { destinationById, rollMission } from '../../shared/src/missions.js';
import { tierFor, eligible } from '../../shared/src/managerNarrate.js';
import { MGR_EXTRA_1 } from '../../shared/src/manager/pack_1.js';

const SRC = 'client/src/main.ts';
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Dispatch a trip and re-seal its row from a FIXED id so it always comes home with somebody, then stamp
 *  a chosen age on the man it found. White-box, the same way scout_trip_rollover.ts re-seals a row: the
 *  outcome is a mulberry32 draw off a randomUUID, and a probe about ages must never measure the dice. */
async function findAged(seedId: string, age: number) {
  const dest = destinationById('parks')!;
  const disp = await api.dispatchScout(dest.id, 0);
  const row = await localStore.missionById(disp.mission.id);
  const sealed = rollMission(seedId, dest, 'base', 1, 1);
  const p = sealed.player as any;
  ok(!!row && !!p, `the trip for the ${age}-year-old is holding a player to sign (not measuring an empty trip)`);
  p.age = age;
  row!.found = 1; row!.player_json = JSON.stringify(p); row!.band = sealed.band;
  return { id: disp.mission.id, name: String(p.name) };
}

async function main() {
  console.log('=== A scouted player reaches the season feed with his age ===');

  const young = ((MGR_EXTRA_1 as any)['scout_found.young'] ?? []) as string[];
  const vet = ((MGR_EXTRA_1 as any)['scout_found.veteran'] ?? []) as string[];
  ok(young.length > 0 && vet.length > 0,
     `both age banks are authored and non-empty (${young.length} young, ${vet.length} veteran) — nothing below counts if they are not`);

  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Age FC', 20260905, 'scout-age-reaches-feed');

  const boy = await findAged('probe-young-find', 19);
  const rb = await api.signMission(boy.id, 20);
  console.log(`  ..   signMission(19) -> ${JSON.stringify(rb.player)}`);
  ok(rb.player.age === 19,
     `the DTO carries the boy's age (${rb.player.age}) — main.ts feeds r.player.age straight to the narration`);

  const old = await findAged('probe-veteran-find', 34);
  const rv = await api.signMission(old.id, 20);
  console.log(`  ..   signMission(34) -> ${JSON.stringify(rv.player)}`);
  ok(rv.player.age === 34, `and the old head's (${rv.player.age})`);

  // The context main.ts builds, built the same way, so the tiers are read off the shipped path.
  const ctxYoung = { name: rb.player.name, seasonsAtClub: 0, age: rb.player.age };
  const ctxVet = { name: rv.player.name, seasonsAtClub: 0, age: rv.player.age };
  const kY = tierFor('scout_found', ctxYoung), kV = tierFor('scout_found', ctxVet);
  console.log(`  ..   tierFor(19) -> ${kY.join(', ')}`);
  console.log(`  ..   tierFor(34) -> ${kV.join(', ')}`);
  ok(kY.includes('scout_found.young'), 'a nineteen-year-old find is tiered young');
  ok(kV.includes('scout_found.veteran'), 'a thirty-four-year-old find is tiered a veteran');

  const bare = eligible('scout_found', { name: boy.name, seasonsAtClub: 0 });
  const pY = eligible('scout_found', ctxYoung), pV = eligible('scout_found', ctxVet);
  console.log(`  ..   ${bare.length} lines eligible with no age; ${pY.length} for the boy, ${pV.length} for the old head`);
  ok(pY.length === bare.length + young.length && pV.length === bare.length + vet.length,
     `every one of the ${young.length + vet.length} age-specific lines is on the table — all six were unreachable`);

  // The other half of the wire, and the half that DID land last time. Nothing else can see it: PersonCtx
  // takes an optional age, so a call site that stops passing one is not a type error. Scan code, not
  // prose — this file's own header quotes the broken expression.
  const code = readFileSync(SRC, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const at = code.indexOf('private async signMission(');
  const handler = at < 0 ? '' : code.slice(at, at + 900);
  ok(/feedEvent\('scout_found'/.test(handler) && /age:\s*r\.player\.age/.test(handler),
     `${SRC} still forwards r.player.age into the scout_found event, uncast, so tsc owns the api half`);

  console.log(fails ? `\n✗ ${fails} failure(s) — a scouted find is narrated with no age, out of the general bank`
                    : '\n✓ a young find and an old find are narrated as what they are');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
