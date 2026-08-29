// Boardroom arcs — the people upstairs. Gated on the club's SITUATION (position, coins, tier) rather than
// on the squad, because a board's mood is about the table and the accounts.
import type { ManagerArc } from '../managerarc.js';

export const BOARDROOM_ARCS: ManagerArc[] = [
  {
    id: 'mgr-board-patience', title: 'A Quiet Word Upstairs', icon: '🪑', category: 'boardroom',
    when: { minSeason: 2, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chairman asks him up for a coffee he does not want. Nobody says the word "results". It is the only thing either of them is thinking about.',
        choices: [
          { id: 'plan', label: 'Lay out the plan', desc: 'Fixtures, fitness, who is coming back and when', outcome: 'He talks for twenty minutes about things that are actually true. The chairman writes nothing down and looks fractionally less worried.', effect: { boardMood: 2, tag: 'mgr-board-briefed' } },
          { id: 'promise-top', label: 'Promise a finish', desc: 'Name a position out loud', outcome: 'It buys him until spring. It also means there is now a number in the room that everybody can measure him against.', effect: { boardMood: 3, tag: 'mgr-promised-finish' } },
          { id: 'blunt', label: 'Tell him the squad is short', desc: 'Ask for money instead of offering comfort', outcome: 'The temperature drops. Whether it works depends entirely on what happens in the next six matches.', effect: { boardMood: -2, coins: 220 } },
        ],
      },
    },
  },
  {
    id: 'mgr-sell-to-survive', title: 'The Accounts', icon: '📉', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 200 } as any, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The finance director does not come to training. He has come to training. He would like to talk about the wage bill, and he has brought a folder.',
        choices: [
          { id: 'sell', label: 'Agree to sell somebody', desc: 'Balance the books and weaken the side', outcome: 'The money arrives and the squad is a player worse. Both facts are true at the same time and only one of them is on the spreadsheet.', effect: { coins: 400, squadMorale: -8, boardMood: 2 } },
          { id: 'refuse', label: 'Refuse, and take the consequences', desc: 'Keep the side together, keep the problem', outcome: 'He keeps his players. The folder goes back upstairs and comes down again in three months, thicker.', effect: { boardMood: -3, squadMorale: 8, tag: 'mgr-refused-sale' } },
          { id: 'wages', label: 'Cut his own budget instead', desc: 'Protect the players, absorb it elsewhere', outcome: 'A scout goes. A physio goes part-time. Nobody in the dressing room ever finds out, which is the point.', effect: { coins: 150, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-ultimatum', title: 'Six Games', icon: '⏳', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.8 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is not phrased as an ultimatum. It has a number in it, and the number is six.',
        choices: [
          { id: 'accept', label: 'Accept it and say nothing publicly', desc: 'Take it on the chin, keep it in the building', outcome: 'He does not mention it once. The players find out anyway, the way players always do, and something hardens in them.', effect: { squadMorale: 6, boardMood: 1, tag: 'mgr-under-pressure' } },
          { id: 'public', label: 'Say it out loud at the presser', desc: 'Put the board on the record', outcome: 'It is the lead item by six o clock. The supporters are entirely on his side and the boardroom is entirely not.', effect: { boardMood: -3, prestige: 2, tag: 'mgr-went-public' } },
        ],
      },
    },
  },
];
