// Pure parsing for the gate runner, split out so it can be TESTED without running a fifteen-minute
// gate. The first version of this collector recorded four strategy_test assertions, silently missed
// both qa reds, and would have reported PASSED on a leg that exited 1 -- a gate that could not fail,
// which is the exact defect class this project keeps producing. shared/qa_gate_parse.ts covers it now.

// The accepted failures carry measured numbers that move run to run ("got 588 vs 602"), so compare the
// ASSERTION, not the measurement: drop any parenthesised group containing a digit, and collapse whitespace.
export const norm = (s) => s
  .replace(/\([^()]*\d[^()]*\)/gu, '')
  .replace(/\s+/gu, ' ')
  .trim();

// The three legs report failure at DIFFERENT granularities, and an earlier version of this file collected
// only one of them -- so it recorded four strategy_test assertions, missed both qa reds entirely, and would
// have reported PASSED on a leg that exited 1. Which is precisely the "check that cannot fail" this
// codebase keeps producing. Collect all three shapes, and keep the per-leg exit code as a backstop so a
// failure whose text this parser does not recognise still cannot slip through silently.
export function collect(text) {
  const out = new Set();
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd();
    // qa: per-harness verdict — the only place qa names WHICH harness failed
    const h = line.match(/^\s*──\s*(\S+)\s*…\s*FAIL/u);
    if (h) { out.add(`harness ${h[1]}`); continue; }
    // playtest: per-probe verdict
    const pr = line.match(/^\s*\[playtest\]\s*✗\s*(\S+)\s*FAILED/u);
    if (pr) { out.add(`probe ${pr[1]}`); continue; }
    if (!/^\s*✗/u.test(line)) continue;
    const body = line.replace(/^\s*✗\s*/u, '');
    // roll-ups restate failures already captured above and carry counts that drift; they add no identity
    if (/\bharness\(es\) FAILED\b/u.test(body)) continue;
    if (/\bprobe\(s\) (failed|FAILED)\b/u.test(body)) continue;
    if (/^\d+\s+\S.*\bcheck\(s\) failed\b/u.test(body)) {
      // "1 matchstats check(s) failed — ..." : keep it, but strip the count so it is stable
      out.add(norm(body.replace(/^\d+\s+/u, '').replace(/\s*—.*$/u, '')));
      continue;
    }
    const n = norm(body);
    if (n) out.add(n);
  }
  return out;
}

