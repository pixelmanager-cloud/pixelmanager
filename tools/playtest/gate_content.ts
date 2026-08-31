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
// THOSE FIGURES ARE NOW STALE, AND SO ARE THE ONES IN docs/decisions-for-ck.md SECTION 2, which still says
// "1,505 arc choices set effect.tag, and not one arc in 1,233 declares any of them". Authoring has since
// closed three of the four holes. Measured on HEAD:
//   414 player arcs, 819 manager arcs
//   player choices setting effect.tag       761   ... player arcs gating on one via `requires`     116
//   manager choices setting effect.tag      773   ... manager arcs gating via requiresTag/forbidsTag  9
//   manager arcs                            819   ... gating on a facility (`when.facility`)        30
//   manager arcs                            819   ... using `when.maxSeason`                          0  ← still dead
//
// The tag system is sold in its own comment as "a state flag other arcs can require or forbid, so
// consequences persist across a career". Both halves are implemented: `arcFits` honours requiresTag and
// forbidsTag, and the player-side career filters choices by `requires`. Three of those four consumers now
// have content behind them; `when.maxSeason` still has none, so that window bound cannot fire.
//
// Closing the last hole is a CONTENT job, and the honest response is authoring, not a code change. What
// this probe now refuses to allow is the economy going BACKWARDS — a bank of tag-gated arcs deleted, or a
// second mechanism joining `when.maxSeason` in the dead column — which until today it could not have seen,
// because it printed the table and exited 0 whatever the table said.
import { ARCS } from '../../shared/src/storyarc.js';
import { MANAGER_ARCS } from '../../shared/src/managerarc.js';

interface Gate { id: string; name: string; writes: number; readers: number; note: string }
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
gates.push({ id: 'ArcChoice.requires', name: 'player arc tags (ArcChoice.requires)', writes: pTagWrites, readers: pRequires,
  note: 'career.ts filters choices by `requires`; nothing declares one' });

let mTagWrites = 0, mReqTag = 0, mForbid = 0, mFacility = 0, mMaxSeason = 0;
for (const a of MANAGER_ARCS as any[]) {
  if (a.when?.requiresTag) mReqTag++;
  if (a.when?.forbidsTag) mForbid++;
  if (a.when?.facility) mFacility++;
  if (a.when?.maxSeason != null) mMaxSeason++;
  for (const b of Object.values(a.beats ?? {}) as any[]) for (const c of b.choices ?? []) if (c.effect?.tag) mTagWrites++;
}
gates.push({ id: 'when.requiresTag/forbidsTag', name: 'manager arc tags (when.requiresTag/forbidsTag)', writes: mTagWrites, readers: mReqTag + mForbid,
  note: 'arcFits honours both; no arc declares either' });
gates.push({ id: 'when.facility', name: 'facilities as content gates (when.facility)', writes: MANAGER_ARCS.length, readers: mFacility,
  note: 'arcFits + mgrSituation are live; facilities.ts claims facilities "gate story arcs"' });
