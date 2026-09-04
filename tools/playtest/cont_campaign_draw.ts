// A CONTINENTAL CAMPAIGN IS ONE BRACKET, NOT THREE RAFFLES.
//
// `contOpponent` drew every round from `hash32(seed, season * 977 + 41, r * 131)` with no memory of the
// rounds already played, so the club the player knocked out in the quarter-final could be standing in the
// final of the SAME knockout. Measured over 40,000 campaigns: 9,915 of them — 24.79% — repeated a club, and
// every repeat was quarter-final vs final; QF-vs-SF and SF-vs-Final never once collided. That is not the
// ~9.8% chance would give three uniform draws from a 30-name pool, it is structural. `r * 131` is 0, 131,
// 262, so the semi-final's hash input differs from the other two in bit 0; hash32 ends on
// `Math.imul(h ^ x, 16777619)` and an odd multiplier carries bit 0 of the input into bit 0 of the result;
// and `% 30`, an even modulus, preserves that parity. The semi-final is therefore drawn from 15 residues
// the quarter-final can never occupy and the final from the 15 it always occupies — QF==Final at 7.4x a
// uniform draw, and the only pairing in the competition that can repeat at all.
//
// THE POOL IS MODULE-PRIVATE, so the broken draw cannot just be imported and re-run as a control. It is
// RECONSTRUCTED instead: round 0 has no earlier round to avoid, so `contOpponent(seed, season, 0)` stays
// exactly `POOL[h % POOL.length]` whatever the fix does, and sweeping it recovers the pool, its length and
// its order. That reconstruction has to fill every index unambiguously before anything below it is allowed
// to run — a probe that cannot rebuild the model FAILS rather than quietly measuring nothing.
//
// MUTATION CONTROL: that reconstructed independent draw IS the defect, on purpose. If it does not come back
// with a quarter of its campaigns repeating a club, the assertion under it is decoration that would go green
// over any draw at all. (A repeat is index equality, so recovering the pool in the wrong ORDER could not
// fake the control — only the LENGTH moves the number, and the length is what the round-0 replay pins.)
// The zero-repeat assertion itself is mutation-tested by the pre-fix tree, where it reads 9,915 of 40,000.
//
// Run: `npx tsx tools/playtest/cont_campaign_draw.ts`
import { contOpponent, type ContRound } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== One continental campaign, one club per round ===');

const SEEDS = 2000, SEASONS = 20;
const ROUNDS: ContRound[] = [0, 1, 2];
const saveSeed = (k: number) => (Math.imul(k + 1, 2654435761) ^ 0x9e3779b9) >>> 0;

/** intl.ts's own FNV-1a, so the reconstruction hashes exactly what the shipped draw hashes. */
function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const drawHash = (seed: number, season: number, r: number) => hash32(seed, season * 977 + 41, r * 131);

// ── Rebuild the pool out of the round-0 draws (see header) ────────────────────────────────────────
const obs: Array<{ h: number; name: string }> = [];
const pool = new Set<string>();
for (let k = 0; k < SEEDS; k++) for (let season = 1; season <= SEASONS; season++) {
  const seed = saveSeed(k), name = contOpponent(seed, season, 0).oppName;
  obs.push({ h: drawHash(seed, season, 0), name }); pool.add(name);
}
const L = pool.size;
const table: string[] = new Array(L);
let sound = L > 0;
for (const { h, name } of obs) {
  const i = h % L;
  if (table[i] === undefined) table[i] = name; else if (table[i] !== name) sound = false;
}
if (table.some((n) => n === undefined)) sound = false;
ok(sound, `the round-0 draw reconstructs — ${L} pool name(s) recovered over ${obs.length} draws, every index filled, none ambiguous`);

if (sound) {
  const model = (seed: number, season: number, r: ContRound) => table[drawHash(seed, season, r) % L];

  let campaigns = 0, shippedRepeat = 0, modelRepeat = 0, clean = 0, churn = 0, firstRepeat = '';
  const perRound = [new Set<string>(), new Set<string>(), new Set<string>()];
  for (let k = 0; k < SEEDS; k++) for (let season = 1; season <= SEASONS; season++) {
    const seed = saveSeed(k);
    const shipped = ROUNDS.map((r) => contOpponent(seed, season, r).oppName);
    const drawn = ROUNDS.map((r) => model(seed, season, r));
    campaigns++;
    ROUNDS.forEach((r) => perRound[r].add(shipped[r]));
    if (new Set(shipped).size < ROUNDS.length) {
      shippedRepeat++;
      if (!firstRepeat) firstRepeat = `seed ${seed} season ${season}: ${shipped.join(' / ')}`;
    }
    // A campaign the old draw already got right must come out of the new one unchanged, so a save part-way
    // through a run keeps the quarter-final and semi-final opponents it was already shown.
    if (new Set(drawn).size < ROUNDS.length) modelRepeat++;
    else { clean++; if (shipped.join('|') !== drawn.join('|')) churn++; }
  }

  console.log(`  ..   ${campaigns} campaign(s) over ${SEEDS} save seeds x ${SEASONS} seasons`);
  console.log(`  ..   independent-draw model repeats a club in ${modelRepeat} (${(modelRepeat / campaigns * 100).toFixed(2)}%); the shipped draw in ${shippedRepeat}`);
  ok(modelRepeat > campaigns * 0.2,
     `the measurement can see the defect at all — the pre-fix independent draw repeats a club in ${(modelRepeat / campaigns * 100).toFixed(2)}% of campaigns`);
  ok(shippedRepeat === 0,
     `no campaign puts a club it already played back in a later round (${shippedRepeat} of ${campaigns}${firstRepeat ? ' — e.g. ' + firstRepeat : ''})`);
  ok(clean > 0, 'campaigns the old draw already got right exist (the no-churn guard is not measuring an empty set)');
  ok(churn === 0,
     `and one of those is drawn exactly as before — a save mid-run keeps the opponents it was shown (${churn} of ${clean} changed)`);
  console.log(`  ..   names reaching each round: ${perRound.map((s) => s.size).join(' / ')} of ${L}`);
  ok(perRound.every((s) => s.size === L),
     `every round still reaches the whole pool (${perRound.map((s) => s.size).join('/')} of ${L}) — the clash is stepped around, not solved by pinning a round to fewer clubs`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the continental bracket is not one bracket` : '\n✓ every continental campaign is three different clubs, and the clean ones are untouched');
if (fails) process.exitCode = 1;
