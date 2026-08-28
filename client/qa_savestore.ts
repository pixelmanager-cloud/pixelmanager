// Standalone QA harness for the phase 2 local SaveStore (docs/offline-savestore-design.md).
// Run: `npx tsx client/qa_savestore.ts`. No IndexedDB under tsx/node — LocalStore is tested against
// `createInMemoryBackend()`. Reaches into shared/src/career.ts by relative path (Career/TOTAL_TURNS/
// rollGenes aren't part of @fm/shared's public index — only tokens.ts's wrappers are) since this is a
// dev-only script, not part of the shipped client bundle.
import { LocalStore, freshSave, createInMemoryBackend, type SaveModel } from './src/save.js';
import { applyAction, loadCareer, graduatedFields, rebornFields, type CareerAction, type Token } from '@fm/shared';
import { Career, TOTAL_TURNS, rollGenes } from '../shared/src/career.js';

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else { console.log(`  FAIL ${msg}`); failures++; }
}
/** Deep-equal via a canonical (sorted-key) JSON string — order-independent "byte-identical" check. */
function canon(v: unknown): string {
  const sort = (x: any): any => {
    if (Array.isArray(x)) return x.map(sort);
    if (x && typeof x === 'object') return Object.keys(x).sort().reduce((o, k) => { o[k] = sort(x[k]); return o; }, {} as any);
    return x;
  };
  return JSON.stringify(sort(v));
}
function roundTripsCleanly(v: unknown, label: string): void {
  const again = JSON.parse(JSON.stringify(v));
  assert(canon(v) === canon(again), `${label} survives JSON.stringify -> JSON.parse byte-identical`);
}

console.log('=== 1. createToken -> updateToken -> getToken ===');
{
  const model = freshSave('Test FC');
  const box = { model };
  const store = new LocalStore(box, () => {});
  await store.createToken({ id: 'nft:1', owner_id: 'local', generation: 0, state: 'prospect', name: 'Leo Marsh', genes_json: JSON.stringify(rollGenes(1)), pedigree: 0, dev_bonus_json: '{}' });
  const created = await store.getToken('nft:1');
  assert(!!created && created.name === 'Leo Marsh' && created.state === 'prospect', 'getToken reflects createToken');
  await store.updateToken('nft:1', { pedigree: 0.7, role: 'MF' });
  const updated = await store.getToken('nft:1');
  assert(updated?.pedigree === 0.7 && updated?.role === 'MF', 'getToken reflects updateToken');
  assert(box.model.tokens.length === 1, 'the token lives in the SaveModel (not a side collection)');
}

console.log('=== 2. addCoins / getCoins ===');
{
  const model = freshSave('Test FC');
  const box = { model };
  const store = new LocalStore(box, () => {});
  const start = await store.getCoins('local');
  await store.addCoins('local', 250);
  await store.addCoins('local', -40);
  const end = await store.getCoins('local');
  assert(end === start + 210, `coins updated correctly (${start} -> ${end})`);
}

console.log('=== 3. full token lifecycle: prospect -> pro -> retired -> reborn ===');
{
  const model = freshSave('Bloodline FC');
  const box = { model };
  const store = new LocalStore(box, () => {});
  const id = 'nft:2';
  const seed = 12345;
  await store.createToken({ id, owner_id: 'local', generation: 0, state: 'prospect', name: 'Sam Oakes', genes_json: JSON.stringify(rollGenes(seed)), pedigree: 0.4, dev_bonus_json: '{}' });
  await store.startProspectCareer(id, seed, null, 'outfield');
  let token = (await store.getToken(id))!;
  roundTripsCleanly(token, 'prospect-state token');

  // drive the career to completion via applyAction (the same path Phase 3's play loop uses), recording
  // actions exactly as career_actions is meant to hold them.
  const career = loadCareer(token);
  const actions: CareerAction[] = [];
  let guard = 0;
  while (!career.finished && guard++ < TOTAL_TURNS * 4) {
    const st = career.current() as any;
    let a: CareerAction;
    if (st.phase === 'focus') a = { type: 'focus', cardId: st.focus[0].id };
    else if (st.phase === 'offer') a = { type: 'offer', cardId: st.offers[0].id };
    else if (st.phase === 'coach') a = { type: 'coach', cardId: st.coaches[0].id };
    else if (st.phase === 'draft') a = { type: 'draft', cardId: st.options[0].id };
    else if (st.phase === 'arc') a = { type: 'arc', cardId: st.arc.choices[0].id };
    else a = { type: 'play', cardId: st.hand[0].id };
    applyAction(career, a, true);
    actions.push(a);
  }
  assert(career.finished, `career completed within the turn budget (${actions.length} actions)`);
  await store.saveProspectActions(id, JSON.stringify(actions));
  token = (await store.getToken(id))!;

  // graduate: prospect -> pro (same id, new attrs)
  const grad = graduatedFields(token, career);
  await store.updateToken(id, grad);
  token = (await store.getToken(id))!;
  assert(token.state === 'pro' && !!token.attrs_json, 'graduatedFields flips state to pro with derived attrs');
  roundTripsCleanly(token, 'pro-state token');

  // a season of achievements, so reborn's legacyBoost has something to chew on
  await store.recordPlayerSeason(id, { league: 1, cup: 0, promotion: 0, tierIdx: 2 });
  await store.addApps(id, 34);
  token = (await store.getToken(id))!;
  assert(token.ach_seasons === 1 && token.ach_league === 1 && token.ach_apps === 34, 'achievements accumulate on the token');

  // retire: pro -> retired
  await store.retirePlayer(id);
  token = (await store.getToken(id))!;
  assert(token.state === 'retired', 'retirePlayer flips state to retired');
  roundTripsCleanly(token, 'retired-state token');

  // reborn: retired -> a fresh prospect of the NEXT generation, SAME id
  const reborn = rebornFields(token);
  await store.updateToken(id, reborn);
  token = (await store.getToken(id))!;
  assert(token.state === 'prospect' && token.generation === 1, 'rebornFields flips state back to prospect, generation+1');
  assert(token.id === id, 'reborn keeps the SAME token id (fixed-supply — never minted anew)');
  assert(token.career_seed === null && token.ach_seasons === 0, 'reborn clears pro/career/achievement state for the new generation');
  roundTripsCleanly(token, 'reborn (generation 1 prospect) token');
}

