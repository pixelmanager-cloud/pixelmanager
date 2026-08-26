# Player-career work queue

Brainstormed by studying `career.ts` (1198 lines), `narrate.ts` (297 lines), `career_sim.ts`,
`tokens.ts`, and the Academy screens in `main.ts`/`index.html`. The career engine is already rich —
~85 outfield + 25 GK cards with full `CARD_DESC`, 16 lifestyle items, 14 coaches/mentors, 6 agents,
9 personalities, 13 traits, a seeded recurring cast, chapter recaps, a graduation epilogue, a kit tab
(boots + celebration), and 3 rare life-event re-skins (contract/loan/setback). So most of the seed
brief's items 1/3/5/6/7 are already substantially built. This queue focuses on what's thin, missing,
or newly imagined beyond the brief. Ranked safe/small/high-value first.

- [x] 1. **More life-event variety.** (S) `tokens.ts` only re-skins 3 kinds (contract/loan/setback) at
  22% of low-stakes social moments age 16+. Add 3-4 more presentational kinds — a media storm, a
  loyalty test (boyhood-club approach), a squad-role ultimatum, a public falling-out with a teammate —
  each with its own `LIFE_LABEL` and a matching `KIND_SETUP` entry in narrate.ts. Zero rng/mechanic
  change (same reskin pattern), so fully safe. **Done:** added `media`/`loyalty`/`role`/`fallout` to
  `LIFE_KINDS`/`LIFE_LABEL` in tokens.ts and matching `KIND_SETUP` entries in narrate.ts (7 kinds now,
  same 22% low-stakes-social-at-16+ gate, still fully presentational).
- [x] 2. **More DEMAND lines per tag in narrate.ts.** (S) Currently exactly 3 lines per tag (8 tags =
  24 lines). Double to 6 each so the "what the moment asks" line repeats far less over a 112-turn
  career. Pure content addition, no determinism risk. **Done:** doubled every tag's `DEMAND` array
  from 3 to 6 lines (48 total), same setting-neutral tone; `npm run verify` and `career_sim` both
  green (diversity closest-pair distance 9, determinism identical: true).
- [x] 3. **More KIND_SETUP situations.** (S) `match`/`training`/`social` currently have 6-7 each. Add
  3-4 more per kind for less repetition across a long career. **Done:** added 4 new lines each to
  `match`/`training`/`social` in narrate.ts (11/10/10 lines now, up from 7/6/6), same setting-neutral
  tone; `npm run verify` and `career_sim` both green (diversity closest-pair distance 9, determinism
  identical: true).
- [ ] 4. **More chapter-recap openers.** (S) `chapterRecap` only has 2 openers per chapter (14 total).
  Add 2-3 more per chapter so the "story so far" beat at each of the 6 chapter boundaries varies more
  across replays/careers.
- [ ] 5. **More BIG_MOMENTS / HUGE_MOMENTS labels.** (S) Currently 8 big + 6 huge. Add ~6 more of each
  (a Boxing Day six-pointer, a Youth Cup Final, a Testimonial, a Community Shield curtain-raiser, a
  European night, a Merseyside/Manchester-style derby) for a less repetitive stakes-2/3 moment pool.
- [ ] 6. **Kit tab: hairstyle + accessory cosmetic axes.** (M) Extend the Kit tab beyond boots +
  celebration — add a hairstyle option and a headband/wristband accessory, persisted in the same
  `kit_json` blob (no schema change). Needs new consts in main.ts (mirroring `BOOT_COLOURS`/
  `CELEBRATIONS`) + swatch/selector UI in `kitTabHtml` + matching `.cg-*` CSS.
- [ ] 7. **A second summer-focus slot for later chapters.** (M) Seed idea #9: from Breakthrough
  onward, offer a second, smaller "side activity" pick alongside the main focus (e.g. a charity
  five-a-side, a media day) with its own tiny meter nudge. Must stay deterministic (energy + meters
  only, no rng, no dev effect) and replay-tolerant like `chooseFocus`.
- [ ] 8. **Matchday scoreboard visual polish.** (M) Seed idea #8: the `.cg-scenario`/`matchCtx` area
  is functional but plain — add a proper scoreboard treatment (opponent crest-style monogram, a
  scoreline strip, a competition badge) reading from the existing `matchContext` data. No layout
  regressions at mobile widths (check at ~360px).
- [ ] 9. **A career "milestone" trophy shelf.** (M) `MILESTONE` in narrate.ts has 5 entries (debut,
  first_goal, first_big_win, cup_final, first_start) but nothing surfaces them again after the beat
  scrolls past. Add a small persistent "milestones" strip to the career profile/dashboard that lists
  milestones hit so far this career (read from existing log data — no new state needed beyond
  detecting the same conditions tokens.ts already computes for `milestone`).
