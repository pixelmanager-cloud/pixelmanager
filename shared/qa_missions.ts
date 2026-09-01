// ── WHAT THIS GUARDS: shared/src/missions.ts — the Scouting Network's six exports ────────────────────
//
// Five of the six had never been imported by a harness. The module is 103 lines and it is the only place
// in the game where the player is quoted a PROBABILITY and then paid coins against it, so the question
// that matters is not coverage, it is whether the numbers on the destination card are the numbers the
// roll delivers. `client/src/main.ts:4139-4152` renders three of them, verbatim, on the same screen:
//
//    "🎯 <b>{previewOdds().hitRate}%</b> sign a player"     ← §5 checks this against the delivered rate
//    "↑ {previewOdds().upgradeChance}% upgrade"             ← measured in D3
//    a four-segment bar from `dest.weights`, title="quality mix if a player is found"   ← measured in D1
//
// …and then `main.ts:4189` prints the band the trip actually returned (`RAW`/`SQUAD`/`QUALITY`/`GEM`) on
// the mission card underneath. So the advertised mix and the delivered label sit in the same viewport.
//
// The check that is worth the most here is therefore ADVERTISED-VERSUS-DELIVERED, run against the real
// `DESTINATIONS` config at every Scouting-HQ level the facility can reach, because a sibling module was
// found today advertising a 12% gem tier and delivering 6%. Restating `previewOdds`'s own arithmetic
// would have caught nothing: the only way to see the gap is to roll the mission and count.
//
// WHAT IS GATED (below) are the invariants that hold today and would be silent if they broke: the
// preview/roll hit-rate identity, determinism, pointwise monotonicity in the HQ level, the outcome shape,
// the config ladder, `travelMs`'s bounds, `destinationById`'s contract, and purity. Each was verified to
// fail against a deliberately broken copy of the subject in /tmp before being trusted.
//
// WHAT IS ONLY MEASURED (the D-sections at the end) are the defects found while writing this file. They
// are deliberately NOT gated, for the reason `qa_mental.ts` states: pinning today's broken numbers into a
// bar turns this harness red the day somebody fixes them. They print on every run so they stay visible.
import { DESTINATIONS, destinationById, hqUpgradeChance, previewOdds, rollMission } from './src/missions.js';
import type { Destination, ScoutBand } from './src/missions.js';
import { overall } from './src/teams.js';
import { scoutCostDiscount, scoutHitMult } from './src/facilities.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};

const BANDS: ScoutBand[] = ['raw', 'squad', 'quality', 'gem'];
const RANK: Record<ScoutBand, number> = { raw: 0, squad: 1, quality: 2, gem: 3 };
const HQ_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // the range facilities.ts lets the player buy
/** Everything is driven off this one deterministic id generator, so a rerun is byte-identical. */
const mid = (i: number) => `qa-mission-${i}`;
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

/** Roll N sealed trips and tally what the player would actually be handed. */
function sample(dest: Destination, hqMult: number, hqLevel: number, n: number) {
  const band: Record<ScoutBand, number> = { raw: 0, squad: 0, quality: 0, gem: 0 };
  const atLeast = new Array<number>(14).fill(0);
  let found = 0, ovrSum = 0;
  for (let i = 0; i < n; i++) {
    const o = rollMission(mid(i), dest, 'base', hqMult, hqLevel);
    if (!o.found) continue;
    found++; band[o.band as ScoutBand]++; ovrSum += o.overall as number;
    for (let k = 1; k <= 13; k++) if ((o.overall as number) >= k) atLeast[k]++;
  }
  return { n, found, hitRate: found / n, band, meanOvr: found ? ovrSum / found : 0, atLeast: atLeast.map((c) => c / n) };
}

