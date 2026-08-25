// Monkey bot — a deterministic-ish chaos player that hammers the live game API with
// random-but-valid actions and asserts invariants after each. Zero LLM, zero tokens.
// It distinguishes "server correctly rejected me" (4xx — fine) from "server broke"
// (5xx / invalid payload / broken invariant — a BUG) and logs bugs as JSONL with the
// full request + response (+ match seed, so the deterministic engine replays exactly).
//
// Env: BOT_TARGET (base url), BOT_ID (label), BOT_ACTIONS (max actions, default ∞),
//      BOT_DELAY_MS (pause between actions), BUGLOG (jsonl path).
import { appendFile } from 'node:fs/promises';

const BASE = process.env.BOT_TARGET || 'http://localhost:8799';
const BOT_ID = process.env.BOT_ID || 'm0';
const MAX_ACTIONS = Number(process.env.BOT_ACTIONS || Number.MAX_SAFE_INTEGER);
const DELAY = Number(process.env.BOT_DELAY_MS || 150);
const BUGLOG = process.env.BUGLOG || new URL('./bugs.jsonl', import.meta.url).pathname;

let token = '';
let handle = '';
let actions = 0;
let bugCount = 0;
const seen = new Set(); // dedupe identical bug signatures within this bot

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function logBug(kind, detail) {
  const sig = `${kind}:${detail.path || ''}:${detail.status || ''}:${(detail.note || '').slice(0, 60)}`;
  if (seen.has(sig)) return; // one report per distinct signature per bot run
  seen.add(sig);
  bugCount++;
  const rec = { ts: new Date().toISOString(), bot: BOT_ID, handle, kind, ...detail };
  await appendFile(BUGLOG, JSON.stringify(rec) + '\n').catch(() => {});
  console.error(`🐛 [${BOT_ID}] ${kind} ${detail.path ?? ''} ${detail.status ?? ''} — ${detail.note ?? ''}`);
}

async function api(method, path, body) {
  const headers = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) };
  let res, text;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    text = await res.text();
  } catch (e) {
    await logBug('network', { path, method, note: String(e?.message ?? e) });
    return { status: 0, ok: false, json: null };
  }
  let json = null;
  if (text) { try { json = JSON.parse(text); } catch { await logBug('bad-json', { path, method, status: res.status, note: text.slice(0, 200) }); } }
  // 5xx is always a server bug; 4xx is the server correctly rejecting us (not a bug).
  if (res.status >= 500) await logBug('http-5xx', { path, method, status: res.status, note: json?.message || json?.error || text?.slice(0, 200), body });
  return { status: res.status, ok: res.ok, json };
}

// ── invariant checks (only flag clear violations, to avoid overnight false-positive spam) ──
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
const STATS = ['pace', 'strength', 'passing', 'shooting', 'tackling', 'positioning', 'workrate', 'keeping', 'setPiece', 'stamina'];

function checkTeam(side, team, ctx) {
  const bugs = [];
  if (!team || !Array.isArray(team.players)) { bugs.push(`${side}: no players array`); return bugs; }
  if (team.players.length !== 11) bugs.push(`${side}: ${team.players.length} players (want 11)`);
  for (const p of team.players) {
    if (!p || typeof p.id !== 'string') { bugs.push(`${side}: player missing id`); continue; }
    if (!['GK', 'DF', 'MF', 'FW'].includes(p.role)) bugs.push(`${side}: ${p.id} bad role ${p.role}`);
    if (!p.attrs) { bugs.push(`${side}: ${p.id} no attrs`); continue; }
    for (const s of STATS) if (!isFiniteNum(p.attrs[s])) bugs.push(`${side}: ${p.id} attrs.${s}=${p.attrs[s]}`);
  }
  return bugs;
}

async function checkMatch(p) {
  const bugs = [];
  if (!Array.isArray(p?.result) || !isFiniteNum(p.result[0]) || !isFiniteNum(p.result[1])) bugs.push(`result=${JSON.stringify(p?.result)}`);
  if (!isFiniteNum(p?.seed)) bugs.push(`seed=${p?.seed}`);
  bugs.push(...checkTeam('home', p?.home?.team));
  bugs.push(...checkTeam('away', p?.away?.team));
  if (bugs.length) {
    // capture seed + both teams + tactics so the deterministic engine replays this exactly
    await logBug('match-invariant', { path: '/matches', note: bugs.join(' | '), seed: p?.seed, repro: { seed: p?.seed, home: p?.home, away: p?.away } });
  }
}

function checkCoins(where, coins) {
  if (!isFiniteNum(coins) || coins < 0) return logBug('coins-invariant', { path: where, note: `coins=${coins}` });
}

// ── actions ──
async function ensurePlaced() { await api('GET', '/standings'); }

