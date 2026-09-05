// WHAT THE CODE SAYS A PASSED-OVER BROTHER IS MUST BE WHAT THE SUCCESSION ACTUALLY MINTS.
//
// Four comments — one of them a TYPE definition, which is the one a new author reads first — described the
// brother you did not take as a full squad man: "A brother is a FULL PLAYER, not a summary row ... minted
// through the same path every rich squad player takes, so he can be scouted, signed, played against"
// (client/src/api.ts, directly above the loop), "A sibling is a FULL player (mintSquadPlayer) who ages, can
// be signed" (shared/src/token.ts, on `Token.branch`), and `heirAsPlayer`'s own header. None of it shipped.
// `succeed()` calls `localStore.createToken` with genes, a pedigree and a `branch_seed`; the man reaches the
// player as a DERIVED record (`branchCareer`) on the Family Record and in the renown scorer, and
// `fieldablePlayers`' attrs_json guard keeps him out of the squad ON PURPOSE — merging those men put a NaN
// body in the club per generation, which is why the guard exists. `heirAsPlayer`, the function written to
// make him a real player, has exactly one caller in the repo and it is shared/qa_bloodline.ts.
//
// Nothing rendered wrong, which is precisely the danger: the comments read as landed work, so the next
// author builds on a mechanism that is not there — the shape of F-129 (staking exports with no caller) and
// F-201 (`runMatch` cited by types.ts and called by nobody). A false comment costs more than no comment.
//
// The gate cuts both ways ON PURPOSE. §1 checks the premise from the code, so if brothers are ever really
// wired into squads this goes red FIRST and says so rather than §2 silently forbidding true prose. §2
// forbids restating what §1 refutes. §3 forbids the lazy fix of deleting the comments instead of correcting
// them — the reader still has to be told where the brother DOES turn up. §4 keeps the same status on the
// spec the comments were written from.
//
// SCOPE, deliberately narrow: comments under shared/src and client/src, plus §3 of the one spec file those
// comments are derived from, plus the headings shared/qa_bloodline.ts prints — by name, because that is the
// one place the claim actually survived: a string literal, one directory above the scan. Other docs, other
// qa_*.ts harnesses and in-game copy are a different review lane.
//
// Run: `npx tsx tools/playtest/branch_player_comment_truth.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the comments describe the brother the succession actually mints ===');

/** Comment text only, grouped into BLOCKS: each block comment is one, and a run of consecutive `//` lines is
 *  one — the claim spans three lines of one comment in api.ts and two in token.ts, and checking them apart
 *  is how a sentence broken over a line wrap slips through. */
const commentBlocks = (src: string): string[] => {
  const out = [...src.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]);
  let run: string[] = [];
  for (const line of src.split('\n')) {
    const c = /^[ \t]*\/\/(.*)$/.exec(line);
    if (c) run.push(c[1]); else { if (run.length) out.push(run.join(' ')); run = []; }
  }
  if (run.length) out.push(run.join(' '));
  return out;
};
/** Code only. A bare `//` strip would eat `https://...`, hence the no-colon guard. */
const codeOf = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
/** Backticks, a JSDoc block's leading stars and line wrapping are formatting, not meaning. Underscores are
 *  NOT stripped (the usual markdown flattening does): `branch_seed` and `attrs_json` are the identifiers §3
 *  looks for, and flattening them to branchseed would have made those checks quietly unsatisfiable. */
