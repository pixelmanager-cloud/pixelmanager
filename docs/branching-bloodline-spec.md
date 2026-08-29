# The Branching Bloodline — build spec

Settled with the user 2026-08-30. This is the contract; if the build disagrees with this file, the file wins
until it is deliberately changed.

## The shape of it

A dynasty is a FOREST, not a chain. Each generation produces 1–3 heirs. The player plays ONE of them as a
card career; the others are real people in the world. At the next succession the player may continue from
ANY living branch — his son, or a nephew from the brother he passed over.

    G1  Kai ─┬── G2  Ross      (played)  ─┬── G3  Milo   (played)
             ├──     Dane      (brother)  └──     Arlo   (brother)
             └──     Tomas     (brother)  ── G3  Nia's boy … also selectable

## 1. How many heirs — VARIES, 1 to 3, seeded

`heirCount(parentSeed, generation)` → 1 | 2 | 3, a pure hash. Weighting: **1 → 20%, 2 → 40%, 3 → 40%.**

A generation with a single son is deliberate: it is lifelike, and it makes the generations that DO offer a
choice feel like an event. It must never feel like a bug, so a one-heir succession says so in words ("one
son, and the name goes with him").

## 2. Branch switching — FREE

At succession the player is offered the heirs of the line he just played AND any living unplayed branch that
has produced heirs. A branch stays selectable while anyone in it is young enough to start a career.

Implication: the save holds a forest. `Token` gains `parent_id` (see §6). Nothing may assume the previous
generation's played heir is the next one's father.

## 3. The brothers are FULL PLAYERS — not summary rows

**The user was explicit: "they become full players, the same as other generated players with their own
stats, mentalities, characteristics, etc."** So an unplayed brother is minted through `mintSquadPlayer`
(15 stats + personality + earned traits + age + durability + morale) from HIS OWN genes — the same path
every rich squad player already takes. He is not a card career and not a stat line.

He must then be consequential in three ways, all chosen by the user:

- **Signable into your squad.** He appears in the transfer market as a real listing, flagged as family. Given
  the stated goal that squad players feel personal, a brother in the XI is the strongest form of that.
- **Turns up at rival clubs.** He can be in an opponent's side, score against you, knock you out of a cup.
- **A career record on the tree** — peak overall, division reached, honours — via the existing
  `career_honours_json` (added for PT-955) so the tree can show what he actually did.

He ages and develops across the manager seasons on the SAME lifecycle as squad players (`advanceSquad`), so
he is never frozen while the played line moves.

## 4. What the player knows when choosing — SCOUTED, WITH UNCERTAINTY

Per heir: his name, his temperament (the personality already rolled), the family attribute he inherited, and
a **star-rated scouted ceiling** — never raw genes or exact numbers. Reuse the existing "scouted ceiling"
language and the ★ rating already on the player card. The choice should have weight without being solvable
by picking the biggest number.

## 5. Genetics — BUILT AND MEASURED (`shared/src/bloodline.ts`)

Correlated but distinct, per the user: *"inherit the father but be different in parts, like how siblings are
different from each other."* Three layers — a family attribute rolled ONCE per bloodline and shared; the
other attributes regressed harder and re-rolled per child; temperament rolled per child and never inherited.

Verified in `shared/qa_bloodline.ts` (in `npm run verify`) over 400 bloodlines:
brothers differ 0.49 pts on the family trait and 2.21 pts on everything else; 98% of sibling sets have
different temperaments; 0 identical brothers.

## 6. Save model

- `Token.parent_id: string | null` — the forest edge. NEW; needs `SAVE_VERSION` 1 → 2 and a migration that
  sets `parent_id` from the existing `legacies.rebornId` chain so old saves become a valid single-branch forest.
- `Token.branch_state` — whether this person was played, is an unplayed brother, or is a dead branch.
- The existing `tokens` array is already a list, and `main.ts:1084` already picks the active prospect from
  several, so the storage layer needs less work than expected.

## 7. Pacing — the tension to watch

The user previously wanted generations SHORTER (~50–70 min) so a dynasty accumulates. Branching adds a
choice screen and more world state, which pulls the other way. The choice is the interesting part, so the
extra time must go there and NOT into more card turns. If a generation grows past ~70 minutes, cut turns
before cutting the choice.

## 8. Out of scope for the first build

Mothers/partners as tree nodes; marriages between bloodlines; more than one PLAYED career per generation;
branches older than the grandfather being selectable.
