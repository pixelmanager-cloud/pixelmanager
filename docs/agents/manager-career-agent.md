# Manager-Career Agent — overnight brief

You are an autonomous Claude Code agent working **overnight, unattended**, on the **manager mode** of Pixel
Manager (the owner-manager career: your squad, tactics, seasons, matches, and the club story). You run on a
dedicated git branch; a human reviews your PR in the morning and merges what they like. Work carefully and
conservatively — a green, well-scoped, reviewable diff beats an ambitious broken one.

## Context: the owner-manager model
The manager IS the club owner and carries their own portable player-NFTs. So there is **no** board,
sacking, transfer budget, transfer requests, or wage-bill pressure to model — the fantasy is building a
**dynasty**: developing owned players, winning across seasons, and a personal managerial story. Keep every
idea inside that frame.

## ⭐ North star — read this first
The #1 priority for the game is **`docs/growth-and-content-strategy.md`**. Read it. Player growth + the
dynasty loop is the cash cow; the manager side must be just as rich so the *other* half of the game earns
attachment too. When you brainstorm your queue and pick each item, favour content that passes its **content
bar**: *does this add a new interacting/trade-off decision or a genuinely new choice/outcome — or is it just
a reskin that plays the same?* Prefer the former. Keep depth **fair (not a grind)** and **legible** (surface
cause→effect). Manager decisions that meaningfully shape how owned players develop are especially valuable.

## Your lane (own these files)
- Match engine & tactics: `shared/src/engine.ts`, `shared/src/mental.ts`, `shared/src/teams.ts`,
  `shared/src/types.ts` (match/tactics types only).
- The text commentary engine (match narration/events inside `engine.ts`).
- Seasons / competition / lifecycle: `server/src/seasons.ts`, `server/src/lifecycle.ts`,
  `server/src/facilities.ts`, `server/src/scouting.ts`, `server/src/matchstats.ts`, and the manager-mode
  routes in `server/src/index.ts` (`/matches`, `/standings`, `/fixtures`, `/scout`, `/facilities`,
  `/standing-orders`, `/leaderboards`, `/awards`, etc.).
- Manager client screens in `client/src/main.ts` (the hub, squad/lineup editor, tactics, match viewer,
  standings, scouting, facilities, transfer market screens) and their CSS in `client/index.html`.
- `client/src/api.ts` — only the manager-mode types (Club, StandingOrders, TableRow, matches, facilities…).

**Do NOT touch** the player-career engine (`shared/src/career.ts`, `narrate.ts`, `career_sim.ts`), the
Academy/career screens, the lifestyle/kit systems, or web3/contract code. That is the other agent's lane —
staying out of it prevents merge conflicts.

## Hard rules (non-negotiable)
1. **Determinism.** `shared/` must never use `Date.now()`, `Math.random()`, or `new Date()`. The match
   engine is fully seeded (`mulberry32`, `seedFrom`). Do not introduce wall-clock or unseeded randomness.
2. **Verify must stay green — the calibration bands are the contract.** After every change run
   `npm run verify`. The engine test must still print, within band:
   - `avg goals/match` in **[1.6, 3.6]** (currently ~2.80)
   - `strong(15) vs weak(11)` win rate **≥ 62%** (currently ~72%)
   - the press / line / preset / duty / shape / anti-spam assertions all pass
   - fuzz: 2000 matches, **all invariants held**, 0-0 rate sane.
   **Only commit when green.** If a change pushes a band out, tune it back or revert. Never commit red.
   When you change an engine lever, note the before/after calibration numbers in the commit body.
3. **One backlog item per commit.** Small, self-contained, reviewable. Conventional commit message
   (`feat(manager): …`, `feat(engine): …`, `content(manager): …`, `polish(manager): …`) ending with exactly:
   `Co-Authored-By: Claude Sonnet <noreply@anthropic.com>`
4. **Commit locally only.** Do not push or open PRs — the launcher handles that. Do not merge anything.
5. Match the surrounding code style. If you add a DB column, follow the existing migration pattern in BOTH
   `server/src/store-sqlite.ts` and `server/src/store-postgres.ts`, add it to `TOKEN_COLS`/relevant
   whitelist, and keep `SELECT *` behaviour working.

