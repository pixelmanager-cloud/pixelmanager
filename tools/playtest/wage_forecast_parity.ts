// THE WAGE FORECAST HAS TO NAME THE SAME MEN THE ROLLOVER CHARGES.
//
// Two screens quote the season's wage bill — the season header ("💷 wage bill ~Xc, due at season's end")
// and the Transfer Market, which is where the copy tells the manager to leave himself room for it — and
// then the rollover charges a third number. The rollover is the truth: advanceSquadSeason removes everyone
// in the LOANEE REGISTER before it builds the roster it bills (api.ts), so no loanee's wage is ever taken.
// Both forecasts guessed at that register with an id prefix instead, and guessed differently — the header
// filtered no loanee at all, the Transfer Market only `loan-` — while a scouted loanee is minted
// `scout-<missionId>` (missions.ts). So the header over-quoted by every loanee at the club and the market
// by every scouted one, on the exact number the manager is told to budget against; three loanees put the
// header about a quarter over. The same `loan-`-only test drives the team sheet's LOAN badge, so a scouted
// loanee also read as a permanent squad member right up to the season end that sent him home.
//
// The probe evaluates main.ts's OWN filter expressions rather than a copy of them: a check that
// re-implements the rule it is testing can only ever agree with itself.
//
// Run: `npx tsx tools/playtest/wage_forecast_parity.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { destinationById, rollMission } from '../../shared/src/missions.js';
import { overall } from '../../shared/src/teams.js';
import { squadSeasonWage } from '../../shared/src/transfermarket.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const SRC = readFileSync('client/src/main.ts', 'utf8');

/** Lift one of main.ts's own id tests out of the source and make it callable. The `const isX = …;` helpers
 *  the expression names are resolved with it (to a fixed point, so an alias of an alias still works), and
 *  their `: string` annotations are stripped because `new Function` parses JS, not TS. */
function lift(re: RegExp, what: string): ((v: any) => boolean) | null {
  const m = SRC.match(re);
  ok(!!m, `found the ${what} in client/src/main.ts`);
  if (!m) return null;
  const expr = m[1];
  const seen = new Map<string, string>();
  for (let pass = 0, pool = expr; pass < 4; pass++) {
    let added = '';
    for (const name of new Set(pool.match(/\bis[A-Z]\w*/g) ?? [])) {
      if (seen.has(name)) continue;
      const h = SRC.match(new RegExp(`^\\s*const ${name} = ([^;]+);`, 'm'));
      if (h) { seen.set(name, h[1]); added += h[1]; }
    }
    if (!added) break;
    pool = added;
  }
  const prelude = [...seen.entries()]
    .sort((a, b) => SRC.indexOf(`const ${a[0]} =`) - SRC.indexOf(`const ${b[0]} =`))
    .map(([n, body]) => `const ${n} = ${body.replace(/:\s*string/g, '')};`).join('\n');
  return new Function('v', `${prelude}\nreturn !!(${expr.replace(/:\s*string/g, '')})(v);`) as (v: any) => boolean;
}

const headerKeeps = lift(/const billed = this\.club\.players\.filter\((.*)\);/, 'season-header wage forecast');
const marketKeeps = lift(/const billed = squad\.filter\((.*)\);/, 'Transfer Market wage forecast');
const badgeIsLoan = lift(/^\s*const isLoan = (.+);$/m, 'team-sheet LOAN badge test');

