// ── THE BACKEND THAT ACTUALLY SHIPS, EXERCISED FOR THE FIRST TIME ────────────────────────────────────
//
// `save.ts` reads the environment ONCE, at module scope:
//     const HAS_IDB = typeof indexedDB !== 'undefined';
//     const defaultBackend = HAS_IDB ? new IndexedDBBackend() : createInMemoryBackend();
// Under Node, `typeof indexedDB` is 'undefined', so `IndexedDBBackend` was never even CONSTRUCTED by any
// harness in the project — and two of the four save harnesses then layered
// `__setBackendForTests(createInMemoryBackend())` on top of that anyway. Breaking the shipped backend two
// ways at once — `list()` returning `[]`, and `load()` handing back the `{id, model}` storage wrapper
// instead of the save — left qa_savestore, qa_migrate, qa_offline_facade and qa_branch_switch ALL green.
// The thing holding the player's only copy of a twenty-hour dynasty was covered by nothing.
//
// THIS FILE MUST NEVER CALL setSaveBackend / __setBackendForTests. That is the entire point of it.
//
// TWO TRAPS, both measured, both of which defeat the obvious version of this harness:
//  1. With the fake imported AFTER save.ts, `typeof indexedDB` is STILL 'object' by the time the body
//     runs, and a hand-constructed `new IndexedDBBackend()` STILL works — only the module-level default
//     is already wrong. So asserting `typeof indexedDB !== 'undefined'`, or testing only directly
//     constructed instances, is silently fooled. The one observable that proves save.ts took the IDB
//     branch AT LOAD is `getSaveHealth()`, which is why that is assertion #1.
//  2. Equality here is a structural walk, NOT `JSON.stringify`. qa_savestore compares
//     `canon(loaded) === canon(model)` where `canon` is a sorted JSON.stringify and the in-memory
//     backend's own clone is `JSON.parse(JSON.stringify(v))` — it measures a JSON transform with a JSON
//     transform, so it cannot distinguish the two backends by construction. Structured clone KEEPS an
//     undefined-valued key; JSON drops it. The tested backend was the lossier one.
import 'fake-indexeddb/auto';                                   // MUST be first: save.ts reads `typeof indexedDB` at module scope
import {
  IndexedDBBackend, freshSave, getSaveHealth, listSaves, newGame, continueSave,
  deleteSave, flushSave, localStore, getActiveModel, type SaveModel,
} from './src/save.js';
import type { Token } from '@fm/shared';

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else { console.log(`  FAIL ${msg}`); failures++; }
}

/** Structural deep-equal. NOT JSON: compares key SETS (so an `undefined`-valued key present on one side
 *  and absent on the other is a difference), uses Object.is (NaN===NaN, +0!==-0), and reports a path. */
function structuralDiff(a: unknown, b: unknown, path = '$'): string | null {
  if (Object.is(a, b)) return null;
  if (typeof a !== typeof b) return `${path}: ${typeof a} vs ${typeof b}`;
  if (a === null || b === null) return `${path}: ${String(a)} vs ${String(b)}`;
  if (typeof a !== 'object') return `${path}: ${String(a)} vs ${String(b)}`;
  const aArr = Array.isArray(a), bArr = Array.isArray(b);
  if (aArr !== bArr) return `${path}: array vs non-array`;
  if (aArr && bArr) {
    if (a.length !== (b as unknown[]).length) return `${path}: length ${a.length} vs ${(b as unknown[]).length}`;
    for (let i = 0; i < a.length; i++) { const d = structuralDiff(a[i], (b as unknown[])[i], `${path}[${i}]`); if (d) return d; }
    return null;
  }
  const ka = Object.keys(a as object).sort(), kb = Object.keys(b as object).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return `${path}: keys [${ka}] vs [${kb}]`;
  for (const k of ka) { const d = structuralDiff((a as any)[k], (b as any)[k], `${path}.${k}`); if (d) return d; }
  return null;
}
function same(a: unknown, b: unknown, label: string): void {
  const d = structuralDiff(a, b);
  assert(d === null, d === null ? label : `${label} — first difference at ${d}`);
}

