// A CLUB COLOUR THE GAME COMPUTES MUST REACH A PIXEL, OR IT MUST NOT BE COMPUTED.
//
// `Team.shirtColor` is minted for every club, copied forward by `buildXI`, and the match view ran a
// clash-avoidance routine over it: read both sides' colours, and if they sat within a squared-RGB distance
// of 9000 rewrite the away side's to a stock blue or red — under the comment "guarantee the two kits
// clearly contrast on the pitch even if the clubs' colours are similar". There is no pitch. The 2D engine
// was removed, and the only thing on screen that ever says which side is which is the scoreboard's pair of
// 5px stripes, painted from the FIXED `--home`/`--away` custom properties in index.html. So the routine
// read the field, wrote it back, and nothing anywhere looked at the result — `buildXI` hands the match a
// fresh Team, so the write never even reached the save. Two stylesheet comments vouched for the wire that
// was missing, calling those constants "the two kit colours" and "the kit stripe".
//
// It is the `shortName` shape recorded four lines above this very field's declaration in
// shared/src/types.ts — "required on every club in the game and never once read" — and the `ach_goals`
// shape in field_wiring.ts. It earns a gate of its own because the dead half is a ROUTINE with a comment
// defending it, not a bare field: the next author reads "the two kits clearly contrast", finds a
// working-looking algorithm plus an existing hook, and edits code the screen has never used. That is the
// same trap as the four dead `transition: width` rules (bar_transition.ts) and the transparent `::after`
// (pseudo_paints.ts).
//
// THE RULE IS NOT "never touch shirtColor". It is: client code may read it as much as it likes PROVIDED
// the value reaches a paint. Wiring the stripes to real club colours satisfies this probe; computing a
// colour nothing draws does not. (For the record of anyone who tries: every opponent in the game is minted
// with a LITERAL shirtColor — 0xcc4444 league, 0x8844cc continental, 0x3a7bd5 World Finals — so wiring
// THIS field would paint the away stripe by competition, not by club. `crestColors(name)` in crest.ts is
// the per-club colour that already exists and is already painted.)
//
// SCOPE IS client/ ONLY, deliberately. `shirtColor` is still a persisted field with a legitimate
// copy-forward in the pure engine (`buildXI`, shared/src/teams.ts) — pixels are the client's job, so a
// paint rule applied to shared/ would fail on correct code. Removing the field itself is a separate,
// larger change and is NOT what this gates.
//
// MUTATION TESTS ARE BUILT IN rather than promised, because every assertion here has the shape "N is zero"
// and an assertion over an empty set is worse than none. The detector is run on two fixtures on every
// execution — the exact routine this probe was written to remove (must read as unpainted sites) and a
// hypothetical wired line (must read as painted) — so a matcher that rots goes red here instead of letting
// the tree report clean. The scan also declares how much source it read, and the copy rule self-tests its
// literals, for the same reason.
//
// Run: `npx tsx tools/playtest/kit_colour_reach.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A club colour the game computes reaches a pixel, or it is not computed ===');

// Comments are blanked, not deleted, so reported line numbers stay true to the file. The `(?<!:)` is for
// `https://` — a naive `//` strip blanks the rest of any line holding a URL, and a blanked line is a site
// this probe would then fail to see, which is the one error that would make it worthless.
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .split('\n').map((l) => l.replace(/(?<!:)\/\/.*$/, '')).join('\n');

// ── the detector ─────────────────────────────────────────────────────────────────────────────────────
// A "site" is a property access `.shirtColor`. It counts as PAINTED when the statement around it hands the
// value to CSS or to a canvas. Deliberately narrow: a generous matcher here would call a dead site painted
// and report clean, which is exactly the failure being gated. A future multi-line wiring that trips this
// costs one false alarm a person clears in seconds — the cheap direction.
const PAINT = /setProperty\s*\(|\.style\b|style\s*=|cssText|fillStyle|strokeStyle|toString\(16\)|background/;
type Site = { file: string; line: number; text: string; painted: boolean };
function sitesIn(file: string, src: string): Site[] {
  const lines = strip(src).split('\n');
  const out: Site[] = [];
  lines.forEach((l, i) => {
    if (!/\.shirtColor\b/.test(l)) return;
    // one line either side, because a wiring is often split across the assignment and its argument
    const window = lines.slice(Math.max(0, i - 1), i + 2).join('\n');
    out.push({ file, line: i + 1, text: l.trim().slice(0, 110), painted: PAINT.test(window) });
  });
  return out;
}

// ── 1. THE PREMISE, read from the source rather than assumed, so that wiring the stripes for real turns
// this red FIRST and tells the next author to re-read the probe instead of leaving it quietly forbidding
// a feature that now exists.
const html = readFileSync('client/index.html', 'utf8');
const css = html.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const stripesAreTokens = /#hud #home-name::before[^{}]*\{[^{}]*var\(--home\)/.test(css)
  && /#hud #away-name::before[^{}]*\{[^{}]*var\(--away\)/.test(css);

// RECURSIVE. client/src is flat today; a probe that reads only the top level would go quietly green the
// day someone moves the match view into a subdirectory, which is the shape of failure this file exists for.
const walk = (d: string, out: string[] = []): string[] => {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out); else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
};
const files = walk('client/src');
const sources = files.map((f) => ({ f, src: readFileSync(f, 'utf8') }));
const bytes = sources.reduce((n, s) => n + s.src.length, 0);
console.log(`  ..   ${files.length} client source file(s), ${bytes} bytes scanned`);
// VACUITY FLOOR. If the glob ever misses main.ts, every "is zero" assertion below passes over nothing.
ok(files.length >= 8 && bytes > 200_000, 'the client source was actually read (not a zero-of-zero pass)');

