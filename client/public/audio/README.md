# Music/audio drop folder

Bundled music tracks, one file per slot. Vite serves `public/` at the site root, so
`client/public/audio/career-1.ogg` loads as `/audio/career-1.ogg`. The audio manager
(`client/src/audio.ts`) plays them per game context and rotates multi-track pools; a missing file
is a silent no-op. Licensing/attribution: `/CREDITS.md` + `docs/licenses/`.

## Contexts (filename → track) — chosen from the Bit By Bit Sound library
| Slot(s) | Track | Fires on |
|---|---|---|
| `menu-1` | New Beginnings (LOOP) | main menu |
| `career-1..5` | Youth · Times of Peace · Feels Like Home · A Little R n R · Building Strength | academy/development (rotates) |
| `hub-1` | Looking Forward | hub / season planning |
| `match-1` | A Worthy Challenge (LOOP) | matchday |
| `triumph-1` | Over Achievers (32-Bit) | title win |
| `tension-1` | Meeting The Call (LOOP) | shock call-up / big career moment |
| `drama-1..3` | Unexpected Turn · Minor Complications · In Dire Need (LOOP) | life-events (rotates) |
| `international-1` | A Rising Power | national-team call-up |
| `legends-1` | Recalling When | Trophy Room / Hall of Legends |

## Still to choose (empty pools → silent for now)
- `bigmatch-*` — cup final / World Finals
- `emotional-*` — retirement / succession (the bloodline beat)
- `scout-*` — new game / prospect scouting

Drop the chosen files here named `<slot>-1.ogg` (add `-2`, `-3` for rotation), then add the pool
to `MANIFEST` in `client/src/audio.ts`.
