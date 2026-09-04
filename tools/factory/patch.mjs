// PATCH WAVE — invoke with the Workflow tool: {scriptPath: 'tools/factory/patch.mjs', args: {...}}
//
//   args: { findings: [ {id, title, where, evidence, fix_sketch} ] }
//
// The worktree sibling (fix.mjs) needs the session cwd to BE the git repo; here it is the parent directory,
// so worktree isolation cannot be created and every agent dies before it reads a line. This variant sidesteps
// isolation entirely: agents are READ-ONLY. Each returns exact old/new strings plus the probe to add, an
// independent reviewer checks them, and the orchestrator applies the survivors serially behind one gate.
// Serial application is the whole point — parallel edits to main.ts are how a green tree becomes a broken one.
export const meta = {
  name: 'patch-wave',
  description: 'Design probe-first patches read-only, review each, return exact old/new strings to apply serially',
  phases: [
    { title: 'Design', detail: 'read the code, design the smallest patch and the probe that fails without it' },
    { title: 'Review', detail: 'an independent reader checks each patch before it is queued' },
  ],
}

const REPO = '/Users/cksmacbookair/Clause Coding/football-manager'

const HOUSE = `PROJECT: "Football Royalty" — an offline, deterministic, pixel-art football bloodline-dynasty
life-sim heading for Steam. Repo root: ${REPO}. npm workspaces: shared/ is a PURE engine (no Date.now, no
Math.random — enforced by a probe), client/ is Vite + TypeScript.

YOU ARE READ-ONLY. Do NOT edit, write, or create any file in the repo, and do not run git. You are DESIGNING
a patch that the orchestrator will apply. You may read anything, and you may run throwaway analysis scripts
(node/npx tsx) from a scratch directory outside the repo — /private/tmp/claude-501/-Users-cksmacbookair-Clause-Coding/e0e74a7c-dd14-4069-9f5c-350908232c8c/scratchpad —
which is how you should verify a claim rather than trusting it.

THE HOUSE RULE: **the probe comes first.** Every patch must ship with a check that FAILS against the current
tree. Design that check and say precisely why it fails today. If the assertion could ever be vacuous (running
over an empty list, measuring zero of zero), say how it should be mutation-tested. A fix nothing can measure
is how four dead \`transition: width\` rules survived for months in this codebase.

Probes live in tools/playtest/*.ts (auto-discovered by the playtest leg) or shared/qa_*.ts. They print
'  ok  ' / '  FAIL ' lines and exit non-zero on failure; a '  .. ' line is echoed by the gate even when green,
which is how a passing assertion reports its margin. READ ONE FIRST and match its shape exactly.

RULES:
- The SMALLEST correct change. Do not refactor, do not tidy adjacent code, do not rename.
- Match the surrounding comment style: say WHY, and name the failure the code is preventing.
- Never touch scripts/gate-baseline.txt. Growing the accepted-failure list is not a fix.
- If the finding is wrong or already fixed, say so and return no patches. That is a valid, valuable outcome.

HOW TO RETURN A PATCH — this is the part that most often goes wrong, so read it twice:
- \`path\` is RELATIVE TO THE REPO ROOT (e.g. "client/src/main.ts"), never absolute.
- \`old\` must appear EXACTLY ONCE in the file, byte for byte, including leading indentation. Copy it out of
  the file; do not retype it from memory and do not normalise whitespace. Include enough surrounding lines to
  be unique. If you cannot make it unique, split into several smaller patches with more context each.
- \`new\` is the replacement text for that whole span.
- For a NEW file, set \`old\` to "" and put the whole file in \`new\`.
- Verify each \`old\` is unique before returning: grep -c the exact string.`

const PATCH = {
  type: 'object',
  required: ['outcome', 'summary'],
  properties: {
    outcome: { type: 'string', enum: ['patched', 'not-a-bug', 'needs-decision', 'blocked'] },
    summary: { type: 'string' },
    patches: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'old', 'new', 'why'],
        properties: {
          path: { type: 'string', description: 'RELATIVE to the repo root' },
          old: { type: 'string', description: 'exact existing text, unique in the file; "" to create the file' },
          new: { type: 'string' },
          why: { type: 'string' },
        },
      },
    },
    probe: { type: 'string', description: 'The probe added or extended, and exactly why it fails on the current tree' },
    risk: { type: 'string', description: 'What this could plausibly break, honestly' },
  },
}

const findings = args?.findings ?? []
if (!findings.length) return { queued: [], note: 'nothing to patch' }

phase('Design')

const done = await parallel(findings.map((f) => () =>
  agent(`${HOUSE}

---

DESIGN THE PATCH FOR THIS ONE FINDING. Nothing else.

${JSON.stringify(f, null, 2)}

Open the files, confirm the finding is real, then return the patch set and the probe. If it turns out to be
wrong or already fixed, return outcome 'not-a-bug' with no patches. If it is a product judgement rather than
a defect, return 'needs-decision' and say what the decision is.`,
    { label: `patch:${String(f.id ?? f.title).slice(0, 24)}`, phase: 'Design', schema: PATCH })
    .then((r) => (r ? { ...r, finding: f } : null))
))

const patched = done.filter(Boolean).filter((r) => r.outcome === 'patched' && (r.patches ?? []).length)
log(`${patched.length} patch sets designed, ${done.filter(Boolean).length - patched.length} returned without one`)

phase('Review')

// An independent reader, not the author. The author is the worst judge of whether their own probe has teeth.
const reviewed = await parallel(patched.map((r) => () =>
  agent(`${HOUSE}

---

REVIEW A PROPOSED PATCH before it is applied. You did not write it. You are READ-ONLY.

THE FINDING: ${JSON.stringify(r.finding, null, 2)}
WHAT THEY PROPOSE: ${r.summary}
THE PROBE: ${r.probe}
THE PATCHES: ${JSON.stringify(r.patches, null, 2)}

Answer four questions and be hard about all of them:
1. Does each \`old\` string appear EXACTLY ONCE in the named file, byte for byte? CHECK THIS BY GREPPING —
   a patch whose anchor is missing or ambiguous fails to apply, and one that matches twice corrupts the file.
   Report the count you measured for each.
2. Does the probe genuinely fail without the fix, or is it a check that cannot fail? Reason about the actual
   assertion, not its description.
3. Is this the smallest correct change, or did they refactor while they were in there?
4. What does it break? Look specifically for: determinism violations in shared/, behaviour changes to screens
   the finding never mentioned, and anything that would need the gate baseline to grow.

Set refuted=true if it should not be applied as it stands.`,
    { label: `review:${String(r.finding.id ?? '').slice(0, 20)}`, phase: 'Review',
      schema: { type: 'object', required: ['refuted', 'reasoning'],
                properties: { refuted: { type: 'boolean' }, reasoning: { type: 'string' },
                              anchors_verified: { type: 'string' }, required_change: { type: 'string' } } } })
    .then((v) => ({ ...r, review: v, ok: v ? !v.refuted : false }))
))

const ok = reviewed.filter(Boolean).filter((r) => r.ok)
return {
  queued: ok.map((r) => ({ id: r.finding.id, title: r.finding.title, summary: r.summary, probe: r.probe,
                           risk: r.risk, patches: r.patches, anchors: r.review?.anchors_verified })),
  held: reviewed.filter(Boolean).filter((r) => !r.ok)
                .map((r) => ({ id: r.finding.id, because: r.review?.reasoning, needs: r.review?.required_change })),
  no_change: done.filter(Boolean).filter((r) => r.outcome !== 'patched')
                 .map((r) => ({ id: r.finding.id, outcome: r.outcome, summary: r.summary })),
}