// ── §1  DESTINATIONS is a LADDER, not a list ─────────────────────────────────────────────────────────
// The header calls it "bottom → top of the risk/reward ladder". If any rung stops being ordered, the
// screen still renders six cards and the player still pays — he just pays more for less with nothing red.
console.log('=== 1. the destination ladder ===');
{
  const ids = DESTINATIONS.map((d) => d.id);
  ok('every destination id is unique', new Set(ids).size === ids.length, ids.join(','));
  ok('there are at least four destinations to choose between', DESTINATIONS.length >= 4, `${DESTINATIONS.length}`);

  let sums = 0, nonNeg = 0, costUp = 0, hitDown = 0, travelUp = 0, gemUp = 0;
  for (const d of DESTINATIONS) {
    // The `weights` comment says "sums ~1". It is not decorative: rollMission walks gem→quality→squad→raw
    // accumulating them and defaults to 'raw', so a short sum silently rebates the shortfall to 'raw' and
    // a long sum silently truncates the tail — either way the advertised bar stops being a distribution.
    const s = BANDS.reduce((a, b) => a + d.weights[b], 0);
    if (Math.abs(s - 1) < 1e-9) sums++;
    if (BANDS.every((b) => d.weights[b] >= 0) && d.hitRate > 0 && d.hitRate <= 1 && d.cost > 0 && d.travelMins > 0) nonNeg++;
  }
  ok('every destination weight vector sums to exactly 1', sums === DESTINATIONS.length, `${sums}/${DESTINATIONS.length}`);
  ok('hitRate ∈ (0,1], and cost / travelMins / weights are positive', nonNeg === DESTINATIONS.length, `${nonNeg}/${DESTINATIONS.length}`);

  for (let i = 1; i < DESTINATIONS.length; i++) {
    const a = DESTINATIONS[i - 1], b = DESTINATIONS[i];
    if (b.cost > a.cost) costUp++;
    if (b.hitRate < a.hitRate) hitDown++;
    if (b.travelMins > a.travelMins) travelUp++;
    if (b.weights.gem >= a.weights.gem) gemUp++;
  }
  const steps = DESTINATIONS.length - 1;
  ok('cost rises strictly along the ladder', costUp === steps, `${costUp}/${steps}`);
  ok('hit rate falls strictly along the ladder', hitDown === steps, `${hitDown}/${steps}`);
  ok('travel time rises strictly along the ladder', travelUp === steps, `${travelUp}/${steps}`);
  ok('the advertised gem weight never falls as you pay more', gemUp === steps, `${gemUp}/${steps}`);
}

// ── §2  destinationById — the contract at the boundary ───────────────────────────────────────────────
// It is typed `Destination | undefined` and the two production callers rely on that exact shape:
// `api.ts:1402` does `if (!dest) throw apiErr('unknown destination')` — a THROW is the correct outcome of
// dispatching to a bogus id, because the alternative (silently substituting a destination) would charge
// the player for a trip he did not ask for. `api.ts:293` (missionView) does `dest?.name ?? m.destination`,
// which is what lets an old save whose destination id was later renamed still render its own trips.
// So the gate is: unknown → undefined, no throw, and NEVER a fallback object.
console.log('\n=== 2. destinationById ===');
{
  const round = DESTINATIONS.every((d) => destinationById(d.id) === d);
  ok('every id in DESTINATIONS round-trips to the same object', round);
  const unknowns = ['', ' ', 'nope', 'PARKS', 'parks ', '0', '__proto__', 'constructor', 'toString', 'find'];
  let undef = 0, threw = 0;
  for (const u of unknowns) {
    try { if (destinationById(u) === undefined) undef++; } catch { threw++; }
  }
  ok('an unknown id returns undefined and never a stand-in destination', undef === unknowns.length, `${undef}/${unknowns.length} (${threw} threw)`);
  ok('lookup is case- and whitespace-sensitive (no accidental fuzzy match)', destinationById('PARKS') === undefined && destinationById('parks ') === undefined);
  ok('destinationById covers the whole table — nothing is unreachable by id', DESTINATIONS.every((d) => destinationById(d.id) !== undefined));
}

// ── §3  REMOVED 2026-09-02 ─────────────────────────────────────────────────────────────────────────
// This section tested `travelMs`, the wall-clock reveal timer. Its own header asserted that
// "api.ts:1427 writes `ready_at = now + travelMs(dest)`" -- which had stopped being true: the timer moved
// to game time (`matchesPlayed() + travelMatchdays(dest)`) and `travelMs` was left exported, imported,
// aliased in api.ts and thoroughly tested with NO production caller at all. Six assertions guarding a
// function the game no longer ran, under a comment describing a line that no longer existed.
// The function is gone; `travelMatchdays` is what the trip costs now, and §2 covers the ladder it reads.

