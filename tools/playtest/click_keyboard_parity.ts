// A CLICK TARGET THAT IS NOT A BUTTON MUST STILL BE REACHABLE FROM THE KEYBOARD.
//
// #me-prestige — the hub chip that opens the whole Manager Legacy card (prestige score, league/cup tally,
// the next rank and the progress toward it) — shipped as a bare <span> with `cursor: pointer`, an onclick,
// and nothing else: no role, no tabindex, no key handler, and no focusable child. On a controller or a
// keyboard that card is unreachable, and the chip does not even take focus to say so. It is the defect
// F-108 fixed for the main-menu save rows, at a widget that wave never visited — the global mechanisms
// were fixed, the per-screen chips were not.
//
// THE RULE. If main.ts wires a click onto an element that index.html declares with a GENERIC tag
// (div/span/li/p — no native focusability, no implicit role), then either
//   (a) that element goes through makeActivatable(), which stamps role="button", tabindex="0" and the
//       Enter/Space handler, or
//   (b) it contains a focusable control of its own, so the same action has a keyboard path anyway.
// (b) is what makes #fulltime-card legitimate: it is a click-anywhere-to-dismiss backdrop whose real exit
// is the <button id="ft-continue"> inside it, and turning the whole viewport-covering overlay into one
// role="button" tab stop would be worse than the disease. Elements the markup gave a tabindex of its own
// are out of scope; so are <button> and <a href>, which are focusable already.
//
// This is a source-level probe for the same reason delegated_clicks.ts is one: these handlers live in a
// DOM-coupled monolith with no headless seam, and reaching a live hub chip means loading a whole career.
//
// It resolves the HANDLE, not the id, because the handle is how the bug hid. `$('me-prestige').onclick`
// would have been findable; refreshPrestige binds `const el = $('me-prestige')` first and wires the click
// on `el`, so every id-shaped grep over main.ts came back clean. The check therefore demands that the same
// handle the click was wired through is the one handed to makeActivatable — passing some other element
// would leave this one exactly as unreachable as before.
//
// MUTATION TEST, so this is not decorative. All four were applied and all four went red: delete
// `this.makeActivatable([el]);` from refreshPrestige (this is the pre-fix tree, and it is red on it);
// delete `this.makeActivatable([$('app-title')]);`; strip the `setAttribute('tabindex', '0')` line out of
// makeActivatable, which is what would make "went through makeActivatable" stop meaning "can be focused";
// and remove the <button id="ft-continue"> from #fulltime-card, which drops that overlay's exemption.
//
// Run: `npx tsx tools/playtest/click_keyboard_parity.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');
const html = readFileSync('client/index.html', 'utf8');

console.log('=== Every non-button click target is keyboard-activatable ===');

// THE PREMISE. If makeActivatable stops stamping a tabindex, "goes through makeActivatable" stops meaning
// "can be focused" and every assertion below would pass over a chip no keyboard can reach.
const helper = src.slice(src.indexOf('private makeActivatable('), src.indexOf('private makeActivatable(') + 1800);
ok(/setAttribute\('tabindex', '0'\)/.test(helper), 'makeActivatable still stamps tabindex="0" (what makes "activatable" mean anything here)');
ok(/k === 'Enter' \|\| k === ' '/.test(helper), '...and still binds Enter/Space to a click');

/** The method body a source offset sits in — sliced to the next member at class indentation. */
function bodyFrom(at: number): string {
  const rest = src.slice(at);
  const end = rest.search(/\n  (?:private|public|protected)\s/);
  return end < 0 ? rest.slice(0, 2000) : rest.slice(0, end);
}

/** Every element id main.ts wires a click onto, with the handle expression it was wired through. */
const targets = new Map<string, { handle: string; body: string }>();
// (a) wired straight off the lookup: $('id').onclick / $('id').addEventListener('click', ...)
for (const m of src.matchAll(/\$\('([\w-]+)'\)\s*\.\s*(?:onclick\s*=|addEventListener\('click')/g))
  targets.set(m[1], { handle: `$('${m[1]}')`, body: src });
// (b) wired through a local alias: `const el = $('id');` ... `el.onclick = ...` — the shape that hid
//     #me-prestige from every id-shaped grep of main.ts, so it is resolved rather than skipped.
for (const m of src.matchAll(/const (\w+) = \$\('([\w-]+)'\);/g)) {
  const [, name, id] = m;
  const body = bodyFrom(m.index!);
  if (!new RegExp(`\\b${name}\\s*\\.\\s*(?:onclick\\s*=|addEventListener\\('click')`).test(body)) continue;
  if (!targets.has(id)) targets.set(id, { handle: name, body });
}

/** The opening tag index.html declares for an id, or null when the markup is built in JS instead. */
const openTag = (id: string): string | null =>
  (html.match(new RegExp(`<\\w+[^>]*\\sid="${id}"[^>]*>`)) ?? [null])[0];

/** That element's whole subtree, by walking tag depth from its opening tag. Void/self-closing tags are not
 *  used for any target here, so a plain depth counter is enough. */
function subtree(id: string): string {
  const open = openTag(id)!;
  const tag = open.match(/^<(\w+)/)![1];
  const start = html.indexOf(open);
  let depth = 0, i = start;
  const re = new RegExp(`</?${tag}\\b`, 'gi');
  re.lastIndex = start;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[0][1] === '/' ? -1 : 1;
    i = re.lastIndex;
    if (depth === 0) break;
  }
  return html.slice(start, i);
}

const GENERIC = /^<(?:div|span|li|p)\b/i;
const inScope = [...targets.keys()].filter((id) => {
  const tag = openTag(id);
  return !!tag && GENERIC.test(tag) && !/\stabindex=/.test(tag);
}).sort();

console.log(`  ..   ${targets.size} click-wired ids; ${inScope.length} of them declared as a generic tag: ${inScope.join(', ') || '(none)'}`);
// VACUITY GUARD: a loop that asserts nothing is indistinguishable from a loop that passes. Two of these
// chips exist today (#app-title, #me-prestige) plus the #fulltime-card backdrop; if the count ever falls to
// zero the class has moved and this probe wants rewriting, not silently retiring.
ok(inScope.length >= 2, 'there are generic-tag click targets to check (this is not measuring an empty set)');

for (const id of inScope) {
  const { handle, body } = targets.get(id)!;
  const esc = handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const armed = new RegExp(`makeActivatable\\(\\s*\\[[^\\]]*${esc}[^\\]]*\\]`).test(body);
  // Exemption (b): the click is a convenience on a container whose real control is focusable inside it.
  const inner = subtree(id).slice(openTag(id)!.length);
  const child = (inner.match(/<button\b[^>]*\sid="([\w-]+)"|<a\b[^>]*\shref=|[^>]*\stabindex="0"/) ?? [null])[0];
  ok(armed || !!child,
     `#${id} (a generic ${openTag(id)!.match(/^<(\w+)/)![1]} with a click) has a keyboard path`
     + (armed ? ` — makeActivatable via \`${handle}\`` : child ? ` — a focusable child: ${child.slice(0, 46)}` : ''));
}

console.log(fails ? `\n✗ ${fails} — a click target on screen can only be reached with a mouse`
                  : '\n✓ every non-button click target has a keyboard path');
if (fails) process.exitCode = 1;
