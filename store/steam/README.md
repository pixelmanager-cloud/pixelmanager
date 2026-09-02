# Steam store art

Generated with the Retro Diffusion API at **RD Pro** (the highest tier, $0.18/image) and composed here.
Total spend for the set: **$4.50**.

## The concept

**The bloodline** — the thing that makes this game different from every other football manager. The hero
image is three shirts, all **number 12**, each hanging in its own era: 1950s stained wood and a bare bulb,
1980s breeze-block and fluorescent strip, present-day brushed metal and LED. Same club colour throughout.
It says "three generations of one family" without a single face, which matters at capsule scale where AI
faces get uncanny and a store visitor is quick to notice.

## How these were made, and why they are not generated at full size

RD Pro caps at **256px**. Steam's main capsule is 1232×706. So each piece is generated at native pixel-art
resolution **in its target aspect ratio** (`tools/rd_capsule_shapes.py` picks the ratio per asset), then
**integer-upscaled with NEAREST** so every source pixel becomes an exact NxN block. Fractional scaling or
downscaling would soften the pixels, which is the one thing you must not do to pixel art. The factors used:

| asset | size | source | factor |
|---|---|---|---|
| header-capsule | 460×215 | header-triptych-a | ×2 |
| small-capsule | 462×174 | header-triptych-a | ×2 |
| main-capsule | 1232×706 | cap-hooks2-triptych-a | ×5 |
| vertical-capsule | 748×896 | library-crest-b | ×5 |
| library-capsule | 600×900 | library-crest-b | ×4 |
| library-header | 920×430 | header-triptych-a | ×4 |
| library-hero | 3840×1240 | hero-tunnel-a | ×15 |
| library-logo | 1280×720 | wordmark only, transparent | — |

The wordmark is **Press Start 2P**, the game's own display face, so the store art and the game read as one
thing. It is drawn with a hard pixel shadow and no anti-aliasing.

## Regenerating

`tools/rd_capsule.py` (hero candidates) and `tools/rd_capsule_shapes.py` (per-ratio production pieces).
Both take `--check` for a **free** dry run that prices a batch and generates nothing — use it first. The
API key comes from `$RD_API_KEY` or the gitignored `tools/.rd_key` and is never printed or committed.

## Still to do

Screenshots and the trailer. Steam wants at least 5 screenshots at 1920×1080.
