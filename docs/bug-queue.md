# BUG QUEUE — ranked easiest to hardest

Found by a per-subsystem sweep on 2026-09-01; every entry survived a three-lens adversarial refutation
panel. **Struck-through items are fixed.** Each carries file:line and the actual fix, so any of them can be
picked up cold.

`[V]` = I reproduced or read it myself. `[A]` = agent-reported, panel-verified, not yet re-checked by me.

---

## ~~TIER 1 — one line or one argument (nine items)~~ — ALL NINE FIXED 2026-09-01

1. `[A]` ~~**Season-award feed lines never render.**~~ **FIXED.** `client/src/main.ts:2488` — `pushFeed('🏅', …)` omits the
   third argument, so it files under `m.season` while every sibling line passes `m.season + 1`; the counter
   bumps twelve lines later and `seasonFeedHtml()` filters on the new value. **Fix:** add `, m.season + 1`.
2. `[A]` ~~**The squad report can never rehydrate.**~~ **FIXED.** `client/src/main.ts:2574` — saved as
   `squadReportSeason: mm.season`, incremented at 2633, so `loadMgr`'s `=== m.season` test never passes.
   It is the only surface emitting `data-renew` / `data-release`, so contracts run down and players walk
   free. **Fix:** store `mm.season + 1`.
3. `[A]` ~~**Match-plan note breaks its own tooltip.**~~ **FIXED.** `client/src/main.ts:4479` — `hold-lead`'s note starts
   with `"`, terminating the `title=""` attribute; two sibling interpolations escape, this one doesn't.
   **Fix:** `.replace(/"/g, '&quot;')`.
4. `[A]` ~~**The Player tab contradicts the number beside it.**~~ **FIXED.** `shared/src/tokens.ts:242` — `careerProfile`
   calls `deriveStats(log, seed, genes)` with no `attrFocus`, while graduation passes it. Role disagreed in
   5 of 60 careers, forming-traits in 27. **Fix:** pass `c.attrFocus` as the fourth argument.
5. `[A]` ~~**The heir never sees the World Finals.**~~ **FIXED.** `client/src/main.ts:2141` — `resetMgrForHeir` clears
   `wcStage`/`wcEdition`/`wcRun` but not `wcSeen`, so the father's edition suppresses the heir's.
   **Fix:** add `wcSeen: undefined`.
6. `[V]` ~~**The pause menu never pauses.**~~ **FIXED.** `client/src/main.ts:701` — `openPauseMenu` touches `this.running`
   zero times (only writers: spacebar, `startMatch`, `onFullTime`, `skipToEnd`). The match plays on behind
   the dialog. **Fix:** set `running = false` on open, restore on close.
7. `[V]` ~~**A substitute is sent off for a yellow he never got.**~~ **FIXED.** `shared/src/engine.ts:357` — `booked` is
   keyed by team*100 + *slot index*, and `makeSub` never clears the slot. **Fix:** `booked.delete(t*100+outI)`.
8. `[A]` ~~**The heir reads his father's news.**~~ **FIXED.** `client/src/main.ts:1420` — `resetMgrForHeir` clears
   `arcFired` and `feedFired` but not `feed`; `FEED_MAX = 240` outlives a career. **Fix:** clear `feed`.
9. `[A]` ~~**Prestige card has no Escape and no focus trap.**~~ **FIXED.** `client/src/main.ts:1229` — reuses
   `player-card-ov` without `dialogify`. **Fix:** `const close = this.dialogify(el)`.

**Tier 1 notes.** #1 was mine, shipped with the awards the day before: the line omitted the `m.season + 1`
its two siblings pass. #8's fix is generation-stamping rather than clearing the feed — `resetMgrForHeir`'s
own comment says the feed carries across a succession *deliberately*, as the dynasty's record; the collision
was that the season counter resets to 1 and the filter was season-only. #7 is guarded by the new
`tools/playtest/sub_identity.ts`; its first version measured **0 of 0** second yellows and reported a pass —
a check that could not fail — so it now asserts that substitutions and second yellows both actually occur.
Against the unfixed engine it catches 1 unearned dismissal in 10 (my measurement; the sweep claimed 26%).

