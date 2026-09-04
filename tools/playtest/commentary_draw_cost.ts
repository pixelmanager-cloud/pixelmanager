// A COMMENTARY DRAW MUST SUBSTITUTE ONE LINE, NOT THE WHOLE BANK.
//
// cpickNR merges the authored bank into the live bank so a player sees base + everything authored for the
// event. It did that by token-filling EVERY authored line and then throwing all but one away: the bag index
// is drawn twelve lines below the `extra.map(l => fillCm(l, withOpp))` that materialised the whole thing.
// loose_ball alone is 499 authored lines against ~114 loose_ball events a match, so a match ran ~100,000
// fillCm calls — a global unicode regex each — to print ~340 lines. Live it is spread thin and invisible;
// `skipToEnd` drains every unshown event in ONE synchronous burst, so the whole ~45ms lands on the single
// tap whose entire job is to end the match, which is the tap F-111 already had to rescue.
//
// The fix is to draw the index first and fill only the winner. That makes this probe's job awkward: the
// thing being removed is invisible in the output, because the OUTPUT MUST NOT CHANGE. A cheaper picker that
// draws a different line is a content regression, not a fix. So this measures both halves:
//   1. the work — fillCm calls per draw, which must be at most one;
//   2. the result — every drawn line byte-identical to an independent merge-then-draw reference, with the
//      seeded shuffle consuming the same cmSeq ticks, over every (salt, key, branch) shape main.ts uses.
// Half of that alone is worthless: (1) without (2) passes if you simply stop merging authored lines in.
//
// It runs the REAL picker, lifted out of main.ts and given a harness, rather than a copy — a copy would
// measure the probe. main.ts cannot be imported (it touches the DOM at module scope), so the two methods
// are extracted by brace-matching and handed to tsx as a module. If that extraction ever breaks it throws
// here and fails loudly; it cannot quietly measure nothing. (It is loaded through createRequire rather than
// `await import` because the repo root has no `"type": "module"`, so tsx compiles these probes to CJS and
// a top-level await is a hard transform error.)
//
// Run: `npx tsx tools/playtest/commentary_draw_cost.ts`
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commentaryExtra, fillCm } from '../../shared/src/commentary/extra.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const MAIN = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = readFileSync(MAIN, 'utf8');

console.log('=== A commentary draw fills one line, not the whole bank ===');

// ── Lift the picker out of main.ts ──────────────────────────────────────────────────────────────────
function method(name: string): string {
  const at = src.indexOf(`  private ${name}`);
  if (at < 0) throw new Error(`main.ts has no method \`${name}\` — this probe's extraction has broken`);
  let d = 0, i = src.indexOf('{', src.indexOf('(', at));
  for (; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) { i++; break; }
  }
  return src.slice(at, i).replace(/^  private /, '  ');
}
type Vars = Record<string, string | undefined>;
type Branch = { icon: string; neutral?: boolean };
interface Picker {
  cidx(len: number, idx: number, salt: number): number;
  cpickNR(arr: string[], salt: number, key?: string, vars?: Vars, branch?: Branch): string;
}
const lifted = [method('cidx'), method('cpickNR')].join(',\n');
const file = join(tmpdir(), `fm_picker_probe_${process.pid}.ts`);
writeFileSync(file, `type CommentaryBranch = { icon: string; neutral?: boolean };
export function makePicker(
  commentaryExtra: (k: string, b?: CommentaryBranch) => string[],
  fillCm: (l: string, v: Record<string, string | undefined>) => string,
) { return {\n${lifted}\n}; }\n`, 'utf8');
let makePicker: (ce: typeof commentaryExtra, fc: typeof fillCm) => Picker;
try { makePicker = createRequire(import.meta.url)(file).makePicker; } finally { unlinkSync(file); }

