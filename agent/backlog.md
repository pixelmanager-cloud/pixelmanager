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

- [x] Write a design document `docs/immersion-ideas.md` brainstorming ways to make Pixel Manager feel far more **immersive** — so the player feels like the manager of a real football club, not just a lineup-picker. FIRST read `README.md`, `docs/async-pvp-phase1.md`, `docs/seasons-and-divisions.md`, `docs/economy-and-web3.md`, and `docs/game-upgrade-ideas.md` to ground yourself in the current game: a deterministic seeded match engine; async PvP with standing orders; seasons + a 10-tier division pyramid with ~20-club pods, promotion/relegation and an honours board; per-player duties; handle+password accounts; and **NO LLM — pure deterministic TypeScript**. Propose immersion features grouped into clear themes, for example: (1) **Club identity & world** — crest/kit/stadium, club history & lore, home city, persistent rivalries; (2) **The manager's world** — a board with season expectations + a confidence/job-security meter, pre/post-match press conferences and media as *deterministic template/seeded text*, per-season objectives; (3) **Squad as people** — player personalities, morale & form, dressing-room relationships, backroom staff, ageing/development across seasons, injuries/suspensions (respecting the no-in-match-consumable + pre-kickoff-only rules); (4) **Matchday atmosphere** — crowd, deeper commentary, narrative moments, rising tension; (5) **Narrative & continuity** — storylines, milestones, an inbox/news feed, rivalries that carry across seasons; (6) **Finances & club-building** — budget, wages, sponsors, facilities, framed to fit the future token economy WITHOUT pay-to-win. For EACH idea give: what it adds, **why it increases immersion** (the "real manager" feeling), a rough effort estimate (S/M/L), which files/systems it would touch, and how it respects the hard constraints (determinism — no `Date.now()`/`Math.random()` in `shared/`, matches stay a pure function of pre-kickoff inputs; NO LLM; any generated text must be deterministic template/seeded). Note which ideas fit the current architecture (async PvP, seasons/pods, duties) with little friction vs which need new subsystems. End with an opinionated "if you build three things first" shortlist. This is a DOCUMENTATION-ONLY task: create the markdown file, make NO code changes, and keep it a skimmable pick-list the human can choose from.

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
