// A <title> INSIDE A role="img" IS A <title> NOBODY HEARS.
//
// The Family Record is the screen the whole dynasty fantasy is displayed on, and it writes a per-man
// <title> for every medallion — "Tom Ashcombe — Bill's boy · Golden Boot (S4, 22) · the bloodline has
// produced a full international". The <svg> wrapped around all of them carried `role="img"`, and ARIA's
// img role is Children Presentational: the whole subtree is stripped from the accessibility tree. So not
// one of those titles reached a screen reader, and the entirety of what a reader was told about four
// generations of the family was the single sentence on the svg itself. The file asserted the opposite in
// two comments — "`<title>` is the SVG tooltip AND what a screen reader announces for the node" — which is
// how it survived: the code documented the behaviour it did not have.
//
// THE RULE HELD HERE: a <title> names the element it is a child of, and that name only survives if no
// ancestor ABOVE that element is Children Presentational. So the medallion group may carry role="img" —
// the title is naming it — and the <svg> holding every medallion may not.
//
// This is a source scan, resolved by hand for this one renderer: `medallions` is built in one statement
// and spliced into the <svg> in another, so no purely textual "nearest enclosing tag" walk gets the
// ancestry right. That is weaker than a real accessibility-tree computation and it is what a static probe
// can honestly do.
//
// MUTATION TEST — each of these must turn a line below red: put `role="img"` back on the <svg>; drop
// `aria-label=` from the medallion group; delete the <title>. Every check echoes the exact tag text it
// matched on a `..` line, so a check that matched nothing shows up in the log instead of passing as a
// green tick over an empty string.
//
// Run: `npx tsx tools/playtest/family_record_a11y.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The Family Record names every man on it ===');

// Locate the renderer first. Every check below measures inside this span, so if it is ever renamed or
// moved the probe goes red here rather than quietly scanning an empty string and reporting all-green.
const start = src.indexOf('private async renderFamilyTree(');
const tail = start >= 0 ? src.slice(start + 1) : '';
const endRel = tail.search(/\n  (?:private|public|\/\*\*)/);
const body = start >= 0 ? tail.slice(0, endRel > 0 ? endRel : tail.length) : '';
console.log(`  ..   renderFamilyTree body: ${body.length} chars`);
ok(body.length > 2000, 'renderFamilyTree was located (this is not scanning an empty string)');

// 1 — the thing being made audible has to still be there. Delete the <title> and every check after this
//     one could pass over nothing at all.
const title = body.match(/<title>([^<]*)<\/title>/);
const titleExpr = title ? title[1] : '';
console.log(`  ..   per-man <title> emits: ${titleExpr || '(none)'}`);
ok(!!title && titleExpr.includes('${'), "each medallion still writes a <title> built from that man's own record");

// 2 — THE DEFECT. role="img" on the tree's <svg> is Children Presentational: it deletes every medallion,
//     name, honour and cap line below it from the accessibility tree.
const svg = body.match(/<svg [^`]*?>/);
console.log(`  ..   .fr-svg opens: ${svg ? svg[0] : '(none)'}`);
ok(!!svg && /class="fr-svg"/.test(svg[0]), "the tree's <svg> open tag was located");
ok(!!svg && !/role="img"/.test(svg[0]), 'the <svg> holding every medallion is NOT role="img" — that role strips the whole subtree');
ok(!!svg && /aria-label="/.test(svg[0]), 'the <svg> still names itself, for a reader who skips past the tree');

// 3 — and the name has to land somewhere. Each man's group carries its own role + label, which is the
//     pattern paintCoins already uses: a bare aria-label on a role=generic element is dropped by browsers.
const node = body.match(/<g class="fr-in"[^`]*?>/);
console.log(`  ..   each man's group opens: ${node ? node[0] : '(none)'}`);
ok(!!node, 'the group each man is drawn in was located');
ok(!!node && /role="img"/.test(node[0]), "each man's group carries role=\"img\", so it is an image with a name of its own");
ok(!!node && /aria-label="\$\{/.test(node[0]), "each man's group carries an aria-label built from his own record, not a constant");

// 4 — the tooltip and the spoken name must come off the SAME string, or a later edit improves one and
//     leaves the other behind and nobody notices for months.
const ariaExpr = node ? (node[0].match(/aria-label="\$\{([^}]*)\}"/) ?? [])[1] : undefined;
const idents = (s: string) => [...s.matchAll(/[A-Za-z_$][\w$]*/g)].map((m) => m[0]);
const shared = ariaExpr ? idents(ariaExpr).filter((i) => idents(titleExpr).includes(i)) : [];
console.log(`  ..   tooltip <- "${titleExpr}"   label <- "${ariaExpr ?? '(none)'}"   shared: [${shared.join(', ')}]`);
ok(shared.length > 0, 'the spoken name is built from the same text the tooltip shows — the two cannot drift apart');

console.log(`  ..   main.ts writes role="img" into ${[...src.matchAll(/role="img"/g)].length} tag(s) in all`);
console.log(fails ? `\n✗ ${fails} problem(s) — the Family Record announces a tree and names nobody on it` : '\n✓ every man on the Family Record has a name a screen reader can reach');
if (fails) process.exitCode = 1;
