import { CHILD_SETUP_M } from './extra/pack_m.js';
import { CHILD_SETUP_N } from './extra/pack_n.js';
import { CHILD_SETUP_O } from './extra/pack_o.js';
import { CHILD_SETUP_P } from './extra/pack_p.js';
import { CHILD_SETUP_Q } from './extra/pack_q.js';
import { CHILD_SETUP_R } from './extra/pack_r.js';
import { mergeBanks } from './merge.js';
import { CHILD_SETUP_A } from './extra/pack_a.js';
import { CHILD_SETUP_B } from './extra/pack_b.js';
import { CHILD_SETUP_C } from './extra/pack_c.js';
import { CHILD_SETUP_D } from './extra/pack_d.js';
import { CHILD_SETUP_E } from './extra/pack_e.js';
import { CHILD_SETUP_F } from './extra/pack_f.js';
import { CHILD_SETUP_G } from './extra/pack_g.js';
import { CHILD_SETUP_H } from './extra/pack_h.js';
import { CHILD_SETUP_I } from './extra/pack_i.js';
import { CHILD_SETUP_J } from './extra/pack_j.js';
import { CHILD_SETUP_K } from './extra/pack_k.js';
import { CHILD_SETUP_L } from './extra/pack_l.js';
// CHILD_SETUP — see shared/src/prompts/README for the authoring rules.
// ── CHILD/PARK-FOOTBALL SETUP BANKS: the youngest chapters (age ~10–15) are jumpers-for-goalposts and
// academy trials, so they must NOT borrow the senior pools' "reserve-team hardman / dropped for Saturday /
// the analyst pulled up clips" vocabulary (PT-46). Same three kinds, re-voiced for school & park football.
const BASE_CHILD_SETUP: Record<string, string[]> = {
  match: [
    'The park pitch is churned to mud and both sets of parents are roaring from the touchline.', 'It’s the last kick of a break-time match and pride is on the line.', 'Jumpers for goalposts, no ref, and an argument brewing about whether the last one was over the line.', 'The school-team game is on a knife-edge and the PE teacher keeps glancing at the clock.', 'Bigger, older lads have wandered onto the pitch and the game just got a lot more physical.', 'A cup game for the district side, and a few grown-ups with clipboards are watching from the fence.', 'The ball’s gone into the nettles again, and everyone’s waiting to see who dares fetch it.', 'It’s freezing, half the team want to go home, and the game is still there to be won.', 'A rival from the school down the road has been talking all week — now the whistle’s gone.', 'Oranges at the break and a team-talk from a dad who means well, with it all still to play for.', 'The five-a-side cage after school, where reputations are made and lost in an afternoon.', 'A proper pitch with real nets for once, and it makes the whole thing feel enormous.',
  ],
  training: [
    'At training the coach has set out cones and wants to see who’s been practising.', 'A skills drill in the school hall, trainers squeaking on the wood.', 'The Saturday-morning session, half the squad still half-asleep.', 'Keepy-uppie contest before the coach arrives, and everyone’s counting out loud.', 'A shooting drill where the whole queue watches every effort.', 'The coach has split them into teams for a small-sided game and is keeping score.', 'Cold hands, a heavy leather-feeling ball, and a passing drill that has to click.', 'The academy taster session, surrounded by kids who all look a bit better than him.', 'A dribbling course of cones, timed, with the fastest getting to pick teams.', 'Wet bibs, a muddy field behind the school, and a coach who believes in him.', 'A one-touch drill where one mistake sends the whole group back to the start.', 'The end-of-session match everyone actually turns up for.',
  ],
  social: [
    'On the walk home from the match, the other kids are deciding who was best.', 'A team-mate’s in tears after a mistake and nobody quite knows what to say.', 'Picking teams in the playground, and who he chooses says a lot.', 'Mum’s waiting in the car and the coach wants a quiet word first.', 'A squabble over who takes the free-kicks has split the whole team.', 'The new kid doesn’t know anyone yet and is standing on his own.', 'A birthday party clashes with the big game, and he has to choose.', 'The group chat is buzzing after training and he’s not sure what to type.', 'A smaller lad is getting picked on for a bad miss, and everyone’s watching.', 'Sharing the last space in the car home, and who gets left is up to him.', 'His best mate has been dropped and is putting on a brave face.', 'The coach asks who’ll captain the side on Saturday, and heads turn.',
  ],
};

/** BASE plus every authoring pack — see ./merge.ts for why the packs are separate files. */
export const CHILD_SETUP = mergeBanks(BASE_CHILD_SETUP, CHILD_SETUP_A, CHILD_SETUP_B, CHILD_SETUP_C, CHILD_SETUP_D, CHILD_SETUP_E, CHILD_SETUP_F, CHILD_SETUP_G, CHILD_SETUP_H, CHILD_SETUP_I, CHILD_SETUP_J, CHILD_SETUP_K, CHILD_SETUP_L, CHILD_SETUP_M, CHILD_SETUP_N, CHILD_SETUP_O, CHILD_SETUP_P, CHILD_SETUP_Q, CHILD_SETUP_R);
