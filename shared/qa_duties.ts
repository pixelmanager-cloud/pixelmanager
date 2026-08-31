// ── WHAT THIS GUARDS: shared/src/duties.ts — the per-player tactical duties ──────────────────────────
//
// Seven exports, five of which no harness had ever imported. The duty layer is the only thing that turns
// eleven stat-blocks into eleven characters, and it is a screen the player is invited to fiddle with
// eleven times before every match. That makes it the exact shape of thing this project keeps getting
// caught by: a control the UI offers, the copy describes, and the engine ignores.
//
// It has already happened here. `sweeper-keeper` was retired TODAY after `gkStep` turned out to widen
// only a clamp rail the keeper's own target equation could never reach — zero binds in 857,896 measured
// ticks, byte-identical matches, and a tactics screen offering a choice the engine never read. The
// wiring census in tools/playtest/tactics_matrix.ts now has an EMPTY known-inert list, but it only pairs
// SIX duty transitions out of the forty the four roles actually offer. So this file asks the four
// questions that class of defect is made of, over all eighteen duties:
//
//   1. DOES EVERY DUTY EXIST IN ALL FOUR TABLES, with real content? A duty with no label renders a blank
//      dropdown row; a duty in the tables that no role offers is a dial that cannot be reached.
//   2. IS ANY DUTY BYTE-IDENTICAL TO ANOTHER — structurally (same six mods) or, the harder and more
//      important question, IN REAL MATCHES? Two dropdown entries that play the same match are one dead
//      dial wearing two names, and the structural check alone cannot see it: mods can differ by an
//      amount the engine rounds away. Both are asserted, over all forty same-role pairs.
//   3. IS `defaultDuty` TOTAL AND ALWAYS LEGAL? It runs on every auto-picked squad in the game. A duty
//      it emits that `DUTIES_BY_ROLE` does not allow for that role is an illegal team sheet, and an
//      illegal sheet is how a club became unmanageable once already (docs/decisions-for-ck.md §14, §38).
//      Swept EXHAUSTIVELY over every attribute combination the function actually reads — 8,801 of them,
//      not a sample — plus NaN, Infinity, negatives, out-of-range and a player with no attributes.
//   4. DOES THE COPY DESCRIBE THE CODE? Nine duty/instruction descriptions were fixed today for
//      promising mechanics that do not exist. Every description here is turned into a predicate over the
//      mods it claims, anchored to a phrase that must still be present, so rewriting the copy forces the
//      claim to be re-derived rather than silently invalidated.
//
// I am explicit about the one thing I could NOT test: GK has exactly one duty, so there is no pair to
// compare and no bar below can tell you the keeper duty is wired — it is not, it is exactly NEUTRAL on
// all six fields, and that is checked and reported rather than assumed away by the retirement. The bar
// that exempts it is written so that adding a second GK duty removes the exemption automatically.
//
// The MEASURED section is deliberately NOT gated, following shared/qa_mental.ts: those are defects found
// while writing this file, and pinning today's behaviour would turn this harness red the day somebody
// fixes one. Every number in it is measured on this run.
import { DUTIES_BY_ROLE, DUTY_LABEL, DUTY_DESC, dutyMods, defaultDuty, effectiveDuty, isDutyForRole, type DutyMods } from './src/duties.js';
import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';
import { DEFAULT_TACTICS, TACTIC_PRESETS, type Tactics } from './src/tactics.js';
import type { Duty, Player, PlayerAttrs, Role, Team } from './src/types.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};
const defects: string[] = [];
const defect = (line: string) => { defects.push(line); console.log(`  DEFECT  ${line}`); };

const ROLES: Role[] = ['GK', 'DF', 'MF', 'FW'];
const OFFERED: Duty[] = ROLES.flatMap((r) => DUTIES_BY_ROLE[r]);
const FIELDS = ['push', 'come', 'shoot', 'magnet', 'press', 'hug'] as const;
type Field = (typeof FIELDS)[number];

/** The real neutral, taken from the module (`dutyMods(undefined)`) and SNAPSHOT so the mutation
 *  experiments further down cannot move the yardstick they are measured against. */
const NEUTRAL: DutyMods = { ...dutyMods(undefined) };
const isNeutral = (m: DutyMods) => FIELDS.every((f) => m[f] === NEUTRAL[f]);
const sameMods = (a: DutyMods, b: DutyMods) => FIELDS.every((f) => a[f] === b[f]);
const showMods = (m: DutyMods) => FIELDS.filter((f) => m[f] !== NEUTRAL[f]).map((f) => `${f} ${m[f]}`).join(' ') || '(neutral)';

const BASE_ATTRS: PlayerAttrs = {
  pace: 10, strength: 10, passing: 10, shooting: 10, tackling: 10,
  positioning: 10, workrate: 10, keeping: 10, setPiece: 10, stamina: 10,
};
const mkPlayer = (role: Role, over: Partial<PlayerAttrs> = {}, duty?: Duty): Player => ({
  id: 'p', name: 'P', role, anchor: { x: 50, y: 34 },
  attrs: { ...BASE_ATTRS, ...over },
  ...(duty ? { duty } : {}),
});

