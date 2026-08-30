// Sanity harness for THE LIVING SQUAD lifecycle (shared/src/squad.ts + the squad economics in
// transfermarket.ts). The point of the feature is that a manager's squad LIVES — youth improves,
// veterans fade, deals expire and wages cost money — so these checks guard the properties that make
// that feel true and fair. Pure + deterministic: no rng, no wall-clock.
import { mintSquadPlayer, overall } from './src/teams.js';
import type { Player } from './src/types.js';
import {
  advanceSquad, advanceSquadPlayer, signSquadContract, staggeredContractSeasons, squadSeasonsLeft, squadRetireAge, SQUAD_GROWTH_AGE, squadStorylines,
} from './src/squad.js';
import { squadSaleValue, squadSeasonWage, squadRenewCost, sellValue, SQUAD_PEAK_AGE, SQUAD_CONTRACT_SEASONS } from './src/transfermarket.js';
import { moraleEffects } from './src/morale.js';

let failures = 0;
const check = (cond: boolean, msg: string) => { if (cond) { console.log(`  ok   ${msg}`); } else { console.log(`  FAIL ${msg}`); failures++; } };

console.log('=== 1. a minted squad player is a FULL character ===');
const p = mintSquadPlayer('q1', 'MF', 12, 4242);
const attrKeys = Object.keys(p.attrs);
check(['composure', 'aggression', 'creativity', 'teamwork', 'leadership'].every((k) => (p.attrs as any)[k] != null), 'has the full mental layer');
check((p.attrs as any).durability != null, 'has durability');
check(attrKeys.length >= 15, `has >= 15 stat categories (got ${attrKeys.length})`);
check(!!p.personality, 'has a personality');
check(Array.isArray(p.traits), 'has a traits array');
check(typeof p.age === 'number' && p.age! >= 18 && p.age! <= 33, `has a plausible age (got ${p.age})`);

console.log('=== 2. YOUTH develops, VETERANS decline ===');
const young = { ...mintSquadPlayer('q2', 'FW', 10, 77), age: 20 };
const grown = advanceSquadPlayer(young, 3);
check(grown.age === 21, 'age advances by one season');
check(overall(grown) >= overall(young), `a 20yo does not get worse (${overall(young)} -> ${overall(grown)})`);
const vet = { ...mintSquadPlayer('q3', 'DF', 14, 88), age: 33 };
const faded = advanceSquadPlayer(vet, 1);
check(overall(faded) <= overall(vet), `a 33yo declines (${overall(vet)} -> ${overall(faded)})`);
check((faded.attrs.pace ?? 0) < (vet.attrs.pace ?? 0), 'pace fades first for a veteran');
// a better training ground should grow youth at least as fast
const grownPoor = advanceSquadPlayer(young, 1), grownRich = advanceSquadPlayer(young, 5);
check(overall(grownRich) >= overall(grownPoor), 'a better Training Ground grows youth at least as fast');

console.log('=== 3. contracts run down and expire ===');
const signed = signSquadContract(mintSquadPlayer('q4', 'MF', 12, 99), 5);
check(squadSeasonsLeft(signed, 5) === SQUAD_CONTRACT_SEASONS, 'a fresh deal has its full length left');
check(squadSeasonsLeft(signed, 5 + SQUAD_CONTRACT_SEASONS) === 0, 'the deal is spent once its seasons elapse');
check(squadSeasonsLeft(signed, 999) === 0, 'seasons-left never goes negative');
check(squadSeasonsLeft({ ...signed, signedSeason: undefined, contractSeasons: undefined }, 5) === 0, 'a contract-less player reads as 0 left');

console.log('=== 4. squad economics ===');
const ov = 14;
check(squadSeasonWage(ov) > 0, 'a squad player costs a real per-season wage');
check(squadRenewCost(ov) === squadSeasonWage(ov) * SQUAD_CONTRACT_SEASONS, 'renewing costs wage x length');
check(squadSaleValue(ov, 24) === sellValue(ov), 'a player at his peak sells for the full value');
check(squadSaleValue(ov, 34) < squadSaleValue(ov, 28), 'an older player sells for less');
check(squadSaleValue(ov, 60) >= Math.round(sellValue(ov) * 0.2), 'sale value has a floor (never free)');
check(squadSaleValue(ov, SQUAD_PEAK_AGE) === sellValue(ov), 'the fade starts only AFTER the peak age');

console.log('=== 5. a whole-squad rollover ===');
const squad = Array.from({ length: 8 }, (_, i) => signSquadContract({ ...mintSquadPlayer(`s${i}`, 'MF', 11, 1000 + i), age: 22 + i * 2 }, 1));
const roll = advanceSquad(squad, 1, 2);
check(roll.wageBill > 0, 'the squad costs a wage bill each season');
check(roll.changes.length === squad.length, 'every player gets a change record');
// full conservation: everyone who started either stayed, retired, or left on an expired deal — and any
// player in the new squad who wasn't there before must be an academy intake (nobody appears from nowhere)
check(roll.players.length - roll.intake.length + roll.retired.length + roll.departed.length === squad.length,
  'nobody vanishes or appears: stayed + retired + departed == started, and every newcomer is an intake');
const startIds = new Set(squad.map((p) => p.id));
check(roll.players.every((p) => startIds.has(p.id) || roll.intake.some((k) => k.id === p.id)), 'every new face is an academy intake');
check(roll.players.length >= Math.min(squad.length, 14), 'the squad never falls below a fieldable size (PT-300)');
check(roll.players.every((x) => (x.age ?? 0) > 0), 'everyone who stayed has an age');
check(roll.retired.every((x) => (x.age ?? 0) >= squadRetireAge(x)), 'only players at their retirement age retire');
// determinism: the same squad rolled twice gives the identical result
const rollAgain = advanceSquad(squad, 1, 2);
check(JSON.stringify(roll) === JSON.stringify(rollAgain), 'the rollover is deterministic (same in = same out)');
// the rollover must not mutate its input
check(squad.every((x, i) => x.age === 22 + i * 2), 'the rollover does not mutate the squad it was given');

