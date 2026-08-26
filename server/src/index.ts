import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import { overall, managerPrestige, signContract, contractCost, contractLength, type Lineup, type Tactics } from '@fm/shared';
import { mintGenesis, tokenToPlayer, tokenContract, tokenAch, legendCardOf, unavailableTokenIds, loadCareer, applyAction, careerState, graduatedFields, rebornFields, rebornPotential, careerSeedFor, trackFor, agentsList, ageOf, SUPPLY_CAP, GENESIS_COST, REBORN_COST, MARKET_FEE_PCT, type CareerAction } from './tokens.js';
import { bumpApps, bumpMorale, advanceTokensAtRollover } from './lifecycle.js';
const isNftPlayer = (id: string) => id.startsWith('nft:');
import { db, type Account, type StandingOrders, type Listing } from './db.js';
import { makeClub, validateLineup, cleanDuties, runMatch, elo, buildTable, FORMATIONS } from './game.js';
import { hashPassword, verifyPassword } from './auth.js';
import { generatePool, trialistAt, LOANEE_CAP, OPP_REVEAL, describeIntel, type OppTier } from './scouting.js';
import { DESTINATIONS, destinationById, rollMission, travelMs, previewOdds, TRIPS_PER_SEASON } from './missions.js';
import {
  FACILITY_KEYS, FACILITY_META, MAX_LEVEL, upgradeCost, effectAt, trainingConditioning, stadiumIncome,
  youthPoolBonus, youthUpgradeChance, scoutHitMult, scoutCostDiscount, scoutExtraTrips, fanIncomeMult, fanHomeBoost, type FacilityKey,
} from './facilities.js';
import type { Player } from '@fm/shared';
import { rollMatchInjuries } from './injuries.js';
import { viewerTiers, scoutNftInfo } from './scoutnft.js';
import { computeCup, type SquadMap } from './cup.js';
import type { PlayerScoutTier } from './market.js';
import { ensureSeason, ensurePod, forceRollover, resultsAmong, startOfUtcDay, PROMOTE, RELEGATE, MATCHES_PER_DAY, TIERS } from './seasons.js';
import {
  revealPlayer, WIN_COINS, DRAW_COINS, LOSS_COINS,
  MIN_SQUAD, MAX_SQUAD, PRICE_MIN, PRICE_MAX,
} from './market.js';
import { autoPickXI, backfillAttrs } from '@fm/shared';
import { isAddress } from 'viem';
import { issueNonce, verifyAndConsume, shortAddr } from './wallet.js';
import { tokenInfo, tokenMeta, tokenBalance } from './token.js';
import { ownedPlayers, nftInfo, nftEnabled } from './nft.js';

/** Load a club and MERGE in the star players its linked wallet owns on-chain.
 * Read/gameplay only — never feed this into saveClub (NFT players live on-chain,
 * not in our DB). Returns undefined if the club doesn't exist. */
async function loadSquad(accountId: string): Promise<{ club: import('@fm/shared').Club; standingOrders: StandingOrders } | undefined> {
  const c = await db.getClub(accountId);
  if (!c) return undefined;
  // merge the owner's PRO-state unified tokens as fieldable players (read-only; saveClub strips nft ids)
  const tokens = await db.tokensOwnedBy(accountId);
  const have = new Set(c.club.players.map((p) => p.id));
  const merged = [...c.club.players];
  for (const t of tokens) if ((t.state === 'pro' || t.state === 'retired') && !have.has(t.id)) { merged.push(tokenToPlayer(t)); have.add(t.id); } // retired shown (benched) so the owner can Reborn
  // on-chain wallet NFTs (deferred path) merge on top when enabled
  if (nftEnabled()) { for (const p of await ownedPlayers(await db.walletOf(accountId))) if (!have.has(p.id)) { merged.push(p); have.add(p.id); } }
  c.club = { ...c.club, players: merged };
  return c;
}

/** A unique handle derived from a base (wallet accounts derive theirs from the address). */
async function uniqueHandle(base: string): Promise<string> {
  let h = base;
  for (let i = 2; await db.handleTaken(h); i++) h = `${base}#${i}`;
  return h;
}

const app = Fastify({ logger: false });
await app.register(cors, { origin: true });
// the client sends `content-type: application/json` on every request; treat an empty
// body as {} so bodyless POSTs (e.g. signing a trialist) aren't rejected.
app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  try { done(null, body ? JSON.parse(body as string) : {}); } catch (e) { done(e as Error, undefined); }
});

declare module 'fastify' {
  interface FastifyRequest { account?: Account }
}
async function requireAuth(req: any, reply: any) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const account = token ? await db.accountByToken(token) : undefined;
  if (!account) return reply.code(401).send({ error: 'unauthorized' });
  req.account = account;
}

const isFormation = (f: unknown): f is Lineup['formation'] => typeof f === 'string' && (FORMATIONS as string[]).includes(f);

app.get('/health', async () => ({ ok: true, service: 'fm-server', storage: process.env.DATABASE_URL ? 'postgres' : 'sqlite-ephemeral' }));

app.post('/register', async (req, reply) => {
  const handle = String((req.body as any)?.handle ?? '').trim();
  const password = String((req.body as any)?.password ?? '');
  if (handle.length < 2 || handle.length > 20) return reply.code(400).send({ error: 'handle must be 2-20 chars' });
  if (password.length < 4 || password.length > 64) return reply.code(400).send({ error: 'password must be 4-64 chars' });
  if (await db.handleTaken(handle)) return reply.code(409).send({ error: 'handle taken' });
  const id = randomUUID(), token = randomUUID().replace(/-/g, '');
  await db.createAccount(id, handle, token, Date.now(), hashPassword(password));
  const { club, standingOrders } = makeClub(id, handle);
  await db.saveClub(id, club, standingOrders);
  return { token, account: { id, handle, rating: 1000, coins: await db.getCoins(id), wallet: null }, club, standingOrders };
});

// log back into an existing club with handle + password. Accounts created before
// passwords existed have no hash yet — the first successful-shaped login claims one.
app.post('/login', async (req, reply) => {
  const handle = String((req.body as any)?.handle ?? '').trim();
  const password = String((req.body as any)?.password ?? '');
  if (!handle || password.length < 4) return reply.code(400).send({ error: 'handle and password required' });
  const auth = await db.accountAuthByHandle(handle);
  if (!auth) return reply.code(401).send({ error: 'wrong handle or password' });
  if (auth.passwordHash === null) {
    await db.setPassword(auth.id, hashPassword(password)); // legacy account claims this password
  } else if (!verifyPassword(password, auth.passwordHash)) {
    return reply.code(401).send({ error: 'wrong handle or password' });
  }
  const c = await loadSquad(auth.id); // include pro tokens as fieldable players
  if (!c) return reply.code(404).send({ error: 'club not found' });
  return { token: auth.token, account: { id: auth.id, handle: auth.handle, rating: auth.rating, coins: await db.getCoins(auth.id), wallet: await db.walletOf(auth.id) }, club: c.club, standingOrders: c.standingOrders };
});

// ── Wallet sign-in (web3 Step 1) — connect a wallet as identity, or link one to
// the current account. No chain/gas: the wallet just signs a nonce to prove ownership.
app.post('/auth/wallet/nonce', async (req, reply) => {
  const address = String((req.body as any)?.address ?? '');
  if (!isAddress(address)) return reply.code(400).send({ error: 'bad address' });
  return { message: issueNonce(address) };
});

