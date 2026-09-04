// PROSE MUST NOT DESCRIBE A COMPETITION THIS GAME DOES NOT RUN.
//
// The pyramid's entire promotion rule is two lines in main.ts: `const promoted = t.pos <= 2 && tier > 1;`
// and `const relegated = t.pos >= t.size - 1 && tier < TIERS;`. Top two go up, bottom two go down. There
// are no play-offs, there is no promotion final, and no domestic tie is ever settled by penalties. The
// file says so itself — "the pyramid has no playoffs (top-2 auto-promote)".
//
// Prose written against a competition that does not exist is worse than a typo, because it reads as
// authoritative. A player who is told at 5th that they are "well in the mix for a play-off run" will keep
// playing for a play-off that will never arrive, and when the season ends at 5th with nothing, the game
// looks broken rather than lost. PT-138 already caught one instance of this shape — the top-flight table
// zones talking about "promotion" out of a division with nothing above it — and the fix was to fork a
// TOP-FLIGHT variant. The lower-division pool it forked away from was never re-read.
//
// This probe is the general guard for that class. It walks the manager-layer banks whose emitters are
// LEAGUE-TABLE events and fails on vocabulary from competitions the pyramid does not implement.
//
// SCOPE, deliberately narrow: only banks reached from a league-position emitter. The card career's
// HUGE_MOMENTS list (career.ts) may name a "Promotion Play-Off Final" — that layer is abstract set-piece
// flavour and simulates no table, so it is out of scope and must stay out, or this probe starts lying.
//
// Run: `npx tsx tools/playtest/phantom_mechanics.ts`
import { readFileSync } from 'node:fs';
import { mergeBanks } from '../../shared/src/prompts/merge.js';
import { BASE_MGR } from '../../shared/src/manager/base.js';
import { MGR_EXTRA_1 } from '../../shared/src/manager/pack_1.js';
import { MGR_EXTRA_2 } from '../../shared/src/manager/pack_2.js';
import { MGR_EXTRA_3 } from '../../shared/src/manager/pack_3.js';
import { MGR_EXTRA_4 } from '../../shared/src/manager/pack_4.js';
import { MGR_EXTRA_5 } from '../../shared/src/manager/pack_5.js';
import { MGR_EXTRA_6 } from '../../shared/src/manager/pack_6.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== League-table prose describes only competitions the pyramid runs ===');

// ── 1. THE RULE THIS PROBE IS DEFENDING, read from the source rather than assumed. If someone adds a
// play-off mechanic later, this assertion goes red first and tells them to retire the probe, instead of
// the probe silently forbidding prose about a feature that now exists.
const main = readFileSync('client/src/main.ts', 'utf8');
const promoRule = /const promoted = t\.pos <= 2 && tier > 1;/.test(main);
const relRule = /const relegated = t\.pos >= t\.size - 1 && tier < TIERS;/.test(main);
ok(promoRule && relRule, 'promotion is still top-two automatic and relegation bottom-two (the premise)');
if (!promoRule || !relRule) {
  console.log('  ..   the promotion rule moved — re-read this probe before trusting the failures below');
}

// ── 2. THE BANNED VOCABULARY, each tied to the mechanic it wrongly implies.
const PHANTOM: { re: RegExp; what: string }[] = [
  { re: /play-?offs?/i, what: 'a play-off — the pyramid promotes the top two automatically' },
  { re: /\bsemi-?finals?\b/i, what: 'a knockout semi-final — this event fires on a league finish' },
  { re: /penalt(y|ies) (saved|shoot-?out)|shoot-?out/i, what: 'a shoot-out — no domestic tie is decided on penalties' },
  { re: /\bthe ninety minutes that counted\b|\bon the day\b.*\bfinal\b/i, what: 'a single decisive tie rather than a 46-game table' },
];

