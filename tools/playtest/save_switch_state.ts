// ── ONE DYNASTY'S CACHED SCREEN MUST NOT OPEN INSIDE ANOTHER DYNASTY'S SAVE ─────────────────────────
//
// `pendingSquadReport`, `seasonLeaders` and `facLoaded` are fields on the single `GAME = new Game()` that
// lives for the whole page session, but every one of them holds data belonging to ONE save. Nothing on the
// save-entry paths cleared them, so switching saves carried the previous dynasty's screen into the new one:
//
//   - save A's rollover report rendered on save B's season screen — another family's players, carrying A's
//     `data-renew` buttons — and loadMgr's rehydrate (`&& !this.pendingSquadReport`) then refused to load
//     B's own report, because a report was already "pending". B's own expiring deals were never shown.
//   - pressing that report's ✕ in B ran `wipe()`, which writes `squadReport: null` through `saveMgr()`,
//     i.e. into B's `fm_mgr_` key. The confirm it raises first names A's players, so the player forfeits
//     B's renewals while reading A's names — the exact loss that confirm was written to prevent.
//   - `seasonLeaders` is refetched only `if (this.seasonLeaders == null)`, so B's SEASON LEADERS table was
//     A's until a rollover, and a carried-over `facLoaded` left `if (this.facLoaded) this.maybeOfferArc()`
//     true on B's first season screen, offering against A's facility levels before B's fetch landed.
//
// WHY THE FLOOR IS NAMED AND NOT DISCOVERED. The obvious generalisation — "every field read under a
// `== null` / `!this.x` refetch guard must be reset" — also sweeps in `spFixture`, `pendingCont`,
// `pendingWc` and `feedMeasured`, which are per-MATCH state that showSeason and the match flow already
// clear; a probe built on it would demand changes that are not this defect. So the three fields are named.
// What is NOT named is the reset's contents: whatever `resetPerSaveState()` assigns is discovered from its
// body and then EXECUTED against a `this` seeded with the previous save's values, so a reset that has
// quietly become a no-op — or that clears three of four — cannot sit green here.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - empty resetPerSaveState()'s body                     -> every field's restore check FAILs
//   - drop `this.seasonLeaders = null;` from it            -> that field FAILs, the others stay green
//   - move the call in loadSave() below `setToken(...)`    -> the ordering check FAILs
//   - delete the call from startNewGame()                  -> that call-site check FAILs
//   - rename the field to `pendingSquadReportX`            -> the declaration scan FAILs (not a silent pass)
//   - drop `&& !this.pendingSquadReport` from loadMgr      -> the "what the staleness costs" check FAILs
//
// Run: `npx tsx tools/playtest/save_switch_state.ts`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync(fileURLToPath(new URL('../../client/src/main.ts', import.meta.url)), 'utf8');

/** [start, end) of the balanced `{...}` block that opens at the first `{` at or after `from`. */
function block(text: string, from: number): [number, number] {
  const open = text.indexOf('{', from);
  let depth = 0;
  for (let j = open; j < text.length; j++) {
    if (text[j] === '{') depth++;
    else if (text[j] === '}') { depth--; if (depth === 0) return [open, j + 1]; }
  }
  return [open, text.length];
}
/** The value a field is DECLARED with, read off the class rather than written down here. */
const declInit = (name: string): string | null => {
  const m = src.match(new RegExp(`^  (?:private )?${name}(?![A-Za-z0-9_])[^=\\n]*?= ([^;\\n]+);`, 'm'));
  return m ? m[1].trim() : null;
};

console.log('=== Opening a save starts from that save\'s own data ===');

// The premise. One Game for the whole page session is why these fields have to be dropped by hand.
const instances = [...src.matchAll(/new Game\(\)/g)].length;
console.log(`  ..   \`new Game()\` appears ${instances}x — its fields outlive every save the session opens`);
ok(instances === 1, 'there is exactly one Game instance per page session');

