// ── WHAT THIS GUARDS: shared/src/facilities.ts — the twelve-facility upgrade ladder ──────────────────
//
// 30 of this module's 35 exports had never been imported by a harness: the worst-covered file in the repo,
// and the most re-litigated. §7, §9, §28 and §58 of docs/decisions-for-ck.md all argue about it, and §58
// records that one of those arguments was a MISREADING — "nine of twelve facilities produce bit-identical
// seasons" measured league SCORELINES, and only three facilities are wired to a scoreline by design. A
// Club Shop is not supposed to change a scoreline. It is supposed to change the treasury.
//
// So this file does the check nobody has ever written. For each of the twelve facilities it names, ONCE,
// the quantity that facility is supposed to move (§1, the CENSUS), and then requires that quantity to move
// monotonically across the WHOLE level ladder, L1 → MAX_LEVEL, at every division in the pyramid — and
// requires the other eleven components to hold still while it does. That converts "does the facility do
// anything?" from a scoreline question, which is the wrong question, into a per-facility question with a
// right answer.
//
// The three claims the module makes about itself, all of which have failed at least once already:
//
//   1. LEVEL 1 IS THE NEUTRAL BASELINE — "every facility pays nothing" at L1. `stadiumIncome` paid ~1,000
//      a season at L1 and it was called a calibration bug. So L1 neutrality is checked for every income
//      function across the whole tier × record × trophy × marketability grid, and for every multiplier as
//      an exact identity, not an approximation.
//   2. NOTHING IS UNBOUNDED. `injuryChanceMult` was a straight line written for a five-level cap; when
//      MAX_LEVEL went to 10 it CROSSED ZERO at level 8 and made injuries mathematically impossible. The
//      sponsorship trophy term was linear and unbounded and reached 46,123 coins a season. Four of the
//      surviving multipliers are still straight lines written for the old cap, so every one of them is
//      checked for its sign and its band at MAX_LEVEL, not at L5.
//   3. NO LADDER INVERSION. A cost ladder that dips, a refund worth more than the level, an upgrade that
//      leaves you poorer.
//
// AND THE CARDS MUST MATCH THE FUNCTIONS. `effectAt` promised "≈ 200–705 coins per match" for a stadium
// that returned 0; the fix was to derive the string from the function. One case still inlines a constant
// (`sponsor`, `60 * (level - 1)`), which is the same defect one function away from the scar tissue that
// documents it, so §9 gates the card's number against the function that actually pays it.
//
// HOUSE RULE, following shared/qa_mental.ts: the section marked MEASURED is deliberately NOT gated.
// Those are defects found while writing this file. Pinning today's behaviour would turn this harness red
// the day somebody FIXES one, and run-qa.mjs auto-globs, so a red file here blocks `npm run qa` for
// everyone. They are recomputed on every run so they cannot rot quietly, and they are written up.
import {
  FACILITY_KEYS, FACILITY_META, MAX_LEVEL, MAX_DISREPAIR, MOTHBALL_REFUND, UPKEEP_COEFF, DIVISION_MERIT,
  DEFAULT_FACILITIES, facLevel, upgradeCost, mothballRefund, facilityUpkeep, UPKEEP_WEIGHT, seasonUpkeep,
  facilityToDowngrade, applyDisrepair, effectAt, facilityLevelStory, seasonFacilityIncome,
  stadiumIncome, sponsorIncome, shopIncome, womensIncome, squadMarketability,
  trainingConditioning, youthPoolBonus, youthUpgradeChance, scoutHitMult, scoutCostDiscount,
  scoutExtraTrips, injuryChanceMult, recoveryCut, fanHomeBoost, fanIncomeMult, dataEdge, dormIntakeBonus,
  type Facilities, type FacilityKey,
} from './src/facilities.js';
import { MANAGER_ARCS, arcFits, type ManagerArc, type MgrSituation } from './src/managerarc.js';
import { rollMatchInjuries } from './src/injuries.js';
import { generateTeam } from './src/teams.js';
import { TIERS, seasonFixtures } from './src/clubseason.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
const TIER_IDXS = Array.from({ length: TIERS }, (_, i) => i);              // 0 = basement … 9 = top flight
/** Season records that sum to the 18 fixtures `seasonFixtures` actually returns. Fixed, not sampled. */
const RECORDS = [
  { wins: 18, draws: 0, losses: 0 }, { wins: 12, draws: 3, losses: 3 }, { wins: 6, draws: 6, losses: 6 },
  { wins: 2, draws: 4, losses: 12 }, { wins: 0, draws: 0, losses: 18 }, { wins: 9, draws: 0, losses: 9 },
];
const TROPHY_COUNTS = [0, 1, 5, 20, 200];
const MARKETABILITIES = [1, 5, 10, 15, 20];
const at = (over: Partial<Record<FacilityKey, number>>): Facilities =>
  ({ ...DEFAULT_FACILITIES, ...over });
const allAt = (n: number): Facilities =>
  Object.fromEntries(FACILITY_KEYS.map((k) => [k, n])) as unknown as Facilities;
const fmt = (n: number) => n.toLocaleString('en-US');

// ── §1  THE CENSUS — which quantity is each facility supposed to move? ───────────────────────────────
// This table is the thing §58 says was missing from every previous argument about this module. One row
// per QUANTITY (a facility may move more than one), naming the level-1 value the module documents as
// neutral, the direction it must move, and the band it must stay inside at MAX_LEVEL. `probe` measures
// the quantity as the GAME reads it — through `seasonFacilityIncome` for the five that pay money, through
// `injuries.ts` for the Medical Centre, through `arcFits` for the Community Trust, whose only wiring is
// content. Asserting `shopIncome(5,4) === 310` proves arithmetic; it does not prove anyone calls it.
type Dir = 'up' | 'down';
interface Row {
  key: FacilityKey; quantity: string; dir: Dir; strict: boolean;
  /** the value at level 1 that the module documents as neutral */
  neutral: number;
  /** inclusive band the quantity must stay inside at every level, MAX_LEVEL included */
  band: [number, number];
  probe: (level: number) => number;
}
/** The whole season's facility income with exactly one facility raised — the end-to-end read. */
const income = (k: FacilityKey, level: number, tierIdx: number, rec = RECORDS[1], troph = 0, mkt = 10) =>
  seasonFacilityIncome(at({ [k]: level }), tierIdx, troph, mkt, rec);