// ── §1  the four tables agree, and every entry has real content ──────────────────────────────────────
console.log('=== 1. DUTIES_BY_ROLE / DUTY_LABEL / DUTY_DESC / TABLE describe the SAME eighteen duties ===');
{
  // WHAT THIS CAN AND CANNOT CATCH, stated up front. `DUTY_LABEL`, `DUTY_DESC` and the mods table are
  // `Record<Duty, …>`, so a MISSING key is a compile error and `npm run typecheck:shared` owns it — a bar
  // here asserting "every offered duty has a label" is a bar that cannot fail, the exact thing this
  // project has been burned by five times. The falsifiable directions are the other three: a duty in the
  // tables that NO role offers (unreachable — this is what `sweeper-keeper` looked like before it was
  // removed from the union), an entry whose content is empty/duplicated, and a mods entry that is not
  // six finite numbers.
  const inTables = Object.keys(DUTY_LABEL) as Duty[];
  const offeredSet = new Set<string>(OFFERED);
  const orphans = inTables.filter((d) => !offeredSet.has(d));
  ok('no duty exists in the tables that no role can select', orphans.length === 0,
    orphans.length ? `unreachable: ${orphans.join(', ')}` : `${inTables.length} duties, all offered`);
  ok('every offered duty is one the label/desc tables know', OFFERED.every((d) => inTables.includes(d)),
    `${OFFERED.length} offered`);
  ok('no duty is offered under two different roles', new Set(OFFERED).size === OFFERED.length,
    `${OFFERED.length} slots, ${new Set(OFFERED).size} distinct`);

  const blankLabel = OFFERED.filter((d) => typeof DUTY_LABEL[d] !== 'string' || DUTY_LABEL[d].trim() === '');
  const blankDesc = OFFERED.filter((d) => typeof DUTY_DESC[d] !== 'string' || DUTY_DESC[d].trim().length < 20);
  ok('no duty renders a blank dropdown row', blankLabel.length === 0, blankLabel.join(', ') || 'all 18 labelled');
  ok('no duty has an empty or stub tooltip', blankDesc.length === 0, blankDesc.join(', ') || 'all 18 described');
  ok('every label is distinct (two identical rows in one dropdown is one dial wearing two names)',
    new Set(OFFERED.map((d) => DUTY_LABEL[d])).size === OFFERED.length);
  ok('every description is distinct', new Set(OFFERED.map((d) => DUTY_DESC[d])).size === OFFERED.length);

  const badMods = OFFERED.filter((d) => {
    const m = dutyMods(d) as DutyMods | undefined;
    return !m || FIELDS.some((f) => typeof m[f] !== 'number' || !Number.isFinite(m[f]));
  });
  ok('every duty resolves to six finite mods', badMods.length === 0, badMods.join(', ') || `${OFFERED.length} duties`);

  // "first entry is the neutral default" — the claim in DUTIES_BY_ROLE's own doc comment. Tie it to the
  // code rather than to a re-typed list: the duty a PERFECTLY AVERAGE player (every attribute 10) is
  // auto-assigned must be his role's first entry.
  const firstIsAvg = ROLES.every((r) => defaultDuty(mkPlayer(r)) === DUTIES_BY_ROLE[r][0]);
  ok("each role's first duty is the one an all-10 player is auto-assigned", firstIsAvg,
    ROLES.map((r) => `${r} ${DUTIES_BY_ROLE[r][0]}`).join(' '));
  ok('every role offers at least one duty', ROLES.every((r) => DUTIES_BY_ROLE[r].length >= 1));
}

// ── §2  no duty is a dead dial, structurally ─────────────────────────────────────────────────────────
console.log('\n=== 2. STRUCTURAL: no duty is NEUTRAL, and no two duties in a role share one set of mods ===');
{
  // THE GK EXEMPTION IS WRITTEN SO IT EXPIRES BY ITSELF. `keeper` IS exactly NEUTRAL — the retirement of
  // `sweeper-keeper` removed the second option but did not give the survivor anything to do. That is not
  // a dead dial today, because a role with one option is not a choice; it becomes one the instant a
  // second GK duty appears, and then this bar starts covering `keeper` with no edit here.
  const choosable = ROLES.filter((r) => DUTIES_BY_ROLE[r].length > 1);
  const soleOption = ROLES.filter((r) => DUTIES_BY_ROLE[r].length === 1).flatMap((r) => DUTIES_BY_ROLE[r]);
  const inert = choosable.flatMap((r) => DUTIES_BY_ROLE[r]).filter((d) => isNeutral(dutyMods(d)));
  ok('every duty the player can CHOOSE BETWEEN differs from neutral on at least one field',
    inert.length === 0, inert.length ? `INERT: ${inert.join(', ')}` : `${choosable.flatMap((r) => DUTIES_BY_ROLE[r]).length} choosable duties`);
  ok('exactly one role is a non-choice, and it is GK/keeper (this exemption expires if a GK duty is added)',
    soleOption.length === 1 && soleOption[0] === 'keeper' && DUTIES_BY_ROLE.GK.length === 1,
    `sole-option duties: ${soleOption.join(', ') || 'none'}`);
  console.log(`  note keeper mods = ${showMods(dutyMods('keeper'))} — checked, not assumed: the retirement removed the CHOICE, not the neutrality.`);

  let dupes: string[] = [];
  for (const r of ROLES) {
    const ds = DUTIES_BY_ROLE[r];
    for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
      if (sameMods(dutyMods(ds[i]), dutyMods(ds[j]))) dupes.push(`${r}: ${ds[i]} == ${ds[j]}`);
    }
  }
  ok('no two duties in the same role carry identical mods', dupes.length === 0, dupes.join('; ') || '40 same-role pairs, all distinct');

  // A FIELD NOTHING MOVES IS A DEAD KNOB. `hug` was added for the wide roles; if a refactor ever drops
  // the one duty that sets a field, that field becomes six lines of doc comment describing nothing.
  const deadFields = FIELDS.filter((f) => OFFERED.every((d) => dutyMods(d)[f] === NEUTRAL[f]));
  ok('every field of DutyMods is moved by at least one duty', deadFields.length === 0,
    deadFields.length ? `never used: ${deadFields.join(', ')}` : FIELDS.map((f) => `${f}:${OFFERED.filter((d) => dutyMods(d)[f] !== NEUTRAL[f]).length}`).join(' '));
}

