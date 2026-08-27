// QA fuzz harness — BROADER offline-facade invariant coverage (backlog item #1 from the batch-2 brief).
//
// `client/qa_offline_facade.ts` is a single scripted happy-path smoke test; `shared/qa_money_loop_fuzz.ts`
// randomizes only the pure economy surface (spSeasonReward/spSponsor/hireStaff/genesis). Neither drives
// randomized/adversarial input through: developPlayer, careerHandoff, the loan/trial flow
// (trials/signTrial), succeed/reborn, extendContract, or upgradeFacility. This harness drives the REAL
// `client/src/api.ts` offline facade (in-memory backend, same pattern as the other qa_* harnesses) through
// those call paths with randomized/boundary/adversarial inputs across many repeated games.
//
// Invariants checked at every call:
//   - coins never go negative
//   - no NaN/Infinity ever appears in a returned stat, attribute, or economy number
//   - an insufficient-funds (or otherwise-rejecting) throw never partially mutates state (coins unchanged,
//     token count/roster unchanged)
//   - returned numeric fields stay within their documented bounds (e.g. attrs clamped to [1,20], ages
//     clamped, extendContract's coin delta matches the debit exactly)
//
// Run: `npx tsx shared/qa_facade_invariant_fuzz.ts`.

import { api, __setBackendForTests } from '../client/src/api.js';
import { createInMemoryBackend } from '../client/src/save.js';

const MAX_LOGGED = 80;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const noNaN = (obj: any, path = 'root'): void => {
  if (obj == null) return;
  if (typeof obj === 'number') { if (!Number.isFinite(obj)) log(`non-finite number at ${path}: ${obj}`); return; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => noNaN(v, `${path}[${i}]`)); return; }
  if (typeof obj === 'object') { for (const k of Object.keys(obj)) noNaN(obj[k], `${path}.${k}`); }
};

let seed = 555111333 >>> 0;
const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

async function freshGame(name: string) {
  __setBackendForTests(createInMemoryBackend());
  const reg = await api.register('ignored', 'ignored', name);
  return reg;
}

async function coinsOf() { return (await api.me()).account.coins; }

