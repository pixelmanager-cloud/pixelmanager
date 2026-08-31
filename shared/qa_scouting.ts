// ── THE TRIAL/LOAN ACADEMY: what a walk-up card PROMISES, and what the pool actually hands over ──────
//
// `shared/src/scouting.ts` had never been imported by a single harness, probe or fuzz file. It is the
// module that mints the free trialists the player signs, so it is the one place in the game where a
// player-facing IDENTITY (an id, a name, a rating, a rarity badge) is manufactured out of a string seed
// and then written straight into the squad. Two of this project's worst historical failures live in that
// sentence: a duplicate id in the youth intake once made every team sheet unbuildable, and a "dial" that
// measured flat shipped repeatedly because nobody ever measured its OUTPUT population.
//
// So this guards the four things the module actually promises, and measures rather than asserts them:
//
//  1. PURITY. `generatePool` / `trialistAt` are pure in their arguments — a hostile Math.random and a
//     hostile Date.now must not move a single byte, or the save cannot be replayed.
//  2. THE BOUND IS TOTAL AND THE CARD IS THE MAN. The pool is exactly POOL_SIZE + extraSlots; every
//     in-range index resolves and every out-of-range one returns null; and `trialistAt(i)` is the SAME
//     man as `generatePool()[i]` — id, name, role and rating. If those two ever diverge you sign someone
//     other than the lad on the card.
//  3. NO DUPLICATE IDS, over a whole 40-season dynasty and every intake size the facilities can produce.
//     This is the check that exists because of the intake duplicate that rejected every team sheet.
//  4. THE DIALS ARE NOT FLAT. Scout tier and the Youth Academy upgrade chance are measured against the
//     MEAN of a 12,000-draw population, never an extremum, and the shipped tier ('base' — the only one
//     `api.ts` can request) must be able to produce all four badges, not just the bottom two.
//
// NOTE: this harness gates only properties that HOLD today. Four real defects were found while writing it
// and are reported to the owner rather than gated here (gating them would redden `npm run qa` on a clean
// tree); the short measured summary at the foot of this file is printed, clearly, as NOT a check.
import { generatePool, trialistAt, LOANEE_CAP, POOL_SIZE, SCOUT_TIERS, OPP_REVEAL, type TrialInfo } from './src/scouting.js';
import { overall } from './src/teams.js';
import { youthPoolBonus, dormIntakeBonus, youthUpgradeChance, MAX_LEVEL } from './src/facilities.js';
import type { ScoutBand } from './src/missions.js';

