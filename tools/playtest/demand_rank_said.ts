// ── THE MOMENT'S MAIN ASK MUST BE SAID, NOT ONLY PAINTED ─────────────────────────────────────────────
// The play phase is the game's central decision — ~120 turns a generation — and it turns on which of the
// demanded tags you answer: outcomeChipHtml grades `answeredAsk` as '🎯 Right card' and `matchedAsk` as
// '◑ Partial match'. The moment's PRIMARY demand pill was separated from the secondary ones by exactly one
// thing: `.cg-dtag { background: var(--warn) }` vs `.cg-dtag.primary { background: var(--good) }` — #ecbe4d
// against #43d38c, plus a 15%-white inset ring that carries nothing and is invisible to AT. The pill text
// was the bare tag word in both cases; the rank lived in a class and in a `title` on a non-focusable span.
// Worse, the hint beside them made the dependency explicit in authored copy — "green is the best match,
// amber also helps" — with the words "green" and "amber" themselves tinted. A red/green-deficient player or
// a screen-reader player was instructed to read the one channel he does not have. (F-134 league zones, F-136
// deal length and F-166 heir choice were the same defect; this was the highest-traffic instance.)
//
// The pills are sorted descending by weight before rendering, so the rank was always in the DOM order — the
// fix is to SAY it. Two assertions, deliberately tied to each other: the pill must print a rank word of its
// own, and the hint must name that exact word instead of a colour. Colour is welcome as reinforcement; this
// probe only refuses to let it be the only channel.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level, like heir_signal.ts next door. PARSED, NOT SLICED: the method body comes from the
// TypeScript AST, so a fixed byte window cannot drift off the end as comments grow.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - put back `>${t}</span>` (drop the rank words)     -> checks 3 and 4 FAIL (3 finds no rank word, and
//     4 is guarded on markers.length so it cannot pass vacuously over an empty marker list)
//   - name a colour in the hint again ("green"/"amber") -> check 5 FAILs
//   - change the pill word without changing the hint    -> check 4 FAILs (they are cross-checked)
//   - delete `.cg-dtag.primary` from the stylesheet     -> check 2 FAILs
//   - rename renderCareer, or move the pills out of it  -> check 1 FAILs and the run stops there, which is
//     the point: check 5 is a negative that would sail through an empty string.
//
// Run: `npx tsx tools/playtest/demand_rank_said.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const htmlPath = fileURLToPath(new URL('../../client/index.html', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);

let fails = 0;
const check = (ok: boolean, msg: string) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };

/** The method's own body text, from the AST — not a byte window off a string index. */
function methodNode(name: string): ts.MethodDeclaration | undefined {
  let found: ts.MethodDeclaration | undefined;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.name.text === name && n.body) {
      found = n; return;
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return found;
}

console.log('=== The moment says which demand is the main ask ===');

// 1. ANTI-VACUITY GATE. Checks 3-5 read substrings out of this body; two of them are negatives that would
//    sail straight through an empty string. So the body has to be found and has to still be the screen this
//    probe is about before anything else is allowed to report.
const node = methodNode('renderCareer');
const body = node?.body ? node.body.getText(ast) : '';
console.log(`  ..   renderCareer body: ${body.length} bytes from the AST`);
check(body.length > 500 && body.includes('cg-dtag') && body.includes('demandHint') && body.includes('cg-demand-lbl'),
  'renderCareer was found and still renders the demand pills and their legend');
if (!body.includes('cg-dtag') || !body.includes('demandHint')) {
  console.log('\n✗ nothing to check — the demand pills or their legend have moved out of renderCareer');
  process.exit(1);
}

// 2. The colour cue this probe exists because of stays — it is fine, and wanted, as REINFORCEMENT. What is
//    not fine is it being the only channel, which is what checks 3-5 are for.
const css = readFileSync(htmlPath, 'utf8');
const primaryRule = css.match(/\.cg-dtag\.primary\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
console.log(`  ..   the rule that paints the primary pill: ${primaryRule}`);
check(/\.cg-dtag\.primary\s*\{/.test(css), 'the primary pill is still painted for sighted players');

// 3. The rank is in the pill's OWN TEXT. Scoped to the span's inner content — the class and the `title` are
//    stripped off first, because a rank that lives in a tooltip on a non-focusable span is not a channel.
const pill = body.match(/`<span class="cg-dtag[\s\S]*?<\/span>`/)?.[0] ?? '';
const inner = pill.replace(/^`<span[^>]*>/, '').replace(/<\/span>`$/, '');
console.log(`  ..   pill text template: ${inner || '(not found)'}`);
const markers = [...inner.matchAll(/'([^']+)'/g)].map((m) => m[1].trim()).filter(Boolean);
console.log(`  ..   rank words printed on the pill: ${markers.length ? markers.map((m) => `"${m}"`).join(', ') : '(none)'}`);
check(markers.length >= 2 && new Set(markers).size >= 2,
  'the pill prints the rank in its own text — primary and secondary read differently with the colour off');

// The legend's authored copy, from the AST: string literals only, so a class NAME containing "green" is not
// mistaken for copy that tells the player to look for green.
let hintNode: ts.VariableDeclaration | undefined;
const seekHint = (n: ts.Node): void => {
  if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === 'demandHint') hintNode = n;
  ts.forEachChild(n, seekHint);
};
seekHint(node!.body!);
const copy: string[] = [];
const collect = (n: ts.Node): void => {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n)
      || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) copy.push(n.text);
  ts.forEachChild(n, collect);
};
if (hintNode) collect(hintNode);
const words = copy.join(' ').replace(/<[^>]*>/g, ' ');   // what the player actually reads, tags removed
console.log(`  ..   legend copy (${words.trim().length} chars):${words.replace(/\s+/g, ' ')}`);

// 4. …and the legend names THAT WORDING. Positive, and guarded on markers.length so an empty marker list
//    cannot satisfy it through `[].every`. This is what stops the two halves drifting apart later.
check(markers.length >= 2 && markers.every((m) => words.includes(m)),
  'the legend names the exact words printed on the pills');

// 5. …instead of naming a colour. The defect in one line: the sentence written to explain the pills was the
//    sentence that made them unreadable without hue.
const colourWord = words.match(/\b(green|amber|red|colou?r(?:ed|s)?)\b/i)?.[0];
check(!colourWord, `the legend does not tell the player to read a colour${colourWord ? ` — found "${colourWord}"` : ''}`);

console.log(fails
  ? `\n✗ ${fails} problem(s) — which demand is the main ask is carried by hue alone`
  : '\n✓ the main ask is printed on the pill and named by the legend');
if (fails) process.exitCode = 1;