// ── §4  rollMission — sealed, deterministic, and self-consistent ─────────────────────────────────────
// "Same (missionId, destination, playerTier) → same result forever" is the whole reason the outcome can
// be written into the save at dispatch. If it drifted, a replayed or re-derived mission would hand back a
// different prospect than the save already contains.
console.log('\n=== 4. rollMission is sealed and self-consistent ===');
{
  let repeat = 0, shape = 0, idOk = 0, ovrOk = 0, capOk = 0, bandOk = 0, total = 0;
  const overallToBands = new Map<number, Set<ScoutBand>>();
  for (const d of DESTINATIONS) for (const hq of [1, 5, 10]) {
    const m = scoutHitMult(hq);
    for (let i = 0; i < 2500; i++) {
      total++;
      const a = rollMission(mid(i), d, 'base', m, hq);
      const b = rollMission(mid(i), d, 'base', m, hq);
      if (JSON.stringify(a) === JSON.stringify(b)) repeat++;
      // found ⇔ player ⇔ band ⇔ overall. api.ts persists `found`, `player_json` and `band` as three
      // independent columns; if they could disagree, `signMission` would hand the club a null player.
      if (a.found ? a.player !== null && a.band !== null && a.overall !== null
                  : a.player === null && a.band === null && a.overall === null) shape++;
      if (!a.found) { idOk++; ovrOk++; capOk++; bandOk++; continue; }
      if (a.player!.id === `scout-${mid(i)}`) idOk++;
      if (a.overall === overall(a.player!)) ovrOk++;   // the number on the card is the player's real rating
      if (Object.values(a.player!.attrs).every((v) => typeof v !== 'number' || v <= 12)) capOk++; // LOANEE_MAX_STAT
      if (BANDS.includes(a.band as ScoutBand)) bandOk++;
      const set = overallToBands.get(a.overall as number) ?? new Set<ScoutBand>();
      set.add(a.band as ScoutBand); overallToBands.set(a.overall as number, set);
    }
  }
  ok('a re-roll of the same (missionId, dest, tier, hq) is byte-identical', repeat === total, `${repeat}/${total}`);
  ok('found ⇔ player ⇔ band ⇔ overall are never out of step', shape === total, `${shape}/${total}`);
  ok('the prospect id is derived from the mission id', idOk === total, `${idOk}/${total}`);
  ok('the reported overall equals overall(player) — not a stale copy', ovrOk === total, `${ovrOk}/${total}`);
  ok('no prospect stat exceeds the loanee cap of 12', capOk === total, `${capOk}/${total}`);
  ok('the reported band is always one of the four ScoutBands', bandOk === total, `${bandOk}/${total}`);

  // The band label and the overall rating are printed side by side on the same mission card. Whatever
  // else is true of the mapping, a HIGHER-rated prospect must never be given a LOWER band than a
  // lower-rated one, or the card contradicts itself in front of the player. (This is also the gate that
  // would catch a "fix" to D1 that returned the internally-drawn band instead: that band is not a
  // function of `overall`, so a 4-rated RAW and a 4-rated GEM would appear side by side.)
  const seen = [...overallToBands.entries()].sort((a, b) => a[0] - b[0]);
  let inversions = 0;
  for (let i = 1; i < seen.length; i++) {
    const prevMax = Math.max(...[...seen[i - 1][1]].map((b) => RANK[b]));
    const currMin = Math.min(...[...seen[i][1]].map((b) => RANK[b]));
    if (currMin < prevMax) inversions++;
  }
  ok('the band shown is monotone in the overall shown — the card never contradicts itself', inversions === 0,
    seen.map(([o, s]) => `${o}:${[...s].join('/')}`).join(' '));
}

