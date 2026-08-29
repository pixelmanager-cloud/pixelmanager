// The library assumes several mutually exclusive HOME SET-UPS and nothing stopped them co-occurring: a
// career could be told his dad has driven to every game since he was six AND that his dad did not turn up
// AND that his nan raised him single-handed because his parents could not. Simulates whole careers through
// the real picker and asserts the contradictory pairs never both fire. (PT-202)
import { pickArcStart } from '../../shared/src/storyarc.js';
const PAIRS: Array<[string, string]> = [
  ['rel-football-dad', 'youth-fam-absent-dad'],
  ['rel-football-dad', 'rel-grandparent'],
  ['youth-fam-camcorder', 'youth-fam-absent-dad'],
  ['rel-grandparent', 'youth-fam-stepdad'],
];
let clashes = 0, careers = 0;
for (let i = 0; i < 3000; i++) {
  const seed = (i * 2654435761) >>> 0;
  const fired = new Set<string>();
  for (let t = 0; t < 120; t++) { const id = pickArcStart(seed, t, fired, 120); if (id) fired.add(id); }
  careers++;
  for (const [a, b] of PAIRS) if (fired.has(a) && fired.has(b)) { clashes++; console.log(`  CLASH seed ${i}: ${a} + ${b}`); }
}
console.log(clashes ? `\n⚠ ${clashes} contradictory home set-ups across ${careers} careers` : `\n✓ no contradictory home set-ups across ${careers} careers`);
if (clashes) process.exitCode = 1;
