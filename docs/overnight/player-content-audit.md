# Player-career content audit (2026-08-27)

Read shared/src/career.ts (1641 lines) and shared/src/offpitch.ts (138 lines) in full. Findings:

## Pool sizes found (repetition risk = small pool hit often over a 200-turn career)
- `BIG_MOMENTS` (8) / `HUGE_MOMENTS` (6) — a 7-band, 202-turn career draws these repeatedly from Scholar
  onward; 8-6 entries is thin for that many draws. **Expanded.**
- `LIFE_KINDS` (14) — decent breadth already (contract/loan/setback/media/loyalty/role/fallout/
  injury_comeback/transfer_rumour/manager_fallout/charity/social_storm/family_illness/romance), but the
  feeling-space skews toward "trouble/PR" beats. Missing: mischief/friendship/mentorship as distinct
  *life* dilemmas (they exist only implicitly in FOCUS options). **Added `mentor_crossroads` and
  `friend_falling_out`** to round out the feeling wheel.
- `FOCUS_BY_CHAPTER` — only 4 options per chapter (7 chapters = 28 total), each chapter always offers the
  exact same 4 named beats every replay (deterministic but same POOL every time — no seeded variety
  within a chapter). **Added a 5th option per chapter** for more texture without touching selection logic
  (rollFocus still returns the whole list; the UI already handles variable-length option arrays).
- `TAG_FOCUS_BY_CHAPTER` only covers 4 of 7 chapters (Youth Team, Breakthrough, First Team, Establishing)
  — Grassroots/Academy/Scholar kids get no attribute-focus pick at all, which is a thin start to the
  skill-tree feel. **Left as-is this pass** (a mechanical change, flagged for next batch — see backlog).
- `SIDE_FOCUS_BY_CHAPTER` only covers 3 of 7 chapters (Breakthrough/First Team/Establishing). **Added
  Scholar and Youth Team** side-focus picks so the "small public-facing extra" texture starts earlier,
  matching where LIFE_KINDS events also start (bandIdx >= 2, i.e. Scholar).
- offpitch.ts `CLEAN_BRANDS`/`EDGY_BRANDS` (10 each) and `BOOT_CATALOG` (5) and `TEMPT` (4) — a long,
  high-image career re-hashes the same ~10 brands and re-rolls among only 4 temptation flavours
  repeatedly. **Expanded all four pools.**
- `LIFESTYLE` (30 items) is already broad and well banded by chapter — left alone this pass.
- `COACHES` (23) / `AGENTS` (11) are already broad — left alone this pass.

