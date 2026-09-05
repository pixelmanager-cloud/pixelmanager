// ONE EVICTION MUST COST ONE ATTEMPT PER SAVE, NOT ONE ATTEMPT PER APP SESSION.
//
// localStorage eviction is ORIGIN-wide: when Safari clears it after seven idle days EVERY save loses its
// `fm_mgr_*` at once, so a player with two dynasties needs the recovery block in refreshHubPlayer to run
// twice. The latch that bounds it — `rebuildingMgr` — was a page-lifetime boolean that nothing ever
// cleared, so the FIRST save opened spent the session's only attempt. Reproduced with two evicted
// dynasties: open the first and the hub reads "🧢 Managing … ★ … on the pitch · Season 6"; quit to the
// menu, open the second in the same session and the same hub offers a prospect row over a club with a
// squad, coins and honours still intact, and `fm_mgr_<that save>` is never written. The only hub door to
// the season is `#hub-continue-season`, inside the `mgr.starAge != null` branch that ONLY this recovery
// fills in — so the second dynasty stays unreachable until the app is restarted and THAT save is opened
// first, which nothing on screen says.
//
// The latch is still needed and must not simply be deleted: saveMgr swallows a quota failure, so a failed
// write leaves starAge still null and the `return this.refreshHubPlayer()` below it recurses forever, one
// api.me() per turn. It has to bound the RETRY, not the SESSION.
//
// Measured rather than read, because a latch is invisible at the source level — the file compiles, the
// screen renders, and the second save just quietly comes back wrong. This LIFTS the real declaration, the
// real gate, the real "one attempt only" write and whatever loadSave() does to the latch out of main.ts and
// drives them through a two-save session. If any of the four cannot be found the probe FAILS rather than
// passing over nothing.
//
// Run: `npx tsx tools/playtest/mgr_recovery_per_save.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

/** Drop comment-only lines, then make a TS fragment runnable: `this.` is the Game instance, and the two
 *  container generics a latch might plausibly carry (`new Set<string>()`) are not JS. */
const runnable = (s: string) => s.split('\n')
  .filter((l) => l.trim() !== '' && !/^(\/\/|\/\*|\*)/.test(l.trim()))
  .join('\n')
  .replace(/(new\s+(?:Set|Map))\s*<[^>]*>/g, '$1')
  .replace(/\s+as\s+(?:any|string)\b/g, '')
  .replace(/\bthis\./g, 'self.');
/** Every statement line mentioning the latch inside a span (comments dropped). */
const touching = (span: string) => span.split('\n').filter((l) => /rebuildingMgr/.test(l) && !/^\s*(\/\/|\*)/.test(l)).join('\n');

console.log('=== The premises this measurement rests on ===');

const decl = /^\s*private rebuildingMgr\s*=\s*([^;]+);/m.exec(src);
ok(!!decl, 'the recovery still has a latch called rebuildingMgr — otherwise this probe is blind');

