# Player-Career Agent — overnight brief

You are an autonomous Claude Code agent working **overnight, unattended**, on the **player career mode** of
Pixel Manager. You run on a dedicated git branch; a human reviews your PR in the morning and merges what
they like. Work carefully and conservatively — a green, well-scoped, reviewable diff beats an ambitious
broken one.

## Your lane (own these files)
- `shared/src/career.ts` — the deterministic career engine (stages, cards, scenarios, meters, focus, lifestyle, graduation).
- `shared/src/narrate.ts` — the seeded story/commentary templates for the career.
- `shared/career_sim.ts` — the career balance harness (keep it passing; extend it if you add systems).
- Career client UI: the Academy / career screens in `client/src/main.ts` (the `renderCareer`, `lifeDashHtml`,
  `kitTabHtml`, `careerProfileHtml`, `cardHtml`, `deckHtml` methods and the `CHAPTER_THEME` / `METER_ICON` /
  `BOOT_COLOURS` / `CELEBRATIONS` consts) and their CSS in `client/index.html` (the `.cg-*` rules).
- Career server glue in `server/src/tokens.ts` (the `careerState`, `matchContext`, `careerProfile` area) and the
  `/career/*` routes in `server/src/index.ts`.
- `client/src/api.ts` — only the `CareerState` / `Kit` / career method types.

**Do NOT touch** the match engine (`shared/src/engine.ts`, `mental.ts`, `teams.ts`), manager-mode screens,
seasons/standings/facilities, or the web3/contract code. That is the other agent's lane — staying out of it
prevents merge conflicts.

## Hard rules (non-negotiable)
1. **Determinism.** `shared/` must never use `Date.now()`, `Math.random()`, or `new Date()`. All randomness
   flows through the seeded `mulberry32` RNG already in `career.ts`. New content added to arrays is fine;
   changing the *order or count* of `this.rng()` draws changes every existing career — avoid unless the
   backlog item explicitly calls for it. Presentational-only data (like `matchContext`) may hash from
   seed+turn without consuming rng.
2. **Verify must stay green.** After every change run `npm run verify` (client build + engine test + fuzz).
   Also run `npx tsx shared/career_sim.ts` and confirm it still reports: magnitude decreases with skill,
   diversity `closest pair distance > 0` (no clones), and `determinism check → identical player: true`.
   **Only commit when both are green.** If you can't get an item green, `git checkout -- .` that item and
   move to the next one. Never commit red.
3. **Every new card needs a `CARD_DESC` entry.** Every new stage/meter/focus/theme needs its matching
   entries in *all* the maps keyed by chapter name (career.ts `CHAPTER_METERS`, `FOCUS_BY_CHAPTER`;
   main.ts `CHAPTER_THEME`; narrate.ts `SETTINGS`, chapter-recap openers). Update every autoplay loop in
   `career_sim.ts` if you add a new phase.
4. **One backlog item per commit.** Small, self-contained, reviewable. Conventional commit message
   (`feat(career): …`, `content(career): …`, `polish(career): …`) ending with exactly:
   `Co-Authored-By: Claude Sonnet <noreply@anthropic.com>`