console.log('=== 4. SaveModel serialize/deserialize is lossless ===');
{
  const model: SaveModel = freshSave('Round Trip FC');
  model.profile.coins = 777;
  model.tokens.push({
    id: 'nft:3', owner_id: 'local', generation: 2, state: 'pro', name: 'Rico Vance',
    genes_json: JSON.stringify(rollGenes(9)), pedigree: 0.5, dev_bonus_json: '{}',
    career_seed: 9, agent_id: 'agent:mentor', track: 'outfield', career_actions: '[]',
    attrs_json: '{"pace":12}', role: 'FW', traits_json: '["flair"]', personality: 'maverick',
    greed: 6, marketability: 8, earnings: 4200, prime_season: 3, peak_overall: 15,
    signed_season: 3, length_seasons: 3, staked_since: 3,
    ach_seasons: 2, ach_apps: 60, ach_league: 1, ach_cup: 0, ach_promotions: 1, ach_tier: 2, morale: 70,
    ach_goals: 20, ach_assists: 5, ach_potm: 2, kit_json: '{"number":9}',
  } as Token);
  model.injuries.push({ playerId: 'p-1', matchesRemaining: 2 });
  model.legacies.push({ playerId: 'nft:legend', name: 'The Legend', cardJson: '{"tier":"icon"}', retiredSeason: 5, rebornId: null });
  model.honours.push({ season_number: 4, tier: 'Championship', final_pos: 1, title: 1, ended_at: 1234, coin_reward: 500, kind: 'league' });
  model.awards.push({ season_id: '4', season_number: 4, tier: 'Championship', pod: 1, kind: 'golden_boot', account_id: 'local', player_id: 'nft:3', player_name: 'Rico Vance', value: 20, awarded_at: 1234 });
  model.missions.push({ id: 'm-1', account_id: 'local', season_id: '4', destination: 'Riverside', dispatched_at: 100, ready_at: 200, found: 1, player_json: '{"name":"Kid"}', band: 'A', status: 'travelling' });
  model.loanees.push({ seasonId: '4', playerId: 'p-2' });
  model.retiredNumbers.push({ n: 9, name: 'The Legend' });
  model.playerStats.push({ season_id: '4', account_id: 'local', player_id: 'nft:3', player_name: 'Rico Vance', goals: 20, assists: 5, apps: 34, potm: 2 });

  roundTripsCleanly(model, 'a fully-populated SaveModel');

  // also prove it survives round-tripping through a backend (the real persistence path)
  const backend = createInMemoryBackend();
  await backend.save('slot-1', model);
  const loaded = await backend.load('slot-1');
  assert(!!loaded && canon(loaded) === canon(model), 'SaveBackend save -> load is lossless');
  const slots = await backend.list();
  assert(slots.length === 1 && slots[0].id === 'slot-1' && slots[0].name === 'Round Trip FC', 'SaveBackend.list() reports the slot');
  await backend.remove('slot-1');
  assert((await backend.list()).length === 0, 'SaveBackend.remove() drops the slot');
}

console.log(failures === 0 ? `\n✓ all savestore checks passed` : `\n✗ ${failures} savestore check(s) FAILED`);
if (failures > 0) process.exit(1);