/** A fixed XI, rolled for injuries over a fixed span of seeded matches. Deterministic. */
const injuryRun = (medicalLevel: number) => {
  const team = generateTeam('qa', 'QA', 0, 12, 4242);
  const fit = team.players.map((_, i) => 0.55 + (i % 5) * 0.05);
  let hurt = 0, worst = 0, totalMatches = 0;
  for (let s = 1; s <= 900; s++) {
    for (const inj of rollMatchInjuries(team, fit, medicalLevel, s)) {
      hurt++; totalMatches += inj.matches; worst = Math.max(worst, inj.matches);
    }
  }
  return { hurt, worst, totalMatches };
};
const arcSit = (a: ManagerArc, facilities: Record<string, number>): MgrSituation => {
  const w = a.when ?? {};
  return {
    season: w.minSeason ?? w.maxSeason ?? 5,
    tier: w.minTier ?? (w.maxTier != null ? w.maxTier : 5),
    posFrac: w.minPos ?? (w.maxPos != null ? w.maxPos : 0.5),
    coins: w.minCoins ?? (w.maxCoins != null ? w.maxCoins : 500),
    hasWonderkid: true, hasVeteran: true, hasUnhappy: true,
    squadSize: w.needs === 'big-squad' ? 22 : w.needs === 'thin-squad' ? 13 : 17,
    tags: new Set(w.requiresTag ? [w.requiresTag] : []),
    temper: (a.temper ?? w.temper)?.[0],
    facilities,
  };
};
const FACILITY_GATED_ARCS = MANAGER_ARCS.filter((a) => a.when?.facility);
/** How many manager arcs this facility has unlocked by `level` — measured through the real gate. */
const arcsUnlocked = (key: FacilityKey, level: number) =>
  FACILITY_GATED_ARCS.filter((a) => a.when!.facility!.key === key && arcFits(a, arcSit(a, { [key]: level }))).length;

const CENSUS: Row[] = [
  { key: 'stadium',  quantity: 'season gate receipts',        dir: 'up',   strict: true,  neutral: 0, band: [0, 4000],   probe: (l) => income('stadium', l, 9).gate },
  { key: 'training', quantity: 'fitness-drain multiplier',    dir: 'down', strict: true,  neutral: 1, band: [0.3, 1],    probe: trainingConditioning },
  { key: 'youth',    quantity: 'extra tryout slots',          dir: 'up',   strict: false, neutral: 0, band: [0, 6],      probe: youthPoolBonus },
  { key: 'youth',    quantity: 'tryout upgrade chance',       dir: 'up',   strict: true,  neutral: 0, band: [0, 1],      probe: youthUpgradeChance },
  { key: 'scouting', quantity: 'scout hit multiplier',        dir: 'up',   strict: true,  neutral: 1, band: [1, 2],      probe: scoutHitMult },
  { key: 'scouting', quantity: 'trip-cost discount',          dir: 'up',   strict: true,  neutral: 0, band: [0, 0.95],   probe: scoutCostDiscount },
  { key: 'scouting', quantity: 'extra trips per season',      dir: 'up',   strict: false, neutral: 0, band: [0, 6],      probe: scoutExtraTrips },
  { key: 'medical',  quantity: 'injury-chance multiplier',    dir: 'down', strict: true,  neutral: 1, band: [0.05, 1],   probe: injuryChanceMult },
  { key: 'medical',  quantity: 'recovery matches shaved',     dir: 'up',   strict: false, neutral: 0, band: [0, 2],      probe: recoveryCut },
  { key: 'sponsor',  quantity: 'season sponsorship income',   dir: 'up',   strict: true,  neutral: 0, band: [0, 40000],  probe: (l) => income('sponsor', l, 9, RECORDS[1], 20).sponsor },
  { key: 'fanzone',  quantity: 'home attacking edge',         dir: 'up',   strict: true,  neutral: 1, band: [1, 1.5],    probe: fanHomeBoost },
  { key: 'fanzone',  quantity: 'gate multiplier',             dir: 'up',   strict: true,  neutral: 1, band: [1, 2.5],    probe: fanIncomeMult },
  { key: 'data',     quantity: 'tight-match edge',            dir: 'up',   strict: true,  neutral: 0, band: [0, 0.3],    probe: dataEdge },
  { key: 'shop',     quantity: 'season shop income',          dir: 'up',   strict: true,  neutral: 0, band: [0, 4000],   probe: (l) => income('shop', l, 9).shop },
  { key: 'dorm',     quantity: 'extra academy intake places', dir: 'up',   strict: false, neutral: 0, band: [0, 6],      probe: dormIntakeBonus },
  { key: 'women',    quantity: "season women's income",       dir: 'up',   strict: true,  neutral: 0, band: [0, 4000],   probe: (l) => income('women', l, 9).womens },
  { key: 'community',quantity: 'manager arcs unlocked',       dir: 'up',   strict: false, neutral: 0, band: [0, 40],     probe: (l) => arcsUnlocked('community', l) },
];

console.log('=== 1. THE CENSUS — every facility names the quantity it moves, and moves it ===');
{
  const covered = new Set(CENSUS.map((r) => r.key));
  ok('every facility in FACILITY_KEYS declares a quantity',
    FACILITY_KEYS.every((k) => covered.has(k)),
    `missing: ${FACILITY_KEYS.filter((k) => !covered.has(k)).join(', ') || 'none'}`);
  ok('the census names no facility the game does not have',
    CENSUS.every((r) => (FACILITY_KEYS as string[]).includes(r.key)));
  ok('twelve facilities, ten levels, and DEFAULT_FACILITIES starts every one of them at 1',
    FACILITY_KEYS.length === 12 && MAX_LEVEL === 10
    && FACILITY_KEYS.every((k) => DEFAULT_FACILITIES[k] === 1),
    `${FACILITY_KEYS.length} keys, MAX_LEVEL ${MAX_LEVEL}`);
  // THE HOOK-THAT-CANNOT-FIRE CHECK. Every declared quantity must be measurably different at MAX_LEVEL
  // from what it is at L1. A facility whose probe returns the same number at both ends is decorative —
  // which is precisely what ten of the twelve were before the income roll was wired.
  const dead = CENSUS.filter((r) => r.probe(1) === r.probe(MAX_LEVEL));
  ok('no facility is decorative — every declared quantity differs at L1 vs L10',
    dead.length === 0, dead.map((r) => `${r.key}:${r.quantity}`).join(', ') || `${CENSUS.length} quantities all live`);
  // And the Medical Centre end-to-end, through injuries.ts rather than through its own formula.
  const l1 = injuryRun(1), l10 = injuryRun(MAX_LEVEL);
  ok('injuries.ts really reads the Medical Centre level',
    l10.hurt < l1.hurt && l1.hurt > 50, `${l1.hurt} injuries at L1 → ${l10.hurt} at L10 over 900 matches`);
  ok('a maxed Medical Centre does not delete injuries (the L8 sign-flip scar)',
    l10.hurt > 0 && injuryChanceMult(MAX_LEVEL) > 0, `${l10.hurt} injuries still occur at L10`);
  ok('recoveryCut never heals a knock to nothing — every injury is ≥ 1 match',
    l1.worst === 4 && l10.worst <= 2 && l10.totalMatches >= l10.hurt,
    `longest knock 4 at L1 → ${l10.worst} at L10`);
}

