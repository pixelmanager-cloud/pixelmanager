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

## Screenshots

Six at 1920×1080 in `screenshots/`, captured from the **built game in a real browser** by
`tools/store_screenshots.mjs` — not mockups, and not a dev server. It serves `client/dist`, drives the
shipped bundle through a real opening, and screenshots each screen. If a screen breaks, the screenshot
breaks with it. Steam requires five.

| shot | what it sells |
|---|---|
| `01-academy` | three ten-year-olds carrying your family name — the choice the whole game starts from |
| `02-agents` | eight agents with real trade-offs; the game has decisions, not sliders |
| `03-cardplay` | the core loop in one frame: matchday 2-1 at 27', a scenario, four tagged cards, energy and meters |
| `04-hub` | the shape of the game — your player, your club, scouting, dynasty |
| `05-scouting` | the scouting board: local tryouts and four destinations with odds and fees |
| `06-trophies` | The Houses of the Game — thirteen families ranked by renown, yours 13th. The long game. |
| `07-family-record` | the game in one image: four generations on painted parchment, Nils → Leo → Milo → Enzo, with the sons you passed over branching off |
| `08-houses-ladder` | the same ladder as `06` but nineteen seasons in — 7 titles, 3 legends, the name risen to 7th of 13 |
| `09-hall-of-legends` | one card per retirement: an Immortal, two Cult Heroes, and the two ten-year-olds who could be next |
| `10-club-season` | the manager half — a squad decision with no good answer, a sponsor choice, fixtures and the table |
| `11-facilities` | what nineteen seasons buys: a maxed stadium and training ground, 2,534c a season to run, 66c in the bank |

The first six are shot on a **fresh** save by `store_screenshots.mjs`. The last five need a save several
generations deep, which is hours of play and not reproducible by hand — so `tools/dev_dynasty_save.ts`
builds one by driving the **real offline facade** (the same calls the UI makes) through four generations,
and `tools/store_dynasty_screenshots.mjs` plants that save in IndexedDB and photographs what it unlocks.
Nothing in those five is mocked up: every stat, legend card, honour and renown figure is engine output.

```
npm run build --workspace client
npx tsx tools/dev_dynasty_save.ts 4 > /tmp/dynasty.json
node tools/store_dynasty_screenshots.mjs /tmp/dynasty.json store/steam/screenshots
```

Two things worth knowing before editing the capture script: the onboarding help panels cover the career
screen **and swallow clicks** (without dismissing them an automated run stalls on turn 12 forever), and
every panel has its own back button — there is no single "back to hub" selector. The player and prospect
card overlays also intercept clicks and have to be removed, not just clicked away.

Shooting the dynasty screens is also what surfaced bug #29 (`docs/bug-queue.md`): the Family Record was
drawn from tokens alone, so it showed the living star and the brothers he was picked over and omitted his
father, grandfather and the founder. It could not have been caught without a save this deep.

## Still to do

The trailer.
