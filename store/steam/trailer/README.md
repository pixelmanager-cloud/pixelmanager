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

Cut from two tracks the game already owns (Bit By Bit Sound — see `docs/licenses/README.md`, which confirms
the licence covers trailer use). Nothing generated. `tools/trailer/score.mjs` renders it through Chromium's
WebAudio, the same Vorbis decoder the game plays these files with.

| trailer | source | why |
|---|---|---|
| 0:00–0:24 | `international-1` "A Rising Power" 0.000→24.000 | its band lands at second 6 — exactly the first picture cut; its accents fall on the 0:13 and 0:19 cuts, and its quietest second is 23, the breath before the drop |
| 0:24–0:36 | `legends-1` "Recalling When" 0.000→12.000 | the Hall of Legends motif, alone. Its own 1.45s of true silence lands at 0:27, under "every career ends" |
| 0:36–0:54 | `legends-1` 42.000→60.000 | **the centrepiece.** The track contains a built-in decay to −51 dB at 43.6 and a hard full-arrangement re-entry at 48.000 in the relative major. Placed here, the collapse runs under ONE / TWO / THREE and the re-entry lands on **FOUR** |
| 0:54–0:57 | `legends-1` 0.000→3.000 | the motif alone again, bookending, under the title card |
| 0:57–1:01 | `legends-1` 123.000→127.000 | the track's own final cadence; the last chord lands at 60.1s as the picture fades |

**Why the joins hold:** `legends-1` is exactly 80.00 BPM with 3.000-second bars and downbeats on exact
multiples of 3.000, so every splice above is on a bar line and stays in time. 123.000 is bar 41.

**Why `legends-1` and not something more obviously "trailer":** it is the track the game actually plays in
the Trophy Room and Hall of Legends — the screen the trailer's centrepiece is showing. The music is
diegetically correct, which no bought or generated cue could be.

**One thing that had to change from the measured plan:** the bookend was originally a single 7-second lift
of `legends-1` 0.000→7.000, but that window contains the track's built-in 1.45s of silence. Under the title
card that is two seconds of dead air at the very end of a trailer, which reads as the audio having broken.
Ending on the real cadence fixes it.

Rebuild and mux:

```
node tools/trailer/score.mjs /tmp/score.wav
afconvert -f m4af -d aac -b 256000 /tmp/score.wav /tmp/score.m4a
swiftc -O tools/trailer/MuxAudio.swift -o /tmp/mux_audio
/tmp/mux_audio trailer.mp4 /tmp/score.m4a trailer-scored.mp4     # passthrough — no video re-encode
```

## Still to do

**Nothing blocking.** Two follow-ups are written up in `docs/decisions-for-ck.md`: §80 (the Steam AI-content
disclosure, already required because of the capsule art) and §81 (a one-line email to the composer
confirming trailer use — insurance, not a blocker).
