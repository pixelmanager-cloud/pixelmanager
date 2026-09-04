// A DIALOG THAT OPENS ANOTHER DIALOG MUST NOT HAND THE MATCH CLOCK BACK ON THE WAY.
//
// `openSettings` freezes the match — `const wasRunning = this.running; this.running = false;` — and gives
// the restore to dialogify's onClose. Both of its onward links then did this:
//
//     ov.querySelector('#set-credits')!.addEventListener('click', () => { close(); this.showCredits(); });
//
// `close()` runs that onClose FIRST, so `running` went back to true, and `showCredits` / `openHowToPlay`
// opened with a bare `this.dialogify(ov)` and never touched the flag. onFrame advances the engine on
// exactly that flag, so at x12 the rest of the match played out behind a full-screen credits roll and the
// player came back to a different scoreline — the failure openSettings' own comment was written to stop,
// reintroduced one hop later. `inertDepth` does not save it: that gates the keyboard shortcuts, not the
// tick loop.
//
// THE RULE: if a modal suppresses `this.running`, every modal it hands off to with `close(); this.X()`
// must capture and suppress the clock ITSELF, and restore it in its own dialogify onClose. Freezing it in
// the caller instead (`close(); this.running = false; this.showCredits();`) is not enough — the target
// then has no restore, so closing it leaves the match frozen under no pause indicator, which is how
// "Resume" once wrote `false` back over a paused match.
//
// Source-level, because these handlers live in a DOM-coupled monolith with no headless seam; this catches
// the exact shape that shipped.
//
// Run: `npx tsx tools/playtest/modal_pause_handoff.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Modal → modal hops keep the match clock frozen ===');

const MEMBER = /\n  (?:private |public |protected )?(?:static )?(?:async )?(\w+)\s*\(/g;

/** The body of a class method, from its declaration to the next closing brace at class-member indent. */
const bodyOf = (name: string): string => {
  if (!name) return '';
  const decl = new RegExp(`\\n  (?:private |public |protected )?(?:static )?(?:async )?${name}\\s*\\(`).exec(src);
  if (!decl) return '';
  const end = src.indexOf('\n  }\n', decl.index);
  return end < 0 ? src.slice(decl.index) : src.slice(decl.index, end);
};
/** The class method containing this offset: the last member declaration above it. */
const enclosing = (idx: number): string => {
  let name = '';
  for (const d of src.slice(0, idx).matchAll(MEMBER)) name = d[1];
  return name;
};
/** Does this method hold the pause itself — capture, suppress, and give it back on close? */
const holdsPause = (body: string) =>
  /const wasRunning = this\.running;/.test(body)
  && /this\.running = false;/.test(body)
  && /this\.running = wasRunning;/.test(body);

// VACUITY GUARD 1: the premise is that the tick loop is gated on `this.running`. If onFrame stops reading
// it, every assertion below is about a flag nothing consumes and this probe is guarding nothing.
const tickGated = /if \(this\.running\) \{/.test(src);
console.log(`  ..   onFrame still advances the engine only when this.running: ${tickGated}`);
ok(tickGated, 'the tick loop is gated on this.running (otherwise these assertions are vacuous)');

// VACUITY GUARD 2: openSettings must still be the kind of dialog that suppresses the clock, or the
// hand-back this probe is about cannot happen at all.
ok(holdsPause(bodyOf('openSettings')), 'openSettings still captures, suppresses and restores this.running');

// Every `close(); this.X();` hop — the optional `this.running = ...` in between is the pause menu's shape,
// which must not be allowed to excuse a target that cannot give the clock back.
const hops = [...src.matchAll(/close\(\);\s*(?:this\.running\s*=\s*(?:true|false);\s*)?this\.(\w+)\(\);/g)]
  .map((m) => ({ to: m[1], from: enclosing(m.index!), line: src.slice(0, m.index!).split('\n').length }))
  .filter((h) => holdsPause(bodyOf(h.from)));
console.log(`  ..   ${hops.length} modal→modal hop(s) out of a clock-suppressing dialog`);
ok(hops.length > 0, 'there are hops to check (this is not measuring an empty set)');

for (const h of hops) {
  ok(holdsPause(bodyOf(h.to)),
     `${h.to}() — opened by ${h.from} at main.ts:${h.line} — holds the pause itself, so the match cannot run behind it`);
}

console.log(fails ? `\n✗ ${fails} modal(s) let the match play on behind a full-screen dialog` : '\n✓ every modal→modal hop keeps the clock frozen');
if (fails) process.exitCode = 1;
