# The house voice — for anyone writing text for this game

Corrected 2026-08-30, after ten authoring waves showed the original guidance was wrong.

## The rule I got wrong

The first briefs said **"8–16 words"**. I invented that by eyeballing the existing lines and describing
what I saw, then handed it out as a rule. Two problems:

1. It was **narrower than the prose it described**. The original hand-written lines run **5–23 words**
   (median 11). I compressed a real range into a cage.
2. It **contradicted the register probe**, which requires sentence-length sd ≥ 3.0. A band of 8–16
   mathematically caps sd near 2.3, so a corpus written strictly to the style guide *failed its own check*.
   Every author hit this; two diagnosed it independently and wrote around it without being asked.

There is no display constraint behind it either — `.cg-story` sets a font size and line height and nothing
else. Nothing in the UI cares whether a line is 6 words or 23.

**The rule now: 5–23 words, median around 11, and vary deliberately.** Descriptive of the real voice, not a
cage.

## What actually makes a line read as written by a person

Measured across the first ~5,900 authored lines, the corpus already avoids the classic tells. Keep doing
these:

- **Show, don't name the feeling.** Only 0.7% of lines contain a word like fear/pride/doubt/hope. Naming
  the emotion is the loudest generated-prose tell there is.
- **Be specific.** 18.9% of lines carry a number or a time. "Half past six in the morning" reads as
  observed; "early one morning" reads as generated.
- **Vary the subject.** Only 13.4% open with "He/His"; 46% open on someone or something else.
- **Vary the ending.** The most common three-word ending is 0.14% of lines. This is the axis where AI prose
  clusters hardest ("…and he knows it", "…in a way he can't name"). Guard it.

## The three things to do MORE of

1. **Let some lines be flat.** The deepest tell is not length or vocabulary — it is that *every line lands
   something*. Real writing contains lines that just sit there. "The coach has a new whistle." Write some
   that do no work at all.
2. **Throwaway detail.** The best line in the original corpus is *"His dad films it badly, mostly sky and
   shouting."* The "mostly sky" is useless to the story, which is exactly why it feels real. Generated prose
   is relentlessly relevant.
3. **Occasional ugly syntax.** An "And" opener. A comma splice. A sentence that trails off. Perfect grammar
   across 49,000 lines is itself a tell.

## The one weak axis right now

Openings. `he has been` 1.45%, `it asks him` 0.99%, `it wants him` 0.97%. The DEMAND bank pulls
structurally toward *"It asks for… / It wants… / They want to see…"* — break that pattern deliberately.

## The checks, and what they are worth

`tools/playtest/prompt_register.ts` — openings, endings, emoting, Americanisms, second person, placeholders,
length spread. Two honest notes:

- The **length-sd gate is a crude proxy**, not a law. The game's own original prose measures sd 2.5 and
  would fail it. It is deliberately stricter than the source because at ~49,000 lines uniformity becomes
  visible in a way it never was at 489. It has been verified NOT gamed: the length histogram is a clean
  unimodal curve, not the two humps that padding-to-hit-a-number produces.
- **Opening and ending shape are the stronger signals.** Repeated *shapes* read as generated far more than
  uniform lengths do.
