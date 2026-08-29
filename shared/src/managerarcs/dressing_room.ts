// Dressing-room arcs — the manager's relationship with the men he picks. These fire on the SQUAD, so most
// are gated on `needs` (a veteran to fall out with, an unhappy man to lose) rather than on the calendar.
import type { ManagerArc } from '../managerarc.js';

export const DRESSING_ROOM_ARCS: ManagerArc[] = [
  {
    id: 'mgr-senior-delegation', title: 'A Word From The Senior Men', icon: '🚪', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three of the older heads ask for ten minutes after training. They are not angry, which is worse — they have clearly discussed what they are going to say before they came in.',
        choices: [
          { id: 'listen', label: 'Hear them out properly', desc: 'Sit down, say nothing, let it run long', outcome: 'They talk for forty minutes. Two of the things they raise are fair and he had not noticed either. The room settles because somebody finally asked.', effect: { squadMorale: 8, boardMood: 0, tag: 'mgr-listens' }, next: 'after' },
          { id: 'firm', label: 'Remind them who picks the side', desc: 'Polite, and completely immovable', outcome: 'It ends civilly and nothing changes. The senior men go back to work, and go back to talking among themselves.', effect: { squadMorale: -6, playerMorale: { who: 'oldest', delta: -10 }, tag: 'mgr-distant' }, next: 'after' },
          { id: 'split', label: 'Take one of them aside afterwards', desc: 'Deal with the ringleader alone', outcome: 'The group loses its shape once one of them is on his own. It works, and one of the three never quite trusts him again.', effect: { squadMorale: 3, playerMorale: { who: 'oldest', delta: -6 } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'A fortnight later the same three are the loudest voices in the warm-up. Whether that is because of the meeting or in spite of it is impossible to say.',
        choices: [
          { id: 'use', label: 'Give one of them the armband', desc: 'Make the loudest voice responsible for the room', outcome: 'Responsibility does what responsibility usually does. He is a different man with it on his arm.', effect: { squadMorale: 6, playerMorale: { who: 'oldest', delta: 12 } } },
          { id: 'watch', label: 'Say nothing and watch', desc: 'Let it settle on its own', outcome: 'It settles on its own, mostly. He files the whole thing away for the next time it happens.', effect: { squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-fringe-revolt', title: 'The Ones Who Never Play', icon: '🪑', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six players have not started a league game since August. One of them has stopped bothering to look disappointed when the team sheet goes up, which is the part that ought to worry him.',
        choices: [
          { id: 'honest', label: 'Tell them the truth', desc: 'Where they stand, and why, however it lands', outcome: 'Two ask for moves. Four work harder. Nobody can say afterwards that they were strung along, and that is worth something in a small dressing room.', effect: { squadMorale: 5, playerMorale: { who: 'unhappiest', delta: -8 }, tag: 'mgr-straight-talker' } },
          { id: 'promise', label: 'Promise them minutes', desc: 'Buy some goodwill and worry later', outcome: 'The room lifts for a month. Then the fixtures come thick and he plays his best eleven anyway, and everybody remembers what was said.', effect: { squadMorale: 10, tag: 'mgr-broken-promise' } },
          { id: 'cup', label: 'Give them the cup tie', desc: 'A real game, against a real side, and see', outcome: 'They win it, scruffily, and two of them are undroppable for a month afterwards. It costs him a stronger side in a competition he might have won.', effect: { squadMorale: 12, coins: -80 } },
        ],
      },
    },
  },
  {
    id: 'mgr-wonderkid-handling', title: 'Too Much, Too Soon', icon: '🌟', category: 'dressing-room',
    when: { needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best young player at the club is sixteen and has just done something in training that three coaches described independently, using the same word. Everyone in the building has an opinion on what happens next.',
        choices: [
          { id: 'throw-in', label: 'Put him in the side', desc: 'Ready or not, he is the best option', outcome: 'He is magnificent for six weeks and then the league works him out and he is a boy again, publicly. He learns something. So does the manager.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -3, tag: 'mgr-fast-tracked' } },
          { id: 'protect', label: 'Protect him', desc: 'Twenty minutes here and there, no headlines', outcome: 'He is furious about it for a season and grateful about it for a decade. The club keeps something it might otherwise have burnt.', effect: { playerMorale: { who: 'youngest', delta: -8 }, tag: 'mgr-patient' } },
          { id: 'loan', label: 'Send him out to play men', desc: 'A hard division, a hard winter', outcome: 'He comes back with a scar over one eye and no fear at all of a centre-half who fancies himself.', effect: { playerMorale: { who: 'youngest', delta: 6 }, coins: 60 } },
        ],
      },
    },
  },
];
