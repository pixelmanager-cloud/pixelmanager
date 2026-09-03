// THE GAME MUST NOT TELL THE PLAYER SOMETHING THAT DID NOT HAPPEN.
//
// When the wage bill cannot be paid and there is no facility left to strip, the rollover sells squad players
// at 60% of their value to cover it. Those men were folded into the same `departed` array as genuine
// contract expiries and rendered as "🚪 Left — their deals ran out and weren't renewed", with a
// `contract_expired` narration line for each. Their deals had not run out. The club had a fire sale.
//
// That is the club's most alarming financial event reaching the player as a routine end-of-season note,
// with no figure for what it raised and no indication that anything went wrong — while the men whose
// contracts genuinely lapsed are described identically, so neither group can be told from the other.
//
// Run: `npx tsx tools/playtest/forced_sale_reporting.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { transferList } from '../../shared/src/transfermarket.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

async function main() {
  console.log('=== A forced sale is reported as a sale, not as a contract expiry ===');
  __setBackendForTests(createInMemoryBackend());
  await api.register('broke', 'x', 'Ashcombe', 20260830, 'broke');

  // Drive the club into a wage bill it cannot pay: buy whoever is affordable until the coins are gone,
  // then roll the season with no prize money to cover it.
  let bought = 0;
  for (let s = 0; s < 6; s++) {
    // The market is derived, not served: the client calls transferList with the league seed. Do the same.
    for (const l of transferList(20260830, s, 1)) {
      try { await api.buyPlayer(l.player as any, l.fee); bought++; } catch { /* priced out or squad full */ }
    }
    const r: any = await api.advanceSquadSeason({ trainingLvl: 1, wonSomething: false, goodSeason: false });
    const sold = r.sold ?? [];
    const departed = r.departed ?? [];
    console.log(`  ..   season ${s}: wage bill ${r.wageBill}c, charged ${r.charged}c, unpaid ${r.unpaid}c · ${sold.length} sold, ${departed.length} departed`);
    // Insolvency is what puts us on the forced-sale path; `unpaid > 0` is the engine saying so. Anchor the
    // assertions to THAT, not to the presence of the field being tested — otherwise removing the field makes
    // the probe report "could not reproduce insolvency", which is both false and the wrong diagnosis.
    if (Number(r.unpaid) > 0) {
      ok(Array.isArray(r.sold) && r.sold.length > 0,
         `the club could not pay ${r.unpaid}c of wages, so the rollover reports the men it sold to cover it`);
      // This is the case the probe exists for.
      ok(sold.length > 0 && sold.every((x: any) => Number(x.fee) > 0), 'every forced sale reports the fee it actually raised');
      const soldIds = new Set(sold.map((x: any) => x.id));
      ok(!departed.some((x: any) => soldIds.has(x.id)),
         'a man sold to pay the wages is NOT also listed among the contract expiries');
      console.log(`  ..   raised ${sold.reduce((n: number, x: any) => n + x.fee, 0).toLocaleString()}c from ${sold.length} forced sale(s)`);
      console.log(fails ? `\n✗ the squad report describes a fire sale as a routine expiry` : '\n✓ a forced sale is reported as one');
      if (fails) process.exitCode = 1;
      return;
    }
  }

  // Never reached insolvency. Say so loudly rather than passing: an assertion that never ran is not a pass.
  console.log(`  ..   bought ${bought} player(s) across 6 seasons without triggering a forced sale`);
  ok(false, 'the harness drove the club into a forced sale (it did not — this probe measured nothing)');
  console.log('\n✗ could not reproduce insolvency; the probe cannot vouch for anything');
  process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
