# Premium animation — survey and plan

Produced by a fan-out survey of the whole client (five agents, one per layer of the game), with every
candidate adversarially checked twice: once for "is this citation even real", once for "would a player find
this irritating by the fiftieth time". 38 candidates survived, 2 were cut outright.

**Read the verdicts with care.** Of 80 checks, 13 said keep, 3 said cut and 64 said *revise* — so most of
these proposals needed correcting rather than adopting. The document below is the synthesis after those
corrections.

## What is already done (see the commits)

- **The Family Record draws itself.** The game's signature image used to simply appear; the trunk now climbs
  from the root, each branch draws once its son's rank is due, and the medallions stamp in from the founder
  upward. `pathLength="1"` normalises every curve so one dash animation covers them all, and the stagger
  comes from a `--fr-g` rank stamped on each element — no JS timing, nothing that can touch game state.
- **Reduce Motion no longer deletes information.** `#toast` and `#goal-flash` rest at `opacity: 0` and only
  became visible *during* their animation, so the global 0.001ms clamp did not calm them, it removed them: a
  motion-sensitive player saw no toast anywhere in the game and was never told a goal had been scored.
  `tools/playtest/reduced_motion.ts` now fails the build if any animation-only-visible element is left
  uncovered.
- **Conceding no longer reads as celebrating.** `celebrateGoal` announced both goals in the same triumphant
  green; `mySide` had been on the match view all along and simply was not consulted.
- **The heir has his own tier.** Every prospect was hard-coded `tier-bronze` — the one tier that never turns
  the sheen layer on — and emitted no ring, burst or sparks, so the son carrying the family name had less
  ceremony than a squad player. `tier-heir` sits between bronze and gold in the family's own green-gold.
- **The four `.cg-graduation` screens arrive.** Graduation, retirement, the heir choice and the manager
  handoff share one shell that had no animation at all, while an ordinary career turn got `narrfade`.

---

# Football Royalty — Premium Animation: Decision Document

## 1. Point of view: codify a *thin* system first. Half a day, then ship the wins.

Yes, do the system first — but a much smaller one than that phrase usually means, and do not let it become a refit project.

The evidence that you need it is not aesthetic, it's countable. `client/index.html` contains **exactly one `steps()`** in 1971 lines (`index.html:465`, `pixspin`) and **zero `cubic-bezier`**. Every other animation and all 22 transitions run on `ease` / `ease-out` / `linear`. So the stated pixel-art motion constraint is currently honoured in **1 of 22 animations**; the other 21 move with the browser's default smooth curves, which is precisely the generic-web feel the constraint exists to exclude. Meanwhile there is not a single timing custom property in the file, while colour is fully tokenised at `index.html:12-24` and documented at length. Motion never got that discipline, and you are about to add a dozen more animations to it.

**What "the system" means here — and it is genuinely small:**

```
:root {
  --t-tap: 80ms;      /* button press — already the de-facto value at index.html:116 */
  --t-ui: 120ms;      /* hover — 17 of 22 transitions already cluster at .1–.15s */
  --t-beat: 350ms;    /* "something arrived" — ftpop, narrfade, cmfade already sit here */
  --t-event: 700ms;   /* a goal, a burst, a stamp */
  --t-idle: 2400ms;   /* infinite ambience: pulses, sheens, shimmers */
  --e-pop:  steps(4, end);   /* anything that scales or reveals */
  --e-tick: steps(6, end);   /* anything that fills or travels */
  /* linear stays reserved for continuous ambience (pcSpin, holoSheen, pcShimmer) —
     stepping those reads as jitter, not as sprite work. */
}
```

Plus one convention, written down once: **every new one-shot animation uses `both` fill.** That is not style, it is a correctness rule — see §4.

**What the system pass must NOT include:** refitting the 21 live keyframes. Converting `goalpop`, `ftpop`, `cmfade` and `scorepop` to stepped easing is a taste change to things that already work, it touches the most-seen animations in the game, and it will consume the entire budget before a player sees anything new. Do it later, opportunistically, as you touch each one.

**Order of work:** foundations (tokens + the three fixes in §4 + delete the dead `scorepulse` block at `index.html:1406-1412`, which is overridden by `index.html:1752` and has been unreachable for a while) → then the ranked list below, top-down, stopping wherever the budget runs out. The list is ordered so that stopping early still leaves you with a better game.

---

## 2. Ranked shortlist

### 1. The four `.cg-graduation` screens — one CSS block, four of the game's biggest moments

