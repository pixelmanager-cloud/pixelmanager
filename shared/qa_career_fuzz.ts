// QA fuzz harness — CAREER loop. Hammers Career/graduate/simCareer across many seeds, tracks,
// personalities, agents and choice-strategies looking for: exceptions, NaN/Infinity/undefined,
// out-of-range attrs, non-termination (softlocks), and determinism breaks (same seed+choices must
// replay identically). New file — does not modify shared/src. Run: `npx tsx shared/qa_career_fuzz.ts`
// (optionally QA_N=20000 to scale).

import {
  Career, graduate, simCareer, rollGenes, inheritGenes, seedFrom, mulberry32,
  AGENTS, TAGS, cardPower, fit, TOTAL_TURNS,
  type CareerPlayerAttrs, type Track, type Style,
} from './src/career.js';

const N = Number(process.env.QA_N ?? 4000);
const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };

const ATTR_KEYS: (keyof CareerPlayerAttrs)[] = [
  'pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate',
  'keeping', 'setPiece', 'composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'durability',
];

function finite(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }

function checkPlayer(p: ReturnType<typeof graduate>, ctx: string) {
  for (const k of ATTR_KEYS) {
    const v = p.attrs[k];
    if (!finite(v)) { log(`NON-FINITE attrs.${k}=${v}  ${ctx}`); continue; }
    if (v < 1 || v > 20) log(`OUT-OF-RANGE attrs.${k}=${v} (want 1..20)  ${ctx}`);
  }
  if (!finite(p.overall) || p.overall < 1 || p.overall > 20) log(`overall=${p.overall} out of range  ${ctx}`);
  if (!finite(p.greed) || p.greed < 1 || p.greed > 20) log(`greed=${p.greed} out of range  ${ctx}`);
  if (!finite(p.marketability) || p.marketability < 1 || p.marketability > 20) log(`marketability=${p.marketability} out of range  ${ctx}`);
  if (!finite(p.earnings) || p.earnings < 0) log(`earnings=${p.earnings} invalid  ${ctx}`);
  if (!['GK', 'DF', 'MF', 'FW'].includes(p.role)) log(`role="${p.role}" invalid  ${ctx}`);
  if (!Array.isArray(p.traits) || p.traits.some((t) => typeof t !== 'string')) log(`traits malformed: ${JSON.stringify(p.traits)}  ${ctx}`);
  if (p.traits.length > 5) log(`traits suspiciously long (${p.traits.length}): ${p.traits.join(',')}  ${ctx}`); // MAX_TRAITS(2) + up to 3 flaws (injury_prone, mercenary/loyal, marketable)
  if (typeof p.personality !== 'string' || !p.personality) log(`personality missing  ${ctx}`);
  const g = p.genes;
  for (const band of ['pace', 'strength', 'stamina'] as const) {
    const b = g[band];
    if (!finite(b.floor) || !finite(b.ceiling)) log(`gene band ${band} non-finite: ${JSON.stringify(b)}  ${ctx}`);
    else if (b.floor > b.ceiling) log(`gene band ${band} floor(${b.floor}) > ceiling(${b.ceiling})  ${ctx}`);
    else if (b.floor < 1 || b.ceiling > 20) log(`gene band ${band} out of [1,20]: ${JSON.stringify(b)}  ${ctx}`);
  }
}

