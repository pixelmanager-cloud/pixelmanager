// DOES A CALLBACK EVER COME BACK? An arc choice can be gated on a flag an earlier choice set (`requires`),
// which is how the library pays off a decision made twenty turns ago. 116 choices across 89 distinct tags
// are written that way.
//
// `gate_content.ts` guards this by COUNTING DECLARATIONS -- it walks the source and checks that at least N
// choices declare `requires`. That is a deletion guard, and a good one, but every last declaration could be
// statistically unreachable without the count moving by one. This simulates instead.
//
// A caution about measuring it, because it caught me: the career presents an arc choice as a fresh
// `{id, label, desc}` object, so `requires` is NOT on the object the player sees. Counting `requires` on
// presented choices therefore reports ZERO no matter how healthy the mechanism is -- which is what an
// earlier audit did, concluding the content was unreachable when 63.6% of careers were already seeing it.
// Reachability has to be measured against the arc DEFINITIONS, matching by choice id.
import { Career, mulberry32 } from '../../shared/src/career.js';
import { ARCS } from '../../shared/src/storyarc.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const byId = new Map((ARCS as any[]).map((a) => [a.id, a]));

// Every required tag must have SOME choice that sets it, or the content is dead by construction.
const required = new Set<string>(), settable = new Set<string>();
for (const a of ARCS as any[]) for (const b of Object.values(a.beats ?? {}) as any[]) for (const c of b.choices ?? []) {
  if (c.requires) required.add(c.requires);
  if (c.effect?.tag) settable.add(c.effect.tag);
}
const orphans = [...required].filter((t) => !settable.has(t));

const STYLE: any = { name: 'P', pref: { composure: 1, flair: 0.8 }, skill: 0.85 };
const N = 200;
let offered = 0, withAny = 0;
for (let sd = 0; sd < N; sd++) {
  const c: any = new Career(sd, 'outfield');
  const rng = mulberry32(sd ^ 0x1234567);
  let seen = 0, guard = 0;
  while (!c.finished && guard++ < 3000) {
    const st: any = c.current();
    if (st.phase === 'arc') {
      const def = byId.get(st.arc.id);
      const beat = def && Object.values(def.beats ?? {}).find((b: any) => b.prompt === st.arc.prompt) as any;
      if (beat) {
        const shown = new Set(st.arc.choices.map((x: any) => x.id));
        for (const dc of beat.choices ?? []) if (dc.requires && shown.has(dc.id)) seen++;
      }
      c.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id);
    } else if (st.phase === 'focus') c.chooseFocus(st.focus[0].id);
    else if (st.phase === 'offer') c.resolveOffer('develop');
    else if (st.phase === 'coach') c.appointCoach(st.coaches[0].id);
    else if (st.phase === 'draft') c.draft(st.options[0].id);
    else {
      let b = st.hand[0], bs = -Infinity;
      for (const x of st.hand) { const v = x.tags.reduce((t: number, g: string) => t + (STYLE.pref[g] ?? 0), 0) + rng() * 0.05; if (v > bs) { bs = v; b = x; } }
      c.play(b.id);
    }
  }
  offered += seen;
  if (seen > 0) withAny++;
}

console.log(`=== Cross-arc payoffs — ${required.size} required tags, ${orphans.length} with no setter ===`);
console.log(`  ${offered} gated choices offered across ${N} careers; ${withAny} careers (${(100 * withAny / N).toFixed(1)}%) saw at least one`);
ok(orphans.length === 0, `every required tag can be set by some choice (${orphans.length} orphan(s)${orphans.length ? ': ' + orphans.slice(0, 4).join(', ') : ''})`);
// The scheduler weights an arc up when it pays off a flag the career already holds. Without that weighting
// this sits at 63.6%; with it, 82.3%. The floor is set well below the measured value so ordinary content
// churn does not trip it, but a regression that unhooks the mechanism drops it to zero and is caught.
ok(withAny >= N * 0.45, `a decision made earlier actually comes back for most careers (${(100 * withAny / N).toFixed(1)}%)`);
ok(offered >= 100, `and it is not one lucky arc carrying the whole mechanism (${offered} offers)`);
console.log(fails ? `\n✗ ${fails} payoff-reachability check(s) failed` : `\n✓ the library's callbacks are reachable`);
if (fails) process.exitCode = 1;