const flat = (s: string) => s.replace(/[*`]/g, '').replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

const api = readFileSync('client/src/api.ts', 'utf8');
const bloodline = readFileSync('shared/src/bloodline.ts', 'utf8');
const token = readFileSync('shared/src/token.ts', 'utf8');
const qa = readFileSync('shared/qa_bloodline.ts', 'utf8');

// ── 1. THE PREMISE, read from the source rather than assumed. Every one of these is the fact that kills a
// claim in §2, so if someone genuinely wires brothers into squads, this section reds first and names it.
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
});
const srcFiles = walk('shared/src').concat(walk('client/src'));
const callers = srcFiles.filter((p) => p !== join('shared', 'src', 'bloodline.ts') && /\bheirAsPlayer\b/.test(codeOf(readFileSync(p, 'utf8'))));
for (const p of callers) console.log(`       ${p} — calls heirAsPlayer`);
ok(callers.length === 0, `heirAsPlayer still has no caller in shipped source (${callers.length} found)`);
ok(/\bheirAsPlayer\(/.test(qa), 'shared/qa_bloodline.ts is still the one thing that exercises heirAsPlayer');
const apiCode = codeOf(api);
// The succession itself, not the whole file: `alignSquadToTier` mints squad players quite legitimately, so
// the premise has to be read off the branch path alone.
const b0 = api.indexOf('── THE BRANCHING BLOODLINE');
const b1 = api.indexOf('branch_seed: heirs[0].seed', b0 + 1);
ok(b0 >= 0 && b1 > b0, 'the succession\'s branch path was found in api.ts');
const succ = b0 >= 0 && b1 > b0 ? codeOf(api.slice(b0, b1)) : '';
ok(/localStore\.createToken\(/.test(succ), 'a brother is still minted as a Token by the succession');
ok(!/\b(?:mintSquadPlayer|heirAsPlayer)\b/.test(succ), 'and never through mintSquadPlayer or heirAsPlayer');
ok(/if \(!t\.attrs_json \|\| !\/\[0-9\]\/\.test\(t\.attrs_json\)\) continue;/.test(apiCode),
  'fieldablePlayers still keeps an attribute-less token out of the squad (the authority the comments cite)');
ok(/\bbranchCareer\(/.test(apiCode), 'a passed-over brother is still scored from the derived branchCareer row');
if (fails) console.log('  ..   the branch path moved — re-read this probe before trusting the checks below');

// ── 2. NO COMMENT MAY RESTATE WHAT §1 REFUTES. Each pattern carries the fact that kills it, so the next
// reader checks the CLAIM rather than the regex. Negations and questions survive: "whether he should become
// signable" is not "he can be signed", and a header that says he is NOT a full player never matches.
const blocks = srcFiles.flatMap((p) => commentBlocks(readFileSync(p, 'utf8')).map((b) => ({ p, t: flat(b) })));
console.log(`  ..   ${blocks.length} comment block(s) read across ${srcFiles.length} file(s) under shared/src + client/src`);
// VACUITY GUARD. If the comment split ever breaks, `blocks` empties and every filter below passes over
// nothing — the zero-of-zero green that let four dead `transition: width` rules live for months.
ok(blocks.length >= 500, 'the comments were actually parsed (not a zero-of-zero pass)');
const about = blocks.filter((b) => /\b(?:brothers?|siblings?|passed[- ]over)\b/i.test(b.t));
console.log(`  ..   ${about.length} of them are about a brother, a sibling or a passed-over man`);
ok(about.length >= 20, 'the brother comments were actually found (not a zero-of-zero pass)');
const REFUTED: { re: RegExp; what: string }[] = [
  { re: /\b(?:brother|sibling)\b[^.]{0,100}\b(?:is|as)\s+a\s+full\s+(?:squad\s+)?player\b/i,
    what: 'a brother is a full player — he is a Token with no attrs_json (§1)' },
  { re: /\bthe same path every rich squad player (?:already )?takes\b/i,
    what: 'he is minted the way a squad player is — api.ts never calls mintSquadPlayer (§1)' },
  { re: /\b(?:can|could) be (?:scouted|signed)\b/i,
    what: 'he can be scouted or signed — fieldablePlayers excludes him and no market lists him (§1)' },
  { re: /\byou can scout,? sign and play\b/i,
    what: 'the player can scout, sign and play him — nothing in the tree offers him (§1)' },
];
const restated = about.flatMap((b) => REFUTED.filter((r) => r.re.test(b.t)).map((r) => ({ ...b, r })));
for (const x of restated) console.log(`       ${x.p} — a comment still claims ${x.r.what}`);
ok(restated.length === 0, `no comment claims a brother the succession does not mint (${restated.length} found)`);

// The claim's last survivor was not a comment and not under shared/src: it was the §7 heading `npm run verify`
// printed out of shared/qa_bloodline.ts — the harness §1 above already opens and asserts on. Four green ticks
// under a heading asserting a property the game does not have misleads the next author exactly as a false
// comment does, one lane over. Checked on THAT ONE FILE's printed headings by name, not by widening the scan
// above: policing every qa_*.ts and every string literal would re-point these four patterns at in-game copy
// under client/src, which is a call about this guard's lane rather than part of the repair.
const qaHeadings = [...codeOf(qa).matchAll(/console\.log\((['"`])([\s\S]*?)\1\)/g)].map((m) => flat(m[2]));
console.log(`  ..   ${qaHeadings.length} printed heading(s) read from shared/qa_bloodline.ts`);
// VACUITY GUARD, same reason as above: if the heading match ever breaks, the filter below runs over nothing
// and reports green. Mutating `console.log(` in that file drops this to 0 and reds here first.
ok(qaHeadings.length >= 6, 'the QA harness headings were actually parsed (not a zero-of-zero pass)');
const qaRestated = qaHeadings.flatMap((t) => REFUTED.filter((r) => r.re.test(t)).map((r) => ({ t, r })));
for (const x of qaRestated) console.log(`       shared/qa_bloodline.ts — a printed heading still claims ${x.r.what}`);
ok(qaRestated.length === 0, `no heading verify prints claims a brother the succession does not mint (${qaRestated.length} found)`);

