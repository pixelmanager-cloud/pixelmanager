// Seasons & divisions — Phase A (time-boxed seasons) + Phase B (division pyramid
// + ~POD_SIZE-club pods + promotion/relegation). Standings are always scoped to a
// player's pod, so a table is a legible ~20-row race no matter the population.
// See docs/seasons-and-divisions.md.
import { randomUUID } from 'node:crypto';
import { autoPickXI } from '@fm/shared';
import type { Store, Season, PodRef } from './store.js';
import { buildTable, runMatch, elo, validateLineup } from './game.js';
import { seasonPlacementReward, WIN_COINS, DRAW_COINS, LOSS_COINS } from './market.js';
import { ownedPlayers } from './nft.js';
import { trainingConditioning, stadiumIncome, fanIncomeMult, fanHomeBoost, sponsorIncome, squadMarketability } from './facilities.js';
import { rollMatchInjuries } from './injuries.js';
import { unavailableTokenIds, tokenToPlayer } from './tokens.js';
import { advanceTokensAtRollover } from './lifecycle.js';
import { recordMatchStats } from './matchstats.js';

import { computeCup, type SquadMap } from './cup.js';

/** Merge a club with the star NFTs its linked wallet owns (read-only). */
async function withNfts(db: Store, accountId: string, c: { club: any; standingOrders: any }): Promise<typeof c> {
  const nfts = await ownedPlayers(await db.walletOf(accountId));
  if (nfts.length) {
    const have = new Set(c.club.players.map((p: any) => p.id));
    c.club = { ...c.club, players: [...c.club.players, ...nfts.filter((p) => !have.has(p.id))] };
  }
  return c;
}

const SEASON_MS = Math.max(1, Number(process.env.SEASON_DAYS ?? 7)) * 24 * 60 * 60 * 1000;
export const POD_SIZE = Math.max(2, Number(process.env.POD_SIZE ?? 20));
export const PROMOTE = 3;
export const RELEGATE = 3;
/** Cup champion prize, scaled by tier (Sunday League → World Class). */
export const CUP_PRIZE_BASE = 200;
export const CUP_PRIZE_STEP = 120;
/** soft daily cap: matches a manager can actively start per UTC day (rest auto-resolve at season end).
 *  Default 6 pairs with a 38-fixture double round-robin (6×7=42 ≥ 38, so a diligent manager finishes). */
export const MATCHES_PER_DAY = Math.max(1, Number(process.env.MATCHES_PER_DAY ?? 6));

/** Midnight UTC for the day containing `now` (ms since epoch). */
export const startOfUtcDay = (now: number): number => now - (now % 86_400_000);

/** Bottom → top. A pure config array; resize freely (see the design doc). */
export const TIERS = [
  'SUNDAY LEAGUE', 'COUNTY', 'REGIONAL', 'NATIONAL', 'LEAGUE TWO',
  'LEAGUE ONE', 'CHAMPIONSHIP', 'PREMIER', 'CONTINENTAL', 'WORLD CLASS',
] as const;
const BOTTOM = TIERS[0];

/**
 * Return the active season, creating the first one on demand and rolling an
 * expired season over (archive + open the next) before returning it. Lazy on
 * request — no cron. Server wall-clock only (seasons are bookkeeping around
 * matches, never inside the deterministic engine).
 */
export async function ensureSeason(db: Store, now: number): Promise<Season> {
  let s = await db.currentSeason();
  if (!s) return db.createSeason(randomUUID(), 1, now, now + SEASON_MS);
  if (now >= s.endsAt) {
    await rollover(db, s, now);
    s = await db.createSeason(randomUUID(), s.number + 1, now, now + SEASON_MS);
  }
  return s;
}

/** Force the current season to close and a fresh one to open (ops/testing). */
export async function forceRollover(db: Store, now: number): Promise<Season> {
  const s = await db.currentSeason();
  if (s) await rollover(db, s, now);
  return db.createSeason(randomUUID(), (s?.number ?? 0) + 1, now, now + SEASON_MS);
}

/**
 * Ensure the account is placed in a pod for the active season. Placement: their
 * persistent tier (promotion/relegation progress; new players start at the bottom),
 * dropped into the first pod with room, else a fresh pod. Idempotent.
 */