const hubAt = src.indexOf('private async refreshHubPlayer()');
const hubEnd = src.indexOf('\n  /** The Dynasty & Trophy Room', hubAt);
const hub = hubAt > 0 && hubEnd > hubAt ? src.slice(hubAt, hubEnd) : '';
const gateLine = /^ *if \(star &&.*rebuildingMgr.*\) \{$/m.exec(hub);
ok(!!gateLine, 'the recovery gate in refreshHubPlayer still consults the latch');
// The conjunct that is about the latch, and nothing else in that `if` — `star`, `managed` and
// `starAge == null` are mgr_recovery_reachable.ts's subject, not this one's.
const gateExpr = gateLine
  ? gateLine[0].replace(/^ *if \(/, '').replace(/\) \{$/, '').split('&&').filter((c) => /rebuildingMgr/.test(c)).join(' && ').trim()
  : '';
const setLine = touching(hub.slice(gateLine ? (gateLine.index ?? 0) + gateLine[0].length : 0));
ok(!!gateExpr && !!setLine, 'the block still marks its one attempt on the latch after the gate opens');

const lsAt = src.indexOf('private async loadSave(');
const lsEnd = src.indexOf('\n  private deleteSave(', lsAt);
const loadSave = lsAt > 0 && lsEnd > lsAt ? src.slice(lsAt, lsEnd) : '';
ok(/setToken\(save\.token\);/.test(loadSave) && (src.match(/setToken\(save\.token\)/g) ?? []).length === 1,
   'loadSave is still the one place the active save is switched — so it is where a per-save latch is scoped');

// ── the two-save session, run against whatever the file actually says ──
/** Build the latch's real behaviour: how it starts, what opening a save does to it, what the gate reads,
 *  what the one-attempt write does. Returns null if the pieces will not run. */
type Latch = { open: (h: string) => void; gate: () => boolean; mark: () => void };
function build(init: string, onOpen: string, gate: string, mark: string): Latch | null {
  const js = 'const self = { rebuildingMgr: ' + runnable(init) + ', account: { handle: "" } };\n'
    + 'const open = (handle) => { self.account = { handle }; const h = handle;\n' + runnable(onOpen) + '\n};\n'
    + 'const gate = () => { const h = self.account.handle; return !!(' + runnable(gate) + '); };\n'
    + 'const mark = () => { const h = self.account.handle;\n' + runnable(mark) + '\n};\n'
    + 'return { open, gate, mark };';
  try { return (new Function(js) as () => Latch)(); } catch { return null; }
}
/** Two evicted dynasties, opened one after the other in a single app session, plus the retry loop inside
 *  the first open. Returns what the player gets at each point. */
function session(l: Latch) {
  l.open('slot-alba');
  const first = l.gate();          // the first evicted save must get its attempt
  if (first) l.mark();
  const retry = l.gate();          // ...and must not get a second one without re-opening (the loop)
  l.open('slot-brook');
  const second = l.gate();         // the second evicted save must get its OWN attempt
  return { first, retry, second };
}

console.log('\n=== ...and that these three states can tell a wrong latch from a right one ===');
// MUTATION CONTROLS. Both are latches this line has actually carried or been offered, and both are wrong.
// Without them the assertions below could be passing over a session model that says yes to everything.
const asShipped = build('false', '', '!self.rebuildingMgr', 'self.rebuildingMgr = true;');
const asDeleted = build('false', '', 'true', '');
ok(!!asShipped && !!asDeleted, 'the control latches run at all');
const sShipped = asShipped ? session(asShipped) : null;
const sDeleted = asDeleted ? session(asDeleted) : null;
console.log(`  ..   a page-lifetime boolean: save 1 attempt=${sShipped?.first}, retry-within-open=${sShipped?.retry}, save 2 attempt=${sShipped?.second}`);
console.log(`  ..   no latch at all:         save 1 attempt=${sDeleted?.first}, retry-within-open=${sDeleted?.retry}, save 2 attempt=${sDeleted?.second}`);
ok(sShipped?.second === false, 'a page-lifetime latch is CAUGHT here (the second dynasty gets no attempt)');
ok(sDeleted?.retry === true, 'deleting the latch instead is CAUGHT here (the retry loop never terminates)');

console.log('\n=== The latch main.ts actually ships ===');
const shipped = decl && gateExpr && setLine ? build(decl[1], touching(loadSave), gateExpr, setLine) : null;
ok(!!shipped, 'the shipped latch could be lifted out of main.ts and run — it moved, so this probe would be blind');
if (shipped) {
  const s = session(shipped);
  console.log(`  ..   shipped:                 save 1 attempt=${s.first}, retry-within-open=${s.retry}, save 2 attempt=${s.second}`);
  ok(s.first, 'an evicted save gets its rebuild attempt when it is the first one opened');
  ok(!s.retry, 'and only one per open — the retry loop refreshHubPlayer recurses into still terminates');
  ok(s.second, 'a SECOND evicted save opened in the same session gets its own attempt, not the first save\'s leftovers');
}

console.log(fails ? `\n✗ ${fails} problem(s) — only one dynasty per app session can come back from an eviction` : '\n✓ every save opened gets one rebuild attempt of its own');
if (fails) process.exitCode = 1;
