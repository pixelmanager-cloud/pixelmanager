// A FEED LINE MUST BE STAMPED WITH THE SEASON IT WILL BE READ IN.
//
// The manager feed is written by feedEvent/feedOnce, which stamp each entry with the season CURRENT AT WRITE
// TIME, and read by seasonFeedHtml, which shows only entries matching the season current at READ time. That
// is fine everywhere except the season rollover, which writes its lines and THEN increments the season a few
// statements later — so promotion, relegation, the title and the near-miss were each written to the feed and
// never once displayed. The four biggest things that can happen to a club, silent, with nothing failing.
//
// The rule this enforces: inside the rollover, between the first feed write and the `season: m.season + 1`
// save that closes it, every feed call must pass an explicit season.
//
// WIDENED after the prestige rank-up escaped it. This probe originally matched only feedEvent/feedOnce, and
// the rank-up line is written with the THIRD writer, pushFeed — so the 423-line rank-up bank was wired to a
// caller that stamped the closing season, and the nine-rank ladder still passed in silence. A probe that
// covers two of the three ways to write a feed line does not enforce the rule; it enforces two thirds of it.
//
// Run: `npx tsx tools/playtest/feed_season_stamp.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Rollover feed lines are stamped for the season that will show them ===');

// The reader is what makes the stamp matter; if it stops filtering by season this probe measures nothing.
ok(/\.filter\(\(f\) => f\.season === m\.season/.test(src),
   'seasonFeedHtml still filters the feed by the current season (the reason the stamp matters)');

const bump = src.indexOf('season: m.season + 1');
ok(bump > 0, 'the rollover still increments the season through saveMgr');

// SCOPE THE REGION TO THE WHOLE FUNCTION, not a byte-window. The original probe looked at the 4,000 characters
// before the season increment, which was a guess, and the guess was wrong: the prestige rank-up write sits
// ~4,600 characters back and fell outside it, so the probe reported green over the exact bug it was written
// for. A window tuned to the bugs you already know about cannot find the one you don't. Brace-match the body.
const fnStart = src.indexOf('private async nextSeason()');
ok(fnStart > 0 && fnStart < bump, 'nextSeason still exists and still contains the season increment');
let depth = 0, end = fnStart;
for (let i = src.indexOf('{', fnStart); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
}
const region = src.slice(fnStart, end);
ok(end > bump, 'the brace match covers the whole rollover, increment included');

// All THREE feed writers, not two. pushFeed defaults its season to `m.season`, exactly like the others.
const calls = [...region.matchAll(/this\.(?:feedEvent|feedOnce|pushFeed)\(([^;]*?)\);/gs)];
console.log(`  ..   ${calls.length} feed write(s) inside the rollover`);
ok(calls.length > 0, 'there are rollover feed writes to check (this is not measuring an empty set)');

for (const c of calls) {
  const text = c[1].replace(/\s+/g, ' ');
  const label = (text.match(/'([\w_]+)'/) ?? text.match(/\$\{([\w.]+)\}/) ?? [, '?'])[1];
  ok(/m\.season \+ 1/.test(text), `'${label}' is stamped with the season the player will be reading`);
}

console.log(fails ? `\n✗ ${fails} feed line(s) would be written and never shown` : '\n✓ every rollover line lands in the season that displays it');
if (fails) process.exitCode = 1;