// ── §2  LEVEL 1 IS THE NEUTRAL BASELINE ──────────────────────────────────────────────────────────────
console.log('\n=== 2. LEVEL 1 pays nothing and multiplies by one — the documented baseline ===');
{
  let paid = 0, n = 0;
  for (const t of TIER_IDXS) for (const rec of RECORDS) for (const tr of TROPHY_COUNTS) for (const m of MARKETABILITIES) {
    n++;
    const i = seasonFacilityIncome(allAt(1), t, tr, m, rec);
    // merit is paid for the DIVISION, not for anything the club owns, so it is excluded by design.
    if (i.gate === 0 && i.sponsor === 0 && i.shop === 0 && i.womens === 0 && i.total === i.merit) paid++;
  }
  ok('an all-level-1 club earns exactly 0 from all four income facilities, everywhere',
    paid === n, `${paid}/${n} of tier × record × trophies × marketability`);
  ok('and its whole upkeep bill is exactly 0', seasonUpkeep(allAt(1)) === 0 && facilityUpkeep(1) === 0);
  ok('every raw income function is exactly 0 at level 1',
    TIER_IDXS.every((t) => stadiumIncome(1, t, 'win') === 0 && stadiumIncome(1, t, 'draw') === 0
      && stadiumIncome(1, t, 'loss') === 0 && shopIncome(1, t) === 0 && womensIncome(1, t) === 0
      && TROPHY_COUNTS.every((tr) => MARKETABILITIES.every((m) => sponsorIncome(1, t, tr, m) === 0))));
  const neutralRows = CENSUS.filter((r) => r.probe(1) === r.neutral);
  ok('every declared quantity sits on its documented neutral value at level 1',
    neutralRows.length === CENSUS.length,
    CENSUS.filter((r) => r.probe(1) !== r.neutral).map((r) => `${r.key}:${r.quantity}=${r.probe(1)}≠${r.neutral}`).join(', ')
      || `${CENSUS.length}/${CENSUS.length}`);
  ok('facLevel treats a missing key, a null and an out-of-range level as level 1',
    facLevel(undefined, 'data') === 1 && facLevel({}, 'shop') === 1
    && facLevel({ shop: null as unknown as number }, 'shop') === 1
    && facLevel({ shop: -7 }, 'shop') === 1 && facLevel({ shop: 0 }, 'shop') === 1
    && facLevel({ shop: 7 }, 'shop') === 7);
  ok('the five newer keys are absent-safe: an old seven-key save behaves as level 1 on them',
    seasonFacilityIncome({ stadium: 5, training: 5, youth: 5, scouting: 5, medical: 5, sponsor: 5, fanzone: 5 },
      9, 0, 10, RECORDS[1]).shop === 0);
}

// ── §3  MONOTONE ACROSS THE WHOLE LADDER, AT EVERY DIVISION ─────────────────────────────────────────
console.log('\n=== 3. Every declared quantity moves monotonically across the WHOLE ladder ===');
{
  for (const r of CENSUS) {
    const vals = LEVELS.map(r.probe);
    let bad: string | null = null;
    for (let i = 1; i < vals.length; i++) {
      const d = vals[i] - vals[i - 1];
      const wrong = r.dir === 'up' ? (r.strict ? d <= 0 : d < 0) : (r.strict ? d >= 0 : d > 0);
      if (wrong) { bad = `L${i} ${vals[i - 1]} → L${i + 1} ${vals[i]}`; break; }
    }
    ok(`${r.key} · ${r.quantity} is ${r.strict ? 'strictly ' : 'non-'}${r.dir === 'up' ? 'increasing' : 'decreasing'} L1→L${MAX_LEVEL}`,
      bad === null, bad ?? `${vals[0]} → ${vals[vals.length - 1]}`);
  }
  // The four income facilities again, but swept across EVERY division and EVERY record — a term that
  // scales with the wrong sign in one division would pass a single-tier sweep.
  const grid: Array<[FacilityKey, (i: ReturnType<typeof seasonFacilityIncome>) => number]> = [
    ['stadium', (i) => i.gate], ['sponsor', (i) => i.sponsor], ['shop', (i) => i.shop], ['women', (i) => i.womens],
  ];
  for (const [k, get] of grid) {
    let broken = 0, checked = 0;
    for (const t of TIER_IDXS) for (const rec of RECORDS) for (const tr of TROPHY_COUNTS) {
      if (k === 'stadium' && rec.wins + rec.draws + rec.losses === 0) continue;
      const vals = LEVELS.map((l) => get(seasonFacilityIncome(at({ [k]: l }), t, tr, 10, rec)));
      checked++;
      // a 0-0-0 record legitimately pays no gate at any stadium level; every real record must rise.
      const flat = vals.every((v) => v === vals[0]);
      if (k === 'stadium' && flat && vals[0] === 0) continue;
      for (let i = 1; i < vals.length; i++) if (vals[i] <= vals[i - 1]) { broken++; break; }
    }
    ok(`${k} income rises at every level in every division and record`, broken === 0,
      `${checked - broken}/${checked} tier × record × trophy combinations`);
  }
  ok('the fan zone multiplies the gate at every level once the ground is out of L1',
    LEVELS.slice(1).every((l) =>
      seasonFacilityIncome(at({ stadium: 6, fanzone: l }), 9, 0, 10, RECORDS[1]).gate
      > seasonFacilityIncome(at({ stadium: 6, fanzone: l - 1 }), 9, 0, 10, RECORDS[1]).gate));
  // DESIGNED, NOT BROKEN. `gate` is stadiumIncome × fanIncomeMult and stadiumIncome is 0 at Stadium L1,
  // so the Fan Zone's income half is inert below Stadium L2. The blurb was rewritten to say so. Pinned
  // here so nobody "fixes" the zero and re-breaks the L1-pays-nothing baseline (§2).
  ok('and pays exactly nothing on that side while the Stadium is still at level 1 (documented)',
    LEVELS.every((l) => seasonFacilityIncome(at({ stadium: 1, fanzone: l }), 9, 0, 10, RECORDS[0]).gate === 0));
  ok('the sponsorship trophy term is capped, so a 200-title dynasty cannot run away',
    sponsorIncome(10, 9, 200, 20) === sponsorIncome(10, 9, 20, 20)
    && sponsorIncome(10, 9, 21, 10) === sponsorIncome(10, 9, 20, 10),
    `20 titles = ${fmt(sponsorIncome(10, 9, 20, 10))}/season, 200 titles = the same`);
  // The squad's brand multiplies sponsorship, so it is the one input to this module that is not a level.
  // It must be neutral at 10 (an all-ordinary squad earns exactly as before), monotone across the 1-20
  // football scale `career.ts` clamps it to, and — the part that matters — BOUNDED for any value at all,
  // because an unbounded brand term is how the trophy term reached 46,123 coins a season.
  const MKT = Array.from({ length: 20 }, (_, i) => i + 1);
  const spon = (m: number) => sponsorIncome(10, 9, 5, m);
  ok('sponsorship is exactly neutral for an all-ordinary squad, and for a squad with no players',
    spon(10) === sponsorIncome(10, 9, 5) && spon(10) === spon(squadMarketability([]))
    && squadMarketability([]) === 10 && squadMarketability([{}, { marketability: 20 }]) === 15);
  ok('sponsorship rises monotonically with squad marketability across the whole 1-20 scale',
    MKT.slice(1).every((m, i) => spon(m) > spon(MKT[i])), `${fmt(spon(1))} → ${fmt(spon(20))}`);
  ok('and the brand multiplier is bounded, so no squad can run the sponsorship away',
    [-1e9, 0, 1e9, 1e300].every((m) => spon(m) >= Math.round(spon(10) * 0.7 * 0.999)
      && spon(m) <= Math.round(spon(10) * 1.5 * 1.001)) && Number.isFinite(spon(1e300)),
    `clamped to [${fmt(spon(-1e9))}, ${fmt(spon(1e9))}] around a neutral ${fmt(spon(10))}`);
  ok('division merit is monotone in the climb and zero in the basement',
    TIER_IDXS.every((t) => seasonFacilityIncome(allAt(1), t, 0, 10, RECORDS[1]).merit === t * DIVISION_MERIT)
    && seasonFacilityIncome(allAt(1), 0, 0, 10, RECORDS[1]).merit === 0);
}