## ~~TIER 2 — small and local (eight items)~~ — ALL EIGHT FIXED 2026-09-01

10. `[A]` ~~**Kick Off can be double-activated,**~~ **FIXED.** stacking two team-talk dialogs; the second builds a fresh
    `MatchEngine` and wipes the live score. `client/src/main.ts:2846`. **Fix:** preamble `remove()` + `dialogify`.
11. `[A]` ~~**Shortcuts stay live behind the pause overlay**~~ **FIXED.** and Space swallows Resume.
    `client/src/main.ts:905`. **Fix:** bail when a modal is open; `dialogify` in `openPauseMenu`.
12. `[V]` ~~**Every injury is the home side, minute 61.**~~ **FIXED.** `shared/src/engine.ts:331` — the trigger derives
    from minute and team only, no seed. Measured by me: 14 injuries / 250 matches, **100% team0 min61, zero
    away injuries ever.** **Fix:** fold the match seed into the trigger and the candidate.
13. `[A]` ~~**Red-carded players walk back on at every kickoff.**~~ **FIXED.** `shared/src/engine.ts:246` — `reset()`
    rebuilds slots from formation anchors with no `sentOff` check; `pressureOn` and `chaseLooseBall` have no
    guard. 111k on-pitch ticks for dismissed men over 300 matches. **Fix:** park them; add both guards.
14. `[A]` ~~**`clearRun` is never cleared on a turnover,**~~ **FIXED.** so the ×12 breakaway shot appetite leaks into
    ordinary play — ~0.99 stale shots and 0.11 stale goals per match. `shared/src/engine.ts:660`.
    **Fix:** reset on every possession change and shot.
15. `[A]` ~~**One deferral suppresses the handoff offer for the whole dynasty.**~~ **FIXED.**
    `client/src/main.ts:3697` — `fm_handoff_defer_` keys on a prospect id that is `nft:1` in every save.
16. `[A]` ~~**Rejected-bid keys outlive the manager.**~~ **FIXED.** `client/src/main.ts:1884` — `fm_biddismiss_*` /
    `fm_bought_*` are season-scoped but survive succession while the counter resets to 1.
17. `[A]` ~~**The wage forecast bills the star, the rollover doesn't.**~~ **FIXED.** `client/src/main.ts:1877` — forecast
    reads `mergedClub()`, `advanceSquadSeason` bills raw `club.players`. Overstated by the biggest wage.

**Tier 2 notes.** The engine fixes paid off beyond their own entries: clearing `clearRun` on turnovers took
`division_balance`'s worst thrashing rate from **15% (exactly on its bar) to 12%**, and made
`qa_matchstats`'s goalless check pass — §68 item 5, resolved by a bug fix rather than a tuning pass. It cost
one assertion (strong-side lopsidedness, 3.20:1 → 2.88:1 against a 3:1 bar); those 15 goals were phantom, so
that is recorded in §68 rather than chased. Injuries now spread over 13 distinct (team, minute) pairs with 9
to the away side, against 1 pair and 0 away before. Guarded by two new probes,
`tools/playtest/red_card_sticks.ts` and `sub_identity.ts`.

**And the gate got sharper because of this batch.** It reported PASSED on a run where `qa_matchstats` swapped
which of its checks was red — the collector only recorded the failing harness's *name*, so a fix and a
regression inside one file cancelled out invisibly. It now reads the individual `FAIL <assertion>` lines
run-qa echoes, and `shared/qa_gate_parse.ts` covers that case.

## ~~TIER 3 — needs care (nine items)~~ — ALL NINE FIXED 2026-09-01

18. `[V]` ~~**The season rollover can be re-run on the retirement season.**~~ **FIXED.** `client/src/main.ts:2608` — the
    early return precedes the only `results: []` / `season + 1` reset, and I confirmed `retireStar` contains
    **no `saveMgr` call at all**. Re-pays prize, sponsor, facility income, title honour and promotion, ages
    the squad again, on every pass. **Fix:** reset before the early return, or move retirement above the
    reward calls. *Worst one in the list.*
19. `[A]` ~~**Trialists never leave.**~~ **FIXED.** `client/src/api.ts:969` — filed under season N, swept after
    `spSeasonReward` has already advanced to N+1, so `loaneeIds` returns empty. Free players, then sellable.
    Same off-by-one class as the award bug fixed yesterday.
