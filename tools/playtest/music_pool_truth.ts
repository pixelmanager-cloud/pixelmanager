// THE MATCH-MUSIC COMMENT MUST BE TRUE ABOUT THE FILES ON DISK AND ABOUT play().
//
// The MANIFEST comment above `match:` in audio.ts read "The pool is now 494s, which is 1.1 loops per
// match: effectively no repeat within a fixture." Both halves were false. The three Oggs measure 73.6s /
// 148.0s / 134.1s — 355.7s, not 494s — and play() does not play them as a sequence at all: it picks ONE
// entry, sets `loop = true`, and nothing re-enters the 'match' context mid-fixture, so a fixture hears one
// track 7.3, 3.6 or 4.0 times over. The comment described the repetition as SOLVED on the game's most
// repeated screen, which is exactly the reader it would mislead.
//
// Three things are checked, because a comment can lie in more than one way:
//   NUMBERS — every duration the block states must be a quantity that actually exists (a track's length,
//   the pool's sum, or a fixture's real-time length), and every loop count must be a fixture divided by a
//   real track. Read from the Ogg headers, not from a table someone maintains by hand.
//   MECHANISM — while play() picks one url and loops it, the block may not claim the pool removes
//   in-fixture repeats or that the deck advances. The ban is GATED on the code: if the deck is ever given
//   an advance-on-ended (F-221, the open half, §101), the premise assertions go red naming the change and the
//   ban stops running, rather than forbidding prose about behaviour that has arrived.
//   LENGTH — and since one entry is looped for the whole fixture, the pool may not contain a bed short
//   enough to grind. This is the half §101 acted on: match-1.ogg was 73.6s, 7.3 loops of one phrase in a
//   540s fixture, and CK dropped it from the pool. The rule is stated as a length, not as a filename, so a
//   future short track is caught the same way rather than only the one we already know about.
//
// SCOPE: the `match:` comment block only. The header above MANIFEST and the other contexts carry their own
// prose, and widening this would produce a red that this probe cannot explain in one sentence.
//
// Run: `npx tsx tools/playtest/music_pool_truth.ts`
import { readFileSync, readdirSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const audio = readFileSync('client/src/audio.ts', 'utf8');
const main = readFileSync('client/src/main.ts', 'utf8');
const engine = readFileSync('shared/src/engine.ts', 'utf8');

console.log('=== The match-music comment states real durations ===');

/** Seconds of an Ogg Vorbis file: last page's granule position / the identification header's sample rate.
 *  Exact (it is the decoder's own sample count), and needs no ffprobe on the box running the gate. */
function oggSeconds(path: string): number {
  const buf = readFileSync(path);
  const id = buf.indexOf(Buffer.from([0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73])); // "\x01vorbis"
  const rate = id >= 0 ? buf.readUInt32LE(id + 12) : 0;                            // +12 = audio_sample_rate
  const page = buf.lastIndexOf(Buffer.from('OggS'));
  const granule = page >= 0 ? Number(buf.readBigUInt64LE(page + 6)) : 0;
  return rate > 0 ? granule / rate : 0;
}

/** The urls of one MANIFEST context, and the `//` block sitting directly above it. */
function contextOf(key: string): { urls: string[]; comment: string; lines: number } {
  const at = audio.search(new RegExp(`^  ${key}: \\[`, 'm'));
  if (at < 0) return { urls: [], comment: '', lines: 0 };
  const line = audio.slice(at, audio.indexOf('\n', at));
  const urls = [...line.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const before = audio.slice(0, at).split('\n');
  before.pop();                                   // the slice ends on the newline, so the tail is empty
  const block: string[] = [];
  for (let i = before.length - 1; i >= 0 && /^\s*\/\//.test(before[i]); i--) block.unshift(before[i]);
  return { urls, comment: block.map((l) => l.replace(/^\s*\/\/ ?/, '')).join(' ').replace(/\s+/g, ' '), lines: block.length };
}

const match = contextOf('match');
const big = contextOf('bigmatch');
ok(match.urls.length === 2, `the match pool still holds its two tracks (found ${match.urls.length})`);
// VACUITY GUARD. If the block-scrape breaks, `comment` empties and every filter below passes over nothing —
// the zero-of-zero green. Mutation-tested by stripping the block: the count reads 0 and three go red here.
console.log(`  ..   ${match.lines} comment line(s) read above match:, ${match.comment.length} chars`);
ok(match.lines >= 5, "the match: comment block was actually read (not a zero-of-zero pass)");

const secs = (u: string) => oggSeconds('client/public' + u);   // MANIFEST urls are site-root ('/audio/x.ogg')
const pool = match.urls.map(secs);
const bigPool = big.urls.map(secs);
// A DURATION THE COMMENT NAMES MAY BELONG TO A FILE THAT IS ON DISK BUT OUT OF THE POOL. §101 dropped
// match-1.ogg from `match:` and deliberately KEPT the file, and the block has to be able to say how long it
// was and how hard it looped — that is the entire reason it was dropped. Scoped to match-*.ogg actually
// present in the drop folder, so the invented-number check below still refuses a duration nobody can point
// at; it does not turn into "any number goes".
const onDisk = readdirSync('client/public/audio').filter((n) => /^match-\d+\.ogg$/.test(n))
  .map((n) => oggSeconds('client/public/audio/' + n));
ok(pool.length > 0 && pool.every((d) => d > 1), `every match track was decoded (${pool.map((d) => d.toFixed(1)).join(' / ')}s)`);
ok(bigPool.length > 0 && bigPool.every((d) => d > 1), `and every bigmatch track (${bigPool.map((d) => d.toFixed(1)).join(' / ')}s)`);
const sum = pool.reduce((a, b) => a + b, 0);

// A fixture's REAL-TIME length, derived from the two places that set it rather than restated here: the
// engine's full-time whistle, and the clock main.ts advances per real second at each speed button.
const matchSec = Number((engine.match(/const MATCH_SEC = (\d+) \* (\d+);/) ?? [])[1] ?? 0)
               * Number((engine.match(/const MATCH_SEC = (\d+) \* (\d+);/) ?? [])[2] ?? 0);
const perSec = Number((main.match(/this\.accum \+= \(dMs \/ 1000\) \* (\d+) \* this\.speed;/) ?? [])[1] ?? 0);
const speeds = [...main.matchAll(/setSpeed\((\d+), 'spd\d+'\)\)/g)].map((m) => Number(m[1]));
ok(matchSec === 5400 && perSec === 10 && speeds.length >= 3,
   `full-time is ${matchSec} game-seconds at ${perSec}/s real, speeds ${speeds.join('/')} — a fixture is ${(matchSec / perSec).toFixed(0)}s at 1x`);
const fixtures = speeds.map((s) => matchSec / perSec / s);   // 540 / 135 / 45

const TOL_S = 0.5;      // the comment quotes to 1 dp; anything further out is a different number
const TOL_LOOPS = 0.1;
const legalSecs = [...pool, sum, ...bigPool, ...fixtures, ...onDisk];
const legalLoops = [...pool, ...bigPool, ...onDisk].map((d) => (matchSec / perSec) / d);
const near = (v: number, set: number[], tol: number) => set.some((x) => Math.abs(x - v) <= tol);

// Only a number carrying a SECONDS unit ("355.7s", "74-second"). "10 game-seconds per real second" and
// "TICK_SEC 0.5" are prose about the clock, not durations, and must not be dragged in here.
const claimedSecs = [...match.comment.matchAll(/(\d+(?:\.\d+)?)(?:\s*s\b|-second)/g)].map((m) => Number(m[1]));
const claimedLoops = [...match.comment.matchAll(/(\d+(?:\.\d+)?)\s*(?:loops?|times)\b/g)].map((m) => Number(m[1]));
console.log(`  ..   ${claimedSecs.length} duration(s) and ${claimedLoops.length} loop count(s) claimed; pool sums to ${sum.toFixed(1)}s`);
ok(claimedSecs.length >= 3, 'durations were actually parsed out of the comment (not a zero-of-zero pass)');
ok(claimedLoops.length >= 1, 'and at least one loop count (not a zero-of-zero pass)');

const badSecs = claimedSecs.filter((v) => !near(v, legalSecs, TOL_S));
for (const v of badSecs) console.log(`       ${v}s — no track, pool sum (${sum.toFixed(1)}s) or fixture (${fixtures.map((f) => f.toFixed(0)).join('/')}s) is that long`);
ok(badSecs.length === 0, `every duration the comment states exists on disk (${badSecs.length} invented)`);

const badLoops = claimedLoops.filter((v) => !near(v, legalLoops, TOL_LOOPS));
for (const v of badLoops) console.log(`       ${v} loops — real per-track counts are ${legalLoops.map((l) => l.toFixed(1)).join(', ')}`);
ok(badLoops.length === 0, `every loop count is a fixture over a real track (${badLoops.length} invented)`);

console.log('\n=== ...and no bed in the pool is short enough to grind ===');

// THE POOL DECIDES WHICH BED A FIXTURE GETS, NOT HOW OFTEN IT COMES ROUND — so the shortest entry sets the
// worst experience the game can hand a player, and no amount of rotation dilutes it. match-1.ogg at 73.6s
// was 7.3 loops of one phrase inside a 540s fixture and landed on about a third of them; the two that
// stayed are 3.6 and 4.0, which is ordinary game music. The ceiling is five, deliberately between those two
// clusters: four would fail match-3 by 0.03 of a loop, which is not a difference anyone can hear, and the
// number being excluded is 7.3. Loops, not seconds, because the fixture length is read from the engine — if
// full-time or the clock rate moves, the bar moves with it.
const MAX_LOOPS = 5;
const loops1x = pool.map((d) => (matchSec / perSec) / d);
// VACUITY GUARD. every() over an empty pool is the zero-of-zero green. The pool-size assertion above goes
// red first if the scrape breaks; this line then reports 0 tracks rather than a silent pass. Mutation-tested
// by putting '/audio/match-1.ogg' back in `match:` — this goes red at 7.3 loops.
console.log(`  ..   ${pool.length} pool track(s), worst ${(pool.length ? Math.max(...loops1x) : 0).toFixed(2)} loops per fixture against a ceiling of ${MAX_LOOPS}`);
ok(pool.length >= 2 && loops1x.every((l) => l <= MAX_LOOPS),
   `every match bed survives a fixture in ${MAX_LOOPS} loops or fewer (${loops1x.map((l) => l.toFixed(1)).join(' / ')})`);

console.log('\n=== ...and about what play() does with the pool ===');

// THE PREMISE, read from the code rather than assumed. If this goes false the ban below stops running.
const play = audio.slice(audio.indexOf('  play(context: MusicContext): void {'), audio.indexOf('/** Fade the new deck in'));
ok(play.length > 200, 'play() was located in audio.ts');
const picksOne = /const url = pool\[i\];/.test(play);
const loopsIt = /next\.loop = true;/.test(play);
const advances = /addEventListener\('ended'|onended/.test(play);
ok(picksOne && loopsIt, 'play() still picks ONE pool entry and loops it (the premise the ban rests on)');
ok(!advances, 'and still has no advance-on-ended, so the pool cannot become a sequence mid-fixture');

if (advances || !picksOne || !loopsIt) {
  // Not a demand that the deck stay as it is — F-221's other half (§101) may well change it. It is a handoff: the
  // mechanism moved, so the comment describing it is now the stale one, and this probe cannot say how.
  console.log('  ..   the deck changed — rewrite the match: comment to the new mechanism, then re-read this probe');
} else {
  // Each pattern is tied to the code fact that refutes it, so the reader checks the CLAIM, not the regex.
  const REFUTED: { re: RegExp; what: string }[] = [
    { re: /\b(?:no|zero|without)\b[^.]{0,40}repeat[^.]{0,40}within (?:a|one) (?:fixture|match)/i,
      what: 'that a fixture hears no repeat — one track is picked and looped, so it repeats 3.6-4.0 times' },
    { re: /the deck (?:advances|rotates|cycles|moves on)/i,
      what: 'that the deck advances — it does not; whether it should is the open half of F-221 (§101)' },
  ];
  const restated = REFUTED.filter((p) => p.re.test(match.comment));
  for (const p of restated) console.log(`       the match: comment still claims ${p.what}`);
  ok(restated.length === 0, `the comment claims nothing play() refutes (${restated.length} found)`);
}

console.log(fails ? `\n✗ ${fails} — the match-music comment does not describe the files or the code` : '\n✓ the match-music comment matches the Oggs on disk and what play() does with them');
if (fails) process.exitCode = 1;