// ── §4  ISOLATION — one facility's level must not move another facility's money ─────────────────────
console.log('\n=== 4. Raising one facility moves ONLY the component it owns ===');
{
  const OWNS: Partial<Record<FacilityKey, keyof ReturnType<typeof seasonFacilityIncome>>> = {
    stadium: 'gate', fanzone: 'gate', sponsor: 'sponsor', shop: 'shop', women: 'womens',
  };
  let leaks = 0;
  const comps = ['gate', 'sponsor', 'shop', 'womens', 'merit'] as const;
  for (const k of FACILITY_KEYS) {
    const lo = seasonFacilityIncome(at({ [k]: 1 }), 7, 5, 12, RECORDS[1]);
    const hi = seasonFacilityIncome(at({ [k]: MAX_LEVEL }), 7, 5, 12, RECORDS[1]);
    for (const c of comps) if (lo[c] !== hi[c] && OWNS[k] !== c) { leaks++; console.log(`      leak: ${k} moved ${c}`); }
  }
  ok('no facility changes an income component it does not own', leaks === 0);
  // The seven that are deliberately NOT income facilities must leave the season total untouched. This is
  // the §58 finding stated as a gate: they are not decorative, they are wired somewhere else (§1 proves
  // each of them moves its own quantity), and a change here would mean someone crossed the wires.
  const notIncome: FacilityKey[] = ['training', 'youth', 'scouting', 'medical', 'data', 'dorm', 'community'];
  ok('the seven non-income facilities leave the season total identical at L1 and L10',
    notIncome.every((k) =>
      seasonFacilityIncome(at({ [k]: 1 }), 7, 5, 12, RECORDS[1]).total
      === seasonFacilityIncome(at({ [k]: MAX_LEVEL }), 7, 5, 12, RECORDS[1]).total),
    notIncome.join(', '));
  ok('the season total is exactly the sum of its five parts, at every division',
    TIER_IDXS.every((t) => {
      const i = seasonFacilityIncome(allAt(7), t, 9, 14, RECORDS[1]);
      return i.total === i.gate + i.sponsor + i.shop + i.womens + i.merit;
    }));
  ok('every component is a finite non-negative integer for every legal facility state',
    LEVELS.every((l) => TIER_IDXS.every((t) => RECORDS.every((rec) => {
      const i = seasonFacilityIncome(allAt(l), t, 7, 11, rec);
      return comps.every((c) => Number.isInteger(i[c]) && i[c] >= 0) && Number.isInteger(i.total);
    }))));
}

// ── §5  BOUNDED AT MAX_LEVEL — the injuryChanceMult scar, checked on every survivor ──────────────────
console.log('\n=== 5. Nothing is unbounded and nothing changes sign at the top of the ladder ===');
{
  for (const r of CENSUS) {
    const outside = LEVELS.filter((l) => r.probe(l) < r.band[0] || r.probe(l) > r.band[1]);
    ok(`${r.key} · ${r.quantity} stays inside [${r.band[0]}, ${r.band[1]}] at every level`,
      outside.length === 0, outside.length ? `L${outside.join(',L')}` : `L10 = ${r.probe(MAX_LEVEL)}`);
  }
  // The four straight lines still written for the OLD five-level cap. injuryChanceMult was one of them and
  // crossed zero at L8; these four did not, but they are the same shape, so the sign is gated explicitly.
  ok('trainingConditioning never reaches zero drain (a straight line built for the old L5 cap)',
    LEVELS.every((l) => trainingConditioning(l) > 0), `L10 = ${trainingConditioning(MAX_LEVEL).toFixed(2)}`);
  ok('scoutCostDiscount never reaches a free — or paid-for — scouting trip',
    LEVELS.every((l) => scoutCostDiscount(l) >= 0 && scoutCostDiscount(l) < 1),
    `L10 = ${scoutCostDiscount(MAX_LEVEL).toFixed(2)}`);
  ok('youthUpgradeChance never becomes a certainty',
    LEVELS.every((l) => youthUpgradeChance(l) >= 0 && youthUpgradeChance(l) < 1),
    `L10 = ${youthUpgradeChance(MAX_LEVEL).toFixed(2)}`);
  ok('injuryChanceMult decays and never crosses zero (the L8 defect, gated)',
    LEVELS.every((l) => injuryChanceMult(l) > 0 && injuryChanceMult(l) <= 1)
    && injuryChanceMult(1) === 1 && injuryChanceMult(MAX_LEVEL) > 0.2,
    `L10 = ${injuryChanceMult(MAX_LEVEL).toFixed(3)}`);
  ok('recoveryCut can never outlast the longest injury the roll produces (max severity 4)',
    LEVELS.every((l) => recoveryCut(l) <= 2), `L10 = ${recoveryCut(MAX_LEVEL)}`);
  ok('every level of every facility yields finite numbers for every effect function',
    LEVELS.every((l) => [trainingConditioning(l), youthPoolBonus(l), youthUpgradeChance(l), scoutHitMult(l),
      scoutCostDiscount(l), scoutExtraTrips(l), injuryChanceMult(l), recoveryCut(l), fanHomeBoost(l),
      fanIncomeMult(l), dataEdge(l), dormIntakeBonus(l), facilityUpkeep(l), mothballRefund(l)]
      .every(Number.isFinite)));
}

