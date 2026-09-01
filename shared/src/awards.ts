// ── SEASON AWARDS — who actually won something, derived from what happened ───────────────────────────
//
// The `Award` row and its two store methods (`addAward`, `awardsFor`) have existed since the server era
// and NOTHING EVER CALLED THEM — the same four-pieces-no-wires shape `matchstats` was in. They stayed
// uncallable for a simpler reason than usual: there was no per-player season data to derive an award
// FROM. `deriveMatchStats` was itself unwired, so nobody knew who had scored.
//
// With match stats now recorded at full time, the data exists and these become derivable. Pure and
// deterministic: same rows in, same winners out, no rng and no clock.
//
// TIES ARE BROKEN DELIBERATELY, not left to array order. A season where two strikers finish level on
// goals is common, and `player_id` is a stable, seeded identity, so ordering by it is reproducible across
// runs and platforms — where relying on the order `seasonPlayerStats` happened to return would not be.
import type { PlayerSeasonStat, Award } from './gamestore.js';

export type AwardKind = 'golden_boot' | 'playmaker' | 'player_of_season' | 'ever_present';

export const AWARD_LABEL: Record<AwardKind, string> = {
  golden_boot: 'Golden Boot',
  playmaker: 'Playmaker of the Season',
  player_of_season: 'Player of the Season',
  ever_present: 'Ever Present',
};

/** The stat each award is won on, and the floor below which it is not worth giving. A Golden Boot for
 *  two goals is not an honour, and handing them out in a season nobody performed cheapens every real one. */
const AWARD_SPEC: Array<{ kind: AwardKind; stat: keyof PlayerSeasonStat; min: number }> = [
  { kind: 'golden_boot', stat: 'goals', min: 5 },
  { kind: 'playmaker', stat: 'assists', min: 4 },
  { kind: 'player_of_season', stat: 'potm', min: 3 },
  { kind: 'ever_present', stat: 'apps', min: 18 },
];

/** Decide a season's awards from its per-player rows. Returns [] when nobody clears a threshold, which is
 *  a real outcome for a bad season and not an error. */
export function seasonAwards(
  rows: PlayerSeasonStat[],
  ctx: { seasonId: string; seasonNumber: number; tier: string; accountId: string; awardedAt: number },
): Award[] {
  const out: Award[] = [];
  for (const spec of AWARD_SPEC) {
    let best: PlayerSeasonStat | null = null;
    for (const r of rows) {
      const v = Number(r[spec.stat] ?? 0);
      if (!Number.isFinite(v) || v < spec.min) continue;
      const bv = best ? Number(best[spec.stat] ?? 0) : -Infinity;
      // stable tie-break on the seeded player id, so two men level on goals resolve the same way every run
      if (v > bv || (v === bv && best != null && r.player_id < best.player_id)) best = r;
    }
    if (!best) continue;
    out.push({
      season_id: ctx.seasonId, season_number: ctx.seasonNumber, tier: ctx.tier,
      pod: 0, // dead server-era field, kept so the stored row still matches the declared type
      kind: spec.kind, account_id: ctx.accountId,
      player_id: best.player_id, player_name: best.player_name,
      value: Number(best[spec.stat] ?? 0), awarded_at: ctx.awardedAt,
    });
  }
  return out;
}
