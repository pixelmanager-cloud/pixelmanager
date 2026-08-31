// WHAT THIS GUARDS: `so_roles` — the two bytes-on-disk functions for the armband and the three set-piece
// takers. `rolesJson` turns a team sheet's designations into the string a save row holds; `parseRoles`
// turns that string back into designations. Both landed on 26-27 August and neither had ever been
// imported by a test, a probe or a fuzz harness.
//
// WHY IT MATTERS: this is the save path. Section 18's list of nine ways to lose a dynasty has parse and
// round-trip failures on it more than once, and a team sheet that failed to load once made a club
// permanently unmanageable. A serializer that drops a designation, or a parser that throws on bytes it
// does not like, does not fail loudly at the point of damage — it fails at the next load, on a save the
// player cannot get back.
//
// WHAT IT ACTUALLY ASSERTS, and what it deliberately does NOT:
//   1-4  hard assertions on the guarantees the pair DOES keep: lossless round trip, byte-idempotence at
//        the second generation, captain slot 0 surviving (the classic falsy-index bug), the empty case
//        being a fresh empty object, the stored format being pinned to exact bytes, and — the one that
//        matters most against a corrupt row — that NO input, however hostile, can make `rolesJson` name
//        a slot the input did not name. Fabricated designations are worse than lost ones: a lost armband
//        is visible, an invented one silently re-persists as if the manager had chosen it.
//   5    a QUARANTINE REGISTRY of inputs that are known-broken TODAY. `parseRoles` is `s ? JSON.parse(s)
//        : {}` — no try/catch, no shape check — so a corrupt row throws, and a well-formed row holding
//        the wrong JSON type returns a number, a string, an array or `null` from a function whose
//        declared return type is an object. Those defects are REPORTED, not fixed here (this harness may
//        not touch shared/src), so the registry records the worst tolerated outcome per input and fails
//        the moment the blast radius WIDENS — a new input class that starts throwing is a regression and
//        is caught. The registry is deliberately one-directional: fixing a quarantined input still
//        passes, and prints a line telling you to delete the entry. It exists so the known damage is
//        enumerated and machine-checked rather than merely described in a comment.
//
// The registry is printed in full at the end under REPORTED DEFECTS. Read it before wiring either
// function into a store — today they have no call site at all, so every entry below is a landmine for
// whoever connects them, not a live bug.
import { parseRoles, rolesJson, type StandingOrders } from './src/standingOrders.js';
import { DEFAULT_TACTICS } from './src/tactics.js';

