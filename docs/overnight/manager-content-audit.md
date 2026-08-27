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

## Batch 2 (this pass, 2026-08-27/28)

Backlog items addressed, per the batch-2 brief's scope guard (data + pure functions only,
no hard consequences baked in):

1. **`shared/src/board.ts` (new)** — `boardStanding(seed, input)` reads current league
   position vs. an `expectation` band (`'title'|'promotion'|'playoffs'|'midtable'|
   'survival'`) into a bounded `boardScore()` (-100..100, weighted by season progress so
   early slips matter far less than late-season ones) and a 6-tier mood
   (`delighted → pleased → patient → concerned → restless → furious`) with flavour text.
   Pure, no persisted history, **no sacking / no consequence** — see the DESIGN QUESTION
   documented at the top of the file for how a future sacking-risk system could consume
   `boardScore()`'s output (e.g. score below -60 for N consecutive reads ⇒ risk), which is
   NOT implemented here per the scope guard.
2. **`shared/src/press.ts` (new)** — `pressConferenceLine(seed, roundSalt, input)`: pre-/
   post-match press-conference beats varying by timing, competition (league/continental/
   international/cup), stakes (1-3) and recent form (hot/cold/level). Deliberately
   independent of `gaffersDiaryEntry`'s storyline detection (different axis: form/stakes/
   competition rather than table-position/streak storylines) so it adds variety without
   duplicating the diary. `pressAgendaTag()` gives a short one-line label for a fixture
   preview card if a caller wants that instead of a full quote.
3. **`shared/src/staff.ts` (new)** — `staffRoster(seed)`: a seeded 4-person backroom staff
   (Assistant Manager / Head Scout / Fitness Coach / Goalkeeping Coach), each with a name +
   one-line personality, stable for a save's lifetime — the manager-side equivalent of
   `narrate.ts`'s player-side `careerCast`. `staffQuip(seed, role, moment, salt)` adds
   light in-character reaction lines for `bigWin`/`bigLoss`/`signing`/`preSeason`/
   `milestone` moments. Presentational only — no mechanical effect on results, scouting,
   or training.
4. **`intl.ts` narrative depth** — `contRivalClub(seed)` (a stable per-save continental
   "old enemy") + `contRivalryBlurb()` (escalating grudge-match lines when that club comes
   up again — layer this over the existing `contTieBlurb` when the opponent matches),
   `wcGroupDramaBlurb()` (a "how tight was it" line from the ACTUAL computed `WCGroupRow`
   standings) and `wcKnockoutDramaBlurb()` (a drama line from the ACTUAL `WCTie` margin/
   penalties flag). All pure, seeded, additive.
5. Extended `shared/qa_manager_content_fuzz.ts` with determinism + no-throw + non-blank +
   bounds + variety coverage for all of the above (still run manually before every commit,
   still not wired into `npm run verify` — see below).

### Design questions flagged for the human (not decided here)

- **Sacking-risk system.** `board.ts` gives a pure mood/score reading but deliberately
  stops short of any consequence. If/when the human wants real stakes: the natural next
  step is a small stateful wrapper (NOT in `shared/`, or in a clearly-optional
  `shared/src` module the client explicitly opts into) that watches `boardScore()` over
  consecutive rounds and raises a risk flag — but whether a poor run should ever actually
  end a save (forced dismissal / game over) vs. just a hard warning is a game-design call,
  not something this pass should bake in.
- **Where press conferences surface in the UI.** `pressConferenceLine()` is a pure text
  function; whether it shows on every fixture, only big-stakes ones, or as an optional tab
  is a UI-shell decision for whoever wires `client/src/main.ts`.
- **Staff roster growth.** `staffRoster()` currently returns a fixed 4 roles. If the human
  wants staff to be *hireable/replaceable* (a real off-pitch system, not just flavour),
  that's a bigger stateful feature (persisted staff contracts, wages, upgrade tiers) that
  deserves its own design pass rather than bolting state onto this presentational module.

## Remaining backlog (batch 3)

- **Wire batch 1 + batch 2's new content into `client/src/main.ts`.** Nothing from either
  pass is client-wired yet: `intl.ts` tie/World-Cup/rivalry/drama blurbs, `prestige.ts`
  rank-up blurb, and now `board.ts`/`press.ts`/`staff.ts` in their entirety. This is
  growing into the single largest gap between "content exists" and "content is seen" —
  worth flagging to the human as a dedicated client-wiring pass, possibly its own lane.
- **Real opponent identity in the local season sim** (carried over from batch 1,
  unaddressed — still the highest-leverage fix for `gaffersDiary.ts`'s rival/revenge
  detection, which is a no-op today because `main.ts` always passes blank `oppId`/
  `oppHandle`).
- **`board.ts` needs an `expectation` input from somewhere real.** Right now the caller
  must supply a `BoardExpectation` band; there's no function yet that derives one from
  club stature (e.g. `prestige.ts`'s level, or the club's finish last season). A small
  pure `deriveExpectation(prestige, priorFinish)` helper would make `board.ts` usable
  without every call site inventing its own heuristic — good scope for batch 3.
- **Staff/press cross-pollination.** `staffQuip()` and `pressConferenceLine()` are
  currently siloed; a natural batch-3 extension is letting a specific staff member's quip
  occasionally appear INSIDE a press-conference beat (e.g. the assistant fielding a
  question), which would need a small combinator function in one of the two modules
  rather than a new module.
- **`gaffersDiaryEntry` doesn't know about `board.ts`/`press.ts` yet.** Consider whether a
  board-mood swing (e.g. crossing from `patient` to `restless`) should be able to compete
  as its own diary candidate alongside the existing weighted pool — would need `board.ts`'s
  `BoardStanding` threaded into `gaffersDiaryEntry`'s existing candidate-picker pattern.
