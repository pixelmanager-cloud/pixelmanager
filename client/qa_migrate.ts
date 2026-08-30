// v1 → v2: a pre-branching save must come back as a valid single-branch forest, not a row of orphan
// trunks. The Family Record reads parent_id directly, so a save that never got this migration would
// render every generation as its own tree.
import { migrate, SAVE_VERSION, freshSave } from './src/save.js';

const m: any = freshSave('Kestrel');
m.version = 1;
m.tokens = [
  { id: 'a', name: 'Kai', generation: 0, state: 'retired' },
  { id: 'b', name: 'Ross', generation: 1, state: 'retired' },
  { id: 'c', name: 'Milo', generation: 2, state: 'pro' },
];
const out: any = migrate(m);
const fail = (msg: string) => { console.log('✗ ' + msg); process.exitCode = 1; };

if (out.version !== SAVE_VERSION) fail(`version not raised: ${out.version}`);
if (out.tokens[0].parent_id !== null) fail('the founder must be a root');
if (out.tokens[1].parent_id !== 'a') fail(`gen 1's father should be the founder, got ${out.tokens[1].parent_id}`);
if (out.tokens[2].parent_id !== 'b') fail(`gen 2's father should be gen 1, got ${out.tokens[2].parent_id}`);
if (out.tokens.some((t: any) => t.branch !== 'played')) fail('every pre-branching token was a played line');

// idempotent — a second pass must change nothing
const again = JSON.stringify(migrate(out));
if (again !== JSON.stringify(out)) fail('migrate is not idempotent');

// and a current save must pass through untouched
const cur: any = freshSave('Ferreira');
if (migrate(cur) !== cur) fail('a current-version save should be returned as-is');

if (!process.exitCode) console.log('✓ save migration v1 → v2');
