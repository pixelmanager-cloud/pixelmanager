# BUG QUEUE — ranked easiest to hardest

Found by a per-subsystem sweep on 2026-09-01; every entry survived a three-lens adversarial refutation
panel. **Struck-through items are fixed.** Each carries file:line and the actual fix, so any of them can be
picked up cold.

`[V]` = I reproduced or read it myself. `[A]` = agent-reported, panel-verified, not yet re-checked by me.

---

## TIER 1 — one line or one argument (nine items)

1. `[A]` **Season-award feed lines never render.** `client/src/main.ts:2488` — `pushFeed('🏅', …)` omits the
   third argument, so it files under `m.season` while every sibling line passes `m.season + 1`; the counter
   bumps twelve lines later and `seasonFeedHtml()` filters on the new value. **Fix:** add `, m.season + 1`.
2. `[A]` **The squad report can never rehydrate.** `client/src/main.ts:2574` — saved as
   `squadReportSeason: mm.season`, incremented at 2633, so `loadMgr`'s `=== m.season` test never passes.
   It is the only surface emitting `data-renew` / `data-release`, so contracts run down and players walk
   free. **Fix:** store `mm.season + 1`.
3. `[A]` **Match-plan note breaks its own tooltip.** `client/src/main.ts:4479` — `hold-lead`'s note starts
   with `"`, terminating the `title=""` attribute; two sibling interpolations escape, this one doesn't.
   **Fix:** `.replace(/"/g, '&quot;')`.
4. `[A]` **The Player tab contradicts the number beside it.** `shared/src/tokens.ts:242` — `careerProfile`
   calls `deriveStats(log, seed, genes)` with no `attrFocus`, while graduation passes it. Role disagreed in
   5 of 60 careers, forming-traits in 27. **Fix:** pass `c.attrFocus` as the fourth argument.
5. `[A]` **The heir never sees the World Finals.** `client/src/main.ts:2141` — `resetMgrForHeir` clears
   `wcStage`/`wcEdition`/`wcRun` but not `wcSeen`, so the father's edition suppresses the heir's.
   **Fix:** add `wcSeen: undefined`.
6. `[V]` **The pause menu never pauses.** `client/src/main.ts:701` — `openPauseMenu` touches `this.running`
   zero times (only writers: spacebar, `startMatch`, `onFullTime`, `skipToEnd`). The match plays on behind
   the dialog. **Fix:** set `running = false` on open, restore on close.
7. `[A]` **A substitute is sent off for a yellow he never got.** `shared/src/engine.ts:357` — `booked` is
   keyed by team*100 + *slot index*, and `makeSub` never clears the slot. **Fix:** `booked.delete(t*100+outI)`.
8. `[A]` **The heir reads his father's news.** `client/src/main.ts:1420` — `resetMgrForHeir` clears
   `arcFired` and `feedFired` but not `feed`; `FEED_MAX = 240` outlives a career. **Fix:** clear `feed`.
9. `[A]` **Prestige card has no Escape and no focus trap.** `client/src/main.ts:1229` — reuses
   `player-card-ov` without `dialogify`. **Fix:** `const close = this.dialogify(el)`.

## TIER 2 — small and local (eight items)

10. `[A]` **Kick Off can be double-activated,** stacking two team-talk dialogs; the second builds a fresh
    `MatchEngine` and wipes the live score. `client/src/main.ts:2846`. **Fix:** preamble `remove()` + `dialogify`.
11. `[A]` **Shortcuts stay live behind the pause overlay** and Space swallows Resume.
    `client/src/main.ts:905`. **Fix:** bail when a modal is open; `dialogify` in `openPauseMenu`.
12. `[V]` **Every injury is the home side, minute 61.** `shared/src/engine.ts:331` — the trigger derives
    from minute and team only, no seed. Measured by me: 14 injuries / 250 matches, **100% team0 min61, zero
    away injuries ever.** **Fix:** fold the match seed into the trigger and the candidate.
13. `[A]` **Red-carded players walk back on at every kickoff.** `shared/src/engine.ts:246` — `reset()`
    rebuilds slots from formation anchors with no `sentOff` check; `pressureOn` and `chaseLooseBall` have no
    guard. 111k on-pitch ticks for dismissed men over 300 matches. **Fix:** park them; add both guards.
14. `[A]` **`clearRun` is never cleared on a turnover,** so the ×12 breakaway shot appetite leaks into
    ordinary play — ~0.99 stale shots and 0.11 stale goals per match. `shared/src/engine.ts:660`.
    **Fix:** reset on every possession change and shot.
