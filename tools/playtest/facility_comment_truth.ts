// EVERY EFFECT DOCSTRING IN facilities.ts MUST BE TRUE OF THE FUNCTION UNDER IT.
//
// The one-line docstrings over the facility effects each anchor their curve at a level — "1.0 at L1 → 0.80
// at L5", "0 at L1-2, 1 at L3-4, 2 at L5". Eight of the ten are exact. The two the Medical Centre
// recalibration touched were not: `injuryChanceMult` still said "0.40 at L5" against a measured 0.627, and
// `recoveryCut` still said "2 at L5" against 1 — 2 first arrives at L7. Both were left behind when the
// formulas beneath them were rewritten for the 10-level cap, and in the injury case the correction note was
// inserted BETWEEN the stale docstring and the code, so the file contradicted itself two lines apart: the
// summary said 0.40 and the note under it said 0.63.
//
// Nothing rendered wrong, which is what let it sit. `effectAt('medical')` derives its card from these
// functions rather than restating them (qa_facilities §9 holds that), so the player always read the true
// number. The cost lands on whoever prices the Medical Centre next: the file's own summary understated the
// injury multiplier by more than a third of its range and the recovery cut by a whole match, at the L5
// anchor every neighbouring docstring uses. That is the copy-instead-of-derive failure that produced the
// stadium card, in prose — where no card check can see it. shared/qa_facilities.ts had MEASURED both since
// D6 and only printed them; a red nobody has to act on is not a gate.
//
// The claims are PARSED OUT OF THE FILE and evaluated, never listed here — a hand-list is the thing that
// rots, and the next facility or the next recalibration is covered the moment it is written. A quoted
// figure is held to its own precision: "0.63" has to round to the function at L5, "2" has to equal it, so
// prose stays free to round and is not free to lie.
//
// SCOPE, deliberately narrow: one-line `/** … */` docstrings in shared/src/facilities.ts that anchor a
// value at a level. A docstring that quotes no level (dataEdge, dormIntakeBonus) claims nothing and is not
// policed. A docstring that stops at L5 under a 10-level cap (youthPoolBonus reaches 4 at L10) is
// INCOMPLETE, not false, and is a separate finding — pulling it in here would red this probe for a reason
// it cannot explain, the mistake arc_gate_comment_truth.ts documents next door.
//
// Run: `npx tsx tools/playtest/facility_comment_truth.ts`
import { readFileSync } from 'node:fs';
import {
  trainingConditioning, youthPoolBonus, youthUpgradeChance, scoutHitMult, scoutCostDiscount,
  scoutExtraTrips, injuryChanceMult, recoveryCut, fanHomeBoost, fanIncomeMult, dataEdge,
  dormIntakeBonus, MAX_LEVEL,
} from '../../shared/src/facilities.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== facilities.ts effect docstrings state what their functions return ===');

const src = readFileSync('shared/src/facilities.ts', 'utf8');

/** The effects a level alone decides. The docstring is matched to its function BY POSITION below; this map
 *  only says which of them this probe can evaluate, so a new one is named rather than silently skipped. */
const EFFECTS: Record<string, (level: number) => number> = {
  trainingConditioning, youthPoolBonus, youthUpgradeChance, scoutHitMult, scoutCostDiscount,
  scoutExtraTrips, injuryChanceMult, recoveryCut, fanHomeBoost, fanIncomeMult, dataEdge, dormIntakeBonus,
};

// ── 1. THE PARSE, which everything below runs over. One-line docstrings only: the multi-line blocks in this
// file are design notes and history, and a claim inside one is not the summary a reader takes on trust.
const lines = src.split('\n');
const docs: { line: number; at: number; text: string }[] = [];
let at = 0;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t.startsWith('/**') && t.endsWith('*/')) docs.push({ line: i + 1, at, text: t });
  at += lines[i].length + 1;
}
const decls = [...src.matchAll(/^export function (\w+)\(level: number\)/gm)].map((m) => ({ name: m[1], at: m.index! }));
console.log(`  ..   ${docs.length} one-line docstring(s), ${decls.length} single-level effect function(s)`);
// VACUITY GUARDS, and the first things to mutation-test: break either extractor and §2 iterates over
// nothing and reports green — the zero-of-zero pass that let four dead `transition: width` rules live for
// months. Mutation-tested by stripping every one-line docstring from a copy (this line goes red) and by
// rewording the claims so none parse (the claim count below goes red).
ok(docs.length >= 15, 'the docstrings were actually parsed (not a zero-of-zero pass)');
ok(decls.length >= 10, 'the effect functions were actually found (not a zero-of-zero pass)');

// ── 2. EVERY LEVEL A DOCSTRING ANCHORS MUST BE THE VALUE THE FUNCTION RETURNS THERE. The docstring is tied
// to the next single-level function declared after it, which is how the file reads top to bottom; a claim
// whose function has moved away fails loudly here rather than being checked against the wrong curve.
const CLAIM = /(\d+(?:\.\d+)?)\s+at\s+L(\d+)(?:\s*[-–]\s*(\d+))?/g;
const claimsBy: Record<string, number> = {};
let claims = 0;
for (const d of docs) {
  const parsed = [...d.text.matchAll(CLAIM)];
  if (!parsed.length) continue;                                  // states no level: claims nothing, policed nowhere
  const fn = decls.find((x) => x.at > d.at);
  if (!fn) { ok(false, `facilities.ts:${d.line} — the function this docstring describes was found`); continue; }
  const f = EFFECTS[fn.name];
  if (!f) { ok(false, `facilities.ts:${d.line} — ${fn.name} is one this probe can evaluate (add it to EFFECTS)`); continue; }
  for (const c of parsed) {
    claims++; claimsBy[fn.name] = (claimsBy[fn.name] ?? 0) + 1;
    const quoted = c[1], lo = Number(c[2]), hi = c[3] ? Number(c[3]) : lo;
    // Held to the precision it prints: "0.63" may round 0.6274, "0.40" may not stand in for it, and an
    // integer claim has to be the integer. Rounding is prose; a different number is a false statement.
    const tol = 0.5 * Math.pow(10, -((quoted.split('.')[1] ?? '').length));
    const bad: string[] = [];
    if (lo < 1 || hi > MAX_LEVEL || hi < lo) bad.push(`L${lo}-${hi} is off the 1..${MAX_LEVEL} ladder`);
    for (let l = lo; l <= hi; l++) if (Math.abs(f(l) - Number(quoted)) > tol) bad.push(`L${l}=${f(l).toFixed(3)}`);
    ok(bad.length === 0, `facilities.ts:${d.line} ${fn.name}: "${quoted} at L${lo}${hi !== lo ? `-${hi}` : ''}"${bad.length ? ` — measured ${bad.join(', ')}` : ''}`);
  }
}
console.log(`  ..   ${claims} level claim(s) read off the file and checked against the code`);
ok(claims >= 20, 'the claims were actually parsed (not a zero-of-zero pass)');

// ── 3. AND THE TWO THIS PROBE EXISTS FOR STILL DESCRIBE A CURVE. Deleting the parenthetical clears §2 and
// leaves the next author with no summary at all — the same fix one step quieter. Named by FUNCTION, not by
// phrasing, so the wording stays free.
for (const name of ['injuryChanceMult', 'recoveryCut']) {
  ok((claimsBy[name] ?? 0) >= 2, `${name}'s docstring still anchors its curve at more than one level (${claimsBy[name] ?? 0})`);
}

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