20. `[A]` ~~**Insolvency pays a dividend.**~~ **FIXED.** `client/src/api.ts:1032` — `owed` is decremented then discarded,
    while each forced sale credits `addCoins`. Being unable to pay wages is more profitable than paying them.
21. `[A]` ~~**Arc `coins` effects never reach the save.**~~ **FIXED.** `client/src/main.ts:3465` — written to the
    display-only `this.account.coins`, which `setMe()` overwrites. 1,031 arc options carry one; none moves a
    coin. **Fix:** bank as `arcCoins` and settle at rollover, like `arcPrestige`/`arcBoard` already do.
22. `[A]` ~~**`sellMult` bends no coin.**~~ **FIXED.** `client/src/api.ts:514` — the squad report promises unsettled men
    sell for up to 20% less; `squadSaleValue` takes no morale argument. The re-sign half *is* wired.
23. `[A]` ~~**Awards render against the current heir.**~~ **FIXED.** `client/src/api.ts:1283` — `succeed()` reuses the
    token id, so `wonBy.get(t.id)` hands the grandfather's medals to a child. **Fix:** generation-qualified key.
24. `[A]` ~~**Legend cards collapse onto the founder.**~~ **FIXED.** `client/src/api.ts:1266` — the `:g<gen>` suffix is
    stripped and last-write-wins keeps the oldest.
25. `[A]` ~~**The whole Grassroots focus bank is unreachable.**~~ **FIXED.** `shared/src/career.ts:1469` — `rollFocus` is
    called after `turn++`, so `Grassroots` is never the chapter passed. Eight authored options, including a
    keeper's age-10-12 keeping focus, are dead.
26. `[A]` ~~**`hasAgent` keys on an option id three chapters reuse.**~~ **FIXED.** `shared/src/career.ts:675` — drops the
    agent lever from Scholar, Youth Team and Breakthrough. **Fix:** gate on chapter, not id.

## ~~TIER 4 — design call needed~~ — BOTH DONE 2026-09-01

27. `[A]` ~~**Bench emptied at 58', 59', 60' in 100% of matches.**~~ **FIXED.** `shared/src/engine.ts:345` — no spacing
    rule; 300 matches produced `{58:300, 59:300, 60:300}`, zero variance. Fixing it is engine balance, and
    it currently starves #12. **Needs:** a substitution-spacing decision.
28. `[A]` ~~**88 of 90 cross-arc `requires` options are offered in under 1% of careers,**~~ **FIXED.** and
    `tools/playtest/gate_content.ts:111` counts declarations rather than simulating, so it passes forever —
    a check that cannot fail. With `ARCS_PER_CAREER = 20` from a 414-arc library both arcs must land in the
    same 20, in order. **Needs:** a call on whether cross-arc payoffs should be reachable at all.

---

**Also fixed on 2026-09-01, before this list existed:** the gate itself (`verify && playtest && qa`
short-circuited on a permanently-red leg, so playtest and qa had not run from `npm run gate`, and
`agent/run.sh` deleted every overnight branch); `fuzz_test.ts` and `career_sim.ts` never executed inside
`verify`; and `ach_goals`/`ach_assists`/`ach_potm` read and rendered but written only as literal `0`, so
every legend card read "0 goals · 0 assists · 0 ★".

---

## Corrections to the sweep — two of its claims were wrong

**#28's headline number was wrong, and it was wrong for an instructive reason.** It reported "88 of 90
cross-arc `requires` options offered in under 1% of careers, mean 0.388%". Measured properly, **63.6% of
careers already saw at least one** before any fix. The career presents an arc choice as a fresh
`{id, label, desc}` object, so `requires` is not on the object the player sees — counting it there reports
zero however healthy the mechanism is. My own first probe made exactly the same mistake and I nearly filed
the same wrong finding. Reachability has to be measured against the arc DEFINITIONS, matching by choice id.

What *was* right is that `gate_content.ts:111` counts declarations and so can never detect unreachability.
`tools/playtest/arc_payoff_reach.ts` now simulates. And the scheduler now weights an arc up when it pays off
a flag the career already holds, which takes it **63.6% → 82.3%** of careers.

