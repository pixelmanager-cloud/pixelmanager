// A DYNASTY MUST NOT REPLAY THE SAME WORLD FINALS EVERY GENERATION.
//
// `wcEditionDue()` numbered the tournament off `m.season / 4`, and `m.season` is the PER-GENERATION season
// counter — `resetMgrForHeir` puts it back to 1 at every succession. `leagueSeed()` is a constant hash of
// the handle for the life of the save, and `homeNation(starSurname())` never moves because every heir
// carries the family name. So each generation handed `worldCup()` the identical (seed, edition, nation)
// triple and got the identical tournament back: the same sixteen nations, the same group draw, the same
// rival strengths, the same seeded champion — under a header reading "Edition 1" for the fourth time, sixty
// in-game years apart. The edition is not a label: it is the hash input for the field, for the group offset
// that decides which group the star lands in, and for all three narration blurbs (worldCupFinishBlurb /
// wcGroupDramaBlurb / wcKnockoutDramaBlurb). A repeated number is a repeated tournament.
//
// Checked at source level because main.ts is a browser module nothing can import: rather than eyeballing the
// arithmetic, this probe LIFTS the real body of `wcEditionDue()` and the real reset object of
// `resetMgrForHeir()` out of the file, EVALUATES them, and walks a six-generation dynasty through them. A
// future edit that reintroduces a per-generation term is caught by the same assertion. If either can no
// longer be lifted (it moved, or it started reading something other than the manager save) the probe FAILS
// rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/wc_edition_dynasty.ts`
import { readFileSync } from 'node:fs';
import { worldCup } from '@fm/shared';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** The body of a method on Game, from its signature to the first close-brace at method indentation. */
function methodBody(sig: string): string {
  const i = src.indexOf(sig);
  if (i < 0) return '';
  const end = src.indexOf('\n  }', i);
  return end < 0 ? '' : src.slice(i, end);
}

// ── lift `wcEditionDue()` ────────────────────────────────────────────────────────────────────────────
// Everything after `const m = this.loadMgr();` is run verbatim with `m` injected, so the probe measures the
// shipped arithmetic and not a paraphrase of it. It can only do that if the rest of the body is a pure
// function of the manager save — any other `this.` reference and there is nothing here to reason about.
type Mgr = Record<string, any>;
function editionDueFn(): ((m: Mgr) => number | null) | null {
  const body = methodBody('private wcEditionDue()');
  const load = body.indexOf('const m = this.loadMgr();');
  if (load < 0) return null;
  const inner = body.slice(body.indexOf('\n', load));
  if (/this\./.test(inner)) return null;
  return new Function('m', inner) as (m: Mgr) => number | null;
}

// ── lift the succession reset ────────────────────────────────────────────────────────────────────────
// `resetMgrForHeir` is `saveMgr({ ...prior, <literal> } as MgrState)`; the literal is evaluated against a
// simulated `prior`, so whatever the reset really clears (and really carries, by the spread) is what the
// dynasty below is walked through.
function resetFn(): ((prior: Mgr) => Mgr) | null {
  const body = methodBody('private resetMgrForHeir()');
  const a = body.indexOf('...prior,'), b = body.indexOf('} as MgrState');
  if (a < 0 || b < 0 || b < a) return null;
  const lit = body.slice(a + '...prior,'.length, b);
  if (/this\./.test(lit)) return null;
  try { return new Function('prior', `return Object.assign({}, prior, {${lit}});`) as (p: Mgr) => Mgr; }
  catch { return null; }
}

const due = editionDueFn();
const reset = resetFn();
ok(due != null, 'wcEditionDue() can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed');
ok(reset != null, 'resetMgrForHeir()\'s reset object can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed');

console.log('\n=== Six generations of a bloodline, each staging its own World Finals ===');

/** Career lengths in seasons for six generations — a star signs on around 21 and retires in his mid-30s. */
const CAREERS = [11, 13, 9, 16, 10, 12];

/** Walk the dynasty: seasons roll, the star follows each staging (which is what writes `wcSeen`), he
 *  retires, and the heir starts again at season 1 through the real reset. */
