// ── THE ONLY WAY OUT OF A 120-TURN CAREER ANNOUNCED AS A BARE GLYPH ──────────────────────────────────
// renderCareer() builds the career screen its own header — `<div class="cg-head"><button id="cg-back">←`
// — and that button is the exit from the career loop: it is wired to showAcademy(), and it is the first
// control inside the panel, because the same method sets `$('academy-head').style.display = 'none'` and
// so takes the labelled `<button id="academy-back">← Back to hub</button>` out of the tab order for the
// whole career. It shipped with no aria-label, no aria-labelledby and no title, so its accessible name
// was the arrow itself: a screen reader announces "left arrow, button" — or, where the glyph is dropped
// as punctuation, an unnamed button — and never says where it goes. Every keyboard player tabs past it
// on every one of ~120 turns.
//
// It was the only button in the client with NO ACCESSIBLE NAME AT ALL. Every other icon-only control
// already carries one — `<button class="set-x" aria-label="Close">✕</button>`, `aria-label="Delete
// ${nm}"` on the save-row ✕, `title="Dismiss"` on the squad-report ✕ — which is why the convention is
// swept below and not just this one id: the sweep is what stops the NEXT icon-only button shipping bare.
//
// THE NAME AND THE WIRING ARE CHECKED TOGETHER. A label that names a destination is a promise about the
// handler. If #cg-back is ever re-pointed and the label left behind, the button lies to the one player
// who cannot see where it went — so check 5 derives the noun it demands from the handler, rather than
// from a string retyped here.
//
// Static, like name_field_label.ts next door: main.ts is a DOM-coupled monolith with no seam to drive
// headlessly, and an accessible name is exactly the kind of attribute a careless edit deletes without
// breaking anything a sighted playtest would notice.
//
// MUTATION TEST — each of these must turn a line below red:
//   - drop aria-label from #cg-back                        -> checks 3, 4, 5 and 7 FAIL
//   - set aria-label="←"                                   -> checks 4 and 5 FAIL: a glyph is not a name
//   - set aria-label to whitespace                         -> check 3 FAILs too (the name is trimmed)
//   - re-point the click handler away from showAcademy()   -> check 5 FAILs until the label follows it
//   - rename renderCareer, or delete the button            -> check 1 or 2 FAILs and the run stops there
//   - strip aria-label="Close" from one `set-x` ✕          -> check 7 FAILs; the sweep is not scoped to
//     one id, so it cannot go green by measuring only the button that was fixed
//   - break the <button> regex so it matches nothing       -> check 6 FAILs, which is what stops check 7
//     reporting "no unnamed buttons" over an empty list
//
// Run: `npx tsx tools/playtest/career_back_named.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');
const html = readFileSync('client/index.html', 'utf8');

console.log('=== The career screen names its way out ===');

// ── 1. ANTI-VACUITY GATE. Checks 2-5 all read this one method; renamed or moved, they would every one of
//       them be scanning the empty string and reporting green.
const start = src.indexOf('private renderCareer(');
const tail = start >= 0 ? src.slice(start + 1) : '';
const endRel = tail.search(/\n  (?:private|public|\/\*\*)/);
const bodyText = start >= 0 ? tail.slice(0, endRel > 0 ? endRel : tail.length) : '';
console.log(`  ..   renderCareer body: ${bodyText.length} chars`);
ok(bodyText.length > 2000, 'renderCareer was located (this is not scanning an empty string)');

// Why this button carries the whole burden: the outer, labelled back bar is display:none for the career.
console.log(`  ..   outer #academy-head hidden during a career: ${/\$\('academy-head'\)\.style\.display = 'none'/.test(bodyText)}`);

// ── 2. ANTI-VACUITY GATE for the markup half.
const tag = (bodyText.match(/<button[^>]*\bid="cg-back"[^>]*>/) ?? [])[0] ?? '';
console.log(`  ..   ${tag || '(no #cg-back button in renderCareer)'}`);
ok(!!tag, 'the career screen still builds a #cg-back button');
if (!tag) { console.log('\n✗ nothing to check — #cg-back is gone or renamed'); process.exit(1); }