// ── §5  THE ADVERTISED HIT RATE IS THE DELIVERED HIT RATE ────────────────────────────────────────────
// The headline number on every destination card. `previewOdds` and `rollMission` each compute
// `min(0.95, hitRate × HIT_MULT[tier] × hqMult)` — separately, in two places, from two literal 0.95s.
// Restating that expression here would pass for any pair of agreeing typos, so this ROLLS the missions
// and counts them. Every destination × every buyable HQ level, which is exactly where the sibling
// module's 12%-advertised / 6%-delivered gap would have shown up.
console.log('\n=== 5. previewOdds vs what rollMission actually delivers ===');
{
  const N = 20000, TOL = 0.016;   // 20k trips ⇒ ±0.35pp of sampling noise per cell; 1.6pp is ~4.5σ
  let agreed = 0, cells = 0, worst = 0, worstAt = '';
  let finite = 0;
  for (const d of DESTINATIONS) for (const hq of HQ_LEVELS) {
    cells++;
    const m = scoutHitMult(hq);
    const adv = previewOdds(d, 'base', m, hq);
    if (Number.isFinite(adv.hitRate) && Number.isFinite(adv.upgradeChance)) finite++;
    const del = sample(d, m, hq, N).hitRate;
    const gap = Math.abs(del - adv.hitRate);
    if (gap <= TOL) agreed++;
    if (gap > worst) { worst = gap; worstAt = `${d.id}@hq${hq}: advertised ${pct(adv.hitRate)}, delivered ${pct(del)}`; }
  }
  ok('every destination × HQ level advertises the hit rate it delivers', agreed === cells,
    `${agreed}/${cells} cells within 1.6pp; worst ${(worst * 100).toFixed(2)}pp — ${worstAt}`);
  ok('previewOdds never quotes a non-finite percentage for a buyable HQ level', finite === cells, `${finite}/${cells}`);
  // The 0.95 ceiling is a shared constant in two functions. If one moved, the cheap destinations would
  // advertise a hit rate the roll refuses to honour, and only at high HQ levels — i.e. only for the
  // players who had already paid for the facility.
  const capped = previewOdds(DESTINATIONS[0], 'base', 10, 10);
  ok('the 0.95 hit ceiling is shared by preview and roll', capped.hitRate === 0.95 && Math.abs(sample(DESTINATIONS[0], 10, 10, N).hitRate - 0.95) <= TOL,
    `preview ${pct(capped.hitRate)}`);
}

// ── §6  the Scouting HQ is a real dial, monotone in both directions ──────────────────────────────────
// The module header says the whole band-upgrade mechanic sat at a hard zero for the entire life of the
// game because it was gated on a removed NFT tier. It now runs off a facility the player spends coins on,
// so "spending more never makes it worse" is the claim that has to hold POINTWISE — an average that rises
// while individual trips regress is exactly the flat-dial failure this repo keeps finding.
console.log('\n=== 6. the HQ level is monotone, trip by trip ===');
{
  let hitRegress = 0, ovrRegress = 0, pairs = 0;
  for (const d of DESTINATIONS) for (let hq = 1; hq < 10; hq++) {
    for (let i = 0; i < 1200; i++) {
      const lo = rollMission(mid(i), d, 'base', scoutHitMult(hq), hq);
      const hi = rollMission(mid(i), d, 'base', scoutHitMult(hq + 1), hq + 1);
      pairs++;
      if (lo.found && !hi.found) hitRegress++;
      if (lo.found && hi.found && (hi.overall as number) < (lo.overall as number)) ovrRegress++;
    }
  }
  ok('upgrading the Scouting HQ never turns a hit into a miss', hitRegress === 0, `${hitRegress}/${pairs} regressions`);
  ok('upgrading the Scouting HQ never lowers a prospect you would already have got', ovrRegress === 0, `${ovrRegress}/${pairs} regressions`);

  // and the dial must actually MOVE — a monotone-but-flat dial passes both bars above.
  const lo = sample(DESTINATIONS[2], scoutHitMult(1), 1, 20000);
  const hi = sample(DESTINATIONS[2], scoutHitMult(10), 10, 20000);
  ok('HQ 1 → 10 lifts the hit rate by a margin a player would notice', hi.hitRate - lo.hitRate > 0.15,
    `${pct(lo.hitRate)} → ${pct(hi.hitRate)}`);
  ok('HQ 1 → 10 lifts the average prospect, not just the hit rate', hi.meanOvr - lo.meanOvr > 0.5,
    `mean overall ${lo.meanOvr.toFixed(2)} → ${hi.meanOvr.toFixed(2)}`);
  ok('hqUpgradeChance is clamped into [0, 0.5] for every buyable level', HQ_LEVELS.every((h) => hqUpgradeChance(h) >= 0 && hqUpgradeChance(h) <= 0.5),
    HQ_LEVELS.map((h) => hqUpgradeChance(h).toFixed(3)).join(' '));

  // and the DESTINATION tier must be a real dial too, at every HQ level — not just at level 1.
  let tierOrdered = 0;
  for (const hq of HQ_LEVELS) {
    const means = DESTINATIONS.map((d) => sample(d, scoutHitMult(hq), hq, 6000).meanOvr);
    if (means.every((m, i) => i === 0 || m > means[i - 1])) tierOrdered++;
  }
  ok('a dearer destination returns a better average prospect at EVERY HQ level', tierOrdered === HQ_LEVELS.length,
    `${tierOrdered}/${HQ_LEVELS.length}`);
}

