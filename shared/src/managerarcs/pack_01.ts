// Manager-arc authoring pack 01. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack: the dressing room and the press. Two rooms the manager cannot leave. One has eleven men in it
// who decide whether he keeps his job; the other has a microphone and no obligation to be fair.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_01: ManagerArc[] = [
  // ── DRESSING ROOM ────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p1-training-fight', title: 'Two Of Them In The Mud', icon: '🥊', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tackle, a shove, then both of them on the floor with handfuls of each other\'s shirt. The rest of the group forms a ring and nobody moves to break it up, which tells him more than the fight does.',
        choices: [
          { id: 'let-run', label: 'Let it burn out', desc: 'Stand there with the whistle in your mouth', outcome: 'It lasts eleven seconds and ends with both of them too tired to be angry. They are fine by lunch. Two of the younger lads have learnt that the gaffer will watch.', effect: { squadMorale: 4, tag: 'mgr-lets-it-go' } },
          { id: 'both-in', label: 'Fine them both, equally', desc: 'No inquiry into who started it', outcome: 'One of them started it and everybody knows which. The equal fine is the bit that rankles, and it rankles for months.', effect: { squadMorale: -5, boardMood: 1, coins: 30, tag: 'mgr-strict' } },
          { id: 'train-together', label: 'Put them in the same drill all week', desc: 'Boxes, five-a-sides, the lot, side by side', outcome: 'By Thursday they are laughing at something neither will repeat to him. By Saturday one is putting the other through on goal.', effect: { squadMorale: 8, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-captain-losing-room', title: 'The Armband Has Gone Heavy', icon: '🎗️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The captain still leads the warm-up and nobody follows him any more. They do the drill. They do not look at him. He has started shouting at the wrong moments, which is what a man does when he can feel it slipping.',
        choices: [
          { id: 'keep', label: 'Back him publicly', desc: 'Say the word "captain" in every interview for a month', outcome: 'He does not get the room back. He does get six months of dignity, and he never forgets who gave him them.', effect: { playerMorale: { who: 'oldest', delta: 14 }, squadMorale: -5 }, next: 'after' },
          { id: 'strip', label: 'Take it off him', desc: 'In an office, with the door shut, quickly', outcome: 'He says he understands. He hands it over on the desk rather than into a hand. The room exhales and something in it also goes cold.', effect: { playerMorale: { who: 'oldest', delta: -18 }, squadMorale: 7, tag: 'mgr-ruthless' }, next: 'after' },
          { id: 'share', label: 'Add two vice-captains', desc: 'Spread the weight without saying why', outcome: 'Everyone sees exactly what it is. It is still kinder than the alternative and the load does come off him.', effect: { squadMorale: 4, playerMorale: { who: 'oldest', delta: -4 } }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'He plays a reserve fixture on a Tuesday in front of ninety people and he is the best man on the pitch. The reserve coach mentions it twice.',
        choices: [
          { id: 'restore', label: 'Start him Saturday', desc: 'Reward the Tuesday', outcome: 'He gives an hour of everything he has left and is replaced to a standing ovation he clearly did not expect.', effect: { playerMorale: { who: 'oldest', delta: 12 }, squadMorale: 3 } },
          { id: 'coach', label: 'Ask him to take the under-18s on Thursdays', desc: 'A door out that is not a trapdoor', outcome: 'He is insulted for a week and then he is very good at it. He is still at the club long after the manager is not.', effect: { prestige: 2, playerMorale: { who: 'oldest', delta: 6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-clique-card-school', title: 'The Back Of The Bus', icon: '🃏', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Five of them sit together, travel together and eat together, and the card school has a buy-in that two of the younger players cannot afford. Nobody has complained. That is not the same as nobody minding.',
        choices: [
          { id: 'ban', label: 'Ban the cards', desc: 'No money games on club time', outcome: 'They play on their phones instead and the group stays exactly as it was, minus one thing to do on a coach.', effect: { squadMorale: -6, tag: 'mgr-strict' } },
          { id: 'seats', label: 'Assign seats on the coach', desc: 'A rota, changed weekly, no exceptions', outcome: 'Petty, obvious, and it works. Two friendships come out of it that would not have happened otherwise.', effect: { squadMorale: 6 } },
          { id: 'join', label: 'Sit in on a hand', desc: 'Lose a tenner and say nothing about it', outcome: 'He loses forty. The clique is a clique with a manager in it now, which is a slower fix and a better one.', effect: { squadMorale: 9, coins: -10, prestige: -1, tag: 'mgr-one-of-them' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-fathers-phone-call', title: 'His Dad Rang The Club', icon: '☎️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The receptionist takes a message and looks embarrassed handing it over. A father wants to discuss his son\'s position, his minutes and the tactics. The son is nineteen and has no idea the call was made.',
        choices: [
          { id: 'meet', label: 'Invite him in', desc: 'A cup of tea and a full hour', outcome: 'He is not a monster. He is frightened for his boy and has nowhere to put it. He leaves calmer and the boy never learns any of it happened.', effect: { playerMorale: { who: 'youngest', delta: 8 }, prestige: 1 } },
          { id: 'tell-son', label: 'Tell the lad', desc: 'He is a man now and ought to know', outcome: 'He goes scarlet and apologises four times. It is a fortnight before he plays like himself, and there is not another call.', effect: { playerMorale: { who: 'youngest', delta: -10 }, squadMorale: 2, tag: 'mgr-straight-talker' } },
          { id: 'ignore', label: 'Put the note in the bin', desc: 'Not a football matter', outcome: 'The calls stop coming to him and start going to the local paper instead, which is worse and takes three months to surface.', effect: { prestige: -1, tag: 'mgr-avoids-it' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-no-warm-up', title: 'He Will Not Warm Up Properly', icon: '🧦', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A substitute jogs the length of the technical area twice, does one stretch, and stands with his hands inside his sleeves. He has been like this since August. The fitness coach has stopped mentioning it.',
        choices: [
          { id: 'bring-on', label: 'Send him on cold', desc: 'Let the game teach him', outcome: 'He pulls up after nine minutes with a hamstring and is out for a month. He warms up properly for the rest of his career.', effect: { playerMorale: { who: 'star', delta: -12 }, squadMorale: -4, coins: -40 } },
          { id: 'never', label: 'Stop bringing him on', desc: 'No warm-up, no minutes, no discussion', outcome: 'He sulks for six weeks and then does a full warm-up in front of everybody, pointedly, like a man paying a fine.', effect: { playerMorale: { who: 'star', delta: -8 }, squadMorale: 5, tag: 'mgr-strict' } },
          { id: 'ask', label: 'Ask him why', desc: 'Once, quietly, at the training ground', outcome: 'It turns out he thinks the warm-up is a public announcement that he is not good enough to start. Nobody had considered that.', effect: { playerMorale: { who: 'star', delta: 10 }, squadMorale: 3, tag: 'mgr-listens' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-translator', title: 'Nobody Told Him Anything', icon: '🗣️', category: 'dressing-room',
    when: { minSeason: 1, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new signing has nodded through four team meetings. On Friday the analyst realises he has been nodding at the wrong screen. He has understood perhaps a third of everything said to him since he arrived.',
        choices: [
          { id: 'hire', label: 'Pay for a proper translator', desc: 'Every session, every meeting, until he does not need one', outcome: 'It costs more than anyone expects and he is a different footballer inside a month. Two other lads quietly start using her as well.', effect: { coins: -120, squadMorale: 6, playerMorale: { who: 'best', delta: 14 } } },
          { id: 'buddy', label: 'Pair him with a senior pro', desc: 'Neither speaks the other\'s language, which may be the point', outcome: 'They communicate in gestures and YouTube clips and become genuinely close. It is slower and it costs nothing and it lasts longer.', effect: { squadMorale: 8, playerMorale: { who: 'oldest', delta: 6 } } },
          { id: 'sink', label: 'Let him learn it the hard way', desc: 'Six weeks of lessons and no allowances', outcome: 'He learns the language and he learns something else about the club at the same time. He is fluent by Christmas and gone by June.', effect: { playerMorale: { who: 'best', delta: -12 }, coins: -20, tag: 'mgr-hard-line' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-confidence-gone', title: 'He Has Stopped Shooting', icon: '🫥', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eleven games without a goal. He is now passing sideways from positions where he used to shoot, and doing it fast, so that nobody can accuse him of hesitating. That is the tell.',
        choices: [
          { id: 'drop', label: 'Take him out of the side', desc: 'Two weeks in the reserves, no cameras', outcome: 'He scores twice on a Tuesday and looks so relieved it is difficult to watch. He is back in on Saturday and nothing is really fixed.', effect: { playerMorale: { who: 'star', delta: -6 }, squadMorale: 2 }, next: 'after' },
          { id: 'keep-in', label: 'Keep picking him', desc: 'Say nothing about the run at all', outcome: 'Three more without. Then a scruffy one off his shin, and the whole bench is on the pitch before the ball has stopped.', effect: { playerMorale: { who: 'star', delta: 12 }, squadMorale: 4, boardMood: -1 }, next: 'after' },
          { id: 'video', label: 'Show him the clips', desc: 'Every chance he has not taken, back to back', outcome: 'It is a hard eleven minutes in a dark room. He is furious and he shoots on Saturday, which was the entire objective.', effect: { playerMorale: { who: 'star', delta: -4 }, prestige: 1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The goal arrives eventually, the way they do, and he does not celebrate. He stands in the corner with his hands on his head while ten men arrive on top of him.',
        choices: [
          { id: 'protect', label: 'Say nothing about it publicly', desc: 'Let the moment belong to him', outcome: 'He mentions it years later in a testimonial programme, in one line, and never says it to the manager\'s face.', effect: { squadMorale: 5, playerMorale: { who: 'star', delta: 8 } } },
          { id: 'praise', label: 'Make a fuss of it in the press', desc: 'A striker feeds on being talked about', outcome: 'He scores four in three. He also now needs the fuss, which becomes somebody else\'s problem in two years\' time.', effect: { playerMorale: { who: 'star', delta: 12 }, prestige: 1, tag: 'mgr-front-foot' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-late-again', title: 'Twelve Minutes Late', icon: '⏰', category: 'dressing-room',
    when: { minSeason: 1, temper: ['disciplinarian', 'firefighter'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Third time this month. He comes through the door with his boots already on, which he thinks makes it better. The rest of them have been standing on a cold pitch waiting for him.',
        choices: [
          { id: 'run', label: 'Make the squad run it off', desc: 'Everyone pays for one man', outcome: 'Old-fashioned, effective and cruel in the right proportions. He is never late again and two of them will not speak to him for a week.', effect: { squadMorale: -4, playerMorale: { who: 'star', delta: -8 }, tag: 'mgr-collective-punishment' } },
          { id: 'fine', label: 'Fine him and move on', desc: 'The jar on the shelf, no lecture', outcome: 'The system does the work and the manager does not have to be the villain. He is late twice more and the jar pays for the Christmas do.', effect: { coins: 25, squadMorale: 1 } },
          { id: 'lift', label: 'Pick him up yourself tomorrow', desc: 'Be outside his house at seven', outcome: 'He is mortified and on time. The manager discovers the actual reason on the drive in and never repeats it to anyone.', effect: { playerMorale: { who: 'star', delta: 14 }, squadMorale: 3, tag: 'mgr-listens' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-phones-on-the-peg', title: 'Phones On The Peg', icon: '📵', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ninety minutes before a home game the dressing room is silent and every man in it is looking down. Not nervous. Scrolling. The kit man has started laying the shirts out around the phones.',
        choices: [
          { id: 'box', label: 'A box by the door', desc: 'Phones in it from arrival to full time', outcome: 'The room is loud again within a fortnight, and three of them admit they prefer it. One never stops complaining.', effect: { squadMorale: 5, tag: 'mgr-strict' } },
          { id: 'leave', label: 'Leave them to it', desc: 'It is how they settle now', outcome: 'Nothing changes. Nothing gets worse either, and he has not wasted a rule on it.', effect: { squadMorale: 1 } },
          { id: 'music', label: 'Put the music back on instead', desc: 'Give the room a different noise to fill it', outcome: 'A fight about the playlist breaks out, which is the healthiest thing that has happened in there all season.', effect: { squadMorale: 7 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-last-season-legs', title: 'One More Year', icon: '🦵', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He asks about next season in the corridor, casually, in the way men ask about the things that frighten them. His legs went in February. He knows it and he is hoping the manager does not.',
        choices: [
          { id: 'honest', label: 'Tell him now', desc: 'In August, so he has a year to plan', outcome: 'He takes it standing up and thanks him for not stringing it out. He also plays the best six months of his late career out of pure spite.', effect: { playerMorale: { who: 'oldest', delta: -10 }, squadMorale: 6, prestige: 1, tag: 'mgr-straight-talker' } },
          { id: 'string', label: 'Say it depends on the season', desc: 'True, and a coward\'s truth', outcome: 'He believes it until March. When it ends he is not angry about the ending, he is angry about the seven months.', effect: { playerMorale: { who: 'oldest', delta: -14 }, squadMorale: -5, tag: 'mgr-avoids-it' } },
          { id: 'role', label: 'Offer him a squad role', desc: 'Fifteen starts, the cups, and a job after', outcome: 'He hates the word "role" and takes it anyway. He is the best thing in the dressing room for two years.', effect: { playerMorale: { who: 'oldest', delta: 6 }, squadMorale: 9, coins: -60 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-dropped-keeper', title: 'The Other Goalkeeper', icon: '🧤', category: 'dressing-room',
    when: { minSeason: 1, minPos: 0.4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two mistakes in three weeks, both leading to goals, both the kind everybody sees. The understudy has been outstanding in training since September and has not said a word about it, which is its own kind of pressure.',
        choices: [
          { id: 'change', label: 'Change the keeper', desc: 'Quietly, on a Friday, no explanation to the press', outcome: 'The new one keeps two clean sheets and then concedes a soft one, and the whole thing starts again with different names.', effect: { squadMorale: 3, playerMorale: { who: 'star', delta: -14 }, boardMood: 1 } },
          { id: 'stick', label: 'Stay with him', desc: 'A goalkeeper dropped is a goalkeeper broken', outcome: 'He makes a save in the last minute at a ground where the away end is right behind the goal, and he stands in front of them afterwards.', effect: { playerMorale: { who: 'star', delta: 16 }, boardMood: -1, prestige: 1 } },
          { id: 'cups', label: 'Split them — league and cups', desc: 'A fudge that keeps two men half-happy', outcome: 'Neither is happy and both stay sharp. The goalkeeping coach thinks it is the worst idea he has ever heard and does not say so.', effect: { squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-loan-request', title: 'He Wants To Go And Play', icon: '🚪', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has brought his agent, which is a mistake, and then sent the agent out of the room, which is not. He wants a loan. He is twenty-two and he has played four hundred and eleven minutes.',
        choices: [
          { id: 'let-go', label: 'Let him go', desc: 'A season somewhere he will start every week', outcome: 'He plays forty games and comes back a footballer instead of a prospect. The club that had him wants to keep him.', effect: { playerMorale: { who: 'unhappiest', delta: 16 }, coins: 40, squadMorale: 2 } },
          { id: 'keep', label: 'Refuse', desc: 'The squad is thin and he is needed', outcome: 'He is needed twice, for a total of forty minutes, and spends the rest of the year rotting in a tracksuit.', effect: { playerMorale: { who: 'unhappiest', delta: -18 }, squadMorale: -6, tag: 'mgr-blocks-moves' } },
          { id: 'deal', label: 'Give him a month to force his way in', desc: 'A real chance with a date on it', outcome: 'He starts three, is decent in two, and takes the loan in January anyway. Neither of them regrets the month.', effect: { playerMorale: { who: 'unhappiest', delta: 6 }, squadMorale: 4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-bonding-trip', title: 'Four Days Away', icon: '🏕️', category: 'dressing-room',
    when: { minSeason: 2, minCoins: 150 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The suggestion comes from the fitness staff and it is not really about fitness. Four days somewhere with poor phone signal, in the international break, at a cost the finance director will want explaining.',
        choices: [
          { id: 'go-hard', label: 'Somewhere cold and miserable', desc: 'Hills, rain, carrying things', outcome: 'They hate every hour of it and talk about it for six years. Two of them carry a third up a hill and that is the whole point.', effect: { coins: -140, squadMorale: 14, boardMood: -1 } },
          { id: 'go-soft', label: 'Somewhere warm with a pool', desc: 'Rest, sun, one night out', outcome: 'They come back tanned and rested and exactly as they were. A photograph of the one night out reaches the local paper.', effect: { coins: -200, squadMorale: 6, prestige: -1 } },
          { id: 'stay', label: 'Stay and work', desc: 'The break is a chance to get fit, not friendly', outcome: 'Physically they are ahead of everyone in November. The room is the same room it was in September.', effect: { squadMorale: -3, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-christmas-do', title: 'The Christmas Do', icon: '🎄', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They want a night out in December, in fancy dress, in a town with camera phones in it. The senior players have organised it already and are telling him rather than asking.',
        choices: [
          { id: 'bless', label: 'Let them have it', desc: 'One condition: home by two', outcome: 'They are home by four and there are three photographs he would rather did not exist. The room is unbreakable until March.', effect: { squadMorale: 12, prestige: -2, tag: 'mgr-permissive' }, next: 'after' },
          { id: 'attend', label: 'Go along for the first hour', desc: 'One drink, a photograph, then leave', outcome: 'His presence flattens the first hour and improves the rest of the night immeasurably by leaving it.', effect: { squadMorale: 8, prestige: -1 }, next: 'after' },
          { id: 'ban', label: 'Cancel it', desc: 'There is a game on the 26th', outcome: 'They go anyway, in a different town, without telling him. That is much worse and he does not find out until February.', effect: { squadMorale: -8, tag: 'mgr-strict' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'A photograph does the rounds in the first week of January. It is not scandalous. It is just a group of well-paid young men enjoying themselves, and the phone-in has decided that is a scandal.',
        choices: [
          { id: 'shield', label: 'Take the whole thing on yourself', desc: '"I sanctioned it, ask me about it"', outcome: 'Two days of unpleasant radio and a dressing room that would go through a wall for him.', effect: { squadMorale: 10, prestige: -2, boardMood: -1 } },
          { id: 'discipline', label: 'Fine the ones in the photograph', desc: 'Publicly, with a statement', outcome: 'The phone-in moves on by Thursday. So does a certain amount of goodwill that had been quietly accumulating since August.', effect: { squadMorale: -9, coins: 60, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-fines-jar', title: 'The Jar On The Shelf', icon: '🫙', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'By March the fines jar holds an amount of money that would embarrass a small business. Late boots, wrong socks, one man who keeps forgetting his own birthday. Somebody asks what happens to it.',
        choices: [
          { id: 'night-out', label: 'Straight behind the bar', desc: 'End of season, everyone, including the kit staff', outcome: 'The kit man cries at about eleven o\'clock and denies it for the rest of his life.', effect: { squadMorale: 10, prestige: 1 } },
          { id: 'charity', label: 'Give it to the club\'s food bank', desc: 'No announcement, no photographs', outcome: 'It gets out anyway, the way these things do, and it lands better for not having been announced.', effect: { squadMorale: 5, prestige: 3, tag: 'mgr-community' } },
          { id: 'club', label: 'Put it into the training-ground fund', desc: 'New gym mats, three cameras, a proper coffee machine', outcome: 'Sensible, dull and appreciated for exactly nine days, which is how long the coffee machine takes to break.', effect: { coins: 90, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-shirt-thrown', title: 'He Threw The Shirt Down', icon: '👕', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sixty-second minute, number held up, and he walks off the long way round and throws the shirt at the bench. Not near it. At it. Twelve thousand people see it and one camera holds on it for far too long.',
        choices: [
          { id: 'row', label: 'Have it out in the dressing room', desc: 'Now, loudly, in front of everyone', outcome: 'Two minutes of noise and then it is over and buried. The squad hear the manager set a line and hear the player accept it.', effect: { squadMorale: 6, playerMorale: { who: 'star', delta: -6 }, tag: 'mgr-front-foot' } },
          { id: 'drop', label: 'Leave him out for a month', desc: 'No conversation, just the team sheet', outcome: 'A month is a long time. He trains like an animal for three weeks and gives up in the fourth.', effect: { playerMorale: { who: 'star', delta: -16 }, squadMorale: 3, boardMood: 1 } },
          { id: 'private', label: 'Say nothing until Monday', desc: 'Let him spend a weekend with it', outcome: 'He arrives on Monday having already written the apology in his head. The manager lets him give it and adds nothing.', effect: { playerMorale: { who: 'star', delta: 4 }, squadMorale: 4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-injured-in-the-corner', title: 'The Man In The Corner', icon: '🩼', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine months into a knee. He does his rehab at seven so he is finished before the squad arrive, and he has stopped coming to games. The physio mentions, carefully, that he has stopped talking as well.',
        choices: [
          { id: 'bring-in', label: 'Put him back in the building', desc: 'Travel with the squad, sit in on meetings, do the video', outcome: 'He is uncomfortable for a fortnight and then he is a coach in all but name. The younger lads start asking him things.', effect: { playerMorale: { who: 'star', delta: 16 }, squadMorale: 6 } },
          { id: 'help', label: 'Get him someone to talk to', desc: 'Paid for by the club, no questions on the invoice', outcome: 'It is the most useful money the club spends that year and there is no way to put it on a spreadsheet.', effect: { coins: -70, playerMorale: { who: 'star', delta: 20 }, prestige: 1, tag: 'mgr-looks-after-them' } },
          { id: 'leave', label: 'Leave him to the medical staff', desc: 'It is their job and they are good at it', outcome: 'He gets fit. He is never the same in a dressing room again and he moves on in the summer without much of a goodbye.', effect: { playerMorale: { who: 'star', delta: -14 }, squadMorale: -4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-agent-in-the-car-park', title: 'A Car With The Engine Running', icon: '🚗', category: 'dressing-room',
    when: { minSeason: 2, needs: 'wonderkid' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Same car, three Thursdays running, engine on, parked where the youth team come out. The boy gets in it. He is seventeen and he has started buying rounds he cannot afford.',
        choices: [
          { id: 'confront', label: 'Knock on the window', desc: 'In front of the boy, in the car park', outcome: 'The agent is polite and entirely within his rights. The boy is humiliated and takes the manager\'s side for about six weeks.', effect: { playerMorale: { who: 'youngest', delta: -8 }, prestige: 1, tag: 'mgr-fights-agents' } },
          { id: 'family', label: 'Ring his mother', desc: 'Not the agent, not the boy — the house', outcome: 'She had no idea. There is a conversation in that kitchen that the club never hears about and the car does not come back.', effect: { playerMorale: { who: 'youngest', delta: 6 }, squadMorale: 3 } },
          { id: 'accept', label: 'Let him have his advisers', desc: 'Every player has them; better in the open', outcome: 'The agent becomes useful, then indispensable, then expensive. The boy signs, twice, and leaves at twenty-one for a fee that funds a stand.', effect: { coins: 200, playerMorale: { who: 'youngest', delta: 8 }, tag: 'mgr-agent-friendly' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-two-nines', title: 'Two Men, One Shirt', icon: '9️⃣', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Both strikers are in form and only one of them can start. They have stopped passing to each other in training, which they will both deny and both know is true.',
        choices: [
          { id: 'both', label: 'Play them together', desc: 'Change the shape to fit the players', outcome: 'It is chaotic and it scores goals and the midfield spends three months being outnumbered. Everyone enjoys it except the coaching staff.', effect: { squadMorale: 8, boardMood: -1, tag: 'mgr-front-foot' } },
          { id: 'pick', label: 'Pick one and say so', desc: 'Name the number one striker out loud', outcome: 'One of them is transformed and the other is finished at the club. Nobody can accuse him of dithering.', effect: { playerMorale: { who: 'best', delta: 14 }, squadMorale: -6, tag: 'mgr-decisive' } },
          { id: 'rotate', label: 'Rotate them week to week', desc: 'Nothing named, nothing settled', outcome: 'Both stay hungry and neither ever gets a run. In May they have nineteen goals between them and no idea who they are.', effect: { squadMorale: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-youth-on-the-bus', title: 'A Seat On The First-Team Coach', icon: '🚌', category: 'dressing-room',
    when: { minSeason: 2, temper: ['builder', 'players-manager'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two academy lads have trained with the first team all week. There is room on the coach and no chance either of them plays. The senior men have noticed and one of them made a joke about school runs.',
        choices: [
          { id: 'take', label: 'Take them', desc: 'Let them see how a matchday is done', outcome: 'They say nothing for four hours and take everything in. One of them is captain of the club a decade later.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -2, prestige: 1 } },
          { id: 'leave', label: 'Leave them at home', desc: 'The bus is for men who might play', outcome: 'Correct, professional, and it costs the club nothing except a story two boys would have told for years.', effect: { squadMorale: 2 } },
          { id: 'joke', label: 'Deal with the joke instead', desc: 'Find the senior man and have a word', outcome: 'He apologises to the manager and not to the boys, which is the wrong way round and the best available outcome.', effect: { squadMorale: 4, playerMorale: { who: 'oldest', delta: -6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-bereavement', title: 'A Death In The Family', icon: '🕯️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He asks to train. His father died on Tuesday and the funeral is Friday and he is standing in the office in his kit asking to be allowed to train, because the alternative is a house full of relatives.',
        choices: [
          { id: 'train', label: 'Let him train', desc: 'And tell the group to treat it as a normal Thursday', outcome: 'He is the best player on the grass for an hour and cries in the car park afterwards with the physio standing a respectful ten yards away.', effect: { playerMorale: { who: 'star', delta: 12 }, squadMorale: 6 } },
          { id: 'play', label: 'Start him Saturday', desc: 'If he wants it, he gets it', outcome: 'He scores and points at the sky and the away end sings his name for four straight minutes. Nobody at the club ever forgets it.', effect: { playerMorale: { who: 'star', delta: 20 }, squadMorale: 10, prestige: 2, clubLegacy: { kind: 'tradition', label: 'a minute\'s applause in the fourth minute, every season since' } } },
          { id: 'time', label: 'Give him a fortnight', desc: 'Whether he wants it or not', outcome: 'He resents it at the time. He thanks him for it in ten years and means it more than he meant anything.', effect: { playerMorale: { who: 'star', delta: -4 }, squadMorale: 5, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-new-baby', title: 'Six Weeks Of No Sleep', icon: '🍼', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His first child arrived a month ago and it shows in everything after seventy minutes. He has not mentioned it once. The fitness data has mentioned it every day for four weeks.',
        choices: [
          { id: 'rest', label: 'Rest him for three games', desc: 'No public reason given', outcome: 'The press decide he is out of favour and write it that way for a fortnight. He comes back sharp and grateful.', effect: { playerMorale: { who: 'star', delta: 12 }, prestige: -1 } },
          { id: 'manage', label: 'Change his week instead', desc: 'Later starts, lighter Tuesdays, home on Thursdays', outcome: 'The rest of the squad notice the different rules and mostly understand them. Mostly.', effect: { playerMorale: { who: 'star', delta: 10 }, squadMorale: -3 } },
          { id: 'nothing', label: 'Say nothing and pick him', desc: 'Everybody has a life; the game is on Saturday', outcome: 'He gets through it on adrenaline until November and then breaks down with something the doctor calls fatigue.', effect: { playerMorale: { who: 'star', delta: -10 }, coins: -30 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-gambling', title: 'The App On His Phone', icon: '🎲', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A senior pro comes to him rather than to the welfare officer, which is either trust or cowardice. One of the young ones is in trouble with money and it is not the kind of trouble that goes away by itself.',
        choices: [
          { id: 'club-help', label: 'Get the club involved properly', desc: 'Welfare, the league scheme, all of it on record', outcome: 'It is handled correctly and slowly and the boy hates every minute of the process that saves him.', effect: { playerMorale: { who: 'youngest', delta: -6 }, prestige: 2, coins: -50, tag: 'mgr-looks-after-them' } },
          { id: 'quiet', label: 'Sort it quietly', desc: 'Off the books, between the two of them', outcome: 'It works. It also means there is no record anywhere, and no protection for anyone, if it does not work next time.', effect: { playerMorale: { who: 'youngest', delta: 14 }, coins: -80, boardMood: -1 } },
          { id: 'senior', label: 'Give it to the senior pro', desc: 'He brought it; he can own it', outcome: 'The older man takes the boy under his wing and does a better job than any of the professionals would have.', effect: { squadMorale: 8, playerMorale: { who: 'oldest', delta: 8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-badges', title: 'He Wants To Coach', icon: '📋', category: 'dressing-room',
    when: { minSeason: 3, needs: 'veteran' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He asks about badges in the gym, between sets, so that it can be a joke if it goes badly. He is thirty-four and he has started standing in the right places without being told.',
        choices: [
          { id: 'fund', label: 'Pay for the course', desc: 'And give him the under-16s on Thursdays', outcome: 'He is dreadful for a year and very good in the second. He is still at the club three managers later.', effect: { coins: -60, playerMorale: { who: 'oldest', delta: 16 }, prestige: 1, tag: 'mgr-builds-staff' } },
          { id: 'wait', label: 'Tell him to finish playing first', desc: 'One job at a time', outcome: 'Fair, and he does not ask again. He goes and does his badges somewhere else and comes back to face them in four years.', effect: { playerMorale: { who: 'oldest', delta: -8 } } },
          { id: 'staff', label: 'Put him on the staff now', desc: 'Player-coach, both jobs, half a title', outcome: 'The dressing room does not know whether to talk to him. Neither does he. It is the wrong shape for everyone.', effect: { squadMorale: -5, playerMorale: { who: 'oldest', delta: 6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-double-sessions', title: 'Two A Day', icon: '🥵', category: 'dressing-room',
    when: { minSeason: 1, minPos: 0.55, temper: ['disciplinarian', 'firefighter', 'tactician'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The performance on Saturday was the sort that makes a manager want to do something physical about it. Doubles for a fortnight would send a message. The sports scientist has already asked for a word.',
        choices: [
          { id: 'run', label: 'Do it anyway', desc: 'They will be fit and they will be angry', outcome: 'Two soft-tissue injuries and one very good away performance. Nobody can agree afterwards whether it worked.', effect: { squadMorale: -8, coins: -40, boardMood: 1, tag: 'mgr-flogs-them' } },
          { id: 'ball', label: 'Do it with the ball', desc: 'Same volume, different currency', outcome: 'They are just as tired and they do not resent it. The sports scientist takes the credit, correctly.', effect: { squadMorale: 4, prestige: 1 } },
          { id: 'day-off', label: 'Give them Monday off instead', desc: 'The opposite message entirely', outcome: 'It is either inspired or weak and the result on Saturday decides which, retrospectively, for everybody.', effect: { squadMorale: 9, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-room-sharing', title: 'Who Shares With Who', icon: '🛏️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The hotel list goes up and there is a small delegation about it within the hour. The senior men want single rooms. Two of the younger ones would rather share and are too embarrassed to say so.',
        choices: [
          { id: 'singles', label: 'Everybody gets their own room', desc: 'Modern, professional, expensive', outcome: 'They sleep better and the corridor is silent all night, which the older staff find faintly depressing.', effect: { coins: -70, squadMorale: 3 } },
          { id: 'pairs', label: 'Keep pairs, and choose them yourself', desc: 'Deliberate pairings, changed every trip', outcome: 'One pairing produces a friendship, one produces a fight, and the rest produce nothing at all. Net positive.', effect: { squadMorale: 6, playerMorale: { who: 'youngest', delta: 6 } } },
          { id: 'let-them', label: 'Let them sort it out', desc: 'Grown men can choose a room', outcome: 'The same five choose each other every week and the two who never get chosen learn something about the club.', effect: { squadMorale: -4, playerMorale: { who: 'unhappiest', delta: -8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-something-missing', title: 'Money Off The Peg', icon: '🔐', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A watch on Tuesday. Cash from a coat on Thursday. Nobody says the word out loud but the room has changed shape — men are taking their bags out to the car before training now.',
        choices: [
          { id: 'cameras', label: 'Put a camera in', desc: 'Solve it with equipment, not accusations', outcome: 'It stops immediately and is never solved, which means every man in there keeps his private suspicion for good.', effect: { squadMorale: -4, coins: -30 } },
          { id: 'address', label: 'Address the room', desc: 'Everything back by Friday, no questions asked', outcome: 'The watch is on the physio\'s bench on Friday morning. Nobody ever mentions it again in any building.', effect: { squadMorale: 7, prestige: 1 } },
          { id: 'find', label: 'Find out who', desc: 'Quietly, and deal with him', outcome: 'It is one of the youngest and the reason is worse than the crime. He is at another club by March and the manager keeps the reason to himself.', effect: { playerMorale: { who: 'youngest', delta: -14 }, squadMorale: 2, coins: 30 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-they-doubt-the-system', title: 'They Do Not Believe In It', icon: '📐', category: 'dressing-room',
    when: { minSeason: 2, minPos: 0.5, temper: ['tactician', 'builder'] }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The shape has not worked since October. In the meeting they nod at the whiteboard and on Saturday, at 1-0 down, they abandon it inside ninety seconds without anyone giving an instruction.',
        choices: [
          { id: 'double-down', label: 'Run it until it works', desc: 'The idea is right; the execution is not', outcome: 'It takes eleven weeks and a change of two personnel and then it is the best thing at the club. The eleven weeks are horrible.', effect: { boardMood: -2, squadMorale: -6, prestige: 2, tag: 'mgr-held-nerve' } },
          { id: 'ask', label: 'Ask them what they would do', desc: 'Whiteboard, pen, and hand it over', outcome: 'What comes back is simpler than his idea and about seventy per cent as good, and they will run through walls for it.', effect: { squadMorale: 12, prestige: -1, tag: 'mgr-listens' } },
          { id: 'abandon', label: 'Bin it and go simple', desc: 'Two banks of four and win a game', outcome: 'They win a game. He has also just taught the dressing room that if they wait long enough he will fold.', effect: { squadMorale: 6, boardMood: 1, tag: 'mgr-folds' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-keepers-union', title: 'The Goalkeepers Have A Grievance', icon: '🧱', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'All three of them come together, which is unheard of, since goalkeepers are natural rivals. They do not like the goalkeeping coach\'s methods and they have brought printed evidence, which is very goalkeeper.',
        choices: [
          { id: 'back-coach', label: 'Back the coach', desc: 'He was appointed for a reason', outcome: 'They train sullenly for two months and the coach is proved right about one of the three, which he mentions often.', effect: { squadMorale: -5, prestige: 1 } },
          { id: 'change', label: 'Change the coach', desc: 'Three men who agree are usually right', outcome: 'The new voice fixes one thing and breaks another. The old coach goes to a rival and does well there.', effect: { coins: -90, squadMorale: 6, tag: 'mgr-changes-staff' } },
          { id: 'mediate', label: 'Sit in on their sessions for a fortnight', desc: 'Watch it yourself before deciding anything', outcome: 'Both sides behave impeccably while he is there, which tells him nothing and settles it completely.', effect: { squadMorale: 4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-shirt-number', title: 'He Wants The Number', icon: '🔢', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A signing wants a squad number that a club legend wore for fifteen years. It has not been worn since. There is no rule about it, only a kit man who has gone very quiet.',
        choices: [
          { id: 'give', label: 'Give him it', desc: 'A number is a number and he is here to play', outcome: 'The terraces let him know for a season and then he wins them over, and afterwards it is his number and nobody says otherwise.', effect: { playerMorale: { who: 'best', delta: 12 }, prestige: -2 } },
          { id: 'retire', label: 'Retire it properly', desc: 'Announce it, frame it, put it above the tunnel', outcome: 'The old man is invited back for it and stands in the tunnel not knowing what to do with his hands.', effect: { prestige: 3, coins: -40, clubLegacy: { kind: 'number', label: 'a shirt number retired above the tunnel' } } },
          { id: 'defer', label: 'Ask the kit man', desc: 'He has been here longer than anyone', outcome: 'He says give it to him, and says it in a way that makes clear what it costs. The signing wears it and knows.', effect: { squadMorale: 4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-coach-bust-up', title: 'His Own Assistant', icon: '📣', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The assistant contradicted him at half time in front of the group. He was right, which is the difficulty. Twenty men watched it happen and are now waiting to see what the building is.',
        choices: [
          { id: 'sack', label: 'Move him on', desc: 'One voice, or there is no voice', outcome: 'The squad understand the message perfectly and lose a coach several of them preferred. Nobody contradicts him again about anything.', effect: { squadMorale: -8, prestige: 1, coins: -60, tag: 'mgr-one-voice' } },
          { id: 'private', label: 'Take it out on him in private', desc: 'And back him publicly the next day', outcome: 'The room sees a united front and hears, through the walls, that it was not free. That is about the right amount.', effect: { squadMorale: 5, prestige: 1 } },
          { id: 'concede', label: 'Tell the group he was right', desc: 'Out loud, on Monday morning', outcome: 'Half of them think it is strength and half think it is weakness, and both halves work harder for a month.', effect: { squadMorale: 9, prestige: -1, tag: 'mgr-open' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-half-time-row', title: 'Fifteen Minutes', icon: '⏸️', category: 'dressing-room',
    when: { minSeason: 1, minPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two down at the interval and the performance is worse than the score. Fifteen minutes, one room, and eleven men who cannot look up from the floor.',
        choices: [
          { id: 'blast', label: 'Take the roof off', desc: 'Volume, names, no mercy', outcome: 'They come out and get one back inside four minutes and then concede a third. The whole thing is remembered as a success by exactly nobody.', effect: { squadMorale: -6, playerMorale: { who: 'unhappiest', delta: -10 } } },
          { id: 'quiet', label: 'Say almost nothing', desc: 'Two instructions, then sit down', outcome: 'The silence is more frightening than shouting would have been. The second half is a different game with the same result.', effect: { squadMorale: 3, prestige: 1 } },
          { id: 'one-man', label: 'Pick one and go through him', desc: 'The rest will hear it', outcome: 'The rest hear it. So does he, and he does not play well again until March.', effect: { squadMorale: 5, playerMorale: { who: 'unhappiest', delta: -16 }, tag: 'mgr-makes-examples' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-kit-man', title: 'A Coat On A Peg', icon: '🧥', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kit man has been here thirty-one years and eight managers. His coat hangs on the same peg it has always hung on. The new commercial director has plans for that room and wants it cleared by Friday.',
        choices: [
          { id: 'defend', label: 'Refuse to move him', desc: 'And say so in the meeting, in front of everybody', outcome: 'It is the first thing the manager does that the dressing room genuinely admires, and it makes an enemy upstairs for good.', effect: { squadMorale: 10, boardMood: -2, prestige: 2, tag: 'mgr-fights-upstairs' } },
          { id: 'compromise', label: 'Find him a better room', desc: 'Bigger, warmer, and not his', outcome: 'He says it is lovely. He carries the coat down himself and hangs it on a new peg and never mentions the old one.', effect: { squadMorale: 3, coins: -20 } },
          { id: 'comply', label: 'Let it go', desc: 'It is a room, and there are bigger fights', outcome: 'It is a room. He retires eleven months later and no one at the club can remember whose decision it was.', effect: { squadMorale: -6, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-sunday-off', title: 'Sunday', icon: '🛋️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Saturday was awful. The staff assume they are in on Sunday. The squad assume they are in on Sunday. Nobody has actually said either thing out loud yet.',
        choices: [
          { id: 'in', label: 'In at nine', desc: 'Watch it back, all of it, together', outcome: 'It is a grim two hours and something in the second half of the video is genuinely useful. Two of them stay behind afterwards.', effect: { squadMorale: -3, prestige: 1, tag: 'mgr-works-them' } },
          { id: 'off', label: 'Text them the day off', desc: 'Sent at ten on Saturday night', outcome: 'They arrive on Monday having decided among themselves that they owe him one. Whether they pay it is another matter.', effect: { squadMorale: 8, boardMood: -1 } },
          { id: 'staff', label: 'In for the staff only', desc: 'Fix it before they see it', outcome: 'The coaches lose their Sunday and the players lose nothing, and on Monday the session is unusually good.', effect: { squadMorale: 4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-the-exile-returns', title: 'Bringing Him Back In', icon: '↩️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has trained with the under-23s since a row in September that both of them handled badly. He is also, by some distance, the best midfielder at the club, and it is January.',
        choices: [
          { id: 'apologise', label: 'Go to him first', desc: 'Cross the car park and say his half of it', outcome: 'It costs him something in front of nobody and buys back a footballer. The squad find out and think more of him for it.', effect: { playerMorale: { who: 'unhappiest', delta: 20 }, squadMorale: 6, prestige: -1 } },
          { id: 'terms', label: 'Bring him back on your terms', desc: 'He apologises to the group, then he trains', outcome: 'He does it, flatly, in eleven words. He plays well and he is gone in the summer for less than he is worth.', effect: { playerMorale: { who: 'unhappiest', delta: -6 }, squadMorale: 3, coins: -40 } },
          { id: 'stay-out', label: 'Leave him where he is', desc: 'Consistency is worth more than a midfielder', outcome: 'The squad see that a line is a line. The league table sees a team without its best midfielder for five months.', effect: { squadMorale: 4, boardMood: -2, tag: 'mgr-hard-line' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-fitness-test', title: 'He Came Back Heavy', icon: '⚖️', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'First day of pre-season and one of them steps off the scales and does not make a joke about it. Six weeks off and he has clearly spent them somewhere with a bar and no running.',
        choices: [
          { id: 'public', label: 'Read the numbers out', desc: 'The whole squad, in the meeting room', outcome: 'He is back to weight in three weeks and the entire group is terrified of the first day back for the rest of the manager\'s tenure.', effect: { playerMorale: { who: 'star', delta: -14 }, squadMorale: 4, tag: 'mgr-makes-examples' } },
          { id: 'extra', label: 'Extra work, no announcement', desc: 'Early in, late out, nothing said', outcome: 'It takes five weeks and nobody outside the fitness room ever knows. He is the fittest man at the club by October.', effect: { playerMorale: { who: 'star', delta: 8 }, coins: -25 } },
          { id: 'fine-him', label: 'Fine him per pound', desc: 'A tariff, printed and pinned up', outcome: 'The jar is heavy and the squad find it funny and the point is entirely made. He also thinks he has bought the right to be heavy.', effect: { coins: 40, squadMorale: 3, playerMorale: { who: 'star', delta: -6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-homesick', title: 'The Quiet One', icon: '🌍', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Signed in August, twenty years old, two thousand miles from a kitchen he knows. He is polite to everybody and close to nobody, and he has been eating alone in the canteen since September.',
        choices: [
          { id: 'family', label: 'Fly his mother over', desc: 'A fortnight, club expense, no publicity', outcome: 'She cooks in his flat for two weeks and he is a different player for the rest of the season. It is the cheapest signing the club makes all year.', effect: { coins: -60, playerMorale: { who: 'youngest', delta: 22 }, tag: 'mgr-looks-after-them' } },
          { id: 'senior', label: 'Ask a senior pro to take him on', desc: 'Sunday dinners, lifts, a phone number', outcome: 'It takes a month to look natural. By Christmas the boy is the loudest person in the older man\'s house.', effect: { squadMorale: 8, playerMorale: { who: 'oldest', delta: 6 } } },
          { id: 'football', label: 'Give him more football', desc: 'He is homesick because he is not playing', outcome: 'Partly true. He plays, he improves, and he is still eating alone in April.', effect: { playerMorale: { who: 'youngest', delta: 6 }, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-too-many-bodies', title: 'Twenty-Six Professionals', icon: '👥', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There are not enough bibs, not enough pegs and not enough minutes. Six men will not make a matchday squad all season and every one of them turns up at nine every morning to be reminded of it.',
        choices: [
          { id: 'cull', label: 'Tell six men to find clubs', desc: 'In one morning, one at a time', outcome: 'It is the worst morning of his year and the training ground is a better place within a fortnight.', effect: { squadMorale: 6, coins: 120, playerMorale: { who: 'unhappiest', delta: -16 }, tag: 'mgr-ruthless' } },
          { id: 'two-groups', label: 'Split the training groups', desc: 'A first-team group and a second one, formally', outcome: 'It is honest and it is a public humiliation with a timetable. Two of the second group play their way out of it.', effect: { squadMorale: -5, playerMorale: { who: 'unhappiest', delta: -10 }, boardMood: 1 } },
          { id: 'carry', label: 'Carry all of them', desc: 'Everyone trains, everyone travels, nobody is written off', outcome: 'The wage bill is absurd and the group is unusually happy. In March the injuries come and he is glad of every one of them.', effect: { coins: -150, squadMorale: 10, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-not-enough-bodies', title: 'Fourteen Fit Men', icon: '🩹', category: 'dressing-room',
    when: { minSeason: 1, needs: 'thin-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two more went down on Tuesday. The bench on Saturday will have a goalkeeping coach on it for the numbers. The physio has started speaking in the tone people use in hospitals.',
        choices: [
          { id: 'youth', label: 'Raid the academy', desc: 'Five boys, one afternoon\'s notice', outcome: 'Two of them are out of their depth and one of them is not, and the one who is not never goes back.', effect: { playerMorale: { who: 'youngest', delta: 16 }, squadMorale: 4, prestige: 1 } },
          { id: 'rush', label: 'Rush the injured back', desc: 'Against medical advice, with consent', outcome: 'They get through Saturday. One of them does not get through the following Tuesday and is out until April.', effect: { squadMorale: -6, coins: -60, boardMood: 1, tag: 'mgr-risks-bodies' } },
          { id: 'defend', label: 'Set up to lose 1-0 rather than 4-0', desc: 'Ten men behind the ball and no apology', outcome: 'They lose 1-0 twice and draw one, which is more points than anyone expected and three of the dullest weeks in the club\'s history.', effect: { squadMorale: 2, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-shouting-at-the-star', title: 'In Front Of Everybody', icon: '🔊', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He lost his temper with the best player at the club on the training pitch, at volume, over something that was about the third thing rather than the thing itself. Twenty men and four cameras.',
        choices: [
          { id: 'apologise', label: 'Apologise to him in front of them', desc: 'Same pitch, next morning', outcome: 'Extraordinarily uncomfortable and completely effective. The squad watch the manager do the hardest available thing.', effect: { playerMorale: { who: 'best', delta: 14 }, squadMorale: 8, prestige: -1 } },
          { id: 'stand', label: 'Stand by it', desc: 'He needed it and the group needed to see it', outcome: 'The best player is superb for six weeks out of anger and then quietly asks his agent to start looking.', effect: { playerMorale: { who: 'best', delta: -12 }, squadMorale: 4, tag: 'mgr-makes-examples' } },
          { id: 'private-word', label: 'Square it privately', desc: 'A coffee, no witnesses, no announcement', outcome: 'The two of them are fine. The nineteen men who watched the shouting never see the coffee and draw their own conclusions.', effect: { playerMorale: { who: 'best', delta: 8 }, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-prayer-room', title: 'A Room With No Windows', icon: '🕊️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three of them ask, awkwardly, for somewhere quiet at the training ground. There is a storeroom full of cones nobody has opened since the last regime.',
        choices: [
          { id: 'give', label: 'Clear the storeroom', desc: 'Carpet, a lock, and no fuss made of it', outcome: 'It takes an afternoon and two hundred quid. Players who did not ask for it start using it before games to sit and think.', effect: { coins: -20, squadMorale: 9, prestige: 1, tag: 'mgr-looks-after-them' } },
          { id: 'hotel', label: 'Sort it on away trips instead', desc: 'Half the problem, none of the building work', outcome: 'It is better than nothing and it is visibly half a solution, and they thank him for it in a way that stings slightly.', effect: { squadMorale: 4 } },
          { id: 'no', label: 'Say the club is not set up for it', desc: 'And mean the sentence exactly as it sounds', outcome: 'They say of course, no problem, and use the physio room when it is empty. Nothing is said about it again by anyone.', effect: { squadMorale: -8, playerMorale: { who: 'best', delta: -10 }, tag: 'mgr-distant' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-testimonial', title: 'A Testimonial', icon: '🎖️', category: 'dressing-room',
    when: { minSeason: 3, needs: 'veteran' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ten years, four hundred games, one club. He has not asked for a testimonial and three senior pros have asked on his behalf. The fixture list has one available Tuesday in July and the commercial department has doubts.',
        choices: [
          { id: 'full', label: 'Give him the lot', desc: 'Full house, a proper opponent, his name on the programme', outcome: 'Nineteen thousand come. He walks a lap with a child on each shoulder and the ground stands the whole way round.', effect: { coins: -80, squadMorale: 12, prestige: 3, playerMorale: { who: 'oldest', delta: 20 }, clubLegacy: { kind: 'tradition', label: 'a testimonial night for ten years\' service' } } },
          { id: 'small', label: 'A friendly and a dinner', desc: 'Modest, cheap and sincere', outcome: 'Four thousand come and the dinner runs to two in the morning. He prefers it to the alternative and says so.', effect: { squadMorale: 7, playerMorale: { who: 'oldest', delta: 12 } } },
          { id: 'none', label: 'Explain that it is not the club\'s way', desc: 'One rule for everyone, no exceptions', outcome: 'He nods and shakes hands. Three of the senior men do not raise it again and do not forget it either.', effect: { squadMorale: -9, playerMorale: { who: 'oldest', delta: -16 }, boardMood: 1, tag: 'mgr-distant' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-vice-captain-vote', title: 'Let Them Vote', icon: '🗳️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The vice-captaincy is open. A coach suggests letting the squad pick it. It is either a masterstroke or handing away the one thing a manager should never hand away.',
        choices: [
          { id: 'vote', label: 'Hold the vote', desc: 'Secret ballot, result announced whatever it is', outcome: 'They pick a man he would not have picked, who turns out to be exactly right, which is humbling in a useful way.', effect: { squadMorale: 12, prestige: -1, tag: 'mgr-open' } },
          { id: 'appoint', label: 'Appoint, and explain why', desc: 'His choice, with the reasoning out loud', outcome: 'The reasoning is good and half of them still think he picked his favourite. Which he did, and correctly.', effect: { squadMorale: 3 } },
          { id: 'none', label: 'Leave the job empty', desc: 'One captain is enough', outcome: 'Nothing goes wrong for four months. Then the captain is injured at a ground three hundred miles away and nobody organises anything.', effect: { squadMorale: -4, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-canteen', title: 'The Canteen', icon: '🍽️', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new nutritionist has removed the fried breakfast, the puddings and the sauce. The chef has been at the club for nineteen years and has begun cooking with visible resentment.',
        choices: [
          { id: 'science', label: 'Back the nutritionist', desc: 'The numbers are the numbers', outcome: 'Body fat down four per cent by Christmas and the canteen is silent at lunch for the first time in two decades.', effect: { squadMorale: -5, prestige: 1, boardMood: 1 } },
          { id: 'chef', label: 'Back the chef', desc: 'Men who are happy eat what they are given', outcome: 'The room is warm and loud and the sports scientists have gone very quiet in meetings, which he notices in April.', effect: { squadMorale: 8, boardMood: -1, tag: 'mgr-old-school' } },
          { id: 'sunday-rule', label: 'One day a week for the old menu', desc: 'A truce with a date on it', outcome: 'Thursdays become the best day of the week and the compromise holds for three years, which is a long time in a canteen.', effect: { squadMorale: 6, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-two-friends', title: 'One Of Them Has To Go', icon: '🤝', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They arrived together, live four doors apart and their wives are close. Only one of them is going to be here in August and both of them worked it out before the manager did.',
        choices: [
          { id: 'tell-both', label: 'Tell both of them at once', desc: 'Same room, same sentence', outcome: 'It is brutal and it is fair and neither of them has to hear it second-hand in a car park. One of them thanks him.', effect: { squadMorale: 4, playerMorale: { who: 'unhappiest', delta: -8 }, prestige: 1, tag: 'mgr-straight-talker' } },
          { id: 'separately', label: 'Tell them separately', desc: 'A day apart, in the proper order', outcome: 'The one told second already knows and spends a day pretending not to, which is the cruellest available version.', effect: { squadMorale: -5, playerMorale: { who: 'unhappiest', delta: -12 } } },
          { id: 'keep-both', label: 'Find a way to keep both', desc: 'Rework the budget somewhere else', outcome: 'It works, at the cost of a signing the team badly needed. The dressing room is a lovely place in a mid-table season.', effect: { coins: -160, squadMorale: 10, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-hard-week-off', title: 'The Wednesday In February', icon: '❄️', category: 'dressing-room',
    when: { minSeason: 1, minPos: 0.3, maxPos: 0.75 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Frozen pitches, eleven games in six weeks and a squad that has stopped talking at breakfast. Mid-table, nothing to play for yet, nothing lost either. February does this every single year.',
        choices: [
          { id: 'golf', label: 'Cancel training and take them all to a golf course', desc: 'Nobody has to be good at golf', outcome: 'Four of them are dreadful and one is a scratch handicap, which nobody knew, and the coach home is the loudest it has been since August.', effect: { coins: -50, squadMorale: 11 } },
          { id: 'grind', label: 'Work through it', desc: 'February is what separates teams', outcome: 'They come out of it in March in better condition than anyone they play. They also come out of it flat, and flat costs two games.', effect: { squadMorale: -6, boardMood: 1, tag: 'mgr-works-them' } },
          { id: 'families', label: 'Bring the families in for a day', desc: 'Kids on the pitch, the lot', outcome: 'It is chaos and there are two hundred children on the training pitch and it is the best Wednesday of the season.', effect: { squadMorale: 9, prestige: 2, coins: -30, tag: 'mgr-community' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-he-wont-be-subbed', title: 'He Will Not Come Off', icon: '🙅', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board goes up and he waves it away. Actually waves it away, on the pitch, with the fourth official standing there holding it. The replacement is halfway out of his tracksuit.',
        choices: [
          { id: 'force', label: 'Bring him off anyway', desc: 'Stand at the touchline until he walks', outcome: 'It takes eleven seconds that feel like a minute. He does not look at the bench and he does not do it again.', effect: { playerMorale: { who: 'star', delta: -12 }, squadMorale: 5, prestige: 1 } },
          { id: 'relent', label: 'Wave the substitute back', desc: 'Let him have his way in front of the crowd', outcome: 'He scores in the eighty-eighth minute. It is the worst possible outcome and everyone in the technical area knows it.', effect: { playerMorale: { who: 'star', delta: 12 }, squadMorale: -8, prestige: -2, tag: 'mgr-folds' } },
          { id: 'after', label: 'Bring him off and never mention it', desc: 'No fine, no meeting, no comment', outcome: 'The silence does more than a punishment would. He apologises unprompted on the Wednesday, badly, and it is accepted.', effect: { playerMorale: { who: 'star', delta: 4 }, squadMorale: 6 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-boots-deal', title: 'The Boot Deal', icon: '👟', category: 'dressing-room',
    when: { minSeason: 2, needs: 'wonderkid' }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boot company wants the young one and has offered the club nothing and the boy a great deal. He has turned up in a pair he cannot yet walk in properly and has blisters he is hiding.',
        choices: [
          { id: 'let', label: 'Let him take it', desc: 'It is his money and his feet', outcome: 'He signs, buys his mother a car, and takes six weeks to stop limping. The car matters more than the six weeks.', effect: { playerMorale: { who: 'youngest', delta: 14 }, squadMorale: -2 } },
          { id: 'block', label: 'Tell him to wait a year', desc: 'And back it with the club\'s weight', outcome: 'He is furious. The deal on the table twelve months later is four times bigger and he never quite gives the manager credit.', effect: { playerMorale: { who: 'youngest', delta: -10 }, coins: 60, prestige: 1 } },
          { id: 'club-deal', label: 'Get the club into the conversation', desc: 'If they want the boy they can kit out the academy', outcome: 'The academy gets three years of boots and the boy gets slightly less. Nobody at under-12 level has ever cared about anything more.', effect: { coins: 110, playerMorale: { who: 'youngest', delta: -4 }, prestige: 1, tag: 'mgr-club-first' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-warm-down', title: 'Nobody Does The Warm-Down', icon: '🧘', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The bikes come out after the final whistle and four men use them. The rest are showered and on the phone. The head of medical has stopped writing it in the report because nobody reads that section.',
        choices: [
          { id: 'mandatory', label: 'Make it compulsory', desc: 'Nobody on the coach until it is done', outcome: 'The coach leaves twenty minutes later every week for a season and the soft-tissue injuries halve. Nobody thanks anybody.', effect: { squadMorale: -4, coins: 40, boardMood: 1 } },
          { id: 'seniors', label: 'Get the senior men doing it first', desc: 'Change the room, not the rules', outcome: 'Two of the old heads start doing it loudly and within a month it is simply what the club does after a game.', effect: { squadMorale: 6, playerMorale: { who: 'oldest', delta: 8 }, prestige: 1 } },
          { id: 'drop', label: 'Let it go', desc: 'Pick the fights that win games', outcome: 'Nothing happens for four months. Then three hamstrings in a fortnight and a very quiet medical meeting.', effect: { coins: -60, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-mascot', title: 'The Boy In The Tunnel', icon: '🧒', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The mascot is eight, in a kit two sizes too big, and has been assigned to hold the hand of the one player in the squad who is currently getting abused from three sides of the ground.',
        choices: [
          { id: 'keep', label: 'Leave it exactly as it is', desc: 'Let the boy walk out with him', outcome: 'The camera finds them and the ground softens for ninety minutes and neither the club nor the manager ever admits it was deliberate.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, prestige: 2 } },
          { id: 'swap', label: 'Swap him to the captain', desc: 'Do not use a child as a shield', outcome: 'The right call, made for the right reason, and the abuse carries on for the full ninety minutes.', effect: { playerMorale: { who: 'unhappiest', delta: -6 }, prestige: 1 } },
          { id: 'both', label: 'Send the whole squad out with kids', desc: 'Twenty-two mascots, a logistical nightmare', outcome: 'The commercial department loses its mind and the photograph is on the front of the programme for the next eleven years.', effect: { coins: -40, prestige: 3, squadMorale: 5, clubLegacy: { kind: 'tradition', label: 'a mascot for every player, every home game' } } },
        ],
      },
    },
  },

  // ── MEDIA ────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p1-team-sheet-leak', title: 'It Was Out By Ten', icon: '📰', category: 'media',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The side he named at ten past nine on Friday is on a fan account by half past. Word for word, in order, including the two he changed his mind about at the last minute.',
        choices: [
          { id: 'hunt', label: 'Find out who', desc: 'Phones, timings, the lot', outcome: 'He narrows it to four people and never gets closer than that. Everybody in the building knows they are being looked at.', effect: { squadMorale: -8, prestige: 1, tag: 'mgr-suspicious' }, next: 'after' },
          { id: 'feed', label: 'Name a false side next week', desc: 'And see where it comes out', outcome: 'It surfaces in ninety minutes on the same account. He now knows the room, if not the man, and says nothing about it for a month.', effect: { squadMorale: -3, prestige: 2 }, next: 'after' },
          { id: 'shrug', label: 'Name the side an hour before kick-off from now on', desc: 'Fix the process, not the person', outcome: 'The leak stops mattering. Two senior players say, not unkindly, that they preferred knowing on a Friday.', effect: { squadMorale: -2, prestige: 1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'A reporter asks about it in the press conference, in a tone suggesting he already knows more than the manager does.',
        choices: [
          { id: 'joke', label: 'Make a joke of it', desc: 'Offer him next week\'s side for a fiver', outcome: 'The room laughs and the story dies in a paragraph. The manager has also just told everyone he is not going to do anything about it.', effect: { prestige: 1, squadMorale: 2 } },
          { id: 'cold', label: 'Refuse to discuss internal matters', desc: 'Three words and the next question', outcome: 'It runs for four days instead of one, and the phrase "internal matters" is in every headline.', effect: { prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-phone-in', title: 'The Six O\'Clock Phone-In', icon: '📻', category: 'media',
    when: { minSeason: 2, minPos: 0.6 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two hours of local radio after another defeat, and a caller from the same district every year, saying the same thing every year, about a manager whose name changes. The players\' partners listen to it in the car.',
        choices: [
          { id: 'ring-in', label: 'Ring in yourself', desc: 'Live, unannounced, on air', outcome: 'It is national news within an hour. He is articulate for eleven minutes and the clip that survives is four seconds of him sounding rattled.', effect: { prestige: -1, squadMorale: 10, boardMood: -2, tag: 'mgr-rang-the-phone-in' } },
          { id: 'ban', label: 'Ban the station from the ground', desc: 'No access, no interviews, nothing', outcome: 'The station makes a fortnight of it and wins. The players think it is brilliant and the chairman does not.', effect: { boardMood: -2, squadMorale: 8, prestige: -2 } },
          { id: 'ignore', label: 'Never listen to it again', desc: 'And tell the staff the same', outcome: 'It carries on without him, which is what it was always going to do. Two players keep listening and he cannot stop them.', effect: { squadMorale: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-fanzine', title: 'The Fanzine', icon: '📓', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sold outside the ground for two quid, photocopied, funny, and rude about him for eight pages. It is also right about three things the club has been getting wrong for a decade.',
        choices: [
          { id: 'invite', label: 'Invite the editor in', desc: 'A cup of tea and an hour of the truth', outcome: 'He is nineteen, works in a warehouse, and is more insightful about the club than two people upstairs. The next issue is harder on him, not softer.', effect: { prestige: 2, tag: 'mgr-open' } },
          { id: 'write', label: 'Write a piece for it', desc: 'Unpaid, unedited, in their pages', outcome: 'It is the most read thing he does all year. Half the terrace decides he is all right, and the club\'s press officer ages visibly.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-fans-favourite' } },
          { id: 'nothing', label: 'Let it be', desc: 'It is a fanzine, not a broadsheet', outcome: 'Correct, and it grows, and in four years it is the thing the national papers quote when they write about the club.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-documentary', title: 'The Cameras Want In', icon: '🎥', category: 'media',
    when: { minSeason: 2, minTier: 1, maxTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A production company wants a season inside the club. Full access, dressing room included. The money is real and the phrase "editorial independence" appears eleven times in the contract.',
        choices: [
          { id: 'yes', label: 'Let them in', desc: 'Everything, including half time', outcome: 'The money builds a stand. The half-time footage from a February defeat follows several of those men for the rest of their careers.', effect: { coins: 400, prestige: 2, squadMorale: -10, tag: 'mgr-on-camera' }, next: 'after' },
          { id: 'limited', label: 'Everywhere except the dressing room', desc: 'One line, non-negotiable', outcome: 'They take it, grumbling, and make something duller and kinder. The club gets half the money and keeps its one private room.', effect: { coins: 180, squadMorale: 4 }, next: 'after' },
          { id: 'no', label: 'Refuse it', desc: 'A football club is not a television programme', outcome: 'The board are unimpressed by a lost six-figure sum and the dressing room does not learn, for another two years, that he turned it down for them.', effect: { boardMood: -2, prestige: 1, tag: 'mgr-closed-doors' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'A researcher asks, very politely, whether the manager will do a piece to camera about his own family. There is a chair set up and a light already on.',
        choices: [
          { id: 'personal', label: 'Do it properly', desc: 'Twenty minutes, the whole thing', outcome: 'It is the segment everybody talks about and the reason strangers now approach his children in supermarkets.', effect: { prestige: 3, tag: 'mgr-public-figure' } },
          { id: 'decline', label: 'Talk about football instead', desc: 'Politely, for the full twenty minutes', outcome: 'They use eight seconds of it. The programme is about the club rather than the man, which was the point.', effect: { prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-pundit-grudge', title: 'The Man In The Studio', icon: '📺', category: 'media',
    when: { minSeason: 2, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A former player with a Saturday evening chair has mentioned him in eleven of the last twelve broadcasts and not once favourably. There is history there that neither of them has ever explained on air.',
        choices: [
          { id: 'answer', label: 'Answer him publicly', desc: 'By name, in a press conference', outcome: 'It runs for a week and he is the story instead of the team. The pundit gets a column out of it and the manager does not.', effect: { prestige: -2, squadMorale: 6, boardMood: -1, tag: 'mgr-feuds' } },
          { id: 'invite', label: 'Invite him to the training ground', desc: 'Come and watch a session, then say it', outcome: 'He comes. He is decent company. He is exactly as critical the following Saturday and somehow it stings less.', effect: { prestige: 2 } },
          { id: 'ignore', label: 'Never say his name', desc: 'Not once, to anybody, ever', outcome: 'It costs nothing and achieves nothing and there is a certain dignity in it that the dressing room notices.', effect: { prestige: 1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-supporters-letter', title: 'A Letter, Handwritten', icon: '✉️', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four pages, in biro, from a man who has had the same seat since 1974. It is not abusive. It is worse than that — it is disappointed, and it is specific, and every point in it is fair.',
        choices: [
          { id: 'reply', label: 'Write back by hand', desc: 'Four pages of his own, no press officer', outcome: 'The old man frames it. He tells the story in the pub for twenty years and the club gains a defender it did not know it needed.', effect: { prestige: 3, tag: 'mgr-community' } },
          { id: 'invite', label: 'Bring him to the training ground', desc: 'A day out, lunch with the squad', outcome: 'He is stunned and shy and asks the best question anyone has asked the manager all season, over a bowl of soup.', effect: { prestige: 2, squadMorale: 5, coins: -10 } },
          { id: 'file', label: 'Pass it to the press office', desc: 'A standard reply and a signed photograph', outcome: 'A perfectly professional response. It is on a fan forum inside a week, photographed next to the four handwritten pages.', effect: { prestige: -2, tag: 'mgr-distant' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-banner', title: 'The Banner In The Corner', icon: '🚩', category: 'media',
    when: { minSeason: 2, minPos: 0.7 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Bedsheet, black paint, six words about the manager. It goes up in the corner at twenty to three and the stewards look at each other and decide it is somebody else\'s problem.',
        choices: [
          { id: 'remove', label: 'Have it taken down', desc: 'Before kick-off, in front of everyone', outcome: 'Four thousand people watch a steward fold a bedsheet and the noise it generates is worse than the bedsheet was.', effect: { prestige: -2, boardMood: -1, tag: 'mgr-thin-skinned' } },
          { id: 'leave', label: 'Leave it', desc: 'They paid to come in', outcome: 'It hangs there for the full ninety minutes and it is on every highlights package. It is gone by the next home game.', effect: { prestige: 1, squadMorale: -4 } },
          { id: 'address', label: 'Mention it afterwards', desc: '"They\'re entitled, and I\'d have made one myself"', outcome: 'It defuses the whole thing in one sentence and the same corner sings his name in April, which is football all over.', effect: { prestige: 3, squadMorale: 6, tag: 'mgr-fans-favourite' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-mistranslation', title: 'Something He Did Not Say', icon: '🌐', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An interview with a foreign outlet comes back into the English press through two translations. In the version now circulating he has called his own defence amateurish. He said the opposite, at length, twice.',
        choices: [
          { id: 'correct', label: 'Publish the recording', desc: 'The full audio, unedited', outcome: 'It is settled in an afternoon and the correction gets one-tenth of the coverage of the accusation, as corrections do.', effect: { prestige: 1, squadMorale: 4 } },
          { id: 'apologise', label: 'Apologise for it anyway', desc: 'To the defenders, in front of the group', outcome: 'They know he did not say it. They also see a manager apologising for something that was not his fault, and it counts.', effect: { squadMorale: 10, prestige: -1 } },
          { id: 'own', label: 'Say it, properly, on purpose', desc: 'If it is out there, make it true and useful', outcome: 'A staggering gamble. Two defenders are outstanding for two months and one never plays for him again.', effect: { squadMorale: -6, playerMorale: { who: 'best', delta: -14 }, prestige: 2, tag: 'mgr-front-foot' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-viral-clip', title: 'Eleven Seconds', icon: '📱', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A clip of him on the touchline, out of context, with a caption somebody else has written. Four million views by Tuesday. His mother has seen it and rung him about it.',
        choices: [
          { id: 'laugh', label: 'Lean into it', desc: 'Turn up on Friday in a T-shirt with the still on it', outcome: 'It dies instantly, because there is nothing left to laugh at. The club sells nine hundred of the T-shirts.', effect: { prestige: 2, coins: 60, squadMorale: 6 } },
          { id: 'context', label: 'Explain what actually happened', desc: 'Carefully, in a press conference', outcome: 'Nobody watches the explanation. Two people who matter do, and one of them is the chairman.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'silence', label: 'Never mention it', desc: 'It is a fortnight of somebody else\'s entertainment', outcome: 'It is a fortnight. Then it is a reference, then it is nothing, and he is asked about it once more in three years.', effect: { prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-local-paper-turned', title: 'The Local Paper Has Turned', icon: '🗞️', category: 'media',
    when: { minSeason: 2, minPos: 0.6 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The man who has covered the club for nineteen years and been fair for all of them has written a piece with the words "the end of the road" in it. He rang first, which somehow makes it worse.',
        choices: [
          { id: 'freeze', label: 'Stop talking to him', desc: 'Club statements only, from now on', outcome: 'He writes it all anyway, from other sources, with fewer facts and less sympathy. The coverage gets measurably worse.', effect: { prestige: -2, tag: 'mgr-closed-doors' } },
          { id: 'confront', label: 'Have it out with him privately', desc: 'In the car park, no audience', outcome: 'A very direct fifteen minutes. They shake hands, and the reporter writes the same thing next week because it is still true.', effect: { prestige: 1 } },
          { id: 'access', label: 'Give him more access, not less', desc: 'A seat on the coach and nothing off limits', outcome: 'He sees how hard it is and writes about that instead. It does not change a single result and it changes the tone of a whole town.', effect: { prestige: 3, boardMood: -1, tag: 'mgr-open' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-touchline-mic', title: 'The Microphone Was On', icon: '🎙️', category: 'media',
    when: { minSeason: 2, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Something he said to the fourth official in the eighty-first minute has been picked up by a pitchside microphone and broadcast to about two million people. It is not a phrase he would use at home.',
        choices: [
          { id: 'apologise', label: 'Apologise immediately', desc: 'Before anybody asks him to', outcome: 'It is over by Monday. The dressing room is faintly disappointed, which is a strange thing to be disappointed about.', effect: { prestige: 1, boardMood: 1, squadMorale: -3 } },
          { id: 'unrepentant', label: 'Stand by every word', desc: 'And repeat the substance of it soberly', outcome: 'A charge, a fine and a touchline ban. Also a dressing room that would follow him into a burning building.', effect: { coins: -80, squadMorale: 12, boardMood: -2, tag: 'mgr-feuds' } },
          { id: 'joke', label: 'Blame the microphone', desc: '"It should not have been that close to me"', outcome: 'It is a decent line and it does not work. The clip is played again every time he is mentioned for two seasons.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-walkout', title: 'He Walked Out', icon: '🚶', category: 'media',
    when: { minSeason: 2, minPos: 0.65 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fourth question in a row about his future. He stands up, unclips the microphone, puts it on the table and leaves. There is fourteen seconds of nobody saying anything and every second is recorded.',
        choices: [
          { id: 'back', label: 'Go back in', desc: 'Sit down and take the rest of it', outcome: 'He takes another twenty minutes and answers everything. It is the strongest he has looked in months and it costs him a lot to do.', effect: { prestige: 3, boardMood: 1 } },
          { id: 'stay-out', label: 'Stay out', desc: 'The press officer can handle it', outcome: 'The footage of the empty chair is on every bulletin. The club is fined and the chairman rings that night.', effect: { prestige: -2, coins: -40, boardMood: -2, tag: 'mgr-under-siege' } },
          { id: 'statement', label: 'Put out a written statement instead', desc: 'Everything he would have said, in print', outcome: 'It is measured and comprehensive and completely ignored in favour of the fourteen seconds of silence.', effect: { prestige: -1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-ghost-column', title: 'A Column With His Name On It', icon: '✒️', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A national paper offers a weekly column, ghostwritten, for money that would embarrass most of his coaching staff. He would approve every word. He would also not write a single one of them.',
        choices: [
          { id: 'take', label: 'Take it', desc: 'Approve every word and cash the cheque', outcome: 'One week the ghost puts a sentence in about a rival that he did not read closely enough. It is a bad fortnight.', effect: { coins: 120, prestige: -2, tag: 'mgr-columnist' } },
          { id: 'write', label: 'Take it and actually write it', desc: 'An hour every Wednesday night, himself', outcome: 'It is worse prose and much better reading, and after a year people quote it. He resents the Wednesdays.', effect: { coins: 80, prestige: 3 } },
          { id: 'refuse', label: 'Turn it down', desc: 'One job is enough', outcome: 'They give the column to a former player who uses it, several times, to explain what the manager is doing wrong.', effect: { prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-photographer', title: 'A Long Lens In The Trees', icon: '📷', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The groundsman spots him first — a photographer in the treeline beyond the far pitch, on a public footpath, with a lens the length of an arm. Friday. Set-piece work.',
        choices: [
          { id: 'screens', label: 'Put screens up', desc: 'Ten grand of green netting around the far pitch', outcome: 'It works and it looks like paranoia from the road, and the caption under the photograph of the netting writes itself.', effect: { coins: -100, prestige: -1, tag: 'mgr-closed-doors' } },
          { id: 'decoy', label: 'Work on the wrong set pieces', desc: 'Forty minutes of something they will never use', outcome: 'The published photographs are of a routine that does not exist. He enjoys this more than he will ever admit publicly.', effect: { prestige: 2, squadMorale: 5 } },
          { id: 'tea', label: 'Send someone out with a cup of tea', desc: 'And an invitation to shoot from inside', outcome: 'He comes in, takes better pictures, and the club gets to see them first. Nothing tactical ever appears.', effect: { prestige: 2, tag: 'mgr-open' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-hospital-visit', title: 'The Ward Before Christmas', icon: '🎁', category: 'media',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The children\'s ward, the third week of December, and the club\'s press officer wants the photographers there. Two of the squad have said, privately, that they would rather go without them.',
        choices: [
          { id: 'no-cameras', label: 'Go without cameras', desc: 'Nobody knows, nobody posts it', outcome: 'They stay two hours longer than planned. It gets out through a nurse three weeks later, which is the only way it should ever get out.', effect: { prestige: 3, squadMorale: 8, tag: 'mgr-community' } },
          { id: 'cameras', label: 'Take the photographers', desc: 'The publicity brings donations', outcome: 'The appeal raises a serious amount of money and one photograph makes several people at the club uncomfortable for years.', effect: { coins: 90, prestige: 1, squadMorale: -4 } },
          { id: 'squad', label: 'Send the whole squad, twice', desc: 'December and again in March, no announcement', outcome: 'The March visit is the one that matters and nobody outside the hospital ever hears about it.', effect: { squadMorale: 10, prestige: 2, clubLegacy: { kind: 'tradition', label: 'two hospital visits a year, never announced' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-podcast', title: 'Two Hours, No Edit', icon: '🎧', category: 'media',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A podcast with a large and devoted audience wants two hours, unedited, no topics off limits. The press officer has used the phrase "absolutely not" and then gone to get a coffee.',
        choices: [
          { id: 'do-it', label: 'Do the two hours', desc: 'Everything, including the bits that hurt', outcome: 'It is the best interview he ever gives and there are four minutes in the second hour that follow him for years.', effect: { prestige: 4, boardMood: -1, tag: 'mgr-public-figure' } },
          { id: 'conditions', label: 'Do it with conditions', desc: 'No transfers, no contracts, no other clubs', outcome: 'It is pleasant and thin and the audience can hear the list of conditions in every answer.', effect: { prestige: 1 } },
          { id: 'no', label: 'Decline', desc: 'There is nothing to gain and a lot to lose', outcome: 'They have his predecessor on instead, who is generous about the club and not generous about him.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-schoolboy-question', title: 'The Boy With The Notebook', icon: '📝', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A school newspaper has been given a seat at the back for one press conference. He is twelve, he has written his questions out, and the professionals in the room are enjoying themselves at his expense.',
        choices: [
          { id: 'first', label: 'Take his question first', desc: 'Before any of the nationals', outcome: 'The room shuts up. The question is better than three of the ones that follow it and the manager says so out loud.', effect: { prestige: 3, tag: 'mgr-community' } },
          { id: 'after', label: 'Give him ten minutes afterwards', desc: 'One to one, with the recorder on', outcome: 'The piece he writes is printed in the local paper too, and the boy is a football writer twenty years later.', effect: { prestige: 2 } },
          { id: 'normal', label: 'Treat him exactly like the rest', desc: 'Same tone, same brevity, no allowances', outcome: 'He gets a straight answer and no special treatment and, he tells people later, that was the point.', effect: { prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-open-letter', title: 'An Open Letter', icon: '📜', category: 'media',
    when: { minSeason: 2, minPos: 0.75 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Things have got bad enough that a letter to the supporters is being discussed upstairs. Somebody has drafted one already and it contains the word "journey" twice.',
        choices: [
          { id: 'own-words', label: 'Write it himself, badly', desc: 'Short, plain, no press office', outcome: 'Two hundred words with no adjectives in them. It is pinned up in three pubs and read out on the radio.', effect: { prestige: 3, squadMorale: 5, boardMood: -1 } },
          { id: 'theirs', label: 'Sign the draft', desc: 'It is professional and it is not his voice', outcome: 'Nobody believes a word of it, which is fair, because he did not write a word of it.', effect: { prestige: -2, boardMood: 1 } },
          { id: 'none', label: 'Publish nothing', desc: 'Results are the only letter that works', outcome: 'Silence reads as arrogance for six weeks. Then they win three and nobody mentions letters again.', effect: { prestige: -1, boardMood: -1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-away-end-song', title: 'They Have A Song About Him', icon: '🎵', category: 'media',
    when: { minSeason: 2, maxPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three thousand away supporters have a song about the manager now. It is to the tune of something from a supermarket advert and it is not entirely complimentary about his hair.',
        choices: [
          { id: 'wave', label: 'Turn and applaud them', desc: 'Every time, for the rest of the season', outcome: 'It becomes a ritual. Two years later they sing it at a ground he no longer works at, and mean it kindly.', effect: { prestige: 3, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'a song the away end still sings' } } },
          { id: 'ignore', label: 'Pretend not to hear it', desc: 'The job is on the pitch', outcome: 'They sing it louder for a month and then get bored and write a better one about a centre-half.', effect: { prestige: 1 } },
          { id: 'joke', label: 'Mention it in an interview', desc: 'Correct one of the details, deadpan', outcome: 'The correction is in the song by the following Saturday. He has now co-written a terrace chant, which is a strange thing to have done.', effect: { prestige: 2, squadMorale: 4, tag: 'mgr-fans-favourite' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-protest', title: 'Outside The Main Entrance', icon: '📢', category: 'media',
    when: { minSeason: 2, minPos: 0.82 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four hundred of them, on the forecourt, an hour after full time. Mostly it is directed upstairs. A reasonable amount of it is directed at him and one placard has his face on it.',
        choices: [
          { id: 'go-out', label: 'Walk out and stand in front of them', desc: 'No security, no statement, just stand there', outcome: 'It is twenty minutes of noise and then twenty minutes of conversation. Nothing is solved and something is changed.', effect: { prestige: 4, boardMood: -1, squadMorale: 6, tag: 'mgr-faced-them' } },
          { id: 'side-door', label: 'Leave by the side door', desc: 'As advised, at half past six', outcome: 'Somebody films the car going out of the back gate. The word "hiding" attaches itself to him for two months.', effect: { prestige: -3, tag: 'mgr-under-siege' } },
          { id: 'wait', label: 'Wait them out in the office', desc: 'Three hours, the lights off, doing the video', outcome: 'By nine there are eleven people left and he walks past them and two of them shake his hand.', effect: { prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-anniversary', title: 'A Hundred Years Of The Club', icon: '🏛️', category: 'media',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The centenary falls this season and the plans so far consist of a commemorative programme and a shirt with gold trim. Somebody from the local history society has been ringing every week for a month.',
        choices: [
          { id: 'history', label: 'Give the history society the run of the place', desc: 'Boxes, photographs, the lot', outcome: 'They find a ledger from 1931 in a cupboard behind the boiler and the club learns two true things it had forgotten.', effect: { prestige: 3, coins: -20, clubLegacy: { kind: 'tradition', label: 'a club museum in the old boiler room' } } },
          { id: 'commercial', label: 'Let the commercial department run it', desc: 'Shirt, programme, a badge on the sleeve', outcome: 'It sells extremely well and feels like a marketing campaign, because it is one.', effect: { coins: 220, prestige: -1, boardMood: 2 } },
          { id: 'players', label: 'Bring back everyone who ever played', desc: 'One afternoon, open gates, free entry', outcome: 'Two hundred and forty old players walk out at half time and a man in his nineties gets the loudest reception of the day.', effect: { coins: -110, prestige: 4, squadMorale: 6, clubLegacy: { kind: 'tradition', label: 'the centenary parade of old players' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-transfer-leak', title: 'It Is In The Paper Before It Is Done', icon: '🕵️', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A deal that is not signed appears on a national website with a fee attached and a photograph. The selling club read it before the medical and have gone quiet.',
        choices: [
          { id: 'deny', label: 'Deny it flatly', desc: 'Say there is no deal, on the record', outcome: 'The deal completes on Thursday and he has now publicly lied about it, which the same reporter remembers for years.', effect: { prestige: -2, coins: -40, tag: 'mgr-denied-it' } },
          { id: 'confirm', label: 'Confirm what is true', desc: '"We\'re talking, nothing is agreed"', outcome: 'Honest, boring, and it costs the club a little leverage in a negotiation the finance director was enjoying.', effect: { coins: -60, prestige: 2 } },
          { id: 'nothing', label: 'Refuse to discuss transfers at all', desc: 'A blanket policy, from now until June', outcome: 'It holds for three weeks and then a player confirms his own move on his own phone at an airport.', effect: { prestige: 1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-rival-jibe', title: 'The Manager Down The Road', icon: '⚔️', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ten days before the derby the other manager makes a remark about the size of the two clubs. It is accurate, which is the problem, and it is delivered with a small smile.',
        choices: [
          { id: 'reply', label: 'Reply in kind', desc: 'One line, sharper than his', outcome: 'It is the back page for four days and the ground is unbearable on the Saturday, in the way both sets of supporters wanted.', effect: { prestige: 2, squadMorale: 8, clubLegacy: { kind: 'rivalry', label: 'a derby that got personal, and stayed personal' } } },
          { id: 'agree', label: 'Agree with him', desc: '"He\'s right. We\'re smaller. Come and see"', outcome: 'It removes the entire story in one sentence and the away end adopts the line as a chant within a fortnight.', effect: { prestige: 3, squadMorale: 5 } },
          { id: 'players', label: 'Put it on the dressing room wall', desc: 'Printed out, no comment made publicly', outcome: 'They win 2-0 and one of them points at the printed quote in the celebration, which is on television for a week.', effect: { squadMorale: 12, prestige: 1, tag: 'mgr-motivator' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-hit-piece', title: 'Two Thousand Words On A Sunday', icon: '📄', category: 'media',
    when: { minSeason: 3, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A national Sunday runs a long piece with unnamed sources inside the club. Half of it is nonsense. The other half is close enough to make him wonder who he has been talking to.',
        choices: [
          { id: 'legal', label: 'Put it in the hands of lawyers', desc: 'And say so publicly', outcome: 'It keeps the story alive for eleven weeks and costs a serious sum, and eventually earns a correction nobody reads.', effect: { coins: -180, prestige: -1, boardMood: -1 } },
          { id: 'internal', label: 'Find the source inside the club', desc: 'Quietly, over a fortnight', outcome: 'He finds them. It is somebody he liked and had trusted with more than they should have had.', effect: { prestige: 1, squadMorale: -6, tag: 'mgr-suspicious' } },
          { id: 'ignore', label: 'Say nothing at all about it', desc: 'Not one word, to anyone', outcome: 'It is forgotten in nine days. The half of it that was true stays true and remains unaddressed.', effect: { prestige: 1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-abuse-online', title: 'What They Send Him', icon: '💻', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A young player missed a penalty on Saturday and what has arrived on his phone since is not criticism. He shows the manager one message and there is no way to un-see it.',
        choices: [
          { id: 'club-action', label: 'Have the club go after it properly', desc: 'Reports, police, statements, all of it', outcome: 'Two are identified and one of them is fourteen. The process takes eight months and helps him not at all in the meantime.', effect: { prestige: 2, coins: -60, playerMorale: { who: 'youngest', delta: 4 } } },
          { id: 'off-phone', label: 'Take him off it', desc: 'Delete it, hand the account to somebody else', outcome: 'He is better within a fortnight and loses something too. The club does his posting for him from then on.', effect: { playerMorale: { who: 'youngest', delta: 12 }, squadMorale: 4 } },
          { id: 'penalty', label: 'Give him the next penalty', desc: 'Whoever else is on the pitch', outcome: 'He puts it down the middle and stands with his arms out in front of the away end. It is the loudest the ground gets all year.', effect: { playerMorale: { who: 'youngest', delta: 20 }, squadMorale: 10, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-club-channel', title: 'The Club\'s Own Channel', icon: '🎬', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A twenty-three-year-old with a camera has been hired to run the club\'s social accounts and wants the manager in a segment involving a quiz and a blindfold. The engagement figures are, admittedly, extraordinary.',
        choices: [
          { id: 'do-it', label: 'Do the blindfold', desc: 'Full commitment, no visible reluctance', outcome: 'Nine hundred thousand views and a nickname that lasts three years. Two opposing crowds use it against him.', effect: { prestige: -1, coins: 80, squadMorale: 8 } },
          { id: 'players', label: 'Send the players instead', desc: 'They are better at it and they enjoy it', outcome: 'Two of them turn out to be genuinely funny and the club discovers it has been sitting on an asset.', effect: { coins: 120, squadMorale: 6, boardMood: 1 } },
          { id: 'refuse', label: 'Keep the manager off it entirely', desc: 'Football content only, from him', outcome: 'The tactical explainer he agrees to do instead is watched by eleven thousand people and referenced by two rival coaches.', effect: { prestige: 2, coins: 20 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-programme-notes', title: 'The Programme Notes', icon: '🖊️', category: 'media',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six hundred words, every home game, due Wednesday. The press officer has offered to write them and has already written this week\'s, which opens with "there are no easy games in this division".',
        choices: [
          { id: 'himself', label: 'Write every one himself', desc: 'Wednesday nights, for as long as he is here', outcome: 'They are uneven and occasionally very good. People start buying the programme for them, which has not happened here before.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'programme notes the manager actually writes' } } },
          { id: 'let-them', label: 'Let the press officer do it', desc: 'Read it, sign it, move on', outcome: 'It is fine. Nobody reads it and nobody complains and it takes four minutes a week.', effect: { prestige: -1 } },
          { id: 'players', label: 'Give the space to a player each week', desc: 'Anything they like, unedited', outcome: 'One of them writes about his grandmother and the terraces are still talking about it a decade later.', effect: { squadMorale: 8, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-fans-forum', title: 'A Night In The Function Room', icon: '🪑', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two hundred season-ticket holders, a microphone on a stand in the aisle, and no way of knowing what is coming. The chairman would like him on the panel. The chairman would like a shield.',
        choices: [
          { id: 'go', label: 'Do it, and take every question', desc: 'Two and a half hours, nothing screened', outcome: 'The first forty minutes are horrible and the last hour is the best conversation the club has had with its supporters in years.', effect: { prestige: 3, boardMood: 1, tag: 'mgr-fans-favourite' } },
          { id: 'screened', label: 'Do it with screened questions', desc: 'Submitted in advance, chosen by the club', outcome: 'The room can tell immediately. Somebody shouts the real question from the back and the evening is defined by it.', effect: { prestige: -2, boardMood: 1 } },
          { id: 'decline', label: 'Send the assistant', desc: 'And be at the training ground working', outcome: 'The assistant is charming and knows nothing, and two hundred people go home having been given an evening off from the truth.', effect: { prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-pitchside-after-defeat', title: 'Ninety Seconds At The Tunnel', icon: '🎤', category: 'media',
    when: { minSeason: 1, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ninety seconds after the whistle, a microphone in his face and a first question containing the word "shambolic". His own players are still walking past behind him.',
        choices: [
          { id: 'defend', label: 'Defend them, every one', desc: 'Take the whole thing on himself', outcome: 'They hear it as they go up the tunnel. Two of them stop for half a second, which he does not see and the camera does.', effect: { squadMorale: 12, boardMood: -1, prestige: -1 } },
          { id: 'honest', label: 'Say it was as bad as it looked', desc: 'No names, no excuses', outcome: 'The supporters appreciate it enormously and the dressing room reads it in the morning and does not appreciate it at all.', effect: { prestige: 2, squadMorale: -8, tag: 'mgr-straight-talker' } },
          { id: 'nothing', label: 'Give him nothing', desc: 'Four one-sentence answers and walk', outcome: 'It looks worse than either alternative and it is the only version he can currently manage without saying something unforgivable.', effect: { prestige: -2, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-referee-comments', title: 'What He Said About The Referee', icon: '🟥', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He was asked a direct question about a decision that cost the club a game and he answered it directly. The governing body has now written to him, on headed paper, using the word "improper".',
        choices: [
          { id: 'fight', label: 'Contest the charge', desc: 'A hearing, a lawyer, the works', outcome: 'He loses, at three times the cost of the original fine, and every referee in the division now knows exactly who he is.', effect: { coins: -150, prestige: 2, squadMorale: 6, tag: 'mgr-feuds' } },
          { id: 'accept', label: 'Take the fine', desc: 'Pay it, say nothing, move on', outcome: 'Cheapest option available and the dressing room notices that he did not fight it, which he had not considered.', effect: { coins: -50, boardMood: 1, squadMorale: -3 } },
          { id: 'repeat', label: 'Repeat it, word for word, on the record', desc: 'And invite them to charge him twice', outcome: 'A touchline ban and four thousand supporters singing his name from the away end while he watches from the stand.', effect: { coins: -120, prestige: 3, squadMorale: 10, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-book-offer', title: 'They Want The Book', icon: '📕', category: 'media',
    when: { minSeason: 5 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A publisher wants the memoir, and wants it while the interesting parts are still recent. The advance is substantial and the phrase they keep using is "properly candid".',
        choices: [
          { id: 'candid', label: 'Write it properly candid', desc: 'Names, rooms, what was actually said', outcome: 'It sells. Four men who trusted him do not speak to him again and one of them was at his wedding.', effect: { coins: 300, prestige: 2, squadMorale: -10, tag: 'mgr-told-tales' } },
          { id: 'careful', label: 'Write the careful version', desc: 'Warm, funny, and nothing anybody could object to', outcome: 'It is reviewed as pleasant and forgettable and it does not sell. Everybody who is in it is glad of how they appear.', effect: { coins: 90, prestige: -1, squadMorale: 4 } },
          { id: 'later', label: 'Tell them in ten years', desc: 'When the people in it have finished playing', outcome: 'They lose interest immediately. He keeps writing it anyway, in notebooks, and it is a better book for the wait.', effect: { prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-coach-broke-down', title: 'The Supporters\' Coach', icon: '🛞', category: 'media',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fifty-two supporters travelled three hundred miles and their coach failed on the motorway at half past one. They arrived on the hour, saw eight minutes, and watched their team lose.',
        choices: [
          { id: 'refund', label: 'Have the club pay for the lot', desc: 'Tickets, the coach, and the next away game free', outcome: 'It costs a serious amount for one afternoon and it is the story people in that town tell about the club for a generation.', effect: { coins: -130, prestige: 4, tag: 'mgr-community' } },
          { id: 'squad', label: 'Send the squad out to them', desc: 'After the game, in the car park, in the rain', outcome: 'Twenty minutes of shirts and photographs and apologies from men who had nothing to apologise for.', effect: { squadMorale: 6, prestige: 3 } },
          { id: 'letter', label: 'Write to all fifty-two', desc: 'Individually, by hand, over a fortnight', outcome: 'It takes him four evenings and one of the letters is on a pub wall, framed, eleven years later.', effect: { prestige: 3, clubLegacy: { kind: 'reputation', label: 'a club that writes back' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-old-photograph', title: 'A Photograph In A Carrier Bag', icon: '🖼️', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A woman comes to reception with a photograph in a carrier bag. Her father is in it, in a club shirt, in a year the club has no records for. She does not want anything for it.',
        choices: [
          { id: 'hang', label: 'Hang it in the tunnel', desc: 'Framed, where the players walk past it', outcome: 'Every man who plays for the club walks past her father before every home game. Nobody has to explain why it is there.', effect: { prestige: 3, squadMorale: 5, clubLegacy: { kind: 'tradition', label: 'the tunnel photographs of the old players' } } },
          { id: 'invite', label: 'Invite her to a game as a guest', desc: 'Directors\' box, her whole family', outcome: 'They come, all seven of them, and her mother cries at the team sheet. It costs the club four seats.', effect: { prestige: 2, coins: -10 } },
          { id: 'archive', label: 'Put it in the club archive', desc: 'Catalogued, protected, and in a drawer', outcome: 'Correct, careful, and in a drawer. It is found again by a historian nine years later and hung up then.', effect: { prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-hoardings', title: 'The Name On The Hoardings', icon: '🪧', category: 'media',
    when: { minSeason: 2, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A sponsor is offering more than the club has had from any advertiser and does a kind of business a fair number of supporters have strong feelings about. The commercial director has already ordered the boards.',
        choices: [
          { id: 'take', label: 'Take the money', desc: 'It pays for two players and a roof', outcome: 'The money is real and so is the letter-writing campaign. He is asked about it at every press conference for four months.', effect: { coins: 350, prestige: -3, boardMood: 2, tag: 'mgr-took-the-money' } },
          { id: 'refuse', label: 'Refuse it publicly', desc: 'And say exactly why', outcome: 'The supporters are magnificent about it and the budget is what it was. The board do not forget the sum involved.', effect: { boardMood: -2, prestige: 4, tag: 'mgr-fights-upstairs' } },
          { id: 'quiet', label: 'Take it and keep it small', desc: 'One board, no shirt, no announcement', outcome: 'A compromise that satisfies nobody entirely and buys one player. He is asked about it twice and it goes away.', effect: { coins: 140, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-radio-summariser', title: 'The Man On The Radio Played Here', icon: '🎚️', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The local station\'s summariser made three hundred appearances for the club and has spent six weeks calling the selection cowardly. He is in the tunnel every Saturday and says hello like nothing has happened.',
        choices: [
          { id: 'ask', label: 'Ask him to his face', desc: 'In the tunnel, quietly, before the game', outcome: 'He says he is paid to have an opinion and he is not going to soften it. It is a fair answer and the handshake afterwards is real.', effect: { prestige: 2 } },
          { id: 'coach', label: 'Ask him to come and work with the forwards', desc: 'One day a week, unpaid, if he means it', outcome: 'He does it. He is very good with them and the criticism carries on, which turns out to be perfectly possible.', effect: { squadMorale: 6, prestige: 2, tag: 'mgr-builds-staff' } },
          { id: 'freeze', label: 'Have his tunnel access reviewed', desc: 'Through the press office, formally', outcome: 'It is petty and it works for a fortnight and then it is a story about a club legend being frozen out.', effect: { prestige: -3, boardMood: -1, tag: 'mgr-thin-skinned' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-praise-too-early', title: 'They Have Started Calling It A Revolution', icon: '🌅', category: 'media',
    when: { minSeason: 2, maxPos: 0.3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eight unbeaten and the coverage has gone from generous to embarrassing. There is a double-page spread comparing him to men who won things, and the squad have all read it.',
        choices: [
          { id: 'damp', label: 'Pour cold water on all of it', desc: 'Publicly, repeatedly, joylessly', outcome: 'It protects the players from believing it and it makes him sound like a man who cannot enjoy anything.', effect: { squadMorale: -4, prestige: 1, boardMood: 1 } },
          { id: 'enjoy', label: 'Let them have it', desc: 'They have earned a good fortnight', outcome: 'They enjoy it and they lose at home to the bottom club a week on Saturday, and everybody draws the obvious conclusion.', effect: { squadMorale: 10, prestige: -1, boardMood: -1 } },
          { id: 'redirect', label: 'Point it all at the players', desc: 'Every question, every answer, their names', outcome: 'Three of them get international call-ups off the back of the coverage and none of them forgets whose answers it was.', effect: { squadMorale: 8, prestige: 2, tag: 'mgr-deflects-credit' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-tv-kickoff-change', title: 'Moved To Friday Night', icon: '🕗', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Television has moved the away game to Friday at eight, three hundred miles away, with no trains back. Nine hundred supporters have already bought tickets and a fair number have already booked days off.',
        choices: [
          { id: 'protest', label: 'Say what he thinks about it publicly', desc: 'On camera, at length, before the game', outcome: 'A warning from the league, a round of applause from every away end in the country, and the fixture stays exactly where it is.', effect: { prestige: 3, boardMood: -2, coins: -30, tag: 'mgr-fans-favourite' } },
          { id: 'coaches', label: 'Have the club lay on free coaches', desc: 'Nine hundred seats, club expense', outcome: 'It costs a fortune and the away end is full and loud at ten to eight on a Friday, which is the entire return on the investment.', effect: { coins: -160, prestige: 3, squadMorale: 6 } },
          { id: 'accept', label: 'Say nothing and take the fee', desc: 'The television money is the budget', outcome: 'Professionally correct. Four hundred of the nine hundred cannot get there and one of them writes about it in the fanzine.', effect: { coins: 90, prestige: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-player-interview-goes-wrong', title: 'He Should Not Have Said That', icon: '🫢', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A twenty-year-old was put in front of a camera after his first goal and, asked about the club\'s ambitions, said something honest about the size of the budget. It leads the sports bulletin by six o\'clock.',
        choices: [
          { id: 'shield', label: 'Say he was right', desc: 'Back him publicly and take the consequences', outcome: 'The boy is untouchable in that dressing room from that day. The chairman rings before the ten o\'clock news.', effect: { squadMorale: 12, boardMood: -3, playerMorale: { who: 'youngest', delta: 16 } } },
          { id: 'clarify', label: 'Explain that he is young', desc: 'Kind in tone, and a correction all the same', outcome: 'The story dies overnight and the boy understands exactly what happened to him, and says thank you anyway.', effect: { prestige: 1, playerMorale: { who: 'youngest', delta: -4 }, boardMood: 1 } },
          { id: 'media-ban', label: 'Stop the young ones doing interviews', desc: 'Nobody under twenty-three in front of a camera', outcome: 'It is safe and it is a whole generation who never learn to do it. Two of them are hopeless at it at twenty-six.', effect: { squadMorale: -3, prestige: -1, tag: 'mgr-closed-doors' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-obituary', title: 'The Old Manager Has Died', icon: '🖤', category: 'media',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The man who had this job three decades ago has died. He is remembered fondly by everyone over fifty and not at all by anyone under thirty. There is a home game on Saturday.',
        choices: [
          { id: 'full', label: 'Do it properly', desc: 'A minute\'s applause, black armbands, his family in the stand', outcome: 'The ground gets it exactly right and his widow stands and turns a full circle with her hand up. Nobody who was there forgets it.', effect: { prestige: 3, squadMorale: 6, coins: -20, clubLegacy: { kind: 'stand', label: 'a stand named for the manager who came before' } } },
          { id: 'small', label: 'A line in the programme', desc: 'Respectful, brief, no ceremony', outcome: 'Correct and cold, and three letters arrive the following week from people who remember him.', effect: { prestige: -1 } },
          { id: 'players', label: 'Tell the squad who he was first', desc: 'Ten minutes on Friday, with photographs', outcome: 'Half of them are bored and three of them are not, and the applause on Saturday is led from the pitch.', effect: { squadMorale: 5, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-good-week-cover', title: 'On The Front Of The Magazine', icon: '🌟', category: 'media',
    when: { minSeason: 3, maxPos: 0.25, maxTier: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A magazine wants him on the cover, in a coat, on the empty pitch, under a headline about the best job in football. The photographer wants three hours on a Thursday in international week.',
        choices: [
          { id: 'do', label: 'Give them the three hours', desc: 'Coat, empty ground, the lot', outcome: 'The photograph is magnificent and it hangs in the boardroom, and the piece inside is used against him for years.', effect: { prestige: 3, boardMood: 1, tag: 'mgr-public-figure' } },
          { id: 'squad', label: 'Put the captain on the cover instead', desc: 'And do the interview off camera', outcome: 'The captain is superb, in the photograph and in the piece, and the dressing room reads it as exactly what it was.', effect: { squadMorale: 10, prestige: 1, playerMorale: { who: 'oldest', delta: 12 } } },
          { id: 'no', label: 'Say no to all of it', desc: 'Thursday is a working day', outcome: 'They run the piece without him, from the outside, and it is slightly kinder for it.', effect: { prestige: -1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p1-statue-question', title: 'Somebody Has Started A Campaign', icon: '🗿', category: 'media',
    when: { minSeason: 6, maxPos: 0.4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporters\' group is raising money for a statue. Not of a player. The target is on a website, the total is climbing, and he has been asked to comment three times this week.',
        choices: [
          { id: 'stop', label: 'Ask them to stop', desc: 'Publicly, and to spend it on the academy instead', outcome: 'They do it, redirect all of it, and the academy gets an all-weather pitch with a small plaque on the fence.', effect: { prestige: 3, coins: 120, clubLegacy: { kind: 'reputation', label: 'the manager who turned down his own statue' } } },
          { id: 'allow', label: 'Let them get on with it', desc: 'It is their money and their idea', outcome: 'It is unveiled while he is still in the job, which is unbearable, and it is still there long after the club has forgotten why.', effect: { prestige: 4, squadMorale: -4, clubLegacy: { kind: 'stand', label: 'a statue outside the ground of a manager still in the job' } } },
          { id: 'divert', label: 'Ask for it to be of somebody else', desc: 'Name a player from before his time', outcome: 'The campaign switches without much complaint and the old man it is now of turns up to the unveiling in a suit he bought for it.', effect: { prestige: 3, clubLegacy: { kind: 'stand', label: 'a statue of the club\'s first great captain' } } },
        ],
      },
    },
  },
];
