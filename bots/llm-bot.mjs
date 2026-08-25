// LLM bot — an agent that "plays like a curious human": it reads the game state, an
// LLM picks ONE action per turn from a fixed menu, and it flags anything that looks
// broken or nonsensical (a UX/logic bug a scripted monkey wouldn't notice). Provider-
// agnostic: talks to any OpenAI-compatible /chat/completions endpoint, so it runs on a
// LiteLLM proxy (Grok / Gemini / DeepSeek / Anthropic / Haiku) — see [[feedback-model-cost]].
//
// Env: LLM_BASE_URL (e.g. http://localhost:4000/v1 for a LiteLLM proxy), LLM_API_KEY,
//      LLM_MODEL, BOT_TARGET, BOT_ID, BOT_TURNS (max, default ∞), BOT_DELAY_MS, BUGLOG.
import { appendFile } from 'node:fs/promises';

const BASE = process.env.BOT_TARGET || 'http://localhost:8799';
const BOT_ID = process.env.BOT_ID || 'llm0';
const MAX_TURNS = Number(process.env.BOT_TURNS || Number.MAX_SAFE_INTEGER);
const DELAY = Number(process.env.BOT_DELAY_MS || 4000);
const BUGLOG = process.env.BUGLOG || new URL('./bugs.jsonl', import.meta.url).pathname;
const LLM_BASE = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

let token = '', handle = '', turns = 0;
const seen = new Set();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function logBug(kind, detail) {
  const sig = `${kind}:${detail.path || ''}:${(detail.note || '').slice(0, 70)}`;
  if (seen.has(sig)) return; seen.add(sig);
  await appendFile(BUGLOG, JSON.stringify({ ts: new Date().toISOString(), bot: BOT_ID, handle, kind, ...detail }) + '\n').catch(() => {});
  console.error(`🐛 [${BOT_ID}] ${kind} ${detail.path ?? ''} — ${detail.note ?? ''}`);
}

async function api(method, path, body) {
  const headers = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) };
  let res, text;
  try { res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }); text = await res.text(); }
  catch (e) { await logBug('network', { path, note: String(e?.message ?? e) }); return { status: 0, json: null }; }
  let json = null; if (text) { try { json = JSON.parse(text); } catch { /* non-json */ } }
  if (res.status >= 500) await logBug('http-5xx', { path, method, status: res.status, note: json?.message || json?.error || text?.slice(0, 200), body });
  return { status: res.status, json };
}

