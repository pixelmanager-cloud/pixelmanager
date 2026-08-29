import { mergeList } from './merge.js';
import { BIG_SETTINGS_A } from './extra/pack_a.js';
import { BIG_SETTINGS_B } from './extra/pack_b.js';
import { BIG_SETTINGS_C } from './extra/pack_c.js';
import { BIG_SETTINGS_D } from './extra/pack_d.js';
import { BIG_SETTINGS_E } from './extra/pack_e.js';
import { BIG_SETTINGS_F } from './extra/pack_f.js';
import { BIG_SETTINGS_G } from './extra/pack_g.js';
import { BIG_SETTINGS_H } from './extra/pack_h.js';
import { BIG_SETTINGS_I } from './extra/pack_i.js';
import { BIG_SETTINGS_J } from './extra/pack_j.js';
import { BIG_SETTINGS_K } from './extra/pack_k.js';
import { BIG_SETTINGS_L } from './extra/pack_l.js';
// BIG_SETTINGS — see shared/src/prompts/README for the authoring rules.
// big-moment settings override the chapter setting when the stakes are high
// ATMOSPHERE ONLY — never a fixture identity or a venue. Half of these used to name the match: a moment
// LABELLED "A Point to Prove" resolved "in a white-hot derby", and "A Scout-Packed Showcase" resolved "on
// Community Shield curtain-raiser day". The label and this pool are chosen independently, so anything here
// that claims what KIND of game it is will eventually contradict the screen above it. "as the away end
// bounced" did the same for venue on a home fixture. Tone is safe; facts are not. (PT-155/PT-808)
const BASE_BIG_SETTINGS = ['with the tie hanging in the balance', 'as tempers frayed and the stakes climbed',
  'under the lights, everything to play for', 'with the season threatening to turn on this one game',
  'with the noise never dropping for a second', 'in a game nobody wanted to lose',
  'with every loose ball fought over twice', 'as the tension crept into everyone\'s legs',
  'in front of a crowd that had turned up for exactly this', 'with the whole thing balanced on a knife edge',
  'in an atmosphere thick enough to lean on', 'with the bench on their feet from the first whistle',
  'in a game that had been circled for weeks', 'with the result mattering far more than the performance'];

export const BIG_SETTINGS = mergeList(BASE_BIG_SETTINGS, BIG_SETTINGS_A, BIG_SETTINGS_B, BIG_SETTINGS_C, BIG_SETTINGS_D, BIG_SETTINGS_E, BIG_SETTINGS_F, BIG_SETTINGS_G, BIG_SETTINGS_H, BIG_SETTINGS_I, BIG_SETTINGS_J, BIG_SETTINGS_K, BIG_SETTINGS_L);