// ── §3  defaultDuty is total, legal and pure ─────────────────────────────────────────────────────────
console.log('\n=== 3. defaultDuty: total over every role and every attribute set, always a LEGAL duty ===');
{
  const legal = (r: Role, d: Duty) => (DUTIES_BY_ROLE[r] as string[]).includes(d as string);
  let n = 0, illegal: string[] = [], undef = 0;
  const emitted = new Set<Duty>();
  const record = (r: Role, p: Player) => {
    n++;
    const d = defaultDuty(p);
    if (d === undefined) { undef++; return; }
    emitted.add(d);
    if (!legal(r, d)) illegal.push(`${r}(${JSON.stringify(p.attrs)}) -> ${d}`);
  };

  // EXHAUSTIVE over the attributes each branch actually reads, not a sample. DF reads tackling +
  // positioning (400 cells), MF reads passing + tackling + workrate (8,000), FW reads strength + pace
  // (400). Sampling would leave the boundary cases — where the +1/+2 thresholds tie — untested, and the
  // ties are where a switch like this goes wrong.
  record('GK', mkPlayer('GK'));
  for (let t = 1; t <= 20; t++) for (let g = 1; g <= 20; g++) record('DF', mkPlayer('DF', { tackling: t, positioning: g }));
  for (let p = 1; p <= 20; p++) for (let t = 1; t <= 20; t++) for (let w = 1; w <= 20; w++) record('MF', mkPlayer('MF', { passing: p, tackling: t, workrate: w }));
  for (let s = 1; s <= 20; s++) for (let pc = 1; pc <= 20; pc++) record('FW', mkPlayer('FW', { strength: s, pace: pc }));
  ok(`defaultDuty is legal for its role on all ${n} exhaustive attribute cells`, illegal.length === 0 && undef === 0,
    illegal.length ? illegal.slice(0, 3).join(' | ') : `${undef} undefined; emitted ${emitted.size} distinct duties`);

  // DEGENERATE INPUTS. A save can carry anything: the mental layer already ships a NaN that "permanently
  // poisoned the wallet" twelve files away, and `overall()` defaults a missing attribute. defaultDuty
  // must still hand back a duty the team sheet will accept — never undefined, never a throw.
  const WILD = [0, 21, -5, 1e9, -1e9, NaN, Infinity, -Infinity];
  let wildN = 0, wildBad: string[] = [], threw = 0;
  for (const r of ROLES) for (const a of WILD) for (const b of WILD) {
    const over: Partial<PlayerAttrs> = r === 'DF' ? { tackling: a, positioning: b }
      : r === 'MF' ? { passing: a, tackling: b, workrate: a }
        : r === 'FW' ? { strength: a, pace: b } : {};
    wildN++;
    try {
      const d = defaultDuty(mkPlayer(r, over));
      if (d === undefined || !legal(r, d)) wildBad.push(`${r} ${a}/${b} -> ${d}`);
    } catch { threw++; }
  }
  // and a player with NO attributes at all (a passed-over bloodline brother: `attrs: {}`, see api.ts)
  for (const r of ROLES) {
    wildN++;
    try {
      const d = defaultDuty({ id: 'x', name: 'X', role: r, anchor: { x: 0, y: 0 }, attrs: {} as PlayerAttrs });
      if (d === undefined || !legal(r, d)) wildBad.push(`${r} no-attrs -> ${d}`);
    } catch { threw++; }
  }
  ok(`defaultDuty survives ${wildN} degenerate attribute sets (NaN, ±Infinity, out-of-range, no attrs)`,
    wildBad.length === 0 && threw === 0, wildBad.slice(0, 3).join(' | ') || `${threw} threw`);

  // PURE. The header claims "deterministic, no RNG" — the whole commit-reveal replay contract rests on it.
  let stable = true;
  for (let t = 1; t <= 20; t++) for (let g = 1; g <= 20; g++) {
    const p = mkPlayer('DF', { tackling: t, positioning: g });
    if (defaultDuty(p) !== defaultDuty(p) || defaultDuty(p) !== defaultDuty({ ...p })) stable = false;
  }
  ok('defaultDuty is a pure function of the player (same answer every call)', stable);

  // isDutyForRole is the sanitiser the client leans on in four separate places.
  const sane = isDutyForRole('DF', 'cover') && !isDutyForRole('DF', 'poacher') && !isDutyForRole('GK', 'sweeper-keeper')
    && !isDutyForRole('MF', 42) && !isDutyForRole('MF', null) && !isDutyForRole('MF', undefined)
    && !isDutyForRole('FW', {}) && !isDutyForRole('FW', ['poacher']);
  ok('isDutyForRole rejects a wrong-role duty, a retired duty and every non-string', sane);
}