/** Read the raw IDB records, bypassing IndexedDBBackend entirely. */
function rawGet(store: string, id: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const o = indexedDB.open('fm-saves');   // no version: opens whatever DB_VERSION save.ts is on
    o.onsuccess = () => {
      const db = o.result;
      const r = db.transaction([store], 'readonly').objectStore(store).get(id);
      r.onsuccess = () => { const v = r.result; db.close(); resolve(v); };
      r.onerror = () => { db.close(); reject(r.error); };
    };
    o.onerror = () => reject(o.error);
  });
}

function populated(name: string): SaveModel {
  const m = freshSave(name, 4242);
  m.profile.coins = 777;
  m.tokens.push({
    id: 'nft:3', owner_id: 'local', generation: 2, state: 'pro', name: 'Rico Vance',
    genes_json: '{}', pedigree: 0.5, dev_bonus_json: '{}', career_seed: 9, agent_id: 'agent:mentor',
    track: 'outfield', career_actions: '[]', attrs_json: '{"pace":12}', role: 'FW',
    traits_json: '["flair"]', personality: 'maverick', greed: 6, marketability: 8, earnings: 4200,
    prime_season: 3, peak_overall: 15, signed_season: 3, length_seasons: 3, staked_since: 3,
    ach_seasons: 2, ach_apps: 60, ach_league: 1, ach_cup: 0, ach_promotions: 1, ach_tier: 2,
    morale: 70, ach_goals: 20, ach_assists: 5, ach_potm: 2, kit_json: '{"number":9}',
    parent_id: null, branch: 'played',
  } as unknown as Token);
  m.injuries.push({ playerId: 'p-1', matchesRemaining: 2 });
  m.honours.push({ season_number: 4, tier: 'Championship', final_pos: 1, title: 1, ended_at: 1234, coin_reward: 500, kind: 'league' } as any);
  m.retiredNumbers.push({ n: 9, name: 'The Legend' });
  return m;
}

console.log('=== A. the fake landed BEFORE save.ts read it ===');
assert(typeof indexedDB !== 'undefined', 'globalThis.indexedDB is defined');
// saveHealth starts {ok:true} ONLY when HAS_IDB was true at module-evaluation time. This is the whole
// point of the import order: if `fake-indexeddb/auto` ran after save.ts, this is false.
assert(getSaveHealth().ok === true, 'save.ts picked the IndexedDB backend at module load (saveHealth ok)');

console.log('=== B. IndexedDBBackend round-trip ===');
{
  const be = new IndexedDBBackend();
  const model = populated('Round Trip FC');
  await be.save('slot-1', model);
  const loaded = await be.load('slot-1');
  assert(loaded !== null && loaded !== undefined, 'load() returns something');
  assert(!!loaded && (loaded as any).model === undefined && typeof (loaded as any).profile === 'object',
    'load() returns the SaveModel itself, not the {id,model} storage wrapper');
  same(loaded, model, 'load() is structurally identical to what save() was given');

  const slots = await be.list();
  assert(slots.length === 1 && slots[0].id === 'slot-1' && slots[0].name === 'Round Trip FC', 'list() reports the saved slot');
  assert(!!slots[0] && typeof slots[0].lastPlayed === 'number' && slots[0].lastPlayed > 0, 'list() carries a lastPlayed timestamp');
  assert((await be.load('no-such-slot')) === null, 'load() of an unknown id is null');
}

console.log('=== C. on-disk record SHAPE (raw IDB, bypassing the backend) ===');
{
  const rec = await rawGet('models', 'slot-1');
  assert(!!rec && rec.id === 'slot-1' && !!rec.model && rec.model.profile.name === 'Round Trip FC',
    'models store holds {id, model} with the save under .model');
  const meta = await rawGet('meta', 'slot-1');
  assert(!!meta && meta.id === 'slot-1' && meta.name === 'Round Trip FC' && typeof meta.lastPlayed === 'number',
    'meta store holds {id, name, lastPlayed}');
}

