// v1 → v2: a pre-branching save must come back as a valid single-branch forest, not a row of orphan
// trunks. The Family Record reads parent_id directly, so a save that never got this migration would
// render every generation as its own tree.
import { migrate, SAVE_VERSION, freshSave } from './src/save.js';

// WHAT v1 ACTUALLY WROTE, and what may honestly be inferred from it.
//
// Pre-branching, `succeed()` REUSED the played line's token id and bumped its `generation` in place — so a
// real v1 save at generation 5 holds ONE token at generation 5, not five tokens at 0..4. The generational
// history lived in `legacies` (keyed `${id}:g<gen>`), never in tokens. The first version of this fixture
// supplied a 0/1/2 chain that v1 could not emit, so the migration was validated against a fiction.
//
// The migration therefore must NOT infer fatherhood from "one generation above": a founder line at gen 3
// beside an independent `api.genesis()` line at gen 2 would make two unrelated men father and son, and a
// family tree that asserts something untrue is worse than one that admits it does not know. The only
// relationship a v1 token id actually PROVES is a sibling's, because the id encodes the father.
const m: any = freshSave('Kestrel');
m.version = 1;
m.tokens = [
  { id: 'nft:1', name: 'Milo', generation: 3, state: 'pro' },        // the played line, id reused since gen 0
  { id: 'nft:2', name: 'A genesis prospect', generation: 2, state: 'prospect' }, // an unrelated purchase
  { id: 'nft:1:b3.1', name: 'Dane', generation: 3, state: 'prospect' },          // a brother — id proves the father
];
const out: any = migrate(m);
const fail = (msg: string) => { console.log('✗ ' + msg); process.exitCode = 1; };
const byId = (id: string) => out.tokens.find((t: any) => t.id === id);

if (out.version !== SAVE_VERSION) fail(`version not raised: ${out.version}`);
if (byId('nft:1').parent_id !== null) fail(`the played line is a root on a v1 save, got ${byId('nft:1').parent_id}`);
if (byId('nft:2').parent_id !== null) fail(`an unrelated genesis line must NOT be given a father, got ${byId('nft:2').parent_id}`);
if (byId('nft:1:b3.1').parent_id !== 'nft:1') fail(`a sibling's father is proven by his id, got ${byId('nft:1:b3.1').parent_id}`);
if (out.tokens.some((t: any) => t.branch !== 'played' && t.id !== 'nft:1:b3.1')) fail('pre-branching tokens default to played');

// idempotent — a second pass must change nothing
const again = JSON.stringify(migrate(out));
if (again !== JSON.stringify(out)) fail('migrate is not idempotent');

// A current save must pass through UNCHANGED — equivalent, not necessarily the same object. migrate now
// backfills missing collections before the version gate, because a save can be v2 and still be missing an
// array, so it returns a repaired copy either way. What matters is that it alters nothing.
const cur: any = freshSave('Ferreira');
if (JSON.stringify(migrate(cur)) !== JSON.stringify(cur)) fail('a current-version save was altered by migrate');

if (!process.exitCode) console.log('✓ save migration v1 → v2');

// A SAVE MISSING A COLLECTION MUST STILL LOAD. One absent array used to make a save permanently
// unloadable — migrate() itself threw on a missing `tokens`, and a missing `injuries`/`honours`/`legacies`
// threw later inside the facade. The player was told the save "may be corrupted" and had no way back.
for (const gone of ['tokens', 'injuries', 'honours', 'legacies', 'missions', 'loanees', 'awards', 'facilities']) {
  const broken: any = freshSave('Broken'); broken.version = 1; delete broken[gone];
  try {
    const fixed: any = migrate(broken);
    if (!Array.isArray(fixed.tokens)) fail(`missing ${gone}: tokens not repaired`);
    if (gone !== 'facilities' && !Array.isArray(fixed[gone])) fail(`missing ${gone}: not repaired`);
    if (gone === 'facilities' && typeof fixed.facilities?.medical !== 'number') fail('missing facilities: not repaired');
  } catch (e: any) { fail(`a save missing "${gone}" still throws: ${e?.message}`); }
}