app.post('/auth/wallet/verify', async (req, reply) => {
  const address = String((req.body as any)?.address ?? '');
  const signature = String((req.body as any)?.signature ?? '');
  if (!isAddress(address)) return reply.code(400).send({ error: 'bad address' });
  if (!(await verifyAndConsume(address, signature))) return reply.code(401).send({ error: 'signature did not verify' });
  let acct = await db.walletAccount(address);
  if (!acct) {
    // first time this wallet signs in → make it a club (wallet is the credential, no password)
    const id = randomUUID(), token = randomUUID().replace(/-/g, '');
    const handle = await uniqueHandle(shortAddr(address));
    await db.createAccount(id, handle, token, Date.now(), hashPassword(randomUUID())); // unguessable sentinel hash blocks password login
    const { club, standingOrders } = makeClub(id, handle);
    await db.saveClub(id, club, standingOrders);
    await db.linkWallet(id, address);
    acct = { id, handle, rating: 1000, token };
  }
  const c = (await db.getClub(acct.id))!;
  return {
    token: acct.token,
    account: { id: acct.id, handle: acct.handle, rating: acct.rating, coins: await db.getCoins(acct.id), wallet: address.toLowerCase() },
    club: c.club, standingOrders: c.standingOrders,
  };
});

// ── PlayerNFT (web3 Step 3) — is the NFT layer live, and at what address/chain.
app.get('/nft', async () => nftInfo());

// ── Scout tiers — the caller's live opposition/player scout tiers (from owned Scout NFTs)
// plus the ScoutNFT contract info for minting.
app.get('/scout/tiers', { preHandler: requireAuth }, async (req) => {
  const tiers = await viewerTiers(await db.walletOf(req.account!.id));
  return { ...tiers, nft: scoutNftInfo() };
});

// ── On-chain token (web3 Step 2) — read-only balance for the linked wallet.
app.get('/token', async () => ({ ...tokenInfo(), ...(await tokenMeta()) }));
app.get('/token/balance', { preHandler: requireAuth }, async (req) => {
  const wallet = await db.walletOf(req.account!.id);
  const { symbol } = await tokenMeta();
  if (!wallet) return { wallet: null, balance: null, symbol };
  try { return { wallet, balance: await tokenBalance(wallet), symbol }; }
  catch { return { wallet, balance: null, symbol, error: 'rpc unavailable' }; }
});

app.post('/auth/wallet/link', { preHandler: requireAuth }, async (req, reply) => {
  const address = String((req.body as any)?.address ?? '');
  const signature = String((req.body as any)?.signature ?? '');
  if (!isAddress(address)) return reply.code(400).send({ error: 'bad address' });
  const already = await db.walletOf(req.account!.id);
  if (already && already !== address.toLowerCase()) return reply.code(409).send({ error: 'this account already has a linked wallet' });
  const owner = await db.walletAccount(address);
  if (owner && owner.id !== req.account!.id) return reply.code(409).send({ error: 'wallet is already linked to another account' });
  if (!(await verifyAndConsume(address, signature))) return reply.code(401).send({ error: 'signature did not verify' });
  await db.linkWallet(req.account!.id, address);
  return { ok: true, wallet: address.toLowerCase() };
});

app.get('/me', { preHandler: requireAuth }, async (req) => {
  const c = (await loadSquad(req.account!.id))!; // pro tokens merged in as fieldable players
  const s = await ensureSeason(db, Date.now());
  const [coins, wallet, injuries, tokens] = await Promise.all([
    db.getCoins(req.account!.id), db.walletOf(req.account!.id), db.getInjuries(req.account!.id), db.tokensOwnedBy(req.account!.id),
  ]);
  const contracts = Object.fromEntries(tokens.filter((t) => t.state !== 'prospect').map((t) => {
    const ci = tokenContract(t, s.number);
    const legend = t.state === 'retired' ? legendCardOf(t) : undefined;
    return [t.id, { playerId: t.id, ...ci, legend, rebornId: null }];
  }));
  return { account: { ...req.account, coins, wallet }, club: c.club, standingOrders: c.standingOrders, injuries, contracts, season: s.number };
});

app.put('/standing-orders', { preHandler: requireAuth }, async (req, reply) => {
  const body = req.body as any;
  if (!isFormation(body?.formation)) return reply.code(400).send({ error: 'bad formation' });
  const c = (await loadSquad(req.account!.id))!; // NFT stars are valid XI picks too
  const lineup: Lineup = { formation: body.formation, playerIds: body.playerIds, duties: body.duties };
  if (!validateLineup(c.club, lineup)) return reply.code(400).send({ error: 'invalid lineup' });
  const so: StandingOrders = { formation: body.formation, playerIds: body.playerIds, tactics: body.tactics as Tactics, duties: cleanDuties(c.club, lineup) };
  await db.saveStandingOrders(req.account!.id, so);
  return { ok: true, standingOrders: so };
});

// Your season fixtures: one match vs each pod-mate, marked played (with the result)
// or pending. This is the round-robin schedule that drives the hub's "play" list.
async function computeFixtures(accountId: string) {
  const s = await ensureSeason(db, Date.now());
  const { tier, pod } = await ensurePod(db, s, accountId);
  const members = (await db.podMembers(s.id, tier, pod)).filter((m) => m.id !== accountId);
  const results = await db.seasonResults(s.id);
  // double round-robin: a HOME leg (home=me) and an AWAY leg (home=them) vs each pod-mate
  const homeLeg = new Map<string, { my: number; opp: number }>();
  const awayLeg = new Map<string, { my: number; opp: number }>();
  for (const r of results) {
    if (r.home_id === accountId) homeLeg.set(r.away_id, { my: r.home_score, opp: r.away_score });
    else if (r.away_id === accountId) awayLeg.set(r.home_id, { my: r.away_score, opp: r.home_score });
  }
  const fixtures = [];
  for (const m of members) {
    const c = await db.getClub(m.id);
    const clubName = c?.club.name ?? m.handle;
    const h = homeLeg.get(m.id) ?? null, a = awayLeg.get(m.id) ?? null;
    fixtures.push({ opponentId: m.id, handle: m.handle, clubName, rating: m.rating, venue: 'home', status: h ? 'played' : 'pending', result: h });
    fixtures.push({ opponentId: m.id, handle: m.handle, clubName, rating: m.rating, venue: 'away', status: a ? 'played' : 'pending', result: a });
  }
  const playedToday = await db.matchesToday(accountId, s.id, startOfUtcDay(Date.now()));
  return { tier, pod, fixtures, playedToday, dailyCap: MATCHES_PER_DAY };
}

// opponents = your PENDING fixtures (pod-mates you haven't played yet this season)
app.get('/opponents', { preHandler: requireAuth }, async (req) => {
  const { fixtures } = await computeFixtures(req.account!.id);
  const opponents = fixtures.filter((f) => f.status === 'pending').map((f) => ({ id: f.opponentId, handle: f.handle, rating: f.rating, clubName: f.clubName }));
  return { opponents };
});

// your full season fixture list (played + pending) with results, for the schedule view
app.get('/fixtures', { preHandler: requireAuth }, async (req) => {
  const { fixtures, playedToday, dailyCap } = await computeFixtures(req.account!.id);
  return { fixtures, played: fixtures.filter((f) => f.status === 'played').length, total: fixtures.length, playedToday, dailyCap };
});

