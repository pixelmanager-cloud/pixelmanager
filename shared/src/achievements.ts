// ── Achievements — deterministic milestone definitions evaluated from existing game data ─────────────
// Pure + presentational: no rng, no engine effects. The client assembles an AchSnapshot from what it
// already tracks (honours, prestige, legends, dynasty generation, cup/international runs) and calls
// evaluateAchievements() to see which are earned. Unlock state is persisted client-side per save. The
// stable string `id`s are chosen so a future Steamworks integration can map 1:1 onto them.

/** A snapshot of the save's lifetime progress — everything the achievement predicates read. All fields
 *  default to 0 so a partially-populated snapshot never throws. */
export interface AchSnapshot {
  leagueTitles: number;   // domestic league titles won
  contTitles: number;     // continental cup wins
  wcWins: number;         // World Finals won
  wcFinals: number;       // World Finals finals reached (won or lost)
  seasons: number;        // seasons managed (lifetime)
  wins: number;           // lifetime league match wins
  prestigeIdx: number;    // manager prestige rank index (0..8)
  generation: number;     // highest bloodline generation reached (0 = founder)
  legends: number;        // legends in the Hall (one per retirement)
  topLegendRating: number;// best single legend rating earned
  graduated: number;      // prospects developed all the way to a graduated pro
  topTier: number;        // highest division index reached (0 = the basement … TIERS-1 = the top flight)
  /** Divisions climbed since the club was FOUNDED. `topTier` is absolute, and a founding club is seeded
   *  mid-pyramid from the founder's career score — so "Win promotion out of your starting division" was
   *  true before a ball was kicked, and a strong founding career also false-fired "Climbing the Pyramid". */
  promotions: number;
}

export interface Achievement {
  id: string;             // stable — maps to a Steamworks API name later
  name: string;
  desc: string;
  icon: string;           // emoji, used until real art exists
  hidden?: boolean;       // don't show the description until earned (kept for future secret achievements)
  test: (s: AchSnapshot) => boolean;
}

/** The milestone set (~20), grouped by theme. Ordered roughly easy→hard within a theme so the screen reads
 *  as a ladder. Predicates read only AchSnapshot, so they're trivially unit-testable + deterministic. */
