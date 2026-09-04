// THE ONE MESSAGE THAT COSTS A SAVE WAS THE ONE MESSAGE NOBODY WAS TOLD.
//
// The storage-failure watchdog builds its red banner as a bare `document.createElement('div')` with an id
// and some innerHTML, and appends it to the END of <body>. No role, no aria-live — and it is created on
// demand inside a 4s interval, so it is not in the document at load either. A screen-reader player was
// therefore told nothing at all by the single highest-stakes sentence in the game ("your progress will be
// lost when you close this tab") unless they happened to browse to the bottom of the page and find it.
// The same defect on the failed-register path was fixed by routing that message through toast(); the
// repair was never carried across to this one. #toast is the app's only live region (index.html, measured
// live=polite / ignored=false), and nothing in this block wrote to it.
//
// TWO THINGS ARE BEING MEASURED, because either alone is unreliable:
//   * role="alert" ON THE ELEMENT AT THE MOMENT IT IS INSERTED. A live region that enters the tree already
//     carrying its text is announced dependably only when it arrives as an alert, so setting the attribute
//     after appendChild is the flaky ordering and this probe deliberately cannot tell the difference by
//     reading the final element — it records the role at insertion time instead.
//   * one toast() for the same failure, because several readers only announce mutations made to a region
//     that was already in the tree when they met it.
//
// THIS PROBE DOES NOT GREP FOR THE ATTRIBUTE. A grep passes on the word in a comment, on `role="alerts"`,
// and on a setAttribute that runs after the insert. It lifts the watchdog's real callback out of main.ts,
// runs it against a stub document that records the role each element carried when it was appended and
// every toast() it fired, and drives it through the sequence a player actually hits: failing, failing
// again, recovered, failing again.
//
// VACUITY GUARDS, since every check below measures a stubbed run that could measure nothing:
//   * the extraction is asserted (the callback must come out of source whole);
//   * the first failing tick must have created AND inserted exactly one element before anything is read
//     off it, so a callback that silently did nothing fails here rather than passing on `undefined`;
//   * what was measured is echoed on a `..` line — the tag, the role at insert, and the toast text.
// MUTATION TEST: delete `el.setAttribute('role', 'alert')` and the role check goes red; MOVE that line to
// just after `document.body.appendChild(el)` and it goes red too (the element ends up correct, the
// announcement does not); delete the toast() call and three checks go red; hoist the toast() out of the
// `saveWarned` latch and the "does not re-announce every 4s" check goes red.
//
// Run: `npx tsx tools/playtest/save_banner_announced.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== the storage-failure banner is announced, not just displayed ===');

// ── lift the real watchdog out of main.ts ────────────────────────────────────────────────────────────
const marker = src.indexOf('THE GAME IS NOT BEING SAVED');
const open = marker < 0 ? -1 : src.lastIndexOf('setInterval(() => {', marker);
ok(open >= 0, 'the storage-failure banner is still raised by a setInterval watchdog in main.ts');

