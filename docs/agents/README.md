# Overnight code agents

Two scoped, **continuous** autonomous Claude Code agents (Sonnet) that keep adding depth + polish to Pixel
Manager — brainstorming their own goals, working them down, and brainstorming more — each on its own
evergreen branch with a live PR you review whenever you like. This is separate from `bots/` (which are
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

## Run it — continuous autonomous devs

The agents run **forever**: brainstorm a queue → work it down one committed item at a time → when the queue
empties, brainstorm more goals → keep going. They **interleave** on a single checkout, each on its own
evergreen branch (`agent/player`, `agent/manager`) with a **live PR** that accumulates commits. Merge a PR
and the agent rolls onto the new main and continues.

On a server (recommended — runs 24/7), inside tmux:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
./scripts/agent-run.sh both
# detach: Ctrl-b then d
```

On a Mac laptop (keep it awake):
```bash
caffeinate -i ./scripts/agent-run.sh both
```

Tunables:
```bash
PACE_SECS=30 MODEL=sonnet ./scripts/agent-run.sh both   # pause between cycles
MAX_CYCLES=20 ./scripts/agent-run.sh player             # bound it (0 = forever, default)
./scripts/agent-run.sh manager                          # just one agent
```

## Stop it

```bash
./scripts/agent-stop.sh          # graceful: finishes the current item, pushes, exits
./scripts/agent-stop.sh --now    # graceful + kill the running turn immediately
```

Requirements: `claude` on PATH (authenticated — `ANTHROPIC_API_KEY` for headless). `gh` is optional: with
it, PRs are opened/managed automatically; without it, branches are pushed and PR URLs printed. **Nothing is
ever merged automatically.** A safety breaker exits after 6 consecutive failed turns (e.g. a bad key).

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