// ── 3. A name of its own. aria-labelledby or title would serve as well as aria-label; what is not allowed
//       is the glyph being the whole story, which is what shipped.
const label = ((tag.match(/\baria-label="([^"]*)"/) ?? [])[1] ?? '').trim();
const titleAttr = ((tag.match(/\btitle="([^"]*)"/) ?? [])[1] ?? '').trim();
const labelledby = ((tag.match(/\baria-labelledby="([^"]*)"/) ?? [])[1] ?? '').trim();
const name = label || titleAttr;
console.log(`  ..   name sources: aria-label=${label ? `"${label}"` : 'none'}  title=${titleAttr ? `"${titleAttr}"` : 'none'}  aria-labelledby=${labelledby ? `"${labelledby}"` : 'none'}`);
ok(!!name || !!labelledby, 'the back button has an accessible name, not just an arrow');

// ── 4. …and that name is WORDS. "←" in an aria-label is the same nothing, written twice.
ok((name.match(/[A-Za-z]/g) ?? []).length >= 2 || !!labelledby,
   'the name is words a reader can speak, not the glyph repeated in an attribute');

// ── 5. The name has to agree with where the button goes, and the noun is taken from the HANDLER so the
//       two cannot drift: re-point it at showHub() and this asks the label to say "Hub".
const dest = (bodyText.match(/\$\('cg-back'\)\.addEventListener\('click', \(\) => this\.(\w+)\(\)\)/) ?? [])[1] ?? '';
const noun = dest.replace(/^show/, '');
console.log(`  ..   #cg-back is wired to ${dest ? `${dest}()` : '(handler not found)'} -> the name must say "${noun || '?'}"`);
ok(!!dest, 'the #cg-back click handler is still wired in renderCareer (check 5 has something to compare against)');
ok(!!dest && !!noun && name.toLowerCase().includes(noun.toLowerCase()),
   `the name says where it goes — the screen ${dest || 'the handler'}() opens`);

// ── 6. CENSUS + FLOOR for the sweep. An icon-only button is one whose literal content holds no letters or
//       digits; content built by interpolation is skipped, because a static scan cannot know whether
//       `${label}` is a word or a glyph. Eleven qualify today. The floor is what stops a regex that has
//       stopped matching from turning check 7 green over an empty list.
type Bare = { at: string; tag: string; text: string };
const bare: Bare[] = [];
for (const [file, text] of [['client/src/main.ts', src], ['client/index.html', html]] as const) {
  for (const m of text.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    if (m[2].includes('${')) continue;                       // content unknowable statically
    const inner = m[2].replace(/<[^>]*>/g, ' ');
    if (/[A-Za-z0-9]/.test(inner)) continue;                 // it names itself with its own text
    bare.push({ at: `${file}:${text.slice(0, m.index ?? 0).split('\n').length}`, tag: m[1].trim(), text: inner.trim() });
  }
}
console.log(`  ..   icon-only buttons in the client: ${bare.length} — ${bare.map((b) => b.at).join(', ')}`);
ok(bare.length >= 5, 'the icon-only buttons were found at all (the sweep below is measuring something)');

// ── 7. THE CONVENTION. Every one of them is named. This is the check that catches the next bare glyph,
//       not just this one.
const unnamed = bare.filter((b) => !/\baria-label="\s*[^"\s][^"]*"|\baria-labelledby="\s*[^"\s][^"]*"|\btitle="\s*[^"\s][^"]*"/.test(b.tag));
for (const u of unnamed) console.log(`  ..   unnamed: ${u.at}  <button ${u.tag}>${u.text}</button>`);
ok(unnamed.length === 0, `every icon-only button carries an accessible name (${unnamed.length} bare)`);

console.log(fails
  ? `\n✗ ${fails} check(s) failed — an icon-only button announces itself as a glyph and nothing else`
  : '\n✓ the career screen\'s exit is named, and every icon-only button in the client has a name');
if (fails) process.exitCode = 1;
