import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import { overall, type Lineup, type Tactics } from '@fm/shared';
import { db, type Account, type StandingOrders } from './db.js';
import { makeClub, validateLineup, cleanDuties, runMatch, elo, buildTable, FORMATIONS } from './game.js';
import { hashPassword, verifyPassword } from './auth.js';
import { ensureSeason, ensurePod, forceRollover, resultsAmong, startOfUtcDay, PROMOTE, RELEGATE, MATCHES_PER_DAY } from './seasons.js';

const app = Fastify({ logger: false });
await app.register(cors, { origin: true });

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
  return { token, account: { id, handle, rating: 1000 }, club, standingOrders };
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
  return { token: auth.token, account: { id: auth.id, handle: auth.handle, rating: auth.rating }, club: c.club, standingOrders: c.standingOrders };
});

app.get('/me', { preHandler: requireAuth }, async (req) => {
  const c = (await db.getClub(req.account!.id))!;
  return { account: req.account, club: c.club, standingOrders: c.standingOrders };
});

app.put('/standing-orders', { preHandler: requireAuth }, async (req, reply) => {
  const body = req.body as any;
  if (!isFormation(body?.formation)) return reply.code(400).send({ error: 'bad formation' });
  const c = (await db.getClub(req.account!.id))!;
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
  const [opp, oppClub, me] = await Promise.all([db.accountById(oppId), db.getClub(oppId), db.getClub(req.account!.id)]);
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
  const oppLineup: Lineup = { formation: oppClub.standingOrders.formation, playerIds: oppClub.standingOrders.playerIds, duties: oppClub.standingOrders.duties };
  const oppTactics = oppClub.standingOrders.tactics;

  // run the match with the correct home/away team ordering (I may be the away side)
  const hClub = iAmHome ? me!.club : oppClub.club, hLineup = iAmHome ? myLineup : oppLineup, hTactics = iAmHome ? myTactics : oppTactics;
  const aClub = iAmHome ? oppClub.club : me!.club, aLineup = iAmHome ? oppLineup : myLineup, aTactics = iAmHome ? oppTactics : myTactics;
  const { seed, homeTeam, awayTeam, result } = runMatch(hClub, hLineup, hTactics, aClub, aLineup, aTactics);

  // Elo from my perspective, regardless of which side I was on
  const myScore = iAmHome ? result[0] : result[1], oppScore = iAmHome ? result[1] : result[0];
  const myOutcome = myScore > oppScore ? 1 : myScore < oppScore ? 0 : 0.5;
  const [nMe, nOpp] = elo(req.account!.rating, opp.rating, myOutcome);
  await Promise.all([db.setRating(meId, nMe), db.setRating(oppId, nOpp)]);
  const nHome = iAmHome ? nMe : nOpp, nAway = iAmHome ? nOpp : nMe;

  const matchId = randomUUID();
  await db.saveMatch({
    id: matchId, homeId, awayId, homeTeam, awayTeam, homeTactics: hTactics, awayTactics: aTactics,
    seed, homeScore: result[0], awayScore: result[1], createdAt: Date.now(), seasonId: season.id, initiatorId: meId,
  });

  return {
    matchId, seed, result, mySide: iAmHome ? 0 : 1,
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
  const [opp, c] = await Promise.all([db.accountById(id), db.getClub(id)]);
  if (!opp || !c) return reply.code(404).send({ error: 'not found' });
  const likely = new Set(c.standingOrders.playerIds);
  const players = c.club.players
    .map((p) => ({ name: p.name, role: p.role, overall: overall(p), likelyXI: likely.has(p.id) }))
    .sort((a, b) => b.overall - a.overall);
  return { handle: opp.handle, clubName: c.club.name, rating: opp.rating, formation: c.standingOrders.formation, players };
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

const port = Number(process.env.PORT ?? 8787);
await db.init();
await ensureSeason(db, Date.now()); // make sure season 1 exists (and roll over a stale one) on boot
app.listen({ port, host: '0.0.0.0' }).then(() => console.log(`fm-server on :${port}`));
