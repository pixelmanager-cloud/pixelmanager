// ── WHAT THE FAMILY BUILT MUST SURVIVE THE HANDOVER ──────────────────────────────────────────────────
// The succession used to call clearMgr() — a blanket localStorage removeItem — so every generation threw
// the dynasty away. Measured over 20 generations before the fix: the club fell from tier 1 back to tier 9
// at ALL 19 successions, and titles, continental/World-Finals wins, hired staff, arcPrestige, clubLegacy,
// arcFired, arcTags and lastRankIdx went with it. Three comments in main.ts promise the opposite, and the
// succession handler's own spread — "what the family built is the whole point of the game and carries" —
// was spreading an object clearMgr had just emptied.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level. That is cruder than a behavioural test and it is what is actually available; it catches
// the exact regression that shipped, which a green verify did not.
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// PARSED, NOT SLICED. Every window below was a fixed byte count from a string index, and a mutation pass
// walked straight through them: it restored the `clearMgr()` dynasty wipe — resetting titles, continental
// and World-Finals wins, staff, arcPrestige, clubLegacy, arcTags and lastRankIdx at every succession — and
// pushed the additions past the 2,200-byte window with a comment. This probe printed
// `ok resetMgrForHeir carries \`titles\` across the handover` for all eight. It also passed with the real
// `arcFired: []` reset deleted and replaced by `// arcFired: [] — reinstate later`, which is the
// arc-library-runs-dry defect laundered by a comment.
//
// The method is ~1,900 bytes today against a 2,200-byte window: 300 bytes of headroom on a file that grows
// comments faster than any other in the repo.
const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);

/** The body TEXT of a named class method — its own body, not the bytes that follow it. */
function methodBody(name: string): string {
  let found = '';
  const visit = (n: ts.Node): void => {
    if (found) return;
    if ((ts.isMethodDeclaration(n) || ts.isFunctionDeclaration(n)) && n.name && ts.isIdentifier(n.name)
      && n.name.text === name && n.body) { found = n.body.getText(ast); return; }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return found;
}

/** The property names actually SET in the object literal `resetMgrForHeir` writes back. */
function resetKeys(): { keys: Set<string>; emptied: Set<string> } {
  const keys = new Set<string>(); const emptied = new Set<string>();
  let lit: ts.ObjectLiteralExpression | undefined;
  const visit = (n: ts.Node): void => {
    if (lit) return;
    if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.name.text === 'resetMgrForHeir' && n.body) {
      const seek = (m: ts.Node): void => {
        if (lit) return;
        if (ts.isObjectLiteralExpression(m)) { lit = m; return; }
        ts.forEachChild(m, seek);
      };
      seek(n.body);
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  for (const p of lit?.properties ?? []) {
    if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue;
    keys.add(p.name.text);
    const init = p.initializer.getText(ast).replace(/\s/g, '');
    if (init === '[]') emptied.add(p.name.text);
  }
  return { keys, emptied };
}
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// 1. the succession path must not blanket-wipe the manager save
const succBody = methodBody('bringThroughHeir');
check(!/\bthis\.clearMgr\(\)/.test(succBody),
  'the succession does not call clearMgr() — it resets the season, not the dynasty');

// 2. the reset must PRESERVE every field the dynasty accumulates
const reset = methodBody('resetMgrForHeir');
const { keys: resetSets, emptied: resetEmptied } = resetKeys();
check(/\.\.\.prior/.test(reset), 'resetMgrForHeir spreads the prior state rather than replacing it');
for (const field of ['titles', 'contTitles', 'wcWins', 'staff', 'arcPrestige', 'clubLegacy', 'arcTags', 'lastRankIdx']) {
  // a preserved field must NOT appear as an explicit reset key inside the object literal
  check(!resetSets.has(field), `resetMgrForHeir carries \`${field}\` across the handover`);
}

// 3. `founding` must not be derived from the very state the reset produces
const found = src.slice(src.indexOf('const founding ='), src.indexOf('const founding =') + 200);
check(!/prior\.starId\s*==\s*null/.test(found) && !/prior\.season/.test(found),
  'founding is not derived from starId/season — the exact state a succession leaves behind');
const everF = src.slice(src.indexOf('let everFounded'), src.indexOf('let everFounded') + 900);
check(/fm_starttier_/.test(everF),
  'founding keys off fm_starttier_, which is written once and outlives the handover');
// ...and on `fm_tier_` as well. `fm_starttier_` did not exist in any save written before it was added, so
// keying on it ALONE reads an established club with a climbed tier as a founding one and re-baselines it to
// the bottom of the pyramid — reproduced at tier 1 -> tier 8, the exact defect the key exists to prevent.
check(/fm_tier_/.test(everF),
  'founding also accepts fm_tier_ as evidence of a founding that predates the fm_starttier_ key');

// 4. THE SEEN-LISTS MUST **NOT** CARRY — the mirror of check 2, and the more dangerous direction.
// `arcFired` is this career's seen-list and `pickManagerArc` filters on it, so carrying it spends the
// 819-arc manager library once across the whole dynasty: measured at the shipped pacing, 50 arcs a
// generation until generation 12, then 19, then from generation 19 onward zero arcs, permanently.
// `feedFired`'s keys are season-scoped (`intake:${season}`) and the season resets to 1, so carrying that
// suppresses every heir's first youth-intake line.
for (const field of ['arcFired', 'feedFired']) {
  check(resetEmptied.has(field), `resetMgrForHeir RESETS \`${field}\` — a seen-list is scoped to the career, not the bloodline`);
}

console.log(fails ? `\n✗ ${fails} succession-carry check(s) failed — a generation would lose what the family built` : '\n✓ the dynasty survives the handover');
if (fails) process.exit(1);
