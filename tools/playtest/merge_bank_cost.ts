// mergeBanks NORMALISES EACH LINE ONCE, AND MOVES NO LINE.
//
// Every prose bank in the game is assembled by mergeBanks at MODULE SCOPE — the six prompt banks
// (prompts/{kind_setup,settings,frame,child_setup,event_prefix,demand}.ts), the manager narration bank
// (managerNarrate.ts), the board moods, the prestige blurbs — so all of it runs on every cold start before
// the main menu paints, in an offline build with no network wait to hide local work behind. It rebuilt its
// dedupe Set from the WHOLE accumulated bank once per (pack × key), and reallocated the merged array with a
// spread on top: KIND_SETUP's 18 packs cost 26,652 line normalisations to place 10,205 lines. mergeList,
// seven lines below it in the same file, does the identical job with one Set built outside the loop and a
// push; this is that shape, for the bank case.
//
// THE TRAP THIS PROBE EXISTS FOR IS THE FIX, NOT THE BUG. mergeBanks decides the ORDER of every bank, and
// the order decides which line a seed draws — move one line and a save that read 'The gaffer has set a
// pointed drill.' reads something else, in a game whose whole promise is that a seed replays identically.
// A cheaper merge that reorders is a content regression wearing a performance fix's clothes. So this
// measures both halves, and either half alone is worthless:
//   1. THE WORK — line normalisations, which must not exceed one per line the merge has to look at;
//   2. THE RESULT — every merged bank byte-identical, key for key and line index for line index, to a
//      verbatim copy of the pre-fix merge, over the real authored corpus and 20,000 randomised banks.
// (1) alone passes if you simply stop deduping, or stop merging the packs in at all. (2) alone is what
// shipped for months.
//
// The count is taken by handing the REAL exported mergeBanks String subclasses that tally their own
// toLowerCase — it measures the shipped function, not a copy that could drift away from it. If a future
// merge normalises some other way the tally reads zero, and the `> 0` guard below goes red rather than the
// budget quietly passing on a measurement of nothing.
//
// Run: `npx tsx tools/playtest/merge_bank_cost.ts`
import { mergeBanks, type Bank } from '../../shared/src/prompts/merge.js';
import { BASE_MGR } from '../../shared/src/manager/base.js';
import { MGR_EXTRA_1 } from '../../shared/src/manager/pack_1.js';
import { MGR_EXTRA_2 } from '../../shared/src/manager/pack_2.js';
import { MGR_EXTRA_3 } from '../../shared/src/manager/pack_3.js';
import { MGR_EXTRA_4 } from '../../shared/src/manager/pack_4.js';
import { MGR_EXTRA_5 } from '../../shared/src/manager/pack_5.js';
import { MGR_EXTRA_6 } from '../../shared/src/manager/pack_6.js';
import * as PACK_A from '../../shared/src/prompts/extra/pack_a.js';
import * as PACK_B from '../../shared/src/prompts/extra/pack_b.js';
import * as PACK_C from '../../shared/src/prompts/extra/pack_c.js';
import * as PACK_D from '../../shared/src/prompts/extra/pack_d.js';
import * as PACK_E from '../../shared/src/prompts/extra/pack_e.js';
import * as PACK_F from '../../shared/src/prompts/extra/pack_f.js';
import * as PACK_G from '../../shared/src/prompts/extra/pack_g.js';
import * as PACK_H from '../../shared/src/prompts/extra/pack_h.js';
import * as PACK_I from '../../shared/src/prompts/extra/pack_i.js';
import * as PACK_J from '../../shared/src/prompts/extra/pack_j.js';
import * as PACK_K from '../../shared/src/prompts/extra/pack_k.js';
import * as PACK_L from '../../shared/src/prompts/extra/pack_l.js';
import * as PACK_M from '../../shared/src/prompts/extra/pack_m.js';
import * as PACK_N from '../../shared/src/prompts/extra/pack_n.js';
import * as PACK_O from '../../shared/src/prompts/extra/pack_o.js';
import * as PACK_P from '../../shared/src/prompts/extra/pack_p.js';
import * as PACK_Q from '../../shared/src/prompts/extra/pack_q.js';
import * as PACK_R from '../../shared/src/prompts/extra/pack_r.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== mergeBanks normalises each line once, and moves no line ===');

