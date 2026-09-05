// ── THE TEAM SHEET'S "BACK" HAS TO LAND WHERE THE MANAGER CAME FROM ─────────────────────────────────
// The lineup editor has exactly four doors and all four are on the CLUB SEASON screen: "⚙ Team sheet"
// (#sf-teamsheet -> openLineup('standing')), and the three "Play ▶" ties -- #sf-play, #sf-cont-play and
// #sf-wc-play -- which each build `spFixture` and then openLineup('match', …). There is no hub entry:
// the game is one linear life, and the hub reaches the fixture list only via "Continue the season →".
//
// Both ways out used to consult `lineupReturn`, a 'hub' | 'season' field that ONLY #sf-teamsheet ever set
// to 'season'. The three match entries left it at its 'hub' default, so backing out of a league fixture,
// a Continental tie or a World-Finals tie teleported the manager to the Club & Dynasty hub and charged
// him a second hop through #hub-continue-season to get back to the fixture he was standing on. The
// full-time card next door already got this right by a different route (`if (this.spFixture)
// this.showSeason(); else this.showHub();`), so the return trip was correct outbound and wrong inbound.
//
// THE PREMISE IS CHECKED, NOT ASSUMED. Routing both exits unconditionally to showSeason() is only correct
// while every door is on the season screen, so check 4 walks the call graph from each `openLineup(` up
// through its enclosing methods to the DOM id that fires it, and demands every id be wired inside
// showSeason(). Add a hub-side entry to the editor and that check goes red — which is the signal to bring
// a return-destination back, not to widen this file.
//
// Static, like career_back_named.ts next door: main.ts is a DOM-coupled monolith with no seam to drive
// headlessly, and a back button's destination is exactly the kind of thing a playtest walks straight past.
//
// MUTATION TEST — each of these must turn a line below red:
//   - restore `else void this.showHub()` in the #lineup-back handler   -> checks 2 and 3 FAIL
//   - restore the same in saveTeam()                                   -> checks 2 and 3 FAIL
//   - point either exit at showHub() outright                          -> that exit's check 2 FAILs too
//   - wire a new openLineup( call from the hub (e.g. inside showHub()) -> check 4 FAILs: a door that is
//     not on the season screen makes "always showSeason()" a lie
//   - delete an `openLineup(` call site so only three remain           -> check 5 FAILs (census floor),
//     which is what stops check 4 reporting green over an empty list
//   - rename #lineup-back or saveTeam                                  -> check 1 FAILs and the run stops
//     there, so checks 2-3 can never pass by scanning the empty string
//
// Run: `npx tsx tools/playtest/lineup_back_season.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');
const lines = src.split('\n');
const MEMBER = /^ {2}(?:private |public |protected )?(?:async )?([A-Za-z_$][\w$]*)\s*\(/;

/** The class member (2-space indent) that encloses a given 0-based line. */
const memberAt = (i: number): string => {
  for (let j = i; j >= 0; j--) { const m = lines[j].match(MEMBER); if (m) return m[1]; }
  return '';
};
/** A class member's body text, by name — up to the next thing at class-member indent. */
const bodyOf = (name: string): string => {
  const at = lines.findIndex((l) => new RegExp(`^ {2}(?:private |public |protected )?(?:async )?${name}\\s*\\(`).test(l));
  if (at < 0) return '';
  let end = lines.length;
  for (let j = at + 1; j < lines.length; j++) if (/^ {2}(?:private |public |protected |\/\*\*|\w)/.test(lines[j])) { end = j; break; }
  return lines.slice(at, end).join('\n');
};

console.log('=== Both ways out of the team sheet land on the season screen ===');

// ── 1. ANTI-VACUITY GATE. Checks 2 and 3 read these two spans; renamed or moved, they would both be
//       scanning the empty string and reporting green.
const backAt = lines.findIndex((l) => l.includes("$('lineup-back').addEventListener("));
let backBody = '';
if (backAt >= 0) {
  // one-liner arrow, or a braced block closed by `    });` — take the whole handler and nothing after it,
  // or check 3 would be reading the NEXT handler's body and could go red for someone else's showHub().
  if (/\);\s*$/.test(lines[backAt])) backBody = lines[backAt];
  else { const e = lines.findIndex((l, i) => i > backAt && /^ {4}\}\);/.test(l)); backBody = lines.slice(backAt, e < 0 ? backAt + 1 : e + 1).join('\n'); }
}
const saveBody = bodyOf('saveTeam');
console.log(`  ..   #lineup-back handler: ${backBody.length} chars   saveTeam(): ${saveBody.length} chars`);
ok(backBody.length > 0 && saveBody.length > 100, 'both exits from the lineup editor were located (this is not scanning an empty string)');
if (!(backBody.length > 0 && saveBody.length > 100)) { console.log('\n✗ nothing to check — #lineup-back or saveTeam() is gone or renamed'); process.exit(1); }