**#5's rate was overstated.** The sweep said 26% of second-yellow dismissals went to a player never booked;
measured against the unfixed engine it is 1 in 10. The defect was real either way.


---

## Found after the sweep — the dynasty was missing from the dynasty screen

**#29 — `api.bloodline()` omitted every forebear of the played line.** Found while driving the built game
to screenshot the Family Record for the store page.

`bloodline()` built its nodes from `getActiveModel().tokens`. But `succeed()` reworks the played token **in
place** — same id, `generation + 1` — so a save four generations deep holds exactly **one** token for the
line you actually played. The tree therefore rendered the living star and the brothers he was picked over,
and left out his father, his grandfather and the founder. On a four-generation dynasty that is three of the
four men you spent hours playing, absent from the one screen the whole fantasy is displayed on — and the
"founder at the base" layout in `renderFamilyTree` had nobody to put at the base, so the lowest rank went
to whichever passed-over brother happened to hold the lowest generation number.

Two consequences fell out of the same root cause:
- Every sibling records his father as the **bare token id**, which names a *line*, not a man — and that line
  had since advanced. A generation-1 brother was drawn hanging off his own great-grandson, so his branch ran
  backwards up the page.
- A retired forebear had no node, so nothing displayed his legend tier. The medallions that did render for
  retired men were blank ovals under a name.

The men were never lost: `succeed()` has always written a legend snapshot under `<id>:g<gen>` (that suffix
exists for exactly this reason). They simply had no node. The fix synthesises the ancestor chain from those
snapshots, chains each man to his father, and resolves a bare token id to the forefather of the generation
above. A chain that starts partway up the tree — which is what a **cousin switch** produces — hangs off the
father that cousin was born to rather than floating as a second root; `qa_branch_switch.ts`'s "exactly one
root" assertion caught that case after the first version of the fix, which is precisely its job.

`tools/playtest/bloodline_tree.ts` is the new probe: it drives the real facade through four generations and
asserts the record holds every generation from the founder to the living star, each hanging off a father
exactly one generation above him, with a caption on every retired man. Against the unfixed tree it reports
9 distinct failures; the sweep's existing bloodline harnesses all passed throughout, because every one of
them measures a tree built from tokens and so shared the blind spot.

## The late game, swept — and it holds

#29 raised an obvious question: what *else* has never been driven several generations deep? The whole
late-game surface — the honours ledger, the renown ladder, award attribution across a token that is reborn
under its own id, prestige, and whether any of it survives being closed and reopened — only accumulates
across successions, so no existing harness could reach it.

`tools/playtest/late_game.ts` drives six generations through the real facade and checks five things.
**All of them hold.** Renown climbs 156 → 485 → 862 → 2223 → 2763 → 4031 and never falls, as the trophy
room promises; the ledger banks each season exactly once; every bloodline award resolves to exactly one man
on the record; nothing goes non-finite; and renown, legends, tree size and prestige all survive a
save/reload byte-identical.

A probe that passes on its first run is worth nothing until it has been shown to fail, so it was mutation
tested against three separate reversions:

- **Strip the ancestor nodes** (revert #29) → caught, and from a completely independent angle to
  `bloodline_tree.ts`: the forebears' awards resolve to nobody, so it reports "the man who won it has no
  node" rather than anything about tree shape.
- **Bank every honour twice** → caught: all 20 seasons named as duplicated.
- **Make renown an average rather than a sum**, so a wide generation dilutes the name → caught at the first
  succession (156 → 140).

Two of the checks were *vacuous* when first written, and both are worth recording because it is the same
mistake in two costumes. The award assertion ran over an empty list — the harness never played matches, so
no season stats existed and therefore no awards — and passed happily against a reverted fix. Recording
per-player stats fixed that, except the star is not in `club.players` (he lives as a Token, merged in for
reads), so the *bloodline* still won nothing and the check still measured only squad players. The probe now
counts how many bloodline awards it actually examined and fails if the answer is zero. A check that cannot
fail is the defect class this project keeps producing; it is worth assuming any new assertion is one until
a mutation proves otherwise.