// Does any client code set the two stripe tokens per match? `var(--home)` is a READ and must not count.
const setsTokens = sources.some(({ src }) => /--(?:home|away)\s*:/.test(strip(src))
  || /setProperty\s*\(\s*['"`]--(?:home|away)\b/.test(strip(src)));
const perClub = setsTokens || !stripesAreTokens;
ok(stripesAreTokens, 'the scoreboard stripes are still painted from the fixed --home/--away tokens (the premise)');
console.log(`  ..   client code overrides --home/--away at runtime: ${setsTokens ? 'yes' : 'no'}`);

// ── 2. THE RULE. Every .shirtColor read in the client must reach a paint.
const sites = sources.flatMap(({ f, src }) => sitesIn(f, src));
const unpainted = sites.filter((s) => !s.painted);
console.log(`  ..   ${sites.length} .shirtColor site(s) in client production code, ${sites.length - unpainted.length} reaching a paint`);
for (const s of unpainted) console.log(`       ${s.file}:${s.line}  ${s.text}`);
ok(unpainted.length === 0,
  `no client code computes a club colour nothing draws (${unpainted.length} unpainted .shirtColor site(s))`);

// ── 3. THE DETECTOR ITSELF, against the routine it was written for and against a wired one. Without this
// pair, a broken regex reports an empty tree as clean and the rule above becomes decoration.
const DEAD_FIXTURE = [
  "    if (dist(payload.home.team.shirtColor, payload.away.team.shirtColor) < 9000) {",
  "      payload.away.team.shirtColor = dist(payload.home.team.shirtColor, 0x3b6bd2) > 9000 ? 0x3b6bd2 : 0xd23b3b;",
  "    }",
].join('\n');
const WIRED_FIXTURE = "    hud.style.setProperty('--home', '#' + payload.home.team.shirtColor.toString(16).padStart(6, '0'));";
const deadHits = sitesIn('<fixture>', DEAD_FIXTURE), wiredHits = sitesIn('<fixture>', WIRED_FIXTURE);
ok(deadHits.length === 2 && deadHits.every((h) => !h.painted),
  `the detector still sees the clash routine as unpainted (${deadHits.length} site(s), ${deadHits.filter((h) => h.painted).length} painted)`);
ok(wiredHits.length === 1 && wiredHits[0].painted,
  `and still sees a wired stripe as painted (${wiredHits.length} site(s), ${wiredHits.filter((h) => h.painted).length} painted)`);
// and that a comment can never be a site: the blanking is what stops this file's own prose vouching for it
ok(sitesIn('<fixture>', "    // payload.away.team.shirtColor is rewritten here").length === 0,
  'a commented-out access is not a site (comments are blanked before the scan)');

// ── 4. THE COPY MUST MATCH WHAT THE SCOREBOARD PAINTS. Two stylesheet comments described these fixed
// tokens as the clubs' kits, which is what made the missing wire look present. Blocked as exact literals
// rather than by vocabulary, because the sentence explaining the ban must be allowed to contain the words.
// Asserted only while the stripes ARE fixed: wire them to real club colours and the copy becomes true.
const CLAIMS = ['the two kit colours', 'the kit stripe'];
const claimed = CLAIMS.filter((c) => html.includes(c));
ok(CLAIMS.every((c) => `one plate, the two kit colours identifying the sides / the kit stripe: which side`.includes(c)),
  'the copy blockers still match the sentences that shipped the claim (self-test)');
if (perClub) console.log('  ..   stripes are per-club now — the copy is free to call them kit colours');
else {
  for (const c of claimed) console.log(`       client/index.html still calls the fixed tokens "${c}"`);
  ok(claimed.length === 0, `the stylesheet does not sell the fixed side tokens as the clubs' kits (${claimed.length} claim(s))`);
}

console.log(fails ? `\n✗ ${fails} — the match view computes a colour it never paints`
  : '\n✓ every club colour the client computes reaches the screen, and the copy says what it does');
if (fails) process.exitCode = 1;
