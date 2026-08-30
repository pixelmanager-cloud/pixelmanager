// Manager-arc authoring pack 07. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack lives in the unglamorous middle of a season. Not the cup run and not the sacking — the lift
// rota, the bleep test, the trialist who paid for his own coach ticket, the water bill that has been wrong
// since before anybody currently employed was born. Nothing here would make the news. All of it is the job.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_07: ManagerArc[] = [
  // ── DRESSING ROOM ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p07-heatwave-sessions', title: 'Twenty-Nine Degrees At Ten', icon: '🌡️', category: 'dressing-room',
    when: { minSeason: 1 }, temper: ['disciplinarian','tactician'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Pre-season, and the grass is going pale in stripes. The fitness coach has a plan built for a normal July. By the second run two of them are walking and one of the new lads has been sick behind the goal and is pretending he has not.',
        choices: [
          { id: 'dawn', label: 'Move everything to seven in the morning', desc: 'Two weeks of it, then back to normal', outcome: 'Half the squad cannot get there for seven. The half that can arrive at half six and eat breakfast together, and that turns out to matter more than the running did.', effect: { squadMorale: 5, playerMorale: { who: 'youngest', delta: -6 } } },
          { id: 'push', label: 'Do the session as written', desc: 'It is only heat', outcome: 'They finish it. Two of them are on a drip in the treatment room by four o\'clock and the fitness coach does not look at him for a fortnight.', effect: { squadMorale: -9, coins: -30, tag: 'mgr-drove-them-through-it' } },
          { id: 'indoors', label: 'Take it inside and make it tactical', desc: 'Video, walk-throughs, shape on a carpet', outcome: 'Nobody gets fit in an air-conditioned room. They do learn the pressing triggers, which they had not, in three previous summers.', effect: { squadMorale: 3, prestige: 1, tag: 'mgr-shape-first' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-cannot-drive', title: 'He Has No Licence', icon: '🚏', category: 'dressing-room',
    when: { minSeason: 1 }, temper: ['players-manager','builder'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The youngest professional at the club gets two buses and walks the last mile. He has never mentioned it. The kit man mentions it, because he has been giving him a lift home on Tuesdays for four months and his wife has started asking questions.',
        choices: [
          { id: 'rota', label: 'Put a lift rota on the wall', desc: 'Names, days, no volunteering required', outcome: 'Two senior men find it a liberty and say so. By November one of them is teaching the boy to reverse round a corner in the car park.', effect: { squadMorale: 6, playerMorale: { who: 'youngest', delta: 10 } } },
          { id: 'lessons', label: 'Pay for his lessons out of the budget', desc: 'Quietly, on the club', outcome: 'He passes second time. Somebody in the office puts it through as equipment and the auditor asks about it in the spring.', effect: { coins: -70, playerMorale: { who: 'youngest', delta: 14 }, boardMood: -1 } },
          { id: 'nothing', label: 'It is not the club\'s problem', desc: 'Professional footballers arrange their own mornings', outcome: 'He keeps getting the bus. He is never late once. Some of the staff think better of him for it and he thinks less of the club.', effect: { playerMorale: { who: 'youngest', delta: -8 }, tag: 'mgr-hands-off' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-bleep-test', title: 'Nobody Passed It', icon: '📉', category: 'dressing-room',
    when: { minSeason: 1 }, temper: ['disciplinarian','firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The benchmark was set by a sports scientist who no longer works here. Not one of the twenty-two reaches it. The two who come closest are a thirty-four-year-old centre-half and a lad who has not started a game since March.',
        choices: [
          { id: 'lower', label: 'Change the number', desc: 'The benchmark was wrong, not the squad', outcome: 'Everybody passes the following Tuesday and everybody knows precisely why. The test is never mentioned again by anyone.', effect: { squadMorale: 4, prestige: -2 } },
          { id: 'again', label: 'Run it again every Monday until somebody does', desc: 'Same line, same cones, same result', outcome: 'Week six, the centre-half beats it and the room comes off the fence to watch. Week seven, three more. Week eight it is the best-attended Monday of the year.', effect: { squadMorale: -4, prestige: 2, tag: 'mgr-held-the-line' }, next: 'after' },
          { id: 'bin', label: 'Bin the test entirely', desc: 'Judge them by Saturdays', outcome: 'The fitness staff take it as a verdict on them, which it partly is. Nobody has a number for anything for the rest of the season.', effect: { squadMorale: 5, boardMood: -1 } },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The lad who has not started since March is now the fittest man at the club and still not in the side.',
        choices: [
          { id: 'start', label: 'Put him in on Saturday', desc: 'Reward the eight weeks', outcome: 'He runs himself into the ground for seventy minutes and gives the ball away eleven times. The running was never the thing he was short of.', effect: { playerMorale: { who: 'unhappiest', delta: 12 }, squadMorale: 3, boardMood: -1 } },
          { id: 'say', label: 'Tell him he still is not in the side', desc: 'And tell him why, properly', outcome: 'He listens to all of it. He asks one question at the end that the manager has to think about overnight.', effect: { playerMorale: { who: 'unhappiest', delta: -6 }, prestige: 1, tag: 'mgr-straight' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-group-chat', title: 'The Group Without Him In It', icon: '💬', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, temper: ['disciplinarian','players-manager'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a squad group for lifts and kick-off times, and there is another one. He knows because a player held a phone up to show him something else and the wrong thing was on the screen for about a second and a half.',
        choices: [
          { id: 'ask', label: 'Ask the captain what is in it', desc: 'Straight question, no threat behind it', outcome: 'Mostly it is bins. Twice a week it is not, and the captain tells him which twice, and looks unwell doing it.', effect: { squadMorale: -3, prestige: 1, tag: 'mgr-knows-things' } },
          { id: 'ignore', label: 'Let them have it', desc: 'Every dressing room has ever had one', outcome: 'It runs all season and never causes a single problem. He thinks about it before roughly nine team meetings and says nothing at any of them.', effect: { squadMorale: 4 } },
          { id: 'ban', label: 'Tell them phones stay in the bags', desc: 'A rule about the room, not about the group', outcome: 'The group moves to a different app inside a day. The rule stands and achieves the one thing it can, which is quiet before kick-off.', effect: { squadMorale: -5, tag: 'mgr-strict' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-second-job', title: 'Wednesdays At The Depot', icon: '📦', category: 'dressing-room',
    when: { minSeason: 1, minTier: 5 }, temper: ['players-manager','chancer','builder'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The left-back does nights at a distribution centre from ten until six. He has done it since he was nineteen and he does not intend to stop because a football club has opinions about it. He is also, by some distance, the best left-back at the club.',
        choices: [
          { id: 'topup', label: 'Find the money to make up the difference', desc: 'Whatever the depot pays him, the club matches', outcome: 'The board approves it through gritted teeth. He gives notice on the Friday and is a yard quicker by October, and three other lads want to know what he is on.', effect: { coins: -160, playerMorale: { who: 'best', delta: 16 }, squadMorale: -4 } },
          { id: 'work-round', label: 'Build the week around the shifts', desc: 'He trains Tuesday, Thursday, Saturday, and that is that', outcome: 'It works. It is also visibly one rule for him, and by December two others have asked for their own arrangement and neither has a night job.', effect: { playerMorale: { who: 'best', delta: 10 }, squadMorale: -6, tag: 'mgr-flexible' } },
          { id: 'choose', label: 'Ask him to choose', desc: 'Football or the depot, before the season starts', outcome: 'He chooses the depot without a pause, because it will be there when his knees are not. He is at a rival by August and scores against them in April.', effect: { playerMorale: { who: 'best', delta: -20 }, squadMorale: -5, coins: 60, tag: 'mgr-ultimatum' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-will-not-travel', title: 'Not In The Same Car', icon: '🚙', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two of them will not travel together. It is not football and it is not recent and neither will say what it is. The coach has forty-eight seats and both of them are at the front of the queue every single week, watching each other.',
        choices: [
          { id: 'seat-them', label: 'Sit them next to each other', desc: 'Two hundred and forty miles, no phones', outcome: 'They do not speak for two hours. Somewhere near the services one of them offers the other a bag of sweets and it is not resolved but it is smaller.', effect: { squadMorale: 5, prestige: 1 } },
          { id: 'apart', label: 'Keep them apart and say nothing', desc: 'Front of the coach and back of it, forever', outcome: 'The squad organises itself around the gap without being asked to. It costs nothing and it is there in every photograph.', effect: { squadMorale: -3 } },
          { id: 'one-goes', label: 'Tell them one of them will be leaving', desc: 'Not which one, not yet', outcome: 'They both train like men auditioning. One is superb until March and then falls off a cliff, and the manager is not certain that was not his own doing.', effect: { squadMorale: -7, prestige: -1, tag: 'mgr-ruthless' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-third-keeper', title: 'The Third One', icon: '🥅', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The third-choice goalkeeper is thirty-three and has played nine minutes in two years. He sets out the cones. He runs the pre-match kicking. He has, without being asked, started keeping a file on every opposition penalty taker in the division.',
        choices: [
          { id: 'staff', label: 'Offer him a coaching job now', desc: 'Stop paying him to be a player he is not', outcome: 'He takes a week and says yes and hands his gloves to the youngest keeper in the building. He is better at the new job by Christmas than he ever was at the old one.', effect: { prestige: 2, squadMorale: 4, coins: -20, tag: 'mgr-made-a-coach' } },
          { id: 'play', label: 'Give him a game', desc: 'Any game, one game, in front of people', outcome: 'He keeps a clean sheet and his father is in the away end at fifty-nine years old, crying, which several of the squad see.', effect: { squadMorale: 8, playerMorale: { who: 'oldest', delta: 16 }, boardMood: -1 } },
          { id: 'release', label: 'Let him go in the summer', desc: 'The wage is a wage and the file is free', outcome: 'A club two divisions below take him as a player-coach. The penalty file goes with him and the analyst asks about it, twice, in one season.', effect: { coins: 90, squadMorale: -5, tag: 'mgr-cut-him-loose' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-march-nothing', title: 'Nothing Left To Play For', icon: '🗓️', category: 'dressing-room',
    when: { minSeason: 2, minPos: 0.35, maxPos: 0.7 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eleventh. Too far off the play-offs and eighteen points clear of trouble. Eight games left and the training ground has developed a mood that is not quite bad — worse than that, it is pleasant. Nobody is arguing about anything.',
        choices: [
          { id: 'youth', label: 'Play the kids', desc: 'Eight games, and let the summer sort itself out', outcome: 'Two of them are footballers. One of them is not and finds out in front of four thousand people, which is a hard way to be told.', effect: { squadMorale: 3, prestige: 1, playerMorale: { who: 'youngest', delta: 12 }, boardMood: -1 } },
          { id: 'targets', label: 'Invent something to chase', desc: 'A points total, a clean-sheet count, a bonus out of his own pocket', outcome: 'They chase it, honestly, and miss it by one. It is a more useful eight games than the table suggests and nobody outside the building notices.', effect: { squadMorale: 6, coins: -40 } },
          { id: 'audition', label: 'Tell them they are all auditioning', desc: 'For contracts, in front of him, starting now', outcome: 'The intensity is back inside a session. So is a kind of selfishness he does not enjoy watching, and two of the fringe men stop passing to each other.', effect: { squadMorale: -4, prestige: 1, tag: 'mgr-auditions' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-ice-bath-rota', title: 'The Ice Bath', icon: '🧊', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One bath, twenty-four men, and the same five in it every Monday. The five are the loudest five. Two of the quiet lads have worked out that if they wait long enough it is empty, and by then it is warm and pointless.',
        choices: [
          { id: 'order', label: 'Put a list on the door', desc: 'By minutes played, longest first', outcome: 'It is fair and it is joyless. The bath becomes a queue, and the ten minutes of noise on a Monday morning that the room did not know it needed goes with it.', effect: { squadMorale: -4, prestige: 1 } },
          { id: 'buy', label: 'Buy a second one', desc: 'Money the physio has been asking for since August', outcome: 'It arrives in April. The physio does not stop talking about it and the loud five simply spread out across both.', effect: { coins: -110, squadMorale: 4, boardMood: -1 } },
          { id: 'leave', label: 'Leave it alone', desc: 'It sorts itself out or it does not', outcome: 'It does not. In February one of the quiet ones has a calf and mentions, in passing, that he has not had a proper recovery since October.', effect: { squadMorale: -3, playerMorale: { who: 'unhappiest', delta: -8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-rehab-alone', title: 'Eight In The Morning, On His Own', icon: '🏃', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ten months on a knee and he is running again. He does it at eight, before anybody arrives, because he does not want to be watched doing it badly. The physio says he is ready. The manager has watched four videos and does not think he is the same player.',
        choices: [
          { id: 'squad', label: 'Put him straight back in the group', desc: 'Full sessions, no allowances, from Monday', outcome: 'He is off the pace and honest about it. Being off the pace among people is better than being on it alone and he sleeps properly for the first time since the spring.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, squadMorale: 3 } },
          { id: 'loan', label: 'Send him out on loan to get games', desc: 'Anywhere with a pitch and a crowd', outcome: 'Two divisions down he is the best player on the pitch for six weeks. He comes back believing it, which is either exactly what was needed or a problem for March.', effect: { coins: 40, playerMorale: { who: 'unhappiest', delta: 8 }, prestige: 1 } },
          { id: 'honest', label: 'Tell him he will not play for this side again', desc: 'Now, rather than in June', outcome: 'It is the worst conversation of the season and it is not close. He thanks him for it eighteen months later in a car park, and means it.', effect: { playerMorale: { who: 'unhappiest', delta: -22 }, squadMorale: -6, prestige: 2, tag: 'mgr-tells-them-early' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-fasting', title: 'Before Sunset', icon: '🌇', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three of them are fasting. Two have done it every year of their careers and know exactly how to manage a Tuesday. The third is nineteen and does not, and has told nobody, and was on the floor at the end of Thursday\'s session.',
        choices: [
          { id: 'plan', label: 'Get a proper plan built for all three', desc: 'A nutritionist, session times moved, no fuss made of it', outcome: 'It costs a fee and half a morning of rescheduling. The nineteen-year-old plays the best forty minutes of his season a fortnight later.', effect: { coins: -50, squadMorale: 6, playerMorale: { who: 'youngest', delta: 12 }, prestige: 1 } },
          { id: 'seniors', label: 'Ask the two senior ones to look after the boy', desc: 'No club involvement beyond the asking', outcome: 'They do it better than any consultant would have. One of them cooks for him twice a week and the club never pays a penny.', effect: { squadMorale: 8, playerMorale: { who: 'oldest', delta: 6 } } },
          { id: 'rest', label: 'Rest the boy for the month', desc: 'Safest for him, whatever he says about it', outcome: 'He is furious and says nothing, which is worse. He is fit and fresh in May and has lost his place in a side that has moved on without him.', effect: { playerMorale: { who: 'youngest', delta: -14 }, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-golf-thursdays', title: 'The Golfers', icon: '⛳', category: 'dressing-room',
    when: { minSeason: 2, needs: 'big-squad', forbidsTag: 'mgr-strict' }, temper: ['players-manager','chancer'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six of them play golf on Thursday afternoons. It is harmless. It is also, without anybody deciding it, now the group that knows things first, and two lads have taken up a sport they cannot afford in order to be in it.',
        choices: [
          { id: 'join', label: 'Go with them once', desc: 'Play badly, pay for lunch, listen', outcome: 'He is off the pace by nine holes and hears four things worth knowing. The golf remains the golf and he is slightly inside it now.', effect: { coins: -20, squadMorale: 5, tag: 'mgr-one-of-them' } },
          { id: 'thursday', label: 'Put something on for everyone on Thursdays', desc: 'Snooker, cards, a walk, anything with no green fee', outcome: 'Eight turn up to the first one and four to the second. It never becomes the golf and it does give the quiet half somewhere to be.', effect: { squadMorale: 4, coins: -25 } },
          { id: 'stop', label: 'Make Thursday afternoon a club afternoon', desc: 'Video, gym, community visits, all of them', outcome: 'The golf moves to Mondays. The manager has spent something to achieve a change of day and the senior players have noticed the shape of it.', effect: { squadMorale: -5, prestige: -1, tag: 'mgr-strict' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-gps-numbers', title: 'The Vest Says Otherwise', icon: '📊', category: 'dressing-room',
    when: { minSeason: 2, facility: { key: 'data', min: 3 } }, temper: ['tactician','disciplinarian'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One player\'s distances are twenty per cent above everybody else\'s, every week, in every session. He is not twenty per cent better. The analyst thinks the unit is faulty. The fitness coach thinks the player has worked out where the unit sits in the vest.',
        choices: [
          { id: 'swap', label: 'Swap his vest with somebody else\'s', desc: 'Say nothing, wait a week', outcome: 'The numbers follow the vest, not the man. The analyst is delighted for about four minutes and then has to explain eight months of reports.', effect: { prestige: 1, squadMorale: -2 } },
          { id: 'confront', label: 'Put it to him in front of the group', desc: 'Numbers on the screen, his name at the top', outcome: 'He denies it flatly and convincingly. Two of them laugh. He does not speak in a meeting again for the rest of the season.', effect: { playerMorale: { who: 'star', delta: -14 }, squadMorale: -4, tag: 'mgr-public-about-it' } },
          { id: 'stop-publishing', label: 'Stop putting the numbers on the wall', desc: 'The department keeps them, the room does not see them', outcome: 'Half the squad is relieved and does not say so. The analyst spends a month convinced he has been demoted and has to be told he has not.', effect: { squadMorale: 5, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-agent-in-the-stand', title: 'A Man In The Stand At Training', icon: '🕶️', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The same man has watched the last four sessions from the little stand by the third pitch. He signs in each time. He represents two of the squad and would like to represent a third, who has started looking up at him during rondos.',
        choices: [
          { id: 'ban', label: 'Take him off the list at the gate', desc: 'No explanation offered', outcome: 'He is on the phone to the two he already has by lunchtime. Both of them ask, separately, why the gaffer is frightened of an agent.', effect: { squadMorale: -4, prestige: 1, tag: 'mgr-closed-the-gate' } },
          { id: 'coffee', label: 'Bring him in for a coffee', desc: 'An hour, in the office, with the door open', outcome: 'He is more useful than expected about two players at other clubs. He is also now a man who has had a coffee with the manager, which he mentions to everybody.', effect: { prestige: -1, coins: 30, tag: 'mgr-talks-to-agents' } },
          { id: 'ignore', label: 'Let him sit there', desc: 'It is a stand and he is signing in', outcome: 'He watches all season and signs the third player in June. Nothing bad happens beyond that and the manager is not sure that is nothing.', effect: { squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-five-a-side-pick', title: 'Picked Last', icon: '🎽', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two senior men pick the teams on a Friday, the way it has been done here for years. The same lad goes last every week. He has started laughing about it before anybody else can, which is a thing people learn to do at school.',
        choices: [
          { id: 'bibs', label: 'Pick the teams himself from now on', desc: 'Coloured bibs handed out, no ceremony', outcome: 'A small piece of the week that belonged to the players belongs to the staff instead. Nobody says anything and Fridays are quieter.', effect: { squadMorale: -3, playerMorale: { who: 'unhappiest', delta: 8 } } },
          { id: 'captains', label: 'Make him one of the two who pick', desc: 'Every Friday, all season', outcome: 'The first week is uncomfortable for everybody. By the fourth he is enjoying it more than is strictly good for him and he has stopped laughing first.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, squadMorale: 3, prestige: 1 } },
          { id: 'nothing', label: 'Stay out of it', desc: 'It is a five-a-side', outcome: 'It is a five-a-side until the day he asks for a transfer and lists three reasons, and this is the second one.', effect: { playerMorale: { who: 'unhappiest', delta: -10 }, tag: 'mgr-hands-off' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-tactics-board-reading', title: 'He Cannot Read It', icon: '🔤', category: 'dressing-room',
    when: { minSeason: 1, maxTier: 6, facility: { key: 'data', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The set-piece sheets go up on a Friday. One of the lads has been copying his positions off the man next to him for two seasons. The analyst worked it out this week and has come to the office not knowing where to put his hands.',
        choices: [
          { id: 'pictures', label: 'Change how everything is presented', desc: 'Diagrams, clips, colours, no paragraphs anywhere', outcome: 'It is better for eleven of them and nobody ever knows why it changed. He is first to the near post at a corner in October and scores.', effect: { squadMorale: 5, playerMorale: { who: 'star', delta: 12 }, prestige: 1, tag: 'mgr-quiet-fix' } },
          { id: 'help', label: 'Arrange lessons for him', desc: 'A tutor, twice a week, at the club\'s cost', outcome: 'He says no three times and yes on the fourth. He does not thank anyone for it until he has a coaching badge, eleven years later.', effect: { coins: -60, playerMorale: { who: 'star', delta: 10 } } },
          { id: 'nothing', label: 'Say nothing to anyone', desc: 'He has managed for two years', outcome: 'He goes on managing. Every so often he is in the wrong place at a set piece and the manager knows exactly why and cannot say.', effect: { squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-media-duty-refusal', title: 'He Will Not Do The Interviews', icon: '🎙️', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a rota for post-match media and his name has come round three times and he has been in the shower for all three. The press officer has stopped asking and started apologising, which is her job made worse by somebody else.',
        choices: [
          { id: 'fine', label: 'Fine him, and tell him it is for her, not for the press', desc: 'A week\'s money into the jar', outcome: 'He pays it and does the next one badly on purpose. She thanks the manager privately and dreads the following month.', effect: { playerMorale: { who: 'star', delta: -10 }, coins: 40, squadMorale: 2, tag: 'mgr-strict' } },
          { id: 'exempt', label: 'Take him off the rota permanently', desc: 'Some men are not built for a microphone', outcome: 'Two more ask to come off it within a fortnight. The rota is now four names long and one of them is a nineteen-year-old.', effect: { squadMorale: 3, prestige: -2 } },
          { id: 'together', label: 'Do one with him, side by side', desc: 'Manager answers first, player answers second', outcome: 'He is stiff and terrible and gets through it. He does the next one alone without being asked and it is not much better and it is his.', effect: { playerMorale: { who: 'star', delta: 12 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-senior-corrects-him', title: 'In Front Of The Whiteboard', icon: '✋', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, temper: ['tactician','disciplinarian','players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty minutes into the Friday meeting a senior player puts his hand up and says the press is wrong against a back three, and gives three reasons. Two of them are right. The room has gone very still and is waiting to see what this is.',
        choices: [
          { id: 'concede', label: 'Say he is right about the two', desc: 'Change the board there and then', outcome: 'The meeting is twice as good for the rest of the season. So is the player. There is a cost somewhere in the room and it is not visible yet.', effect: { squadMorale: 6, prestige: -1, playerMorale: { who: 'oldest', delta: 12 }, tag: 'mgr-takes-it-on-board' } },
          { id: 'after', label: 'Take it after the meeting', desc: 'Finish the session, then his office, alone', outcome: 'The room reads it as a snub and the player does not. He is in the office for forty minutes and comes out with a job to do on Saturday.', effect: { squadMorale: 1, prestige: 1 } },
          { id: 'shut', label: 'Shut him down where he stands', desc: 'The board is the board', outcome: 'Nobody puts a hand up in a meeting again all year. The press is wrong against a back three in November and everybody in the room knows in advance.', effect: { squadMorale: -8, playerMorale: { who: 'oldest', delta: -12 }, tag: 'mgr-no-dissent' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-digs-fallout', title: 'The Rent', icon: '🏚️', category: 'dressing-room',
    when: { minSeason: 1, maxTier: 5, facility: { key: 'dorm', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two young pros share a flat the club found for them. One has not put his half in for two months because he sends it home instead. The other has been covering it and has stopped being able to and has told the kit man rather than anybody senior.',
        choices: [
          { id: 'club-pays', label: 'The club covers the arrears', desc: 'Once, and nobody hears about it', outcome: 'The debt goes. The shame does not, and the one who was covering it is the one who now cannot look at the other in the canteen.', effect: { coins: -50, squadMorale: 2, playerMorale: { who: 'youngest', delta: 6 } } },
          { id: 'separate', label: 'Move one of them out', desc: 'New digs, no conversation about why', outcome: 'They are both easier within a week and neither friendship survives it. One of them is released in the summer and the other never mentions his name again.', effect: { squadMorale: -3, playerMorale: { who: 'youngest', delta: -6 } } },
          { id: 'sit-down', label: 'Sit the pair of them down', desc: 'With a pen, a piece of paper and an hour', outcome: 'It is excruciating for fifty minutes and useful for the last ten. They work out a figure between them and both of them keep to it.', effect: { squadMorale: 6, prestige: 1, tag: 'mgr-sorts-it-out' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-thursday-injuries', title: 'Always A Thursday', icon: '🩺', category: 'dressing-room',
    when: { minSeason: 2, facility: { key: 'medical', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The physio has a chart and does not want to show it to anybody. One player has felt something tighten on eleven Thursdays out of fourteen. Eight of the following Saturdays were away from home and long ones.',
        choices: [
          { id: 'ask-him', label: 'Ask him what happens on Thursdays', desc: 'No accusation in it, just the question', outcome: 'He talks about a coach journey, a hotel room, and lying awake looking at a ceiling. Nothing about it is fake and all of it is real.', effect: { playerMorale: { who: 'star', delta: 14 }, prestige: 1, tag: 'mgr-listens' } },
          { id: 'chart', label: 'Put the chart in front of him', desc: 'Fourteen Thursdays, in a column', outcome: 'He is on the coach the following week and plays ninety minutes badly. He is available every Thursday for the rest of his time here and he is never the same about the manager.', effect: { playerMorale: { who: 'star', delta: -16 }, squadMorale: -3, tag: 'mgr-confronts-it' } },
          { id: 'home-only', label: 'Use him at home only', desc: 'No fuss, no reason given to anyone', outcome: 'He is excellent at home. The away form is what it is and the supporters have their own theory about him by February.', effect: { squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-shirt-name', title: 'What It Says On The Back', icon: '🅰️', category: 'dressing-room',
    when: { minSeason: 2, facility: { key: 'shop', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He wants his mother\'s name on the shirt instead of his father\'s. The kit order goes in on Friday and the club shop has four hundred pounds of stock with the old one on it, and somebody upstairs has already used the word "brand".',
        choices: [
          { id: 'yes', label: 'Change it', desc: 'Eat the stock, change the order', outcome: 'It costs what it costs. He does not make a speech about it and he keeps the first shirt with the new name in a drawer for the rest of his life.', effect: { coins: -80, playerMorale: { who: 'star', delta: 18 }, squadMorale: 4 } },
          { id: 'summer', label: 'Do it in the summer', desc: 'Sensible, cheaper, three months away', outcome: 'He accepts it and is polite about it. Three months is not very long unless you are the one waiting through them.', effect: { playerMorale: { who: 'star', delta: -6 }, boardMood: 1 } },
          { id: 'no', label: 'Tell him no', desc: 'The shirt is not a noticeboard', outcome: 'He says fine. He is at another club within eighteen months wearing the name he wanted and gives one interview in which this is mentioned once.', effect: { playerMorale: { who: 'star', delta: -16 }, prestige: -1, tag: 'mgr-said-no' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-extras-nobody-stays', title: 'Nobody Stays Behind', icon: '🕕', category: 'dressing-room',
    when: { minSeason: 2 }, temper: ['disciplinarian','builder','tactician'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The session ends at twelve and the car park is empty by ten past. Not one of them does extras. The coach who used to run finishing on a Tuesday stopped putting the balls out in September because he got tired of standing there.',
        choices: [
          { id: 'mandatory', label: 'Make it part of the session', desc: 'Twenty minutes, in the schedule, non-negotiable', outcome: 'They do twenty minutes of extras with the enthusiasm of men doing twenty minutes of extras. The numbers improve and the thing that was supposed to be in it is not.', effect: { squadMorale: -5, prestige: 1 } },
          { id: 'invite', label: 'Put the balls out himself and stand there', desc: 'Every Tuesday, whether anybody comes or not', outcome: 'Three weeks of nobody. Then one. Then the one brings another, and by spring there are six and the coach has come back out.', effect: { squadMorale: 4, prestige: 2, tag: 'mgr-stood-there' } },
          { id: 'accept', label: 'Let it go', desc: 'They are professionals and it is their career', outcome: 'It is their career and they do not do extras in it. Two of them are out of the game at twenty-six and one of them says so, later, to a reporter.', effect: { squadMorale: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-flu-jab', title: 'He Will Not Have It', icon: '💉', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club doctor does the flu jabs in October in the medical room, twenty-three in a morning. One of them will not, and has a reason, and the reason is his and is not stupid. The doctor would like a decision by lunchtime.',
        choices: [
          { id: 'respect', label: 'His body, his call', desc: 'And say so out loud so nobody leans on him', outcome: 'He is ill for nine days in January and misses four games. Nobody says a word about it and the room is better for how it was handled.', effect: { squadMorale: 5, prestige: 1 } },
          { id: 'pressure', label: 'Have the doctor talk him round', desc: 'Twenty minutes with the facts', outcome: 'He has it, and resents it, and is fine all winter. Some part of him files the manager under people who will lean.', effect: { playerMorale: { who: 'star', delta: -8 }, squadMorale: 2 } },
          { id: 'group', label: 'Raise it with the whole squad', desc: 'Let them hear the argument for it together', outcome: 'Two more decide against and one who had already had it wishes he had not. That was not the plan and the doctor says so afterwards, at length.', effect: { squadMorale: -4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-lost-weight', title: 'He Has Got Thin', icon: '⚖️', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The winger has come back from an international break four kilos lighter than the club would like. He says he is sharper. The chef says he leaves the canteen with a coffee and nothing else, most days, and has done since about November.',
        choices: [
          { id: 'doctor', label: 'Get the doctor involved properly', desc: 'Bloods, a conversation, a referral if needed', outcome: 'It takes a month to find out that this is not about football at all. He is glad, eventually, that somebody made the appointment for him.', effect: { coins: -40, playerMorale: { who: 'star', delta: 12 }, prestige: 2, tag: 'mgr-looked-after-him' } },
          { id: 'weigh', label: 'Put him on the scales every Monday', desc: 'A number, a target, a consequence', outcome: 'The number goes up and nothing else changes. He learns to drink a litre of water in the corridor and everybody involved knows it.', effect: { playerMorale: { who: 'star', delta: -10 }, squadMorale: -2, tag: 'mgr-by-numbers' } },
          { id: 'sharp', label: 'Take him at his word', desc: 'He is playing well and he is a grown man', outcome: 'He is superb until the end of January. Then he is not, for a long time, and the chef mentions the coffee again in a way that is not quite an accusation.', effect: { squadMorale: -3, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-tea-money', title: 'The Kitty', icon: '☕', category: 'dressing-room',
    when: { minSeason: 1, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everyone puts a fiver a month in the tin for tea, coffee and the biscuits. Four of them have not since August. Two cannot and two will not, and the man who keeps the tin has worked out which is which and will not say.',
        choices: [
          { id: 'club-buys', label: 'The club buys the coffee from now on', desc: 'No tin, no list, no problem', outcome: 'It costs almost nothing and removes something the room used to do for itself. Nobody mourns it. The man with the tin is oddly flat for a month.', effect: { coins: -25, squadMorale: 3 } },
          { id: 'name', label: 'Ask him for the four names', desc: 'And deal with them individually', outcome: 'He gives two names and not the other two, on purpose. The manager understands why and lets it stand and the tin is full by Christmas.', effect: { squadMorale: 4, prestige: 1, tag: 'mgr-knew-when-to-stop' } },
          { id: 'list', label: 'Put the list on the wall', desc: 'Paid and not paid, in two columns', outcome: 'It is settled within four days. Two lads have been publicly identified as skint in a room where that is currency, and it is not forgotten by June.', effect: { squadMorale: -7, tag: 'mgr-named-them' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-degree-tuesdays', title: 'The Course', icon: '📚', category: 'dressing-room',
    when: { minSeason: 2 }, temper: ['builder','players-manager'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of them is doing a degree part-time. He has an exam in a fortnight and a placement day that clashes with the Tuesday session, and he has come to ask about it holding the letter as though it might be confiscated.',
        choices: [
          { id: 'back', label: 'Back it fully', desc: 'Miss the Tuesdays, tell the group why', outcome: 'The group is split for a week and fine by the next. Three of them ask him about the course before Christmas and two of them are not joking.', effect: { squadMorale: 4, playerMorale: { who: 'star', delta: 14 }, prestige: 1, tag: 'mgr-backs-the-life' } },
          { id: 'quiet', label: 'Allow it and keep it between them', desc: 'A private arrangement, no announcement', outcome: 'It works cleanly until somebody sees him in a lecture hall on social media. Then it is a secret arrangement rather than an arrangement.', effect: { playerMorale: { who: 'star', delta: 10 }, squadMorale: -4 } },
          { id: 'no', label: 'Tuesdays are Tuesdays', desc: 'He is paid to be a footballer', outcome: 'He defers the module for a year and says it is fine. He finishes the degree eventually and never mentions this club when he talks about it.', effect: { playerMorale: { who: 'star', delta: -12 }, prestige: -1, tag: 'mgr-football-first' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-quiet-man-speaks', title: 'He Said One Thing', icon: '🫱', category: 'dressing-room',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player who has not volunteered a sentence in two years puts his hand halfway up at the end of a meeting and says the away days feel like being taken somewhere rather than going somewhere. Then he sits down. Nobody quite knows what to do with it.',
        choices: [
          { id: 'act', label: 'Rebuild the away day around it', desc: 'Later departures, fewer hotels, more of them driving', outcome: 'The travel budget improves and so does something less measurable. Two players who hated the overnights say so for the first time.', effect: { squadMorale: 8, coins: 40, prestige: 1, tag: 'mgr-changed-the-away-day' } },
          { id: 'ask-more', label: 'Ask him to say more', desc: 'There and then, in front of everybody', outcome: 'He cannot, and goes red, and the meeting ends badly. He tells the assistant the rest of it a week later in a corridor.', effect: { playerMorale: { who: 'unhappiest', delta: -10 }, squadMorale: 2 } },
          { id: 'nod', label: 'Thank him and move on', desc: 'Note it, close the meeting', outcome: 'It sits there for three months and turns out to have been the most accurate thing anybody said all season.', effect: { squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-veteran-gym', title: 'He Does Not Do The Gym', icon: '🏋️', category: 'dressing-room',
    when: { minSeason: 2, needs: 'veteran' }, temper: ['disciplinarian','tactician','builder'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The oldest player at the club has not lifted a weight since he was twenty-six and has played four hundred games. The strength coach has a programme with his name on it. It has been on the noticeboard, untouched, since the first week of July.',
        choices: [
          { id: 'force', label: 'Make him do the programme', desc: 'Same rules for everybody', outcome: 'He does it for three weeks and pulls a back muscle in the fourth. He is out for a month and does not say a word about whose idea it was.', effect: { playerMorale: { who: 'oldest', delta: -12 }, squadMorale: 2, coins: -30, tag: 'mgr-same-rules' } },
          { id: 'exempt', label: 'Let him do what has worked for fifteen years', desc: 'Publicly, so nobody thinks it is a secret', outcome: 'He plays thirty-eight games. Two younger players stop going in as well and cite him, and the strength coach starts updating his own CV.', effect: { playerMorale: { who: 'oldest', delta: 12 }, squadMorale: -4 } },
          { id: 'design', label: 'Ask him to design it with the coach', desc: 'Half his, half the department\'s', outcome: 'They argue for an afternoon and produce something neither would have written. He is in the gym twice a week by October, mostly to prove a point.', effect: { squadMorale: 5, prestige: 1, playerMorale: { who: 'oldest', delta: 6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-podcast-lad', title: 'The Podcast', icon: '🎧', category: 'dressing-room',
    when: { minSeason: 2 }, temper: ['chancer','players-manager'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One of the squad has a podcast with a mate from school. It has about nine hundred listeners. Last week he described a team talk in a way that was affectionate and accurate and specific enough that the press officer sent a link at half eleven at night.',
        choices: [
          { id: 'stop', label: 'Tell him to stop it', desc: 'Contractually he has to', outcome: 'He stops. He also stops being the lad who organised everything, which nobody had connected to the podcast until it went, and neither had he.', effect: { playerMorale: { who: 'star', delta: -12 }, squadMorale: -5, tag: 'mgr-shut-it-down' } },
          { id: 'rules', label: 'Give him three rules and let it run', desc: 'No team talks, no injuries, no selection', outcome: 'He keeps to them for eleven months and breaks one in the last week of the season by accident. It is a small thing and it is on the internet forever.', effect: { squadMorale: 4, prestige: -1 } },
          { id: 'club', label: 'Bring it in-house', desc: 'Club cameras, club channel, club money', outcome: 'It gets better production and worse. Four hundred of the nine hundred stop listening and the mate from school is not part of it any more.', effect: { coins: 50, playerMorale: { who: 'star', delta: -6 }, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-barber-friday', title: 'The Barber Comes On Fridays', icon: '💈', category: 'dressing-room',
    when: { minSeason: 1 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A barber sets up in the boot room every Friday morning and does eight heads before the session. He is not employed by anybody and has no pass. He also knows more about the mood of this squad than the manager does.',
        choices: [
          { id: 'formalise', label: 'Put him on the books', desc: 'A pass, a small fee, a proper room', outcome: 'He is delighted and the room he is given is too clean and too far from the boots. Six heads become four by November.', effect: { coins: -30, squadMorale: 2, prestige: 1 } },
          { id: 'leave', label: 'Leave it exactly as it is', desc: 'The boot room, no paperwork, no questions', outcome: 'Somebody from the office raises it in a safeguarding meeting in April and the manager has to sit through all of it with a straight face.', effect: { squadMorale: 6, boardMood: -1, tag: 'mgr-let-it-be' } },
          { id: 'stop', label: 'End it', desc: 'Nobody unaccredited in the building', outcome: 'It is correct and it is small and it is the thing three players mention when asked what changed this year.', effect: { squadMorale: -6, boardMood: 1, tag: 'mgr-by-the-book' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-partner-posting', title: 'Somebody Else\'s Account', icon: '📱', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player\'s partner has posted something about his minutes. It is nineteen words and it is not wrong. It has been screenshotted by a supporters\' page and the player found out about it in the car park from a fifteen-year-old.',
        choices: [
          { id: 'player', label: 'Talk to the player, not the post', desc: 'What she said is what he thinks', outcome: 'He admits it inside a minute and they have the conversation that should have happened in September. The post is deleted by somebody, at some point.', effect: { playerMorale: { who: 'unhappiest', delta: 12 }, prestige: 1, tag: 'mgr-went-to-the-source' } },
          { id: 'policy', label: 'Have the club issue guidance to families', desc: 'A letter, politely worded, to everybody', outcome: 'Four partners are insulted and one writes back. The letter is on a forum inside a week with the club crest at the top of it.', effect: { squadMorale: -6, prestige: -2, boardMood: -1 } },
          { id: 'nothing', label: 'Pretend not to have seen it', desc: 'It is nineteen words', outcome: 'It is nineteen words and the player spends a fortnight waiting to be spoken to about it, which is its own kind of punishment.', effect: { playerMorale: { who: 'unhappiest', delta: -8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-loud-one-quiet', title: 'The Loud One Has Gone Quiet', icon: '🔇', category: 'dressing-room',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The one who is always at the centre of the room got changed in ninety seconds and left. He did it again on Thursday. On Friday somebody put music on and he asked, without any edge in it at all, whether they could not.',
        choices: [
          { id: 'private', label: 'Get him on his own', desc: 'A walk round the pitches, no clipboard', outcome: 'It takes two laps before he says anything and then it all comes out and none of it is football. He is not fixed and he is not alone with it.', effect: { playerMorale: { who: 'star', delta: 16 }, prestige: 2, tag: 'mgr-noticed' } },
          { id: 'senior', label: 'Ask a senior pro to keep an eye', desc: 'Second-hand, but from somebody he trusts', outcome: 'It gets done, slowly, and reasonably well. The senior pro carries it for four months and mentions in May that he could have used some help himself.', effect: { squadMorale: 3, playerMorale: { who: 'oldest', delta: -6 } } },
          { id: 'wait', label: 'Give him room', desc: 'Some men come back on their own', outcome: 'He does come back, in about six weeks, most of the way. The manager watches the whole six weeks and is never sure whether waiting was patience or cowardice.', effect: { playerMorale: { who: 'star', delta: -6 }, squadMorale: -2 } },
        ],
      },
    },
  },

  // ── TRANSFER ─────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p07-family-will-not-move', title: 'She Is Not Moving', icon: '🏡', category: 'transfer',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everything is agreed. Fee, wages, medical booked. Then his agent rings to say the family is staying where they are, two hundred miles away, and the player would like to know how the club feels about that.',
        choices: [
          { id: 'commute', label: 'Let him commute', desc: 'A flat near the ground, home on the days off', outcome: 'He signs. He is excellent until February and then he is a man who lives in a flat with a kettle and a television and it starts to show in the last twenty minutes.', effect: { coins: -60, prestige: 1, tag: 'mgr-took-the-commuter' } },
          { id: 'help', label: 'Put the club\'s weight behind the move', desc: 'Schools, a house, a job for her if she wants one', outcome: 'It takes eleven weeks and half of somebody\'s job in the office. They are settled by Christmas and he is still here five years later.', effect: { coins: -110, boardMood: -1, prestige: 2, tag: 'mgr-moved-a-family' } },
          { id: 'walk', label: 'Walk away from it', desc: 'A player who has not moved has not signed', outcome: 'He goes elsewhere and plays fifty games in two seasons. The chief scout keeps the file open and does not say anything about it, ever, which is worse.', effect: { prestige: -1, coins: 40 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-medical-finds-something-else', title: 'Not The Knee', icon: '🫀', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The medical was about an ankle. The doctor comes out of the room and asks for five minutes and does not mention the ankle at all. Whatever is on the screen is not a football problem and is not urgent and is not nothing.',
        choices: [
          { id: 'sign-support', label: 'Sign him and manage it', desc: 'Specialist appointments, quietly, on the club', outcome: 'It costs a small sum every quarter and nobody ever knows. He plays a hundred and forty games and gets a letter from the doctor about it years later, at a different club.', effect: { coins: -90, prestige: 2, playerMorale: { who: 'best', delta: 12 }, tag: 'mgr-carried-it' } },
          { id: 'tell-him', label: 'Tell him and let him decide', desc: 'The information is his before it is the club\'s', outcome: 'He goes quiet, thanks them, and signs anyway. He also goes to a GP for the first time in nine years, which is the actual outcome of the day.', effect: { prestige: 2, squadMorale: 3 } },
          { id: 'pull', label: 'Pull out and say it was the ankle', desc: 'Clean, deniable, done by five o\'clock', outcome: 'He signs at a club in the same division and is fine. The manager checks the team sheets for a season and a half without admitting to himself that he is doing it.', effect: { prestige: -2, coins: 60, tag: 'mgr-walked-away-quietly' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-agent-is-his-dad', title: 'The Agent Is His Father', icon: '👨‍👦', category: 'transfer',
    when: { minSeason: 2, needs: 'wonderkid' }, temper: ['builder','players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The boy\'s father took the exam last year and represents him now. He is not good at it. He asks for a number that would embarrass a full international and then apologises for asking, in the same sentence, which is the difficult part.',
        choices: [
          { id: 'straight', label: 'Negotiate with him like anybody else', desc: 'No allowances for the surname', outcome: 'He is outmatched and knows it and signs a fair deal for the club. The boy asks his dad in the car what happened and gets an answer that is not quite true.', effect: { coins: 80, playerMorale: { who: 'youngest', delta: -6 }, prestige: 1 } },
          { id: 'advise', label: 'Tell him to get the boy proper representation', desc: 'Against the club\'s own interest', outcome: 'He is offended for a fortnight and does it. The deal that comes back costs more and the family is still speaking to each other in five years.', effect: { coins: -70, playerMorale: { who: 'youngest', delta: 14 }, prestige: 2, tag: 'mgr-told-them-straight' } },
          { id: 'exploit', label: 'Take the deal on the table', desc: 'He offered it, unprompted', outcome: 'It is the best value contract at the club by some margin. It becomes untenable in eighteen months and the renegotiation is bitter and public.', effect: { coins: 160, boardMood: 2, prestige: -2, tag: 'mgr-took-the-easy-one' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-trialist-coach-fare', title: 'He Paid For The Coach Himself', icon: '🎫', category: 'transfer',
    when: { minSeason: 1, minTier: 4 }, temper: ['builder','chancer','players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A trialist has come two hundred miles on a National Express, overnight, with his boots in a carrier bag. He is twenty-three and was released at nineteen and has been playing Saturday and Sunday since. He is not quite good enough. He is much closer than he has any right to be.',
        choices: [
          { id: 'keep', label: 'Keep him for a month', desc: 'Digs, expenses, a proper look', outcome: 'Three weeks in he is fitter and sharper and still not quite there. The fourth week he is, and nobody at the club can explain what changed.', effect: { coins: -50, squadMorale: 5, prestige: 1, tag: 'mgr-took-a-punt' } },
          { id: 'refer', label: 'Ring three managers below this level for him', desc: 'And put him on the coach with a name to call', outcome: 'He signs for the second of the three and does well. He sends a shirt to the training ground in April with nothing written on it.', effect: { prestige: 2, squadMorale: 2 } },
          { id: 'thanks', label: 'Thank him and pay his fare home', desc: 'Honest, quick, forty quid', outcome: 'He takes it well and says the right things. He is on a building site by August and stops playing altogether within two years.', effect: { coins: -10, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-clause-nobody-read', title: 'Clause Fourteen', icon: '🔍', category: 'transfer',
    when: { minSeason: 3 }, temper: ['chancer','firefighter','disciplinarian'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club secretary has found something. A contract signed two managers ago contains an automatic one-year extension at a twenty per cent rise, triggered by twenty-five appearances. He is on twenty-three and there are nine games left.',
        choices: [
          { id: 'honour', label: 'Play him and let it trigger', desc: 'Somebody signed it, so the club signed it', outcome: 'It goes through in April and costs what it costs. He hears about the clause in the summer from somebody else and is quietly staggered that nobody managed him out of it.', effect: { coins: -140, playerMorale: { who: 'star', delta: 16 }, squadMorale: 6, prestige: 2, tag: 'mgr-honoured-it' } },
          { id: 'bench', label: 'Leave him out until it cannot happen', desc: 'Nine games, no explanation offered', outcome: 'He works it out on his own by the third one. He does not make a scene and he does not run for the last twenty minutes of anything ever again here.', effect: { coins: 100, playerMorale: { who: 'star', delta: -20 }, squadMorale: -8, tag: 'mgr-benched-a-clause' } },
          { id: 'renegotiate', label: 'Go to him and open it up honestly', desc: 'Show him the clause and offer something else', outcome: 'He signs a longer deal at a lower rise because he was asked rather than moved. The board thinks it is a masterstroke and it is mostly just manners.', effect: { coins: -50, playerMorale: { who: 'star', delta: 10 }, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-selling-club-warns-you', title: 'A Courtesy Call', icon: '📴', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager of the selling club rings the night before the medical. He is not trying to wreck the deal. He says one sentence about the player\'s last six months that is not in any report, and then says he will deny having rung.',
        choices: [
          { id: 'proceed', label: 'Sign him anyway', desc: 'One sentence from a man who wants him off the wage bill', outcome: 'It is true, and it takes until January to become obvious, and by then there is nothing to be done about it until June.', effect: { coins: -80, squadMorale: -5, tag: 'mgr-backed-his-own-judgement' } },
          { id: 'ask-player', label: 'Put it to the player directly', desc: 'Not the sentence, but the subject', outcome: 'He gives an answer that is ninety per cent of the truth and offers the last ten per cent unprompted at the end. He signs and never gives a moment\'s trouble.', effect: { prestige: 2, playerMorale: { who: 'best', delta: 10 } } },
          { id: 'pull', label: 'Pull out', desc: 'Blame the medical, thank nobody', outcome: 'The money goes on somebody safer who is worse. The player has a very good season somewhere else and the phone call is never mentioned by either party again.', effect: { coins: 50, prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-no-boots', title: 'He Turned Up With No Boots', icon: '🥿', category: 'transfer',
    when: { minSeason: 1, maxTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new signing\'s first session and he is standing in the boot room in socks. His deal with a manufacturer ended when his last contract did and nobody thought to mention it. He is twenty-eight and has been a professional for a decade and looks about fourteen standing there.',
        choices: [
          { id: 'kit-man', label: 'Have the kit man sort him out', desc: 'Out of stock, no charge, no discussion', outcome: 'He is on the grass in eight minutes wearing a pair with somebody else\'s initials inside. He buys the kit man a drink at Christmas and tells that story for years.', effect: { squadMorale: 5, coins: -15, playerMorale: { who: 'best', delta: 12 } } },
          { id: 'deal', label: 'Get somebody to put a deal in front of him', desc: 'Ring the rep, use the club\'s name', outcome: 'It takes three weeks and it is a poor deal. He signs it because it is a deal and he is contracted to a colour he does not like for two years.', effect: { coins: 40, playerMorale: { who: 'best', delta: -4 } } },
          { id: 'his-problem', label: 'Tell him to sort his own footwear', desc: 'He is a professional footballer', outcome: 'He buys four pairs that afternoon out of his own pocket. It is entirely reasonable and it is the first thing he learns about how this place works.', effect: { playerMorale: { who: 'best', delta: -10 }, tag: 'mgr-cold-welcome' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-unpaid-six-weeks', title: 'Training With Us Since July', icon: '⏳', category: 'transfer',
    when: { minSeason: 1, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A free agent has trained with the group for six weeks unpaid, waiting for a decision. He does every session. He carries the balls in. Nobody has told him anything because nobody has wanted to, and now the season has started.',
        choices: [
          { id: 'sign', label: 'Sign him on whatever can be found', desc: 'Even if it is a month at a time', outcome: 'It is a small deal and he takes it in about a second. He plays eleven games and one of them is the best performance by anybody all season.', effect: { coins: -70, squadMorale: 7, prestige: 1, tag: 'mgr-rewarded-the-wait' } },
          { id: 'tell', label: 'Tell him today that it is a no', desc: 'Six weeks is already too long', outcome: 'He shakes hands with everybody, individually, and drives off. The squad is subdued for two days and one of them says out loud that it could be any of them.', effect: { squadMorale: -5, prestige: 1 } },
          { id: 'string', label: 'Keep him around a bit longer', desc: 'The window shuts in three weeks and things move', outcome: 'Nothing moves. He is still there in October, still carrying the balls, and by then it is the club\'s embarrassment rather than his.', effect: { squadMorale: -8, prestige: -2, tag: 'mgr-strung-him-along' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-both-sides-agent', title: 'Paid By Everybody', icon: '💼', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The intermediary would like a fee from the club as well as from the player. He says it is normal and, in fairness, at this level it very nearly is. The secretary has a form that needs a tick in one of two boxes.',
        choices: [
          { id: 'pay', label: 'Tick it and pay him', desc: 'The deal gets done this week', outcome: 'The deal gets done this week. The number is disclosed in the accounts in fourteen months and somebody at a fans\' forum reads it out.', effect: { coins: -100, boardMood: -1, tag: 'mgr-paid-the-fee' } },
          { id: 'refuse', label: 'Refuse and let him take it from the player', desc: 'One side or the other, not both', outcome: 'He takes it from the player, who is now on less than he thinks he is on. The agent is polite about the club and never brings it anything again.', effect: { coins: 60, playerMorale: { who: 'best', delta: -6 }, prestige: 1 } },
          { id: 'tell-player', label: 'Tell the player what is being asked', desc: 'Before he signs anything', outcome: 'The player changes agent inside a fortnight. The deal takes six weeks longer, costs more, and the manager has made an enemy who works with about forty players.', effect: { coins: -60, prestige: 2, tag: 'mgr-crossed-an-agent' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-wage-doubles-the-top', title: 'Twice What Anybody Earns', icon: '📈', category: 'transfer',
    when: { minSeason: 2, minCoins: 300 }, temper: ['chancer','firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The one player who would change the season wants double what the highest earner at the club is on. The money exists. The dressing room finds out what everybody earns within about a fortnight of anybody signing anything.',
        choices: [
          { id: 'pay', label: 'Pay it', desc: 'Sign him and manage the fallout', outcome: 'He is worth it on the pitch from the first Saturday. Three contract conversations that were settled in July are reopened before November.', effect: { coins: -280, squadMorale: -8, prestige: 2, tag: 'mgr-broke-the-structure' } },
          { id: 'structure', label: 'Offer it in bonuses, not basic', desc: 'The headline number stays where it should', outcome: 'He signs and earns most of it. The structure survives, on paper, and everybody in the room can do arithmetic.', effect: { coins: -190, squadMorale: -3, boardMood: 1 } },
          { id: 'no', label: 'Hold the wage structure', desc: 'And lose him', outcome: 'He signs for a rival and is very good. The squad hears that the club held the line and about half of them think better of it.', effect: { squadMorale: 5, prestige: -1, boardMood: -1, tag: 'mgr-held-the-structure' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-clause-expiring', title: 'It Lapses On The First', icon: '📆', category: 'transfer',
    when: { minSeason: 3, needs: 'wonderkid' }, temper: ['builder','chancer'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best young player at the club has a release clause that expires on the first of July, after which he is simply an asset. He does not know it exists. His agent does not know it exists. There are five weeks.',
        choices: [
          { id: 'tell', label: 'Tell him it is there', desc: 'And that the club would rather he stayed', outcome: 'He does not use it. He signs a new deal in August at a fair number and the thing he keeps saying, for years, is that they told him.', effect: { playerMorale: { who: 'youngest', delta: 20 }, squadMorale: 6, prestige: 3, coins: -40, tag: 'mgr-told-him-about-the-clause' } },
          { id: 'quiet', label: 'Say nothing and let it lapse', desc: 'Five weeks of ordinary conversation', outcome: 'It lapses on a Tuesday. He is worth four times the clause eighteen months later and the club sells him and nobody outside the building ever knows why that was possible.', effect: { coins: 220, boardMood: 2, prestige: -1, tag: 'mgr-let-it-lapse' } },
          { id: 'new-deal-now', label: 'Get a new contract signed before July', desc: 'Improve it now, remove the clause in the rewrite', outcome: 'He signs in June, happily, on better money. His agent finds the old clause in the file two years later and there is a phone call about it.', effect: { coins: -120, playerMorale: { who: 'youngest', delta: 10 }, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-released-now-best', title: 'The One Released Two Years Ago', icon: '🔄', category: 'transfer',
    when: { minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best available player in the position the club needs is one this manager let go at the end of his first season. He has done very well since. His agent takes the call and lets a decent silence run before answering.',
        choices: [
          { id: 'apologise', label: 'Say it was a mistake, in those words', desc: 'Open with it, before the money', outcome: 'It buys nothing in the negotiation and it changes the whole tone of it. He signs for slightly less than he could have got and mentions why in his first interview.', effect: { coins: -110, prestige: 2, squadMorale: 4, tag: 'mgr-admitted-it' } },
          { id: 'business', label: 'Keep it strictly business', desc: 'Two years ago was two years ago', outcome: 'He signs. He is professional and excellent and he never once treats the manager as anything other than an employer.', effect: { coins: -140, prestige: 1 } },
          { id: 'avoid', label: 'Look elsewhere', desc: 'That is a room he does not want to be in', outcome: 'The alternative costs the same and is a level below. The other man is in the division for four more years and the fixture list is the fixture list.', effect: { coins: -120, squadMorale: -3, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-out-of-position-buyer', title: 'They Will Play Him At Full-Back', icon: '↙️', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A good bid for a young winger. The buying club\'s recruitment head is straightforward about it over the phone: they see him as a wing-back and will convert him in pre-season. He does not know that and the fee would pay for two players.',
        choices: [
          { id: 'tell-him', label: 'Tell him what they intend', desc: 'Before he decides anything', outcome: 'He goes anyway, with his eyes open, and it works out. The other club is annoyed about the disclosure and remembers it the next time the clubs deal.', effect: { coins: 180, prestige: 2, playerMorale: { who: 'best', delta: 10 }, tag: 'mgr-told-him-everything' } },
          { id: 'silent', label: 'Take the money', desc: 'It is not this club\'s job to coach their squad for them', outcome: 'The fee is banked and the two players are signed. He plays forty games at wing-back, hates most of them, and is back in this division within three years.', effect: { coins: 200, boardMood: 2, squadMorale: -3 } },
          { id: 'reject', label: 'Reject the bid on his behalf', desc: 'Without telling him there was one', outcome: 'He finds out in eleven days, the way players always do. It is the last good bid for him and both of them know it by the spring.', effect: { playerMorale: { who: 'best', delta: -18 }, boardMood: -2, tag: 'mgr-hid-a-bid' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-paid-in-kit', title: 'Not Entirely In Money', icon: '🧾', category: 'transfer',
    when: { minSeason: 2, maxTier: 6, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club two divisions up wants the centre-half. They will pay two-thirds of the fee in cash and the rest in a training kit deal and two pre-season friendlies with a guarantee. The finance director thinks it is worth more than the cash.',
        choices: [
          { id: 'take', label: 'Take the package', desc: 'Kit, friendlies, and the two-thirds', outcome: 'The friendlies bring in more than anybody projected and the kit lasts three years. Nothing about it can be spent on a player in January.', effect: { coins: 120, boardMood: 2, squadMorale: -3, tag: 'mgr-took-the-package' } },
          { id: 'cash', label: 'Hold out for cash', desc: 'Kit does not play centre-half', outcome: 'They pay it, eventually, at a discount. The number in the bank is smaller and it is a number and it is in the bank.', effect: { coins: 170, boardMood: -1 } },
          { id: 'keep', label: 'Refuse to sell', desc: 'Not for money and certainly not for tracksuits', outcome: 'He stays and is superb until March and then does his ankle. The bid is not repeated in the summer and the finance director does not have to say anything.', effect: { squadMorale: 6, boardMood: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-attitude-flag', title: 'Flagged By Three Scouts', icon: '🚨', category: 'transfer',
    when: { minSeason: 2 }, temper: ['tactician','builder'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The player is excellent. Three separate reports over four years say the same word about him in the last paragraph, and none of the three scouts can point to an incident when asked. One of them says he just did not like his face and then wishes he had not.',
        choices: [
          { id: 'meet', label: 'Go and see him himself', desc: 'A morning, a cafe, no scouts', outcome: 'He is quiet and awkward and entirely fine. The word in the reports turns out to have travelled from the first one into the other two.', effect: { coins: -100, prestige: 2, squadMorale: 3, tag: 'mgr-went-and-looked' } },
          { id: 'trust', label: 'Trust the department', desc: 'That is what they are paid for', outcome: 'He signs elsewhere and has a fine career with no trouble in it whatsoever. The word stays in the file, on the club\'s system, where the next manager will read it.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'rewrite', label: 'Have the reports rewritten with evidence or not at all', desc: 'Every file, not just this one', outcome: 'It takes a scout three weeks and he resigns halfway through it. The reports that come out the other side are shorter and much better.', effect: { coins: -30, prestige: 2, boardMood: -1, tag: 'mgr-cleaned-the-files' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-club-owes-us', title: 'They Still Owe Us', icon: '💷', category: 'transfer',
    when: { minSeason: 3, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club with the striker the manager wants still owes this one forty thousand from a deal done three chairmen ago. Their secretary is embarrassed about it. Their manager has no idea it exists and is being perfectly friendly on the phone.',
        choices: [
          { id: 'offset', label: 'Offset it against the fee', desc: 'Neat, legal, and it settles two problems', outcome: 'They agree instantly because it costs them nothing they had not already lost. The old debt vanishes and so does any goodwill for the next time.', effect: { coins: -60, boardMood: 2, tag: 'mgr-settled-the-debt' } },
          { id: 'forgive', label: 'Write the old debt off', desc: 'And ask for a favour on the fee instead', outcome: 'Their chairman writes a letter that goes in a frame in the boardroom. The favour on the fee is real and is worth about half the debt.', effect: { coins: -100, prestige: 2, clubLegacy: { kind: 'reputation', label: 'the club that wrote the debt off' } } },
          { id: 'chase', label: 'Chase the forty thousand first', desc: 'Solicitors, and the transfer can wait', outcome: 'The money arrives in eleven weeks. The striker signs for somebody else in week four and scores in both games against this club.', effect: { coins: 40, boardMood: 1, squadMorale: -4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-refuses-scan', title: 'He Will Not Have The Scan', icon: '🩻', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The medical is routine except for one thing: he will not have the old knee scanned. He says it is fine and has played two hundred games on it and does not want a picture of it existing anywhere. He is not being difficult. He is frightened.',
        choices: [
          { id: 'waive', label: 'Waive it', desc: 'Two hundred games is a scan of a sort', outcome: 'He signs and plays through it for two full seasons on painkillers and honesty. It goes in the third and everybody involved knew that was possible.', effect: { coins: -90, playerMorale: { who: 'best', delta: 16 }, prestige: 1, tag: 'mgr-waived-the-scan' } },
          { id: 'insist', label: 'Insist', desc: 'The club is buying the knee as well as the man', outcome: 'The scan is worse than anyone expected and he sits in the corridor afterwards for a long time. The deal dies and so does something in him.', effect: { prestige: -1, squadMorale: -2 } },
          { id: 'short', label: 'Offer him one year instead of three', desc: 'Same wage, less risk, and tell him why', outcome: 'He takes it and treats every session like an audition. It is the best year of his career and the club pays for it properly in the second one.', effect: { coins: -50, playerMorale: { who: 'best', delta: 8 }, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-loan-minutes-clause', title: 'The Minutes Are Written In', icon: '⏱️', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The loan is a good one and it comes with a clause: nine hundred minutes by January or he goes back. He is not currently in the best eleven and the parent club\'s loans manager rings every Monday to say hello and count.',
        choices: [
          { id: 'play', label: 'Play him to the minutes', desc: 'Whatever the eleven would otherwise be', outcome: 'The clause is met on the eighth of January. Two players who deserved the shirt more spent the autumn watching and both of them can read a contract.', effect: { squadMorale: -7, playerMorale: { who: 'best', delta: 10 }, tag: 'mgr-played-the-clause' } },
          { id: 'send-back', label: 'Send him back early', desc: 'Free the wage, free the shirt', outcome: 'The parent club is fine about it and slightly cooler about the next one. The player leaves saying all the right things and does not look at anybody on his way out.', effect: { coins: 60, squadMorale: 3, prestige: -1 } },
          { id: 'renegotiate', label: 'Ring them and ask for the clause to be dropped', desc: 'Honestly, on the grounds that he is not good enough yet', outcome: 'They drop it, because being told the truth about their own player is rarer than it should be. He plays eleven minutes in three months and improves in every one of the sessions.', effect: { prestige: 2, squadMorale: 2, tag: 'mgr-told-the-parent-club' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-registration-error', title: 'A Line On The Form', icon: '📝', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The secretary has gone white. A registration went in with a date wrong on it in August. He has played nine games. The league has not noticed and there is no reason to think they will, and there is a form for correcting it that is not a secret.',
        choices: [
          { id: 'self-report', label: 'Report it', desc: 'Today, in writing, before anybody asks', outcome: 'A fine, a warning, and a paragraph in a local paper. The league\'s compliance officer is unexpectedly decent about it and remembers the club fondly for years.', effect: { coins: -80, boardMood: -1, prestige: 2, tag: 'mgr-self-reported' } },
          { id: 'quiet-fix', label: 'Correct it quietly and say nothing', desc: 'The form does not ask when the error happened', outcome: 'It goes through without a query. The secretary does not sleep well until about March and never quite trusts the filing again.', effect: { squadMorale: -2, boardMood: 1 } },
          { id: 'blame', label: 'Find out who did it first', desc: 'Before deciding anything else', outcome: 'It was the secretary, in August, on the day her mother was in hospital. Nothing about knowing that makes the decision easier.', effect: { prestige: -1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-own-fitness-coach', title: 'He Brings His Own Man', icon: '🧢', category: 'transfer',
    when: { minSeason: 2, minTier: 1, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The signing would like his personal fitness coach given access to the training ground. He has worked with him for six years and credits him with the last two seasons. The club\'s own department has heard about this by lunchtime and is not pleased.',
        choices: [
          { id: 'allow', label: 'Let him in', desc: 'With a pass, a schedule, and a boss', outcome: 'He is good, actually, and works well with the department once everybody has stopped circling. Two other players are using him by spring, unofficially.', effect: { squadMorale: 2, playerMorale: { who: 'best', delta: 12 }, prestige: -1, tag: 'mgr-let-an-outsider-in' } },
          { id: 'refuse', label: 'One department, no exceptions', desc: 'He can see him on his days off', outcome: 'He accepts it without much fuss and sees him on Sundays anyway. The club\'s staff are solid behind the manager for the rest of the year.', effect: { squadMorale: 4, playerMorale: { who: 'best', delta: -8 } } },
          { id: 'hire', label: 'Offer the man a job', desc: 'If he is that good, employ him', outcome: 'He takes it and is on the club\'s side within a month, which the player had not thought through. The head of department resigns in June.', effect: { coins: -90, prestige: 1, squadMorale: -4, tag: 'mgr-hired-the-outsider' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-chairmans-recommendation', title: 'A Lad He Knows', icon: '🎩', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chairman has mentioned a player four times in three weeks, always in passing, always at the end of a conversation about something else. He is the son of a friend. He is not bad. He is about the fifteenth best option on the list.',
        choices: [
          { id: 'trial', label: 'Give him two weeks on trial', desc: 'A real look, judged like anybody else', outcome: 'He is fifteenth best after a fortnight as well. The chairman accepts the verdict because he watched some of it, and never raises it again.', effect: { coins: -20, boardMood: 1, prestige: 1 } },
          { id: 'sign', label: 'Sign him', desc: 'It buys a year of not being asked about other things', outcome: 'He plays six games and is fine in all of them. It costs a squad place, and the manager knows exactly what he traded for it every time he reads the team sheet.', effect: { coins: -60, boardMood: 2, squadMorale: -3, prestige: -2, tag: 'mgr-signed-a-favour' } },
          { id: 'no', label: 'Say no plainly', desc: 'Once, so it does not have to be said again', outcome: 'The chairman takes it well and mentions nobody else all season. He also stops mentioning several things it would have been useful to hear.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-said-no-upstairs' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-keeper-coach-recommends', title: 'One He Used To Coach', icon: '🧤', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The goalkeeping coach has never asked for anything. He asks for this: a keeper he worked with eight years ago, now out of contract at thirty-one, who he says is the best trainer he has ever had. The reports on him are ordinary.',
        choices: [
          { id: 'sign', label: 'Sign him on the coach\'s word', desc: 'He has never asked before', outcome: 'He is ordinary in the games and transforms every session he is in. The two young keepers improve more in a year than in the previous four.', effect: { coins: -70, squadMorale: 6, prestige: 1, tag: 'mgr-trusted-his-staff' } },
          { id: 'reports', label: 'Go with the reports', desc: 'Sign the better goalkeeper', outcome: 'The better goalkeeper is better. The goalkeeping coach says nothing about it and is a fraction less forthcoming for the rest of the season.', effect: { coins: -90, squadMorale: -3 } },
          { id: 'coach-role', label: 'Bring him in as a player-coach instead', desc: 'Third choice and on the staff', outcome: 'It is the sensible answer and it makes him neither one thing nor the other. He is gone in a year to a job where he is only one of them.', effect: { coins: -40, squadMorale: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-bid-for-the-forgotten', title: 'A Bid For The Third Keeper', icon: '📥', category: 'transfer',
    when: { minSeason: 2, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A bid, out of nowhere, for a player who has not been in a matchday squad since October. It is more than he is worth. The manager had honestly forgotten to include him in a conversation about the squad two weeks ago.',
        choices: [
          { id: 'sell', label: 'Take it', desc: 'Money for a man who is not playing', outcome: 'He is out of the door in four days and playing every week by November. The bit that stays with the manager is how quickly he packed.', effect: { coins: 150, squadMorale: -3, tag: 'mgr-moved-him-on' } },
          { id: 'ask', label: 'Ask him what he wants', desc: 'Before anybody answers the bid', outcome: 'He wants to stay and fight, which nobody expected, and he says why. He is in the squad in a fortnight and the bid is politely declined.', effect: { squadMorale: 7, playerMorale: { who: 'unhappiest', delta: 18 }, boardMood: -1, prestige: 1 } },
          { id: 'push', label: 'Ask them for a third more', desc: 'They want him, so let them want him', outcome: 'They pay it without blinking, which tells everybody something they would rather not know about how this squad was assessed.', effect: { coins: 200, boardMood: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-one-year-only', title: 'One Year, Nothing Longer', icon: '1️⃣', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He will sign, but for one year only. He is twenty-six and in his prime and will not explain it. Everyone in the room understands that this is a man planning to be somewhere else in twelve months and no one wants to say so.',
        choices: [
          { id: 'take-it', label: 'Take the year', desc: 'A good player is a good player for a year', outcome: 'He is superb for eleven months and leaves for nothing in June. The eleven months are still the eleven months and the club was better for them.', effect: { coins: -80, squadMorale: 5, tag: 'mgr-took-the-year' } },
          { id: 'push-three', label: 'Insist on three or nothing', desc: 'Assets, not visitors', outcome: 'He signs for a rival on one year and does the exact same thing there. Everybody was right and the club has nobody in the position.', effect: { prestige: -1, squadMorale: -4 } },
          { id: 'ask-why', label: 'Ask him why, properly', desc: 'And be prepared to hear it', outcome: 'It is family, and it is a specific date, and it is not about football at all. He signs for two years in the end and the club knows something private that it keeps.', effect: { coins: -110, playerMorale: { who: 'best', delta: 14 }, prestige: 2, tag: 'mgr-asked-the-question' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-nine-out-of-contract', title: 'Nine Letters In June', icon: '✉️', category: 'transfer',
    when: { minSeason: 3, needs: 'big-squad' }, temper: ['disciplinarian','players-manager','builder'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine of them are out of contract. The retained list has to be with the league by the end of the month. Four are easy. Three are hard. Two of them have been at the club since they were nine years old.',
        choices: [
          { id: 'in-person', label: 'Tell all nine face to face', desc: 'Nine appointments, one afternoon, no assistant in the room', outcome: 'It takes six hours and it is the worst day of the season by a distance. Two of the released ones shake his hand at the door and mean it.', effect: { prestige: 3, squadMorale: 4, tag: 'mgr-did-it-himself' }, next: 'after' },
          { id: 'letters', label: 'Let the letters do it', desc: 'It is what the process is for', outcome: 'They all get the same envelope on the same morning. One of them is told by his mother, who opened the post, and that gets round the town.', effect: { prestige: -3, squadMorale: -7, tag: 'mgr-sent-letters' }, next: 'after' },
          { id: 'delay', label: 'Keep two on for another year', desc: 'Delay the hard part', outcome: 'It is kindness with a bill attached. Both of them are released twelve months later by somebody else and neither is any more ready for it.', effect: { coins: -120, squadMorale: 3, boardMood: -1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'One of the released lads asks for a reference. He is nineteen and has never applied for anything in his life.',
        choices: [
          { id: 'write', label: 'Write it himself, properly', desc: 'An hour, and honest about what he is good at', outcome: 'He gets an interview off the back of it at a club three divisions down and is playing by September. He keeps the letter.', effect: { prestige: 2, squadMorale: 3 } },
          { id: 'calls', label: 'Make four phone calls instead', desc: 'Worth more than paper at this level', outcome: 'The second call finds him a trial. It is not written down anywhere and he never quite knows who did it for him.', effect: { prestige: 1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-swap-the-physio', title: 'He Wants To Bring The Physio', icon: '🧑‍⚕️', category: 'transfer',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A senior signing has one condition and it is not money. He wants the club to interview the physio who has looked after his back for nine years. This club\'s physio has been here eleven years and is standing about six feet away when it is mentioned.',
        choices: [
          { id: 'interview', label: 'Interview him, and say so openly', desc: 'In front of the man who is already here', outcome: 'He is not better. He is told so and the player accepts it. The club\'s own physio is visibly taller for about a month.', effect: { squadMorale: 5, prestige: 1, playerMorale: { who: 'best', delta: -4 } } },
          { id: 'consultant', label: 'Bring him in one day a fortnight', desc: 'A consultancy, not a job', outcome: 'It works clinically and it is awkward every single fortnight. Both physios are professional about it and neither enjoys the Wednesdays.', effect: { coins: -70, playerMorale: { who: 'best', delta: 10 }, squadMorale: -3 } },
          { id: 'refuse', label: 'Refuse flatly', desc: 'The medical department is not part of a transfer', outcome: 'He signs anyway and manages his back himself, badly, for two seasons. He is out for eleven weeks in the second one.', effect: { playerMorale: { who: 'best', delta: -10 }, squadMorale: 3, coins: -40, tag: 'mgr-drew-a-line' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-deadline-embargo-lifts', title: 'Lifted At Four O\'Clock', icon: '🔓', category: 'transfer',
    when: { minSeason: 2, maxCoins: 500 }, temper: ['chancer','firefighter'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The embargo comes off at four on deadline day, which nobody had planned for because nobody believed it would. There are three hours, a list that is nine months out of date, and a chairman who is suddenly full of ideas.',
        choices: [
          { id: 'panic', label: 'Get two bodies in', desc: 'Anything with a pulse and a registration', outcome: 'Both are signed by six. One is useful. The other plays four times and is paid until May and is a running joke by October.', effect: { coins: -140, squadMorale: 3, prestige: -2, tag: 'mgr-panic-bought' } },
          { id: 'one', label: 'One player, the right one, or nobody', desc: 'Three hours on a single phone number', outcome: 'It gets done at nine minutes to eleven with the secretary holding a phone and a pen. He is the best player at the club within a month.', effect: { coins: -180, squadMorale: 7, prestige: 2 } },
          { id: 'none', label: 'Sign nobody', desc: 'Take the freedom into January instead', outcome: 'The squad finds out the embargo lifted and that nothing happened. That is a harder thing to explain than the embargo ever was.', effect: { coins: 60, squadMorale: -8, boardMood: -1, tag: 'mgr-sat-on-his-hands' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-brother-in-law-agent', title: 'The Brother-In-Law', icon: '🤵', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player at the club has changed representation. His new agent is his sister\'s husband, licensed for six weeks, and has already sent the club two emails, both of which begin with the word "Frankly".',
        choices: [
          { id: 'patient', label: 'Take him seriously and go slowly', desc: 'Explain the process, twice if needed', outcome: 'He learns quickly and turns out to be reasonable. The negotiation takes four weeks longer than it should and lands somewhere sensible.', effect: { coins: -50, playerMorale: { who: 'star', delta: 8 }, prestige: 1 } },
          { id: 'over-head', label: 'Deal with the player directly', desc: 'Which is allowed and is not liked', outcome: 'The contract gets signed in a morning. Christmas dinner at that house is apparently difficult and the manager hears about it, in detail, in March.', effect: { coins: 60, playerMorale: { who: 'star', delta: -8 }, prestige: -1, tag: 'mgr-went-round-the-agent' } },
          { id: 'stall', label: 'Stall until the player gets fed up', desc: 'Time does the work', outcome: 'It takes five months and it works. The player is on a deal he does not love and there is a coldness now that never entirely lifts.', effect: { coins: 90, playerMorale: { who: 'star', delta: -14 }, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-work-placement-deal', title: 'A Job For The Brother', icon: '🧰', category: 'transfer',
    when: { minSeason: 2, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The family will let the sixteen-year-old sign if his older brother gets a paid job on the ground staff. The brother is twenty and has done nothing wrong in his life except leave school without much. The head groundsman needs an extra pair of hands anyway.',
        choices: [
          { id: 'hire', label: 'Give the brother the job', desc: 'On the ground staff, properly paid', outcome: 'He is good at it and stays fourteen years. The sixteen-year-old plays twice and moves on, and by then nobody connects the two things at all.', effect: { coins: -40, prestige: 1, squadMorale: 2, tag: 'mgr-hired-the-brother' } },
          { id: 'refuse', label: 'Refuse the arrangement', desc: 'Registrations are not employment agencies', outcome: 'The boy signs elsewhere and is in a first team at eighteen. The manager watches him for a decade and is never sure the principle was worth it.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'trial', label: 'Offer the brother a trial on the staff', desc: 'Six weeks, and it stands on its own merit', outcome: 'He is late twice in the first fortnight and then never again. The groundsman keeps him on and tells the manager afterwards, not before.', effect: { coins: -20, squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-friendly-fee', title: 'A Friendly As Part Of It', icon: '🤝', category: 'transfer',
    when: { minSeason: 2, maxTier: 7 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The bigger club will pay a modest fee for the young winger and bring a strong side here for a pre-season friendly, gate receipts kept by this club. The gate would be four times a normal one. The fee, on its own, is an insult.',
        choices: [
          { id: 'accept', label: 'Take the fee and the fixture', desc: 'The gate is real money in July', outcome: 'Six thousand people come and the club makes more from the night than the fee. Nobody remembers that when he is in an international squad in three years.', effect: { coins: 130, boardMood: 2, prestige: -1, tag: 'mgr-sold-for-a-friendly' } },
          { id: 'hold', label: 'Demand a proper fee', desc: 'And keep the friendly out of it', outcome: 'They go cold for six weeks and come back at a better number in August. The friendly does not happen and the pre-season budget is what it always was.', effect: { coins: 90, boardMood: -1, prestige: 1 } },
          { id: 'sell-on', label: 'Small fee, big sell-on', desc: 'Twenty-five per cent of the next one', outcome: 'The club receives nothing for four years and then receives a life-changing sum on a Tuesday morning. Two managers have come and gone by then.', effect: { coins: 40, boardMood: 1, clubLegacy: { kind: 'reputation', label: 'the club that always keeps a sell-on' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-cannot-travel-for-talks', title: 'They Will Not Let Him Travel', icon: '🚧', category: 'transfer',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Terms are agreed with the selling club and they will not release the player for talks until Friday, which is after the window closes for their own reasons. The player has a phone. The manager has a car and an evening.',
        choices: [
          { id: 'drive', label: 'Drive up and meet him', desc: 'A hotel car park, an hour, no club officials', outcome: 'It is done by ten at night and the paperwork follows. Their manager knows by Sunday and says one sentence about it that lasts about six years.', effect: { coins: -100, squadMorale: 4, prestige: -1, tag: 'mgr-went-behind-them' } },
          { id: 'wait', label: 'Wait for Friday', desc: 'And accept the window may shut first', outcome: 'It shuts first. He signs in January instead, for more, and the four months in between were four months.', effect: { coins: -140, prestige: 1 } },
          { id: 'phone', label: 'Do it all by phone', desc: 'Never meet, never travel, nothing to photograph', outcome: 'He signs a contract for a manager he has never sat in a room with. It takes until Christmas for that to stop being noticeable.', effect: { coins: -110, playerMorale: { who: 'best', delta: -6 } } },
        ],
      },
    },
  },

  // ── CLUB ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p07-hosepipe-ban', title: 'No Water Until September', icon: '🚿', category: 'club',
    when: { minSeason: 1 }, temper: ['tactician','firefighter'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A hosepipe ban, six weeks into a drought, and the pitch has gone the colour of a doormat. The groundsman has been filling watering cans from the away dressing room at night and has now been told, by somebody in a hi-vis, to stop.',
        choices: [
          { id: 'borehole', label: 'Pay for a borehole', desc: 'A hole in the ground and a licence to go with it', outcome: 'It takes until October and costs more than the quote. The pitch is the best in the division for the next nine years and nobody who paid for it is still here.', effect: { coins: -220, boardMood: -2, clubLegacy: { kind: 'tradition', label: 'the borehole under the training pitch' } } },
          { id: 'play-on', label: 'Play on what there is', desc: 'It is a surface and it is flat', outcome: 'It is like playing on a car park until the middle of October. Two hamstrings in the first three home games and the groundsman says nothing at all.', effect: { squadMorale: -6, coins: -40 } },
          { id: 'away-preseason', label: 'Move pre-season entirely off site', desc: 'Hire a college pitch for six weeks', outcome: 'The grass comes back. The squad spends its summer somewhere with no history in it and comes back to a ground that smells unfamiliar.', effect: { coins: -90, squadMorale: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-reference-for-a-boy', title: 'A Reference', icon: '📄', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A lad released at eighteen last summer has come back to reception. He is not asking for a trial. He is applying for an apprenticeship at a garage and needs somebody to say he turned up on time for two years, and there is nobody else who can.',
        choices: [
          { id: 'full', label: 'Write it and take him for a cup of tea', desc: 'Forty minutes he does not have', outcome: 'He gets the apprenticeship. He comes to games and stands in the same spot and waves at the dugout at the final whistle for about a decade.', effect: { prestige: 2, clubLegacy: { kind: 'tradition', label: 'references written for every released boy' } } },
          { id: 'sign', label: 'Sign whatever the office has drafted', desc: 'A template, a signature, thirty seconds', outcome: 'It does the job. It says nothing about him that a stranger could not have written and he notices that on the bus home.', effect: { prestige: 1 } },
          { id: 'youth-coach', label: 'Send him to the youth coach who had him', desc: 'The man who actually knows', outcome: 'It is the right answer and takes the manager out of it entirely. The youth coach writes a very good letter and mentions, later, that he has written eleven this year.', effect: { prestige: 1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-archive-in-a-loft', title: 'Forty Boxes In A Loft', icon: '📼', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporter has rung to say his father has died and that the loft contains every programme, team sheet and minute book the club produced between 1946 and 1988. He would like somebody to come and get them before the house is sold. Nobody at the club has anywhere to put forty boxes.',
        choices: [
          { id: 'take', label: 'Take the lot', desc: 'And find a room afterwards', outcome: 'They live under the main stand in the damp for two years until a volunteer catalogues them. What is in box nineteen changes what the club believes about its own founding.', effect: { coins: -30, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the club archive' } } },
          { id: 'library', label: 'Get the local library to take them', desc: 'Properly stored, publicly available, not the club\'s', outcome: 'It is the sensible home for them. Anybody wanting to see the club\'s own history now fills in a form at a desk in the town centre.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'pick', label: 'Take a dozen and leave the rest', desc: 'The good years and the trophies', outcome: 'The rest goes in a skip on the Thursday. Somebody photographs the skip and it is on a forum by the evening.', effect: { prestige: -2, boardMood: -1, tag: 'mgr-skipped-the-archive' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-shirt-typo', title: 'Two Ns', icon: '👕', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eight hundred home shirts have arrived with the sponsor\'s name spelled wrong. One letter. The sponsor has not noticed. The shop wants to know whether to put them out on Saturday because the launch has been advertised for a month.',
        choices: [
          { id: 'sell', label: 'Sell them', desc: 'Say nothing and watch the internet', outcome: 'They sell out in two days as a novelty and the sponsor is delighted with the attention. The manufacturer sends a corrected batch that nobody buys.', effect: { coins: 90, boardMood: 1, prestige: -1, tag: 'mgr-sold-the-misprint' } },
          { id: 'tell', label: 'Ring the sponsor first', desc: 'Before anybody else does', outcome: 'They are gracious and slightly cooler at renewal. The shirts go out a fortnight late and the launch weekend is a damp squib.', effect: { coins: -60, prestige: 2 } },
          { id: 'destroy', label: 'Have them destroyed', desc: 'And bill the manufacturer', outcome: 'The manufacturer pays up after four months of letters. Eight hundred shirts are pulped and two people in the office cannot stop talking about it.', effect: { coins: 30, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-referee-no-hot-water', title: 'The Officials\' Room', icon: '🚰', category: 'club',
    when: { minSeason: 1, minTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There has been no hot water in the referee\'s room since November. Officials have been getting changed in the cold and driving home unwashed all winter. Nobody has complained and it has been mentioned in three separate match reports.',
        choices: [
          { id: 'fix', label: 'Fix it this week', desc: 'A plumber and whatever it costs', outcome: 'It is done by Thursday. Officials talk to each other about clubs constantly and this one moves up a list that nobody admits exists.', effect: { coins: -60, prestige: 1, boardMood: -1 } },
          { id: 'apologise', label: 'Apologise to every official until it is fixed', desc: 'In person, before every game', outcome: 'It is a small humiliation done fourteen times. Two referees say it is the most decent thing they have had at any ground all season.', effect: { prestige: 2, squadMorale: 1 } },
          { id: 'later', label: 'Put it on the summer list', desc: 'There are eleven jobs ahead of it', outcome: 'It gets done in July. The club has a reputation with officials by then that takes about three years to shift.', effect: { coins: 30, prestige: -2, tag: 'mgr-left-it' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-photographer-pass', title: 'Thirty Years Behind The Goal', icon: '📸', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The man who has photographed every home game since 1994 has been told he needs an accreditation the new media policy requires and cannot get one because he is not employed by a publication. His pictures are on the walls of half the building.',
        choices: [
          { id: 'employ', label: 'Make him the club photographer', desc: 'A title, a small retainer, a pass that works', outcome: 'He is on the payroll for the first time at sixty-one and is embarrassed about the money. The archive he hands over is worth ten times what he is paid.', effect: { coins: -40, prestige: 2 } },
          { id: 'exception', label: 'Write him an exception into the policy', desc: 'One name, one line, no precedent', outcome: 'It works and it is a line in a document with a man\'s name in it. Two other people ask for the same by Christmas and both are refused.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'policy', label: 'Apply the policy', desc: 'It exists for reasons', outcome: 'He stands in the family stand with a compact camera for three games and then stops coming. The wall pictures stay up and get harder to walk past.', effect: { prestige: -2, boardMood: 1, tag: 'mgr-applied-the-policy' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-pitch-markings-by-eye', title: 'He Does Them By Eye', icon: '📏', category: 'club',
    when: { minSeason: 1, minTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The assistant groundsman marks the pitch without string, by eye, the way he was taught. He is remarkably good at it. This week an inspector has measured the six-yard box and found it eleven inches out at one end.',
        choices: [
          { id: 'string', label: 'Insist on string and tape from now on', desc: 'Measured, checked, signed off', outcome: 'It takes him three times as long and he is meticulous about it. He is also, obviously, a man who has been told he cannot do the thing he is known for.', effect: { coins: -20, boardMood: 1, prestige: 1 } },
          { id: 'keep', label: 'Back him and take the eleven inches', desc: 'Nobody has noticed in twenty years', outcome: 'It is noticed by an away manager in February and there is a letter. The letter goes in a drawer and the pitch is marked by eye for another decade.', effect: { boardMood: -1, prestige: -1, tag: 'mgr-backed-the-groundsman' } },
          { id: 'teach', label: 'Have him teach two others, with the tape', desc: 'Keep the eye, add the measurement', outcome: 'Both apprentices are better than the inspection requires within a month. He is prouder of that than of anything else he has done here.', effect: { coins: -30, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-scoreboard-parts', title: 'They Do Not Make The Part', icon: '🔢', category: 'club',
    when: { minSeason: 2, maxTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The scoreboard has shown 0-0 since August because a board inside it has failed and the company that made it closed in 2003. A supporter who is an electrician says he could probably fix it, and the word probably is doing some work in that sentence.',
        choices: [
          { id: 'let-him', label: 'Let the electrician have a go', desc: 'A Sunday, a ladder, no money', outcome: 'It works for eleven months and then does something worse. He will not take a penny and asks only that the announcer says his dad\'s name once.', effect: { squadMorale: 2, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the scoreboard the supporter fixed' } } },
          { id: 'new', label: 'Buy a new one', desc: 'Money that was going somewhere else', outcome: 'It is bright and modern and shows advertising between goals. Four separate people write in to say they preferred the broken one.', effect: { coins: -170, boardMood: -1 } },
          { id: 'manual', label: 'Go back to numbers on hooks', desc: 'A lad, a ladder and a set of metal plates', outcome: 'It costs about eighty quid and is done by a fifteen-year-old in a club coat every game. Photographs of it start appearing in other clubs\' fanzines.', effect: { coins: -10, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-bequest', title: 'Left To The Club', icon: '🕊️', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A solicitor writes. A supporter who nobody at the club can identify has left the club a sum of money and one instruction, which is that it be spent on something the players will use. It is not an enormous amount. It is not nothing.',
        choices: [
          { id: 'gym', label: 'Put it into the gym', desc: 'Kit the squad will touch every day', outcome: 'It buys three machines and a floor. It is used ten thousand times a year and there is a small plaque on the wall that the players stop seeing in about a fortnight.', effect: { coins: 140, squadMorale: 5, clubLegacy: { kind: 'stand', label: 'the gym paid for by a will' } } },
          { id: 'pitch', label: 'Spend it on the training pitches', desc: 'Drainage, which nobody will ever thank anybody for', outcome: 'Two pitches are playable in January for the first time in fifteen years. It is the least visible and most useful thing the money could have done.', effect: { coins: 130, squadMorale: 4, prestige: 1 } },
          { id: 'find-family', label: 'Find out who he was first', desc: 'Before spending a penny of it', outcome: 'It takes five weeks and a nephew in another county. He comes to a game, sits in the directors\' box, and asks that it go on the youth team.', effect: { coins: 120, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-funeral-at-the-ground', title: 'They Want To Hold It Here', icon: '⚱️', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A family has asked whether the wake for a lifelong supporter can be held in the function room. It is a Friday. The room is booked for a sponsors\' lunch that brings in real money and the sponsor has already sent the seating plan.',
        choices: [
          { id: 'family', label: 'Give the room to the family', desc: 'And move the sponsors somewhere else', outcome: 'The sponsors are moved to a marquee and are entirely gracious about it. Ninety people stand in a room full of photographs and the club is in every single one of the speeches.', effect: { coins: -70, prestige: 2 } },
          { id: 'sunday', label: 'Offer them the Sunday instead', desc: 'Free of charge, whole building', outcome: 'They take it, gladly. Somebody in the family says the word Friday twice in a way that everybody hears and nobody responds to.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'no', label: 'The room is booked', desc: 'The sponsorship pays two wages', outcome: 'It does pay two wages. The wake is in a pub four streets away and the club sends flowers and the flowers are noticed for exactly what they are.', effect: { coins: 60, prestige: -2, tag: 'mgr-kept-the-booking' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-training-ground-floodlights', title: 'The Neighbours', icon: '🏘️', category: 'club',
    when: { minSeason: 2, facility: { key: 'training', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eleven letters from the estate behind the training ground about the floodlights on the third pitch running until half nine. The under-18s train under them because that is when the boys can get there after college. The council has forwarded the letters with a covering note.',
        choices: [
          { id: 'shields', label: 'Pay for shielded lamps', desc: 'A specialist job, aimed down', outcome: 'It costs a great deal and works completely. Two of the original eleven write again to say thank you, which the office frames.', effect: { coins: -150, prestige: 2, boardMood: -1 } },
          { id: 'earlier', label: 'Move the session to seven', desc: 'And lose the lads who cannot get there', outcome: 'Four of nineteen stop coming inside a month. Two of the four were the best two and both are playing for somebody else by the spring.', effect: { coins: 20, squadMorale: -3, prestige: -1 } },
          { id: 'meet', label: 'Invite the whole estate in', desc: 'A Saturday, the pitches, tea and a look round', outcome: 'Thirty people come and two of them are still complaining at the end of it. The other twenty-eight bring children who are in the academy within two years.', effect: { coins: -30, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-turnstile-freebies', title: 'He Has Been Letting Them In', icon: '🎟️', category: 'club',
    when: { minSeason: 2, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A turnstile operator has been letting local kids in free at half time for about fifteen years. The new ticketing system has made it visible. He is seventy-three and has volunteered here since he retired and he has not denied a word of it.',
        choices: [
          { id: 'formalise', label: 'Make it a policy', desc: 'Under-sixteens in free after half time, every game', outcome: 'The gate barely changes and the noise from the corner does. Four of those kids have season tickets within five years and one of them plays for the club.', effect: { coins: -30, prestige: 2, clubLegacy: { kind: 'tradition', label: 'kids in free at half time' } } },
          { id: 'warn', label: 'Tell him it stops today', desc: 'Quietly, no disciplinary, no announcement', outcome: 'It stops. He is on the same turnstile for another four years and something has gone out of him that he does not mention.', effect: { coins: 40, prestige: -1, boardMood: 1 } },
          { id: 'sack', label: 'Let him go', desc: 'Fifteen years of unpaid admissions is fifteen years', outcome: 'The board backs it and the town does not. His name is sung once, in the eighty-first minute of the next home game, and never again.', effect: { coins: 60, prestige: -3, boardMood: 1, tag: 'mgr-sacked-a-volunteer' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-sunday-league-pitch', title: 'They Cut It Up On Sundays', icon: '🌿', category: 'club',
    when: { minSeason: 1, minTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A Sunday side has used the back pitch for thirty years for a peppercorn rent. In winter they leave it in a state that takes the groundsman until Wednesday to put right. Their secretary is the man who used to run the club\'s lottery.',
        choices: [
          { id: 'end', label: 'End the arrangement', desc: 'Give them notice in writing', outcome: 'They find a council pitch three miles away and fold within two seasons. The back pitch is immaculate and quiet on Sundays.', effect: { coins: 30, squadMorale: 2, prestige: -2, tag: 'mgr-ended-the-sunday-arrangement' } },
          { id: 'summer', label: 'Move them to summer only', desc: 'Same rent, different months', outcome: 'They agree without much argument. Half their squad drifts away over the first winter without a fixture and it is not really the same club afterwards.', effect: { squadMorale: 1, prestige: -1 } },
          { id: 'keep', label: 'Leave it exactly as it is', desc: 'Thirty years is thirty years', outcome: 'The groundsman is furious for a fortnight and then not. Two of their lads are on trial here within eighteen months and one of them signs.', effect: { coins: -20, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-womens-team-ground', title: 'They Want The Main Pitch', icon: '🏟️', category: 'club',
    when: { minSeason: 2, facility: { key: 'women', min: 4 } }, temper: ['builder','players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The women\'s side have asked to play their last four home games at the stadium rather than the training ground. The groundsman says four extra games in March is four games too many. The commercial department has not thought about it at all.',
        choices: [
          { id: 'all', label: 'Give them the stadium for the rest of the season', desc: 'And put it in the fixture list properly', outcome: 'The last game draws eleven hundred, which is more than anyone expected and more than some men\'s fixtures. The pitch takes six weeks to recover.', effect: { coins: 40, prestige: 2, squadMorale: -2, clubLegacy: { kind: 'tradition', label: 'the women play at the stadium' } } },
          { id: 'one', label: 'Give them one, and make it the biggest one', desc: 'Marketed properly, everything behind it', outcome: 'Eight hundred come to a game that would have had ninety. It is a good day and the question comes back in exactly twelve months.', effect: { coins: 20, prestige: 1 } },
          { id: 'no', label: 'The pitch cannot take it', desc: 'And it is true', outcome: 'It is true. It is also the answer they have been given for six years and one of them says so in a local radio interview in April.', effect: { prestige: -2, boardMood: 1, tag: 'mgr-said-no-to-the-women' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-water-bill-wrong', title: 'Since Nineteen Ninety-Four', icon: '💧', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The finance officer has found that the club has been billed for a water meter that serves the industrial unit next door as well as the ground. She thinks it goes back nearly thirty years. The unit is owned by a man who sponsors the away shirt.',
        choices: [
          { id: 'claim', label: 'Claim the lot back', desc: 'Solicitors, the water company, everybody', outcome: 'A sum arrives eighteen months later that changes a summer. The away shirt sponsorship is not renewed and nobody pretends the two things are unconnected.', effect: { coins: 260, boardMood: 2, prestige: -1, tag: 'mgr-claimed-it-all' } },
          { id: 'split', label: 'Go and see him about it', desc: 'Man to man, before any letters', outcome: 'He is horrified, genuinely, and pays half of what is owed in one cheque. He sponsors two more shirts and brings in another business as well.', effect: { coins: 140, prestige: 2 } },
          { id: 'forward', label: 'Fix the meter and forget the past', desc: 'Save the money from here on', outcome: 'It saves a modest amount every year forever. The finance officer thinks it is a wasted opportunity and says so in a meeting.', effect: { coins: 60, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-film-crew', title: 'They Want To Film Here', icon: '🎬', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A production company wants the ground for four days in October for a drama set in 1979. They will pay well. They need the seats out of the family stand, the pitch walked on by about sixty people, and the club\'s name off everything.',
        choices: [
          { id: 'yes', label: 'Take the money', desc: 'Four days in an international break', outcome: 'The money is good and the pitch is fine and the club appears on television as somewhere else entirely. Two supporters recognise the tea bar and that is that.', effect: { coins: 180, boardMood: 2, squadMorale: -2 } },
          { id: 'conditions', label: 'Say yes with conditions', desc: 'The club\'s name stays and the youth team gets used as extras', outcome: 'They agree to one of the two. Fourteen boys spend a day being paid to stand in a crowd in 1979 and talk about it for years.', effect: { coins: 130, prestige: 1, squadMorale: 3 } },
          { id: 'no', label: 'Refuse', desc: 'It is a football ground in October', outcome: 'They film at a club twelve miles away instead and that club puts the money into its academy. It is mentioned at a supporters\' meeting in February.', effect: { boardMood: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-old-player-struggling', title: 'He Is In A Bad Way', icon: '🚪', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A man who played four hundred games for this club in the seventies has been sleeping in his car. The steward who found him has told one person, who has told the manager, and the two of them are now standing in a corridor deciding what a football club is.',
        choices: [
          { id: 'help', label: 'Get him somewhere to live', desc: 'The club pays, quietly, for as long as it takes', outcome: 'It costs a modest amount for eight months. He works in the ticket office for eleven years and only two people ever know why he started there.', effect: { coins: -110, prestige: 3, clubLegacy: { kind: 'tradition', label: 'the club looks after its own' } } },
          { id: 'charity', label: 'Put him in touch with the players\' charity', desc: 'People who do this properly', outcome: 'They are excellent and it takes six weeks. He is helped and it is not the club that helped him, which he mentions once, mildly, at a reunion.', effect: { prestige: 1, coins: -10 } },
          { id: 'quiet', label: 'Keep it entirely out of the club', desc: 'Help him personally, from his own pocket', outcome: 'Nobody ever knows, including the board, including the supporters who would have raised the money in a fortnight if asked.', effect: { coins: -60, prestige: 1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-defib', title: 'The Box On The Wall', icon: '🫁', category: 'club',
    when: { minSeason: 1, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The defibrillator in the tunnel has an expired battery and has had since March. It was checked by a man who no longer works here. Nobody has needed it. That is the entire basis on which the situation has been acceptable.',
        choices: [
          { id: 'fix-all', label: 'Buy three and put someone in charge of them', desc: 'Tunnel, training ground, the stand, and a name on a checklist', outcome: 'It costs a fortnight of the playing budget. One of them is used at a youth game in February on a spectator and it works.', effect: { coins: -90, prestige: 2 } },
          { id: 'battery', label: 'Replace the battery and move on', desc: 'A morning, forty quid', outcome: 'It is fixed. The next one to expire is at the training ground and it expires in exactly the same way for exactly the same reason.', effect: { coins: -15 } },
          { id: 'ask', label: 'Ask the supporters\' club to fund them', desc: 'They have been asking what to spend money on', outcome: 'They raise it in five weeks and are pleased to have done something that matters. The club is now a place that asks its supporters to buy its safety equipment.', effect: { coins: 40, prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-pitch-inspection-call', title: 'Nine On A Saturday Morning', icon: '📞', category: 'club',
    when: { minSeason: 1, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Frost overnight, a referee coming at half eleven, and eleven hundred people who have already bought tickets. The groundsman thinks it will pass. He also thinks the far corner will be like concrete for another two hours and he is not being asked, he is volunteering it.',
        choices: [
          { id: 'call-off', label: 'Call it off now', desc: 'At nine, before anybody travels', outcome: 'It thaws by twelve and it is a beautiful afternoon. Six hundred people say so, at length, in a variety of places.', effect: { coins: -80, prestige: -2, squadMorale: 2 } },
          { id: 'wait', label: 'Wait for the referee', desc: 'And let him decide', outcome: 'He passes it and one of the away side goes down awkwardly in the far corner in the eleventh minute. Nobody blames the club and the manager thinks about it anyway.', effect: { squadMorale: -3, coins: 40 } },
          { id: 'work', label: 'Get everybody on the pitch with covers and forks', desc: 'Staff, players, anybody in the building', outcome: 'It passes at half eleven with eight people still carrying covers off. The squad has done ninety minutes of manual labour before kick-off and they win.', effect: { squadMorale: 6, coins: 30, prestige: 1, tag: 'mgr-all-hands' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-fifty-years-no-miss', title: 'He Has Not Missed One Since 1971', icon: '🧓', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporter who has not missed a home game in fifty-one years has gone into a care home eight miles away. His daughter has written to say he still asks about Saturdays and that the home cannot manage the transport.',
        choices: [
          { id: 'transport', label: 'Have the club fetch him', desc: 'A minibus, a steward, every home game', outcome: 'It happens for two seasons until he cannot manage the cold. The steward who drives it says it is the best forty minutes of his week.', effect: { coins: -50, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the minibus to the care home' } } },
          { id: 'commentary', label: 'Pipe the commentary into the home', desc: 'A line, a speaker, whatever it takes', outcome: 'It costs almost nothing and reaches nine other residents who have never watched a game in their lives. Two of them become fiercely partisan.', effect: { coins: -25, prestige: 2 } },
          { id: 'visit', label: 'Take the squad over on a Thursday', desc: 'An hour, no cameras', outcome: 'He talks to two of them about players from 1974 and neither has any idea what to say and both of them stay for the whole hour anyway.', effect: { squadMorale: 4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-town-cup', title: 'The Town Cup', icon: '🏅', category: 'club',
    when: { minSeason: 2, minTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club is still entered in a town competition it has won forty times since 1889. The first round is against a works side who have been training twice a week since June for it. The date clashes with a session the manager has planned for four weeks.',
        choices: [
          { id: 'strong', label: 'Send a strong side', desc: 'And win it properly', outcome: 'It finishes eight-nil and the works side\'s goalkeeper is applauded off. Their chairman says afterwards it was the best night the club has had in twenty years and he means it.', effect: { squadMorale: 3, prestige: 1, coins: 20 } },
          { id: 'kids', label: 'Send the under-18s', desc: 'A real game against grown men', outcome: 'They lose three-two to a side of joiners and electricians and learn more in ninety minutes than in the previous two months.', effect: { squadMorale: 2, prestige: 1, playerMorale: { who: 'youngest', delta: 10 } } },
          { id: 'withdraw', label: 'Withdraw from the competition', desc: 'It is 1889 and this is now', outcome: 'The committee accepts it without comment. There is a photograph of forty trophies in the local paper on the Thursday with a caption that does not need to say anything.', effect: { squadMorale: 1, prestige: -2, clubLegacy: { kind: 'tradition', label: 'withdrew from the town cup' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-memorial-garden-full', title: 'No Room Left In It', icon: '🌷', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The memorial garden behind the south-west corner has space for about eleven more plaques and there are thirty-four families on a list. Nobody has ever had to say no to one of these requests before and somebody is going to have to next month.',
        choices: [
          { id: 'expand', label: 'Extend it into the car park', desc: 'Nine spaces gone, forty plaques gained', outcome: 'The car park loses nine spaces and half a dozen people complain about it in writing. The garden is twice the size and full again within six years.', effect: { coins: -80, prestige: 2, clubLegacy: { kind: 'stand', label: 'the extended memorial garden' } } },
          { id: 'wall', label: 'Build a wall of names instead', desc: 'No plaques, one surface, everybody on it', outcome: 'It is elegant and it holds four hundred names and it is not what the families with plaques wanted. Two of them ask for theirs back.', effect: { coins: -110, prestige: 1, boardMood: -1 } },
          { id: 'close', label: 'Close the list where it stands', desc: 'Eleven more and then that is it, permanently', outcome: 'It is announced in the programme in nine lines. The eleven are allocated in four days and the phone in reception is difficult for a fortnight.', effect: { prestige: -2, boardMood: 1, tag: 'mgr-closed-the-garden' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-academy-minibus-driver', title: 'He Has Lost His Licence', icon: '🚌', category: 'club',
    when: { minSeason: 2, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The man who has driven the academy minibus for eleven years has been banned for six months for something that happened on a Sunday night in June. He has told the club himself, first thing on Monday, before anybody could have found out.',
        choices: [
          { id: 'keep', label: 'Keep him on other duties', desc: 'And find a driver for six months', outcome: 'He does kit and pitches and hates every minute of not driving. He is back in the seat in January and does another nine years.', effect: { coins: -50, prestige: 2, squadMorale: 2 } },
          { id: 'let-go', label: 'Let him go', desc: 'He drives children and he cannot drive', outcome: 'It is defensible on every piece of paper in the building. Three parents write to ask why and the answers are all technically complete.', effect: { coins: 30, prestige: -2, tag: 'mgr-let-the-driver-go' } },
          { id: 'parents', label: 'Ask the parents to do a rota', desc: 'Six months of shared driving', outcome: 'It works and it costs nothing and two of the parents fall out spectacularly over a fixture in October. Everyone is glad when January comes.', effect: { coins: 20, squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-away-coach-eleven-booked', title: 'Eleven Booked For A Coach Of Fifty', icon: '🛣️', category: 'club',
    when: { minSeason: 2, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The supporters\' coach to a game two hundred and forty miles away has eleven names on it. It leaves at six in the morning and costs the club more than it takes. The woman who has organised it since 2004 has already paid the deposit.',
        choices: [
          { id: 'run', label: 'Run it anyway', desc: 'Eleven people who want to go should go', outcome: 'It loses money and the eleven have the best day of their season. Two of them are on the coach for the next eighteen years and one of them brings her grandson.', effect: { coins: -60, prestige: 2 } },
          { id: 'minibus', label: 'Downgrade it to a minibus', desc: 'Same day, smaller vehicle, less money lost', outcome: 'It is cramped and it works. She takes it as a judgement on her eighteen years of organising and it takes a season for that to pass.', effect: { coins: -20, prestige: -1 } },
          { id: 'cancel', label: 'Cancel it', desc: 'Eleven people can drive', outcome: 'Four of them cannot drive and do not go. The deposit is lost anyway and the coach does not run again for two years.', effect: { coins: -30, prestige: -2, tag: 'mgr-cancelled-the-coach' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-lead-paint', title: 'The Paint On The Old Stand', icon: '🪣', category: 'club',
    when: { minSeason: 2, maxTier: 5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An inspection has found lead in the paint on the ironwork of the oldest stand, which was last done properly in the sixties. It is not dangerous where it is. It becomes dangerous the moment anybody sands it, which is what was scheduled for June.',
        choices: [
          { id: 'proper', label: 'Have it stripped properly', desc: 'Specialists, sheeting, the full job', outcome: 'It costs three times the original quote and takes the whole summer. The stand looks the best it has in forty years and nobody notices at all.', effect: { coins: -200, boardMood: -2, prestige: 1 } },
          { id: 'overpaint', label: 'Paint over it', desc: 'Seal it and leave it for somebody else', outcome: 'It is legal and it is cheap and it is a decision handed to a manager who has not been appointed yet.', effect: { coins: -40, boardMood: 1, tag: 'mgr-painted-over-it' } },
          { id: 'close', label: 'Close that section of the stand', desc: 'Four hundred seats, indefinitely', outcome: 'The capacity drops and the four hundred are rehoused and the section sits empty and green for years. It becomes a thing people point at.', effect: { coins: -70, prestige: -2, clubLegacy: { kind: 'stand', label: 'the closed section of the old stand' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-drum-argument', title: 'Two Drums', icon: '🥁', category: 'club',
    when: { minSeason: 2, facility: { key: 'fanzone', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two supporter groups both want to bring a drum into the same corner. Neither will move. Both have written to the club. The safety officer\'s view is that one drum is a tradition and two drums is a public order incident waiting for a Tuesday night.',
        choices: [
          { id: 'one', label: 'Pick one', desc: 'And take the consequences of picking', outcome: 'The one not chosen moves to the opposite corner and is louder out of spite for two full seasons. The atmosphere is, unexpectedly, much better.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'both', label: 'Let both in and put them together', desc: 'And let them work it out', outcome: 'They hate each other for six games and then produce something between them that gets on television. Neither will admit the other had anything to do with it.', effect: { prestige: 2 } },
          { id: 'neither', label: 'No drums at all', desc: 'It is the only fair answer', outcome: 'It is the only fair answer. The corner is quiet all season and both groups agree, for the first time in their history, about who is to blame.', effect: { prestige: -2, squadMorale: -2, tag: 'mgr-banned-the-drums' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-car-boot-sunday', title: 'The Car Boot', icon: '🚗', category: 'club',
    when: { minSeason: 2, maxCoins: 350 }, temper: ['chancer','firefighter'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody has proposed a Sunday car boot sale on the main car park. It would bring in a useful sum every week. It would also mean the car park is under three hundred vehicles and a quantity of litter roughly eighteen hours before a Tuesday reserve fixture.',
        choices: [
          { id: 'yes', label: 'Run it every Sunday', desc: 'The money is weekly and it is real', outcome: 'It brings in more than the club shop. The car park is never quite the same again and two supporters describe the place as a market with a football team attached.', effect: { coins: 150, boardMood: 2, prestige: -2, tag: 'mgr-ran-the-car-boot' } },
          { id: 'monthly', label: 'Once a month, and never before a home game', desc: 'A compromise nobody asked for', outcome: 'It makes a quarter of what it could and annoys a quarter as many people. That is broadly what a compromise is.', effect: { coins: 50, boardMood: 1 } },
          { id: 'no', label: 'Turn it down', desc: 'It is a football ground', outcome: 'The money would have covered a wage. Somebody at the AGM in May asks what the club is doing to generate income and there is a pause before anybody answers.', effect: { boardMood: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-under18s-no-fixtures', title: 'Nothing Until January', icon: '🗒️', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The youth league has scheduled nothing for the under-18s between the fifteenth of December and the second week of January. Nineteen boys, four weeks, no games, and half of them living in digs a long way from home.',
        choices: [
          { id: 'arrange', label: 'Arrange friendlies himself', desc: 'Ring round, four games, use his own contacts', outcome: 'He gets three of the four. The fourth falls through on the morning and the boys train instead, and one of them says afterwards that he had somewhere to be every week, which was the point.', effect: { coins: -30, prestige: 2, squadMorale: 3 } },
          { id: 'first-team', label: 'Bring them into first-team training', desc: 'Four weeks with the seniors', outcome: 'Two of them are never the same again, in the good way. One is destroyed by it and takes eight months to recover and is released in June.', effect: { squadMorale: 4, playerMorale: { who: 'youngest', delta: 12 }, prestige: 1 } },
          { id: 'home', label: 'Send the lot home for the four weeks', desc: 'Programmes to follow, families to see', outcome: 'Eleven of them come back heavier and happier and four come back having decided something about the rest of their lives.', effect: { coins: 20, squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-old-kit-on-the-internet', title: 'Somebody Is Selling The Old Kit', icon: '🏷️', category: 'club',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Match-worn shirts from three seasons ago are appearing on an auction site, twenty or so, all with the correct numbers. Only four people have ever had keys to that store room and one of them left in the spring.',
        choices: [
          { id: 'police', label: 'Report it', desc: 'It is theft and it is not small', outcome: 'It goes to court eleven months later and he gets a suspended sentence. He worked here for nineteen years and there is a photograph of him in the corridor.', effect: { coins: 40, prestige: -1, boardMood: 1, tag: 'mgr-prosecuted' } },
          { id: 'confront', label: 'Go and see him', desc: 'On his doorstep, on a Tuesday, alone', outcome: 'He returns fourteen of them and cannot look up for any of the conversation. Nothing goes on any record anywhere and the manager carries it instead.', effect: { prestige: 1, squadMorale: 2 } },
          { id: 'sell-own', label: 'Start selling them properly', desc: 'The club auctions its own, with certificates', outcome: 'It raises a decent sum every season for the academy. The original twenty are never mentioned again by anybody who knows.', effect: { coins: 90, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-training-ground-wifi', title: 'There Is No Signal Anywhere', icon: '📶', category: 'club',
    when: { minSeason: 1, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is one corner of the canteen where a phone works. The analyst uploads clips from a car park in the evenings. Young players stand in that corner in a queue at lunchtime like it is 1998 and nobody has ever put it on a list of things to fix.',
        choices: [
          { id: 'install', label: 'Get it done properly', desc: 'The whole site, cabled, one bill', outcome: 'It changes the working day for eleven members of staff. It also means every player has a phone that works everywhere, which is not entirely a gain.', effect: { coins: -120, squadMorale: 3, prestige: 1, boardMood: -1 } },
          { id: 'staff-only', label: 'Cover the offices and the analysis room only', desc: 'Staff work, players talk', outcome: 'The analyst stops working from a car park. The corner of the canteen keeps its queue and keeps whatever it is that happens in that queue.', effect: { coins: -60, prestige: 1, squadMorale: 2 } },
          { id: 'nothing', label: 'Leave it', desc: 'They managed for thirty years', outcome: 'They go on managing. A signing from a bigger club mentions it in his first fortnight in a way that is not a complaint and is worse than one.', effect: { coins: 30, prestige: -1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-ex-players-gym', title: 'The Old Boys Still Come In', icon: '🚪', category: 'club',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six former players use the gym at eleven every weekday. They have done for years. They are between forty-four and sixty-eight and they are in nobody\'s way except that the strength coach cannot run a session in there before noon.',
        choices: [
          { id: 'window', label: 'Give them a fixed window', desc: 'Half seven to nine, doors locked after', outcome: 'Four of them keep coming and two do not. The two who stop are the two who could not do half past seven and both were the ones who needed it.', effect: { squadMorale: 2, prestige: -1 } },
          { id: 'keep', label: 'Leave it exactly as it is', desc: 'And move the session', outcome: 'The strength coach reorganises his week around six retired footballers and is not happy about it for about a month. Then one of them fixes his shoulder in ten minutes.', effect: { squadMorale: 3, prestige: 2 } },
          { id: 'end', label: 'End it', desc: 'It is a professional facility', outcome: 'They are told by letter, which is not how anybody intended it to happen. Two of them have not been back to the ground since, including for a funeral.', effect: { squadMorale: -3, prestige: -3, tag: 'mgr-shut-the-old-boys-out' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-radio-rights', title: 'The Commentary', icon: '📻', category: 'club',
    when: { minSeason: 2, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The local radio station wants to keep commentating on games and cannot pay the rights fee the club has just introduced. Their commentator has done it for twenty-two years, unpaid, and reads the team news out with an emphasis that supporters can hear a mood in.',
        choices: [
          { id: 'waive', label: 'Waive the fee for them', desc: 'And keep the twenty-two years', outcome: 'It costs a sum that would not have arrived anyway. Nine hundred people who cannot get to games hear every one of them and one of them writes to say so.', effect: { prestige: 2, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the free radio commentary' } } },
          { id: 'club-stream', label: 'Do it on the club\'s own channel instead', desc: 'Charge for it, keep the money', outcome: 'It makes a small amount and the commentary is worse and it is the club\'s. The old commentator is offered a role in it and does four games.', effect: { coins: 70, boardMood: 1, prestige: -2 } },
          { id: 'hire-him', label: 'Put him on the club\'s channel and pay him', desc: 'Twenty-two years is a qualification', outcome: 'He is paid for the first time in his life for doing the thing he does and is thoroughly uncomfortable about it. The commentary is the same and now costs money.', effect: { coins: -40, prestige: 2, squadMorale: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-school-holiday-festival', title: 'The Pitches Are Booked', icon: '🎪', category: 'club',
    when: { minSeason: 2, maxTier: 6, facility: { key: 'community', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The community department has booked the training pitches for a schools festival on the Thursday before a Saturday game. Four hundred children, three pitches, and a first team that will have to train on the one by the road with the slope.',
        choices: [
          { id: 'let-it', label: 'Train on the slope', desc: 'One session, four hundred kids', outcome: 'The session is poor and the day is enormous. Eleven of those children are in the academy within four years and two of them make it.', effect: { squadMorale: -3, prestige: 2 } },
          { id: 'move-them', label: 'Move the festival to the council fields', desc: 'Same day, worse pitches, still happens', outcome: 'It happens and it is fine and it is not at the club. About half the point of it was that it was at the club.', effect: { squadMorale: 2, prestige: -1 } },
          { id: 'both', label: 'Train in the morning, festival in the afternoon', desc: 'A long day for the ground staff', outcome: 'It works and the groundsman is on the pitches until nine at night putting them right. He is asked to do the same thing three more times that year.', effect: { coins: -30, squadMorale: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-boots-for-the-museum', title: 'A Pair Of Boots In A Bag', icon: '🥾', category: 'club',
    when: { minSeason: 3 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A woman has brought in her late husband\'s boots. He scored in a final for this club in 1968 and wore them and never cleaned them. There is no museum. There is a cabinet in the corridor with three trophies and a signed ball in it.',
        choices: [
          { id: 'cabinet', label: 'Put them in the cabinet', desc: 'Move the ball, make room', outcome: 'They are in there for years with a card that has his name on it in the office\'s printer font. Players walk past them four times a day and about one in twenty stops.', effect: { prestige: 1 } },
          { id: 'dressing-room', label: 'Put them in the home dressing room', desc: 'Above the door, where they get looked at', outcome: 'Two players ask about them in the first week and the story gets told properly for the first time in a decade. One of them repeats it to his own son years later.', effect: { squadMorale: 5, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the boots above the dressing room door' } } },
          { id: 'return', label: 'Tell her the club cannot look after them properly', desc: 'Honest, and she should keep them', outcome: 'She takes them home and is relieved and disappointed in about equal measure. The club has been honest about what it is and that is worth something and not much.', effect: { prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p07-supporters-trust-accounts', title: 'They Want To See The Books', icon: '📊', category: 'club',
    when: { minSeason: 3 }, temper: ['firefighter','builder','chancer'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The supporters\' trust has asked for a meeting about the accounts. They own about two per cent of the club and are entitled to very little. They have also, twice in ten years, paid for a stand roof, and everybody in the boardroom knows which of those facts matters.',
        choices: [
          { id: 'open-books', label: 'Show them everything', desc: 'The finance officer, three hours, every line', outcome: 'They find nothing wrong and understand the club better than the board does by the end of it. They defend it publicly, credibly, for the next four years.', effect: { prestige: 2, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the trust sees the books' } } },
          { id: 'summary', label: 'Give them a summary', desc: 'Headline figures, a presentation, questions at the end', outcome: 'It satisfies about half the room. The other half writes a document three weeks later that is largely accurate and entirely damaging.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'refuse', label: 'Politely decline', desc: 'They are a two per cent shareholder', outcome: 'It is within the club\'s rights. The next roof is paid for by the club, at four times what the trust would have raised, three years later.', effect: { boardMood: 1, prestige: -2, tag: 'mgr-closed-the-books' } },
        ],
      },
    },
  },
];