app.post('/matches', { preHandler: requireAuth }, async (req, reply) => {
  const body = req.body as any;
  const oppId = String(body?.opponentId ?? '');
  const iAmHome = body?.venue !== 'away'; // double round-robin: you play each pod-mate home AND away
  const [opp, oppClub, me] = await Promise.all([db.accountById(oppId), loadSquad(oppId), loadSquad(req.account!.id)]); // both squads include their on-chain stars
  if (!opp || !oppClub) return reply.code(404).send({ error: 'opponent not found' });

  const meId = req.account!.id;
  const season = await ensureSeason(db, Date.now());
  await ensurePod(db, season, meId); // place the player so the match counts for their pod
  // this exact leg (a directed home→away pairing) may be played once per season
  const homeId = iAmHome ? meId : oppId, awayId = iAmHome ? oppId : meId;
  const seasonRes = await db.seasonResults(season.id);
  if (seasonRes.some((r) => r.home_id === homeId && r.away_id === awayId)) return reply.code(409).send({ error: 'already played this fixture this season' });
  // soft daily cap: at most MATCHES_PER_DAY matches you actively start per UTC day
  const playedToday = await db.matchesToday(meId, season.id, startOfUtcDay(Date.now()));
  if (playedToday >= MATCHES_PER_DAY) return reply.code(429).send({ error: `daily match limit reached (${MATCHES_PER_DAY}/day) — come back tomorrow` });

  // facilities + injuries + contracts: injured players AND NFT players whose contract has lapsed are
  // unavailable this match, filtered out before either side picks its XI (keep everyone if fewer than
  // 11 would remain — emergency). The NFT stays owned; a lapsed contract only benches him.
  const matchSeason = await ensureSeason(db, Date.now());
  const [meFac, oppFac, myInj, oppInj, myUnavail, oppUnavail] = await Promise.all([
    db.getFacilities(meId), db.getFacilities(oppId), db.getInjuries(meId), db.getInjuries(oppId),
    unavailableTokenIds(db, meId, matchSeason.number), unavailableTokenIds(db, oppId, matchSeason.number),
  ]);
  const benchOut = (club: typeof me.club, inj: Array<{ player_id: string }>, unavail: Set<string>) => {
    const out = new Set([...inj.map((x) => x.player_id), ...unavail]);
    const available = club.players.filter((p) => !out.has(p.id));
    return available.length >= 11 ? { ...club, players: available } : club;
  };
  me!.club = benchOut(me!.club, myInj, myUnavail);
  oppClub.club = benchOut(oppClub.club, oppInj, oppUnavail);

  let myLineup: Lineup = body.myLineup
    ? { formation: body.myLineup.formation, playerIds: body.myLineup.playerIds, duties: body.myLineup.duties }
    : { formation: me!.standingOrders.formation, playerIds: me!.standingOrders.playerIds, duties: me!.standingOrders.duties };
  const myTactics: Tactics = (body.myTactics as Tactics) ?? me!.standingOrders.tactics;
  if (!isFormation(myLineup.formation)) return reply.code(400).send({ error: 'invalid formation' });
  // an injured or stale player in the chosen XI → auto-pick a valid one from who's available
  if (!validateLineup(me!.club, myLineup)) myLineup = autoPickXI(me!.club, myLineup.formation);
  myLineup.duties = cleanDuties(me!.club, myLineup);
  // remember this plan for next time we face this opponent
  await db.savePlan(meId, oppId, { formation: myLineup.formation, playerIds: myLineup.playerIds, tactics: myTactics, duties: myLineup.duties });
  let oppLineup: Lineup = { formation: oppClub.standingOrders.formation, playerIds: oppClub.standingOrders.playerIds, duties: oppClub.standingOrders.duties };
  if (!validateLineup(oppClub.club, oppLineup)) oppLineup = autoPickXI(oppClub.club, oppClub.standingOrders.formation); // stale/injured in their XI → auto-pick
  const oppTactics = oppClub.standingOrders.tactics;

  // training-ground conditioning: each side fades less by their own training level
  const meCond = trainingConditioning(meFac.training), oppCond = trainingConditioning(oppFac.training);
  // run the match with the correct home/away team ordering (I may be the away side)
  const hClub = iAmHome ? me!.club : oppClub.club, hLineup = iAmHome ? myLineup : oppLineup, hTactics = iAmHome ? myTactics : oppTactics;
  const aClub = iAmHome ? oppClub.club : me!.club, aLineup = iAmHome ? oppLineup : myLineup, aTactics = iAmHome ? oppTactics : myTactics;
  const conditioning = { home: iAmHome ? meCond : oppCond, away: iAmHome ? oppCond : meCond };
  const homeBoost = fanHomeBoost((iAmHome ? meFac : oppFac).fanzone); // Fan Zone edge for the host
  const { seed, homeTeam, awayTeam, result, homeFitness, awayFitness } = runMatch(hClub, hLineup, hTactics, aClub, aLineup, aTactics, conditioning, homeBoost);

  // injuries: everyone recovers a match, then the XIs that played are rolled for fresh knocks
  const homeNew = rollMatchInjuries(homeTeam, homeFitness, (iAmHome ? meFac : oppFac).medical, seed);
  const awayNew = rollMatchInjuries(awayTeam, awayFitness, (iAmHome ? oppFac : meFac).medical, seed ^ 0x5f3759df);
  const myNew = iAmHome ? homeNew : awayNew, oppNew = iAmHome ? awayNew : homeNew;
  await Promise.all([db.decrementInjuries(meId), db.decrementInjuries(oppId)]);
  await Promise.all([
    ...myNew.map((n) => db.addInjury(meId, n.playerId, n.matches)),
    ...oppNew.map((n) => db.addInjury(oppId, n.playerId, n.matches)),
  ]);

  // Elo from my perspective, regardless of which side I was on
  const myScore = iAmHome ? result[0] : result[1], oppScore = iAmHome ? result[1] : result[0];
  const myOutcome = myScore > oppScore ? 1 : myScore < oppScore ? 0 : 0.5;
  const [nMe, nOpp] = elo(req.account!.rating, opp.rating, myOutcome);
  const coinsFor = (o: number) => o === 1 ? WIN_COINS : o === 0.5 ? DRAW_COINS : LOSS_COINS;
  const myCoins = coinsFor(myOutcome), oppCoins = coinsFor(1 - myOutcome);
  // stadium matchday income for the HOME side (the economy's coin faucet)
  const homeAcctId = homeId, homeFacFull = iAmHome ? meFac : oppFac;
  const homeTierIdx = TIERS.indexOf((await db.accountTier(homeAcctId)) as typeof TIERS[number]);
  const homeMatchOutcome: 'win' | 'draw' | 'loss' = result[0] > result[1] ? 'win' : result[0] < result[1] ? 'loss' : 'draw';
  const gate = Math.round(stadiumIncome(homeFacFull.stadium, Math.max(0, homeTierIdx), homeMatchOutcome) * fanIncomeMult(homeFacFull.fanzone));
  await Promise.all([db.setRating(meId, nMe), db.setRating(oppId, nOpp), db.addCoins(meId, myCoins), db.addCoins(oppId, oppCoins), db.addCoins(homeAcctId, gate)]);
  // appearances: every NFT that featured banks a cap (feeds longevity in the retirement legacy)
  const homeEv = result[0] > result[1] ? 'played_win' : result[0] < result[1] ? 'played_loss' : 'played_draw';
  const awayEv = result[1] > result[0] ? 'played_win' : result[1] < result[0] ? 'played_loss' : 'played_draw';
  for (const pl of homeTeam.players) if (isNftPlayer(pl.id)) { await bumpApps(db, pl.id); await bumpMorale(db, pl.id, homeEv); }
  for (const pl of awayTeam.players) if (isNftPlayer(pl.id)) { await bumpApps(db, pl.id); await bumpMorale(db, pl.id, awayEv); }
  const myGate = iAmHome ? gate : 0; // only the host banks gate receipts
  const nHome = iAmHome ? nMe : nOpp, nAway = iAmHome ? nOpp : nMe;

  const matchId = randomUUID();
  await db.saveMatch({
    id: matchId, homeId, awayId, homeTeam, awayTeam, homeTactics: hTactics, awayTactics: aTactics,
    seed, homeScore: result[0], awayScore: result[1], createdAt: Date.now(), seasonId: season.id, initiatorId: meId,
  });

  return {
    matchId, seed, result, mySide: iAmHome ? 0 : 1, coinsEarned: myCoins, gateIncome: myGate,
    injuries: myNew.map((n) => ({ name: n.playerName, matches: n.matches })),
    home: { id: homeId, handle: iAmHome ? req.account!.handle : opp.handle, rating: nHome, team: homeTeam, tactics: hTactics },
    away: { id: awayId, handle: iAmHome ? opp.handle : req.account!.handle, rating: nAway, team: awayTeam, tactics: aTactics },
  };
});

