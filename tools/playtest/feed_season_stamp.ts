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

// The rollover's feed writes are the ones in the ~120 lines before that increment.
const region = src.slice(Math.max(0, bump - 4000), bump);
const calls = [...region.matchAll(/this\.feed(?:Event|Once)\(([^;]*?)\);/gs)];
console.log(`  ..   ${calls.length} feed write(s) inside the rollover, before the season increments`);
ok(calls.length > 0, 'there are rollover feed writes to check (this is not measuring an empty set)');

for (const c of calls) {
  const text = c[1].replace(/\s+/g, ' ');
  const label = (text.match(/'([\w_]+)'/) ?? [, '?'])[1];
  ok(/m\.season \+ 1/.test(text), `'${label}' is stamped with the season the player will be reading`);
}

console.log(fails ? `\n✗ ${fails} feed line(s) would be written and never shown` : '\n✓ every rollover line lands in the season that displays it');
if (fails) process.exitCode = 1;