- [ ] 10. **2-3 new backroom staff.** (S/M) `COACHES` has 14 entries but no dedicated flair or
  goalkeeper-distribution specialist beyond the generic gk-coach. Add e.g. a "Set-Piece Coach"
  (composure/creativity), a "Sports Psychologist" (composure/leadership, higher bonus but narrower),
  and a "Recruitment-Style Scout Mentor" (flair/creativity). Re-run `career_sim` after.
- [ ] 11. **A 4th sports agent archetype.** (S) `AGENTS` has 6; add one more distinct archetype (e.g.
  a "Local Fixer" — very low exposure/greed, very high draftLuck, for a grounded, opportunity-rich
  path) to widen the agent-choice spread. Check `career_sim` determinism + magnitude after.
  isn't disturbed by an extra agent option (agent choice doesn't feed rng draw order).
- [ ] 12. **Risk/reward summer focus option.** (S/M) Seed idea #9's "risk" focus: add one high-variance
  option per later chapter that trades a small guaranteed meter loss for a larger potential gain,
  computed deterministically from existing state (e.g. from current meter value) rather than rng —
  e.g. "Speak to the Press" — big fan/agent swing sized off current fan standing, still no rng.
- [ ] 13. **More lifestyle items for the late-career gap.** (S) `LIFESTYLE` thins out after chapter 5
  (First Team/Establishing has only watch/invest/mansion). Add 2-3 more star-era purchases (a
  supercar, a boutique restaurant investment, a testimonial-fund pledge) with distinct meter perks.
- [ ] 14. **Rare "double life event" chapter texture.** (S, careful) At most one life-event reskin
  currently fires per chapter (up to 22% chance per eligible turn). Consider no change to frequency,
  but add narrative continuity: if a contract/loan/setback fires, let the *next* eligible life-event
  turn in the same chapter reference the earlier one by id (still purely presentational — reads
  `st.lifeEvent`/log, no new rng). Skip if it turns out to need new persisted state.
- [ ] 15. **A "boots have history" flavour line.** (S) Kit tab: once a boot colour has been worn for a
  full chapter, surface a one-line flavour note next chapter ("still lacing up the same boots — for
  luck"). Purely presentational, reads existing `kit_json` + chapter, no new schema.
- [ ] 16. **2 new traits.** (S/M, careful) `TRAITS` has 13. Add 1-2 more with eligibility gated on
  existing attrs/log (e.g. a "Set-Piece Threat" using `setPiece` overlap already claimed by
  `deadball` — pick an unclaimed angle, e.g. "Late Developer" reading turn-half vs turn-first-half
  average success split). Verify `career_sim` magnitude/diversity afterward since trait `apply` can
  nudge stats.
- [ ] 17. **More GK-specific life texture.** (S) Life-event reskins and lifestyle perks read
  generically; add a GK-flavoured variant of at least one life-event label (e.g. "goalkeeping union of
  one" loyalty framing) so a keeper's career doesn't read identically to an outfielder's off-pitch
  beats.
- [ ] 18. **Deck-diversity guard in `career_sim`.** (S, tooling) Add an assertion/print to
  `career_sim.ts` confirming no single card appears more than N times in a graduated log for a
  max-length career (guards against future draft-weighting regressions as the deck keeps growing).
  Pure test-harness addition, doesn't touch career.ts.
- [ ] 19. **Tab-transition polish.** (S/M) Seed idea #8: the Now/Player/Kit tab switch in
  `renderCareer` is an instant content swap. Add a lightweight CSS transition (fade/slide) between
  tabs for a less jarring switch. CSS-only, no logic risk.
- [ ] 20. **A small pixel-art flourish per life stage.** (M) Seed idea #8: `CHAPTER_THEME` already
  carries a scene emoji/accent/tagline per chapter — extend it with a tiny inline SVG or emoji-cluster
  "backdrop" motif (park pitch → academy gates → stadium) rendered behind the dashboard header for
  each chapter, theme-aware via `--cg-accent`/`--cg-bg`.
- [ ] 21. **Longer Establishing-stage texture (careful).** (L, balance-sensitive) Seed idea #10: only
  attempt after the above are done. Consider more *variety within* the final chapter (more of its own
  BIG/HUGE moment labels, more late-career-specific DEMAND framing) rather than more turns. Must
  re-run `career_sim` and confirm graduation distribution/determinism shape is unchanged.
- [ ] 22. **A short "career retrospective" stat line at graduation.** (M) Alongside the existing
  `graduationEpilogue` prose, surface a small deterministic stat recap (e.g. biggest-stakes moment
  played, best/worst chapter by avg success, cards played most/least) computed purely from `c.log` —
  no new persisted state, just a read-time summary function + UI card.

## Notes for future brainstorming passes
- Watch for items that are actually already done by other overnight-agent branches under different
  names (e.g. `agent/career-*` branches) — check `git log --oneline origin/main..HEAD` and the branch
  list before assuming an item is untouched, since main hasn't absorbed those yet.
- Keep prioritizing S-sized, additive, `CARD_DESC`/map-complete items over anything touching
  `AGE_BANDS`, turn counts, or rng draw order.
