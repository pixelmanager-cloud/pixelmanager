// ── WHAT THE FAMILY BUILT MUST SURVIVE THE HANDOVER ──────────────────────────────────────────────────
// The succession used to call clearMgr() — a blanket localStorage removeItem — so every generation threw
// the dynasty away. Measured over 20 generations before the fix: the club fell from tier 1 back to tier 9
// at ALL 19 successions, and titles, continental/World-Finals wins, hired staff, arcPrestige, clubLegacy,
// arcFired, arcTags and lastRankIdx went with it. Three comments in main.ts promise the opposite, and the
// succession handler's own spread — "what the family built is the whole point of the game and carries" —
// was spreading an object clearMgr had just emptied.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level. That is cruder than a behavioural test and it is what is actually available; it catches
// the exact regression that shipped, which a green verify did not.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../../client/src/main.ts', import.meta.url)), 'utf8');
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// 1. the succession path must not blanket-wipe the manager save
const succBody = src.slice(src.indexOf('private async bringThroughHeir'), src.indexOf('private async bringThroughHeir') + 3000);
check(!/\bthis\.clearMgr\(\)/.test(succBody),
  'the succession does not call clearMgr() — it resets the season, not the dynasty');

// 2. the reset must PRESERVE every field the dynasty accumulates
const reset = src.slice(src.indexOf('private resetMgrForHeir'), src.indexOf('private resetMgrForHeir') + 2200);
check(/\.\.\.prior/.test(reset), 'resetMgrForHeir spreads the prior state rather than replacing it');
for (const field of ['titles', 'contTitles', 'wcWins', 'staff', 'arcPrestige', 'clubLegacy', 'arcFired', 'arcTags', 'lastRankIdx']) {
  // a preserved field must NOT appear as an explicit reset key inside the object literal
  check(!new RegExp(`(^|[\\s{,])${field}\\s*:`, 'm').test(reset),
    `resetMgrForHeir carries \`${field}\` across the handover`);
}

// 3. `founding` must not be derived from the very state the reset produces
const found = src.slice(src.indexOf('const founding ='), src.indexOf('const founding =') + 200);
check(!/prior\.starId\s*==\s*null/.test(found) && !/prior\.season/.test(found),
  'founding is not derived from starId/season — the exact state a succession leaves behind');
check(/fm_starttier_/.test(src.slice(src.indexOf('let everFounded'), src.indexOf('let everFounded') + 300)),
  'founding keys off fm_starttier_, which is written once and outlives the handover');

console.log(fails ? `\n✗ ${fails} succession-carry check(s) failed — a generation would lose what the family built` : '\n✓ the dynasty survives the handover');
if (fails) process.exit(1);
