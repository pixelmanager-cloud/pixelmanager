// THE SIDE SUMMER ROUND WAS KEYED A CHAPTER AHEAD OF THE MAIN ONE BESIDE IT.
//
// A band boundary raises TWO focus rounds on the same screen: the main bank, keyed on the chapter that
// just ENDED (`completed` in play()), and a smaller SIDE bank after it, which was keyed on `this.chapter`
// — and `this.turn` has already crossed into the NEXT band by the time either is raised. So the two
// rounds of one summer described two different chapters. Measured before the fix: five of every six side
// rounds offered the next chapter's bank, Establishing's bank was offered twice (turns 104 and 120), and
// Scholar / Youth Team / Breakthrough / First Team were never reachable from their own summer at all —
// four authored banks no player had ever seen. Same shape as the main-bank defect final_summer.ts holds.
//
// IT ALSO HOLDS THE CONTENT THE RE-KEYING FORCED, because that is why the fix sat unshipped. Re-keying
// moves each bank one summer later, which took the sponsors-raising side option OFF the turn-86 summer —
// the exact summer the meter debuts (CHAPTER_METERS['First Team']) — leaving the last third of a career
// with no summer lever for sponsors at all: sponsor_meter.ts went 57/150 to 98/150 careful careers under
// 30, against a <= 90 bar. And it costs the turn-28 summer its side round unless a bank is authored for
// the chapter that ends there. Both are asserted here, so neither can be quietly deleted later.
//
// NOT VACUOUS: the banks are parsed out of career.ts and the parse is asserted BEFORE anything is said
// about the rounds, and the round count is asserted before the keying. A regex that stops matching, or a
// career that stops raising summers, goes red here rather than passing every check under it on nothing.
//
// MUTATION TEST, all five applied to the fixed tree and all five went red: key `sideOpts`/`sideFocusFor`
// back on `this.chapter` (keying, no-bank-twice and reachability go red); revert the `side:` marker in
// current() alone (the marker check goes red — and that flag is what suppresses the lifestyle shop and
// swaps the prompt on the side screen in main.ts); delete the Breakthrough bank's `bootshoot` (the
// sponsors-lever check); delete the Academy bank (the every-summer check); break the parse regex (the
// parse guard). Driven through the Career class directly rather than the facade because everything under
// test — the two banks, the marker, the turn the round lands on — lives in chooseFocus/current().
//
// Run: `npx tsx tools/playtest/side_focus_chapter.ts`
import { readFileSync } from 'node:fs';
import { Career, bandAt, activeMeters, TOTAL_TURNS } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const SKIP = 'side_skip';                    // the "Nothing Else" tile appended to every side bank
const FIRST_SUMMER_CHAPTER = 'Grassroots';   // the age-10-12 summer has no second commitment to make

/** The authored side banks, chapter -> option ids, read out of the source. SIDE_FOCUS_BY_CHAPTER is not
 *  exported and widening the engine's surface just to be measured is a worse trade than a parse — but a
 *  parse that silently stops matching turns every check below it green, so it is asserted first. */
function parseSideBanks(src: string): Record<string, string[]> {
  const start = src.indexOf('const SIDE_FOCUS_BY_CHAPTER');
  const end = start < 0 ? -1 : src.indexOf('\n};', start);
  if (start < 0 || end < 0) return {};
  const banks: Record<string, string[]> = {};
  let chapter = '';
  for (const line of src.slice(start, end).split('\n')) {
    const head = line.match(/^ {2}'?([A-Za-z][A-Za-z ]*)'?: \[$/);
    if (head) { chapter = head[1]; banks[chapter] = []; continue; }
    if (/^ {2}\],$/.test(line)) { chapter = ''; continue; }
    const id = chapter ? line.match(/^\s*\{ id: '([^']+)'/) : null;
    if (id) banks[chapter].push(id[1]);
  }
  return banks;
}

interface Round { seed: number; turn: number; completed: string; entering: string; second: boolean; flag: boolean; ids: string[]; sponsors: boolean }

/** One career, recording every focus round it is offered. The SECOND focus round at a turn is the side
 *  one — derived from the phase order, so `state.side` is something this can check rather than trust. */
function walk(seed: number, track: 'outfield' | 'goalkeeper'): Round[] {
  const c: any = new Career(seed, track);
  const out: Round[] = [];
  const atTurn = new Map<number, number>();
  let guard = 0;
  while (!c.finished && guard++ < 4000) {
    const st: any = c.current();
    if (st.phase === 'focus') {
      const n = atTurn.get(c.turn) ?? 0; atTurn.set(c.turn, n + 1);
      out.push({
        seed, turn: c.turn, completed: bandAt(Math.max(0, c.turn - 1)).band.name, entering: st.chapter,
        second: n === 1, flag: !!st.side,
        ids: st.focus.map((f: any) => f.id).filter((i: string) => i !== SKIP),
        sponsors: st.focus.some((f: any) => (f.effects?.sponsors ?? 0) > 0),
      });
      c.chooseFocus(st.focus[0].id);
    } else if (st.phase === 'arc') c.resolveArc(st.arc.choices[0].id);
    else if (st.phase === 'offer') c.resolveOffer(st.offers[0].id);
    else if (st.phase === 'coach') c.appointCoach(st.coaches[0].id);
    else if (st.phase === 'draft') c.draft(st.options[0].id);
    else c.play(st.hand[0].id);
  }
  return out;
}

