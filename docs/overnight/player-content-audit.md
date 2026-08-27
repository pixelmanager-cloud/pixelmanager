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
