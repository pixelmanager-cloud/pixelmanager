// ── IF THE HANDLER NEEDS AN ID TO KNOW WHO, SO DOES THE PLAYER ──────────────────────────────────────
// F-121 established the rule on four buttons: `.tm-buy`, `.tm-sell`, `.fac-up` and `.fac-down` each got an
// aria-label naming the player or the facility, because the subject's name lives in a SIBLING span and the
// button's own text is a bare verb plus a price. The rule was applied by hand, nothing measured it, and it
// stopped there. Fourteen more buttons of exactly that shape shipped bare:
//
//   `<button class="sf-hire" data-staff="${s.id}">Hire · 💰${s.cost}</button>` — and BACKROOM_STAFF prices
//   `fitness` and `attack` at 350 apiece, so two LIVE buttons on the season screen announced as the
//   identical "Hire · 💰350, button", the coach's name only in the sibling `.sf-staff-name`.
//   `<button class="sign-m" data-mid="${m.id}">Sign ▶</button>` — up to LOANEE_CAP (3) at once, all saying
//   "Sign ▶", each burning one of only three loanee places for the season, and no confirm behind it.
//   `<button data-idx="${t.index}">Sign ▶</button>` — the walk-up trial pool: the same bare verb again on
//   another screen, and the one nobody had noticed. That is the sibling this file exists to catch.
//
// THE CENSUS IS MECHANICAL, NOT A LIST OF THE ONES SOMEBODY NOTICED. A "roster button" is any <button> in
// main.ts whose tag carries an interpolated entity id — `data-x="${….id}"`, `${…Id}`, `${….index}`,
// `${….key}`, `${…seed}`. That attribute exists for exactly one reason: the click handler cannot tell
// which of N subjects was pressed without it. A control that needs an id to say WHICH ONE has to say which
// one out loud too. So this sweep cannot be satisfied by fixing the buttons a finding happens to name —
// six earlier waves closed one sibling of a set and left the rest, and this is the shape that stops a
// seventh.
//
// Option and toggle controls fall out by the same mechanism rather than by an allowlist: `data-wage="${w}"`,
// `data-tab="${t}"`, `data-role="${role}"`, `data-tt="fire"` and `data-sponsor="steady"` carry an OPTION,
// not an entity, so none of them match the id shape. Nothing is hand-waved past. (`.sf-hire`'s unaffordable
// twin has no data-staff and so is not in the census — it is labelled by hand anyway, because `.fac-up` and
// `.tm-buy` both carry their aria-label through the disabled branch, and a disabled button is still read in
// browse mode.)
//
// Static, for the reason career_back_named.ts next door gives: main.ts is a DOM-coupled monolith with no
// seam to drive headlessly, and an accessible name is exactly the attribute a careless edit deletes without
// breaking anything a sighted playtest would notice.
//
// MUTATION TESTS — each of these must turn a line below red (all six were run):
//   - drop aria-label from any one roster button        -> check 4 FAILs and names the file:line
//   - weaken one to `aria-label="Hire for ${s.cost}c"`  -> check 5 FAILs: a price is not a subject, and
//     two coaches cost 350
//   - weaken one to `aria-label="Sign a player"`        -> check 4 FAILs (no interpolation: every row would
//     announce the same words, which is the defect restated)
//   - fix only `.sf-hire` and leave `.sign-m` bare      -> check 4 still FAILs; the sweep is not scoped
//   - break the <button> regex so it matches nothing    -> check 1 and 2 FAIL, which is what stops checks 4
//     and 5 reporting "0 bare" over an empty census
//   - break the id regex so the census empties          -> check 2 FAILs and the run stops there
//   - rename `data-staff` on the hire button            -> check 3 FAILs and says which marker vanished,
//     rather than the census quietly shrinking by one
//
// Run: `npx tsx tools/playtest/roster_action_named.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');
// Length-preserving comment mask, the same one sign_cap_named.ts uses: this codebase's comments quote the
// broken markup they replaced verbatim, so a `<button>` inside a comment would be counted as shipped code.
// Blanking to spaces keeps every index lined up with the same index in `src`, so the line numbers stay true.
const mask = src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));

