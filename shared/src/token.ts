// The UNIFIED, fixed-supply NFT save-record shape — one persistent id through the whole
// lifecycle (prospect→pro→retired→reborn). All lifecycle state lives on this one row.
// Moved out of server/src/store.ts (phase 1 offline migration) since it's the save-record
// shape both the deterministic career engine and the server's Store persist.
export interface Token {
  id: string; owner_id: string; generation: number; state: 'prospect' | 'pro' | 'retired'; name: string;
  genes_json: string; pedigree: number; dev_bonus_json: string;
  career_seed: number | null; agent_id: string | null; track: string | null; career_actions: string | null;
  /** How many actions `career_actions` was LAST WRITTEN with.
   *
   *  A physically truncated array — a partial write, an aborted quota write, a half-synced cloud save —
   *  replays perfectly: every action that survived applies, so `applied === actions.length` and the career
   *  reports full health while sitting at turn 61 of 120. There is nothing to compare the array against
   *  without a count held OUTSIDE it. Measured: 8 of 8 careers truncated to half length loaded with no
   *  shortfall reported, and `careerAct` then appended onto the shortened record.
   *
   *  Optional, so saves written before it exists simply opt out of the check rather than being condemned. */
  career_action_count?: number;
  attrs_json: string | null; role: string | null; traits_json: string | null; personality: string | null;
  greed: number | null; marketability: number | null; earnings: number | null; prime_season: number | null; peak_overall: number;
  signed_season: number | null; length_seasons: number | null; staked_since: number | null;
  ach_seasons: number; ach_apps: number; ach_league: number; ach_cup: number; ach_promotions: number; ach_tier: number; morale: number;
  ach_goals: number; ach_assists: number; ach_potm: number;
  kit_json: string | null;   // cosmetic kit & identity (number, boots, celebration, nickname) — carries to the pro
  // WHAT HIS PLAYING CAREER ACTUALLY WAS. "A Continental Final" was only ever a string in a big-moments
  // list and international caps existed only as a derived block on the live career state — Career stored no
  // honours and graduatedFields wrote none, so the moment a career ended every headline it produced was
  // gone and nothing downstream COULD read them. The bloodline tree, the legend card and the heir's
  // pedigree all want this. (PT-955)
  career_honours_json: string | null;
  /** THE FOREST EDGE. A dynasty is a tree, not a chain: each generation produces 1-3 heirs and the player
   *  may later continue from a brother he passed over. `parent_id` is the heir's father. Null for the
   *  founder, and for the PLAYED line, which reuses its token id so the legend chain (:g<gen> snapshots)
   *  keeps working — siblings are new tokens hanging off that id. */
  parent_id?: string | null;
  /** 'played' = a line the player has taken; 'sibling' = a brother who exists but was not chosen. A sibling
   *  is a FULL player (mintSquadPlayer) who ages, can be signed, and can father the next generation. */
  branch?: 'played' | 'sibling';
  /** An unplayed brother's own heir seed, kept so his sons can be derived at the NEXT succession. It cannot
   *  be recomputed from his father: the played line reuses its token id and `career_seed` is overwritten
   *  each generation, so by the time the nephews are due the derivation is gone. */
  branch_seed?: number;
  /** Whose son he is, for the succession screen — "Dane's boy" is the whole point of a cousin appearing. */
  father_name?: string;
}
