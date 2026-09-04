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

// ── AND BOTH AT ONCE — the case neither repair above was ever crossed with ────────────────────────────
// Every standingOrders case above is built on a save with a full, healthy twenty-man squad, and there was
// no malformed `club.players` case at all. So the seam between the two repairs was invisible: the sheet
// fallback rebuilt the XI from `m.club`, the RAW parameter, not the club the line above it had just
// recovered. `autoPickXI` does `[...club.players]` and then `pool.find(…)!.id`, so every one of these
// combinations threw out of migrate itself — and `club` + `standingOrders` are the pair `saveClub` writes
// together, so a corrupt write damaging both is the LIKELY shape, not an exotic one. The player was told
// the dynasty "may be corrupted" about a save whose tokens, honours, legacies and coins had all been
// recovered two lines earlier, and `recoverOrphanedSaves` could not clear the row either — it has an index
// entry, so it is never treated as an orphan.
{
  const full: any = freshSave('Both', 11);   // seeded: a fixture that damages a squad must know what it damaged
  const squad: any[] = full.club.players;
  if (squad.length < 12) fail(`the cross fixture needs a real squad to damage, got ${squad.length}`);
  const clubs: Array<[string, any]> = [
    ['players as a record', { ...full.club, players: Object.fromEntries(squad.map((p, i) => [`p${i}`, p])) }],
    ['players array-like', { ...full.club, players: { ...squad, length: squad.length } }],
    ['players a string', { ...full.club, players: 'wrecked' }],
    ['players an empty array', { ...full.club, players: [] }],
    ['a five-man squad', { ...full.club, players: squad.slice(0, 5) }],
    // eleven bodies but ten men: autoPickXI keys `used` on the id, so it runs the pool dry on the eleventh
    // slot and throws. A length check alone does NOT cover this.
    ['eleven men, two of them the same', { ...full.club, players: [...squad.slice(0, 10), { ...squad[0] }] }],
    ['no club at all', undefined],
  ];
  const sheets: Array<[string, unknown]> = [
    ['missing', undefined], ['null', null], ['a string', 'not a sheet'], ['an empty object', {}],
  ];
  let rebuilt11 = 0;
  for (const [cl, club] of clubs) {
    for (const [sl, so] of sheets) {
      const raw: any = { ...freshSave('Both', 11), version: 1, club, standingOrders: so };
      if (sl === 'missing') delete raw.standingOrders;
      try {
        const out: any = migrate(raw);
        const ids = out.standingOrders?.playerIds;
        const have = new Set((Array.isArray(out.club?.players) ? out.club.players : []).map((p: any) => p.id));
        if (!Array.isArray(out.club?.players)) fail(`${cl} + sheet ${sl}: the squad was not repaired to an array`);
        else if (!Array.isArray(ids)) fail(`${cl} + sheet ${sl}: no usable playerIds (got ${JSON.stringify(out.standingOrders)?.slice(0, 60)})`);
        else if (new Set(ids).size !== ids.length) fail(`${cl} + sheet ${sl}: the rebuilt XI names the same man twice`);
        else if (ids.some((id: string) => !have.has(id))) fail(`${cl} + sheet ${sl}: the rebuilt XI names a man the repaired squad does not have`);
        else if (have.size >= 11 && ids.length !== 11) fail(`${cl} + sheet ${sl}: ${have.size} men survived but the XI is ${ids.length} long`);
        else if (ids.length === 11) rebuilt11++;
      } catch (e: any) { fail(`${cl} + sheet ${sl}: migrate threw ${e?.message}`); }
    }
  }
  // MUTATION GUARD. Every assertion above is satisfied by an empty XI, so a fallback that quietly stopped
  // picking anyone would pass all of them. Two of the seven damaged clubs still hold twenty whole men, so
  // eight of these combinations must come back with a full eleven or this block is measuring nothing.
  if (rebuilt11 < 8) fail(`only ${rebuilt11} of the damaged-club combinations rebuilt a full XI — the cross is asserting nothing`);
}


// ── A CORRUPT ROLE DESIGNATION MAY NOT SURVIVE THE LOAD ─────────────────────────────────────────────
// `parseRoles`' doc-comment opens "THIS IS ON THE LOAD PATH, so it must never throw" — and until now it
// was not on the load path at all. It and `rolesJson` were the serializers for the server's `so_roles`
// column, and the server went away in phase 4; since then `migrate` validated only that `playerIds` is an
// array, so a `captainIdx` of the wrong SHAPE — a string, an array, a null — loaded untouched and reached
// `buildXI`, where `lineup.captainIdx === i` silently never matches and the armband quietly vanishes.
// These assert the hardening now actually runs, and that a legitimate designation is left alone.
{
  const mk = (roles: any) => {
    const m: any = freshSave('Roles');
    m.standingOrders = { ...m.standingOrders, ...roles };
    return migrate({ ...m, version: SAVE_VERSION }) as any;
  };
  for (const [label, bad] of [
    ['a string captain', { captainIdx: '3' }],
    ['a null captain', { captainIdx: null }],
    ['an array captain', { captainIdx: [1, 2] }],
    ['a NaN captain', { captainIdx: NaN }],
    ['a string taker', { takers: { pen: 'x' } }],
    ['an array of takers', { takers: [1, 2, 3] }],
  ] as Array<[string, any]>) {
    const so = mk(bad).standingOrders;
    if (so.captainIdx != null && typeof so.captainIdx !== 'number') fail(`${label}: captainIdx survived as ${typeof so.captainIdx}`);
    if (so.captainIdx != null && !Number.isFinite(so.captainIdx)) fail(`${label}: a non-finite captainIdx survived`);
    if (so.takers != null && (typeof so.takers !== 'object' || Array.isArray(so.takers))) fail(`${label}: takers survived as a non-object`);
    for (const k of ['pen', 'fk', 'corner'] as const) {
      const v = so.takers?.[k];
      if (v != null && !Number.isFinite(v)) fail(`${label}: taker ${k} survived as ${typeof v}`);
    }
  }
  // ...and the honest case is untouched, because dropping a good designation would be silent loss —
  // exactly the failure the module was hardened against in the first place.
  const kept = mk({ captainIdx: 4, takers: { pen: 2, fk: 7, corner: 9 } }).standingOrders;
  if (kept.captainIdx !== 4) fail(`a valid captain was dropped (got ${kept.captainIdx})`);
  if (kept.takers?.pen !== 2 || kept.takers?.fk !== 7 || kept.takers?.corner !== 9) fail('valid set-piece takers were dropped');
}

if (!process.exitCode) console.log('✓ migration repairs missing AND malformed collections, and leaves its input alone');