// The banks whose ONLY emitters are league-position events (main.ts:3195-3204). Each is listed with the
// emitter that reaches it so the scope is auditable rather than a guess.
const LEAGUE_EVENTS = [
  'promotion',    // main.ts:3195  — reached only via `if (promoted)`
  'relegation',   // main.ts:3198  — reached only via `else if (relegated)`
  'title',        // main.ts:3200  — reached only via `else if (t.pos === 1)`
  'near_miss',    // main.ts:3204  — reached only via `else if (tier > 1 && t.pos <= 4)`
];

// USE THE SAME MERGE THE GAME USES. The first draft of this probe spread the packs with `{...a, ...b}`,
// which OVERWRITES a repeated key instead of concatenating it — so pack_6's `promotion` bank replaced
// pack_1's outright and the probe read 426 lines where the game reads 1,014. It found one of the four
// known bad lines and reported clean on the other three. mergeBanks (prompts/merge.ts) is what
// managerNarrate:96 actually calls, and it concatenates.
const banks: Record<string, string[]> =
  mergeBanks(BASE_MGR, MGR_EXTRA_1, MGR_EXTRA_2, MGR_EXTRA_3, MGR_EXTRA_4, MGR_EXTRA_5, MGR_EXTRA_6) as any;
// A missing import name spreads as a silent no-op — `{ ...undefined }` is legal — which is how a sibling
// probe once went green over the four call sites it existed to catch. Assert the merge before using it.
ok(Object.keys(banks).length > 60, `the packs actually loaded (${Object.keys(banks).length} keys merged)`);

let scanned = 0;
const bad: string[] = [];
for (const [key, lines] of Object.entries(banks)) {
  const ev = key.includes('.') ? key.slice(0, key.lastIndexOf('.')) : key;
  if (!LEAGUE_EVENTS.includes(ev)) continue;
  for (const line of lines) {
    scanned++;
    for (const p of PHANTOM) if (p.re.test(line)) bad.push(`${key}: "${line}" — implies ${p.what}`);
  }
}
console.log(`  ..   ${scanned} line(s) scanned across ${LEAGUE_EVENTS.length} league-table event bank(s)`);
// VACUITY GUARD. If the event keys are ever renamed, the loop above matches nothing and this probe passes
// while checking zero lines — the exact failure mode that let four dead CSS rules live for months.
ok(scanned > 40, 'the league-table banks were actually found and read (not a zero-of-zero pass)');
for (const b of bad) console.log(`       ${b}`);
ok(bad.length === 0, `no league-table line describes a competition the pyramid does not run (${bad.length} found)`);

// ── 3. THE GAFFER'S DIARY table-zone pools. These are plain arrow functions in a module scope, not an
// exported bank, so they are read as source. The zone that fires for 5th-8th outside the top flight is the
// one PT-138's fix walked past.
const diary = readFileSync('shared/src/gaffersDiary.ts', 'utf8');
const diaryLines = [...diary.matchAll(/^\s*(?:\([^)]*\)|\(\))\s*=>\s*`([^`]*)`,?\s*$/gm)].map((m) => m[1]);
console.log(`  ..   ${diaryLines.length} diary phrase(s) read from source`);
ok(diaryLines.length > 60, 'the diary phrase pools were actually parsed (not a zero-of-zero pass)');
const diaryBad = diaryLines.filter((l) => /play-?offs?/i.test(l));
for (const l of diaryBad) console.log(`       gaffersDiary: "${l}"`);
ok(diaryBad.length === 0, `no diary phrase promises a play-off (${diaryBad.length} found)`);

// ── 4. AND THE NAME ITSELF. A pool called PLAYOFF_HUNT invites the next author to write another play-off
// line into it, which is how this bug got here in the first place. The comment two pools down already
// explains the top-flight fork; the lower pool should name what it actually is.
// STRIP COMMENTS FIRST. This codebase deliberately quotes the old broken code in the comment that explains
// the fix — "This pool used to be called PLAYOFF_HUNT" sits directly above the renamed pool — so a raw grep
// reports the post-mortem as the crime. A sibling probe (destructive_delete) learned this the same way.
const diaryCode = diary.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/PLAYOFF_HUNT/.test(diaryCode), 'no pool is named for a competition that does not exist');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