// ── §6  THE COST LADDER — no inversion, no money pump ────────────────────────────────────────────────
console.log('\n=== 6. The cost ladder never dips and mothballing is never profitable ===');
{
  const costs = LEVELS.slice(0, -1).map((l) => upgradeCost(l)!);
  ok('the cost to reach each next level strictly increases — the ladder never inverts',
    costs.every((c, i) => i === 0 || c > costs[i - 1]) && costs.every((c) => Number.isInteger(c) && c > 0),
    costs.map(fmt).join(' → '));
  ok('upgradeCost is null at MAX_LEVEL and nowhere below it',
    upgradeCost(MAX_LEVEL) === null && LEVELS.slice(0, -1).every((l) => upgradeCost(l) != null));
  ok('upgradeCost is null above MAX_LEVEL and for a level the ladder does not have',
    upgradeCost(MAX_LEVEL + 1) === null && upgradeCost(0) === null && upgradeCost(-4) === null);
  const refunds = LEVELS.map(mothballRefund);
  ok('mothballRefund is 0 at level 1 and strictly increases above it',
    refunds[0] === 0 && refunds.slice(1).every((r, i) => r > refunds[i]),
    refunds.map(fmt).join(' → '));
  // NO MONEY PUMP. Selling a level back must always return strictly less than re-buying it costs, or a
  // player with spare coins churns one facility for free income forever.
  const pump = LEVELS.slice(1).filter((l) => mothballRefund(l) >= upgradeCost(l - 1)!);
  ok('selling a level always returns strictly less than buying it back costs',
    pump.length === 0 && MOTHBALL_REFUND < 0.5,
    `refund is ${(MOTHBALL_REFUND * 100).toFixed(0)}% of the level's price at every level`);
  ok('maxing all twelve costs the 514,800 §28 measured against',
    FACILITY_KEYS.length * costs.reduce((a, b) => a + b, 0) === 514800,
    fmt(FACILITY_KEYS.length * costs.reduce((a, b) => a + b, 0)));
}

// ── §7  UPKEEP — quadratic, free at L1, and survivable at the summit ────────────────────────────────
console.log('\n=== 7. Upkeep: free at the baseline, monotone, NaN-proof, and payable at the top ===');
{
  const ups = LEVELS.map(facilityUpkeep);
  ok('upkeep is 0 at level 1 and strictly increases at every level after',
    ups[0] === 0 && ups.slice(1).every((u, i) => u > ups[i]), ups.map(fmt).join(','));
  ok('upkeep is the documented quadratic in level',
    LEVELS.every((l) => facilityUpkeep(l) === Math.round(UPKEEP_COEFF * (l - 1) ** 2)));
  // THE NaN BILL. `facilityUpkeep` carries its own guard because a NaN bill makes `Math.min(have, due)`
  // NaN and `due > have` false — the club is charged NaN once and then never billed again.
  ok('a corrupt level cannot produce a NaN bill',
    facilityUpkeep(NaN) === 0 && facilityUpkeep(Infinity) === 0 && facilityUpkeep(-Infinity) === 0
    && Number.isFinite(seasonUpkeep({ stadium: 'x' as unknown as number })));
  // 6,067 not 6,804: facilities now carry a per-TYPE upkeep weight (UPKEEP_WEIGHT), because one flat
  // quadratic for all twelve was charging a women's team that shares the training ground, and a community
  // trust with no building at all, exactly what a forty-thousand-seat stadium costs to run. That is what
  // made the Women's Team net NEGATIVE at level 10 in the top flight — the one division it was built for.
  // The invariant being asserted is unchanged and is the point: the bill is the sum over the twelve keys
  // and nothing else.
  ok('seasonUpkeep is exactly the sum over the twelve keys, and 6,067 at the summit',
    seasonUpkeep(allAt(MAX_LEVEL)) === FACILITY_KEYS.reduce((t, k) => t + facilityUpkeep(MAX_LEVEL, UPKEEP_WEIGHT[k] ?? 1), 0)
    && seasonUpkeep(allAt(MAX_LEVEL)) === 6067 && seasonUpkeep(undefined) === 0,
    fmt(seasonUpkeep(allAt(MAX_LEVEL))));
  ok('seasonUpkeep rises monotonically as the club is built',
    LEVELS.slice(1).every((l) => seasonUpkeep(allAt(l)) > seasonUpkeep(allAt(l - 1))));
  // SOLVENCY. Upkeep was once fitted to an income figure that was wrong by 45%, and the best possible
  // season in the game ran a deficit before a single wage was paid. This is that failure, gated.
  const summit = seasonFacilityIncome(allAt(MAX_LEVEL), TIERS - 1, 20, 10, RECORDS[0]);
  ok('a maxed top-flight champion out-earns its own upkeep',
    summit.total > seasonUpkeep(allAt(MAX_LEVEL)),
    `${fmt(summit.total)} income vs ${fmt(seasonUpkeep(allAt(MAX_LEVEL)))} upkeep`);
  // …and the other end: a facility must be worth running at the level the ladder starts charging for it.
  ok('every income facility clears its own upkeep at its early levels in the top flight',
    [2, 3, 4].every((l) => shopIncome(l, 9) > facilityUpkeep(l) && womensIncome(l, 9) > facilityUpkeep(l)
      && sponsorIncome(l, 9, 0, 10) > facilityUpkeep(l)));
}

// ── §8  DISREPAIR — bounded, terminating, deterministic, replay-safe ────────────────────────────────
console.log('\n=== 8. Disrepair is a slide you can see coming, not a collapse ===');
{
  const run = (start: number, budget: number) => { const f = allAt(start); return { f, r: applyDisrepair(f, budget) }; };
  const a = run(MAX_LEVEL, 0);
  ok('at most MAX_DISREPAIR levels are lost in one season',
    a.r.cut.length <= MAX_DISREPAIR && MAX_DISREPAIR === 3, `${a.r.cut.length} cut`);
  ok('no facility is ever driven below level 1',
    FACILITY_KEYS.every((k) => facLevel(run(1, 0).f, k) >= 1)
    && FACILITY_KEYS.every((k) => facLevel(a.f, k) >= 1));
  ok('an all-level-1 club has nothing to lose and loses nothing',
    run(1, 0).r.cut.length === 0 && run(1, 0).r.salvage === 0 && facilityToDowngrade(allAt(1)) === null);
  ok('it always sells the most expensive facility to run',
    facilityToDowngrade(at({ shop: 9, stadium: 4 })) === 'shop'
    && facilityToDowngrade(at({ community: 6 })) === 'community');
  ok('ties break on the fixed FACILITY_KEYS order, never on rng — replay-safe',
    facilityToDowngrade(allAt(MAX_LEVEL)) === FACILITY_KEYS[0]
    && JSON.stringify(run(MAX_LEVEL, 0).r) === JSON.stringify(run(MAX_LEVEL, 0).r)
    && JSON.stringify(run(8, 100).r.cut) === JSON.stringify(run(8, 100).r.cut));
  ok('the salvage paid is exactly the sum of the mothball refunds of the levels lost',
    a.r.salvage === a.r.cut.reduce((s, k, i) => s + mothballRefund(MAX_LEVEL - a.r.cut.slice(0, i).filter((x) => x === k).length), 0),
    `${fmt(a.r.salvage)} for ${a.r.cut.join(', ')}`);
  ok('it stops as soon as the bill fits the budget — a solvent club loses nothing',
    applyDisrepair(allAt(MAX_LEVEL), 999999).cut.length === 0
    && applyDisrepair(allAt(3), seasonUpkeep(allAt(3))).cut.length === 0);
  ok('and it always reduces the bill it was called to reduce',
    seasonUpkeep(a.f) < seasonUpkeep(allAt(MAX_LEVEL)),
    `${fmt(seasonUpkeep(allAt(MAX_LEVEL)))} → ${fmt(seasonUpkeep(a.f))}`);
  ok('it terminates on a corrupt save instead of spinning',
    applyDisrepair({ ...allAt(1), stadium: 'x' as unknown as number }, 0).cut.length === 0);
}

