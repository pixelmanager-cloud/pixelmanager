// CAN A PLAYER AT THE BOTTOM OF THE PYRAMID EVER HAVE A TRAIT?
//
// He could not. `eligibleTraits` reads ABSOLUTE attributes, so a squad minted at low quality cleared no
// gate at all: measured over 500 mints per level, players with at least one trait ran 0.0% at quality 4
// and 6, 7.0% at 8 and 29.4% at 10, against 100% from 14 up. The whole trait layer was invisible for the
// bottom of the pyramid -- which is where every dynasty starts and where a new player spends his first
// hours. (CK's call, 2026-09-02: make eligibility relative to tier.)
//
// Eligibility now scales a player's attributes against his own squad's level before testing the gates.
// Scaling every attribute by one factor leaves his SHAPE untouched, so he still qualifies only for what he
// is genuinely best at; what changes is that "best at this level" can clear a gate at all.
import { mintSquadPlayer } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const ROLES: any[] = ['DF', 'MF', 'FW', 'GK'];

const rate = (q: number) => {
  let withTrait = 0; const N = 400;
  for (let i = 0; i < N; i++) {
    const p: any = mintSquadPlayer(`tr${i}`, ROLES[i % 4], q, 9000 + i);
    if ((p.traits ?? []).length > 0) withTrait++;
  }
  return withTrait / N;
};

console.log('=== Traits reach the bottom of the pyramid ===');
const low = rate(5), mid = rate(10), top = rate(16);
console.log(`  quality 5: ${(100 * low).toFixed(1)}%   quality 10: ${(100 * mid).toFixed(1)}%   quality 16: ${(100 * top).toFixed(1)}%`);
ok(low > 0.10, `a basement squad has a visible trait layer (${(100 * low).toFixed(1)}% of players, was 0.0%)`);
// The other half of the bar, and the reason the scaling is partial. Closing the gap completely made a
// basement squad MORE trait-rich than a mid-table one, which erases the difference between divisions.
ok(low < mid, `but a basement squad is still poorer in traits than a mid-table one (${(100 * low).toFixed(1)}% vs ${(100 * mid).toFixed(1)}%)`);
ok(mid < top, `and mid-table is poorer than the top flight (${(100 * mid).toFixed(1)}% vs ${(100 * top).toFixed(1)}%)`);
ok(top > 0.90, `climbing still ends with a squad where a trait is normal (${(100 * top).toFixed(1)}%)`);
console.log(fails ? `\n✗ ${fails} trait-reach check(s) failed` : `\n✓ traits exist at the bottom and still reward the climb`);
if (fails) process.exitCode = 1;
