// Merging BASE prompt banks with authored EXTRA banks.
//
// The corpus is being authored up to ~30x its original size (PT-404), in parallel, by many authors. If they
// all edited the same bank file they would collide constantly and lose each other's work, so each author
// owns ONE file under ./extra/ and this merges them. Adding a line therefore never touches a file anybody
// else is writing.
export type Bank = Record<string, string[]>;
/** Merge extras into a base bank. Unknown keys in an extra are KEPT — a new moment-kind is a valid thing to
 *  author — and duplicates are dropped case-insensitively, so an author repeating an existing line is a
 *  no-op rather than a repeat the player has to read twice. */
export function mergeBanks(base: Bank, ...extras: Array<Bank | undefined>): Bank {
  const out: Bank = {};
  for (const [k, v] of Object.entries(base)) out[k] = [...v];
  for (const ex of extras) {
    if (!ex) continue;
    for (const [k, lines] of Object.entries(ex)) {
      const seen = new Set((out[k] ?? []).map((l) => l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()));
      const add: string[] = [];
      for (const l of lines) {
        const norm = l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
        if (!norm || seen.has(norm)) continue;
        seen.add(norm); add.push(l);
      }
      out[k] = [...(out[k] ?? []), ...add];
    }
  }
  return out;
}
/** Same, for a flat array bank (BIG_SETTINGS). */
export function mergeList(base: string[], ...extras: Array<string[] | undefined>): string[] {
  const seen = new Set(base.map((l) => l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()));
  const out = [...base];
  for (const ex of extras ?? []) for (const l of ex ?? []) {
    const n = l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    if (!n || seen.has(n)) continue;
    seen.add(n); out.push(l);
  }
  return out;
}
