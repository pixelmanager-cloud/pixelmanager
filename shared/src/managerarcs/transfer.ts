// Transfer-window arcs — agents, bids, deadline day. Gated on money and on having someone worth wanting.
import type { ManagerArc } from '../managerarc.js';

export const TRANSFER_ARCS: ManagerArc[] = [
  {
    id: 'mgr-agent-circling', title: 'The Agent', icon: '🕴️', category: 'transfer',
    when: { needs: 'wonderkid', minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A man in a very good coat has been at three youth games in a fortnight. He is not there for the football, and he has already spoken to the boy’s mother.',
        choices: [
          { id: 'engage', label: 'Deal with him directly', desc: 'Better in the room than outside it', outcome: 'He is charming, well-informed and completely unmoved by anything said to him. But the club knows where it stands, which it did not this morning.', effect: { tag: 'mgr-knows-the-agent' } },
          { id: 'freeze', label: 'Refuse to engage', desc: 'He is not the player, and not the club’s problem', outcome: 'The boy signs elsewhere in eighteen months and the club gets a fraction of what he was worth. Principle is expensive.', effect: { playerMorale: { who: 'youngest', delta: -10 }, tag: 'mgr-lost-a-kid' } },
          { id: 'sign-now', label: 'Get the boy on a deal today', desc: 'Whatever it costs, before the coat gets his ear', outcome: 'It costs more than a sixteen-year-old should cost. In four years it will look like the best money the club ever spent, or the worst.', effect: { coins: -350, playerMorale: { who: 'youngest', delta: 12 }, tag: 'mgr-tied-him-down' } },
        ],
      },
    },
  },
  {
    id: 'mgr-deadline-day', title: 'Eleven Hours', icon: '⏰', category: 'transfer',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everything the club needs is available and none of it is affordable. A phone that has been quiet for a fortnight will not stop for the next eleven hours.',
        choices: [
          { id: 'spend', label: 'Back the squad', desc: 'Spend what there is and worry in June', outcome: 'Two in, both needed, and a budget that will not survive an injury. It is the right football decision and a terrible financial one.', effect: { coins: -420, squadMorale: 8, boardMood: -1 } },
          { id: 'hold', label: 'Hold the money', desc: 'Nothing at these prices', outcome: 'The window shuts on a squad that is exactly as thin as it was in the morning, and a bank balance that is exactly as healthy.', effect: { boardMood: 2, squadMorale: -5 } },
          { id: 'loan', label: 'Take a loan nobody else wanted', desc: 'A gamble on somebody out of favour', outcome: 'He arrives with a point to prove and no fitness at all. One of those two things is fixable.', effect: { coins: -90, squadMorale: 3 } },
        ],
      },
    },
  },
];