// ── THE SPEC: mergeBanks exactly as it read before the fix ─────────────────────────────────────────
// Written out here rather than imported so that "the fast one agrees with the slow one" is a real
// comparison and not a function compared against itself. If the merge RULES ever change on purpose — a
// different dedupe, unknown keys dropped — this copy is what has to be edited, which says so out loud.
const normalise = (l: string) => l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
function refMerge(base: Bank, ...extras: Array<Bank | undefined>): Bank {
  const out: Bank = {};
  for (const [k, v] of Object.entries(base)) out[k] = [...v];
  for (const ex of extras) {
    if (!ex) continue;
    for (const [k, lines] of Object.entries(ex)) {
      const seen = new Set((out[k] ?? []).map((l) => normalise(l)));
      const add: string[] = [];
      for (const l of lines) {
        const n = normalise(l);
        if (!n || seen.has(n)) continue;
        seen.add(n); add.push(l);
      }
      out[k] = [...(out[k] ?? []), ...add];
    }
  }
  return out;
}

// ── The counter ────────────────────────────────────────────────────────────────────────────────────
// A String subclass is still a string to everything mergeBanks does with it — toLowerCase() returns a
// primitive, so the .replace() chain, the Set membership and the dedupe all behave identically — but it
// can see itself being normalised. That is what makes this a measurement of the shipped function.
let norms = 0;
class Counted extends String { toLowerCase(): string { norms++; return super.toLowerCase(); } }
const instrument = (b: Bank): Bank =>
  Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.map((l) => new Counted(l) as unknown as string)]));

/** The budget: every line of a touched base key, plus every authored line offered, normalised ONCE. */
function budget(base: Bank, extras: Bank[]): number {
  const touched = new Set<string>();
  let offered = 0;
  for (const ex of extras) for (const [k, v] of Object.entries(ex)) { touched.add(k); offered += v.length; }
  let seeded = 0;
  for (const k of touched) seeded += (base[k] ?? []).length;
  return seeded + offered;
}

// ── The corpus ─────────────────────────────────────────────────────────────────────────────────────
// The manager case is the REAL production call, byte for byte (managerNarrate.ts). The six prompt banks
// merge onto module-private BASE_ constants that cannot be imported, so those are the real authored packs
// in the real 18-pack shape onto an empty base — which is the half of the input that drives the rebuild.
const PACKS: Array<Record<string, unknown>> = [PACK_A, PACK_B, PACK_C, PACK_D, PACK_E, PACK_F, PACK_G, PACK_H, PACK_I,
  PACK_J, PACK_K, PACK_L, PACK_M, PACK_N, PACK_O, PACK_P, PACK_Q, PACK_R];
const LETTERS = 'ABCDEFGHIJKLMNOPQR'.split('');
const promptFamily = (fam: string): Bank[] =>
  PACKS.map((p, i) => p[`${fam}_${LETTERS[i]}`] as Bank | undefined).filter((b): b is Bank => !!b);

// Tomorrow's corpus, not today's: merge.ts's own header says the banks are being authored up to ~30x in
// parallel by many authors, and the rebuild is quadratic in PACK COUNT. This case is here so the probe
// keeps biting as packs are added, and so the mutation guard below cannot be defeated by the real packs
// happening to consolidate into one file.
const growth: Bank[] = Array.from({ length: 40 }, (_, p) => ({
  match: Array.from({ length: 60 }, (_, i) => `Pack ${p} line ${(p * 30 + i) % 900}.`),
  training: Array.from({ length: 20 }, (_, i) => `Drill ${(p * 10 + i) % 200}.`),
}));

const CASES: Array<{ name: string; base: Bank; extras: Bank[] }> = [
  { name: 'manager (the real managerNarrate call)', base: BASE_MGR as Bank,
    extras: [MGR_EXTRA_1, MGR_EXTRA_2, MGR_EXTRA_3, MGR_EXTRA_4, MGR_EXTRA_5, MGR_EXTRA_6] as Bank[] },
  ...['KIND_SETUP', 'SETTINGS', 'FRAME', 'CHILD_SETUP', 'EVENT_PREFIX', 'DEMAND']
    .map((fam) => ({ name: `${fam} (18 authored packs)`, base: {} as Bank, extras: promptFamily(fam) })),
  { name: 'growth (40 synthetic packs, one key)', base: {} as Bank, extras: growth },
];

// ── 1. THE RESULT ──────────────────────────────────────────────────────────────────────────────────
let placed = 0, divergence = '';
for (const c of CASES) {
  const got = mergeBanks(c.base, ...c.extras);
  const want = refMerge(c.base, ...c.extras);
  const gk = Object.keys(got), wk = Object.keys(want);
  if (!divergence && gk.join(' ') !== wk.join(' ')) divergence = `${c.name}: key order differs (${gk.length} vs ${wk.length} keys)`;
  for (const k of wk) {
    const a = got[k] ?? [], b = want[k] ?? [];
    if (!divergence && a.length !== b.length) divergence = `${c.name} [${k}]: ${a.length} lines vs ${b.length}`;
    for (let i = 0; i < b.length && !divergence; i++) {
      if (a[i] !== b[i]) divergence = `${c.name} [${k}] index ${i}: ${JSON.stringify(a[i])} vs ${JSON.stringify(b[i])}`;
    }
    placed += b.length;
  }
}
console.log(`  ..   ${CASES.length} bank families merged, ${placed} lines placed`);
ok(placed > 20000, `the authored corpus actually loaded (${placed} merged lines) — the comparison below is not zero of zero`);
ok(divergence === '', `every merged bank is byte-identical to the pre-fix merge, key order and line index${divergence ? ` — first: ${divergence}` : ''}`);

