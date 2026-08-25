import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import { overall, type Lineup, type Tactics } from '@fm/shared';
import { db, type Account, type StandingOrders, type Listing } from './db.js';
import { makeClub, validateLineup, cleanDuties, runMatch, elo, buildTable, FORMATIONS } from './game.js';
import { hashPassword, verifyPassword } from './auth.js';
import { generatePool, trialistAt, LOANEE_CAP, OPP_REVEAL, describeIntel, type OppTier } from './scouting.js';
import { viewerTiers, scoutNftInfo } from './scoutnft.js';
import type { PlayerScoutTier } from './market.js';
import { ensureSeason, ensurePod, forceRollover, resultsAmong, startOfUtcDay, PROMOTE, RELEGATE, MATCHES_PER_DAY } from './seasons.js';
import {
  revealPlayer, WIN_COINS, DRAW_COINS, LOSS_COINS,
  MIN_SQUAD, MAX_SQUAD, PRICE_MIN, PRICE_MAX,
} from './market.js';
import { autoPickXI } from '@fm/shared';
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
  if (!nftEnabled()) return c;
  const wallet = await db.walletOf(accountId);
  const nfts = await ownedPlayers(wallet);
  if (nfts.length) {
    const have = new Set(c.club.players.map((p) => p.id));
    c.club = { ...c.club, players: [...c.club.players, ...nfts.filter((p) => !have.has(p.id))] };
  }
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
  const c = await db.getClub(auth.id);
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
  const c = (await loadSquad(req.account!.id))!; // includes any star NFTs the linked wallet owns
  const [coins, wallet] = await Promise.all([db.getCoins(req.account!.id), db.walletOf(req.account!.id)]);
  return { account: { ...req.account, coins, wallet }, club: c.club, standingOrders: c.standingOrders };
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

  const myLineup: Lineup = body.myLineup
    ? { formation: body.myLineup.formation, playerIds: body.myLineup.playerIds, duties: body.myLineup.duties }
    : { formation: me!.standingOrders.formation, playerIds: me!.standingOrders.playerIds, duties: me!.standingOrders.duties };
  const myTactics: Tactics = (body.myTactics as Tactics) ?? me!.standingOrders.tactics;
  if (!isFormation(myLineup.formation) || !validateLineup(me!.club, myLineup)) return reply.code(400).send({ error: 'invalid lineup' });
  myLineup.duties = cleanDuties(me!.club, myLineup);
  // remember this plan for next time we face this opponent
  await db.savePlan(meId, oppId, { formation: myLineup.formation, playerIds: myLineup.playerIds, tactics: myTactics, duties: myLineup.duties });
  let oppLineup: Lineup = { formation: oppClub.standingOrders.formation, playerIds: oppClub.standingOrders.playerIds, duties: oppClub.standingOrders.duties };
  if (!validateLineup(oppClub.club, oppLineup)) oppLineup = autoPickXI(oppClub.club, oppClub.standingOrders.formation); // stale NFT in their XI → auto-pick
  const oppTactics = oppClub.standingOrders.tactics;

  // run the match with the correct home/away team ordering (I may be the away side)
  const hClub = iAmHome ? me!.club : oppClub.club, hLineup = iAmHome ? myLineup : oppLineup, hTactics = iAmHome ? myTactics : oppTactics;
  const aClub = iAmHome ? oppClub.club : me!.club, aLineup = iAmHome ? oppLineup : myLineup, aTactics = iAmHome ? oppTactics : myTactics;
  const { seed, homeTeam, awayTeam, result } = runMatch(hClub, hLineup, hTactics, aClub, aLineup, aTactics);

  // Elo from my perspective, regardless of which side I was on
  const myScore = iAmHome ? result[0] : result[1], oppScore = iAmHome ? result[1] : result[0];
  const myOutcome = myScore > oppScore ? 1 : myScore < oppScore ? 0 : 0.5;
  const [nMe, nOpp] = elo(req.account!.rating, opp.rating, myOutcome);
  const coinsFor = (o: number) => o === 1 ? WIN_COINS : o === 0.5 ? DRAW_COINS : LOSS_COINS;
  const myCoins = coinsFor(myOutcome), oppCoins = coinsFor(1 - myOutcome);
  await Promise.all([db.setRating(meId, nMe), db.setRating(oppId, nOpp), db.addCoins(meId, myCoins), db.addCoins(oppId, oppCoins)]);
  const nHome = iAmHome ? nMe : nOpp, nAway = iAmHome ? nOpp : nMe;

  const matchId = randomUUID();
  await db.saveMatch({
    id: matchId, homeId, awayId, homeTeam, awayTeam, homeTactics: hTactics, awayTactics: aTactics,
    seed, homeScore: result[0], awayScore: result[1], createdAt: Date.now(), seasonId: season.id, initiatorId: meId,
  });

  return {
    matchId, seed, result, mySide: iAmHome ? 0 : 1, coinsEarned: myCoins,
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
  const [signed, count, tiers] = await Promise.all([
    db.loaneeIds(req.account!.id, s.id), db.countLoanees(req.account!.id, s.id), viewerTiers(await db.walletOf(req.account!.id)),
  ]);
  const signedSet = new Set(signed);
  const pool = generatePool(req.account!.id, s.number, tiers.player).map((t) => ({ ...t, signed: signedSet.has(t.id) }));
  return { season: s.number, cap: LOANEE_CAP, signedCount: count, tier: tiers.player, pool };
});

