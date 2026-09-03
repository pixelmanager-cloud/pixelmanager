// LONG-HORIZON SOAK. Drive whole dynasties through the real facade, over and over, watching for the faults
// that only appear once in a few hundred runs: a crash, a NaN, coins going negative, a ledger that drifts,
// a save that does not survive being reloaded.
//
// This is the half of the audit factory that agents cannot do and a person will not: nobody plays four
// hundred generations. Every existing harness runs a handful of seeds; a 1-in-500 fault is invisible to all
// of them and perfectly visible here.
//
// Deliberately NOT in tools/playtest/ — the playtest leg is auto-discovered and must stay minutes long.
// Run it directly, in the background, for as long as you have:
//
//   npx tsx tools/soak.ts <dynasties> <generations> <seedOffset>
//
// Prints one line per dynasty so a long run is watchable, and a summary at the end. Exits non-zero if any
// invariant broke, naming the seed so it can be reproduced exactly.
import { api, __setBackendForTests } from '../client/src/api.js';
import { createInMemoryBackend, getActiveModel, setSaveBackend, continueSave } from '../client/src/save.js';
import { buildDynasty } from './dev_dynasty_save.js';

const RUNS = Math.max(1, Number(process.argv[2] ?? 25));
const GENS = Math.max(2, Number(process.argv[3] ?? 4));
const OFFSET = Number(process.argv[4] ?? 0);

interface Fault { seed: string; what: string }
const faults: Fault[] = [];
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Walk any structure looking for a number that has stopped being one. A NaN in a save is silent until it
 *  reaches a screen, by which time the save that produced it is long gone. */
function scanNonFinite(o: unknown, path: string, out: string[], depth = 0): void {
  if (o == null || depth > 6 || out.length > 4) return;
  if (typeof o === 'number') { if (!Number.isFinite(o)) out.push(`${path}=${o}`); return; }
  if (Array.isArray(o)) { o.forEach((v, i) => scanNonFinite(v, `${path}[${i}]`, out, depth + 1)); return; }
  if (typeof o === 'object') for (const [k, v] of Object.entries(o as any)) scanNonFinite(v, `${path}.${k}`, out, depth + 1);
}

async function one(seed: string): Promise<void> {
  const bad = (what: string) => faults.push({ seed, what });
  __setBackendForTests(createInMemoryBackend());
  const renown: number[] = [];
  const pid = await buildDynasty({
    gens: GENS, familyName: 'Ashcombe', slot: seed,
    onGeneration: async () => { renown.push((await api.houses() as any).mine.renown); },
  });

  const [houses, legends, honours, bloodline, prestige] = await Promise.all([
    api.houses(), api.legends(), api.honours(9999), api.bloodline(), api.prestige(),
  ]) as any[];
  const model = getActiveModel();

  // 1 — nothing may have stopped being a number.
  const nf: string[] = [];
  scanNonFinite(model.profile, 'profile', nf);
  scanNonFinite(houses.mine, 'houses.mine', nf);
  scanNonFinite(prestige.prestige, 'prestige', nf);
  for (const n of bloodline.nodes as any[]) scanNonFinite({ g: n.generation, o: n.overall }, `node:${n.name}`, nf);
  if (nf.length) bad(`non-finite: ${nf.join(', ')}`);

  // 2 — the economy never goes underwater.
  if (!finite(model.profile.coins) || model.profile.coins < 0) bad(`coins ${model.profile.coins}`);

  // 3 — the ledger books each season exactly once.
  const seasons = honours.honours.map((h: any) => h.season_number);
  const dupes = [...new Set(seasons.filter((s: number, i: number) => seasons.indexOf(s) !== i))];
  if (dupes.length) bad(`season(s) banked twice: ${dupes.join(',')}`);

  // 4 — the record holds every generation, founder to living star.
  const played = (bloodline.nodes as any[]).filter((n) => (n.branch ?? 'played') === 'played');
  for (let g = 0; g < GENS; g++) if (!played.some((n) => n.generation === g)) bad(`generation ${g} missing from the Family Record`);

  // 5 — one legend per completed generation.
  if (legends.legends.length !== GENS - 1) bad(`${legends.legends.length} legend(s) after ${GENS} generations, expected ${GENS - 1}`);

  // 6 — the save survives being a save.
  const json = JSON.parse(JSON.stringify(model));
  const be = createInMemoryBackend();
  await be.save('reload', json);
  setSaveBackend(be);
  await continueSave('reload');
  const [h2, b2, p2] = await Promise.all([api.houses(), api.bloodline(), api.prestige()]) as any[];
  if (h2.mine.renown !== houses.mine.renown) bad(`renown moved across reload: ${houses.mine.renown} -> ${h2.mine.renown}`);
  if (b2.nodes.length !== bloodline.nodes.length) bad(`record changed size across reload: ${bloodline.nodes.length} -> ${b2.nodes.length}`);
  if (p2.prestige?.score !== prestige.prestige?.score) bad(`prestige moved across reload`);
  void pid; void renown;
}

async function main() {
  console.log(`soak: ${RUNS} dynasties x ${GENS} generations, seeds ${OFFSET}..${OFFSET + RUNS - 1}`);
  const t0 = Date.now();
  let crashed = 0;
  for (let i = 0; i < RUNS; i++) {
    const seed = `soak-${OFFSET + i}`;
    const before = faults.length;
    try {
      await one(seed);
    } catch (e: any) {
      crashed++;
      faults.push({ seed, what: `THREW: ${String(e?.message ?? e).slice(0, 160)}` });
    }
    const mins = (Date.now() - t0) / 60000;
    const status = faults.length > before ? `FAULT (${faults.length - before})` : 'ok';
    console.log(`  [${i + 1}/${RUNS}] ${seed} ${status}   ${mins.toFixed(1)}m elapsed`);
  }
  console.log(`\n${RUNS} dynasties, ${crashed} crash(es), ${faults.length} fault(s), ${((Date.now() - t0) / 60000).toFixed(1)} minutes`);
  for (const f of faults.slice(0, 40)) console.log(`  ${f.seed}: ${f.what}`);
  if (faults.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
