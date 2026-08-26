# Manager-career agent — work queue

Owner-manager frame only: no board, no sacking, no transfer budget/requests, no wage pressure.
The fantasy is a **dynasty** — your own club, your own owned NFT pros, across seasons. Every item
below fits inside that. `docs/manager-depth-ideas.md` has earlier brainstorming (predates the
owner-manager framing correction at its top) — reused where it fits, dropped where it assumed a
board/sack loop.

Legend: size S(<2h) / M(half-day) / L(full session+). **CAL** = touches the match engine or a
match-outcome input → re-run `npm run verify` and paste before/after calibration numbers in the
commit. Everything else is presentation/economy/data — verify still must stay green, but no band
is expected to move.

Work top to bottom, one item per commit. Tick `[x]` when done; add a one-line note if blocked.

## Queue

1. [x] **Gaffer's Diary — season story panel on the hub.** Seeded template narration (reuse the
   `narrate.ts` pattern) that turns match results + streaks + table position into a running season
   story: an unbeaten run, a rocky patch, "closing in on promotion", a first-ever win over a pod
   rival. Presentational only, pure function of existing match/standings data. New hub panel. (M)
2. [x] **Club records & hall of fame page.** Biggest win, longest unbeaten run, top all-time
   scorer/appearances, first trophy — derived from `matchstats`/`honours`/`awards` history, stored
   incrementally or computed on read. A small new screen or hub section, "a record falls" callout
   in the match report when one is broken this match. (M) — shipped as a new "📜 Records" tab on
   the standings screen (`/records` route + `computeClubRecords` in shared, pure derivation, no
   persisted state). The in-match-report "a record falls" callout was left out to keep this
   commit reviewable — tracked as new item 21 below.
3. [x] **Post-match headline + reaction line.** One seeded headline sentence at full-time keyed off
   the scoreline/table context (thumping win, late equaliser, giant-killing, relegation six-pointer)
   — pure text composition over already-known result data, shown on the match report screen. (S) —
   shipped as `matchHeadline()` in shared, fed pre-match pod rank + rating context computed in the
   `/matches` POST handler, returned as `headline` and shown as the match-report lead line (falls
   back to the old plain scoreline phrasing if absent).
4. [x] **Form guide + run-in tracker.** A WDWLW strip per club (derive from `results`), an
   "X games unbeaten/winless" counter, and — in the closing fixtures of a season — a callout line
   ("2 wins from the title", "in the drop zone with 3 to go") on the standings screen. (S/M) —
   shipped as `computeFormGuide`/`runInCallout` in shared (`shared/src/formGuide.ts`), wired into
   `/standings` (`form` map + `runIn` string), rendered as a Form column on the league table plus
   a callout banner above it on the standings screen.
4. [x] **Manager profile & reputation badge.** A derived reputation number from career trophies /
   win% / promotions (aggregate over `honours`), shown on the hub — extends the existing prestige
   badge into a persistent manager-identity stat, no new mechanic underneath. (S) — the hub badge
   and prestige score already existed; added `promotions` (reconstructed from the `league` honour
   history — a tier increase between consecutive seasons) and `winPct` to `ManagerRecord`/
   `Prestige` in `shared/src/prestige.ts`, folded promotions into `prestigeScore`, and surfaced
   both on the prestige card (`📈 N promotions`, `NN% win rate · N seasons managed`).
5. [ ] **Rivalries / derby fixtures.** Deterministically designate a pod rival (repeat opponent /
   closest-rated club); flag those fixtures as "derby" in the fixture list and match report with a
   small extra commentary flourish and a head-to-head record line. (M)
6. [ ] **More match-commentary phrasing variety.** Expand the text engine's per-event line pools
   (goals, saves, fouls, subs, fatigue) with more phrasings keyed by scoreline/minute/stakes so a
   repeat viewer sees fresher text — presentational only, must not touch probabilities. **CAL**
   (verify must show identical calibration numbers before/after — a text-only diff). (M)
7. [ ] **Season awards expansion.** Add 2-3 new season awards beyond Golden Boot/Playmaker/League
   Best — e.g. Golden Glove (fewest conceded while ap­pearing), Iron Man (most appearances), Team
   of the Season XI — computed the same way as existing awards in `seasons.ts` rollover. (M)
