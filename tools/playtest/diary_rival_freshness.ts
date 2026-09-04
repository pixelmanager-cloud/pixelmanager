// THE DIARY ONLY GETS TO SAY "FINALLY" ON THE NIGHT IT HAPPENED.
//
// `rivalFirstWin`'s docstring promises "the opponent beaten for the very first time BY THE MOST RECENT
// MATCH", but the body never looked at the most recent match: it pulled the last MEETING with the rival
// (`meetings[meetings.length - 1]`) and judged that. The rival is pinned to the first opponent met twice,
// which in an 18-round double round-robin is always the matchday-1 side, met again on matchday 10 — so once
// that rematch was a first win, RIVAL_FIRST_WIN stayed a live candidate at weight 40 (the highest in the
// whole picker: the table zones are 35, generic is 6) for every remaining matchday of the season. Every line
// in that bank is written for the moment — "Finally", "at last", "long in coming" — so the player was told
// four and five times, in four different wordings, that a win from up to eight games ago had just happened,
// including on the evening of a 1-4 hammering by somebody else. Measured by this probe over 300 seasons on
// the real `seasonFixtures` schedule before the gate: 237 of the 266 rival-breakthrough lines the diary
// printed (89%) landed on a matchday later than the win, across 59 of the 300 seasons. Its sibling
// `revengeWin` always read the last match correctly; this one was written from the same shape, and nobody
// re-read what it did with the opponent name after F-045 threaded that name in.
//
// Asserted end to end through `gaffersDiaryEntry` — the exported surface — driven exactly the way the hub
// drives it in main.ts (`seasonFixtures` for the opponent per round, `liveTable` for the table), because the
// defect is not in the predicate in isolation, it is in what the player reads on the hub.
//
// THE VACUITY GUARDS MATTER MORE THAN USUAL HERE. A gate on the rival storyline could go green by simply
// never firing, so two counts sit under the assertion: fresh rival lines must still be > 0 (the storyline
// still reaches the player), and the stale WINDOW — matchdays where the pinned rival's last meeting was a
// first win while the side played somebody else that night — must be > 0, which is the mutation test: delete
// the gate and RIVAL_FIRST_WIN is a live weight-40 candidate on every one of those matchdays again.
//
// The bank is lifted out of the source and evaluated rather than pattern-guessed, so a reworded line cannot
// make the detector silently stop recognising rival prose; if it can no longer be lifted the probe FAILS
// rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/diary_rival_freshness.ts`
import { readFileSync } from 'node:fs';
import { gaffersDiaryEntry, seasonFixtures, liveTable, goalPair, mixSeed, makeRng, type DiaryMatch, type PlayedResult } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log("=== The Gaffer's Diary names the club it just played ===");

/** Lift `const RIVAL_FIRST_WIN ... = [ ... ];` out of the module and hand back the eight renderers. */
function rivalBank(): ((r: string) => string)[] | null {
  const src = readFileSync('shared/src/gaffersDiary.ts', 'utf8');
  const i = src.indexOf('const RIVAL_FIRST_WIN');
  if (i < 0) return null;
  const open = src.indexOf('[', i), close = src.indexOf('\n];', open);
  if (open < 0 || close < 0) return null;
  try {
    const bank = new Function(`return ${src.slice(open, close + 2)};`)() as ((r: string) => string)[];
    return bank.length && typeof bank[0] === 'function' && bank[0]('X').includes('X') ? bank : null;
  } catch { return null; }
}

const BANK = rivalBank();
ok(!!BANK, `the RIVAL_FIRST_WIN bank can still be lifted out of gaffersDiary.ts (${BANK?.length ?? 0} line(s) — a probe that cannot find it fails, it does not pass)`);

