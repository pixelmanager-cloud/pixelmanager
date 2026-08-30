// ── THE MANAGER CAREER, DRIVEN THROUGH THE REAL FACADE ────────────────────────────────────────────────
//
// `analyze_manager_career.ts` answers the same questions against a HAND-WRITTEN strength curve:
//
//     const strengthAt = (season, seed) => clamp(7 + season * invest, 5, 19)
//
// There is no such formula in the game. The club's league strength is the weighted average overall of its
// best eleven (`squadStrength`, main.ts) shifted by the star's age, and that comes out of a squad that is
// bought with coins the club actually earned, ages every season, has to be re-signed, and decays if the
// training ground is not paid for. The probe models a straight line through all of it, which is why it
// reported a 31% top-flight title rate where a critic driving the real economy measured 57-74%.
//
// A gate reporting a fictional number is worse than no gate: it is why every manager-layer problem found
// this week — the unreachable top of the facility ladder, the nine facilities that change nothing, the
// dynasty that runs out of purchases and then out of stories — survived a green playtest for months.
//
// So this drives client/src/api.ts against an in-memory backend: real coins, real transfer market, real
// wages, real aging, real facility purchases and upkeep, real prize money. It is slower, and it is the
// number. Run: npx tsx tools/playtest/manager_career_real.ts [N] [SEASONS]
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { seededLeague, seasonTable, TIERS } from '../../shared/src/clubseason.js';
import { transferList } from '../../shared/src/transfermarket.js';
import { MAX_SQUAD } from '../../shared/src/market.js';
import { overall } from '../../shared/src/teams.js';

// A PROBE THAT CANNOT FAIL IS SCROLLBACK, NOT A GATE. `npm run playtest` is an `&&` chain and
// `scripts/run-qa.mjs` keys on `r.status === 0`; neither reads stdout. This file computed a correct verdict,
// printed it, and exited 0 whatever it said — so the build could not tell five passes from five failures.
// Measured: forcing two of the five checks to FLAG still gave EXIT=0.
const N = Number(process.argv[2] ?? 10);
// TWO HORIZONS, because the game has two. One MANAGER's tenure runs about a dozen seasons — his star
// signs, peaks and retires — and no single generation should conquer the pyramid, or the bloodline is
// decoration. The DYNASTY is many of those end to end, and it is the family that should arrive. Measured
// here: over 12 seasons a club reaches tier 4.8 and the top flight 0% of the time; over 35 it arrives in
// every run, after an average of 20.9 seasons. That is the shape, and it is worth a gate in both directions.
const TENURE = Number(process.argv[3] ?? 12);
const SEASONS = Number(process.argv[4] ?? 35);
const STAR_WEIGHT = 2.2;   // mirrors Game.STAR_WEIGHT — the bloodline star counts double-and-a-bit

/** The league strength the game itself computes: weighted top eleven, shifted by the star's age curve. */
function leagueStrength(players: { id: string; ov: number }[], starId: string | undefined, starAge: number): number {
  const xi = players.slice().sort((a, b) => b.ov - a.ov).slice(0, 11);
  if (!xi.length) return 8;
  let sum = 0, w = 0;
  for (const p of xi) { const k = starId && p.id === starId ? STAR_WEIGHT : 1; sum += p.ov * k; w += k; }
  const age = starAge;
  const mod = age <= 27 ? 0.5 : age <= 30 ? 0 : age <= 33 ? -0.7 : -1.6;
  // ...ON THE QUALITY SCALE, mirroring `clubLeagueStrength`. `generateClub(q)` yields an XI measuring
  // q + 2.35, and every opponent this is compared against is a quality, not an overall. Duplicating the
  // formula here at all is a smell — it is the same shape of defect as the probe this file replaced, which
  // modelled club strength with a straight line — but `main.ts` is DOM-coupled and offers no seam, so the
  // mirror is what is available. It must move whenever `clubLeagueStrength` does.
  return sum / w + mod - 2.35;
}