app.get('/matches/:id', async (req, reply) => {
  const m = await db.getMatch((req.params as any).id);
  if (!m) return reply.code(404).send({ error: 'not found' });
  return {
    matchId: m.id, seed: m.seed, result: [m.homeScore, m.awayScore],
    home: { id: m.homeId, team: m.homeTeam, tactics: m.homeTactics },
    away: { id: m.awayId, team: m.awayTeam, tactics: m.awayTactics },
  };
});

app.get('/me/matches', { preHandler: requireAuth }, async (req) => ({ matches: await db.matchesFor(req.account!.id) }));
app.get('/leaderboard', async () => ({ leaderboard: await db.leaderboard() }));

// current season meta (creates season 1 / rolls an expired season over on demand)
app.get('/season', async () => {
  const s = await ensureSeason(db, Date.now());
  return { season: { number: s.number, startsAt: s.startsAt, endsAt: s.endsAt, status: s.status, endsInMs: Math.max(0, s.endsAt - Date.now()) } };
});

// your pod's KNOCKOUT CUP this season — a deterministic bracket projection (firms up as
// managers set their teams), draws settled by a setPiece-driven penalty shootout.
app.get('/cup', { preHandler: requireAuth }, async (req) => {
  const s = await ensureSeason(db, Date.now());
  const { tier, pod } = await ensurePod(db, s, req.account!.id);
  const members = await db.podMembers(s.id, tier, pod);
  const clubs: SquadMap = new Map();
  await Promise.all(members.map(async (m) => { const c = await loadSquad(m.id); if (c) clubs.set(m.id, c); }));
  const cup = computeCup(s.number, members, clubs);
  return { season: s.number, tier, pod, me: req.account!.id, ...cup };
});

// your pod's standings this season (Phase B: a legible ~20-row table)
app.get('/standings', { preHandler: requireAuth }, async (req) => {
  const s = await ensureSeason(db, Date.now());
  const { tier, pod } = await ensurePod(db, s, req.account!.id);
  const members = await db.podMembers(s.id, tier, pod);
  const ids = new Set(members.map((m) => m.id));
  const results = resultsAmong(await db.seasonResults(s.id), ids);
  return { season: { number: s.number, endsAt: s.endsAt }, tier, pod, promote: PROMOTE, relegate: RELEGATE, table: buildTable(members, results) };
});

// your pod's recent results feed this season
app.get('/results', { preHandler: requireAuth }, async (req) => {
  const s = await ensureSeason(db, Date.now());
  const { tier, pod } = await ensurePod(db, s, req.account!.id);
  const ids = new Set((await db.podMembers(s.id, tier, pod)).map((m) => m.id));
  const results = (await db.recentResults(200, s.id)).filter((r) => ids.has(r.home_id) && ids.has(r.away_id)).slice(0, 40);
  return { results };
});

// the caller's honours board (past-season finishes)
app.get('/honours', { preHandler: requireAuth }, async (req) => ({ honours: await db.honoursFor(req.account!.id) }));

// PRESTIGE: the manager's career legacy — level + title from titles won (tier-weighted), win record,
// highest division reached, and seasons managed. Read-only aggregate over honours + match history.
app.get('/prestige', { preHandler: requireAuth }, async (req) => {
  const id = req.account!.id;
  const [honours, matches, curTier] = await Promise.all([db.honoursFor(id, 9999), db.matchesFor(id, 9999), db.accountTier(id)]);
  let wins = 0, draws = 0, losses = 0;
  for (const m of matches) {
    const my = m.home_id === id ? m.home_score : m.away_score;
    const opp = m.home_id === id ? m.away_score : m.home_score;
    if (my > opp) wins++; else if (my < opp) losses++; else draws++;
  }
  const tierIdxOf = (t: string) => Math.max(0, TIERS.indexOf(t as typeof TIERS[number]));
  const honourLites = honours.map((h) => ({ tierIdx: tierIdxOf(h.tier), title: h.title, kind: (h.kind === 'cup' ? 'cup' : 'league') as 'cup' | 'league' }));
  const highestTierIdx = Math.max(tierIdxOf(curTier), ...honourLites.map((h) => h.tierIdx), 0);
  const seasons = new Set(honours.map((h) => h.season_number)).size;
  return { prestige: managerPrestige({ wins, draws, losses, honours: honourLites, highestTierIdx, seasons }), record: { wins, draws, losses, seasons } };
});

// EXTEND a player's contract: pay the wage (coins) to re-sign him for another full term. The NFT was
// never at risk — a lapsed contract just benched him — so this is buy-back-in, not rescue. Reuses the
// coin sink; a proven earner / greedy / unhappy player costs more, staking tenure discounts it.
app.post('/players/:id/extend', { preHandler: requireAuth }, async (req, reply) => {
  const ownerId = req.account!.id;
  const id = (req.params as any).id as string;
  const t = await db.getToken(id);
  if (!t || t.owner_id !== ownerId) return reply.code(404).send({ error: 'no such token' });
  if (t.state !== 'pro') return reply.code(400).send({ error: 'not a pro under contract' });
  const s = await ensureSeason(db, Date.now());
  const ci = tokenContract(t, s.number);
  const coins = await db.getCoins(ownerId);
  if (coins < ci.extendCost) return reply.code(400).send({ error: 'not enough coins', need: ci.extendCost, have: coins });
  await db.addCoins(ownerId, -ci.extendCost);
  const fresh = signContract(s.number, t.greed ?? 10, t.personality ?? undefined); // staked_since preserved
  await db.updateToken(id, { signed_season: fresh.signedSeason, length_seasons: fresh.lengthSeasons });
  await bumpMorale(db, id, 'extended'); // a new deal is a vote of confidence
  return { ok: true, coins: await db.getCoins(ownerId), contract: { playerId: id, ...tokenContract((await db.getToken(id))!, s.number) } };
});

