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

- [x] Write a design document `docs/game-upgrade-ideas.md` (done) proposing ways to make Pixel Manager more fun to play, plus where token-purchasable consumables (energy, boosts, etc.) could slot in for the future web3 layer. FIRST read `README.md`, `docs/economy-and-web3.md`, and `docs/async-pvp-phase1.md` for the current game state and the agreed economy design. Organise the document into four sections: (1) Gameplay & fun upgrades; (2) Match feel / visual upgrades; (3) Progression & retention; (4) Consumables & token sinks — for each consumable idea, state what it does, how it is purchased/burned, and how it fits the economy principles (recurring utility, emissions ≤ sinks, base-players-free / NFT-stars, no pay-to-win-without-matchmaking). Give every idea a one-line rationale and a rough effort estimate (S/M/L), and where relevant note which file/system it would touch. This is a DOCUMENTATION-ONLY task: create the markdown file and make NO code changes. Keep it a clear, skimmable proposal the human can pick from.
- [x] Add an "Apply suggested counter" button to the scouting report (done).
- [x] Add a retro "GOAL!" celebration flash to the match view (done in the main app).
- [ ] Restyle the match possession bar (#poss-bar / #poss-home in client/index.html) as chunky retro pixel segments instead of a smooth fill, to match the arcade theme — home colour filling from the left, away from the right. Keep all existing behaviour: client/src/main.ts still sets #poss-home's width to the live home-possession %, and the % labels keep updating. Prefer CSS-only (e.g. a segmented overlay via a repeating gradient); do not change the possession logic and add no dependencies.
- [ ] Make the full-squad-stats table (statsTableHTML, shown in the lineup editor) sortable: clicking a stat column header sorts by that stat descending, click again to toggle ascending. Keep position colours and the starting-XI highlight.
- [x] Add a small reusable retro toast/notification. When the manager saves their team (the saveTeam success path in client/src/main.ts, after api.setStandingOrders resolves) show a brief toast reading "Team saved ✓" that fades out after ~2s. Add a #toast element to client/index.html + CSS in the arcade theme (VT323/Press Start 2P, neon accent, pointer-events:none, fixed near top-centre, z-index above everything). Client + CSS only; no engine/server changes; no new dependencies.
- [ ] Replace the plain "Loading…" text in the hub (client/src/main.ts showHub sets #league-table to a "Loading…" muted div) with a small animated retro pixel spinner (a CSS-animated element — e.g. a blinking/rotating pixel block) styled to the arcade theme. Add the markup/CSS to client/index.html and use it wherever the hub shows "Loading…". Client + CSS only; no dependencies.
- [ ] Make the match scoreboard react on a goal: in client/src/main.ts syncMatchHud, detect when the #score text changes and briefly pulse/scale-flash the #score element via a short CSS animation class (matching the existing green neon scoreboard). It must not pause or interfere with the running simulation, must auto-clear, and must behave at all match speeds. Client + CSS only; no dependencies.
- [ ] Restyle the "YOUR RECENT MATCHES" rows on the hub: each .mm-row currently shows a W/D/L letter (built in client/src/main.ts) coloured via .mm-row .w/.l/.d. Turn the W/D/L into a small pill/badge (bordered/rounded, win=green, draw=amber, loss=red) in the arcade theme, keeping the score next to it. client/index.html CSS + minimal main.ts markup only; data unchanged; no dependencies.
- [ ] Polish the login screen (#login panel in client/index.html): add a short retro tagline/subtitle under the "ENTER THE LEAGUE" heading (a one-line pitch for the game), give #handle-input nicer arcade styling (focus glow consistent with the buttons), and tidy spacing. Keep the register flow and element ids unchanged (handle-input, register-btn, login-error). CSS-focused, client-only; no dependencies.
- [ ] Add a subtle ball trail in the match view (client/src/main.ts MatchScene + client/src/pixelart.ts): render a short fading trail behind the moving ball (e.g. a few ghost ball images at decreasing alpha, repositioned each frame in sync()). Keep it subtle and cheap (no perf hit); it must only affect visuals, never the simulation. Phaser/client only; no dependencies.
- [ ] Add a brief, subtle camera shake on goals: when a goal is scored, trigger a short low-intensity Phaser camera shake on the match scene (e.g. this.cameras.main.shake(~250ms, small amount)) to complement the existing GOAL banner. Wire it from the goal path (client/src/main.ts celebrateGoal → the scene). Must be subtle (not disorienting), must not pause or affect the simulation, and must behave at all match speeds. Phaser/client only; no dependencies.
- [ ] Add a subtle CRT vignette over the whole app: a fixed, pointer-events:none overlay that slightly darkens the screen corners (radial gradient), layered with the existing scanlines for a retro-monitor feel. Keep it very subtle so it never hurts readability. client/index.html CSS only (e.g. a body::before); no JS, no dependencies.
- [ ] Turn the match "Your squad fitness: X%" readout (#fit-label in client/index.html, updated in client/src/main.ts syncMatchHud) into a small horizontal bar that fills to the fitness % and shifts colour green→amber→red as it drops, keeping the % text. Client + CSS + minimal main.ts change only; no dependencies.
- [ ] Add a post-match summary card: at full-time (client/src/main.ts onFullTime, before it returns to the hub) briefly show an arcade-themed overlay with the final score, both clubs' possession %, and total shots per side (count 'goal' + 'shot_*' events from engine.state.events grouped by teamIdx), that auto-dismisses (and/or on click) then returns to the hub exactly as it does now. Must not break the existing return-to-hub flow. Client only (uses engine.state); no engine/server changes; no dependencies.

## Roadmap (context for the agent — not tasks yet)
1. Season concept: the league table resets into seasons with a champion/history.
2. Per-player roles (target man, playmaker, poacher) that modify behaviour.
3. Consumables + token economy on testnet (see docs/economy-and-web3.md).
4. Onchain phase: player NFTs, commit-reveal match settlement, token/wages (XLayer testnet first).
