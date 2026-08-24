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

- [ ] Add an "Apply suggested counter" button to the scouting report that sets the user's tactics sliders to a sensible counter to the opponent's tactics (reuse the counterAdvice logic), then re-renders the lineup editor.
- [ ] Make the full-squad-stats table sortable: clicking a stat column header sorts the roster by that stat descending (click again to toggle ascending). Keep position colours and the XI highlight.
- [ ] Add a "Reset round (dev)" button on the hub, only visible when running on localhost, that clears the saved round from localStorage and generates a fresh one immediately (bypassing the hourly timer) to make testing easier.

## Roadmap (context for the agent — not tasks yet)
1. Season/league loop: rounds accumulate into a standings table across the season.
2. Per-player roles (target man, playmaker, poacher) that modify behaviour.
3. Persistence + accounts via the `server/` package.
4. Onchain phase: player NFTs, commit-reveal match settlement, token/wages (XLayer testnet first).
