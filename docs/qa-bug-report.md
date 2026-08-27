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
| MEDIUM | 2 |
| LOW | 1 |

**Update (deeper autonomous pass, still on `b57aa88`):** added 4 more standalone harnesses covering the
full multi-generation dynasty/fusion loop, `careerState()` (the server's presentational layer) driven
turn-by-turn, and documented-threshold/boundary exactness. Found one more MEDIUM (M2, the same root
pattern as M1 — see below) in a second, independent location; everything else (7500+ simulated
generation-lifecycles across 300 dynasties 25 generations deep, ~168,000 `careerState()` calls, and
thousands of threshold/boundary probes) came back clean.

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

### M2 — Same root cause as M1, second location: `tieScore()`/`simMatch()` propagate `NaN` strength straight into `NaN` goals in both `shared/src/intl.ts` (World Cup / continental cup) and `shared/src/clubseason.ts` (the club league)
- **File/function:** `shared/src/intl.ts`'s `tieScore(aStr, bStr, h, neutral)` — `const diff = (aStr - bStr) * 0.12 + ...; const gh = Math.min(6, Math.max(0, Math.round(1.2 + diff + ...)));` — and the structurally identical `simMatch()` in `shared/src/clubseason.ts`. Both do arithmetic directly on the raw strength inputs with no finiteness check, and `Math.max(0, NaN)` / `Math.min(6, NaN)` are themselves `NaN`, so the "clamp" does nothing for a `NaN` input.
- **Repro:** `npx tsx shared/qa_boundary_fuzz.ts` — section "worldCup nation-strength extremes". Minimal repro:
  ```ts
  import { worldCup } from './src/intl.js';
  import { clubSeason } from './src/clubseason.js';
  const wc = worldCup(12345, 1, 'Astoria', NaN);
  console.log(wc.groups[0].rows[0]); // { ..., GF: NaN, GA: NaN, GD: NaN, Pts: <still an integer> }
  const cs = clubSeason('Marlow', NaN, 0.5, 12345);
  console.log(cs.me); // { ..., GF: NaN, GA: NaN, GD: NaN, W: 0, D: 18, L: 0, Pts: 18 }
  ```
- **Expected:** goal tallies stay finite integers (or the function rejects/clamps a non-finite strength) regardless of what's passed in as a team/nation "strength".
- **Actual:** every goals-for/goals-against cell for the affected side becomes `NaN` (silently propagating through the whole tournament/season — `GD` becomes `NaN` too), while `W`/`D`/`L`/`Pts` stay valid integers because `gh > ga` / `gh < ga` both evaluate `false` for `NaN` operands, so the match is scored as a **draw** by default. This means a `NaN` strength doesn't even fail visibly in the standings table — it just quietly turns every affected fixture into a 0-pt-looking draw with garbage goal columns.
- **Likely cause:** identical pattern to M1 — pure presentational/simulation modules that assume their numeric inputs are already sane (a real `Player.overall`/pedigree-derived strength is always `[1,20]` in practice) and never guard against a `NaN` leaking in from a bad upstream computation (e.g. a division by a zero-length roster, an unset stat defaulting to `undefined` and coercing to `NaN`, etc.).
- **Severity rationale:** MEDIUM, same reasoning as M1 — not reachable through the normal gameplay paths audited in this pass (`careerState()`'s club-season/international code always feeds a real overall-derived strength), but it's the *second* independent module found with this exact defensive-coding gap, which suggests it's a systemic pattern worth a single shared clamp/finite-guard utility rather than three separate point fixes (`tactics.ts`, `intl.ts`, `clubseason.ts`).

---

## LOW

### L1 — `contractCost()` has no input validation; a `greed` below about −8 makes the extension fee go NEGATIVE
- **File/function:** `shared/src/contracts.ts`, `contractCost(overall, age, greed, earnings)`: `greedFactor = 0.6 + 0.08 * greed` goes negative once `greed < -7.5`, and the function returns `Math.round(overall * overall * 1.2 * ageFactor * greedFactor * wageMult)` — a negative multiplier flows straight through to a negative final cost.
- **Repro:** `npx tsx shared/qa_economy_fuzz.ts` — section "contracts.ts fuzz", out-of-domain note. Minimal repro:
  ```ts
  import { contractCost } from './src/contracts.js';
  console.log(contractCost(12, 27, -15, 0)); // negative coin cost to extend a contract
  ```
- **Expected:** a contract extension should never cost negative coins (at worst free / a small floor).
- **Actual:** returns a negative number once `greed <= -8`.
- **Why LOW not MEDIUM/HIGH:** `greed` is **always** produced by `career.ts`'s `graduate()`, which clamps it to `[1, 20]` before it's ever stored on a player — so this path is not reachable through any normal gameplay flow found in this codebase today. It's purely a defensive-coding gap: `contractCost`/`contractView` take a raw `number` with no validation, so if any future caller (a save-migration script, a manually-constructed test player, a modding/debug tool) ever passes an ungoverned `greed` value, the economy silently produces a negative wage instead of erroring. A one-line `clamp(greed, 1, 20)` (or documenting the precondition loudly) at the top of `contractCost` would close this off cheaply.

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
- **Manager-side economy** (`shared/qa_economy_fuzz.ts`, ~14,000 checks across `contracts.ts`,
  `prestige.ts`, `morale.ts`, `legacy.ts`, `staking.ts` within each module's real/documented input
  domain): `contractCost`/`contractLength`/`releaseClause` stay non-negative and in-bounds for the
  realistic `greed ∈ [1,20]` domain those values actually come from; `contractActive`'s expiry boundary
  is exact (active the season before expiry, inactive at/after); `managerPrestige.progress` stays in
  `[0,1]` and `levelIdx` in range across thousands of randomized (including malformed/out-of-band)
  `ManagerRecord`s; a 5000-event morale random-walk plus `driftMorale` never left `[0,100]`;
  `moraleEffects`' `extendMult`/`sellMult` stayed within their documented caps even for wildly
  out-of-range starting morale; `legacyCard.mintable` was consistent with the `legendRating ≥ 65`
  threshold in every one of 3000 cases; `staking.ts`'s discount/progress/bonus functions all stayed
  bounded across extreme (including negative and huge) tenure values. One LOW finding (L1) came out of
  deliberately probing `contractCost` far outside the domain its `greed` input is ever actually
  constructed in.
- **Full dynasty/fusion loop, end-to-end, many generations** (`shared/qa_dynasty_fuzz.ts`, 300 dynasties
  × 25 generations = 7500 generation-lifecycles, plus a 10-dynasty and a 90-generation-career deep pass):
  drove the whole chain a save actually walks — career → `graduate()` → 15 simulated pro seasons (real
  `clubSeason()` table positions + continental-cup runs via real `contOpponent()`/`tieScore()`, attrs
  developed each season via the server's real, pure `developAttrs()`) → retirement (`legacyCard()`) →
  reborn (`legacyBoost()` → `inheritGenes()` → the next generation), repeated 25 generations deep from one
  root seed. Every generation's attrs/overall/genes stayed in bounds with **no cross-generation drift or
  blow-up** (pedigree stayed in `[0,1]`, gene ceilings stayed in `[1,20]` every generation, no runaway
  accumulation past a 5,000,000-coin sanity cap across the whole mirrored economy-bridge chain —
  `CLUB_WAGE_CUT`/`PRO_SIGNING_SHARE`/`RETIREMENT_LEGACY_SHARE`, mirrored from `server/src/index.ts`'s
  route-local consts since they aren't exported). **The entire multi-generation chain replayed
  byte-identically from the same root seed** across 10 full dynasties, and a dedicated replay-round-trip
  pass (`Career.resume()` from a snapshot → `graduate()`) matched the original `graduate()` output exactly
  across 90 generation-careers spanning multiple dynasties.
- **`careerState()` stress** (`shared/qa_career_state_fuzz.ts`, up to 1500 full careers driven turn-by-turn
  through the server's actual presentational function — ~168,000 `careerState()` calls, using a
  minimal hand-built `Token` fixture since `careerState()` needs no DB/network): both tracks, all 7
  agents + none, `clubName` present/absent, `clubLevel` 0-4, and a "badPlayer" policy (always plays the
  worst-fit card) specifically to depress recent form and exercise low-form/legacy-pressure paths. Every
  presentational field checked every turn: `profile` (`currentOverall`/`potential` ∈ `[1,20]`, `stars` ∈
  `[1,5]`), `offPitch`, `clubSeason`, `international`, `objective` (`progress ≤ target`, `done` consistent),
  `handoff` (only fires with `apps ≥ 11`, matching the source's own gate), and the **"weight of the
  name" legacy-pressure** narrative path for heirs of a legend (`generation > 0 && pedigree ≥ 0.6`) — all
  code paths (legacy-pressure, handoff, off-pitch, international call-ups, objectives, chapter recaps)
  were confirmed to actually fire during the sweep, not just theoretically reachable. No exceptions, no
  malformed fields, at any turn, in any phase.
- **Boundary/threshold exactness** (`shared/qa_boundary_fuzz.ts`): `ageOf()` clamps to `[25,40]` and hits
  the retirement age (`40`) at exactly `season = primeSeason + 15`, never before, and stays pinned at `40`
  after (100 `(prime, season)` pairs); `squadRole()`'s status label (`Key player`/`Regular starter`/
  `Squad rotation`/`Breaking in`) matched its own documented apps-threshold in all 182 `(band, overall)`
  cells; `firstTeamReady()` matched its documented `9 + clubLevel*1.2` formula exactly across 2002
  `(band, clubLevel, overall)` cells; `computeOffPitch()`'s image-tier, endorsement-count, endorsement-tier
  and reputation-edge cut points all flip exactly where documented; the off-pitch temptation gate's
  empirical trigger rate over 20,000 turns matched its documented ~26% (edgy)/~12% (clean) odds to within
  1 percentage point. **This pass is also where M2 was found** (`worldCup()`'s `NaN`-strength probe).

---

## Harnesses added (new files, run via `npx tsx`)

| File | Loop covered | Scale (default) |
|---|---|---|
| `shared/qa_career_fuzz.ts` | Career (random-choice fuzz, `simCareer` sweep, determinism, lineage) | ~13,300 checks (`QA_N` env overrides the main sweep) |
| `shared/qa_meta_loops_fuzz.ts` | Club season, continental cup, national call-ups, World Cup, off-pitch | ~15,000 checks |
| `shared/qa_match_edge_fuzz.ts` | Match engine edge cases (extreme quality/tactics, determinism, immutability) | ~170 matches |
| `shared/qa_economy_fuzz.ts` | Manager economy: contracts, prestige, morale, legacy cards, staking | ~14,000 checks |
| `shared/qa_dynasty_fuzz.ts` | Full multi-generation dynasty/fusion loop (career→pro→retire→reborn) | 300 dynasties × 25 gens (`QA_ROOTS`/`QA_GENS` env) |
| `shared/qa_career_state_fuzz.ts` | `careerState()` driven every turn (server presentational layer) | 250 careers by default (`QA_N` env; run at 1500 in this pass) |
| `shared/qa_boundary_fuzz.ts` | Documented-threshold exactness: ageOf, squadRole, firstTeamReady, worldCup extremes, offPitch tiers/temptation | ~4300 boundary probes |

Re-run everything:
```
npx tsx shared/qa_career_fuzz.ts && npx tsx shared/qa_meta_loops_fuzz.ts && npx tsx shared/qa_match_edge_fuzz.ts && \
npx tsx shared/qa_economy_fuzz.ts && npx tsx shared/qa_dynasty_fuzz.ts && npx tsx shared/qa_career_state_fuzz.ts && \
npx tsx shared/qa_boundary_fuzz.ts
```

## Known limitations of this pass (for the next QA agent)

- **`qa_dynasty_fuzz.ts`'s economy-bridge constants are mirrored, not imported.** `CLUB_WAGE_CUT`,
  `PRO_SIGNING_SHARE` and `RETIREMENT_LEGACY_SHARE` live as un-exported consts inside route handlers in
  `server/src/index.ts` (search for those names). If a future change edits those numbers, this harness's
  copies will silently go stale — worth exporting them from `server/src/index.ts` (or a shared constants
  module) so a test can import the real values instead of a hand-copied literal.
- **`qa_dynasty_fuzz.ts`'s pro-season simulation is a simplified proxy**, not a literal replay of the
  server's season-rollover (`server/src/lifecycle.ts`'s `advanceTokensAtRollover`, `server/src/seasons.ts`)
  — it calls the same real, pure `clubSeason()`/`contOpponent()`/`tieScore()`/`developAttrs()` functions
  the server uses, but the season-to-season bookkeeping (apps counted, promotion tracking — `promotions`
  is currently hard-coded to 0 in this harness, not modeled) is a hand-rolled approximation. It's good
  enough to stress the shared math across many generations, but a bug that only manifests in the DB-backed
  `advanceTokensAtRollover`/`ensureSeason` orchestration itself (transaction ordering, partial writes,
  concurrent owners, etc.) would need a DB-backed integration harness, which this pass did not build.
- **`retireAgeFor`, as such, does not exist in the codebase** — retirement age is a fixed literal
  (`age >= 40`) checked in `server/src/lifecycle.ts#advanceTokensAtRollover`, with `ageOf()` (in
  `server/src/tokens.ts`) doing the clamping. This report's ageOf boundary checks cover the equivalent
  ground the request described.