// ── §4  effectiveDuty ────────────────────────────────────────────────────────────────────────────────
console.log('\n=== 4. effectiveDuty: the override when there is one, the stat-derived pick when there is not ===');
{
  let auto = 0, override = 0;
  for (const r of ROLES) for (const d of DUTIES_BY_ROLE[r]) {
    if (effectiveDuty(mkPlayer(r, {}, d)) === d) override++;
  }
  for (let t = 1; t <= 20; t++) for (let g = 1; g <= 20; g++) {
    const p = mkPlayer('DF', { tackling: t, positioning: g });
    if (effectiveDuty(p) === defaultDuty(p)) auto++;
  }
  ok('an explicit legal duty is honoured for every role/duty pair', override === OFFERED.length, `${override}/${OFFERED.length}`);
  ok('a player with no duty falls through to defaultDuty on every cell', auto === 400, `${auto}/400`);
}

// ── §5  the copy oracle: does each description describe the mods it ships with? ──────────────────────
console.log('\n=== 5. COPY vs MODS — every description turned into a predicate over the six fields ===');
{
  // HOW TO READ THIS. Each row is a claim I derived by reading the description, paired with the PHRASE
  // that justifies it. The phrase is asserted separately: if somebody rewrites the copy, the phrase bar
  // goes red and the claim has to be re-derived, rather than the claim quietly becoming a check on text
  // that is no longer there. `hug` is the ONLY field that moves a player laterally (DutyMods' own doc:
  // "stretches (+) or narrows (-) the player's lateral anchor offset from the centre"); `come` is added
  // to pullX only, which is the along-the-pitch axis. So any description promising infield/touchline
  // behaviour is a claim about `hug` and nothing else can satisfy it.
  const CLAIMS: Array<{ d: Duty; phrase: string; claim: string; holds: (m: DutyMods) => boolean }> = [
    { d: 'keeper', phrase: 'Stays on his line', claim: 'promises no off-ball change → mods stay neutral', holds: (m) => isNeutral(m) },
    { d: 'cover', phrase: 'Sits off', claim: 'sits off and drops → press < 0 and push < 1', holds: (m) => m.press < 0 && m.push < 1 },
    { d: 'stopper', phrase: 'Steps up to engage', claim: 'steps up and engages → push > 1 and press > 0', holds: (m) => m.push > 1 && m.press > 0 },
    { d: 'ball-playing-defender', phrase: 'starts attacks from deep', claim: 'is looked for as the out-ball → magnet > 0', holds: (m) => m.magnet > 0 },
    { d: 'inverted-fullback', phrase: 'instead of hugging the touchline', claim: 'tucks INFIELD → hug < 0', holds: (m) => m.hug < 0 },
    { d: 'wing-back', phrase: 'width and end product', claim: 'bombs on and provides width → push > 1 and hug > 0', holds: (m) => m.push > 1 && m.hug > 0 },
    { d: 'sweeper', phrase: 'covers rather than engages', claim: 'covers rather than engaging → press < 0', holds: (m) => m.press < 0 },
    { d: 'anchor', phrase: 'never strays from his zone', claim: 'holds his zone → must not be biased TOWARD leaving it to chase (press <= 0)', holds: (m) => m.press <= 0 },
    { d: 'wide-playmaker', phrase: 'Hugs the touchline', claim: 'hugs the touchline and dictates → hug > 0 and magnet > 0', holds: (m) => m.hug > 0 && m.magnet > 0 },
    { d: 'inverted-winger', phrase: 'Cuts inside off the touchline', claim: 'cuts inside, hunts the box → hug < 0 and shoot > 1', holds: (m) => m.hug < 0 && m.shoot > 1 },
    { d: 'box-to-box', phrase: 'Covers the full length of the pitch', claim: 'gets further forward than a fixed-zone man → push > 1', holds: (m) => m.push > 1 },
    { d: 'playmaker', phrase: 'Beats you with passing', claim: 'passes rather than shoots → magnet > 0 and shoot < 1', holds: (m) => m.magnet > 0 && m.shoot < 1 },
    { d: 'ball-winner', phrase: 'close down hard', claim: 'licence to close down → press > 0', holds: (m) => m.press > 0 },
    { d: 'deep-lying-playmaker', phrase: 'sits deep and dictates tempo', claim: 'sits deep, sprays it → push < 1 and magnet > 0', holds: (m) => m.push < 1 && m.magnet > 0 },
    { d: 'poacher', phrase: 'maximum finishing instinct', claim: 'shoots more, plays higher → shoot > 1 and push > 1', holds: (m) => m.shoot > 1 && m.push > 1 },
    { d: 'target-man', phrase: 'holds up play for others', claim: 'is played into as the hold-up man → magnet > 0', holds: (m) => m.magnet > 0 },
    { d: 'pressing-forward', phrase: 'first line of the press', claim: 'presses from the front → press > 0', holds: (m) => m.press > 0 },
    { d: 'false-9', phrase: 'Drops off the front line', claim: 'drops off to link → push < 1 and come > 0', holds: (m) => m.push < 1 && m.come > 0 },
  ];

  // A confession, not a specification — same idiom as tactics_matrix.ts's KNOWN_INERT. The bar only
  // forbids this list GROWING, so fixing one of these keeps the harness green (the correct direction);
  // adding a nineteenth duty whose copy outruns its mods turns it red.
  const KNOWN_COPY_GAPS: Duty[] = ['inverted-fullback', 'anchor'];

  ok('every duty carries a copy claim (no duty escapes this section by not being listed)',
    CLAIMS.length === OFFERED.length && OFFERED.every((d) => CLAIMS.some((c) => c.d === d)),
    `${CLAIMS.length} claims / ${OFFERED.length} duties`);
  const lostPhrase = CLAIMS.filter((c) => !DUTY_DESC[c.d].includes(c.phrase));
  ok('every claim is still anchored to text that is actually in DUTY_DESC', lostPhrase.length === 0,
    lostPhrase.map((c) => `${c.d}: "${c.phrase}"`).join('; ') || `${CLAIMS.length} phrases present`);

  const gaps = CLAIMS.filter((c) => !c.holds(dutyMods(c.d)));
  for (const g of gaps) console.log(`  gap  ${g.d.padEnd(22)} says "${g.phrase}" — ${g.claim}; ships ${showMods(dutyMods(g.d))}`);
  const newGaps = gaps.filter((g) => !KNOWN_COPY_GAPS.includes(g.d));
  ok('no NEW duty description promises a behaviour its mods cannot produce', newGaps.length === 0,
    `${gaps.length} gap(s), all known${newGaps.length ? `; NEW: ${newGaps.map((g) => g.d).join(', ')}` : ''}  [known today: ${KNOWN_COPY_GAPS.join(' | ')}]`);
}