- Consider adding a small `Record<StaffRole, string>` "department focus" (e.g. what the
  scout is currently prioritising) to `staff.ts` for even more surface area once the human
  decides whether staff become a real hireable system (see design question above) — hold
  off until that decision is made to avoid building flavour for a shape that changes.

## Batch 3 (this pass, 2026-08-28)

Backlog items addressed:

1. **`board.ts`: `deriveExpectation(input)`** — a pure `{ prestigeLevelIdx, priorFinish }
   → BoardExpectation` mapping, so `boardStanding()`'s callers no longer have to invent
   their own heuristic. Reputation (a `PRESTIGE_LEVELS`-shaped index, 0-8) sets a baseline
   band; `priorFinish` (a small enum deliberately reusing the diary's own table-band
   vocabulary — title/promotion/playoffs/midtable/survival/relegated/null) nudges it up or
   down. Decoupled on purpose: `board.ts` still doesn't import anything from
   `prestige.ts`/`clubseason.ts` — the caller reduces its own state to the small input
   shape first. Pure API for client wiring: `deriveExpectation(input: ExpectationInput):
   BoardExpectation`.
2. **`gaffersDiaryEntry` now reads board mood** — `DiaryInput` gained an OPTIONAL
   `boardMood?: BoardMood` field. When present, a notable mood (delighted / pleased /
   concerned / restless / furious — 'patient' deliberately excluded, it reads no
   differently from the diary's own generic fallback) competes as its own weighted
   candidate in the existing picker, so a swinging boardroom can colour the diary the way
   a win streak or a relegation battle already does. 100% backward compatible — omitting
   `boardMood` reproduces the exact prior behaviour (confirmed by the existing fuzz suite,
   which now calls it with `boardMood` omitted ~40% of the time).
3. **`press.ts`: `pressConferenceLineWithStaff(seed, roundSalt, input, roster)`** — a
   combinator, not a change to `pressConferenceLine` itself (untouched, so no existing
   caller is affected). On a stakes>=2 post-match win/loss beat only, about 1-in-3 of the
   time it appends a named staff member (drawn from a `StaffRoster`) fielding an
   in-character follow-up via `staffQuip()`. Deliberately narrow trigger conditions (no
   pre-match asides, no routine/draw asides) so it reads as an occasional real moment
   rather than a permanent tag-along.
4. **Bug fix (flagged mid-pass by the orchestrator, addressed same pass):** `staff.ts`'s
   `STAFF_FIRST` name pool is deliberately mixed-gender, but every `PERSONALITY` and
   `staffQuip()` line hardcoded he/him/his — misgendering roughly half of any generated
   staff member, now live on the client's club screen. Rewrote every line to be
   pronoun-neutral (they/them, or the pronoun dropped/rephrased entirely, including two
   incidental "him" references to a new signing). Added a permanent regression check to
   the fuzz harness (`GENDERED_PRONOUN` regex over every generated personality + quip
   line) so this can't silently regress.
5. Extended `shared/qa_manager_content_fuzz.ts`: `deriveExpectation` (bounds, determinism,
   monotonicity in `priorFinish`, round-trips through `boardStanding`), the diary's new
   `boardMood` input, `pressConferenceLineWithStaff` (determinism, "always extends the
   base line", "never fires on an ineligible beat"), and the gendered-pronoun regression
   check above. `npm run verify` + the fuzz harness both green after every commit in this
   pass (see final report for the commit list).
6. **Intl depth**: reviewed `intl.ts` again per the brief's "only if genuinely additive"
   instruction — batch 2 already added rivalry arcs (`contRivalClub`/`contRivalryBlurb`)
   and tournament drama (`wcGroupDramaBlurb`/`wcKnockoutDramaBlurb`) on top of batch 1's
   tie/finish blurbs. Judged **saturated** for this pass: the module now has flavour for
   every structural moment it produces (tie win/loss, rivalry escalation, group tightness,
   knockout margin, call-up, World Cup finish) and the remaining gap is entirely
   client-wiring, not more shared-side content. Left untouched, per the "quality over
   quantity — don't pad an already-rich system" instruction.

### Design questions (unchanged from batch 2, still undecided)

- Sacking-risk system consuming `boardScore()` — still deliberately not built.
- Where press conferences (and now the staff-aside variant) surface in the UI.
- Whether staff become a real hireable/replaceable system, or stay presentational.

## Remaining backlog (batch 4 / relaunch)

- **Client wiring is now the dominant gap.** Nothing from batches 1-3 is wired into
  `client/src/main.ts` yet from THIS lane's perspective (the orchestrator's parallel pass
  is handling batch 1+2 wiring; `board.ts`'s `deriveExpectation`, the diary's `boardMood`
  input, and `pressConferenceLineWithStaff` are all new batch-3 surface that will need the
  same treatment). Recommend treating "manager content client wiring" as its own
  dedicated lane going forward rather than growing the shared-side backlog further.
- **Real opponent identity in the local season sim** (carried over since batch 1,
  still unaddressed — `main.ts` still passes blank `oppId`/`oppHandle`, so
  `gaffersDiary.ts`'s rival/revenge detection remains a no-op in practice today).
- **`boardStanding()` has no persisted history.** Every read is a fresh, memoryless
  snapshot (by design, per the scope guard) — if the human ever wants the sacking-risk
  follow-up sketched above, it needs a small stateful wrapper OUTSIDE this pure module.
- Everything else from the batch-2 backlog not listed above (intl `LEAGUE_POOL`/
  `CONT_POOL` name-pool expansion, staff "department focus" field) remains open at the
  same low priority noted there — neither felt worth doing ahead of client wiring.
