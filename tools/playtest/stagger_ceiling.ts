// A STAGGER THAT SCALES WITH THE LENGTH OF THE SAVE MUST HAVE A CEILING.
//
// The Family Record draws itself in from the founder upward, and the stagger is deliberately not a JS timer
// — it is `animation-delay: calc(<base> + var(--fr-g, 0) * <step>)`, where `--fr-g` is a man's rank among
// the generations on the tree. That rank climbs by one at every succession and never comes back down, so
// the delay was linear in how long the dynasty had run, with nothing stopping it: 0.52s before the
// founder's medallion at generation 0, 4.42s before the LIVING star's at generation 15, and further out
// every generation forever. The animation is declared `both`, so its `from { opacity: 0 }` holds through
// the delay — the man the screen exists to show is not merely late, he is absent — and renderFamilyTree
// replays the whole ramp on every Trophy Room visit, not once per save.
//
// Nothing could fail here. The screen renders, every node eventually arrives, and the only symptom is a
// wait that gets worse the better the player has done. That is the shape this directory exists to catch.
//
// The check is static over the stylesheet: every `animation-delay` whose value scales off a custom property
// must bound that property (`min()` or `clamp()`), the bounded worst case must fit a budget, and two delays
// driven by the SAME property must share one cap — clamping one and not the other reorders the sequence,
// putting a branch on screen after the medallion it feeds.
//
// Run: `npx tsx tools/playtest/stagger_ceiling.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

// Strip comments FIRST. This sheet comments nearly every non-obvious rule, and a declaration that arrives
// glued to the tail of a comment is a declaration the brace scan never sees — the mistake that made the
// first run of reduced_motion.ts green while the worst-affected element in the game went unexamined.
const css = readFileSync('client/index.html', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');

/** The longest a player may be made to wait for an element to START arriving. The Family Record is opened
 *  over and over, not once, so this is a re-watch budget rather than a first-impression one. */
const BUDGET_S = 2.5;

console.log('=== A stagger driven by save length must have a ceiling ===');

// Every rule as { selector, body }. Good enough for this hand-written sheet: we only need declaration text,
// not the cascade, and no calc() contains a brace.
const delays: Array<{ sel: string; value: string }> = [];
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let m: RegExpExecArray | null;
while ((m = ruleRe.exec(css))) {
  const dm = /animation-delay\s*:\s*([^;}]+)/.exec(m[2]);
  if (dm) delays.push({ sel: m[1].trim().replace(/\s+/g, ' '), value: dm[1].trim() });
}
const scaled = delays.filter((d) => /var\(\s*--/.test(d.value));

console.log(`  ..   ${delays.length} animation-delay declaration(s) in the sheet; ${scaled.length} scale off a custom property`);
// A check over an empty set proves nothing. If the staggered draw-in is ever rewritten to set the delay
// from JS instead, this goes red rather than quietly measuring nothing.
ok(scaled.length > 0, 'the sheet really does contain a custom-property-driven stagger to bound (not an empty set)');

/** Split on a top-level operator, ignoring anything inside parentheses. */
const splitTop = (s: string, op: string): string[] => {
  const out: string[] = []; let depth = 0, last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === op && depth === 0) { out.push(s.slice(last, i)); last = i + 1; }
  }
  out.push(s.slice(last));
  return out.map((t) => t.trim()).filter(Boolean);
};

/** Seconds, from a CSS time literal. */
const secs = (t: string): number | null => {
  const u = /^([\d.]+)(ms|s)$/.exec(t.trim());
  return u ? Number(u[1]) / (u[2] === 'ms' ? 1000 : 1) : null;
};

/** The ceiling a term puts on its custom property, or null if it puts none on it. `min(var(--x), C)` and
 *  `clamp(a, var(--x), C)` are the two ways to say "this ramp saturates". */
const capOf = (term: string): number | null => {
  const v = `(?:var\\(\\s*--[\\w-]+\\s*(?:,[^()]*)?\\))`;
  const mn = new RegExp(`^min\\(\\s*${v}\\s*,\\s*([\\d.]+)\\s*\\)$`).exec(term);
  if (mn) return Number(mn[1]);
  const cl = new RegExp(`^clamp\\(\\s*[^,]+,\\s*${v}\\s*,\\s*([\\d.]+)\\s*\\)$`).exec(term);
  return cl ? Number(cl[1]) : null;
};

const byProp = new Map<string, Array<{ sel: string; cap: number | null }>>();

for (const d of scaled) {
  const inner = /^calc\((.*)\)$/s.exec(d.value)?.[1] ?? d.value;
  let base = 0, worst = 0, described = '';
  for (const term of splitTop(inner, '+')) {
    const flat = secs(term);
    if (flat !== null) { base += flat; described += `${described ? ' + ' : ''}${term}`; continue; }
    if (!/var\(\s*--/.test(term)) continue;   // not a time and not the rank — nothing this probe can price
    const factors = splitTop(term, '*');
    const step = factors.map(secs).find((x) => x !== null && x !== undefined) ?? 0;
    const rank = factors.find((f) => /var\(\s*--/.test(f)) ?? '';
    const prop = /var\(\s*(--[\w-]+)/.exec(rank)?.[1] ?? '--?';
    const cap = capOf(rank);
    (byProp.get(prop) ?? byProp.set(prop, []).get(prop)!).push({ sel: d.sel, cap });
    worst += cap === null ? Infinity : cap * step;
    described += `${described ? ' + ' : ''}${prop}${cap === null ? ' (UNBOUNDED)' : `≤${cap}`}×${step}s`;
    ok(cap !== null, `${d.sel} bounds ${prop} — the ramp saturates instead of growing with every generation`);
  }
  const total = base + worst;
  console.log(`  ..   ${d.sel} → ${described} = ${Number.isFinite(total) ? `${total.toFixed(2)}s` : 'unbounded'} worst case (budget ${BUDGET_S}s)`);
  ok(total <= BUDGET_S, `${d.sel} starts within ${BUDGET_S}s however long the dynasty has run`);
}

// Half a clamp is worse than none: the two Family Record delays are 0.1s apart by design, so that a branch
// draws just before the medallion it feeds. Clamp one and not the other and at a long save the branch
// arrives seconds AFTER its own son.
for (const [prop, uses] of byProp) {
  if (uses.length < 2) continue;
  const caps = new Set(uses.map((u) => String(u.cap)));
  ok(caps.size === 1, `all ${uses.length} delays driven by ${prop} share one cap (${[...caps].join(' vs ')}) — a half-clamped ramp reorders the draw-in`);
}

console.log(fails ? `\n✗ ${fails} stagger problem(s): a delay that grows with the save is a wait that punishes a long dynasty` : '\n✓ Every save-length-driven stagger saturates inside its budget');
if (fails) process.exitCode = 1;