gates.push({ id: 'when.maxSeason', name: 'manager arc late-window (when.maxSeason)', writes: MANAGER_ARCS.length, readers: mMaxSeason,
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

// ── THE BARS ─────────────────────────────────────────────────────────────────────────────────────────
// Until today this probe printed the table above and exited 0 whatever it said. Every tag-gated arc in the
// library could have been deleted overnight and `npm run playtest` would still have printed "✓ all probes
// passed" — the same defect this directory keeps finding in its own guards (decisions-for-ck.md sections
// 36, 41 and 43: gates that report a real defect into scrollback with no failure path).
//
// Every bar below is set from what HEAD measures TODAY, with headroom, and every one is a RATCHET: it says
// the tag economy MUST NOT SHRINK BACK. None of them says today's coverage is the target — 9 manager arcs
// gating on a tag out of 819 is thin, and 0 arcs using `when.maxSeason` is a hole, not an achievement.
const KNOWN_DEAD = ['when.maxSeason'];        // measured today: 0 of 819 manager arcs. See the note below.
const MIN_PLAYER_REQUIRES    = 95;            // today 116 player arc choices declare `requires`
const MIN_MANAGER_TAG_GATES  = 6;             // today  9 manager arcs declare requiresTag/forbidsTag
const MIN_FACILITY_GATES     = 24;            // today 30 manager arcs declare `when.facility`
const MIN_PLAYER_TAG_WRITES  = 620;           // today 761 player choices set effect.tag
const MIN_MANAGER_TAG_WRITES = 620;           // today 773 manager choices set effect.tag
const MIN_PLAYER_ARCS        = 380;           // today 414 — the denominator of every number above
const MIN_MANAGER_ARCS       = 760;           // today 819

console.log('');
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// THE DENOMINATOR FIRST. Every reader count below is a count over these two libraries; a truncated import
// would drive all of them toward zero, and a floor that only looked at readers could not tell "the content
// was deleted" from "the library never loaded".
check(ARCS.length >= MIN_PLAYER_ARCS && MANAGER_ARCS.length >= MIN_MANAGER_ARCS,
  `the survey still sees the whole library (${ARCS.length} player / ${MANAGER_ARCS.length} manager arcs, floors ${MIN_PLAYER_ARCS}/${MIN_MANAGER_ARCS})`);

// THE WRITE SIDE. A tag nothing SETS is the mirror of a tag nothing reads: an arc that requires a tag no
// choice ever writes can never fire, which is the same unreachability wearing the other hat.
check(pTagWrites >= MIN_PLAYER_TAG_WRITES,
  `player choices still write the tag economy (${pTagWrites} set effect.tag, floor ${MIN_PLAYER_TAG_WRITES})`);
check(mTagWrites >= MIN_MANAGER_TAG_WRITES,
  `manager choices still write the tag economy (${mTagWrites} set effect.tag, floor ${MIN_MANAGER_TAG_WRITES})`);

// THE READ SIDE, per mechanism. These three were ALL at zero when this file was written and are the whole
// reason it exists; they were closed by authoring, and this is what stops that authoring being reverted by
// a delete nobody counted.
check(pRequires >= MIN_PLAYER_REQUIRES,
  `player arcs still gate on tags (${pRequires} choices declare \`requires\`, floor ${MIN_PLAYER_REQUIRES})`);
check(mReqTag + mForbid >= MIN_MANAGER_TAG_GATES,
  `manager arcs still gate on tags (${mReqTag + mForbid} declare requiresTag/forbidsTag, floor ${MIN_MANAGER_TAG_GATES})`);
check(mFacility >= MIN_FACILITY_GATES,
  `upgrading a facility still unlocks content (${mFacility} manager arcs declare when.facility, floor ${MIN_FACILITY_GATES})`);

// THE DEAD COLUMN. `when.maxSeason` is a KNOWN OPEN ITEM: 0 of 819 manager arcs use it, so an implemented
// window bound can never fire. It is listed in KNOWN_DEAD as a CEILING ON AN EXISTING HOLE — "this one is
// already dead and we are not letting a second one join it" — and emphatically NOT as a ruling that a
// permanently unreachable mechanism is acceptable. It belongs to the authoring project in
// docs/decisions-for-ck.md section 2, and the honest fix is to write arcs that use it, not to widen this
// list. A gate that goes dead and is NOT on the list is a regression: content that used to reach a live
// mechanism has been removed and the mechanism is now unreachable.
const deadNames = gates.filter((g) => g.readers === 0).map((g) => g.id);
const newlyDead = deadNames.filter((n) => !KNOWN_DEAD.includes(n));
check(newlyDead.length === 0,
  newlyDead.length
    ? `REGRESSION: ${newlyDead.join(', ')} went dead — a built mechanism that content used to reach is now unreachable`
    : `no mechanism went dead that was not already dead (dead: ${deadNames.join(', ') || 'none'}; known: ${KNOWN_DEAD.join(', ')})`);

console.log(fails
  ? `\n✗ ${fails} gate-content check(s) failed — the tag economy went BACKWARDS. Content that reached a built mechanism no longer does.`
  : '\n✓ the tag economy did not shrink, and no new mechanism became unreachable');
if (fails) process.exit(1);