/** The arrow function starting at `at`, brace-matched. `${}` in the banner template stays balanced. */
function arrowFrom(at: number): string {
  let depth = 0;
  for (let i = src.indexOf('{', at); i >= 0 && i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  return '';
}
const cb = open < 0 ? '' : arrowFrom(open + 'setInterval('.length);
ok(cb.startsWith('() => {') && cb.includes("el.id = 'save-broken'"),
   'its callback came out of source whole — the checks below run the real code, not a copy of it');

// ── a document that remembers what a screen reader would have been handed ────────────────────────────
type El = {
  tag: string; id: string; innerHTML: string; attrs: Record<string, string>;
  /** The role the node carried WHEN IT ENTERED THE TREE — the only moment that decides the announcement. */
  roleAtInsert: string | null;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  remove(): void;
};
const created: El[] = [];
const inserted: El[] = [];
const toasts: string[] = [];
function makeEl(tag: string): El {
  const el: El = {
    tag, id: '', innerHTML: '', attrs: {}, roleAtInsert: null,
    setAttribute(name, value) { el.attrs[name] = String(value); },
    getAttribute(name) { return name in el.attrs ? el.attrs[name] : null; },
    remove() { const i = inserted.indexOf(el); if (i >= 0) inserted.splice(i, 1); },
  };
  return el;
}
const doc = {
  createElement(tag: string): El { const el = makeEl(tag); created.push(el); return el; },
  getElementById(id: string): El | null { return inserted.find((e) => e.id === id) ?? null; },
  body: { appendChild(el: El): El { el.roleAtInsert = el.getAttribute('role'); inserted.push(el); return el; } },
};

type Health = { ok: boolean; error?: string };
let health: Health = { ok: true };
let tick: () => void = () => { /* replaced below */ };
if (cb) {
  try {
    const factory = new Function('getSaveHealth', 'document', 'toast', `let saveWarned = false; return ${cb};`) as
      (g: () => Health, d: typeof doc, t: (m: string) => void) => () => void;
    tick = factory(() => health, doc, (m: string) => { toasts.push(m); });
  } catch (e) {
    ok(false, `the watchdog callback no longer evaluates on its own — update this probe (${(e as Error).message})`);
  }
}
/** One interval tick at the given save health. A throw is a FAIL, not a crash: it means the callback now
 *  reaches for something this stub does not provide, and the probe has to be taught about it. */
const run = (h: Health) => {
  health = h;
  try { tick(); }
  catch (e) { ok(false, `the watchdog threw on a ${h.ok ? 'healthy' : 'failing'} tick — it uses something this probe does not stub (${(e as Error).message})`); }
};

// ── the failure a player actually hits ───────────────────────────────────────────────────────────────
const BROKEN: Health = { ok: false, error: 'no storage available' };
run(BROKEN);
ok(created.length === 1 && inserted.length === 1,
   'a failing tick built the banner and put it in the page — the checks below have something to measure');
const banner = inserted[0];
console.log(`  ..   inserted <${banner?.tag ?? '?'} id="${banner?.id ?? ''}" role="${banner?.roleAtInsert ?? '(none)'}">, ` +
            `${toasts.length} toast(s): ${JSON.stringify(toasts[0] ?? '')}`);
ok(banner?.roleAtInsert === 'alert',
   'the banner carries role="alert" AT THE MOMENT IT IS INSERTED — a region that enters the tree already ' +
   'holding its text is only announced reliably if it arrives as an alert');
ok(toasts.length === 1,
   'and the same failure is also spoken through #toast, the live region that has been in the tree since load');
ok(/not being saved/i.test(toasts[0] ?? ''),
   `the toast says the game is not being saved (got ${JSON.stringify(toasts[0] ?? '')})`);

// The banner is raised from a 4s interval, so an announcement outside the `saveWarned` latch would repeat
// forever — an alert every four seconds is worse than silence for a screen-reader player. Measured as a
// DELTA so this stays a check on repetition alone and cannot restate the two above.
const wasInserted = inserted.length, wasToasted = toasts.length;
run(BROKEN); run(BROKEN);
ok(inserted.length === wasInserted && toasts.length === wasToasted,
   'it announces once per failure, not every 4s while the failure persists');

// A transient hiccup that recovers must not leave the player permanently unable to be warned again.
run({ ok: true });
ok(inserted.length === 0, 'a recovered save takes the banner back out of the page');
const beforeSecond = toasts.length;
run(BROKEN);
ok(inserted.length === 1 && inserted[0]?.roleAtInsert === 'alert' && toasts.length === beforeSecond + 1,
   'and a later, second failure is announced again — neither the role nor the toast is once-per-session');

console.log(fails ? `\n✗ ${fails} check(s) failed — the game can tell a player their save is gone and say it to nobody`
                  : '\n✓ the storage-failure banner reaches a screen reader, both as an alert and through #toast');
if (fails) process.exitCode = 1;
