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
//   `#sf-teamsheet` — a Team Sheet button added to a two-button row whose only sizing rule named the OTHER
//   button's id, so one decision pair rendered in two typefaces, at two sizes, at two heights.
//
// Four checks, because the failure modes are different: a class with NO rule anywhere; a class whose every
// rule demands an ancestor; a rule scoped to an id the class can never sit inside (`#trophies .tm-crest`,
// where .tm-crest is only ever emitted into the transfer-market overlay); and a button row whose sizing rule
// reaches one sibling and not the next. The
// second is approximate — it flags a class as at-risk when all of its rules are descendant selectors, and
// requires the emitting file to also emit at least one of the ancestors somewhere. That is weaker than a
// real cascade resolution and it is what a static probe can honestly do. The third asserts where the id
// scan in §3 can only report, because it needs no opinion about whether an id deserves a rule of its own:
// the sibling standing beside it in the same row supplies the answer.
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

// ── 4. an id-scoped rule must be able to REACH the class it scopes ────────────────────────────────────
// `#trophies .tm-crest { color: var(--gold); }` — the crown chip beside a rival house's son. `.tm-crest`
// has one emit site, renderTransferMarket, and that market is an overlay the code appends to
// document.body, so it is never a descendant of #trophies and the rule cannot fire. Checks 1 and 2 both
// wave it through: the class IS declared, and an unscoped rule already paints the chip, so the screen
// looks right. The dead line only reads as if the hall recolours the crown, so the next edit to that
// colour lands where nothing can see it — the same decoy shape as the four dead `transition: width`s.
//
// Reachability, approximately: the class is inside #ID if the static markup already puts it there, or if
// a method that emits it also names #ID — or is called by a method that does. One hop of call graph and
// no more. Two blind spots, and both SKIP rather than assert, because a check that guesses here would be
// worse than none:
//   - a class attribute built from a variable (`class="${cls}"` — the whole .cm-* ticker family) has no
//     visible emit site, so those pairs are counted and printed, never failed;
//   - emitters are looked for in main.ts only, as everywhere else in this file.
const markup = html.slice(styleEnd);
// The static subtree of an id: from its opening tag to the matching close, by tag depth.
const subtreeOf = (id: string): string => {
  const at = markup.indexOf(`id="${id}"`);
  if (at < 0) return '';
  const open = markup.lastIndexOf('<', at);
  const tag = markup.slice(open + 1).match(/^[a-z0-9]+/i)?.[0];
  if (!tag) return '';
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'gi'); re.lastIndex = open;
  let depth = 0, m: RegExpExecArray | null;
  while ((m = re.exec(markup))) {
    if (m[0][1] === '/') { if (--depth === 0) return markup.slice(open, m.index); } else depth++;
  }
  return markup.slice(open);
};
// Methods of `class Game`, split on the 2-space member header — the unit that owns a chunk of markup.
const gameTop = main.split('\n').findIndex((l) => l.startsWith('class Game {'));
const methods: { name: string; body: string }[] = [];
for (const line of main.split('\n').slice(gameTop + 1)) {
  if (line === '}') break;
  const hd = line.match(/^  (?:private |public |protected )?(?:static )?(?:async )?([a-zA-Z_$][\w$]*)\s*[(<]/);
  if (hd) methods.push({ name: hd[1], body: '' });
  if (methods.length) methods[methods.length - 1].body += line + '\n';
}
ok(gameTop > 0 && methods.length > 100, `class Game split into ${methods.length} methods (a failed split makes the check below vacuous)`);
const emitsCls = (body: string, c: string) => new RegExp(`class="[^"]*\\b${c}\\b`).test(body)
  || body.includes(`classList.add('${c}'`) || body.includes(`classList.toggle('${c}'`);
const namesId = (body: string, id: string) => body.includes(`'${id}'`) || body.includes(`'${id}-`) || body.includes(`"${id}`);

const scoped: [string, string][] = [];
for (const m of css.matchAll(/([^{}]+)\{[^}]*\}/g)) {
  const sel = m[1].trim(); if (!sel || sel.startsWith('@')) continue;
  for (const part of sel.split(','))
    for (const mm of part.matchAll(/#([a-z][a-z0-9-]*)[^,]*?\s\.([a-z][a-z0-9-]*)/gi)) scoped.push([mm[1], mm[2]]);
}
let idChecked = 0, idBlind = 0;
const unreachable: string[] = [];
const seenPair = new Set<string>();
for (const [id, cls] of scoped) {
  if (seenPair.has(`${id} ${cls}`)) continue; seenPair.add(`${id} ${cls}`);
  if (emitsCls(subtreeOf(id), cls)) continue;                       // index.html already puts it there
  const from = methods.filter((mm) => emitsCls(mm.body, cls));
  if (!from.length) { idBlind++; continue; }                        // dynamic class string — see above
  idChecked++;
  const reaches = from.some((mm) => namesId(mm.body, id))
    || from.some((mm) => methods.some((c) => c.name !== mm.name && new RegExp(`\\b${mm.name}\\s*\\(`).test(c.body) && namesId(c.body, id)));
  if (!reaches) unreachable.push(`#${id} .${cls}  (.${cls} is emitted only in ${from.map((mm) => mm.name).join(', ')}, which never renders into #${id})`);
}
console.log(`  ..   ${seenPair.size} id-scoped rule(s), ${idChecked} with a locatable emit site, ${idBlind} skipped (class built from a variable)`);
ok(idChecked > 20, 'enough id-scoped rules had a locatable emit site to be worth asserting on');
for (const u of unreachable) ok(false, `${u} — the rule can never match`);
ok(unreachable.length === 0, 'every id-scoped rule can reach the class it scopes');

// ── 4. a button ROW sized by one sibling's id ─────────────────────────────────────────────────────────
// The id half of §3 can be asserted honestly in exactly one shape: SIBLINGS. Two buttons emitted side by
// side in one container are one decision pair, so a sizing rule that reaches one of them and not the other
// is a defect by the sheet's own arithmetic — no judgement about whether an id "deserves" a rule is needed,
// because the sibling is the oracle.
//   `.sf-tm #sf-transfers` was the season screen's only rule for its two-button row. The Team Sheet door was
//   added to that row later, matched nothing, and fell through to the base `button` rule: 18px VT323 beside
//   11px Press Start 2P, a 41px-tall box beside a 34px one, in a single pair of controls.
const SIZING = /font-family|font-size|padding|width/;
const sizingSels: string[] = [];
for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const sel = m[1].trim();
  if (!sel || sel.startsWith('@') || !SIZING.test(m[2])) continue;
  for (const one of sel.split(',')) sizingSels.push(one.trim());
}
/** A token must not end mid-name, or the row `.sf-bid` reads as styled by `.sf-bid-btns button`. */
const hits = (sel: string, token: string) => new RegExp(token.replace(/[.#]/g, '\\$&') + '(?![a-z0-9-])', 'i').test(sel);

let btnRows = 0;
const uneven: string[] = [];
for (const open of main.matchAll(/<(div|span) class="([a-z][a-z0-9- ]*)"[^>]*>/g)) {
  // Walk to the matching close tag by depth, so the buttons counted are this container's own.
  const tag = new RegExp(`</?${open[1]}\\b`, 'g');
  const from = (open.index ?? 0) + open[0].length;
  tag.lastIndex = from;
  let depth = 1, end = -1, t: RegExpExecArray | null;
  while ((t = tag.exec(main))) { if (t[0][1] === '/') { if (--depth === 0) { end = t.index; break; } } else depth++; }
  if (end < 0) continue;
  const hooks = [...main.slice(from, end).matchAll(/<button([^>]*)>/g)].map((b) => {
    const id = /id="([^"$]+)"/.exec(b[1]), cls = /class="([^"$\s]+)/.exec(b[1]);
    return id ? '#' + id[1] : cls ? '.' + cls[1] : '';
  });
  // A hookless button can only be reached by `button`, which reaches every sibling — nothing to compare.
  if (hooks.length < 2 || hooks.some((h) => !h)) continue;
  const classes = open[2].trim().split(/\s+/);
  // Covered = a sizing rule scoped to THIS container reaches the button, by its own hook or by naming
  // `button`. A rule scoped to an inner wrapper reads as uncovered for every sibling alike, so it stays
  // silent: this asks only that a row treat its own buttons the same, never that a row be styled at all.
  const covered = hooks.map((h) => sizingSels.some((s) =>
    classes.some((c) => hits(s, '.' + c)) && (hits(s, h) || /(^|\s)button(?![a-z0-9-])/.test(s))));
  btnRows++;
  if (new Set(covered).size > 1)
    uneven.push(`.${classes.join('.')} sizes ${hooks.filter((_, i) => covered[i]).join(' ')} but not `
      + `${hooks.filter((_, i) => !covered[i]).join(' ')}, which falls through to the base button rule`);
}
console.log(`  ..   ${btnRows} emitted button row(s) with 2+ hooked buttons, ${uneven.length} sized unevenly`);
ok(btnRows >= 8, 'the row scan found rows to compare (a broken scan would make the check below vacuous)');
for (const s of uneven) ok(false, s);
ok(uneven.length === 0, 'no button row sizes one of its buttons and not its siblings');

console.log(fails ? `\n✗ ${fails} — markup emits a hook that cannot style anything` : '\n✓ every emitted class can reach a rule');
if (fails) process.exitCode = 1;