console.log('=== The side summer round belongs to the chapter the summer follows ===');

const banks = parseSideBanks(readFileSync('shared/src/career.ts', 'utf8'));
const bankNames = Object.keys(banks);
console.log(`  ..   ${bankNames.length} authored side banks: ${bankNames.map((n) => `${n}(${banks[n].length})`).join(', ')}`);
ok(bankNames.length >= 5 && bankNames.every((n) => banks[n].length >= 2),
  `the side banks were read out of career.ts — without them this probe measures nothing (${bankNames.length} banks)`);

const N = 8;
const rounds: Round[] = [];
for (let s = 0; s < N; s++) rounds.push(...walk(s, s % 2 ? 'goalkeeper' : 'outfield'));
const side = rounds.filter((r) => r.second);
const summers = new Set(rounds.map((r) => `${r.seed}:${r.turn}`));
console.log(`  ..   ${N} careers to turn ${TOTAL_TURNS}: ${summers.size} summers, ${side.length} of them raising a side round`);
ok(side.length > 0 && summers.size > 0, `the careers actually reached their summers (${summers.size} summers over ${N} careers)`);

// ── 1. THE KEYING ────────────────────────────────────────────────────────────────────────────────────
const same = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
const misKeyed = side.filter((r) => !same(r.ids, banks[r.completed] ?? []));
for (const r of misKeyed.slice(0, 4)) {
  const owner = bankNames.find((n) => same(r.ids, banks[n])) ?? '(no bank)';
  console.log(`  ..   seed ${r.seed} turn ${r.turn}: the summer after ${r.completed} offered ${owner}'s bank [${r.ids.join(', ')}]`);
}
ok(misKeyed.length === 0,
  `every side round offers the bank of the chapter that just ended (${side.length - misKeyed.length}/${side.length} rounds)`);

// ── 2. ONE BANK PER SUMMER, ONCE PER CAREER ──────────────────────────────────────────────────────────
let repeats = 0;
for (let s = 0; s < N; s++) {
  const mine = side.filter((r) => r.seed === s).map((r) => bankNames.find((n) => same(r.ids, banks[n])) ?? '?');
  repeats += mine.length - new Set(mine).size;
}
ok(repeats === 0, `no career is offered the same side bank twice (${repeats} repeat rounds)`);

// ── 3. EVERY AUTHORED BANK IS REACHED FROM ITS OWN SUMMER ────────────────────────────────────────────
const reached = new Set(side.filter((r) => same(r.ids, banks[r.completed] ?? [])).map((r) => r.completed));
const dark = bankNames.filter((n) => !reached.has(n));
ok(dark.length === 0, `no side bank is authored and unreachable (dark: ${dark.length ? dark.join(', ') : 'none'})`);

// ── 4. EVERY SUMMER BUT THE FIRST STILL GETS ONE ─────────────────────────────────────────────────────
// Re-keying shifts each bank a summer later, so the turn-28 summer (which follows Academy) loses its side
// round unless a bank is authored for Academy. A summer that silently drops half its screen is the cost
// this fix would otherwise have paid quietly.
const mains = rounds.filter((r) => !r.second && r.completed !== FIRST_SUMMER_CHAPTER);
const noSide = mains.filter((m) => !side.some((r) => r.seed === m.seed && r.turn === m.turn));
ok(noSide.length === 0,
  `every summer past ${FIRST_SUMMER_CHAPTER} raises a side round (${mains.length - noSide.length}/${mains.length}${noSide.length ? `, missing after ${[...new Set(noSide.map((r) => r.completed))].join(', ')}` : ''})`);

// ── 5. THE `side` MARKER MATCHES ─────────────────────────────────────────────────────────────────────
// main.ts reads `state.side` to suppress the lifestyle shop and swap the prompt on the side screen, so a
// marker that disagrees with the round it marks puts the shop back on a screen that has no shop.
const wrongFlag = rounds.filter((r) => r.flag !== r.second);
ok(wrongFlag.length === 0, `state.side marks exactly the side rounds (${rounds.length - wrongFlag.length}/${rounds.length} rounds agree)`);

// ── 6. THE SPONSORS LEVER THE RE-KEYING WOULD HAVE DELETED ───────────────────────────────────────────
const withMeter = rounds.filter((r) => r.second && activeMeters(r.entering).some((m) => m.key === 'sponsors'));
const noLever = withMeter.filter((r) => !r.sponsors);
console.log(`  ..   ${withMeter.length / N} side rounds a career land with the sponsors meter on screen; ${(withMeter.length - noLever.length) / N} of them offer a way to raise it`);
ok(withMeter.length > 0 && noLever.length === 0,
  `every side round with sponsors on screen offers a sponsors option (${withMeter.length - noLever.length}/${withMeter.length}${noLever.length ? `, missing after ${[...new Set(noLever.map((r) => r.completed))].join(', ')}` : ''})`);

console.log(fails
  ? `\n✗ ${fails} side-focus check(s) failed — the smaller summer round is describing a different chapter from the main one beside it, or the sponsors lever that pays for the re-keying has gone`
  : '\n✓ each summer\'s two rounds belong to the same chapter, every bank is reachable once, and sponsors stays raisable');
if (fails) process.exit(1);
