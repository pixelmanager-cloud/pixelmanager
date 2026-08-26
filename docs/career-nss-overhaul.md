# Career game overhaul — a New Star Soccer-style football life-sim

**Goal:** turn the career (breeder) game from a 54-click card slideshow into a **New Star Soccer
(NSS)-style football RPG** — you *live* one player's life from unknown kid to star, juggling
matches, training, money, lifestyle and **relationships**, aging through chapters. It stays
**deterministic + seeded + no-LLM + off-chain**, and still graduates into the on-chain pro NFT.

Model reference: **New Star Soccer** — matches made of skill "moments"; an **energy** budget;
**money** (wages/sponsors/bonuses) spent on lifestyle; and the heart of it, **relationship meters**
(Boss, Team, Fans, Sponsors, Partner, Friends) you must keep happy or suffer concrete consequences
(benched, no passes, dumped). Depth comes from the *juggle*, not a bigger deck.

## Why NSS fixes the three pain points
1. **"Card choices are limited / boring."** NSS depth isn't more cards — it's **choosing what to do
   with limited energy** across matches / training / relationships / life, each with tradeoffs. The
   card play becomes one activity among many, and every turn is a real strategic decision.
2. **"I don't know what the boss/narration wants."** In NSS every ask is tied to a **named person
   and a meter**: *"The gaffer's unhappy — win the ball back and impress him"* moves the **Boss**
   meter; a teammate wants you to pass; the sponsor wants a goal. The *who* and the *why* are
   explicit because they're attached to a relationship you can see rising/falling.
3. **"Aging is a slideshow, 10 minutes."** A hub + energy + meters + money + transfers + a real
   life turns 15 years into a *lived* career with weight and replay value.