// ── 3. AND THE READER STILL HAS TO BE TOLD WHERE HE DOES TURN UP. Deleting the sentence would clear §2 and
// leave the next author with no account of the branch at all, which is the same trap one step quieter. Each
// check names a SYMBOL, not a phrasing, so the prose stays free.
const blockWith = (src: string, needle: string) => commentBlocks(src).map(flat).find((b) => b.includes(needle));
const claim = blockWith(api, 'THE BRANCHING BLOODLINE');
ok(!!claim, 'the branching-bloodline comment in api.ts was found');
ok(!!claim && /branchCareer/.test(claim), 'it names branchCareer — where a passed-over brother actually reaches the player');
ok(!!claim && /branch_seed/.test(claim), 'it still credits the one consequence that is wired: his sons, off branch_seed');
const branchDoc = blockWith(token, "'sibling' = a brother who exists but was not chosen");
ok(!!branchDoc, "the Token.branch docstring was found");
ok(!!branchDoc && /attrs_json|fieldablePlayers/.test(branchDoc),
  'it points at the guard that keeps a sibling out of the squad, so the claim cannot come back');
// The header directly above the function, taken by position rather than by a phrase, so rewording it freely
// is allowed and losing it is not.
const decl = bloodline.indexOf('export function heirAsPlayer');
const heirDoc = decl > 0 ? [...bloodline.slice(0, decl).matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => flat(m[0])).pop() : undefined;
ok(!!heirDoc, 'the header above heirAsPlayer was found');
ok(!!heirDoc && /qa_bloodline/.test(heirDoc), 'it says outright that QA is the only thing that calls this function');

// ── 4. AND THE SPEC THE COMMENTS WERE WRITTEN FROM CARRIES THE SAME STATUS. §3 of the spec is the origin of
// all four claims. It is a contract, not a status report, so it is annotated rather than rewritten — but an
// unmarked section reads as shipped, which is how the claims got copied into the code in the first place.
const spec = readFileSync('docs/branching-bloodline-spec.md', 'utf8');
const s3 = spec.indexOf('## 3. The brothers are FULL PLAYERS');
const s4 = spec.indexOf('\n## 4.', s3 + 1);
ok(s3 >= 0 && s4 > s3, 'spec §3 was found (the section the comments quote)');
const s3Text = s3 >= 0 && s4 > s3 ? flat(spec.slice(s3, s4)) : '';
ok(/not implemented/i.test(s3Text), 'spec §3 is marked as not implemented, so it cannot be read as shipped state');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
