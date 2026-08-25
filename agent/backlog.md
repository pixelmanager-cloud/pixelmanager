# Backlog & timeline

This is the agent's to-do list **and** your steering wheel. The on-server agent
picks the **first unchecked `- [ ]` task** that doesn't already have an open PR,
implements it on a branch, and opens a PR for you to review.

## How to use it
- Add tasks as `- [ ] <clear, self-contained task>`. One deliverable each.
- Order matters: the agent works top-down. Put what you want next at the top.
- Be specific. "Add an Apply-counter button to the scouting report that sets the
  recommended tactics" beats "improve scouting". Vague tasks get a "blocked, please
  clarify" instead of code.
- The agent checks a box (`- [x]`) on its PR branch; merging the PR records it done.
- To pause the agent entirely, create an empty file `agent/STOP` on the server.

## Tasks (top = next)

- [ ] **Match view: richer pitch markings** (ONE focused task — keep it small so it finishes fast). CLIENT-ONLY, DETERMINISTIC: only touch the pitch-drawing code in `client/src` (the Phaser match scene in `main.ts` and/or `pixelart.ts`); make NO changes to `shared/` and do not touch player/ball logic. First read how the pitch is currently drawn (grep for the pitch texture / background in `pixelart.ts` + `main.ts`). Add, in the existing retro palette: a centre circle + centre spot + halfway line, both penalty boxes + 6-yard boxes + penalty spots, the goal mouths, corner arcs, and subtle mown-grass stripes. Match the current pitch dimensions/scale exactly (positions come from engine coordinates — do not change the coordinate mapping). Keep it crisp at the current resolution. Open a PR; `npm run verify` must pass. This is JUST the pitch — do not also do players/ball/camera (those are separate queued tasks).

- [ ] **Match view: better players + ball** (CLIENT-ONLY, DETERMINISTIC; do this AFTER the pitch task). In `client/src` only: make each player sprite face the direction it's moving, add a subtle bob/run cadence while moving, and clearly highlight the ball-carrier (a glow or outline). Give the ball a drop shadow and a smoother short fading trail. Positions still come from the engine each tick — render polish only, no `shared/` changes, no balance changes. Keep it 60fps. Open a PR; `npm run verify` must pass.

- [ ] **Match view: event flourishes + camera** (CLIENT-ONLY, DETERMINISTIC; after the two tasks above). Drive small flourishes off the EXISTING engine events (`goal`, `shot_saved`, `shot_missed`, `chance`, and the new `corner`/`free_kick`/`penalty`): a brief shot streak line toward goal, a keeper "save!" pop, a corner/penalty flag flourish, and a bigger "GOAL!" celebration that names the scorer. Add a subtle camera ease/zoom toward the action (never disorienting; keep the whole pitch legible). Client render jitter (`Math.random()`) is fine in the CLIENT but NEVER in `shared/`. Open a PR; `npm run verify` must pass.

- [x] Write a design document `docs/immersion-ideas.md` brainstorming ways to make Pixel Manager feel far more **immersive** — so the player feels like the manager of a real football club, not just a lineup-picker. FIRST read `README.md`, `docs/async-pvp-phase1.md`, `docs/seasons-and-divisions.md`, `docs/economy-and-web3.md`, and `docs/game-upgrade-ideas.md` to ground yourself in the current game: a deterministic seeded match engine; async PvP with standing orders; seasons + a 10-tier division pyramid with ~20-club pods, promotion/relegation and an honours board; per-player duties; handle+password accounts; and **NO LLM — pure deterministic TypeScript**. Propose immersion features grouped into clear themes, for example: (1) **Club identity & world** — crest/kit/stadium, club history & lore, home city, persistent rivalries; (2) **The manager's world** — a board with season expectations + a confidence/job-security meter, pre/post-match press conferences and media as *deterministic template/seeded text*, per-season objectives; (3) **Squad as people** — player personalities, morale & form, dressing-room relationships, backroom staff, ageing/development across seasons, injuries/suspensions (respecting the no-in-match-consumable + pre-kickoff-only rules); (4) **Matchday atmosphere** — crowd, deeper commentary, narrative moments, rising tension; (5) **Narrative & continuity** — storylines, milestones, an inbox/news feed, rivalries that carry across seasons; (6) **Finances & club-building** — budget, wages, sponsors, facilities, framed to fit the future token economy WITHOUT pay-to-win. For EACH idea give: what it adds, **why it increases immersion** (the "real manager" feeling), a rough effort estimate (S/M/L), which files/systems it would touch, and how it respects the hard constraints (determinism — no `Date.now()`/`Math.random()` in `shared/`, matches stay a pure function of pre-kickoff inputs; NO LLM; any generated text must be deterministic template/seeded). Note which ideas fit the current architecture (async PvP, seasons/pods, duties) with little friction vs which need new subsystems. End with an opinionated "if you build three things first" shortlist. This is a DOCUMENTATION-ONLY task: create the markdown file, make NO code changes, and keep it a skimmable pick-list the human can choose from.