// ── §7  purity — the config is read, never written ───────────────────────────────────────────────────
// previewOdds's own doc says "never mutates config". DESTINATIONS is a module-level array handed straight
// to the client (`api.ts:1388` spreads it into the response), so a single in-place write would persist
// for the rest of the session and drift the odds of every later trip in the same run.
console.log('\n=== 7. purity ===');
{
  const before = JSON.stringify(DESTINATIONS);
  for (const d of DESTINATIONS) for (const hq of HQ_LEVELS) {
    previewOdds(d, 'base', scoutHitMult(hq), hq);
    for (let i = 0; i < 50; i++) rollMission(mid(i), d, 'base', scoutHitMult(hq), hq);
  }
  ok('neither previewOdds nor rollMission mutates DESTINATIONS', JSON.stringify(DESTINATIONS) === before);
  const d0 = { ...DESTINATIONS[0], weights: { ...DESTINATIONS[0].weights } };
  const snap = JSON.stringify(d0);
  rollMission('probe', d0, 'base', 1.4, 9); previewOdds(d0, 'base', 1.4, 9);
  ok('neither mutates the Destination object it is handed', JSON.stringify(d0) === snap);
}

// ── MEASURED, NOT GATED ──────────────────────────────────────────────────────────────────────────────
// Defects found while writing this file. Gating them would pin today's broken numbers and turn this
// harness red the day somebody fixes one, so they are printed instead. Do not delete them without
// checking the numbers have actually moved.
console.log('\n=== MEASURED — defects, deliberately not gated ===');
{
  const N = 40000;

  // D1 — THE ADVERTISED QUALITY MIX IS NOT THE DELIVERED QUALITY MIX.
  // `Destination.weights` is documented as "band distribution WHEN a player is found" and is rendered
  // literally as a four-segment percentage bar titled "quality mix if a player is found". But
  // `rollMission` uses the drawn band only to pick a `q` out of BAND_Q — raw [1,3], squad [4,6],
  // quality [6,8], gem [8,10], centres on the 1-20 stat scale — and then THROWS THE BAND AWAY and
  // relabels the finished player with `bandOf(overall)`, whose thresholds are 7 / 9 / 11. Two different
  // scales, plus a hard stat cap of 12 that squeezes 'gem' into the two-point window {11,12}. Measured
  // at HQ 1, where the upgrade chance is exactly zero, so this is the scale mismatch alone.
  console.log('  D1  advertised weights vs delivered band label (HQ 1, upgrade chance exactly 0):');
  for (const d of DESTINATIONS) {
    const s = sample(d, 1, 1, N);
    const tvd = BANDS.reduce((a, b) => a + Math.abs(s.band[b] / s.found - d.weights[b]), 0) / 2;
    console.log(`      ${d.id.padEnd(12)} total variation ${(tvd * 100).toFixed(1)}pp  |  `
      + BANDS.map((b) => `${b} adv ${(d.weights[b] * 100).toFixed(0)}% → del ${(s.band[b] / s.found * 100).toFixed(1)}%`).join('  '));
  }
  console.log('      the same mismatch isolated: synthetic destinations that draw ONE band with probability 1 —');
  for (const b of BANDS) {
    const synth: Destination = { id: `synth-${b}`, name: b, blurb: '', hitRate: 1, travelMins: 1, cost: 1,
      weights: { raw: b === 'raw' ? 1 : 0, squad: b === 'squad' ? 1 : 0, quality: b === 'quality' ? 1 : 0, gem: b === 'gem' ? 1 : 0 } };
    const s = sample(synth, 1, 1, N);
    console.log(`      drawn ${b.padEnd(8)} → shown ` + BANDS.map((x) => `${x} ${(s.band[x] / s.found * 100).toFixed(1)}%`).join('  ')
      + `   (mean overall ${s.meanOvr.toFixed(2)})`);
  }

  // D2 — THE MOST EXPENSIVE DESTINATION IS STRICTLY DOMINATED ONCE THE HQ IS LEVELLED.
  // "Strictly dominated" here is the strong form: a CHEAPER destination returns a prospect of quality k
  // or better MORE OFTEN, PER TRIP, at EVERY quality threshold — so it wins whether the player's binding
  // constraint is coins or the 3-7 trips a season, and whatever quality he is shopping for. At HQ 1
  // nothing is dominated and the ladder is a genuine trade-off; the domination is manufactured by the HQ
  // upgrade mechanic, which is worth less at the top of the ladder (bumpUp['gem'] === 'gem' is a no-op,
  // and BAND_Q's gem centre is already pressed against the stat cap) than at the bottom.
  const DOM_N = 90000;
  // Compared over k = 1…11, which spans every boundary `bandOf` uses (7 / 9 / 11). k = 12 is reported
  // separately: it is the LOANEE_MAX_STAT ceiling, every destination converges there, and the gap between
  // them is inside sampling noise at any N this harness can afford — so including it would let one noisy
  // column veto a result that is comfortable everywhere else.
  console.log('  D2  strict domination — a dearer destination beaten at EVERY quality threshold 1…11:');
  for (const hq of [1, 5, 8, 10]) {
    const m = scoutHitMult(hq), disc = scoutCostDiscount(hq);
    const rows = DESTINATIONS.map((d) => ({ id: d.id, cost: Math.round(d.cost * (1 - disc)), s: sample(d, m, hq, DOM_N) }));
    const hits: string[] = [];
    for (const a of rows) for (const b of rows) {
      if (a.cost <= b.cost) continue;
      let all = true, margin = 1, at = 1;
      for (let k = 1; k <= 11; k++) {
        if (a.s.atLeast[k] > b.s.atLeast[k]) all = false;
        if (b.s.atLeast[k] - a.s.atLeast[k] < margin) { margin = b.s.atLeast[k] - a.s.atLeast[k]; at = k; }
      }
      // 3σ on the difference of two independent proportions, AT THE THRESHOLD THAT IS TIGHTEST for this
      // pair. A margin under it is sampling noise, not domination — this repo has a documented history of
      // an extremum standing in for a population, and a 0.01pp "domination" would be exactly that.
      const p = Math.max(a.s.atLeast[at], b.s.atLeast[at], 1e-6);
      const sigma3 = 3 * Math.sqrt(2 * p * (1 - p) / DOM_N);
      if (all && margin > sigma3) {
        const k12 = b.s.atLeast[12] - a.s.atLeast[12];
        hits.push(`${a.id} (${a.cost}c) beaten by ${b.id} (${b.cost}c) — tightest at overall ≥${at}: ${(margin * 100).toFixed(2)}pp vs a ${(sigma3 * 100).toFixed(2)}pp noise floor; at ≥12 ${(k12 * 100).toFixed(2)}pp (noise)`);
      }
    }
    console.log(`      HQ ${String(hq).padStart(2)}: ${hits.length ? hits.join(' ; ') : 'none dominated'}`);
  }
  {
    const m = scoutHitMult(10);
    console.log('      per-trip P(overall ≥ k) at HQ 10 — the 140-coin destination trails continental AND foreign in every column:');
    for (const d of DESTINATIONS) {
      const s = sample(d, m, 10, DOM_N);
      console.log(`      ${d.id.padEnd(12)} ` + [1, 7, 8, 9, 10, 11, 12].map((k) => `≥${k} ${(s.atLeast[k] * 100).toFixed(2)}%`).join('  '));
    }
  }

  // D3 — THE "↑ N% upgrade" PILL OVERSTATES, AND WORST WHERE IT COSTS MOST.
  // previewOdds quotes hqUpgradeChance(level) and hqUpgradeChance's own doc calls it the "chance a found
  // prospect is bumped up a quality band". But bumpUp['gem'] === 'gem', so at a destination whose drawn
  // band is often already gem the roll fires and changes nothing — and the shown label moves even less
  // often than the rating does, because of D1. hqMult is held at 1 so only the upgrade term varies.
  console.log('  D3  advertised upgrade chance vs prospects that actually improve (hit rate held fixed):');
  for (const d of DESTINATIONS) for (const hq of [5, 10]) {
    let found = 0, ovrUp = 0, labelUp = 0;
    for (let i = 0; i < 25000; i++) {
      const lo = rollMission(mid(i), d, 'base', 1, 1), hi = rollMission(mid(i), d, 'base', 1, hq);
      if (!lo.found) continue;
      found++;
      if ((hi.overall as number) > (lo.overall as number)) ovrUp++;
      if (RANK[hi.band as ScoutBand] > RANK[lo.band as ScoutBand]) labelUp++;
    }
    const adv = previewOdds(d, 'base', 1, hq).upgradeChance;
    console.log(`      ${d.id.padEnd(12)} hq${String(hq).padStart(2)}  card says ↑${(adv * 100).toFixed(0)}%  →  rating improved ${(ovrUp / found * 100).toFixed(1)}%  |  band LABEL improved ${(labelUp / found * 100).toFixed(1)}%`);
  }

  // D4 — the band the card prints depends on the prospect's POSITION, which is advertised nowhere.
  // `overall()` for a GK is avg(keeping, keeping, positioning, strength) — keeping counted twice, and
  // rollAttrs gives a keeper +6 keeping. So the same drawn band is relabelled differently by position.
  console.log('  D4  same destination, same drawn band, different label by position (Wonderkid Circuit, HQ 1):');
  {
    const d = DESTINATIONS[DESTINATIONS.length - 1];
    const agg: Record<string, { n: number; gem: number; ovr: number }> = {};
    for (let i = 0; i < 120000; i++) {
      const o = rollMission(mid(i), d, 'base', 1, 1);
      if (!o.found) continue;
      const r = o.player!.role;
      (agg[r] ??= { n: 0, gem: 0, ovr: 0 });
      agg[r].n++; agg[r].ovr += o.overall as number; if (o.band === 'gem') agg[r].gem++;
    }
    console.log('      card advertises gem 30% for every prospect:  '
      + Object.entries(agg).map(([r, v]) => `${r} ${(v.gem / v.n * 100).toFixed(1)}% (mean ovr ${(v.ovr / v.n).toFixed(2)})`).join('  '));
  }

  // D5 — REMOVED with §3: it printed what `travelMs`'s unused `scale` parameter would write into
  // `ready_at`, for a function that no longer exists and a field no longer computed that way.

  const d0 = DESTINATIONS[0]; // was declared by the removed D5; D6 still needs it

  // D6 — previewOdds and rollMission disagree on a non-finite HQ level: the card quotes NaN%, the roll
  // silently behaves as 0 (`rng() < NaN` is false). facilities.ts only produces 1..10, so this is latent.
  const nanOdds = previewOdds(d0, 'base', 1, NaN);
  console.log(`  D6  previewOdds(parks,'base',1,NaN) = { hitRate: ${nanOdds.hitRate}, upgradeChance: ${nanOdds.upgradeChance} }`
    + `  → the card would read "↑ NaN% upgrade"; rollMission behaves as 0. Latent: facilities only yields 1…10.`);
}