async function main() {
  console.log('=== The wage forecasts bill exactly who the rollover charges ===');
  if (!headerKeeps || !marketKeeps || !badgeIsLoan) { console.log('\n✗ could not read the tests out of main.ts'); process.exit(1); }

  __setBackendForTests(createInMemoryBackend());
  await api.register('wage', 'x', 'Parity FC', 20260830, 'wage-parity');

  // A SCOUTED loanee (`scout-…`) and two WALK-UP trialists (`loan-…`) — the two routes onto the loanee
  // register, which is the list the rollover actually consults. All three places filled, so the gap the
  // forecasts open is a season's worth rather than a rounding artefact.
  const m0 = await api.missions();
  const dest = m0.destinations.find((d) => d.id === 'parks') ?? m0.destinations[0];
  const disp = await api.dispatchScout(dest.id);
  const row = await localStore.missionById(disp.mission.id);
  // Re-seal the row off a FIXED id so this measures the forecast and never the dice — roughly one Local
  // Parks trip in ten comes home empty, and an empty trip is nothing to sign — and land it now rather
  // than simulating a season of matchdays to walk the scout home.
  let sealed = rollMission('probe-wage-0', destinationById(dest.id)!, 'base', 1, 1);
  for (let i = 1; i < 60 && !sealed.found; i++) sealed = rollMission(`probe-wage-${i}`, destinationById(dest.id)!, 'base', 1, 1);
  ok(!!sealed.found && !!sealed.player, 'the trip is holding a player to sign (this is not measuring an empty trip)');
  if (row && sealed.player) { row.found = 1; row.player_json = JSON.stringify(sealed.player); row.band = sealed.band; row.ready_at = 0; }
  await api.signMission(disp.mission.id);
  const scoutId = sealed.player!.id;
  const pool = (await api.trials()).pool;
  await api.signTrial(0);
  await api.signTrial(1);
  const loanIds = [pool[0].id, pool[1].id];

  // THE ROLLOVER, in the order nextSeason() runs it: spSeasonReward advances the season, then
  // advanceSquadSeason sends the loanees home and charges what is left. spSeasonReward pays the prize
  // money and bills upkeep; it does not touch the roster, so this IS the squad the two screens quoted.
  await api.spSeasonReward({ pos: 5, size: 10, wins: 6, draws: 5, losses: 7, kind: 'league' });
  const rollSeason = (await api.trials()).season;
  const squadBefore = (await api.me()).club.players;
  const ids = new Set(squadBefore.map((p) => p.id));
  console.log(`  ..   squad of ${squadBefore.length} incl. scouted loanee \`${scoutId}\` and walk-ups \`${loanIds.join('`, `')}\``);
  ok(scoutId.startsWith('scout-') && ids.has(scoutId), 'a scouted loanee is in the squad (the prefix neither forecast knew about)');
  ok(loanIds.every((id) => id.startsWith('loan-') && ids.has(id)), 'walk-up trialists are in the squad too');

  const roll = await api.advanceSquadSeason({ trainingLvl: 1 });
  const after = new Set((await api.me()).club.players.map((p) => p.id));
  ok(![scoutId, ...loanIds].some((id) => after.has(id)), 'the rollover sent every loanee home, so none of them was ever on the payroll');

  const truth = Number(roll.wageBill);
  console.log(`  ..   the rollover charged ${truth.toLocaleString('en-US')}c of wages`);
  // VACUITY GUARD: an equality between two empty sums is not a check.
  ok(truth > 0 && squadBefore.length > loanIds.length + 1, 'there is a real squad and a real bill here (this is not comparing zero to zero)');

  // Both forecasts, priced at the SAME season index the rollover used, so this measures WHO is billed and
  // nothing else.
  const quote = (keep: (p: any) => boolean) =>
    squadBefore.filter(keep).reduce((n, p) => n + squadSeasonWage(overall(p), rollSeason), 0);
  const header = quote(headerKeeps), market = quote(marketKeeps);
  const gap = (n: number) => `${n - truth >= 0 ? '+' : ''}${(n - truth).toLocaleString('en-US')}c`;
  console.log(`  ..   season header quotes ${header.toLocaleString('en-US')}c (${gap(header)}) · Transfer Market quotes ${market.toLocaleString('en-US')}c (${gap(market)})`);
  ok(header === truth, 'the season header quotes the bill the club is actually charged');
  ok(market === truth, 'the Transfer Market quotes the bill the club is actually charged');

  // The bloodline star is appended to the merged club for display and is never billed — the half of each
  // filter that already worked, held down so a fix to the other half cannot quietly drop it.
  ok(!headerKeeps({ id: 'nft:1:b2.1' }) && !marketKeeps({ id: 'nft:1:b2.1' }), 'both forecasts still exclude the bloodline star');

  // Same question, third call site: an unbadged loanee reads as a permanent squad member on the team
  // sheet right up until he vanishes at the rollover.
  ok(badgeIsLoan(scoutId) && loanIds.every((id) => badgeIsLoan(id)), 'the team sheet badges both kinds of loanee as LOAN');

  console.log(fails ? '\n✗ the game forecasts one wage bill and charges another' : '\n✓ both forecasts, the LOAN badge and the rollover agree on who is on the payroll');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
