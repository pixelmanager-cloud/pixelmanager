# Open items that need YOUR call — not bugs

Everything here is either a product decision I should not make alone, or a job too large to do without
knowing what you want. Bugs I could fix and verify are already fixed; this is only what is left.

Last updated: 2026-08-30, end of the overnight session.

---

## 1. The match engine rebuild — the big one

**Branch:** `engine/shot-geometry` (3 commits, deliberately NOT merged; every mechanism defaults OFF)

The engine's shot geometry is broken and I found out exactly why. Two calibration defects upstream of
everything: **pass completion 59.2%** (real football ~80%) and **1,508 tackles a match** (real ~40). Each
nearby defender rolled a ~19% tackle chance EVERY tick, so the median possession spell was **two ticks —
one second**. Nothing that takes time could happen: the box measured empty at 0.02 attackers, and the only
chance creation in the game was a through-ball fired from a median of **45.8 metres**.

Fixed on the branch, it measures like football for the first time: 26.1 shots and 2.77 goals a match,
median shot distance 7.5m.

**Why it is not merged:** 8 of `strategy_test`'s assertions fail. The tactical layer was calibrated
against the broken model, so it inverts when the model is corrected. The flanks are understood down to the
line of code — a hard `gain > -6` veto killed 80% of all wide passes — but width still does not PAY, and
the last piece needs an overlapping run, which is a behaviour to design rather than a constant to tune.

**Your call:** this is a multi-day project. Do you want it before launch, or does the game ship on the
current engine? Everything is behind named constants with env overrides so the next session sweeps rather
than re-derives, and `tools/playtest/shot_geometry.ts` + `width_diagnosis.ts` reproduce every number above.

---

## 2. 1,505 arc tags that gate nothing — an authoring job, not a bug

`gate_content.ts` reports this every playtest run.

Both tag systems are fully built and correct: `arcFits` honours `requiresTag`/`forbidsTag`, and the player
career filters choices by `requires`. **1,505 arc choices set `effect.tag`, and not one arc in 1,233
declares any of them.** Every "consequence that persists across a career" lands in a set nothing queries.
The same is true of `when.facility` — 0 of 819 manager arcs use it, so upgrading a facility unlocks no
content, despite `facilities.ts` selling facilities as content sources.

**Your call:** this is writing, not code. Authoring arcs that require or forbid tags is how consequences
start persisting across a career. Worth doing, but it is a content project with a real scope.

---

## 3. Pre-fix saves lost their history — accept, or attempt a backfill?

Successions used to call `clearMgr()`, a blanket `removeItem`, so every generation destroyed the club's
titles, continental/World-Finals wins, hired staff, `arcPrestige`, `arcFired`, `arcTags` and `clubLegacy`.
Fixed in `55a3abf`; the dynasty carries from now on.

**What cannot be recovered:** the key was REMOVED rather than overwritten, so for a save already several
generations deep that history is simply gone. There is nothing on disk to read back.

**What recovers on its own:** the club TIER. `fm_tier_` lives in its own key and was never wiped — it was
being overwritten by the founding path, which no longer runs at a handover.

**Your call:** accept the loss for pre-fix saves, or have me attempt a partial backfill from the honours
table and legend snapshots. My recommendation is ACCEPT. A migration that credits a save with titles it
cannot prove it won is exactly the fabricated-parentage mistake `migrate()` already made once (it invented
father/son links from generation adjacency, and had to be torn out). The game has not shipped; the only
affected saves are yours and the test ones.

---

## 4. Steam

Blocked on tax/banking approval, which you submitted but has not come back. When it clears, **capsule art
and the trailer are the critical path** — the store copy is the easy half.

---

## 5. Smaller things I chose not to do alone

- **`youth_joy.ts` stays 64% costless on purpose.** The shirt with his name on the back, commentating his
  own goals in the garden. If you want those priced, say so — I think pricing them would make the game
  worse, and `arc_stakes.ts` warns rather than fails for exactly this reason.
- ~~`Token.father_name` write-only~~ — DONE: now read in the Family Record as each medallion's tooltip
  and screen-reader label ("Kai Vance — Dane's boy").
- ~~13 stale `worktree-agent-*` branches~~ — DONE: deleted.
- ~~Should wages force disrepair too?~~ — you said yes; in progress. Deliberately sequenced AFTER the
  visibility fixes, because a critic found that every disrepair warning was being deleted before the player
  could read it (the season-rollover feed clobber, fixed in 55a3abf). Making wages destroy facilities while
  the failure was invisible would have turned a hard game into an unexplained one.
