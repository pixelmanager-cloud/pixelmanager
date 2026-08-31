// ── DOES THE TRAIT A PLAYER EARNS ACTUALLY REACH HIM? ────────────────────────────────────────────────
//
// Both trait call sites take `.slice(0, MAX_TRAITS)` off the front of `eligibleTraits`, so whatever sits
// earliest in the TRAITS catalogue wins — and the catalogue is ordered by nothing in particular. `wall`
// is ninth, behind `metronome` (passing) and `leader` (leadership), which a good keeper also qualifies
// for. Measured before the fix, over 4,200 generated keepers: 71.3% were ELIGIBLE for The Wall and only
// 59.9% of them got it, and the effect INVERTED with quality — elite keepers (quality >= 15) held it just
// 21.7% of the time. The better the goalkeeper, the less likely he was to have the goalkeeping trait.
//
// That was a live effect, not a cosmetic one: the match engine reads `hasTrait(gk, 'wall')` directly when
// resolving a shot, and trait `apply` hooks bump real stats. It is also the defect class this project is
// full of — a mechanism that runs, produces a plausible-looking result, and never delivers the thing it
// exists to deliver. Nothing measured it because every existing gate asked whether traits were WELL-FORMED
// (ids exist, casing is right, lists are handled) and none asked whether the right player ends up with one.
//
// This asserts the property directly, per role, against the generator the game actually ships.
import { generateClub } from '../../shared/src/teams.js';
import { eligibleTraits, type CareerPlayerAttrs } from '../../shared/src/career.js';
import type { Role } from '../../shared/src/types.js';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// the trait the engine or the fantasy most associates with each role
const SIGNATURE: Record<Role, string> = { GK: 'wall', DF: 'rock', MF: 'metronome', FW: 'clinical' };
const stats: Record<string, { el: number; has: number; elite: number; eliteHas: number }> = {};
for (const r of Object.keys(SIGNATURE) as Role[]) stats[r] = { el: 0, has: 0, elite: 0, eliteHas: 0 };

for (let q = 6; q <= 19; q++) {
  for (let s = 0; s < 60; s++) {
    // `rich` — the mint the shipped game uses for the manager's squad AND (since PT-305) for opponents.
    // Passing false here would silently measure the 10-stat filler path, which has no traits at all and
    // would make every bar below pass vacuously. That mistake was made once while finding this.
    const club = generateClub('t', 'T', 1, q, s * 7919 + q, true);
    for (const p of club.players) {
      const sig = SIGNATURE[p.role];
      if (!sig) continue;
      const el = eligibleTraits(p.attrs as unknown as CareerPlayerAttrs, [], p.role);
      if (!el.some((t) => t.id === sig)) continue;
      const st = stats[p.role];
      st.el++;
      const has = (p.traits ?? []).includes(sig);
      if (has) st.has++;
      if (q >= 15) { st.elite++; if (has) st.eliteHas++; }
    }
  }
}

for (const r of Object.keys(SIGNATURE) as Role[]) {
  const st = stats[r], sig = SIGNATURE[r];
  if (!st.el) { check(false, `no ${r} was ever eligible for '${sig}' — this probe is measuring nothing`); continue; }
  const rate = st.has / st.el;
  const eliteRate = st.elite ? st.eliteHas / st.elite : 1;
  console.log(`  ${r}: eligible for '${sig}' ${st.el}, holds it ${st.has} (${(100 * rate).toFixed(1)}%), elite ${(100 * eliteRate).toFixed(1)}%`);
  check(rate >= 0.9, `a ${r} who qualifies for '${sig}' actually gets it (${(100 * rate).toFixed(1)}%)`);
  // THE INVERSION IS THE REAL BUG. A flat pass-rate could still hide it, so assert that quality does not
  // make a player LESS likely to hold his own signature trait.
  check(eliteRate >= rate - 0.05,
    `a BETTER ${r} is not less likely to hold '${sig}' than an average one (elite ${(100 * eliteRate).toFixed(1)}% vs ${(100 * rate).toFixed(1)}%)`);
}

console.log(fails
  ? `\n✗ ${fails} trait-relevance check(s) failed — an earned trait is not reaching the player who earned it`
  : '\n✓ the trait a player earns reaches him, and quality does not crowd it out');
if (fails) process.exit(1);
