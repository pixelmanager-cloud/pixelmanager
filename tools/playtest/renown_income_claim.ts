// THE DELETED CLAIM HAS TO STAY DELETED IN THE SOURCE, NOT JUST ON THE PANEL.
//
// F-186 struck the sentence "sponsorship and gate follow the family" off the Houses panel, because
// `renownIncomeMult` multiplies the prize computed in api.ts's `spSeasonReward` — the league finish, the
// continental cup and the World Finals — and nothing else; the two streams that sentence named reach the
// treasury raw and are itemised to the player under those exact names. The panel was fixed and guarded by
// tools/playtest/renown_income_copy.ts, which reads the rendered lines in main.ts. Two copies of the same
// sentence survived where that probe cannot look: the docstring on `renownIncomeMult` itself
// (shared/src/renown.ts) and the comment over the `houseMult` assertion in client/qa_offline_facade.ts —
// the two places an author reads BEFORE they touch the panel, so both are a route back to the panel.
//
// THE RULE. Those words may appear in this tree only as REPORTED SPEECH: inside double quotes, in a
// comment recording the claim that was removed — which is how main.ts, api.ts and renown_income_copy.ts
// each carry it. Written bare, it is the false mechanic being asserted again, and this goes red.
//
// Deliberately NOT folded into renown_income_copy.ts: that probe's EXEMPT list forbids naming a stream at
// all, which an accurate comment must stay free to do ("gate is credited raw"), and its `renownIncomeMult(`
// line filter matches nothing but a signature outside main.ts — a zero-of-zero pass.
//
// Run: `npx tsx tools/playtest/renown_income_claim.ts`
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the F-186 claim appears only as reported speech ===');

// Built from fragments so this file does not trip its own scan — it is inside the corpus below, which is
// the point: a probe that has to exempt itself is a probe with a hole in it.
const SPONSOR = 'sponsor(?:ship)?';
const CLAIM = new RegExp(`${SPONSOR} and gate|gate and ${SPONSOR}`, 'gi');

const ROOTS = ['shared/src', 'client', 'tools'];
const SKIP = new Set(['node_modules', 'dist', '.vite', 'public']);
const files: string[] = [];
const walk = (dir: string) => {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.ts')) files.push(p);
  }
};
for (const r of ROOTS) walk(r);

// ── 1. THE PREMISE. If the multiplier is gone or renamed, this probe is guarding a sentence about nothing
// and wants retiring rather than satisfying.
const renown = readFileSync('shared/src/renown.ts', 'utf8');
ok(/export function renownIncomeMult\(/.test(renown), '`renownIncomeMult` is still declared in shared/src/renown.ts (the premise)');

// ── 2. VACUITY GUARDS. Both files the claim survived in must be in the corpus, and the pattern must still
// match live text somewhere — otherwise a rename, a moved root or a reworded regex would let this pass
// having read nothing, the failure mode that kept four dead `transition: width` rules alive here.
const inCorpus = (f: string) => files.includes(f);
ok(inCorpus('shared/src/renown.ts') && inCorpus('client/qa_offline_facade.ts'),
  `both known sites are inside the ${files.length}-file corpus`);

const quoted: string[] = [];
const bare: string[] = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Every "…" span on the line; a match inside one is somebody citing the claim, not making it.
    const spans: [number, number][] = [];
    for (const q of line.matchAll(/"[^"]*"|“[^”]*”/g)) spans.push([q.index!, q.index! + q[0].length]);
    for (const m of line.matchAll(CLAIM)) {
      const cited = spans.some(([a, b]) => m.index! >= a && m.index! + m[0].length <= b);
      (cited ? quoted : bare).push(`${f}:${i + 1}  ${line.trim()}`);
    }
  }
}
console.log(`  ..   ${quoted.length} cited, ${bare.length} bare, across ${files.length} files`);
for (const q of quoted) console.log(`       cited  ${q}`);
ok(quoted.length > 0, 'the pattern still matches live text — the comments citing F-186 are found (not a zero-of-zero pass)');

// ── 3. THE ASSERTION.
for (const b of bare) console.log(`       BARE   ${b}`);
ok(bare.length === 0, `no source line states the claim as fact (${bare.length} found)`);

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
