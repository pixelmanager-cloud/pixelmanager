// THE SELL COLUMN MAY ONLY PRICE MEN THE CLUB CAN ACTUALLY SELL.
//
// The Transfer Market builds its SELL list from `this.club.players` and excluded exactly one man — the
// bloodline star. Loanees are in that list by both routes in: signTrial pushes the walk-up trialist
// (`loan-s<season>-<index>`, scouting.ts) and signMission pushes the scouted one (`scout-<missionId>`,
// missions.ts), and both then addLoanee. So up to LOANEE_CAP men a season were rendered with a firm
// quote — "Sell · +Nc", an aria-label naming the coins, and no LOAN badge to say he isn't yours — while
// api.sellPlayer refuses that exact id with 409 "he's only here on trial". The manager budgets a signing
// against money the game will never pay him, clicks through the confirm, and gets an error toast.
//
// The wage-bill line eleven lines below in the same function already asks the right question
// (`!isLoaneeId(p.id)`); the sell filter between them was never given it.
//
// The probe evaluates main.ts's OWN sell filter rather than a copy of it: a check that re-implements the
// rule it is testing can only ever agree with itself. The live half signs real loanees through the real
// facade and makes the facade refuse them, so the two halves meet on the same ids.
//
// Run: `npx tsx tools/playtest/sell_list_ownable.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel, localStore } from '../../client/src/save.js';
import { destinationById, rollMission } from '../../shared/src/missions.js';
import { MIN_SQUAD } from '../../shared/src/market.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const SRC = readFileSync('client/src/main.ts', 'utf8');

/** Lift renderTransferMarket's own sell filter out of the source and make it callable. The `const isX = …;`
 *  helpers the expression names are resolved with it, `m` (the loaded manager it closes over) is passed in,
 *  and the `: string` annotations are stripped because `new Function` parses JS, not TS. */
function liftSellFilter(): ((m: any, v: any) => boolean) | null {
  const hit = SRC.match(/const squad = this\.club\.players, sellable = squad\.filter\((.*)\);/);
  ok(!!hit, 'found the Transfer Market SELL list in client/src/main.ts');
  if (!hit) return null;
  const expr = hit[1];
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
  console.log(`  ..   the SELL column keeps \`${expr.trim()}\``);
  return new Function('m', 'v', `${prelude}\nreturn !!(${expr.replace(/:\s*string/g, '')})(v);`) as (m: any, v: any) => boolean;
}

async function main() {
  console.log('=== The Transfer Market only prices players the club can sell ===');
  const keeps = liftSellFilter();
  if (!keeps) { console.log('\n✗ could not read the sell filter out of main.ts'); process.exit(1); }

  __setBackendForTests(createInMemoryBackend());
  await api.register('sell', 'x', 'Ownable FC', 20260830, 'sell-list-ownable');

  // A SCOUTED loanee (`scout-…`) and two WALK-UP trialists (`loan-…`) — the two routes onto the loanee
  // register, so a fix that only knows one prefix cannot pass.
  const m0 = await api.missions();
  const dest = m0.destinations.find((d) => d.id === 'parks') ?? m0.destinations[0];
  const disp = await api.dispatchScout(dest.id);
  const row = await localStore.missionById(disp.mission.id);
  // Re-seal the trip off a FIXED id so this measures the sell list and never the dice — roughly one Local
  // Parks trip in ten comes home empty, and an empty trip is nothing to sign.
  let sealed = rollMission('probe-sell-0', destinationById(dest.id)!, 'base', 1, 1);
  for (let i = 1; i < 60 && !sealed.found; i++) sealed = rollMission(`probe-sell-${i}`, destinationById(dest.id)!, 'base', 1, 1);
  ok(!!sealed.found && !!sealed.player, 'the trip is holding a player to sign (this is not measuring an empty trip)');
  if (row && sealed.player) { row.found = 1; row.player_json = JSON.stringify(sealed.player); row.band = sealed.band; row.ready_at = 0; }
  await api.signMission(disp.mission.id);
  const scoutId = sealed.player!.id;
  const pool = (await api.trials()).pool;
  await api.signTrial(0);
  await api.signTrial(1);
  const loaneeIds = [scoutId, pool[0].id, pool[1].id];

  const squad = (await api.me()).club.players;
  const ids = new Set(squad.map((p) => p.id));
  console.log(`  ..   squad of ${squad.length} incl. loanees \`${loaneeIds.join('`, `')}\``);
  // VACUITY GUARD. With no loanee in the squad every assertion below is a filter run over men it was
  // never meant to catch. Mutation-test this probe by deleting the two signTrial calls and the
  // signMission above: this line must go red rather than the file quietly reporting green.
  ok(loaneeIds.every((id) => ids.has(id)), 'both kinds of loanee really are in the squad the market renders');

  // THE REFUSAL, from the facade itself — the reason a priced button here is a dead button. sellPlayer
  // checks MIN_SQUAD first, so a squad at the floor would refuse for the wrong reason and prove nothing.
  const raw = getActiveModel().club.players.length;
  ok(raw > MIN_SQUAD, `the registered squad (${raw}) is above MIN_SQUAD (${MIN_SQUAD}), so a refusal below is about ownership, not squad size`);
  for (const id of loaneeIds) {
    let err: any = null;
    try { await api.sellPlayer(id); } catch (e) { err = e; }
    ok(!!err && err.status === 409, `the facade refuses to sell \`${id}\` — "${err?.body?.error ?? err?.message ?? 'IT SOLD HIM'}"`);
  }

  // AND SO THE SELL COLUMN MUST NOT QUOTE HIM A PRICE.
  const mgr = { starId: squad[0].id };
  const shown = squad.filter((p) => keeps(mgr, p));
  const priced = shown.filter((p) => loaneeIds.includes(p.id)).map((p) => p.id);
  console.log(`  ..   the SELL column lists ${shown.length} of ${squad.length}${priced.length ? ` — including unsellable \`${priced.join('`, `')}\`` : ''}`);
  ok(priced.length === 0, 'the SELL column prices no loanee — the facade would refuse every one of those clicks');
  // The other half of the same filter, held down so a fix to the loanee half cannot quietly drop it.
  ok(!keeps(mgr, squad[0]), 'the bloodline star is still excluded from the SELL column');
  // VACUITY GUARD the other way: a filter that kept nobody would pass the line above for free.
  ok(shown.length > 0 && shown.some((p) => !loaneeIds.includes(p.id) && p.id !== mgr.starId),
     `the column still lists the men the club does own (${shown.length} rows — this is not an empty-list pass)`);

  console.log(fails ? '\n✗ the market is quoting a coin price on men it cannot sell' : '\n✓ no loanee is priced in the SELL column');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