// ── §6  LIVE: every duty the tactics screen offers changes real matches ─────────────────────────────
console.log('\n=== 6. LIVE — all 40 same-role duty pairs, paired on identical seeds, through the real engine ===');

const P = Number(process.env.DUTY_PAIRS ?? 12);
const mk = (id: string, q: number, seed: number) => generateTeam(id, id.toUpperCase(), 1, q, seed, '4-4-2');
const withDuty = (t: Team, role: Role, duty: Duty | undefined): Team =>
  ({ ...t, players: t.players.map((p) => (p.role === role ? { ...p, duty } : p)) });

interface RunOut { fp: string; team: Team; wideY: number; wideN: number }
function run(a: Team, b: Team, seed: number, ta: Tactics = DEFAULT_TACTICS, tb: Tactics = DEFAULT_TACTICS): RunOut {
  const m = new MatchEngine([a, b], seed, [ta, tb]);
  let wideY = 0, wideN = 0;
  while (!m.state.finished) {
    m.tick();
    // lateral footprint of team 0's two WIDE defenders (4-4-2 slots 1 and 4, anchored 24m off centre)
    // while team 0 is the side in possession — the only phase in which `hug` is applied at all.
    if (m.state.carrier?.teamIdx === 0) {
      wideY += Math.abs(m.state.players[0][1].y - 34) + Math.abs(m.state.players[0][4].y - 34);
      wideN += 2;
    }
  }
  // FINGERPRINT: score, every event, and the final position of all 22 players to the millimetre. This is
  // the resolution that caught the sweeper-keeper — a dial that changes a player's target by a hair still
  // moves the last decimal of somebody's position by the 90th minute.
  const fp = `${m.state.score.join('-')}|${m.state.events.length}|`
    + m.state.players.map((side) => side.map((p) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`).join(';')).join('#');
  return { fp, team: m.teams[0], wideY, wideN };
}

const fps: Record<string, string[]> = {};
const runsFor = (role: Role, d: Duty): RunOut[] => {
  const out: RunOut[] = [];
  for (let i = 0; i < P; i++) out.push(run(withDuty(mk('a', 13, i * 7 + 1), role, d), mk('b', 13, i * 11 + 3), i * 31 + 5));
  return out;
};
const t0 = Date.now();
for (const r of ROLES) for (const d of DUTIES_BY_ROLE[r]) fps[d] = runsFor(r, d).map((x) => x.fp);
{
  const rows: string[] = [];
  let worst = { pair: '', frac: Number.POSITIVE_INFINITY }, pairs = 0;
  for (const r of ROLES) {
    const ds = DUTIES_BY_ROLE[r];
    for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
      pairs++;
      const diff = fps[ds[i]].filter((f, k) => f !== fps[ds[j]][k]).length;
      const frac = diff / P;
      if (frac < worst.frac) worst = { pair: `${r} ${ds[i]}/${ds[j]}`, frac };
      if (frac < 1) rows.push(`${r} ${ds[i]} vs ${ds[j]}: ${diff}/${P}`);
    }
  }
  ok(`all ${pairs} same-role duty pairs play DIFFERENT matches on at least half the seeds`,
    worst.frac >= 0.5, `weakest pair ${worst.pair || 'n/a'} at ${(100 * worst.frac).toFixed(0)}%` + (rows.length ? `; below ${P}/${P}: ${rows.join(', ')}` : `; every pair diverged on all ${P} seeds`));
  // NOT COVERED, AND SAYING SO. GK offers one duty, so it contributes zero pairs: nothing here tests
  // whether `keeper` reaches the engine, and §2 shows it has nothing to reach it with.
  console.log(`  note ${pairs} pairs came from DF/MF/FW; GK contributed 0 (one duty, no choice to test). ${P} paired matches per duty, ${(((Date.now() - t0) / 1000)).toFixed(1)}s.`);
}

// ── MEASURED (NOT gated) — defects and characterisations found while writing this file ───────────────
console.log('\n=== MEASURED — reported as defects, NOT gated ===');

// M1 — the lateral gap. `inverted-fullback` is the only duty whose description is ENTIRELY about lateral
// position and whose `hug` is 0.
{
  const lat = (d: Duty) => {
    let y = 0, n = 0;
    for (let i = 0; i < 4; i++) { const r = run(withDuty(mk('a', 13, i * 7 + 1), 'DF', d), mk('b', 13, i * 11 + 3), i * 31 + 5); y += r.wideY; n += r.wideN; }
    return y / n;
  };
  const base = lat('cover'), ifb = lat('inverted-fullback'), wb = lat('wing-back');
  // AND THE MECHANISM DOES EXIST. Give this duty alone the hug its own sentence asks for and the width
  // moves — measured here rather than argued, then put straight back. `inverted-fullback` is never
  // emitted by defaultDuty (see M4), so the opponent's auto-picked defenders cannot be touched by this.
  const shipped = dutyMods('inverted-fullback').hug;
  dutyMods('inverted-fullback').hug = -0.6;
  const wired = lat('inverted-fullback');
  dutyMods('inverted-fullback').hug = shipped;
  console.log(`  M1 mean lateral offset of the two WIDE defenders while attacking (anchored 24.0 m off centre):`);
  console.log(`     cover ${base.toFixed(3)} m  |  inverted-fullback ${ifb.toFixed(3)} m  |  wing-back ${wb.toFixed(3)} m`);
  console.log(`     inverted-fullback moves the width by ${(ifb - base).toFixed(3)} m vs a duty that makes no lateral claim at all;`);
  console.log(`     wing-back, whose copy makes the OPPOSITE claim, moves it ${(wb - base).toFixed(3)} m. hug: cover ${dutyMods('cover').hug}, inverted-fullback ${dutyMods('inverted-fullback').hug}, wing-back ${dutyMods('wing-back').hug}.`);
  console.log(`     the same duty with hug=-0.6 temporarily wired in: ${wired.toFixed(3)} m (${(wired - ifb).toFixed(3)} m of tuck) — the mechanism exists, this duty is simply not connected to it. Restored: hug=${dutyMods('inverted-fullback').hug}.`);
  defect(`inverted-fullback: "${DUTY_DESC['inverted-fullback']}" ships hug=0 — the one field that moves a player laterally. `
    + `Its three lateral siblings all set it (wing-back +0.55, wide-playmaker +0.65, inverted-winger -0.60). The duty is not inert (push/come/magnet/press all move), but the behaviour its NAME and its tooltip promise is the one thing it does not do.`);
}

// M2 — `push` is multiplied by the team's attackPush, which is EXACTLY ZERO at mentality -2.
{
  // ISOLATED BY MUTATION: two variants of ONE duty differing only in `push`, so nothing else can explain
  // a divergence. The carrier is `sweeper`, chosen because M4 shows defaultDuty never emits it — the
  // opponent's auto-picked defenders therefore cannot be touched by the mutation. (The first draft of
  // this measurement used `cover`, which defaultDuty gives to 18% of every squad in the game, so the
  // mutation reached BOTH sides and the deep run diverged for a reason that had nothing to do with the
  // dial under test. A confounded probe that prints a number is worse than no probe.)
  const snap: DutyMods = { ...dutyMods('sweeper') };
  const sweep = (tac: Tactics) => {
    let diff = 0;
    for (let i = 0; i < P; i++) {
      dutyMods('sweeper').push = 0.4;
      const lo = run(withDuty(mk('a', 13, i * 7 + 1), 'DF', 'sweeper'), mk('b', 13, i * 11 + 3), i * 31 + 5, tac).fp;
      dutyMods('sweeper').push = 1.6;
      const hi = run(withDuty(mk('a', 13, i * 7 + 1), 'DF', 'sweeper'), mk('b', 13, i * 11 + 3), i * 31 + 5, tac).fp;
      if (lo !== hi) diff++;
    }
    return diff;
  };
  const neutralTac = sweep(DEFAULT_TACTICS);
  const deep = sweep({ ...DEFAULT_TACTICS, mentality: -2 });
  const bus = sweep(TACTIC_PRESETS['Park the Bus']);
  Object.assign(dutyMods('sweeper'), snap);
  console.log(`  M2 push 0.4 vs 1.6 on all four defenders, paired on ${P} seeds — the ONLY difference between the two runs:`);
  console.log(`     mentality  0 : ${neutralTac}/${P} matches differ   |  mentality -2 : ${deep}/${P}   |  Park the Bus preset : ${bus}/${P}`);
  console.log(`     restored: sweeper push=${dutyMods('sweeper').push}`);
  if (deep === 0 && bus === 0) {
    defect(`the \`push\` field of EVERY duty is byte-for-byte inert whenever the side's mentality is -2. deriveMods gives attackPush = 6 + mentality*3, `
      + `which is exactly 0 there, and engine.ts:384 multiplies dm.push into it — so at the most defensive setting a wing-back who "bombs on" and an `
      + `anchor who "never strays" take up identical attacking positions. Park the Bus is a shipped preset, and push is the field the most duties use `
      + `(15 of 18). This is arithmetically inevitable rather than a coding slip — the design question is whether attackPush should bottom out at exactly `
      + `zero, or whether duty push should be additive so it survives a defensive mentality. Same failure shape as the retired gkStep: a multiplier onto `
      + `a term that can be zero.`);
  } else {
    console.log(`     push survives mentality -2 in this fixture — the zero-attackPush hypothesis is NOT confirmed.`);
  }
}

