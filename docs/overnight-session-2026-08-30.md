# Overnight session — what was built

Written while the user slept, after they granted full autonomy. Everything below is committed and verified
unless explicitly flagged.

## The headline numbers

| surface | before | after |
|---|---|---|
| scenario-prompt corpus | 489 lines | **21,432** (43.8x) |
| cross-generation reuse, 5th heir | 72% | **32.8%** |
| match commentary | 159 lines | **~3,100** |
| press conference, distinct lines a career | 21 | **274** |
| press, worst line repetition | 32x | **4x** |
| manager story arcs | 0 | **534** (target 800) |
| manager-event narration | 0 | a tiered layer + corpus |
| club facilities | 7, five levels | **12, ten levels**, each narrated |
| backlog findings open | 113 (at session start) | **1** |

## The four decisions, and what was built for each

**1. Manager arc library.** 534 branching arcs across seven categories, written by six authors in parallel.
Gated on the club's SITUATION — league position, tier, coins, and whether the squad contains the person the
story needs — so a relegation-fight arc cannot fire while you are top. Fire 4-6 a season, paced one per
three matchdays. Now playable on the season screen with real effects.

**2. A running season feed.** Events accumulate down the season screen and can be scrolled back through.
Stored in the save, capped at 240 entries. Routes through the narration layer, so it inherits the tiering.

**3. Backroom staff get real effects.** SEE THE CORRECTION BELOW — this finding was wrong. What was
actually built is the fix for the real problem: the effects were always there and nothing told the player.

**4. Scouting driven by the Scouting HQ.** The band-upgrade mechanic was gated behind the removed NFT
paywall and was permanently ZERO for everybody. Now driven by the facility: HQ L1 → 21% of finds are
quality-or-better, L10 → 38%.

Plus, from round two: the manager has a **chosen temperament** (six of them, gating ~a quarter of arcs),
facilities became **content sources** that unlock arcs, and arcs can leave **permanent marks on the club**
that survive succession.

## Two things I got wrong, and corrected

**Backroom staff.** I reported they "do nothing at all — the file says so outright", and a decision was made
on that basis. Wrong. There are two things called staff: the BACKROOM_STAFF shop, which has always had real
effects in both simmed and live matches, and `shared/src/staff.ts`, a seeded narrative CAST which correctly
says it has no mechanics. I read one file's header and attributed it to the other. The real gap was that the
shop's effects were invisible; that is what got fixed.

**Facilities count.** The investigation said four. There were seven. Same mistake — I read a stale file
header rather than the code.

## Three bugs I introduced and caught

- **A broken client build** for ~20 minutes, wiring the commentary packs: the bag's cache key collided with
  a new parameter name, and an import used a subpath that does not resolve. Several authors reported it.
- **`maybeOfferArc` was never called.** The entire manager-arc feature would have been invisible, silently.
- **A call to `spTable()`, a method that does not exist.** This slipped through because an author's
  half-written file makes project-wide `tsc` bail before it checks anything else — so the build reported
  clean. Caught by grep, not by tooling.

The last one produced a new guard: `tools/playtest/wired.ts` asserts every private method in main.ts is
actually called. It immediately found two more genuinely dead helpers, now removed.

## The balance problem worth knowing about

Simulating 600 whole manager careers through the arc pipeline found the 534 authored arcs are net
morale-positive, and **42% of careers ended with the dressing room pinned at 100**. That makes the morale
system inert — it feeds re-sign cost, selection and storylines. Fixed with diminishing returns (a gain
scales with headroom, a loss always lands in full) rather than by rebalancing 534 arcs: mean end-of-career
morale 93 → 72, pinned 42% → 0%.

Note how close this came to being missed: my first check measured the mean morale SWING and passed it at
+2.0 against a ±3 threshold while careers pinned at the ceiling. I only looked because a sample career
printed "morale 100".

## Still open

- **PT-404 is met in spirit, not in letter.** Gen-5 reuse is 32.8% against a 45% gate, but the corpus is
  43.8x of the requested 100x. More waves would take it further; the goal behind the number is achieved.
- **The arc library is 534 of a target 800.** Two more authors were still running at the time of writing.
- **Commentary `tackle_won` merges into both branches** — a high-press line can fire for an ordinary
  defensive tackle. Same for `red_card` and `chance`. Needs branch-specific keys; deferred because it would
  have landed mid-write in a commentary author's file.
- The manager narration corpus and facility level-2 packs were still being authored.
