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
| `match-1..3` | A Worthy Challenge (LOOP) · Clashing Forces · Duel of the Dark Knight (LOOP) | matchday (rotates) |
| `triumph-1` | Over Achievers (32-Bit) | title win |
| `tension-1` | Meeting The Call (LOOP) | shock call-up / big career moment |
| `drama-1..3` | Unexpected Turn · Minor Complications · In Dire Need (LOOP) | life-events (rotates) |
| `international-1` | A Rising Power | national-team call-up |
| `legends-1` | Recalling When | Trophy Room / Hall of Legends |

| `bigmatch-1` | *(title not recorded)* | cup final / World Finals (`main.ts:4913`) |
| `emotional-1` | *(title not recorded)* | retirement / succession — the bloodline beat (`main.ts:2766`) |
| `scout-1` | *(title not recorded)* | new game / prospect scouting (`main.ts:765`, `:3136`) |

Every one of the twelve `MusicContext` values in `client/src/audio.ts` has both a file on disk and at
least one trigger in `main.ts` — checked by walking `audio.play()` / `audio.sting()` call sites, not by
reading this table. `triumph` is the only one played as a STING over the current track rather than as a
context switch, so a title win does not stop the music the next screen is about to want.

To add a rotation slot, drop `<slot>-2.ogg` beside its `-1` and extend the pool array in `MANIFEST`.

**Note:** the three titles above are missing because they were filled after this table was written. If you
still have the itch.io download, record them here — `docs/licenses/README.md` treats the track list as part
of the proof-of-rights trail.
