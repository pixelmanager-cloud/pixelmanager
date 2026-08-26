# Player-career depth — research-informed roadmap (2026-08)

Curated from the be-a-pro genre — **New Star Soccer** (the model), **EA FC / Madden Superstar** (skill trees,
objectives), and mobile career sims — filtered against what the game **already has** (energy, six stage-aware
relationship meters + consequences, summer focus, age-gated lifestyle economy, kit, deck-building
development, 7 stages / 112 moments, coaches, agents, personalities, traits, matchday moments).

This is the **player-career agent's roadmap** (parallel to `manager-depth-ideas.md`). Judge each item by the
`growth-and-content-strategy.md` content bar: a new *interacting / trade-off* choice or outcome, not a reskin.
Guardrails unchanged: deterministic (no wall-clock/Math.random in `shared/`), `npm run verify` **and**
`npx tsx shared/career_sim.ts` green (diversity + magnitude + determinism), one item per commit, fair not
grindy, legible cause→effect.

## 🥇 Top adds (high value, fit the frame, not yet in the game)
1. **Season objectives** — the boss/club sets a target each chapter ("score 5, hit 8+ ratings, win the
   derby"); hitting it rewards a card / stat / meter boost. Adds *direction + reward* to every chapter. The
   single biggest bang (NSS + EA FC both lean on it).
2. **International call-up arc** — perform well → called up → international moments & caps → a prestige goal.
   An aspirational new "stage" of moments that gives the career a ceiling to chase.
3. **A rival to chase** — a named `rival` already exists in the seeded cast; make it a *mechanic* — you're
   compared to them, and out-performing them drives motivation + a rivalry storyline.
4. **Career score / star-index headline** — NSS's signature: a single headline "star rating" that visibly
   climbs, and a final **career score** to beat next run. A satisfying meta-number + replay hook.

## ⚡ Off-pitch depth (deepen the lifestyle/meters already built)
5. **Sponsorship deals** — acquire specific deals (not just the sponsors *meter*): each pays, shapes image,
   carries an obligation/tradeoff.
6. **Risky lifestyle — gambling / bribes / moral dilemmas** — NSS's casino + bribes: risk earnings or
   integrity for reward. High-tension off-pitch choices on top of the life-event system.
7. **Earned equipment (signature boots)** — collectible boots giving *small* edges, unlocked through play
   (earned, never bought — no pay-to-win). A progression collectible on top of kit cosmetics.

## 🎯 Growth agency (careful — the game is nurture-driven)
8. **Light attribute focus at milestones** — let the player nudge *which* stats grow (a soft skill-tree),
   adding agency without breaking the card-driven "earned, not chosen" feel. Re-check `career_sim` diversity.
9. **Public image / media moments** — surface fame/marketability as an axis with media choices (praise a
   teammate, court controversy) → sponsors/fans/form.

## Priority
**Season objectives (1)** + the **international arc (2)** give the career *goals and a ceiling* — the thing
that turns "play the next moment" into "chase the dream." Then the **career score (4)** for the replay hook.
These are the NSS / EA-FC pillars the game is currently missing.

Sources: New Star Soccer (Wikipedia, newstar-soccer.com/features), EA SPORTS FC Career Mode guide, Madden
Superstar mode.