15. `[A]` **One deferral suppresses the handoff offer for the whole dynasty.**
    `client/src/main.ts:3697` — `fm_handoff_defer_` keys on a prospect id that is `nft:1` in every save.
16. `[A]` **Rejected-bid keys outlive the manager.** `client/src/main.ts:1884` — `fm_biddismiss_*` /
    `fm_bought_*` are season-scoped but survive succession while the counter resets to 1.
17. `[A]` **The wage forecast bills the star, the rollover doesn't.** `client/src/main.ts:1877` — forecast
    reads `mergedClub()`, `advanceSquadSeason` bills raw `club.players`. Overstated by the biggest wage.

## TIER 3 — needs care (nine items)

18. `[V]` **The season rollover can be re-run on the retirement season.** `client/src/main.ts:2608` — the
    early return precedes the only `results: []` / `season + 1` reset, and I confirmed `retireStar` contains
    **no `saveMgr` call at all**. Re-pays prize, sponsor, facility income, title honour and promotion, ages
    the squad again, on every pass. **Fix:** reset before the early return, or move retirement above the
    reward calls. *Worst one in the list.*
19. `[A]` **Trialists never leave.** `client/src/api.ts:969` — filed under season N, swept after
    `spSeasonReward` has already advanced to N+1, so `loaneeIds` returns empty. Free players, then sellable.
    Same off-by-one class as the award bug fixed yesterday.
20. `[A]` **Insolvency pays a dividend.** `client/src/api.ts:1032` — `owed` is decremented then discarded,
    while each forced sale credits `addCoins`. Being unable to pay wages is more profitable than paying them.
21. `[A]` **Arc `coins` effects never reach the save.** `client/src/main.ts:3465` — written to the
    display-only `this.account.coins`, which `setMe()` overwrites. 1,031 arc options carry one; none moves a
    coin. **Fix:** bank as `arcCoins` and settle at rollover, like `arcPrestige`/`arcBoard` already do.
22. `[A]` **`sellMult` bends no coin.** `client/src/api.ts:514` — the squad report promises unsettled men
    sell for up to 20% less; `squadSaleValue` takes no morale argument. The re-sign half *is* wired.
23. `[A]` **Awards render against the current heir.** `client/src/api.ts:1283` — `succeed()` reuses the
    token id, so `wonBy.get(t.id)` hands the grandfather's medals to a child. **Fix:** generation-qualified key.
24. `[A]` **Legend cards collapse onto the founder.** `client/src/api.ts:1266` — the `:g<gen>` suffix is
    stripped and last-write-wins keeps the oldest.
25. `[A]` **The whole Grassroots focus bank is unreachable.** `shared/src/career.ts:1469` — `rollFocus` is
    called after `turn++`, so `Grassroots` is never the chapter passed. Eight authored options, including a
    keeper's age-10-12 keeping focus, are dead.
26. `[A]` **`hasAgent` keys on an option id three chapters reuse.** `shared/src/career.ts:675` — drops the
    agent lever from Scholar, Youth Team and Breakthrough. **Fix:** gate on chapter, not id.

## TIER 4 — design call needed, not just a fix (two items)

27. `[A]` **Bench emptied at 58', 59', 60' in 100% of matches.** `shared/src/engine.ts:345` — no spacing
    rule; 300 matches produced `{58:300, 59:300, 60:300}`, zero variance. Fixing it is engine balance, and
    it currently starves #12. **Needs:** a substitution-spacing decision.
28. `[A]` **88 of 90 cross-arc `requires` options are offered in under 1% of careers,** and
    `tools/playtest/gate_content.ts:111` counts declarations rather than simulating, so it passes forever —
    a check that cannot fail. With `ARCS_PER_CAREER = 20` from a 414-arc library both arcs must land in the
    same 20, in order. **Needs:** a call on whether cross-arc payoffs should be reachable at all.

---

**Also fixed on 2026-09-01, before this list existed:** the gate itself (`verify && playtest && qa`
short-circuited on a permanently-red leg, so playtest and qa had not run from `npm run gate`, and
`agent/run.sh` deleted every overnight branch); `fuzz_test.ts` and `career_sim.ts` never executed inside
`verify`; and `ach_goals`/`ach_assists`/`ach_potm` read and rendered but written only as literal `0`, so
every legend card read "0 goals · 0 assists · 0 ★".
