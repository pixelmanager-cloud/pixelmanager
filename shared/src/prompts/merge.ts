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
  // ONE dedupe set per key, built on that key's first touch and kept. It used to be rebuilt from the whole
  // accumulated bank once per (pack x key), with the merged array reallocated alongside it — quadratic in
  // pack count, and every mergeBanks call in the game runs at MODULE SCOPE, so all of it lands on a cold
  // start with no network wait to hide it behind: KIND_SETUP's 18 authored packs normalised 26,652 lines
  // to place 10,205. The corpus is still being authored up ~30x (above), so that gets worse, not flat.
  // Same shape as mergeList below. The ORDER is unchanged and must stay unchanged — it is what decides
  // which line a seed draws, so a cheaper merge that moves a line is a content regression, not a fix
  // (tools/playtest/merge_bank_cost.ts asserts both halves).
  const seenByKey = new Map<string, Set<string>>();
  for (const ex of extras) {
    if (!ex) continue;
    for (const [k, lines] of Object.entries(ex)) {
      let seen = seenByKey.get(k);
      if (!seen) {
        out[k] = out[k] ?? [];                  // an extra may introduce a key the base never had
        seen = new Set(out[k].map((l) => l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()));
        seenByKey.set(k, seen);
      }
      for (const l of lines) {
        const norm = l.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
        if (!norm || seen.has(norm)) continue;
        seen.add(norm); out[k].push(l);
      }
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

// ── INDEFINITE ARTICLES IN AUTHORED LINES ─────────────────────────────────────────────────────────
//
// An author writing a bank line only ever sees ONE value in the slot, so the article gets baked into the
// sentence: 'Someone in a {team} shirt eventually settles it {zone}.' 23 of the 108 clubs in LEAGUE_POOL
// begin with a vowel — measured, 21.3% — so better than one draw in five printed "Someone in a Ashcombe
// Town shirt" at the player. That line sits in loose_ball, the largest authored bank in the game (499
// deduped lines) fed by ~114 events a match, so it is on screen in most saves.
//
// Hand-correcting the offending lines was rejected: it fixes today's two ('a {team} shirt' in commentary,
// '{p} is a {club} player.' in the manager bank) and none of tomorrow's, and the club name does not exist
// until substitution anyway. So the FILLERS repair the article and authors go on writing 'a {club}'.
/** 'a' or 'an' for the word that follows. Spelling-based, with the two traps that actually bite English:
 *  the "yoo-" vowels (a United side, a European tie) and the silent h's (an hour). Deliberately NOT a
 *  pronunciation dictionary — what lands in these slots is club and person names, and the exception list
 *  is checked against LEAGUE_POOL: all 108 names come out right. */
export function indefiniteArticle(word: string): 'a' | 'an' {
  const w = String(word).replace(/^[^\p{L}\p{N}]+/u, '');            // strip a leading quote or emoji
  if (!w) return 'a';
  if (/^(?:hour|honest|honou?r|heir)/i.test(w)) return 'an';
  // unit/unio/unif/uniq/univ rather than a bare 'uni', or 'an unimportant' would come out as 'a'.
  if (/^(?:eu|ewe|onc|one|u(?:nit|nio|nif|niq|niv|se|su|ti|k|r[aeiou]))/i.test(w)) return 'a';
  return /^[aeiou]/i.test(w) ? 'an' : 'a';
}
/** Substitute `{token}` placeholders AND fix the indefinite article standing in front of one. `sub`
 *  returns the replacement for a token name, or undefined to leave the placeholder alone — an author's
 *  typo has to stay visible in review instead of silently eating half a sentence, which is what both
 *  fillers already did and must keep doing. The author's capitalisation carries over, so a line opening
 *  'A {team}' opens 'An Eastgate FC'. The character before the article is matched and re-emitted so that
 *  'Milan {team}' is not read as an article. */
export function fillTokens(line: string, sub: (key: string) => string | undefined): string {
  return line.replace(
    /(^|[^\p{L}\p{N}])([Aa]n?) \{(\w+)\}|\{(\w+)\}/gu,
    (m: string, pre: string | undefined, art: string | undefined, artKey: string | undefined, bareKey: string | undefined) => {
      const val = sub((artKey ?? bareKey) as string);
      if (val == null) return m;
      if (art == null) return val;
      const fixed = indefiniteArticle(val);
      return `${pre ?? ''}${art[0] === 'A' ? fixed[0].toUpperCase() + fixed.slice(1) : fixed} ${val}`;
    },
  );
}
