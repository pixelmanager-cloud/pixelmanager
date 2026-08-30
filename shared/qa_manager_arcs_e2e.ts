// Simulate whole manager careers THROUGH the arc pipeline — pick, choose, apply — and assert the club
// survives it. The library is 534 authored arcs written by six people in parallel; the risk is not that one
// is malformed (the structural probe covers that) but that the EFFECTS, in aggregate, do something absurd:
// bankrupt every club, or push every dressing room to zero morale, or hand out free money.
import { MANAGER_ARCS, pickManagerArc, managerArcById, applyMorale, type MgrSituation } from './src/managerarc.js';

let fails = 0;
const ok = (n: string, c: boolean, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}${d ? `  (${d})` : ''}`); if (!c) fails++; };

const CAREERS = 600;
let coinSwings: number[] = [], moraleSwings: number[] = [], legacies = 0, tags = 0, beats2 = 0;
let picked = 0;
const endMorale: number[] = [], endCoins: number[] = [];
let repeats = 0, misfits = 0;
for (let c = 0; c < CAREERS; c++) {
  const fired = new Set<string>();
  let coins = 600, morale = 65, board = 0;
  const tagSet = new Set<string>();
  for (let season = 1; season <= 10; season++) {
    const s: MgrSituation = {
      season, tier: 1 + ((c + season) % 9), posFrac: ((c * 7 + season * 13) % 100) / 100,
      coins, hasWonderkid: (c + season) % 3 === 0, hasVeteran: (c + season) % 2 === 0,
      hasUnhappy: morale < 50, squadSize: 14 + ((c + season) % 9), tags: tagSet,
      temper: (['disciplinarian','players-manager','tactician','chancer','builder','firefighter'] as const)[c % 6],
    };
    for (let k = 0; k < 5; k++) {
      const id = pickManagerArc(c * 7919 + k * 31 + season, s, fired);
      if (!id) continue;
      // THE HARNESS HANDED THE PICKER A SITUATION AND A SEEN-LIST AND NEVER ASKED IF IT USED THEM.
      // Mutations that made `arcFits` return true for everything, and that dropped `!fired.has(a.id)` from
      // the picker, both passed all nine checks — the second producing 5.4% repeat picks, which is the
      // arc-library defect from §6 in a different costume. Checked here against the situation directly
      // rather than by re-calling `arcFits`, which would be the filter vouching for itself.
      if (fired.has(id)) repeats++;
      fired.add(id); picked++;
      const arc = managerArcById(id)!;
      {
        const w = arc.when;
        const okNeeds = !w?.needs || (w.needs === 'wonderkid' ? s.hasWonderkid : w.needs === 'veteran' ? s.hasVeteran
          : w.needs === 'unhappy-player' ? s.hasUnhappy : w.needs === 'big-squad' ? s.squadSize >= 20
          : w.needs === 'thin-squad' ? s.squadSize <= 14 : true);
        const okSeason = (w?.minSeason == null || s.season >= w.minSeason) && (w?.maxSeason == null || s.season <= w.maxSeason);
        const okTier = (w?.minTier == null || s.tier >= w.minTier) && (w?.maxTier == null || s.tier <= w.maxTier);
        const okPos = (w?.minPos == null || s.posFrac >= w.minPos) && (w?.maxPos == null || s.posFrac <= w.maxPos);
        const okCoins = (w?.minCoins == null || s.coins >= w.minCoins) && (w?.maxCoins == null || s.coins <= w.maxCoins);
        const okTag = (!w?.requiresTag || s.tags.has(w.requiresTag)) && (!w?.forbidsTag || !s.tags.has(w.forbidsTag));
        const okTemper = !s.temper || ((!arc.temper || arc.temper.includes(s.temper)) && (!w?.temper || w.temper.includes(s.temper)));
        if (!(okNeeds && okSeason && okTier && okPos && okCoins && okTag && okTemper)) misfits++;
      }
      // walk the arc, always taking a deterministic choice, following `next` beats
      let beat = arc.beats[arc.first], depth = 0;
      while (beat && depth < 4) {
        const ch = beat.choices[(c + season + depth) % beat.choices.length];
        const e = ch.effect;
        if (e?.coins) { coins = Math.max(0, coins + e.coins); coinSwings.push(e.coins); }
        if (e?.squadMorale) { morale = applyMorale(morale, e.squadMorale); moraleSwings.push(e.squadMorale); }
        if (e?.boardMood) board += e.boardMood;
        if (e?.tag) { tagSet.add(e.tag); tags++; }
        if (e?.clubLegacy) legacies++;
        if (ch.next && arc.beats[ch.next]) { beat = arc.beats[ch.next]; depth++; beats2++; } else break;
      }
    }
    coins += 400;   // a season's prize money, roughly
  }
  endMorale.push(morale); endCoins.push(coins);
}
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
console.log(`=== ${CAREERS} careers, ${picked} arcs resolved ===`);
console.log(`  coin effects: ${coinSwings.length}, mean ${avg(coinSwings).toFixed(0)}, worst ${Math.min(...coinSwings)} / best ${Math.max(...coinSwings)}`);
console.log(`  morale effects: ${moraleSwings.length}, mean ${avg(moraleSwings).toFixed(1)}`);
console.log(`  club legacies earned: ${legacies} · tags set: ${tags} · second beats reached: ${beats2}`);

ok('no arc fires twice in one career', repeats === 0, `${repeats} of ${picked} picks`);
ok('every arc that fired was applicable to the club it fired at', misfits === 0, `${misfits}/${picked}`);
ok('arcs resolve without crashing', picked > 0, `${picked} resolved`);
ok('coin effects are not a money printer (mean <= +60)', avg(coinSwings) <= 60, avg(coinSwings).toFixed(0));
ok('coin effects are not ruinous (mean >= -120)', avg(coinSwings) >= -120, avg(coinSwings).toFixed(0));
ok('no single coin effect is absurd (|x| <= 1200)', Math.max(...coinSwings.map(Math.abs)) <= 1200, String(Math.max(...coinSwings.map(Math.abs))));
// The mean SWING is a weak proxy — it passed at +2.0 while careers were pinning at the morale ceiling.
// What matters is where a dressing room actually ENDS UP after ten seasons of these arcs.
const pinned = endMorale.filter((m) => m >= 99).length;
const floored = endMorale.filter((m) => m <= 1).length;
console.log(`  end-of-career morale: mean ${avg(endMorale).toFixed(0)}, pinned at 100 in ${Math.round(100 * pinned / CAREERS)}% of careers, at 0 in ${Math.round(100 * floored / CAREERS)}%`);
ok('the dressing room does not pin at the ceiling (< 25% of careers)', 100 * pinned / CAREERS < 25, `${Math.round(100 * pinned / CAREERS)}%`);
ok('nor collapse to the floor (< 15%)', 100 * floored / CAREERS < 15, `${Math.round(100 * floored / CAREERS)}%`);
ok('multi-beat arcs are actually reached', beats2 > 0, `${beats2}`);
ok('permanent club legacies do accrue', legacies > 0, `${legacies}`);
console.log(fails ? `\n✗ ${fails} failure(s)` : '\n✓ the arc pipeline holds up across whole careers');
if (fails) process.exit(1);
