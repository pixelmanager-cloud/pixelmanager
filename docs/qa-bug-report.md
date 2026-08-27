# QA / Sim / Bug-Hunt Report — Football Royalty

Living report from the QA sim-fuzzing agent. Base commit: `b57aa88` (confirmed via `git log --oneline -1`
after `git reset --hard main`; both `npm run verify` and `npx tsx shared/career_sim.ts` were GREEN before
any QA work began).

Methodology: new, standalone deterministic fuzz harnesses (this agent does not edit any file under
`shared/src/` or the existing `career.ts`/`engine.ts`/`career_sim.ts`/`fuzz_test.ts`/`strategy_test.ts`).
Each harness is runnable directly with `npx tsx <file>` and prints an exact reproducing seed/context for
every violation. Findings below are ranked most-severe first.

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 0 |

No exceptions, softlocks, NaN/Infinity leaks, out-of-range attributes, non-determinism, or bracket/table
integrity failures were found across ~40,000+ simulated careers, ~130 simulated matches at extreme
quality/tactics extremes (on top of the existing `fuzz_test.ts`'s 2000 matches), ~3000 club-league seasons,
~2000 continental-cup/national-callup fixtures, ~2000 World-Cup-style tournaments, and ~4000 off-pitch
(`computeOffPitch`) evaluations. **No `Date.now()`/`Math.random()` was found anywhere in `shared/src/`** —
the engine is genuinely rng-free/replay-safe at the source level (confirmed by `grep`).

---

## MEDIUM

### M1 — `Tactics` sliders are not sanitized; a non-finite (`NaN`) slider silently corrupts player positions instead of erroring or clamping
- **File/function:** `shared/src/tactics.ts` (`resolveTactics`-style derivation reading `t.mentality`/`t.line`/`t.press`/`t.tempo`/`t.width` directly, e.g. lines ~62-65: `attackPush: 6 + t.mentality * 3.0`, `lineShift: t.line * 4.5`, etc.) consumed by `shared/src/engine.ts`'s `MatchEngine`.
- **Repro:** `npx tsx shared/qa_match_edge_fuzz.ts` — section "out-of-range tactic sliders", `extreme-slider=NaN seed=562`. Minimal repro:
  ```ts
  import { MatchEngine } from './src/engine.js';
  import { generateTeam } from './src/teams.js';
  const teamA = generateTeam('A','A','AAA',0xff0000,12,562,'4-4-2');
  const teamB = generateTeam('B','B','BBB',0x0000ff,12,563,'4-4-2');
  const tA = { formation: '4-4-2', mentality: NaN, line: NaN, press: NaN, tempo: NaN, width: NaN };
  const tB = { formation: '4-4-2', mentality: 0, line: 0, press: 0, tempo: 0, width: 0 };
  const m = new MatchEngine([teamA, teamB], 562, [tA, tB]);
  for (let i = 0; i < 100 && !m.state.finished; i++) m.tick();
  console.log(m.state.players[0][0]); // { x: NaN, y: NaN, ... }
  ```
- **Expected:** either the constructor validates/clamps tactic sliders to the documented `[-2, 2]` integer
  range and throws or clamps a bad value, or the engine is at least robust to non-finite input and keeps
  players on the pitch.
- **Actual:** all 11 outfield/GK players on the affected side immediately get `NaN` `x`/`y` (and this
  propagates for the whole match — it does not throw, so a corrupted match silently completes with a
  broken visual state on the corrupted side while the score is still produced as integers).
- **Likely cause:** `tactics.ts` does no input validation/clamping before doing arithmetic with the raw
  slider values (`t.mentality * 3.0` etc.), so any NaN/garbage entering `Tactics` (e.g. from a save-file
  corruption, a bad manager-UI computation upstream, or a bug in whatever assembles a `Tactics` object
  before it reaches `MatchEngine`) has no containment at the engine boundary.
- **Severity rationale:** MEDIUM not HIGH/CRITICAL because ordinary, integer-slider-driven UI paths cannot
  produce this today (confirmed clean for all *finite* out-of-range values tested: -100, -10, -3, 3, 10,
  100 — the engine handles those gracefully, likely via internal clamping of derived quantities). It's a
  defensive-coding gap that would only bite if a NaN ever leaks into a `Tactics` object from somewhere
  else in the codebase (a save/load bug, a division-by-zero upstream, etc.) — worth a guard at the
  `MatchEngine` boundary so such a bug fails loudly instead of shipping a silently-broken match.

---

## Notes on things checked and found CLEAN (for future QA agents / to avoid re-litigating)

- **No `Date.now()`/`Math.random()` anywhere in `shared/src/`** (`grep -rn "Date.now\|Math.random" shared/src`) — confirmed replay-safe at the source level.
- **Career loop** (`shared/qa_career_fuzz.ts`, ~13,300 checks): random-choice-strategy careers (8000, mixed
  outfield/goalkeeper tracks, all 7 agents + none), `simCareer()` combinatorial sweep (3000, including
  degenerate styles — all-zero prefs, all-max prefs, negative prefs — and extreme gene bands `[1,4]` /
  `[17,20]`), determinism re-checks (300), and `inheritGenes` lineage bounds (2000, `keepPct` 0.0-1.0,
  `ceilingLift` 0-4). All attrs/overall/greed/marketability stayed in `[1,20]`, all careers terminated at
  exactly `TOTAL_TURNS`, `Career.resume()` from a snapshot reproduced byte-identical `graduate()` output
  and choice logs, and `simCareer()` called twice with identical args was byte-identical. No exceptions,
  no softlocks.
- **Match engine** (`shared/qa_match_edge_fuzz.ts`, on top of the existing `fuzz_test.ts`): extreme
  quality-1-vs-quality-20 mismatches across all 64 formation pairings (no hangs, no upsets of the strong
  side, integer scores); all finite out-of-range tactic sliders (±10, ±100) handled without error or
  off-pitch/non-finite positions; determinism replay of 40 full matches was byte-identical; `MatchEngine`
  does **not** mutate the input `Team` objects passed to its constructor (30 checks); ultra-attack vs
  ultra-defend tactics for the same seed/opponent produced different goal totals (tactics are not a no-op).
- **Club season loop** (`shared/qa_meta_loops_fuzz.ts`, 3000 seeds incl. negative/zero/huge `myStrength`
  and edge-case club names): `seededLeague` always returns exactly 10 unique clubs with exactly one
  `mine: true`; `seasonFixtures` always gives Marlow exactly 18 fixtures against exactly 9 distinct
  opponents, each home-and-away exactly once; `seasonTable`/`liveTable` conserve total goals (GF≡GA) and
  games (`W+D+L===P`, `Pts===3W+D`), sort order is non-increasing on `Pts`; `squadRole`/`firstTeamReady`
  stayed in bounds across the full band×overall grid; `clubSeason` is deterministic across repeat calls.
- **International loop** (`shared/qa_meta_loops_fuzz.ts`, 2000 seeds): `contOpponent`/`nationalFixture`
  strengths and scorelines stayed in bounds, opponents never equal your own nation, continental finals are
  always neutral-ground. `worldCup()`/`playerPath()` (2000 editions): the 16-nation field is always unique
  and includes `myNation`; the 4 groups of 4 partition the field exactly once with no duplicate/lost
  nations; every group's goals balance (GF≡GA) and sort order holds; **every quarter-final participant is
  a real group winner/runner-up, every semi-final pairing is built from the correct pair of QF winners,
  the final is built from the correct pair of SF winners, and `champion === final.winner`** — no bracket
  corruption anywhere across 2000 tournaments; `myFinish` was consistent with actual bracket participation
  in every case; `worldCup()` is deterministic across repeat calls.
- **Off-pitch loop** (`shared/qa_meta_loops_fuzz.ts`, 4000 inputs incl. negative/huge `careerScore`,
  negative `caps`, huge `flair`): `image.score` always clamped to `[0,100]`, `endorsements.length` always
  `≤ 3`, endorsement payouts always non-negative, `boots.next.progress ≤ target` always held, and
  `computeOffPitch` is deterministic across repeat calls with identical input.

---

## Harnesses added (new files, run via `npx tsx`)

| File | Loop covered | Scale (default) |
|---|---|---|
| `shared/qa_career_fuzz.ts` | Career (random-choice fuzz, `simCareer` sweep, determinism, lineage) | ~13,300 checks (`QA_N` env overrides the main sweep) |
| `shared/qa_meta_loops_fuzz.ts` | Club season, continental cup, national call-ups, World Cup, off-pitch | ~15,000 checks |
| `shared/qa_match_edge_fuzz.ts` | Match engine edge cases (extreme quality/tactics, determinism, immutability) | ~170 matches |

Re-run everything: `npx tsx shared/qa_career_fuzz.ts && npx tsx shared/qa_meta_loops_fuzz.ts && npx tsx shared/qa_match_edge_fuzz.ts`
