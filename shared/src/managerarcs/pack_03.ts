// Manager-arc authoring pack 03. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack: CRISIS (the seasons that go wrong) and TRIUMPH (the seasons that go right). Both halves are
// gated hard on league position — a relegation arc has no business firing while the club is cruising, and
// a promotion arc has no business firing while it is drowning. Crisis wants minPos 0.65+; triumph wants
// maxPos 0.4 or lower. Nothing in here is free: every triumph has a cost buried somewhere inside it.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_03: ManagerArc[] = [
  // ── CRISIS ───────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p03-injury-crisis-treatment-room', title: 'The Treatment Room', icon: '🩼', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine men on the physio bed and two of them are centre-halves. The board outside the treatment room has run out of space and somebody has started a second column in different handwriting.',
        choices: [
          { id: 'rush', label: 'Rush the nearly-fit back', desc: 'A fortnight early, on painkillers, because Saturday will not wait', outcome: 'Two of them get through ninety minutes. One of them does not get through twenty and is gone until spring.', effect: { squadMorale: -4, prestige: 1, tag: 'mgr-rushed-returns' } },
          { id: 'kids', label: 'Fill the gaps with the under-eighteens', desc: 'Three debutants on one team sheet', outcome: 'They lose two-nil and one of the boys is the best player on the pitch. The result is the same. The season is not.', effect: { playerMorale: { who: 'youngest', delta: 12 }, squadMorale: 2, boardMood: -1 } },
          { id: 'blame-staff', label: 'Tear into the fitness staff', desc: 'Somebody has been loading them wrong', outcome: 'He is probably right and he definitely says it in front of the wrong people. The head of medicine stops volunteering opinions.', effect: { boardMood: -1, squadMorale: -3, tag: 'mgr-staff-friction' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-fixture-pileup', title: 'Nine Games In Thirty Days', icon: '🗓️', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two postponements have come back to be paid for and the calendar on the office wall is one solid block of ink. Nine games. Thirty days. A squad of nineteen, four of whom cannot run.',
        choices: [
          { id: 'rotate', label: 'Rotate hard', desc: 'Nobody plays three in a week, whoever they are', outcome: 'The results wobble in the middle of it and level out at the end. Two of the fringe men come out of the month as footballers.', effect: { squadMorale: 6, boardMood: -1 }, next: 'end' },
          { id: 'flog', label: 'Play the best eleven every time', desc: 'Get the points, worry about legs in April', outcome: 'They take eleven points from the month. In April the same eleven look like men wading through sand.', effect: { squadMorale: -5, boardMood: 2, tag: 'mgr-flogged-them' }, next: 'end' },
          { id: 'sacrifice', label: 'Throw the cup tie away', desc: 'Reserves, a coach as an emergency sub, and no apology', outcome: 'They go out at home to a side two divisions down. The league form holds. Nobody in the ground on that Tuesday forgets it.', effect: { boardMood: -2, prestige: -2, squadMorale: 4, coins: -60 }, next: 'end' },
        ],
      },
      end: {
        id: 'end',
        prompt: 'The last of the nine finishes on a wet Tuesday with nine hundred people in. In the tunnel afterwards the captain sits on the floor with his boots still on and does not speak for four minutes.',
        choices: [
          { id: 'days-off', label: 'Give them four days off', desc: 'Empty the training ground completely', outcome: 'They come back looking like different men and having forgotten how to defend a corner. Worth it, probably.', effect: { squadMorale: 9, boardMood: -1 } },
          { id: 'straight-back', label: 'In at nine tomorrow', desc: 'Momentum is a thing you lose in a hotel', outcome: 'Eleven of them are in at nine. Two are late and he fines them both, and the room is very quiet about it.', effect: { squadMorale: -4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-frozen-pitch', title: 'Frozen Solid', icon: '❄️', category: 'crisis',
    when: { minPos: 0.65 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The referee walks the pitch at eleven and puts his heel into it twice near the corner flag. Three thousand away supporters are already past the halfway point of a four-hour drive.',
        choices: [
          { id: 'call-off', label: 'Call it off early', desc: 'Ring it in before more of them set out', outcome: 'The right decision, made in time, which costs a gate the club needed and earns a paragraph of grudging thanks in a fanzine.', effect: { coins: -110, prestige: 1 } },
          { id: 'straw', label: 'Get the covers and every volunteer in town on it', desc: 'Braziers, straw, and men with forks at seven in the morning', outcome: 'They get it on. It is a shocking game on a surface like a car park and the away side score the only goal on the one strip that thawed.', effect: { coins: 60, squadMorale: -4, boardMood: -1 } },
          { id: 'push', label: 'Lean on the referee to pass it', desc: 'The gate matters more than the football will', outcome: 'He passes it and then abandons it at half-time with the club having sold four thousand pies and no refunds agreed.', effect: { coins: 40, prestige: -2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-coach-defects', title: 'He Went To Them', icon: '🧳', category: 'crisis',
    when: { minPos: 0.7, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The first-team coach hands in a letter on the Thursday. He is joining the club sitting three places above, and he has been in every set-piece meeting the side has held since August.',
        choices: [
          { id: 'gardening', label: 'Send him home today', desc: 'Badge off the gate, nothing taken, nothing said', outcome: 'The lads he worked with every day find out from a website. It is clean and it is cold and the room feels both of those things.', effect: { squadMorale: -5, prestige: 1, tag: 'mgr-ruthless-exit' } },
          { id: 'let-him-finish', label: 'Let him take Saturday', desc: 'One last session, a handshake, no theatre', outcome: 'He is emotional at the end of it and does the warm-up properly. Then the routines turn up at the other club in October, exactly as drawn.', effect: { squadMorale: 6, boardMood: -1, tag: 'mgr-sentimental' } },
          { id: 'rewrite', label: 'Change every set-piece in a week', desc: 'Bin the lot and start again from nothing', outcome: 'Eleven men learn eleven new jobs in six days. They concede from a corner on the Saturday anyway, and score from one in November.', effect: { squadMorale: -3, prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-betting-scandal', title: 'The Betting Slip', icon: '🎲', category: 'crisis',
    when: { minPos: 0.68, minSeason: 3 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The compliance officer rings on a Sunday morning, which is never good. One of the squad has an account with four hundred bets on it, some of them on games he played in. None of them against his own side. All of them charges.',
        choices: [
          { id: 'front', label: 'Get in front of it', desc: 'Statement out before anyone else runs it', outcome: 'The club looks like it is running the story rather than hiding from it, and the lad reads a version of himself in print that he cannot ever take back.', effect: { prestige: 2, playerMorale: { who: 'star', delta: -14 }, boardMood: 1 } },
          { id: 'protect', label: 'Say nothing and stand next to him', desc: 'No comment, and he trains with the group as normal', outcome: 'The room closes around him. Three weeks of questions, and a manager who answers none of them, and a dressing room that would now do anything he asked.', effect: { squadMorale: 11, prestige: -2, boardMood: -2 } },
          { id: 'suspend', label: 'Suspend him pending it all', desc: 'Out of the building until it is resolved', outcome: 'It resolves in five months. By then he has trained alone through a winter and will not look at him in a corridor.', effect: { playerMorale: { who: 'star', delta: -20 }, boardMood: 2, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-squad-illness', title: 'Something Going Round', icon: '🤒', category: 'crisis',
    when: { minPos: 0.66 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It starts with the goalkeeping coach on the Monday and by Thursday there are six of them at home with the curtains shut. The canteen has been closed and somebody has taken the salt and pepper off the tables.',
        choices: [
          { id: 'postpone', label: 'Apply to have it off', desc: 'Make the case, however thin it looks', outcome: 'The application is refused in one sentence. Everyone now knows the club tried, including the eleven men who have to play anyway.', effect: { squadMorale: -3, prestige: -1 } },
          { id: 'play-it', label: 'Play whoever can stand', desc: 'Seven fit, four ill, three named subs who are schoolboys', outcome: 'They lose by two and the striker is sick behind the dugout at the hour mark and finishes the game. Half the ground stands up for him at the end.', effect: { squadMorale: 8, boardMood: -1, prestige: 1 } },
          { id: 'split', label: 'Split the squad in two', desc: 'Two sites, two sessions, nobody mixes', outcome: 'It halts the thing dead. It also means half the side has not trained with the other half for eleven days and it shows in the first twenty minutes.', effect: { squadMorale: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-training-burglary', title: 'They Came Over The Fence', icon: '🔦', category: 'crisis',
    when: { minPos: 0.65, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The side gate is bent outwards and the kit store is empty. Boots, GPS vests, two washing machines and the laptop with the whole season of clips on it, which nobody had backed up since October.',
        choices: [
          { id: 'replace', label: 'Replace the lot out of the budget', desc: 'Order everything today and argue about it later', outcome: 'They train in the right kit on Tuesday. The finance director makes a small noise in a meeting that he does not forget.', effect: { coins: -180, squadMorale: 4, boardMood: -1 } },
          { id: 'make-do', label: 'Make do', desc: 'Old bibs, borrowed balls, and a whiteboard instead of clips', outcome: 'Two of the senior lads bring in their own boots for the young ones. The whiteboard turns out to be better than the clips, which he never admits.', effect: { squadMorale: 5, coins: -20, prestige: 1 } },
          { id: 'crack-down', label: 'Lock the place down properly', desc: 'Cameras, a night man, passes on lanyards', outcome: 'Nobody gets in again and nobody wanders in either. The training ground stops feeling like somewhere the town has any business in.', effect: { coins: -120, squadMorale: -3, tag: 'mgr-fortress' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-bus-breaks-down', title: 'Hard Shoulder, Half Four', icon: '🚌', category: 'crisis',
    when: { minPos: 0.65 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach loses power on a slip road ninety minutes from the ground with the kick-off in two hours and twenty. Eighteen footballers standing on grass beside a motorway in club tracksuits, being photographed by everyone who passes.',
        choices: [
          { id: 'taxis', label: 'Get taxis, now', desc: 'Six cars, whatever it costs, and sort the kit after', outcome: 'They arrive with forty minutes to go and warm up in a car park. It is the best first half they play all season and they lose it in the last ten.', effect: { coins: -90, squadMorale: 6, prestige: 1 } },
          { id: 'wait', label: 'Wait for the replacement', desc: 'Stay together, stay calm, ask for a delay', outcome: 'The delay is granted. Kick-off goes back half an hour and the home crowd boo the warm-up, which the lads rather enjoy.', effect: { squadMorale: 4, prestige: -1 } },
          { id: 'walk-it', label: 'Turn it into the story', desc: 'Let them film it, laugh at it, use it all week', outcome: 'A photograph of the captain sat on a crash barrier eating a banana ends up on a wall in the club shop. They lose four-nil.', effect: { squadMorale: 8, boardMood: -1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-goalkeeper-crisis', title: 'No Recognised Keeper', icon: '🧤', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The first choice is in a brace to the knee. The second choice went out on loan in January and cannot be recalled. That leaves an eighteen-year-old with two reserve appearances and a full-back who kept goal at school.',
        choices: [
          { id: 'boy', label: 'Play the boy', desc: 'Tell him on Thursday, not Saturday', outcome: 'He makes one save in the first half that the crowd still talk about and one error in the second that costs the game. Both, forever.', effect: { playerMorale: { who: 'youngest', delta: 10 }, squadMorale: -2, boardMood: -1 } },
          { id: 'emergency', label: 'Sign a free agent on the Friday', desc: 'A thirty-six-year-old who was coaching under-tens on Wednesday', outcome: 'He is calm, loud, and organises a back four he met that morning. He also cannot get down for anything low.', effect: { coins: -140, squadMorale: 3, boardMood: 1 } },
          { id: 'outfield', label: 'Put the full-back in', desc: 'He volunteered, which is either brave or daft', outcome: 'He concedes three and gets a standing ovation. The dressing room would go anywhere for him now and he never plays there again.', effect: { squadMorale: 9, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-red-card-run-in', title: 'Sent Off In April', icon: '🟥', category: 'crisis',
    when: { minPos: 0.75, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best defender at the club raises an arm to an opponent forty yards from the ball, in front of a linesman, with the score level and four games left. Three-match ban. All three of them matter.',
        choices: [
          { id: 'appeal', label: 'Appeal it', desc: 'Everyone knows it will fail. Appeal it anyway.', outcome: 'It fails, and the extra game gets added for a frivolous claim. Four games now. The lad thanks him for trying, which is somehow worse.', effect: { boardMood: -1, playerMorale: { who: 'best', delta: 6 }, coins: -40 } },
          { id: 'public-hammer', label: 'Hammer him publicly', desc: 'Say what everyone in the ground is thinking', outcome: 'It is the right message to the rest of them and the wrong one to him. He plays the last game of the season like a man proving a point to one person.', effect: { playerMorale: { who: 'best', delta: -14 }, squadMorale: 4, prestige: 1 } },
          { id: 'shield', label: 'Take the blame himself', desc: 'Say he had him wound too tight', outcome: 'Nobody believes it and everybody appreciates it. The board notes a manager who will not discipline his own senior men.', effect: { squadMorale: 7, boardMood: -2, playerMorale: { who: 'best', delta: 10 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-floodlight-failure', title: 'The Lights Go', icon: '💡', category: 'crisis',
    when: { minPos: 0.65 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sixty-third minute, one-nil up, and the whole east side of the ground goes dark at once. Eleven thousand people make the same noise. Then they start singing, because there is nothing else to do.',
        choices: [
          { id: 'wait-out', label: 'Keep them on the pitch and wait', desc: 'Warm, ready, and out in the cold', outcome: 'Twenty-two minutes of standing about. When it restarts they are cold and the away side are not, and it finishes one-all.', effect: { squadMorale: -3, boardMood: -1 } },
          { id: 'inside', label: 'Take them in', desc: 'Warm room, tea, and re-do the team talk', outcome: 'He gets to say everything he wished he had said at half-time. They see it out. Whether the lights helped is not a question anyone asks.', effect: { squadMorale: 4, prestige: 1 } },
          { id: 'blame-board', label: 'Say afterwards what the ground needs', desc: 'Use the microphone to make a point about the wiring', outcome: 'It is true, it is overdue, and it makes the chairman look like a man who does not maintain his own house. In public.', effect: { boardMood: -2, prestige: 1, coins: 60 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-wages-late', title: 'The Twenty-Eighth', icon: '💸', category: 'crisis',
    when: { minPos: 0.7, maxCoins: 300, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Wages did not clear on the twenty-eighth. The kitman found out first because he always checks first. By eleven the next morning three players have asked and one has asked with an agent on the phone.',
        choices: [
          { id: 'truth', label: 'Tell them exactly where the club is', desc: 'Numbers, dates, no softening', outcome: 'Two of them offer to defer. One of them starts looking for a move that afternoon. Every man in the room now knows what he is playing for.', effect: { squadMorale: -6, prestige: 2, tag: 'mgr-told-them-truth' } },
          { id: 'reassure', label: 'Tell them it is a banking thing', desc: 'Buy a fortnight and hope it is true', outcome: 'It clears on the third. It is late again in February, and the second time nobody believes a word of the explanation.', effect: { squadMorale: 3, boardMood: 1, tag: 'mgr-fudged-it' } },
          { id: 'own-pocket', label: 'Cover the young ones himself', desc: 'The lads on nothing, out of his own account', outcome: 'It is four figures and it never gets mentioned again by him. It gets mentioned by them for twenty years.', effect: { coins: -70, squadMorale: 10, playerMorale: { who: 'youngest', delta: 16 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-six-pointer', title: 'The One That Actually Matters', icon: '⚔️', category: 'crisis',
    when: { minPos: 0.8, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The side directly below come on Saturday. Win and there is daylight. Lose and there is nothing at all. The week has been strange — everybody a bit too polite with each other.',
        choices: [
          { id: 'downplay', label: 'Treat it like any other game', desc: 'Same routine, same words, no mention of the table', outcome: 'Nobody mentions the table and everybody thinks about nothing else. They play like men who have been told not to think about a thing.', effect: { squadMorale: -2, boardMood: 0 } },
          { id: 'name-it', label: 'Name it for what it is', desc: 'Tell them the season is ninety minutes long now', outcome: 'Two of them are lifted by it and two of them are frozen by it. The two who are lifted score.', effect: { squadMorale: 6, prestige: 1 } },
          { id: 'terraces', label: 'Ask the supporters to make it a night', desc: 'Go on the local radio and ask for the ground to be full and loud', outcome: 'They meet the coach on the ring road with flares. It is the loudest the place has been in nine years and the referee cannot hear his own whistle.', effect: { squadMorale: 8, coins: 80, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-captain-collapse', title: 'The Captain Has Gone', icon: '🎽', category: 'crisis',
    when: { minPos: 0.7, minSeason: 3, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has been the best player at the club for four years and for nine weeks he has been a passenger. It is not fitness. He is first in every morning and he cannot pass forward.',
        choices: [
          { id: 'drop', label: 'Drop him', desc: 'Armband and all, in the middle of a fight', outcome: 'He takes it in a way that makes it worse — no argument, no sulk, just a man agreeing with you about himself.', effect: { playerMorale: { who: 'oldest', delta: -16 }, squadMorale: -3, boardMood: 1 }, next: 'later' },
          { id: 'ride', label: 'Play him through it', desc: 'He is worth more at forty per cent than most at full', outcome: 'Three more bad games. Then a header in the ninety-fourth minute at the wrong end of the country and eight hundred people who will never let it go.', effect: { playerMorale: { who: 'oldest', delta: 12 }, boardMood: -1 }, next: 'later' },
          { id: 'ask', label: 'Ask him what is wrong', desc: 'Sit in the car park at eight in the evening and just ask', outcome: 'It is his father. It has been his father since September and he had not told anybody at the club.', effect: { playerMorale: { who: 'oldest', delta: 14 }, squadMorale: 5, prestige: 1 }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'April. Whatever was decided in January is now a thing the dressing room has an opinion about, and the armband is still a question nobody has formally asked.',
        choices: [
          { id: 'keep', label: 'Leave the armband where it is', desc: 'Some things are worth more than form', outcome: 'The room reads it as loyalty. One or two read it as sentiment. Both readings are correct.', effect: { squadMorale: 5, playerMorale: { who: 'oldest', delta: 10 }, boardMood: -1 } },
          { id: 'move', label: 'Give it to somebody in his prime', desc: 'A quiet conversation, no announcement', outcome: 'It is handled well and it still hurts him. The new one grows six inches the first time he leads them out.', effect: { squadMorale: 3, playerMorale: { who: 'oldest', delta: -10 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-fans-protest', title: 'The Banner', icon: '🪧', category: 'crisis',
    when: { minPos: 0.78, minSeason: 2, forbidsTag: 'mgr-fans-favourite' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It goes up in the corner of the away end on the half hour, bedsheet and black paint, and it has his name on it. The stewards take twenty minutes to decide whether to take it down and by then it has been photographed four hundred times.',
        choices: [
          { id: 'walk-over', label: 'Applaud that corner at the whistle', desc: 'Walk the length of it and clap them', outcome: 'Some of them clap back. Some of them do not. It defuses about a third of it and makes the rest look mean-spirited.', effect: { prestige: 2, boardMood: 1 } },
          { id: 'ignore', label: 'Pretend it is not there', desc: 'No look, no comment, straight down the tunnel', outcome: 'It is up again the next week, bigger, and there are two of them.', effect: { boardMood: -2, prestige: -1, tag: 'mgr-under-siege' } },
          { id: 'meet', label: 'Invite them in on Tuesday', desc: 'The supporters trust, an hour, no press', outcome: 'They are more reasonable in a room than on a terrace and he is more honest than he meant to be. The banner does not come back.', effect: { prestige: 2, squadMorale: -2, boardMood: 1, tag: 'mgr-faced-the-fans' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-striker-drought', title: 'Eleven Games, No Goals', icon: '🥅', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has hit the post four times and had two disallowed and he has stopped going in for the ones that hurt. Yesterday he was last out of the shower by twenty-five minutes.',
        choices: [
          { id: 'rest-him', label: 'Take him out of the firing line', desc: 'Two games on the bench, nothing said publicly', outcome: 'He comes on for the last half hour of the second and scores with his first touch and does not celebrate. Nobody knows what to do with that.', effect: { playerMorale: { who: 'star', delta: -6 }, squadMorale: 2 } },
          { id: 'shooting', label: 'Keep him behind every afternoon', desc: 'Balls, a keeper, and an hour after everyone has gone', outcome: 'He is technically flawless on an empty pitch at four in the afternoon. Saturdays remain a different sport.', effect: { playerMorale: { who: 'star', delta: 4 }, squadMorale: -2 } },
          { id: 'penalty', label: 'Give him the next penalty whatever happens', desc: 'A goal is a goal and confidence does not check the manner', outcome: 'He puts it down the middle and roars at nobody in particular. Four more in three weeks. The regular taker does not speak to him until March.', effect: { playerMorale: { who: 'star', delta: 14 }, squadMorale: -4, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-away-humiliation', title: 'Five Nil, Away', icon: '📉', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It was three by the half hour. The travelling support sang for the whole second half in the way people sing when there is nothing else left to do, and then applauded the side off, which nobody in the dressing room can look at each other about.',
        choices: [
          { id: 'blast', label: 'Take the roof off in there', desc: 'Say the true things at the volume they deserve', outcome: 'Two of them go home and cannot sleep. It is the last bad performance of the season and one of them never plays for him again.', effect: { squadMorale: -8, boardMood: 1, prestige: 1, tag: 'mgr-blasted-them' } },
          { id: 'quiet', label: 'Say almost nothing', desc: 'Ninety seconds, flat voice, in on Monday at nine', outcome: 'The silence does more than shouting. On Monday they run themselves into the ground unasked.', effect: { squadMorale: -3, prestige: 1 } },
          { id: 'own-it', label: 'Take the whole thing on himself', desc: 'Tell the press he picked it, he set it, it is his', outcome: 'The players are protected and the board reads a man building a case for his own sacking. Which he may be.', effect: { squadMorale: 8, boardMood: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-cup-exit-minnows', title: 'Out To A Village Side', icon: '🪣', category: 'crisis',
    when: { minPos: 0.68 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A part-time side with a plumber at centre-half and a pitch that slopes four feet from one corner to the other. They are in front by the twentieth minute and they never look like giving it back.',
        choices: [
          { id: 'gracious', label: 'Be generous about them', desc: 'Into their dressing room afterwards, every hand shaken', outcome: 'It plays well everywhere except the coach home, where nineteen men sit in the dark and are furious with him for being nice.', effect: { prestige: 2, squadMorale: -5, coins: -100 } },
          { id: 'fine', label: 'Fine the lot of them a week', desc: 'Every man who was on that pitch', outcome: 'Legally shaky, morally satisfying, and it makes the union of the dressing room stronger against him rather than against losing.', effect: { squadMorale: -10, coins: 60, boardMood: 1 } },
          { id: 'use-it', label: 'Play the tape all week', desc: 'The goal, on a loop, in the room where they eat', outcome: 'By Wednesday somebody has covered the screen with a towel. By Saturday they beat a better side by three.', effect: { squadMorale: -4, boardMood: 2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-training-fight', title: 'It Went Off On Pitch Two', icon: '🥊', category: 'crisis',
    when: { minPos: 0.68, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tackle, a word, and then the two of them on the floor by the far goal with eight men trying to get in between. One is the top scorer. One is a twenty-year-old who has played eleven minutes all season.',
        choices: [
          { id: 'both-out', label: 'Both of them out of Saturday', desc: 'Same punishment, no rank', outcome: 'The squad understand the message and the top scorer understands a different one. They lose one-nil and he watches it from the stand with his arms folded.', effect: { squadMorale: 5, playerMorale: { who: 'star', delta: -12 }, boardMood: -1 } },
          { id: 'young-out', label: 'Punish the young one only', desc: 'He swung first and the side needs the other on Saturday', outcome: 'Everybody in the building can do that arithmetic. It is dressed up as discipline and read as a price list.', effect: { squadMorale: -7, playerMorale: { who: 'youngest', delta: -14 }, boardMood: 1 } },
          { id: 'nothing', label: 'Let it be', desc: 'Men fall out. It was a Tuesday.', outcome: 'They are fine by Thursday. Two months later somebody else throws a punch and there is now no line at all to point at.', effect: { squadMorale: 3, tag: 'mgr-no-line' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-star-wants-out-midseason', title: 'He Wants Out In January', icon: '🚪', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Third in the table on the day he signed and fourth from bottom on the day he asks. The agent has been careful to say it is nothing personal, which is a thing people say when it is entirely personal.',
        choices: [
          { id: 'sell', label: 'Take the money', desc: 'A player who does not want to be here is a passenger with a wage', outcome: 'The fee is decent and the side is worse and the money sits in an account while the manager tries to sign anybody in January.', effect: { coins: 400, squadMorale: -6, boardMood: 2 } },
          { id: 'refuse', label: 'Refuse point blank', desc: 'Not in January, not at any price, go and train', outcome: 'He sulks for a fortnight and plays like an animal for three months, out of spite. The club survives on his spite.', effect: { playerMorale: { who: 'star', delta: -12 }, squadMorale: 4, boardMood: -1, tag: 'mgr-kept-him' } },
          { id: 'deal', label: 'Do a deal with him privately', desc: 'Stay until May and he can go with the club\'s blessing', outcome: 'He gives everything for five months. In May he goes for less than he was worth in January and the terraces never understand why.', effect: { playerMorale: { who: 'star', delta: 8 }, coins: 220, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-board-sounding-out', title: 'A Name On A List', icon: '📋', category: 'crisis',
    when: { minPos: 0.8, minSeason: 3, requiresTag: 'mgr-under-siege' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A journalist rings, not to ask a question but to do him a favour. Two directors met a man in a hotel near the airport on Tuesday. The chairman has said publicly that the manager has his full support, which everyone understands to be a fixture in the calendar rather than a statement.',
        choices: [
          { id: 'confront', label: 'Walk into the boardroom and ask', desc: 'Straight in, no appointment, one question', outcome: 'They deny it badly. He now knows exactly where he stands and so do they, and there is no way back from a room like that.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-confronted-board' } },
          { id: 'work', label: 'Say nothing and work', desc: 'Nothing changes about Tuesday morning', outcome: 'He takes an ordinary session and it is the calmest anybody has seen him. Three of the senior men notice and mention it to each other.', effect: { squadMorale: 6, prestige: 1 } },
          { id: 'leak', label: 'Let the dressing room know', desc: 'Tell them before a website does', outcome: 'They play the next game for him rather than for the club, which is a magnificent and slightly dangerous thing to have engineered.', effect: { squadMorale: 12, boardMood: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-physio-walkout', title: 'The Medical Staff Resign', icon: '🧑‍⚕️', category: 'crisis',
    when: { minPos: 0.72, minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Both physios hand in notice on the same afternoon, which is not a coincidence and not about money. It is about being overruled on three players in eight weeks.',
        choices: [
          { id: 'apologise', label: 'Admit he overruled them', desc: 'In front of the staff, out loud', outcome: 'One stays. The other has already signed elsewhere. The rule after that is that the medical department has the final word, and it costs him a striker in March.', effect: { squadMorale: 6, boardMood: -1, prestige: 1, tag: 'mgr-medics-decide' } },
          { id: 'accept', label: 'Accept both and rebuild', desc: 'New people, his people, his way', outcome: 'The new pair are keen and do not know any of the bodies in the room. It takes until Christmas to learn what the old ones knew about a hamstring.', effect: { coins: -100, squadMorale: -5 } },
          { id: 'board-fix', label: 'Ask the board to pay them more', desc: 'Make it about money because money is fixable', outcome: 'They stay for the money and they stop arguing, which is exactly the wrong outcome dressed as the right one.', effect: { coins: -140, squadMorale: 2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-team-sheet-leak', title: 'They Knew The Side', icon: '📰', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The line-up is on a forum at ten past eleven on the Saturday morning, correct to the last substitute, ninety minutes before it goes on the wall. Second time in a month.',
        choices: [
          { id: 'hunt', label: 'Find out who', desc: 'Phones, timings, and a list of who was in the room', outcome: 'It is not a player. It is somebody\'s brother-in-law with a laminate. Two people lose jobs and the building never relaxes again.', effect: { squadMorale: -6, prestige: 1, tag: 'mgr-hunted-the-leak' } },
          { id: 'false', label: 'Feed them a wrong one', desc: 'Name a side he has no intention of playing', outcome: 'It appears online. He changes three at the last minute and the away side spend the first twenty minutes marking men who are not on the pitch.', effect: { boardMood: 1, prestige: 1, squadMorale: 3 } },
          { id: 'late', label: 'Stop naming it until an hour before', desc: 'Nobody knows anything, including the players', outcome: 'The leak stops. So does any chance of a man preparing properly for the job he is about to be given.', effect: { squadMorale: -4, prestige: 0, tag: 'mgr-late-team-sheets' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-flooded-training', title: 'Under Four Inches', icon: '🌊', category: 'crisis',
    when: { minPos: 0.66 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The river came over on Thursday night and all three grass pitches are under water with a shopping trolley visible on the far one. Nobody trains here for six weeks.',
        choices: [
          { id: 'hire', label: 'Hire a facility across town', desc: 'A pay-and-play astro with a padlocked changing block', outcome: 'They train on rubber crumb for six weeks and everybody has a sore back. It is not ideal and it is uninterrupted, which matters more.', effect: { coins: -160, squadMorale: -2 } },
          { id: 'ask-rival', label: 'Ring the club up the road', desc: 'Ask a favour of people who owe none', outcome: 'They say yes, generously, and the whole of that town knows about it within an hour. The lads train with an audience of schoolchildren.', effect: { coins: -40, prestige: -1, squadMorale: 4 } },
          { id: 'beach', label: 'Take them to the sand for a fortnight', desc: 'Running, football, and no tactics at all', outcome: 'They are the fittest they have been in years and they have not defended a set-piece since October.', effect: { squadMorale: 9, coins: -60, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-transfer-embargo', title: 'Embargoed', icon: '⛔', category: 'crisis',
    when: { minPos: 0.72, maxCoins: 250, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A letter arrives on club paper from people who do not send good news. No registrations until the accounts are right. The window opens in nine days and the squad is fourteen fit men.',
        choices: [
          { id: 'academy', label: 'Turn to the academy entirely', desc: 'Promote four and mean it', outcome: 'Two of the four are out of their depth and two of them are not. The two who are not become the spine of the next three seasons.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: 3, boardMood: -1, tag: 'mgr-academy-forced' } },
          { id: 'sell-to-fix', label: 'Sell somebody to clear it', desc: 'Whoever raises the number fastest', outcome: 'The embargo lifts in a fortnight and the best defender at the club is playing somewhere warmer. He can sign now and has nobody worth signing.', effect: { coins: 320, squadMorale: -8, playerMorale: { who: 'best', delta: -6 } } },
          { id: 'public', label: 'Say it out loud in a press conference', desc: 'Explain, in detail, whose mess this is', outcome: 'The supporters direct their anger upwards for once. The board directs theirs at a manager who cannot keep club business in the building.', effect: { boardMood: -3, prestige: 2, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-loans-recalled', title: 'Both Loans Recalled', icon: '↩️', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two phone calls in one morning. The parent clubs want them back — one injured at home, one because a manager got sacked and a new one likes him. That is the left side of the side gone by Friday.',
        choices: [
          { id: 'plead', label: 'Get on the phone and beg', desc: 'Call in every favour he has and some he does not', outcome: 'One of them stays till the end of the season. The favour is now owed the other way and it will be called in at the worst possible moment.', effect: { squadMorale: 4, prestige: -1, tag: 'mgr-owes-a-favour' } },
          { id: 'reshape', label: 'Change the shape entirely', desc: 'Three at the back, because there is no left side any more', outcome: 'It is ugly for two games and then it is the best they play all year. He keeps it for four seasons.', effect: { squadMorale: 2, boardMood: 1, prestige: 1 } },
          { id: 'burn', label: 'Say what he thinks of loan football', desc: 'On the record, at length', outcome: 'It is quoted approvingly by supporters everywhere and it means the club gets offered nobody decent for two windows.', effect: { prestige: 2, coins: -80, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-agent-tapping', title: 'The Agent Has Been Busy', icon: '📞', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three of the squad share an agent and all three have gone strange in the same fortnight. One has asked about his release clause. One has stopped doing the extras. One has bought a house two hundred miles away.',
        choices: [
          { id: 'ban', label: 'Ban him from the building', desc: 'No passes, no car park, no exceptions', outcome: 'It is satisfying and it is useless. He does his work in a hotel lobby instead and now has a grievance to sell them.', effect: { squadMorale: -4, prestige: 1, tag: 'mgr-agent-war' } },
          { id: 'sit-down', label: 'Sit down with him', desc: 'A long lunch with a man he does not like', outcome: 'They find they want two of the same three things. One of the three players signs a new deal that afternoon.', effect: { playerMorale: { who: 'best', delta: 10 }, coins: -120, prestige: -1 } },
          { id: 'players', label: 'Go round him to the players', desc: 'Three individual conversations, no representatives', outcome: 'Two of them are relieved to be asked directly. The third repeats every word of it down the phone that evening.', effect: { squadMorale: 3, playerMorale: { who: 'unhappiest', delta: -8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-academy-threat', title: 'They Want To Close The Academy', icon: '🏫', category: 'crisis',
    when: { minPos: 0.75, minSeason: 3, temper: ['builder', 'players-manager', 'disciplinarian'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is item seven on an agenda and it is phrased as a review. Closing the academy saves the club roughly what it is currently losing, which is the entire argument in one sentence.',
        choices: [
          { id: 'fight', label: 'Fight it in the room', desc: 'Names, numbers, and every graduate on the wall', outcome: 'He wins the vote by one and makes an enemy of the finance director, who is patient and has a long memory.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-saved-academy', clubLegacy: { kind: 'tradition', label: 'the academy the board voted to keep' } } },
          { id: 'trade', label: 'Offer to fund it from transfers', desc: 'Sell one a year and the thing pays for itself', outcome: 'They accept and hold him to it exactly. Every summer from now on somebody good has to go, and everybody knows the reason.', effect: { boardMood: 2, coins: 200, squadMorale: -4, tag: 'mgr-selling-club' } },
          { id: 'let-go', label: 'Let it close', desc: 'Fight the battles that keep him in a job', outcome: 'Forty-one boys are written to in August. Two of them are playing in the top flight within six years, for other people.', effect: { boardMood: 2, coins: 160, prestige: -3, clubLegacy: { kind: 'reputation', label: 'the club that closed its academy' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-christmas-pileup', title: 'Boxing Day, Away', icon: '🎄', category: 'crisis',
    when: { minPos: 0.68 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three games in seven days over Christmas and two of them are long trips. The hotel is booked for the twenty-fifth. Eleven of the squad have children under six.',
        choices: [
          { id: 'families', label: 'Bring the families to the hotel', desc: 'Costs a fortune, buys something you cannot buy otherwise', outcome: 'There are toddlers in the team meeting and it is chaos and the room is warmer for six months afterwards.', effect: { coins: -150, squadMorale: 12, boardMood: -1 } },
          { id: 'strict', label: 'Normal preparation, no exceptions', desc: 'It is a job. The job is on the twenty-sixth.', outcome: 'They are professional and flat, and they win one-nil with a set-piece. Nobody sings on the coach either way.', effect: { squadMorale: -4, boardMood: 1, prestige: 1 } },
          { id: 'home-day', label: 'Give them Christmas Day at home', desc: 'Travel on the morning of the game and take the risk', outcome: 'Traffic. They arrive fifty minutes before kick-off having been in a car since six and lose to a goal in the third minute.', effect: { squadMorale: 6, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-sponsor-pulls-out', title: 'The Sponsor Goes Under', icon: '🧾', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2, facility: { key: 'shop', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The name on the front of the shirt went into administration on the Wednesday. Twelve thousand replica tops in the club shop now advertise a company that no longer exists, and the payment due in January will not arrive.',
        choices: [
          { id: 'local', label: 'Find somebody local by Saturday', desc: 'Any name, any size, so long as the money is real', outcome: 'A haulage firm from the industrial estate. A quarter of the money and a man in the directors\' box who genuinely cries at the first goal.', effect: { coins: 120, prestige: -1, boardMood: 1 } },
          { id: 'blank', label: 'Play in blank shirts', desc: 'Nothing on the front until the right deal turns up', outcome: 'It looks superb and it costs the club a whole season of front-of-shirt money. The supporters want the plain shirt kept forever.', effect: { coins: -100, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the plain shirt season' } } },
          { id: 'anything', label: 'Take the first offer on the table', desc: 'A firm nobody in the town approves of', outcome: 'The money is good and there is a small, permanent grumble in the terraces about what the club will put its name to.', effect: { coins: 300, prestige: -2, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-defensive-collapse', title: 'Nineteen In Six', icon: '🕳️', category: 'crisis',
    when: { minPos: 0.75, minSeason: 2, temper: ['tactician', 'disciplinarian', 'firefighter'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nineteen conceded in six games. It is not one man and it is not one mistake. It is the whole back half of the side standing in slightly the wrong places, together, repeatedly.',
        choices: [
          { id: 'drill', label: 'Two weeks of nothing but shape', desc: 'No balls for an hour a day. Just walking to the right spot.', outcome: 'It is the most boring fortnight of their professional lives and they concede once in the next five.', effect: { squadMorale: -6, boardMood: 2, prestige: 2 } },
          { id: 'personnel', label: 'Change three of the back five', desc: 'New faces, no sentiment', outcome: 'It is better and it is different rather than fixed, and three experienced men now sit in the stand watching a problem they know how to solve.', effect: { squadMorale: -3, playerMorale: { who: 'oldest', delta: -10 }, boardMood: 1 } },
          { id: 'sit-deep', label: 'Drop the whole side twenty yards', desc: 'Ugly, safe, and nobody enjoys watching it', outcome: 'Four goalless draws. The table looks better and the ground is quieter than it has been in a decade.', effect: { boardMood: 2, coins: -60, prestige: -1, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-player-arrested', title: 'A Call At Four In The Morning', icon: '🚔', category: 'crisis',
    when: { minPos: 0.68, minSeason: 3 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A duty solicitor rings the club\'s emergency line. One of the squad, a town-centre pavement, and nobody seriously hurt. He will be released without charge by lunchtime and photographed on the way out.',
        choices: [
          { id: 'collect', label: 'Go and get him himself', desc: 'The manager\'s own car, at half four in the morning', outcome: 'They drive back in silence and the lad cries somewhere near the ring road. He is never late for anything again as long as he is at the club.', effect: { playerMorale: { who: 'unhappiest', delta: 18 }, squadMorale: 6, prestige: -1 } },
          { id: 'club-line', label: 'Hand it to the club\'s people', desc: 'Process, statement, distance', outcome: 'It is handled correctly and coldly and he plays on Saturday like a man who has been handled by a department.', effect: { boardMood: 1, playerMorale: { who: 'unhappiest', delta: -8 } } },
          { id: 'drop-him', label: 'Out of the squad until it is clear', desc: 'Whatever the outcome, he was there at three in the morning', outcome: 'It is defensible in every direction and it costs the side its best runner in a game they lose narrowly.', effect: { squadMorale: -3, boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-signing-flop', title: 'The Signing Cannot Play', icon: '🫥', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Record fee, eleven starts, no goals, and a first touch that has begun to draw a noise from the ground. He is a good lad. He is trying too hard. He is not going to come good here.',
        choices: [
          { id: 'stick', label: 'Keep picking him', desc: 'The fee is spent either way, and he might turn', outcome: 'Game fourteen he scores twice. Game fifteen he is anonymous again. The manager has now tied himself to it publicly.', effect: { playerMorale: { who: 'unhappiest', delta: 10 }, boardMood: -2, squadMorale: -3 } },
          { id: 'bench', label: 'Take him out of it', desc: 'Nothing said, just not on the sheet', outcome: 'The relief on his face in training is the worst part. He is a better player at the club with no shirt than he was with one.', effect: { playerMorale: { who: 'unhappiest', delta: -6 }, squadMorale: 2, boardMood: 1 } },
          { id: 'admit', label: 'Say publicly it was his mistake', desc: 'His signing, his error, and the lad is not to blame', outcome: 'It takes the ground off the player\'s back entirely. It also hands the board a written confession for a file.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, boardMood: -2, prestige: 1, squadMorale: 5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-assistant-wants-job', title: 'The Number Two', icon: '🪑', category: 'crisis',
    when: { minPos: 0.8, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has been loyal for four years and he has been mentioned in two newspapers this week as the man who would steady it. He has not said a word about either mention, which is itself a kind of statement.',
        choices: [
          { id: 'ask-him', label: 'Ask him straight', desc: 'Two chairs, no witnesses', outcome: 'He says he would take it if it was offered and that he would rather it was not. Both of them are relieved and neither is comfortable again.', effect: { prestige: 1, squadMorale: -2, tag: 'mgr-assistant-honest' } },
          { id: 'promote', label: 'Give him the games he wants', desc: 'Let him take the team talks and the touchline for a month', outcome: 'The lads respond to a new voice and the results improve, which makes the argument for replacing the manager considerably stronger.', effect: { squadMorale: 7, boardMood: -1 } },
          { id: 'freeze', label: 'Cut him out of everything', desc: 'No selection, no meetings, no clips', outcome: 'The staff room splits down the middle and everyone in the building can feel it by Thursday.', effect: { squadMorale: -6, prestige: -1, tag: 'mgr-staff-split' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-pitch-invasion', title: 'They Came On At The End', icon: '🚧', category: 'crisis',
    when: { minPos: 0.78, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A hundred or so come over the wall at the final whistle and they are not celebrating. Most of them get no further than the centre circle. Two get to the tunnel mouth and the goalkeeper stands between them and a nineteen-year-old.',
        choices: [
          { id: 'condemn', label: 'Condemn it flatly', desc: 'No context, no sympathy, no excuses offered', outcome: 'It is the correct thing to say and it makes him, for a fortnight, the enemy of people who used to be on his side.', effect: { prestige: 2, boardMood: 2, squadMorale: 3, coins: -80 } },
          { id: 'understand', label: 'Say he understands the anger', desc: 'Condemn the act, not the feeling', outcome: 'A tricky line, walked reasonably well. The governing body reads it as a manager excusing a pitch invasion and fines the club anyway.', effect: { coins: -140, prestige: 1, squadMorale: -2 } },
          { id: 'players-first', label: 'Talk only about the goalkeeper', desc: 'One man, one act, and nothing else', outcome: 'The picture of him with his arms out in front of the boy is on the front of the programme for the rest of the season.', effect: { squadMorale: 10, playerMorale: { who: 'oldest', delta: 12 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-penalty-misses', title: 'Three In A Row', icon: '🎯', category: 'crisis',
    when: { minPos: 0.7 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three penalties missed in five weeks by three different men. The third one was taken by somebody who had clearly not decided which corner he wanted until he was two paces away.',
        choices: [
          { id: 'designate', label: 'Name one taker and stick to it', desc: 'One man, whatever happens, no arguments on the pitch', outcome: 'He scores four and misses one, and the one he misses is in a game they needed, and he takes the next one anyway.', effect: { squadMorale: 3, boardMood: 1, prestige: 1 } },
          { id: 'competition', label: 'Make them earn it every week', desc: 'Friday afternoon, twenty each, best record takes them', outcome: 'It becomes the highlight of the week and it produces a taker who is superb on an empty Friday pitch.', effect: { squadMorale: 6, boardMood: -1 } },
          { id: 'ignore-it', label: 'Refuse to make it a thing', desc: 'Mention it once, never again', outcome: 'They score the next two. Whether that is his handling or simple arithmetic is unknowable and he takes the credit anyway.', effect: { squadMorale: 2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-radio-phone-in', title: 'The Phone-In', icon: '📻', category: 'crisis',
    when: { minPos: 0.78, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two hours of local radio after a home defeat and eleven callers out of twelve want him gone. The twelfth is his old chairman from two clubs ago, who does not say who he is.',
        choices: [
          { id: 'go-on', label: 'Ring in himself', desc: 'Live, unannounced, and take the calls', outcome: 'Forty minutes of it. He answers everything, badly in two places and very well in one, and the mood in the town shifts about ten degrees.', effect: { prestige: 2, boardMood: -1, squadMorale: 4 } },
          { id: 'off', label: 'Ban the station from the ground', desc: 'No access, no interviews, nothing', outcome: 'It becomes a bigger story than the defeat and the club looks thin-skinned in every paper in the region.', effect: { prestige: -2, boardMood: -2, coins: -40 } },
          { id: 'nothing', label: 'Never listen to it', desc: 'Radio off, car quiet, get on with Tuesday', outcome: 'His wife hears it. His son hears it in a car park. He hears about it anyway, at second hand, which is worse.', effect: { squadMorale: 0, prestige: 0, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-goalless-run', title: 'Six Hours Without A Goal', icon: '🚫', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three hundred and sixty-one minutes. The ground has started to groan when the ball goes back to the keeper, which is a sound that gets into players\' legs.',
        choices: [
          { id: 'two-up', label: 'Play two up top and take the risk', desc: 'Concede more, score some', outcome: 'Four-three, three-two, two-two. Entertainment, five points from four games, and a defence that has stopped trusting anybody in front of it.', effect: { squadMorale: 6, boardMood: -1, coins: 60 } },
          { id: 'set-pieces', label: 'Win it from set-pieces', desc: 'An hour a day on corners until somebody scores', outcome: 'Two headers in a fortnight and a way of playing that nobody will pay to watch twice.', effect: { boardMood: 1, prestige: -1, squadMorale: 2 } },
          { id: 'free-them', label: 'Tell them to stop thinking', desc: 'No instructions in the final third at all', outcome: 'It is loose and chaotic and they score three in a half. It is also unrepeatable and he knows it.', effect: { squadMorale: 8, boardMood: 1, tag: 'mgr-let-them-play' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-veteran-refuses-bench', title: 'He Will Not Sit Down', icon: '🪑', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three hundred and eleven appearances and he has been named as a substitute for the first time since he was twenty-two. He reads the sheet, turns round, and asks in front of everybody whether the manager is serious.',
        choices: [
          { id: 'authority', label: 'Answer him in front of them', desc: 'Whatever happens next, it happens here', outcome: 'It is settled in ninety seconds and it is never quite settled at all. He sits on the bench with his arms folded for eleven weeks.', effect: { playerMorale: { who: 'oldest', delta: -16 }, squadMorale: 4, prestige: 2 } },
          { id: 'corridor', label: 'Take it outside', desc: 'Say nothing now, everything in ten minutes', outcome: 'It goes on for an hour in a corridor and ends with two men who understand each other and one of them still not playing.', effect: { playerMorale: { who: 'oldest', delta: -4 }, squadMorale: 1, prestige: 1 } },
          { id: 'back-down', label: 'Put him back in', desc: 'Not worth the war, not this week', outcome: 'The rest of the room learns the exact size of a certain player\'s authority, and it is bigger than the manager\'s.', effect: { playerMorale: { who: 'oldest', delta: 12 }, squadMorale: -7, prestige: -2, tag: 'mgr-backed-down' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-two-divisions-drop', title: 'Back-To-Back Relegations', icon: '⬇️', category: 'crisis',
    when: { minPos: 0.85, minSeason: 4, minTier: 2 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is mathematically done with two games left, for the second year running. The club shop has half-price everything in the window and there is a queue, which somehow makes it worse.',
        choices: [
          { id: 'resign-offer', label: 'Offer his resignation', desc: 'On the desk, unprompted, that afternoon', outcome: 'They refuse it, which surprises him and everybody else. He is now here on their sufferance and both parties know the terms.', effect: { boardMood: 2, prestige: 1, squadMorale: -3 } },
          { id: 'rebuild-plan', label: 'Put a three-year plan in writing', desc: 'Wages, ages, and a promise about the academy', outcome: 'It is a serious document and it survives him. Two managers later somebody finds it in a drawer and follows it.', effect: { boardMood: 1, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the plan written in the worst season' } } },
          { id: 'clear-out', label: 'Tell every senior player he is available', desc: 'Wipe the wage bill and start again from nothing', outcome: 'Nine leave in one summer. The dressing room is young and cheap and completely unrecognisable, and somebody will get the credit for it in three years.', effect: { coins: 380, squadMorale: -10, boardMood: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-derby-defeat-heavy', title: 'Beaten At Home By Them', icon: '😖', category: 'crisis',
    when: { minPos: 0.7, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four goals, at home, to the club everybody in this town measures itself against. Their supporters are still in the ground twenty minutes after the whistle because the stewards will not open the gates and because they do not want to leave.',
        choices: [
          { id: 'apologise', label: 'Apologise to the town', desc: 'Not to the board. To the people who work all week for this.', outcome: 'It is the only thing that could have been said and it buys about six weeks of patience.', effect: { prestige: 1, boardMood: -1, squadMorale: -2 } },
          { id: 'punish', label: 'In at seven on Sunday', desc: 'A hard morning, no ball, no talking', outcome: 'Two of them are sick behind the goal. It changes nothing about the four goals and everything about the next three months.', effect: { squadMorale: -6, boardMood: 1, prestige: 1 } },
          { id: 'promise', label: 'Promise the return fixture', desc: 'Say out loud what will happen in March', outcome: 'A hostage handed over willingly. Every training session between now and March has a date written on the whiteboard.', effect: { squadMorale: 8, prestige: -1, tag: 'mgr-promised-revenge' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-stand-closed', title: 'The Safety Certificate', icon: '🧱', category: 'crisis',
    when: { minPos: 0.68, minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The old side terrace fails an inspection on a Thursday. Two thousand two hundred people who have stood in the same square yard for thirty years are told by letter that they cannot on Saturday.',
        choices: [
          { id: 'spend', label: 'Find the money to fix it now', desc: 'Whatever the works cost, out of the football budget', outcome: 'It reopens in nine weeks and there is no money for a striker in January. Nobody in that terrace ever forgets which was chosen.', effect: { coins: -320, prestige: 2, squadMorale: -3, clubLegacy: { kind: 'stand', label: 'the terrace that was saved' } } },
          { id: 'relocate', label: 'Move them into the main stand', desc: 'Seats, for people who have never sat down', outcome: 'They stand in front of the seats. The stewards give up by twenty past three and the atmosphere is oddly better.', effect: { coins: -40, squadMorale: 3 } },
          { id: 'close', label: 'Leave it shut for the season', desc: 'Cheaper, safer, and quieter in every sense', outcome: 'The gate drops, the noise drops, and the away support can be heard clearly for the first time in living memory.', effect: { coins: -180, squadMorale: -4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-firefighter-arrival-mess', title: 'Somebody Else\'s Mess', icon: '🧯', category: 'crisis',
    when: { minPos: 0.8, temper: ['firefighter', 'chancer'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Bottom four, nine games gone, and a squad assembled by a man with three different ideas about football. There is no shape to undo because there was never a shape.',
        choices: [
          { id: 'simplify', label: 'Give them three rules', desc: 'Three. Written on a board. Nothing else all week.', outcome: 'They are unrecognisable within a fortnight and they are also a side that can do exactly three things.', effect: { squadMorale: 8, boardMood: 2, prestige: 1 } },
          { id: 'cull', label: 'Pick the eleven who care', desc: 'Not the best eleven. The eleven who ran back on Saturday.', outcome: 'Four good players are in the stand and a side that runs is on the pitch, and it works until the good players are needed.', effect: { squadMorale: 4, playerMorale: { who: 'best', delta: -12 }, boardMood: 1 } },
          { id: 'honest-board', label: 'Tell the board it will take two years', desc: 'On day nine, in writing', outcome: 'They appreciate the honesty in the room and remember only the two years when the results do not come by Easter.', effect: { boardMood: -1, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-kit-mixup', title: 'Wrong Kit, Wrong Ground', icon: '👕', category: 'crisis',
    when: { minPos: 0.66 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The away side turn up in a colour that clashes and so does the change strip. It is forty minutes to kick-off and somebody is sent to the club shop with a key and a trolley.',
        choices: [
          { id: 'shop-kit', label: 'Play in shop replicas', desc: 'Numbers in marker pen on the back', outcome: 'They look ridiculous and they win two-nil and a photograph of the hand-drawn number nine ends up framed behind the bar.', effect: { squadMorale: 8, coins: -30, clubLegacy: { kind: 'tradition', label: 'the marker-pen shirts' } } },
          { id: 'delay', label: 'Delay kick-off and send for the proper set', desc: 'Somebody drives to the training ground and back', outcome: 'Twenty-five minutes late, a cold crowd, and a flat first half from a side that had peaked in the warm-up.', effect: { squadMorale: -3, coins: -20, prestige: -1 } },
          { id: 'row', label: 'Make it the other club\'s problem', desc: 'Argue it out with a referee who does not care', outcome: 'He wins the argument on the letter of the rule and the visitors change instead, furious. That fixture is spiky for a decade.', effect: { prestige: 1, boardMood: 1, clubLegacy: { kind: 'rivalry', label: 'the kit-clash grudge' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-crowd-turns-on-player', title: 'They Have Picked One', icon: '👤', category: 'crisis',
    when: { minPos: 0.74, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Every touch he takes now draws a noise. It started with one bloke behind the dugout in October and it has spread across the whole of that side of the ground, and the lad has started hiding from the ball.',
        choices: [
          { id: 'start-him', label: 'Start him at home again', desc: 'Same shirt, same position, straight back into it', outcome: 'The first ten minutes are horrible for everybody. Then he wins a header and about four hundred people applaud out of guilt.', effect: { playerMorale: { who: 'unhappiest', delta: 12 }, squadMorale: 4, boardMood: -1 } },
          { id: 'away-only', label: 'Play him away from home only', desc: 'Protect him from his own ground', outcome: 'He is a good footballer on the road for three months. It is a kindness and it is also an admission everybody can read.', effect: { playerMorale: { who: 'unhappiest', delta: 4 }, prestige: -1 } },
          { id: 'defend-publicly', label: 'Go after the crowd in the press', desc: 'Say plainly what they are doing to a young man', outcome: 'The noise stops. A different noise starts, aimed at the man who told supporters how to support.', effect: { playerMorale: { who: 'unhappiest', delta: 16 }, prestige: -2, squadMorale: 6 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-thin-squad-window-shut', title: 'Fourteen Fit Men', icon: '🩹', category: 'crisis',
    when: { minPos: 0.72, needs: 'thin-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The window shut on Monday and there are fourteen outfield players who can complete a session. Two of the substitutes on Saturday will be goalkeepers and one of them will be seventeen.',
        choices: [
          { id: 'free-agents', label: 'Look at whoever is out of contract', desc: 'Men who have not played since May, on week-to-week deals', outcome: 'Three trialists, one of whom is a genuine footballer who had given up. He plays thirty games and is the story of the season.', effect: { coins: -80, squadMorale: 5, boardMood: 1 } },
          { id: 'load-manage', label: 'Manage the loads and accept the results', desc: 'Nobody breaks, even if that means dropping points', outcome: 'Nobody breaks. They take twelve points from ten games and finish the season with the same fourteen men standing up.', effect: { squadMorale: 4, boardMood: -2, prestige: 1 } },
          { id: 'youth-team', label: 'Empty the youth team into the first team', desc: 'Seven boys training with the seniors from Monday', outcome: 'The standard of training drops off a cliff and two of the boys are never intimidated by a first-team dressing room again.', effect: { playerMorale: { who: 'youngest', delta: 12 }, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-ultras-boycott', title: 'The Empty Corner', icon: '🕳️', category: 'crisis',
    when: { minPos: 0.8, minSeason: 3, requiresTag: 'mgr-under-siege' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The group that makes all the noise announce they will not attend until the board go. Saturday, the corner is nine hundred empty seats and the rest of the ground can hear itself breathing.',
        choices: [
          { id: 'side-with', label: 'Say he misses them', desc: 'Publicly, warmly, without endorsing the demand', outcome: 'They are back for the next home game with a banner about the manager rather than the board. The chairman reads all of it.', effect: { squadMorale: 6, boardMood: -2, coins: 60 } },
          { id: 'neutral', label: 'Refuse to be drawn', desc: 'It is not his business who supporters are angry with', outcome: 'It is the professional answer and both sides file him under useless. The corner stays empty for two months.', effect: { coins: -100, prestige: 0, squadMorale: -3 } },
          { id: 'kids-in', label: 'Fill the corner with schoolchildren', desc: 'Free tickets, local schools, a coach each', outcome: 'It is loud in a completely different register and eleven hundred kids see a football match. Some of the group never quite forgive it.', effect: { coins: -60, squadMorale: 5, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the schools corner' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-video-leak-row', title: 'Somebody Filmed It', icon: '📱', category: 'crisis',
    when: { minPos: 0.72, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fourteen seconds of him at half-time, shouting, filmed through a doorway by somebody with a laminate. The audio is clear enough. Two of the things he says about a player are entirely accurate and completely unrepeatable.',
        choices: [
          { id: 'own-it', label: 'Confirm every word of it', desc: 'Yes, he said it, and here is why', outcome: 'It is oddly popular outside the club and it is a nightmare inside it. The player concerned reads a transcript of his manager on his own phone.', effect: { prestige: 2, playerMorale: { who: 'unhappiest', delta: -16 }, squadMorale: -4 } },
          { id: 'apologise-privately', label: 'Apologise to the player only', desc: 'No statement, one conversation, done properly', outcome: 'The lad accepts it and means it. Externally the silence is read as guilt for a fortnight and then forgotten.', effect: { playerMorale: { who: 'unhappiest', delta: 12 }, squadMorale: 5, prestige: -1 } },
          { id: 'lawyers', label: 'Put the club\'s lawyers on it', desc: 'Take it down, find the phone, make an example', outcome: 'It comes down from one place and appears in six others. Everybody in the building now knows the club will go legal on its own staff.', effect: { coins: -100, squadMorale: -5, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-last-day-survival', title: 'The Last Afternoon', icon: '⏳', category: 'crisis',
    when: { minPos: 0.82, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It comes down to one game and results elsewhere. Somebody has brought a radio into the dugout and somebody else has told him to put it away, and it is on anyway, in a coat pocket, all afternoon.',
        choices: [
          { id: 'blind', label: 'Coach the game and nothing else', desc: 'No scores, no radio, no glancing at the away end', outcome: 'They play the game in front of them and win it, and only find out in the tunnel that they needed to.', effect: { squadMorale: 10, prestige: 2, boardMood: 2 }, next: 'after' },
          { id: 'inform', label: 'Tell them everything as it happens', desc: 'Every goal elsewhere, relayed to the pitch', outcome: 'They defend a lead for twenty-five minutes because they know it is enough, and it is the longest twenty-five minutes any of them will live through.', effect: { squadMorale: 6, boardMood: 1 }, next: 'after' },
          { id: 'gamble', label: 'Go for the win regardless', desc: 'Three up top from the hour, whatever the radio says', outcome: 'Two goals in nine minutes and a defence that has been left to fend for itself. It finishes three-two and nobody is capable of speech.', effect: { squadMorale: 12, prestige: 2, boardMood: -1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Afterwards there are grown men on the pitch who have not been on a pitch since they were boys, and a groundsman with his head in his hands about it. Survival. Nothing else. The word does not sound like much and it sounds like everything.',
        choices: [
          { id: 'celebrate', label: 'Let them have the night', desc: 'The bar open, the doors shut, and no phones', outcome: 'It is the best night the club has had in ten years and it was for finishing seventeenth, which somebody points out at about one in the morning.', effect: { squadMorale: 12, coins: -50 } },
          { id: 'sober', label: 'Say plainly that this cannot happen again', desc: 'In the dressing room, ten minutes after', outcome: 'It lands like a bucket of water and it is remembered in July when pre-season starts a fortnight early.', effect: { squadMorale: -4, boardMood: 2, prestige: 2, tag: 'mgr-never-again' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-groundsman-quits', title: 'The Man Who Knew The Pitch', icon: '🌱', category: 'crisis',
    when: { minPos: 0.7, minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Forty-one years, three promotions and one flood, and he goes because a director told him how long the grass should be. The pitch has been the best in the division for a decade and nobody knows what he did to it.',
        choices: [
          { id: 'go-and-ask', label: 'Drive to his house', desc: 'Ask him to come back, and mean it', outcome: 'He comes back on the condition that nobody from upstairs speaks to him again. It is agreed in a kitchen and honoured for years.', effect: { squadMorale: 6, boardMood: -1, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the groundsman nobody may speak to' } } },
          { id: 'contractors', label: 'Bring in contractors', desc: 'A firm with machinery and a schedule', outcome: 'The pitch is level, green, and slow, and the wingers all say the same thing about it by October.', effect: { coins: -120, squadMorale: -4 } },
          { id: 'apprentice', label: 'Promote the lad who worked under him', desc: 'Twenty-three, and taught by the right man', outcome: 'The first winter is rough and by the second season the pitch is the best in the division again and he will not tell anybody how.', effect: { coins: -30, squadMorale: 2, prestige: 1 } },
        ],
      },
    },
  },

  // ── TRIUMPH ──────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p03-promotion-run-in', title: 'Five To Go', icon: '📈', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 2, minTier: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Five games and a four-point cushion. Nobody at the club has said the word out loud yet — there is a superstition about it that predates everybody in the building.',
        choices: [
          { id: 'name-it', label: 'Say the word', desc: 'Promotion. Out loud, in the dressing room, on Monday.', outcome: 'It takes the lid off. Two of them play like men who have been given permission and one of them cannot sleep for a week.', effect: { squadMorale: 8, boardMood: 1 }, next: 'after' },
          { id: 'grind', label: 'Talk only about Saturday', desc: 'One game, ninety minutes, nothing beyond it', outcome: 'Four one-nils and a goalless draw. Not a single enjoyable afternoon and the most points anybody has taken from a run-in here.', effect: { squadMorale: 2, prestige: 2, boardMood: 2 }, next: 'after' },
          { id: 'reward', label: 'Promise them a bonus', desc: 'Money on the table, from his own budget line', outcome: 'It works and it is faintly grubby, and in June the finance director produces the figure in a meeting about the wage bill.', effect: { squadMorale: 10, coins: -200 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'It is done with a game to spare, on a Tuesday, away. The pitch is full of people within nine seconds of the whistle. Somebody has got hold of the manager\'s tie and he does not get it back.',
        choices: [
          { id: 'squad-first', label: 'Spend the summer on the squad', desc: 'This lot cannot go up a division as they are', outcome: 'Six in, four out, and the wage bill doubles. Half the promotion side are gone by August and the terraces mind that a great deal.', effect: { coins: -400, squadMorale: -6, boardMood: 1, prestige: 1 } },
          { id: 'loyalty', label: 'Take the same men up', desc: 'They got here. They get the chance.', outcome: 'It is the popular thing and the right thing in every way except the table. Four of them are not good enough and all four know it by October.', effect: { squadMorale: 12, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the side that went up together' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-unbeaten-month', title: 'A Month Without Losing', icon: '🛡️', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six games, four wins, two draws, and the side has begun to walk out differently. The manager of the month award is a small bottle of champagne and a curse that everybody in football pretends not to believe in.',
        choices: [
          { id: 'accept', label: 'Take the award and enjoy it', desc: 'Photograph, bottle, and no false modesty', outcome: 'They lose the next one by three. He gives the bottle to the kitman, who has it behind the bar in his local for years.', effect: { prestige: 2, squadMorale: 3, boardMood: 1 } },
          { id: 'deflect', label: 'Give it to the staff', desc: 'Name the analyst and the fitness coach instead', outcome: 'The backroom would now walk into traffic for him. The wider game files him as either humble or awkward, depending on who is writing.', effect: { squadMorale: 6, prestige: 1 } },
          { id: 'warn', label: 'Use it as a warning', desc: 'Tell them exactly how quickly this ends', outcome: 'It is correct and it is a strange thing to hear after six unbeaten. Two of them tighten up and one of them stops enjoying himself.', effect: { squadMorale: -3, boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-cup-run-nobody-expected', title: 'Still In It In February', icon: '🏆', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four rounds, three of them away, and a quarter-final draw that has put a queue round the block at nine in the morning. The league campaign, meanwhile, has quietly stopped moving.',
        choices: [
          { id: 'go-for-it', label: 'Full strength, every round', desc: 'You do not get these twice', outcome: 'They go out in the semi to a much better side and the league finish is four places worse than it should have been. Not one supporter would trade it.', effect: { prestige: 3, coins: 300, boardMood: -1, squadMorale: 8 }, next: 'after' },
          { id: 'league-first', label: 'Protect the league', desc: 'Rotate hard and take whatever the cup gives', outcome: 'The reserves go out in the quarter-final by a single goal, gallantly, and the league position holds. The correct decision, disliked by everybody.', effect: { boardMood: 2, prestige: -1, squadMorale: -3 }, next: 'after' },
          { id: 'both', label: 'Try to have both', desc: 'Play the same men and hope the legs hold', outcome: 'It holds until the third week of March and then everything goes at once — two hamstrings, a knee, and a run of one point from twelve.', effect: { squadMorale: 4, boardMood: -2, coins: 200 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The cheque from the run clears in April. It is more money than the club has seen in one go for eleven years, and there are three people in the boardroom with three different sentences beginning "what we should do is".',
        choices: [
          { id: 'squad', label: 'Put it all in the side', desc: 'One proper signing while the chance exists', outcome: 'A real footballer arrives and the roof still leaks over the away end. He is worth it, on the pitch, and it is a close-run thing off it.', effect: { coins: -260, squadMorale: 7, boardMood: -1 } },
          { id: 'ground', label: 'Put it in the ground', desc: 'The roof, the drains, the toilets nobody photographs', outcome: 'Nothing to show for it that anyone applauds. Eleven years later a stand is still standing because of a cup run.', effect: { prestige: 1, boardMood: 2, clubLegacy: { kind: 'stand', label: 'rebuilt on cup money' } } },
          { id: 'debt', label: 'Clear the debt', desc: 'Boring, invisible, and it makes the club solvent', outcome: 'The bank is quiet for the first time in a decade. Nobody sings about a repaid overdraft and the club exists in six years\' time.', effect: { coins: 100, boardMood: 3, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-record-attendance', title: 'A Full House', icon: '🎟️', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sold out by the Wednesday, which has not happened since a date people still quote at each other in pubs. There are people in the ground on Saturday who have not been for fifteen years and can still find their old seat.',
        choices: [
          { id: 'use-it', label: 'Tell the players what it means', desc: 'Twenty minutes on what this town has been through', outcome: 'Two of them are visibly moved and one of them is a nineteen-year-old who plays the best game of his life and cannot remember any of it.', effect: { squadMorale: 10, playerMorale: { who: 'youngest', delta: 14 }, coins: 200 } },
          { id: 'normal', label: 'Keep everything normal', desc: 'Same warm-up, same music, same words', outcome: 'They handle it like professionals and win one-nil and about four thousand of the returners decide to come back again.', effect: { coins: 220, boardMood: 2, prestige: 1 } },
          { id: 'price', label: 'Argue to keep the prices down', desc: 'A full house at the old price rather than a good one at a new price', outcome: 'He wins it and the club takes less money on the biggest gate in fifteen years. The terraces find out and it is never forgotten.', effect: { coins: 80, boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the price that never went up' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-youth-debut', title: 'One Of Our Own', icon: '🌱', category: 'triumph',
    when: { maxPos: 0.4, needs: 'wonderkid' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He signed at eight. His father parks in the same space every home game and has done since the boy was in the under-tens. There are eleven minutes left and a two-goal lead, and the fourth official is holding a board.',
        choices: [
          { id: 'send-him', label: 'Send him on', desc: 'Eleven minutes, at home, with the game safe', outcome: 'Half the ground stands for a substitution. He touches the ball four times and misplaces one of them and it is the best afternoon of his life.', effect: { playerMorale: { who: 'youngest', delta: 20 }, squadMorale: 6, prestige: 1 }, next: 'after' },
          { id: 'wait', label: 'Not today', desc: 'Give him a start rather than a cameo, in three weeks', outcome: 'His father says nothing about it, which is somehow louder. Three weeks later he starts and is superb, and nobody remembers the game he did not get on in.', effect: { playerMorale: { who: 'youngest', delta: 6 }, prestige: 1 }, next: 'after' },
          { id: 'other-kid', label: 'Send on a different young one', desc: 'The one who has trained better for a month', outcome: 'It is the right call on merit and it is read by everybody in the ground as something else. The lad\'s father does not park in that space again for a while.', effect: { playerMorale: { who: 'youngest', delta: -8 }, squadMorale: 4, prestige: 1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'By March he has eleven appearances and an agent, and two clubs have rung about him. He is seventeen and he has a photograph of himself on the wall of the club shop.',
        choices: [
          { id: 'contract', label: 'Get him signed long', desc: 'Whatever it costs against the budget', outcome: 'Five years, on money the club cannot really justify for a boy. He stays. Two hundred and twelve appearances later, nobody mentions the wage.', effect: { coins: -180, playerMorale: { who: 'youngest', delta: 14 }, boardMood: -1, clubLegacy: { kind: 'number', label: 'the shirt he never gave back' } } },
          { id: 'sell-later', label: 'Let it run and take the fee', desc: 'A boy this good will always leave in the end', outcome: 'He goes at nineteen for money that rebuilds a training ground. The town has an argument about it that lasts a generation.', effect: { coins: 600, prestige: -1, squadMorale: -6, clubLegacy: { kind: 'reputation', label: 'a club that develops and sells' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-title-last-day', title: 'It Goes To The Last Day', icon: '🥇', category: 'triumph',
    when: { maxPos: 0.05, minSeason: 3 }, weight: 4, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Level on points, one game each, and theirs is at home to a side already on the beach. Every man in the building has done the arithmetic and nobody will admit to having done it.',
        choices: [
          { id: 'shut-out', label: 'No radios, no phones, nothing', desc: 'Play the game in front of them and find out afterwards', outcome: 'They win three-nil and stand in a circle in the middle of the pitch waiting for a result from ninety miles away.', effect: { squadMorale: 8, prestige: 2 }, next: 'after' },
          { id: 'relay', label: 'Have it relayed to the bench', desc: 'Every score, as it happens', outcome: 'The dugout tells the pitch and the pitch tells the crowd and the whole ground rides ninety minutes of somebody else\'s game.', effect: { squadMorale: 6, coins: 100 }, next: 'after' },
          { id: 'free', label: 'Tell them to enjoy it', desc: 'No instructions at all. Go and play.', outcome: 'It is the loosest, best football the club has played in years, and two of them will talk about that afternoon at their own testimonials.', effect: { squadMorale: 12, prestige: 1, boardMood: 1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The other result comes through at twenty past five. Whichever way it fell, there are four thousand people in the ground who have not moved and a chairman on the phone to somebody about an open-top bus.',
        choices: [
          { id: 'parade', label: 'Do the parade properly', desc: 'A bus, a route through the estates, the whole town', outcome: 'It takes four hours to cover three miles. A woman in her nineties is lifted up to touch the trophy and it is on the front of the local paper for a week.', effect: { prestige: 3, coins: -120, squadMorale: 10, clubLegacy: { kind: 'tradition', label: 'the route the bus took' } } },
          { id: 'quiet', label: 'Keep it in the ground', desc: 'One lap, the players and the people who came all year', outcome: 'It is more intimate and less of a spectacle and the supporters who were there every week get something that belongs only to them.', effect: { squadMorale: 8, prestige: 1, coins: -20 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-giant-killing', title: 'We Beat Them', icon: '🗡️', category: 'triumph',
    when: { maxPos: 0.4, minTier: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four divisions between the sides and one goal in it, scored by a full-back who works in his brother\'s garage on Thursdays. Their manager is gracious at the whistle and looks like a man doing arithmetic about his own job.',
        choices: [
          { id: 'humble', label: 'Be humble about it', desc: 'Praise them, credit the draw, no gloating', outcome: 'It is admired everywhere except in his own dressing room, where nineteen men wanted to be told they were magnificent.', effect: { prestige: 2, squadMorale: -2, coins: 240 } },
          { id: 'roar', label: 'Let them enjoy every second', desc: 'The lap, the songs, the lot', outcome: 'The full-back is carried off the pitch. The next league game is a shambles and it is a fair trade.', effect: { squadMorale: 12, coins: 240, boardMood: -1 } },
          { id: 'shirt', label: 'Put the shirt on the wall', desc: 'Framed, in the corridor to the dressing room', outcome: 'Every player who signs for this club for the next thirty years walks past it on the way to work.', effect: { prestige: 2, squadMorale: 6, coins: 200, clubLegacy: { kind: 'tradition', label: 'the framed shirt in the corridor' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-player-award', title: 'He Wins The Award', icon: '🏅', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Player of the year in the division, voted by people who have watched him every week and been surprised every week. He goes up in a suit that does not fit and thanks his mother and the physio.',
        choices: [
          { id: 'contract-now', label: 'Get him signed before the phone rings', desc: 'A new deal on the Monday morning', outcome: 'He signs, and the number on it resets the wage structure of the entire club. Three others find out and ask for meetings.', effect: { coins: -260, playerMorale: { who: 'best', delta: 14 }, squadMorale: -4 } },
          { id: 'sell-high', label: 'Sell him at the top', desc: 'Nobody will ever value him more highly than this month', outcome: 'The fee is enormous and the side is never the same shape again and the manager is proved right in an accounts meeting nobody attends.', effect: { coins: 700, squadMorale: -8, prestige: -1, boardMood: 2 } },
          { id: 'nothing-yet', label: 'Say nothing and see the season out', desc: 'Deal with it in June like adults', outcome: 'By June he has been in three newspapers and his head has gone, quietly, in the way heads go. The fee in June is smaller than it was in April.', effect: { coins: 400, playerMorale: { who: 'best', delta: -6 }, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-derby-win', title: 'We Won At Their Place', icon: '😤', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two-one, away, with a header in the eighty-ninth minute at the end where three thousand of ours are. The stewards give up entirely for about forty seconds and nobody is hurt and nobody sits down.',
        choices: [
          { id: 'go-to-them', label: 'Go and stand in front of that corner', desc: 'The whole staff, arms up, into it', outcome: 'The photograph runs everywhere. It is also filed by the other club and produced in the build-up to every fixture for the next decade.', effect: { squadMorale: 10, prestige: 1, clubLegacy: { kind: 'rivalry', label: 'the corner they stood in front of' } } },
          { id: 'straight-in', label: 'Straight down the tunnel', desc: 'No celebration on their grass', outcome: 'It is disciplined and the away support hates him for about four minutes and respects him for years.', effect: { prestige: 2, squadMorale: 4 } },
          { id: 'gracious', label: 'Shake every hand on the way off', desc: 'Their staff, their stewards, their kitman', outcome: 'It costs nothing and the next time the club needs a favour from that building, the phone gets answered.', effect: { prestige: 2, boardMood: 1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-clean-sheet-record', title: 'Eight Hundred Minutes', icon: '🧱', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2, temper: ['tactician', 'disciplinarian'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eight clean sheets in a row and a club record that has stood since before the main stand was rebuilt. The goalkeeper has stopped talking to anybody on a Friday, which everybody has agreed to allow.',
        choices: [
          { id: 'keeper', label: 'Give the keeper the credit', desc: 'All of it, publicly, repeatedly', outcome: 'He is embarrassed and delighted. The two centre-halves who have played every one of those minutes say nothing and mean plenty.', effect: { playerMorale: { who: 'best', delta: 14 }, squadMorale: -3, prestige: 1 } },
          { id: 'unit', label: 'Credit the front two for the running', desc: 'It starts forty yards further up than anybody thinks', outcome: 'A slightly boring answer that happens to be true, and the strikers run harder for the rest of the season because somebody noticed.', effect: { squadMorale: 8, prestige: 1 } },
          { id: 'record', label: 'Chase the record openly', desc: 'Put the number on the wall and go after it', outcome: 'They break it and they play the next month for a clean sheet rather than for three points, and take four from a possible fifteen.', effect: { prestige: 2, boardMood: -1, squadMorale: 4, clubLegacy: { kind: 'number', label: 'minutes without conceding' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-playoff-final', title: 'One Game For A Season', icon: '🎫', category: 'triumph',
    when: { maxPos: 0.28, minSeason: 2, minTier: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Forty-six league games and it comes down to one afternoon at a neutral ground. Twenty-eight thousand tickets sold in a town that has eleven thousand people in it, which somebody should probably look into.',
        choices: [
          { id: 'senior', label: 'Pick the men who got them here', desc: 'The eleven from the semi-final, unchanged', outcome: 'Two of them are running on empty by the hour. Loyalty gets an hour of good football and then needs substitutions it has not prepared.', effect: { squadMorale: 8, boardMood: -1 }, next: 'after' },
          { id: 'form', label: 'Pick on form, not on sentiment', desc: 'Leave out a man who has played forty-four games', outcome: 'He is told on the Thursday and he says the right things and does not look up from the floor. The side is better balanced for it.', effect: { playerMorale: { who: 'oldest', delta: -18 }, squadMorale: -3, boardMood: 1 }, next: 'after' },
          { id: 'surprise', label: 'Do something they will not expect', desc: 'A shape the club has not used all season', outcome: 'It works for half an hour and then the opposition manager fixes it at half-time, and the second half is played uphill.', effect: { prestige: 1, squadMorale: 2, boardMood: -1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'However it went, there are two hours afterwards in a stadium car park with families and a coach driver waiting patiently, and a squad that will never all be in one place again.',
        choices: [
          { id: 'thanks', label: 'Thank the ones who are leaving', desc: 'By name, in front of everybody, before anybody drives away', outcome: 'Four of them are out of contract and know it. One of them turns down more money elsewhere in July because of a two-minute speech in a car park.', effect: { squadMorale: 10, prestige: 1, playerMorale: { who: 'oldest', delta: 12 } } },
          { id: 'forward', label: 'Talk only about next season', desc: 'Report back on the second of July', outcome: 'It is bracing and businesslike and about half of them wanted a moment rather than a date.', effect: { squadMorale: -4, boardMood: 2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-first-full-stand', title: 'That Side Is Full Again', icon: '🏟️', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The side terrace has not been full since before half the squad were born. On Saturday it is, and it makes a noise the players have literally never heard in this ground, and one of them turns round in the warm-up to look at it.',
        choices: [
          { id: 'walk', label: 'Walk the players over to it before kick-off', desc: 'Stand in front of it. Look at it properly.', outcome: 'They come out for the second half three goals up. Whether that is connected is a matter of faith and it is a very strong faith.', effect: { squadMorale: 10, coins: 140 } },
          { id: 'season-tickets', label: 'Push the club to keep them', desc: 'Cheap season tickets for that end, now, while the mood holds', outcome: 'Sixteen hundred sold in a fortnight at a price that costs the club money in the short term and fills a terrace for eleven years.', effect: { coins: -60, boardMood: -1, prestige: 2, clubLegacy: { kind: 'stand', label: 'the terrace that filled up again' } } },
          { id: 'quiet-note', label: 'Say nothing about it at all', desc: 'Do not make them play for a crowd', outcome: 'Sensible, professional, and about six people in the building are quietly disappointed that nobody marked it.', effect: { squadMorale: 2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-bigger-club-calls', title: 'Somebody Bigger Rings', icon: '☎️', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 4 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A chief executive from three divisions up asks for a conversation in a hotel outside a motorway junction. Better money, better players, and a squad he has admired from a distance for two years.',
        choices: [
          { id: 'go', label: 'Take the meeting', desc: 'Listen, at least. Everybody listens.', outcome: 'It gets out within a week, as these things do. He stays and the terraces now know he sat in that hotel, and the songs have an edge to them.', effect: { prestige: 2, squadMorale: -5, boardMood: -1, tag: 'mgr-took-the-meeting' } },
          { id: 'refuse', label: 'Say no without meeting them', desc: 'One phone call, thirty seconds, done', outcome: 'The board hear about it from the other club and offer him a new deal on the Friday. He is now the most secure man in the building.', effect: { boardMood: 3, prestige: 1, squadMorale: 6, clubLegacy: { kind: 'reputation', label: 'the manager who stayed' } } },
          { id: 'leverage', label: 'Use it to get what the club needs', desc: 'Not a rise. A training pitch and a scouting budget.', outcome: 'He gets both, in writing, and a chairman who will never entirely trust him again.', effect: { coins: 260, boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-testimonial', title: 'His Testimonial', icon: '🎖️', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 4, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ten years, one club, and a knee that has been managed rather than fixed since he was twenty-six. The testimonial is in July and half the squad have to be told who some of the guests are.',
        choices: [
          { id: 'full-side', label: 'Play a full-strength side', desc: 'Treat it as a real match in front of a real crowd', outcome: 'Eleven thousand come and it is a proper game and he scores in the last minute, teed up by a nineteen-year-old who was told to.', effect: { playerMorale: { who: 'oldest', delta: 20 }, squadMorale: 8, coins: 60 } },
          { id: 'coach-role', label: 'Offer him a job on the staff', desc: 'Announce it on the night, in front of everybody', outcome: 'He cannot speak for a moment on the pitch with a microphone in his hand. He is a coach at this club for the next twenty years.', effect: { playerMorale: { who: 'oldest', delta: 18 }, coins: -80, prestige: 1, clubLegacy: { kind: 'tradition', label: 'a one-club man on the staff' } } },
          { id: 'number', label: 'Retire his number', desc: 'Nobody wears it again', outcome: 'A lovely gesture, and every summer for a decade an agent asks whether it is really unavailable and is told that it really is.', effect: { playerMorale: { who: 'oldest', delta: 16 }, prestige: 2, clubLegacy: { kind: 'number', label: 'a retired shirt number' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-hat-trick-boy', title: 'Three Before Half-Time', icon: '⚡', category: 'triumph',
    when: { maxPos: 0.35, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is eighteen and he has three by the interval, one of them from a position that no coach would ever recommend. The ground has not sat down since the second one.',
        choices: [
          { id: 'take-him-off', label: 'Take him off at seventy', desc: 'Let the whole place stand up for him', outcome: 'It is a lap of honour disguised as a substitution and he is booked into every newspaper in the country by Sunday.', effect: { playerMorale: { who: 'youngest', delta: 16 }, squadMorale: 6, prestige: 1 } },
          { id: 'leave-on', label: 'Leave him out there for a fourth', desc: 'These afternoons do not come round often', outcome: 'He does not get a fourth and he is on the floor with cramp at eighty-eight. Two weeks out with a strain nobody needed.', effect: { playerMorale: { who: 'youngest', delta: 8 }, squadMorale: -3, boardMood: -1 } },
          { id: 'protect-press', label: 'Keep him away from the press', desc: 'Nobody speaks to an eighteen-year-old after that', outcome: 'A senior pro does the interviews and talks about the team. The boy is furious for a week and grateful in about four years.', effect: { playerMorale: { who: 'youngest', delta: -6 }, prestige: 2, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-hundredth-cap-graduate', title: 'A Hundred Games', icon: '💯', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boy who came in at nine years old makes his hundredth appearance on a Tuesday night in the rain in front of four and a half thousand. His old youth coach is in the stand with a plastic bag.',
        choices: [
          { id: 'mark-it', label: 'Mark it properly', desc: 'A shirt, a photograph, and his old coach on the pitch', outcome: 'It takes six minutes and it costs nothing and every young player in the building watches it happen.', effect: { squadMorale: 8, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the hundredth-game presentation' } } },
          { id: 'contract', label: 'Announce a new deal that night', desc: 'Do it on the pitch, in front of them', outcome: 'The crowd love it. The agent, who has not signed anything yet, is standing in the tunnel going a strange colour.', effect: { playerMorale: { who: 'best', delta: 12 }, coins: -160, prestige: -1 } },
          { id: 'nothing', label: 'Let him play the game', desc: 'A hundred games is a number, not an occasion', outcome: 'He plays well and says afterwards that he had not really thought about it, which is untrue and kindly meant.', effect: { squadMorale: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-away-end-sold-out', title: 'Three Thousand Travelled', icon: '🚐', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two hundred and forty miles on a Tuesday, kick-off at quarter to eight, and the away end is full an hour before. Some of them will not be home until four in the morning and are at work at eight.',
        choices: [
          { id: 'fund-coaches', label: 'Get the club to subsidise the travel', desc: 'Half the coach fare, out of the football budget', outcome: 'It is announced on the Friday and it costs about what a squad player earns in a fortnight, and there are eleven coaches instead of six.', effect: { coins: -110, prestige: 2, squadMorale: 4 } },
          { id: 'after-game', label: 'Keep the players out there afterwards', desc: 'The full ten minutes, whatever the result', outcome: 'The stewards want the ground cleared and eighteen footballers stand in front of three thousand people until they are ready to leave.', effect: { squadMorale: 9, prestige: 1 } },
          { id: 'mention', label: 'Name them in the press conference', desc: 'Not the performance. Them.', outcome: 'It is three sentences and it appears in every report. Somebody prints it out and it is on a pub wall for years.', effect: { prestige: 2, squadMorale: 2, coins: 40 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-scouts-in-the-stand', title: 'Six Of Them In The Stand', icon: '🔭', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 3, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six clubs have requested seats and four of them have sent men who only ever watch one player. The lad knows. Everybody in the dressing room knows, because somebody read the list out as a joke.',
        choices: [
          { id: 'tell-him', label: 'Tell him exactly who is here', desc: 'All six, by name, before the warm-up', outcome: 'He plays like a man auditioning, which is thrilling and slightly less useful to the side than the way he played last week.', effect: { playerMorale: { who: 'best', delta: 10 }, squadMorale: -3 } },
          { id: 'hide-it', label: 'Say nothing and play him wide', desc: 'Somewhere they cannot see what he really is', outcome: 'A quiet game. The scouts come back in three weeks and the club has bought itself nothing but a fortnight.', effect: { playerMorale: { who: 'best', delta: -4 }, prestige: -1, boardMood: 1 } },
          { id: 'price', label: 'Put a price on him publicly', desc: 'Name a number in the press conference that makes everybody blink', outcome: 'The number is absurd and it becomes the number. Two years later somebody pays it and a training ground gets built.', effect: { prestige: 1, coins: 200, boardMood: 2, tag: 'mgr-set-the-price' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-continental-night', title: 'A European Night', icon: '🌍', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 3, maxTier: 3 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A ground that has never staged one is staging one. The floodlights look different. Somebody in the ticket office has had to work out how to print a name in an alphabet the machine does not have.',
        choices: [
          { id: 'strongest', label: 'Strongest side, both legs', desc: 'The league can wait a fortnight', outcome: 'They go through on a night people describe by the weather rather than the score, and they lose twice in the league doing it.', effect: { squadMorale: 12, prestige: 3, boardMood: -1, coins: 260 } },
          { id: 'balance', label: 'Rotate for the away leg', desc: 'A long trip, a small pitch, and a Saturday to think about', outcome: 'They lose the away leg by two and win the home one by one, and go out having played well twice.', effect: { prestige: 1, coins: 180, squadMorale: -2, boardMood: 1 } },
          { id: 'occasion', label: 'Make the whole thing an occasion', desc: 'Flags on every seat, the anthem, the lot', outcome: 'It costs money the club does not have and the photographs from that night hang in the boardroom of a club that has never done it since.', effect: { coins: -140, prestige: 2, squadMorale: 8, clubLegacy: { kind: 'tradition', label: 'the flags from the European night' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-manager-of-the-year', title: 'They Vote For Him', icon: '🎩', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Manager of the year, voted by the other managers, which is the only version of it that any of them actually care about. Black tie, a long dinner, and a speech he has not prepared because he did not expect it.',
        choices: [
          { id: 'staff', label: 'Read out every name on the staff', desc: 'All of them, including the two part-timers', outcome: 'It takes ninety seconds and it is the most-quoted thing said all night. The kit lady is asked for a photograph twice.', effect: { squadMorale: 6, prestige: 2 } },
          { id: 'blunt', label: 'Say what the job is really like', desc: 'Honest, unpolished, and not what a room in dinner jackets expects', outcome: 'Half of them find it refreshing. The other half find it a lecture, and one of them is on the panel that hires managers.', effect: { prestige: 1, boardMood: -1, tag: 'mgr-spoke-plainly' } },
          { id: 'skip', label: 'Not go at all', desc: 'A game on Saturday and a training session on Friday morning', outcome: 'The award is collected by the assistant. It is either admirable or rude depending on who is telling it, and both versions travel.', effect: { squadMorale: 4, prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-unlikely-signing-comes-good', title: 'The One Nobody Wanted', icon: '💎', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Released at twenty-three, out of the game for eight months, signed on a pay-as-you-play because a scout saw him in a Sunday league. Fourteen goals by February.',
        choices: [
          { id: 'reward', label: 'Tear up the deal and pay him properly', desc: 'Before somebody else notices', outcome: 'He signs the same afternoon without reading it and cries in the car park. The wage bill takes it and the room takes note.', effect: { coins: -140, squadMorale: 10, playerMorale: { who: 'best', delta: 18 } } },
          { id: 'hold', label: 'Hold him to the contract he signed', desc: 'It is a contract. He signed it.', outcome: 'Legally sound. In April an agent explains to him what he could be earning and he is gone in June for nothing.', effect: { coins: 100, squadMorale: -8, playerMorale: { who: 'best', delta: -16 } } },
          { id: 'story', label: 'Tell his story everywhere', desc: 'Every interview, every week, the whole way back', outcome: 'It is a wonderful story and by March four bigger clubs know exactly who he is and what he costs.', effect: { prestige: 2, coins: 220, playerMorale: { who: 'best', delta: 8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-comeback-from-three', title: 'Three Down At Half-Time', icon: '🔄', category: 'triumph',
    when: { maxPos: 0.4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three-nil at the break and a third of the ground already in the concourse deciding whether to go. What happens in the second half is the sort of thing that gets a season named after it.',
        choices: [
          { id: 'calm', label: 'Say almost nothing at half-time', desc: 'One change, two sentences, and out', outcome: 'They score in the forty-eighth and the ground remembers how to make noise, and it finishes three-all with a goal in the ninety-fourth.', effect: { squadMorale: 12, prestige: 2, coins: 60 } },
          { id: 'rage', label: 'Empty both barrels', desc: 'A cup of tea against a wall and a lot of shouting', outcome: 'It works, and for the rest of the season every poor half is followed by eleven men bracing for a room. That has its own cost.', effect: { squadMorale: 6, boardMood: 1, tag: 'mgr-half-time-terror' } },
          { id: 'gamble', label: 'Three substitutions at half-time', desc: 'All of them at once, in the tunnel', outcome: 'Two of the three are involved in everything. The man taken off after forty-five in front of his own crowd does not forget it.', effect: { squadMorale: 8, playerMorale: { who: 'unhappiest', delta: -14 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-training-ground-funded', title: 'They Sign Off The Pitches', icon: '🏗️', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 4, minCoins: 200 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three good seasons and a board that has run out of reasons. The plans for the training ground have been in a drawer since before he arrived, drawn by somebody who has since retired.',
        choices: [
          { id: 'all-in', label: 'Build the lot', desc: 'Pitches, gym, a canteen with windows', outcome: 'Eighteen months of building work and no money for a squad in either window. The club is transformed and finishes eleven places lower.', effect: { coins: -520, boardMood: 1, prestige: 2, squadMorale: -4, clubLegacy: { kind: 'tradition', label: 'the training ground he built' } } },
          { id: 'pitches-only', label: 'Just the pitches', desc: 'Grass, drainage, and lights. Nothing else.', outcome: 'Half the money, most of the benefit, and a portakabin that is still there in fifteen years with a rota on the door.', effect: { coins: -260, boardMood: 2, prestige: 1 } },
          { id: 'squad-instead', label: 'Ask for it in the transfer budget instead', desc: 'Players now. Buildings when somebody else is here.', outcome: 'Two good signings and a season that goes well. The plans go back in the drawer for another decade.', effect: { coins: 300, squadMorale: 8, prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-lower-half-overachieve', title: 'Nobody Picked Us', icon: '📊', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2, minTier: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Every preview in August had them going down. In February they are fifth, on the smallest budget in the division, with a squad assembled from other people\'s rejections and one very good idea about pressing.',
        choices: [
          { id: 'remind', label: 'Put the August predictions on the wall', desc: 'Every one of them, printed out', outcome: 'It is fuel for about six weeks and then it is just wallpaper, and by April somebody has drawn on it.', effect: { squadMorale: 7, prestige: 1 } },
          { id: 'push', label: 'Tell the board to back it now', desc: 'One signing in January turns fifth into second', outcome: 'They find the money and it is a real gamble on a season that might already be the ceiling.', effect: { coins: -240, squadMorale: 6, boardMood: -1 } },
          { id: 'protect', label: 'Keep expectations flat in public', desc: 'Talk about points totals and safety, in February, in fifth', outcome: 'It protects the players and it irritates a support that would quite like to be allowed to enjoy something.', effect: { squadMorale: 4, prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-loyal-servant-goal', title: 'The Last Home Game', icon: '👏', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 3, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Last home game of the season and a man who has been at the club since he was sixteen is out of contract and everybody knows how this ends. He is not in the starting eleven.',
        choices: [
          { id: 'start-him', label: 'Start him', desc: 'Whatever it costs the shape', outcome: 'He is taken off on the hour and the ground stands for two full minutes. The side is worse for an hour and better forever.', effect: { playerMorale: { who: 'oldest', delta: 20 }, squadMorale: 10, boardMood: -1 } },
          { id: 'captain', label: 'Give him the armband for the day', desc: 'Off the bench, ten minutes, leading them out', outcome: 'He leads them out with his daughter holding one hand and the ball in the other and does not get on the pitch, and says it was the best day of his career anyway.', effect: { playerMorale: { who: 'oldest', delta: 16 }, squadMorale: 8, prestige: 1 } },
          { id: 'honest', label: 'Tell him first and let him decide', desc: 'The truth about next season, before the game, not after', outcome: 'He asks not to be involved at all and watches from the stand with his family. It is his choice and it is a hard afternoon for everybody.', effect: { playerMorale: { who: 'oldest', delta: 6 }, prestige: 2, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-tradition-begins', title: 'Something They Started Doing', icon: '🎵', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 3, requiresTag: 'mgr-fans-favourite' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It began in the away end at a game nobody remembers the score of — four notes and a name, over and over. Now it is being sung at home, before kick-off, with the lights half down because somebody in the control room joined in.',
        choices: [
          { id: 'lean-in', label: 'Build the walk-out around it', desc: 'Lights, timing, and the players stood still until it finishes', outcome: 'Within a year no player will walk out before the last note. Visiting sides stand around not knowing where to look.', effect: { squadMorale: 8, prestige: 1, coins: 60, clubLegacy: { kind: 'tradition', label: 'the four notes before kick-off' } } },
          { id: 'leave-alone', label: 'Leave it entirely alone', desc: 'Things like this die the moment a club owns them', outcome: 'It survives, unbranded and unamplified, and is still being sung by people who have no idea when it started.', effect: { prestige: 2, squadMorale: 4, clubLegacy: { kind: 'tradition', label: 'a song the club never claimed' } } },
          { id: 'commercial', label: 'Let the commercial department have it', desc: 'On the shirts, in the shop, on the tannoy', outcome: 'It makes real money for two seasons and it stops being sung in the third, and nobody can say precisely when it stopped.', effect: { coins: 280, prestige: -2, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-wage-bill-after-promotion', title: 'What It Costs To Stay Up', icon: '📑', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 3, minTier: 1, maxTier: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Up a division, and the first spreadsheet of the summer says the promotion side would finish bottom by nine points. Every man in it has just had the best year of his life.',
        choices: [
          { id: 'spend', label: 'Spend everything the promotion earned', desc: 'Seven in, and a wage structure that only works if they stay up', outcome: 'They stay up by four points. If they had not, the club would have been in genuine trouble, and everybody spends a season pretending they knew.', effect: { coins: -600, squadMorale: 4, boardMood: -1, prestige: 1 } },
          { id: 'half', label: 'Strengthen three positions only', desc: 'Spine, and trust the rest', outcome: 'Two of the three are excellent and the fourth position they did not fix is the one that costs them fifteen points.', effect: { coins: -300, squadMorale: 2, boardMood: 1 } },
          { id: 'faith', label: 'Keep faith with the lot of them', desc: 'Same squad, one division higher', outcome: 'They are brave and outclassed and go down with a game to spare, and the ground applauds them off on the last day anyway.', effect: { squadMorale: 10, boardMood: -2, prestige: -1, clubLegacy: { kind: 'reputation', label: 'the club that kept faith' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-photograph', title: 'The Photograph', icon: '📷', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A local photographer catches something in the ninety-third minute — the goalkeeper on his knees, an away end in the background, and a steward with his hands on his head. It is in every paper by Monday.',
        choices: [
          { id: 'buy-it', label: 'Buy the rights and put it up', desc: 'Twelve feet wide, in the entrance hall', outcome: 'It costs four figures and it is the first thing anybody sees walking into the club for the next twenty years.', effect: { coins: -70, prestige: 2, squadMorale: 5, clubLegacy: { kind: 'tradition', label: 'the photograph in the entrance hall' } } },
          { id: 'credit', label: 'Make sure the photographer gets the credit', desc: 'Name him in every interview about it', outcome: 'He has a career off the back of it and shoots the club for free for a decade, which was not the intention and is a good outcome.', effect: { prestige: 1, coins: 40 } },
          { id: 'nothing', label: 'Let it be what it is', desc: 'A photograph of a football match', outcome: 'It ends up on ten thousand phones and behind the bar in four pubs, and the club has nothing to do with any of it.', effect: { squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-chancer-gamble-pays', title: 'The Gamble Comes Off', icon: '🎰', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2, temper: ['chancer', 'tactician'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He played a centre-half up front for the last twenty minutes of a game they had to win and it worked, twice, and now the whole division is talking about it as though it was a plan rather than a man out of ideas.',
        choices: [
          { id: 'claim', label: 'Let them think it was planned', desc: 'Say nothing that contradicts a good story', outcome: 'His reputation goes up several notches on the basis of a coin flip, and he now has to live at that altitude.', effect: { prestige: 3, boardMood: 1, tag: 'mgr-myth' } },
          { id: 'honest', label: 'Admit it was desperation', desc: 'In a press conference, cheerfully', outcome: 'It is the funniest thing anybody says all season and it is repeated by rival managers in a way that is not entirely friendly.', effect: { prestige: 1, squadMorale: 6 } },
          { id: 'again', label: 'Do it again on purpose', desc: 'Same man, same twenty minutes, next week', outcome: 'The opposition are ready for it and he loses a centre-half to a strain and a game he was drawing.', effect: { squadMorale: -3, boardMood: -1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-academy-intake-day', title: 'Signing Day', icon: '✍️', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 3, temper: ['builder', 'players-manager'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine boys and their families in the boardroom on a Wednesday afternoon with squash and biscuits. Two of them have been at the club since they were seven. One has turned down somewhere much bigger to be here.',
        choices: [
          { id: 'speak', label: 'Speak to the families honestly', desc: 'Tell them how few of these boys make it', outcome: 'Two mothers thank him for it afterwards. One father is furious and takes his son elsewhere within a year.', effect: { prestige: 2, squadMorale: 2, tag: 'mgr-honest-with-families' } },
          { id: 'promise', label: 'Promise every one of them a first-team chance', desc: 'Say it out loud, in front of their parents', outcome: 'It is a wonderful afternoon and it is a debt. Two years later he plays a boy who is not ready because of a sentence in a boardroom.', effect: { squadMorale: 6, playerMorale: { who: 'youngest', delta: 12 }, boardMood: -1 } },
          { id: 'brief', label: 'Ten minutes and back to work', desc: 'A handshake each, and the session is at two', outcome: 'Perfectly polite and completely forgettable, and one of the nine remembers for twenty years that the manager did not sit down.', effect: { squadMorale: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-stand-named', title: 'They Want To Name The Stand', icon: '🪟', category: 'triumph',
    when: { maxPos: 0.15, minSeason: 5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board propose naming the new end after him while he is still in the job, which is either a great honour or the beginning of a very long goodbye. He has to answer in the room.',
        choices: [
          { id: 'accept', label: 'Accept it', desc: 'His name, on a stand, while he can see it', outcome: 'It is unveiled in August and it is strange to stand in front of and it means every bad run from now on has his name eight feet high behind it.', effect: { prestige: 3, boardMood: 1, clubLegacy: { kind: 'stand', label: 'a stand named for the manager' } } },
          { id: 'redirect', label: 'Ask them to name it after somebody else', desc: 'The man who kept the club alive in the bad years', outcome: 'They agree, and an eighty-year-old former secretary is driven to the ground and cannot speak at the unveiling.', effect: { prestige: 2, squadMorale: 4, clubLegacy: { kind: 'stand', label: 'named for the secretary who kept it going' } } },
          { id: 'supporters', label: 'Give it to the supporters', desc: 'Let them vote on the name', outcome: 'They choose a name from ninety years ago that half the board have never heard of, and it is exactly right.', effect: { prestige: 2, coins: -30, clubLegacy: { kind: 'stand', label: 'the name the supporters voted for' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-keeper-saves-a-season', title: 'He Saved The Season', icon: '🧤', category: 'triumph',
    when: { maxPos: 0.3, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two penalties in the last ten minutes of two different games in a fortnight, both saved by the same man, who has spent four years being described in this town as adequate.',
        choices: [
          { id: 'praise', label: 'Say what he has been worth all along', desc: 'At length, with the numbers, in public', outcome: 'He goes an inch taller for two months. An agent reads the same interview and rings a bigger club on the Monday.', effect: { playerMorale: { who: 'best', delta: 16 }, prestige: 1, coins: 100 } },
          { id: 'contract', label: 'Extend him quietly this week', desc: 'Before anyone else has done the arithmetic', outcome: 'Signed by Friday on sensible money. In July there is an offer that would have doubled it and the club can simply say no.', effect: { coins: -140, playerMorale: { who: 'best', delta: 10 }, boardMood: 2 } },
          { id: 'team', label: 'Turn the credit outwards', desc: 'Say the side should not have conceded two penalties', outcome: 'It is a fair point and a cold one. The keeper says nothing and the back four run harder for a month.', effect: { squadMorale: 5, playerMorale: { who: 'best', delta: -6 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-supporters-fund-something', title: 'They Raised It Themselves', icon: '🪣', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 3, requiresTag: 'mgr-fans-favourite' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Buckets at the turnstiles for eleven home games and a raffle in every pub within four miles. They have raised enough to pay for the thing the club has needed for six years and they present it in a carrier bag.',
        choices: [
          { id: 'spend-as-asked', label: 'Spend it on exactly what they raised it for', desc: 'To the penny, and publish the receipts', outcome: 'It is done in three weeks and photographed and it makes a set of supporters who trust the club with money, which is rarer than it sounds.', effect: { prestige: 2, coins: 120, squadMorale: 3, clubLegacy: { kind: 'tradition', label: 'the thing the supporters paid for' } } },
          { id: 'match', label: 'Ask the board to double it', desc: 'Match every pound they put in a bucket', outcome: 'The board agree in public and are slow about it in private, and the manager spends four months chasing an invoice.', effect: { coins: 200, boardMood: -1, prestige: 2 } },
          { id: 'divert', label: 'Use it where the club actually needs it', desc: 'Not what they raised it for. What is urgent.', outcome: 'Financially correct and a betrayal in the small, specific way that supporters remember for twenty years.', effect: { coins: 220, prestige: -3, squadMorale: -2, clubLegacy: { kind: 'reputation', label: 'the bucket money that went elsewhere' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-old-boy-returns', title: 'He Wants To Come Home', icon: '🏠', category: 'triumph',
    when: { maxPos: 0.35, minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player the club sold eleven years ago for money it desperately needed is out of contract at thirty-four and has let it be known he would come back for nothing. He can still play. Not much, but some.',
        choices: [
          { id: 'sign', label: 'Sign him', desc: 'A year, low money, and one afternoon the town will never forget', outcome: 'Nineteen appearances, two goals, and a full house for his first game back. He is also blocking a place a twenty-year-old needed.', effect: { squadMorale: 8, coins: 120, playerMorale: { who: 'youngest', delta: -10 }, prestige: 1 } },
          { id: 'coach', label: 'Offer him a coaching job instead', desc: 'Honest about what he has left as a player', outcome: 'He is hurt for a fortnight and takes it, and turns out to be the best coach of forwards the club has ever had.', effect: { coins: -100, squadMorale: 5, prestige: 2 } },
          { id: 'no', label: 'Say no', desc: 'Sentiment is not a recruitment policy', outcome: 'He signs for somebody else and scores against them in November and does not celebrate, which makes it worse.', effect: { boardMood: 1, prestige: -1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-perfect-away-day', title: 'One Of Those Afternoons', icon: '☀️', category: 'triumph',
    when: { maxPos: 0.3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four-nil away on a bright afternoon in April with nothing riding on it, the away end doing the conga in the last twenty minutes and an opposing steward openly laughing at the fourth goal.',
        choices: [
          { id: 'enjoy', label: 'Let everybody have it', desc: 'Players in front of the away end for as long as they want', outcome: 'Somebody\'s child is passed over the hoardings for a photograph. It is the picture on the club calendar for the next three years.', effect: { squadMorale: 10, prestige: 1 } },
          { id: 'standards', label: 'Point out the goal they conceded', desc: 'There was one. It was sloppy.', outcome: 'There was no goal conceded and he finds something else instead, and eighteen men roll their eyes at a man who cannot let one afternoon go.', effect: { squadMorale: -4, boardMood: 1, prestige: 1 } },
          { id: 'youth', label: 'Give the last twenty minutes to the young ones', desc: 'Three debuts at four-nil up in April', outcome: 'All three touch the ball, one of them nearly scores, and three families in the away end lose their minds.', effect: { playerMorale: { who: 'youngest', delta: 16 }, squadMorale: 6 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-fixture-of-the-season-win', title: 'Beating The Champions', icon: '🐉', category: 'triumph',
    when: { maxPos: 0.4, minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best side in the division, unbeaten in fourteen, beaten one-nil by a goal that went in off a shin. Eighty-two minutes of defending and one shot on target all afternoon.',
        choices: [
          { id: 'proud', label: 'Be openly proud of the ugliness of it', desc: 'Call it what it was and refuse to apologise', outcome: 'Their manager says something snide about it and half the country agrees with him and every player in the dressing room does not care at all.', effect: { squadMorale: 10, prestige: 1, clubLegacy: { kind: 'rivalry', label: 'the one-nil they never forgave' } } },
          { id: 'modest', label: 'Say they rode their luck', desc: 'Honest, and it takes the shine off it for his own players', outcome: 'It is well received outside and it deflates a dressing room that wanted to be told it had done something.', effect: { prestige: 2, squadMorale: -4 } },
          { id: 'build', label: 'Use it as proof the method works', desc: 'Show them the tape all week', outcome: 'They try to defend like that in the next game against a side who need to be attacked, and lose.', effect: { boardMood: -1, squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-legacy-eleven', title: 'A Side He Built', icon: '🧩', category: 'triumph',
    when: { maxPos: 0.2, minSeason: 6, temper: ['builder', 'tactician', 'players-manager'] }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eight of the eleven that walk out on Saturday were here as boys or arrived for nothing. It has taken six years and the average age is twenty-three and somebody in the press box has finally noticed.',
        choices: [
          { id: 'keep', label: 'Turn down every offer for all of them', desc: 'One more season with this side, whatever it costs', outcome: 'They finish higher than the club has finished in forty years and in June four of them are sold anyway, over his head.', effect: { squadMorale: 10, boardMood: -2, prestige: 2 } },
          { id: 'cash', label: 'Sell two and secure the club for a decade', desc: 'The two who will never be worth more', outcome: 'The money buys a future and breaks a side, and he watches the remaining nine try to play the same football without them.', effect: { coins: 800, squadMorale: -8, boardMood: 3, clubLegacy: { kind: 'reputation', label: 'solvent, on the back of one squad' } } },
          { id: 'mark-it', label: 'Have the eleven photographed properly', desc: 'One picture, in the tunnel, before they scatter', outcome: 'It hangs in the boardroom. Within three years all but two have gone and everybody who looks at it says the same sentence.', effect: { prestige: 2, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'the photograph of the eleven' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p03-fan-on-the-pitch-goodbye', title: 'The Last Whistle Of A Good Year', icon: '🌇', category: 'triumph',
    when: { maxPos: 0.25, minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Final whistle, final day, nothing riding on it and the best season in twenty years behind them. Nobody leaves. The groundsman has given up on the pitch and is standing by the tunnel watching it happen.',
        choices: [
          { id: 'lap', label: 'Do the lap with everybody', desc: 'Staff, families, the lot, twice round', outcome: 'It takes fifty minutes. A stewarding bill, a churned-up pitch, and about four thousand people who will renew in June without being asked.', effect: { squadMorale: 10, coins: 100, boardMood: 1 } },
          { id: 'speech', label: 'Take a microphone', desc: 'Say what the year has been, in front of all of them', outcome: 'He is not good at it and it does not matter. One sentence out of it is on a flag by August.', effect: { prestige: 2, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'the sentence on the flag' } } },
          { id: 'players', label: 'Send the players out and stay in the tunnel', desc: 'It is theirs. He watches from the dark.', outcome: 'The captain comes back and drags him out by the sleeve, and the noise when he appears is the loudest of the afternoon.', effect: { squadMorale: 8, prestige: 2 } },
        ],
      },
    },
  },
];
