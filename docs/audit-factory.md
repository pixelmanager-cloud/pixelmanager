# The audit factory

A standing production line for the run-up to launch: agents that find problems, agents that fix them, and
a queue of anything that is your call rather than a bug.

## Designed against evidence, not intuition

This session produced six real defects. Where they came from decides the whole shape:

| defect | found by |
|---|---|
| the Family Record omitted every ancestor of the played line | trying to **photograph** it |
| the sim-speed gate measured GitHub's load, not the engine | watching identical code pass, then fail |
| a portrait changed identity when its owner aged | a **question**, not a test |
| Reduce Motion deleted every toast in the game | **audit agent** |
| four `transition: width` rules had never once fired | **audit agent** |
| the heir card was stuck on the one tier with no sheen | **audit agent** |

Three came from agents. **All three came from agents reading code hunting for mechanisms that exist and
never fire — none from agents "playing the game and reporting bugs."** That is not luck. This codebase's
signature defect is the declared-but-never-invoked mechanism (`breederRevenue`, `deleteLoaneesInSeason`, an
overridden `scorepulse`, a tree built from the wrong source), and that class is *statically findable*.
Meanwhile 68 playtest probes and 42 QA harnesses already drive the real facade, so a generic play-and-report
agent mostly re-treads covered ground.

So the factory is weighted toward auditing and soaking, not simulated play.

The second piece of evidence sets the other half of the design. Across the animation survey's 80 adversarial
checks: **13 keep, 3 cut, 64 revise.** In the music research, 2 of 4 findings were refuted outright.
Unverified agent output is not merely noisy — it is *confidently* wrong, which is worse. Verification is
therefore a lane, not a step.

## Four lanes, separated because they fail differently

```
  AUDIT ──▶ ledger ──▶ VERIFY ──▶ confirmed ──┬─▶ FIX (worktree) ──▶ MERGE (serialised)
   ▲                     │                     │
   │                     ▼                     └─▶ DECISION QUEUE ──▶ you
   └── dedup against the ledger        refuted → closed with reason
```

**1 · AUDIT — produces volume.** A rotating matrix of *subsystem × lens*. Nine subsystems (career/cards,
match engine, manager season, dynasty/succession, economy, save/persistence, UI+CSS, audio, content) against
eight lenses (dead wiring, correctness, UX friction, visual polish, accessibility, content quality,
performance, determinism/save integrity) — 72 cells. Each wave takes a slice, so coverage is systematic
rather than whatever the agent thought of.

Every finding is appended to the ledger with a stable id, its file:line provenance, and which cell produced
it. **Each wave is given the existing ledger and told not to re-report** — without that, every wave
rediscovers the same six things forever.

**2 · VERIFY — kills most of it.** Two adversaries per finding, with different lenses, both prompted to
refute: one checks the citation is real and the mechanism is reachable, the other asks whether a player
would care or whether it is noise. Default to refuted when uncertain. On this session's numbers, expect
roughly four in five findings to need correction or die here. That is the lane working, not failing.

**3 · FIX — one finding per agent, isolated.** *(Run this from the repository root: worktree isolation fails outright if the working directory is the repo's parent — see §87.)* Each fix agent runs in **its own git worktree** so parallel
edits cannot collide. The house rule applies without exception: **write the probe first, prove it fails
against the unfixed tree, then fix it.** A fix without a failing probe is not accepted — that is precisely
how four dead CSS transitions survived for months.

**4 · MERGE — serialised, one at a time.** Never parallel. Each merge runs the full gate (verify + playtest
+ qa, ~15 min) and is rejected if it fails, or if the accepted-failure baseline grew. Parallel merges into
main is how a green tree becomes a broken one.

## The decision queue

Anything that is a product judgement rather than a defect never gets auto-fixed. It lands in
`docs/decisions-for-ck.md` with the evidence attached and waits. Existing entries (§68 the width/formation
acceptance, §78 the Google Fonts dependency, §80 the Steam AI disclosure) are the model: state the finding,
state the options, state a recommendation, and stop.

**A finding goes to the queue, not to a fix agent, when:** it changes the design, it costs money, it is
irreversible, it touches licensing or store policy, it would grow the accepted-failure baseline, or the
verify lane disagreed with itself.

## Hard invariants

1. **No fix without a probe that fails first.** Mutation-tested where the assertion could be vacuous.
2. **The baseline never grows.** It is at 14 entries. If it reaches 30 the gate has stopped meaning anything.
3. **One merge at a time, gate green.**
4. **Findings are deduped against the ledger** or the factory loops on its own tail.
5. **As launch nears, invert the default.** Right now: find it, fix it. Closer in: find it, *record* it, fix
   only what is confirmed and material. Late churn on working code is how a regression ships.

## What this cannot do

It cannot tell you whether hour two is boring. No agent can. Three strangers playing a full generation
remains the only way to learn that, and nothing in this document substitutes for it.