function dynasty(dueF: (m: Mgr) => number | null, resetF: (p: Mgr) => Mgr) {
  const staged: { gen: number; season: number; edition: number }[] = [];
  let reoffered = 0;
  let m: Mgr = { season: 1, starGen: 0, results: [] };
  CAREERS.forEach((len, gen) => {
    for (let s = 1; s <= len; s++) {
      m.season = s;
      const e = dueF(m);
      if (e == null) continue;
      staged.push({ gen, season: s, edition: e });
      m.wcSeen = e;                                  // followed it — the once-per-staging gate closes
      if (dueF(m) != null) reoffered++;              // ...and must stay closed for the rest of that season
    }
    m = resetF(m);                                   // the star retires; the heir takes over at season 1
    m.starGen = gen + 1;
  });
  return { staged, reoffered };
}

if (!due || !reset) { ok(false, 'nothing to walk — the checks above already said why'); }
else {
  const { staged, reoffered } = dynasty(due, reset);
  const editions = staged.map((s) => s.edition);
  console.log(`  ..   ${staged.length} stagings over ${CAREERS.length} generations → editions ${editions.join(', ')}`);

  // NOT VACUOUS: a dynasty that never stages a tournament would make every assertion below trivially true.
  ok(staged.length >= 10, `the walk actually stages tournaments (${staged.length} over ${CAREERS.reduce((a, b) => a + b, 0)} seasons)`);

  // the cadence gate still has to hold: one tournament per staging season, not one per re-render
  ok(reoffered === 0, `a followed staging is not offered again the same season (${reoffered} re-offer(s))`);

  const dupes = editions.filter((e, i) => editions.indexOf(e) !== i);
  ok(dupes.length === 0, `no edition number is handed out twice across the bloodline (${dupes.length} repeat(s)${dupes.length ? `: ${[...new Set(dupes)].join(', ')}` : ''})`);

  // MUTATION CONTROL. The assertion above is only worth anything if it can see the defect at all. Feed it
  // the pre-fix derivation on purpose — the per-generation season counter, exactly what shipped — and it
  // must come back with repeats. It does: every generation restarts at Edition 1.
  const broken = dynasty((m) => (m.season % 4 !== 0 ? null : m.wcSeen === m.season / 4 ? null : m.season / 4), reset)
    .staged.map((s) => s.edition);
  const brokenDupes = broken.filter((e, i) => broken.indexOf(e) !== i);
  console.log(`  ..   the same walk on the per-generation counter → editions ${broken.join(', ')}`);
  ok(brokenDupes.length > 0, `the check can see a per-generation edition counter at all (${brokenDupes.length} repeat(s) when forced)`);

  console.log('\n=== ...and a repeated number is a repeated tournament, so the fields must differ ===');

  // The thing the player actually sees. Same save seed, same family nation, same star quality: only the
  // edition moves, because that is the only thing that CAN move between one generation's tournament and the
  // next. If two generations share an edition number they are handed a byte-identical sixteen-nation field.
  const SEED = 987654321, NATION = 'Valdoria', QUALITY = 14;
  const first = new Map<number, { gen: number; field: string }>();
  let replays = 0, compared = 0;
  for (const s of staged) {
    const wc = worldCup(SEED, s.edition, NATION, QUALITY);
    const sig = wc.field.join(',');
    for (const [, prev] of first) {
      if (prev.gen === s.gen) continue;              // within one career, repetition is impossible anyway
      compared++;
      if (prev.field === sig) replays++;
    }
    if (!first.has(s.edition)) first.set(s.edition, { gen: s.gen, field: sig });
  }
  const g0 = worldCup(SEED, staged[0].edition, NATION, QUALITY);
  const g1 = worldCup(SEED, staged.find((s) => s.gen === 1)!.edition, NATION, QUALITY);
  console.log(`  ..   gen 0's first: champions ${g0.champion}, group of ${g0.field.slice(0, 4).join('/')} · gen 1's first: champions ${g1.champion}, group of ${g1.field.slice(0, 4).join('/')}`);
  ok(compared > 0, `there are cross-generation tournaments to compare (${compared} pair(s))`);
  ok(replays === 0, `no generation is handed a field the bloodline has already played (${replays} replay(s) of ${compared} cross-generation pairs)`);
  ok(g0.field.join(',') !== g1.field.join(','), `the heir's first World Finals is not his father's (${g0.champion} vs ${g1.champion} lift it)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the bloodline is replaying a World Finals it has already played` : '\n✓ every generation gets a World Finals of its own');
if (fails) process.exitCode = 1;
