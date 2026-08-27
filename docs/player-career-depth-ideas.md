# Player-career depth — research-informed roadmap (2026-08)

> ## ✅ SHIPPED (2026-08-27) — worked through by hand
> - **Season objectives** (#1) — seeded per-stage target (strong displays / big-game moments / perfect
>   reads) with a progress bar + done beat. `careerState.objective`.
> - **Career score** (#4) — headline number that climbs with every good moment (× stakes); in the career
>   header + as a handoff payoff. The replay hook. `careerState.careerScore`.
> - **Rival to chase** (#3) — the seeded academy rival now runs his own scoring career; you're measured
>   against him (▲ ahead / ▼ behind). `careerState.rival`.
> - **International call-up arc** (#2) — from the senior stages, a good player earns caps (rate scales with
>   overall). `careerState.international`.
>
> ## ✅ SHIPPED (2026-08-27) — the off-pitch batch, one cohesive "💼 Life" tab
> All deterministic (hash-seeded, derived from the career log — no engine/development change; `career_sim`
> stays byte-identical). Engine in `shared/src/offpitch.ts` → `careerState.offPitch` (senior stages).
> - **Public image / media (#9)** — a marketability score (0-100) + tier (Unknown → Global icon) from career
>   score, caps, big moments and flair, plus a **reputation** axis (Model professional ↔ Firebrand) read from
>   the player's *style* over the career (teamwork/leadership/composure vs aggression/flair).
> - **Sponsorship deals (#5)** — named endorsement deals whose count/tier scale with image; the **reputation
>   splits the brand pool** (clean → wholesome family brands; edgy → louder, higher-paying, more demanding
>   labels), and each deal carries an **obligation/trade-off**. The fame → money → image loop, made visible.
> - **Earned signature boots (#7)** — a collectible catalogue unlocked by milestones (first team, big-game win,
>   first cap, career-score landmark, icon status); earned never bought, perks are off-pitch only (no pay-to-win).
> - **Risky lifestyle (#6)** — an occasional **temptation** beat (card game / bribe / nightlife / bad investment);
>   edgier players are courted more often. Moral-hazard flavour tied to the reputation axis.
>
> ## ✅ SHIPPED (2026-08-27, later same day) — "many more moments" pass
> - **~1.8× more turns per age band** (112 → 202 total, `AGE_BANDS`) — a career now spans a few hundred
>   moments, not 112. `deriveStats` averages success per turn rather than accumulating by turn count, so
>   magnitude stayed in band with no re-tuning needed (verified via the 120-career average in `career_sim`).
> - **Big deck expansion** — 36 more outfield + 12 more GK cards, spread across every tag, with fresh
>   rare/epic signatures, so the longer career keeps drawing variety instead of repeating.
> - **A 4th human-flavoured summer focus per age band** — first-coach bonding at Grassroots, peer rivalry
>   at Academy, the release-day scare at Scholar, pushing for a loan at Youth Team, negotiating a first pro
>   deal at Breakthrough, growing into a leader at First Team, thinking about legacy at Establishing.
> - **Stage-aware season-event narration** — "new manager" / "transfer speculation" / "fan favourite" /
>   "niggling knock" now read differently for a kid ("new coach his mum hears about at the school gates")
>   vs a teen vs a pro — same ids, same mechanics, purely how it's told. Byte-identical `career_sim` output.
> - **Lifestyle purchases with real trade-offs** — flashing the jewellery, a headline-making night out, and
>   building an entourage all buy fame/loyalty at a direct cost to another relationship, not just perks.
> - **Light attribute focus at milestones (#8)** — from Youth Team on, 2 identity-matching training picks
>   per band (+ a GK-specific keeping one) nudge a stat family via a small, capped weight in `deriveStats`.
>   Engine-touching; re-verified magnitude/diversity/determinism (see commit `467a9e4`).
>
> **Still open / next up:** deeper sponsorship variety, more coaches/agents/personalities/traits, more
> objective/milestone/epilogue variety, and further human life-events with branching consequences beyond
> the season-boundary system (e.g. a mid-chapter event, not just at chapter breaks).


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
