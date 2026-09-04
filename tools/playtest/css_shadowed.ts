// A RULE THAT DECLARES SOMETHING MUST BE ABLE TO WIN SOMETHING.
//
// css_hooks.ts next door asks whether an emitted class can reach a rule at all. This asks the same question
// one step further down the cascade, which is where the last of them hid: the class reaches a rule, the rule
// declares real values, and every one of them is overruled on every element that carries it.
//
//   `.cg-arc-story { font-size: 16px; line-height: 1.5; }` — the story-arc prose, the one place the game
//   sets a branching storyline beat apart from a routine turn. Its only emit site is
//   `<div class="cg-scenario cg-arc …"> … <div class="cg-story cg-arc-story">`, so the element always carries
//   `.cg-story` and always sits inside `.cg-scenario`. `.cg-scenario .cg-story` is 0,2,0 against the bare
//   class's 0,1,0 and declares both of the same properties, so arc prose rendered at the routine 17px and
//   the 16px was never once on screen. Nothing LOOKS wrong, which is the whole problem: the line only reads
//   as if arc prose were sized apart, so the next author to touch that size edits a line the browser has
//   never used — the same decoy shape as the four dead `transition: width` rules in bar_transition.ts.
//
// HOW IT DECIDES, AND WHERE IT REFUSES TO. Ancestry is read one SOURCE LINE at a time, and only from a line
// whose tags balance by the end of it — the screens are built from big single-line template literals, so
// that covers most of the markup and it is a hard relation rather than a guess. Elements on lines that do
// not balance are counted and dropped, never assumed. Selectors that are not class-only (`:hover`, ids,
// element names, attribute selectors) are ignored on BOTH sides: as victims, so nothing is judged that this
// file cannot resolve, and as overrulers, so a "dead" verdict is only ever reached from rules it fully
// understands. @media blocks are stripped for the same reason — `animation: none` under
// `prefers-reduced-motion` outranks the animation it disables, and is not supposed to lose. Properties are
// compared by exact name, so a shorthand never counts as beating a longhand.
//
// Every one of those skips can only make this report FEWER dead rules, never more, so the counts printed
// below are the honest size of what it did look at, and a false alarm names a single source line a person
// can check in seconds.
//
// MUTATION-TESTED, because a probe over an empty set is worse than none: deleting the `.cg-arc-story` rule
// turns it green; injecting a fresh `.cg-story { font-size: 12px; color: hotpink; }` above the scoped rule
// turns it red again on a different family. The three `..` counts are asserted for the same reason — a parse
// that silently produced nothing would otherwise report a clean sheet.
//
// Run: `npx tsx tools/playtest/css_shadowed.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const main = readFileSync('client/src/main.ts', 'utf8');

console.log('=== No stylesheet rule is overruled on every element that carries it ===');

const styleStart = html.indexOf('<style');
const styleEnd = html.lastIndexOf('</style>');
ok(styleStart > 0 && styleEnd > styleStart, 'the stylesheet was located (this is not measuring an empty set)');
// Comments first — a rule preceded by one has it swallowed into the "selector" half of a brace scan, and
// this stylesheet comments almost every non-obvious rule (css_hooks.ts learned that the hard way).
let css = html.slice(styleStart, styleEnd).replace(/\/\*[\s\S]*?\*\//g, ' ');
// At-blocks: their inner rules are either not cascade-comparable here (@media) or not rules at all.
css = css.replace(/@(?:keyframes|font-face|supports|media)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, ' ');

/** One selector out of one rule: its own source position, and which properties it sets. */
type Rule = { sel: string; order: number; decls: Map<string, boolean> };
const rules: Rule[] = [];
let order = 0;
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selList = m[1].trim();
  if (!selList || selList.startsWith('@')) continue;
  const decls = new Map<string, boolean>();
  for (const d of m[2].split(';')) {
    const c = d.indexOf(':');
    if (c < 0) continue;
    const prop = d.slice(0, c).trim().toLowerCase();
    if (/^[a-z-]+$/.test(prop)) decls.set(prop, /!\s*important/.test(d));
  }
  // A selector list is n independent rules sharing a body, and they can differ in specificity.
  for (const one of selList.split(',')) {
    const sel = one.trim().replace(/\s+/g, ' ');
    if (sel) rules.push({ sel, order: order++, decls });
  }
}
const CLASS_ONLY = /^\.[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*(?: \.[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*)*$/i;
const solvable = rules.filter((r) => CLASS_ONLY.test(r.sel) && r.decls.size > 0);
console.log(`  ..   ${rules.length} rule(s) parsed, ${solvable.length} of them class-only with a body`);
ok(rules.length > 800 && solvable.length > 400, 'the stylesheet parsed (a broken parse would make every check below vacuous)');

// ── the markup, with an ancestor chain only where one source line settles it ───────────────────────────
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source',
  'track', 'wbr', 'use', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'stop']);
