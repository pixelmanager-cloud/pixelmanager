// Pure rules for the PRO-token season-rollover lifecycle. The DB-touching orchestration
// (bumpMorale / advanceTokensAtRollover / bumpApps) stays in server/src/lifecycle.ts and
// calls these — see that file for the season-rollover story.

// Stats the manager can develop post-graduation (physical/technical). Mentals + durability are
// career-forged identity and stay fixed. Physical stats are capped by the player's genes ceiling;
// other developable stats cap at 18 so elite 19-20 remains something only the Career game produces.
const DEVELOPABLE = ['pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate', 'keeping', 'setPiece'] as const;
const PHYSICAL = new Set(['pace', 'strength', 'stamina']);
const clampStat = (v: number) => Math.max(1, Math.min(20, Math.round(v * 10) / 10));

/** Age at which a PRO token retires (legacy keepsake + testimonial), same token stays owned. */
export const RETIREMENT_AGE = 40;

/** Deterministic post-graduation development (the "Finisher" model): a young pro grows toward his
 *  ceiling, an old one declines — driven by the Training facility. Late curve tuned for the 25→40
 *  pro window: 25–31 growth, 32–34 prime plateau, 35+ decline (physical fades fastest). */
export function developAttrs(attrs: any, genes: any, age: number, trainingLvl: number): any {
  const tf = 0.55 + 0.12 * (Math.max(1, trainingLvl) - 1); // training 1 → 0.55 … 5 → 1.03
  const out = { ...attrs };
  for (const s of DEVELOPABLE) {
    const v = out[s];
    if (typeof v !== 'number') continue;
    // A ceiling for ANY stat, not just physical ones. Career genes only define physical ceilings, so this
    // is identical for the bloodline star — but it lets a SQUAD player carry a role-shaped ceiling, which
    // is what stops a centre-half's goalkeeping climbing to 18 and the whole squad converging on one
    // statline. (PT-603)
    const ceil = genes?.[s]?.ceiling ?? 18;
    if (age <= 31) { // GROWTH — a real ~7-season runway toward the ceiling
      const room = ceil - v;
      if (room > 0.05) out[s] = clampStat(v + Math.min(room, 0.45 * tf * (0.4 + 0.6 * Math.min(1, room / 5))));
    } else if (age >= 35) { // DECLINE — physical fades faster; good training slows it
      const rate = (PHYSICAL.has(s) ? 0.6 : 0.3) * (age - 34) * (1.15 - 0.06 * Math.max(1, trainingLvl));
      out[s] = clampStat(v - rate);
    } // 32–34: prime plateau
  }
  return out;
}
