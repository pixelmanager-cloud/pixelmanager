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

## Still to do

**Sound.** The cut is timed to hold on each beat long enough for music, but there is no audio track: the
trailer is silent. It needs either a licensed track or something written for it, plus whatever stingers the
dissolves want — a decision for you, not something to pick unilaterally.
