import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import type { Lineup, Tactics } from '@fm/shared';
import { db, type Account, type StandingOrders } from './db.js';
import { makeClub, validateLineup, cleanDuties, runMatch, elo, buildTable, FORMATIONS } from './game.js';
import { hashPassword, verifyPassword } from './auth.js';
import { ensureSeason, ensurePod, forceRollover, resultsAmong, PROMOTE, RELEGATE } from './seasons.js';

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

// opponents = your pod-mates this season (so matches feed your pod's table)
app.get('/opponents', { preHandler: requireAuth }, async (req) => {
  const s = await ensureSeason(db, Date.now());
  const { tier, pod } = await ensurePod(db, s, req.account!.id);
  const members = (await db.podMembers(s.id, tier, pod)).filter((m) => m.id !== req.account!.id);
  const opponents = [];
  for (const m of members) {
    const c = await db.getClub(m.id);
    if (c) opponents.push({ id: m.id, handle: m.handle, rating: m.rating, clubName: c.club.name });
  }
  return { opponents };
});

app.post('/matches', { preHandler: requireAuth }, async (req, reply) => {
  const body = req.body as any;
  const oppId = String(body?.opponentId ?? '');
  const [opp, oppClub, me] = await Promise.all([db.accountById(oppId), db.getClub(oppId), db.getClub(req.account!.id)]);
  if (!opp || !oppClub) return reply.code(404).send({ error: 'opponent not found' });

  const myLineup: Lineup = body.myLineup
    ? { formation: body.myLineup.formation, playerIds: body.myLineup.playerIds, duties: body.myLineup.duties }
    : { formation: me!.standingOrders.formation, playerIds: me!.standingOrders.playerIds, duties: me!.standingOrders.duties };
  const myTactics: Tactics = (body.myTactics as Tactics) ?? me!.standingOrders.tactics;
  if (!isFormation(myLineup.formation) || !validateLineup(me!.club, myLineup)) return reply.code(400).send({ error: 'invalid lineup' });
  myLineup.duties = cleanDuties(me!.club, myLineup);

  const oppLineup: Lineup = { formation: oppClub.standingOrders.formation, playerIds: oppClub.standingOrders.playerIds, duties: oppClub.standingOrders.duties };
  const { seed, homeTeam, awayTeam, result } = runMatch(me!.club, myLineup, myTactics, oppClub.club, oppLineup, oppClub.standingOrders.tactics);

  const scoreHome = result[0] > result[1] ? 1 : result[0] < result[1] ? 0 : 0.5;
  const [nHome, nAway] = elo(req.account!.rating, opp.rating, scoreHome);
  await Promise.all([db.setRating(req.account!.id, nHome), db.setRating(oppId, nAway)]);

  const season = await ensureSeason(db, Date.now());
  await ensurePod(db, season, req.account!.id); // make sure the player is in a pod (so the match counts)
  const matchId = randomUUID();
  await db.saveMatch({
    id: matchId, homeId: req.account!.id, awayId: oppId,
    homeTeam, awayTeam, homeTactics: myTactics, awayTactics: oppClub.standingOrders.tactics,
    seed, homeScore: result[0], awayScore: result[1], createdAt: Date.now(), seasonId: season.id,
  });

  return {
    matchId, seed, result,
    home: { id: req.account!.id, handle: req.account!.handle, rating: nHome, team: homeTeam, tactics: myTactics },
    away: { id: oppId, handle: opp.handle, rating: nAway, team: awayTeam, tactics: oppClub.standingOrders.tactics },
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