// M3 — dutyMods is not total outside its declared type, and effectiveDuty does not check legality.
{
  const stale = dutyMods('sweeper-keeper' as Duty) as DutyMods | undefined;
  const illegalKept = effectiveDuty(mkPlayer('DF', {}, 'poacher'));
  let threw = '';
  try {
    const t = mk('a', 13, 1);
    t.players[0] = { ...t.players[0], duty: 'sweeper-keeper' as Duty };
    run(t, mk('b', 13, 3), 5);
  } catch (e) { threw = (e as Error).message.split('\n')[0]; }
  console.log(`  M3 dutyMods('sweeper-keeper') = ${stale === undefined ? 'undefined' : showMods(stale)}; effectiveDuty(DF with duty 'poacher') = '${illegalKept}'.`);
  console.log(`     a match with one such player: ${threw ? `THROWS — ${threw}` : 'completed normally'}`);
  defect(`dutyMods returns \`undefined\` for any duty string outside the union instead of falling back to NEUTRAL, and effectiveDuty passes `
    + `a stored duty through without checking it against DUTIES_BY_ROLE. A duty retired from the union TODAY ('sweeper-keeper') is exactly such a `
    + `string, and a save written before today can carry it in \`standingOrders.duties[0]\`; reconcileSheet (teamsheet.ts:120) returns early and never `
    + `revalidates an untouched slot's duty. I did NOT find a live path in the shipped client — the lineup editor re-filters with isDutyForRole at `
    + `main.ts:4332 and setStandingOrders calls cleanDuties — so this is a one-missed-call-site crash, not a reachable one today. The module owns a `
    + `total function; it does not provide one.`);
}