console.log('=== 6. a squad ROTS if you never refresh it ===');
let aging: Player[] = Array.from({ length: 6 }, (_, i) => ({ ...mintSquadPlayer(`r${i}`, 'DF', 13, 500 + i), age: 29 }));
const startOv = aging.reduce((s, x) => s + overall(x), 0) / aging.length;
for (let s = 1; s <= 6; s++) aging = advanceSquad(aging, s, 1).players;
const endOv = aging.length ? aging.reduce((s, x) => s + overall(x), 0) / aging.length : 0;
check(aging.length < 6 || endOv < startOv, `an unrefreshed squad decays or retires away (${startOv.toFixed(1)} -> ${endOv.toFixed(1)}, ${aging.length}/6 left)`);

console.log('=== 6b. the squad can never decay into an unfieldable state (PT-300/PT-302) ===');
{
  // sign them the way the GAME does — staggered lengths, so deals don't all expire in the same summer
  let sq = Array.from({ length: 20 }, (_, i) => {
    const p = { ...mintSquadPlayer(`d${i}`, (['GK','DF','MF','FW'] as const)[i % 4], 9, 700 + i), age: 27 + (i % 8) };
    return signSquadContract(p, 1, staggeredContractSeasons(p.id));
  });
  let minSeen = 99, worstExodus = 0;
  for (let s = 1; s <= 15; s++) {
    const r = advanceSquad(sq, s, 1, { xi: new Set(sq.slice(0, 11).map((p) => p.id)), quality: 9 });
    sq = r.players; minSeen = Math.min(minSeen, sq.length); worstExodus = Math.max(worstExodus, r.departed.length);
  }
  check(minSeen >= 14, `15 neglected seasons never drop the squad below a fieldable size (low was ${minSeen})`);
  check(worstExodus <= 8, `contracts are staggered — no single-season mass exodus (worst was ${worstExodus})`);
}

console.log('=== 7. morale responds to how the manager treats them (Phase 3) ===');
const m1 = mintSquadPlayer('m1', 'MF', 12, 31);
check((m1.morale ?? 0) > 0, 'a minted squad player starts with morale');
const benchedSquad = [signSquadContract({ ...m1, age: 24 }, 1)];
const played = advanceSquad(benchedSquad, 1, 1, { xi: new Set(['m1']), goodSeason: true }).changes[0];
const ignored = advanceSquad(benchedSquad, 1, 1, { xi: new Set<string>(), goodSeason: true }).changes[0];
check(played.moraleAfter > ignored.moraleAfter, `playing a man beats ignoring him (${played.moraleAfter} vs ${ignored.moraleAfter})`);
const won = advanceSquad(benchedSquad, 1, 1, { xi: new Set(['m1']), goodSeason: true, wonSomething: true }).changes[0];
check(won.moraleAfter >= played.moraleAfter, 'winning something lifts the dressing room');
check(moraleEffects(ignored.moraleAfter).extendMult >= moraleEffects(played.moraleAfter).extendMult, 'an unhappier player costs more to re-sign');

console.log('=== 8. traits actually bite (Phase 3) ===');
let withTrait = 0, checkedTraits = 0;
for (let i = 0; i < 40; i++) {
  const p2 = mintSquadPlayer(`t${i}`, 'FW', 16, 900 + i);
  if (p2.traits?.includes('clinical')) { withTrait++; checkedTraits += (p2.attrs.shooting ?? 0); }
}
check(withTrait > 0, `some high-quality forwards earn a trait (${withTrait}/40 clinical)`);
check(withTrait === 0 || checkedTraits / withTrait >= 15, 'a Clinical Finisher really does have elite shooting (the trait bumped the stat)');

console.log('=== 9. squad storylines are earned, varied and deterministic (Phase 4) ===');
const storySquad = Array.from({ length: 14 }, (_, i) => signSquadContract({ ...mintSquadPlayer(`z${i}`, (['GK','DF','MF','FW'] as const)[i % 4], 8 + (i % 7), 6000 + i), age: 18 + (i * 17) % 16 }, 1));
const zxi = new Set(storySquad.slice(0, 11).map((p) => p.id));
const rollA = advanceSquad(storySquad, 2, 2, { xi: zxi, goodSeason: true });
const linesA = squadStorylines(rollA, 2);
const linesB = squadStorylines(advanceSquad(storySquad, 2, 2, { xi: zxi, goodSeason: true }), 2);
check(JSON.stringify(linesA) === JSON.stringify(linesB), 'storylines are deterministic (same season = same story)');
check(linesA.length <= 3, `storylines stay rare (${linesA.length} <= 3 a season)`);
check(new Set(linesA.map((l) => l.slice(l.indexOf(' ')))).size === linesA.length || linesA.length < 2, 'no two players get the same sentence in one season');
check(linesA.every((l) => /[.!]$/.test(l)), 'every storyline is a complete sentence');
// a settled squad in a quiet season should not manufacture drama
const calm = advanceSquad([signSquadContract({ ...mintSquadPlayer('calm', 'MF', 12, 4), age: 27, morale: 65 }, 1)], 1, 1, { xi: new Set(['calm']), goodSeason: true });
check(squadStorylines(calm, 1).length === 0, 'an ordinary season for an ordinary player produces no story');

console.log(failures ? `\n✗ ${failures} squad-lifecycle check(s) failed` : '\n✓ all squad-lifecycle checks passed');
process.exit(failures ? 1 : 0);