// REBORN: a retired token becomes the NEXT GENERATION — the SAME token flips back to a 10-year-old
// PROSPECT (generation++), inheriting the bloodline's genes + the retiree's team-achievement pedigree.
// Fixed supply: no new token is minted; the asset regenerates.
app.post('/players/:id/reborn', { preHandler: requireAuth }, async (req, reply) => {
  const ownerId = req.account!.id;
  const id = (req.params as any).id as string;
  const t = await db.getToken(id);
  if (!t || t.owner_id !== ownerId) return reply.code(404).send({ error: 'no such token' });
  if (t.state !== 'retired') return reply.code(409).send({ error: 'not retired' });
  const coins = await db.getCoins(ownerId);
  if (coins < REBORN_COST) return reply.code(400).send({ error: 'not enough coins', need: REBORN_COST, have: coins });
  await db.addCoins(ownerId, -REBORN_COST); // breeding fee — PTEST seam
  await db.updateToken(id, rebornFields(t));
  const fresh = (await db.getToken(id))!;
  const pot = rebornPotential(fresh);
  return { ok: true, cost: REBORN_COST, coins: await db.getCoins(ownerId), prospect: { id, name: fresh.name, roleHint: fresh.role ?? 'MF', generation: fresh.generation, pedigree: pot.pedigree, potentialStars: pot.stars, genes: JSON.parse(fresh.genes_json) } };
});

// PROSPECTS: the owner's prospect-state tokens — 10-year-olds to DEVELOP in the Career game.
app.get('/prospects', { preHandler: requireAuth }, async (req) => {
  const tokens = (await db.tokensOwnedBy(req.account!.id)).filter((t) => t.state === 'prospect');
  return { prospects: tokens.map((t) => { const pot = rebornPotential(t); return { id: t.id, name: t.name, roleHint: t.role ?? 'MF', generation: t.generation, pedigree: t.pedigree, careerStarted: t.career_seed != null, potentialStars: pot.stars, genes: JSON.parse(t.genes_json) }; }) };
});

// GENESIS: mint a brand-new 10-year-old prospect (fresh genes, generation 0) — the ONLY way a token
// enters the economy. Enforces the fixed SUPPLY_CAP; after that, the fixed set just cycles forever.
app.post('/genesis', { preHandler: requireAuth }, async (req, reply) => {
  const coins = await db.getCoins(req.account!.id);
  if (coins < GENESIS_COST) return reply.code(400).send({ error: 'not enough coins', need: GENESIS_COST, have: coins });
  try {
    const t = await mintGenesis(db, req.account!.id);
    await db.addCoins(req.account!.id, -GENESIS_COST); // PTEST seam
    const pot = rebornPotential(t);
    return { ok: true, supply: await db.countTokens(), cap: SUPPLY_CAP, cost: GENESIS_COST, coins: await db.getCoins(req.account!.id), prospect: { id: t.id, name: t.name, roleHint: t.role ?? 'MF', generation: 0, pedigree: 0, potentialStars: pot.stars, genes: JSON.parse(t.genes_json) } };
  } catch (e: any) { return reply.code(409).send({ error: e?.message ?? 'mint failed' }); }
});

// ── CAREER GAME (Layer 1): develop a prospect-state token 10→25, then GRADUATE it in place → the SAME
// token flips to a pro in your squad. Server-authoritative: the play LOG lives on the token.
app.get('/career/agents', { preHandler: requireAuth }, async () => ({ agents: agentsList() }));

app.post('/career/:id/start', { preHandler: requireAuth }, async (req, reply) => {
  const t = await db.getToken((req.params as any).id);
  if (!t || t.owner_id !== req.account!.id) return reply.code(404).send({ error: 'no such token' });
  if (t.state !== 'prospect') return reply.code(409).send({ error: 'not a prospect' });
  if (t.career_seed == null) await db.updateToken(t.id, { career_seed: careerSeedFor(t.id, t.generation), agent_id: (req.body as any)?.agentId ?? null, track: trackFor(t.role ?? 'MF'), career_actions: '[]' });
  const fresh = (await db.getToken(t.id))!;
  return { ok: true, state: careerState(fresh, loadCareer(fresh)) };
});

app.get('/career/:id', { preHandler: requireAuth }, async (req, reply) => {
  const t = await db.getToken((req.params as any).id);
  if (!t || t.owner_id !== req.account!.id) return reply.code(404).send({ error: 'no such token' });
  if (t.state !== 'prospect') return reply.code(409).send({ error: 'not a prospect' });
  if (t.career_seed == null) return reply.code(400).send({ error: 'career not started' });
  return { ok: true, state: careerState(t, loadCareer(t)) };
});

app.post('/career/:id/act', { preHandler: requireAuth }, async (req, reply) => {
  const ownerId = req.account!.id;
  const t = await db.getToken((req.params as any).id);
  if (!t || t.owner_id !== ownerId) return reply.code(404).send({ error: 'no such token' });
  if (t.state !== 'prospect') return reply.code(409).send({ error: 'not a prospect' });
  if (t.career_seed == null) return reply.code(400).send({ error: 'career not started' });
  const action = req.body as CareerAction;
  const c = loadCareer(t);
  try { applyAction(c, action); } catch (e: any) { return reply.code(400).send({ error: e?.message ?? 'illegal move' }); }
  await db.updateToken(t.id, { career_actions: JSON.stringify([...JSON.parse(t.career_actions ?? '[]'), action]) });
  if (c.finished) { // GRADUATE IN PLACE → the same token becomes a pro at age 25, signed to a first deal
    const fresh = (await db.getToken(t.id))!;
    const s = await ensureSeason(db, Date.now());
    const grad = graduatedFields(fresh, c);
    const deal = signContract(s.number, grad.greed ?? 10, grad.personality ?? undefined);
    await db.updateToken(t.id, { ...grad, prime_season: s.number, signed_season: deal.signedSeason, length_seasons: deal.lengthSeasons, staked_since: s.number });
    return { ok: true, graduated: true, player: tokenToPlayer((await db.getToken(t.id))!) };
  }
  return { ok: true, state: careerState((await db.getToken(t.id))!, c) };
});

// LEGENDS: the manager's hall of retirement legacy cards (one per generation a token retired under them).
app.get('/legends', { preHandler: requireAuth }, async (req) => {
  const rows = await db.legaciesFor(req.account!.id);
  return { legends: rows.map((r) => ({ playerId: r.player_id.split(':g')[0], name: r.name, card: JSON.parse(r.card_json), retiredSeason: r.retired_season })) };
});

// DEV ONLY (local sqlite): run the lifecycle for your squad with a title-winning outcome, to force
// retirements for testing without grinding 15 seasons.
app.post('/dev/run-lifecycle', { preHandler: requireAuth }, async (req, reply) => {
  if (process.env.DATABASE_URL) return reply.code(403).send({ error: 'dev only' });
  const c = (await loadSquad(req.account!.id))!;
  const s = await ensureSeason(db, Date.now());
  const body = (req.body as any) ?? {};
  const outcome = { league: body.league ?? 1, cup: body.cup ?? 0, promotion: body.promotion ?? 1, tierIdx: body.tierIdx ?? 5 };
  const retired = await advanceTokensAtRollover(db, req.account!.id, s.number, outcome);
  return { ok: true, retired, season: s.number };
});

