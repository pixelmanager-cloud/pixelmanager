// EVERY SAVE IN THE GAME WAS OFFERED THE SAME THREE WALK-UPS, IN THE SAME ORDER.
//
// The Local Tryouts pool is seeded on `${accountId}:${season}:${tier}` (shared/src/scouting.ts), and the
// facade handed it `OWNER` — the constant string 'local' — alongside the constant `TIER`. The season
// number was therefore the ONLY world-varying input, so every dynasty on every machine opened season 0 on
// Felix Costa / Dario Rossi / Idris Mensah and season 1 on Enzo Rossi (GK, 9) against a founding roster
// minted at quality 6. Free squad additions — `signTrial` costs no coins — dealt from a table anybody
// could publish, in the one place the game hands a save something for nothing.
//
// The ENGINE was never the defect: shared/qa_scouting.ts already varies accountId and gets a different
// pool every time, and passed all the way through. What nothing measured was the WIRING — whether the
// facade hands the generator anything that varies per save. So this drives the real facade, because that
// is the only place the defect ever lived.
//
// MUTATION TEST — each must turn a line below red: put `OWNER` back at the `generatePool` call in
// `trials` (check 2); put it back at the `trialistAt` call in `signTrial` only (check 4 — a half-applied
// fix shows one man on the card and signs another); seed the pool on something that is not stable for a
// save, e.g. `Math.random()`, and check 3 goes red. Check 1 is what stops the rest being green ticks over
// nothing: if `trials()` ever returned an empty pool, every save's triple would be the empty string, and
// check 2 fails loudly rather than passing vacuously.
//
// Run: `npx tsx tools/playtest/tryouts_world.ts`
import { api, setToken, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';

// Twelve saves identical in every input the pool is ALLOWED to read — same club name, same world seed,
// same default facilities, same season 0 — differing only in which save they are. Twelve rather than two
// because two could collide by luck; twelve identical triples cannot be luck.
const SLOTS = Array.from({ length: 12 }, (_, i) => `probe-tryouts-${i}`);
const WORLD = 424242;

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const card = (p: { name: string; role: string }) => `${p.name} (${p.role})`;
const triple = (pool: { name: string; role: string }[]) => pool.map(card).join(' · ');

async function main() {
  __setBackendForTests(createInMemoryBackend());
  const pools = new Map<string, string>();
  for (const slot of SLOTS) {
    // the fifth argument is save.ts's declared harness seam for pinning a slot id (production passes none)
    await api.register('ignored', 'ignored', 'Probe FC', WORLD, slot);
    pools.set(slot, triple((await api.trials()).pool));
  }

  const screen = await api.trials();
  console.log(`  ..   ${SLOTS.length} saves, season ${screen.season}, ${screen.pool.length} walk-up(s) each`);
  for (const slot of SLOTS.slice(0, 3)) console.log(`  ..   ${slot}: ${pools.get(slot)}`);

  // 1 — there is something to compare at all.
  ok(screen.pool.length > 0, 'the Local Tryouts pool offers at least one walk-up — the checks below are not measuring an empty list');

  // 2 — the defect itself. Twelve saves, twelve different sets of walk-ups.
  const distinct = new Set(pools.values());
  ok(distinct.size === SLOTS.length,
    `each save gets its OWN walk-ups (${distinct.size}/${SLOTS.length} distinct) — a constant seed hands every dynasty in the game the same three men`);

  // 3 — and per save they are still FIXED. A pool that is merely random is a pool that changes under the
  //     player between two openings of the same screen, and a save that cannot be replayed.
  setToken(SLOTS[0]);
  const reopened = triple((await api.trials()).pool);
  ok(reopened === pools.get(SLOTS[0]),
    'reopening a save shows that save the same walk-ups — the pool is per-save, not merely random');

  // 4 — the card is the man. `trials` and `signTrial` roll the pool independently, so they must be given
  //     the same world handle; seed one and not the other and the player signs someone he never saw.
  setToken(SLOTS[1]);
  const shown = (await api.trials()).pool[0];
  const got = (await api.signTrial(0)).player;
  ok(card(got) === card(shown), `signing the first walk-up signs the man on his card (card ${card(shown)}, signed ${card(got)})`);

  console.log(fails
    ? `\n✗ ${fails} tryouts check(s) failed — the free squad-addition path is not part of this save's world`
    : '\n✓ every save is offered its own walk-ups, and the same ones every time it looks');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