export const ACHIEVEMENTS: readonly Achievement[] = [
  // — the first steps —
  { id: 'first_graduate',   name: 'The First of Many',     desc: 'Develop a prospect all the way to a graduated pro.',            icon: '🎓', test: (s) => s.graduated >= 1 },
  { id: 'first_win',        name: 'Off the Mark',          desc: 'Win your first league match as a manager.',                    icon: '✅', test: (s) => s.wins >= 1 },
  // — domestic glory —
  { id: 'first_title',      name: 'Champions',             desc: 'Win your first domestic league title.',                        icon: '🏅', test: (s) => s.leagueTitles >= 1 },
  { id: 'title_treble',     name: 'A Dynasty Forms',       desc: 'Win 3 domestic league titles.',                                icon: '🏅', test: (s) => s.leagueTitles >= 3 },
  { id: 'title_dynasty',    name: 'Kings of the League',   desc: 'Win 10 domestic league titles.',                               icon: '👑', test: (s) => s.leagueTitles >= 10 },
  // — the pyramid climb (every bloodline starts in the basement) —
  { id: 'first_promotion',  name: 'Up We Go',              desc: 'Win promotion out of your starting division.',                 icon: '⬆️', test: (s) => s.promotions >= 1 },
  { id: 'climb_half',       name: 'Climbing the Pyramid',  desc: 'Reach the middle tiers of the football pyramid.',               icon: '⛰️', test: (s) => s.promotions >= 4 },
  { id: 'top_flight',       name: 'The Big Time',          desc: 'Take the club all the way to the top flight.',                  icon: '🏟️', test: (s) => s.topTier >= 9 },
  // — continental —
  { id: 'cont_win',         name: 'Kings of the Continent',desc: 'Win the Continental Cup.',                                     icon: '🌍', test: (s) => s.contTitles >= 1 },
  { id: 'cont_treble',      name: 'Continental Force',     desc: 'Win the Continental Cup 3 times.',                             icon: '🌍', test: (s) => s.contTitles >= 3 },
  // — international —
  { id: 'wc_final',         name: 'On the Biggest Stage',  desc: 'Reach a World Finals final.',                                   icon: '🌐', test: (s) => s.wcFinals >= 1 },
  { id: 'wc_win',           name: 'Champions of the World',desc: 'Win the World Finals.',                                        icon: '🏆', test: (s) => s.wcWins >= 1 },
  // — the bloodline (the differentiator) —
  { id: 'first_legend',     name: 'A Legend Retires',      desc: 'Retire your first player into the Hall of Legends.',            icon: '⭐', test: (s) => s.legends >= 1 },
  { id: 'gen_two',          name: 'The Line Continues',    desc: 'Carry the bloodline into a second generation.',                 icon: '🌳', test: (s) => s.generation >= 1 },
  { id: 'gen_three',        name: 'A True Dynasty',        desc: 'Reach the third generation of the bloodline.',                  icon: '🌳', test: (s) => s.generation >= 2 },
  { id: 'gen_five',         name: 'Football Royalty',      desc: 'Reach the fifth generation — a family woven into the game.',     icon: '👑', test: (s) => s.generation >= 4 },
  { id: 'legends_hall',     name: 'A Hall of Greats',      desc: 'Retire 5 legends into the Hall.',                               icon: '🖼️', test: (s) => s.legends >= 5 },
  { id: 'immortal',         name: 'Immortal',              desc: 'Produce a legend rated 90 or higher.',                          icon: '💫', test: (s) => s.topLegendRating >= 90 },
  // — the long game —
  { id: 'seasons_ten',      name: 'A Decade in the Dugout',desc: 'Manage 10 seasons.',                                            icon: '📅', test: (s) => s.seasons >= 10 },
  { id: 'seasons_fifty',    name: 'A Life in Football',    desc: 'Manage 50 seasons.',                                            icon: '📅', test: (s) => s.seasons >= 50 },
  // The number in each prestige test is an INDEX INTO PRESTIGE_LEVELS (prestige.ts), so it must be the
  // index of the rank the achievement is NAMED after: 3 Established Manager, 6 Elite Manager, 8 Immortal
  // Gaffer. 'The Immortal Gaffer' tested >= 7, which is 'Footballing Legend' — it toasted "the highest
  // manager prestige rank" a full rank early, and then crossing the real top rank at 16,000 points, the
  // longest grind in the game, unlocked nothing at all. 'Elite Company' was off by one the same way (idx 5
  // is 'Trophy Winner'). The thresholds live here and the rank titles live in prestige.ts, so nothing stops
  // them drifting apart again silently — tools/playtest/prestige_capstone.ts now pairs each threshold back
  // to the rank title it actually fires on. Raising these does not un-earn anything: the client's unlock
  // set is append-only (main.ts saveUnlockedAch), so a save that already banked one keeps it.
  { id: 'prestige_mid',     name: 'Established Name',       desc: 'Reach an established manager prestige rank.',                    icon: '📈', test: (s) => s.prestigeIdx >= 3 },
  { id: 'prestige_elite',   name: 'Elite Company',         desc: 'Reach an elite manager prestige rank.',                         icon: '📈', test: (s) => s.prestigeIdx >= 6 },
  { id: 'prestige_immortal',name: 'The Immortal Gaffer',   desc: 'Reach the highest manager prestige rank.',                      icon: '🐐', test: (s) => s.prestigeIdx >= 8 },
] as const;

/** Which achievement ids the snapshot currently satisfies (earned-or-not is a pure function of progress). */
export function evaluateAchievements(s: AchSnapshot): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(s)).map((a) => a.id);
}

/** Look up a definition by id (for rendering an unlock toast). */
export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
