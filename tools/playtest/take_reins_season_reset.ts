// THE SECOND COPY OF THE SUCCESSION RESET HAS TO OBEY THE SAME RULE.
//
// Two places in main.ts put `season: 1` back on the manager save. `resetMgrForHeir` is the documented one,
// and it moves everything keyed by that counter along with it — `wc_edition_dynasty.ts` next door walks six
// generations through it. `doTakeReins` is the other: the take-the-reins-with-another-line path, where the
// player is already managing and picks a brother up off the academy board. It is a partial copy. It resets
// the season and the season's furniture — results, sponsor, cup run, the live World Finals run — but not the
// LEDGERS THE SEASON COUNTER INDEXES INTO. `resetMgrForHeir` never runs on that path (its one caller is
// `succeed()`, and nobody retires when you simply change lines), so nothing else covers for it.
//
// What that costs, in the game:
//   · the World Finals edition number is `wcHeld + season/4`. Send the season back to 1 without advancing
//     `wcHeld` and the new man's season 4 stages an edition the save has already played — `wcData` seeds off
//     (leagueSeed, edition, nation) only, so it is the same sixteen nations, the same group, the same
//     bracket, the same champion, under the same header.
//   · `wcSeen` still holds the last edition the man he replaced followed, so the staging that COLLIDES with
//     it — his season 8 — makes `worldCupHtml` return '' outright: no teaser, no button, no explanation.
//   · `feedFired` keys are `intake:${season}` and `bid:${season}`. Carried across, the previous man's
//     seasons of them pre-fire the new line's, and the youth intake and the incoming bid announce to nobody.
//
// A partial copy of a reset is the shape that rots, so this does not spell-check the key names: it LIFTS the
// object literal `doTakeReins` really saves, EVALUATES it against a synthetic prior state (a star abandoned
// in his ninth season with two World Finals behind him), and then runs the real `wcEditionDue` arithmetic
// and the real `feedOnce` gate over the result — it asks what the next man will be shown. If the code it
// models has moved it FAILS rather than quietly passing over nothing.
//
// MUTATION TEST — each of these must turn a line below red:
//   · drop `wcHeld` from the literal      → 'no staging is a replay' goes red at editions 4 and 5, and if
//     `wcSeen` is missing too (which is how the tree read before this) 'nothing is suppressed' goes with it
//   · drop `feedFired: []`                → the intake/bid count goes red at 18 pre-fired keys
//   · drop `wcSeen: undefined`            → the ended career's ledger check goes red. Say plainly what that
//     one is worth: with `wcHeld` advanced a stale `wcSeen` is arithmetically INERT today, because every
//     edition the new line reaches is strictly greater than any already staged. It is inert by coincidence
//     of one formula, not by design, and it belongs to a career that has ended. Three of the four fields of
//     that ledger already go here; the fourth was missed, and the check holds the rule rather than the
//     coincidence.
//   · add `cupsBanked` to the literal     → the last line goes red. No succession runs here, `succeed()` has
//     banked nobody's cups, and stamping the high-water mark would subtract silverware from the NEXT legend
//     card that was never credited to anyone. That is why this path enumerates the keys instead of calling
//     `resetMgrForHeir()`, and this check is what keeps someone from "completing" the copy that way.
//
// Run: `npx tsx tools/playtest/take_reins_season_reset.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Taking the reins with another line resets what the season counter indexes ===');

// ── 1. the premises — the model below is worth nothing once the code it models reads differently ─────────
ok(src.includes('const edition = (m.wcHeld ?? 0) + m.season / 4;'),
   'wcEditionDue still numbers the edition `wcHeld + season / 4` (the arithmetic this probe replays)');
ok(src.includes('return m.wcSeen === edition ? null : edition;'),
   'wcEditionDue still returns null — no teaser, no button — when `wcSeen` already holds the edition');
ok(src.includes('if (m.season % 4 !== 0) return null;'), 'the World Finals still comes round every 4th season');
ok(/const fired = m\.feedFired \?\? \[\];\s*\n\s*if \(fired\.includes\(key\)\) return;/.test(src),
   'feedOnce still refuses a key that is already in `feedFired`');
ok(src.includes('`intake:${m0.season}`') && src.includes('`bid:${m.season}`'),
   'the youth-intake and incoming-bid feed keys are still stamped with the season number');

// ── 2. lift the object literal doTakeReins saves ─────────────────────────────────────────────────────────
/** The `{ … }` starting at `from`, brace-matched. A byte window guesses; a brace match does not. */
function braced(text: string, from: number): string {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(from, i + 1); }
  }
  return '';
}
const fnAt = src.indexOf('const doTakeReins = async () => {');
ok(fnAt > 0, 'doTakeReins still exists (the take-the-reins-with-another-line path)');
const body = fnAt > 0 ? braced(src, src.indexOf('{', fnAt)) : '';
const saveAt = body.indexOf('this.saveMgr({');
ok(saveAt > 0, 'doTakeReins still enters the manager phase through a saveMgr object literal');
const literal = saveAt > 0 ? braced(body, body.indexOf('{', saveAt)) : '';
ok(literal.includes('...prior') && literal.includes('season: 1'),
   'that literal still spreads the prior save and sends the season back to 1 — the premise of everything below');