// ── §9  THE CARDS — no holes, no NaN, and the numbers agree with the functions that pay them ────────
console.log('\n=== 9. Every level of every facility has a card and a story line, and they do not lie ===');
{
  const holes: string[] = [], junk: string[] = [];
  for (const k of FACILITY_KEYS) for (const l of LEVELS) {
    const e = effectAt(k, l);
    if (!e || !e.trim()) holes.push(`effectAt ${k} L${l}`);
    else if (/NaN|undefined|Infinity|\[object/.test(e)) junk.push(`effectAt ${k} L${l}: ${e}`);
    if (l >= 2) { const s = facilityLevelStory(k, l); if (!s || !s.trim()) holes.push(`story ${k} L${l}`); }
  }
  ok('no blank line in the player UI: 12 facilities × 10 levels of effect text', !holes.some((h) => h.startsWith('effectAt')),
    holes.filter((h) => h.startsWith('effectAt')).join('; ') || `${FACILITY_KEYS.length * MAX_LEVEL} strings`);
  ok('every upgrade from level 2 to level 10 has its own narration line',
    !holes.some((h) => h.startsWith('story')),
    holes.filter((h) => h.startsWith('story')).join('; ') || `${FACILITY_KEYS.length * (MAX_LEVEL - 1)} lines`);
  ok('no card renders NaN, undefined or Infinity at any level', junk.length === 0, junk.join('; '));
  ok('level 1 never has a narration line — it is the starting state, not an upgrade',
    FACILITY_KEYS.every((k) => facilityLevelStory(k, 1) === null && facilityLevelStory(k, 0) === null));
  ok('no level-1 card promises a number',
    FACILITY_KEYS.every((k) => !/\d/.test(effectAt(k, 1))),
    FACILITY_KEYS.map((k) => effectAt(k, 1)).filter((s) => /\d/.test(s)).join('; ') || 'all twelve');
  ok('every facility has meta — an icon, a name and a blurb',
    FACILITY_KEYS.every((k) => FACILITY_META[k]?.icon && FACILITY_META[k]?.name && FACILITY_META[k]?.blurb.length > 20));
  // THE CARD IS DERIVED, NOT COPIED. The stadium card printed a pre-recalibration formula sixty lines
  // below the function it described. `sponsor` still inlines `60 * (level - 1)` by hand, so its printed
  // number is gated against the function that actually pays it — if the 60 in sponsorIncome moves and the
  // string does not, this is what goes red.
  const num = (s: string) => Number(s.replace(/,/g, '').match(/-?\d[\d.]*/)?.[0] ?? NaN);
  ok('the sponsor card prints exactly what sponsorIncome pays at its stated baseline',
    LEVELS.slice(1).every((l) => num(effectAt('sponsor', l)) === sponsorIncome(l, 0, 0, 10)),
    `L10 card ${fmt(num(effectAt('sponsor', MAX_LEVEL)))} vs ${fmt(sponsorIncome(MAX_LEVEL, 0, 0, 10))}`);
  // AND SO DO THE SHOP AND THE WOMEN'S TEAM. This check used to PIN the defect: it required the cards to
  // equal shopIncome(l, 4)/womensIncome(l, 4), which is one division's figure, while seasonFacilityIncome
  // pays both at the club's REAL tier — and the shop's "+" stated that single number as a floor, so a
  // bottom-division L10 Club Shop advertised "≈ 697+ coins/season" and banked 405. Same range shape, same
  // reason, as the stadium check below. The "+" is gated on its own line so the floor claim cannot come
  // back on a card that happens to print a range as well.
  ok('the shop and women cards print the real per-season range, worst division to best',
    LEVELS.slice(1).every((l) => {
      const sm = effectAt('shop', l).match(/(\d+)–(\d+)/), wm = effectAt('women', l).match(/(\d+)–(\d+)/);
      return !!sm && Number(sm[1]) === shopIncome(l, 0) && Number(sm[2]) === shopIncome(l, TIERS - 1)
        && !!wm && Number(wm[1]) === womensIncome(l, 0) && Number(wm[2]) === womensIncome(l, TIERS - 1);
    }), `L10 shop: ${effectAt('shop', MAX_LEVEL)} | women: ${effectAt('women', MAX_LEVEL)}`);
  ok('neither states a division-4 number as a floor — no "+" on a figure the bottom of the pyramid never sees',
    !/\d\+/.test(effectAt('shop', MAX_LEVEL)) && !/\d\+/.test(effectAt('women', MAX_LEVEL)),
    `${effectAt('shop', MAX_LEVEL)} / ${effectAt('women', MAX_LEVEL)}`);
  ok('the stadium card prints the real per-match range, worst division to best',
    LEVELS.slice(1).every((l) => {
      const m = effectAt('stadium', l).match(/(\d+)–(\d+)/);
      return !!m && Number(m[1]) === stadiumIncome(l, 0, 'draw') && Number(m[2]) === stadiumIncome(l, 9, 'win');
    }), `L10: ${effectAt('stadium', MAX_LEVEL)}`);
  ok('the training, medical, scouting, fanzone and data cards agree with their own multipliers',
    num(effectAt('training', 5)) === Math.round((1 - trainingConditioning(5)) * 100)
    && num(effectAt('medical', 9)) === Math.round((1 - injuryChanceMult(9)) * 100)
    && num(effectAt('scouting', 8)) === Math.round((scoutHitMult(8) - 1) * 100)
    && num(effectAt('fanzone', 6)) === Math.round((fanHomeBoost(6) - 1) * 100)
    && num(effectAt('data', 10)) === Number((dataEdge(10) * 100).toFixed(1)));
  ok('no card advertises a stat the game does not have (the deleted "standing")',
    FACILITY_KEYS.every((k) => LEVELS.every((l) => !/standing/i.test(effectAt(k, l))))
    && FACILITY_KEYS.every((k) => !/standing/i.test(FACILITY_META[k].blurb)));
}

// ── §10  CONTENT GATES — the other half of what a facility is for ───────────────────────────────────
console.log('\n=== 10. Facilities as content sources: every gate fires, and only where it should ===');
{
  const badKey = FACILITY_GATED_ARCS.filter((a) => !(FACILITY_KEYS as string[]).includes(a.when!.facility!.key));
  ok('every facility gate in the arc library names a facility the game has',
    badKey.length === 0, badKey.map((a) => `${a.id}→${a.when!.facility!.key}`).join(', ')
      || `${FACILITY_GATED_ARCS.length} gated arcs`);
  const badMin = FACILITY_GATED_ARCS.filter((a) => { const m = a.when!.facility!.min; return !(m >= 2 && m <= MAX_LEVEL); });
  ok('every gate asks for a level the ladder can actually reach', badMin.length === 0,
    badMin.map((a) => `${a.id}@L${a.when!.facility!.min}`).join(', '));
  const notAtMin = FACILITY_GATED_ARCS.filter((a) => !arcFits(a, arcSit(a, { [a.when!.facility!.key]: a.when!.facility!.min })));
  ok('every facility-gated arc fires at exactly the level it asks for',
    notAtMin.length === 0, notAtMin.map((a) => a.id).join(', ') || `${FACILITY_GATED_ARCS.length}/${FACILITY_GATED_ARCS.length}`);
  const firesEarly = FACILITY_GATED_ARCS.filter((a) => arcFits(a, arcSit(a, { [a.when!.facility!.key]: a.when!.facility!.min - 1 })));
  ok('and none of them fires one level below it', firesEarly.length === 0, firesEarly.map((a) => a.id).join(', '));
  ok('the Community Trust is wired to content — its only quantity — and unlocks arcs as it grows',
    arcsUnlocked('community', 1) === 0 && arcsUnlocked('community', MAX_LEVEL) > 0,
    `${arcsUnlocked('community', MAX_LEVEL)} arcs at L10`);
  ok('all twelve facilities gate at least one story arc',
    FACILITY_KEYS.every((k) => arcsUnlocked(k, MAX_LEVEL) > 0),
    FACILITY_KEYS.filter((k) => arcsUnlocked(k, MAX_LEVEL) === 0).join(', ') || 'twelve of twelve');
}

// ── §11  MEASURED, NOT GATED — the defects this file was written to find ────────────────────────────
// Deliberately not assertions. Every number below is recomputed on each run so it cannot go stale, and
// each is written up in the report rather than pinned, so fixing one does not turn this harness red.
console.log('\n=== 11. MEASURED (not gated) — findings ===');
{
  const MAXF = allAt(MAX_LEVEL);
  const netTable = (f: FacilityKey, inc: (l: number, t: number) => number) =>
    TIER_IDXS.map((t) => { const net = LEVELS.map((l) => inc(l, t) - facilityUpkeep(l)); return { t, net, peak: net.indexOf(Math.max(...net)) + 1 }; });

  console.log('\n  D1  THE WOMEN\'S TEAM IS A NET LOSS AT ITS OWN MAXIMUM, IN EVERY DIVISION IN THE GAME.');
  const wt = netTable('women', womensIncome);
  for (const r of [wt[0], wt[4], wt[9]]) console.log(`      tierIdx ${r.t}: net by level ${r.net.join(',')}  → peaks at L${r.peak}`);
  console.log(`      Top flight, the best case that exists: L5 pays +${wt[9].net[4]}/season, L10 pays ${wt[9].net[9]}/season.`);
  console.log(`      Levels 5→10 cost ${fmt(LEVELS.slice(4, 10).reduce((s, l) => s + (upgradeCost(l - 1) ?? 0), 0))} coins and every one of them`);
  console.log('      lowers the club\'s net income. It is the only facility with no second quantity to justify that:');
  console.log(`      its four story arcs are all unlocked by L${Math.max(...FACILITY_GATED_ARCS.filter((a) => a.when!.facility!.key === 'women').map((a) => a.when!.facility!.min))}.`);

  console.log('\n  D2  THE COMMUNITY TRUST MOVES NOTHING ABOVE LEVEL 5, AND ITS CARD SAYS OTHERWISE.');
  const commMins = FACILITY_GATED_ARCS.filter((a) => a.when!.facility!.key === 'community').map((a) => a.when!.facility!.min);
  console.log(`      arcs unlocked by level: ${LEVELS.map((l) => arcsUnlocked('community', l)).join(',')} — saturated at L${Math.max(...commMins)}.`);
  console.log('      community has no numeric effect function at all (womensStanding/communityStanding were deleted),');
  console.log(`      so L6-L10 cost ${fmt([6, 7, 8, 9, 10].reduce((s, l) => s + (upgradeCost(l - 1) ?? 0), 0))} coins and +${facilityUpkeep(10) - facilityUpkeep(5)}/season of upkeep to move zero quantities.`);
  console.log(`      The card at every level ≥2 reads: "${effectAt('community', MAX_LEVEL)}"`);
  console.log('      — "more of them the deeper the trust runs" is false above level 5.');
  const maxGate = Math.max(...FACILITY_GATED_ARCS.map((a) => a.when!.facility!.min));
  console.log(`      (Whole-library census: the highest facility gate in all ${FACILITY_GATED_ARCS.length} gated arcs is L${maxGate}.`);
  console.log('      Levels 6-10 unlock no story content for ANY facility; the other eleven have a multiplier to grow.)');

  console.log('\n  D3  THE UPKEEP COMMENT BLOCK IS WRONG ABOUT SUMMIT INCOME FOR THE THIRD TIME.');
  const summit = seasonFacilityIncome(MAXF, TIERS - 1, 20, 10, RECORDS[0]);
  console.log(`      It states 10,686 (and corrects an earlier 15,100 and a 10,449). Computed today: ${fmt(summit.total)}`);
  console.log(`      = gate ${fmt(summit.gate)} + sponsor ${fmt(summit.sponsor)} + shop ${fmt(summit.shop)} + women ${fmt(summit.womens)} + merit ${fmt(summit.merit)}.`);
  console.log(`      The DIVISION_MERIT term (+${fmt(DIVISION_MERIT)}/division, ${fmt(summit.merit)} at the summit) was added BELOW the block`);
  console.log(`      and the coefficient fitted above it was never redone. Understated by ${fmt(summit.total - 10686)} (+${((summit.total / 10686 - 1) * 100).toFixed(0)}%).`);
  console.log('      Its design claim "nothing below the top flight can hold all twelve" is measured false:');
  for (const t of TIER_IDXS) {
    const i = seasonFacilityIncome(MAXF, t, 0, 10, RECORDS[1]).total;
    if (i > seasonUpkeep(MAXF)) console.log(`        tierIdx ${t} (division ${TIERS - t}) clears the bill: ${fmt(i)} vs ${fmt(seasonUpkeep(MAXF))} on a 12-3-3 season with no trophies`);
  }

  console.log('\n  D4  FAILING TO PAY UPKEEP IS WORTH MORE THAN PAYING IT.');
  const f = allAt(MAX_LEVEL), before = seasonUpkeep(f), dis = applyDisrepair(f, 0);
  console.log(`      A maxed club that cannot pay its ${fmt(before)} bill loses ${dis.cut.length} levels and is handed ${fmt(dis.salvage)} coins`);
  console.log(`      — ${(dis.salvage / before).toFixed(2)}× the bill it could not pay — while shedding only ${fmt(before - seasonUpkeep(f))}/season of upkeep.`);
  console.log('      MAX_DISREPAIR × mothballRefund(10) is not bounded by the bill that triggered it.');

  console.log('\n  D5  facLevel — "the defensive clamp" — RETURNS NaN, and facilityUpkeep is the only caller defended.');
  const corrupt = { ...MAXF, stadium: 'abc' as unknown as number };
  console.log(`      facLevel({stadium:'abc'}) = ${facLevel(corrupt, 'stadium')}   (Math.max(1, NaN) is NaN)`);
  console.log(`      seasonFacilityIncome(...).total = ${seasonFacilityIncome(corrupt, 9, 0, 10, RECORDS[1]).total}  → a NaN treasury credit`);
  console.log(`      seasonUpkeep = ${fmt(seasonUpkeep(corrupt))} vs ${fmt(seasonUpkeep(MAXF))} — the corrupt facility is billed 0 forever`);
  console.log(`      upgradeCost = ${upgradeCost(facLevel(corrupt, 'stadium'))} — the UI shows it maxed and un-upgradeable`);
  console.log(`      effectAt = "${effectAt('stadium', facLevel(corrupt, 'stadium'))}"`);
  console.log('      seasonFacilityIncome reads fac.stadium / fac.sponsor / fac.fanzone RAW while the five newer keys get `?? 1`.');

  console.log('\n  D6  TWO DOCSTRINGS CONTRADICT THE CODE ON THE LINE BELOW THEM.');
  console.log(`      injuryChanceMult: docstring says "1.0 at L1 → 0.40 at L5"; it returns ${injuryChanceMult(5).toFixed(3)} at L5.`);
  console.log('        The comment three lines further down says "L5 0.63" — the file disagrees with itself.');
  console.log(`      recoveryCut: docstring says "0 at L1 → 2 at L5"; the ladder is ${LEVELS.map(recoveryCut).join(',')} — L5 is ${recoveryCut(5)}.`);

  console.log('\n  D7  THE GATE PAYS FOR TEN HOME MATCHES IN AN EIGHTEEN-FIXTURE SEASON.');
  let off = 0, tot = 0;
  for (let w = 0; w <= 18; w++) for (let d = 0; d + w <= 18; d++) { const l = 18 - w - d; tot++; if (Math.round(w / 2) + Math.round(d / 2) + Math.round(l / 2) !== 9) off++; }
  const homeReal = seasonFixtures('Marlow', 7, 1).filter((x) => x.venue === 'H').length;
  console.log(`      seasonFixtures returns ${seasonFixtures('Marlow', 7, 1).length} fixtures, ${homeReal} of them at home.`);
  console.log(`      seasonFacilityIncome rounds W, D and L to home matches INDEPENDENTLY, so ${off} of ${tot} possible records (${(100 * off / tot).toFixed(0)}%)`);
  console.log(`      are paid for 10 home games instead of ${homeReal} — a systematic ~11% over-payment of gate receipts.`);

  console.log('\n  D8  THE "+" ON THE SPONSOR CARD IS NOT A FLOOR.');
  console.log(`      sponsor L10 card "${effectAt('sponsor', MAX_LEVEL)}" — with a low-marketability squad it pays ${fmt(sponsorIncome(MAX_LEVEL, 0, 0, 1))}.`);
  console.log('      The stadium card prints a RANGE for exactly this reason, and the shop and women cards now do too');
  console.log('      (gated in §9); the sponsor card is the last one quoting a single baseline with a "+" it cannot honour.');

  console.log('\n  D9  applyDisrepair is documented "Pure." and mutates its argument.');
  const p = allAt(6), snap = JSON.stringify(p);
  applyDisrepair(p, 0);
  console.log(`      before ${snap.slice(0, 46)}…`);
  console.log(`      after  ${JSON.stringify(p).slice(0, 46)}…  — client/src/api.ts depends on the mutation and says so.`);

  console.log('\n  D10 THE BRAND CLAMP IN sponsorIncome IS A BOUND NOTHING CAN REACH.');
  const brand = (m: number) => sponsorIncome(10, 9, 0, m) / sponsorIncome(10, 9, 0, 10);
  console.log(`      clampNum(1 + 0.03*(avg-10), 0.7, 1.5); career.ts clamps marketability to 1..20, so an average is 1..20 too.`);
  console.log(`      At the scale's floor (avg 1) the multiplier is ${brand(1).toFixed(2)} and at its ceiling (avg 20) ${brand(20).toFixed(2)}.`);
  console.log(`      The 0.7 rail needs avg ≤ 0 and the 1.5 rail avg ≥ 26.7. Neither can occur. Harmless as a guard,`);
  console.log('      but the numbers it advertises are not the bounds the game has — the real band is [0.73, 1.30].');

  console.log('\n  NOT DEFECTS — checked and dismissed, so nobody reopens them:');
  console.log('    · The Fan Zone paying no gate below Stadium L2 is arithmetic, not a bug: gate is stadiumIncome ×');
  console.log('      fanIncomeMult and stadiumIncome is 0 at L1 by the neutral-baseline rule. Gated as designed in §3.');
  console.log('    · The seven non-income facilities leaving seasonFacilityIncome untouched is the §58 correction, not');
  console.log('      the §9 defect: each moves its own quantity (§1) and a Club Shop is not wired to a scoreline.');
  console.log('    · trainingConditioning (0.55), scoutCostDiscount (0.54) and youthUpgradeChance (0.72) are straight');
  console.log('      lines written for the old five-level cap, like injuryChanceMult was — but none of them crosses');
  console.log('      its bound inside MAX_LEVEL=10. Latent if the cap ever rises; not live today. Gated in §5.');
  console.log('    · A maxed Stadium losing money in the lower divisions is the documented design ("upkeep does not');
  console.log('      fall with the division while income does"). D1 is different: it holds in the TOP flight too.');
  console.log('    · The narration packs are complete — 12 × 9 lines, no holes — despite pack_2 being empty.');
}

console.log(`\n${fails === 0 ? '✓ qa_facilities: all gated checks passed' : `✗ qa_facilities: ${fails} FAILED`}`);
if (fails > 0) process.exit(1);