const FAC_ORDER = ['sponsor', 'stadium', 'shop', 'training', 'fanzone', 'women', 'data', 'youth', 'scouting', 'medical', 'dorm', 'community'];

interface Run { endTier: number; everTop: boolean; firstTop: number; movesUp: number; topSeasons: number; titles: number; peakCoins: number; maxFac: number; lastBuy: number }

async function oneCareer(idx: number, seasons: number): Promise<Run> {
  __setBackendForTests(createInMemoryBackend());
  await api.register(`mgr${idx}`, 'x', `Club ${idx}`, (idx * 2654435761) >>> 0);
  let tier = TIERS, everTop = false, firstTop = -1, movesUp = 0, topSeasons = 0, titles = 0;
  let peakCoins = 0, maxFac = 1, lastBuy = 0, starAge = 24;

  for (let s = 0; s < seasons; s++) {
    const seed = (((idx + 1) * 2654435761) ^ (s * 40503)) >>> 0;
    const me: any = await api.me();
    const players = (me.club?.players ?? []).map((p: any) => ({ id: p.id, ov: overall(p) }));
    const starId = me.club?.players?.find((p: any) => p.token)?.id;
    const strength = leagueStrength(players, starId, starAge);

    const table = seasonTable(seededLeague('Bloodline FC', strength, seed, tier), seed);
    const pos = table.findIndex((r) => r.mine) + 1;
    if (tier === 1) { topSeasons++; if (pos === 1) titles++; }

    // real money for the real finish
    const size = table.length;
    await api.spSeasonReward({ pos, size, tier, sponsor: 'performance', wins: Math.max(0, size - pos), draws: 2, losses: Math.max(0, pos - 1) });
    // real aging, wages, contract expiry and decay
    const facs: any = await api.facilities();
    const lvl = Object.fromEntries(facs.facilities.map((f: any) => [f.key, f.level]));
    maxFac = Math.max(maxFac, ...Object.values(lvl).map(Number));
    await api.advanceSquadSeason({ trainingLvl: lvl.training ?? 1, wonSomething: pos === 1, goodSeason: pos <= Math.ceil(size / 2) });

    // spend: facilities first in the measured-dominant order, then strengthen the squad
    // one purchase a season, in the measured-dominant order, keeping a season's float in the bank
    for (const key of FAC_ORDER) {
      const row = facs.facilities.find((f: any) => f.key === key);
      if (!row || row.upgradeCost == null || row.level >= row.maxLevel) continue;
      const coins = (await api.me()).account.coins;
      if (coins < row.upgradeCost * 2) continue;
      try { await api.upgradeFacility(key); lastBuy = s; } catch { continue; }
      break;
    }
    // A MANAGER SELLS BEFORE HE BUYS. Without this the squad fills to MAX_SQUAD, every further `buyPlayer`
    // throws "squad full" into a swallowed catch, and the club silently stops improving — measured, sixty
    // seasons ending at tier 7 having never reached the top flight, which is the probe modelling a manager
    // who does not manage rather than the game being unwinnable.
    const list = transferList(seed, s, tier);
    for (const l of list.slice(0, 3)) {
      const now: any = await api.me();
      const squad: any[] = now.club?.players ?? [];
      if (!squad.length) break;
      const ranked = squad.map((p: any) => ({ id: p.id, ov: overall(p) })).sort((a, b) => a.ov - b.ov);
      if (l.ov <= ranked[0].ov + 1) continue;                     // no better than what we already have
      if (now.account.coins < l.fee * 2) continue;                // keep a season's float
      if (squad.length >= MAX_SQUAD) { try { await api.sellPlayer(ranked[0].id); } catch { break; } }
      try { await api.buyPlayer(l.player as any, l.fee); lastBuy = s; } catch { break; }
    }
    peakCoins = Math.max(peakCoins, (await api.me()).account.coins);

    if (pos <= 2 && tier > 1) { tier--; movesUp++; } else if (pos >= 9 && tier < TIERS) tier++;
    if (tier === 1 && !everTop) { everTop = true; firstTop = s; }
    if (process.env.TRACE) { const q: any = await api.me(); console.log(`  s${s} tier${tier} pos${pos} str=${strength.toFixed(1)} squad=${(q.club?.players??[]).length} coins=${q.account.coins} fac=${Math.max(...Object.values(lvl).map(Number))}`); }
    starAge++;
    if (starAge > 34) starAge = 24; // the heir takes over; the dynasty continues
  }
  return { endTier: tier, everTop, firstTop, movesUp, topSeasons, titles, peakCoins, maxFac, lastBuy };
}