// SCOUT an opponent: their expected formation (standing-orders shape) + roster with
// OVERALL ratings only — deliberately limited (no individual stats; premium later).
app.get('/scout/:id', { preHandler: requireAuth }, async (req, reply) => {
  const id = String((req.params as any).id);
  const [opp, c, vw] = await Promise.all([db.accountById(id), loadSquad(id), db.walletOf(req.account!.id)]);
  if (!opp || !c) return reply.code(404).send({ error: 'not found' });
  const tier = (await viewerTiers(vw)).opp as OppTier; // your opposition-scout tier (from owned Scout NFTs)
  const rv = OPP_REVEAL[tier];
  const likely = new Set(c.standingOrders.playerIds);
  const roleOrder: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
  const players = c.club.players
    .map((p) => ({
      name: p.name, role: p.role,
      overall: rv.overalls ? overall(p) : null,
      likelyXI: rv.likelyXI ? likely.has(p.id) : null,
    }))
    // sort by rating only when it's revealed; otherwise by position so we don't leak strength
    .sort((a, b) => rv.overalls ? (b.overall! - a.overall!) : ((roleOrder[a.role] - roleOrder[b.role]) || a.name.localeCompare(b.name)));
  const intel = rv.intel ? describeIntel(c.club, c.standingOrders.tactics, likely) : null;
  return { handle: opp.handle, clubName: c.club.name, rating: opp.rating, formation: c.standingOrders.formation, tier, reveal: rv, intel, players };
});

// your saved plan (lineup + tactics + duties) for a specific opponent, or null
app.get('/plan/:id', { preHandler: requireAuth }, async (req) =>
  ({ plan: (await db.getPlan(req.account!.id, String((req.params as any).id))) ?? null }));

// this season's trial pool (free base scout) + how many loanees you've signed
app.get('/scout/trials', { preHandler: requireAuth }, async (req) => {
  const s = await ensureSeason(db, Date.now());
  const [signed, count, tiers, fac] = await Promise.all([
    db.loaneeIds(req.account!.id, s.id), db.countLoanees(req.account!.id, s.id), viewerTiers(await db.walletOf(req.account!.id)), db.getFacilities(req.account!.id),
  ]);
  const signedSet = new Set(signed);
  const extra = youthPoolBonus(fac.youth), youthUp = youthUpgradeChance(fac.youth);
  const pool = generatePool(req.account!.id, s.number, tiers.player, extra, youthUp).map((t) => ({ ...t, signed: signedSet.has(t.id) }));
  return { season: s.number, cap: LOANEE_CAP, signedCount: count, tier: tiers.player, youthLevel: fac.youth, pool };
});

// sign a trialist (up to LOANEE_CAP per season); adds them to your squad for the season
app.post('/scout/trials/:index/sign', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const s = await ensureSeason(db, Date.now());
  if (await db.countLoanees(meId, s.id) >= LOANEE_CAP) return reply.code(409).send({ error: `you can sign at most ${LOANEE_CAP} loanees a season` });
  const [tiers, fac] = await Promise.all([viewerTiers(await db.walletOf(meId)), db.getFacilities(meId)]); // same inputs the pool used, so ids match
  const player = trialistAt(meId, s.number, Number((req.params as any).index), tiers.player, youthPoolBonus(fac.youth), youthUpgradeChance(fac.youth));
  if (!player) return reply.code(404).send({ error: 'no such trialist' });
  const c = await db.getClub(meId);
  if (!c) return reply.code(404).send({ error: 'club not found' });
  if (c.club.players.some((p) => p.id === player.id)) return reply.code(409).send({ error: 'already signed' });
  c.club.players.push(player);
  await db.saveClub(meId, c.club, c.standingOrders);
  await db.addLoanee(meId, s.id, player.id);
  return { ok: true, player: { name: player.name, role: player.role }, signedCount: (await db.countLoanees(meId, s.id)) };
});

// ── Club facilities: leveled upgrades (Stadium/Training/Youth/Scouting HQ) ────────
app.get('/facilities', { preHandler: requireAuth }, async (req) => {
  const meId = req.account!.id;
  const [fac, coins] = await Promise.all([db.getFacilities(meId), db.getCoins(meId)]);
  const facilities = FACILITY_KEYS.map((key) => {
    const level = (fac as any)[key] as number;
    const cost = upgradeCost(level);
    return {
      key, ...FACILITY_META[key], level, maxLevel: MAX_LEVEL,
      effect: effectAt(key, level), nextEffect: level < MAX_LEVEL ? effectAt(key, level + 1) : null,
      upgradeCost: cost, canAfford: cost != null && coins >= cost,
    };
  });
  return { coins, facilities };
});

app.post('/facilities/:key/upgrade', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const key = String((req.params as any).key) as FacilityKey;
  if (!FACILITY_KEYS.includes(key)) return reply.code(400).send({ error: 'unknown facility' });
  const fac = await db.getFacilities(meId);
  const level = (fac as any)[key] as number;
  const cost = upgradeCost(level);
  if (cost == null) return reply.code(409).send({ error: 'already at max level' });
  const coins = await db.getCoins(meId);
  if (coins < cost) return reply.code(409).send({ error: `not enough coins — upgrade costs ${cost}` });
  await db.addCoins(meId, -cost); // coin sink
  await db.setFacilityLevel(meId, key, level + 1);
  return { ok: true, key, level: level + 1, coins: await db.getCoins(meId) };
});

// ── Scouting Network: dispatch a player-scout to a destination (risk/reward), then
// wait out the travel time before the sealed result reveals. Trips are capped per
// season; your player-scout NFT tier lifts the odds. ────────────────────────────
/** Serialise a stored trip for the client, hiding the outcome until travel completes. */
function missionView(m: import('./store.js').MissionRow, now: number) {
  const dest = destinationById(m.destination);
  const revealed = now >= m.ready_at || m.status === 'signed';
  const player = revealed && m.found && m.player_json ? JSON.parse(m.player_json) as Player : null;
  return {
    id: m.id, destination: m.destination, destName: dest?.name ?? m.destination,
    dispatchedAt: m.dispatched_at, readyAt: m.ready_at, readyInMs: Math.max(0, m.ready_at - now),
    revealed, status: m.status, found: revealed ? !!m.found : null, band: revealed ? m.band : null,
    player: player ? { id: player.id, name: player.name, role: player.role, overall: overall(player), attrs: player.attrs } : null,
  };
}

app.get('/scout/missions', { preHandler: requireAuth }, async (req) => {
  const meId = req.account!.id;
  const s = await ensureSeason(db, Date.now());
  const [tiers, trips, count, loaneeCount, coins, fac] = await Promise.all([
    viewerTiers(await db.walletOf(meId)), db.missionsInSeason(meId, s.id),
    db.countMissionsInSeason(meId, s.id), db.countLoanees(meId, s.id), db.getCoins(meId), db.getFacilities(meId),
  ]);
  const now = Date.now();
  const hqMult = scoutHitMult(fac.scouting), discount = scoutCostDiscount(fac.scouting);
  const tripsPerSeason = TRIPS_PER_SEASON + scoutExtraTrips(fac.scouting);
  const destinations = DESTINATIONS.map((d) => ({
    id: d.id, name: d.name, blurb: d.blurb, weights: d.weights, travelMins: d.travelMins,
    cost: Math.round(d.cost * (1 - discount)),
    ...previewOdds(d, tiers.player, hqMult),
  }));
  return {
    season: s.number, tier: tiers.player, scoutingLevel: fac.scouting, tripsPerSeason, tripsUsed: count,
    tripsLeft: Math.max(0, tripsPerSeason - count), loaneeCap: LOANEE_CAP, loaneeCount, coins,
    destinations, missions: trips.map((m) => missionView(m, now)),
  };
});