console.log('=== Every per-subject action button names its subject ===');

// ── 1. ANTI-VACUITY GATE for the tag scan. Everything below reads this one list.
const tags: Array<{ line: number; tag: string }> = [];
for (const m of mask.matchAll(/<button\b([^>]*)>/g)) {
  tags.push({ line: mask.slice(0, m.index ?? 0).split('\n').length, tag: m[1] });
}
console.log(`  ..   <button> tags emitted by main.ts: ${tags.length}`);
ok(tags.length >= 40, 'the button scan matched real markup (this is not sweeping an empty list)');

// ── 2. THE CENSUS + ITS FLOOR. An interpolated entity id in a data-* attribute is the marker: the handler
//       needs it to know which subject was pressed. Nineteen buttons qualify today.
const ID = /\bdata-[a-z-]+="\$\{[^}]*(?:\.id|Id|\.index|\.key|\bseed\b)\s*\}"/;
const roster = tags.filter((t) => ID.test(t.tag));
console.log(`  ..   roster buttons (the tag carries an interpolated entity id): ${roster.length}`);
ok(roster.length >= 15, 'the roster census is populated (checks 4 and 5 have something to measure)');
if (roster.length < 15) { console.log('\n✗ the census is empty or has collapsed — nothing below is meaningful'); process.exit(1); }

// ── 3. ROLL-CALL of the sites this wave is about, so the sweep cannot go green by the census SHRINKING.
//       If one is renamed or deleted this says which, instead of check 4 quietly having less to check.
const MARKERS = ['data-staff=', 'data-mid=', 'data-idx=', 'data-seed=', 'data-buy=', 'data-key='];
const missing = MARKERS.filter((k) => !roster.some((r) => r.tag.includes(k)));
console.log(`  ..   markers present: ${MARKERS.filter((k) => !missing.includes(k)).join(' ') || '(none)'}`);
ok(missing.length === 0, `the bare sites and F-121's origin sites are all still in the census${missing.length ? ` — missing ${missing.join(', ')}` : ''}`);

// ── 4. THE CONVENTION. Every roster button carries an aria-label, and that label INTERPOLATES — a fixed
//       string would give all N rows the same accessible name, which is the defect written out longhand.
const bare = roster.filter((r) => !/\baria-label="[^"]*\$\{/.test(r.tag));
for (const b of bare) console.log(`  ..   unnamed: main.ts:${b.line}  <button${b.tag.slice(0, 110)}>`);
ok(bare.length === 0, `every roster button has a per-subject accessible name (${bare.length} bare)`);

// ── 5. AND THE NAME IS THE SUBJECT, NOT THE PRICE. "Hire for 350 coins" is still two identical buttons when
//       two coaches both cost 350 — the fix has to speak the subject's own name: `${s.name}`, `${dest.name}`,
//       or the escaped-into-an-attribute copy the save row calls `nm`.
const named = roster.filter((r) => /\baria-label="[^"]*\$\{/.test(r.tag));
const priceOnly = named.filter((r) => {
  const label = (r.tag.match(/\baria-label="([^"]*)"/) ?? [])[1] ?? '';
  return !/\$\{[^}]*\b(?:name|nm)\b[^}]*\}/i.test(label);
});
for (const p of priceOnly) console.log(`  ..   names no subject: main.ts:${p.line}  ${(p.tag.match(/\baria-label="[^"]*"/) ?? [''])[0]}`);
ok(priceOnly.length === 0, `each of those ${named.length} labels speaks the subject's name (${priceOnly.length} name only a price)`);

console.log(fails
  ? `\n✗ ${fails} check(s) failed — a button that needs an id to know WHO does not tell the player who`
  : `\n✓ all ${roster.length} per-subject action buttons name their subject`);
if (fails) process.exitCode = 1;