async function llm(system, user) {
  const res = await fetch(LLM_BASE.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(LLM_KEY ? { authorization: `Bearer ${LLM_KEY}` } : {}) },
    body: JSON.stringify({ model: LLM_MODEL, temperature: 0.7, max_tokens: 300, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return (await res.json()).choices?.[0]?.message?.content ?? '';
}

const SYSTEM = `You are a curious human playtesting a pixel football-manager game via its API. Each turn you get the game state and must pick ONE action to test the game, poking at edge cases like a real user.
Reply with ONLY a JSON object, no prose:
{"action":"<name>","arg":"<optional>","reason":"<short>","bug":"<null or a description of anything that looks broken, impossible, or nonsensical in the state you were shown>"}
Valid actions: play_match, dispatch_scout (arg=destination id), sign_scout, upgrade_facility (arg=facility key), sign_tryout, list_player, buy_listing, idle.
Set "bug" to a description ONLY if something is genuinely wrong (e.g. negative coins, a squad with <11 players, a stat that's NaN/undefined, an impossible price). Otherwise "bug":null.`;

async function state() {
  const [me, fx, fac, sc, mk] = await Promise.all([api('GET', '/me'), api('GET', '/fixtures'), api('GET', '/facilities'), api('GET', '/scout/missions'), api('GET', '/market')]);
  return {
    coins: me.json?.account?.coins, squadSize: me.json?.club?.players?.length,
    pendingFixtures: (fx.json?.fixtures ?? []).filter((f) => f.status === 'pending').slice(0, 4).map((f) => ({ opponentId: f.opponentId, venue: f.venue })),
    facilities: (fac.json?.facilities ?? []).map((f) => ({ key: f.key, level: f.level, cost: f.upgradeCost, canAfford: f.canAfford })),
    coinsForScout: sc.json?.coins, tripsLeft: sc.json?.tripsLeft, loaneeSlots: (sc.json?.loaneeCap ?? 0) - (sc.json?.loaneeCount ?? 0),
    destinations: (sc.json?.destinations ?? []).map((d) => ({ id: d.id, cost: d.cost, hit: d.hitRate })),
    revealedScouts: (sc.json?.missions ?? []).filter((m) => m.revealed && m.found && m.status !== 'signed').map((m) => ({ id: m.id, player: m.player?.name })),
    tryouts: (sc.json ? [] : []), listings: (mk.json?.listings ?? []).filter((l) => !l.mine).slice(0, 4).map((l) => ({ id: l.id, price: l.price })),
  };
}

async function act(choice, st) {
  switch (choice.action) {
    case 'play_match': { const f = st.pendingFixtures[0]; if (f) await api('POST', '/matches', { opponentId: f.opponentId, venue: f.venue }); break; }
    case 'dispatch_scout': { const d = st.destinations.find((x) => x.id === choice.arg) || st.destinations[0]; if (d && st.tripsLeft > 0 && st.coinsForScout >= d.cost) await api('POST', '/scout/missions', { destination: d.id }); break; }
    case 'sign_scout': { const m = st.revealedScouts[0]; if (m && st.loaneeSlots > 0) await api('POST', `/scout/missions/${m.id}/sign`, {}); break; }
    case 'upgrade_facility': { const f = st.facilities.find((x) => x.key === choice.arg && x.canAfford) || st.facilities.find((x) => x.canAfford); if (f) await api('POST', `/facilities/${f.key}/upgrade`, {}); break; }
    case 'sign_tryout': { const t = await api('GET', '/scout/trials'); const u = (t.json?.pool ?? []).find((x) => !x.signed); if (u && (t.json?.signedCount ?? 0) < (t.json?.cap ?? 0)) await api('POST', `/scout/trials/${u.index}/sign`, {}); break; }
    case 'list_player': { const me = await api('GET', '/me'); const p = (me.json?.club?.players ?? []).find((x) => !x.id.startsWith('nft:')); if (p) await api('POST', '/market/list', { playerId: p.id, price: 50 }); break; }
    case 'buy_listing': { const l = st.listings[0]; if (l && st.coins >= l.price) await api('POST', `/market/${l.id}/buy`, {}); break; }
    default: break; // idle / unknown
  }
}

async function main() {
  if (!LLM_KEY && !/localhost|127\.0\.0\.1/.test(LLM_BASE)) { console.error(`[${BOT_ID}] no LLM_API_KEY set — exiting`); return; }
  handle = `bot_${BOT_ID}_${Date.now().toString(36)}`;
  const r = await api('POST', '/register', { handle, password: 'llmpw12345' });
  if (r.status !== 200) { await logBug('register-failed', { path: '/register', status: r.status }); return; }
  token = r.json.token; await api('GET', '/standings');
  console.log(`[${BOT_ID}] playing as ${handle} via ${LLM_MODEL}`);
  while (turns < MAX_TURNS) {
    try {
      const st = await state();
      // hard invariants the model might miss
      if (typeof st.coins === 'number' && st.coins < 0) await logBug('coins-invariant', { path: '/me', note: `coins=${st.coins}` });
      if (typeof st.squadSize === 'number' && st.squadSize < 11) await logBug('squad-invariant', { path: '/me', note: `squad=${st.squadSize}` });
      const reply = await llm(SYSTEM, JSON.stringify(st));
      let choice; try { choice = JSON.parse(reply.match(/\{[\s\S]*\}/)?.[0] ?? reply); } catch { choice = { action: 'idle' }; }
      if (choice.bug && String(choice.bug).toLowerCase() !== 'null') await logBug('llm-flag', { note: String(choice.bug).slice(0, 300), state: st });
      await act(choice, st);
    } catch (e) { await logBug('bot-exception', { note: String(e?.message ?? e).slice(0, 200) }); await sleep(2000); }
    turns++;
    if (turns % 25 === 0) console.log(`[${BOT_ID}] ${turns} turns`);
    await sleep(DELAY);
  }
}

main();
