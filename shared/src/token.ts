// The UNIFIED, fixed-supply NFT save-record shape — one persistent id through the whole
// lifecycle (prospect→pro→retired→reborn). All lifecycle state lives on this one row.
// Moved out of server/src/store.ts (phase 1 offline migration) since it's the save-record
// shape both the deterministic career engine and the server's Store persist.
export interface Token {
  id: string; owner_id: string; generation: number; state: 'prospect' | 'pro' | 'retired'; name: string;
  genes_json: string; pedigree: number; dev_bonus_json: string;
  career_seed: number | null; agent_id: string | null; track: string | null; career_actions: string | null;
  attrs_json: string | null; role: string | null; traits_json: string | null; personality: string | null;
  greed: number | null; marketability: number | null; earnings: number | null; prime_season: number | null; peak_overall: number;
  signed_season: number | null; length_seasons: number | null; staked_since: number | null;
  ach_seasons: number; ach_apps: number; ach_league: number; ach_cup: number; ach_promotions: number; ach_tier: number; morale: number;
  ach_goals: number; ach_assists: number; ach_potm: number;
  kit_json: string | null;   // cosmetic kit & identity (number, boots, celebration, nickname) — carries to the pro
}
