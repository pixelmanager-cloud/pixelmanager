// ── IMPLEMENTED GATES WITH NO CONTENT ────────────────────────────────────────────────────────────────
//
// The mirror of the writer/reader defect (see field_wiring.ts). There, a consumer read a field nothing
// wrote. Here, a MECHANISM IS FULLY BUILT AND NO CONTENT USES IT — the code is live, correct, tested, and
// every arc in the library declines to invoke it, so it can never fire.
//
// Measured when this was written:
//   1,505 arc choices set `effect.tag`   ... and 0 arcs gate on a tag, either side
//   819 manager arcs                     ... and 0 declare `when.facility`
//
// The tag system is sold in its own comment as "a state flag other arcs can require or forbid, so
// consequences persist across a career". Both halves are implemented: `arcFits` honours requiresTag and
// forbidsTag, and the player-side career filters choices by `requires`. Every one of those 1,505 writes
// lands in a set nothing ever queries — the single largest gap between authored intent and delivered
// behaviour in the game. Facilities are sold as content sources ("a good academy generates youth
// stories"); no arc gates on one, so upgrading unlocks nothing.
//
// This does not fail the build: it is a CONTENT gap, and the honest response is authoring, not a code
// change. It prints the gap every run so it cannot quietly become permanent.
import { ARCS } from '../../shared/src/storyarc.js';
import { MANAGER_ARCS } from '../../shared/src/managerarc.js';

interface Gate { name: string; writes: number; readers: number; note: string }
const gates: Gate[] = [];

let pTagWrites = 0, pRequires = 0;
for (const a of ARCS as any[]) {
  for (const b of Object.values(a.beats ?? {}) as any[]) {
    for (const c of b.choices ?? []) {
      if (c.effect?.tag) pTagWrites++;
      if (c.requires) pRequires++;
    }
  }
}
gates.push({ name: 'player arc tags (ArcChoice.requires)', writes: pTagWrites, readers: pRequires,
  note: 'career.ts filters choices by `requires`; nothing declares one' });

let mTagWrites = 0, mReqTag = 0, mForbid = 0, mFacility = 0, mMaxSeason = 0;
for (const a of MANAGER_ARCS as any[]) {
  if (a.when?.requiresTag) mReqTag++;
  if (a.when?.forbidsTag) mForbid++;
  if (a.when?.facility) mFacility++;
  if (a.when?.maxSeason != null) mMaxSeason++;
  for (const b of Object.values(a.beats ?? {}) as any[]) for (const c of b.choices ?? []) if (c.effect?.tag) mTagWrites++;
}
gates.push({ name: 'manager arc tags (when.requiresTag/forbidsTag)', writes: mTagWrites, readers: mReqTag + mForbid,
  note: 'arcFits honours both; no arc declares either' });
gates.push({ name: 'facilities as content gates (when.facility)', writes: MANAGER_ARCS.length, readers: mFacility,
  note: 'arcFits + mgrSituation are live; facilities.ts claims facilities "gate story arcs"' });
gates.push({ name: 'manager arc late-window (when.maxSeason)', writes: MANAGER_ARCS.length, readers: mMaxSeason,
  note: 'implemented window bound, unused' });

console.log(`[gate-content] ${ARCS.length} player arcs, ${MANAGER_ARCS.length} manager arcs`);
let dead = 0;
for (const g of gates) {
  const flag = g.readers === 0 ? '⚠ ' : '  ';
  if (g.readers === 0) dead++;
  console.log(`${flag}${g.name.padEnd(46)} writes/arcs ${String(g.writes).padStart(5)}   gated by it ${String(g.readers).padStart(4)}${g.readers === 0 ? `   — ${g.note}` : ''}`);
}
console.log(dead
  ? `\n⚠ ${dead} implemented gate(s) that NO content uses — built, correct, and unreachable. Authoring, not code.`
  : '\n✓ every implemented gate has content that uses it');
