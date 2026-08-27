# Competitive deep-dive: pricing, Steam Deck, inheritance mechanics, presentation parity

**Status:** research report, 2026-08-27. Deeper follow-up to `docs/feature-gap-analysis.md` (2026-08-27) —
this doc does not repeat that report's findings; read it first. Docs-only, no game code touched.
Companion to `direction.md`, `manager-depth-ideas.md`, `legacy-and-records-design.md`, `ui-ux-research.md`.

Four threads, each researched independently via live web search/fetch (no sub-agents used): pricing
calibration from actual review text, Steam Deck certification requirements, inheritance/relationship
mechanics from dynasty-adjacent life-sims, and presentation-parity bar from our closest comps.

---

## 1. Pricing calibration

### Findings

**Club Soccer Director (2020/2021/2022)** — the clearest cautionary tale on price-vs-depth mismatch.
CSD PRO 2020 launched at ~£20 and sits at 39% positive; the recurring review line is that it's **"not a
£20 PC title, especially when Football Manager Touch 2020 can be purchased for only £2 more"** — buyers
anchor a management sim's price directly against FM Touch, not against genre-generic pricing.
[Goomba Stomp](https://goombastomp.com/club-soccer-director-pro-2020-review/). By CSD 2022 the developer
had pivoted to **free-to-play with IAP** and review sentiment recovered somewhat to 66% positive — but the
underlying complaint shifted from "overpriced" to "money-grabbing," with **stadium upgrades and other core
progression gated behind real-money IAP** carried over unchanged from the mobile version despite the paid
Steam listing existing in parallel.
[Steam](https://store.steampowered.com/app/1698080/Club_Soccer_Director_2022/). A live community thread on
the CSD 2024 successor shows buyers explicitly negotiating with themselves over a €35 price point — "I'd
get it for €20 to €25" — before being talked into it by a peer comparing it favorably to Football Manager;
regional pricing swinging from €35 (EU) to ~$10 (Israel) surprised buyers and reads as inconsistent/cheap
in reviews.
[Steam discussion](https://steamcommunity.com/app/1951410/discussions/0/4298194004202057632/)

**We Are Football / We Are Football 2024** — sits at 75–79% positive at a **$39.99** list price, higher
than New Star Manager despite less-loved production values. The recurring critical line: **"the primitive
match engine... is just not good enough in this day and age"** — i.e. buyers will forgive a management
layer that's merely serviceable if the core simulation feels dated, but they will not forgive both being
mediocre at a $40 price point. [Metacritic](https://www.metacritic.com/game/we-are-football/)

**New Star Manager** — $19.99, 87% positive (Very Positive) — the best price-to-sentiment ratio of any
comp researched. Even here, the explicit depth complaint recurs: **"not deep enough to offer a sizeable
challenge to its more well-known contemporaries"** and **"cheap 'typical mobile game' aesthetics."** The
takeaway: at $20, buyers grade on charm/pace over rigor and forgive shallowness readily; the same
shallowness at $40 (We Are Football) reads as a ripoff.
[Fuller FM](https://fullerfm.com/2020/02/05/review-new-star-manager/)

**Football Manager Touch (Apple Arcade/Switch)** — not a direct Steam price comp, but instructive as the
anchor buyers already use: **"Standalone Football Manager games typically retail for $30-50, making this a
significant value-add"** at Apple Arcade's $6.99/mo. FM24/23 Touch were received as *worth it* specifically
because they read as "a genuinely pared-down PC game," not a mobile spinoff. FM26 Touch (Nov 2025) broke
this trust — reviewers called it **"difficult to play... more crashes than you'd expect,"** a live example
of how fast goodwill evaporates once the "real game, just lighter" promise is broken.
[Pocket Tactics](https://www.pockettactics.com/football-manager-26-touch/review),
[TouchArcade](https://toucharcade.com/2023/11/14/football-manager-2024-review-touch-vs-mobile-vs-ps5-vs-pc-steam-deck-features-save-controller-console/)

### Recurring "too shallow for the price" language across all four
- "not a £20 title" / "not deep enough... more well-known contemporaries" / "primitive... not good enough
  in this day and age" / "money-grabbing" (IAP layered on a paid game) — the pattern is buyers pricing
  strictly against **Football Manager as the reference point**, regardless of what genre-lite comp they're
  actually looking at. Every under-delivering title gets compared to FM specifically, not to peers.

### Recommendation for us
- **Price band: $19.99–$24.99 at launch.** New Star Manager's $19.99/87%-positive is the strongest
  precedent for a lighter-than-FM management game; going above ~$25 pulls us into We Are Football's
  $39.99 bracket, where the bar becomes "does the match engine feel current" — a bar our text-only
  presentation risks failing on sight (screenshots, not depth, sink first impressions at that price tier).
  A $24.99 launch price with a **10–15% wishlist-conversion discount** in the first two weeks is
  consistent with successful indie-sim launches generally.
- **No IAP, ever, in the paid build.** CSD 2022's recovery-then-relapse (66% positive but "money-grabbing"
  complaints) shows that even generous free content gets re-litigated negatively the moment a paywall
  appears inside a title people already paid for (or expect to pay for). We're premium + optional cosmetic
  DLC per existing direction — this data point reinforces sticking to that, hard.
  [Steam](https://store.steampowered.com/app/1698080/Club_Soccer_Director_2022/)
  [gg.deals](https://gg.deals/game/we-are-football-2024/)
- **Feature bar to clear before pricing above $20:** the dynasty/reborn mechanic + manager-depth already
  clear "deeper than New Star Manager" on paper (per `feature-gap-analysis.md` §4); what's *missing* to
  justify a higher price band is exactly what buyers cite against the cheaper comps — visible art fidelity
  and a screenshot-worthy centerpiece screen (the Bloodline Tree, P0 #2 in the prior report) — not more
  systems depth, which we already have in excess of our price tier.
- **Store-copy risk to pre-empt:** because buyers reflexively benchmark against FM regardless of our own
  positioning, our store page should explicitly frame the differentiator ("a bloodline dynasty game, not a
  scaled-down FM") in the first line of the description — CSD's core failure was implicitly inviting an
  FM comparison it couldn't win.

Sources: [Goomba Stomp](https://goombastomp.com/club-soccer-director-pro-2020-review/),
[Club Soccer Director 2022 Steam](https://store.steampowered.com/app/1698080/Club_Soccer_Director_2022/),
[CSD 2024 pricing discussion](https://steamcommunity.com/app/1951410/discussions/0/4298194004202057632/),
[We Are Football Metacritic](https://www.metacritic.com/game/we-are-football/),
[We Are Football pricing](https://gg.deals/game/we-are-football-2024/),
[New Star Manager review](https://fullerfm.com/2020/02/05/review-new-star-manager/),
[FM Touch value framing](https://toucharcade.com/2023/11/14/football-manager-2024-review-touch-vs-mobile-vs-ps5-vs-pc-steam-deck-features-save-controller-console/),
[FM26 Touch failure](https://www.pockettactics.com/football-manager-26-touch/review)

---

## 2. Steam Deck / controller

### Findings

Valve's own Steamworks guidance and third-party pre-submission audits converge on a small set of concrete,
testable gates — not vague "should feel good on Deck" language. The most actionable single source found is
a 2026 submission-failure post-mortem enumerating the **9 recurring reasons small teams fail Verified** (as
opposed to landing only at "Playable"):

1. **Controller works with zero setup** — no menu dive, no community layout required on first boot.
2. **Every text-entry point supports controller input** (save names, profile names) — teams routinely treat
   this as rare and skip it; review catches every instance.
3. **Consistent input glyphs** — prompts must track the *active* input device (no stray "Press E" after a
   controller action).
4. **Legible text at 1280×800**: sub-9px text is a fail; 12px is the safe floor. This explicitly includes
   secondary UI (stat labels, list rows, tooltips), not just headers — "prioritize... menus and error
   messages before secondary flavor text."
5. **No external launcher friction** — if a pre-game launcher exists, it must itself be controller-navigable
   and legible; on desktop it "feels harmless," on Deck it's "the exact layer that breaks controller focus."
6. **Default settings must already be playable** — tuning-after-15-minutes-of-settings does not count as
   passing; the *default* boot state is judged.
7. **No "unsupported hardware" boot-time warnings**, even if the game actually runs fine.
8. **Native Proton testing**, not "players report it works" — intro videos, file paths, and middleware are
   common silent failure points.
9. **Edge-case testing**: save-naming flow, controller reconnect mid-session, suspend/resume, and
   late-game UI density (long lists, big rosters) — not just boot→menu→one screen.
[gamineai.com Steam Deck Verified 2026 checklist](https://gamineai.com/blog/steam-deck-verified-review-2026-submission-fails-small-team-builds)

Valve's own compatibility-review documentation frames the same requirements more formally under the
"default controller configuration must provide access to all content" and "text should be legible... test
the smallest live text elements, not just headers" standards.
[Steamworks compat docs](https://partner.steamgames.com/doc/steamhardware/compat)

Genre-relevant precedent: New Star Manager runs on Deck via community reports but its **mouse-driven core
interaction (dragging/aiming) has no confirmed native controller mapping** — a specific trap for us to
avoid, since our lineup/tactics UI likely leans on drag-and-drop or hover states that don't translate to a
d-pad/stick without deliberate remapping.
[Steam Deck discussion](https://steamcommunity.com/app/883130/discussions/0/5822622429930362755/)

### Concrete checklist for Football Royalty
Given our UI is 100% HTML/CSS (no canvas/WebGL, confirmed in `feature-gap-analysis.md` §1) and entirely
menu/screen-driven with no click-drag pitch interaction, we start from a genuinely favorable position —
the risk is entirely in input mapping and text sizing, not rendering:

- [ ] **Full controller navigation of every screen** (hub, scouting, academy, club season, tactics,
  facilities, trophy room, live match, settings) via a consistent focus-ring + d-pad/analog-stick model —
  no screen may require a mouse-only hover or click target with no controller equivalent.
- [ ] **Zero mandatory typing.** Save-slot naming, if present, needs either an on-screen virtual
  keyboard triggered automatically by controller input, or default auto-generated names with rename as
  optional/skippable.
- [ ] **Text-size audit at 1280×800**, our smallest live text (stat table rows, tooltip captions, card
  text in career mode) measured in actual rendered px, not just design-time — flag anything under ~12px
  and add to the text-scale option already on our P1 backlog (`feature-gap-analysis.md` rec #7).
- [ ] **Input-glyph awareness**: our HUD/prompts must detect and switch between keyboard/mouse and
  gamepad button icons live, not hardcode "click" language.
- [ ] **No external launcher** — we already have no desktop wrapper (`direction.md` Phase 3 is open); when
  building the Electron/Tauri wrapper, avoid a pre-game splash/launcher process entirely if possible, since
  that's an explicit, avoidable failure mode.
- [ ] **Default settings, not tuned settings, must be the Deck experience Valve reviews** — whatever text
  scale/UI density ships as default needs to be Deck-legible out of the box, not behind an accessibility
  toggle the reviewer won't discover.
- [ ] **Edge cases**: controller unplug/replug mid-match, suspend/resume mid-save (should just work given
  our deterministic local-save architecture, but must be explicitly tested), and late-career UI density
  (a 10-tier league table, a large scouted-prospect pool, a many-generation bloodline tree) at Deck text
  sizes.
- [ ] **"Playable" is a realistic first target, "Verified" a stretch goal** — Verified additionally wants
  no "requires desktop mode" caveats and clean Proton behavior; sequence this whole checklist as its own
  hardening pass per `feature-gap-analysis.md` rec #12, after content gaps close, not before.

Sources: [gamineai.com checklist](https://gamineai.com/blog/steam-deck-verified-review-2026-submission-fails-small-team-builds),
[Steamworks Deck/Machine compat docs](https://partner.steamgames.com/doc/steamhardware/compat),
[New Star Manager Deck discussion](https://steamcommunity.com/app/883130/discussions/0/5822622429930362755/)

---

## 3. Inheritance / relationship mechanics

### Findings

**BitLife — Generations** (already covered at summary level in `feature-gap-analysis.md` §2) — deeper look
at the actual mechanic: a new generation's starting character is shaped by **how the prior character died**
and **what they inherited**, with **estate tax reducing the inherited amount** in some in-game countries.
The **Will/Testament** is a standalone, editable-anytime document naming who receives what; inheritance can
be split evenly or concentrated on one heir, and **characters cut out of the will can react (an argument
event)** — the exclusion itself is a story beat, not just a number.
[BitLife Wiki — Generations](https://bitlife-life-simulator.fandom.com/wiki/Generations),
[BitLife Wiki — Will/Testament](https://bitlife-life-simulator.fandom.com/wiki/Will/Testament)

**BitLife — Heirlooms**: a separate, non-cash inheritance layer. 182 distinct physical objects (as of 2024),
discovered via a minigame, each carrying a description/estimated value/rarity, and passed down through
descendants automatically unless the will overrides distribution. Players can **discard, donate, play with,
refurbish, or sell** each one — turning inheritance into an inventory-management/story mini-loop, not a
lump sum. [BitLife Wiki — Heirloom](https://bitlife-life-simulator.fandom.com/wiki/Heirloom)

**The Sims 4: Royalty & Legacy** (Jan 2026 expansion) — the most directly transferable model found, because
it's explicitly a multi-generation "build a dynasty" system layered onto an existing life-sim, structurally
close to what we're doing:
- **Two tracked metrics**: *Unity* (relationship quality among family members) and *Prestige* (adherence to
  chosen family values) — prestige rises from living the family's chosen ideals and falls from scandal.
- **Heir appointment is an explicit player choice**, surfaced directly in a redesigned family-tree UI — not
  automatic eldest-child succession.
- **Inheritable Perks** are one of three declared perk types (Success / Social / **Inheritable Traits**) —
  i.e., some traits are explicitly flagged as the ones that pass to the next generation, separate from
  general character traits.
- **Dynasty challenge**: disaffected family members can literally leave and found a **rival dynasty** —
  a competitive pressure-release valve absent from BitLife's more passive model.
- **Scandal/legitimacy mechanics**: hidden children stay concealed in the family tree until investigated,
  directly affecting succession clarity.
[TheSimsTree dynasty breakdown](https://thesimstree.com/en/news-about-the-sims/tst-news/the-sims-4-royalty-and-legacy-complete-dynasty-gameplay-breakdown-and-new-features.html)

**Crusader Kings 3** (the deep-strategy end of the spectrum, useful for contrast, not direct borrowing) —
**heir designation is a deliberate authority-gated player action** (requires high Crown Authority to
override default succession law), and **heir *education* is a distinct sub-system**: assigning a guardian
with strong stats in a desired category shapes which traits the heir develops, with an explicit tension
(don't send your heir into combat, or you lose the investment). The core lesson for us: **heir quality is
something the player actively cultivates during the *previous* generation's playthrough**, not something
rolled at generation hand-off. [PCGamesN succession laws](https://www.pcgamesn.com/crusader-kings-3/ck3-succession-laws),
[GameRant heir traits](https://gamerant.com/crusader-kings-3-ck3-how-get-best-heirs/)

### Shortlist of on-brand mechanics for our bloodline hook

Ranked by fit against our existing architecture (`career.ts`'s `inheritGenes`/`legacyBoost`, already-flagged
P1 rec #5 in `feature-gap-analysis.md`):

1. **A named Will/Testament moment at retirement**, BitLife-style — cheapest to build (mostly UI +
   allocation logic over data we already track: coin economy, facility discounts, reputation). Concentrate
   vs. split a fixed "legacy budget" across named family members if we build out persistent family
   entities (see gap #10), or across abstract "starting condition" levers if we don't. *Directly matches
   already-scoped rec #5.*
2. **Inheritable Traits as a distinct, labeled subset** (Sims 4 model) — rather than *all* genes/traits
   inheriting via the existing formula, flag a small curated set (e.g. 3–5 "Legacy Traits" per legend-tier
   retiree) as the ones the player explicitly *chooses* to pass on, at a cost (spend legacy points to
   guarantee a trait transfers vs. leaving it to the existing dice-roll inheritance). This makes the
   existing `inheritGenes`/`legacyBoost` system feel *chosen* rather than *computed* — the exact gap
   `feature-gap-analysis.md` §5.1 identifies as our biggest cheap win.
3. **Heir cultivation during the prior generation** (CK3 model) — let a late-career choice (mentor
   assignment, a "who do you want to succeed you" flavor decision among NPC family members introduced in
   the life-event system) foreshadow the *next* playthrough's starting conditions, rather than the handoff
   being a single end-of-career screen. Higher build cost — treat as P2/stretch, not launch-blocking.
2. **A Dynasty Prestige/Unity-style pair of tracked meters** (Sims 4 model) — we already have Manager
   Prestige (`prestige.ts`, 9-rank lifetime score); consider whether a second, family-facing meter (call it
   "Bloodline Standing" or similar) that rises/falls with life-event choices (romance, scandal, family
   illness outcomes already in the 14-event pool) would give the existing life-event system a visible,
   cumulative through-line across generations, not just per-career flavor text. Medium build cost, high
   thematic fit — good P1/P2 candidate.
4. **Heirloom-style non-cash carryover objects** — lightweight version: a signature boot or trophy (we
   already have "collectible signature boots" per `offpitch.ts`) explicitly flagged as inheritable and
   shown in the Bloodline Tree / Trophy Room UI at generation handoff. Cheap, reuses existing data.

Explicitly **not** recommending the "leave and found a rival dynasty" mechanic (Sims 4) or full CK3-depth
succession law — both are high build cost for low fit against our single-heir, linear-save architecture
(`direction.md` explicitly specs "one linear... career+manager save," not branching family trees).

Sources: [BitLife Wiki — Generations](https://bitlife-life-simulator.fandom.com/wiki/Generations),
[BitLife Wiki — Will/Testament](https://bitlife-life-simulator.fandom.com/wiki/Will/Testament),
[BitLife Wiki — Heirloom](https://bitlife-life-simulator.fandom.com/wiki/Heirloom),
[Sims 4 Royalty & Legacy breakdown](https://thesimstree.com/en/news-about-the-sims/tst-news/the-sims-4-royalty-and-legacy-complete-dynasty-gameplay-breakdown-and-new-features.html),
[CK3 succession laws](https://www.pcgamesn.com/crusader-kings-3/ck3-succession-laws),
[CK3 best heirs](https://gamerant.com/crusader-kings-3-ck3-how-get-best-heirs/)

---

## 4. Presentation parity

### Findings

**Retro Goal** (already covered at high level in `feature-gap-analysis.md` §2) — deeper look: it's built as
a **hybrid of arcade match-control + light management** (unlike New Star Soccer's single-player-only view),
with graphics explicitly **"inspired by 16-bit era football games"** paired with modern touch controls. Its
career mode wraps transfer market, stadium upgrades, academy, and training facilities around the arcade
match core — reviewers land it in **"a very satisfying middle ground between arcade action and light
management sim"** with **"a finely-tuned difficulty curve."** The presentation lesson beyond pacing (already
captured in the prior doc): **the management screens themselves stay simple/iconographic** — Retro Goal
does not attempt FM-scale stat-table density, it keeps every non-match screen visually light, which is
plausibly *why* the pixel art reads as "clean" rather than "empty."
[gamepressure.com](https://www.gamepressure.com/games/retro-goal/zf6171),
[newstargames.com](https://www.newstargames.com/retro-goal)

**Soccer Story** — presentation cautionary detail beyond the "weakest system drags the average" lesson
already captured: its actual match screen is **deliberately minimal** — 4v4, a flat 4-minute timer, "no
periods and no silly options" — and a **known shipped bug had goal celebrations loop infinitely**, called
out specifically in reviews as breaking the moment that's supposed to be the emotional payoff. The lesson:
**a celebration/juice moment that's *present but broken* is worse than a plain one that works** — polish
priority should go to correctness of the few juice beats we do ship over quantity of beats attempted.
[Escapist review](https://www.escapistmagazine.com/soccer-story-review-in-3-minutes-a-fun-soccer-rpg/)

**New Star Manager** — reviewers explicitly flag **"cheap 'typical mobile game' aesthetics and design"**
as a genuine cost despite otherwise-positive reception (87% positive) — i.e. even a well-loved lighter
management game pays a presentation tax in review text when its screens read as mobile-first. This is the
most direct warning for our own procedural-SVG-icon current state
(`feature-gap-analysis.md` P0 #1): **"charming but simple" and "cheap mobile" are not the same review
outcome, and the line between them is visual polish, not system depth** — New Star Manager already has
comparable-or-less system depth than we do and still gets the "cheap" label purely on presentation.
[Fuller FM](https://fullerfm.com/2020/02/05/review-new-star-manager/)

### Presentation bar to match once our art pipeline exists

1. **Non-match screens should stay visually light/iconographic, not FM-dense**, even once we have real
   portraits/badges — Retro Goal's restraint on management-screen complexity is plausibly *why* its pixel
   art reads as intentional rather than incomplete. This validates our existing text-first match
   presentation (already framed as a strength in `feature-gap-analysis.md` §5.3) — extend the same
   "readable over dense" philosophy to the surrounding UI chrome, not just match commentary.
2. **Every celebration/juice beat we ship must be bug-free before launch, even if that means shipping
   fewer of them.** Soccer Story's infinite-loop celebration bug is a specific, avoidable failure mode —
   directly relevant to our own currently-planned SFX reward-chime pass (`feature-gap-analysis.md` P1 #9)
   and any goal/promotion/legend-retirement celebration screens: test these end-to-end, including replay/
   repeat-trigger edge cases, not just the first playthrough.
3. **Visual polish, not system depth, is what separates "charming" from "cheap mobile" in review text.**
   Since our system depth already exceeds New Star Manager's per the prior gap analysis, our presentation
   investment (P0 #1: pixel-art asset pass; P0 #2: Bloodline Tree visual) is the highest-leverage lever
   available to us specifically *because* the systems side is already ahead of this comp class — this
   reinforces (does not merely repeat) the prior report's P0 ranking with independent evidence.
4. **Concrete juice-moment shortlist worth prioritizing for our art/animation pass**, informed by what
   comps treat as their signature beats: a goal-scored moment (Soccer Story's failure point — get this
   right), a promotion/relegation reveal (our 10-tier pyramid's natural climax, currently text-only per
   `feature-gap-analysis.md` §1), a legend-retirement/generation-handoff transition (our unique hook — no
   comp has an equivalent moment, so there's no external bar, but it should get the most animation budget
   of anything given it's mechanically unique to us), and a trophy-lift/Hall-of-Fame induction beat (the
   FM/Retro Bowl precedent already cited in the prior report for why this screen matters).

Sources: [Retro Goal overview](https://www.gamepressure.com/games/retro-goal/zf6171),
[Retro Goal official](https://www.newstargames.com/retro-goal),
[Soccer Story review](https://www.escapistmagazine.com/soccer-story-review-in-3-minutes-a-fun-soccer-rpg/),
[New Star Manager review](https://fullerfm.com/2020/02/05/review-new-star-manager/)

---

## 5. Remaining backlog (worth chasing in a future pass)

1. **Direct Steam review-text mining at scale** — this pass used search-engine summaries of review
   sentiment plus a handful of individually-fetched discussion threads; a future pass with Steam's own
   review API (or manual sampling of 50+ reviews per title, sorted by "most helpful") would surface more
   verbatim "value for money" phrasing than search-engine paraphrase can, and could quote reviewers
   directly rather than through a secondary summary layer.
2. **Actual Steam Deck Verified/Playable badge audit** of our four core comps (FM Touch isn't Deck-native
   as an Apple Arcade title; Club Soccer Director, We Are Football, New Star Manager, Retro Goal were not
   confirmed against Valve's public Deck-compatibility database in this pass) — would tell us whether any
   direct competitor has actually cleared Verified, which is a stronger signal than the generic checklist
   used here.
3. **Sims 4: Royalty & Legacy is a Jan 2026 expansion** — reception/reviews were too fresh at research time
   to assess whether its dynasty mechanics landed well with players; worth a follow-up once player
   sentiment matures, since it's our closest non-BitLife structural analog.
4. **Pricing elasticity specifically for the dynasty/inheritance hook** — none of the pricing research
   found a comp that prices *based on* a generational-legacy feature the way we could; worth exploring
   whether "buy once, play across generations forever" is a marketable value-prop distinct from raw
   systems-count, potentially supporting a price above the New Star Manager anchor if framed correctly in
   store copy.
5. **Controller-specific UX pass for our actual screens** — this doc's Deck checklist is generic; the next
   step is walking our real hub/scouting/tactics/lineup screens (once built) against it screen-by-screen,
   which requires the implementation to exist first.
6. **Soccer Story's exploration-vs-football split** — worth a closer look at exactly *how* it structures
   the handoff between its two halves (RPG exploration vs. match), as a second data point (alongside our
   own `one-save-fusion.md`) for the career-mode/manager-mode seam already flagged as P1 #11 in the prior
   report.