app.post('/scout/missions', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const s = await ensureSeason(db, Date.now());
  const dest = destinationById(String((req.body as any)?.destination ?? ''));
  if (!dest) return reply.code(400).send({ error: 'unknown destination' });
  const fac = await db.getFacilities(meId);
  const tripsPerSeason = TRIPS_PER_SEASON + scoutExtraTrips(fac.scouting);
  if (await db.countMissionsInSeason(meId, s.id) >= tripsPerSeason) {
    return reply.code(409).send({ error: `you can dispatch at most ${tripsPerSeason} scouting trips a season` });
  }
  const cost = Math.round(dest.cost * (1 - scoutCostDiscount(fac.scouting)));
  const coins = await db.getCoins(meId);
  if (coins < cost) return reply.code(409).send({ error: `not enough coins — ${dest.name} costs ${cost}` });
  await db.addCoins(meId, -cost); // coin sink (this is the seam that swaps to a PTEST spend later)
  const tiers = await viewerTiers(await db.walletOf(meId));
  const id = randomUUID();
  const outcome = rollMission(id, dest, tiers.player, scoutHitMult(fac.scouting)); // sealed now, revealed after travel
  const now = Date.now();
  const row = {
    id, account_id: meId, season_id: s.id, destination: dest.id,
    dispatched_at: now, ready_at: now + travelMs(dest),
    found: outcome.found ? 1 : 0, player_json: outcome.player ? JSON.stringify(outcome.player) : null,
    band: outcome.band, status: 'travelling',
  };
  await db.createMission(row);
  return { ok: true, mission: missionView(row, now), coins: await db.getCoins(meId) }; // travelling → outcome stays hidden
});

app.post('/scout/missions/:id/sign', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const s = await ensureSeason(db, Date.now());
  const m = await db.missionById(String((req.params as any).id));
  if (!m || m.account_id !== meId) return reply.code(404).send({ error: 'no such trip' });
  if (m.status === 'signed') return reply.code(409).send({ error: 'already signed' });
  if (Date.now() < m.ready_at) return reply.code(409).send({ error: 'the scout is still travelling' });
  if (!m.found || !m.player_json) return reply.code(409).send({ error: 'that trip came back empty-handed' });
  if (await db.countLoanees(meId, s.id) >= LOANEE_CAP) return reply.code(409).send({ error: `you can field at most ${LOANEE_CAP} loanees a season` });
  const player = JSON.parse(m.player_json) as Player;
  const c = await db.getClub(meId);
  if (!c) return reply.code(404).send({ error: 'club not found' });
  if (!c.club.players.some((p) => p.id === player.id)) c.club.players.push(player);
  await db.saveClub(meId, c.club, c.standingOrders);
  await db.addLoanee(meId, s.id, player.id);
  await db.setMissionSigned(m.id);
  return { ok: true, player: { name: player.name, role: player.role }, signedCount: (await db.countLoanees(meId, s.id)) };
});

// ── Transfer market (in-game coins) ──────────────────────────────────────────
// Browse listings (stats shown through your player-scout tier), your own listings,
// and your coin balance.
app.get('/market', { preHandler: requireAuth }, async (req) => {
  const meId = req.account!.id;
  const tier: PlayerScoutTier = (await viewerTiers(await db.walletOf(meId))).player; // your player-scout tier reveals more stats
  const [coins, listings, mine] = await Promise.all([db.getCoins(meId), db.activeListings(120), db.listingsBySeller(meId)]);
  const render = (l: Listing) => ({
    id: l.id, playerId: l.player_id, price: l.price, sellerHandle: l.seller_handle, mine: l.seller_id === meId,
    player: revealPlayer(JSON.parse(l.player_json), tier),
  });
  return { coins, tier, listings: listings.filter((l) => l.seller_id !== meId).map(render), mine: mine.map(render) };
});

// list one of your squad players for sale
app.post('/market/list', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const { playerId, price } = (req.body as any) ?? {};
  const pr = Math.round(Number(price));
  if (!playerId || !Number.isFinite(pr) || pr < PRICE_MIN || pr > PRICE_MAX) return reply.code(400).send({ error: `price must be ${PRICE_MIN}–${PRICE_MAX} coins` });
  const c = await loadSquad(meId); // includes pro tokens as fieldable players
  if (!c) return reply.code(404).send({ error: 'club not found' });
  const player = c.club.players.find((p) => p.id === playerId);
  if (!player) return reply.code(404).send({ error: 'you do not own that player' });
  if (player.id.startsWith('loan-') || player.id.startsWith('scout-')) return reply.code(409).send({ error: 'loanees cannot be sold' });
  if (c.club.players.length <= MIN_SQUAD) return reply.code(409).send({ error: `you must keep at least ${MIN_SQUAD} players` });
  if (await db.activeListingForPlayer(playerId)) return reply.code(409).send({ error: 'that player is already listed' });
  const id = randomUUID();
  await db.createListing({ id, seller_id: meId, seller_handle: req.account!.handle, player_id: playerId, player_json: JSON.stringify(player), price: pr, status: 'active', created_at: Date.now(), buyer_id: null, sold_at: null });
  return { ok: true, id };
});

// pull one of your own listings back off the market
app.post('/market/:id/cancel', { preHandler: requireAuth }, async (req, reply) => {
  const l = await db.listingById(String((req.params as any).id));
  if (!l || l.status !== 'active') return reply.code(404).send({ error: 'no such listing' });
  if (l.seller_id !== req.account!.id) return reply.code(403).send({ error: 'not your listing' });
  await db.setListingStatus(l.id, 'cancelled', null, null);
  return { ok: true };
});

// buy a listed player: coins move seller-ward, the player joins your squad
app.post('/market/:id/buy', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const l = await db.listingById(String((req.params as any).id));
  if (!l || l.status !== 'active') return reply.code(404).send({ error: 'no such listing' });
  if (l.seller_id === meId) return reply.code(409).send({ error: 'that is your own listing' });
  const coins = await db.getCoins(meId);
  if (coins < l.price) return reply.code(409).send({ error: 'not enough coins' });
  if (isNftPlayer(l.player_id)) { // TOKEN transfer — just change ownership (fixed supply, staking resets for the new owner)
    const t = await db.getToken(l.player_id);
    if (!t || t.owner_id !== l.seller_id) { await db.setListingStatus(l.id, 'cancelled', null, null); return reply.code(409).send({ error: 'seller no longer owns that token' }); }
    const s = await ensureSeason(db, Date.now());
    await db.updateToken(l.player_id, { owner_id: meId, staked_since: s.number });
    // repair the seller's standing XI if it referenced the sold token
    const sc = await db.getClub(l.seller_id);
    if (sc && sc.standingOrders.playerIds.includes(l.player_id)) { const sq = (await loadSquad(l.seller_id))!; await db.saveClub(l.seller_id, sq.club, { ...sc.standingOrders, playerIds: autoPickXI(sq.club, sc.standingOrders.formation).playerIds, duties: undefined }); }
    const proceeds = Math.round(l.price * (1 - MARKET_FEE_PCT / 100)); // fee skimmed off (a burn) — PTEST seam
    await Promise.all([db.addCoins(meId, -l.price), db.addCoins(l.seller_id, proceeds), db.setListingStatus(l.id, 'sold', meId, Date.now())]);
    return { ok: true, player: { name: t.name, role: t.role }, coins: coins - l.price };
  }
  const [buyerClub, sellerClub] = await Promise.all([db.getClub(meId), db.getClub(l.seller_id)]);
  if (!buyerClub || !sellerClub) return reply.code(404).send({ error: 'club not found' });
  if (buyerClub.club.players.length >= MAX_SQUAD) return reply.code(409).send({ error: `your squad is full (max ${MAX_SQUAD})` });
  const idx = sellerClub.club.players.findIndex((p) => p.id === l.player_id);
  if (idx < 0) { await db.setListingStatus(l.id, 'cancelled', null, null); return reply.code(409).send({ error: 'seller no longer owns that player' }); }
  const [player] = sellerClub.club.players.splice(idx, 1);
  buyerClub.club.players.push(player);
  let sellerSo = sellerClub.standingOrders;
  if (sellerSo.playerIds.includes(l.player_id)) sellerSo = { ...sellerSo, playerIds: autoPickXI(sellerClub.club, sellerSo.formation).playerIds, duties: undefined };
  await Promise.all([
    db.saveClub(l.seller_id, sellerClub.club, sellerSo), db.saveClub(meId, buyerClub.club, buyerClub.standingOrders),
    db.addCoins(meId, -l.price), db.addCoins(l.seller_id, l.price), db.setListingStatus(l.id, 'sold', meId, Date.now()),
  ]);
  return { ok: true, player: { name: player.name, role: player.role }, coins: coins - l.price };
});