console.log('=== D. DURABILITY: a SECOND backend instance sees the first one\'s writes ===');
{
  const fresh = new IndexedDBBackend();                    // its own dbp — reopens the database
  const seen = await fresh.list();
  assert(seen.some((s) => s.id === 'slot-1'), 'a new IndexedDBBackend lists a slot it never wrote');
  const loaded = await fresh.load('slot-1');
  assert(!!loaded && loaded.profile.coins === 777, 'a new IndexedDBBackend loads the other instance\'s save');
}

console.log('=== E. overwrite / multi-slot / remove ===');
{
  const be = new IndexedDBBackend();
  const m2 = populated('Second FC'); m2.profile.coins = 111;
  await be.save('slot-2', m2);
  const both = await be.list();
  assert(both.length === 2, `list() reports both slots (got ${both.length})`);
  assert(both.length === 2 && both[0].lastPlayed >= both[1].lastPlayed, 'list() is sorted newest-first');

  const m1b = populated('Round Trip FC'); m1b.profile.coins = 999;
  await be.save('slot-1', m1b);
  assert((await be.list()).length === 2, 'overwriting a slot does not add a second entry');
  assert((await new IndexedDBBackend().load('slot-1'))!.profile.coins === 999, 'overwrite is visible to a fresh instance');

  await be.remove('slot-1');
  const after = new IndexedDBBackend();
  assert((await after.load('slot-1')) === null, 'remove() drops the model record');
  assert(!(await after.list()).some((s) => s.id === 'slot-1'), 'remove() drops the meta record');
  assert((await after.list()).some((s) => s.id === 'slot-2'), 'remove() leaves the other slot alone');
  await be.remove('slot-2');
}

console.log('=== F. the module-level slot manager, on the REAL default backend ===');
{
  const id = await newGame('Dynasty FC', 4242, 'slot-live');
  assert((await new IndexedDBBackend().list()).some((s) => s.id === 'slot-live'), 'newGame() write reaches IndexedDB');
  assert((await listSaves()).some((s) => s.name === 'Dynasty FC'), 'listSaves() sees it through the default backend');

  await localStore.addCoins('local', 250);              // schedules a debounced write
  await flushSave();
  const onDisk = await new IndexedDBBackend().load(id);
  assert(!!onDisk && onDisk.profile.coins === getActiveModel().profile.coins,
    `flushSave() puts the mutation on disk (disk ${onDisk?.profile.coins} vs memory ${getActiveModel().profile.coins})`);

  await localStore.addCoins('local', 10);
  await new Promise((r) => setTimeout(r, 700));         // let the 500ms debounce fire on its own
  const debounced = await new IndexedDBBackend().load(id);
  assert(!!debounced && debounced.profile.coins === getActiveModel().profile.coins, 'the debounced autosave reaches disk unaided');

  const back = await continueSave(id);
  assert(back.profile.coins === getActiveModel().profile.coins, 'continueSave() reloads it');

  await deleteSave(id);
  assert(!(await new IndexedDBBackend().list()).some((s) => s.id === id), 'deleteSave() removes it from IndexedDB');
  assert((await new IndexedDBBackend().load(id)) === null, 'deleteSave() removes the model too');
}

console.log('=== G. continueSave() writes the migrated save BACK to disk ===');
{
  const be = new IndexedDBBackend();
  const old = populated('Legacy FC') as any;
  old.version = 1;
  delete old.tokens[0].branch; delete old.tokens[0].parent_id;
  await be.save('slot-v1', old);
  await continueSave('slot-v1');
  const upgraded = await new IndexedDBBackend().load('slot-v1');
  assert(!!upgraded && upgraded.version === 2, `the v1->v2 upgrade was persisted (on disk: v${upgraded?.version})`);
  assert(!!upgraded && (upgraded.tokens[0] as any).branch === 'played', 'the upgraded token shape is on disk');
  await deleteSave('slot-v1');
}

console.log(failures === 0 ? `\n✓ all IndexedDB backend checks passed` : `\n✗ ${failures} IndexedDB backend check(s) FAILED`);
if (failures > 0) process.exit(1);
