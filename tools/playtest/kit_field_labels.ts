// THE IDENTITY SCREEN'S TWO LABELS WERE ATTACHED TO NOTHING.
//
// The KIT tab shipped as `<label>Squad number …</label><input id="kit-number" …>` — the label carries no
// `for`, and the input is its SIBLING, not its child, so neither the explicit nor the implicit association
// exists. Measured on that exact markup in headless Chromium: #kit-number computes role=spinbutton and an
// accessible name of "" — no name AT ALL, because type="number" has no placeholder to fall back on either.
// #kit-nick was only better in kind: its name was the placeholder EXAMPLE, "e.g. The Wolf". With the labels
// associated the same measurement reads "Squad number (his for life — retired in his honour if he becomes a
// club legend)" and "Nickname (yours alone — …)".
//
// The number is not decoration. It is the value this screen calls "his for life" and the one legendCardOf
// pulls back out of kit_json for the retired shirt, so a player who cannot hear which box he is typing it
// into cannot set it. This is the same defect F-173 fixed for the family-name box on the main menu
// (tools/playtest/name_field_label.ts) — these two rows were missed, and nothing measured them.
//
// Static, for the reason name_field_label.ts gives: driving a screen reader is not something this repo can
// gate on, and `for` is one attribute a careless edit deletes without breaking anything a sighted playtest
// would notice.
//
// VACUITY is how a probe of this shape dies quietly — one that runs over zero inputs passes loudly — so
// every step that could match nothing says so: the kitTabHtml block must be found, the rows must parse, and
// every row must yield an input. The rows are PARSED out of the markup rather than listed here, so a third
// identity field is checked the day someone adds it. And a `for` that does not RESOLVE to that row's input
// id counts as no name at all: a dangling idref is exactly as silent as a missing attribute while reading
// as a fix in the diff, which is the trap name_field_label.ts calls out for aria-describedby.
//
// Mutation-test it by deleting either `for="kit-…"` (that row goes red on the naming rule), or by pointing
// one at a typo'd id (red on the resolve rule instead). Both were run against this probe before it landed.
//
// Run: `npx tsx tools/playtest/kit_field_labels.ts`
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `new URL(...).pathname` is percent-encoded and this repo lives under a path with a space in it, so that
// spelling hands readFileSync a directory called `Clause%20Coding` (field_wiring.ts died on it first).
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Every field on the Identity screen has a name a screen reader can read ===');

const src = readFileSync(join(ROOT, 'client/src/main.ts'), 'utf8');

// 1. Non-vacuity: everything below reads this one method. If it is renamed, fail loudly rather than pass
//    over nothing.
const at = src.indexOf('private kitTabHtml(');
const end = at < 0 ? -1 : src.indexOf('\n  }\n', at);
const tab = at < 0 ? '' : src.slice(at, end > at ? end : at + 2000);
ok(!!tab, 'kitTabHtml is still the Identity screen (everything below reads its markup)');

const rows = [...tab.matchAll(/<div class="cg-kit-row">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
console.log(`  ..   ${rows.length} identity row(s) parsed out of kitTabHtml`);
ok(rows.length >= 2, 'the identity rows were actually parsed out of the markup (not a zero-of-zero pass)');

// 2. Every row must yield an input, or the loop below silently checks fewer fields than the screen shows.
const inputs = rows.map((row) => (row.match(/<input\b[^>]*>/) ?? [])[0] ?? '');
ok(inputs.every((t) => !!t), `every identity row contains an <input> (${inputs.filter(Boolean).length}/${rows.length})`);

// 3. THE RULE: each input is named by something a screen reader reads out — an associated <label>, or an
//    aria-label/aria-labelledby of its own. The placeholder is explicitly NOT a name: it is the example
//    rather than the field, and it leaves the screen on the first keystroke.
let named = 0;
rows.forEach((row, i) => {
  const tag = inputs[i];
  if (!tag) return;
  const id = (tag.match(/\bid="([\w-]+)"/) ?? [])[1] ?? '';

  const labelOpen = (row.match(/<label\b[^>]*>/) ?? [])[0] ?? '';
  const labelFor = ((labelOpen.match(/\bfor="([^"]*)"/) ?? [])[1] ?? '').trim();
  // Explicit association only counts when the idref RESOLVES to this row's own input — a `for` naming an
  // id that is not there names nothing, and looks identical in a diff to one that works.
  const explicit = !!id && labelFor === id;
  // Implicit association: the input nested INSIDE the label, which is how the tactics selects are named.
  const labelAt = row.indexOf(labelOpen);
  const closeAt = row.indexOf('</label>');
  const inputAt = row.indexOf(tag);
  const implicit = !!labelOpen && labelAt >= 0 && closeAt > labelAt && inputAt > labelAt && inputAt < closeAt;
  // A label associated with the input but carrying no text is still no name.
  const labelText = labelOpen
    ? (row.slice(labelAt + labelOpen.length, closeAt > labelAt ? closeAt : undefined).replace(/<[^>]*>/g, '').trim())
    : '';
  const ariaLabel = ((tag.match(/\baria-label="([^"]*)"/) ?? [])[1] ?? '').trim();
  const ariaLabelledby = ((tag.match(/\baria-labelledby="([^"]*)"/) ?? [])[1] ?? '').trim();
  const placeholder = ((tag.match(/\bplaceholder="([^"]*)"/) ?? [])[1] ?? '').trim();

  console.log(`  ..   #${id || '(no id)'}: <label for>=${labelFor ? `"${labelFor}"${explicit ? '' : ' (does NOT resolve to this input)'}` : 'none'}`
    + `  nested-in-label=${implicit}  aria-label=${ariaLabel ? `"${ariaLabel}"` : 'none'}`
    + `  aria-labelledby=${ariaLabelledby ? `"${ariaLabelledby}"` : 'none'}  placeholder=${placeholder ? `"${placeholder}"` : 'none'}`);

  const hasName = ((explicit || implicit) && !!labelText) || !!ariaLabel || !!ariaLabelledby;
  if (hasName) named++;
  ok(hasName, `#${id || '(no id)'} is named by its <label>/aria-label, not left to the placeholder fallback`);
});
console.log(`  ..   ${named} of ${inputs.filter(Boolean).length} identity input(s) have an accessible name`);

console.log(fails
  ? `\n✗ ${fails} check(s) failed — a field the Identity screen calls "his for life" announces with no name`
  : '\n✓ every identity field is named by something a screen reader reads out');
if (fails) process.exitCode = 1;