// A random-but-deterministic "strategy" driver: makes every phase choice from a seeded rng so we
// explore weird corners (not just the "sensible" strategies simCareer/career_sim.ts already cover).
function playRandom(track: Track, seed: number, agentId?: string): { c: Career; ok: boolean; err?: string } {
  const c = new Career(seed, track, agentId);
  const rng = mulberry32(seed ^ 0xabc123);
  let guardTurns = 0;
  const HARD_CAP = TOTAL_TURNS * 20 + 5000; // generous guard vs any softlock
  try {
    while (!c.finished) {
      if (++guardTurns > HARD_CAP) return { c, ok: false, err: `exceeded ${HARD_CAP} steps without finishing (possible softlock)` };
      const st = c.current();
      if (st.phase === 'focus') {
        const opt = st.focus[Math.floor(rng() * st.focus.length)];
        c.chooseFocus(opt.id);
      } else if (st.phase === 'offer') {
        const opt = st.offers[Math.floor(rng() * st.offers.length)];
        c.resolveOffer(opt.id);
      } else if (st.phase === 'coach') {
        const opt = st.coaches[Math.floor(rng() * st.coaches.length)];
        c.appointCoach(opt.id);
      } else if (st.phase === 'draft') {
        const opt = st.options[Math.floor(rng() * st.options.length)];
        c.draft(opt.id);
      } else {
        const opt = st.hand[Math.floor(rng() * st.hand.length)];
        c.play(opt.id);
      }
    }
    return { c, ok: true };
  } catch (err) {
    return { c, ok: false, err: (err as Error).stack ?? String(err) };
  }
}

console.log(`\n[qa-career] fuzzing ${N} careers (random-choice strategy, mixed tracks/agents/personalities)...`);

let softlocks = 0, exceptions = 0, checked = 0;
for (let i = 0; i < N; i++) {
  const seed = seedFrom('qa-career', i);
  const track: Track = i % 6 === 0 ? 'goalkeeper' : 'outfield';
  const agentId = i % 3 === 0 ? undefined : AGENTS[i % AGENTS.length].id;
  const ctx = `seed=${seed} (i=${i}) track=${track} agent=${agentId ?? 'none'}  repro: QA_SEED=${i} QA_TRACK=${track} QA_AGENT=${agentId ?? ''} npx tsx shared/qa_career_fuzz.ts --single`;

  const { c, ok, err } = playRandom(track, seed, agentId);
  if (!ok) {
    if (err?.includes('softlock')) softlocks++; else exceptions++;
    log(`${err?.includes('softlock') ? 'SOFTLOCK' : 'EXCEPTION'}: ${err}\n    ${ctx}`);
    continue;
  }

  let p;
  try {
    const genes = rollGenes(seedFrom('qa-genes', i));
    p = graduate(c.log, seed, genes, undefined, c.finContext());
  } catch (err) {
    exceptions++;
    log(`EXCEPTION in graduate(): ${(err as Error).stack ?? err}\n    ${ctx}`);
    continue;
  }
  checked++;
  checkPlayer(p, ctx);

  // sanity: age/chapter never go backwards, always terminate at exactly TOTAL_TURNS
  if (c.turn !== TOTAL_TURNS) log(`career finished at turn=${c.turn}, expected exactly ${TOTAL_TURNS}  ${ctx}`);
  if (c.age < 25 || c.age > 26) log(`graduation age=${c.age}, expected ~25  ${ctx}`); // PRO_AGE=25, rounding may hit 25/26

  // determinism: replay the EXACT same action sequence from the snapshot and expect byte-identical graduate()
  const snap = c.snapshot();
  const replayC = Career.resume(snap);
  if (!replayC.finished) log(`resume() did not finish an already-finished snapshot  ${ctx}`);
  const replayP = graduate(replayC.log, seed, rollGenes(seedFrom('qa-genes', i)), undefined, replayC.finContext());
  if (JSON.stringify(replayP) !== JSON.stringify(p)) log(`DETERMINISM BREAK: resume-replay produced a different player  ${ctx}`);
  if (JSON.stringify(replayC.log) !== JSON.stringify(c.log)) log(`DETERMINISM BREAK: resume-replay produced a different choice log  ${ctx}`);
}

console.log(`[qa-career] checked ${checked}/${N} (softlocks=${softlocks} exceptions=${exceptions})`);