// sign a trialist (up to LOANEE_CAP per season); adds them to your squad for the season
app.post('/scout/trials/:index/sign', { preHandler: requireAuth }, async (req, reply) => {
  const meId = req.account!.id;
  const s = await ensureSeason(db, Date.now());
  if (await db.countLoanees(meId, s.id) >= LOANEE_CAP) return reply.code(409).send({ error: `you can sign at most ${LOANEE_CAP} loanees a season` });
  const tiers = await viewerTiers(await db.walletOf(meId)); // same tier the pool was generated with, so ids match
  const player = trialistAt(meId, s.number, Number((req.params as any).index), tiers.player);
  if (!player) return reply.code(404).send({ error: 'no such trialist' });
  const c = await db.getClub(meId);
  if (!c) return reply.code(404).send({ error: 'club not found' });
  if (c.club.players.some((p) => p.id === player.id)) return reply.code(409).send({ error: 'already signed' });
  c.club.players.push(player);
  await db.saveClub(meId, c.club, c.standingOrders);
  await db.addLoanee(meId, s.id, player.id);
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
  const c = await db.getClub(meId);
  if (!c) return reply.code(404).send({ error: 'club not found' });
  const player = c.club.players.find((p) => p.id === playerId);
  if (!player) return reply.code(404).send({ error: 'you do not own that player' });
  if (player.id.startsWith('loan-')) return reply.code(409).send({ error: 'loanees cannot be sold' });
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
  const [coins, buyerClub, sellerClub] = await Promise.all([db.getCoins(meId), db.getClub(meId), db.getClub(l.seller_id)]);
  if (!buyerClub || !sellerClub) return reply.code(404).send({ error: 'club not found' });
  if (coins < l.price) return reply.code(409).send({ error: 'not enough coins' });
  if (buyerClub.club.players.length >= MAX_SQUAD) return reply.code(409).send({ error: `your squad is full (max ${MAX_SQUAD})` });
  const idx = sellerClub.club.players.findIndex((p) => p.id === l.player_id);
  if (idx < 0) { await db.setListingStatus(l.id, 'cancelled', null, null); return reply.code(409).send({ error: 'seller no longer owns that player' }); }
  const [player] = sellerClub.club.players.splice(idx, 1);
  buyerClub.club.players.push(player);
  // repair the seller's standing XI if they'd just sold a starter
  let sellerSo = sellerClub.standingOrders;
  if (sellerSo.playerIds.includes(l.player_id)) sellerSo = { ...sellerSo, playerIds: autoPickXI(sellerClub.club, sellerSo.formation).playerIds, duties: undefined };
  await Promise.all([
    db.saveClub(l.seller_id, sellerClub.club, sellerSo),
    db.saveClub(meId, buyerClub.club, buyerClub.standingOrders),
    db.addCoins(meId, -l.price),
    db.addCoins(l.seller_id, l.price),
    db.setListingStatus(l.id, 'sold', meId, Date.now()),
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

const port = Number(process.env.PORT ?? 8787);
await db.init();
await ensureSeason(db, Date.now()); // make sure season 1 exists (and roll over a stale one) on boot
app.listen({ port, host: '0.0.0.0' }).then(() => console.log(`fm-server on :${port}`));