console.log(`  ..   lifted cidx + cpickNR from main.ts (${lifted.length} chars)`);
ok(/commentaryExtra\(/.test(lifted) && /bag\.pop\(\)/.test(lifted),
   'the lifted picker is the real one — it draws from a bag and merges the authored bank');

// ── Every (salt, key, branch) shape the game actually draws ─────────────────────────────────────────
// Scraped, not typed out. A hand-kept list of call sites is how `red_card_second` stayed invisible to
// commentary_corpus.ts for as long as it did.
const SHAPES: Array<{ salt: number; key?: string; branch?: Branch }> = [];
const seen = new Set<string>();
for (const m of src.matchAll(
  /,\s*(\d+),\s*'([a-z_]+)'\s*,\s*\{[^{}]*\}\s*(?:,\s*\{\s*icon:\s*'([^']+)'\s*(,\s*neutral:\s*true\s*)?\})?\s*\)/g)) {
  const id = `${m[1]}|${m[2]}|${m[3] ?? ''}`;
  if (seen.has(id)) continue;
  seen.add(id);
  SHAPES.push({ salt: +m[1], key: m[2], branch: m[3] ? { icon: m[3], neutral: !!m[4] } : undefined });
}
SHAPES.push({ salt: 9 });   // the keyless path (score-state notes), which merges nothing
const banks = SHAPES.filter((s) => s.key).map((s) => `${s.key}${s.branch ? s.branch.icon : ''}:${commentaryExtra(s.key!, s.branch).length}`);
console.log(`  ..   ${SHAPES.length} draw shapes scraped from main.ts; banks ${banks.slice(0, 6).join(' ')} …`);
ok(SHAPES.length >= 15, `the cpickNR call sites were found (${SHAPES.length} shapes)`);
ok(banks.some((b) => Number(b.split(':')[1]) > 100), 'at least one shape draws a big authored bank — otherwise there is nothing to waste');

// ── The workload: the same script of draws, run twice ───────────────────────────────────────────────
const VARS: Vars = { p: 'Osei', team: 'Eastgate FC', zone: 'in midfield', off: 'Hartley', name: 'Osei' };
const PER_SHAPE = 100;
const script: Array<{ base: string[]; salt: number; key?: string; branch?: Branch }> = [];
for (let n = 0; n < PER_SHAPE; n++) {
  for (const s of SHAPES) {
    // Synthetic base banks: the real ones are template literals built from live match state. The SIZE is
    // varied per draw on purpose — 18 salts are reused across different banks, so a bag keyed on the wrong
    // length only misbehaves when one salt is seen at more than one size.
    const size = 2 + ((s.salt + n) % 5);
    script.push({ base: Array.from({ length: size }, (_, i) => `base ${s.salt}/${i}`), salt: s.salt, key: s.key, branch: s.branch });
  }
}

interface Harness extends Picker { matchSeed: number; cmSeq: number; cmBag: Record<string, number[]>; lastPick: Record<string, number>; cmOpp: string }
let implFills = 0, refFills = 0;
const impl = Object.assign(
  makePicker(commentaryExtra, (l, v) => { implFills++; return fillCm(l, v); }),
  { matchSeed: 0x51ed, cmSeq: 0, cmBag: {}, lastPick: {}, cmOpp: 'Rivertown' },
) as Harness;
const ref: Harness = { ...impl, cmSeq: 0, cmBag: {}, lastPick: {} };

/** THE SPEC: cpickNR exactly as it read before the fix — merge the filled bank, then draw from it. Written
 *  out here rather than imported so that "the fast one agrees with the slow one" is a real comparison. */
function refDraw(h: Harness, base: string[], salt: number, key?: string, vars?: Vars, branch?: Branch): string {
  let arr = base;
  if (key) {
    const extra = commentaryExtra(key, branch);
    const withOpp = { opp: h.cmOpp, ...(vars ?? {}) };
    if (extra.length) arr = [...arr, ...extra.map((l) => { refFills++; return fillCm(l, withOpp); })];
  }
  if (arr.length <= 1) return arr[0];
  const bagKey = `${salt}:${arr.length}`;
  let bag = h.cmBag[bagKey];
  if (!bag || bag.length === 0) {
    bag = arr.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = h.cidx(i + 1, h.cmSeq++, salt);
      const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    if (bag.length > 1 && bag[bag.length - 1] === h.lastPick[bagKey]) {
      const t = bag[bag.length - 1]; bag[bag.length - 1] = bag[0]; bag[0] = t;
    }
    h.cmBag[bagKey] = bag;
  }
  const i = bag.pop()!;
  h.lastPick[bagKey] = i;
  return arr[i];
}

let done = 0, mismatch = 0, first = '', threw = '';
const t0 = process.hrtime.bigint();
// Guarded so a picker that indexes off the end of its own bag reports as a named FAIL rather than a stack
// trace — a probe that dies mid-run tells the gate almost nothing about which assertion went red.
try {
  for (const d of script) {
    const got = impl.cpickNR(d.base, d.salt, d.key, VARS, d.branch);
    const want = refDraw(ref, d.base, d.salt, d.key, VARS, d.branch);
    if (got !== want) { if (!mismatch) first = `${d.key ?? '(keyless)'}#${d.salt}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`; mismatch++; }
    done++;
  }
} catch (e) { threw = (e as Error).message; }
const ms = Number(process.hrtime.bigint() - t0) / 1e6;

console.log(`  ..   ${done} draws: picker ${implFills} fillCm calls (${(implFills / (done || 1)).toFixed(1)}/draw), merge-then-draw reference ${refFills} (${(refFills / (done || 1)).toFixed(1)}/draw), ${ms.toFixed(0)}ms for both`);
ok(!threw, `every draw completed${threw ? ` — threw: ${threw}` : ''}`);
ok(done >= 1000, `the workload actually ran (${done} draws)`);
ok(implFills > 0, 'draws land on authored lines — the ratio below is not zero of zero');
ok(mismatch === 0, `every drawn line is byte-identical to the merge-then-draw reference (${done - mismatch}/${done})${mismatch ? ` — first: ${first}` : ''}`);
ok(impl.cmSeq === ref.cmSeq, `the seeded shuffle consumed the same cmSeq ticks (${impl.cmSeq} vs ${ref.cmSeq})`);
ok(implFills <= done, `a draw substitutes at most one authored line (${(implFills / (done || 1)).toFixed(1)} per draw)`);

// ── The one-line bank ───────────────────────────────────────────────────────────────────────────────
// The early return fires on the MERGED size, so when the only line is an authored one it must still be
// filled. Nothing in the game hits this today (the smallest live bank is red_card_second at 2), which is
// exactly why it needs a probe: a picker that returns `arr[0]` from an empty base prints a literal {p}.
const stub = makePicker(() => ['{p} settles it for {team} {zone}.'], fillCm);
const solo = Object.assign(stub, { matchSeed: 1, cmSeq: 0, cmBag: {}, lastPick: {}, cmOpp: 'Rivertown' }) as Harness;
const one = solo.cpickNR([], 77, 'anything', VARS);
ok(typeof one === 'string' && !one.includes('{'), `a bank of one authored line is still substituted (${JSON.stringify(one)})`);
const empty = makePicker(() => [], fillCm);
const none = Object.assign(empty, { matchSeed: 1, cmSeq: 0, cmBag: {}, lastPick: {}, cmOpp: 'Rivertown' }) as Harness;
let blewUp = false;
try { none.cpickNR([], 78, 'anything', VARS); } catch { blewUp = true; }
ok(!blewUp, 'an empty bank returns rather than throwing, as it always did');

console.log(fails ? `\n✗ ${fails} check(s) failed` : '\n✓ one substitution per draw, and the same line every time');
if (fails) process.exitCode = 1;
