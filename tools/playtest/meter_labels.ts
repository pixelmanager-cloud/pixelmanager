// ONE METER, ONE NAME, ON ANY GIVEN SCREEN.
//
// The relationship meters are RELABELLED as the career matures — `authority` reads 🧑‍🏫 Coach to a boy and
// 👔 Gaffer to a professional — and career.ts's METER map plus activeMeters() serve the stage-correct pair
// to the dashboard. The summer-focus tiles, though, resolved every meter through flat METER_ICON/METER_NAME
// tables with no stage awareness. So on the three senior summers a tile literally titled "Court the Gaffer"
// showed 🧑‍🏫 +16 above a dashboard bar labelled 👔 Gaffer — and because the legend is keyed by ICON, both
// symbols survived into it and it listed the same relationship twice as two different people.
//
// Run: `npx tsx tools/playtest/meter_labels.ts`
import { Career, seedFrom } from '../../shared/src/career.js';
import { activeMeters } from '../../shared/src/career.js';
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A summer tile names a meter the way the dashboard does ===');

// 1. The data the fix depends on must actually be there. If MeterDesc ever loses `key`, the lookup below
//    silently becomes empty and the tiles quietly revert to the flat tables — the exact defect, restored.
const sample = activeMeters('Establishing');
console.log(`  ..   activeMeters('Establishing') -> ${sample.map((m: any) => `${m.key}=${m.icon} ${m.label}`).join('  ')}`);
ok(sample.length > 0 && sample.every((m: any) => typeof m.key === 'string' && m.key), 'every meter carries a key the tiles can look up');

// 2. The relabelling is real — otherwise this whole probe guards nothing.
const early = activeMeters('Grassroots').find((m: any) => m.key === 'authority');
const late = activeMeters('Establishing').find((m: any) => m.key === 'authority');
if (early && late) {
  console.log(`  ..   authority: '${early.label}' ${early.icon} early -> '${late.label}' ${late.icon} late`);
  ok(early.label !== late.label || early.icon !== late.icon, 'the authority meter genuinely relabels between chapters');
}

// 3. The renderer must prefer the stage-correct pair over the flat tables.
const src = readFileSync('client/src/main.ts', 'utf8');
const i = src.indexOf('const stage = new Map<string, { icon: string; label: string }>');
ok(i > 0, 'the summer renderer builds a stage-aware meter lookup');
const block = src.slice(i, i + 1200);
ok(/for \(const m of s\.meters \?\? \[\]\)/.test(block), 'it is built from s.meters — what the dashboard itself shows');
ok(/stage\.get\(k\)\?\.icon \?\? METER_ICON\[k\]/.test(block), 'the flat icon table is only a fallback');
ok(/stage\.get\(k\)\?\.label \?\? METER_NAME\[k\]/.test(block), 'the flat name table is only a fallback');
ok(!/METER_NAME\[k\] \?\? k}">\$\{METER_ICON\[k\]/.test(block), 'no tile resolves a meter straight from the flat tables any more');

// 4. And a career really does reach a chapter where the labels differ, or none of this is reachable.
const c = new Career(seedFrom('meter-probe'), 'outfield', 'loyal');
const chapters = new Set<string>();
let guard = 0;
while (!c.finished && guard++ < 4000) {
  const st: any = c.current();
  chapters.add(st.chapter);
  if (st.phase === 'arc') c.resolveArc(st.arc.choices[0].id);
  else if (st.phase === 'focus') c.chooseFocus(st.focus[0].id);
  else if (st.phase === 'offer') c.resolveOffer(st.offers[0].id);
  else if (st.phase === 'coach') c.appointCoach(st.coaches[0].id);
  else if (st.phase === 'draft') c.draft(st.options[0].id);
  else c.play(st.hand[0].id);
}
console.log(`  ..   a full career passes through: ${[...chapters].join(', ')}`);
ok(chapters.size >= 4, 'a career reaches several chapters, so the relabelling is actually seen');

console.log(fails ? `\n✗ ${fails} problem(s) — a tile and the dashboard would disagree` : '\n✓ tiles and dashboard name the same meter the same way');
if (fails) process.exitCode = 1;