- [x] Build a seeded **simulation fuzz-test harness** that hunts for engine/game bugs, then fix every bug it finds. Create `shared/fuzz_test.ts` (add an `npm run fuzz` script AND include it in `npm run verify`): generate many diverse squads with `generateTeam`/`generateClub` across a wide quality range (3–20), seeded-random formations, tactics (all 5 sliders across their full range), and per-player duties, then play a large batch of full matches (2000+ across varied seeds) on `MatchEngine`. For every match, assert engine INVARIANTS and log any violation with the reproducing seed/inputs: no exception thrown; the clock advances monotonically and the match terminates within the expected tick budget (no infinite loop / hang); `score` values are non-negative integers; every player position stays on the pitch (0≤x≤105, 0≤y≤68) and is finite (no NaN/Infinity); the ball stays in bounds and finite; `fitness` stays within [0,1]; `possession` counts are non-negative; `carrier` (when set) indexes a real player; every event's `teamIdx` is 0/1 with a valid type; the count of `goal` events matches the final `score`. Also sanity-check batch aggregates (goals/match in a sane range; at equal quality neither side wins ~100%/0%; not every match ends 0-0). For EVERY violation, find the ROOT CAUSE in `shared/src` and fix it — keep the engine deterministic (no `Date.now()`/`Math.random()` in `shared/`; a match stays a pure function of its inputs) — then re-run the fuzzer; repeat until it runs clean. Commit the harness plus all fixes as a permanent regression guard. If the turn budget runs out with bugs still open, commit what's fixed and LIST every remaining bug (with repro seed) in the PR body. **Do NOT change game balance / tactics magnitudes** — this is about correctness & robustness, not tuning.

## Done (recent)
- [x] Design doc `docs/game-upgrade-ideas.md` (fun + consumables pick-list).
- [x] "Apply suggested counter" button on the scouting report.
- [x] Retro "GOAL!" celebration flash in the match view.
- [x] Chunky retro pixel possession bar.
- [x] Sortable full-squad-stats table in the lineup editor.
- [x] Reusable "Team saved ✓" toast.
- [x] Retro pixel loading spinner in the hub.
- [x] Scoreboard pulse on a goal.
- [x] W/D/L pill badges on the hub recent-matches rows.
- [x] Login screen polish (tagline + input glow).
- [x] Subtle ball trail in the match view.
- [x] Subtle camera shake on goals.
- [x] CRT vignette overlay.
- [x] In-match fitness bar (green→amber→red).
- [x] Post-match summary card.

## Roadmap (context for the agent — not tasks yet)
1. ~~Seasons: league resets into seasons with a champion/history.~~ **DONE** (Phase A).
2. ~~Per-player roles/duties (target man, playmaker, poacher).~~ **DONE** (duties, manager-assignable).
3. ~~Divisions/pods + promotion/relegation.~~ **DONE** (Phase B, 10-tier pyramid).
4. Phase C: per-season fixtures/schedule (a daily reason to log in) — being built by the human now.
5. Immersion layer (see `docs/immersion-ideas.md` once written).
6. Consumables + token economy on testnet (see `docs/economy-and-web3.md`).
7. Onchain phase: player NFTs, commit-reveal match settlement, token/wages (XLayer testnet first).
