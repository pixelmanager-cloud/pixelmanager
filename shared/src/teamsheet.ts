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

// ── RECONCILING A SAVED SHEET AGAINST A SQUAD THAT HAS CHANGED ───────────────────────────────────────
//
// `pruneXI` kept the surviving ids and COMPACTED them, leaving `duties`, `captainIdx` and `takers` pinned
// to the old slot numbers. Every designation therefore slid onto a different man. A census of the eleven
// paths that mutate the squad found this fires far more often than anyone thought, and the worst instance
// needs no transfer at all:
//
//   `advanceSquadSeason` handed `pruneXI` the RAW club — and the bloodline star is a Token, merged in for
//   reads and never present in `club.players`. So the star counted as dead EVERY SEASON, was evicted from
//   the saved XI every season, and the armband walked to a different man every season. Measured over three
//   seasons with zero squad churn: star ejected 3 of 3, nine of eleven slots rewritten each time, all three
//   set-piece takers reassigned. And the result is a VALID sheet, so nothing anywhere reported it.
//
// Hence two rules. Designations follow the MAN, not the index — so a departure refills that one slot and
// leaves every other slot, and its duty, exactly where it was. And the caller must pass the FIELDABLE
// squad, tokens included; passing the raw club is the bug above.
export interface TeamSheet {
  playerIds: string[];
  duties?: string[];
  captainIdx?: number;
  takers?: { pen?: number; fk?: number; corner?: number };
}

/** Reconcile a saved sheet against the squad that now exists.
 *
 *  Returns the SAME object when nothing needed changing, so a caller's `if (next !== so)` write-skip still
 *  works and a rollover that changed nothing writes nothing. Returns `null` when the sheet cannot be
 *  repaired — too few players, a malformed sheet — in which case the caller must leave the save exactly as
 *  it is and let the editor rebuild, rather than persisting something `validateLineup` would reject.
 *  `pruneXI` used to emit nine-man XIs with a `takers.pen` index past the end of the array. */
export function reconcileSheet<S extends TeamSheet>(
  sheet: S | null | undefined,
  squad: readonly SheetPlayer[],
  isDutyLegal?: (role: string, duty: string) => boolean,
  defaultDutyFor?: (p: SheetPlayer) => string,
): S | null {
  if (!sheet || !Array.isArray(sheet.playerIds) || sheet.playerIds.length !== 11) return null;
  if (squad.length < 11) return null;

  const byId = new Map(squad.map((p) => [p.id, p]));
  const seen = new Set<string>();
  // a duplicate id is a vacancy, not a player: keep the first, refill the rest
  const vacant: number[] = [];
  const ids = sheet.playerIds.map((id, i) => {
    if (byId.has(id) && !seen.has(id)) { seen.add(id); return id; }
    vacant.push(i);
    return '';
  });
  if (!vacant.length) return sheet;                       // nothing changed — same object, by design

  const bench = squad.filter((p) => !seen.has(p.id)).sort((a, b) => b.ovr - a.ovr);
  for (const i of vacant) {
    const out = byId.get(sheet.playerIds[i]);             // undefined when the man has actually left
    const pick = bench.find((p) => !seen.has(p.id) && (!out || p.role === out.role)) ?? bench.find((p) => !seen.has(p.id));
    if (!pick) return null;                               // cannot field eleven — refuse rather than truncate
    seen.add(pick.id);
    ids[i] = pick.id;
  }

  // A DUTY BELONGS TO THE SLOT'S MAN. Untouched slots keep theirs untouched; a refilled slot keeps the old
  // duty only if it is legal for whoever came in.
  const duties = sheet.duties
    ? ids.map((id, i) => {
      const old = sheet.duties![i];
      if (!vacant.includes(i)) return old;
      const p = byId.get(id) ?? squad.find((q) => q.id === id)!;
      return old && (!isDutyLegal || isDutyLegal(p.role, old)) ? old : (defaultDutyFor ? defaultDutyFor(p) : old);
    })
    : undefined;

  // The armband and the set-piece takers follow the MAN. If he has left, the designation is DROPPED rather
  // than handed to whoever happens to occupy his old slot — `buildXI` already falls back to the best leader,
  // and an empty captain slot asks the manager a question instead of inventing an answer for him.
  const idxOfMan = (slot?: number): number | undefined => {
    if (slot == null) return undefined;
    const man = sheet.playerIds[slot];
    const at = ids.indexOf(man);
    return at >= 0 ? at : undefined;
  };
  const takers = sheet.takers
    ? { pen: idxOfMan(sheet.takers.pen), fk: idxOfMan(sheet.takers.fk), corner: idxOfMan(sheet.takers.corner) }
    : undefined;

  return {
    ...sheet,
    playerIds: ids,
    ...(duties ? { duties } : {}),
    captainIdx: idxOfMan(sheet.captainIdx),
    ...(takers && (takers.pen != null || takers.fk != null || takers.corner != null) ? { takers } : { takers: undefined }),
  } as S;
}