// all-time cumulative table (kept for an optional global leaderboard view)
app.get('/table', async () => {
  const [accounts, results] = await Promise.all([db.allAccounts(), db.allResults()]);
  return { table: buildTable(accounts, results) };
});

// wipe all data — inert unless ADMIN_SECRET is set and the matching header is sent
app.post('/admin/reset', async (req, reply) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || (req.headers['x-admin-secret'] as string) !== secret) return reply.code(403).send({ error: 'forbidden' });
  await db.reset();
  return { ok: true, reset: true };
});

// force the current season to close + a new one to open — same gate as reset (ops/testing)
app.post('/admin/rollover', async (req, reply) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || (req.headers['x-admin-secret'] as string) !== secret) return reply.code(403).send({ error: 'forbidden' });
  const s = await forceRollover(db, Date.now());
  return { ok: true, season: { number: s.number, endsAt: s.endsAt } };
});

// DEV ONLY (local sqlite; never prod/postgres): inject a synthetic career-built NFT into your club so
// the contract/age/morale/staking flows can be exercised without minting on-chain. Optional `kind`
// (mercenary|loyal|star) and `agedSeasons` (back-date the contract to test the lapsed → extend state).
app.post('/dev/inject-nft', { preHandler: requireAuth }, async (req, reply) => {
  if (process.env.DATABASE_URL) return reply.code(403).send({ error: 'dev only' });
  const id = req.account!.id;
  const c = (await db.getClub(id))!;
  const body = (req.body as any) ?? {};
  const kind: string = body.kind ?? 'star';
  const base = { pace: 14, strength: 13, stamina: 14, passing: 13, shooting: 14, tackling: 12, positioning: 13, workrate: 14, keeping: 2, setPiece: 12, composure: 14, aggression: 12, creativity: 14, teamwork: 13, leadership: 13, durability: 13 };
  const presets: Record<string, any> = {
    mercenary: { name: 'Rico Vance', role: 'FW', greed: 18, personality: 'maverick', marketability: 17, earnings: 5200, attrs: { ...base, shooting: 17, pace: 16, composure: 16 } },
    loyal: { name: 'Sam Oakes', role: 'DF', greed: 4, personality: 'leader', marketability: 8, earnings: 1400, attrs: { ...base, tackling: 16, positioning: 16, leadership: 16, strength: 15 } },
    star: { name: 'Leo Marsh', role: 'MF', greed: 11, personality: 'pro', marketability: 13, earnings: 2600, attrs: { ...base, passing: 16, creativity: 16, composure: 15 } },
  };
  const p = presets[kind] ?? presets.star;
  const s = await ensureSeason(db, Date.now());
  const aged = Math.max(0, Number(body.agedSeasons) || 0);
  const tokenId = `nft:${(await db.countTokens()) + 1 + Math.floor(Date.now() % 1000)}`; // unique dev id
  await db.createToken({ id: tokenId, owner_id: id, generation: 0, state: 'pro', name: p.name, genes_json: JSON.stringify({ pace: { floor: 8, ceiling: 18 }, strength: { floor: 8, ceiling: 18 }, stamina: { floor: 8, ceiling: 18 } }), pedigree: 0, dev_bonus_json: '{}' });
  const len = contractLength(p.greed, p.personality);
  const a = body.achievements ?? {};
  await db.updateToken(tokenId, {
    role: p.role, attrs_json: JSON.stringify(p.attrs), traits_json: '[]', personality: p.personality, greed: p.greed, marketability: p.marketability, earnings: p.earnings,
    prime_season: s.number - aged, signed_season: s.number - aged, length_seasons: len, staked_since: s.number - aged,
    ach_seasons: a.seasons ?? 0, ach_apps: a.apps ?? 0, ach_league: a.league_titles ?? 0, ach_cup: a.cup_titles ?? 0, ach_promotions: a.promotions ?? 0, ach_tier: a.highest_tier_idx ?? 0,
  });
  return { ok: true, player: tokenToPlayer((await db.getToken(tokenId))!), season: s.number };
});

// Regenerate every club's BASE squad at the current (weak filler) quality — the one-time
// migration to the base-fillers + NFT-stars model. Preserves coins/wallet/rating/NFTs and
// any bought or loaned players (only the account's own base players `<id>-N` are re-rolled).
app.post('/admin/regen-base', async (req, reply) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || (req.headers['x-admin-secret'] as string) !== secret) return reply.code(403).send({ error: 'forbidden' });
  const accounts = await db.allAccounts();
  let n = 0;
  for (const a of accounts) {
    const [acc, c] = await Promise.all([db.accountById(a.id), db.getClub(a.id)]);
    if (!acc || !c) continue;
    const fresh = makeClub(a.id, acc.handle).club;                       // 20 weak base players (ids <id>-0..19)
    const kept = c.club.players.filter((p) => !p.id.startsWith(`${a.id}-`)); // bought + loaned players stay
    fresh.players = [...fresh.players, ...kept];
    const so = { ...c.standingOrders, playerIds: autoPickXI(fresh, c.standingOrders.formation).playerIds, duties: undefined };
    await db.saveClub(a.id, fresh, so);
    n++;
  }
  return { ok: true, regenerated: n };
});

// non-destructive backfill: give legacy 8-stat players the missing setPiece/stamina
// (keeps all core stats + ratings; fixes the NaN-fitness/invisible-player bug in the data)
app.post('/admin/backfill-stats', async (req, reply) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || (req.headers['x-admin-secret'] as string) !== secret) return reply.code(403).send({ error: 'forbidden' });
  const accounts = await db.allAccounts();
  let clubs = 0, players = 0;
  for (const a of accounts) {
    const c = await db.getClub(a.id);
    if (!c) continue;
    let touched = false;
    for (const p of c.club.players) {
      const before = { sp: (p.attrs as any).setPiece, st: (p.attrs as any).stamina };
      backfillAttrs(p);
      if (before.sp == null || before.st == null) { players++; touched = true; }
    }
    if (touched) { await db.saveClub(a.id, c.club, c.standingOrders); clubs++; }
  }
  return { ok: true, clubs, players };
});

const port = Number(process.env.PORT ?? 8787);
await db.init();
await ensureSeason(db, Date.now()); // make sure season 1 exists (and roll over a stale one) on boot
app.listen({ port, host: '0.0.0.0' }).then(() => console.log(`fm-server on :${port}`));