// M4 — what defaultDuty actually emits across the squads the game mints.
{
  const census = new Map<Duty, number>();
  let players = 0;
  for (let tier = 1; tier <= 10; tier++) for (let s = 0; s < 40; s++) {
    for (const p of mk('c', Math.max(3, 20 - tier * 1.7), tier * 1000 + s).players) {
      players++;
      const d = defaultDuty(p);
      census.set(d, (census.get(d) ?? 0) + 1);
    }
  }
  const never = OFFERED.filter((d) => !census.has(d));
  console.log(`  M4 defaultDuty over ${players} generated players across all ten tiers: ${census.size} of ${OFFERED.length} duties ever emitted.`);
  console.log(`     ${[...census.entries()].sort((a, b) => b[1] - a[1]).map(([d, c]) => `${d} ${((100 * c) / players).toFixed(1)}%`).join('  ')}`);
  console.log(`     never auto-assigned (${never.length}): ${never.join(', ')}`);
  console.log(`     the DF default is 'cover' ${(100 * (census.get('cover') ?? 0) / players).toFixed(1)}% of all players — mods ${showMods(dutyMods('cover'))}, i.e. an auto-picked squad's `
    + `average defender is given a SIT-OFF bias, not a neutral one; docs/decisions-for-ck.md §40 measures cover/anchor/target-man as the worst combination in the game.`);
}