type El = { classes: Set<string>; anc: Set<string>[]; line: number };
const els: El[] = [];
let droppedLines = 0, droppedEls = 0;
main.split('\n').forEach((text, li) => {
  const stack: { tag: string; classes: Set<string> }[] = [];
  const here: El[] = [];
  let balanced = true;
  for (const t of text.matchAll(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const tag = t[2].toLowerCase(), attrs = t[3];
    if (t[1] === '/') {
      let at = -1;
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { at = i; break; }
      if (at < 0) { balanced = false; break; }   // closes something opened on an earlier line
      stack.length = at;
      continue;
    }
    const cm = /class="([^"]*)"/.exec(attrs);
    const classes = new Set<string>();
    // `class="cg-heir-card${on ? ' on' : ''}"` — strip the expression before splitting, or the class before
    // it is read as `cg-heir-card${on` and vanishes. css_hooks.ts has the same note for the same reason.
    if (cm) for (const p of cm[1].replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ').split(/\s+/))
      if (/^[a-z][a-z0-9-]{1,}$/i.test(p)) classes.add(p);
    if (cm) here.push({ classes, anc: stack.map((s) => s.classes), line: li + 1 });
    if (!VOID.has(tag) && !/\/$/.test(attrs)) stack.push({ tag, classes });
  }
  if (!here.length) return;
  // Only a line that opens and closes everything it started is a fragment whose nesting is knowable from
  // the line alone. Anything else leaves a phantom ancestor, which would invent overruling rules.
  if (!balanced || stack.length) { droppedLines++; droppedEls += here.length; return; }
  els.push(...here);
});
console.log(`  ..   ${els.length} emitted element(s) with a settled ancestor chain, ${droppedEls} dropped from ${droppedLines} line(s) whose tags span lines`);
ok(els.length > 400, 'enough markup parsed to resolve the cascade against');

/** Class-only selectors are (0,b,0); b is just how many classes it names. */
const spec = (sel: string) => (sel.match(/\./g) ?? []).length;
/** Right-to-left descendant matching: the subject compound, then each ancestor compound in order. */
const hits = (sel: string, el: El): boolean => {
  const parts = sel.split(' ');
  if (!parts[parts.length - 1].slice(1).split('.').every((c) => el.classes.has(c))) return false;
  let ai = el.anc.length - 1;
  for (let pi = parts.length - 2; pi >= 0; pi--) {
    const need = parts[pi].slice(1).split('.');
    let found = false;
    while (ai >= 0) { const a = el.anc[ai--]; if (need.every((c) => a.has(c))) { found = true; break; } }
    if (!found) return false;
  }
  return true;
};

const dead: string[] = [];
let checked = 0, unmatched = 0;
for (const r of solvable) {
  const on = els.filter((e) => hits(r.sel, e));
  // No element to resolve against: that is css_hooks.ts's question, not this one.
  if (!on.length) { unmatched++; continue; }
  checked++;
  let winsSomething = false;
  const lost: string[] = [];
  for (const el of on) {
    const rivals = solvable.filter((o) => o !== r && hits(o.sel, el));
    for (const [prop, important] of r.decls) {
      const beater = rivals.find((o) => {
        const oi = o.decls.get(prop);
        if (oi === undefined) return false;
        if (oi !== important) return oi;                          // !important wins outright
        return spec(o.sel) > spec(r.sel) || (spec(o.sel) === spec(r.sel) && o.order > r.order);
      });
      if (!beater) winsSomething = true; else lost.push(`${prop} loses to '${beater.sel}'`);
    }
    if (winsSomething) break;
  }
  if (!winsSomething)
    dead.push(`'${r.sel}' is overruled on every element that carries it (client/src/main.ts:${on[0].line}) — ${[...new Set(lost)].join('; ')}`);
}
console.log(`  ..   ${checked} rule(s) had an element to resolve against, ${unmatched} had none (css_hooks.ts owns those)`);
ok(checked > 200, 'enough rules had a matching element to be worth asserting on');
for (const d of dead) ok(false, d);
ok(dead.length === 0, 'every rule wins at least one of its own declarations somewhere');

console.log(fails ? `\n✗ ${fails} — the stylesheet declares values the cascade never uses` : '\n✓ no rule is a decoy: each one the markup reaches still wins something');
if (fails) process.exitCode = 1;