// ── 2. THE WORK ────────────────────────────────────────────────────────────────────────────────────
let spent = 0, allowed = 0, naive = 0;
let worstName = '', worstOver = 1;
for (const c of CASES) {
  const base = instrument(c.base), extras = c.extras.map(instrument);
  const b = budget(c.base, c.extras);
  norms = 0; mergeBanks(base, ...extras); const mine = norms;
  norms = 0; refMerge(base, ...extras); const ref = norms;
  spent += mine; allowed += b; naive += ref;
  if (b > 0 && ref / b > worstOver) { worstOver = ref / b; worstName = c.name; }
  if (mine > b) console.log(`  ..   over budget: ${c.name} — ${mine} normalisations for ${b} lines (${(mine / b).toFixed(2)}x)`);
}
console.log(`  ..   normalisations: ${spent} spent, ${allowed} needed (${(spent / allowed).toFixed(2)}x); the pre-fix merge spends ${naive} (${(naive / allowed).toFixed(2)}x)`);
ok(spent > 0, 'the counter is wired to the real mergeBanks — a zero here means it normalises some other way and this budget measures nothing');
// The mutation guard. If the corpus ever shrinks to a shape where rebuilding the Set costs nothing, the
// budget below would pass without measuring anything, so THIS goes red instead of that passing quietly.
ok(worstOver >= 2, `the corpus still exercises the rebuild — the pre-fix merge pays ${worstOver.toFixed(2)}x budget on ${worstName || '(nothing)'}`);
ok(spent <= allowed, `mergeBanks normalises each line at most once (${spent} vs ${allowed} allowed, ${(spent / allowed).toFixed(2)}x)`);

// ── 3. THE RESULT, on banks nobody authored ────────────────────────────────────────────────────────
// The real packs are well-behaved: no blank lines, few cross-pack duplicates, every key already in the
// base. The order is decided by the awkward cases — a line that normalises to nothing, a key only an
// extra defines, a duplicate arriving in the third pack — so those get generated rather than hoped for.
let s = 12345;
// Math.imul, NOT `*`. At a 32-bit seed the product `s * 1103515245` runs past 2^53, so plain multiplication
// silently loses low bits and this generator degenerates — the fuzz below would still print a big sample
// count while actually exploring far less than it claims. A weak generator behind a strong-looking number is
// the same failure this whole probe set exists to catch.
const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const KEYS = ['match', 'training', 'social', 'only_in_extra', 'x'];
const WORDS = ['He', 'she', 'the', 'GAFFER', '  ', '', '!!!', 'a', 'A', 'ball.', 'Ball', '{p}'];
const rndLine = () => Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => pick(WORDS)).join(' ');
const rndBank = (): Bank => {
  const b: Bank = {};
  for (const k of KEYS) if (rnd() < 0.6) b[k] = Array.from({ length: Math.floor(rnd() * 6) }, rndLine);
  return b;
};
let fuzzed = 0, fuzzBad = 0, fuzzFirst = '';
for (let i = 0; i < 20000; i++) {
  const base = rndBank();
  const extras: Array<Bank | undefined> = Array.from({ length: Math.floor(rnd() * 6) }, () => (rnd() < 0.1 ? undefined : rndBank()));
  const a = JSON.stringify(mergeBanks(base, ...extras));
  const b = JSON.stringify(refMerge(base, ...extras));
  fuzzed++;
  if (a !== b && !fuzzBad++) fuzzFirst = `in=${JSON.stringify({ base, extras })} got=${a} want=${b}`;
}
console.log(`  ..   ${fuzzed} randomised bank merges compared against the pre-fix merge`);
ok(fuzzed >= 20000, `the fuzz actually ran (${fuzzed} merges)`);
ok(fuzzBad === 0, `randomised merges agree with the pre-fix merge (${fuzzed - fuzzBad}/${fuzzed})${fuzzBad ? ` — first: ${fuzzFirst.slice(0, 400)}` : ''}`);

console.log(fails ? `\n✗ ${fails} mergeBanks check(s) failed` : '\n✓ one normalisation per line, and not a line out of place');
if (fails) process.exitCode = 1;