## You own the plan: brainstorm → queue → build
Your job is to make manager mode **deeper and richer**, and to decide *how*. You maintain your own work
queue at **`docs/agents/queue/manager.md`** (on your branch).

**Phase 1 — brainstorm & build the queue (only if the queue file doesn't exist yet).**
Study the current manager-mode code end to end (engine.ts, seasons.ts, facilities.ts, the manager screens).
Then brainstorm hard: what would make managing a dynasty more immersive, more varied, more strategic, more
*fun* — within the owner-manager frame (no board/budget/sacking)? Think about the manager's story, match
commentary, things to buy, tactical decisions, competition structure, records & legacy, visual life. Write
a **ranked queue** to `docs/agents/queue/manager.md` — 15–30 concrete, self-contained items, each with a
one-line rationale and a rough size (S/M/L), ordered by value-for-effort (safe, high-value, small first,
and anything touching the match engine flagged as calibration-sensitive). Use the seed ideas below as a
starting point but go well beyond them. Commit the queue as your first commit
(`content(manager): agent work queue`).

**Phase 2+ — work the queue (every later invocation).**
1. Read this brief and your `docs/agents/queue/manager.md`.
2. Run `git log --oneline origin/main..HEAD` to see what's already committed this session.
3. Pick the **top not-yet-done** item in the queue.
4. Implement it fully — engine/server + UI + any migration it needs.
5. `npm run verify`. Read the output and confirm every calibration band still holds.
6. If green: tick the item off in `queue.md` and `git add -A && git commit` (item + queue update together).
   If not: revert the item (`git checkout -- .`), mark it blocked in the queue with a note, pick the next.
7. Do **one** item, then stop.

Keep refining the queue as you go — add ideas you discover, re-rank, drop bad ones. It's your living plan.

## Seed ideas (starting inspiration — brainstorm well beyond these)
1. **A manager story layer** — the manager's own narrative, mirroring the player career's story beats.
   Season-framing text ("a promotion push", "a title defence", "a cup run"), milestone lines (first
   trophy, a derby win, a record streak, a homegrown NFT breaking through), and end-of-season summaries.
   Keep it seeded/deterministic, presentational only. Add a small "gaffer's notebook" / season-story panel
   to the hub.
2. **More match commentary variety.** Expand the text engine's event lines (goals, big chances, saves,
   fouls/cards, momentum swings, subs, injuries) with more phrasings and more context (scoreline, minute,
   who's involved) so a match reads fresh every time. Purely presentational — do not change match outcomes
   or the calibration.
3. **More items to purchase (manager economy).** Deepen `facilities.ts`: more facility tracks / higher
   tiers / new upgrades (training, medical, youth, scouting, sponsor, fanzone…), each with a clear effect
   and a coin cost. Add a couple of one-off "club investments". Keep costs/economy balanced.
4. **More tactical choices & depth.** More tactics presets, more per-player duties/roles, set-piece
   routines, in-match tactical tweaks — anything that gives the manager more meaningful decisions. Every
   new lever must keep the calibration bands (re-run verify; tune as needed).
5. **Richer season / competition structure.** More texture to the season: cup rounds, a super-cup, form
   tables, head-to-head records, a hall of results — within the dynasty frame (no board/budget).
6. **More individual awards & records.** Extend the awards/leaderboards (`matchstats.ts`, awards routes):
   more season awards, all-time records, a club hall of fame, milestone badges for owned NFTs.
7. **Manager-screen visual polish.** Improve the hub, squad editor, match viewer, standings and scouting
   screens — clearer layout, better pixel-art match rendering, nicer tables/cards. No regressions on
   mobile widths. Keep it consistent with the existing visual language.
8. **Deeper scouting.** More scouting depth/tiers, opponent analysis, prospect scouting flavour — kept fair
   and within the existing scout-NFT/tier framework.
9. **Squad & development depth.** More surface for the pro-development curve (training focus that steers
   which stats a 25+ player grows), captain/leadership effects, morale/chemistry texture — deterministic
   and calibration-safe.
10. **Longevity / dynasty texture.** Retirement testimonials, legacy/legend cards, generational records
    across reborn bloodlines — richer keepsakes for a long-running dynasty.

Prefer finishing several small, safe items over one large risky one. Whenever you touch an engine lever,
paste the before/after calibration line into the commit body. Leave the codebase green for the morning
review.
