import { mergeBanks } from './merge.js';
import { FRAME_A } from './extra/pack_a.js';
import { FRAME_B } from './extra/pack_b.js';
import { FRAME_C } from './extra/pack_c.js';
import { FRAME_D } from './extra/pack_d.js';
import { FRAME_E } from './extra/pack_e.js';
import { FRAME_F } from './extra/pack_f.js';
import { FRAME_G } from './extra/pack_g.js';
import { FRAME_H } from './extra/pack_h.js';
import { FRAME_I } from './extra/pack_i.js';
import { FRAME_J } from './extra/pack_j.js';
import { FRAME_K } from './extra/pack_k.js';
import { FRAME_L } from './extra/pack_l.js';
// FRAME_BY_CHAPTER — see shared/src/prompts/README for the authoring rules.
// ── LIFE-STAGE FRAMING: a much wider bank of human, specific texture per age band — the stuff of an
// actual childhood/adolescence/career, not just a generic "he's young" clause. Keyed on the CHAPTER
// (band name) rather than a bare age bracket, so it lines up exactly with what that stage is really
// about (school and parents at Grassroots; digs and homesickness at Scholar; captaincy and legacy at
// Establishing) per the "much more human depth per band" brief.
const BASE_FRAME_BY_CHAPTER: Record<string, string[]> = {
  Grassroots: [
    'Homework still not done and Mum already shouting for the car, ', 'With a familiar face on the touchline in the cold, arms folded, willing him on, ',
    'Picked near-last at school again but not here, not on this pitch, ', 'A growth spurt has left him gangly and not quite sure where his own feet are, ',
    'Terrified of being dropped for Saturday after one bad training session, ', 'His new coach has spotted something in him nobody else has, ',
    'Still the smallest kid in his year at school, ', 'With his best mate from school lining up right beside him, ',
    'Fresh off a school report that mentioned football more than maths, ', 'Desperate to make the actual team, not just the bench, ',
  ],
  Academy: [
    'Bussed in after school again, kit bag heavier than his school one, ', 'Word is the coaches are trimming the squad soon, and nobody feels safe, ',
    'Another growth spurt, another summer of feeling like a stranger in his own body, ', 'Homework forgotten in his bag, again, ',
    'His mum still drives him to every single session without complaint, ', 'A new coach has arrived and the old certainties are gone, ',
    'Watching mates from school drift away as football swallows every weekend, ', 'Desperate to prove last week’s axing was a mistake, ',
    'Torn between the exam next week and the extra session tonight, ', 'Finally feeling like one of the good ones in this year group, ',
  ],
  Scholar: [
    'Homesick in digs that still don’t feel like home, ', 'A string of released team-mates has the whole dorm on edge, ',
    'An agent’s number saved in his phone for the first time, unsure whether to call it, ', 'A trial game against a bigger club’s youth side, everything riding on ninety minutes, ',
    'His coach has never once told him he’ll make it — and never once told him he won’t, ', 'The scholarship paperwork made it feel real for the first time, ',
    'Missing his own bed, his own kitchen, his own life, ', 'A fierce, needling rivalry with the lad who plays his exact position, ',
    'Grades slipping while the football consumes every hour, ', 'The academy director watching from the side, clipboard in hand, ',
  ],
  'Youth Team': [
    'Reserve football has taught him the game has real teeth, ', 'His agent is starting to make real calls on his behalf now, ',
    'A loan away is being quietly discussed, and it terrifies and thrills him in equal measure, ', 'Fighting a lad he used to room with for the same one shirt, ',
    'The first-team coach watched from the touchline again today — no idea what he made of it, ', 'Independence, a flat of his own, and nobody to tell him what time to be in, ',
    'Old digs-mates are already being released around him, ', 'A first taste of training with the senior pros, and it showed him how far there still is to go, ',
    'Money is starting to change hands and it feels strange to be worth something, ', 'His name mentioned, for the first time, in a first-team team-talk, ',
  ],
  Breakthrough: [
    'His agent is fielding calls he never used to get, ', 'The first proper contract talk of his life is looming, ',
    'A journalist wants "five minutes," and he still doesn’t trust himself with a microphone, ', 'The senior dressing room hasn’t fully let him in yet, ',
    'Transfer talk has started, and he can’t work out if it’s flattering or terrifying, ', 'His face is starting to appear where it never has before, ',
    'A veteran pro has taken it upon himself to test the new boy, ', 'The manager who gave him his chance is exactly the one he doesn’t want to let down, ',
    'His family still can’t quite believe what’s happening to him, ', 'One eye on the shirt he wants, one eye on the man currently wearing it, ',
  ],
  'First Team': [
    'Whispers of the captaincy have started, and he’s not sure he’s ready, ', 'The wages now support people who aren’t just him, ',
    'A run of poor form has the phone-ins circling, ', 'A kid from the academy looks at him the way he used to look at the senior pros, ',
    'His family life pulls at him just as hard as the football now does, ', 'Expectation sits on him like a second shirt, ',
    'The dressing room looks to him for the answer now, not the other way round, ', 'Somewhere between "promising" and "the finished article," and everyone can feel it, ',
    'A slump nobody can quite explain, least of all him, ', 'Money, fame and football pulling in three different directions at once, ',
  ],
  Establishing: [
    'The armband has his name on it more often than not these days, ', 'Younger lads at the club study the way he trains, ',
    'His investments matter almost as much as his form now, ', 'What he leaves behind is starting to matter more than what he does today, ',
    'A testimonial is being quietly discussed by people who assume he’ll retire a legend, ', 'His own kids are old enough to watch him play and understand it, ',
    'The next contract might be his last big one, and everyone in the building knows it, ', 'A younger version of himself is coming up through the ranks, watching, learning, waiting, ',
    'Reputation now precedes him into every room he walks into, ', 'He’s become the answer to the question a young pro used to ask about him, ',
  ],
};

/** BASE plus every authoring pack — see ./merge.ts for why the packs are separate files. */
export const FRAME_BY_CHAPTER = mergeBanks(BASE_FRAME_BY_CHAPTER, FRAME_A, FRAME_B, FRAME_C, FRAME_D, FRAME_E, FRAME_F, FRAME_G, FRAME_H, FRAME_I, FRAME_J, FRAME_K, FRAME_L);
