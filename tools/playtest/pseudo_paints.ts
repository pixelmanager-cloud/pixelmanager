// A PSEUDO-ELEMENT THAT DECLARES `content` MUST BE ABLE TO PUT A PIXEL ON THE SCREEN.
//
// `content: ''` is the whole cost of admission for a `::before`/`::after` box — it makes the box exist, and
// nothing else. If the rule then declares no background, no border, no shadow and no visible text, the
// browser generates a fully transparent box and paints nothing, forever. Nothing LOOKS broken, so nothing
// gets reported; the rule just sits there reading like an implemented effect.
//
//   `#trophies .tr-trophy-ico::after { content: ''; display: block; }` — the trophy cabinet's reflection.
//   Two comments above it described "the same trophy, flipped, faded into the shelf", and the cabinet's own
//   header counted a "mirrored copy" as one of the three devices making the room feel expensive. Measured
//   with getComputedStyle(el, '::after') on the rendered cabinet it was 0px tall, transform none, background
//   none, backgroundColor transparent — it had never drawn anything, in any build, since the commit that
//   introduced it. That is the same decoy shape as the four dead `transition: width` rules in
//   bar_transition.ts and the shadowed `.cg-arc-story` in css_shadowed.ts: the next author reads a comment
//   describing a working effect plus an existing hook, and edits a rule the browser has never used.
//
// HOW IT DECIDES. Only rules that declare `content` are judged, because those are the ones claiming to
// generate a box. Declarations are UNIONED across every rule in the sheet whose selector list names the
// exact same subject — `#hud #home-name::before` gets its `content` and `width` on one line and its
// `background` on the next, and judging either line alone would be a false alarm. A rule is cleared by any
// one of: visible text (`content` is not empty/none/normal), a background, a border, a box-shadow, an
// outline, or a backdrop-filter. That list is deliberately generous: every property it does not know about
// can only make this probe report FEWER dead rules, never more, and a false alarm names one source line a
// person can check in seconds.
//
// MUTATION-TESTED, because an assertion over an empty set is worse than none. Pasting
// `.zz-mutant::after { content: ''; display: block; }` anywhere in the sheet turns it red on that selector;
// putting a `background` back on the rule it names turns it green; and a parse that silently produced
// nothing trips the two `..` floors below instead of reporting a clean sheet.
//
// Run: `npx tsx tools/playtest/pseudo_paints.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');

console.log('=== Every ::before/::after that declares content can actually paint ===');

// Comments are blanked rather than removed so the line numbers a failure prints stay true to the file.
// This sheet comments almost every non-obvious rule, and a comment ahead of a rule is otherwise swallowed
// into the selector half of a brace scan (css_hooks.ts learned that the hard way).
const css = html.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

/** One selector out of one rule: where it is, and what it declares. */
type Rule = { sel: string; line: number; decls: Map<string, string> };
const rules: Rule[] = [];
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selList = m[1].trim();
  if (!selList || selList.startsWith('@')) continue;   // @media/@keyframes preludes; their inner rules match on their own
  const line = css.slice(0, (m.index ?? 0) + m[1].length).split('\n').length;
  const decls = new Map<string, string>();
  for (const d of m[2].split(';')) {
    const c = d.indexOf(':');
    if (c < 0) continue;
    const prop = d.slice(0, c).trim().toLowerCase();
    if (/^[a-z-]+$/.test(prop)) decls.set(prop, d.slice(c + 1).trim());
  }
  // A selector list is n independent rules sharing a body, and only one of them may be a pseudo-element.
  for (const one of selList.split(',')) {
    const sel = one.trim().replace(/\s+/g, ' ');
    if (sel) rules.push({ sel, line, decls });
  }
}
console.log(`  ..   ${rules.length} selector(s) parsed out of the stylesheet`);
ok(rules.length > 800, 'the stylesheet parsed (a broken parse would make every check below vacuous)');

const isNothing = (v: string) => /^(none|normal|transparent|initial|unset|0)$/i.test(v.replace(/\s*!\s*important/i, '').trim());
/** Properties that can put ink on a generated box. Generous on purpose: a miss here is a false alarm. */
const PAINTS = /^(background|background-color|background-image|border|border-(top|right|bottom|left)(-(width|color|style))?|border-(width|color|style)|box-shadow|outline|outline-(width|color|style)|backdrop-filter)$/;

const victims = rules.filter((r) => /::(before|after)\b/.test(r.sel) && r.decls.has('content'));
console.log(`  ..   ${victims.length} pseudo-element rule(s) declare content and are judged here`);
ok(victims.length >= 10, 'enough content-declaring pseudo-elements were found to be worth asserting on');

const dead: string[] = [];
for (const v of victims) {
  // Union with every other rule naming this exact same pseudo-element: `#hud #home-name::before` is sized
  // on one line and coloured on the next, and either line alone looks like it paints nothing.
  const union = new Map<string, string>();
  for (const r of rules) if (r.sel === v.sel) for (const [p, val] of r.decls) union.set(p, val);
  const content = (union.get('content') ?? '').replace(/\s*!\s*important/i, '').trim();
  const text = !/^(''|""|none|normal)$/.test(content);
  const inks = [...union].filter(([p, val]) => PAINTS.test(p) && !isNothing(val));
  if (text || inks.length) continue;
  dead.push(`'${v.sel}' generates a transparent box and paints nothing (client/index.html:${v.line}) — `
    + `content ${content || "''"}, and none of [${[...union.keys()].join(', ')}] can put ink on it`);
}
for (const d of dead) ok(false, d);
ok(dead.length === 0, 'no ::before/::after is a decoy: each one that makes a box also fills it');

console.log(fails ? `\n✗ ${fails} — the stylesheet describes an effect the browser never draws`
  : '\n✓ every generated box has text, a background, a border, a shadow or an outline in it');
if (fails) process.exitCode = 1;
