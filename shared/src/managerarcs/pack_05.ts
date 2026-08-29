// Manager-arc authoring pack 05. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack takes the small, awkward, unglamorous business of running a football club: the pegs, the fines
// jar, the bonus sheet, the lad who has stopped speaking to a coach. Dressing-room arcs gate on the SQUAD,
// crisis arcs on a table that has gone wrong (minPos 0.65+), triumph arcs on a season worth remembering
// (maxPos 0.4). Nothing here fires in the wrong weather.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_05: ManagerArc[] = [
  // ── DRESSING ROOM ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p05-keepers-union', title: 'The Goalkeepers', icon: '🧤', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three keepers, one shirt, and a goalkeeping coach who trains all of them exactly the same because that is what he has always done. The two who are not playing warm up together every morning and go home separately.',
        choices: [
          { id: 'rank', label: 'Tell them the order out loud', desc: 'One, two, three, in front of each other', outcome: 'The number one stands taller for a fortnight. The number three asks for a move within a week and is entirely within his rights to.', effect: { squadMorale: 3, playerMorale: { who: 'unhappiest', delta: -12 }, tag: 'mgr-named-the-order' } },
          { id: 'cups', label: 'Give the second one the cups', desc: 'Real games, in front of a real crowd', outcome: 'He keeps two clean sheets and a section of the ground starts singing for him. The number one does not enjoy that at all.', effect: { squadMorale: 5, playerMorale: { who: 'best', delta: -8 } } },
          { id: 'vague', label: 'Keep it open', desc: 'Nobody is guaranteed anything', outcome: 'All three train like men who might play on Saturday. All three are exhausted by March and none of them trusts a word he says.', effect: { squadMorale: -4, tag: 'mgr-keeps-them-guessing' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-silent-treatment', title: 'Not Speaking', icon: '🤐', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of the players has not addressed the fitness coach directly since October. He does the sessions. He does them perfectly. He looks somewhere over the man\'s left shoulder while being told what they are.',
        choices: [
          { id: 'mediate', label: 'Sit them both down', desc: 'In a room, with the door shut, until it is done', outcome: 'It takes ninety minutes and most of it is silence. What comes out at the end of it is smaller and older than either of them expected.', effect: { squadMorale: 6, playerMorale: { who: 'unhappiest', delta: 8 }, tag: 'mgr-fixed-it' } },
          { id: 'side', label: 'Back the coach', desc: 'Staff are staff and that is the end of it', outcome: 'The player says yes to everything for the rest of the season and means none of it. The coach never quite relaxes around him again.', effect: { playerMorale: { who: 'unhappiest', delta: -10 }, squadMorale: -3 } },
          { id: 'move-coach', label: 'Move the coach off that group', desc: 'Quietly, no announcement, new rota', outcome: 'Nobody mentions it. Two other players work out exactly what happened and file away what it is worth to fall out with somebody.', effect: { squadMorale: 4, prestige: -1, tag: 'mgr-moved-a-coach' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-armband-taken', title: 'Taking The Armband', icon: '©️', category: 'dressing-room',
    when: { minSeason: 3, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The captain has been the captain for six years and has been the best player in the room for two of them. Everyone has noticed. Nobody will say it, which means it has become the manager\'s to say.',
        choices: [
          { id: 'take', label: 'Take it off him', desc: 'Face to face, before the squad hears', outcome: 'He takes it better than expected, which is worse. He shakes hands, goes to his car, and sits in it in the car park for twenty minutes.', effect: { playerMorale: { who: 'oldest', delta: -16 }, squadMorale: -4, tag: 'mgr-stripped-a-captain' }, next: 'after' },
          { id: 'keep', label: 'Leave it where it is', desc: 'The badge is not about form', outcome: 'The room reads it as loyalty and one or two read it as weakness. He is not sure they are wrong.', effect: { playerMorale: { who: 'oldest', delta: 10 }, squadMorale: 2 }, next: 'after' },
          { id: 'share', label: 'Add a second name', desc: 'A vice-captain with real duties, no ceremony', outcome: 'It solves the football and solves none of the feeling. The old captain is polite about it in public every single week.', effect: { squadMorale: 4, playerMorale: { who: 'oldest', delta: -6 } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'He leads them out at the next home game anyway, because the mascot is seven and had been promised.',
        choices: [
          { id: 'let', label: 'Let it stand', desc: 'Say nothing, let the picture be taken', outcome: 'It is on the front of the programme a fortnight later. Somebody in the office had already sent it to print.', effect: { squadMorale: 5 } },
          { id: 'correct', label: 'Send the new man out first', desc: 'Clear, and unkind, and correct', outcome: 'The crowd notices within four seconds. There is a sound from the main stand that is not quite a boo.', effect: { squadMorale: -5, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-squad-number', title: 'The Number Nine', icon: '🔢', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two forwards want the same shirt. One of them has worn it for four years and scored eleven goals. The other has just arrived and has scored more than that already, in a worse side, in a worse league.',
        choices: [
          { id: 'incumbent', label: 'It stays where it is', desc: 'You take a number, you do not take somebody\'s', outcome: 'The new man wears something in the twenties and scores in it, twice, in the first month. He never mentions the shirt again and never forgets it.', effect: { playerMorale: { who: 'star', delta: -8 }, squadMorale: 4 } },
          { id: 'newcomer', label: 'Give it to the new man', desc: 'Numbers are for the side, not for service', outcome: 'The old nine finds out from the club shop window on his way in. That is the part he tells people about, years later.', effect: { playerMorale: { who: 'oldest', delta: -14 }, squadMorale: -5, tag: 'mgr-gave-the-nine-away' } },
          { id: 'neither', label: 'Nobody gets it this year', desc: 'Leave it empty and let them earn it', outcome: 'It sounds clever in the meeting. By November it is a running joke and the kitman has stopped asking about it.', effect: { squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-bonus-row', title: 'The Bonus Sheet', icon: '📄', category: 'dressing-room',
    when: { minSeason: 2, minTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The appearance bonuses were written for a squad of eighteen and the squad is twenty-four. Two of the lads have done the arithmetic, on paper, and brought the paper.',
        choices: [
          { id: 'pool', label: 'Pool it across the squad', desc: 'Everyone who trains, everyone who travels', outcome: 'The starters lose money and say the right things about it. One of them says the right things through his teeth.', effect: { squadMorale: 8, playerMorale: { who: 'best', delta: -8 }, coins: -60 } },
          { id: 'hold', label: 'The sheet is the sheet', desc: 'It was signed in July by everyone in the room', outcome: 'Nobody argues with that. Nobody forgets it either, and the fringe men stop asking him for anything at all.', effect: { squadMorale: -6, tag: 'mgr-by-the-letter' } },
          { id: 'find', label: 'Find the money himself', desc: 'Go upstairs and ask for a bigger pot', outcome: 'He gets about half of what he asked for and spends a favour he was saving for a transfer.', effect: { coins: -180, squadMorale: 6, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-christmas-party', title: 'The Christmas Do', icon: '🎄', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The senior men want a night out. There is a game on the 26th, a game on the 29th, and a photograph of somebody else\'s squad on the back page of every paper this morning.',
        choices: [
          { id: 'allow', label: 'Let them have it', desc: 'One night, in the town, no conditions', outcome: 'Nothing happens. Nothing at all. They come in on Monday looking rough and laughing at something he is not part of, and they win on Boxing Day.', effect: { squadMorale: 12, boardMood: -1, tag: 'mgr-let-them-out' } },
          { id: 'ban', label: 'Not this year', desc: 'Not with this fixture list and this table', outcome: 'They accept it. Nine of them go anyway, in a different town, and he hears about it in February from a steward.', effect: { squadMorale: -7, tag: 'mgr-cancelled-christmas' } },
          { id: 'come', label: 'Go with them', desc: 'Buy the first round and leave before ten', outcome: 'He stays until half eleven and hears three things about his own dressing room that he had no idea about. It costs him something to have been there.', effect: { squadMorale: 8, prestige: -1, tag: 'mgr-was-there' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-early-retirement', title: 'He Wants To Stop', icon: '🕰️', category: 'dressing-room',
    when: { minSeason: 3, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is thirty-one and there is nothing wrong with him that a scan would show. He says he is not enjoying the drive in. He says it like a man who has practised saying it.',
        choices: [
          { id: 'talk-round', label: 'Talk him out of it', desc: 'Eighteen months left on the deal and legs to match', outcome: 'He plays on. He is fine, and only fine, and every so often in a warm-up he stands still for a second longer than he needs to.', effect: { playerMorale: { who: 'oldest', delta: -6 }, squadMorale: 3 } },
          { id: 'let-go', label: 'Let him go', desc: 'Tear the deal up and shake his hand', outcome: 'The club is worse and the man is better. Two of the young lads watch the whole thing and learn that this place treats people properly.', effect: { squadMorale: 10, coins: -140, tag: 'mgr-let-him-stop' } },
          { id: 'coach', label: 'Offer him a job on the staff', desc: 'Boots off, tracksuit on, stay in the building', outcome: 'He is a better coach at thirty-two than he was a player at thirty. He is also in every dressing room the manager is in, which cuts both ways.', effect: { squadMorale: 6, coins: -70, prestige: 1, tag: 'mgr-kept-him-inside' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-wage-disparity', title: 'What He Earns', icon: '💷', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody in the office left a payroll printout on a desk in a room the players walk through. It was face up. It was there for perhaps four minutes.',
        choices: [
          { id: 'honest', label: 'Confirm the numbers', desc: 'Do not insult them by pretending', outcome: 'Two men who thought they were valued discover exactly how much. One of them plays the best football of his career out of spite.', effect: { squadMorale: -8, playerMorale: { who: 'unhappiest', delta: -14 }, tag: 'mgr-told-them-the-truth' } },
          { id: 'deny', label: 'Say it was a draft', desc: 'A projection, not a payroll', outcome: 'They half believe it, which is a worse outcome than either believing or not. It comes back up in every contract talk for three years.', effect: { squadMorale: -3, prestige: -1, tag: 'mgr-fudged-the-wages' } },
          { id: 'level', label: 'Go upstairs and level two of them up', desc: 'Fix the unfairness and pay for it', outcome: 'The wage bill goes up by an amount the finance director reads out slowly. Two players stop looking for the door.', effect: { coins: -300, squadMorale: 9, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-contract-leak', title: 'It Was In The Paper', icon: '📰', category: 'dressing-room',
    when: { minSeason: 2, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The terms of the new deal are on a website by lunchtime, accurate to the pound, including a clause that only four people had seen. One of the four is in the dressing room.',
        choices: [
          { id: 'hunt', label: 'Find out who', desc: 'Ask everyone, one at a time, and mean it', outcome: 'He finds out inside a week and it is nobody he suspected. The week itself does more damage than the leak did.', effect: { squadMorale: -9, tag: 'mgr-went-hunting' } },
          { id: 'shrug', label: 'Let it go', desc: 'It is out, and chasing it keeps it alive', outcome: 'By Thursday nobody mentions it. The one who did it decides he can do it again, and in April he does.', effect: { squadMorale: 2, tag: 'mgr-let-a-leak-go' } },
          { id: 'address', label: 'Read it out to the room himself', desc: 'Every figure, out loud, no hiding', outcome: 'It is a strange twelve minutes. It ends the whispering completely and starts three separate arguments about fairness.', effect: { squadMorale: -4, prestige: 1, playerMorale: { who: 'youngest', delta: -8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-wrong-position', title: 'Not Full-Back', icon: '↔️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He can do the job. He has done the job, eleven times, well. He came in this morning to say he is a midfielder, has always been a midfielder, and would like that written down somewhere.',
        choices: [
          { id: 'insist', label: 'He plays where he is picked', desc: 'That is the whole arrangement', outcome: 'He plays there and gives everything, and something goes out of him that does not come back. He is gone in June.', effect: { playerMorale: { who: 'unhappiest', delta: -12 }, squadMorale: -3, tag: 'mgr-played-him-there' } },
          { id: 'deal', label: 'Ten games, then a look', desc: 'A number and a date, in his hand', outcome: 'He does the ten. He is better than anything the club has in midfield by the eighth, and the manager has boxed himself in beautifully.', effect: { playerMorale: { who: 'unhappiest', delta: 8 }, tag: 'mgr-made-a-deal' } },
          { id: 'move-him', label: 'Move him now', desc: 'Central, this Saturday, sink or swim', outcome: 'He is quietly excellent and the full-back position becomes a problem for a whole calendar year.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, squadMorale: 3, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-training-fight', title: 'The Grass Is Wet', icon: '🥊', category: 'dressing-room',
    when: { minSeason: 2, temper: ['disciplinarian', 'players-manager', 'firefighter'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tackle, a word, and then two of them on the floor by the far post with a coach\'s whistle going and going. They are the two best players in the building and they play either side of each other.',
        choices: [
          { id: 'fine-both', label: 'Fine them both, publicly', desc: 'Two weeks\' wages, read out in the room', outcome: 'It is fair and it is understood and it settles nothing between them. They shake hands like men signing something.', effect: { coins: 90, squadMorale: -4, tag: 'mgr-fined-them' } },
          { id: 'ignore', label: 'Send them back out', desc: 'Finish the session, no conversation', outcome: 'They finish the session. By the end of it they are shouting at each other for the right reasons, which is roughly what he was hoping for.', effect: { squadMorale: 6, tag: 'mgr-let-it-burn' } },
          { id: 'separate', label: 'Split them up in the side', desc: 'One left, one right, never the same channel', outcome: 'The team is worse and the atmosphere is calmer. He tells himself those trade off evenly and does not believe it.', effect: { squadMorale: 3, playerMorale: { who: 'best', delta: -6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-family-moved', title: 'They Went Home', icon: '🏠', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His wife and the two boys went back up north at half term and have not come down since. He is in a rented flat near the ground with a mattress and a games console. He has been late twice.',
        choices: [
          { id: 'compassion', label: 'Let him train up there', desc: 'Two days a week away from the building', outcome: 'His sharpness dips for a month and his face comes back. Three other players quietly notice that this club will do that for a man.', effect: { squadMorale: 8, playerMorale: { who: 'star', delta: 12 }, tag: 'mgr-looks-after-them' } },
          { id: 'standards', label: 'Late is late', desc: 'The rule does not know about his marriage', outcome: 'He is never late again. He is also never anything else again, and plays out the season like a man doing a shift.', effect: { playerMorale: { who: 'star', delta: -12 }, squadMorale: -4 } },
          { id: 'sell', label: 'Find him a club up there', desc: 'Solve it properly, at a loss', outcome: 'The fee is poor and the phone call from his wife is the only thank-you the manager gets all season. It is enough.', effect: { coins: 180, squadMorale: 4, prestige: -1, tag: 'mgr-sent-him-home' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-loanee-returns', title: 'He Is Back', icon: '🔙', category: 'dressing-room',
    when: { minSeason: 3, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eighteen months away at three clubs, none of whom wanted to keep him. He is in the car park at half seven with a bag, and there is no peg with his name on it because somebody took the label off in September.',
        choices: [
          { id: 'welcome', label: 'Put him straight in with the first team', desc: 'A peg, a bib, and the same session as everyone', outcome: 'He is nowhere near it for six weeks and then, on a wet Tuesday, he is the best player on the pitch and nobody can explain why.', effect: { squadMorale: 4, playerMorale: { who: 'unhappiest', delta: 12 } } },
          { id: 'reserves', label: 'Train with the under-21s', desc: 'Earn the walk back across the car park', outcome: 'He does it without a word of complaint for four months. He signs for a rival in the summer and scores against them in October.', effect: { playerMorale: { who: 'unhappiest', delta: -12 }, coins: 60, tag: 'mgr-sent-him-down' } },
          { id: 'terminate', label: 'Pay up the contract', desc: 'Clean, expensive, over', outcome: 'The wage bill improves. So does the mood of two lads who were behind him and did not know it.', effect: { coins: -220, squadMorale: 3, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-two-languages', title: 'Two Tables', icon: '🗣️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'At lunch there are two tables and they have been the same two tables since August. Nobody has fallen out. It is just that one table is easier than the other for six of them.',
        choices: [
          { id: 'lessons', label: 'Put lessons on at the club', desc: 'Twice a week, paid for, in work time', outcome: 'Four of them take it seriously and one of them is doing team talks in his second language by spring. It costs money nobody had allocated.', effect: { coins: -110, squadMorale: 7, tag: 'mgr-paid-for-lessons' } },
          { id: 'seating', label: 'Change the seating', desc: 'Move the tables, move the pegs, no explanation', outcome: 'It is awkward for a fortnight and then it is simply how the room is. Somebody is annoyed about the pegs for the entire season.', effect: { squadMorale: 5, playerMorale: { who: 'oldest', delta: -5 } } },
          { id: 'leave', label: 'Leave them be', desc: 'Men eat with their mates, everywhere, always', outcome: 'It is fine, and stays fine, until a bad run in January when it stops being two tables and becomes two opinions.', effect: { squadMorale: 2, tag: 'mgr-left-the-tables' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-veteran-benched', title: 'On The Bench', icon: '🪑', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran', temper: ['disciplinarian', 'tactician', 'builder'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two hundred and eighty appearances and he is a substitute for the third week running. He does not sulk. He warms up early, alone, down by the corner flag where the crowd can see him.',
        choices: [
          { id: 'explain', label: 'Give him the reason', desc: 'The clips, the numbers, the whole thing', outcome: 'He watches all of it without a word and agrees with most of it. Agreeing with it does not help him sleep.', effect: { playerMorale: { who: 'oldest', delta: -6 }, squadMorale: 4, tag: 'mgr-showed-him-the-clips' } },
          { id: 'start', label: 'Start him on Saturday', desc: 'Against his old club, in front of his kids', outcome: 'He is off after sixty-five and the ground stands up for him. The side is worse for an hour and better for a month.', effect: { playerMorale: { who: 'oldest', delta: 16 }, squadMorale: 6, boardMood: -1 } },
          { id: 'role', label: 'Make him the man for the last ten', desc: 'A job, a real one, with his name on it', outcome: 'He takes to it like it was invented for him. Three times before Christmas he sees a game out on his own.', effect: { playerMorale: { who: 'oldest', delta: 8 }, squadMorale: 5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-first-mistake', title: 'His First Bad One', icon: '😖', category: 'dressing-room',
    when: { needs: 'wonderkid', minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Seventeen, forty-two minutes into his fourth start, and he tries a pass across his own box that a fifteen-year-old would not try. Two-nil. He does not look up for the rest of the half.',
        choices: [
          { id: 'hook', label: 'Take him off at half time', desc: 'Get him out of it before it eats him', outcome: 'He cries in the shower and thinks nobody heard. Somebody heard, and never says a word about it, ever.', effect: { playerMorale: { who: 'youngest', delta: -10 }, squadMorale: 2 }, next: 'monday' },
          { id: 'leave-on', label: 'Leave him out there', desc: 'Ninety minutes, whatever happens', outcome: 'He is dreadful for twenty minutes and then he is not. He wins a header in the eighty-eighth that nobody else in the ground remembers and he never forgets.', effect: { playerMorale: { who: 'youngest', delta: 8 }, squadMorale: -2 }, next: 'monday' },
        ],
      },
      monday: {
        id: 'monday',
        prompt: 'On Monday the clip is everywhere. Somebody has set it to music.',
        choices: [
          { id: 'shield', label: 'Take it in the press conference', desc: 'My decision, my instruction, my fault', outcome: 'It is not true and everyone knows it is not true, and that is precisely why it works.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: 8, prestige: -1 } },
          { id: 'own-it', label: 'Make him watch it with the group', desc: 'Once, in silence, then move on', outcome: 'It is horrible for ninety seconds. He is never again the boy who is frightened of the ball at his feet.', effect: { playerMorale: { who: 'youngest', delta: 4 }, squadMorale: 3, tag: 'mgr-hard-school' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-fines-jar', title: 'The Fines', icon: '🫙', category: 'dressing-room',
    when: { minSeason: 2, temper: ['disciplinarian', 'chancer'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The fines committee is three players and a biscuit tin. There is nine hundred pounds in it and an argument about where it goes that has been running since November.',
        choices: [
          { id: 'players', label: 'It is their money', desc: 'Stay out of it entirely', outcome: 'They spend it on a night out he is not invited to and a hamper for the kitman, which is the correct proportion.', effect: { squadMorale: 6 } },
          { id: 'charity', label: 'Suggest the hospice up the road', desc: 'A suggestion that is not really a suggestion', outcome: 'They agree, of course they agree, and a photograph is taken. Two of them think it was a cheap way to buy a headline.', effect: { squadMorale: -2, prestige: 2, tag: 'mgr-took-the-tin' } },
          { id: 'abolish', label: 'Bin the whole system', desc: 'Grown men, not schoolboys', outcome: 'Punctuality slips by about four minutes a week within a month. It turns out the tin was doing something after all.', effect: { squadMorale: 3, tag: 'mgr-binned-the-fines' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-stereo', title: 'Whose Music', icon: '🔊', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The speaker belongs to a twenty-year-old and so does the playlist, and a thirty-four-year-old has started getting changed in the physio room to avoid it. Neither of them will say why.',
        choices: [
          { id: 'rota', label: 'Put a rota up', desc: 'One man a week, name on the wall', outcome: 'It works and it is faintly ridiculous and the week the goalkeeper gets it is talked about for years.', effect: { squadMorale: 6 } },
          { id: 'off', label: 'No music before a game', desc: 'Silence from ninety minutes out', outcome: 'The room is very quiet on Saturdays now. Two of them say they prefer it. Nine of them do not say anything.', effect: { squadMorale: -4, tag: 'mgr-quiet-room' } },
          { id: 'nothing', label: 'Not his business', desc: 'Let them sort out their own room', outcome: 'They sort it out. The thirty-four-year-old keeps changing in the physio room until the day he leaves.', effect: { playerMorale: { who: 'oldest', delta: -5 }, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-kitman', title: 'Thirty-One Years', icon: '🧺', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kitman has been here longer than the stand. Three of the young lads have started doing an impression of him, and it is a very good impression, and he has seen it.',
        choices: [
          { id: 'come-down', label: 'Come down on it hard', desc: 'In front of everybody, no softening', outcome: 'It stops that hour. The three of them are careful around the manager for a fortnight and careful around the kitman for good.', effect: { squadMorale: -4, tag: 'mgr-protects-the-staff' } },
          { id: 'quiet', label: 'A word with the three of them', desc: 'One at a time, in the corridor', outcome: 'Two are mortified. One is not, and that tells the manager something he needed to know before the summer.', effect: { squadMorale: 2, playerMorale: { who: 'youngest', delta: -5 } } },
          { id: 'kitman-first', label: 'Ask the kitman what he wants done', desc: 'It is his dignity, not the manager\'s', outcome: 'He says leave it, they are only lads. Then he asks for a new tumble dryer, and gets one.', effect: { coins: -40, squadMorale: 5, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-the-car', title: 'The Car In The Wrong Space', icon: '🚗', category: 'dressing-room',
    when: { minSeason: 2, minTier: 1, maxTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new signing has parked in the space by the door. It is not marked. Everyone at the club knows whose it is, and has known for eleven years, and the man whose it is has said nothing at all.',
        choices: [
          { id: 'tell-him', label: 'Tell the new lad', desc: 'Quietly, on the way in', outcome: 'He moves it and is embarrassed and it is forgotten by lunch. He also learns more about the club in that thirty seconds than in the whole of his induction.', effect: { squadMorale: 4 } },
          { id: 'paint', label: 'Have the spaces painted', desc: 'Names, numbers, no ambiguity', outcome: 'It costs eight hundred pounds and settles an argument nobody was having. Two men are unhappy about where their name ended up.', effect: { coins: -80, squadMorale: -3, tag: 'mgr-painted-the-car-park' } },
          { id: 'stay-out', label: 'Stay out of it', desc: 'It is a car park', outcome: 'It resolves itself in a week, unpleasantly, in front of the laundry. He hears about it and wishes he had spent thirty seconds on it.', effect: { squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-senior-coaching', title: 'Two Voices', icon: '📣', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran', temper: ['tactician', 'disciplinarian'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'From the edge of his own box the centre-half is organising the press. He is organising it differently from the way it was drawn on the board on Thursday, and it is working better.',
        choices: [
          { id: 'stop', label: 'One voice', desc: 'Make it clear whose game plan it is', outcome: 'The shape is exactly as instructed for the next four games and the side concedes in all four.', effect: { squadMorale: -5, playerMorale: { who: 'oldest', delta: -10 }, tag: 'mgr-one-voice' } },
          { id: 'adopt', label: 'Redraw it his way', desc: 'On the board, on Thursday, with his name on it', outcome: 'The room sits up. It is the first time anyone in it has seen a manager change his mind in public and lose nothing by it.', effect: { squadMorale: 9, playerMorale: { who: 'oldest', delta: 12 }, prestige: 1 } },
          { id: 'both', label: 'Let him have the last twenty minutes', desc: 'Plan A on the board, his shout when it is not working', outcome: 'It is untidy and it is effective and no assistant in the building can explain the system to a journalist.', effect: { squadMorale: 5, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-agents-voice', title: 'Somebody Else\'s Words', icon: '🕴️', category: 'dressing-room',
    when: { minSeason: 3, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has come in to talk about his future and he is using phrases that are not his. Twice he glances down at his phone before starting a sentence.',
        choices: [
          { id: 'call-it', label: 'Name it', desc: 'Ask him what he actually thinks', outcome: 'He puts the phone in his pocket and the next ten minutes are the most honest conversation they have ever had. Nothing is solved. Something is understood.', effect: { playerMorale: { who: 'unhappiest', delta: 8 }, tag: 'mgr-cut-through' } },
          { id: 'answer', label: 'Answer the agent through him', desc: 'Give the reply the phone is waiting for', outcome: 'It is efficient. The player leaves feeling like a fax machine and does not forget the feeling.', effect: { playerMorale: { who: 'unhappiest', delta: -10 } } },
          { id: 'summon', label: 'Get the agent in the room', desc: 'All three, this afternoon, no phones', outcome: 'The agent is better prepared than either of them. The player says four words in ninety minutes and one of them is yes.', effect: { squadMorale: -3, coins: -120, tag: 'mgr-dealt-with-the-agent' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-fasting', title: 'Sunset', icon: '🌙', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three of them are fasting and there are four games in twelve days. The sports scientist has produced a document. The players have not asked for anything and have not been asked anything either.',
        choices: [
          { id: 'ask', label: 'Ask them what they need', desc: 'Before deciding anything at all', outcome: 'They want later sessions and a room to break the fast in. Both take a phone call to arrange and neither costs a thing.', effect: { squadMorale: 8, prestige: 1, tag: 'mgr-asked-first' } },
          { id: 'plan', label: 'Rest them through the run', desc: 'Protect them from themselves', outcome: 'Two are grateful. One is furious at being managed rather than consulted, and he is right to be.', effect: { squadMorale: 2, playerMorale: { who: 'star', delta: -8 } } },
          { id: 'same', label: 'Same programme as everyone', desc: 'No special arrangements, no fuss made', outcome: 'They get through it on will. One of them pulls a hamstring on the ninth day, which may or may not be connected.', effect: { squadMorale: -5, tag: 'mgr-no-arrangements' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-the-bench-faces', title: 'The Faces On The Bench', icon: '😐', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A camera held on the bench for eleven seconds during a goal celebration. Two of the seven are up. Five are sitting down, and one of the five is looking at the floor.',
        choices: [
          { id: 'show', label: 'Show them the clip', desc: 'All eleven seconds, no commentary', outcome: 'Nobody defends themselves. Nobody sits down for a goal again all season, which is not quite the same as fixing it.', effect: { squadMorale: -3, tag: 'mgr-showed-the-bench' } },
          { id: 'drop', label: 'Leave the one out of the squad', desc: 'A weekend at home to think about it', outcome: 'He comes back sharper and colder. Two of the others quietly agree with him and are more careful about their faces.', effect: { playerMorale: { who: 'unhappiest', delta: -12 }, squadMorale: -2 } },
          { id: 'understand', label: 'Say nothing about it publicly or privately', desc: 'They are men who wanted to play', outcome: 'It happens twice more. He never mentions it and the five of them know he has seen it, which does more work than a meeting would.', effect: { squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-new-father', title: 'Born On A Thursday', icon: '👶', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The baby came at four in the morning and the coach leaves at ten. He is in the car park in a suit with a bag, saying he wants to travel, saying it too quickly.',
        choices: [
          { id: 'send-home', label: 'Send him home', desc: 'Take the bag off him and point at his car', outcome: 'He argues for thirty seconds and then goes, and rings the manager at eleven that night to say thank you.', effect: { playerMorale: { who: 'star', delta: 14 }, squadMorale: 7, tag: 'mgr-sent-him-home-to-them' } },
          { id: 'travel', label: 'Let him travel', desc: 'He is a grown man who knows what he wants', outcome: 'He plays and he is nowhere near it and comes off after an hour. Nobody blames him. He blames himself for a long time.', effect: { playerMorale: { who: 'star', delta: -6 }, squadMorale: 2 } },
          { id: 'bench', label: 'Take him, do not play him', desc: 'On the bench, in the building, no minutes', outcome: 'A compromise that pleases nobody, which is what compromises are for. He is on the phone at half time in the toilets.', effect: { squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-roommates', title: 'Room Twelve', icon: '🛏️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The rooming list has put the same two men together since August because it is alphabetical. They have not exchanged a sentence in a hotel corridor in four months.',
        choices: [
          { id: 'change', label: 'Redo the list', desc: 'By hand, thinking about it properly', outcome: 'It takes him forty minutes and nobody ever knows he did it. The away form picks up and he will never be able to prove why.', effect: { squadMorale: 6, tag: 'mgr-redid-the-rooms' } },
          { id: 'singles', label: 'Everyone gets their own room', desc: 'Ask the board for the extra rooms', outcome: 'The players love it. The bill goes up by an amount that appears on a slide in a boardroom in May.', effect: { coins: -160, squadMorale: 8, boardMood: -2 } },
          { id: 'keep', label: 'Leave it', desc: 'They can be professional for one night a fortnight', outcome: 'They are professional. In March one of them asks for a transfer and mentions the hotel, which nobody upstairs believes is really about the hotel.', effect: { squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-night-out-video', title: 'Fourteen Seconds', icon: '📱', category: 'dressing-room',
    when: { minSeason: 2, temper: ['disciplinarian', 'players-manager', 'chancer'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fourteen seconds of phone footage, a bar, and one of his players doing nothing illegal and nothing clever either. It is on eleven thousand screens by breakfast.',
        choices: [
          { id: 'public-bollocking', label: 'Fine him and say so publicly', desc: 'Standards, out loud, on the record', outcome: 'The supporters are satisfied and the dressing room reads it as a manager choosing an audience over a player.', effect: { coins: 70, squadMorale: -7, prestige: 2, tag: 'mgr-went-public-on-a-player' } },
          { id: 'internal', label: 'Deal with it in the building', desc: 'Nothing said outside the walls', outcome: 'He is asked about it eleven times in a press conference and says the same nine words each time. The player would run through a wall for him.', effect: { squadMorale: 9, prestige: -2, tag: 'mgr-kept-it-in-house' } },
          { id: 'nothing', label: 'It is a pint in a bar', desc: 'Refuse to treat it as a story at all', outcome: 'It dies in two days. It also establishes that there is a line somewhere further out than anyone thought, and one lad goes looking for it.', effect: { squadMorale: 5, tag: 'mgr-moved-the-line' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-brother-in-reserves', title: 'His Brother', icon: '👬', category: 'dressing-room',
    when: { minSeason: 3, needs: 'wonderkid' }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best young player at the club has an older brother in the under-21s who is a decent footballer and no more than that. The coaches want to release him. The younger one has not asked for anything.',
        choices: [
          { id: 'release', label: 'Release him properly', desc: 'The same conversation any other lad gets', outcome: 'It is done cleanly and the younger brother trains the next morning with a face like a closed door. He is fine by April. Mostly.', effect: { playerMorale: { who: 'youngest', delta: -10 }, prestige: 1, tag: 'mgr-released-the-brother' } },
          { id: 'keep', label: 'Keep him another year', desc: 'A squad number and a wage nobody notices', outcome: 'The coaches say nothing and understand everything. It is a small compromise that sits in a drawer for three years.', effect: { coins: -90, playerMorale: { who: 'youngest', delta: 10 }, squadMorale: -3, tag: 'mgr-kept-the-brother' } },
          { id: 'job', label: 'Offer him something else at the club', desc: 'Analysis, coaching badges, the academy', outcome: 'He takes it and is unexpectedly good at it. In eleven years he is running the age groups and neither brother ever mentions how it started.', effect: { coins: -50, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the family that stayed in the building' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-who-leads-out', title: 'The Tunnel', icon: '🚶', category: 'dressing-room',
    when: { minSeason: 2, minTier: 1, maxTier: 4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A hundred appearances for one of them, a hundred and fifty for the other, and the club has always let the man on his hundredth lead them out. Both hit it on the same Saturday.',
        choices: [
          { id: 'both', label: 'Both of them, side by side', desc: 'Break the tradition to keep the point of it', outcome: 'It looks slightly daft on the photographs and both families frame one anyway.', effect: { squadMorale: 5 } },
          { id: 'senior', label: 'The older man', desc: 'Seniority, as it has always been', outcome: 'Correct and unarguable and the younger one is very quiet in the warm-up. He scores, and does not celebrate much.', effect: { playerMorale: { who: 'oldest', delta: 8 }, squadMorale: -2 } },
          { id: 'drop-it', label: 'Stop doing it altogether', desc: 'One less thing to argue about', outcome: 'Nobody complains and something small leaves the club that nobody can name until it has been gone three seasons.', effect: { squadMorale: -4, clubLegacy: { kind: 'tradition', label: 'the hundredth-game walk, abandoned' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-chores', title: 'Boots And Balls', icon: '🥾', category: 'dressing-room',
    when: { minSeason: 2, temper: ['disciplinarian', 'builder'] }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The young pros do the boots, the balls and the bibs, and have done since the ground was built. One set of parents has written a letter about it, and the letter is not stupid.',
        choices: [
          { id: 'keep-it', label: 'It stays', desc: 'Everyone who has come through here has done it', outcome: 'The letter is answered politely and the practice continues. Two of the lads are prouder of it than of anything else that year.', effect: { squadMorale: 3, tag: 'mgr-kept-the-chores' } },
          { id: 'end-it', label: 'End it', desc: 'Pay somebody to do the boots', outcome: 'It costs very little. Three senior pros mention it, unprompted, as evidence that the club has gone soft.', effect: { coins: -60, squadMorale: -3, playerMorale: { who: 'youngest', delta: 8 } } },
          { id: 'everyone', label: 'Everybody does it', desc: 'Seniors included, on a rota, no exceptions', outcome: 'The sight of a thirty-two-year-old international scrubbing studs on a Tuesday does more for the room than any meeting could.', effect: { squadMorale: 10, playerMorale: { who: 'oldest', delta: -4 }, clubLegacy: { kind: 'tradition', label: 'everyone does the boots' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-cliques-captain', title: 'The Room Within The Room', icon: '🚪', category: 'dressing-room',
    when: { minSeason: 3, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Five of them travel in together, sit together, eat together and warm up together. They are not a problem. They are also, unmistakably, a thing, and the other seventeen can see it.',
        choices: [
          { id: 'break', label: 'Break it up', desc: 'Different groups, different sessions, different buses', outcome: 'It disperses within a month and takes some of the best training-ground energy at the club with it.', effect: { squadMorale: -5, tag: 'mgr-broke-the-group' } },
          { id: 'use', label: 'Give them a job', desc: 'Make them responsible for the young ones', outcome: 'They take it seriously to a degree that surprises everybody. Two academy lads settle in a season faster than they should have.', effect: { squadMorale: 8, playerMorale: { who: 'youngest', delta: 10 } } },
          { id: 'watch-it', label: 'Watch and wait', desc: 'It is only a problem when it is a problem', outcome: 'It is not a problem until February, when the side loses four in a row and the five of them are still laughing on the bus.', effect: { squadMorale: 2, tag: 'mgr-let-the-group-be' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-diet-refusal', title: 'He Will Not Eat It', icon: '🍽️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A nutritionist arrived in July and the pre-match meal changed. One of the older ones has eaten a plate of pasta at the same hotel before every away game for nine years and has now started bringing his own.',
        choices: [
          { id: 'enforce', label: 'One menu', desc: 'The plan is the plan or there is no plan', outcome: 'He eats what he is given and scores in three of the next five, which proves nothing to anyone and everything to the nutritionist.', effect: { playerMorale: { who: 'oldest', delta: -8 }, squadMorale: -2, tag: 'mgr-backed-the-science' } },
          { id: 'exception', label: 'Let him have his pasta', desc: 'One man, one plate, no discussion', outcome: 'Within a fortnight there are four exceptions and the nutritionist is updating a spreadsheet that no longer means anything.', effect: { playerMorale: { who: 'oldest', delta: 10 }, squadMorale: 3, prestige: -1 } },
          { id: 'ask-him', label: 'Have the two of them design it together', desc: 'The oldest player and the newest member of staff', outcome: 'They come back with something sensible and slightly worse than both original plans, and everybody eats it without complaint.', effect: { squadMorale: 6, playerMorale: { who: 'oldest', delta: 5 } } },
        ],
      },
    },
  },

  // ── CRISIS ───────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p05-morning-after', title: 'The Morning After Six', icon: '🌫️', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six-nil. The coach got back at ten past one and nobody spoke on it. It is now half past nine on a Sunday and twenty-two men are sitting in a room waiting to be told what happens now.',
        choices: [
          { id: 'run', label: 'Put them through it', desc: 'Boots on, out in the rain, no ball', outcome: 'They run and they hate it and something in the room hardens. Two of them are still throwing up at eleven.', effect: { squadMorale: -6, tag: 'mgr-ran-them' }, next: 'week' },
          { id: 'talk', label: 'Twenty minutes and send them home', desc: 'Say the honest thing and give them the day', outcome: 'He says four sentences. The last one is about himself. They go home and it is the best decision he makes all year.', effect: { squadMorale: 8, prestige: -1 }, next: 'week' },
          { id: 'clips', label: 'Sit them in front of all of it', desc: 'Ninety minutes, every goal, twice', outcome: 'It is unbearable by the fourth. By the sixth they are not watching football any more, they are watching themselves being poor, and it is useful.', effect: { squadMorale: -3, tag: 'mgr-made-them-watch' }, next: 'week' },
        ],
      },
      week: {
        id: 'week',
        prompt: 'Thursday. The chairman has been in the building twice and did not come to the office either time.',
        choices: [
          { id: 'seek', label: 'Go up and find him', desc: 'Better to have the conversation than wait for it', outcome: 'It is a short and civil meeting in which nothing is promised. He leaves knowing exactly where he stands, which is more than he knew at breakfast.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'work', label: 'Stay on the grass', desc: 'The answer is on Saturday, not upstairs', outcome: 'He does not go up. On Saturday they win one-nil and the chairman comes down to the dressing room for the first time in a year.', effect: { boardMood: 2, squadMorale: 6, tag: 'mgr-answered-on-the-pitch' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-midweek-replay', title: 'A Replay Nobody Wanted', icon: '🔁', category: 'crisis',
    when: { minPos: 0.68, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A goalless draw at a ground with one covered side, and now a Tuesday night four hundred miles from a league game the club actually needs to win. The chief executive has already worked out what the gate is worth.',
        choices: [
          { id: 'kids', label: 'Send the young ones', desc: 'Half a squad and a coach driver', outcome: 'They lose two-one to a side of part-timers and it is the back page. The first team is fresh on Saturday and wins.', effect: { squadMorale: 3, prestige: -3, boardMood: -1, tag: 'mgr-threw-a-cup-tie' } },
          { id: 'full', label: 'Full strength', desc: 'Respect the competition, take the tiredness', outcome: 'They win it in extra time at half eleven and three of them are dead on their feet by the sixtieth minute on Saturday.', effect: { squadMorale: -4, coins: 120, prestige: 1 } },
          { id: 'mix', label: 'Split it down the middle', desc: 'Six seniors, five kids, and hope', outcome: 'The mix does not knit and they are out on penalties. He gets neither the rest nor the round.', effect: { squadMorale: -6, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-gates', title: 'At The Gates', icon: '🚧', category: 'crisis',
    when: { minPos: 0.78, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Thirty or so of them at the training ground entrance at eight in the morning. No violence in it, no chanting, just men standing in the cold with a printed sign and a genuine grievance.',
        choices: [
          { id: 'go-out', label: 'Walk out and talk to them', desc: 'No security, no camera, twenty minutes', outcome: 'They are reasonable and furious and one of them has been coming since 1974. He does not change their minds and they do not change his and both sides leave better.', effect: { prestige: 2, squadMorale: 4, tag: 'mgr-faced-them' } },
          { id: 'drive', label: 'Drive past', desc: 'Do not dignify it, do not inflame it', outcome: 'It is a photograph of the back of his car and it runs for two days. The players see the photograph too.', effect: { squadMorale: -5, prestige: -2 } },
          { id: 'players', label: 'Send two players out', desc: 'Let the men who play do the talking', outcome: 'It works, more or less, and the two of them carry something home that evening that was not theirs to carry.', effect: { playerMorale: { who: 'oldest', delta: -8 }, squadMorale: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-the-banner', title: 'The Banner', icon: '🏴', category: 'crisis',
    when: { minPos: 0.75, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It goes up in the corner at the away end on twenty-eight minutes. Four words, his name, and a bedsheet that somebody has spent a considerable amount of time on.',
        choices: [
          { id: 'applaud', label: 'Applaud that corner at full time', desc: 'Go over, clap, take it', outcome: 'Half of them clap back. It is the strangest thirty seconds of his career and it buys him a month.', effect: { prestige: 2, boardMood: 1, tag: 'mgr-took-the-applause' } },
          { id: 'straight-in', label: 'Straight down the tunnel', desc: 'Nothing to gain out there', outcome: 'Nobody blames him. The clip of him walking, head down, past that corner exists forever.', effect: { prestige: -2, squadMorale: -2 } },
          { id: 'press', label: 'Address it at the press conference', desc: 'Say they are entitled to it and mean it', outcome: 'It is a decent, honest answer and it is quoted properly. It does not win a single point.', effect: { prestige: 1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-the-bug', title: 'Something Going Round', icon: '🤒', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It started with the goalkeeping coach on Monday. By Thursday nine of them have had it and four still have it and the physio has stopped using the word mild.',
        choices: [
          { id: 'postpone', label: 'Apply to call the game off', desc: 'Paperwork, a doctor\'s letter, the lot', outcome: 'It is refused. The application is on a website within an hour and reads exactly like an excuse being prepared in advance.', effect: { prestige: -2, boardMood: -1, tag: 'mgr-asked-for-a-postponement' } },
          { id: 'play-them', label: 'Play whoever can stand up', desc: 'Eleven bodies and five kids on the bench', outcome: 'They are heroic for an hour and then legs go all over the pitch at once. Two-nil down in six minutes.', effect: { squadMorale: 4, prestige: 1 } },
          { id: 'shut', label: 'Close the training ground for three days', desc: 'Nobody in, everything wiped down', outcome: 'It stops the spread and costs them the whole week\'s work. They are underprepared and healthy, which is a choice he made.', effect: { squadMorale: -3, coins: -60 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-no-centre-halves', title: 'No Centre-Halves', icon: '🩼', category: 'crisis',
    when: { minPos: 0.68, needs: 'thin-squad', minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One in a cast, one suspended, one who felt his calf in the warm-up on Tuesday and has not trained since. There is a seventeen-year-old and a midfielder who used to do it at school.',
        choices: [
          { id: 'kid', label: 'Play the seventeen-year-old', desc: 'Throw him in and put an old head next to him', outcome: 'He is superb for seventy minutes and then loses his man for the winner. He is a better player for it in about eighteen months.', effect: { playerMorale: { who: 'youngest', delta: 8 }, squadMorale: 2 } },
          { id: 'midfielder', label: 'Move the midfielder back', desc: 'A man who can play, in a position he cannot', outcome: 'The distribution is lovely and he is beaten in the air five times. Everyone in the ground can see the problem including him.', effect: { squadMorale: -3 } },
          { id: 'emergency', label: 'Sign an emergency loan', desc: 'Whoever is available today, at whatever cost', outcome: 'He arrives at two, meets his defence at half two, and is competent. The fee is the sort of number that shows up in an end-of-season review.', effect: { coins: -200, squadMorale: 3, boardMood: -1, tag: 'mgr-emergency-loan' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-frozen-pitch', title: 'A Ten O\'Clock Inspection', icon: '❄️', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The referee gets down on one knee and pushes a thumb into the goalmouth. Nine hundred away supporters are already on the motorway. The forecast for four o\'clock is worse.',
        choices: [
          { id: 'push', label: 'Push for it to go ahead', desc: 'The side is in form and the away end is coming', outcome: 'It goes ahead on a surface like a car park and is decided by a bobble. Somebody twists an ankle in the second half.', effect: { squadMorale: -4, coins: 100, tag: 'mgr-pushed-for-it' } },
          { id: 'off', label: 'Argue for it to be called', desc: 'Nobody should play on that', outcome: 'It is called at ten past ten and the club refunds nine hundred travelling supporters. He is booed on the concourse by four of them.', effect: { coins: -120, boardMood: -1, squadMorale: 2 } },
          { id: 'silent', label: 'Say nothing either way', desc: 'It is the referee\'s call, not his', outcome: 'The referee, who wanted somebody to share it with, calls it off alone and the club is entirely blameless and entirely useless.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-coach-defects', title: 'He Is Going To Them', icon: '🚪', category: 'crisis',
    when: { minPos: 0.7, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The first-team coach has been offered a job by a club in the same division, seven points above them, and has come in to say so before he says yes. He knows every set piece the club has.',
        choices: [
          { id: 'let-go', label: 'Let him go today', desc: 'Handshake, thank you, keys on the desk', outcome: 'He is gone by lunchtime. Every routine has to be redrawn in ten days and one of them still catches the club out in March.', effect: { squadMorale: -4, tag: 'mgr-lost-a-coach' } },
          { id: 'block', label: 'Hold him to his contract', desc: 'He signed until June and June is June', outcome: 'He stays. He is professional and absent in a way that only the players can detect, and they detect it in a fortnight.', effect: { squadMorale: -7, boardMood: 1 } },
          { id: 'promote', label: 'Promote from within and wish him well', desc: 'The under-21s man moves up that afternoon', outcome: 'The new man is raw and desperate to be right, and works until nine at night. Something in the building lifts slightly.', effect: { squadMorale: 5, coins: -40, tag: 'mgr-promoted-inside' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-physio-room', title: 'A Full Treatment Room', icon: '🧊', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eleven names on the whiteboard and two beds. The head physio has asked for a meeting about workload and has been asking since September, in writing, twice.',
        choices: [
          { id: 'invest', label: 'Fund the department', desc: 'A second physio and a rehab bay', outcome: 'The numbers improve inside four months. Nobody upstairs ever accepts that the money caused it, because nothing visible happened.', effect: { coins: -260, squadMorale: 6, boardMood: -2, tag: 'mgr-backed-the-medical-room' } },
          { id: 'load', label: 'Cut the training load instead', desc: 'Free, immediate, and it costs sharpness', outcome: 'Fewer injuries and a side that runs out of legs on seventy minutes for two months.', effect: { squadMorale: 2 } },
          { id: 'push-on', label: 'Push through to the international break', desc: 'Five more games, then reassess', outcome: 'Two of the eleven break down again properly in that window. One of them does not play again that season.', effect: { squadMorale: -8, tag: 'mgr-pushed-them-through' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-keeper-errors', title: 'Three Weeks Of It', icon: '🥅', category: 'crisis',
    when: { minPos: 0.68, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three games, three goals that were his. The last one was a routine cross in the ninety-first minute and he did not come for it because he was thinking about the other two.',
        choices: [
          { id: 'drop-keeper', label: 'Drop him', desc: 'Get him out of the firing line', outcome: 'He is relieved for about four days and then he is a goalkeeper without a shirt, which is a different and worse problem.', effect: { playerMorale: { who: 'best', delta: -14 }, squadMorale: -2, tag: 'mgr-dropped-the-keeper' } },
          { id: 'stick', label: 'Play him and say so publicly', desc: 'Name him in the press conference as the number one', outcome: 'He makes a save in the next game that keeps the club in the division. The manager never once mentions the connection.', effect: { playerMorale: { who: 'best', delta: 16 }, squadMorale: 6, boardMood: -1 } },
          { id: 'work', label: 'An hour with him every morning', desc: 'Crosses, and crosses, and crosses', outcome: 'By the fourth week the technique is fine and the flinch is still there. Technique was never the problem.', effect: { squadMorale: 2, coins: -30 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-betting', title: 'The Letter From The Authorities', icon: '📩', category: 'crisis',
    when: { minPos: 0.65, minSeason: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A letter arrives about one of his players and a betting account. It is very carefully worded and does not accuse anyone of anything. The word "cooperation" appears twice.',
        choices: [
          { id: 'full-help', label: 'Cooperate completely', desc: 'Everything they ask for, immediately', outcome: 'It is the right thing and it takes four months and the player is charged with something minor. The club comes out of it clean and tired.', effect: { prestige: 2, squadMorale: -4, tag: 'mgr-cooperated' } },
          { id: 'lawyer', label: 'Put a solicitor between everyone', desc: 'Slow it down and protect the player', outcome: 'It takes eleven months instead of four. The player is grateful. The investigators remember the club\'s name.', effect: { coins: -180, squadMorale: 4, prestige: -2 } },
          { id: 'drop-him', label: 'Leave him out until it is resolved', desc: 'Nothing to do with guilt, everything to do with the side', outcome: 'He is cleared in the spring and never plays for the club again, because by then there is nothing left between them.', effect: { playerMorale: { who: 'unhappiest', delta: -18 }, squadMorale: -6, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-wages-late', title: 'The Twenty-Eighth', icon: '🏦', category: 'crisis',
    when: { minPos: 0.7, maxCoins: 250, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Wages did not go in on the twenty-eighth. By ten past nine on the twenty-ninth, six players have asked him about it and he does not know any more than they do.',
        choices: [
          { id: 'tell-them', label: 'Tell them exactly what he knows', desc: 'Which is very little, said honestly', outcome: 'It is a bad hour and it is the last bad hour. They believe him for the rest of the season because he did not pretend.', effect: { squadMorale: 6, boardMood: -2, prestige: 1, tag: 'mgr-told-them-about-the-wages' } },
          { id: 'reassure', label: 'Tell them it is a banking error', desc: 'Buy a day and go upstairs', outcome: 'It goes in on the second. It is late again in March and this time nobody believes a word of the explanation.', effect: { squadMorale: 2, tag: 'mgr-covered-for-the-board' } },
          { id: 'threaten', label: 'Go up and threaten to walk', desc: 'Pay them or find somebody else', outcome: 'They are paid on the thirtieth. The relationship with the boardroom never recovers to what it was on the twenty-seventh.', effect: { squadMorale: 9, boardMood: -3, tag: 'mgr-threatened-to-walk' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-fans-forum', title: 'The Forum', icon: '🎤', category: 'crisis',
    when: { minPos: 0.75, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three hundred seats in the function room and a microphone being carried round on a stick. It was booked in August, when this looked like a good idea.',
        choices: [
          { id: 'go', label: 'Do the full two hours', desc: 'Every question, no time limit', outcome: 'The eleventh question is from a man who has lost interest in being polite. The answer to it is the most honest thing said at the club all year.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-did-the-forum' } },
          { id: 'short', label: 'Twenty minutes and a fixture clash', desc: 'Be seen, be brief, be gone', outcome: 'It is worse than not going. Everybody in the room knows exactly what it was and says so in the car park.', effect: { prestige: -2, boardMood: 1 } },
          { id: 'pull', label: 'Pull out', desc: 'The timing is wrong and the timing is wrong', outcome: 'The chief executive does it alone and is asked eleven questions about a manager who is not there.', effect: { prestige: -3, boardMood: -2, tag: 'mgr-swerved-the-forum' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-teamsheet-leak', title: 'They Knew The Side', icon: '📋', category: 'crisis',
    when: { minPos: 0.68, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The eleven was on a supporters\' forum at twenty past one, correct, including the change of shape. It had been read out at twelve fifty in a hotel room with a shut door.',
        choices: [
          { id: 'late', label: 'Name the side an hour before kickoff from now on', desc: 'Nobody knows anything until they have to', outcome: 'The leaks stop. So does the preparation, and two players say they play worse for it, and they are probably right.', effect: { squadMorale: -5, tag: 'mgr-names-it-late' } },
          { id: 'trap', label: 'Read out a false eleven and see', desc: 'One name changed, deliberately', outcome: 'It appears on the forum within nine minutes and he knows the room it came from. He never tells anyone how he found out.', effect: { squadMorale: -3, prestige: 1, tag: 'mgr-set-a-trap' } },
          { id: 'shrug-it', label: 'Let them have it', desc: 'The side is the side, knowing it does not stop it', outcome: 'It is a good line and it is even true. It also tells whoever is doing it that there is no cost to doing it.', effect: { squadMorale: 2, tag: 'mgr-ignored-the-leak' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-cup-humiliation', title: 'Out To A Smaller Club', icon: '🪤', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two divisions below and a pitch with a slope, and the winner came off a shin in the eighty-fourth minute. Their manager works four days a week at a builders\' merchant and was magnificent about it afterwards.',
        choices: [
          { id: 'credit', label: 'Give them all the credit', desc: 'Every word about the other side', outcome: 'It is gracious and it is remembered kindly and it does not make his own supporters any less sick.', effect: { prestige: 2, boardMood: -1 } },
          { id: 'players', label: 'Take it out on the players publicly', desc: 'Say the honest thing about the effort', outcome: 'It gets him the back page and one week of sympathy. Four of the eleven never fully forgive being named.', effect: { squadMorale: -10, prestige: 1, tag: 'mgr-named-them' } },
          { id: 'own', label: 'Take the whole thing himself', desc: 'Team, shape, substitutions, all of it', outcome: 'The dressing room does not deserve it and knows it does not deserve it, which is exactly why they run for him in the next four games.', effect: { squadMorale: 10, boardMood: -2, prestige: -1, tag: 'mgr-carried-it' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-assistant-briefing', title: 'Somebody Is Talking', icon: '🗞️', category: 'crisis',
    when: { minPos: 0.75, minSeason: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A column appears with three details in it that only four people in the building know. The phrasing of one of them is a phrase his assistant uses. It might mean nothing.',
        choices: [
          { id: 'confront', label: 'Ask him directly', desc: 'One question, in the office, door open', outcome: 'He denies it flatly and is offended, and might be telling the truth. Nothing between them is the same afterwards either way.', effect: { squadMorale: -3, tag: 'mgr-asked-his-assistant' } },
          { id: 'starve', label: 'Stop telling him things', desc: 'Keep him, shrink his world', outcome: 'The columns dry up, which proves it, and he now has an assistant who knows he is being managed.', effect: { squadMorale: -5, prestige: 1 } },
          { id: 'sack', label: 'Move him out', desc: 'No evidence, no accusation, no job', outcome: 'It is done quietly and unfairly and possibly correctly. The staff room is careful for months.', effect: { coins: -150, squadMorale: -6, boardMood: -1, tag: 'mgr-moved-his-assistant' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-late-arrival', title: 'Forty Minutes To Kickoff', icon: '🚌', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A lorry across three lanes and a coach that has not moved in an hour and ten. They pull in at ten to three with the away end already singing and no warm-up worth the name.',
        choices: [
          { id: 'delay', label: 'Ask for a delayed kickoff', desc: 'Fifteen minutes, and be seen asking', outcome: 'They get it. The home side is furious and plays furious for twenty minutes, and it very nearly works out badly.', effect: { prestige: -1, squadMorale: 3 } },
          { id: 'straight-out', label: 'Straight out, no team talk', desc: 'Boots on, go, we know the plan', outcome: 'They are two down inside eleven minutes and then play the best forty-five of their season. It finishes two-two.', effect: { squadMorale: 6, tag: 'mgr-no-team-talk' } },
          { id: 'blame-later', label: 'Say nothing about it afterwards', desc: 'Refuse the excuse entirely', outcome: 'Every journalist in the room offers it to him and he declines it four times. The players hear the tape on the bus home.', effect: { squadMorale: 8, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-points-deduction', title: 'Minus Nine', icon: '➖', category: 'crisis',
    when: { minPos: 0.75, minSeason: 3, maxCoins: 300 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It was decided in a room in another city by people who have never been to the ground. Nine points, effective immediately, and a table that now has the club at the bottom of it by a distance.',
        choices: [
          { id: 'rally', label: 'Make it the whole season', desc: 'Nine points, one target, nothing else discussed', outcome: 'It gives them something clean to be angry about. They take twenty-two points from twelve games and it is still not enough.', effect: { squadMorale: 12, prestige: 2, tag: 'mgr-fought-the-deduction' } },
          { id: 'quiet-work', label: 'Never mention the number', desc: 'Play the games, ignore the arithmetic', outcome: 'The players mention it constantly. Pretending it is not there makes it larger, and by February it is all anyone talks about.', effect: { squadMorale: -6 } },
          { id: 'protect', label: 'Protect the young ones from it', desc: 'Seniors carry it, kids play', outcome: 'Three teenagers have the season of their lives in a side going down. Two of them are sold in June for money the club badly needs.', effect: { playerMorale: { who: 'youngest', delta: 12 }, coins: 300, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-down-already', title: 'Mathematically', icon: '⬇️', category: 'crisis',
    when: { minPos: 0.9, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It was confirmed at twenty to five on a Saturday by a result at a ground three hundred miles away. There are four games left and none of them matter and all of them have to be played.',
        choices: [
          { id: 'blood', label: 'Play the kids in all four', desc: 'Find out what is there for next year', outcome: 'Two of them are ready and one of them is not and the fourth game is a shambles. He knows more in May than he did in April.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -3, tag: 'mgr-blooded-them' } },
          { id: 'pride', label: 'Strongest side, every week', desc: 'They will not go down without standards', outcome: 'They win two of the four and go down with something intact. Nobody outside the club notices and everyone inside it does.', effect: { squadMorale: 8, prestige: 1, clubLegacy: { kind: 'reputation', label: 'went down with the shirt intact' } } },
          { id: 'rest', label: 'Rest everyone who is carrying something', desc: 'Get them to July in one piece', outcome: 'The last home game is played by a side the crowd half recognises. Some of them boo, and they are within their rights.', effect: { squadMorale: 3, boardMood: -1, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-successor-spotted', title: 'A Man In The Directors\' Box', icon: '👀', category: 'crisis',
    when: { minPos: 0.8, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody photographs a man in the directors\' box at half time. He has been out of work since November and is very good, and there is no innocent reason for him to be there.',
        choices: [
          { id: 'ask', label: 'Ask the chairman outright', desc: 'On the Monday, before training', outcome: 'He is told it was a friend of a director and that is all it was. It might even be true. He does not believe it and cannot say so.', effect: { boardMood: -1, tag: 'mgr-asked-about-the-man' } },
          { id: 'ignore-it', label: 'Say nothing to anybody', desc: 'Work as if it did not happen', outcome: 'It hangs over the building for a fortnight. Two players ask him about it and he lies to them well.', effect: { squadMorale: -4, prestige: -1 } },
          { id: 'tell-squad', label: 'Tell the squad first', desc: 'Get in front of it in his own room', outcome: 'They close ranks in a way that surprises him. They win the next two and it is entirely because of that Monday morning.', effect: { squadMorale: 12, boardMood: -2, tag: 'mgr-told-the-room' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-refused-sub', title: 'He Would Not Go On', icon: '🚫', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Seventy-one minutes, two down, and the board goes up. He takes his tracksuit top off and then puts it back on and sits down. The fourth official is looking at the bench.',
        choices: [
          { id: 'terminate', label: 'He never plays again', desc: 'Announce it that evening', outcome: 'It is decisive and it costs the club a saleable asset and every other player understands the rules perfectly from that day.', effect: { playerMorale: { who: 'unhappiest', delta: -20 }, squadMorale: 4, coins: -160, tag: 'mgr-finished-him' } },
          { id: 'private', label: 'Deal with it Monday, in private', desc: 'Nothing said in the press, nothing said on the coach', outcome: 'On Monday he apologises to the group without being asked. It is handled, and two senior men think it was handled too gently.', effect: { squadMorale: 3, playerMorale: { who: 'unhappiest', delta: 6 } } },
          { id: 'sell', label: 'Sell him in the window', desc: 'No statement, no drama, a fee', outcome: 'The money is decent and the story follows him. The dressing room reads the whole thing as business, which is what it was.', effect: { coins: 280, squadMorale: -2, tag: 'mgr-sold-the-problem' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-boot-camp', title: 'Four Days Away', icon: '🏕️', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2, temper: ['disciplinarian', 'firefighter', 'chancer'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody upstairs has suggested a warm-weather camp. Somebody in the dressing room has suggested four days in a barracks-style place in the hills. Both suggestions are serious.',
        choices: [
          { id: 'sun', label: 'Take them somewhere warm', desc: 'Good pitches, good food, a pool', outcome: 'They train well and there is a photograph of two of them by the pool that runs in a paper under a headline about priorities.', effect: { coins: -240, squadMorale: 8, prestige: -2, tag: 'mgr-took-them-away' } },
          { id: 'hills', label: 'Take them somewhere hard', desc: 'Cold, early, no phones', outcome: 'Three of them hate every hour of it and all twenty-two are different on the coach home. It works or it looks ridiculous by April.', effect: { coins: -80, squadMorale: 4, tag: 'mgr-took-them-to-the-hills' } },
          { id: 'stay', label: 'Nobody goes anywhere', desc: 'The problem is on the training pitch, so stay on it', outcome: 'Sensible, cheap, and completely without any of the thing a squad in trouble is actually short of.', effect: { boardMood: 1, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-phone-in', title: 'A Caller On The Radio', icon: '📻', category: 'crisis',
    when: { minPos: 0.75, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A caller on the local station on Sunday lunchtime says a thing about the manager\'s family. The presenter cuts him off four words late and apologises twice.',
        choices: [
          { id: 'letter', label: 'A letter from the club', desc: 'Formal, brief, to the station', outcome: 'They apologise properly on air the following week. It is dealt with, and it is a whole week of it being mentioned.', effect: { prestige: 1, tag: 'mgr-complained' } },
          { id: 'nothing-said', label: 'Never mention it', desc: 'Not to the press, not to the family, not to anyone', outcome: 'His wife heard it in the car. He finds that out in June.', effect: { prestige: -1, squadMorale: 0 } },
          { id: 'on-air', label: 'Ring the station himself', desc: 'Live, on Thursday, and answer everything', outcome: 'He is on for thirty-five minutes and is good. Two callers change their minds and eleven thousand people did not hear it.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-went-on-air' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-derby-own-goal', title: 'Into His Own Net', icon: '😵', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A back pass, a bounce, and the only goal of the local derby into his own net in front of the away end. He is twenty-two and from the town and his uncle sits in the family stand.',
        choices: [
          { id: 'start-him', label: 'Start him next week', desc: 'Same shirt, same position, no conversation', outcome: 'He plays like a man carrying furniture for half an hour and then he heads one in at the other end. The stand loses its mind.', effect: { playerMorale: { who: 'youngest', delta: 16 }, squadMorale: 8 } },
          { id: 'protect-him', label: 'Leave him out for a fortnight', desc: 'Let the noise die down first', outcome: 'The noise does not die down, it just has nothing to look at. He comes back in March a more careful and less good player.', effect: { playerMorale: { who: 'youngest', delta: -12 }, squadMorale: -3, tag: 'mgr-hid-him' } },
          { id: 'squad-shield', label: 'Make the whole squad answer for it', desc: 'Nobody loses a derby on one deflection', outcome: 'He points at the eighty-nine other minutes and lists them. It is the correct analysis and half the ground does not want analysis.', effect: { squadMorale: 6, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-bereavement', title: 'The Turnstile Man', icon: '🕯️', category: 'crisis',
    when: { minPos: 0.65, minSeason: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He did turnstile four for thirty-eight years and died on the Wednesday. There is a question about the minute\'s applause and a longer question about whether the players knew who he was.',
        choices: [
          { id: 'applause', label: 'A minute\'s applause and a black armband', desc: 'Do it properly, do it publicly', outcome: 'The ground does it beautifully. His daughter writes to the club and the letter is pinned in the corridor for eleven years.', effect: { prestige: 1, squadMorale: 4, clubLegacy: { kind: 'tradition', label: 'the letter in the corridor' } } },
          { id: 'squad-first', label: 'Tell the players who he was first', desc: 'Ten minutes on Friday, names and years', outcome: 'They stand for it and they mean it, which is the difference between a gesture and a minute. Two of them go to the funeral.', effect: { squadMorale: 8, prestige: 1 } },
          { id: 'family', label: 'Ask the family what they want', desc: 'Before the club decides anything', outcome: 'They want nothing at all except a seat kept empty for a game. The club does that and says nothing about it to anybody.', effect: { squadMorale: 5, clubLegacy: { kind: 'tradition', label: 'the empty seat at turnstile four' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-one-man-targeted', title: 'They Have Picked One', icon: '🎯', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The crowd has decided which of them is to blame. He is groaned at for a misplaced ten-yard pass in the fourth minute, and by the twentieth he has stopped asking for the ball.',
        choices: [
          { id: 'hook-early', label: 'Take him off at half time', desc: 'Get him out of it', outcome: 'The reception as he walks off is the worst thing that has happened at the ground this season. He does not play at home again for two months.', effect: { playerMorale: { who: 'unhappiest', delta: -16 }, squadMorale: -4 } },
          { id: 'leave-him', label: 'Leave him on for ninety', desc: 'He gets through it or he does not', outcome: 'He gets through it. On seventy-eight he wins a header and about four hundred people applaud, which is four hundred more than at kickoff.', effect: { playerMorale: { who: 'unhappiest', delta: 10 }, squadMorale: 4 } },
          { id: 'call-out', label: 'Call the crowd out afterwards', desc: 'Say it plainly at the press conference', outcome: 'The supporters do not enjoy being lectured by a manager in the bottom four. The player, though, hears it and never forgets it.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, prestige: -3, boardMood: -1, tag: 'mgr-defended-a-player-publicly' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-unpaid-instalment', title: 'The Instalment', icon: '💸', category: 'crisis',
    when: { minPos: 0.68, maxCoins: 400, minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club that bought a player eighteen months ago has not paid the second instalment and has stopped answering emails. It is money the club has already spent, twice, on paper.',
        choices: [
          { id: 'legal', label: 'Take it to the authorities', desc: 'Formal complaint, embargo, the lot', outcome: 'It works in nine months and makes an enemy of a club the manager will need a loan from in January.', effect: { coins: 320, prestige: -1, tag: 'mgr-went-formal' } },
          { id: 'settle', label: 'Take a reduced settlement now', desc: 'Less money, this week, no fuss', outcome: 'It is sixty per cent and it clears the wage bill for the month. The finance director calls it prudent and does not look pleased.', effect: { coins: 190, boardMood: 1 } },
          { id: 'trade', label: 'Take a player instead', desc: 'Debt written off for a body in the squad', outcome: 'He is better than expected and older than the club wanted. The books are clean and the squad is a year further from where it should be.', effect: { squadMorale: 4, boardMood: -1, tag: 'mgr-took-a-player-for-a-debt' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-floodlights', title: 'The Lights Go', icon: '💡', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Thirty-one minutes, one-nil up, and the whole of the north-west corner goes dark. The referee takes them off. It is cold and eleven thousand people are being told to stay in their seats.',
        choices: [
          { id: 'warm', label: 'Keep them moving in the tunnel', desc: 'Bikes, bibs, nobody sits down', outcome: 'They restart after forty minutes and are the sharper side by ten yards. It is the least glamorous good decision of his career.', effect: { squadMorale: 5, tag: 'mgr-kept-them-warm' } },
          { id: 'sit', label: 'Let them sit and eat something', desc: 'It might be called off anyway', outcome: 'It is not called off. They come back out flat and concede in ninety seconds and draw a game they had won.', effect: { squadMorale: -6 } },
          { id: 'push-abandon', label: 'Push the referee to abandon it', desc: 'A one-nil lead and a replay to come', outcome: 'He gets his way. The replay is in three weeks, away, and they lose it two-nil.', effect: { prestige: -1, coins: -60, tag: 'mgr-got-it-abandoned' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-captain-off-early', title: 'Off In The Ninth Minute', icon: '🟥', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A challenge that was late by about a foot and stupid by rather more. The captain is off in the ninth minute of a game the club could not afford to lose and eighty-one minutes remain.',
        choices: [
          { id: 'reshape', label: 'Change everything immediately', desc: 'A forward off, the shape redrawn, on the touchline', outcome: 'It is done inside two minutes and it holds. Nil-nil, and the substituted forward is furious for a week about something that was not his fault.', effect: { squadMorale: 4, playerMorale: { who: 'star', delta: -8 } } },
          { id: 'go-for-it', label: 'Keep two up and go at them', desc: 'Ten men, no retreat, and see what happens', outcome: 'They score, and then they concede twice in the last ten with legs entirely gone. Nobody in the ground is bored.', effect: { squadMorale: 6, boardMood: -2, tag: 'mgr-went-for-it-with-ten' } },
          { id: 'punish', label: 'Fine the captain and say why', desc: 'That challenge cost the club a result', outcome: 'It is right and it is unpopular in the room, where they have all made that tackle. He appeals the ban anyway and loses.', effect: { coins: 60, playerMorale: { who: 'oldest', delta: -12 }, squadMorale: -4, tag: 'mgr-fined-the-captain' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-empty-seats', title: 'The Gate Is Down', icon: '🪑', category: 'crisis',
    when: { minPos: 0.78, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four thousand fewer than August in a ground that holds fifteen. The whole of one block is closed and covered in advertising boards and the club has stopped putting the attendance on the screen.',
        choices: [
          { id: 'cheap', label: 'Push for a cheap-ticket game', desc: 'Fill it once, whatever it costs', outcome: 'Eleven thousand come. They win, and three thousand of the eleven come back in March, and the accountant is still annoyed in June.', effect: { coins: -150, squadMorale: 8, boardMood: -1, tag: 'mgr-filled-it-once' } },
          { id: 'players-out', label: 'Send the squad into the town', desc: 'Schools, working men\'s clubs, the market', outcome: 'It is a fortnight of long afternoons for players who did not sign up for it and it earns the club about four hundred people.', effect: { squadMorale: -4, prestige: 2 } },
          { id: 'nothing-there', label: 'Win games and they will come back', desc: 'The only marketing that has ever worked', outcome: 'It is true and it is useless in the middle of a run of one win in nine. The block stays covered until the following August.', effect: { boardMood: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-training-ground-lease', title: 'The Lease', icon: '📜', category: 'crisis',
    when: { minPos: 0.7, minSeason: 4, maxCoins: 600 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The training ground is rented from a company that would rather build on it. There are two years left and a letter has arrived that the chief executive describes as an opening position.',
        choices: [
          { id: 'fight', label: 'Make it public', desc: 'Supporters, local paper, the council', outcome: 'It becomes a campaign with a name and a scarf. It buys eighteen months and poisons every conversation the club has with the landlord.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-made-the-lease-public' } },
          { id: 'buy', label: 'Push the board to buy it', desc: 'Money the club does not have, for the only thing that matters', outcome: 'They borrow to do it. The club owns its own pitches for the first time in its history and cannot sign anybody for two years.', effect: { coins: -500, boardMood: -1, clubLegacy: { kind: 'reputation', label: 'owns its own training ground' } } },
          { id: 'move', label: 'Start looking for somewhere else', desc: 'Quietly, before anyone forces it', outcome: 'There is a school site eleven miles out with three pitches and no history. Half the staff would have a longer drive and none of them are told yet.', effect: { squadMorale: -4, coins: -100 } },
        ],
      },
    },
  },

  // ── TRIUMPH ──────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p05-pitch-invasion', title: 'They Came Over The Wall', icon: '🎉', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is done with four minutes still on the clock and the first of them is over the wall before the whistle. There is no getting the players off. Somebody has a goalpost.',
        choices: [
          { id: 'in-it', label: 'Stay out there in the middle of it', desc: 'Let it happen to him too', outcome: 'He loses a shoe and is carried about nine yards. There is a photograph of his face that the club uses for a decade.', effect: { prestige: 3, squadMorale: 12, clubLegacy: { kind: 'tradition', label: 'the day they came over the wall' } } },
          { id: 'tunnel', label: 'Get the players in', desc: 'Somebody is going to get hurt', outcome: 'It is the sensible call and the supporters remember him going down the tunnel while they were still on the pitch.', effect: { squadMorale: 5, prestige: -1 } },
          { id: 'stewards', label: 'Back the club on the fine', desc: 'Stand with the safety officer afterwards', outcome: 'The fine arrives in June and is paid without complaint. The safety officer never forgets who backed him.', effect: { coins: -110, boardMood: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-bus-route', title: 'The Route', icon: '🚍', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The council want the bus to go along the ring road for the traffic. Somebody in the office wants it to go past the old ground, which has been a retail park since 1998.',
        choices: [
          { id: 'old-ground', label: 'Past the old ground', desc: 'Twenty minutes longer, one street that matters', outcome: 'Four hundred people are standing outside a supermarket where a terrace used to be. Two of the older staff cry and pretend it is the wind.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'the bus goes past the old ground' } } },
          { id: 'ring-road', label: 'Do what the police ask', desc: 'The efficient route, everybody home safe', outcome: 'It runs on time and it is fine. The photographs are of a dual carriageway and a very happy squad.', effect: { boardMood: 1, squadMorale: 6 } },
          { id: 'estate', label: 'Through the estate the academy draws from', desc: 'Where half the squad actually grew up', outcome: 'It takes an hour to do a mile and a half. Eleven kids on a wall will remember it for the rest of their lives.', effect: { prestige: 1, squadMorale: 8, clubLegacy: { kind: 'tradition', label: 'the bus goes through the estate' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-quarter-final-draw', title: 'The Draw', icon: '🎱', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The squad watch the draw on a television bracketed to a wall in the canteen. They get the biggest club left, away, and there is a noise in the room that is half groan and half something else entirely.',
        choices: [
          { id: 'go-win', label: 'Tell them they are going to win it', desc: 'Say it out loud in front of all of them', outcome: 'It is absurd and he says it anyway and nobody laughs. They lose two-one and lead at half time and the room believes him for two years afterwards.', effect: { squadMorale: 12, prestige: 1, tag: 'mgr-said-it-out-loud' } },
          { id: 'day-out', label: 'Call it a day out and mean it', desc: 'Take the pressure off entirely', outcome: 'They enjoy it and they are beaten by three goals and everyone has a lovely time. One senior pro thinks that was a waste of a quarter-final.', effect: { squadMorale: 6, playerMorale: { who: 'oldest', delta: -6 } } },
          { id: 'league-first', label: 'Say the league matters more', desc: 'Honest, unromantic, and correct', outcome: 'It is the right thing to say in a promotion season and it is not what a single person in that canteen wanted to hear.', effect: { squadMorale: -4, boardMood: 2, tag: 'mgr-put-the-league-first' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-beat-the-champions', title: 'Beating Them', icon: '🥇', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 2, minTier: 1, maxTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nil-nil at half time and one-nil with eleven minutes left, and their manager is on the touchline doing the thing he does with his hands. The ground has not sat down since the goal.',
        choices: [
          { id: 'shut-up-shop', label: 'Two banks of four and hang on', desc: 'Five men behind the ball, no apology', outcome: 'It is eleven minutes of nothing but headers and a save. They hold it and the noise at the whistle takes a fortnight to get out of his ears.', effect: { squadMorale: 12, prestige: 2 } },
          { id: 'second', label: 'Go and get the second', desc: 'A fresh forward on, keep the ball up the pitch', outcome: 'They get it in the ninetieth and the last twenty minutes are the best football the club plays all season.', effect: { squadMorale: 14, prestige: 3, boardMood: 1, clubLegacy: { kind: 'reputation', label: 'beat the champions on their own terms' } } },
          { id: 'time', label: 'Take every second available', desc: 'Substitutions, the corner flag, the lot', outcome: 'It works and the other manager says something about it afterwards. The supporters find the whole thing hilarious for years.', effect: { squadMorale: 8, prestige: -1, clubLegacy: { kind: 'rivalry', label: 'the eleven minutes they never forgave' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-last-day-elsewhere', title: 'Listening To Another Ground', icon: '📻', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They have done their job by twenty past four and it depends on a ground ninety miles away. Eleven thousand people with a phone each and a manager who will not look at the bench.',
        choices: [
          { id: 'know', label: 'Have somebody feed him the score', desc: 'A coach with an earpiece and a job to do', outcome: 'He knows forty seconds before the ground does and it is the longest forty seconds of his life.', effect: { squadMorale: 6, prestige: 1 } },
          { id: 'blind', label: 'Refuse to be told anything', desc: 'Manage his own game and nothing else', outcome: 'He finds out from the sound. It comes across the pitch in a wave from the far corner and he knows what it means before he knows anything.', effect: { squadMorale: 8, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the roar that came from the far corner' } } },
          { id: 'tell-players', label: 'Tell the players during the game', desc: 'Shout it across, let them play with it', outcome: 'Two of them take three minutes to recover from the information. They see the game out on adrenaline and bad decisions.', effect: { squadMorale: 4, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-unbeaten-run', title: 'Fifteen Unbeaten', icon: '📈', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fifteen games. There is a graphic about it before every fixture now and a man from a national paper has been at the training ground twice this week asking about a record.',
        choices: [
          { id: 'ignore-run', label: 'Refuse to discuss it', desc: 'Ban the subject from the building', outcome: 'The players talk about nothing else, quietly, and lose the sixteenth to a side in the bottom three.', effect: { squadMorale: -4, tag: 'mgr-banned-the-subject' } },
          { id: 'celebrate', label: 'Let them enjoy it', desc: 'Say the number, put it on the wall', outcome: 'They win the sixteenth and the seventeenth and the run ends in March at twenty-two, and there is a photograph of the wall in the programme.', effect: { squadMorale: 10, prestige: 2, clubLegacy: { kind: 'reputation', label: 'the twenty-two-game run' } } },
          { id: 'rotate', label: 'Rotate hard and risk it', desc: 'The run is not worth a fixture list', outcome: 'It ends on a Tuesday with six changes, and the side is fresh in April when three of their rivals are not.', effect: { squadMorale: -3, boardMood: 2, tag: 'mgr-spent-the-run' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-testimonial', title: 'His Night', icon: '🎟️', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 4, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ten years at the club and a testimonial in July that nobody has organised properly. He has not asked. He would not ask. Somebody in the ticket office has mentioned it three times.',
        choices: [
          { id: 'big', label: 'Get a proper opposition in', desc: 'Ring in a favour and fill the ground', outcome: 'Nine thousand come. He goes off on eighty minutes and the whole ground is up, and his mother is in the directors\' box in a new coat.', effect: { coins: -80, playerMorale: { who: 'oldest', delta: 20 }, squadMorale: 8, clubLegacy: { kind: 'tradition', label: 'the testimonial they filled the ground for' } } },
          { id: 'small', label: 'Keep it small and local', desc: 'A friendly, a buffet, no fuss', outcome: 'Two thousand and a nice night. He says it was exactly what he wanted, and it was, and it could have been more.', effect: { playerMorale: { who: 'oldest', delta: 10 }, squadMorale: 4 } },
          { id: 'number', label: 'Retire his number instead', desc: 'No game, a permanent thing', outcome: 'The shirt goes in a frame in the corridor by the boot room. Every player who signs for the club for the next thirty years walks past it.', effect: { playerMorale: { who: 'oldest', delta: 18 }, prestige: 2, clubLegacy: { kind: 'number', label: 'a number nobody wears here any more' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-name-the-stand', title: 'What To Call It', icon: '🏟️', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board want to rename the east stand and have asked him, which they did not have to. There is a sponsor willing to pay for it, a former player who died in the spring, and a manager who is still alive and in the room.',
        choices: [
          { id: 'sponsor', label: 'Take the sponsor\'s money', desc: 'A name on a stand for four years of budget', outcome: 'The money is real and buys two players. Nobody in the ground ever calls it by that name, not once, not even the announcer.', effect: { coins: 450, prestige: -2, clubLegacy: { kind: 'stand', label: 'a stand nobody calls by its name' } } },
          { id: 'player', label: 'Name it after the player', desc: 'Four hundred games and a funeral in March', outcome: 'His widow pulls the cover off in August. It is the correct decision and it costs the club a great deal of money it needed.', effect: { boardMood: -2, prestige: 3, clubLegacy: { kind: 'stand', label: 'a stand named for a man who played four hundred games' } } },
          { id: 'refuse', label: 'Leave it as the east stand', desc: 'It has been the east stand since 1931', outcome: 'The board are baffled and slightly relieved. It stays the east stand, and in forty years somebody writes an article about why.', effect: { prestige: 1, clubLegacy: { kind: 'tradition', label: 'the stand that was never renamed' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-bigger-club-calls', title: 'A Number He Does Not Recognise', icon: '📞', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club two divisions up, in the middle of a mess, would like to speak to him. They have gone through the proper channels, which means his own chairman knew before he did.',
        choices: [
          { id: 'go', label: 'Ask for permission to talk', desc: 'It is the job he has worked eleven years for', outcome: 'The talks are serious and the money is a different currency. Whatever he decides, the dressing room now knows he thought about it.', effect: { squadMorale: -8, boardMood: -2, prestige: 3, tag: 'mgr-talked-to-them' } },
          { id: 'refuse-it', label: 'Say no before it is formally asked', desc: 'Kill it in one phone call', outcome: 'He never tells the players and they find out anyway, in April, from a journalist. Something in the room goes up a level.', effect: { squadMorale: 14, boardMood: 3, clubLegacy: { kind: 'reputation', label: 'the manager who turned them down' } } },
          { id: 'leverage', label: 'Use it', desc: 'A meeting upstairs the same afternoon', outcome: 'He gets a budget and a contract and a chairman who now knows exactly how this manager operates.', effect: { coins: 380, boardMood: -2, prestige: 1, tag: 'mgr-used-the-offer' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-first-hat-trick', title: 'Three In One Afternoon', icon: '⚽', category: 'triumph',
    when: { maxPos: 0.35, needs: 'wonderkid', minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eighteen years old and three goals by the sixty-fourth minute, and the third one was better than the other two put together. There are four cameras waiting outside the dressing room.',
        choices: [
          { id: 'press-him', label: 'Put him in front of the cameras', desc: 'He earned the afternoon, let him have all of it', outcome: 'He is charming and nervous and says something about his grandad that leads every bulletin. His price goes up by a number with a comma in it.', effect: { playerMorale: { who: 'youngest', delta: 16 }, prestige: 2, tag: 'mgr-put-him-up' } },
          { id: 'shield-him', label: 'Do the press himself', desc: 'Take the questions, keep the boy inside', outcome: 'He answers thirty minutes of questions about somebody else and enjoys none of it. The boy is in bed by ten and trains normally on Monday.', effect: { playerMorale: { who: 'youngest', delta: 6 }, squadMorale: 6, tag: 'mgr-kept-him-back' } },
          { id: 'ball', label: 'Get the match ball signed by everyone', desc: 'Twenty-two names and the kitman\'s', outcome: 'It is in his mother\'s house thirty years later. It cost nothing and it is the thing he mentions in every interview he ever gives about the club.', effect: { playerMorale: { who: 'youngest', delta: 12 }, squadMorale: 5, clubLegacy: { kind: 'tradition', label: 'the ball everyone signs' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-away-end-sings', title: 'They Are Singing His Name', icon: '🎵', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three-nil up at a ground they have not won at since before he was born, and the away end has started on a song with his name in it. He is standing in a technical area with nowhere to look.',
        choices: [
          { id: 'acknowledge', label: 'Turn round and applaud them', desc: 'All of it, both arms, no embarrassment', outcome: 'They get louder. On the coach home one of the coaches tells him he looked about nineteen.', effect: { prestige: 2, squadMorale: 6 } },
          { id: 'point', label: 'Point at the players', desc: 'Redirect it where it belongs', outcome: 'The song changes to one about the centre-forward within a minute. The centre-forward scores again eleven minutes later.', effect: { squadMorale: 10, playerMorale: { who: 'star', delta: 12 } } },
          { id: 'work', label: 'Keep watching the game', desc: 'It is three-nil, not full time', outcome: 'They score a fourth. Nobody who was in that away end ever mentions the goal, only the song, and only the fact he never turned round.', effect: { prestige: 1, boardMood: 1, tag: 'mgr-never-turned-round' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-medals-for-all', title: 'Who Gets One', icon: '🏅', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The competition has sent thirty medals for a squad of forty-one, and the forty-one includes a goalkeeper who played eleven games in August and a kitman with thirty-one years in.',
        choices: [
          { id: 'buy-more', label: 'Buy the extra eleven himself', desc: 'Out of his own pocket, no announcement', outcome: 'They are not quite the same, if you look. Nobody looks. The kitman wears his to a wedding.', effect: { coins: -50, squadMorale: 12, prestige: 1, clubLegacy: { kind: 'tradition', label: 'everybody in the building gets one' } } },
          { id: 'players-only', label: 'Players who featured, that is the rule', desc: 'The competition decided, not the club', outcome: 'It is defensible in every way and two members of staff go home early on the day of the presentation.', effect: { squadMorale: 4 } },
          { id: 'give-his', label: 'Give his own away', desc: 'To the man who has been here longest', outcome: 'He does it in the corridor with nobody watching and it is in the local paper within four days anyway.', effect: { prestige: 3, squadMorale: 8, tag: 'mgr-gave-his-medal-away' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-celebrate-or-not', title: 'A Game On Wednesday', icon: '🍾', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 2, temper: ['disciplinarian', 'players-manager', 'firefighter'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is done, and there are still three games to play, and the first of them is on Wednesday. Twenty-four grown men are standing in a dressing room looking at him and waiting to be told whether tonight is allowed.',
        choices: [
          { id: 'tonight', label: 'Tonight is theirs', desc: 'In at midday Monday, and not before', outcome: 'They are useless on Wednesday and lose to a side with nothing to play for. He would do it again.', effect: { squadMorale: 14, prestige: -1, tag: 'mgr-gave-them-the-night' } },
          { id: 'after', label: 'After the last game', desc: 'Ten more days, then everything', outcome: 'They win all three. The night when it comes is flat, because the thing had already gone cold.', effect: { squadMorale: 2, boardMood: 2 } },
          { id: 'both', label: 'Tonight, and everyone in at nine', desc: 'Have it, and pay for it in the morning', outcome: 'The Monday session is the worst-attended-in-spirit hour of the season. On Wednesday they win two-nil, which proves nothing at all.', effect: { squadMorale: 8, tag: 'mgr-had-it-both-ways' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-civic-reception', title: 'The Town Hall', icon: '🏛️', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A civic reception on a Tuesday morning with speeches and a photograph on the steps. Half the squad have never met the mayor and three of them do not live in the town.',
        choices: [
          { id: 'all', label: 'Everyone goes', desc: 'Suits, on the coach, no exceptions', outcome: 'It is dull for ninety minutes and there is a photograph on those steps that hangs in the boardroom until the building is sold.', effect: { squadMorale: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the photograph on the town hall steps' } } },
          { id: 'volunteers', label: 'Whoever wants to go', desc: 'No pressure either way', outcome: 'Nine go, and they are the nine you would guess, and the mayor notices the gaps and is gracious about it.', effect: { squadMorale: 4, prestige: -1 } },
          { id: 'kids', label: 'Send the academy instead', desc: 'The boys who grew up here', outcome: 'Fourteen teenagers in club blazers on the steps of the town hall. It is a better photograph than the other one would have been.', effect: { playerMorale: { who: 'youngest', delta: 14 }, prestige: 2, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-manager-of-the-month', title: 'The Bottle Of Champagne', icon: '🍾', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four wins and a draw and a trophy that comes with a photographer and a bottle. There is an entire mythology about what happens next and everybody in the room has mentioned it at least twice.',
        choices: [
          { id: 'take-it', label: 'Take it and pose properly', desc: 'Grin, hold the bottle, get on with it', outcome: 'They lose three in a row and every single report mentions the award. He keeps the bottle on a shelf out of spite.', effect: { prestige: 2, squadMorale: -2, tag: 'mgr-took-the-award' } },
          { id: 'staff', label: 'Have the staff in the photograph', desc: 'All of them, the analyst included', outcome: 'The picture is a bit crowded and slightly wonky. It goes up in the staff room and is still up when he leaves.', effect: { prestige: 1, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'nobody gets photographed alone here' } } },
          { id: 'give-away', label: 'Give it to the groundsman', desc: 'The pitch has been perfect since August', outcome: 'He is embarrassed and pleased and keeps it in the mower shed. The story gets out and does the manager more good than the award would have.', effect: { prestige: 2, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-prize-money', title: 'What To Do With It', icon: '💰', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A run in a cup has produced more money than the club expected to see this decade. There is a meeting on Thursday and three different people have already told him what it is for.',
        choices: [
          { id: 'squad', label: 'Spend it on players', desc: 'A window with actual money in it', outcome: 'Two signings who make the side better for two seasons. In five years nobody can remember either of their names.', effect: { coins: 500, boardMood: -1, squadMorale: 8 } },
          { id: 'academy', label: 'Put it into the academy', desc: 'Pitches, coaches, a building', outcome: 'Nothing happens for six years. Then four players come through in eighteen months and the club never has to buy a full-back again.', effect: { boardMood: -2, prestige: 1, clubLegacy: { kind: 'reputation', label: 'the academy the cup run built' } } },
          { id: 'debt', label: 'Clear what the club owes', desc: 'Boring, invisible, permanent', outcome: 'The finance director shakes his hand for slightly too long. It is the least popular and most useful thing he does all year.', effect: { boardMood: 3, squadMorale: -4, coins: 200 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-clean-sheet-record', title: 'Eight Hundred Minutes', icon: '🧱', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The goalkeeper has not been beaten since the second of January and there is a club record eleven minutes away. The other side have a corner and the ball is in the air.',
        choices: [
          { id: 'defenders', label: 'Give the record to the back four', desc: 'Say it in every interview, name all of them', outcome: 'The keeper says the same thing, unprompted, twice. The four of them are unpickable for the rest of the season.', effect: { squadMorale: 12, tag: 'mgr-credited-the-defence' } },
          { id: 'keeper', label: 'Let the keeper have his day', desc: 'He is the one whose name goes on the board', outcome: 'He is on the front of the programme and signs a new deal a fortnight later for less than he could have got.', effect: { playerMorale: { who: 'best', delta: 16 }, squadMorale: 4 } },
          { id: 'downplay', label: 'Call it a by-product', desc: 'Records are for the end of a career', outcome: 'It is exactly the sort of thing he believes and it takes something small away from eleven men who had earned it.', effect: { squadMorale: -4, boardMood: 1, tag: 'mgr-downplays-records' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-beat-the-club-that-sacked', title: 'The Old Ground', icon: '🧭', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The fixture list has given him a return to the place that let him go in February four years ago. He still knows which door sticks. Two of the people who sacked him are still there.',
        choices: [
          { id: 'gracious', label: 'Be entirely gracious about it', desc: 'Shake every hand on the way in', outcome: 'They win two-nil. He says three warm sentences afterwards and everybody in that building understands exactly what has happened.', effect: { prestige: 3, squadMorale: 6, clubLegacy: { kind: 'rivalry', label: 'a fixture that means something to one man' } } },
          { id: 'cold', label: 'Say nothing to anyone there', desc: 'In, work, out', outcome: 'It reads as bitterness in the reports, which is unfair and roughly accurate. His players think it is brilliant.', effect: { squadMorale: 8, prestige: -1 } },
          { id: 'tell-squad-why', label: 'Tell the squad what this one is', desc: 'Ten minutes on Friday about February four years ago', outcome: 'They play like men on somebody\'s behalf. It is the most emotional performance he ever gets out of a group and he is careful never to use it twice.', effect: { squadMorale: 14, prestige: -1, tag: 'mgr-used-his-own-history' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-title-run-in', title: 'Five To Go', icon: '📊', category: 'triumph',
    when: { maxPos: 0.08, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Top by a point with five to play and a squad that has never been anywhere near this. Somebody has printed the remaining fixtures of the two clubs behind them and stuck it in the canteen.',
        choices: [
          { id: 'take-it-down', label: 'Take the sheet down', desc: 'Their games are none of the squad\'s business', outcome: 'It reappears in a different place within two days. He takes that one down as well and says nothing about either.', effect: { squadMorale: 3, tag: 'mgr-took-the-sheet-down' } },
          { id: 'annotate', label: 'Write the club\'s own five next to them', desc: 'If they are looking, let them look properly', outcome: 'It becomes the most-read piece of paper in the building. Everyone knows exactly what a draw on Saturday costs.', effect: { squadMorale: 6, prestige: 1 } },
          { id: 'seniors', label: 'Hand the run-in to the senior men', desc: 'Let the room manage the room', outcome: 'Three of them run the week and he takes training and says almost nothing. It is the least he has done in years and it works.', effect: { squadMorale: 10, playerMorale: { who: 'oldest', delta: 12 }, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-squad-photo', title: 'The Photograph', icon: '📸', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The end-of-season photograph on the pitch with the trophy. There is a question about who sits in the middle and a smaller question about whether the loan players are in it at all.',
        choices: [
          { id: 'everyone', label: 'Everybody who was here', desc: 'Loans, physios, the two who got injured in September', outcome: 'It takes forty minutes to arrange and is eighty-one people wide. It is on a wall in the ground until the ground is knocked down.', effect: { squadMorale: 12, clubLegacy: { kind: 'tradition', label: 'the eighty-one-people photograph' } } },
          { id: 'squad-only', label: 'Contracted players only', desc: 'It is a squad photograph', outcome: 'It is a clean, professional picture. A loan player who played thirty-one games watches it being taken from the tunnel.', effect: { squadMorale: -4, prestige: 1 } },
          { id: 'middle', label: 'Put the youth-team lad in the middle', desc: 'Two starts, and here since he was nine', outcome: 'Nobody argues. It is the picture the club uses for everything for a decade and he is in the centre of it holding the trophy.', effect: { playerMorale: { who: 'youngest', delta: 18 }, squadMorale: 8 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-new-rivalry', title: 'Something Started', icon: '⚔️', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three meetings this season, three arguments, a red card and a manager who said something in a tunnel that has now been repeated in print. Two clubs who did not care about each other in August care a great deal in April.',
        choices: [
          { id: 'stoke', label: 'Keep it going', desc: 'One line in the press conference, deliberately chosen', outcome: 'The fixture sells out both ways for the next fifteen years. The club gains an enemy and about four thousand people who look forward to two days a season.', effect: { prestige: 2, coins: 120, clubLegacy: { kind: 'rivalry', label: 'the fixture that started in a tunnel' } } },
          { id: 'cool', label: 'Take the heat out of it', desc: 'Ring their manager, say the boring thing publicly', outcome: 'It cools within a month. Two supporters\' groups are disappointed and one steward is extremely relieved.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'players-decide', label: 'Ask the players what they want it to be', desc: 'They are the ones on the pitch', outcome: 'They want it. Of course they want it. He goes along with a thing he could have stopped and is asked about it for years.', effect: { squadMorale: 8, prestige: -1, clubLegacy: { kind: 'rivalry', label: 'a rivalry the dressing room chose' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p05-open-training', title: 'Letting Them In', icon: '🚸', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody suggests an open training session in the half term. It has not been done here since the eighties, when it was done badly and somebody got hit by a ball.',
        choices: [
          { id: 'do-it', label: 'Open the gates', desc: 'Free, one session, whoever turns up', outcome: 'Two thousand come and it is chaos and the session is worthless. Eleven of those children join the club\'s junior scheme that month.', effect: { squadMorale: 4, coins: -40, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the half-term session at the training ground' } } },
          { id: 'ticketed', label: 'Four hundred, ticketed, on the pitch at the ground', desc: 'Controlled, safe, manageable', outcome: 'It runs perfectly and feels like an event rather than a morning. The players sign for ninety minutes afterwards without being asked.', effect: { squadMorale: 6, coins: 60, prestige: 1 } },
          { id: 'no', label: 'The training ground is for training', desc: 'Politely, and finally', outcome: 'It is the right professional answer. The chief executive stops bringing him ideas for about a year.', effect: { boardMood: -1, squadMorale: 2 } },
        ],
      },
    },
  },
];