// M5 — dutyMods hands out the live table object, shared by every player in the match.
{
  const a = dutyMods('poacher'), b = dutyMods('poacher');
  const before = a.shoot;
  a.shoot = 99;
  const leaked = dutyMods('poacher').shoot === 99;
  a.shoot = before;
  console.log(`  M5 dutyMods('poacher') === dutyMods('poacher') : ${a === b}; writing to the returned object leaks to later calls : ${leaked}; restored : ${dutyMods('poacher').shoot === before}`);
  defect(`dutyMods returns the module's own mutable table entry, not a copy — one write corrupts that duty for every player, in every match, for the life of the process. `
    + `Nothing in shared/ or client/ writes to it today (the engine only reads), so this is a live hazard rather than a live bug; M2 above uses it deliberately as a test seam.`);
}

// M6 — a substitute inherits the outgoing player's duty even when no like-for-like cover exists.
{
  // The first draft of this counted illegal duties across §6's matches and printed a reassuring 0/2376.
  // It was a number about nothing: `generateTeam` returns no bench, so those 216 matches contained ZERO
  // substitutions and the sub path was never entered. Staged properly here instead — a bench of nothing
  // but forwards, so `makeSub`'s like-for-like search MUST fall through to bench[0] when a defender
  // goes off.
  let subs = 0, illegal = 0, slots = 0;
  const examples: string[] = [];
  for (let i = 0; i < 8; i++) {
    // and the XI must carry EXPLICIT duties: `generateTeam` sets none, so `duty: outP.duty` copies
    // `undefined` and the incoming man harmlessly re-derives his own. A real team sheet always has all
    // eleven set, which is the case worth measuring.
    let a = mk('a', 13, i * 7 + 1);
    for (const r of ROLES) a = withDuty(a, r, DUTIES_BY_ROLE[r][DUTIES_BY_ROLE[r].length - 1]);
    const spare = mk('z', 13, i * 3 + 99).players.filter((p) => p.role === 'FW');
    const bench: Player[] = [];
    for (let k = 0; k < 7; k++) bench.push({ ...spare[k % spare.length], id: `bench-${k}`, role: 'FW', duty: undefined });
    const before = a.players.map((p) => ({ id: p.id, role: p.role, duty: p.duty }));
    const out = run({ ...a, bench }, mk('b', 13, i * 11 + 3), i * 31 + 5);
    out.team.players.forEach((p, idx) => {
      slots++;
      if (p.id === before[idx].id) return;
      subs++;
      if (p.duty && !isDutyForRole(p.role, p.duty)) {
        illegal++;
        if (examples.length < 2) examples.push(`${before[idx].role} '${before[idx].duty}' -> ${p.role} keeps '${p.duty}'`);
      }
    });
  }
  console.log(`  M6 8 matches, an XI with all eleven duties set explicitly and a bench of forwards only: ${subs} substitutions over ${slots} XI slots, `
    + `${illegal} of which left a player carrying a duty ILLEGAL for his own role${examples.length ? ` (e.g. ${examples.join('; ')})` : ''}`
    + ` — engine.ts:293 hands the incoming man the outgoing man's duty, and makeSub falls back to bench[0] when no like-for-like exists.`);
  console.log(`     NOT A DEFECT — this is the design working: a duty belongs to the SLOT, not the man (teamsheet.ts, "A DUTY BELONGS TO THE SLOT'S MAN"), so a forward covering at full-back does the full-back's job.`
    + ` Recorded so nobody re-opens it: the illegal-looking pairing is deliberate, and DUTIES_BY_ROLE is a constraint on the team SHEET, not on the pitch.`);
}

// M7 — the anchor's copy, already on the record.
console.log(`  M7 anchor ships ${showMods(dutyMods('anchor'))} against "${DUTY_DESC['anchor']}" — press +0.75 is the second-highest in the game, behind only`
  + ` ball-winner (+${dutyMods('ball-winner').press}), whose copy is explicitly "licence to close down hard". pressers() subtracts press*3 metres from a player's distance to the ball,`
  + ` so the duty that promises never to leave its zone is biased toward being picked to chase. ALREADY ON THE RECORD as false copy: docs/decisions-for-ck.md §11 and §40, where CK chose to keep the duty.`);

// M8 — two descriptions name mechanics the engine has no representation for at all.
console.log(`  M8 copy naming mechanics that do not exist in the engine (not gated — flavour, but flavour that promises): false-9 "dragging his marker out of position"`
  + ` (there is no man-marking; defenders position off anchor + ball) and target-man "wins aerial ball" (headers are decided by setPiece/strength at corners, never by duty).`);

console.log(`\n${'-'.repeat(96)}`);
console.log(`${defects.length} defect(s) reported above; ${fails} gated check(s) failed.`);
console.log(fails
  ? `\n✗ ${fails} duty check(s) failed`
  : '\n✓ the eighteen duties are complete, distinct, legally auto-assigned, and every one the screen offers changes real matches');
if (fails) process.exit(1);
