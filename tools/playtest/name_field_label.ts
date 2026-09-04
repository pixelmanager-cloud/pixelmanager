// THE FIRST FIELD IN THE GAME HAD NO LABEL AND NO DESCRIPTION.
//
// #mm-name is the family-name box on the main menu — the one input that decides the club name and the
// surname every heir inherits — and it shipped with a placeholder and nothing else: no <label for>, no
// aria-label, no aria-describedby. Measured in headless Chromium on the shipped markup, the field's
// accessible name was the placeholder EXAMPLE string ("your family name (e.g. Vance)") and its description
// was literally none. A placeholder is a fallback, not a label: it names the example rather than the field,
// it is painted in the muted placeholder grey, and it leaves the screen on the first keystroke — so nobody,
// sighted or not, can get the prompt back.
//
// And the one sentence that says what the name DOES — "your club becomes '<name>'s Club' and the name
// carries down the generations" — is written by updateNamePreview into #mm-preview, a plain div. Nothing
// tied the input to it and it carried no role, so neither the rule nor any of the club-name echoes typing
// produces was ever announced. Same measurement after the fix: name "Family name", description "Enter a
// family name — your club becomes …" while empty and "Your club: Vance's Club · the Vance bloodline" once
// typed, out of a region reporting live=polite.
//
// BOTH HALVES ARE LOAD-BEARING. main.ts focuses the input BEFORE the first updateNamePreview() call, so a
// description computed at focus time reads an EMPTY div: aria-describedby on its own does not deliver the
// sentence, and the live role is what carries it. This fails if either half goes.
//
// Static, like bar_transition.ts — driving a screen reader is not something this repo can gate on, and
// these are three attributes a careless edit deletes without breaking anything a sighted playtest would
// notice. Vacuity is guarded at every step: the input must exist, the idref must RESOLVE (a dangling idref
// is a silent no-op that still reads as a fix in a diff), and the element it resolves to must be the one
// main.ts actually writes the sentence into.
//
// Run: `npx tsx tools/playtest/name_field_label.ts`
import { readFileSync } from 'node:fs';

const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The family-name field is named, and its explanation reaches a screen reader ===');

// 1. Non-vacuity: everything below reads this one tag. If it is ever renamed, fail loudly rather than pass
//    over nothing.
const tag = (html.match(/<input\b[^>]*\bid="mm-name"[^>]*>/) ?? [])[0] ?? '';
console.log(`  ..   ${tag || '(no #mm-name input found)'}`);
ok(!!tag, 'the family-name input #mm-name is still in index.html');

// 2. A name of its own. A <label for> would serve just as well as aria-label; what is not allowed is the
//    placeholder fallback being the whole story, which is what shipped.
const labelFor = /<label\b[^>]*\bfor="mm-name"/.test(html);
const ariaLabel = (tag.match(/\baria-label="([^"]*)"/) ?? [])[1];
const ariaLabelledby = /\baria-labelledby="[^"]+"/.test(tag);
console.log(`  ..   name sources: <label for>=${labelFor}  aria-label=${ariaLabel ? `"${ariaLabel}"` : 'none'}  aria-labelledby=${ariaLabelledby}`);
ok(labelFor || !!(ariaLabel && ariaLabel.trim()) || ariaLabelledby,
   'it is named by a label/aria-label/aria-labelledby rather than by the placeholder fallback');

// 3. The explanation is associated with the field, and the idref RESOLVES. A described-by naming an id that
//    does not exist is exactly as silent as no attribute at all, and reads as a fix in the diff.
const describedby = ((tag.match(/\baria-describedby="([^"]*)"/) ?? [])[1] ?? '').trim();
const refs = describedby ? describedby.split(/\s+/) : [];
ok(refs.length > 0, 'it points at its explanation with aria-describedby');
const unresolved = refs.filter((r) => !new RegExp(`\\bid="${r}"`).test(html));
console.log(`  ..   aria-describedby="${describedby}" -> ${refs.length - unresolved.length}/${refs.length} idref(s) resolve in index.html`);
ok(refs.length > 0 && unresolved.length === 0, `every aria-describedby idref names a real element${unresolved.length ? ` (dangling: ${unresolved.join(', ')})` : ''}`);

// 4. It points at the element main.ts really writes the rule into — otherwise the copy moves and the
//    association quietly starts describing something else.
ok(/\$\('mm-preview'\)\.innerHTML/.test(src), 'updateNamePreview still writes the rule into #mm-preview');
ok(/carries down the generations/.test(src), 'the rule itself is still the text it writes there');
ok(refs.includes('mm-preview'), 'the field is described by #mm-preview, the element that holds the rule');

// 5. And that element is a live region. The input is focused before the div is first written, so at focus
//    time it is empty; without a live role the sentence is written to an audience of nobody, and none of
//    the club-name echoes typing produces are announced either.
const preview = (html.match(/<div\b[^>]*\bid="mm-preview"[^>]*>/) ?? [])[0] ?? '';
console.log(`  ..   ${preview || '(no #mm-preview div found)'}`);
ok(!!preview, '#mm-preview is still in index.html');
ok(/\brole="(status|alert)"/.test(preview) || /\baria-live="(polite|assertive)"/.test(preview),
   '#mm-preview is a live region, so the rule and the club-name echo are announced');

console.log(fails
  ? `\n✗ ${fails} check(s) failed — the first field in the game is unnamed or its rule is unspoken`
  : '\n✓ the family-name field is named, described, and its description is announced');
if (fails) process.exitCode = 1;
