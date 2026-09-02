# The trailer

61 seconds, 1920×1080, 30fps. Every frame is the real game — the shots are the same PNGs in
`../screenshots/`, and the four Family Record panels are four real saves at one, two, three and four
generations deep.

## The cut

| at | shot | what it says |
|---|---|---|
| 0:00 | the scout board | EVERY DYNASTY STARTS WITH ONE BOY — *you pick him at ten, and you never get another founder* |
| 0:06 | a matchday hand | YOU PLAY HIS WHOLE CAREER — *one hand at a time, age 10 to 25 — no auto-sim, no sliders* |
| 0:13 | the club season | THEN YOU RUN THE CLUB HE PLAYS FOR — *the season, the squad, the sponsor, the wage bill* |
| 0:19 | facilities | A BIG CLUB IS SOMETHING YOU KEEP AFFORDING — *2,534c a season to run, and 66c in the bank* |
| 0:24 | hall of legends | EVERY CAREER ENDS — *one legend card per retirement, then the name is handed on* |
| 0:30 | the Family Record | ONE GENERATION · TWO · THREE · **FOUR** |
| 0:48 | the houses ladder | THIRTEEN FAMILIES CLIMB THE SAME LADDER — *renown never falls* |
| 0:54 | title card | FOOTBALL ROYALTY — *A football life. Then your son's.* |

The centre of the trailer is the four Family Record shots. They share a width and are anchored by their
**bottom** edge, so across the three dissolves the founder never moves and the tree grows upward out of him.
That is the game's whole pitch in nine seconds, and it only works because those are four genuine saves
rather than one drawing with pieces added.

## Rebuilding it

```
npm run build --workspace client
node tools/trailer/capture_trees.mjs          # four saves, one Family Record each
node tools/trailer/capture.mjs                # 1,830 frames as JPEGs
# WebM (VP8) — playwright's bundled ffmpeg:
cat /tmp/gr/trailer/frames/f*.jpg | ~/Library/Caches/ms-playwright/ffmpeg-*/ffmpeg-mac \
  -f image2pipe -vcodec mjpeg -framerate 30 -i pipe:0 \
  -c:v libvpx -b:v 6M -crf 18 -deadline good -cpu-used 2 -auto-alt-ref 0 -y trailer.webm
# H.264 mp4 — AVFoundation, because that ffmpeg is a VP8-only build:
swiftc -O tools/trailer/EncodeH264.swift -o /tmp/encode_h264
/tmp/encode_h264 /tmp/gr/trailer/frames trailer.mp4 30 12
```

The masters are gitignored — they are ~66MB (mp4) and ~28MB (webm) and would be re-encoded on every tweak.

## Two things to know before editing it

**The stage never animates itself.** `tools/trailer/stage.html` exposes `renderAt(t)`, which sets every
style from the clock; the capture steps the clock by 1/30s and screenshots. So the output is exactly 30fps
however slow the machine is. Recording the page in real time would have tied the trailer's smoothness to
how busy this laptop happened to be.

**The captions are in the game's own faces**, pulled from Google Fonts. The capture refuses to run if they
have not loaded, because the fallback is close enough in size that a whole render in Courier New is easy to
miss. (See decision 78 — the game itself has the same dependency, which matters more.)

## The score

**One track, no edits: `legends-1` "Recalling When", played straight from 0:00 to 1:01.**

The first cut spliced `international-1` into `legends-1` at 0:24 and it sounded wrong. It was wrong.
Measured properly (`tools/trailer/analyse_music.mjs`):

| | key | tempo | bar |
|---|---|---|---|
| `international-1` | **F minor** | 89.0 BPM | 2.697s |
| `legends-1` | **C major** | 77.5 BPM | 3.097s |

The join was a key change *and* landed at bar 8.900 — mid-bar. So was every other splice in that cut
(12.000s = bar 3.875, 42.000s = bar 13.562, 123.000s = bar 39.719). An earlier note in this file claimed
`legends-1` runs at "exactly 80.00 BPM with 3.000s bars, so every splice lands on a bar line". That was
false, and it was caught by someone listening, not by any of the analysis.

There is now nothing joined, so there is nothing to sound sudden. **The picture is cut to the track's
landmarks instead of the other way round:**

| in the track | what it does | what the picture does there |
|---|---|---|
| 2.5–4.5s | near-total silence, down to −67 dB | the opening caption sits in it |
| 6.0s | the full entry | cut to the cards |
| 14–15s | a dip to −58 dB | cut to the match |
| 21–22.5s | a deeper dip to −64 dB | — |
| 24.0s | a hard hit | cut to the second half of the match |
| **47.5s** | **the collapse, to −50 dB** | the record scrolling into view |
| **48.0s** | **the payoff — full arrangement, sustained past 61s** | **the complete four-generation record** |

### Why this track and not one of the other 1,014

The full pack has 1,015 tracks. Thirteen candidates were measured — the five non-looping themes (the ones
written with a beginning and an end rather than as loops) and the eight orchestral character themes:

- **`Hero's Bloodline`** has the perfect name for this game and the wrong shape entirely: it opens at
  −14 dB, one decibel below its own median, with a 6 dB range. No arc to cut to.
- **`Era`** has the most beautiful opening in the pack — it starts at **−54 dB**, forty below its median,
  and crescendos for sixteen seconds. Then it plateaus at −14.5 dB and stays there. All its movement is
  spent before the trailer needs any.
- **`Roll Credits`** climbs steadily for 48 seconds from true silence and ends loudest — a textbook trailer
  shape, and the strongest alternative if you want something smoother and more orchestral.
- **`legends-1`** has the widest dynamic range of anything measured (18 dB against 5–15) and is the only
  candidate with a genuine *collapse and payoff* rather than a smooth climb — landing exactly where the
  trailer's reveal does.

And it is the track the game itself plays in the Trophy Room and Hall of Legends, which is the screen the
centrepiece is showing. No other cue can be diegetically right in that way.

## Still to do

**Nothing blocking.** Two follow-ups are written up in `docs/decisions-for-ck.md`: §80 (the Steam AI-content
disclosure, already required because of the capsule art) and §81 (a one-line email to the composer
confirming trailer use — insurance, not a blocker).