**Moment.** Graduation at 25 (`main.ts:4296`), the retirement send-off (`main.ts:2787`), the heir choice (`main.ts:3636`), the manager handoff (`main.ts:3802`). All four write into `.cg-graduation`.

**Why.** `.cg-graduation`, `.cg-grad-title`, `.cg-epilogue`, `.cg-grad-windfall` and `#cg-reveal` (`index.html:562-567`) carry **zero animation and zero transition between them**. `.cg-narrate` — an ordinary career-turn line seen ~120 times a generation — gets `narrfade 0.5s` (`index.html:568-571`). Your four most emotionally loaded screens arrive with strictly less ceremony than a routine turn. The four-variant farewell prose at `main.ts:2778-2786` exists precisely so this beat doesn't read word-for-word each dynasty, and it is delivered as a hard cut.

**What it should be.** Stage by `animation-delay` only — no JS timers, nothing to desync:
- `.cg-grad-title` → `ftpop var(--t-beat) both` (`index.html:1611`; the 0.7 → 1.05 → 1 overshoot is already the game's "this matters" pop).
- `.cg-epilogue` → `narrfade .45s ease .35s both`. Split on sentence/paragraph and stagger blocks 130ms apart so the eye is led down the page rather than a wall appearing.
- `.cg-grad-windfall` → `ftpop` last, with one `pcBurst` (`index.html:358-360`) gold flash behind it. `pcBurst` is opacity-only — it is the sprite-flash idiom and physically cannot blur.
- `#cg-reveal` held back to ~1.5s, then `pcShimmer 2.6s linear infinite` (`index.html:400`) on its label, so the button reads as the prize it opens.
- On the retirement screen only, give `.cg-grad-title` the Legend-card gradient text with `pcShimmer 2.2s linear 1` — *once*, not infinite. That ties the retirement of a legend to the legend card's own vocabulary without inventing anything.

**Effort.** Small. One CSS block, zero JS, zero plumbing, all existing keyframes. Highest impact-per-line in the whole sheet.

---

### 2. The heir reveal — `tier-heir`

**Moment.** `🌳 THE <SURNAME> NAME LIVES ON` (`main.ts:1055`).

**Why.** Your own doc-comment calls it "the payoff beat of the whole dynasty loop" (`main.ts:1042-1043`), and it is **the least animated card in the game**. `showProspectCard` hard-codes `class="pc-card tier-bronze"` for every prospect (`main.ts:1051`) and — unlike `showPlayerCard`, which emits `ring + '<div class="pc-burst"></div>' + sparks` at `main.ts:1015` — emits **no `.pc-ring`, no `.pc-burst`, no `.pc-spark` at all**. `tier-bronze` never overrides `.pc-card::before { opacity: 0 }` (`index.html:362`; the first override is `tier-silver` at `index.html:373`), so `holoSheen` runs on a fully transparent layer. Net: the heir gets `ftpop 0.35s` and nothing else. A random 62-OVR squad player opened from the squad table gets more ceremony than the son who carries the family name.

**What it should be.** A `tier-heir` class used only when `born && gen > 0`. Emit the fx nodes the prospect card currently omits (same spark generator as `main.ts:986-991`), then in CSS: `--burst: 0.6`, `--ring-spd: 5s`, `--sheen-spd: 3s`, `.pc-card.tier-heir::before { opacity: 0.45 }`, and a green→gold conic ring — the family colour, distinct from gold/diamond/legend. One new keyframe for the flash line (`index.html:283` styles it but never moves it):

```css
@keyframes heirName { 0%,18%{opacity:0} 19%,34%{opacity:1} 35%,49%{opacity:0} 50%,100%{opacity:1} }
/* .55s steps(1) .35s both — a two-beat sprite flicker landing after ftpop settles */
```

**Deliberately withhold `pulseLegend` / `legendBorder`.** The heir is a promise, not an achievement. Those stay reserved for what he earns.

**Effort.** Small.

---

### 3. The career dashboard actually moving — and the objective completing

**Moment.** Energy, the seven relationship meters, the stage-objective bar, the public-image bar. Every one of them teleports.

**Why.** You already decided these should animate: four `transition: width` rules were written for exactly this and **all four are dead** — `.cg-bar > i` (`index.html:504`), `.cg-dash .cg-m-bar b` (`557`), `.cg-obj-bar b` (`608`), `.op-bar-fill` (`816`). Cause: `$('academy-body').innerHTML = ...` at `main.ts:4089` destroys and recreates every bar each render, and a brand-new node with a final inline width has no before-change style, so no transition ever starts. There are exactly three imperative `style.width` writes in the whole client (`main.ts:5187`, `5193`, `5266`) and none touch these. Contrast `#pressure-home` / `#fit-fill` (`index.html:1429`, `1439`), which are static elements and therefore work — the pattern works everywhere except the one screen where the player spends 120 turns watching numbers change because of choices they made. `.cg-e-bar b` (`index.html:550`) has no transition declared at all.

**What it should be.** Capture `this.lastCareerState` into a local at the top of `renderCareer`, *before* `main.ts:4069` overwrites it. After the `innerHTML` write, set each `<b>` to its previous width, force a reflow (`void el.offsetWidth` — the file already uses this idiom at `main.ts:287`, `5180`, `5488`), then stamp the true width in one `requestAnimationFrame`. Then make the motion pixel-native: `transition: width .26s var(--e-tick)` — seven visible chunks, blocks filling a gauge, not a liquid bar.

**Bundled with it: the objective completing.** `o.done` is `progress >= target` (`shared/src/tokens.ts`), computed in `objectiveHtml` at `main.ts:3442-3449`, and completing it currently produces a static colour swap (`index.html:600-609`) on a panel that sits *below* the choice cards inside `.cg-context` (`main.ts:4086`) — i.e. below the fold, on the screen you deliberately reorganised to keep action above the fold. A player can hit a chapter target and never see it. Detect the crossing from the same cached previous state, add `.just-done` for one render, and run ~750ms: `ftpop` on the panel; the final bar chunk snapping in on `steps(4, end)`; the `✓ complete` pill colour-cycling through four hard stops cyan → white → gold → `var(--good)` using the `legendBorder` technique (`index.html:407` — hard stops, no interpolation); `audio.chime('success')`, the same chime graduation already uses at `main.ts:4292`.

**No persistent pulse on the completed panel** — it stays on screen for the rest of the chapter.

**Effort.** Small (bars) + small (objective). Do them together; they share the same one-line cache change.

---

### 4. Conceding is not scoring

**Moment.** An 89th-minute equaliser against you.

**Why.** `celebrateGoal` (`main.ts:5483-5489`) is side-blind: it reads `e.teamIdx` only to pick a name, never to ask whose goal it is. A goal against you produces the identical 40px green `⚽ GOAL!`, the identical 1.7s `goalpop`, and the identical gold `cmgoal` ticker wash (`index.html:1453-1454`) as your striker's hat-trick. A football game whose most important event carries zero emotional valence is telling the player nothing. The side is already on the instance as `this.mySide` (`main.ts:439`, assigned `4883`).

**What it should be.** Branch on `e.teamIdx === this.mySide`, stamp `.us` / `.them` on `#goal-flash`.
- `.us` keeps `goalpop`, plus a parallel `goalCycle` hard-cutting `color` through good → `#fff` → gold → good on `steps(1)` frames. Colour cycling, not a glow ramp.
- `.them` gets **no celebratory scale-up at all**: a hard one-frame appear at scale 1 in `var(--away)` slate, pink text-shadow dropped, holds ~0.7s, cuts out. Under 0.9s versus 1.7s. **The asymmetry is the feedback.** Copy: `⚽ GOAL!` for yours, a flat `GOAL — {team}` for theirs.
- `.cm-goal.flash.against` washes `rgba(255,109,109,0.22)` instead of gold.

**Effort.** Small. Two small keyframes, one class, no new DOM.

---

### 5. The legend card is minted and nobody sees it

**Moment.** A whole generation — peak OVR, titles, cups, apps, seasons — collapses into one legend tier at succession.

**Why.** `legendCardOf(decorated)` is computed at `api.ts:633` and persisted at `api.ts:636`, and the return object at `api.ts:783` carries `legacy`, `saleFee`, `testimonial`, `siblings`, `familyTrait`, `prospect` — **but not the card**. The only way to ever see the game's verdict on the career you just spent an hour living is to navigate to the Hall of Legends (`main.ts:3154-3160`) afterwards and pick a tile out of a grid. This is the single biggest unmarked moment in the dynasty layer.

**What it should be.** One plumbing change: hoist `legendCardOf` out of the try at `api.ts:633` and add `card` to the return at `api.ts:783`. Nothing in `shared/` moves; determinism untouched. Then in `bringThroughHeir` (`main.ts:2830-2846`), before the will windfall, render an actual `.pc-card` overlay mapped legend tier → card tier: Icon→gold, Legend→diamond, Immortal→legend, Club Great and below→silver. That buys `pcBurst`, `.pc-ring`, `pcSpark`, `holoSheen` and — Legend/Immortal only — `pulseLegend` + `legendBorder` + `pcShimmer`, all already written. One new keyframe for the tier badge:

```css
@keyframes legendStamp { 0%{transform:scale(2.6);opacity:0} 40%{transform:scale(2.6);opacity:1}
                         41%{transform:scale(1.15)} 100%{transform:scale(1)} }
/* .34s steps(4) .5s both — it die-stamps down in four frames. Not an ease-in. */
```

Gate the whole reveal behind a single Continue so the player controls the dwell.

**Effort.** Medium (one API line + one overlay).

---

### 6. The house climbs a rung

**Moment.** Crossing one of the eight rungs from Unknown Name to Royalty (`shared/src/renown.ts:81-94`).

**Why.** `nextHouseTier` (`renown.ts:102`) has exactly one caller in the client — `renderHouses` at `main.ts:3679`. Crossing a rung produces no toast, no feed line, no sound, nothing; the player learns their house moved by opening the Trophy Room and scrolling. **You have already diagnosed and fixed this exact bug once**, for the prestige ladder — `main.ts:2553-2560` carries the comment "CROSSING A RANK IS THE ONE MOMENT THE NINE-RANK LADDER EXISTS TO MARK, and it passed in silence", solved with `lastRankIdx` on MgrState (`main.ts:60`). The identical omission is still live for the family ladder, which is the thing the game is named after. And the data is already on the right path: `nextSeason` already awaits `api.houses()` at `main.ts:2652`.

**What it should be.** Follow the precedent exactly. Add `lastHouseTierIdx` to MgrState alongside `lastRankIdx`; inside the existing `api.houses()` call at `main.ts:2652`, compare `HOUSE_TIERS.indexOf(d.mine.tier)`. On a crossing: `pushFeed('👑', …)`, `toast()`, `audio.sting('triumph')` (used at `main.ts:2629`/`2637`), and a one-shot centred plate — `ftfade` scrim, `ftpop` inner plate, rung icon at 48px, rung name as gradient text on `pcShimmer 2.4s linear 2`, and `legendBorder 3s linear 2` on the border. **Two passes then stop** — a ceremony, not an ornament. Also give `.hs-bar > b` (`index.html:1511`, currently an inline width against no transition, `main.ts:3692`) `transition: width .8s steps(12)` set from `0%` on a rAF: a meter ratcheting.

**Effort.** Medium.

---

### 7. End of season — one card instead of 3–5 toasts that eat each other

**Moment.** Prize money, sponsor bonus, CHAMPIONS, awards, promotion, continental qualification.

**Why.** `toast()` (`main.ts:283-294`) is a singleton — it sets `textContent` on one `#toast` and restarts `toastfade`. In `nextSeason` the prize toast (`main.ts:2515`, which is also where `🏆 CHAMPIONS!` is announced), the awards toast (`2536`) and the disrepair toast (`2545`) fire with **no await between them**; only the last is painted. The promotion toast at `2637` and the qualification toast at `2694` are eaten the same way. Winning the league gets `audio.sting('triumph')` (`main.ts:2629`), a 🏆 appended to a text line, and a toast destroyed before it can be read.

**What it should be.** One END OF SEASON card on the `#fulltime-card` chassis (`index.html:1589-1611`): `ftfade` scrim, `ftpop` plate, ledger rows revealed on `narrfade` at 90ms stagger — finish → prize → sponsor → facility income → upkeep → awards → tier move. Count the prize figure up over ~450ms with a `steps()`-quantised rAF counter reading the already-returned `r.prize` — **never writing `this.account.coins`**, which is set from `r.coins` at `2515` before the card opens. If `t.pos === 1`, the header takes the gold rarity treatment: `pcShimmer` + `pulseGold` + one `pcBurst` at `--burst: 0.6`, so a title reads in exactly the language a Gold card already uses. Under 1.4s to first dismissible frame.

**Ordering constraint:** raise it after the `spSeasonReward` await and **before** `this.showSeason()` at `main.ts:2701`, or the screen change stomps it.

**Effort.** Large. This is the one item where the plumbing is the work, not the CSS.

---

### 8. The chapter changes

**Moment.** Age 18 → 19, Youth Team → Breakthrough. Six per career.

**Why.** `CHAPTER_THEME` (`main.ts:178-187`) swaps accent, backdrop gradient, emoji trio and tagline at once, applied at `main.ts:3953`. It hard-cuts. You intended a cross-fade — `#academy-body { transition: background .5s ease }` at `index.html:536` — and it cannot work, for a reason distinct from finding 3: `th.bg` is a `radial-gradient(...)`, i.e. a background-**image**, and gradients do not interpolate. CSS animates `background-image` discretely, so it swaps abruptly mid-transition. `#academy-body` is the one element here that survives the render, so unlike the bars this is fixable in place.

**What it should be.** Two stacked absolutely-positioned pseudo-elements carrying outgoing and incoming gradients, animating **opacity** (which does interpolate) over 500ms — the only way to cross-fade two gradients. Then `.cg-scene.chapter-new`, one-shot ~800ms: the three `.cg-scene-emoji` glyphs (`index.html:539`) revealed one at a time on a `steps(3)` opacity reveal at 90ms offsets; the chapter name `<b>` colour-cycling from the outgoing accent to the new one across four hard stops (both accents are known at render time — write the old one into a custom property alongside `--cg-accent`); the banner border snapping in on `ftpop`.

This is also where the summer wizard's payoff belongs — the focus commit at `main.ts:4097-4098` *is* the chapter transition trigger ("this **ends pre-season** and starts the next chapter", `main.ts:4062`). Leave the two-step spend/focus swap itself unanimated.

**Effort.** Medium.

---

### 9. The scout comes back with a gem

**Moment.** The reveal at the end of "sealed → travel → reveal" — your own words at `main.ts:4315`.

**Why.** The seal and the travel are staged: `.mission.travelling` is dashed-bordered with a spinning ⚙️ (`index.html:1304-1306`). The reveal is not staged at all — the row is rebuilt by `innerHTML =` at `main.ts:4389` and a static `.mission.hit` simply exists, with a 1px-outline `.m-band` chip (`index.html:1315-1317`). The band ladder raw → squad → quality → gem is the *same* rarity escalation the player card spends ~70 lines dramatising, and here the top rung is a gold outline. The paid trip, the multi-matchday wait and the odds display all build tension the payoff never discharges.

**What it should be.** Track first-sight per mission id (rows already carry `data-id`; mirror the `feedOnce` key set at `main.ts:4373` so a screen re-entry doesn't replay it). On first render of a hit: border dashed→solid on `steps(2)` over 240ms; `.m-band` chip on `ftpop`; name + OVR on `narrfade` at 120ms. **For `band-gem` and `band-quality` only**, add a `pc-burst`-style overlay child on `pcBurst 0.6s` plus `legendPulse` on the row for 1.2s, then removed — finite, not the card's `infinite`. A raw or squad find gets the chunky reveal and nothing more. That contrast is what makes a gem land.

**Effort.** Medium.

---

### 10. The rare-moment CSS pack — four beats, one block, one afternoon

These are all trivial individually and share a single new section of CSS. All one-shot, nothing loops.

- **`★ THE BIG ONE`** (stakes-3). Requires `r < 0.05 * exposure` and a band with `maxStakes: 3`; two or three per career. Entire current treatment: `.cg-scenario.stakes-3` (`index.html:587`) and `.cg-matchday.stakes-3` (`index.html:621`) — a pinker border. Give it: `.cg-md-score` (`index.html:625`, 30px, the largest glyphs on screen) entering on `ftpop`; `.cg-md-min` (`624`, the red clock) blinking twice on `steps(1)`, `pixspin`'s idiom; the panel border running **one** `legendBorder`-pattern cycle over 900ms, `#e06a9a → #ffd76a → #e06a9a`. **Do not make the pink glow pulse indefinitely** — the player has to read a three-tag demand and choose from four cards on this screen.
- **Rivalry / shock call-up.** `main.ts:3992` emits `class="cg-matchday stakes-N rivalry callup"` and **grepping `index.html` for `rivalry` and `callup` returns zero rules** — the hooks exist, nothing consumes them. `.rivalry`: the `🆚 vs <RIVAL>` badge on a 4-frame `steps(1)` horizontal jitter (0 / −3px / +3px / 0, 240ms, one iteration) — a sprite juddering, not a spring; border one 3-stop cycle into the pink already used by `.cg-rival-lbl`. `.callup`: one `pcBurst` white flash across the panel (opacity-only, floodlights snapping on), badge blinking twice on `pixspin`'s shape then holding. Also give `.cg-rival-news` (`main.ts:3403`) a real rule — it is currently unstyled inherited body text.
- **`📋 KEEP OR CUT?`** `main.ts:4003` emits `class="cg-mtype life"` — byte-identical to "his mate asks him out on a Friday". Its sibling one branch above got `.cg-mtype.pressure` with a pink glow (`index.html:598`). Add `scare` to the class and to `.cg-scenario`. Treatment must be **cold, not loud**: a 3-stop discrete colour ramp from `var(--muted)` to `#ff6d6d` (the `.cg-energy.low` red, `index.html:542`) over 600ms on `steps(3)` — the label *draining* to red. Border does one slow amber → red → amber pass over 1.2s and stops. No scale pop, no burst, nothing bouncy.
- **`🎭 THE WEIGHT OF THE NAME`** — dynasty-conditional and rarer still. Same cold one-shot entrance; it is currently a static `text-shadow`.

**Effort.** Trivial each, small as a block.

**Tail, worth doing, not worth arguing about:** the achievement plaque (22 achievements, one per save, Steam-bound, currently delivered by the same green box as "Not enough coins" at `main.ts:848` — and the `i * 1400` stagger is shorter than `toastfade`'s 2s, so back-to-back unlocks truncate each other; replace with a real queue); facility MAX LEVEL (`main.ts:3046-3048`, `index.html:1257-1258` — the terminal state of the club's main coin sink, currently styled less than a Bronze card); the promotion banner's first appearance (`main.ts:1956`, `index.html:661-664` — a commissioned asset with no motion, gated by `nextIdx <= 2` so it can't become wallpaper).

---

## 3. What must stay quiet

**Playing a card.** The game's central verb, ~120 times per career. A 150ms commit animation, waited on, is eighteen seconds of added dead time per career on the most-repeated interaction — exactly what your own constraint forbids. It is also already covered: the verdict arrives next render as `.cg-outcome` and `.cg-narrate`, both on `narrfade` (`index.html:570-572`). And there's a structural trap: the game is offline, `api.careerAct` resolves in about a frame, and `renderCareer` destroys the outgoing DOM at `main.ts:4089` — anyone implementing a card-commit flourish would have to *deliberately delay the re-render* to make it visible.

Two free changes and then stop: add `transition: opacity .1s steps(3)` to `.cg-cards` / `.cg-focus` / `.cg-coach` / `.cg-offer` so the `.cg-acting` dim (`index.html:517`, applied `main.ts:4282`) steps out in three beats instead of snapping; and `.cg-card[data-act]:active { transform: translateY(-1px) scale(0.97) }`, which outranks the `:hover` at `index.html:924` and rides the `transition` already declared at `index.html:919`. Feedback on mousedown, zero JS, zero added latency.

**Do not differentiate `.cg-outcome` pills by grade.** `⭐ Brilliant` and `✗ Poor` sharing one `narrfade` is correct at this frequency. Making the good one celebrate 120 times a career devalues every rare moment above.

**Arc beats.** `ARCS_PER_CAREER = 20` (`shared/src/storyarc.ts:88`). `.cg-scenario.cg-arc` (`index.html:593`) looks like a premium slot and isn't — twenty-plus firings is wallpaper.

**The league table after a fixture.** `showSeason()` has **20 call sites** — closing the transfer market, closing the team sheet, resolving an arc, rejecting a bid, the World Cup back button. A one-shot flag makes the marker vanish because the player opened a menu; no flag makes it re-fire on every menu close. Both are worse than nothing. The table also lives below fourteen blocks in `season-body`, and the position is already stated above the fold in the header and narrated in prose by `gafferTake`.

**The match ticker.** `#ticker .cm-line` runs `cmfade` roughly 700 times a match (`index.html:1443`). That bank is at its ceiling. No per-line motion, no substitution or fatigue animations. The real ticker problem is not motion: `.cm-break` (`index.html:1448`) is a 1px rule, so scrolling back you cannot find where the half ended. Fix that **statically** — full-width dashed rules above and below, half-time line in `var(--display)` with the score inline.

**Half-time.** No overlay, no second team talk. The player is on 1x/4x/12x trying to get through a fixture; the pre-match talk already owns that decision.

**Yellow cards.** Extend the `.flash` hook at `main.ts:5479` to `red_card` only — a strobed `cmred` (`steps(2)`, two pulses like a warning lamp, not a bloom) plus a 2-frame `cardSnap` on the inline `sprite('card-red')` at `main.ts:5453`. Yellows are common enough that a strobing feed becomes noise.

**The Hall of Legends grid.** It sits on the Academy screen (`main.ts:3154-3160`), directly under the prospect rows that are the screen's actual job. A grid of N infinitely-animating cards would pull attention off the Develop buttons. Style **only** the top two rungs by `data-tier` — `Legend` gets `legendBorder` slowed to 6s, `Immortal` adds `pcShimmer` on `.lc-name`. Two slow cycles in a grid of ten is a Hall with two great men in it; ten is a casino. The reveal ceremony belongs at succession (#5).

**Relegation.** `.sf-tiermove-relegated` (`index.html:664`) gets a plain fade and **no** stepped reveal, while promotion gets the full entrance. The absence of motion on the red variant is itself the feedback.

**The bookkeeping layer.** Buying (`main.ts:1657-1667`, already a confirm dialog + `chime('confirm')` + toast), selling (`1668-1678`), scaling a facility back (`3086-3095`), signing a trialist (`4458-4468`), upkeep and wage lines (`2519-2542`). Losses the player elected should not be celebrated, and signing after a reveal double-charges one event. One exception, ten lines: `#cn-result` (`main.ts:1193-1194`, `index.html:705-706`) writes contract outcomes as static text into a fixed box, so a rejection and a counter look identical until you read them — `narrfade` on every outcome, plus on `reject` only a 2-frame `steps(2)` shudder on `.cg-offers`, 160ms, ±3px, once.

**The fitness bar.** Leave `#fit-fill`'s `transition: width .2s linear` (`index.html:1439`) exactly as it is. It does not thrash: `fitPct` is `Math.round(fitAvg * 100)` (`main.ts:5191`), transitions retarget on computed-value change and not on identical assignment, and the value moves ~37 times across a 90-minute match. The 200ms transition is what turns a discrete ~8px integer step into a glide and absorbs the half-time recovery and substitution jumps. Removing it is a small regression dressed as a fix.

---

## 4. The reduced-motion gap — it is the opposite of what you assumed, and it is deleting content

**Your premise was that coverage is thin. It is over-broad, and it is eating game state.**

`#toast` is declared `opacity: 0` (`index.html:1579`) and its **only** source of visibility is `@keyframes toastfade` (`index.html:1581-1582`). `#goal-flash` is declared `opacity: 0` (`index.html:1415`) and its **only** source of visibility is `@keyframes goalpop` (`index.html:1416-1417`). Neither has a fill mode. Both reduce-motion blocks — `index.html:35-40` for the OS preference and `index.html:276-277` for the in-game toggle — force `animation-duration: 0.001ms !important`, so the animation completes in a microsecond and the element reverts to `opacity: 0` before a frame is painted.

**A reduced-motion player never sees a single toast in the entire game.** Not "You're the manager now" (`main.ts:3930`), not the season prize (`2515`), not PROMOTED (`2637`), not an achievement unlock (`848`), not "Not enough coins", not a fired match-plan order (`5168`). And never sees the on-pitch goal announcement (`5485-5489`). That is not a degraded experience, it is missing information.

**And it is on by default for anyone with the OS setting.** `loadPrefs` at `main.ts:542-544` defaults the pref to `matchMedia('(prefers-reduced-motion: reduce)').matches`, applied at `main.ts:548`, and never tells the player.

**Fixes, in order:**

1. **Carve-out in both blocks:** `#toast.show, #goal-flash.show { opacity: 1 !important; animation: none !important; }`. The toast already has a JS dwell (`toastTimer`, `main.ts:294`, clears at 2200ms); `#goal-flash` needs the same — a ~1700ms `setTimeout` in `celebrateGoal` removing `.show`. Presentation-only; it never touches the engine clock. The reduced-motion read then becomes what a pixel game should do anyway: the word appears, holds, is gone. **The rule to write down: reduce-motion removes the travel and keeps the state change. It must never suppress the element carrying the message.**
2. **Every new one-shot uses `both` fill.** This is why. The most dangerous upcoming case is any SVG draw-on — a `stroke-dashoffset: 260` base with no fill would collapse to an invisible tree.
3. **Collapse three mechanisms to one.** `index.html:35-40` (OS), `index.html:276-277` (toggle) and `index.html:408` (`.pc-card`, **media-query only**, so it never applies to the in-game toggle) disagree: `animation: none` leaves keyframed properties at their *initial* value, `animation-duration: 0.001ms` runs them to their *final* value. Same user intent, two different card renderings. Delete `index.html:408`; have `applyPrefs` (`main.ts:548`) always add `body.reduced-motion` when the pref is on and let one selector list share one declaration block.
4. **Hide motion-only decoration rather than freezing it.** `.pc-card::before` is the holo sheen — a hard white/cyan/pink band at `mix-blend-mode: screen`, opacity up to 0.75 for legend, at `z-index: 4` **above** the card content at `z-index: 2` (`index.html:281`, `362`, `394`). Stopped, it does not disappear; it parks permanently across the name and OVR. `.pc-ring` freezes as a static `blur(5px)` conic wedge (`index.html:350`). Add `.pc-card::before, .pc-card .pc-ring, .pc-card .pc-spark { opacity: 0 !important }`. The card keeps its tier border, its tier glow and its `pcBurst` arrival — a legend still reads as a legend, it just stops moving.
5. **`cg-pulse` is the one genuine distress case.** `index.html:542-544` blinks the *text* of the energy readout on an infinite 1.3s opacity cycle, persisting across consecutive turns whenever energy is low — blinking text the player is trying to read, with no control but the global switch. Kill the animation under reduce and let the existing `#ff6d6d` colour and the red bar gradient (`index.html:543`) carry "tired".

---

## 5. Risks, honestly

**Paint cost — this is where jank will come from, and it is all in the rarity system.** `pulseGold` / `pulseDiamond` / `pulseLegend` (`index.html:401-406`) animate `box-shadow` infinitely, with blur sweeping to 40 / 52 / 60px plus a second 90px layer. Box-shadow is a paint property; every frame repaints a blurred region larger than the card. Simultaneously `.pc-ring` at `inset: -60%` runs `filter: blur(5px)` on an element 220% of the card's size, rotating continuously, and `::before` forces an extra blend pass via `mix-blend-mode: screen`. Defensible for a full-screen modal seen a handful of times a generation. **Not defensible at `index.html:1361-1363`**, where the same infinite box-shadow idea is attached to `.slot .nft.tier-legend` — a per-row chip in the starting XI (`main.ts:4673`), up to eleven rows, on a screen where the player is reading team selection. Swap that one to `legendBorder 3s linear infinite` on `border-color`: a 1px edge repaint instead of a 14px blur over the whole chip, pixel-native (palette cycling is the oldest trick in the medium), and it reuses an existing keyframe so the tier reads identically at both scales. On the card itself, if you want it cheap: move the tier glow to a `.pc-glow` sibling at `inset: -6px` with the box-shadow set **statically** and animate only its opacity. Identical look, composited instead of repainted. And drop `.pc-ring`'s `blur(5px)` to 2px or fewer conic stops — a 5px gaussian is off-language for a pixel game regardless of cost.

**Determinism.** Nothing proposed writes to game state. The one thing to be strict about: several of these need a *previous* value (bar widths, objective progress, chapter, house tier index, mission first-sight). Every one of those must come from a **client-side render memo** — `this.lastCareerState` (`main.ts:4069`), `lastHouseTierIdx` on MgrState alongside `lastRankIdx` (`main.ts:60`), a `feedOnce`-style key set (`main.ts:4373`). None is ever read back by the engine, and no animation may gate an engine call, a save write, or an RNG draw. `Math.random()` already appears in the client for spark placement (`main.ts:986-991`) — that is fine and is the precedent: presentation randomness never crosses into `shared/`.

**Never make a frequent interaction wait on a frame.** No animation goes on the rAF path (`syncMatchHud`, `main.ts:5173`), and nothing gets awaited before a re-render. If an animation is only visible because you delayed the game, it is the wrong animation.

**Re-entrancy is the bug you will actually ship.** `showSeason()` has 20 call sites; `renderCareer` is re-entered on every tab switch (`main.ts:4093`); `renderMissions` rebuilds on every screen open. Any "this just happened" marker must be keyed to a **value** — season number, tier index, mission id, objective progress — never to "first render of this component". A flag that gets consumed by a menu close reads to the player as a bug.

**Async ordering.** The two overlays (Champions, house rung) both sit inside `nextSeason`, which awaits `spSeasonReward` and then calls `this.showSeason()` at `main.ts:2701`. Raise them after the await and before that call, or the screen change stomps them.

**The one thing that will make this fail.** Not performance, not determinism — proportion. Every item above is either once-per-generation or once-per-save except #3 and #4, and both of those are deliberately under 300ms. If a rare beat and a routine beat end up with similar amounts of motion, the rare beat stops reading as rare, and you will have spent the budget making the game feel busier rather than more premium. The restraint list in §3 is not the leftovers; it is half the design.