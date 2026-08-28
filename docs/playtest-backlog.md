# Playtest backlog — continuous testing findings

The living issue list produced by the playtest harness. Newest findings on top. Status: `[ ]` open · `[~]` in progress · `[x]` fixed.

## The harness (how testing runs)

Three complementary layers, because different problems need different tools:

1. **Headless balance/content probes** (`tools/playtest/*.ts`, `npm run playtest`) — simulate hundreds–thousands
   of careers/seasons through the deterministic engine, no browser. Catch *balance/content* issues at scale
   (is skilled play rewarded? is the rival beatable? can you climb the pyramid? are titles winnable?). Fast,
   parallel-safe, run anywhere (incl. Vultr overnight). This is the 24/7 workhorse.
   - `analyze_player_career.ts` — skilled-vs-random policy across many careers.
   - `analyze_manager_career.ts` — dynasty climb up the 10-tier pyramid.
2. **Browser UX agent** (`.claude/agents/ux-playtester.md`, Opus) — actually plays the game in-browser and
   critiques *interface/UX/content-feel* from a fresh-player POV (the layer that found the core card bugs).
   Best run as periodic passes while a session is live (it drives the one Browser pane, so passes serialise).
3. **This backlog** — findings from both layers, deduped + triaged, that we then fix.

**Constraints (honest):** the headless probes are deterministic, so continuous value comes from *sweeping
new seeds/configs* each pass, not re-running identical checks. Browser agents share one pane → they run one
at a time, not truly parallel. True survive-the-Mac-sleeping 24/7 = run the headless layer on a Vultr VPS
(the browser layer needs the desktop app). See [[feedback-overnight-vultr-agents]].

---

## Open findings

_None from the harness right now — the two launch-pass balance flags are fixed. New findings land here from the rotating cron passes (browser UX agent + probes)._

<!-- Browser UX pass 2026-08-28 — player Grassroots (new game → sign prospect → agent → 6 card turns). No console errors. POSITIVE: skilled card play is now clearly rewarded (Right card/★Brilliant vs Wrong card/✗Poor is unmistakable), stage objective correctly counts only strong displays (wrong card did NOT increment), and the family-name live preview ("Okonkwo's Club · the Okonkwo bloodline") works well. -->

- [x] **PT-3 [FIXED — PERSONALITY is now a multi-variant, outcome-neutral bank picked at random (no more one recycled line; reads fine on win or loss). shared/src/narrate.ts.] (stage: player Grassroots): [high] outcome flavor text recycles within 6 turns — a workhorse player sees the identical voice line "No one on that pitch worked harder." on almost every strong/failed beat.** The prose sells the "every moment is a story" hook, but repetition breaks it fast: in a 6-turn run that one sentence appeared in 5 of 6 outcomes, plus "As a dog wandered across the far corner" ×3 and "Somebody, somewhere, will tell this story wrong in twenty years" ×2. Root cause: `PERSONALITY` is the only vocabulary bank that's one fixed string per id instead of an array, and it's appended ~60% of the time on triumph/dismal (`shared/src/narrate.ts:88-102`, used at `narrate.ts:321`). Fix: make `PERSONALITY` a `Record<string,string[]>` (like `PERSONALITY_ADV`) and `pick()` from it; also the same "worked harder" line reading as a compliment on a *dismal/Wrong-card* result is tonally off.
- [x] **PT-4 [FIXED — stars labelled as potential (tooltip); founding pedigree now shows 'first of the line · his heirs will inherit his pedigree' instead of a bare 0%. main.ts pedigreeText().] (stage: player Grassroots): [medium] the signed prospect shows "★★★★☆" and "pedigree 0%" side by side, which reads as a contradiction.** The academy explainer only defines pedigree ("the quality his bloodline passes down — a higher pedigree means a stronger natural ceiling"), so a new player sees 4 gold stars next to 0% and can't tell if the kid is great or worthless; the stars are never labeled or explained. Founding-generation pedigree is legitimately 0, but nothing signposts that stars = his own talent while pedigree = inherited bonus. Fix: label the stars (e.g. "talent"), and either hide "pedigree 0%" for the founding prospect or annotate it ("0% — you're the first generation; his kids inherit his pedigree").
- [x] **PT-5 [FIXED (lighter touch) — agent screen now reassures the first-timer ('no wrong pick; the tags play out slowly over the years'); kept all agents (variety) rather than trimming.] (stage: player Grassroots): [medium] the agent screen dumps 11 near-identical agents as the very first real decision, with effect pills that reference systems the player hasn't seen yet.** Choice overload before any card turn: pills like "more big-stage moments", "better card options at drafts", "higher transfer value" are meaningless to someone who has not yet played a matchday or a draft, and two 🃏 tiers ("slightly better drafts" vs "better card options at drafts") can't be ranked by a newcomer. Fix: trim the first-career agent list to ~3-4 clearly-differentiated options (or gate the rest behind later generations), and add a one-line "what this means" tooltip on the pill dimensions.
- [x] **PT-6 [FIXED — the demand is now labelled '🎯 This calls for:' with distinct highlighted pills (primary emphasised) + 'play a card that matches' hint, visually separate from card tags.] (stage: player Grassroots): [low-med] the scenario "demand" tag is a bare pill visually identical to the card tags, with no label telling the player it's the thing to match.** The moment's wanted trait (e.g. a lone "teamwork" pill, or "flair teamwork creativity") sits under the scenario prose in the same pill style as the four cards' tags, so a naive player may not realize matching that pill to a card tag is the core mechanic. It's also ambiguous when 3 demand tags appear but each card carries only 1-2 tags — which card "matches" isn't clear. Fix: prefix the demand pill(s) with a label ("They want:") and visually distinguish them from card tags; consider highlighting matching card tags.
- [x] **PT-7 [FIXED — the Player-tab role now carries a '· forming' cue (while traits still form) + a tooltip explaining position emerges from how you develop him.] (stage: player Grassroots): [low-med] a prospect pitched in the academy as "Looks like a forward" is classified DF on the Player tab after a couple of turns, with no explanation.** A new player who deliberately picks the "forward" prospect (Jude Cruz) is confused to open Player and find "DF · forming Ball-Winner · TAC 16". If position emerges from early card choices/stats that's a nice system but it's completely unsignposted, so it reads as a bug. Fix: either honor the academy descriptor as the starting position, or surface a note that his position/archetype is still forming from how you play him.

## Fixed (validated by the harness)

- [x] **PT-2 — top-flight titles too rare (~5%/season).** Top-tier transfer market now offers title-contender
  signings (headroom +3 at tiers 1–2) so an investing dynasty can build a squad that exceeds the league — an
  earned, coin-gated reward. Probe: title rate **5% → 18%**. `shared/src/transfermarket.ts`.
- [x] **PT-1 — ~24% of turns were a "bad hand"** (no fair-fit card, forced weak play). `ensurePlayableHand()`
  now swaps in a fair-fit card from the deck when the draw is dead; a dead hand only remains when the DECK
  itself can't answer (a deck-building signal). Probe: bad-hand **24% → 2%**, skilled Solid+ **71% → 94%**.
  `shared/src/career.ts`.
- [x] Core card loop: skilled play rewarded (Solid+ 71→94% vs random ~33%) — demand normalized by max not
  sum + variance cut. (was: perfect play routinely graded "Poor")
- [x] Rival beatable by good play (100% of skilled careers) after rate 6–9 → 3–5/turn. (was: impossible)
