// ── STANDING ORDERS ARE THE MANAGER'S INTENT ─────────────────────────────────────────────────────────
//
// Extracted from `openLineup` so it can be tested. It lived inside a DOM-coupled method, which is why the
// defect below shipped and why a source-grep probe could not see it.
//
// The bug: XI validity was checked against AVAILABLE players, so one injury made the whole saved sheet
// "invalid" and the editor rebuilt it from `autoPickXI` — throwing away the eleven duties, the captain and
// the three set-piece takers. Harmless while nothing persisted the rebuild; once kicking off started saving
// the sheet, the same fallback began COMMITTING the wipe. Measured over one season: an injury on matchday 2,
// none afterwards, and 0 of the 17 remaining matchdays opened with the manager's own sheet.
//
// The model: squad MEMBERSHIP decides whether a saved sheet is still meaningful. AVAILABILITY is a
// per-match concern — substitute that one slot for today and put the manager's man back when saving.
export interface SheetPlayer { id: string; role: string; ovr: number }

/** Who was covered for, and who came in. Storing BOTH is load-bearing: a slot-indexed map of
 *  "who the manager picked" is captured once when the editor opens and is not invalidated when the manager
 *  then edits that slot by hand, presses Autopick, or changes formation — so saving wrote the injured man
 *  back over whoever he actually chose, and in the Autopick case dropped a fit player entirely. Recording
 *  the stand-in lets the save hand a slot back ONLY if the stand-in is still standing in it. */
export interface Cover { out: string; in: string }

export interface ResolvedXI {
  /** who actually takes the field today */
  ids: string[];
  /** slot index -> who was covered for, and by whom */
  subs: Map<number, Cover>;
  /** false when the saved sheet no longer describes this squad at all and must be rebuilt */
  usable: boolean;
}

/** Resolve a saved XI against today's squad. `squad` is everyone owned; `available` is who can play. */
export function resolveMatchXI(savedIds: readonly string[], squad: readonly SheetPlayer[], available: readonly SheetPlayer[]): ResolvedXI {
  const subs = new Map<number, Cover>();
  const squadIds = new Set(squad.map((p) => p.id));
  if (savedIds.length !== 11 || !savedIds.every((id) => squadIds.has(id))) return { ids: [], subs, usable: false };

  const availIds = new Set(available.map((p) => p.id));
  const used = new Set(savedIds.filter((id) => availIds.has(id)));
  const ids = savedIds.map((id, i) => {
    if (availIds.has(id)) return id;
    const out = squad.find((p) => p.id === id);
    const bench = available
      .filter((p) => !used.has(p.id))
      .sort((a, b) => (Number(b.role === out?.role) - Number(a.role === out?.role)) || (b.ovr - a.ovr))[0];
    if (!bench) return id;              // nobody to bring in — leave the slot rather than corrupt the sheet
    subs.set(i, { out: id, in: bench.id });
    used.add(bench.id);
    return bench.id;
  });
  return { ids, subs, usable: true };
}

/** What to SAVE after a match: today's XI, with a covered slot handed back to the manager's own pick ONLY
 *  if the stand-in is still in it. If the manager has since edited that slot himself — by hand, by Autopick
 *  or by changing formation — his choice stands, which is the whole point of it being his sheet. */
export function intentOf(todaysIds: readonly string[], subs: ReadonlyMap<number, Cover>): string[] {
  return todaysIds.map((id, i) => { const c = subs.get(i); return c && c.in === id ? c.out : id; });
}