// ── NOT DEFECTS — checked and cleared, so nobody re-opens them ────────────────────────────────────────
console.log('\n=== checked and CLEARED (the design working, not a bug) ===');
{
  console.log('  · previewOdds.hitRate matches the delivered rate everywhere (§5). The sibling module\'s'
    + ' advertised-vs-delivered gap does NOT exist on this number.');
  console.log('  · rollMission not seeding on hqMult/hqLevel is deliberate and load-bearing: it is what makes'
    + ' the HQ dial monotone trip-by-trip (§6) instead of merely monotone on average.');
  console.log(`  · a hitRate-1.0 destination still misses ~5% of the time — that is the shared min(0.95,…)`
    + ' ceiling, applied identically by preview and roll. Not a leak.');
  console.log('  · at low HQ levels no destination is strictly dominated (D2): the ladder is a genuine trade-off,'
    + ' cheap places win on volume and dear places win above overall 10. The domination only appears once the HQ is levelled.');
  console.log(`  · weights sum to exactly 1 in float at all ${DESTINATIONS.length} destinations, and the gem→raw accumulation`
    + ' order means a short sum would fall through to \'raw\' rather than crash. No rounding hole.');
}

console.log(fails ? `\n✗ ${fails} scouting-mission check(s) failed` : '\n✓ scouting missions: the advertised hit rate is the delivered hit rate, the roll is sealed and monotone, and the ladder is ordered — see MEASURED above for the quality mix, which is not');
if (fails) process.exit(1);
