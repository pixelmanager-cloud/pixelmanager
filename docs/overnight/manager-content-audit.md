# Manager-career content audit (overnight pass, 2026-08-27)

Scope: `shared/src/clubseason.ts`, `shared/src/intl.ts`, `shared/src/gaffersDiary.ts`,
`shared/src/prestige.ts`, and adjacent manager-facing off-pitch content. Read-only survey
of `career.ts` / `offpitch.ts` / `narrate.ts` (owned by the player-lane worker) for context only.

## What exists today

- **`gaffersDiary.ts`** — the only piece of running *prose* in the manager hub. One
  headline per season-state, chosen by a rigid if/else priority chain over 8 categories
  (rival first win, relegation watch, promotion places, promotion hunt, win streak,
  unbeaten, winless, generic). Each category has only **2-4 phrase variants**. Across a
  38-round season the same 2-3 sentences recur constantly once a team settles into
  mid-table — there is no category at all for a big win, a big loss, a high-scoring
  thriller, a clean-sheet run, a goal drought, a draw-heavy patch, a play-off-zone
  battle, or a hot/cold form swing. The priority chain also means once a higher-priority
  condition is true it ALWAYS wins — no randomised competition between simultaneously
  true storylines, which is a second source of sameness.
- **BUG**: `rivalFirstWin()` groups matches by `oppId`. The real call site
  (`client/src/main.ts` `refreshDiary()`) currently always passes `oppId: '', oppHandle: ''`
  for every league match (the local season sim doesn't yet carry real opponent identity
  into the diary feed). Because every match shares the same `''` id, the function can
  fire its "first win over `<rival>`" headline with an **empty name** interpolated
  ("Finally — the hoodoo against  is over."). Fixed defensively in `gaffersDiary.ts`
  (skip rival detection when the handle is blank) without touching `main.ts`.
- **`clubseason.ts`** — a solid, pure league simulator (table, fixtures, live table).
  Zero narrative text of its own; it only produces numbers. No bugs found in the
  scheduling/table math during this pass (round-robin, points, sort order all check out
  under fuzzing — see `shared/qa_manager_content_fuzz.ts`).
  Two tiny robustness gaps addressed: `squadRole` and `clubSeason` had no explicit guard
  against a non-finite/absurd `marlowStrength` input reaching `seededLeague`; strengthened
  the existing `simMatch`/`tieScore` NaN guards to also cover the blended club-strength
  computation so a corrupt save can't propagate `NaN` into the table.
- **`intl.ts`** — continental cup, national call-ups, World-Cup-style finals: all
  well-modelled structurally (seeded strength ladder, knockout math, group tables), but
  it is **pure data** — no manager-facing prose at all. A cup exit or a call-up is just
  numbers today; there's no "how it felt" line the way the domestic diary has one.
- **`prestige.ts`** — a clean scoring/level model, but crossing a rank (Rookie Gaffer →
  Local Hero → … → Immortal Gaffer) is silent; there's no flavour text for the moment a
  manager's reputation actually levels up.
- Off-pitch systems named in the brief (staff hires, mentoring, board mood tracked
  season-to-season, standing sponsorship sagas) **do not exist as systems yet** —
  `facilities.ts` (owned adjacent, not touched) covers static per-club upgrades and a
  flat sponsor-income number, but there's no running "board mood" or "press" state
  machine anywhere in `shared/src`. This is the single biggest thin spot for depth.

## What was added this pass (see commits)

1. Fixed the empty-rival bug in `gaffersDiary.ts` (defensive guard, no client change).
2. Rebuilt `gaffersDiaryEntry` from a rigid if/else chain into a weighted-candidate
   picker: every applicable storyline for the current match log is collected, then one
   is chosen by seeded RNG (weighted so season-defining events like promotion/relegation
   still dominate over routine ones). Added ~14 new storyline categories (big win/loss,
   thriller, clean-sheet run, leaky-defence run, goal drought, sharpshooting run,
   draw-heavy run, momentum-swing/streak-snapped, revenge win, season-opener, play-off
   hunt, form upturn/downturn) on top of the original 8, and expanded every existing
   pool from 2-4 lines to 8-12. All new categories are derived purely from the existing
   `matches`/`table` inputs already passed by both call sites — no signature break.
3. Added narrative flavour generators to `intl.ts` for continental-cup ties and
   World-Cup-run finishes (deterministic, seeded, additive exports) — not yet wired into
   `client/src/main.ts` (out of my lane; flagged in the backlog below).
4. Added a rank-up flavour line generator to `prestige.ts` (additive export) — same
   "ready but not yet wired into the client" status.
5. Added `shared/qa_manager_content_fuzz.ts`: a determinism + crash + variety fuzz
   harness over `gaffersDiaryEntry`, `clubSeason`/`liveTable`, `contOpponent`, `worldCup`,
   and `prestigeScore`/`managerPrestige` across thousands of seeded inputs. Not wired
   into `npm run verify` (didn't want to touch the shared `package.json` mid-pass without
   coordinating), but run manually before every commit in this session — see final report.

## Remaining backlog (for relaunch / next worker)

- **Wire the new `intl.ts` tie/World-Cup flavour lines and the `prestige.ts` rank-up
  line into `client/src/main.ts`** — currently only numbers are rendered for continental
  ties, national call-ups, and prestige rank-ups. This is a client (UI-shell) change and
  intentionally left out of this lane's commits.
- **Real opponent identity in the local season sim.** `refreshDiary()` in `main.ts`
  synthesises `matches` with blank `oppId`/`oppHandle` every call. Once the local season
  sim carries a stable per-fixture opponent id, `gaffersDiary.ts`'s rival/revenge
  detection will start actually firing (right now it's a no-op due to the blank-name
  guard). This is the single highest-leverage follow-up for the diary system.
- **A real "board mood" system.** Nothing tracks manager standing with the board across
  a season (results vs. expectation, patience, a sacking risk). This is the biggest gap
  vs. the brief's "board interactions & expectations" ask and deserves its own module
  (e.g. `shared/src/boardroom.ts`) plus a client surface — bigger than one overnight
  pass, sequencing suggestion: (1) a pure `boardMood(record, expectation)` function fed
  by the same `table`/`results` data the diary already has, (2) a small phrase bank like
  `gaffersDiary.ts`'s, (3) client wiring.
- **Press/media beats and dressing-room moments** as a standalone system — currently
  folded only into the diary's tone; a distinct "press conference" surface (with its own
  seeded Q&A flavour) would add real variety without duplicating the diary.
- **Staff dynamics (assistant manager, scouts, coaches as named characters)** — no
  system owns this at all; `career.ts`'s `mentor`/`gaffer` cast exists on the *player*
  side (`narrate.ts`), but the *manager* side has no staff roster or relationships.
- Consider expanding `LEAGUE_POOL` (16 names) and `CONT_POOL` (16 names) in
  `clubseason.ts`/`intl.ts` — fine for one save, but two saves with the same seed collide
  on the same 9/15 opponents; more names would widen per-save variety. Left alone this
  pass to stay inside a tight, low-risk diff.
