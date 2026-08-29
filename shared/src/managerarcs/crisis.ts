// Crisis arcs — the seasons that go wrong. Gated hard on league position so they cannot fire while the
// club is cruising, which was the single biggest tonal risk in the whole system.
import type { ManagerArc } from '../managerarc.js';

export const CRISIS_ARCS: ManagerArc[] = [
  {
    id: 'mgr-losing-run', title: 'Seven Without A Win', icon: '🌧️', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The training ground has gone quiet in the specific way it goes quiet when nobody wants to be the one making a noise. Seven games. Two of them were performances. None of them were wins.',
        choices: [
          { id: 'change', label: 'Change everything', desc: 'Shape, personnel, the lot', outcome: 'It either breaks the run or it confirms that he is guessing. There is no third outcome and everyone in the building knows it.', effect: { squadMorale: 4, boardMood: -1, tag: 'mgr-tinkered' } },
          { id: 'hold', label: 'Change nothing', desc: 'Trust the work and take the criticism', outcome: 'He says the word "process" in a press conference and hears how it sounds. The eighth game is better. The ninth is a win.', effect: { squadMorale: -2, boardMood: 1, prestige: 1, tag: 'mgr-held-nerve' } },
          { id: 'blame', label: 'Take it all publicly', desc: 'Put himself between the players and the noise', outcome: 'The dressing room notices. So does the boardroom, and they notice a different thing.', effect: { squadMorale: 12, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-relegation-fight', title: 'The Run-In', icon: '🔥', category: 'crisis',
    when: { minPos: 0.82, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six games left and the table has stopped being an abstraction. Every result elsewhere matters now, and grown adults are refreshing scores from other grounds at midnight.',
        choices: [
          { id: 'youth', label: 'Trust the young ones', desc: 'They do not know enough to be frightened', outcome: 'Two of them are too naive to feel the pressure and it turns out that is exactly what the side needed.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: 6 } },
          { id: 'experience', label: 'Lean on the old heads', desc: 'Men who have been here before', outcome: 'They are slower than they were and they know precisely where to stand. It is not pretty and it is not meant to be.', effect: { playerMorale: { who: 'oldest', delta: 12 }, squadMorale: 4 } },
          { id: 'siege', label: 'Make it us against everyone', desc: 'Close the doors and turn the noise into fuel', outcome: 'It works or it curdles, and either way nobody at the club talks to a journalist for six weeks.', effect: { squadMorale: 10, prestige: -1, tag: 'mgr-siege' } },
        ],
      },
    },
  },
];
