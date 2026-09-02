// A MULTI-GENERATION DEV SAVE, BUILT BY THE ENGINE ITSELF.
//
// The bloodline tree, the Hall of Legends and the trophy room only have anything in them after a star has
// retired and handed the name on — which through the UI means a ~120-turn card career plus a full manager
// career, several times over. That is hours per screenshot and impossible to reproduce.
//
// So this drives the REAL offline facade (`client/src/api.ts`) — the same calls the UI makes, in the same
// order — for N generations, then prints the resulting SaveModel as JSON. Every number in it is engine
// output; nothing here invents a stat, a legend card or an honour. Load it into a browser save slot to see
// a mature dynasty (`tools/store_screenshots.mjs` does exactly that).
//
// Run: `npx tsx tools/dev_dynasty_save.ts [generations] > save.json`   (JSON on stdout, progress on stderr)
import { api, __setBackendForTests } from "../client/src/api.js";
import { createInMemoryBackend, getActiveModel } from '../client/src/save.js';
import { pathToFileURL } from 'node:url';

// A star graduates at 25 and `retireAgeFor` retires him around 31, so five seasons keeps every generation
// inside its own career. Running longer left the save showing "age 33, retires 31" — the succession prompt
// that would have caught it lives in the UI's season rollover, which this harness does not drive.
const SEASONS_PER_GEN = 5;
const log = (m: string) => process.stderr.write(m + '\n');

// The card career, played through the facade exactly as the UI plays it: whatever decision is pending gets
// resolved, otherwise the best-fitting card in hand is played.
async function playCareer(pid: string): Promise<void> {
  let guard = 0;
  for (;;) {
    if (guard++ > 4000) throw new Error(`career ${pid} did not finish in ${guard} turns`);
    const { state } = await api.getCareer(pid) as any;
    if (!state || state.finished) return;
    const s: any = state;
    const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
      : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
      : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
      : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
      : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
      : { type: 'play', cardId: bestCard(s) };
    let r: any;
    try { r = await api.careerAct(pid, act); }
    catch (e: any) { log(`  stuck at turn ${s.turn} phase=${s.phase} act=${JSON.stringify(act)}: ${e?.message}`); throw e; }
    if (r.graduated) return;
  }
}
// The demand-weighted pick — the same "answer what the scenario asks" heuristic a competent player uses.
function bestCard(s: any): string {
  const dem = s.scenario?.demand ?? {};
  let best = s.hand[0], bestScore = -Infinity;
  for (const c of s.hand) {
    let score = 0;
    for (const [tag, w] of Object.entries(dem)) score += (Number((c.tags ?? {})[tag]) || 0) * Number(w);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best.id;
}

/** Drive the facade through `gens` generations of one bloodline on a fresh save, and hand back the played
 *  token's id. The caller owns the backend (so a probe can run it in memory and a dev-save dump can print
 *  the model afterwards). */
export async function buildDynasty(opts: { gens: number; familyName: string; slot: string }): Promise<string> {
  // The new-game field asks for a FAMILY name ("e.g. Vance") — club, founder and every heir share it.
  await api.register('dynasty', 'x', opts.familyName, 20260902, opts.slot);
  const { candidates } = await api.scoutProspects(3) as any;
  const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;

  for (let g = 0; g < opts.gens; g++) {
    await api.startCareer(pid, null);
    await playCareer(pid);
    log(`gen ${g}: career played out and graduated`);

    // The manager career. Finishing positions climb as the dynasty establishes itself, so later
    // generations bank titles and the trophy room fills the way it would in a real playthrough.
    let titles = 0;
    for (let s = 0; s < SEASONS_PER_GEN; s++) {
      const pos = Math.max(1, 6 - g * 2 - Math.floor(s / 3));
      if (pos === 1) titles++;
      await api.spSeasonReward({ pos, size: 14, wins: 20 - pos, draws: 8, losses: 10 + pos, tier: Math.max(1, 4 - g), starId: pid, kind: 'league' });
      await api.advanceSquadSeason({ trainingLvl: 2, wonSomething: pos === 1, goodSeason: pos <= 3 });
      // Build the club up the way prize money makes possible — a dynasty four generations deep with every
      // facility still on level 1 and six figures in the bank does not read as a club anyone has run.
      const { facilities } = await api.facilities() as any;
      for (const f of facilities.filter((x: any) => x.canAfford).slice(0, 3)) {
        try { await api.upgradeFacility(f.key); } catch { /* priced out this season — build it next one */ }
      }
    }
    if (g === opts.gens - 1) break; // the living star stays a star — no succession off the end
    // succeed() reborns the SAME token id as the heir, so `pid` follows the line down the generations.
    await api.succeed(pid, { seasons: SEASONS_PER_GEN, titles, cups: g, mentorship: 2, inheritance: 'name' });
    log(`gen ${g}: retired with ${titles} title(s), name passed on`);
  }
  return pid;
}

async function main() {
  const GENS = Math.max(1, Math.min(8, Number(process.argv[2] ?? 4)));
  __setBackendForTests(createInMemoryBackend());
  await buildDynasty({ gens: GENS, familyName: 'Ashcombe', slot: 'dev-dynasty' });
  const { legends } = await api.legends() as any;
  const { honours } = await api.honours(9999) as any;
  log(`\n${legends.length} legend(s), ${honours.length} honour(s), ${new Set(legends.map((l: any) => l.playerId)).size} bloodline(s)`);
  process.stdout.write(JSON.stringify(getActiveModel()));
}
// Only when RUN, never when imported — `bloodline_tree.ts` imports buildDynasty, and an import that
// quietly starts its own dynasty on the same in-memory backend corrupts the caller's save mid-career.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { log('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
}
