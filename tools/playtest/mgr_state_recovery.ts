// AN EVICTED BROWSER MUST NOT COST YOU YOUR CAREER.
//
// The dynasty lives in IndexedDB; the manager state — season, tier, star, titles — lives in localStorage,
// which is the far more evictable half (Safari clears it after seven idle days). recoverOrphanedSaves puts
// the save back on the title screen, but loadMgr then returned a blank `{ season: 1, results: [] }`, so the
// player got his own dynasty back in the bottom division at season one: every token, legend and honour
// intact underneath, and the manager career silently reset to zero. Nothing failed; it just started over.
//
// The durable half knows more than that. profile.season is the season, the honours ledger carries each
// campaign's tier and title, and the played token knows who the star is. This asserts the rebuild uses them.
//
// Run: `npx tsx tools/playtest/mgr_state_recovery.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== A recovered save comes back as the career it was ===');

// The two halves this depends on must still be split the way the fix assumes.
ok(/private mgrKey\(\) \{ return 'fm_mgr_'/.test(src), 'manager state is still keyed into localStorage (the evictable half)');
ok(/recoverOrphanedSaves/.test(src), 'orphaned saves are still recovered from the durable half');

const i = src.indexOf('private rebuiltMgrState()');
ok(i > 0, 'loadMgr has a rebuild path rather than returning a blank state');
// THE WHOLE METHOD, NOT A FIXED BYTE WINDOW. This was `i + 1400` against a method already 1408 bytes long,
// so the next comment written inside it pushed the tier, titles and star assertions past the end of the
// slice and three checks went red over code nobody had touched. An unfindable body slices to empty and
// fails them all, which is the right way round for a probe.
const mEnd = src.indexOf('\n  }', i);
const block = src.slice(i, mEnd > i ? mEnd : i);

// Each of these is a fact the durable save holds and the blank state threw away.
ok(/getActiveModel\(\)/.test(block), 'the rebuild reads the durable save model');
ok(/profile\?\.season|profile\.season/.test(block), 'the season is taken from profile.season, not reset to 1');
ok(/honours/.test(block) && /setClubTier/.test(block), 'the club tier is restored from the honours ledger');
ok(/titles: honours\.filter/.test(block), 'the title count is rebuilt from banked honours');
ok(/starId: star\.id/.test(block), 'the star is identified from the played token');

// And loadMgr must actually call it — a rebuild nothing invokes is the defect this project keeps producing.
const lm = src.slice(src.indexOf('private loadMgr()'), src.indexOf('private rebuiltMgrState()'));
ok(/return this\.rebuiltMgrState\(\);/.test(lm), 'loadMgr calls the rebuild on its fallback path');
ok(!/return \{ season: 1, results: \[\] \};\s*\}\s*\/\*\* Best-effort/.test(lm) || /rebuiltMgrState/.test(lm),
   'the blank-state early return no longer shadows the rebuild');

console.log(fails ? `\n✗ ${fails} problem(s) — a recovered dynasty would restart at season one` : '\n✓ a recovered save keeps its season, tier, titles and star');
if (fails) process.exitCode = 1;