/** Play a fresh prospect through to graduation via random careerAct choices (mirrors qa_offline_facade.ts). */
async function graduateRandomProspect(): Promise<string> {
  const board = await api.scoutProspects(3);
  const signed = await api.signProspect(pick(board.candidates).seed);
  const pid = signed.prospect.id;
  const { agents } = await api.careerAgents();
  const started = await api.startCareer(pid, pick(agents).id);
  let state = started.state;
  let guard = 0;
  while (guard++ < 3000) {
    const phase = state.phase;
    let action: { type: string; cardId: string };
    if (phase === 'focus') action = { type: 'focus', cardId: pick(state.focus!).id };
    else if (phase === 'offer') action = { type: 'offer', cardId: pick(state.offers!).id };
    else if (phase === 'coach') action = { type: 'coach', cardId: pick(state.coaches!).id };
    else if (phase === 'draft') action = { type: 'draft', cardId: pick(state.options!).id };
    else action = { type: 'play', cardId: pick(state.hand!).id };
    const r = await api.careerAct(pid, action);
    if (r.graduated) return pid;
    state = r.state!;
  }
  throw new Error(`prospect never graduated within turn budget`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 1. developPlayer — randomized focus/age across many pros; attrs stay clamped [1,20], no NaN
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-facade] developPlayer — randomized focus/age, clamped attrs, no NaN...');
{
  await freshGame('QA Develop FC');
  const pid = await graduateRandomProspect();
  const focuses = ['passing', 'shooting', 'pace', 'tackling', 'stamina', 'strength', '', 'not-a-real-attr', 'toString'];
  const ages = [-999, 0, 1, 17, 18, 26, 27, 30, 31, 34, 41, 42, 43, 1e9, NaN, Infinity, -Infinity];
  let checked = 0;
  for (let i = 0; i < 60; i++) {
    const focus = pick(focuses);
    const age = pick(ages);
    const r = await api.developPlayer(pid, { focus, age: age as any });
    checked++;
    noNaN(r, `developPlayer(focus=${focus},age=${age})`);
    if (r.player) {
      for (const [k, v] of Object.entries(r.player as any)) {
        if (typeof v === 'number' && /^(passing|shooting|pace|tackling|stamina|strength|dribbling|heading|composure|leadership)$/.test(k)) {
          if (v < 1 || v > 20) log(`developPlayer(focus=${focus},age=${age}) produced out-of-bounds attr ${k}=${v}`);
        }
      }
    }
    if (!finite(r.overall) || r.overall < 0) log(`developPlayer(focus=${focus},age=${age}) overall=${r.overall} invalid`);
  }
  console.log(`[qa-facade] developPlayer: ${checked} randomized/adversarial (focus,age) calls — no NaN, no out-of-bounds attrs`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 2. careerHandoff — skip-to-graduation path; must never over/under-deduct or corrupt state
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-facade] careerHandoff — skip-to-pro path, coin/roster integrity...');
{
  for (let i = 0; i < 15; i++) {
    await freshGame(`QA Handoff FC ${i}`);
    const board = await api.scoutProspects(3);
    const signed = await api.signProspect(pick(board.candidates).seed);
    const pid = signed.prospect.id;
    const { agents } = await api.careerAgents();
    await api.startCareer(pid, rnd() < 0.5 ? pick(agents).id : null);
    const before = await coinsOf();
    const r = await api.careerHandoff(pid);
    noNaN(r, `careerHandoff#${i}`);
    if (!r.player || !r.player.role) log(`careerHandoff#${i} did not return a valid graduated player`);
    const after = await coinsOf();
    if (after < before) log(`careerHandoff#${i} unexpectedly reduced coins: before=${before} after=${after}`);
    // calling careerHandoff again on the now-graduated (non-prospect) token must throw, not silently no-op
    let threw = false;
    try { await api.careerHandoff(pid); } catch { threw = true; }
    if (!threw) log(`careerHandoff#${i} on an already-graduated token did not throw (should reject: not a prospect)`);
  }
  console.log(`[qa-facade] careerHandoff: 15 fresh prospects skip-graduated, double-handoff correctly rejected each time`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 3. Loan/trial flow — trials() + signTrial() across the cap boundary, no over-cap signings, no NaN
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-facade] loan/trial flow — signTrial cap enforcement + no partial roster mutation on reject...');
{
  await freshGame('QA Trials FC');
  const { pool, cap } = await api.trials();
  noNaN(pool, 'trials().pool');
  let signedCount = 0;
  let overCapRejections = 0;
  for (let i = 0; i < pool.length; i++) {
    const before = await api.me();
    try {
      const r = await api.signTrial(i);
      signedCount++;
      noNaN(r, `signTrial(${i})`);
      const after = await api.me();
      if (after.club.players.length !== before.club.players.length + 1) log(`signTrial(${i}) roster delta != 1: before=${before.club.players.length} after=${after.club.players.length}`);
    } catch {
      overCapRejections++;
      const after = await api.me();
      if (after.club.players.length !== before.club.players.length) log(`signTrial(${i}) threw but roster size changed anyway (before=${before.club.players.length} after=${after.club.players.length})`);
    }
  }
  if (signedCount > cap) log(`signTrial allowed ${signedCount} signings against a cap of ${cap}`);
  console.log(`[qa-facade] trials: pool=${pool.length} cap=${cap} signed=${signedCount} rejected=${overCapRejections} — cap respected, no partial mutation on reject`);
  // re-signing an already-signed index must be rejected cleanly (already-signed guard)
  if (signedCount > 0) {
    const idx = 0;
    const before = await api.me();
    try { await api.signTrial(idx); log(`signTrial(${idx}) allowed a duplicate sign of an already-signed trialist`); } catch { /* expected */ }
    const after = await api.me();
    if (after.club.players.length !== before.club.players.length) log(`duplicate signTrial(${idx}) mutated roster despite throwing`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 4. extendContract — coin delta exactness + insufficient-funds no-partial-deduction
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-facade] extendContract — exact coin debit + insufficient-funds guard...');
{
  await freshGame('QA Extend FC');
  const pid = await graduateRandomProspect();
  for (let i = 0; i < 8; i++) {
    const me = await api.me();
    const ci = me.contracts[pid];
    const before = me.account.coins;
    if (before >= ci.extendCost) {
      const r = await api.extendContract(pid);
      noNaN(r, `extendContract#${i}`);
      if (r.coins !== before - ci.extendCost) log(`extendContract#${i} coin delta mismatch: before=${before} cost=${ci.extendCost} after=${r.coins}`);
    } else {
      let threw = false;
      try { await api.extendContract(pid); } catch { threw = true; }
      if (!threw) log(`extendContract#${i} should have thrown (insufficient funds: have=${before}, need=${ci.extendCost})`);
      else {
        const after = await coinsOf();
        if (after !== before) log(`extendContract#${i} insufficient-funds throw still changed coins: before=${before} after=${after}`);
      }
      break; // drained — stop this sub-loop
    }
  }
  // extending a token that isn't a pro (a still-prospect token) must throw
  const board2 = await api.scoutProspects(3);
  const signed2 = await api.signProspect(pick(board2.candidates).seed);
  let threwNonPro = false;
  try { await api.extendContract(signed2.prospect.id); } catch { threwNonPro = true; }
  if (!threwNonPro) log(`extendContract on a non-pro (still-prospect) token did not throw`);
  console.log(`[qa-facade] extendContract: repeated extension coin-exact, insufficient-funds + non-pro guards hold`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 5. upgradeFacility — every facility key to max level; exact debit, max-level rejection, unknown-key reject
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-facade] upgradeFacility — every key to max level, no negative coins, max-level + unknown-key guards...');
{
  await freshGame('QA Facility FC');
  // give ourselves a deep bank via repeated legit season rewards so we can walk facilities to max level
  for (let i = 0; i < 40; i++) await api.spSeasonReward({ pos: 1, size: 10 });
  const { facilities } = await api.facilities();
  for (const f of facilities) {
    let guard = 0;
    while (guard++ < 20) {
      const before = await coinsOf();
      const cur = (await api.facilities()).facilities.find((x) => x.key === f.key)!;
      if (cur.upgradeCost == null) {
        let threw = false;
        try { await api.upgradeFacility(f.key); } catch { threw = true; }
        if (!threw) log(`upgradeFacility(${f.key}) at max level did not throw`);
        break;
      }
      if (before < cur.upgradeCost) break; // ran out of coins for this key — fine, move on
      const r = await api.upgradeFacility(f.key);
      noNaN(r, `upgradeFacility(${f.key})#${guard}`);
      const after = r.coins;
      if (after !== before - cur.upgradeCost) log(`upgradeFacility(${f.key}) coin delta mismatch: before=${before} cost=${cur.upgradeCost} after=${after}`);
      if (after < 0) log(`upgradeFacility(${f.key}) drove coins negative: ${after}`);
    }
  }
  let threwUnknown = false;
  try { await api.upgradeFacility('not-a-real-facility'); } catch { threwUnknown = true; }
  if (!threwUnknown) log(`upgradeFacility('not-a-real-facility') did not throw`);
  console.log(`[qa-facade] upgradeFacility: walked ${facilities.length} facility keys toward max level — exact debits, guards hold`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 6. succeed()/reborn() — coin/state integrity across the retirement→reborn loop, repeated + adversarial
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-facade] succeed()/reborn() — retirement->reborn loop integrity + adversarial body fields...');
{
  // succeed() is a ONE-SHOT action: it decorates achievements and then reverts the token's state back to
  // 'prospect' (confirmed by client/qa_offline_facade.ts step 12 — "the token is a prospect again, not a
  // contracted pro"), so calling it twice on the same token correctly throws ("not a graduated player") on
  // the second call. Each adversarial body below therefore needs its own freshly-graduated pro.
  const bodies = [
    { seasons: 5, titles: 1, mentorship: 2 },
    { seasons: -50, titles: -50, mentorship: -50 },
    { seasons: 1e9, titles: 1e9, mentorship: 1e9 },
    { seasons: NaN, titles: Infinity, mentorship: -Infinity },
    {} as any,
  ];
  let lastPid = '';
  for (let i = 0; i < bodies.length; i++) {
    await freshGame(`QA Succeed FC ${i}`);
    const pid = await graduateRandomProspect();
    lastPid = pid;
    const r = await api.succeed(pid, bodies[i]);
    noNaN(r, `succeed#${i}`);
    if (r.prospect.id !== pid) log(`succeed#${i} changed the token id (expected same id, reborn semantics)`);
    // and re-calling succeed() immediately after must now throw (state reverted to 'prospect')
    let threwTwice = false;
    try { await api.succeed(pid, bodies[i]); } catch { threwTwice = true; }
    if (!threwTwice) log(`succeed#${i} allowed a second call on the same (now-prospect) token without throwing`);
  }
  console.log(`[qa-facade] succeed(): ${bodies.length} adversarial bodies (negative/huge/NaN/empty) — no NaN leak, id preserved, one-shot guard holds`);

  // reborn() requires state === 'retired'; succeed() reverts to 'prospect', not 'retired' — these are two
  // distinct lifecycle exits in this codebase. Probe reborn() on the (now-prospect, not retired) token:
  // must throw cleanly, no coin change.
  const before = await coinsOf();
  let threw = false;
  try { await api.reborn(lastPid); } catch { threw = true; }
  if (!threw) log(`reborn() on a non-retired token did not throw`);
  const after = await coinsOf();
  if (after !== before) log(`reborn() rejection still changed coins: before=${before} after=${after}`);
  console.log(`[qa-facade] reborn(): non-retired-state rejection is clean (no coin mutation on throw)`);
}

if (failures.length) {
  console.error(`\n[qa-facade] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-facade] clean — no invariant violations found across the extended facade call surface.');
