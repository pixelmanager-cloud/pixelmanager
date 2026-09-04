// {RIVAL} IS A MAN, NOT A CLUB.
//
// careerState fills the token from the seeded cast — `careerCast(seed, familyName).rival` — and RIVAL_NAMES
// is a list of personal surnames: Turner, Bianchi, Sowerby, Delaney. fillArcText is a bare global replace,
// so whatever an arc writes around {RIVAL} is what the player reads.
//
// Most arcs treat him correctly: "A new lad called {RIVAL} joins the group", "{RIVAL} has been at it in the
// papers all week". A second set treated him as a CLUB — "{RIVAL}, the bitter rivals whose fans have jeered
// him for years", "{RIVAL} trudge off humiliated", "the last {RIVAL} defender" — and in one dumped career
// the same name did both: turn 0 said "Sowerby has new boots on", and a later turn had Sowerby fielding a
// back four. Adding a second token would mean authoring a club-name cast and threading it through the fill
// path; rewording eleven beats to be about the man or his side is the smaller correct change, and saga.ts
// already demonstrates the idiom with "{RIVAL}'s lot".
//
// The test is grammatical, because grammar is what actually gives it away: a personal surname cannot take a
// plural present-tense verb, cannot be apposed to a plural noun phrase, and cannot modify a role noun.
// `had` is deliberately NOT in the plural list — it is singular past as well, and "{RIVAL} had the better
// season" is correct prose about a man.
//
// Run: `npx tsx tools/playtest/rival_is_a_man.ts`
import { readdirSync, readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== {RIVAL} is written as a person everywhere ===');

const PLURAL = 'trudge|know|slump|have|are|were|come|go|sing|look|do|want|play|sit|start|win|lose|find';
const TESTS = [
  { re: new RegExp(`\\{RIVAL\\}\\s+(?:${PLURAL})\\b`), why: 'a plural verb — a surname is singular' },
  { re: /the\s+(?:last\s+|first\s+)?\{RIVAL\}\s+[a-z]+/, why: 'used attributively, the way a club name is' },
  { re: /\{RIVAL\},\s+the\s+[a-z]+\s+[a-z]*s\b/, why: 'apposed to a plural noun phrase' },
  { re: /\{RIVAL\}\s+(?:defender|keeper|players|fans|support|midfield|defence|back four)/, why: 'modifying a role noun' },
];

let files = 0, tokens = 0;
const bad: string[] = [];
for (const f of readdirSync('shared/src/storyarcs')) {
  if (!f.endsWith('.ts')) continue;
  files++;
  readFileSync(`shared/src/storyarcs/${f}`, 'utf8').split('\n').forEach((line, i) => {
    tokens += (line.match(/\{RIVAL\}/g) ?? []).length;
    for (const t of TESTS) { const m = t.re.exec(line); if (m) { bad.push(`${f}:${i + 1}  [${t.why}]  …${m[0]}…`); break; } }
  });
}
console.log(`  ..   ${tokens} {RIVAL} token(s) across ${files} arc file(s)`);
// VACUITY GUARDS. A renamed directory or a renamed token would scan nothing and pass for free.
ok(files > 5, `the arc files were actually read (${files})`);
ok(tokens > 40, `the token is still called {RIVAL} and is still in use (${tokens} occurrences)`);
for (const b of bad) console.log(`       ${b}`);
ok(bad.length === 0, `no beat writes {RIVAL} as a club (${bad.length} found)`);

console.log(fails === 0 ? '\n✓ the rival is a man throughout' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
