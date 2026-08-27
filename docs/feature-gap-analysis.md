# Feature-completeness / competitive gap analysis

**Status:** research report, 2026-08-27. Answers: *if we shipped tonight's build to Steam, where would a
buyer feel it's unfinished or thin compared to what they already expect from the genre?* Docs-only — no
game code touched. Companion to `direction.md`, `launch-roadmap.md`, `growth-and-content-strategy.md`,
`ui-ux-research.md`, `manager-depth-ideas.md`, `legacy-and-records-design.md`.

---

## 1. Our current feature inventory (as of this build)

Source of truth is `docs/direction.md` (2026-08-27, marked DECIDED) — `README.md` is stale (still
describes a Phaser/web3/multiplayer architecture that has since been removed) and should not be trusted.

### Core loop / save-load — solid, offline-complete
- No `server/` directory, no wallet/thirdweb/viem/Phaser dependencies remain — the web3/2D-engine
  subtraction in `direction.md` Phase 1 is done.
- `client/src/save.ts`: multi-slot local saves via IndexedDB, debounced persistence, new/continue/delete.
- `shared/src/gamestore.ts`: single-owner, fully deterministic local game store (tokens, contracts,
  facilities, injuries, legacy, honours, missions, loanees).
- No Steam Cloud, no Steamworks, no achievements API — only a speculative comment in `save.ts`.

### Career mode (playing the bloodline player) — the deepest, most complete system
- `shared/src/career.ts` (1641 lines): deterministic seeded card-game development sim. 7 age chapters
  (10→25), ~150-card deck with tag-based fit/success and rarity, deck "chemistry" synergies, lifestyle
  purchases, coaches/agents, focus/attribute allocation each summer, 14 kinds of life events (contract
  standoffs, loans, media storms, romance, family illness…), personality traits, innate genes vs. trained
  stats, retirement legacy cards + "legend tiers," and cross-generation inheritance (`inheritGenes`,
  `legacyBoost`) — the dynasty/reborn mechanic. Genuinely deep; comparable in scope to a full mini-game.

### Club/season simulation — real but modest scale
- `shared/src/clubseason.ts`: deterministic 10-club single-player league (double round-robin, 18
  fixtures/season), club strength blended with the bloodline star's overall/minutes share.
- `shared/src/tactics.ts` / `formations.ts` / `duties.ts`: 11 formations, 5 tactical sliders with 6 named
  presets, named per-role duties (wing-back, sweeper, anchor MF, inverted winger, wide playmaker…), two
  off-by-default instructions (offside trap, play-out-of-defence), seeded stable opponent tactical
  identities. This is a genuinely rich tactics layer for the genre.
- `shared/src/engine.ts` (819 lines): tick-based deterministic match engine — fitness/stamina, pressing,
  counter windows, cards, subs, injuries.
- **Presentation is text-only by design** — the live 2D renderer was deliberately cut (`direction.md`);
  matches are rich text commentary + a stats/possession/fitness HUD. No visual pitch rendering exists.
- Transfer market (`market.ts`) is scout-tier-gated stat reveal + a fixed pricing formula — no AI bidding
  wars, no negotiation haggling beyond that formula.
- Facilities (`facilities.ts`): 7 upgradeable facilities, 1–5 levels, numeric multipliers — solid but flat.
- Manager-side depth (per `manager-depth-ideas.md`, shipped 2026-08-27): named player roles, per-player
  training focus, backroom staff hire, mentoring, sponsorship deals, match-plan conditional orders, form
  guide, rivalries/derbies, club records, Gaffer's Diary, team talks (with personality nuance), continental
  cup, national call-ups, a World-Cup-style tournament. This list is unusually rich for an indie title —
  see §4 (differentiators).
- **No board/sack/budget layer** — deliberately cut: the player is the *owner*-manager, not an employee, so
  there is no board confidence, no sack risk, no allowance-style transfer budget (see `manager-depth-ideas.md`
  "Framing correction"). This is a considered design choice, not an oversight — but it does mean a genre
  staple (job-security tension) is absent by design, and should be weighed as such in §3.