export async function ensurePod(db: Store, season: Season, accountId: string): Promise<PodRef> {
  const existing = await db.podOf(season.id, accountId);
  if (existing) return existing;
  const tier = await db.accountTier(accountId);
  const counts = await db.tierPodCounts(season.id, tier);
  let pod = 0;
  for (; ; pod++) {
    const c = counts.find((x) => x.pod === pod);
    if (!c || c.count < POD_SIZE) break; // first pod with a free slot (or a brand-new pod)
  }
  await db.assignPod(season.id, accountId, tier, pod);
  return { tier, pod };
}

/** Results among a specific set of accounts (a pod), so standings never leak cross-pod. */
export function resultsAmong(results: Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>, ids: Set<string>) {
  return results.filter((r) => ids.has(r.home_id) && ids.has(r.away_id));
}

/** Simulate one fixture from both clubs' standing orders and persist it (used to auto-resolve
 *  fixtures a manager never got to at season end, so every table completes fairly). */
async function simulateMatch(db: Store, homeId: string, awayId: string, seasonId: string, seasonNumber: number, now: number): Promise<void> {
  const [home, away, homeC0, awayC0] = await Promise.all([db.accountById(homeId), db.accountById(awayId), db.getClub(homeId), db.getClub(awayId)]);
  if (!home || !away || !homeC0 || !awayC0) return;
  const [homeC, awayC] = await Promise.all([withNfts(db, homeId, homeC0), withNfts(db, awayId, awayC0)]);
  // full parity with a live match: bench injured + contract-lapsed NFTs, then conditioning/coins/gate/injuries
  const [homeFac, awayFac, homeInj, awayInj, homeUnavail, awayUnavail] = await Promise.all([
    db.getFacilities(homeId), db.getFacilities(awayId), db.getInjuries(homeId), db.getInjuries(awayId),
    unavailableTokenIds(db, homeId, seasonNumber), unavailableTokenIds(db, awayId, seasonNumber),
  ]);
  const benchOut = (club: typeof homeC.club, inj: Array<{ player_id: string }>, unavail: Set<string>) => {
    const out = new Set([...inj.map((x) => x.player_id), ...unavail]);
    const available = club.players.filter((p) => !out.has(p.id));
    return available.length >= 11 ? { ...club, players: available } : club;
  };
  homeC.club = benchOut(homeC.club, homeInj, homeUnavail);
  awayC.club = benchOut(awayC.club, awayInj, awayUnavail);
  // fall back to a valid auto-pick if a standing XI references unavailable players (injured / transferred NFT)
  const lineupFor = (c: typeof homeC) => {
    const l = { formation: c.standingOrders.formation, playerIds: c.standingOrders.playerIds, duties: c.standingOrders.duties };
    return validateLineup(c.club, l) ? l : autoPickXI(c.club, c.standingOrders.formation);
  };
  const hl = lineupFor(homeC);
  const al = lineupFor(awayC);
  const conditioning = { home: trainingConditioning(homeFac.training), away: trainingConditioning(awayFac.training) };
  const { seed, homeTeam, awayTeam, result, homeFitness, awayFitness, events } = runMatch(homeC.club, hl, homeC.standingOrders.tactics, awayC.club, al, awayC.standingOrders.tactics, conditioning, fanHomeBoost(homeFac.fanzone));
  await recordMatchStats(db, seasonId, homeId, awayId, homeTeam, awayTeam, events, result); // auto-resolved matches count too
  const sh = result[0] > result[1] ? 1 : result[0] < result[1] ? 0 : 0.5;
  const [nh, na] = elo(home.rating, away.rating, sh);
  const coinsFor = (s: number) => (s === 1 ? WIN_COINS : s === 0.5 ? DRAW_COINS : LOSS_COINS);
  const homeTierIdx = Math.max(0, TIERS.indexOf((await db.accountTier(homeId)) as typeof TIERS[number]));
  const gate = Math.round(stadiumIncome(homeFac.stadium, homeTierIdx, sh === 1 ? 'win' : sh === 0 ? 'loss' : 'draw') * fanIncomeMult(homeFac.fanzone));
  await Promise.all([
    db.setRating(homeId, nh), db.setRating(awayId, na),
    db.addCoins(homeId, coinsFor(sh) + gate), db.addCoins(awayId, coinsFor(1 - sh)),
    db.decrementInjuries(homeId), db.decrementInjuries(awayId),
  ]);
  const homeNew = rollMatchInjuries(homeTeam, homeFitness, homeFac.medical, seed);
  const awayNew = rollMatchInjuries(awayTeam, awayFitness, awayFac.medical, seed ^ 0x5f3759df);
  await Promise.all([
    ...homeNew.map((n) => db.addInjury(homeId, n.playerId, n.matches)),
    ...awayNew.map((n) => db.addInjury(awayId, n.playerId, n.matches)),
  ]);
  await db.saveMatch({
    id: randomUUID(), homeId, awayId, homeTeam, awayTeam,
    homeTactics: homeC.standingOrders.tactics, awayTactics: awayC.standingOrders.tactics,
    seed, homeScore: result[0], awayScore: result[1], createdAt: now, seasonId, initiatorId: homeId,
  });
}