async function playMatch() {
  const fx = await api('GET', '/fixtures');
  const pending = (fx.json?.fixtures ?? []).filter((f) => f.status === 'pending');
  if (!pending.length) return;
  const f = pick(pending);
  const r = await api('POST', '/matches', { opponentId: f.opponentId, venue: f.venue });
  if (r.status === 200 && r.json) { await checkMatch(r.json); }
  // 409 (already played / cap) and 400 are legitimate rejections
}

async function upgradeFacility() {
  const r = await api('GET', '/facilities');
  const facs = r.json?.facilities ?? [];
  await checkCoins('/facilities', r.json?.coins);
  const affordable = facs.filter((f) => f.canAfford && f.upgradeCost != null);
  if (!affordable.length) return;
  const f = pick(affordable);
  const up = await api('POST', `/facilities/${f.key}/upgrade`, {});
  if (up.status === 200 && up.json) {
    // level must increment by exactly 1 (concurrency-safe); coins deltas are NOT checked
    // because other bots' matches against me legitimately change my coins meanwhile.
    if (up.json.level !== f.level + 1) await logBug('facility-invariant', { path: `/facilities/${f.key}/upgrade`, note: `level ${f.level}->${up.json.level}` });
    await checkCoins(`/facilities/${f.key}/upgrade`, up.json.coins);
  }
}

async function scout() {
  const r = await api('GET', '/scout/missions');
  const d = r.json;
  await checkCoins('/scout/missions', d?.coins);
  if (!d) return;
  // sign any revealed-and-found mission if a loanee slot is free
  const signable = (d.missions ?? []).filter((m) => m.revealed && m.found && m.status !== 'signed' && m.player);
  if (signable.length && d.loaneeCount < d.loaneeCap) {
    const m = pick(signable);
    const sr = await api('POST', `/scout/missions/${m.id}/sign`, {});
    if (sr.status === 200) { const me = await api('GET', '/me'); if (!(me.json?.club?.players ?? []).some((p) => p.id === m.player.id)) await logBug('scout-invariant', { path: '/scout/missions/sign', note: `${m.player.id} not in squad after sign` }); }
    return;
  }
  // otherwise dispatch an affordable trip if any left
  const dests = (d.destinations ?? []).filter((x) => d.coins >= x.cost);
  if (d.tripsLeft > 0 && dests.length) await api('POST', '/scout/missions', { destination: pick(dests).id });
}

async function tryouts() {
  const r = await api('GET', '/scout/trials');
  const d = r.json;
  if (!d) return;
  const unsigned = (d.pool ?? []).filter((t) => !t.signed);
  if (unsigned.length && d.signedCount < d.cap) await api('POST', `/scout/trials/${pick(unsigned).index}/sign`, {});
}

async function market() {
  const r = await api('GET', '/market');
  const d = r.json;
  await checkCoins('/market', d?.coins);
  if (!d) return;
  if (rnd(2) === 0) {
    // list a random squad player (server rejects loanees/min-squad — that's fine)
    const me = await api('GET', '/me');
    const players = (me.json?.club?.players ?? []).filter((p) => !p.id.startsWith('nft:'));
    if (players.length) await api('POST', '/market/list', { playerId: pick(players).id, price: 10 + rnd(500) });
  } else {
    const buyable = (d.listings ?? []).filter((l) => !l.mine && d.coins >= l.price);
    if (buyable.length) {
      const b = await api('POST', `/market/${pick(buyable).id}/buy`, {}); // exact coin delta not checked (concurrent matches move coins)
      if (b.status === 200) await checkCoins('/market/buy', b.json?.coins);
    }
  }
}

async function checkMe() {
  const me = await api('GET', '/me');
  await checkCoins('/me', me.json?.account?.coins);
  if (me.json && me.json.club && (me.json.club.players?.length ?? 0) < 11) await logBug('squad-invariant', { path: '/me', note: `squad size ${me.json.club.players?.length}` });
}

const WEIGHTED = [
  ...Array(5).fill(playMatch), ...Array(2).fill(scout), ...Array(2).fill(upgradeFacility),
  ...Array(2).fill(market), tryouts, checkMe,
];

async function register() {
  handle = `bot_${BOT_ID}_${Date.now().toString(36)}${rnd(1e4)}`;
  const r = await api('POST', '/register', { handle, password: 'monkeypw123' });
  if (r.status !== 200 || !r.json?.token) { await logBug('register-failed', { path: '/register', status: r.status, note: JSON.stringify(r.json).slice(0, 120) }); return false; }
  token = r.json.token;
  return true;
}

async function main() {
  if (!(await register())) { console.error(`[${BOT_ID}] could not register, exiting`); return; }
  await ensurePlaced();
  console.log(`[${BOT_ID}] playing as ${handle}`);
  while (actions < MAX_ACTIONS) {
    try { await pick(WEIGHTED)(); }
    catch (e) { await logBug('bot-exception', { note: String(e?.stack ?? e).slice(0, 300) }); }
    actions++;
    if (actions % 200 === 0) console.log(`[${BOT_ID}] ${actions} actions, ${bugCount} bug sigs`);
    await sleep(DELAY);
  }
}

main();
