import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import type { Lineup, Tactics } from '@fm/shared';
import { db, type Account, type StandingOrders } from './db.js';
import { makeClub, validateLineup, runMatch, elo, buildTable, FORMATIONS } from './game.js';

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

app.get('/health', async () => ({ ok: true, service: 'fm-server' }));

app.post('/register', async (req, reply) => {
  const handle = String((req.body as any)?.handle ?? '').trim();
  if (handle.length < 2 || handle.length > 20) return reply.code(400).send({ error: 'handle must be 2-20 chars' });
  if (await db.handleTaken(handle)) return reply.code(409).send({ error: 'handle taken' });
  const id = randomUUID(), token = randomUUID().replace(/-/g, '');
  await db.createAccount(id, handle, token, Date.now());
  const { club, standingOrders } = makeClub(id, handle);
  await db.saveClub(id, club, standingOrders);
  return { token, account: { id, handle, rating: 1000 }, club, standingOrders };
});

app.get('/me', { preHandler: requireAuth }, async (req) => {
  const c = (await db.getClub(req.account!.id))!;
  return { account: req.account, club: c.club, standingOrders: c.standingOrders };
});

app.put('/standing-orders', { preHandler: requireAuth }, async (req, reply) => {
  const body = req.body as any;
  if (!isFormation(body?.formation)) return reply.code(400).send({ error: 'bad formation' });
  const c = (await db.getClub(req.account!.id))!;
  const lineup: Lineup = { formation: body.formation, playerIds: body.playerIds };
  if (!validateLineup(c.club, lineup)) return reply.code(400).send({ error: 'invalid lineup' });
  const so: StandingOrders = { formation: body.formation, playerIds: body.playerIds, tactics: body.tactics as Tactics };
  await db.saveStandingOrders(req.account!.id, so);
  return { ok: true, standingOrders: so };
});

app.get('/opponents', { preHandler: requireAuth }, async (req) =>
  ({ opponents: await db.opponents(req.account!.id, req.account!.rating) }));

app.post('/matches', { preHandler: requireAuth }, async (req, reply) => {
  const body = req.body as any;
  const oppId = String(body?.opponentId ?? '');
  const [opp, oppClub, me] = await Promise.all([db.accountById(oppId), db.getClub(oppId), db.getClub(req.account!.id)]);
  if (!opp || !oppClub) return reply.code(404).send({ error: 'opponent not found' });

  const myLineup: Lineup = body.myLineup
    ? { formation: body.myLineup.formation, playerIds: body.myLineup.playerIds }
    : { formation: me!.standingOrders.formation, playerIds: me!.standingOrders.playerIds };
  const myTactics: Tactics = (body.myTactics as Tactics) ?? me!.standingOrders.tactics;
  if (!isFormation(myLineup.formation) || !validateLineup(me!.club, myLineup)) return reply.code(400).send({ error: 'invalid lineup' });

  const oppLineup: Lineup = { formation: oppClub.standingOrders.formation, playerIds: oppClub.standingOrders.playerIds };
  const { seed, homeTeam, awayTeam, result } = runMatch(me!.club, myLineup, myTactics, oppClub.club, oppLineup, oppClub.standingOrders.tactics);

  const scoreHome = result[0] > result[1] ? 1 : result[0] < result[1] ? 0 : 0.5;
  const [nHome, nAway] = elo(req.account!.rating, opp.rating, scoreHome);
  await Promise.all([db.setRating(req.account!.id, nHome), db.setRating(oppId, nAway)]);

  const matchId = randomUUID();
  await db.saveMatch({
    id: matchId, homeId: req.account!.id, awayId: oppId,
    homeTeam, awayTeam, homeTactics: myTactics, awayTactics: oppClub.standingOrders.tactics,
    seed, homeScore: result[0], awayScore: result[1], createdAt: Date.now(),
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
app.get('/table', async () => {
  const [accounts, results] = await Promise.all([db.allAccounts(), db.allResults()]);
  return { table: buildTable(accounts, results) };
});

const port = Number(process.env.PORT ?? 8787);
await db.init();
app.listen({ port, host: '0.0.0.0' }).then(() => console.log(`fm-server on :${port}`));
