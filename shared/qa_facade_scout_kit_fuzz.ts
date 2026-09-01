// QA fuzz harness — SCOUTING TRIP + KIT-CUSTOMIZATION facade coverage (batch-3 backlog item #1).
//
// `shared/qa_facade_invariant_fuzz.ts` (batch 2) covers developPlayer/careerHandoff/trials-signTrial/
// extendContract/upgradeFacility/succeed/reborn but does NOT touch the scouting-trip flow
// (`api.dispatchScout`/`api.signMission`, see `client/src/api.ts`) or `api.saveKit`. This harness drives
// those two call paths — the real offline facade, in-memory backend, same pattern as the other qa_*
// harnesses — with randomized/adversarial input across many repeated games.
//
// Invariants checked:
//   - coins never go negative, and a rejecting throw never partially deducts/mutates state
//   - no NaN/Infinity ever appears in a returned field
//   - dispatchScout: unknown/malformed destination id rejected with NO coin deduction; the per-season
//     trip cap (tripsPerSeason) is enforced exactly, with no over-cap dispatch ever debiting coins
//   - signMission: unknown mission id -> 404, no mutation; still-travelling mission -> 409, no mutation;
//     empty-handed trip -> 409, no mutation; double-sign -> 409, no mutation; loanee-cap enforcement
//     mirrors trials()'s cap guard exactly (no over-cap roster growth)
//   - saveKit: adversarial bodies (negative/huge/NaN/Infinity number, oversized strings, `<`/`>`
//     injection-like strings, wrong-typed fields, missing fields, unknown pid) never crash and always
//     return a bounded/sanitized Kit — number clamped to [1,99], strings length-capped and `<`/`>`-free
//
// Run: `npx tsx shared/qa_facade_scout_kit_fuzz.ts`.

import { api, __setBackendForTests } from '../client/src/api.js';
import { createInMemoryBackend, localStore } from '../client/src/save.js';

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

let seed = 741852963 >>> 0;
const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