### International management — narrow, presentational
- `shared/src/intl.ts`: national call-ups + a full 16-nation World-Cup-style tournament, deterministic,
  playable through the star's own bracket path. No "manage the national team" mode, no squad selection, no
  continuity across tournament editions beyond re-seeding.

### Off-pitch / life-sim
- `shared/src/offpitch.ts`: marketability/reputation score, seeded endorsement deals with backlash risk,
  collectible signature boots, occasional temptation/moral-hazard beats.
- Family/relationships are woven into the career-mode life-event system and gene inheritance — there is
  **no persistent family-member entity** (no spouse/kids you see and interact with over time as characters),
  unlike BitLife's model (see §2).
- Finances: single closed coin economy; no personal-wealth/lifestyle simulation beyond in-career LIFESTYLE
  purchases.

### Presentation
- **No static art assets** — `client/public` contains only `.ogg` audio; all "pixel art" is procedurally
  generated inline SVG (a small icon set in `sprites.ts`), not the portraits/kits/badges `direction.md`
  aspires to. This is a real, currently-open gap between stated direction and shipped asset pipeline.
- Audio is real and implemented: 12 music contexts with crossfade, actual licensed `.ogg` tracks. No SFX
  yet (deliberately cut for launch per `launch-roadmap.md` — a small reward-chime set is still planned).
- UI screens confirmed: main menu, hub, scouting (opposition/player/trial pool/network), academy, club
  season, trophy room, facilities, lineup/tactics, live match view, full-time stats. All CSS/HTML, no
  canvas/WebGL.

### Settings / accessibility / onboarding
- Settings: music volume, mute, reduce-motion (respects OS default). That is the **entire** settings
  surface — no difficulty option, no text-size/contrast/colorblind options, no key rebinding, no controller
  support anywhere in the code.
- Onboarding: a scripted "founding-prospect scouting board" first-run flow exists (per `onboarding-design.md`
  and confirmed shipped 2026-08-27), but the fuller scripted sequence (chapter-1 coach-marks, dynasty tease
  hand-off) is only partially done per `launch-roadmap.md` (marked ◐).

### Progression / replayability
- Dynasty/reborn (retiring a legend-tier player → legacy card → inherited genes for the next generation) is
  the core NG+-like hook and is well-built.
- Manager prestige (`prestige.ts`): 9-rank lifetime score system, tracked across clubs/seasons.
- **No formal achievements system** anywhere (only design-doc ideas in `game-upgrade-ideas.md`/
  `immersion-ideas.md` — nothing shipped). No stat-records/leaderboard screen beyond honours + season
  awards. No selectable difficulty.
- Legacy & Records / Trophy Room / Bloodline Tree is specced in detail (`legacy-and-records-design.md`) as
  the intended retention capstone and "Steam capsule art," but the doc frames it as **design spec**, not
  confirmed-shipped — treat the bloodline-tree *visual* as still to verify/build (see §3 P0).

### Steam-specific
- Nothing implemented: no Steamworks SDK reference, no achievement API, no Steam Cloud backend, no desktop
  wrapper (Electron/Tauri) present in this worktree. All of `direction.md` Phase 3 is still open.

---

## 2. Competitive research summary

Covered: Football Manager (FM26 + FM Touch), New Star Soccer / New Star Manager, Club Soccer Director,
We Are Football, I Am Football, Retro Bowl / Retro Goal, Soccer Story / Football Story, BitLife, Stardew
Valley, plus general Steam premium-indie launch expectations.

