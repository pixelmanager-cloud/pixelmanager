import type { StoryArc } from '../storyarc.js';

// SIGNATURE arcs — rare, low-probability one-off moments that become "the playthrough where…". Keep short.
export const SIGNATURE_ARCS: StoryArc[] = [
  {
    id: 'wonder-goal', title: 'The Goal They’ll Never Forget', icon: '⚡', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ball drops to him on the halfway line, the whole pitch ahead, the game on a knife-edge. There is a moment where time seems to slow. What does he do?',
        choices: [
          { id: 'solo', label: 'Take them all on', desc: 'Head down, everything or nothing', outcome: 'He beats one, two, three, and buries it. A goal replayed for a generation — the {RIVAL} of it all forgotten in an instant.', effect: { form: 0.12, market: 4, attr: { flair: 2, creativity: 1 }, meters: { fans: 22 }, tag: 'legend-goal' } },
          { id: 'team', label: 'Play the killer pass', desc: 'The unselfish option, the right option', outcome: 'He slides in the winner for a teammate — no glory, all class. The room loves him for it.', effect: { form: 0.08, attr: { teamwork: 1, creativity: 1 }, meters: { peers: 14, fans: 8 } } },
        ],
      },
    },
  },
  {
    id: 'last-minute-winner', title: 'The 96th Minute', icon: '⏱️', category: 'signature',
    minTurn: 110, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Deep into stoppage time, the scores level in a game the club had to win, one last corner swings in — and it falls to him six yards out with the keeper stranded.',
        choices: [
          { id: 'smash', label: 'Lash it in', desc: 'No thinking — just hit it', outcome: 'The net bulges and the stadium detonates. He wheels away, shirt off, booked and beaming. Scenes.', effect: { form: 0.12, market: 3, attr: { composure: 1, aggression: 1 }, meters: { fans: 20, peers: 10 } } },
          { id: 'compose', label: 'Take a touch', desc: 'Kill it dead, pick his spot, ice in the veins', outcome: 'One touch, side-foot, bottom corner — the coolest head in the ground. A finish they’ll show for years.', effect: { form: 0.1, market: 3, attr: { composure: 2 }, meters: { fans: 18 } } },
        ],
      },
    },
  },
  {
    id: 'sig-hat-trick', title: 'The Match Ball', icon: '🎩', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two already tucked away, the crowd roaring his name, and now the ball sits up for him on the edge of the box with the goal gaping. A hat-trick is one swing of the boot away.',
        choices: [
          { id: 'curl', label: 'Curl it into the top bino', desc: 'Go for the ridiculous, the unforgettable', outcome: 'He bends it up and over the wall into the postage stamp — a hat-trick sealed in the most outrageous fashion. The ball is his, the night is his, and the stands are bedlam.', effect: { form: 0.13, market: 4, attr: { flair: 2, composure: 1 }, meters: { fans: 24, peers: 8 } } },
          { id: 'tuck', label: 'Slot it low and sure', desc: 'No heroics, just the treble in the bag', outcome: 'Cool as you like, he rolls it inside the far post and completes the treble. He gathers the match ball off the net and holds it aloft like a newborn. Pure, unshakeable class.', effect: { form: 0.11, market: 3, attr: { composure: 2 }, meters: { fans: 18, agent: 6 } } },
        ],
      },
    },
  },
  {
    id: 'sig-title-decider', title: 'Champions by a Whisker', icon: '🏆', category: 'signature',
    minTurn: 120, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Final day, level on points with {RIVAL}, the title decided by this single game. The clock reads 94:00, the score locked, and the ball spills loose to him at the far post with the whole season hanging on the next heartbeat.',
        choices: [
          { id: 'volley', label: 'Throw everything at it', desc: 'First time, no second chances', outcome: 'He lashes it in on the half-volley and the ground erupts into pandemonium — champions, on the last kick, ahead of {RIVAL} by a single agonising point. Grown men weep in the stands. He will never buy a drink in this city again.', effect: { form: 0.14, market: 6, attr: { aggression: 1, leadership: 2 }, meters: { fans: 28, peers: 12, sponsors: 8 } } },
          { id: 'steer', label: 'Guide it past the dive', desc: 'Precision over power, thread the needle', outcome: 'He opens his body and steers it inside the post as the keeper flails — title won by the width of a coat of paint. Delirium. He sinks to his knees as blue smoke and bodies swallow him whole.', effect: { form: 0.13, market: 5, attr: { composure: 2, leadership: 1 }, meters: { fans: 26, sponsors: 6 } } },
        ],
      },
    },
  },
  {
    id: 'sig-giant-killing', title: 'The Cup Upset', icon: '🗡️', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Drawn against {RIVAL}, the moneyed giants everyone has already handed the tie to, his little club is the punchline of the round. Then a loose ball breaks to him in the dying minutes, one-nil the underdogs, a nation watching the David-and-Goliath live.',
        choices: [
          { id: 'kill', label: 'Bury the second and end it', desc: 'No mercy — put the tie beyond doubt', outcome: 'He races clear and slots it home to make it two, and the giant-killing is complete. {RIVAL} trudge off humiliated while a stadium of nobodies sings until their throats bleed. The romance of the cup, alive and roaring.', effect: { form: 0.13, market: 5, attr: { aggression: 1, leadership: 1 }, meters: { fans: 24, peers: 10 } } },
          { id: 'shield', label: 'Shield it to the corner flag', desc: 'Kill the clock, protect the miracle', outcome: 'He hugs the ball into the corner and runs the seconds down like a seasoned pro twice his age, and the whistle confirms the shock of the round. He soaks up every second of the ovation. Giants slain.', effect: { form: 0.11, attr: { composure: 2, teamwork: 1 }, meters: { fans: 18, peers: 12 } } },
        ],
      },
    },
  },
  {
    id: 'sig-bicycle-kick', title: 'The Overhead', icon: '🚲', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The cross hangs behind him, too high, too far, no earthly reason to try it. Yet the ground holds its breath as he leaves the turf, back arching toward the sky, the ball dropping onto his laces at the perfect impossible instant.',
        choices: [
          { id: 'scissor', label: 'Let the bicycle fly', desc: 'Commit fully — poetry or a heap on the grass', outcome: 'He scissors through the air and the connection is sweet as anything, the ball rocketing in off the underside of the bar. An overhead kick for the ages, freeze-framed onto ten thousand bedroom walls before he even lands.', effect: { form: 0.14, market: 6, attr: { flair: 3 }, meters: { fans: 26, sponsors: 8 } } },
          { id: 'cushion', label: 'Cushion it down instead', desc: 'Bring it under control, take the safer glory', outcome: 'He kills the drop dead on his chest, swivels, and rifles it low into the net — less circus, but a finish of gorgeous composure that leaves the keeper rooted. The crowd rises all the same.', effect: { form: 0.1, market: 3, attr: { flair: 1, composure: 1 }, meters: { fans: 16 } } },
        ],
      },
    },
  },
  {
    id: 'sig-shootout-hero', title: 'The Spot Where Legends Stand', icon: '🥅', category: 'signature',
    minTurn: 110, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The shootout has run to sudden death against {RIVAL}, the whole endless night distilled into this one lonely walk to the spot. The keeper dances the line, the world holds still, and it is all on him from twelve yards.',
        choices: [
          { id: 'panenka', label: 'Dink the Panenka', desc: 'Ice-cold audacity or eternal ridicule', outcome: 'He chips it feather-soft down the middle as the keeper hurls himself away, the ball settling in the empty net like a snowflake. The nerve of it! His teammates bury him beneath a mountain of bodies — the coolest man in the country.', effect: { form: 0.13, market: 5, attr: { composure: 2, flair: 1 }, meters: { fans: 24, peers: 12 } } },
          { id: 'hammer', label: 'Smash it into the roof', desc: 'No guessing, just pace and precision', outcome: 'He steps up and thunders it into the top of the net with the keeper still leaning, and the whistle blows on triumph. He sprints the length of the pitch, arms wide, mobbed at the halfway line as {RIVAL} slump to the turf.', effect: { form: 0.12, market: 4, attr: { composure: 1, aggression: 1 }, meters: { fans: 22, peers: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-wonder-assist', title: 'The Pass', icon: '🎯', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He looks up and sees what no one else in the ground can see — a runner ghosting behind a back line that has switched off for a fraction of a second. The window is a keyhole, and it is closing fast.',
        choices: [
          { id: 'outside', label: 'Bend it with the outside of the boot', desc: 'The showman’s pass, disguise and all', outcome: 'He wraps the outside of his foot around it and the ball curves through the eye of a needle, dropping perfectly into stride. The finish is a formality; the pass is the thing they’ll talk about for years — a defence-splitting act of vision.', effect: { form: 0.12, market: 4, attr: { creativity: 3 }, meters: { fans: 16, peers: 14 } } },
          { id: 'nolook', label: 'Slide the no-look through-ball', desc: 'Eyes elsewhere, deceive the whole defence', outcome: 'Body shaped one way, gaze fixed the other, he threads it blind between three defenders and it splits them like they were bollards. His teammate can’t miss, and won’t. Assist of the season, no debate.', effect: { form: 0.11, attr: { creativity: 2, teamwork: 1 }, meters: { peers: 16, fans: 12 } } },
        ],
      },
    },
  },
  {
    id: 'sig-debut-fairytale', title: 'The Boy Off the Bench', icon: '✨', category: 'signature',
    minTurn: 100, maxTurn: 180, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His name is called for the very first time, thrown on with minutes left and the score deadlocked, the badge fresh on his chest and his family somewhere up in the stands hardly daring to breathe. First touch of his career, and the ball is rolling to him.',
        choices: [
          { id: 'first-touch', label: 'Shoot with his first ever touch', desc: 'No time to think, only to believe', outcome: 'First touch, first kick, first goal — he lashes it in seconds after coming on and the fairytale writes itself. The commentator loses his mind, the bench empties onto him, and up in the stands his family are in floods. A debut for the storybooks.', effect: { form: 0.13, market: 5, attr: { composure: 1, flair: 1 }, meters: { fans: 20, family: 14, agent: 6 } } },
          { id: 'run', label: 'Go on a mazy debut run', desc: 'Announce himself, gamble on the moment', outcome: 'He picks it up and jinks past two before rolling it in at the near post, an entrance nobody in the ground will ever forget. A star is born on the touchline in a single breathless minute, his name sung before he even knows the words.', effect: { form: 0.12, market: 4, attr: { flair: 2 }, meters: { fans: 18, family: 12 } } },
        ],
      },
    },
  },
  {
    id: 'sig-halfway-lob', title: 'From His Own Half', icon: '🌙', category: 'signature',
    minTurn: 100, maxTurn: 200, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He wins it back inside his own half and glances up to see the {RIVAL} keeper caught yards off his line, sweeping and stranded. Sixty yards of empty grass stretch between the ball and the gaping net, and cheek is whispering in his ear.',
        choices: [
          { id: 'lob', label: 'Lob him from distance', desc: 'The audacity of a lifetime — go on, try it', outcome: 'He clips it early and high and the whole ground turns to watch it float, the keeper back-pedalling in horror as it drops under the bar off the faintest kiss of the woodwork. From his own half! An absurd, jaw-dropping goal that belongs on every highlight reel ever cut.', effect: { form: 0.14, market: 6, attr: { flair: 2, creativity: 1 }, meters: { fans: 26, sponsors: 8 } } },
          { id: 'drive', label: 'Drive forward and make sure', desc: 'Carry it in rather than chance the impossible', outcome: 'He resists the madness, gallops into the acres of space, and rounds the scrambling keeper to roll it into an empty net. Not the worldie it might have been, but a cool, clinical solo goal that has the crowd on their feet all the same.', effect: { form: 0.1, market: 3, attr: { composure: 1, stamina: 1 }, meters: { fans: 16 } } },
        ],
      },
    },
  },
];
