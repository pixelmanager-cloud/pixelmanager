// THE ENGINE'S COMMENTS MUST BE TRUE ABOUT THE ENGINE'S CODE.
//
// engine.ts is the most heavily commented file in the repo, and the comments are load-bearing: they are
// where the measured defects, the rejected rebalances and the reason a constant holds its value all live.
// That only works while they are true. `beatsLastDefender` carried a header reading "STEP 1 OF THE
// REBUILD: A CLEAR CHANCE HAS TO BE NEAR THE GOAL" above a body with no distance term in it at all, and
// named a `CHANCE_RANGE` constant that was never defined or applied anywhere in the tree — while the same
// block described a shot resolving from wherever the receiver was standing, which the call site stopped
// doing when it was rewritten to flag a clear run instead. Two false claims sitting on the hottest gate in
// the engine, and both read as landed work, because this file's own convention is that an all-caps header
// announces a change that shipped ("NO LONGER A SHOT FROM HERE" a hundred lines up did).
//
// A false comment is worse than no comment: it mis-scopes the next person's work. F-022 and F-034 are both
// open decisions on this exact function, so the next reader is already on the way.
//
// SCOPE, deliberately narrow: shared/src/engine.ts only. Sibling files carry a milder version of the same
// thing (gaffersDiary's post-mortem names the pool it used to be; career.ts names a weight it no longer
// has), and widening this probe would produce a red nobody can clear in one change. One file, one gate.
//
// Run: `npx tsx tools/playtest/engine_comment_truth.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== engine.ts comments describe code that exists ===');

/** Comment text only (block + line comments), so prose is never mistaken for code. */
const commentsOf = (src: string) =>
  [...src.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0])
    .concat([...src.matchAll(/^[ \t]*\/\/[^\n]*/gm)].map((m) => m[0])).join('\n');
/** Code only. A bare `//` strip would eat `https://...`, hence the no-colon guard. */
const codeOf = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const engine = readFileSync('shared/src/engine.ts', 'utf8');

// ── 1. THE PREMISE, read from the source rather than assumed: a ball played in behind no longer becomes a
// shot where it is received. If someone re-points that branch at resolveShot, this goes red FIRST and says
// so, instead of §3 below silently forbidding prose about behaviour that has come back.
const branchStart = engine.indexOf('if (pick.through && this.beatsLastDefender(teamIdx, pick.idx)) {');
const branchEnd = engine.indexOf('this.clearRun[teamIdx] = pick.idx;', branchStart);
const branchFound = branchStart >= 0 && branchEnd > branchStart;
ok(branchFound, 'the through-ball branch still ends by flagging a clear run (the premise)');
const branch = branchFound ? codeOf(engine.slice(branchStart, branchEnd)) : '';
const noShotThere = branchFound && !/resolveShot\(/.test(branch);
ok(noShotThere, 'the through-ball branch takes no shot at the reception point');
if (!noShotThere) console.log('  ..   the clear-run call site moved — re-read this probe before trusting the failures below');

// ── 2. NO COMMENT MAY NAME A CONSTANT THE CODE DOES NOT HAVE. SCREAMING_SNAKE in a comment reads as a
// reference to a real knob; that is exactly how CHANCE_RANGE was believed. Prose headers survive this
// (they carry no underscore), so the filter is the SHAPE of the identifier, not a word list.
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
});
const sourceCode = walk('shared/src').concat(walk('client/src'))
  .map((p) => codeOf(readFileSync(p, 'utf8'))).join('\n');
const named = [...new Set([...commentsOf(engine).matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)].map((m) => m[0]))].sort();
const missing = named.filter((t) => !new RegExp(`\\b${t}\\b`).test(sourceCode));
console.log(`  ..   ${named.length} constant name(s) in engine.ts comments, ${named.length - missing.length} resolve to code`);
// VACUITY GUARD. If the comment/code split ever breaks, `named` empties and the filter below passes over
// nothing — the zero-of-zero green that let four dead `transition: width` rules live for months. Mutation-
// tested by renaming a real declaration (TRAP_MISTIME): the filter goes red naming it, as it should.
ok(named.length >= 6, 'engine.ts comments were actually parsed (not a zero-of-zero pass)');
for (const t of missing) console.log(`       ${t} — named in a comment, declared nowhere in shared/ or client/`);
ok(missing.length === 0, `every constant an engine comment names actually exists (${missing.length} phantom)`);

// ── 3. AND THE HOTTEST GATE MUST NOT RE-STATE WHAT §1 REFUTES. beatsLastDefender's own comment block, and
// only that block: the identical stale sentence upstairs in the call-site NOTE is a separate finding, and
// pulling it in here would make this probe red for a reason it cannot explain.
const fnStart = engine.indexOf('private beatsLastDefender(');
const fnEnd = engine.indexOf('\n  private ', fnStart + 1);
const fnFound = fnStart >= 0 && fnEnd > fnStart;
ok(fnFound, 'beatsLastDefender was located in engine.ts');
const fnSrc = fnFound ? engine.slice(fnStart, fnEnd) : '';
const lines = commentsOf(fnSrc).split('\n').filter((l) => l.trim());
// Flattened, because every claim below is wrapped across two or three comment lines in the source.
const prose = lines.map((l) => l.replace(/^\s*\/\/ ?/, '')).join(' ').replace(/\s+/g, ' ');
console.log(`  ..   ${lines.length} comment line(s) read inside beatsLastDefender`);
ok(lines.length >= 4, 'its comment block was actually read (not a zero-of-zero pass)');
// Each pattern is tied to the code fact that refutes it, so the next reader checks the CLAIM, not the regex.
const REFUTED: { re: RegExp; what: string }[] = [
  { re: /resolves? from wherever the receiver/i, what: 'the shot resolving where the pass is received — §1 says the branch only flags a clear run' },
  { re: /supplying [\d.]+% of every shot/i, what: 'a shot share measured before the call site was rewritten — re-measure before quoting it' },
];
// The proximity claim is banned only while the gate really has no proximity term. If a CHANCE_RANGE-style
// distance test ever lands here, the comment describing one becomes true and this stops policing it.
const hasProximity = /goalOf\(|CHANCE_RANGE/.test(codeOf(fnSrc));
if (hasProximity) console.log('  ..   the gate now has a distance term, so its proximity comment is no longer checked');
else REFUTED.push({ re: /how close the receiver must be to the goal|a clear chance has to be near the goal/i,
  what: 'a proximity gate — the body has no distance term and calls no goalOf()' });
const restated = REFUTED.filter((p) => p.re.test(prose));
for (const p of restated) console.log(`       beatsLastDefender's comment still claims ${p.what}`);
ok(restated.length === 0, `the gate's comment claims nothing the code refutes (${restated.length} found)`);

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