8. [ ] **Head-to-head & all-time results record.** A per-opponent record (`P W D L GF GA`) visible
   from the standings/fixture screen, aggregated from `results`. Pure read-side aggregation. (S/M)
9. [ ] **Set-piece routines — designate corner/FK targets beyond the auto-pick.** Let the manager
   assign not just takers (`takesPen/Fk/Corner`, already supported) but a preferred *aerial target*
   for corners, read by `takeCorner()` instead of always auto-picking best strength+positioning.
   Small, bounded engine change. **CAL** (paste before/after). (M)
10. [ ] **More tactics presets.** Add 3-4 new named presets to `TACTIC_PRESETS` (e.g. "Wing Play",
    "Long Ball Battering Ram", "Catenaccio") within the existing slider ranges — no new mechanic,
    just more starting points. **CAL** (should be calibration-neutral since presets already exist
    inside tuned bounds, but re-run verify anyway). (S)
11. [ ] **Facilities: one more tier / a new one-off club investment.** Either extend an existing
    facility's effect curve or add a small one-off purchasable (e.g. a friendly-tour income boost,
    a one-time youth-intake bonus) to `facilities.ts` + its route + the club screen. Keep the
    economy balanced against existing coin income. (M)
12. [ ] **Training focus (post-graduation development steer).** Let the manager pick a per-season
    training emphasis (physical / technical / balanced) that biases `developAttrs()` in
    `lifecycle.ts` toward specific stats within the existing growth/decline envelope — makes the
    Training facility a real choice, not just a number. Deterministic, applied at rollover only.
    **CAL-adjacent** (doesn't touch the live match engine, but re-run verify since it's a shared
    lifecycle path). (M/L)
13. [ ] **Captain & leadership visibility.** Surface the existing `captain`/`teamLeadership` mental
    layer in the lineup editor (armband icon, a "no captain set" nudge) — the engine already reads
    leadership; this is UI making an existing mechanic legible. (S)
14. [ ] **Retirement testimonial / legend card screen polish.** A proper full-screen "legend card"
    moment when a token retires (art-card layout: peak overall, achievements, generation, a seeded
    farewell line) instead of a toast — reuses `legendCardOf()` data already computed. (M)
15. [ ] **Deeper opponent scouting — a scouting "dossier" screen.** Beyond the current tiered
    reveal, add a persistent per-opponent dossier (last-5 form, head-to-head record, notable
    threats) that upgrades as scout tier rises — mostly aggregation over data already read
    elsewhere (`scouting.ts`, `matchstats`). (M)
16. [ ] **Squad chemistry / partnership flavour.** A small, bounded, deterministic pre-kickoff
    bonus for fielding the same back-four or strike-partnership across consecutive matches
    (familiarity), surfaced as a "settled partnership" note. **CAL** (real engine input — keep the
    magnitude tiny, paste before/after). (L)
17. [ ] **Visual polish: match viewer pitch rendering.** Improve the pixel-art match view (ball
    trail, subtler crowd/pitch texture, clearer possession/momentum bar) — check for mobile-width
    regressions. Pure client CSS/canvas, no engine change. (M)
18. [ ] **Visual polish: standings & fixtures screens.** Clearer table zebra striping,
    promotion/relegation zone shading, sticky header on scroll, tidier fixture-row layout on narrow
    widths. (S/M)
19. [ ] **Cup run narrative.** A small round-by-round cup story (draw reveal line, "into the
    quarter-finals", giant-killing/upset commentary) surfaced on the cup screen — reuses
    `computeCup()` output, presentational only. (M)
20. [ ] **Generational dynasty record.** A bloodline view: for a reborn lineage, show the chain of
    generations with each one's peak rating and honours — a keepsake page for a long-running
    dynasty, aggregated from `legacies`. (M/L)

21. [ ] **"A record falls" match-report callout.** Now that `/records` (item 2) exists, compare a
    just-played match's result against the club's records fetched just before it, and show a small
    banner on the match report ("New club record: Biggest Win!") when the match itself set one —
    biggest win is the easy first case (compare margins), unbeaten run needs the pre-match record
    fetched and diffed. (S)

## Notes / blocked
(none yet)