if (BANK) {
  const CLUB = 'Marlow', SEASONS = 300;
  const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  /** Which opponent, if any, does this entry name in RIVAL_FIRST_WIN prose? */
  const rivalNamed = (entry: string, names: string[]) => names.filter((n) => BANK.some((t) => entry.includes(t(n))));

  let fresh = 0, stale = 0, staleWindow = 0, entries = 0;
  const staleSeasons = new Set<number>();
  const shown: string[] = [];

  for (let s = 0; s < SEASONS; s++) {
    const seed = hashStr(`save${s}`) >>> 0;
    const fx = seasonFixtures(CLUB, seed, 1);
    const names = [...new Set(fx.map((f) => f.oppName))];
    const rng = makeRng(seed ^ 0x1234);
    const results: PlayedResult[] = [];
    for (let r = 0; r < fx.length; r++) {
      const diff = (rng() * 1.2 - 0.5) + (fx[r].venue === 'H' ? 0.25 : -0.1);   // one engine, same goalPair the hub sims with
      const [mine, theirs] = goalPair(mixSeed((seed ^ (r * 7919)) >>> 0), diff);
      results.push({ myGoals: mine, oppGoals: theirs });
    }

    for (let k = 1; k <= results.length; k++) {
      const played = results.slice(0, k);
      const matches: DiaryMatch[] = played.map((r, i) => ({ id: `s1-m${i}`, myScore: r.myGoals, oppScore: r.oppGoals, oppId: fx[i].oppName, oppHandle: fx[i].oppName, createdAt: i }));
      const t = liveTable(CLUB, 62, 1, seed, played, 1, (seed ^ 0x99) >>> 0);
      const entry = gaffersDiaryEntry({ seasonNumber: 1, matches, table: { position: t.pos, total: t.size, promote: 3, relegate: 2, points: t.me.Pts, topFlight: true } });
      const lastOpp = fx[k - 1].oppName;
      entries++;

      for (const n of rivalNamed(entry, names)) {
        if (n === lastOpp) fresh++;
        else {
          stale++; staleSeasons.add(s);
          if (shown.length < 3) shown.push(`seed ${s} MD${k}, ${played[k - 1].myGoals}-${played[k - 1].oppGoals} vs ${lastOpp}, still announcing ${n}: "${entry}"`);
        }
      }

      // The window the stale line used to fill: rival pinned the way the picker pins it, its last meeting a
      // first win, and somebody else played tonight. Data only — true whether or not the gate exists.
      const counts = new Map<string, number>();
      for (const m of matches) counts.set(m.oppId, (counts.get(m.oppId) ?? 0) + 1);
      let rivalId: string | null = null, best = 1;
      for (const [id, c] of counts) if (c > best) { best = c; rivalId = id; }
      if (rivalId && rivalId !== lastOpp) {
        const meet = matches.filter((m) => m.oppId === rivalId);
        const lm = meet[meet.length - 1];
        if (lm.myScore > lm.oppScore && !meet.slice(0, -1).some((m) => m.myScore > m.oppScore)) staleWindow++;
      }
    }
  }

  console.log(`  ..   ${entries} diary entries over ${SEASONS} seasons x 18 matchdays on the real seasonFixtures schedule`);
  console.log(`  ..   ${fresh} rival-breakthrough line(s) on the night of the win, ${stale} on a later matchday (${staleSeasons.size}/${SEASONS} seasons affected)`);
  console.log(`  ..   ${staleWindow} matchday(s) sat inside the stale window — remove the gate and all of them are weight-40 candidates again`);
  for (const e of shown) console.log(`  ..   ${e}`);

  ok(staleWindow > 0, `the sweep really does reach the stale window (${staleWindow} matchday(s)) — this measurement is not zero of zero`);
  ok(fresh > 0, `the breakthrough still gets announced at all (${fresh} line(s) on the matchday it happened) — the gate narrowed the storyline, it did not delete it`);
  ok(stale === 0, `and never afterwards (${stale} stale announcement(s) over ${entries} entries)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the diary is announcing a win the season has moved on from` : "\n✓ the diary's rival breakthrough belongs to the match that earned it");
if (fails) process.exitCode = 1;
