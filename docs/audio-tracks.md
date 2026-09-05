# Music/audio drop folder

This note lives in `docs/`, not beside the files it describes in `client/public/audio/`. Vite copies
`public/` into the bundle verbatim, so a README left in the drop folder is served to a paying player at
`/audio/README.md` — internal TODOs, `main.ts` line numbers and all. `tools/playtest/ship_hygiene.ts` fails
the build if one comes back.

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
| `match-2..3` | Clashing Forces · Duel of the Dark Knight (LOOP) | matchday (rotates) |
| `triumph-1` | Over Achievers (32-Bit) | title win |
| `tension-1` | Meeting The Call (LOOP) | shock call-up / big career moment |
| `drama-1..3` | Unexpected Turn · Minor Complications · In Dire Need (LOOP) | life-events (rotates) |
| `international-1` | A Rising Power | national-team call-up |
| `legends-1` | Recalling When | Trophy Room / Hall of Legends |

| `bigmatch-1` | It's Bossin Time | cup final / World Finals (`main.ts:4913`) |
| `emotional-1` | The Journey So Far | retirement / succession — the bloodline beat (`main.ts:2766`) |
| `scout-1` | Enter Your Name | new game / prospect scouting (`main.ts:765`, `:3136`) |

**`match-1` — *A Worthy Challenge* (LOOP) — is on disk but NOT in the pool.** `play()` picks one entry per
fixture and loops it, so rotation happens between matches and cannot dilute what a single fixture hears: at
73.6s against a 540s fixture that was 7.3 loops of one phrase, where the two that stayed are 3.6 and 4.0.
§101 dropped it from `MANIFEST` rather than teach the deck to advance mid-fixture, which would have
re-entered the crossfade state machine and risked a silent match. The file is deliberately kept so a later
decision can put it back without going near the licensed pack again — no probe requires an Ogg to be
referenced, and the bar that keeps it out is a length: `tools/playtest/music_pool_truth.ts` fails a pool
holding a bed that loops more than five times in one fixture.

Every one of the twelve `MusicContext` values in `client/src/audio.ts` has both a file on disk and at
least one trigger in `main.ts` — checked by walking `audio.play()` / `audio.sting()` call sites, not by
reading this table. `triumph` is the only one played as a STING over the current track rather than as a
context switch, so a title win does not stop the music the next screen is about to want.

To add a rotation slot, drop `<slot>-2.ogg` beside its `-1` and extend the pool array in `MANIFEST`.

**The three formerly-unrecorded titles were recovered on 2026-09-05** by matching each shipped OGG's exact
byte size against the pack on disk — one unique hit each, so these are identifications rather than guesses:
`bigmatch-1` = *It's Bossin Time* (3. Combat & Action / 1. Combat), `emotional-1` = *The Journey So Far*
(5. Positive Moods / 2. Magical), `scout-1` = *Enter Your Name* (5. Positive Moods / 2. Magical). The track
list is part of the proof-of-rights trail (`docs/licenses/README.md`), so it is now complete.