if (fails) {
  console.log(`\n✗ ${fails} problem(s) — this probe models code that has moved, so nothing below was measured.`
    + ' Re-point it rather than reading the silence as green.');
  process.exit(1);
}

// ── 3. run the literal, on a star abandoned in his ninth season ──────────────────────────────────────────
// Three editions were staged before his generation; his own seasons 4 and 8 staged editions 4 and 5, and he
// followed the second — so `wcSeen` is 5 and the save's high-water mark is 5.
const HELD = 3, SEASONS = 9;
const staged = HELD + Math.floor(SEASONS / 4);      // the highest edition this save has ever put on
const lived = Array.from({ length: SEASONS }, (_, i) => i + 1);
const prior: any = {
  season: SEASONS, results: [{}, {}, {}], starId: 'old-man', starName: 'The abandoned star', starGen: 2,
  wcHeld: HELD, wcSeen: staged, wcEdition: staged, wcStage: 'done', wcRun: [{ round: 'F', won: true }],
  wcWins: 1, contTitles: 2, cupsBanked: 1,
  feedFired: lived.flatMap((s) => [`intake:${s}`, `bid:${s}`]),
};
console.log(`  ..   prior: season ${SEASONS}, wcHeld ${HELD}, wcSeen ${prior.wcSeen}; ${prior.feedFired.length} feed keys fired`);
ok(prior.feedFired.length > 0 && staged > 0, 'the synthetic prior actually carries a history — this is not measuring zero of zero');

// Every free name in the literal (`s`, `retireAge`, the chosen temper) answers a stub, so a field added to
// it later cannot throw this probe over on a name it has never heard of.
const STUB: any = new Proxy(function () { /* a stub that survives any property access or call */ } as any,
  { get: () => STUB, apply: () => STUB });
const scope = new Proxy({ prior } as any, {
  has: (_t, k) => typeof k === 'string' && !['undefined', 'Math', 'Object', 'Array', 'JSON', 'NaN', 'Infinity'].includes(k),
  // symbols answer undefined: `with` asks the scope for Symbol.unscopables FIRST, and a stub there marks
  // every name unscopable, which sends `prior` out to the global scope and throws.
  get: (t, k) => (typeof k === 'symbol' ? undefined : (k in t ? t[k as string] : STUB)),
});
const next: any = new Function('__scope', `with (__scope) { return (${literal.replace(/ as [A-Za-z_$][\w$.<>[\]|]*/g, '')}); }`)(scope);
ok(next.season === 1, 'the new line starts at season 1 (read back off the evaluated literal)');

// ── 4. the World Finals the new man will actually be shown ───────────────────────────────────────────────
const seasons = [4, 8, 12];
const editions = seasons.map((s) => (next.wcHeld ?? 0) + s / 4);
console.log(`  ..   wcHeld ${prior.wcHeld} → ${next.wcHeld}; the new line's seasons ${seasons.join('/')} stage editions ${editions.join(', ')} against a high-water mark of ${staged}`);
ok(editions.every((e) => Number.isInteger(e)), 'every edition number is a whole number (wcHeld advances by whole stagings)');
const replays = editions.filter((e) => e <= staged);
ok(replays.length === 0, `no staging is a replay of an edition this save has already played (replaying ${replays.join(', ') || 'none'})`);
const suppressed = editions.filter((e) => e === next.wcSeen);
ok(suppressed.length === 0, `no staging is silently suppressed by the previous man's wcSeen (suppressed ${suppressed.join(', ') || 'none'})`);
// The ended career's tournament ledger goes with the career. Three of these four already do.
const leftover = ['wcStage', 'wcEdition', 'wcRun', 'wcSeen'].filter((k) => next[k] !== undefined);
ok(leftover.length === 0, `nothing of the abandoned star's World Finals survives into the new line's save (left behind: ${leftover.join(', ') || 'nothing'})`);

// ── 5. the feed lines the new man will be told about ─────────────────────────────────────────────────────
const carried = (next.feedFired ?? []) as string[];
const muted = lived.flatMap((s) => [`intake:${s}`, `bid:${s}`]).filter((k) => carried.includes(k));
console.log(`  ..   feedFired ${prior.feedFired.length} keys → ${carried.length}; ${muted.length} of the new line's first ${SEASONS} seasons of intake/bid lines are already spent`);
ok(muted.length === 0, `the new line's youth intake and incoming bids can still be announced (${muted.length} pre-fired)`);

// ── 6. and the one thing that must NOT be copied across ──────────────────────────────────────────────────
// `cupsBanked` is stamped by resetMgrForHeir only because succeed() has just banked the retiring man's cups
// onto his legend card. Nobody retires here, so writing it would delete that silverware from the family
// record — the reason this path enumerates its keys rather than calling the sibling reset wholesale.
ok(!/\bcupsBanked\b/.test(literal.replace(/\/\/.*$/gm, '')) && next.cupsBanked === prior.cupsBanked,
   'the cup high-water mark is NOT advanced here — no succession ran, so no cups have been banked onto anyone');

console.log(fails ? `\n✗ ${fails} problem(s) — the new star inherits the last one's season ledgers` : '\n✓ the take-the-reins reset moves everything the season counter indexes');
if (fails) process.exitCode = 1;