async function freshGame(name: string) {
  __setBackendForTests(createInMemoryBackend());
  return api.register('ignored', 'ignored', name);
}
async function coinsOf() { return (await api.me()).account.coins; }
async function rosterSize() { return (await api.me()).club.players.length; }

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 1. dispatchScout — adversarial destination ids, no coin deduction on rejection
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-scout-kit] dispatchScout — adversarial destination ids, insufficient funds, no partial deduction...');
{
  await freshGame('QA Scout Adversarial FC');
  const badDestinations = ['', 'not-a-real-destination', 'PARKS', ' parks', 'parks ', 'toString', '__proto__', 'null', 'undefined', '0', '<script>x</script>', 'a'.repeat(500)];
  for (const d of badDestinations) {
    const before = await coinsOf();
    let threw = false;
    try { await api.dispatchScout(d); } catch { threw = true; }
    if (!threw) log(`dispatchScout("${d.slice(0, 30)}") should have thrown (unknown destination)`);
    const after = await coinsOf();
    if (after !== before) log(`dispatchScout("${d.slice(0, 30)}") rejection still changed coins: before=${before} after=${after}`);
  }
  console.log(`[qa-scout-kit] dispatchScout: ${badDestinations.length} adversarial destination ids — all rejected cleanly, no coin mutation`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 2. dispatchScout — per-season trip cap enforced exactly, insufficient funds guard
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-scout-kit] dispatchScout — per-season trip cap + insufficient-funds guard...');
{
  await freshGame('QA Scout Cap FC');
  const { destinations, tripsPerSeason } = await api.missions();
  noNaN(destinations, 'missions().destinations');
  let dispatched = 0;
  for (let i = 0; i < tripsPerSeason + 5; i++) {
    const dest = pick(destinations);
    const before = await coinsOf();
    if (before < dest.cost) break; // ran out of coins for this destination — fine, stop this sub-loop
    try {
      const r = await api.dispatchScout(dest.id);
      noNaN(r, `dispatchScout(${dest.id})#${i}`);
      dispatched++;
      const after = await coinsOf();
      if (after !== before - dest.cost) log(`dispatchScout(${dest.id})#${i} coin delta mismatch: before=${before} cost=${dest.cost} after=${after}`);
    } catch {
      // once at cap, every further dispatch must reject with NO coin change
      const after = await coinsOf();
      if (after !== before) log(`dispatchScout(${dest.id})#${i} over-cap rejection still changed coins: before=${before} after=${after}`);
      if (dispatched < tripsPerSeason) log(`dispatchScout(${dest.id})#${i} rejected before reaching tripsPerSeason=${tripsPerSeason} (only dispatched=${dispatched})`);
    }
  }
  if (dispatched > tripsPerSeason) log(`dispatchScout allowed ${dispatched} trips against a per-season cap of ${tripsPerSeason}`);
  console.log(`[qa-scout-kit] dispatchScout: dispatched=${dispatched} against cap=${tripsPerSeason} — cap respected exactly`);

  // insufficient-funds probe: drain to (near) zero via repeated dispatch, then attempt one more — must
  // throw with no partial deduction, regardless of destination cost.
  const { destinations: destsNow } = await api.missions();
  const cheapest = destsNow.reduce((a, b) => (a.cost < b.cost ? a : b));
  const before2 = await coinsOf();
  if (before2 < cheapest.cost) {
    let threw = false;
    try { await api.dispatchScout(cheapest.id); } catch { threw = true; }
    if (!threw) log(`dispatchScout(${cheapest.id}) with insufficient funds (have=${before2}, need=${cheapest.cost}) did not throw`);
    const after2 = await coinsOf();
    if (after2 !== before2) log(`dispatchScout(${cheapest.id}) insufficient-funds throw still changed coins: before=${before2} after=${after2}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 3. signMission — unknown id / still-travelling / empty-handed / double-sign / loanee-cap, all clean
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-scout-kit] signMission — unknown id, still-travelling, double-sign, loanee-cap enforcement...');
{
  await freshGame('QA SignMission FC');

  // unknown mission id -> 404, no mutation
  {
    const before = await coinsOf(), rosterBefore = await rosterSize();
    let threw = false;
    try { await api.signMission('not-a-real-mission-id'); } catch { threw = true; }
    if (!threw) log(`signMission('not-a-real-mission-id') did not throw`);
    if ((await coinsOf()) !== before || (await rosterSize()) !== rosterBefore) log(`signMission on unknown id mutated state`);
  }

  // still-travelling: dispatch then IMMEDIATELY sign (travelMins is always >= 60 -> ready_at is always
  // in the future relative to Date.now() at dispatch time) -> must throw 409, no mutation.
  {
    const { destinations } = await api.missions();
    const dest = pick(destinations);
    const before = await coinsOf();
    const r = await api.dispatchScout(dest.id);
    const rosterBefore = await rosterSize();
    let threw = false;
    try { await api.signMission(r.mission.id); } catch { threw = true; }
    if (!threw) log(`signMission on a still-travelling trip did not throw`);
    if ((await rosterSize()) !== rosterBefore) log(`signMission on a still-travelling trip mutated the roster`);
    void before;
  }

  console.log(`[qa-scout-kit] signMission: unknown-id + still-travelling guards clean, no state mutation on rejection`);

  // ── successful sign + double-sign + loanee-cap enforcement ──
  // Travel time is GAME-clock-gated (ready_at = matchesPlayed() + travelMatchdays(dest)); the
  // wall-clock version this line used to describe was replaced, and `travelMs` removed 2026-09-02; force it to "now" via
  // direct localStore access (white-box, test-only — mirrors how the in-memory backend is already
  // injected for headless testing) so the full sign/double-sign/cap path can be driven without a
  // real-time wait.
  {
    await freshGame('QA SignMission Success FC');
    let signedCount = 0, emptyHanded = 0, capRejections = 0;
    const CAP = (await api.missions()).loaneeCap;
    for (let i = 0; i < CAP + 4; i++) {
      const { destinations, tripsLeft } = await api.missions();
      if (tripsLeft <= 0) break;
      const dest = pick(destinations);
      if ((await coinsOf()) < dest.cost) break;
      const disp = await api.dispatchScout(dest.id);
      const m = await localStore.missionById(disp.mission.id);
      if (!m) { log(`missionById(${disp.mission.id}) returned undefined right after dispatch`); continue; }
      m.ready_at = 0; // force "arrived"
      const rosterBefore = await rosterSize();
      try {
        const r = await api.signMission(disp.mission.id);
        noNaN(r, `signMission success#${i}`);
        signedCount++;
        const rosterAfter = await rosterSize();
        if (rosterAfter !== rosterBefore + 1) log(`signMission success#${i} roster delta != 1: before=${rosterBefore} after=${rosterAfter}`);
        // double-sign must now be rejected, with no further roster mutation
        let threwDouble = false;
        try { await api.signMission(disp.mission.id); } catch { threwDouble = true; }
        if (!threwDouble) log(`double signMission(${disp.mission.id}) did not throw`);
        if ((await rosterSize()) !== rosterAfter) log(`double signMission(${disp.mission.id}) mutated the roster despite throwing`);
      } catch {
        // either genuinely empty-handed (m.found === 0) or loanee-cap reached — both are legitimate
        if (!m.found) emptyHanded++; else capRejections++;
        const rosterAfter = await rosterSize();
        if (rosterAfter !== rosterBefore) log(`signMission#${i} rejection still mutated roster: before=${rosterBefore} after=${rosterAfter}`);
      }
    }
    if (signedCount > CAP) log(`signMission allowed ${signedCount} successful signings against a loanee cap of ${CAP}`);
    console.log(`[qa-scout-kit] signMission: signed=${signedCount} emptyHanded=${emptyHanded} capRejections=${capRejections} (cap=${CAP}) — cap respected, double-sign rejected, roster deltas exact`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 4. saveKit — adversarial bodies never crash, always return a bounded/sanitized Kit
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-scout-kit] saveKit — adversarial kit bodies, unknown pid...');
{
  await freshGame('QA Kit FC');
  // saveKit takes a TOKEN id (the bloodline prospect), not an arbitrary club player id (main.ts calls it
  // with `s.prospectId`) — scout + sign a fresh prospect to get a valid token pid.
  const board0 = await api.scoutProspects(3);
  const signed0 = await api.signProspect(pick(board0.candidates).seed);
  const pid = signed0.prospect.id;
  if (!pid) log('QA Kit FC: signProspect did not return a token id to test saveKit against');
  const adversarialKits: any[] = [
    { number: -999, boots: '<script>alert(1)</script>', celebration: 'a'.repeat(500), nickname: '<b>x</b>', hairstyle: '', accessory: '' },
    { number: NaN, boots: null, celebration: undefined, nickname: 123 as any, hairstyle: {} as any, accessory: [] as any },
    { number: Infinity, boots: -Infinity as any, celebration: -1, nickname: '', hairstyle: 'buzz', accessory: 'none' },
    { number: 1e9, boots: 'x'.repeat(1000), celebration: '>'.repeat(50), nickname: '<>'.repeat(50), hairstyle: '<', accessory: '>' },
    {} as any,
    null as any,
    { number: 0.5, boots: 'boots', celebration: 'cel', nickname: 'nick', hairstyle: 'hair', accessory: 'acc' },
  ];
  if (pid) {
    for (let i = 0; i < adversarialKits.length; i++) {
      const before = await coinsOf();
      let r: any;
      try { r = await api.saveKit(pid, adversarialKits[i]); }
      catch (err) { log(`saveKit adversarial#${i} threw unexpectedly: ${(err as Error).message}`); continue; }
      noNaN(r, `saveKit adversarial#${i}`);
      const k = r.kit;
      if (!finite(k.number) || k.number < 1 || k.number > 99) log(`saveKit adversarial#${i} kit.number=${k.number} out of [1,99]`);
      for (const field of ['boots', 'celebration', 'nickname', 'hairstyle', 'accessory'] as const) {
        const v = k[field] as string;
        if (typeof v !== 'string') log(`saveKit adversarial#${i} kit.${field} is not a string: ${JSON.stringify(v)}`);
        else if (v.includes('<') || v.includes('>')) log(`saveKit adversarial#${i} kit.${field} still contains '<'/'>' after sanitization: "${v}"`);
      }
      if ((k.boots as string).length > 16) log(`saveKit adversarial#${i} kit.boots exceeds 16 chars: len=${(k.boots as string).length}`);
      if ((k.celebration as string).length > 24) log(`saveKit adversarial#${i} kit.celebration exceeds 24 chars: len=${(k.celebration as string).length}`);
      if ((k.nickname as string).length > 20) log(`saveKit adversarial#${i} kit.nickname exceeds 20 chars: len=${(k.nickname as string).length}`);
      const after = await coinsOf();
      if (after !== before) log(`saveKit adversarial#${i} unexpectedly changed coins: before=${before} after=${after}`);
    }
    console.log(`[qa-scout-kit] saveKit: ${adversarialKits.length} adversarial bodies — always bounded/sanitized, no crash, no coin change`);
  }

  // unknown pid -> throw
  let threwUnknown = false;
  try { await api.saveKit('not-a-real-pid', { number: 7, boots: 'x', celebration: 'y', nickname: 'z' } as any); } catch { threwUnknown = true; }
  if (!threwUnknown) log(`saveKit('not-a-real-pid', ...) did not throw`);
  console.log(`[qa-scout-kit] saveKit: unknown pid correctly rejected`);
}

if (failures.length) {
  console.error(`\n[qa-scout-kit] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-scout-kit] clean — no invariant violations found across the scouting-trip + kit-customization surface.');