## The NSS → our-game mapping
| New Star Soccer | Our adaptation (deterministic, no-LLM) |
|---|---|
| Real-time flick shot in match "moments" | The **card play** IS the moment — a seeded situation + your card choice + a fit-based, seeded outcome. Keep it, but frame it as an NSS moment with a clear ask + clear result. |
| Energy budget | An **energy** stat spent per activity (match/train/relationship/life), recovered by rest. The core juggle. |
| Manager/Team/Fans/Sponsors/Partner/Friends meters | **Relationship meters** (0–100) with concrete gameplay effects. THE big depth add. |
| Money (wages, sponsors, bonuses) | A real **wallet** the player earns + spends. |
| Lifestyle (cars, houses, gifts, casino) | **Lifestyle / status** purchases that buy relationship/mood/income + **kit/identity** cosmetics. |
| Training drills | **Training** page: spend energy to develop a chosen stat (ties to the pro's graduated attrs). |
| Transfers, national team, trophies, retirement | **Career progression** across age chapters → the graduation into the manager-game pro. |

## The new structure — a career HUB (like the manager game)
A **dashboard** for your player (age, club, stats, form, reputation, money, energy, and the
relationship meters), with pages you navigate — not a linear slideshow:
- **⚽ Matches** — play the next fixture as a short run of **moments** (2–4 card plays that matter),
  earning a **match rating** that moves Boss/Team/Fans and your form.
- **🏋️ Training** — spend energy to develop a specific attribute; the coach relationship boosts it.
- **🤝 Relationships / Life** — the juggle: spend energy/money to raise **Boss / Team / Fans /
  Sponsors / Partner / Friends**; each low meter has a real cost (see below).
- **💼 Deals** — contracts, agents, **sponsorship** offers (money vs obligations vs development).
- **🛍️ Lifestyle & Kit** — spend money on status items (mood/income/relationship boosts) + cosmetic
  identity (boots, number, celebration, hairstyle) you own on the NFT.
- **😴 Rest** — recover energy; time passes.

### The weekly loop (a "turn" becomes a week)
Each week: you have **energy**. Spend it across the hub (train, tend a relationship, a life choice)
and **play the match**. Outcomes feed your **meters + stats + money + reputation**. Neglect a meter
and pay for it. Over ~15 in-game years (chapters) you rise, transfer up, and graduate at ~25.

## The relationship-meter system (the core depth)
Six meters, each 0–100, each with a **concrete, deterministic effect** when low/high — this is what
makes every week a real decision:
- **⚽ Boss** — low → **benched** (fewer match moments / lower stakes); high → captaincy, big-match
  starts. Raised by good ratings + doing what he asks in scenarios.
- **👥 Team** — low → **teammates don't pass to you** (worse card fits / fewer chances); high → more
  service. Raised by socialising (energy) + unselfish play.
- **📣 Fans** — low → jeers hurt confidence (form); high → adoration → **marketability/earnings**.
  Raised by performances + media choices.
- **📸 Sponsors** — low → deals dry up (**income**); high → lucrative endorsements. Raised by
  fulfilling obligations + fame.
- **❤️ Partner / 🍻 Friends** — low → **mood/energy drain** (they leave); high → morale + energy.
  Raised by spending time/money (gifts, nights out).
All deterministic: meters move by seeded outcomes + your choices, so a career still replays
identically (essential for the on-chain verifiable lifecycle).

## The economy
- **Earn:** wages (scale with club/tier), match bonuses, sponsor payments, achievements.
- **Spend:** training (energy is the gate; money for premium drills), gifts (relationships), lifestyle
  status (mood/income), kit cosmetics, agent fees.
- Money → status/relationships → performance → bigger club → more money. The NSS loop.

## Matches as "moments" (evolving the card game)
Keep the deterministic card engine, but present a match as a **short sequence of key moments** (not
one isolated card): e.g. *"25' — you're through on goal"* → choose a finishing card; *"60' — they're
pressing"* → choose to win it back. Each moment: a **named, concrete ask** + your hand shown with a
**fit indicator** (how well each card suits THIS moment) + a clear seeded result + a **match rating**
that feeds the meters. This directly fixes "vague" and "few choices."

## Narration clarity (the "I don't know what they want" fix)
Every scenario becomes: **[named character] + concrete ask + stake + what each card does here.**
- *"Coach Hargreaves, arms folded: 'We're getting bullied in that midfield. Go and WIN IT BACK — I
  want to see you bite into tackles. Impress me and you keep your place.'"* → obvious: play an
  aggression/tackling card; success → **Boss ↑**, keep starting; failure → **Boss ↓**, benched risk.
- Cards show a **fit badge** vs the ask; the result says **what happened + which meters moved + why.**

## Adapting to our constraints
- **Deterministic/seeded, no-LLM** — all meters/energy/money/text are seeded template composition
  (extend `narrate.ts`); a career replays identically (on-chain verifiable stays intact).
- **On-chain** — unchanged: the graduated pro carries the developed stats; the whole richer career is
  just off-chain state keyed by the tokenId. Kit/identity cosmetics can live off-chain (or on-chain
  later).
- **Balance** — the graduated overall must still land in the tuned band; the richer sim feeds the
  same `graduate()` output. More activities = more *texture*, same stat ceiling discipline.

## Phased build plan
1. **Career HUB + weekly loop + energy** — restructure the linear turns into a dashboard with pages
   and an energy budget. The structural spine everything hangs on. *(big, foundational)*
2. **Relationship meters** — the six meters + their concrete effects + the pages to tend them. *The*
   depth injection; directly fixes "boring/repetitive."
3. **Narration clarity + moments** — rewrite scenarios as named-character asks with fit indicators
   and clear meter consequences; present matches as moment sequences. Fixes "vague."
4. **Economy + lifestyle + kit** — money earn/spend, status purchases, cosmetic identity.
5. **Content depth** — many more scenarios, cards, sponsors, life-events, characters, transfers.
6. **Polish** — chapter transitions, milestones, the graduation payoff, replay feel.

Suggested first slice: **#1 (hub + energy) then #2 (meters)** — that's the NSS skeleton, and it
transforms the feel more than any amount of new cards would.