// ── 1. THE RESET EXISTS, AND ACTUALLY RESETS ──────────────────────────────────────────────────────
const FLOOR = ['pendingSquadReport', 'seasonLeaders', 'facLoaded'];
const resetAt = src.indexOf('private resetPerSaveState()');
ok(resetAt !== -1, 'Game has a resetPerSaveState() — one place that drops the previous save\'s cached screens');
const body = resetAt === -1 ? '' : (([a, b]) => src.slice(a + 1, b - 1))(block(src, resetAt));
console.log(`  ..   reset body: \`${body.replace(/\s+/g, ' ').trim() || '(not found)'}\``);

const assigned = [...new Set([...body.matchAll(/this\.([A-Za-z0-9_]+)\s*=/g)].map((m) => m[1]))];
console.log(`  ..   it assigns ${assigned.length} field(s): ${assigned.join(', ') || '(none)'}`);
ok(assigned.length >= FLOOR.length, `the reset assigns something — this is not measuring an empty body (${assigned.length} field(s))`);
for (const f of FLOOR) ok(assigned.includes(f), `${f} is dropped when a save is opened`);

// Run it against a `this` still holding the previous save's values. A body that has become a comment,
// or that clears three of four, dies here rather than passing on the strength of its own name.
const fields = [...new Set([...FLOOR, ...assigned])];
const PREV = { fromAnotherSave: true };
const fake: Record<string, unknown> = {};
const inits: Record<string, string> = {};
for (const f of fields) {
  const init = declInit(f);
  ok(init !== null, `${f} is still a declared field of Game with an initial value`);
  inits[f] = init ?? '';
  fake[f] = PREV;
}
let ran = true;
try { new Function(body).call(fake); } catch (e) { ran = false; ok(false, `the reset body runs: ${(e as Error).message}`); }
if (ran) for (const f of fields) {
  const want = inits[f] ? new Function(`return (${inits[f]});`)() : PREV;
  ok(JSON.stringify(fake[f]) === JSON.stringify(want),
     `${f} comes back as its declared initial \`${inits[f] || '?'}\`, not the previous save's value`);
}

// ── 2. BOTH DOORS INTO A SAVE USE IT, BEFORE THE NEW SAVE'S DATA STARTS ARRIVING ───────────────────
for (const [name, sig, firstTouch] of [
  ['loadSave', 'private async loadSave(id: string) {', 'setToken(save.token)'],
  ['startNewGame', 'private async startNewGame(rawName: string) {', 'api.register('],
] as const) {
  const at = src.indexOf(sig);
  ok(at !== -1, `${name}() was found (the scanner still matches this file)`);
  if (at === -1) continue;
  const [a, b] = block(src, at);
  const fn = src.slice(a, b);
  const call = fn.indexOf('this.resetPerSaveState()'), touch = fn.indexOf(firstTouch);
  ok(call !== -1, `${name}() drops the previous save's cached screens`);
  ok(call !== -1 && touch !== -1 && call < touch,
     `${name}() does it before \`${firstTouch}\` — the caches must be empty before the new save's data lands`);
}
const cg = (src.match(/private continueGame\(\)[^\n]*/) ?? [''])[0];
ok(/this\.loadSave\(/.test(cg), 'Continue on the title screen still enters through loadSave(), so it is covered by the same reset');

// ── 3. WHAT THE STALENESS COSTS — or every check above guards a mechanism that has silently gone ───
ok(/if \(m\.squadReport && m\.squadReportSeason === m\.season && !this\.pendingSquadReport\) \{/.test(src),
   "loadMgr still refuses to rehydrate a save's own report while one is pending — what a carried-over report suppresses");
ok(/if \(this\.seasonLeaders == null\) \{/.test(src),
   'the season leaders are still fetched only when the cache is empty — what makes a carried-over table stick');
ok(/if \(this\.facLoaded\) this\.maybeOfferArc\(\);/.test(src),
   'the arc offer is still gated on facLoaded — what a carried-over `true` fires early');
ok(/const wipe = \(\) => \{ this\.pendingSquadReport = null; const mm = this\.loadMgr\(\); this\.saveMgr\(\{ \.\.\.mm, squadReport: null \}\)/.test(src),
   "the report's ✕ still writes squadReport:null through saveMgr into whichever save is open — the cost of showing the wrong one");

console.log(fails ? `\n✗ ${fails} — a save switch can carry the previous dynasty's screen into the new save` : '\n✓ every per-save cache is dropped on the way into a save');
if (fails) process.exitCode = 1;
