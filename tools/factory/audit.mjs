// AUDIT WAVE — invoke with the Workflow tool: {scriptPath: 'tools/factory/audit.mjs', args: {...}}
//
//   args: { cells: [{subsystem, lens}], ledger: "<the current findings ledger, verbatim>" }
//
// Returns { findings: [...] } — confirmed, deduped, each with provenance. The caller persists them to
// docs/findings.md; a workflow script has no filesystem access, and keeping the ledger under one writer is
// what stops two waves interleaving into it.
export const meta = {
  name: 'audit-wave',
  description: 'Audit a slice of the subsystem x lens matrix, then adversarially verify every finding',
  phases: [
    { title: 'Audit', detail: 'one agent per subsystem x lens cell' },
    { title: 'Verify', detail: 'two adversaries per finding, both prompted to refute' },
  ],
}

const REPO = '/Users/cksmacbookair/Clause Coding/football-manager'

const HOUSE = `PROJECT: "Football Royalty" at ${REPO} — an offline, deterministic, pixel-art football
bloodline-dynasty life-sim heading for Steam. npm workspaces: shared/ is a pure deterministic engine (no
Date.now, no Math.random — those are enforced), client/ is Vite + TypeScript.

THE DEFECT CLASS THAT MATTERS MOST HERE, because this codebase produces it repeatedly: a mechanism that is
declared and never invoked, or a check that cannot fail. Real examples already found and fixed —
\`breederRevenue\` with no callers; \`deleteLoaneesInSeason\` with no callers; four \`transition: width\`
rules that never fired because the nodes are rebuilt by innerHTML each render; a \`scorepulse\` rule
overridden into unreachability; a Family Record built from tokens so it omitted every ancestor; a global
prefers-reduced-motion rule that deleted every toast in the game rather than calming it. Hunt for that
shape first — it is statically findable and it is where the bugs are.

RULES FOR YOUR OUTPUT:
- Cite file:line for every claim, and OPEN the file to confirm it before claiming it. An unverifiable
  finding is worse than none because it looks authoritative.
- Say plainly when something is fine. A wave that reports nothing is a valid result.
- Distinguish a DEFECT (the code does not do what it says) from a DECISION (a product judgement). Decisions
  are not bugs and must be marked as such — they go to a human queue, not to a fix agent.
- Do not propose rewrites. The smallest correct change wins.`

const FINDING = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'kind', 'where', 'evidence', 'why_it_matters', 'severity', 'effort'],
        properties: {
          title: { type: 'string', description: 'One line, specific. "X does Y when it should do Z".' },
          kind: { type: 'string', enum: ['defect', 'decision'] },
          where: { type: 'string', description: 'file:line, verified by opening the file' },
          evidence: { type: 'string', description: 'What you actually read that proves it — quote it' },
          why_it_matters: { type: 'string', description: 'The player-facing consequence. "Nothing visible" is an acceptable answer.' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          effort: { type: 'string', enum: ['trivial', 'small', 'medium', 'large'] },
          fix_sketch: { type: 'string', description: 'The smallest correct change, in a sentence or two' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['refuted', 'reasoning'],
  properties: {
    refuted: { type: 'boolean' },
    reasoning: { type: 'string' },
    correction: { type: 'string' },
    reclassify: { type: 'string', enum: ['defect', 'decision', 'unchanged'] },
  },
}

const cells = args?.cells ?? []
const ledger = args?.ledger ?? '(empty)'
if (!cells.length) return { findings: [], note: 'no cells requested' }

phase('Audit')

const raw = await parallel(cells.map((c) => () =>
  agent(`${HOUSE}

---

AUDIT ONE CELL of the matrix.

SUBSYSTEM: ${c.subsystem}
LENS: ${c.lens}

${c.brief ?? ''}

ALREADY KNOWN — do NOT re-report anything in this ledger. If you can only find things already on it, say so
and return an empty list; that is a useful result:

${ledger}

Return at most 6 findings. Fewer, verified, beats more.`,
    { label: `audit:${c.subsystem}/${c.lens}`, phase: 'Audit', schema: FINDING })
    .then((r) => (r?.findings ?? []).map((f) => ({ ...f, cell: `${c.subsystem}/${c.lens}` })))
))

const found = raw.filter(Boolean).flat()
log(`${found.length} candidate finding(s) from ${cells.length} cell(s)`)
if (!found.length) return { findings: [], note: 'nothing new' }

phase('Verify')

// Two adversaries, different lenses, both told to refute. On this project's numbers roughly four in five
// findings need correcting or die here — that is the lane working.
const judged = await parallel(found.map((f) => () =>
  parallel([
    `Check whether this is REAL. Open ${f.where}. Does the code actually do what the finding claims? Is the
     mechanism reachable in the shipped game at all? Does the quoted evidence say what it is claimed to say?
     Set refuted=true if the citation is wrong, the code has moved on, or the claim overstates what is there.`,
    `Check whether this MATTERS and is correctly classified. Would a player ever notice? Is the proposed fix
     the smallest correct change, or a rewrite wearing a disguise? Is this actually a DECISION (a product
     judgement, a cost, a licensing question, something irreversible) mislabelled as a defect? Set
     refuted=true if it is noise; set reclassify if the kind is wrong.`,
  ].map((p) => () =>
    agent(`${HOUSE}\n\n---\n\nFINDING:\n${JSON.stringify(f, null, 2)}\n\n${p}\n\nDefault to refuted=true when genuinely uncertain.`,
      { label: `verify:${String(f.title).slice(0, 26)}`, phase: 'Verify', schema: VERDICT })
  )).then((vs) => {
    const v = vs.filter(Boolean)
    const refuted = v.filter((x) => x.refuted)
    const recl = v.map((x) => x.reclassify).find((k) => k && k !== 'unchanged')
    return {
      ...f,
      kind: recl ?? f.kind,
      confirmed: refuted.length === 0,
      corrections: v.map((x) => x.correction).filter(Boolean),
      killed_because: refuted.map((x) => x.reasoning),
    }
  })
))

const all = judged.filter(Boolean)
const confirmed = all.filter((f) => f.confirmed)
log(`${confirmed.length} confirmed, ${all.length - confirmed.length} refuted`)

return {
  findings: confirmed,
  refuted: all.filter((f) => !f.confirmed).map((f) => ({ title: f.title, because: f.killed_because })),
  stats: { candidates: found.length, confirmed: confirmed.length, refuted: all.length - confirmed.length },
}
