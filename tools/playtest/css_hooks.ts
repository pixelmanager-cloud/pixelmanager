// A CLASS IN THE MARKUP MUST BE ABLE TO STYLE SOMETHING.
//
// This project keeps producing the same defect: markup emits a class as a styling hook and the stylesheet
// either never defines it, or defines it only under a parent the element does not have. Nothing fails. The
// element quietly inherits whatever rule happens to reach it, and the screen looks *plausible*, so it
// survives review.
//
//   `.tac-toggle` — never defined at all, so both instruction checkboxes fell through to a rule written for
//   caption-above-a-select rows and stacked their label on top of the box.
//   `.cg-cname` / `.cg-cdescr` on the heir cards — defined four times, every one of them scoped to a parent
//   the heir card does not have, so the screen where you choose which son carries the family name rendered
//   his name, temperament and family trait in the browser default.
//
// Two checks, because the two failure modes are different: a class with NO rule anywhere, and a class whose
// every rule demands an ancestor. The second is approximate — it flags a class as at-risk when all of its
// rules are descendant selectors, and requires the emitting file to also emit at least one of the ancestors
// somewhere. That is weaker than a real cascade resolution and it is what a static probe can honestly do.
//
// Run: `npx tsx tools/playtest/css_hooks.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const main = readFileSync('client/src/main.ts', 'utf8');
const html = readFileSync('client/index.html', 'utf8');

console.log('=== Every class the markup emits can be styled ===');

const styleStart = html.indexOf('<style');
const styleEnd = html.lastIndexOf('</style>');
// STRIP COMMENTS FIRST. A rule preceded by a comment has that comment swallowed into the "selector" half of
// any brace-matching scan, and this file comments almost every non-obvious rule — so skipping selectors that
// begin with `/*` silently discarded a large share of the stylesheet. The first run of this probe reported
// that the heir-card rule added minutes earlier did not exist, because a four-line comment sat above it.
const css = html.slice(styleStart, styleEnd).replace(/\/\*[\s\S]*?\*\//g, ' ');
const cssWithComments = html.slice(styleStart, styleEnd);
ok(styleStart > 0 && styleEnd > styleStart, 'the stylesheet was located (this is not measuring an empty set)');

// Classes the code emits into markup.
// STRIP THE TEMPLATE EXPRESSIONS BEFORE SPLITTING, not after. The first version matched the attribute with
// `[^"$]*` and then cleaned each whitespace-separated part — so in `class="cg-heir-card new-hook${on ? ' on'
// : ''}"` the split produced the fragment `new-hook${on`, which no longer looked like a class name and was
// dropped. Every class sitting immediately before a `${...}` was invisible to this probe, which is most of
// the interesting ones. A mutation adding a brand-new undefined class went straight through it.
const emitted = new Set<string>();
for (const m of main.matchAll(/class="([^"]*)"/g)) {
  const cleaned = m[1].replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ');
  for (const part of cleaned.split(/\s+/)) {
    const c = part.trim();
    if (/^[a-z][a-z0-9-]{2,}$/i.test(c)) emitted.add(c);
  }
}
// …plus the ones the stylesheet itself declares, so we can tell "absent" from "present but unreachable".
const declared = new Map<string, string[]>();
for (const m of css.matchAll(/([^{}]+)\{[^}]*\}/g)) {
  const sel = m[1].trim();
  if (!sel || sel.startsWith('@')) continue;
  for (const c of sel.matchAll(/\.([a-z][a-z0-9-]*)/gi)) {
    const list = declared.get(c[1]) ?? [];
    list.push(sel);
    declared.set(c[1], list);
  }
}
console.log(`  ..   ${emitted.size} class(es) emitted from main.ts, ${declared.size} declared in the stylesheet`);
ok(emitted.size > 50 && declared.size > 50, 'both sides parsed (a broken scan would make every check below vacuous)');

