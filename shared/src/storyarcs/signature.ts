import type { StoryArc } from '../storyarc.js';

// SIGNATURE arcs — rare, low-probability one-off moments that become "the playthrough where…". Keep short.
export const SIGNATURE_ARCS: StoryArc[] = [
  {
    id: 'wonder-goal', title: 'The Goal They’ll Never Forget', icon: '⚡', category: 'signature',
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 56, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 107, weight: 1, rare: true, first: 'open',
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
    minTurn: 34, maxTurn: 119, weight: 1, rare: true, first: 'open',
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
  {
    id: 'sig-solo-dribble', title: 'The Run', icon: '🏃', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He collects it deep by his own corner flag with nothing on, and then a defender lunges and misses, and something in him decides to just keep going. Bodies close from everywhere as the whole length of the pitch opens up ahead.',
        choices: [
          { id: 'weave', label: 'Weave through the lot of them', desc: 'Every touch a gamble, the crowd rising with each beaten man', outcome: 'He glides past five in a mazy, end-to-end slalom that has the ground on its feet before he even reaches the box, then dinks it home with the outside of his boot. A one-man goal they’ll be showing when he’s old and grey — sheer, undiluted genius.', effect: { form: 0.14, market: 6, attr: { flair: 3, stamina: 1 }, meters: { fans: 26, peers: 10 } } },
          { id: 'release', label: 'Draw them in, then release', desc: 'Carry it sixty yards, commit the defence, unselfish at the death', outcome: 'He carries it the length of the field, sucking in three defenders, and rolls the simplest of squares for a teammate to tap into an open net. The run was his; the goal he gave away. The bench is delirious at the sheer nerve of the carry.', effect: { form: 0.11, attr: { stamina: 2, teamwork: 1 }, meters: { peers: 16, fans: 14 } } },
        ],
      },
    },
  },
  {
    id: 'sig-freekick-thunderbolt', title: 'Over The Wall', icon: '⚡', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty-five yards out, dead centre, the wall lined up and jostling, the keeper barking orders and pointing. He plants the ball, takes his paces back, and the entire stadium falls to a hush that you could hear a pin drop through.',
        choices: [
          { id: 'topcorner', label: 'Rifle it into the top corner', desc: 'Pure venom, up and over, no half-measures', outcome: 'He strikes it with everything and it screams up over the wall and dips venomously into the postage stamp before the keeper has even flinched. The net nearly rips off its pegs. A thunderbolt of a free-kick that leaves the whole ground gasping.', effect: { form: 0.13, market: 5, attr: { aggression: 1, flair: 2 }, meters: { fans: 24, sponsors: 6 } } },
          { id: 'curl', label: 'Bend it around the wall', desc: 'Whip and finesse, kiss the far post', outcome: 'He caresses it round the outside of the wall with the inside of his boot, the ball curling wickedly away from the diving keeper and nestling off the far upright. Not power but poetry — a set-piece of surgical, breathtaking precision.', effect: { form: 0.12, market: 4, attr: { composure: 1, flair: 2 }, meters: { fans: 20, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-goalline-clearance', title: 'Off The Line', icon: '🧱', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The keeper is beaten, the header looping over him and dropping toward the empty net with the game there to be lost. He is the last man back, sprinting, and there is one heartbeat left to do something impossible.',
        choices: [
          { id: 'hook', label: 'Hook it clear off the line', desc: 'Throw a boot at it, acrobatics be damned', outcome: 'He flings himself back and hooks it off the line with the ball already a foot over the paint, clawing the certain goal away by a whisker. The stadium erupts as if a goal had been scored the other way — a last-ditch clearance that saves the whole night.', effect: { form: 0.12, attr: { aggression: 1, teamwork: 2 }, meters: { fans: 20, peers: 14 } } },
          { id: 'header', label: 'Head it off the line', desc: 'Ice-cool, rise and nod it to safety', outcome: 'He plants himself on the line and heads it away with a composure that belies the chaos around him, nodding the ball to safety as bodies pile in. No dramatics, just a defender reading the danger a half-second before anyone else. Match saved.', effect: { form: 0.1, attr: { composure: 2, teamwork: 1 }, meters: { peers: 16, fans: 14 } } },
        ],
      },
    },
  },
  {
    id: 'sig-penalty-save', title: 'The Save', icon: '🧤', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Last minute, one-nil, and the referee points to the spot against {RIVAL} — a penalty to level it and steal everything. He is alone on his line now, the striker placing the ball, ninety minutes of work resting on the next few seconds.',
        choices: [
          { id: 'dive', label: 'Read it and fly', desc: 'Trust the gut, commit early, full stretch', outcome: 'He gambles a fraction before the strike and hurls himself low to his right, fingertips clawing the ball onto the post and away. The whistle goes moments later on a clean sheet stolen from the jaws of ruin. A penalty save that turns a keeper into a folk hero.', effect: { form: 0.13, market: 4, attr: { keeping: 3, composure: 1 }, meters: { fans: 24, peers: 12 } } },
          { id: 'mindgames', label: 'Play the mind games, then stand tall', desc: 'Delay, unsettle him, wait him out on his feet', outcome: 'He toys with the taker, dawdling on his line and pointing to a corner, and the spooked striker snatches at it — straight into his chest as he holds his ground and swallows it whole. The save is all in the head, and {RIVAL} know they were beaten before the ball was even struck.', effect: { form: 0.12, market: 3, attr: { keeping: 2, leadership: 1 }, meters: { fans: 20, peers: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-diving-header', title: 'The Near Post', icon: '🎯', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The whipped cross fizzes in low and hard toward the near post, a fraction too far in front of him, the kind of ball you either commit your skull to or let sail harmlessly by. His marker hesitates; he does not.',
        choices: [
          { id: 'fulldive', label: 'Launch himself at it', desc: 'Full horizontal dive, face first into the danger', outcome: 'He throws his whole body parallel to the turf and meets it flush with his forehead, powering it inside the near post before he crashes down into the netting. A brave, bullet diving header that the keeper never had a prayer against. The crowd roars its disbelief.', effect: { form: 0.13, market: 4, attr: { aggression: 1, composure: 1 }, meters: { fans: 22, peers: 10 } } },
          { id: 'glance', label: 'Glance it deft and delicate', desc: 'A subtle flick, redirect the pace, guile over guts', outcome: 'Rather than power he supplies touch, glancing the ball with the faintest brush of his temple to send it wickedly across the keeper and in at the far corner. A near-post header of gorgeous, understated cunning that leaves everyone wondering how it went in.', effect: { form: 0.12, market: 3, attr: { creativity: 2, composure: 1 }, meters: { fans: 18, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-nutmeg-finish', title: 'Through The Legs', icon: '🪄', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The last {RIVAL} defender squares up to him at the edge of the box, feet planted, daring him to try something. There is a gap between those boots, a sliver of daylight, and a devil on his shoulder whispering that he should.',
        choices: [
          { id: 'meg', label: 'Nutmeg him and finish', desc: 'Roll it through his legs, then bury it — pure humiliation', outcome: 'He slips it clean through the defender’s legs, skips round the other side, and rifles it into the roof of the net in one contemptuous motion. The {RIVAL} man is left sitting on the grass, nutmegged and beaten, as the away end drowns in noise. Cruel, brilliant, unforgettable.', effect: { form: 0.13, market: 5, attr: { flair: 3 }, meters: { fans: 24, peers: 8 } } },
          { id: 'shimmy', label: 'Shimmy past and slot it', desc: 'Drop the shoulder, glide by, no need to embarrass', outcome: 'He drops a shoulder that sends the defender the wrong way entirely, strolls into the space, and passes it calmly into the corner. Less circus than the nutmeg, but a moment of icy control that dismantles {RIVAL} just the same. The finish never in doubt.', effect: { form: 0.11, market: 3, attr: { flair: 1, composure: 2 }, meters: { fans: 18 } } },
        ],
      },
    },
  },
  {
    id: 'sig-rabona-assist', title: 'The Rabona', icon: '🩰', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The ball runs to his wrong foot near the byline, a runner screaming for it in the middle, no time to shift it across his body. The orthodox thing is to check back and lose the moment. The outrageous thing is already forming in his mind.',
        choices: [
          { id: 'rabona', label: 'Wrap the rabona in', desc: 'Cross it with his standing leg — audacity incarnate', outcome: 'He wraps his kicking foot behind his standing leg and whips a rabona cross onto a plate, the ball curling in with impossible spin for a header that can’t miss. A pass so absurd the commentator simply laughs — an assist of pure, preening theatre.', effect: { form: 0.12, market: 4, attr: { flair: 3, creativity: 1 }, meters: { fans: 22, peers: 10 } } },
          { id: 'cutback', label: 'Check back and cut it', desc: 'Take the touch, do it properly, no showboating', outcome: 'He checks onto his stronger foot, buys himself the yard, and clips a measured cutback that his teammate sweeps home. Not the party trick the crowd craved, but a cross of ruthless efficiency and a goal all the same. The professional’s choice.', effect: { form: 0.1, attr: { creativity: 1, teamwork: 2 }, meters: { peers: 14, fans: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-forty-yard-screamer', title: 'From Forty', icon: '🚀', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The clearance drops to him fully forty yards out, the keeper a stride or two off his line and the defence backing off, inviting him to come closer. The invitation is a mistake, and he can feel the strike sitting up perfectly on his laces.',
        choices: [
          { id: 'laces', label: 'Hit it first time', desc: 'No touch, no thought, everything through the ball', outcome: 'He leathers it on the drop without breaking stride and the ball flies like a tracer, dipping and swerving over the back-pedalling keeper and in under the bar from forty yards. A screamer of a goal that has grown men clutching their heads in disbelief.', effect: { form: 0.14, market: 6, attr: { aggression: 1, flair: 2 }, meters: { fans: 26, sponsors: 8 } } },
          { id: 'dip', label: 'Take a touch and place the dipper', desc: 'Steady it, pick the spot, guile over brute force', outcome: 'He kills it dead, spots the keeper stranded, and floats a dipping, guided effort that drops just beneath the bar with surgical timing. Less brute violence than the first-time hit, but a strike of gorgeous vision that no one saw coming. The bench is on its feet.', effect: { form: 0.12, market: 4, attr: { composure: 1, creativity: 2 }, meters: { fans: 20, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-backheel-finish', title: 'The Backheel', icon: '🎭', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The ball squirms loose in a crowded six-yard box, bodies everywhere, and it runs behind him just as he plants to shoot. Turning to face goal would take a half-second he does not have. But his heel is already there.',
        choices: [
          { id: 'flick', label: 'Backheel it through the crowd', desc: 'Cheeky, blind, impudent — flick it and pray', outcome: 'Without even turning he flicks his heel at it and the ball threads through a forest of legs and past the stranded keeper into the net. A backheel finish of pure impudence in the tightest of spaces — the sort of goal you see once a season, if you’re lucky.', effect: { form: 0.13, market: 4, attr: { flair: 3 }, meters: { fans: 22, peers: 8 } } },
          { id: 'swivel', label: 'Swivel and lash it', desc: 'Spin onto it properly, make certain of the finish', outcome: 'He spins on a sixpence to get his body round the ball and hammers it high into the net before the defenders can close. Less flamboyant than the backheel, but a finish of lightning reactions and cold certainty in a box full of chaos. Clinical.', effect: { form: 0.11, attr: { composure: 2, aggression: 1 }, meters: { fans: 16 } } },
        ],
      },
    },
  },
  {
    id: 'sig-one-man-counter', title: 'The Break', icon: '💨', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The {RIVAL} corner is cleared to him and suddenly there is nothing but green grass and one exhausted defender between him and the goal seventy yards away. He sets off, the whole stadium sensing what is coming, the counter-attack on.',
        choices: [
          { id: 'burn', label: 'Burn him for pace and finish', desc: 'Full throttle, leave the defender for dead', outcome: 'He hits top gear and simply sprints away from the trailing defender, eating up the pitch before rolling it coolly under the advancing keeper. A one-man counter finished with a heartbeat that never rose above resting — devastating on the break, ice at the death.', effect: { form: 0.13, market: 5, attr: { stamina: 2, composure: 1 }, meters: { fans: 22, peers: 10 } } },
          { id: 'dummy', label: 'Wait, dummy the keeper, roll it in', desc: 'Slow it down, freeze the goalie, make him commit', outcome: 'He deliberately slows, lets the keeper come, sells him a shot that never arrives, and strolls the ball into the vacated net with an outrageous coolness. Seventy yards of sprint and then the calmest of finishes — a solo counter of pure, taunting composure.', effect: { form: 0.12, market: 4, attr: { composure: 2, flair: 1 }, meters: { fans: 20 } } },
        ],
      },
    },
  },
  {
    id: 'sig-captain-rally', title: 'A Man Down', icon: '🎖️', category: 'signature',
    minTurn: 56, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A red card has left them a man light against {RIVAL} and heads are dropping, the armband heavy on his sleeve as the away fans scent blood. Then the ball breaks to him in a rare foray forward, and the whole team’s belief hangs on what he does next.',
        choices: [
          { id: 'charge', label: 'Drag them up the pitch himself', desc: 'Carry it, will it, lead by the sheer force of doing', outcome: 'He powers forward through two challenges, refusing to be knocked off it, and smashes home a goal that rips the belief clean out of {RIVAL}. Ten men, and their captain has dragged them ahead by force of will alone. He roars at his own bench to keep going — a leader made of granite.', effect: { form: 0.14, market: 5, attr: { leadership: 2, aggression: 1 }, meters: { fans: 24, peers: 16 } } },
          { id: 'settle', label: 'Settle them, then finish calm', desc: 'Compose the team, control the moment, ice the goal', outcome: 'He waves his players into shape, slows the tempo to a crawl, then picks his moment to slide a finish inside the post with the composure of a man twice capped. A captain’s goal born of clear-headed control — ten men and utterly unshaken. The bench salutes their skipper.', effect: { form: 0.12, market: 4, attr: { leadership: 3, composure: 1 }, meters: { peers: 18, fans: 18 } } },
        ],
      },
    },
  },
  {
    id: 'sig-giant-header', title: 'Rising Above The Giant', icon: '🗼', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The corner swings toward the far post where the {RIVAL} colossus waits, a defender a full head taller than him and twice as broad, a man no ball in the air should ever get past. He starts his run anyway, timing it to the last inch.',
        choices: [
          { id: 'leap', label: 'Out-jump the giant', desc: 'Spring early, hang in the air, win the unwinnable duel', outcome: 'He launches himself a fraction before the giant and hangs there, somehow rising above a man towering over him to thump the header down and in. The whole ground gasps at the sheer defiance of physics — the little man who beat the tower to the ball.', effect: { form: 0.13, market: 4, attr: { aggression: 2, composure: 1 }, meters: { fans: 22, peers: 12 } } },
          { id: 'lose', label: 'Lose him with a clever run', desc: 'Peel off blind-side, cunning over muscle', outcome: 'Rather than fight the losing battle, he ghosts off the giant’s blind side at the last second and meets the ball completely unmarked, nodding it home with the big man left grasping at air. A header won by brains, not brawn — the smartest movement on the pitch.', effect: { form: 0.11, attr: { creativity: 2, composure: 1 }, meters: { fans: 16, peers: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-panenka-openplay', title: 'The Dink', icon: '🥄', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Clean through in open play, one-on-one, the keeper charging out to smother it and cut the angle to nothing. Everyone in the ground expects him to blast it. The keeper expects him to blast it. And that is precisely the problem for the keeper.',
        choices: [
          { id: 'chip', label: 'Chip it over the diving keeper', desc: 'A Panenka in open play — ice-cold, feather-light', outcome: 'As the keeper commits and dives at his feet, he simply scoops it feather-soft over the sprawling body and watches it loop gently down into the empty net. A dink of breathtaking cheek in the run of play — the coldest blood in the building.', effect: { form: 0.13, market: 5, attr: { composure: 2, flair: 1 }, meters: { fans: 22, peers: 8 } } },
          { id: 'slide', label: 'Slide it past the outstretched hand', desc: 'Take the safe side, roll it low and sure', outcome: 'He waits the keeper out and rolls it low past the flailing hand into the corner, no theatrics, just the clean certainty of a finisher who never doubted. Not the audacious dink, but a one-on-one dispatched with textbook, unhurried calm.', effect: { form: 0.1, attr: { composure: 2 }, meters: { fans: 14 } } },
        ],
      },
    },
  },
  {
    id: 'sig-first-touch-volley', title: 'The Long Ball', icon: '🎿', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A raking sixty-yard diagonal drops out of the floodlights toward him on the edge of the box, spinning and awkward, the sort of ball most men would take three touches to tame. He has already decided he will not take even one.',
        choices: [
          { id: 'volley', label: 'Volley it first time out of the air', desc: 'Meet it on the drop, sweet contact or bust', outcome: 'He never lets it land, swinging through the dropping ball first-time and catching it so sweetly it flashes past the keeper before anyone realises he’s shot. A first-touch volley from a long ball out of the sky — technique of the very highest order.', effect: { form: 0.14, market: 6, attr: { flair: 2, composure: 1 }, meters: { fans: 24, sponsors: 6 } } },
          { id: 'cushion', label: 'Cushion it dead and finish', desc: 'Kill the awkward drop, then place it with care', outcome: 'He takes the venom out of it with a cushioned first touch that dies at his feet like it’s on a string, then side-foots it calmly home. Less spectacular than the volley, but a piece of control so clean the whole move looks rehearsed. Immaculate.', effect: { form: 0.11, attr: { composure: 2, creativity: 1 }, meters: { fans: 16 } } },
        ],
      },
    },
  },
  {
    id: 'sig-signature-curl', title: 'His Corner', icon: '🌀', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The ball rolls onto his stronger foot in that spot he loves, cutting in from the flank with the far post beckoning — the exact position he has scored from a hundred times in his head. Defenders know it’s coming, and still they can’t stop it.',
        choices: [
          { id: 'trademark', label: 'Bend the trademark far-post curler', desc: 'His signature strike, whipped into the far top corner', outcome: 'He plants and whips it with the inside of his boot, the ball bending away from the keeper’s despairing dive and curling into the far top corner exactly as it always does. His signature goal, the one they’ll forever call simply his — inevitable, and still impossible to watch without a shiver.', effect: { form: 0.13, market: 5, attr: { flair: 2, composure: 1 }, meters: { fans: 22, sponsors: 6 } } },
          { id: 'disguise', label: 'Disguise it and go near post', desc: 'Sell the curl, then fool the keeper the other way', outcome: 'He shapes for the trademark curl, watches the keeper lean to cover the far post, and instead drills it savagely inside the near upright the man had abandoned. Even his signature can be a decoy — a finish of cunning that turns his own legend against the goalkeeper.', effect: { form: 0.11, attr: { creativity: 2, flair: 1 }, meters: { fans: 18, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-scorpion-kick', title: 'The Scorpion', icon: '🦂', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The {RIVAL} shot skids in behind him at an angle no boot could ever reach, already past him and heading goalward — unless a man were mad enough to dive forward and flick his heels up over his own back to meet it.',
        choices: [
          { id: 'flick', label: 'Throw the scorpion at it', desc: 'Dive forward, heels to the sky — insanity or immortality', outcome: 'He pitches himself face-first at the turf and whips both heels up over his spine, the studs meeting the ball behind his own head and clawing it up and clear of the line. A scorpion so outrageous the fourth official forgets to raise his flag — a clearance no human should attempt, let alone pull off.', effect: { form: 0.13, market: 5, attr: { flair: 3, aggression: 1 }, meters: { fans: 24, peers: 10 } } },
          { id: 'block', label: 'Block it flat and safe', desc: 'Get a solid body behind it, no theatrics', outcome: 'He abandons the acrobatics, plants himself square in the flight, and lets the ball thud harmlessly into his chest before shepherding it away. No highlight reel, but a defender reading danger and killing it with cold, unfussy certainty. The bench exhales as one.', effect: { form: 0.09, attr: { composure: 2, teamwork: 1 }, meters: { peers: 12, fans: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-chest-volley-turn', title: 'On The Turn', icon: '🌪️', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The pass arrives chest-high with his back to goal and a {RIVAL} centre-half breathing down his neck, no space to turn and no time to bring it down. The orthodox play is to lay it off. His instinct is telling him something far ruder.',
        choices: [
          { id: 'spinvolley', label: 'Chest it, spin, and volley in one motion', desc: 'Trap on the breastbone, whip round, hit it before it lands', outcome: 'He cushions it off his chest, spins a full half-turn away from his marker, and lashes the dropping ball on the volley before it can touch the grass — all in one impossible, flowing movement. The keeper never even set himself. A goal of breathtaking invention on the turn, conjured out of nothing.', effect: { form: 0.14, market: 6, attr: { flair: 2, creativity: 2 }, meters: { fans: 24, sponsors: 6 } } },
          { id: 'layoff', label: 'Lay it and spin onto the return', desc: 'Bounce it off a teammate, take the wall pass, finish clean', outcome: 'He nudges it into a runner, spins his marker on the blind side, and collects the one-two in his stride to slot home calmly. Less circus than the swivel-volley, but a piece of quick, intelligent combination play that leaves the defender chasing shadows. Textbook.', effect: { form: 0.1, attr: { creativity: 1, teamwork: 2 }, meters: { peers: 14, fans: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-fingertip-bar', title: 'Onto The Bar', icon: '🖐️', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The {RIVAL} striker connects flush from the edge of the area and the ball flies, arrowing for the top corner with the winner written all over it. He is already diving the wrong way and there is one desperate, outstretched hand between glory and ruin.',
        choices: [
          { id: 'tip', label: 'Fling out a single fingertip', desc: 'Full extension, one hand, claw it onto the woodwork', outcome: 'He arches backward at full horizontal stretch and gets the faintest brush of one fingertip on it, just enough to lift the ball onto the crossbar and away to safety. A save so improbable the striker sinks to his knees clutching his head — a fingertip onto the bar that they will replay until the pixels fade.', effect: { form: 0.13, market: 5, attr: { keeping: 3, composure: 1 }, meters: { fans: 24, peers: 12 } } },
          { id: 'strong', label: 'Get a strong palm behind it', desc: 'Trust the reach, punch it down and smother the rebound', outcome: 'He throws a firm palm at it and beats it straight down, then scrambles across to swallow the loose ball before anyone can pounce. Not the balletic tip, but a keeper trusting his positioning and hands to snuff out the danger twice over. Ruthlessly efficient.', effect: { form: 0.1, attr: { keeping: 2, composure: 1 }, meters: { fans: 16, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-double-save', title: 'The Double Save', icon: '🧤', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The {RIVAL} striker is through and shoots low and hard, and he blocks it — but the rebound spins straight to a second attacker with the whole goal yawning open and him flat on the floor, half a second to somehow be a hero twice.',
        choices: [
          { id: 'scramble', label: 'Spring up and fly at the second', desc: 'No time to set — throw everything at the follow-up', outcome: 'He blocks the first with his legs, claws himself off the deck in a heartbeat, and hurls his whole body across the line to somehow smother the point-blank rebound too. A double save in one frantic passage of play that defies belief — the goalmouth erupts and the strikers stare at each other, ashen. Twice denied.', effect: { form: 0.14, market: 5, attr: { keeping: 3, stamina: 1 }, meters: { fans: 24, peers: 14 } } },
          { id: 'spread', label: 'Stay big and make himself a wall', desc: 'Read the rebound early, spread and let it hit him', outcome: 'Sensing the follow-up before it comes, he refuses to commit to ground and instead makes himself enormous, and the second shot cannons off his sprawled frame to safety. No flailing, just a keeper who read the whole sequence a beat ahead of everyone. Positional genius under siege.', effect: { form: 0.11, attr: { keeping: 2, composure: 1 }, meters: { fans: 16, peers: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-last-man-tackle', title: 'The Last Man', icon: '🛡️', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A slip in midfield sends the {RIVAL} forward clean through with only open grass ahead, and he is ten yards adrift and the last hope, lungs already screaming. The certain goal is being scored in real time unless he can somehow catch a man with a flying start.',
        choices: [
          { id: 'slide', label: 'Sprint him down and slide the tackle', desc: 'Chase the impossible, then a perfect toe-poke at full stretch', outcome: 'He devours the ten-yard gap with a recovery sprint that seems to bend physics, times his slide to the last inch, and pokes the ball clean off the striker’s toe as the shot loads. A saving tackle so perfectly judged the crowd roars as though a goal had gone in the other end. The last man, and he did not miss.', effect: { form: 0.13, market: 4, attr: { stamina: 2, aggression: 1 }, meters: { fans: 22, peers: 14 } } },
          { id: 'shepherd', label: 'Shepherd him wide and force the error', desc: 'Catch up, stay on his feet, angle him off the goal', outcome: 'Rather than gamble on the tackle, he claws his way alongside and calmly ushers the striker away from goal and toward the byline, closing the angle until the shot dribbles wide. No dramatics, just a defender who ran his heart out and then kept his head. Danger strangled at the death.', effect: { form: 0.1, attr: { stamina: 1, composure: 2 }, meters: { peers: 12, fans: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-scrappy-equaliser', title: 'The Scramble', icon: '🧨', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ninety-seven minutes gone, a goal down to {RIVAL}, and the last hopeful punt pinballs around a packed six-yard box — off a shin, off the bar, off a defender — the ball squirting loose in a scrum of bodies with the whistle about to blow on defeat.',
        choices: [
          { id: 'bundle', label: 'Bundle it over the line any way he can', desc: 'Shin, knee, hip — just get a touch and force it in', outcome: 'He throws himself into the melee and forces it over the line off his hip as three defenders lunge and the keeper claws at air. Ugly as sin, no idea which part of him it hit, and utterly priceless — a scrappy ninety-seventh-minute equaliser that saves a point and sends the whole bench sprinting onto the pitch. Not pretty. Never forgotten.', effect: { form: 0.12, market: 3, attr: { aggression: 2, teamwork: 1 }, meters: { fans: 22, peers: 12 } } },
          { id: 'compose', label: 'Set his feet and sweep it clean', desc: 'Find a half-yard in the chaos, strike it properly', outcome: 'Amid the pandemonium he somehow finds a clear sight of it, sets his body in a fraction of space, and sweeps a clean side-foot inside the post. A moment of order carved out of total mayhem — the calmest man in a box full of flailing limbs snatches the equaliser at the death.', effect: { form: 0.11, attr: { composure: 2, aggression: 1 }, meters: { fans: 18, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-clearance-goal', title: 'The Hoof', icon: '🥾', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Under siege on the edge of his own box, he swings a boot at a dropping ball with one thought — get it as far away as humanly possible. It leaves his laces like a cannon shot, and only then does he notice the {RIVAL} keeper wandering yards off his line downfield.',
        choices: [
          { id: 'let-it-fly', label: 'Watch it sail and dare to dream', desc: 'Half-clearance, half-shot — let the monstrous strike carry', outcome: 'The booming volley never stops climbing then dips wickedly out of the sky, the horrified keeper scrambling back too late as it drops under his own bar from inside his own half. A clearance that became the goal of the season by glorious accident — he wheels away shrugging, arms wide, as bewildered as the eighty thousand watching.', effect: { form: 0.14, market: 6, attr: { aggression: 1, flair: 2 }, meters: { fans: 26, sponsors: 8 } } },
          { id: 'chase', label: 'Sprint upfield to make it count', desc: 'Trust the flight, gallop after it, be there for the follow-up', outcome: 'He hares after his own wild clearance, and when the keeper only half-claws it down he is first to the loose ball to roll it into the empty net. Less the freak worldie, more the reward for never stopping running — an opportunist’s goal born from a defender’s panic. Relentless.', effect: { form: 0.11, market: 3, attr: { stamina: 2, composure: 1 }, meters: { fans: 18, peers: 8 } } },
        ],
      },
    },
  },
  {
    id: 'sig-stepover-assist', title: 'The Stepover', icon: '🕺', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The winner is there to be made in the dying embers, but two {RIVAL} defenders have funnelled across to shut the door, standing him up on the touchline with a runner unmarked and howling in the middle. It is one against two, and his feet are already twitching.',
        choices: [
          { id: 'burst', label: 'Stepover both of them and square it', desc: 'Trademark shimmy, burst the gap, lay the winner on a plate', outcome: 'He rolls out his trademark stepover, sells the first defender a dummy so complete the man nearly falls over, bursts clean through the gap the second leaves, and rolls the simplest of squares for the winner into an unguarded net. Two men beaten with a flick of the hips and the game won — the assist of an artist at the death.', effect: { form: 0.13, market: 5, attr: { flair: 3 }, meters: { fans: 22, peers: 12 } } },
          { id: 'clip', label: 'Disguise a clip over the top instead', desc: 'Freeze them with the shimmy, then chip the pass early', outcome: 'He feints the stepover just enough to root both defenders, then clips a disguised ball over the top before they recover, dropping it perfectly for the runner to steer home the winner. No mazy burst, just a moment of guile that unpicks two men with a single deft touch. The cleverest pass on the pitch.', effect: { form: 0.11, attr: { creativity: 2, teamwork: 1 }, meters: { peers: 14, fans: 10 } } },
        ],
      },
    },
  },
  {
    id: 'sig-rain-solo', title: 'The Deluge', icon: '🌧️', category: 'signature',
    minTurn: 34, maxTurn: 123, weight: 1, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The rain is coming down in biblical sheets and the pitch is a lake, the ball sticking and skidding in the puddles, every touch a lottery. He picks it up near halfway in the storm with the {RIVAL} defence wading toward him, and decides the water is his friend.',
        choices: [
          { id: 'slalom', label: 'Slalom through the storm', desc: 'Ride the puddles, dance through the flood, defy the elements', outcome: 'He glides across the surface water where everyone else is bogged down, slaloming past four floundering, aquaplaning defenders before sliding it home through the spray. A solo goal conjured out of a monsoon that the highlight cameras can barely make out — genius that treated a swamp like a dry training pitch. Unforgettable, and unrepeatable.', effect: { form: 0.14, market: 6, attr: { flair: 2, stamina: 2 }, meters: { fans: 24, sponsors: 6 } } },
          { id: 'skim', label: 'Use the water and skim a low finish', desc: 'Keep it simple, drive it hard and flat across the wet surface', outcome: 'He carries it a few strides then drills a low, skidding shot that the surface water only speeds up, the ball aquaplaning under the keeper’s despairing hands. Not the slalom the crowd wanted through the deluge, but a cannily judged finish that turned the flooded pitch into a weapon. Clever in the chaos.', effect: { form: 0.1, market: 3, attr: { composure: 1, stamina: 1 }, meters: { fans: 16 } } },
        ],
      },
    },
  },
];