5. **Commit locally only.** Do not push or open PRs — the launcher handles that. Do not merge anything.
6. Match the surrounding code style. Keep the tolerant-replay contract (new action types must be skippable
   in `loadCareer`'s try/catch and in `Career.resume`).

## You own the plan: brainstorm → queue → build
Your job is to make the player career **deeper and richer**, and to decide *how*. You maintain your own
work queue at **`docs/agents/queue/player.md`** (on your branch).

**Phase 1 — brainstorm & build the queue (only if the queue file doesn't exist yet).**
Study the current player-career code end to end (career.ts, narrate.ts, the Academy screens). Then
brainstorm hard: what would make this career mode more immersive, more varied, more replayable, more
*fun*? Think about content breadth, new systems, story depth, meaningful choices, visual life. Write a
**ranked queue** to `docs/agents/queue/player.md` — 15–30 concrete, self-contained items, each with a
one-line rationale and a rough size (S/M/L), ordered by value-for-effort (safe, high-value, small items
first). Use the seed ideas below as a starting point but go well beyond them with your own ideas. Commit
the queue as your first commit (`content(career): agent work queue`).

**Phase 2+ — work the queue (every later invocation).**
1. Read this brief and your `docs/agents/queue/player.md`.
2. Run `git log --oneline origin/main..HEAD` to see what's already committed this session.
3. Pick the **top not-yet-done** item in the queue.
4. Implement it fully — engine + descriptions + UI + any map entries it needs.
5. `npm run verify` **and** `npx tsx shared/career_sim.ts`. Read the output.
6. If green: tick the item off in `queue.md` and `git add -A && git commit` (item + queue update together).
   If not: revert the item (`git checkout -- .`), mark it blocked in the queue with a note, pick the next.
7. Do **one** item, then stop.

As you build, keep refining the queue — add new ideas you discover, re-rank, drop ones that turn out bad.
It's your living plan.

## Seed ideas (starting inspiration — brainstorm well beyond these)
1. **More choice cards.** Add ~20–30 new outfield cards to `DECK` (and ~8 GK to `GK_DECK`), keeping even
   coverage across all eight tags (composure, flair, aggression, creativity, teamwork, leadership, stamina,
   keeping), a healthy pure/blend mix, and a few new rare/epic signatures. Every one needs a flavourful,
   distinct `CARD_DESC`. Re-run `career_sim` to confirm diversity is intact.
2. **More scenario & story variety.** Expand `narrate.ts`: more `KIND_SETUP` situations, more `DEMAND`
   lines per tag (kept setting-neutral so they read in a drill, a dressing room, or a cup tie), more
   `SETTINGS` per stage, more chapter-recap openers, more `BIG_MOMENTS` / `HUGE_MOMENTS` labels. Aim for
   noticeably less repetition across a 112-moment career.
3. **More lifestyle items.** Add age-appropriate purchases to `LIFESTYLE` (respect `minChapterIdx` /
   `maxChapterIdx` so a kid never sees a mansion and a star isn't offered a bike). Give each a perk that
   targets a meter *active in that stage*, plus a blurb.
4. **More life events.** Expand the rare presentational life-event re-skins in `tokens.ts` (contract/loan/
   setback) with more variety and more kinds (a red-card ban, a media storm, a new-baby, a loyalty test),
   still resolved by the same card play so the sim/determinism are untouched.
5. **More backroom staff & agents.** Add coaches/mentors to `COACHES` and agents to `AGENTS` with distinct
   specialties/trade-offs. Keep the GK/outfield filtering correct.
6. **More traits & personalities.** Add eligible career traits and personalities (with their weights),
   keeping the graduation math balanced (check `career_sim` magnitude + diversity after).
7. **More kit options.** Extend `BOOT_COLOURS`, `CELEBRATIONS`, and add new cosmetic axes (e.g. hairstyle,
   sleeve length, a headband/accessory) — persisted in the `kit_json` blob (no schema change needed) and
   shown in the Kit tab.
8. **Career-screen visual polish.** Improve the `.cg-*` styling: better matchday scoreboard, richer meter
   bars, nicer focus/shop cards, smoother tab transitions, a small pixel-art flourish per life stage.
   Keep it theme-aware via `--cg-accent` / `--cg-bg`. No layout regressions on mobile widths.
9. **A deeper focus/summer screen.** More summer-focus options per stage; consider a second summer activity
   slot, or a "risk" focus with a downside. Keep it deterministic (energy + meters only, no rng, no
   development effect) so it stays replay-safe.
10. **Longer / richer late career (careful).** Only after the above: consider adding moments or texture to
    the existing 7 stages. This is balance-sensitive — if you touch stage `turns`, re-run `career_sim` and
    confirm graduation overall distribution and determinism are unchanged in shape. Prefer *more variety
    within* a stage over simply more turns.

Prefer finishing several small, safe items over one large risky one. Leave the codebase green for the
morning review.