// ── 1. a class with no rule anywhere ──────────────────────────────────────────────────────────────────
// Some classes are behaviour-only hooks the code queries rather than styles; those are legitimate, and are
// listed rather than silently tolerated.
// Each entry is a class the markup emits with no rule of its own, and a REASON. Three kinds live here:
//   structural — a grid child or an SVG transform container, laid out entirely by its parent;
//   modifier   — sits on an already-styled base class, so the element renders correctly and the modifier
//                is simply inert (a hook someone intended to style and did not);
//   (An entry that later GAINS a rule fails as stale — the list must not outlive its reasons; .hidden was
//   in the first draft of it and was removed within a minute for exactly that.)
//   pending    — a standalone container that really does render unstyled, logged for a design pass in
//                docs/decisions-for-ck.md rather than guessed at here.
// A class NOT in this list and not in the stylesheet fails, which is the point: new orphans are caught.
const BEHAVIOUR_ONLY = new Map<string, string>([
  ['season-fixtures', 'structural: a grid child of .season-cols, which lays it out'],
  ['season-table-wrap', 'structural: a grid child of .season-cols, which lays it out'],
  ['fr-honours', 'structural: an SVG <g> carrying only a transform; its children are styled'],
  ['bill', 'modifier on .sq-row — inert, base renders correctly (design pass pending)'],
  ['sf-wc-done', 'modifier on .sf-wc — inert, base renders correctly (design pass pending)'],
  ['ft-star', 'modifier on .scorers — inert, base renders correctly (design pass pending)'],
  ['scout-board', 'structural: wraps .scout-intro and .scout-cands, both of which carry their own plate — a rule here would double-plate them'],
]);
const orphans = [...emitted].filter((c) => !declared.has(c) && !BEHAVIOUR_ONLY.has(c) && !cssWithComments.includes(c));
// The allowlist must not rot into a dumping ground: every entry has to still be a real orphan, or it is
// stale and hiding the fact that someone styled it properly.
const stale = [...BEHAVIOUR_ONLY.keys()].filter((c) => declared.has(c));
for (const c of stale) ok(false, `'.${c}' is allowlisted as unstyled but now HAS a rule — remove it from the list`);
console.log(`  ..   ${BEHAVIOUR_ONLY.size} class(es) declared unstyled on purpose, ${stale.length} of them stale`);
console.log(`  ..   ${orphans.length} emitted class(es) with no rule in the stylesheet`);
for (const c of orphans.slice(0, 12)) ok(false, `'.${c}' is emitted as a styling hook and defined nowhere`);
ok(orphans.length === 0, 'no emitted class is undefined');

// ── 2. the specific families that shipped broken ──────────────────────────────────────────────────────
// Every rule for these is a descendant selector, so a new card type must be added to the selector list or
// it renders unstyled — which is exactly what happened to the heir cards.
for (const cls of ['cg-cname', 'cg-cdescr']) {
  const rules = declared.get(cls) ?? [];
  const allScoped = rules.length > 0 && rules.every((r) => /\.\S+\s+\.\S/.test(r));
  console.log(`  ..   .${cls}: ${rules.length} rule(s), all parent-scoped: ${allScoped}`);
  if (!allScoped) continue;
  ok(rules.some((r) => r.includes('.cg-heir-card')),
     `.${cls} reaches the heir cards, which emit it (every rule for it demands an ancestor)`);
}

// ── 3. IDs, which the class scan cannot see ───────────────────────────────────────────────────────────
// `#me-coins` — the hub's coin balance, the number the player checks before every purchase — had no rule
// anywhere, so it rendered at the 22px body default beside readouts at 17px and 15px, and as a block on its
// own line. An ID is a styling hook exactly like a class; nothing was looking at them.
const ids = new Set<string>();
for (const m of main.matchAll(/id="([a-z][a-z0-9-]{2,})"/gi)) ids.add(m[1]);
for (const m of html.matchAll(/id="([a-z][a-z0-9-]{2,})"/gi)) ids.add(m[1]);
// REPORTED, NOT ASSERTED — deliberately. Most unstyled ids are legitimate JS handles, and I cannot tell
// those apart from a readout that needs a rule without knowing whether the element renders visible text. An
// assertion I cannot make honestly would be a green light that means nothing, which is the failure mode
// this whole probe exists to catch. The number is printed so a person can look when it moves.
const styledIds = [...ids].filter((i) => cssWithComments.includes(`#${i}`));
console.log(`  ..   ${ids.size} id(s) in the markup, ${styledIds.length} referenced by the stylesheet (informational — not asserted)`);

console.log(fails ? `\n✗ ${fails} — markup emits a hook that cannot style anything` : '\n✓ every emitted class can reach a rule');
if (fails) process.exitCode = 1;