// PURE, as the doc-comment claims — the caller's own objects must not change underneath it.
const orig: any = freshSave('Pure'); orig.version = 1;
orig.tokens = [{ id: 'z', name: 'Zed', generation: 0, state: 'pro' }];
const before = JSON.stringify(orig.tokens);
migrate(orig);
if (JSON.stringify(orig.tokens) !== before) fail('migrate mutated the caller\'s tokens');

// MALFORMED, NOT MERELY MISSING. `?? []` repairs an absent array and sails straight past one that is an
// object, a string or a number — after which migrate itself dies ("m.tokens is not iterable"). Each of
// these was a reproducible, permanently unloadable save with no repair path, which is exactly what the
// repair block above exists to prevent.
for (const [label, bad] of [
  ['tokens as an object', {}], ['tokens as a string', 'corrupt'], ['tokens as a number', 42],
  ['tokens with a null entry', [null]], ['tokens with junk entries', [null, undefined]],
] as Array<[string, unknown]>) {
  const raw: any = { ...freshSave('Bad'), version: 1, tokens: bad };
  try {
    const fixed = migrate(raw);
    if (!Array.isArray(fixed.tokens)) fail(`${label}: tokens is still not an array after migrate`);
    if (fixed.tokens.some((t: any) => t == null)) fail(`${label}: a null token survived migrate`);
  } catch (e: any) { fail(`${label}: migrate threw ${e?.message}`); }
}
// and the same for every other collection, since they share the one repair
for (const key of ['injuries', 'legacies', 'honours', 'awards', 'missions', 'loanees', 'retiredNumbers', 'playerStats']) {
  const raw: any = { ...freshSave('Bad2'), version: 1, [key]: 'not an array' };
  try {
    const fixed: any = migrate(raw);
    if (!Array.isArray(fixed[key])) fail(`${key} as a string: not repaired to an array`);
  } catch (e: any) { fail(`${key} as a string: migrate threw ${e?.message}`); }
}

// THE TEAM SHEET — the one thing in the model this repair used to skip. A save that lost `standingOrders`
// loaded with the field `undefined`, survived a season rollover still undefined (the reconciler
// early-returns it and `saveClub` re-persists it), and then `openLineup`'s `{ ...this.standingOrders.tactics }`
// threw a TypeError. Permanently — the club could never be managed again.
for (const [label, bad] of [
  ['missing', undefined],
  ['null', null],
  ['a string', 'not a sheet'],
  ['playerIds not an array', { formation: '4-4-2', playerIds: 'nope', tactics: {} }],
  ['an empty object', {}],
] as [string, unknown][]) {
  const raw: any = { ...freshSave('NoSheet'), version: 1, standingOrders: bad };
  try {
    const fixed: any = migrate(raw);
    const so = fixed.standingOrders;
    if (!so || !Array.isArray(so.playerIds) || so.playerIds.length !== 11) {
      fail(`standingOrders ${label}: not repaired to a usable sheet (got ${JSON.stringify(so)?.slice(0, 60)})`);
    } else if (!so.tactics || !so.formation) {
      fail(`standingOrders ${label}: repaired sheet has no formation/tactics`);
    } else if (new Set(so.playerIds).size !== 11) {
      fail(`standingOrders ${label}: repaired XI has a duplicate`);
    }
  } catch (e: any) { fail(`standingOrders ${label}: migrate threw ${e?.message}`); }
}
// ...and a GOOD sheet must be left exactly alone
{
  const good: any = freshSave('HasSheet');
  const before = JSON.stringify(good.standingOrders);
  const fixed: any = migrate({ ...good, version: 1 });
  if (JSON.stringify(fixed.standingOrders) !== before) fail('a valid team sheet was rewritten by the repair');
}

if (!process.exitCode) console.log('✓ migration repairs missing AND malformed collections, and leaves its input alone');