// ── 2 & 3. THE DESTINATION. Back and Save both put the manager back on the fixture list he opened the
//       sheet from. showHub() in either is the bug: the hub is two screens from where he was standing.
for (const [what, body] of [['#lineup-back', backBody], ['saveTeam()', saveBody]] as const) {
  console.log(`  ..   ${what} -> ${(body.match(/this\.show(\w+)\(/g) ?? []).join(', ') || '(no show* call)'}`);
  ok(/this\.showSeason\(\)/.test(body), `${what} returns to the season screen`);
  ok(!/showHub\(/.test(body), `${what} does not divert to the hub`);
}

// ── 4. THE PREMISE THE FIX RESTS ON. Walk from every `openLineup(` up through enclosing methods to the
//       DOM id that fires it. Every door into the editor must be wired inside showSeason(); a door that
//       is not means "always showSeason()" is wrong for that door and a return-destination has to return.
const seasonAt = lines.findIndex((l) => /^ {2}private showSeason\(\)/.test(l));
let seasonEnd = lines.length;
for (let j = seasonAt + 1; j < lines.length; j++) if (/^ {2}(?:private |public |protected |\/\*\*|\w)/.test(lines[j])) { seasonEnd = j; break; }
const opens = lines
  .map((l, i) => [l, i] as const)
  .filter(([l]) => l.includes('openLineup(') && !MEMBER.test(l) && !/^\s*(?:\/\/|\*)/.test(l))
  .map(([, i]) => i);
const doors = opens.map((o) => {
  const ids: string[] = [];
  const seen = new Set<string>();
  const queue = [o];
  while (queue.length) {
    const i = queue.shift()!;
    const idm = lines[i].match(/\$\('([\w-]+)'\)\??\.addEventListener\(/);
    if (idm) { ids.push(`${idm[1]}${i >= seasonAt && i < seasonEnd ? '' : ' (NOT in showSeason)'}`); continue; }
    const owner = memberAt(i);
    if (!owner || seen.has(owner)) continue;
    seen.add(owner);
    lines.forEach((l, j) => { if (j !== i && new RegExp(`this\\.${owner}\\(`).test(l)) queue.push(j); });
  }
  return { open: o, ids };
});
for (const d of doors) console.log(`  ..   main.ts:${d.open + 1}  ${lines[d.open].trim().slice(0, 68)}  <- ${d.ids.join(', ') || '(no wiring found)'}`);
ok(doors.every((d) => d.ids.length > 0), 'every openLineup( call traces back to a wired control (check 4 has something to judge)');
ok(doors.every((d) => d.ids.length > 0 && d.ids.every((x) => !x.includes('NOT in showSeason'))),
   'every door into the team sheet is on the season screen, so returning there is always right');

// ── 5. CENSUS FLOOR. Four doors today. This is what stops check 4 going green over an empty list once a
//       rename turns the `openLineup(` scan into a no-op.
console.log(`  ..   openLineup( call sites: ${doors.length}`);
ok(doors.length >= 4, 'the openLineup( call sites were found at all (the walk above is measuring something)');

console.log(fails
  ? `\n✗ ${fails} check(s) failed — leaving the team sheet drops the manager somewhere he did not come from`
  : '\n✓ Back and Save both return to the season screen, and every door into the sheet is on it');
if (fails) process.exitCode = 1;