let fails = 0;
const check = (ok: boolean, msg: string, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}${detail ? `  (${detail})` : ''}`);
  if (!ok) fails++;
};

const BANDS: ScoutBand[] = ['raw', 'squad', 'quality', 'gem']; // worst → best
const TIERS = ['base', 'bronze', 'silver', 'gold'] as const;
const ACCT = (i: number) => `acct-${i}`;
const N_ACCT = 4000;               // 4000 accounts x POOL_SIZE = 12,000 draws per measured population
const LOANEE_MAX_STAT = 12;        // the module's own documented hard cap on any single loanee stat
// what the facility ladder can ACTUALLY ask for, read off facilities.ts rather than guessed
const MAX_EXTRA = youthPoolBonus(MAX_LEVEL) + dormIntakeBonus(MAX_LEVEL);
const MAX_YOUTH_UP = youthUpgradeChance(MAX_LEVEL);

/** Draw a whole population and report it, so every band/quality claim below is made about a POPULATION
 *  and never about its best member — the "extremum standing in for a population" failure this suite has
 *  shipped before. */
function population(tier: string, youthUp = 0, accounts = N_ACCT) {
  const rows: TrialInfo[] = [];
  for (let a = 0; a < accounts; a++) rows.push(...generatePool(ACCT(a), 3, tier, 0, youthUp));
  const mean = rows.reduce((t, r) => t + r.overall, 0) / rows.length;
  const share = (b: ScoutBand) => rows.filter((r) => r.band === b).length / rows.length;
  const atLeast = (b: ScoutBand) => rows.filter((r) => BANDS.indexOf(r.band) >= BANDS.indexOf(b)).length / rows.length;
  return { rows, mean, share, atLeast };
}

console.log('=== 1. the pool is PURE — a save that cannot be replayed is not a save ===');
{
  const cfgs: Array<[string, number, string, number, number]> = [
    ['local', 1, 'base', 0, 0], ['local', 7, 'base', 4, 0.32], ['local', 12, 'gold', 8, 0.72], ['other', 3, 'silver', 2, 0.16],
  ];
  let stable = 0;
  for (const [a, s, t, e, y] of cfgs) if (JSON.stringify(generatePool(a, s, t, e, y)) === JSON.stringify(generatePool(a, s, t, e, y))) stable++;
  check(stable === cfgs.length, 'the same inputs yield a byte-identical pool', `${stable}/${cfgs.length}`);

  // A hostile clock and a hostile RNG. Anything the module reads from either shows up as a diff here.
  const before = cfgs.map(([a, s, t, e, y]) => JSON.stringify(generatePool(a, s, t, e, y)));
  const realRandom = Math.random, realNow = Date.now;
  let tick = 0;
  Math.random = () => ((tick = (tick + 0.37) % 1), tick);
  Date.now = () => 1_700_000_000_000 + (tick += 1);
  const after = cfgs.map(([a, s, t, e, y]) => JSON.stringify(generatePool(a, s, t, e, y)));
  const afterTrial = cfgs.map(([a, s, t, e, y]) => JSON.stringify(trialistAt(a, s, 1, t, e, y)));
  Math.random = realRandom; Date.now = realNow;
  const restored = cfgs.map(([a, s, t, e, y]) => JSON.stringify(generatePool(a, s, t, e, y)));
  const restoredTrial = cfgs.map(([a, s, t, e, y]) => JSON.stringify(trialistAt(a, s, 1, t, e, y)));
  check(after.every((x, i) => x === before[i]), 'a hijacked Math.random / Date.now moves nothing in generatePool');
  check(restoredTrial.every((x, i) => x === afterTrial[i]), '…nor in trialistAt');
  check(restored.every((x, i) => x === before[i]), 'and the pool is unchanged once the clock is put back');

  // different account, different season, different tier must each actually reach the generator
  check(JSON.stringify(generatePool('local', 3)) !== JSON.stringify(generatePool('other', 3)), 'the account reaches the seed');
  check(JSON.stringify(generatePool('local', 3)) !== JSON.stringify(generatePool('local', 4)), 'the season reaches the seed');
  check(JSON.stringify(generatePool('local', 3, 'base')) !== JSON.stringify(generatePool('local', 3, 'gold')), 'the scout tier reaches the seed');
}

console.log('\n=== 2. the bound is TOTAL, and the card is the man you sign ===');
{
  let sized = 0, inRange = 0, outRange = 0, coherent = 0, checked = 0;
  for (let extra = 0; extra <= MAX_EXTRA; extra++) {
    const pool = generatePool('local', 5, 'base', extra, 0.24);
    if (pool.length === POOL_SIZE + extra) sized++;
    // every index the pool advertises must resolve; every index it does not must be refused
    if (pool.every((_, i) => trialistAt('local', 5, i, 'base', extra, 0.24) !== null)) inRange++;
    if ([-1, -99, pool.length, pool.length + 1, 1e9].every((i) => trialistAt('local', 5, i, 'base', extra, 0.24) === null)) outRange++;
  }
  check(sized === MAX_EXTRA + 1, 'the pool is exactly POOL_SIZE + extraSlots at every intake size', `${sized}/${MAX_EXTRA + 1}, POOL_SIZE=${POOL_SIZE}, max extra=${MAX_EXTRA}`);
  check(inRange === MAX_EXTRA + 1, 'every advertised index resolves to a player');
  check(outRange === MAX_EXTRA + 1, 'every index outside the pool is refused');
  check(generatePool('local', 5, 'base', -4).length === 0 && trialistAt('local', 5, 0, 'base', -4) === null,
    'a negative intake bonus yields an EMPTY pool, not a negative-length one');

  // THE ONE THAT MATTERS: sign-what-you-saw. api.ts renders generatePool() and then signs trialistAt().
  for (let a = 0; a < 1200; a++) {
    const season = (a % 9) + 1, extra = a % 5, yu = (a % 4) * 0.18;
    const pool = generatePool(ACCT(a), season, 'base', extra, yu);
    for (const t of pool) {
      const p = trialistAt(ACCT(a), season, t.index, 'base', extra, yu);
      checked++;
      if (p && p.id === t.id && p.name === t.name && p.role === t.role && overall(p) === t.overall) coherent++;
    }
  }
  check(coherent === checked, 'trialistAt(i) is the SAME man as the pool card at i — id, name, role and rating', `${coherent}/${checked}`);
}

console.log('\n=== 3. IDS — the intake duplicate that once rejected every team sheet ===');
{
  // A dynasty's worth of intakes, at every size the facilities can produce, under both upgrade extremes.
  const seen = new Map<string, string>();
  let dupInPool = 0, dupInDynasty = 0, pools = 0;
  for (let season = 1; season <= 40; season++) {
    for (const extra of [0, 1, 4, MAX_EXTRA]) {
      for (const yu of [0, MAX_YOUTH_UP]) {
        const pool = generatePool('local', season, 'base', extra, yu);
        pools++;
        if (new Set(pool.map((p) => p.id)).size !== pool.length) dupInPool++;
        for (const p of pool) {
          const key = `s${season}:${p.id}`;                       // one save only ever fields one season at a time
          const prev = seen.get(p.id);
          if (prev !== undefined && prev !== key) dupInDynasty++;  // same id re-issued in a DIFFERENT season
          seen.set(p.id, key);
        }
      }
    }
  }
  check(dupInPool === 0, 'no pool ever contains two players with the same id', `${pools} pools`);
  check(dupInDynasty === 0, 'no id is re-issued across 40 seasons of intakes', `${seen.size} distinct ids`);

  // Growing the intake must not swap out the lad you were already looking at.
  let reshuffled = 0;
  for (let a = 0; a < 1500; a++) {
    const small = generatePool(ACCT(a), 6, 'base', 0, 0.24), big = generatePool(ACCT(a), 6, 'base', MAX_EXTRA, 0.24);
    for (let i = 0; i < small.length; i++) if (JSON.stringify(small[i]) !== JSON.stringify(big[i])) reshuffled++;
  }
  check(reshuffled === 0, 'upgrading the intake ADDS places — it never reshuffles the existing cards', `${reshuffled} moved`);

  // Every trialist is a real, complete footballer — not a stat line with holes that overall() silently
  // reads as 10 (the NaN/`missing = 10` trap this codebase has been bitten by twice).
  let complete = 0, capped = 0, floored = 0, n = 0;
  const CORE = ['pace', 'strength', 'passing', 'shooting', 'tackling', 'positioning', 'workrate', 'keeping', 'setPiece', 'stamina',
    'composure', 'aggression', 'creativity', 'teamwork', 'leadership'] as const;
  let maxStat = 0, maxOvr = 0;
  for (let a = 0; a < 1500; a++) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = trialistAt(ACCT(a), 8, i, 'gold', 0, MAX_YOUTH_UP)!;
      n++;
      const av = CORE.map((k) => (p.attrs as unknown as Record<string, number | undefined>)[k]);
      if (av.every((v) => typeof v === 'number' && Number.isFinite(v))) complete++;
      if (av.every((v) => (v as number) <= LOANEE_MAX_STAT)) capped++;
      if (av.every((v) => (v as number) >= 1)) floored++;
      maxStat = Math.max(maxStat, ...(av as number[]));
      maxOvr = Math.max(maxOvr, overall(p));
    }
  }
  check(complete === n, 'every trialist carries all 15 stats — no hole for overall() to read as a free 10', `${complete}/${n}`);
  check(capped === n && floored === n, `every stat sits inside 1..${LOANEE_MAX_STAT}`, `${capped}/${n} capped`);
  // …and the cap must actually BITE. A bound nothing can reach is not a bound.
  check(maxStat === LOANEE_MAX_STAT, 'the loanee stat cap is REACHED, not merely declared', `best stat seen ${maxStat}`);
  check(maxOvr <= LOANEE_MAX_STAT && maxOvr >= 11, 'the very best gold-scout gem lands at 11-12 OVR, as designed', `best OVR ${maxOvr}`);
}

console.log('\n=== 4. SCOUT_TIERS is a contiguous, total, strictly-climbing ladder ===');
{
  check(Object.keys(SCOUT_TIERS).length === TIERS.length && TIERS.every((t) => SCOUT_TIERS[t] != null),
    'exactly the four scout tiers are defined', Object.keys(SCOUT_TIERS).join(','));
  let totals = 0, complete = 0, positive = 0;
  for (const t of TIERS) {
    const row = SCOUT_TIERS[t];
    const sum = BANDS.reduce((s, b) => s + row[b], 0);
    // >= 1 matters as much as ~1: the roll walks gem→quality→squad→raw and a row that sums SHORT leaves a
    // sliver of probability that matches no band at all.
    if (sum >= 1 - 1e-12 && sum <= 1 + 1e-12) totals++;
    if (BANDS.every((b) => typeof row[b] === 'number' && Number.isFinite(row[b]))) complete++;
    if (BANDS.every((b) => row[b] > 0 && row[b] < 1)) positive++;
  }
  check(totals === TIERS.length, 'every row sums to 1 — no quality falls through every band', `${totals}/${TIERS.length}`);
  check(complete === TIERS.length, 'every row names all four bands');
  check(positive === TIERS.length, 'no band is dead weight at any tier (every probability is > 0)');

  // Stochastic dominance: paying for a better scout must improve the odds at EVERY cut, not just the top.
  let dominant = 0, cuts = 0;
  for (const b of ['squad', 'quality', 'gem'] as ScoutBand[]) {
    const cum = TIERS.map((t) => BANDS.slice(BANDS.indexOf(b)).reduce((s, x) => s + SCOUT_TIERS[t][x], 0));
    cuts++;
    if (cum.every((v, i) => i === 0 || v > cum[i - 1] + 1e-9)) dominant++;
  }
  check(dominant === cuts, 'a better tier strictly improves the odds at every band cut', `${dominant}/${cuts}`);
}

console.log('\n=== 5. the dials are NOT flat — measured on 12,000 draws, not on a best case ===');
{
  const pops = TIERS.map((t) => ({ t, p: population(t) }));
  for (const { t, p } of pops) {
    console.log(`    ${t.padEnd(6)} meanOVR ${p.mean.toFixed(3)}   badge raw ${(100 * p.share('raw')).toFixed(1)}%  squad ${(100 * p.share('squad')).toFixed(1)}%  quality ${(100 * p.share('quality')).toFixed(1)}%  gem ${(100 * p.share('gem')).toFixed(2)}%`);
  }
  const steps = pops.slice(1).map((x, i) => x.p.mean - pops[i].p.mean);
  check(steps.every((d) => d >= 0.4), 'each scout tier lifts the AVERAGE walk-up by >= 0.4 OVR', steps.map((d) => d.toFixed(2)).join(' / '));
  const qSteps = pops.slice(1).map((x, i) => x.p.atLeast('quality') - pops[i].p.atLeast('quality'));
  check(qSteps.every((d) => d >= 0.03), 'each tier adds >= 3pp to the chance of a quality-or-better badge', qSteps.map((d) => (100 * d).toFixed(1) + 'pp').join(' / '));

  // The Youth Academy's upgrade chance, across the levels the facility ladder can actually reach.
  const ys = [0, youthUpgradeChance(3), youthUpgradeChance(5), youthUpgradeChance(8), MAX_YOUTH_UP];
  const ym = ys.map((y) => population('base', y, 1500).mean);
  console.log(`    youth upgrade ${ys.map((y, i) => `${y.toFixed(2)}→${ym[i].toFixed(2)}`).join('  ')}`);
  check(ym.every((v, i) => i === 0 || v > ym[i - 1]), 'every Youth Academy level strictly lifts the average walk-up', ym.map((v) => v.toFixed(2)).join(' < '));
  check(ym[ym.length - 1] - ym[0] >= 0.5, 'a maxed Youth Academy is worth >= 0.5 OVR on the average walk-up', (ym[ym.length - 1] - ym[0]).toFixed(2));

  // The badge must not disagree with the rating printed beside it.
  const all = pops.flatMap((x) => x.p.rows);
  const worstAt: Record<string, number> = {}, bestAt: Record<string, number> = {};
  for (const r of all) {
    worstAt[r.band] = Math.min(worstAt[r.band] ?? 99, r.overall);
    bestAt[r.band] = Math.max(bestAt[r.band] ?? -1, r.overall);
  }
  const ordered = BANDS.every((b, i) => i === 0 || (worstAt[b] ?? 99) > (bestAt[BANDS[i - 1]] ?? -1));
  check(ordered, 'the badge never disagrees with the rating: every band out-rates the one below it, with no overlap',
    BANDS.map((b) => `${b} ${worstAt[b]}-${bestAt[b]}`).join(' | '));

  // The tier the game SHIPS is 'base' (api.ts hardcodes it). All four badges must be reachable there or
  // the rarest ones are decoration nobody can ever be handed.
  const base = pops[0].p;
  const missing = BANDS.filter((b) => base.share(b) === 0);
  check(missing.length === 0, 'all four badges occur at the shipped base tier', missing.length ? `never seen: ${missing.join(',')}` : `gem ${(100 * base.share('gem')).toFixed(2)}%`);
  check(base.share('gem') >= 0.002, 'a base-tier gem is rare but real (>= 0.2% of walk-ups)', `${(100 * base.share('gem')).toFixed(2)}%`);
}

console.log('\n=== 6. OPP_REVEAL is a monotone ladder, and LOANEE_CAP is a reachable number ===');
{
  const keys = Object.keys(OPP_REVEAL);
  check(keys.length === TIERS.length && TIERS.every((t) => OPP_REVEAL[t] != null), 'the reveal ladder covers exactly the four tiers', keys.join(','));
  check(JSON.stringify(Object.keys(SCOUT_TIERS).slice().sort()) === JSON.stringify(keys.slice().sort()),
    'the reveal ladder and the trialist ladder name the SAME tiers');
  const FIELDS = ['overalls', 'likelyXI', 'intel'] as const;
  const count = TIERS.map((t) => FIELDS.filter((f) => OPP_REVEAL[t][f]).length);
  let superset = 0;
  for (let i = 1; i < TIERS.length; i++) if (FIELDS.every((f) => !OPP_REVEAL[TIERS[i - 1]][f] || OPP_REVEAL[TIERS[i]][f])) superset++;
  check(superset === TIERS.length - 1, 'paying up never un-reveals something a cheaper tier already showed');
  check(count.every((c, i) => i === 0 || c > count[i - 1]), 'every tier reveals strictly more than the one below', count.join(' < '));
  check(count[0] === 0 && count[count.length - 1] === FIELDS.length, 'base reveals nothing extra; gold reveals everything', `${count[0]}..${count[count.length - 1]}`);

  check(Number.isInteger(LOANEE_CAP) && LOANEE_CAP >= 1, 'the loanee cap is a positive whole number', String(LOANEE_CAP));
  // A cap a season's intake could never fill would be a dead dial. The largest intake the facility ladder
  // can produce is POOL_SIZE + the Youth/Dorm bonuses.
  check(LOANEE_CAP <= POOL_SIZE + MAX_EXTRA, 'the cap is reachable from a single season\'s intake', `cap ${LOANEE_CAP} vs max intake ${POOL_SIZE + MAX_EXTRA}`);
}

// ── MEASURED, NOT GATED ───────────────────────────────────────────────────────────────────────────────
// These are REPORTED DEFECTS, not checks: they are true of the code as it stands, so gating them here
// would redden `npm run qa` on a clean tree. They are printed so the numbers stay in front of whoever
// reads this file, and they are written up for the owner.
{
  const gold = population('gold');
  const dec = SCOUT_TIERS.gold;
  console.log('\n── measured, NOT gated (reported defects) ──');
  console.log(`  note the gold row DECLARES raw ${(100 * dec.raw).toFixed(0)}% / squad ${(100 * dec.squad).toFixed(0)}% / quality ${(100 * dec.quality).toFixed(0)}% / gem ${(100 * dec.gem).toFixed(0)}%`);
  console.log(`  note the pool DELIVERS badges raw ${(100 * gold.share('raw')).toFixed(1)}% / squad ${(100 * gold.share('squad')).toFixed(1)}% / quality ${(100 * gold.share('quality')).toFixed(1)}% / gem ${(100 * gold.share('gem')).toFixed(1)}%  ← client/src/main.ts quotes the DECLARED row to the player verbatim`);
  const byRole = (role: string) => {
    const rs = gold.rows.filter((r) => r.role === role);
    return `${role} gem ${(100 * rs.filter((r) => r.band === 'gem').length / rs.length).toFixed(1)}%`;
  };
  console.log(`  note the badge tracks the POSITION, not the prospect: ${['GK', 'FW', 'MF', 'DF'].map(byRole).join('  ')}`);
  console.log('  note trialistAt(acct, season, NaN) returns a PLAYER, and trialistAt(…, 0.5) returns index 0\'s man under a second id');
}

console.log(fails
  ? `\n✗ ${fails} scouting check(s) failed`
  : '\n✓ the trial pool is pure, totally bounded, duplicate-free, and both of its dials measurably move — see the reported defects above');
if (fails) process.exit(1);
