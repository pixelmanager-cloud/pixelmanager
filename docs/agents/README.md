# Overnight code agents

Two scoped, autonomous Claude Code agents (Sonnet) that add depth + polish to Pixel Manager overnight, each
on its own branch, each opening one PR you review in the morning. This is separate from `bots/` (which are
gameplay bug-hunt bots, not code writers).

- **Player-career agent** — `docs/agents/player-career-agent.md` (more cards, story variety, lifestyle,
  kit, career-screen polish; owns the career engine + Academy screens).
- **Manager-career agent** — `docs/agents/manager-career-agent.md` (manager story layer, commentary
  variety, facilities/economy, tactics depth, manager-screen polish; owns the match engine + manager
  screens).

Each agent **brainstorms its own depth plan** and writes a ranked, living work queue
(`docs/agents/queue/player.md` / `manager.md`) on its branch, then works it down — the seed ideas in the
briefs are just a starting point. The briefs put them in **separate file lanes** so their two PRs rarely
conflict.

## Run it (on this Mac, before bed)

```bash
caffeinate -i ./scripts/agent-run.sh both
```

`caffeinate -i` keeps the Mac awake for the run. Each agent attempts `ITERS` backlog items (default 6),
one commit each, then pushes its branch and opens a PR.

Tunables:

```bash
ITERS=8 MODEL=sonnet ./scripts/agent-run.sh both   # more items per agent
./scripts/agent-run.sh player                       # just one agent
```

Requirements: `claude` and `gh` on PATH, `gh auth login` done. Nothing is merged automatically.

## Guardrails (baked into the briefs + launcher)

- Each agent works only on a fresh throwaway branch off `origin/main`; **nothing merges without you**.
- Every commit is made **only with `npm run verify` green** (engine calibration bands + fuzz); the player
  agent also keeps `shared/career_sim.ts` green (determinism + diversity + magnitude).
- Determinism is protected: no `Date.now`/`Math.random`/`new Date` in `shared/`.
- One backlog item per commit, conventional messages, `Co-Authored-By: Claude Sonnet`.
- The two agents stay in separate file lanes to minimise merge conflicts.

## Morning review (with Claude Code)

```bash
gh pr list --state open
gh pr diff <PR#>            # or open the PR in the browser
```

Then, in a Claude Code session, ask to walk the two PRs with you — review each commit, sanity-check the
calibration/determinism numbers in the commit bodies, and cherry-pick or drop individual commits before
merging. Merge what you like; close/leave the rest. Session logs are in `docs/agents/logs/` (gitignored).
