// FIX WAVE — invoke with the Workflow tool: {scriptPath: 'tools/factory/fix.mjs', args: {...}}
//
//   args: { findings: [ {id, title, where, evidence, fix_sketch, ...} ] }
//
// One agent per finding, each in ITS OWN GIT WORKTREE so parallel edits cannot collide. Nothing is merged
// here: each agent leaves a committed branch and reports what it did, and merging is done afterwards one at
// a time behind a full gate. Parallel merges into main is how a green tree becomes a broken one.
export const meta = {
  name: 'fix-wave',
  description: 'Fix confirmed findings in isolated worktrees, probe-first, one agent per finding',
  phases: [
    { title: 'Fix', detail: 'probe first, then the smallest correct change' },
    { title: 'Review', detail: 'an independent reader checks the diff before it is queued for merge' },
  ],
}

const REPO = '/Users/cksmacbookair/Clause Coding/football-manager'

const HOUSE = `PROJECT: "Football Royalty" — offline, deterministic, pixel-art football dynasty sim.
shared/ is a PURE engine: no Date.now, no Math.random, ever. client/ is Vite + TypeScript.

THE HOUSE RULE, AND IT IS NOT NEGOTIABLE: **write the probe first.** Before you change any behaviour, add
or extend a check that FAILS against the current tree, and show that it fails. Then fix, and show it passes.
A fix without a failing probe is rejected — four \`transition: width\` rules survived for months precisely
because nothing could tell whether they worked. If the assertion could ever be vacuous (running over an
empty list, measuring zero of zero), mutation-test it: break the fix deliberately and confirm the probe
goes red.

Probes live in tools/playtest/*.ts (auto-discovered by the playtest leg) or shared/qa_*.ts. They print
'  ok  ' / '  FAIL ' lines and exit non-zero on failure; a diagnostic line prefixed '  .. ' is echoed by
the gate even when green, which is how a passing assertion reports its margin.

OTHER RULES:
- The SMALLEST correct change. Do not refactor, do not tidy adjacent code, do not rename things.
- Match the surrounding comment style: explain WHY, and name the failure the code is preventing.
- Never touch scripts/gate-baseline.txt. Growing the accepted-failure list is not a fix.
- If you conclude the finding is wrong, say so and change nothing. That is a valid and valuable outcome.
- Run \`npm run build --workspace client\` and your probe. Do NOT run the full gate — it takes 15 minutes and
  several of you are running at once; the merge step gates properly.`

const RESULT = {
  type: 'object',
  required: ['outcome', 'summary'],
  properties: {
    outcome: { type: 'string', enum: ['fixed', 'not-a-bug', 'needs-decision', 'blocked'] },
    summary: { type: 'string' },
    probe: { type: 'string', description: 'The probe added or extended, and the evidence it failed before the fix' },
    files: { type: 'array', items: { type: 'string' } },
    risk: { type: 'string', description: 'What this could plausibly break, honestly' },
    branch: { type: 'string', description: 'The branch left behind with the committed change' },
  },
}

const findings = args?.findings ?? []
if (!findings.length) return { fixed: 0, note: 'nothing to fix' }

phase('Fix')

const done = await parallel(findings.map((f) => () =>
  agent(`${HOUSE}

---

FIX THIS ONE FINDING. Nothing else.

${JSON.stringify(f, null, 2)}

Work on a branch named \`fix/${String(f.id ?? 'x')}\`. Commit your change with a message that explains what
was wrong and why the fix is the smallest one that works. Then report.

If, on reading the code, the finding turns out to be wrong or already fixed — say so, change nothing, and
return outcome 'not-a-bug'. If it turns out to be a product judgement rather than a defect, return
'needs-decision' with what the decision is. Neither is a failure.`,
    { label: `fix:${String(f.id ?? f.title).slice(0, 24)}`, phase: 'Fix', schema: RESULT, isolation: 'worktree' })
    .then((r) => (r ? { ...r, finding: f } : null))
))

const fixed = done.filter(Boolean).filter((r) => r.outcome === 'fixed')
log(`${fixed.length} fixed, ${done.filter(Boolean).length - fixed.length} returned without a change`)

phase('Review')

// An independent reader, not the author. The author is the worst judge of whether their probe has teeth.
const reviewed = await parallel(fixed.map((r) => () =>
  agent(`${HOUSE}

---

REVIEW A FIX before it is queued for merge. You did not write it.

THE FINDING: ${JSON.stringify(r.finding, null, 2)}
WHAT THEY DID: ${r.summary}
THE PROBE THEY ADDED: ${r.probe}
FILES: ${(r.files ?? []).join(', ')}
BRANCH: ${r.branch}

Read the actual diff on that branch. Answer three questions and be hard about it:
1. Does the probe genuinely fail without the fix, or is it a check that cannot fail?
2. Is this the smallest correct change, or did they refactor while they were in there?
3. What does it break? Look specifically for: determinism violations in shared/, behaviour changes to
   screens the finding never mentioned, and anything that would need the gate baseline to grow.

Set refuted=true if the fix should not be merged as it stands.`,
    { label: `review:${String(r.finding.id ?? '').slice(0, 20)}`, phase: 'Review',
      schema: { type: 'object', required: ['refuted', 'reasoning'],
                properties: { refuted: { type: 'boolean' }, reasoning: { type: 'string' },
                              required_change: { type: 'string' } } } })
    .then((v) => ({ ...r, review: v, mergeable: v ? !v.refuted : false }))
))

const ok = reviewed.filter(Boolean).filter((r) => r.mergeable)
return {
  mergeable: ok.map((r) => ({ id: r.finding.id, branch: r.branch, summary: r.summary, risk: r.risk, files: r.files })),
  held: reviewed.filter(Boolean).filter((r) => !r.mergeable)
                .map((r) => ({ id: r.finding.id, because: r.review?.reasoning, needs: r.review?.required_change })),
  no_change: done.filter(Boolean).filter((r) => r.outcome !== 'fixed')
                 .map((r) => ({ id: r.finding.id, outcome: r.outcome, summary: r.summary })),
}