**Football Manager (FM26 / FM Touch)** — a Recruitment hub merging scouting+transfers; dual in/out-of-
possession tactics; a Staff Dynamics screen (interpersonal chemistry between backroom staff); agent-driven
negotiation (release clauses, loyalty bonuses, playing-time guarantees); **Touch** strips team talks/press/
tactical-familiarity friction to make a "lite but still real" management layer — a direct blueprint for how
much a lighter game can cut and still feel legitimate; a free standalone Editor; a persistent, save-spanning
Hall of Fame file. Long-save culture is a real, documented player behavior (300+ season saves exist).
[FM Scout](https://www.fmscout.com/a-football-manager-2026-new-features.html),
[FM Legacy Gaming](https://fmlegacygaming.home.blog/2019/11/09/part-6-using-the-editor-to-create-the-database/),
[The Higher Tempo Press](https://www.thehighertempopress.com/2025/07/how-to-build-a-football-manager-save-that-lasts/)

**Club Soccer Director** — board-happiness loop from revenue/facilities/sponsorships/staff/press; ~350–820
clubs across many leagues. Recurring Steam-review pattern: **"expected FM-level complexity, got a mobile
port"** — both the 2021 and 2022 releases sit at "mixed" (60–66% positive), largely on scope-vs-price
mismatch. [Goomba Stomp](https://goombastomp.com/club-soccer-director-pro-2020-review/),
[Steam](https://store.steampowered.com/app/1698080/Club_Soccer_Director_2022/)

**We Are Football** — no licensed teams (hurts investment); reviewers explicitly flag **absence of core
club-builder systems** (no stadium, sponsors, or merchandise) as feeling unfinished vs. FM; UI called
cluttered; editor called clunky. 75% positive despite this — simplicity read as accessible by some.
[Steam reviews](https://steamcommunity.com/app/1196470/reviews/?browsefilter=toprated),
[WayTooManyGames](https://waytoomany.games/2021/06/17/review-we-are-football/)

**I Am Football** — an unrelated arcade novelty (you play as the ball); not a genre comparable — dropped
from further comparison.

**New Star Soccer / New Star Manager** — the closest life-sim/football hybrid precedent. Relationship
juggling across teammates/coach/partner/sponsors with dilemma-driven branches; named minigames (contract
haggling, post-match interviews, casino trips, match-fixing bribery choices); New Star Manager layers full
club management (facilities funded by match income, board season targets with sack consequences) on top.
Reviewer split: some call the visuals "cheap mobile," but "spectacular despite simplicity" is the dominant
verdict. [newstargames.com](https://www.newstargames.com/new-star-soccer),
[Bonus Stage](https://bonusstage.co.uk/2019/01/29/new-star-manager-review)

**Retro Bowl / Retro Goal** — the strongest "pixel-art won't read as cheap if X" precedent. Deliberately
**slowed pacing** (a design choice, not a limitation) that reviewers credit as the core of the strategic
feel; two parallel currencies (permanent org upgrades vs. roster/morale spend) with the *premium* currency
explicitly **not required** to win — an anti-P2W stance credited for the "premium indie feel" despite being
free-to-play; a persistent Hall of Fame that survives retired careers. Retro Goal's pixel art is called
"clean, highly readable... smooth and expressive," proving readability over fidelity is the bar, not photo-
realism. [Oreate AI](https://www.oreateai.com/blog/retro-bowls-deliberate-pace-its-not-slow-motion-its-strategy/b3858b7f7e5b515462100a3ba8bc078e),
[MKAU Gaming](https://www.mkaugaming.com/all-review-list/retro-goal-nintendo-switch-review/)

**Soccer Story / Football Story** — Zelda-style RPG shell around football minigames. Cautionary tale: mixed
reviews stem from an uneven pairing — a beloved exploration half against a widely-panned shallow football
half. **Hybrid genre games get graded on their weakest integrated system, not their average** — directly
relevant to us fusing career + manager modes. [RPGamer](https://rpgamer.com/review/soccer-story-review/)

**BitLife — Generations** (closest non-football dynasty analog) — on death, a new generation starts shaped
by *how* the prior character died and *what* they inherited; a Will/Testament lets the player concentrate or
split inheritance among children (with estate tax and forced-auction-if-minor rules); "Heirlooms" persist
beyond cash. Directly adaptable template for our bloodline hand-off: cause-of-retirement/decline shaping the
heir's starting conditions, an inheritance-split decision, heirloom-style carryover objects (a "family
crest" of trophies, an inherited facility discount). Note BitLife gates unlimited generations behind a paid
tier — a monetization pattern to explicitly avoid replicating in our premium+cosmetic model.
[BitLife Wiki — Generations](https://bitlife-life-simulator.fandom.com/wiki/Generations),
[BitLife Wiki — Inheritance](https://bitlife-life-simulator.fandom.com/wiki/Inheritance)

**Stardew Valley** — the onboarding/completeness gold standard: never states a "win condition," teaches via
quest-shaped introductions to one mechanic at a time (exactly our own `onboarding-design.md` philosophy),
and reads as "deceptively deep" because of *breadth of small, polished systems* (farming, fishing, mining,
relationships/marriage, museum collection, festivals) rather than any single system's raw complexity — a
lesson in "many shallow-but-tight systems > one deep system" for perceived completeness.
[Medium](https://medium.com/swlh/deceptively-simple-design-cabde40af87f)

**General Steam premium-indie launch expectations** — Valve now surfaces **accessibility tags directly on
the store page** ("Adjustable Difficulty," "Save Anytime" are named flagship tags); standard pre-launch QA
checklists treat achievements-fire-correctly, cloud-save round-trip across two machines, full controller
pass, and **Steam Deck compatibility** as ship-blocking, not optional polish — these are now purchase-
decision signals players see before buying, not just post-purchase nice-to-haves.
[PC Gamer](https://www.pcgamer.com/software/platforms/steams-gonna-start-listing-adjustable-difficulty-save-anytime-and-other-accessibility-features-right-on-a-games-store-page-soon/),
[Bugnet](https://bugnet.io/blog/steam-launch-qa-checklist)

---

## 3. Parity table

✅ have it · ◐ partial · ❌ missing

### Core loop
| Feature | Status | Note |
|---|---|---|
| Deterministic match sim w/ tactics depth | ✅ | 11 formations, 5 sliders, named duties — richer than most indie comps |
| Text-driven match presentation | ✅ | deliberate choice; commentary + HUD, no visual pitch |
| Squad/season management (fixtures, table, promotion) | ✅ | 10-tier pyramid, single-player league |
| Transfer market | ◐ | fixed-formula pricing; no AI bidding wars, no haggling (FM/CSD have this) |
| Contract negotiation depth | ◐ | extend/sell only; no wage-vs-length-vs-clause levers yet (on manager-depth backlog) |
| Club finances as a real lever | ◐ | facilities are a coin sink; no wage-bill/budget-split tension (on backlog) |
| Board/job-security pressure | ❌ | deliberately cut (owner-manager framing) — a genre staple, absent by design |

### Depth systems
| Feature | Status | Note |
|---|---|---|
| Player career development (cards/meters/life events) | ✅ | unusually deep — the game's centerpiece |
| Manager-side depth (roles, staff, training focus, mentoring) | ✅ | shipped 2026-08-27, matches or exceeds FM Touch scope |
| Named tactical roles/duties | ✅ | 10+ named roles with real behavioural effects |
| Scouting | ◐ | tier-gated reveal; no rival-club competition for prospects |
| International management | ◐ | spectator-style tournament path; no squad-picking "manage the nation" mode |
| Relationships/family as persistent characters | ❌ | folded into career life-events + gene inheritance; no spouse/kids as ongoing entities (BitLife-style) |
| Injuries/morale/fitness | ✅ | present and feeding the sim |

### Progression / replayability
| Feature | Status | Note |
|---|---|---|
| Dynasty/reborn (NG+-equivalent) | ✅ | our core differentiator (see §4) |
| Trophy Room / Hall of Fame / records screen | ◐ | fully specced (`legacy-and-records-design.md`); shipped status unconfirmed |
| Bloodline tree (visual family tree) | ◐ | specced as THE centrepiece/capsule art; not confirmed built |
| Achievements | ❌ | zero implementation, only design-doc mentions |
| Difficulty settings | ❌ | none anywhere in code |
| Stat records / leaderboards | ◐ | honours + season awards exist; no dedicated records screen |

### Presentation / feel
| Feature | Status | Note |
|---|---|---|
| Pixel-art static assets (portraits/kits/badges) | ❌ | zero image assets exist; all "art" is procedural inline SVG icons |
| Music | ✅ | 12 contexts, licensed tracks, crossfade |
| SFX | ❌ | deliberately cut for launch; a small reward-chime set still planned |
| Readable, deliberate pacing | ✅ | text-commentary pacing is a design strength per genre precedent (Retro Bowl) |
| Micro-feedback (hover/press, transitions) | ◐ | partial per `ui-ux-research.md` backlog |

### Settings / accessibility
| Feature | Status | Note |
|---|---|---|
| Volume/mute controls | ✅ | |
| Reduce-motion | ✅ | respects OS default |
| Text size / contrast / colorblind options | ❌ | none |
| Controller support | ❌ | not mentioned anywhere in code |
| Key rebinding | ❌ | none |
| Difficulty | ❌ | none |
| Save-anytime / multi-slot saves | ✅ | local multi-slot via IndexedDB |
| Cloud saves | ❌ | not implemented, only a speculative comment |

### Steam / platform
| Feature | Status | Note |
|---|---|---|
| Steamworks achievements | ❌ | not started |
| Steam Cloud | ❌ | not started |
| Steam Deck compatibility | ❌ | not evaluated |
| Desktop wrapper (Electron/Tauri) | ❌ | not started |
| Accessibility store-page tags | ❌ | blocked on the above |

### Onboarding
| Feature | Status | Note |
|---|---|---|
| Scripted first-run scouting-board hook | ✅ | shipped 2026-08-27 |
| Full contextual tutorial (chapter-1 coach-marks → dynasty tease) | ◐ | partially done per `launch-roadmap.md` |
| Skippable for returning players | ❓ | not confirmed in this pass |

### Endgame
| Feature | Status | Note |
|---|---|---|
| Long-horizon goal (climb 10-tier pyramid, multi-gen dynasty) | ✅ | strong, matches FM's long-save culture |
| New-game-plus-equivalent | ✅ | the reborn/dynasty loop itself serves this role |
| Post-completion content / prestige modes | ❌ | nothing beyond continuing the same save |

---

## 4. Gaps that matter for a COMPLETE launch

### P0 — launch-blocking parity (a buyer will feel this immediately)
1. **No static art assets.** Every comp (even "cheap-looking" ones like New Star Manager) ships real
   portraits/kits/badges. We ship zero image assets — all "pixel art" is procedural SVG icons. This
   directly contradicts `direction.md`'s stated identity ("gorgeous management UI," "stunning dynasty
   tree," "Football Royalty" pixel-art brand) and is the single biggest visible gap between stated
   ambition and shipped reality.
2. **Confirm/build the Bloodline Tree visual.** `legacy-and-records-design.md` names this THE thing to
   obsess over — the intended Steam capsule art and the screen that turns the unique mechanic into
   something screenshotable. It reads as design spec, not confirmed-built. If it isn't rendered yet, this
   is the single highest-leverage differentiator sitting unbuilt.
3. **No achievements.** Every comp we researched has them (or the platform expects them); Steam's own
   store page increasingly surfaces this as a completeness signal. Zero implementation currently exists —
   even a first pass (10–20 milestone-based achievements, reusing existing honours/records data) closes
   this before it's a Steamworks-integration problem.
4. **No difficulty setting.** Cited by Steam's own accessibility-tagging push as a named flagship
   expectation ("Adjustable Difficulty"). We have zero difficulty knobs; `launch-roadmap.md` and
   `ui-ux-research.md` both flag it as open.
5. **No Steam Cloud / desktop wrapper / Steamworks.** All of Phase 3 in `direction.md` — genuinely
   launch-blocking (can't be on Steam without a desktop build), but tracked correctly as a separate,
   later-phase track, not a surprise.

### P1 — strongly expected (absence reads as "thin" in reviews)
6. **Transfer/contract negotiation depth.** FM and Club Soccer Director both make this a real system
   (haggling, release clauses, loyalty bonuses); ours is a fixed formula. `manager-depth-ideas.md` §7
   already scopes this ("wage vs length vs release-clause levers") — worth prioritizing given how visibly
   "shallow transfers" shows up in genre reviews.
7. **Records/Hall of Fame screen.** Confirm-and-ship the spec in `legacy-and-records-design.md` — FM's
   persistent Hall of Fame and Retro Bowl's retired-career records screen are both explicitly called out by
   reviewers as expected; ours is design-spec-only pending confirmation.
8. **Accessibility beyond reduce-motion.** Text/UI scale (biggest win for pixel text per our own
   `ui-ux-research.md`), colour-contrast/colourblind-safe check, controller support. Steam now surfaces
   these on the store page — invisible in a Steam Deck-heavy market otherwise.
9. **SFX.** Deliberately cut for launch per `launch-roadmap.md`, but "no sound effects at all" in a paid
   game reads as unfinished regardless of the (reasonable) reasoning; even the small reward-chime set
   already scoped should ship before launch, not after.
10. **Persistent family/relationship characters.** BitLife's generational hook works partly because
    inheritance/will-decisions are *concrete choices about named people*. Ours folds family into abstract
    life-events and gene math — there's no equivalent "meet your heir's mother," "choose how to split the
    estate" moment. This is the single most direct, cheap-to-borrow idea from the closest non-football
    comp (see differentiator #3 below) and currently sits at zero.
11. **Un-integrated risk between career and manager halves.** Soccer Story's lesson — hybrid games get
    graded on their *weakest* integrated system — applies directly to our career→manager handoff
    (`one-save-fusion.md` Phase 2/3, not yet fully fused). Worth a dedicated playtest pass focused
    specifically on the seam, not just each half in isolation.
12. **International "management" is spectator-only.** Not a P0 (it's flavour, not core loop), but note it
    explicitly if marketing implies deeper international management than exists.

### P2 — nice-to-have (differentiator polish, not launch risk)
13. Rival-club competition for prospects/transfers (an FM-style bidding war) — would deepen scouting.
14. A free/standalone in-game Editor (FM's is a well-loved feature and low-risk to add later as DLC-adjacent
    goodwill, not required at launch).
15. Post-completion "modes" beyond continuing the same save (e.g. a harder NG+ ruleset) — low priority
    given the dynasty loop already substitutes for NG+.
16. Key rebinding — nice but low-traffic for a menu-driven, non-twitch game.

---

## 5. Our differentiators (push these further, not just parity-chase)

1. **The bloodline/dynasty mechanic itself.** No football management game on the market fuses a personal
   NSS-style career with an FM-style club season into one linear, generational save. This is genuinely
   novel positioning, not an incremental feature. **Push further:** lean harder into the BitLife-style
   concrete inheritance choice (§P1.10) — a named will/estate decision at generation hand-off would make
   the mechanic feel *chosen*, not just inherited-by-formula.
2. **Manager-side depth already rivals FM Touch.** Named roles, staff, training focus, mentoring,
   sponsorship, match-plan conditional orders, a Gaffer's Diary, personality-aware team talks — this is an
   unusually rich feature set for an indie title and directly answers the "thin management sim" failure
   mode that sank We Are Football and Club Soccer Director in reviews. **Push further:** surface this
   richness *visibly* in marketing/store copy — it's currently undersold relative to what's actually built.
3. **Deliberately-paced text commentary as a design strength, not a compromise.** Retro Bowl's slowed pacing
   is explicitly credited by reviewers as *the* thing that makes its simplicity feel premium. Our text-first
   presentation (cut the 2D engine on purpose) can be framed the same way — a readable, paced experience —
   rather than apologized for. **Push further:** make sure commentary pacing/density is tunable (a
   "commentary density" setting already flagged in `ui-ux-research.md`) so it reads as an intentional
   choice, reinforcing this framing.
4. **A genuinely deterministic, offline, no-live-ops game in a genre usually chasing forever-live-service
   FM-style DLC cycles.** This is a real point of difference for players fatigued by always-online
   management sims — "buy once, own it, play offline forever" is a positioning angle none of the researched
   comps lead with as strongly.
5. **The manager-owner framing (no board/sack pressure) removes a genre stressor some players actively
   dislike.** Reframed as a feature ("build a dynasty, not survive a boardroom") rather than an omission —
   worth stating explicitly in store copy so it reads as a choice, not a missing system, since §3 correctly
   flags its absence as a parity gap that needs a deliberate answer.

---

## 6. Concrete recommendation list (ordered by leverage)

1. **Ship a first pixel-art asset pass** (player portraits, kit templates, club badges) — closes the single
   largest gap between stated identity and shipped reality; even a modest static set beats zero. *(P0)*
2. **Confirm/complete the Bloodline Tree visual screen** — the specced centrepiece and intended capsule art;
   verify it's actually rendered, and if not, build it before anything else in this list. *(P0)*
3. **Ship a first achievements pass** (10–20 milestones) reusing existing honours/records/prestige data —
   cheap, high signal, closes a universally-expected feature. *(P0)*
4. **Add a difficulty setting** — even a single knob (CPU strength / development pacing) satisfies the
   Steam-visible "Adjustable Difficulty" expectation. *(P0)*
5. **Add a concrete inheritance/will decision at generation hand-off** — borrow BitLife's Generations
   pattern directly: a named choice about what the heir inherits (facility discount, reputation head start,
   a keepsake trophy), not just formula-driven gene math. Cheap relative to its differentiator value. *(P1,
   but high-leverage — do it early)*
6. **Build/confirm the Records & Hall of Fame screen** per `legacy-and-records-design.md` — mostly
   surfacing data already tracked. *(P1)*
7. **Add text/UI scale + a colour-contrast pass** — biggest accessibility win for pixel text at low
   implementation cost; already scoped in `ui-ux-research.md`. *(P1)*
8. **Deepen transfer/contract negotiation** per `manager-depth-ideas.md` §7 (wage/length/clause levers) —
   directly answers the most common "shallow transfers" review pattern in this genre. *(P1)*
9. **Ship the already-scoped SFX reward-chime set** before launch, not after — "zero sound effects" reads
   as unfinished regardless of the reasoning. *(P1)*
10. **Dedicated seam playtest between career mode and manager mode** — per the Soccer Story lesson, test the
    handoff itself, not just each half in isolation; prioritize `one-save-fusion.md` Phase 2/3 completion
    accordingly. *(P1)*
11. **State the owner-manager framing (no board/sack) explicitly in store copy** as a deliberate feature —
    turns a parity gap into a differentiator, at zero build cost. *(P1, copy-only)*
12. **Sequence Steamworks integration (achievements API, Cloud save, controller pass, Deck compatibility)**
    as its own hardening pass once the above content gaps close — these are necessary but shouldn't block
    content work; treat as `direction.md` Phase 3 already correctly scopes it. *(P0 for launch, but
    correctly sequenced last)*
13. **Lower priority:** rival-club transfer competition, standalone save editor, post-completion NG+
    variant ruleset, controller key-rebinding. *(P2)*