## Bugs / thin spots noticed (not full audit — flagging what surfaced while reading)
- No callback in FOCUS_BY_CHAPTER['Grassroots'] to the same person across chapters (the "first coach" and
  "best mate rivalry" characters introduced there never recur explicitly elsewhere in career.ts — the only
  persistent character is the seeded academy rival used by `rival` scenarios, which lives in narrate.ts,
  out of this file's scope). Flagged as a REMAINING BACKLOG item — needs a narrate.ts change to pay off
  (out of domain for this pass, per the brief).
- `RISK_FOCUS_CHAPTERS` and `SIDE_FOCUS_BY_CHAPTER` both gate on the same 3 late chapters — the game's
  "extra summer choice" texture is entirely absent before Breakthrough (age 19). Addressed partially this
  pass (added Scholar/Youth Team to SIDE_FOCUS).

## What was added this session (see REMAINING BACKLOG in final report for next batches)
1. offpitch.ts: +8 CLEAN_BRANDS, +8 EDGY_BRANDS, +6 BOOT_CATALOG entries, +6 TEMPT flavours.
2. career.ts: +6 BIG_MOMENTS, +5 HUGE_MOMENTS.
3. career.ts: +2 LIFE_KINDS (mentor_crossroads, friend_falling_out) with labels + consequences.
4. career.ts: +1 FOCUS_BY_CHAPTER option per chapter (7 new options total).
5. career.ts: +2 chapters of SIDE_FOCUS_BY_CHAPTER (Scholar, Youth Team).

## BATCH 2 (2026-08-27/28)
Re-read this audit + current career.ts/narrate.ts/offpitch.ts before starting, per the brief.

### Done
1. **Recurring-character payoff (highest-value item, now closed)** — `friend_rivalry` and
   `mentor_crossroads` life-events previously used generic "an old mentor" / "the mate he grew up
   playing with" phrasing that never actually named the seeded `careerCast().rival`/`.mentor`. Now:
   - `KIND_SETUP.friend_rivalry` / `.mentor_crossroads` use `{rival}`/`{mentor}` placeholders,
     substituted in `scenarioStory()` with the real seeded name (falls back to generic phrasing only
     if `careerSeed` is absent from the ctx).
   - `LIFE_RESOLUTION.friend_rivalry` / `.mentor_crossroads` good/bad lines do the same substitution in
     `narrateLifeEvent()` — so the SAME named character shows up in both the setup and the resolution.
   - `graduationEpilogue()`'s closing lines enriched with 2 new options that explicitly call back to the
     rivalry/mentorship arc ("the mate turned rival turned, somehow, still a friend", "the same voice
     at the end of the phone through every crossroads") instead of a bare name-drop.
   - Note: this was done entirely within narrate.ts using the `careerSeed` already threaded through
     `NarrateCtx`/`ScenarioCtx` by `tokens.ts` (off-domain, not touched) — no new plumbing needed.
2. **`TAG_FOCUS_BY_CHAPTER` gap closed** — added Grassroots (flair/stamina), Academy
   (teamwork/aggression), Scholar (composure/creativity) attribute-focus picks, same energy-only
   contract as the existing 4 chapters (no rng, no meter effects, `FOCUS_TAG_WEIGHT` nudge only).
   Verified via `npm run verify`: strategy_test calibration unchanged (2.80 goals/match), fuzz clean,
   career_sim "identical player: true".
3. **Repetition sweep of narrate.ts** — scripted a check for literal duplicate strings across all pools;
   none found. Manually scanned FRAME_BY_CHAPTER/KIND_SETUP/DEMAND for near-duplicate phrasing; the
   apparent overlaps (e.g. "growth spurt" in both Grassroots and Academy frames) read as an intentional
   callback across chapters, not accidental repetition. No rewrites needed this pass — batch 1's
   expansion already addressed the worst of it.
4. **SeasonEvent flavours** — not attempted this pass (time-boxed out); see backlog below.

### REMAINING BACKLOG for batch 3 (superseded — see BATCH 3 below for what actually landed)
- **SeasonEvent flavours** (career.ts `advanceSeasonEvent`, ~line 1255): still only the original set from
  before batch 1/2. Adding 1-2 more needs the probability bands recalibrated and the balance gate
  (`strategy_test.ts` / `fuzz_test.ts`) re-run to confirm no drift — genuinely untouched this session,
  flagged rather than rushed.
- **`GK_TAG_FOCUS_BY_CHAPTER`** still only covers Youth Team onward (Grassroots/Academy/Scholar
  goalkeepers get the new generic TAG_FOCUS_BY_CHAPTER picks added this batch, but no keeper-specific
  early pick). Minor, but a natural next step now the outfield gap is closed.
- **`RISK_FOCUS_CHAPTERS`** (the "Speak to the Press" high-variance pick) is still gated to
  Breakthrough/First Team/Establishing only — deliberately left as-is (a genuine risk pick probably
  shouldn't exist for a 12-year-old), but worth a second look re: Youth Team.
- Deeper repetition sweep of `RESULTS`/`REACTIONS`/`VERBS` in narrate.ts wasn't done this pass (spot-
  checked only, no literal dupes found) — a slower, closer read might still surface near-duplicate
  *tone* even where the exact strings differ.
- `LIFE_KINDS`/`LIFE_CONSEQUENCE` pool itself (16 kinds) hasn't grown since batch 1 — could still use 1-2
  more distinct life-dilemma flavours if a future batch has room, though breadth is now reasonable.

## BATCH 3 (2026-08-27/28)
Re-read this audit + current career.ts/narrate.ts before starting, per the brief. Backlog priority order
was followed exactly: GK gap → tone sweep → new LIFE_KINDS → SeasonEvent (time-boxed, see below).

### Done
1. **`GK_TAG_FOCUS_BY_CHAPTER` early-chapter gap closed** — added Grassroots ('Dive Around in the Back
   Garden'), Academy ('Learn Your Angles'), Scholar ('Catch, Don't Punch') keeper-flavoured attribute-focus
   picks, mirroring the outfield `TAG_FOCUS_BY_CHAPTER` batch-2 contract exactly: energy-only
   (`TAG_FOCUS_ENERGY`), no rng, no meter effects — the tag nudge is the only reward, applied via
   `FOCUS_TAG_WEIGHT` in `deriveStats`. Committed separately (`020d586`).
2. **Deeper tone-level repetition sweep of narrate.ts** — the two highest-frequency pools (`RESULTS` and
   `REACTIONS`, drawn on literally every `narratePlay()` call, i.e. every single turn of every career) read
   uniformly enthusiastic/deflated within each success band with no register variety. Added one wry/dry and
   one tender/matter-of-fact line to each of the 5 bands in both pools (10 lines total) — e.g. triumph gets
   a dry '— and that, really, is that' alongside the existing overt fanfare; dismal gets a dark-humour
   '...strange, dark humour in just how wrong it went' alongside the straight embarrassment lines. Left
   `VERBS`/`DEMAND`/`KIND_SETUP` alone this pass — RESULTS/REACTIONS are the pools that fire on literally
   every turn, so they're where flattened tone is most felt over a 200-turn career; a slower per-pool
   register audit of the rest is still worth a future pass (see backlog).
3. **2 new `LIFE_KINDS` with full narration** — `new_money` (nerves/temptation around a first big payday —
   the backlog's "money/first-big-contract nerves") and `move_abroad` (homesickness after a move to a
   foreign club — the backlog's "homesickness/moving abroad"). Both got the full contract: `LifeKind` type
   member, `LIFE_KINDS` array entry, `LIFE_LABEL`, `LIFE_CONSEQUENCE` (career.ts), plus `KIND_SETUP` (5
   setup lines) and `LIFE_RESOLUTION` good/bad (3 lines each) in narrate.ts. Both wire the seeded
   `careerCast` per the brief: `new_money` has `{mentor}` ring with an unprompted warning about money
   changing people (paid off in both the good line — his warning lands — and the bad — it was right and
   too late); `move_abroad` references `{rival}` as the move he never had the nerve to make. Considered but
   skipped: faith/community (hard to keep religiously neutral across a Steam-wide audience) — flagging for
   a future batch only if there's a clean, non-denominational angle (a personal cause / foundation reads as
   a re-skin of the existing `charity` kind, not a genuinely new feeling).
4. **SeasonEvent flavours — time-boxed out, deliberately skipped.** Per the brief's "only if you
   recalibrate... else document + skip": `advanceSeasonEvent`'s probability bands (0.06 serious-injury /
   0.25 breakthrough / 0.40 new-gaffer / 0.52 hot-streak / 0.60 cup-run / 0.72 slump / 0.80 transfer-links /
   0.88 knock / 0.94 fan-favourite / else steady) are load-bearing for `strategy_test.ts`'s calibration gate
   (2.80 goals/match) — inserting even one more band without touching the others shifts everything after
   it. Untouched this session; still open for batch 4 if there's room to do the recalibration + full
   `strategy_test`/`fuzz_test` re-run properly rather than rushed.

### Verification
`npm run verify` run fully green after each of the 3 commits (not batched) — build, `strategy_test`
calibration steady at avg goals/match=2.80, `fuzz_test` clean (2000 matches, all invariants held),
`career_sim.ts` determinism check "same seed + same choices → identical player: true", and both QA
harnesses (`qa_savestore`, `qa_offline_facade`) passing. No recalibration was needed — all 3 changes are
narration/attribute-focus additions with no rng and no touch to `deriveStats`/`advanceSeasonEvent`.

### REMAINING BACKLOG for batch 4
- **SeasonEvent flavours** — still open, see above; needs a dedicated pass with room to recalibrate bands
  and re-run the balance gate, not squeezed in alongside other work.
- **Slower per-pool tone/register audit of the rest of narrate.ts** — `VERBS`, `DEMAND`, `TAG_TRIUMPH`,
  `KIND_SETUP` (non-life-event kinds: match/social/training), and the `FRAME_BY_CHAPTER` banks weren't
  touched this pass; RESULTS/REACTIONS were prioritised as the highest-frequency pools, but a similar
  register sweep on these would round it out.
- **`RISK_FOCUS_CHAPTERS`** — still gated to Breakthrough/First Team/Establishing; a considered look at
  whether Youth Team should get a (smaller-swing) risk pick remains open, per batch 2's note.
- `LIFE_KINDS` now stands at 18 — good breadth. A future batch could still add one more if a genuinely
  distinct feeling surfaces (the brief's faith/community suggestion was skipped this batch as too easily a
  re-skin of `charity` — worth revisiting only with a sharper, more secular angle, e.g. a personal
  foundation/legacy project distinct from a one-off community appearance).
- Client-side surfacing of `new_money`/`move_abroad` (icons, any UI-specific copy) wasn't checked — this
  batch stayed in-domain (career.ts/narrate.ts/offpitch.ts only); worth a quick client-side grep next batch
  to confirm `LIFE_LABEL`'s generic pass-through (client/src/main.ts:1796) renders the new kinds fine (it
  should — `LIFE_LABEL` is typed `Record<LifeKind, string>` and both new kinds have entries, so this is
  very likely a non-issue, just unverified end-to-end in the client UI).