// ---- targeted: simCareer() across many styles/skills/tracks/agents (mirrors career_sim.ts but wider net) ----
console.log(`\n[qa-career] simCareer sweep (styles × skills × agents × genes extremes)...`);
{
  const STYLES: Style[] = [
    { name: 'AllZero', pref: {}, skill: 0.01 },
    { name: 'AllMax', pref: Object.fromEntries(TAGS.map((t) => [t, 1])), skill: 0.99 },
    { name: 'Neg-ish', pref: { flair: -1, composure: -1 } as any, skill: 0.5 }, // malformed negative prefs
  ];
  const EXTREME_GENES = [
    { pace: { floor: 1, ceiling: 4 }, strength: { floor: 1, ceiling: 4 }, stamina: { floor: 1, ceiling: 4 } },
    { pace: { floor: 17, ceiling: 20 }, strength: { floor: 17, ceiling: 20 }, stamina: { floor: 17, ceiling: 20 } },
  ];
  let n = 0;
  for (let i = 0; i < 500; i++) {
    for (const style of STYLES) {
      for (const genes of EXTREME_GENES) {
        for (const track of ['outfield', 'goalkeeper'] as Track[]) {
          for (const agent of [undefined, ...AGENTS.map((a) => a.id)]) {
            n++;
            const seed = seedFrom('qa-sim', i, style.name, track, agent ?? 'none', genes.pace.floor);
            const ctx = `simCareer seed=${seed} style=${style.name} track=${track} agent=${agent ?? 'none'} genes.pace=[${genes.pace.floor},${genes.pace.ceiling}]`;
            try {
              const p = simCareer(seed, style, genes as any, track, agent);
              checkPlayer(p, ctx);
            } catch (err) {
              log(`EXCEPTION in simCareer: ${(err as Error).stack ?? err}\n    ${ctx}`);
            }
            if (n > 3000) break; // keep this sweep bounded
          }
        }
      }
    }
  }
  console.log(`[qa-career] simCareer sweep: ${Math.min(n, 3000)} combinations checked`);
}

// ---- determinism: identical (seed, track, agent) simCareer() called twice must be byte-identical ----
console.log(`\n[qa-career] determinism re-check on simCareer (call twice, compare)...`);
{
  let mismatches = 0;
  for (let i = 0; i < 300; i++) {
    const seed = seedFrom('qa-det', i);
    const style: Style = { name: 'x', pref: { creativity: 1, aggression: 0.5 }, skill: 0.3 + (i % 7) / 10 };
    const a = simCareer(seed, style);
    const b = simCareer(seed, style);
    if (JSON.stringify(a) !== JSON.stringify(b)) { mismatches++; log(`DETERMINISM BREAK: simCareer(seed=${seed}) differs across two calls with identical args`); }
  }
  console.log(`[qa-career] determinism re-check: ${mismatches} mismatch(es) out of 300`);
}

// ---- lineage: inheritGenes must stay in bounds across many parent/keepPct/ceilingLift combos ----
console.log(`\n[qa-career] lineage/inheritGenes bounds sweep...`);
{
  let n = 0;
  for (let i = 0; i < 2000; i++) {
    const parent = rollGenes(seedFrom('qa-lineage-parent', i));
    const keepPct = (i % 11) / 10; // 0.0 .. 1.0
    const ceilingLift = i % 5; // 0..4 (legacyBoost caps at 3, but test beyond too)
    const son = inheritGenes(parent, seedFrom('qa-lineage-son', i), keepPct, ceilingLift);
    n++;
    for (const band of ['pace', 'strength', 'stamina'] as const) {
      const b = son[band];
      if (!finite(b.floor) || !finite(b.ceiling)) log(`inheritGenes NON-FINITE band ${band}: ${JSON.stringify(b)}  parent=${JSON.stringify(parent[band])} keepPct=${keepPct} ceilingLift=${ceilingLift}`);
      else if (b.floor > b.ceiling) log(`inheritGenes floor>ceiling band ${band}: ${JSON.stringify(b)}  parent=${JSON.stringify(parent[band])} keepPct=${keepPct} ceilingLift=${ceilingLift}`);
      else if (b.floor < 1 || b.ceiling > 20) log(`inheritGenes out of [1,20] band ${band}: ${JSON.stringify(b)}  keepPct=${keepPct} ceilingLift=${ceilingLift}`);
    }
  }
  console.log(`[qa-career] lineage sweep: ${n} checked`);
}

if (failures.length) {
  console.error(`\n[qa-career] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log(`\n[qa-career] clean — no invariant violations found.`);