let fails = 0;
const check = (ok: boolean, msg: string, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}${detail ? `  (${detail})` : ''}`);
  if (!ok) fails++;
};
const fail = (msg: string) => { console.log(`  FAIL ${msg}`); fails++; };

type Roles = { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } };
const XI = Array.from({ length: 11 }, (_, i) => `p${i}`);
/** A full standing-orders record carrying the given designations. `rolesJson` reads only the two role
 *  fields, but it takes the whole sheet, so the whole sheet is what it gets — a partial would let a
 *  mutation that started reading `formation` or `playerIds` slip through unnoticed. */
const sheet = (roles: Roles): StandingOrders => ({ formation: '4-4-2', playerIds: [...XI], tactics: { ...DEFAULT_TACTICS }, ...roles });
/** The merge a caller performs on the way back in: parsed roles spread onto a sheet. This is the shape
 *  the repo actually uses (`{ ...so, ...roles }` in client/src/api.ts and main.ts), so it is the shape
 *  the corrupt-input checks below run through. */
const merge = (parsed: unknown): StandingOrders => ({ formation: '4-4-2', playerIds: [...XI], tactics: { ...DEFAULT_TACTICS }, ...(parsed as object) });

/** Which SLOTS a serialized roles blob actually names, read back independently of key order and of the
 *  producer's field order. Anything that is not a finite number names nobody. Comparing this set on the
 *  way in and on the way out is the test for fabrication: `rolesJson` may drop nothing and invent
 *  nothing. Deliberately NOT a deep-equal of the two JSON strings — that would also fire on formatting,
 *  which is checked separately and for a different reason. */
const slotsNamed = (raw: string | null | undefined): string => {
  if (raw == null) return '';
  let v: any;
  try { v = JSON.parse(raw); } catch { return ''; }
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return '';
  const out: string[] = [];
  if (typeof v.captainIdx === 'number' && Number.isFinite(v.captainIdx)) out.push(`cap:${v.captainIdx}`);
  const t = v.takers;
  if (t !== null && typeof t === 'object' && !Array.isArray(t)) {
    for (const k of ['pen', 'fk', 'corner'] as const) if (typeof t[k] === 'number' && Number.isFinite(t[k])) out.push(`${k}:${t[k]}`);
  }
  return out.sort().join('|');
};
const isPlainObject = (v: unknown): boolean =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

/** NOTHING in this file calls `parseRoles` bare. A throw on the save path is the failure this harness
 *  exists to detect, and an uncaught throw would end the run as a CRASH — a stack trace and a nonzero
 *  exit that looks exactly like a broken harness. This repo has been burned by that confusion before, so
 *  every parse goes through here and a throw becomes a recorded verdict with the rest of them. */
const safeParse = (s: string | null | undefined): { threw: false; value: Roles } | { threw: true; err: string } => {
  try { return { threw: false, value: parseRoles(s) as Roles }; }
  catch (e) { return { threw: true, err: (e as { message?: string })?.message ?? String(e) }; }
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('=== 1. the round trip is lossless, and stays lossless on the SECOND save ===');
{
  // Every designation shape the lineup editor can produce: no captain / captain in the first, a middle
  // and the last slot, crossed with no takers / one taker at each end / a full set / a partial set.
  // Seeded by enumeration rather than by a generator — 24 cases is the whole space worth having.
  const CAPTAINS: Array<number | undefined> = [undefined, 0, 5, 10];
  const TAKERS: Array<Roles['takers']> = [
    undefined,
    { pen: 0 },
    { fk: 10 },
    { corner: 5 },
    { pen: 9, fk: 6, corner: 2 },
    { pen: 3, corner: 7 },
  ];
  let n = 0;
  for (const captainIdx of CAPTAINS) for (const takers of TAKERS) {
    n++;
    const label = `cap=${captainIdx ?? '-'} takers=${takers ? JSON.stringify(takers) : '-'}`;
    const so = sheet({ ...(captainIdx != null ? { captainIdx } : {}), ...(takers ? { takers } : {}) });
    const stored = rolesJson(so);

    // (a) something designated must produce bytes; nothing designated must produce null. Stated from the
    //     INTENT of the column, not by re-deriving `rolesJson`'s own condition from a copy of it.
    const anyDesignation = captainIdx != null || (takers != null && (takers.pen != null || takers.fk != null || takers.corner != null));
    if (anyDesignation && stored === null) fail(`${label}: a designated sheet stored NOTHING`);
    if (!anyDesignation && stored !== null) fail(`${label}: an undesignated sheet stored ${stored}`);

    // (b) the trip back must recover exactly what went in, and nothing else.
    const r = safeParse(stored);
    if (r.threw) { fail(`${label}: parseRoles THREW on bytes rolesJson itself wrote — ${r.err}`); continue; }
    const back = r.value;
    if (!isPlainObject(back)) { fail(`${label}: parseRoles returned ${Object.prototype.toString.call(back)}`); continue; }
    if (back.captainIdx !== captainIdx) fail(`${label}: captain came back as ${String(back.captainIdx)}`);
    for (const k of ['pen', 'fk', 'corner'] as const) {
      if (back.takers?.[k] !== takers?.[k]) fail(`${label}: ${k} taker came back as ${String(back.takers?.[k])}`);
    }

    // (c) SECOND GENERATION. A save is written, read and written again every time the player opens the
    //     lineup editor and saves. If gen-2 bytes differ from gen-1, the value is drifting on every
    //     save — the slowest and least visible way to lose a team sheet.
    const gen2 = rolesJson(merge(back));
    if (gen2 !== stored) fail(`${label}: re-saving changed the bytes  ${stored} -> ${gen2}`);
  }
  check(true, `${n} designation shapes round-tripped`, 'losslessly, and identically on the second save');

  // Called out on its own because it is the specific bug this shape of code always has: slot 0 is a
  // legitimate captain (the keeper) and it is falsy. `so.captainIdx != null` is the only thing standing
  // between the keeper's armband and oblivion.
  const cap0 = safeParse(rolesJson(sheet({ captainIdx: 0 })));
  check(rolesJson(sheet({ captainIdx: 0 })) === '{"captainIdx":0}', 'the captain in SLOT 0 is stored, not treated as no captain');
  check(!cap0.threw && cap0.value.captainIdx === 0, '...and comes back as slot 0', cap0.threw ? cap0.err : JSON.stringify(cap0.value));
  check(rolesJson(sheet({ takers: { pen: 0 } })) === '{"takers":{"pen":0}}', 'the penalty taker in SLOT 0 is stored too');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n=== 2. the empty case is an empty sheet — not a shared one, and not a null ===');
{
  for (const [label, input] of [['null', null], ['undefined', undefined], ['empty string', '']] as const) {
    const res = safeParse(input);
    if (res.threw) { fail(`parseRoles(${label}) THREW — ${res.err}`); continue; }
    const r = res.value;
    check(isPlainObject(r), `parseRoles(${label}) returns a plain object`, Object.prototype.toString.call(r));
    check(isPlainObject(r) && Object.keys(r as object).length === 0, `parseRoles(${label}) fabricates no designations`, JSON.stringify(r));
    check(rolesJson(merge(r)) === null, `...and an empty sheet stores null again (fixed point)`);
  }
  // A shared empty singleton would be a live grenade: the caller spreads it, but anything that WROTE to
  // it would poison every later load in the session. Two calls must not hand back the same object.
  const a = safeParse(null), b = safeParse(null);
  if (a.threw || b.threw) fail('parseRoles(null) THREW — the empty case is not survivable');
  else {
    check(a.value !== b.value, 'two empty parses return two different objects');
    (a.value as Record<string, unknown>).captainIdx = 7;
    const c = safeParse(null);
    check(!c.threw && c.value.captainIdx === undefined, 'writing to one empty result does not leak into the next');
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n=== 3. the stored FORMAT is pinned ===');
{
  // These bytes are a persistence format. Every save already on a player's disk was written by the
  // current shape of `JSON.stringify`, so changing the field order or the nesting silently orphans them:
  // old rows still parse, they just stop comparing equal to anything the new code writes. Pinning the
  // exact string is the only check that notices.
  check(rolesJson(sheet({ captainIdx: 4, takers: { pen: 9, fk: 6, corner: 2 } })) === '{"captainIdx":4,"takers":{"pen":9,"fk":6,"corner":2}}', 'a full designation serializes to the exact expected bytes');
  check(rolesJson(sheet({ captainIdx: 3 })) === '{"captainIdx":3}', 'a lone captain stores only the captain — no null takers key');
  check(rolesJson(sheet({ takers: { fk: 8 } })) === '{"takers":{"fk":8}}', 'a lone taker stores only the takers — no null captain key');
  check(rolesJson(sheet({})) === null, 'a sheet with no designations stores null, not "{}"');

  // Determinism, and independence from the order the CALLER happened to build the sheet in. Two sheets
  // that are equal must serialize equal, or every `stored === previous` dirty-check downstream is
  // reading noise.
  const t = { pen: 1, fk: 2, corner: 3 };
  const s1: StandingOrders = { formation: '4-4-2', playerIds: [...XI], tactics: { ...DEFAULT_TACTICS }, captainIdx: 6, takers: { ...t } };
  const s2: StandingOrders = { takers: { ...t }, captainIdx: 6, tactics: { ...DEFAULT_TACTICS }, playerIds: [...XI], formation: '4-4-2' };
  check(rolesJson(s1) === rolesJson(s2), 'sheet field order does not change the stored bytes', `${rolesJson(s1)} vs ${rolesJson(s2)}`);
  check(rolesJson(s1) === rolesJson(s1), 'the same sheet serializes identically twice');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n=== 4. a corrupt row may not FABRICATE a designation ===');
// The rule: whatever comes out of a hostile string, once merged into a sheet and re-serialized, may name
// exactly the slots the input named — no more, no fewer. Inventing a captain is the dangerous direction:
// it re-persists on the next save and the manager never chose it.
const CORRUPT: Array<{ label: string; input: string | null | undefined; worst?: 'nonobj' | 'throw'; why?: string }> = [
  { label: 'a real record', input: '{"captainIdx":7,"takers":{"corner":2}}' },
  // The three ways a column legitimately says "nothing designated". These MUST stay in the 'ok' class:
  // they are the commonest values in the store, and the difference between `s ?` and `s != null ?` is
  // enough to make the empty column throw on every load.
  { label: 'an absent column (null)', input: null },
  { label: 'an absent column (undefined)', input: undefined },
  { label: 'an empty column', input: '' },
  { label: 'an empty record', input: '{}' },
  { label: 'a record of unknown keys only', input: '{"zzz":1,"schemaVersion":4}' },
  { label: 'a real record plus unknown keys', input: '{"captainIdx":7,"zzz":{"a":[1,2]},"takers":{"pen":3,"nope":9}}' },
  { label: 'deeply nested junk', input: '{"a":{"b":{"c":[1,{"d":[[[2]]]}]}}}' },
  { label: 'a __proto__ payload', input: '{"__proto__":{"captainIdx":9}}' },
  { label: 'a __proto__ payload beside a real captain', input: '{"captainIdx":1,"__proto__":{"captainIdx":9}}' },
  { label: 'right keys, wrong value types', input: '{"captainIdx":"three","takers":"nope"}' },
  { label: 'takers as an array', input: '{"takers":[]}' },
  { label: 'takers as null', input: '{"takers":null}' },
  { label: 'a fractional captain index', input: '{"captainIdx":3.5}' },
  { label: 'a huge captain index', input: '{"captainIdx":999999}' },
  // ── the quarantine: wrong JSON TYPE, returned verbatim from a function declared to return an object ──
  { label: 'the string "null"', input: 'null', worst: 'nonobj', why: 'returns null; every caller doing parseRoles(x).captainIdx gets a TypeError' },
  { label: 'a bare number', input: '123', worst: 'nonobj', why: 'returns the number 123' },
  { label: 'a bare zero', input: '0', worst: 'nonobj', why: 'returns the number 0' },
  { label: 'a bare boolean', input: 'false', worst: 'nonobj', why: 'returns false' },
  { label: 'a JSON string', input: '"hello"', worst: 'nonobj', why: 'returns a string; spreading it writes character indices onto the sheet' },
  { label: 'a JSON string of a JSON object', input: '"{\\"captainIdx\\":1}"', worst: 'nonobj', why: 'double-encoded row returns a string, and the captain inside it is lost' },
  { label: 'an array where an object belongs', input: '[1,2,3]', worst: 'nonobj', why: 'returns an array; spreading it writes numeric keys onto the sheet' },
  { label: 'an array of records', input: '[{"captainIdx":1}]', worst: 'nonobj', why: 'returns an array' },
  // ── the quarantine: THROWS. A throw here is the failure mode that makes a club unmanageable ──────────
  { label: 'the string "undefined"', input: 'undefined', worst: 'throw', why: 'SyntaxError' },
  { label: 'whitespace only', input: '   ', worst: 'throw', why: 'SyntaxError — a blank-but-not-empty column kills the load' },
  { label: 'a truncated write', input: '{"captainIdx":', worst: 'throw', why: 'SyntaxError — exactly what a half-flushed save row looks like' },
  { label: 'unquoted keys', input: '{captainIdx:1}', worst: 'throw', why: 'SyntaxError' },
  { label: 'single-quoted JSON', input: "{'captainIdx':1}", worst: 'throw', why: 'SyntaxError' },
  { label: 'trailing garbage after a valid record', input: '{"captainIdx":1}xx', worst: 'throw', why: 'SyntaxError — and the captain in front of the garbage is recoverable but lost' },
  { label: 'a bare NaN literal', input: 'NaN', worst: 'throw', why: 'SyntaxError' },
  { label: 'a lone control byte', input: '\u0001', worst: 'throw', why: 'SyntaxError — a corrupted byte in the column takes the whole load down' },
];
{
  const RANK = { ok: 0, nonobj: 1, throw: 2 } as const;
  const fixed: string[] = [];
  const seen = new Set<string>();
  for (const c of CORRUPT) {
    if (seen.has(c.label)) fail(`duplicate registry label "${c.label}" — one entry is shadowing another`);
    seen.add(c.label);

    let grade: 'ok' | 'nonobj' | 'throw';
    let parsed: unknown;
    try {
      parsed = parseRoles(c.input);
      grade = isPlainObject(parsed) ? 'ok' : 'nonobj';
    } catch { grade = 'throw'; parsed = undefined; }

    const allowed = c.worst ?? 'ok';
    if (RANK[grade] > RANK[allowed]) {
      fail(`${c.label}: parseRoles(${JSON.stringify(c.input)}) now ${grade === 'throw' ? 'THROWS' : 'returns a non-object'} — the blast radius on the save path has WIDENED (was tolerated at "${allowed}")`);
      continue;
    }
    if (RANK[grade] < RANK[allowed]) fixed.push(c.label);

    // The fabrication rule, applied to whatever came back — including the values the quarantine
    // tolerates, because those get merged into a sheet exactly like a good one would.
    if (grade !== 'throw') {
      const stored = rolesJson(merge(parsed));
      const inSlots = slotsNamed(typeof c.input === 'string' ? c.input : null);
      const outSlots = slotsNamed(stored);
      if (outSlots !== inSlots) {
        fail(`${c.label}: stored designations do not match the input — in [${inSlots}] out [${outSlots}] from ${stored}`);
      }
    }
  }
  check(true, `${CORRUPT.length} hostile inputs run through parse -> merge -> serialize`, 'no invented and no dropped slot');

  // The one global thing a JSON payload can reach. `{ ...parsed }` is safe by spec (it creates an own
  // property); `Object.assign` is NOT, which is why the merge above is a spread and why this is checked
  // rather than assumed.
  check((Object.prototype as Record<string, unknown>).captainIdx === undefined, 'no gauntlet input polluted Object.prototype with a captain');
  check((Object.prototype as Record<string, unknown>).takers === undefined, 'no gauntlet input polluted Object.prototype with takers');
  check(({} as Roles).captainIdx === undefined, 'a fresh object still has no inherited designations');

  if (fixed.length) {
    console.log(`\n  NOTE: ${fixed.length} quarantined input(s) now behave correctly — delete their registry entries:`);
    for (const f of fixed) console.log(`    - ${f}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n=== 5. REPORTED DEFECTS (measured here, fixed nowhere — this harness may not edit src) ===');
{
  const quarantined = CORRUPT.filter((c) => c.worst);
  console.log(`  parseRoles is "s ? JSON.parse(s) : {}" — no try/catch and no shape check. ${quarantined.length} of the`);
  console.log(`  ${CORRUPT.length} inputs above are known-broken and are tolerated by the registry in section 4:`);
  for (const c of quarantined) console.log(`    [${c.worst!.toUpperCase().padEnd(6)}] ${c.label.padEnd(38)} ${c.why ?? ''}`);
  console.log('  Compare client/src/api.ts:175 parseActions(), which does the same job correctly in this same');
  console.log('  repo: try/catch, an Array.isArray shape check, and null (not {}) to mean "unreadable".');

  // Two more that are not input-shaped, measured rather than asserted, for the same reason.
  const oa = rolesJson(Object.assign({ formation: '4-4-2', playerIds: [...XI], tactics: { ...DEFAULT_TACTICS } } as StandingOrders, parseRoles('{"__proto__":{"captainIdx":9}}')));
  console.log(`\n  [SMUGGLE] parseRoles keeps a "__proto__" key as an own property. A caller that merges with`);
  console.log(`            Object.assign instead of a spread gets a captain out of thin air: rolesJson -> ${oa}`);

  const orderA = rolesJson(sheet({ takers: { pen: 1, fk: 2, corner: 3 } }));
  const orderB = rolesJson(sheet({ takers: { corner: 3, pen: 1, fk: 2 } }));
  console.log(`  [UNSTABLE] rolesJson pins its own two fields but passes so.takers straight to JSON.stringify,`);
  console.log(`            so takers key order is the caller's. Two equal sheets, two different rows:`);
  console.log(`              ${orderA}`);
  console.log(`              ${orderB}`);
  console.log(`            client/src/main.ts:4508 builds draftTakers in CLICK order, so this is reachable.`);

  const emptyTakers = rolesJson(sheet({ takers: {} }));
  console.log(`  [UNSTABLE] a sheet whose takers were all cleared stores ${emptyTakers}, while a sheet that never`);
  console.log(`            had takers stores null — same meaning, different bytes.`);

  const nan1 = rolesJson(sheet({ captainIdx: NaN }));
  const nan2 = rolesJson(merge(parseRoles(nan1)));
  console.log(`  [DRIFT]   a non-finite captainIdx serializes to ${nan1} (a null in a number field), which`);
  console.log(`            parseRoles hands back as captainIdx: null, and the NEXT save writes ${nan2}.`);
}

console.log(fails
  ? `\n✗ ${fails} standing-orders check(s) failed`
  : '\n✓ the roles column round-trips losslessly and invents nothing — see REPORTED DEFECTS above for what it still cannot survive');
if (fails) process.exit(1);
