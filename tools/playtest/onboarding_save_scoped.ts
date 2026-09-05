// ── A GATE THAT SAYS "ALREADY TAUGHT" MUST BE SCOPED TO THE SAVE THAT WAS TAUGHT ─────────────────────
// onbKey exists for one reason and its own doc comment states it: "so a brand-new bloodline (New Game) gets
// the onboarding again, instead of a global flag suppressing it forever after the first-ever career
// (playtest fix PT-11)". PT-11 was a global flag. It came back, in a fourth gate written later.
//
// `fm_lineup_seen` gates the lineup screen's simplified first view — `#lineup.simple` in index.html hides six
// panels, the whole nine-control tactics row and the squad panel among them — at the one moment the code
// beside it calls too much: the handoff, one click after a career whose entire interaction was "choose 1 of 4
// cards". It read and wrote the bare string, so the simplified view was a once-per-MACHINE event. The second
// bloodline, every bloodline after it, and the same one restarted after "Delete forever" all landed on the
// full screen at the handoff. Deleting could not reset it either: deleteSave sweeps localStorage with
// `k.includes(<save token>)`, and a key with no handle in it holds no token to match.
//
// The rule, which is what a static probe can honestly check: every localStorage key named for a shown-once
// gate (`fm_*_seen` / `fm_*_done`) is reached through this.onbKey. Three of the four already were. The gate
// list is DISCOVERED from the source, not listed here, because a list somebody has to remember to extend is
// the shape of the defect itself.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - make onbKey `return base;`                            -> check 1 FAILs
//   - rename the four fm_* gates to zz_*                    -> the empty-set guard FAILs (0 found)
//   - drop `#lineup.simple #tac-row` from index.html        -> the last check FAILs
//   - add a bare getItem('fm_lineup_seen') with a trailing
//     `// comment` on the same line                         -> that gate's check FAILs (the comment filter
//     below skips comment LINES, not code that happens to carry a comment)
//
// Run: `npx tsx tools/playtest/onboarding_save_scoped.ts`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync(fileURLToPath(new URL('../../client/src/main.ts', import.meta.url)), 'utf8');
const html = readFileSync(fileURLToPath(new URL('../../client/index.html', import.meta.url)), 'utf8');
const lines = src.split('\n');
const lineOf = (i: number) => src.slice(0, i).split('\n').length;

console.log('=== One-time onboarding gates are per-save, not per-machine ===');

// 1. The helper has to still BE the thing that scopes. A probe that only checked "the call site says onbKey"
//    would sit green over an onbKey that had quietly become `return base`.
const helper = (src.match(/private onbKey\(base: string\): string \{ ([^\n]*) \}/) ?? [, ''])[1];
console.log(`  ..   onbKey body: \`${helper}\``);
ok(/account\?\.handle/.test(helper), 'onbKey still folds the account handle into the key — this is what makes a gate per-save');
ok(/const suffix = save\?\.token[\s\S]{0,240}k\.includes\(suffix\)/.test(src),
   "deleteSave still sweeps localStorage by the save's token, so a handle-bearing key is also a deletable one");

const gates = [...new Set([...src.matchAll(/'(fm_[a-z0-9_]*(?:_seen|_done))'/g)].map((m) => m[1]))].sort();
console.log(`  ..   ${gates.length} one-time gate keys in main.ts: ${gates.join(', ')}`);
ok(gates.length >= 4, `the scan found the gates at all — it is not asserting over an empty set (${gates.length} found)`);

// Comment LINES are prose, not wiring: this file explains its own bugs by quoting the code that caused them,
// so a fix whose comment names the key it has just stopped using must not read as a use of it.
const isCommentLine = (n: number) => /^(\/\/|\*|\/\*)/.test((lines[n - 1] ?? '').trim());
for (const g of gates) {
  const bare = [...src.matchAll(new RegExp(`(.{0,12})'${g}'`, 'g'))]
    .filter((m) => !m[1].endsWith('this.onbKey(') && !isCommentLine(lineOf(m.index!)));
  for (const b of bare) console.log(`  ..   ${g} used bare at main.ts:${lineOf(b.index!)}`);
  ok(bare.length === 0, `${g} is only ever reached through this.onbKey (${bare.length} bare use(s))`);
}

// The POINT of the gate, or every check above passes while the teaching it guards has silently gone: the
// class the code toggles, and the rules that make the class mean something.
ok(/classList\.toggle\('simple'/.test(src), 'the lineup screen still toggles the `simple` class the gate decides');
const simpleRule = (html.match(/#lineup\.simple[^{]*\{[^}]*display:\s*none[^}]*\}/) ?? [''])[0];
const hidden = [...simpleRule.matchAll(/#lineup\.simple (#[a-z-]+)/g)].map((m) => m[1]);
console.log(`  ..   \`#lineup.simple\` hides ${hidden.length} panel(s): ${hidden.join(', ')}`);
ok(hidden.includes('#tac-row'), 'and `#lineup.simple` still hides the tactics row, which is what the first-run view is for');

console.log(fails ? `\n✗ ${fails} — a first-run gate outlives the save it was shown to` : '\n✓ every shown-once onboarding gate resets with a new bloodline');
if (fails) process.exitCode = 1;