async function main() {
const runs: Run[] = [];
for (let i = 0; i < N; i++) runs.push(await oneCareer(i, SEASONS));
const tenure: Run[] = [];
for (let i = 0; i < N; i++) tenure.push(await oneCareer(i, TENURE));
const tenureReached = tenure.filter((r) => r.everTop).length;
const tenureTier = tenure.reduce((a, r) => a + r.endTier, 0) / N;

const sum = (f: (r: Run) => number) => runs.reduce((a, r) => a + f(r), 0);
const pct = (n: number) => (100 * n / N).toFixed(0);
const reached = runs.filter((r) => r.everTop);
const topSeasons = sum((r) => r.topSeasons), titles = sum((r) => r.titles);
const avgEndTier = sum((r) => r.endTier) / N;
const titleRate = topSeasons ? (100 * titles / topSeasons) : 0;
const stuck = runs.filter((r) => r.movesUp === 0).length;

console.log(`=== Manager career through the REAL facade — ${N} dynasties x ${SEASONS} seasons (from tier ${TIERS}) ===\n`);
console.log(`  ONE TENURE (${TENURE} seasons): reached the top ${pct(tenureReached)}%, ending tier ${tenureTier.toFixed(1)}`);
console.log(`  reached the top flight at least once: ${pct(reached.length)}%`);
console.log(`  avg seasons to first reach the top:   ${reached.length ? (reached.reduce((a, r) => a + r.firstTop + 1, 0) / reached.length).toFixed(1) : '—'}`);
console.log(`  avg tier at career end:               ${avgEndTier.toFixed(1)}  (1 = top, ${TIERS} = basement)`);
console.log(`  never earned a single promotion:      ${pct(stuck)}%`);
console.log(`  title rate while IN the top flight:   ${titleRate.toFixed(0)}%   (${titles}/${topSeasons} seasons)`);
console.log(`  peak coins ever held:                 ${Math.round(sum((r) => r.peakCoins) / N).toLocaleString()}`);
console.log(`  highest facility level reached:       ${(sum((r) => r.maxFac) / N).toFixed(1)}`);
console.log(`  last season anything was bought:      ${(sum((r) => r.lastBuy) / N).toFixed(0)} of ${SEASONS}\n`);

const checks: Array<[string, boolean, string]> = [
  ['the climb to the top is achievable (>= 55%)', reached.length / N >= 0.55, `${pct(reached.length)}%`],
  ['ONE manager does not conquer the pyramid alone (<= 40% reach the top in a tenure)',
    tenureReached / N <= 0.40, `${pct(tenureReached)}% in ${TENURE} seasons, ending tier ${tenureTier.toFixed(1)}`],
  ['progress is earned — few careers stay stuck (< 20%)', stuck / N < 0.20, `${pct(stuck)}%`],
  ['top-flight titles are a real but hard prize (8-45%)', titleRate >= 8 && titleRate <= 45, `${titleRate.toFixed(0)}%`],
  // The dynasty must still have something to buy late on. Measured before the division merit payment: a
  // 130-season run made its last purchase around season 100 and froze.
  ['the club is still buying things late in the run (last buy in the final third)',
    sum((r) => r.lastBuy) / N >= SEASONS * 0.66, `${(sum((r) => r.lastBuy) / N).toFixed(0)}/${SEASONS}`],
];
let fails = 0;
console.log('=== verdict (real economy) ===');
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails ? `\n✗ ${fails} concern(s) — the manager career does not hold up against the real economy` : `\n✓ the manager career reads healthy against the real economy`);
  if (fails) process.exitCode = 1;
}
main();