/**
 * Archive a finished season pod-by-pod: rank each pod's participants, record
 * honours, and move the top PROMOTE up a tier / bottom RELEGATE down a tier
 * (persistent account.tier). Re-podding happens lazily next season via ensurePod.
 */
async function rollover(db: Store, s: Season, now: number): Promise<void> {
  let pods = await db.seasonPods(s.id);
  const allResults = await db.seasonResults(s.id);
  // transitional fallback: a pre-Phase-B season has no pod rows → treat everyone as one bottom-tier pod
  const fallback = pods.length === 0;
  if (fallback) pods = [{ tier: BOTTOM, pod: 0 }];

  for (const { tier, pod } of pods) {
    const members = fallback ? await db.allAccounts() : await db.podMembers(s.id, tier, pod);
    const ids = new Set(members.map((m) => m.id));
    let results = resultsAmong(allResults, ids);
    const played = new Set<string>();
    for (const r of results) { played.add(r.home_id); played.add(r.away_id); }

    // auto-resolve: complete the DOUBLE round-robin among ACTIVE members (played >=1) so their
    // table is fair regardless of who logged in — every unplayed leg (home & away) plays out
    // from both clubs' standing orders.
    const active = members.filter((m) => played.has(m.id)).map((m) => m.id);
    for (let a = 0; a < active.length; a++) {
      for (let b = 0; b < active.length; b++) {
        if (a === b) continue;
        const home = active[a], away = active[b];
        const done = results.some((r) => r.home_id === home && r.away_id === away);
        if (!done) await simulateMatch(db, home, away, s.id, s.number, now);
      }
    }
    // re-read this pod's results now that the fixtures are complete
    results = resultsAmong(await db.seasonResults(s.id), ids);
    const ranked = buildTable(members, results).filter((row) => played.has(row.id));
    const tierIdx = TIERS.indexOf(tier as typeof TIERS[number]);
    const bigEnough = ranked.length > PROMOTE + RELEGATE; // only relegate where there was a real race
    const outcomes = new Map<string, { league: number; cup: number; promotion: number; tierIdx: number }>();

    for (let i = 0; i < ranked.length; i++) {
      const acct = ranked[i];
      const promoted = i < PROMOTE && tierIdx < TIERS.length - 1;
      outcomes.set(acct.id, { league: i === 0 ? 1 : 0, cup: 0, promotion: promoted ? 1 : 0, tierIdx });
      // season prize money by placement (the coin sink that becomes an ERC-20 payout later)
      const reward = seasonPlacementReward(tierIdx, i + 1, ranked.length, promoted);
      // Commercial Dept: sponsorship income, scaled by division + trophies already in the cabinet
      const [fac, honours, clubc] = await Promise.all([db.getFacilities(acct.id), db.honoursFor(acct.id, 999), db.getClub(acct.id)]);
      const trophies = honours.filter((h) => h.title === 1).length;
      // marketable (career-built) players pull bigger sponsors — fame paying off in the manager economy
      const marketAvg = squadMarketability(clubc?.club?.players ?? []);
      const sponsor = sponsorIncome(fac.sponsor, tierIdx, trophies, marketAvg);
      await db.addCoins(acct.id, reward + sponsor);
      await db.addHonour(acct.id, s.id, s.number, tier, i + 1, i === 0 ? 1 : 0, now, reward, 'league');
      let newIdx = tierIdx;
      if (promoted) newIdx = tierIdx + 1;
      else if (bigEnough && i >= ranked.length - RELEGATE && tierIdx > 0) newIdx = tierIdx - 1;
      if (newIdx !== tierIdx) await db.setTier(acct.id, TIERS[newIdx]);
    }

    // Cup: crown the pod's knockout champion and pay a tier-scaled prize (a real
    // second trophy to chase alongside the league). Only where a real cup ran.
    if (members.length >= 2) {
      const clubs: SquadMap = new Map();
      for (const m of members) {
        const c = await db.getClub(m.id);
        if (c) clubs.set(m.id, await withNfts(db, m.id, c));
      }
      const cup = computeCup(s.number, members, clubs);
      if (cup.championId) {
        const prize = CUP_PRIZE_BASE + tierIdx * CUP_PRIZE_STEP;
        await db.addCoins(cup.championId, prize);
        await db.addHonour(cup.championId, s.id, s.number, tier, 1, 1, now, prize, 'cup');
        const o = outcomes.get(cup.championId); if (o) o.cup = 1;
      }
    }

    // INDIVIDUAL SEASON AWARDS: Golden Boot (goals), Playmaker (assists), League Best (POTM, then
    // goals+assists). Each is a permanent player award (foundation for a future cross-pod World XI /
    // Ballon d'Or), with a tier-scaled coin prize to the owner.
    const pstats = await db.seasonPlayerStats(s.id, [...ids]);
    if (pstats.length) {
      const awardPrize = 40 + Math.max(0, tierIdx) * 20;
      const give = async (kind: string, r: typeof pstats[number] | undefined, value: number) => {
        if (!r || value <= 0) return;
        await db.addAward({ season_id: s.id, season_number: s.number, tier, pod, kind, account_id: r.account_id, player_id: r.player_id, player_name: r.player_name, value, awarded_at: now });
        await db.addCoins(r.account_id, awardPrize);
      };
      const byGoals = [...pstats].sort((a, b) => b.goals - a.goals || (b.assists) - (a.assists))[0];
      const byAssists = [...pstats].sort((a, b) => b.assists - a.assists || (b.goals) - (a.goals))[0];
      const byBest = [...pstats].sort((a, b) => b.potm - a.potm || (b.goals + b.assists) - (a.goals + a.assists))[0];
      await give('golden_boot', byGoals, byGoals?.goals ?? 0);
      await give('playmaker', byAssists, byAssists?.assists ?? 0);
      await give('league_best', byBest, (byBest?.potm ?? 0) || (byBest ? byBest.goals + byBest.assists : 0));
    }

    // PLAYER LIFECYCLE: each owned NFT banks a season of team achievements + peak ability, and anyone
    // who has aged past 40 RETIRES (legacy card + testimonial). Runs after league + cup are settled.
    for (const [ownerId, outcome] of outcomes) await advanceTokensAtRollover(db, ownerId, s.number, outcome);
  }
  await expireLoanees(db, s.id);
  await db.closeSeason(s.id);
}

/** Loanees are 1-season only: strip them from every squad and repair any standing
 *  orders that fielded one, so next season starts from the permanent roster. */
async function expireLoanees(db: Store, seasonId: string): Promise<void> {
  const rows = await db.loaneesInSeason(seasonId);
  if (!rows.length) return;
  const byOwner = new Map<string, Set<string>>();
  for (const r of rows) (byOwner.get(r.owner_id) ?? byOwner.set(r.owner_id, new Set()).get(r.owner_id)!).add(r.player_id);
  for (const [owner, ids] of byOwner) {
    const c = await db.getClub(owner);
    if (!c) continue;
    c.club.players = c.club.players.filter((p) => !ids.has(p.id));
    let so = c.standingOrders;
    if (!so.playerIds.every((id) => c.club.players.some((p) => p.id === id))) {
      so = { ...so, playerIds: autoPickXI(c.club, so.formation).playerIds, duties: undefined }; // re-pick a valid XI
    }
    await db.saveClub(owner, c.club, so);
  }
  await db.deleteLoaneesInSeason(seasonId);
}
