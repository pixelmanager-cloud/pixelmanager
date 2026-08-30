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

if (!process.exitCode) console.log('✓ migration repairs missing collections and leaves its input alone');
