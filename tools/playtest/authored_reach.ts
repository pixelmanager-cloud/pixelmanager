// AUTHORED TEXT THAT NOW REACHES A PLAYER — AND STAYS REACHING ONE.
//
// Two bodies of finished prose had no production caller at all. Neither was a bug: both were written for a
// presentation that was never built, and both were one decision away from being deleted by someone tidying
// up. §86 assessed them and CK took the cheap version of each.
//
//   THE BACKROOM QUIPS (shared/src/staff.ts) — 40 lines, 4 roles x 5 moments x 2. Their only caller was
//   `pressConferenceLineWithStaff`, which the client never invoked, so the four staff were four names and
//   one fixed personality line each, unchanged from season 1 to the end of a dynasty, on a screen that
//   reacts to everything else. Deliberately NOT wired through that combinator: it returns one flat string
//   into a presser the client already wraps in curly quotes, giving nested quotes and double attribution
//   (12 of the 40 quips carry their own "they say"), and it only ever reaches 2 of the 5 moments.
//
//   THE CALL-UP CORPUS (shared/src/intl.ts) — ~305 lines behind `callUpBlurb`, no caller. The beat itself
//   exists: caps accrue and the INTERNATIONAL panel already renders them. Only the sentence was missing.
//   Frozen into careerHonours at graduation rather than derived live, because that panel is a HUD redrawn
//   every turn and at a high overall the cap count moves every ~2.4 turns — a live line would quietly
//   become a different line while the player watched.
//
// Run: `npx tsx tools/playtest/authored_reach.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { staffQuip, staffRoster, type StaffMoment } from '../../shared/src/staff.js';
import { callUpBlurb } from '../../shared/src/intl.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function bestCard(s: any): string {
  const dem = s.scenario?.demand ?? {};
  let best = s.hand[0], bestScore = -Infinity;
  for (const c of s.hand) {
    let score = 0;
    for (const [t, w] of Object.entries(dem)) score += (Number((c.tags ?? {})[t]) || 0) * Number(w);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best.id;
}

async function main() {
  console.log('=== The backroom speaks, and the international beat has a sentence ===');

  // ── the corpora still exist and still produce prose ──────────────────────────────────────────────────
  const MOMENTS: StaffMoment[] = ['preSeason', 'signing', 'bigWin', 'bigLoss', 'milestone'];
  const roster = staffRoster(12345);
  const roles = [roster.assistant.role, roster.scout.role, roster.fitnessCoach.role, roster.goalkeepingCoach.role];
  const quips = new Set<string>();
  for (const r of roles) for (const m of MOMENTS) for (let salt = 0; salt < 8; salt++) quips.add(staffQuip(12345, r, m, salt));
  console.log(`  ..   ${quips.size} distinct staff quip(s) reachable across ${roles.length} roles x ${MOMENTS.length} moments`);
  ok(quips.size >= 30, 'the staff corpus is still there and still varied');

  const caps = new Set<string>();
  for (let n = 1; n <= 30; n++) caps.add(callUpBlurb(9001 + n, n, 'Calderia', n % 3 === 0 ? 1 : 0));
  console.log(`  ..   ${caps.size} distinct call-up line(s) over 30 cap counts`);
  ok(caps.size >= 10, 'the call-up corpus is still there and still varied');

  // ── the client actually calls them ───────────────────────────────────────────────────────────────────
  const main_ts = readFileSync('client/src/main.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  ok(/staffQuip\(/.test(main_ts), 'the client calls staffQuip — the quips have a production caller');
  ok(/honours\?\.capLine/.test(main_ts), 'the family tree reads the frozen call-up line');
  const tokens_ts = readFileSync('shared/src/tokens.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  ok(/callUpBlurb\(/.test(tokens_ts), 'careerHonours calls callUpBlurb — the corpus has a production caller');

  // ── and a real career comes out the other end carrying one ───────────────────────────────────────────
  let capped = 0, withLine = 0;
  const N = 3;
  for (let run = 0; run < N; run++) {
    __setBackendForTests(createInMemoryBackend());
    await api.register('ar', 'x', 'Ashcombe', 20260830 + run, `ar-${run}`);
    const { candidates } = await api.scoutProspects(3) as any;
    const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;
    await api.startCareer(pid, null);
    for (let g = 0; g < 4000; g++) {
      const { state } = await api.getCareer(pid) as any;
      if (!state || state.finished) break;
      const s: any = state;
      const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
        : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
        : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
        : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
        : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
        : { type: 'play', cardId: bestCard(s) };
      if ((await api.careerAct(pid, act) as any).graduated) break;
    }
    // Read the token, not the bloodline node: careerHonours is frozen ONTO the token at graduation, which
    // is the thing under test. Going through the tree's node shape added a lookup that could fail for its
    // own reasons and report this as unreachable — it duly did on the first run.
    const tok: any = await localStore.getToken(pid);
    let h: any = null;
    try { h = tok?.career_honours_json ? JSON.parse(tok.career_honours_json) : null; } catch { /* none */ }
    if (run === 0) console.log(`  ..   run 0 graduated at peak ${h?.peakOverall ?? '?'} with ${h?.caps ?? 0} cap(s)`);
    if (h?.caps > 0) { capped++; if (h.capLine) withLine++; }
  }
  console.log(`  ..   ${capped}/${N} careers finished with caps, ${withLine} of those carry a frozen call-up line`);
  ok(capped > 0, 'a played career actually earns caps (otherwise this half measures nothing)');
  ok(withLine === capped, 'every capped career carries its call-up sentence into the family record');

  console.log(fails ? `\n✗ ${fails} — authored prose is unreachable again` : '\n✓ both corpora reach the player');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
