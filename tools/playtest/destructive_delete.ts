// A DELETE THAT FAILED MUST NOT REPORT SUCCESS.
//
// Deleting a save did four things: remove the durable model, sweep every per-handle localStorage key, drop
// the row from the save index, and toast "Save deleted". Only the first could fail, and it was wrapped in
// `catch { /* best-effort */ }` — so when it failed the other three happened anyway.
//
// The durable delete really does reject: save.deleteSave awaits backend.remove with no catch of its own, and
// IndexedDBBackend.remove goes through a transaction whose onerror/onabort reject. A blocked upgrade, a
// corrupt database, Safari private browsing — ordinary causes.
//
// And recoverOrphanedSaves reconciles in ONE direction: at the next launch it sees a durable model with no
// index row, calls it an orphan and puts it back. So the save the player was told was gone for good returns
// — with fm_mgr_, fm_tier_, fm_ach_ and fm_bought_ already swept, i.e. rebuilt from the durable model alone,
// in the bottom division at season one. Told deleted, came back, came back broken.
//
// Run: `npx tsx tools/playtest/destructive_delete.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== A failed delete changes nothing and says so ===');

// The handler, brace-matched from the method rather than sliced by a byte window.
const at = src.indexOf('private deleteSave(');
ok(at > 0, 'the delete handler still exists (this is not measuring an empty set)');
let depth = 0, end = at;
for (let i = src.indexOf('{', at); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
}
// STRIP COMMENTS BEFORE READING THE CODE. This codebase's comments quote the OLD, broken code verbatim as
// part of the post-mortem — the fix's own comment contains the exact string
// `catch { /* best-effort */ }` it was written to remove. The first version of this probe searched the raw
// body, found that quotation, and reported the defect as still present on a tree where it was fixed. Every
// grep-the-source probe in this repo has to do this; css_hooks.ts hit the same trap with CSS comments.
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const body = decomment(src.slice(at, end));
const code = decomment(src);

// 1. The durable delete must gate what follows, not be swallowed.
const call = body.indexOf('api.deleteSave');
ok(call > 0, 'it still asks the backend to remove the durable model');
const guard = body.slice(call, call + 400);
// One assertion, not two: testing for the literal `/* best-effort */` only catches the exact comment that
// happened to be there, and a mutation that swallows the error under any other wording walks past it. What
// matters is that the catch STOPS — an empty catch and a chatty one that falls through are the same defect.
ok(/catch\s*\{[^}]*\breturn\b/.test(guard),
   'a failed durable delete returns, so nothing downstream runs');

// 2. Everything destructive must sit after that gate.
for (const [needle, what] of [
  ['localStorage.removeItem', 'the localStorage sweep'],
  ['this.saveSaves(', 'the index-row removal'],
  ["toast('Save deleted')", 'the success toast'],
]) {
  const i = body.indexOf(needle);
  ok(i > call, `${what} happens only after the durable delete has succeeded`);
}

// 3. VACUITY GUARD — the resurrection half must still exist, or the consequence this guards is gone and the
//    probe is protecting against nothing.
ok(/const orphans = onDisk\.filter\(\([^)]*\) => !known\.has\(m\.id\)\)/.test(code),
   'recoverOrphanedSaves still reconciles one way only (which is what made a failed delete destructive)');

console.log(fails ? `\n✗ ${fails} — a save can be reported deleted, come back, and come back broken` : '\n✓ a failed delete leaves the save intact and says so');
if (fails) process.exitCode = 1;
