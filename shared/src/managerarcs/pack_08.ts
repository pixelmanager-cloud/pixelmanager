// Manager-arc authoring pack 08. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack goes after the ground the others walked past: the dull machinery of a football club and the
// weeks where the drama is administrative. A director's friend. The AGM floor. An accountant's mistake in
// his favour. A fixture moved for television. A season in which nothing at all happens. Boardroom arcs gate
// on money and the table, media arcs on there being something to write about, crisis arcs on the club
// actually being in trouble — a snowed-off away trip is not a crisis when you are top and cruising.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_08: ManagerArc[] = [
  // ── BOARDROOM ────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p08-directors-friend', title: 'A Man He Plays Golf With', icon: '⛳', category: 'boardroom',
    when: { minSeason: 2, maxPos: 0.85 }, temper: ['disciplinarian', 'builder', 'chancer'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A director has a friend. The friend is an agent. The agent has a midfielder on his books and a printed list of his statistics, and the director has brought both to the training ground on a Wednesday.',
        choices: [
          { id: 'watch', label: 'Watch the player properly', desc: 'Two games, a scout, an honest report', outcome: 'He is thirty-one and he was decent three years ago. The report says both of those things and goes upstairs on club paper.', effect: { boardMood: -1, prestige: 2, tag: 'mgr-p08-reports-honestly' } },
          { id: 'sign', label: 'Take him on a short deal', desc: 'It costs little and it buys a friend upstairs', outcome: 'He plays nine times and is never worse than adequate. The agent sends a case of wine at Christmas and rings about three more players in March.', effect: { coins: -140, boardMood: 3, squadMorale: -3, tag: 'mgr-p08-agent-owed' } },
          { id: 'block', label: 'Say no in the car park', desc: 'Before the agent gets his coat off', outcome: 'It takes eleven seconds. The director does not mention it again and does not vote his way again either.', effect: { boardMood: -3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-agm-floor', title: 'From The Floor', icon: '🎙️', category: 'boardroom',
    when: { minSeason: 2 }, temper: ['disciplinarian', 'tactician', 'firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The annual general meeting runs to item nine before anybody says anything true. Then a man near the back with a folder asks why the squad costs what it costs and what exactly he is being paid to do about it.',
        choices: [
          { id: 'answer', label: 'Answer the question properly', desc: 'Numbers, out loud, in front of the board', outcome: 'It takes four minutes and it is the only honest thing said all evening. The chairman claps last and shortest.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-p08-spoke-at-the-agm' } },
          { id: 'deflect', label: 'Give him the warm version', desc: 'Say a lot and disclose nothing', outcome: 'The room is satisfied. The man with the folder writes something down and is at the next one, and the one after.', effect: { boardMood: 2, prestige: -1 } },
          { id: 'invite', label: 'Ask him in for a coffee', desc: 'Not here. Tuesday, at the ground', outcome: 'He turns up in a tie. He knows the accounts better than two of the directors do, and by February he is being consulted by the trust.', effect: { prestige: 1, boardMood: -1, coins: 60 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-supporter-director', title: 'One Of Ours Upstairs', icon: '🧣', category: 'boardroom',
    when: { minSeason: 3, requiresTag: 'mgr-open' }, temper: ['builder', 'players-manager', 'chancer'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The supporters have a seat on the board now and the man they sent stood on the terrace for twenty-six years. He has come to see the manager before his first meeting. He does not know what he is allowed to ask.',
        choices: [
          { id: 'teach', label: 'Tell him how it actually works', desc: 'Where the money goes and who decides', outcome: 'Two hours in the boot room. He goes into that meeting better briefed than anybody in it, which the rest of them notice within a month.', effect: { boardMood: -1, prestige: 2, tag: 'mgr-p08-trust-ally' } },
          { id: 'distance', label: 'Keep him at arm’s length', desc: 'He is on the board. That is the whole point', outcome: 'Correct, and cold. He votes with the chairman all year because nobody gave him a reason not to.', effect: { boardMood: 2 } },
          { id: 'use', label: 'Use him', desc: 'A friendly voice in the room, quietly briefed', outcome: 'It works twice. The third time it is obvious to everyone, and the seat is worth less than it was because of what he did with it.', effect: { boardMood: 1, prestige: -2, coins: 120 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-owner-bored', title: 'He Has Stopped Coming', icon: '🪟', category: 'boardroom',
    when: { minSeason: 4, minPos: 0.4 }, temper: ['firefighter', 'chancer', 'builder'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The owner has not been to a home game since October. The box is used by his people. He still signs things, eventually, and the eventually is getting longer.',
        choices: [
          { id: 'chase', label: 'Go and find him', desc: 'Drive down, sit in a reception, wait', outcome: 'He gives him forty minutes and is charming for all of it. Nothing is decided. The drive back is three hours and he does it in silence.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'run-it', label: 'Run the club himself', desc: 'Decide, spend, apologise later', outcome: 'For five months the place moves faster than it has in years. Then somebody adds it all up and the total is put in front of a man who has not read a paper since autumn.', effect: { coins: 240, boardMood: -2, squadMorale: 5, tag: 'mgr-p08-ran-it-alone' } },
          { id: 'wait', label: 'Wait him out', desc: 'Sign nothing, start nothing, hold', outcome: 'The club does not go backwards. It does not go anywhere. In June a supporter asks him what the plan is and he does not have a sentence ready.', effect: { boardMood: 1, squadMorale: -4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-sponsor-values', title: 'The Firm That Closed The Yard', icon: '🏭', category: 'boardroom',
    when: { minSeason: 2, maxCoins: 450 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The sleeve sponsor on offer is the company that shut the yard in the eighties. Six hundred jobs. There are men in the main stand who have not said the name out loud in forty years.',
        choices: [
          { id: 'take', label: 'Take the money', desc: 'It is a different company now, more or less', outcome: 'The sleeves go on in July. At the first home game the noise when the teams come out is a fraction thinner and nobody can prove it.', effect: { coins: 340, boardMood: 2, prestige: -2, tag: 'mgr-p08-took-the-sleeve' } },
          { id: 'refuse', label: 'Kill it', desc: 'Some money is more expensive than others', outcome: 'He goes upstairs and uses the word yard four times. The deal dies and so does the January budget.', effect: { coins: -160, boardMood: -3, prestige: 3, clubLegacy: { kind: 'reputation', label: 'the money the club would not take' } } },
          { id: 'condition', label: 'Take it and make them pay for something', desc: 'A hundred seats a game for the ex-workers club', outcome: 'They agree instantly, which tells him he asked for far too little. The old men come and sit and say almost nothing.', effect: { coins: 210, boardMood: 1, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the hundred seats' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-accountant-error', title: 'Twelve Thousand Too Much', icon: '🧮', category: 'boardroom',
    when: { minSeason: 2 }, temper: ['disciplinarian', 'players-manager', 'chancer'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His pay has been wrong since August. Wrong in his favour. A bonus clause has been read one way when it plainly reads the other, and the finance office has not noticed for seven months.',
        choices: [
          { id: 'declare', label: 'Ring finance on the Monday', desc: 'Point at the clause, give it back', outcome: 'The girl on the phone thanks him twice and sounds frightened. It is fixed by Friday and mentioned in the boardroom for years, always favourably.', effect: { coins: -180, boardMood: 3, prestige: 2, tag: 'mgr-p08-gave-it-back' } },
          { id: 'keep', label: 'Say nothing', desc: 'Their clause, their arithmetic', outcome: 'Nobody ever raises it. He is not caught. It sits somewhere at the back of him every time he tells a player to be honest with him.', effect: { coins: 220, prestige: -1, tag: 'mgr-p08-kept-the-error' } },
          { id: 'redirect', label: 'Take it and spend it on the club', desc: 'Two physio beds and a video room', outcome: 'The equipment arrives without an invoice anybody can explain. The staff love it. The auditors, eighteen months later, are less charmed.', effect: { coins: 60, squadMorale: 6, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-rival-boss-available', title: 'He Is Out Of Work', icon: '🚪', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The man down the road was sacked on Sunday. By Wednesday two directors have said his name in the same meeting, once about a coaching role and once about nothing in particular.',
        choices: [
          { id: 'hire', label: 'Bring him in on the staff', desc: 'Better to have him inside the building', outcome: 'He is very good and everyone can see he is very good. Every defeat from then on has a second man in the dugout the cameras find first.', effect: { prestige: -1, squadMorale: 6, boardMood: 1, tag: 'mgr-p08-rival-on-staff' } },
          { id: 'block', label: 'Tell the board no', desc: 'Plainly, before it becomes an idea', outcome: 'They drop it. They also now know exactly which name makes him uncomfortable, and one of them files it.', effect: { boardMood: -2, prestige: 1 } },
          { id: 'call', label: 'Ring him himself', desc: 'A drink, out of the way, no offer', outcome: 'Three hours in a pub car park talking about full-backs. They part as something close to friends, and the papers get a photograph of the cars.', effect: { prestige: 2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-old-boy-wants-coaching', title: 'He Wants To Come Back In', icon: '🎽', category: 'boardroom',
    when: { minSeason: 3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four hundred and six appearances for the club and a knee that finished him at thirty-one. He has his badges now. He asks for ten minutes and takes eight of them to get to the point.',
        choices: [
          { id: 'hire', label: 'Put him with the under-18s', desc: 'Small money, real job, no favours after that', outcome: 'The boys would die for him inside a fortnight. He is also, it turns out, not much of a coach, and everybody works out which matters more.', effect: { coins: -80, squadMorale: 4, prestige: 1, boardMood: 1, tag: 'mgr-p08-old-boy-coaching' } },
          { id: 'honest', label: 'Tell him the truth', desc: 'There is no job and he is not ready', outcome: 'He takes it well in the room and badly in the car. Two seasons later he says something about the manager on the radio that is not quite fair and not quite wrong.', effect: { prestige: 1, boardMood: 1, tag: 'mgr-p08-turned-a-legend-down' } },
          { id: 'ambassador', label: 'Find him something that is not coaching', desc: 'Match days, sponsors, the school visits', outcome: 'He is superb at it and hates every minute. He does it for six years and never once complains where anybody can hear.', effect: { coins: -40, boardMood: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-tv-move', title: 'Moved To The Friday', icon: '📺', category: 'boardroom',
    when: { minSeason: 2, maxTier: 5 }, temper: ['players-manager', 'builder', 'firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Television has taken the away game to a Friday night. Four hundred miles each way, on a school night, and the facility fee is real money.',
        choices: [
          { id: 'accept', label: 'Take the fee and say nothing', desc: 'The club needs it more than the supporters need the Saturday', outcome: 'Six hundred travel instead of two thousand. The money lands in February and pays for a hamstring specialist nobody connects to it.', effect: { coins: 260, boardMood: 2, prestige: -1 } },
          { id: 'complain', label: 'Say what it does to the supporters', desc: 'On the record, in the week', outcome: 'He is quoted everywhere and it changes nothing, which he knew. A coach firm gives fifty free seats and prints his line on the side of the bus.', effect: { coins: 100, prestige: 2, boardMood: -2, tag: 'mgr-p08-spoke-for-the-away-end' } },
          { id: 'fund', label: 'Ask the board to fund the travel', desc: 'Take the fee, give half of it back to the away end', outcome: 'They agree to a third of it after a long argument. The away end is full and the commercial director does not speak to him until March.', effect: { coins: 90, boardMood: -1, squadMorale: 4, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-winter-break', title: 'Two Weeks In February', icon: '🌤️', category: 'boardroom',
    when: { minSeason: 2 }, temper: ['tactician', 'players-manager', 'disciplinarian'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The division has put a fortnight in the middle of February and nobody knows what to do with it. Commercial want a warm-weather trip with sponsors on the plane. The medical staff want everybody at home doing nothing.',
        choices: [
          { id: 'camp', label: 'Take them away', desc: 'Sun, double sessions, one night out', outcome: 'They come back brown and sharp and two of them come back injured. On balance it was worth it and nobody will ever be able to prove that.', effect: { coins: -180, squadMorale: 8, boardMood: 1 } },
          { id: 'home', label: 'Send everybody home', desc: 'Ten days off, no phones, no programme', outcome: 'The first session back is a shambles and the second is the best of the season. Three of them thank him in March for something they cannot name.', effect: { squadMorale: 10, boardMood: -1, tag: 'mgr-p08-gave-them-the-break' } },
          { id: 'work', label: 'Work through it', desc: 'Nobody in this league gets a holiday', outcome: 'Eleven days of tactical work on a cold pitch. The shape is better in March. The legs are not there in April.', effect: { squadMorale: -7, prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-club-secretary-retires', title: 'Thirty-One Years In That Office', icon: '🗄️', category: 'boardroom',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club secretary is going at the end of the season. She has registered every player since before he was managing anywhere. Nothing about how this club works is written down anywhere except in her head.',
        choices: [
          { id: 'shadow', label: 'Put somebody beside her for six months', desc: 'Learn it all before it walks out the door', outcome: 'They get maybe two thirds of it. In November the new one misses a deadline that she would have felt coming a fortnight off.', effect: { coins: -60, boardMood: 1, tag: 'mgr-p08-shadowed-the-secretary' } },
          { id: 'modernise', label: 'Replace the job with a system', desc: 'Software, a younger salary, proper records', outcome: 'It is faster and it is correct and it does not know that the referee’s assessor takes two sugars. Small things stop happening.', effect: { coins: 140, boardMood: 2, prestige: -1 } },
          { id: 'keep', label: 'Ask her to stay two more years', desc: 'On her terms, three days a week', outcome: 'She says yes before he finishes the sentence, which tells him something he should have worked out years ago.', effect: { coins: -100, boardMood: -1, prestige: 2, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-concert-on-the-pitch', title: 'A Stage On The Six-Yard Box', icon: '🎸', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 600 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody wants to put two nights of music on the pitch in the last week of May. The fee is enormous. The groundsman has gone very quiet and left the room.',
        choices: [
          { id: 'yes', label: 'Sign it off', desc: 'Relay the pitch in June and bank the difference', outcome: 'The relay takes and it is fine. The old surface was better and only four people in the building ever knew that.', effect: { coins: 480, boardMood: 3, prestige: -1, tag: 'mgr-p08-sold-the-pitch' } },
          { id: 'no', label: 'Refuse to give up the surface', desc: 'It is a football pitch fifty weeks a year', outcome: 'He wins it and it is the last argument he wins with commercial for a long time. The pitch in August is the best in the division.', effect: { coins: -120, boardMood: -3, squadMorale: 6, prestige: 1 } },
          { id: 'one', label: 'One night only', desc: 'Half the money, half the damage', outcome: 'The compromise costs the promoter his margin and he does not come back. The goalmouths are patchy until October anyway.', effect: { coins: 240, boardMood: 1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-vice-chairman-notes', title: 'The Man Who Writes It Down', icon: '📓', category: 'boardroom',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The vice-chairman keeps a notebook. Dates, quotes, who said what about the left-back in September. He is pleasant about it. He has been doing it since long before this manager arrived.',
        choices: [
          { id: 'careful', label: 'Be careful around him', desc: 'Say less, write more, keep his own record', outcome: 'It works. It also means that for two years he never says anything unguarded in his own place of work.', effect: { prestige: 1, boardMood: 1, squadMorale: -3 } },
          { id: 'ask', label: 'Ask to see the book', desc: 'Straight out, in the corridor', outcome: 'He hands it over without hesitating, which is worse. Half of it is admiring. All of it is dated.', effect: { boardMood: -1, prestige: 1, tag: 'mgr-p08-read-the-notebook' } },
          { id: 'ignore', label: 'Let him write', desc: 'A man with a pen is not a threat', outcome: 'Eighteen months later a passage from it is read out in a meeting he is not in, and it is a fair record of a bad week.', effect: { boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-club-doctor-agency', title: 'The Doctor On A Contract', icon: '🩺', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 400, facility: { key: 'medical', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Finance want to move the club doctor onto an agency arrangement. It saves a sum that would not sign a substitute. The doctor has been at the ground on Saturdays since the manager was a player.',
        choices: [
          { id: 'fight', label: 'Fight it', desc: 'He knows their bodies and their families', outcome: 'He gets his way and burns a favour to do it. The doctor never learns how close it came, which is the whole point of the exercise.', effect: { coins: -70, boardMood: -2, squadMorale: 7, prestige: 1 } },
          { id: 'accept', label: 'Let it go through', desc: 'The saving is a saving', outcome: 'The agency send somebody competent and different each month. A hamstring that would have been caught in September is caught in November.', effect: { coins: 130, boardMood: 2, squadMorale: -6, tag: 'mgr-p08-lost-the-doctor' } },
          { id: 'split', label: 'Keep him for matchdays only', desc: 'Agency in the week, the old man on Saturdays', outcome: 'It is the answer that offends nobody and solves nothing. He is at the ground at two o’clock every Saturday for another nine years.', effect: { coins: 60, boardMood: 1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-minority-family', title: 'Twelve Per Cent', icon: '📜', category: 'boardroom',
    when: { minSeason: 4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A family in the town has held twelve per cent since 1946 and has never once used it. This week they have written to ask why the reserve fixtures were cancelled. It is the smallest question in football and it has made the board nervous.',
        choices: [
          { id: 'visit', label: 'Go and see them', desc: 'A front room, a pot of tea, an hour', outcome: 'They show him a photograph of a stand that no longer exists. He answers the question and stays two hours and nobody upstairs asked him to go.', effect: { prestige: 2, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the family that still holds twelve per cent' } } },
          { id: 'refer', label: 'Send it upstairs', desc: 'Shareholders are not his business', outcome: 'They get a letter from a solicitor and never write again. The reserve fixtures stay cancelled.', effect: { boardMood: 2, prestige: -1 } },
          { id: 'restore', label: 'Put the reserve fixtures back on', desc: 'Answer the letter with the thing itself', outcome: 'Eleven games nobody watches and four young players who are ready a year early because of them.', effect: { coins: -110, playerMorale: { who: 'youngest', delta: 12 }, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-community-trust-time', title: 'Tuesday Mornings', icon: '🫱', category: 'boardroom',
    when: { minSeason: 2, facility: { key: 'community', min: 3 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The community side of the club has run out of coaches. They want two players and the manager himself, one morning a week, in school halls and a leisure centre with a broken heater.',
        choices: [
          { id: 'go', label: 'Go himself', desc: 'Every Tuesday, all season, no cameras', outcome: 'It is the only thing all year that never once feels like work. It also costs him the morning he used to spend with the analysts.', effect: { prestige: 2, boardMood: 1, squadMorale: -2, tag: 'mgr-p08-tuesday-mornings' } },
          { id: 'players', label: 'Send two players', desc: 'The two who need reminding what this is for', outcome: 'One is brilliant and asks to keep going. The other posts a photograph of himself doing it and never returns.', effect: { playerMorale: { who: 'youngest', delta: 9 }, squadMorale: 3 } },
          { id: 'decline', label: 'Say the football has to come first', desc: 'It is a bad season to be somewhere else on a Tuesday', outcome: 'Perfectly defensible. The trust find somebody from a rugby club and it is mentioned, mildly, in the local paper in April.', effect: { squadMorale: 2, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-away-allocation', title: 'Nine Hundred Seats', icon: '🎫', category: 'boardroom',
    when: { minSeason: 2, maxCoins: 500 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Commercial want to cut the visiting allocation for the big home game and sell the corner as hospitality. It is nine hundred seats and about four hundred decibels.',
        choices: [
          { id: 'cut', label: 'Let them cut it', desc: 'The tables sell out in a day', outcome: 'The corner is full of people eating. The game is flat from the tenth minute and one of his own players mentions it afterwards without being asked.', effect: { coins: 220, boardMood: 2, squadMorale: -5 } },
          { id: 'keep', label: 'Keep the allocation', desc: 'An atmosphere needs two sides of it', outcome: 'Nine hundred of them sing for ninety minutes and the ground answers. The invoice for the unsold tables is somebody else’s problem and becomes his in June.', effect: { coins: -90, squadMorale: 6, prestige: 1 } },
          { id: 'trade', label: 'Trade it', desc: 'Cut it, and ask for the money on a striker', outcome: 'He gets a written promise of half of it. The half arrives. The other half was never going to.', effect: { coins: 150, boardMood: 1, prestige: -1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-succession-question', title: 'Who Comes After Him', icon: '🪜', category: 'boardroom',
    when: { minSeason: 5, maxPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chairman asks him, over lunch and apparently idly, who should get the job when he eventually goes. Nobody has said anything about him going.',
        choices: [
          { id: 'name', label: 'Name his assistant', desc: 'Because it is true and it is the right answer', outcome: 'The chairman writes it down. His assistant is treated differently upstairs from that afternoon and neither of them ever says so.', effect: { boardMood: 2, prestige: 1, tag: 'mgr-p08-named-a-successor' } },
          { id: 'deflect', label: 'Refuse the question', desc: 'Ask what has brought it on', outcome: 'It has brought nothing on. It was a question at lunch. He spends the next six weeks certain it was not.', effect: { boardMood: -1, prestige: 1 } },
          { id: 'outside', label: 'Name somebody from outside', desc: 'A better manager than any of them, and honest about it', outcome: 'It is the most generous thing he does all year. Two seasons later the man is in his chair and does not know who put him there.', effect: { boardMood: 1, prestige: 2, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-kit-supplier', title: 'The Cheaper Shirt', icon: '👕', category: 'boardroom',
    when: { minSeason: 2, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new kit supplier is offering better terms and a template shirt used by nine other clubs. The old one has made this club’s shirts, with the collar, since 1979.',
        choices: [
          { id: 'switch', label: 'Take the better deal', desc: 'A shirt is a shirt', outcome: 'The margin is real and the collar is gone. Somebody in the club shop keeps one of the old ones on a hanger in the back for years.', effect: { coins: 280, boardMood: 2, prestige: -1 } },
          { id: 'stay', label: 'Stay with the old firm', desc: 'Ask them to sharpen the number instead', outcome: 'They come up a little, out of something like affection. The finance director puts the difference in a report and underlines it.', effect: { coins: 90, boardMood: -2, clubLegacy: { kind: 'tradition', label: 'the collar they kept' } } },
          { id: 'design', label: 'Take the deal but fight for the collar', desc: 'Bespoke costs extra and he asks for it anyway', outcome: 'They agree for one season only. He does not last long enough to see what happens in the second.', effect: { coins: 190, boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-hospitality-lunches', title: 'Table Fourteen', icon: '🍽️', category: 'boardroom',
    when: { minSeason: 2 }, temper: ['chancer', 'disciplinarian', 'tactician'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They would like him in the lounge at half past twelve on home matchdays. Twenty minutes, a microphone, questions from sponsors who have had a drink. His team talk is at ten past one.',
        choices: [
          { id: 'do', label: 'Do the lunches', desc: 'Every home game, all season', outcome: 'He is very good at it. The ten minutes he used to spend alone before a game are gone and he does not notice what they were doing for him until March.', effect: { coins: 200, boardMood: 3, prestige: -1, tag: 'mgr-p08-does-the-lunches' } },
          { id: 'refuse', label: 'Refuse point blank', desc: 'That hour belongs to the team', outcome: 'Commercial send the assistant instead and he is a hit. Two sponsors renew because of him and one director notices exactly that.', effect: { boardMood: -2, squadMorale: 4, prestige: 1 } },
          { id: 'thursday', label: 'Offer them Thursday instead', desc: 'A proper evening, no matchday', outcome: 'Attendance is half what the lounge gets and the ones who come get something better. Commercial call it a downgrade in writing.', effect: { coins: 90, boardMood: -1, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-partner-club', title: 'A Club Abroad Who Want To Be Friends', icon: '🌐', category: 'boardroom',
    when: { minSeason: 4, maxTier: 6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club fourteen hundred miles away wants a formal partnership. Players both ways, shared scouting, a summer friendly. Their sporting director has done all the talking and their owner has done none of it.',
        choices: [
          { id: 'sign', label: 'Sign the agreement', desc: 'Access to a market they cannot afford otherwise', outcome: 'Two players arrive in eighteen months. One is excellent. The paperwork on the other takes so long he is sold before he plays.', effect: { coins: 160, boardMood: 2, tag: 'mgr-p08-partner-club' } },
          { id: 'trial', label: 'Do one summer and see', desc: 'A friendly and a shared scout, nothing signed', outcome: 'It is pleasant and it is useless. Everybody agrees to talk again in a year and nobody does.', effect: { coins: 60, prestige: -1 } },
          { id: 'refuse', label: 'Have nothing to do with it', desc: 'Feeder arrangements only feed one way', outcome: 'He says so out loud in the meeting. It is remembered kindly by the academy staff and coldly by everybody above them.', effect: { boardMood: -2, prestige: 1, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-players-lounge', title: 'Carpet Or Kilograms', icon: '🛋️', category: 'boardroom',
    when: { minSeason: 2, minCoins: 120 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is money for exactly one of two things. A refit of the players’ lounge, which is brown and smells of 1988, or four pieces of gym equipment the fitness staff have been asking for since he arrived.',
        choices: [
          { id: 'gym', label: 'Buy the equipment', desc: 'The unglamorous, correct answer', outcome: 'Two soft-tissue injuries fewer over the season, probably. The lounge stays brown and the senior players make a running joke of it.', effect: { coins: -140, squadMorale: -3, prestige: 1, tag: 'mgr-p08-bought-the-gym' } },
          { id: 'lounge', label: 'Do the lounge', desc: 'They spend more hours in there than anywhere', outcome: 'The room is transformed and so, for about six weeks, is the mood in it. The fitness coach says nothing at all, at length.', effect: { coins: -140, squadMorale: 9, prestige: -1 } },
          { id: 'neither', label: 'Bank it', desc: 'Keep it for January', outcome: 'It is spent in January on half a loan fee. Nobody remembers by March that it was ever going to be anything else.', effect: { coins: 40, squadMorale: -4, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-board-minutes', title: 'Item Six', icon: '📄', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A copy of last month’s minutes has been left in the wrong pigeonhole. Item six is about him. It is two sentences long and neither of them is hostile, which is somehow worse.',
        choices: [
          { id: 'return', label: 'Hand it back unread', desc: 'Or say he did', outcome: 'He gives it to the secretary and says nothing. He has read it twice and will read it again from memory for a month.', effect: { prestige: 1, boardMood: 1, tag: 'mgr-p08-read-the-minutes' } },
          { id: 'confront', label: 'Take it into the chairman’s office', desc: 'Now, with it in his hand', outcome: 'The chairman is embarrassed and then annoyed at being embarrassed. Item six is not minuted again. It is still discussed.', effect: { boardMood: -3, prestige: 1 } },
          { id: 'work', label: 'Use it', desc: 'Two sentences, and a run of results to answer them', outcome: 'Four wins in five. Nobody upstairs connects the two and he never gives them the chance.', effect: { squadMorale: 5, boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-insurance-premium', title: 'The Premium Has Gone Up', icon: '🧾', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 350 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The squad insurance has been repriced after last season’s injuries. The new figure is a striker. There is a cheaper policy with a clause about pre-existing conditions that would cover roughly nobody.',
        choices: [
          { id: 'pay', label: 'Pay the new premium', desc: 'It is what it is', outcome: 'The money goes and the January plan shrinks to a loan. Nothing bad happens all season, so the money looks wasted, which is what insurance looks like when it works.', effect: { coins: -260, boardMood: -1, squadMorale: 3 } },
          { id: 'cheap', label: 'Take the cheaper cover', desc: 'Save it and hope', outcome: 'Three months of nothing. Then the centre-half’s knee, and a phone call about clause eleven that he has to make himself.', effect: { coins: 180, boardMood: 1, squadMorale: -6, tag: 'mgr-p08-cheap-cover' } },
          { id: 'self', label: 'Cover the squad themselves', desc: 'No policy, a ring-fenced fund, the board’s nerve', outcome: 'The finance director calls it gambling and is right. It saves a fortune over two years and neither of them mentions the two years after that.', effect: { coins: 240, boardMood: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-car-park-lease', title: 'The Land Behind The Kop', icon: '🅿️', category: 'boardroom',
    when: { minSeason: 4, maxCoins: 300 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The car park is not the club’s. It is leased, and the lease is up, and the man who owns it has had an offer from a supermarket. He would rather sell to the club. He would rather do it this month.',
        choices: [
          { id: 'buy', label: 'Push the board to buy it', desc: 'Everything the club will ever build goes there', outcome: 'They find the money in three places and one of them is the transfer budget. Twenty years on it is the best decision anybody made that decade.', effect: { coins: -420, boardMood: -2, prestige: 2, clubLegacy: { kind: 'stand', label: 'the land they bought behind the Kop' } } },
          { id: 'lease', label: 'Renew the lease', desc: 'Cheap now, expensive forever', outcome: 'Signed in a fortnight for a sum nobody argues about. It comes up again in seven years at four times the price.', effect: { coins: -80, boardMood: 1 } },
          { id: 'let-go', label: 'Let it go', desc: 'Supporters can park on the streets like they used to', outcome: 'The supermarket goes up by October. The queue out of the ground on a Saturday is now twenty minutes and always will be.', effect: { coins: 120, boardMood: 1, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-scouting-software', title: 'The Licence Renewal', icon: '💾', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The database licence is up. It costs about what two scouts cost. Half the recruitment staff swear by it and the chief scout has not opened it since the day it was installed.',
        choices: [
          { id: 'renew', label: 'Renew it', desc: 'The world is going that way whether he likes it or not', outcome: 'The analysts find two players in it that season. Both are signed by richer clubs before the phone call is finished.', effect: { coins: -170, boardMood: 1, tag: 'mgr-p08-kept-the-data' } },
          { id: 'scouts', label: 'Spend it on two scouts', desc: 'Men in stands on Tuesday nights', outcome: 'One of them is useless. The other watches a left-back in the eighth tier for four months and is right about him.', effect: { coins: -170, prestige: 1, squadMorale: 2 } },
          { id: 'neither', label: 'Cancel it and keep the money', desc: 'Recruit off the eye and the phone', outcome: 'It works for a season because he is good at it. The season after, two signings arrive with problems a database would have shown in ten seconds.', effect: { coins: 150, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-loan-rebate', title: 'A Payment Nobody Expected', icon: '💷', category: 'boardroom',
    when: { minSeason: 3, maxCoins: 500 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club they loaned a player to four years ago has been promoted, and a clause everybody had forgotten has paid out. The money is in the account and nobody upstairs has decided what it is for.',
        choices: [
          { id: 'squad', label: 'Claim it for the squad', desc: 'Get to the chairman before finance does', outcome: 'He gets three quarters of it and spends it in a week. The finance director had a plan for that money and now has a grudge instead.', effect: { coins: 380, boardMood: -2 } },
          { id: 'debt', label: 'Put it against the overdraft', desc: 'Boring, and it buys him a year', outcome: 'The bank is pleased and the board are relieved and the squad is exactly as thin as it was in August.', effect: { coins: 60, boardMood: 3, squadMorale: -3, prestige: 1 } },
          { id: 'academy', label: 'Ring-fence it for the academy', desc: 'It came from a kid. It goes back to the kids', outcome: 'Two new coaches and a minibus. Nine years later somebody works out what came out of that minibus and it is more than the money.', effect: { coins: -40, prestige: 2, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the clause that paid for the academy' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-catering-complaint', title: 'The Pies', icon: '🥧', category: 'boardroom',
    when: { minSeason: 2 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The catering contract has changed hands and the pies are worse. It is the single most discussed subject at the club for a fortnight and he is asked about it four times, twice by directors.',
        choices: [
          { id: 'joke', label: 'Make a joke of it', desc: 'One line, on camera, and move on', outcome: 'The line goes everywhere. The caterers complain formally, the supporters put it on a flag, and the chairman is asked to explain a flag.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-p08-the-pie-line' } },
          { id: 'raise', label: 'Raise it properly upstairs', desc: 'Under any other business, in earnest', outcome: 'A grown man arguing about pastry in a boardroom. It is fixed by March and he never lives it down and does not want to.', effect: { boardMood: -1, prestige: 1 } },
          { id: 'ignore', label: 'Refuse to discuss pies', desc: 'He has a football team to pick', outcome: 'Entirely reasonable. It becomes, for a small and vocal group, evidence that he does not understand the place.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-board-strategy-day', title: 'A Hotel Off The Motorway', icon: '📈', category: 'boardroom',
    when: { minSeason: 3 }, temper: ['tactician', 'builder', 'firefighter'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have booked a day at a hotel with a facilitator and a flipchart. He is required for the morning session, which is titled Where Are We Going.',
        choices: [
          { id: 'engage', label: 'Take it seriously', desc: 'Prepare, present, argue for five years of something', outcome: 'It is the best presentation he has ever given and the flipchart pages are photographed and never seen again.', effect: { boardMood: 2, prestige: 1, tag: 'mgr-p08-did-the-flipchart' } },
          { id: 'blunt', label: 'Tell them what is actually wrong', desc: 'Not the vision. The scouting budget and the pitches', outcome: 'The facilitator loses control of the room for forty minutes. Two things on that list are fixed within the year and nobody says why.', effect: { boardMood: -2, coins: 200, prestige: 2 } },
          { id: 'skip', label: 'Send apologies and take training', desc: 'There is a game on Saturday', outcome: 'They do it without him. The strategy that comes out of it has a paragraph about the first team he would have argued with.', effect: { boardMood: -2, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-chairman-favour', title: 'A Small Personal Favour', icon: '🤲', category: 'boardroom',
    when: { minSeason: 2 }, temper: ['players-manager', 'disciplinarian', 'chancer'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The chairman’s brother-in-law is doing a charity walk. He would like the squad at the start line at nine on a Sunday, the day after an away game, for a photograph.',
        choices: [
          { id: 'squad', label: 'Send the lot of them', desc: 'An hour, a photograph, a favour banked', outcome: 'They stand in a car park in the rain and are gracious about it. The chairman does not forget and mentions it in June when it matters.', effect: { squadMorale: -5, boardMood: 3, tag: 'mgr-p08-favour-banked' } },
          { id: 'himself', label: 'Go on his own', desc: 'Let the players sleep', outcome: 'He walks the first four miles and talks to strangers about the left-back. It raises more money than the photograph would have.', effect: { prestige: 1, boardMood: 1, squadMorale: 3 } },
          { id: 'no', label: 'Say no', desc: 'Sunday after an away game is not the club’s to give', outcome: 'It is the right call and it is remembered as the day he would not do a favour for a charity, which is not what happened.', effect: { boardMood: -2, squadMorale: 5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-directors-restaurant', title: 'Where He Sits', icon: '🪑', category: 'boardroom',
    when: { minSeason: 3, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'After a bad home game he is expected in the boardroom for a drink with the visiting directors. He has been in there twice this season and both times somebody asked him a question with an edge on it.',
        choices: [
          { id: 'go', label: 'Go in and do it properly', desc: 'Forty minutes, a handshake for everyone', outcome: 'A director of the other club says something kind about his side that he needed to hear from a stranger. He is home very late.', effect: { boardMood: 2, prestige: 1 } },
          { id: 'brief', label: 'Look in for five minutes', desc: 'Face shown, no glass picked up', outcome: 'Nobody says anything. Everybody notices. It is a smaller thing than it is treated as and it is treated as quite a large thing.', effect: { boardMood: -1 } },
          { id: 'skip', label: 'Go straight to the video', desc: 'Two hours on the second goal', outcome: 'He finds the problem and fixes it by Tuesday. In the boardroom his empty chair does the talking for him.', effect: { boardMood: -2, squadMorale: 4, prestige: 1, tag: 'mgr-p08-skipped-the-boardroom' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-two-jobs-offer', title: 'They Want Him Upstairs Instead', icon: '🗃️', category: 'boardroom',
    when: { minSeason: 6, minPos: 0.5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The board have an idea. He moves upstairs to run football operations, somebody younger takes the team, and everybody keeps their dignity. It is presented as a promotion and it is on paper.',
        choices: [
          { id: 'take', label: 'Take the desk', desc: 'More power, no Saturdays', outcome: 'The first Saturday at three o’clock in an office is the longest hour of his life. He is good at the job and he is not the same man in it.', effect: { boardMood: 3, prestige: 1, squadMorale: -6, tag: 'mgr-p08-went-upstairs' } },
          { id: 'refuse', label: 'Say he is a coach', desc: 'And that they can sack him if they want to', outcome: 'The word sack is now in the room and cannot be taken out of it. He is still in the dugout in August.', effect: { boardMood: -3, prestige: 2, squadMorale: 5 } },
          { id: 'delay', label: 'Ask for the end of the season', desc: 'Decide it in May, not in February', outcome: 'They agree because it is easy to agree to. Every team sheet between now and May is read by somebody as evidence.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },

  // ── MEDIA ────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p08-fair-man-hard-question', title: 'The One Question', icon: '✒️', category: 'media',
    when: { minSeason: 3, minPos: 0.5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The local paper’s football writer has been fair to him for four years. Never turned a phrase to hurt him, never ran the thing he could have run in his first February. On Friday, in a full room, he asks whether the manager still believes he is the right man.',
        choices: [
          { id: 'answer', label: 'Answer it honestly', desc: 'Because of who is asking', outcome: 'He says he does not know, and means it, and the room goes very quiet. It is printed straight and it is the best piece anybody writes about him.', effect: { prestige: 2, boardMood: -2, squadMorale: -4, tag: 'mgr-p08-said-he-did-not-know' } },
          { id: 'bat', label: 'Bat it away', desc: 'The professional answer, delivered warmly', outcome: 'Fifteen seconds of nothing. The writer nods and moves on and something between them is a degree cooler for the rest of his time here.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'turn', label: 'Take it personally', desc: 'After four years, from him?', outcome: 'He is sharp about it in front of eleven people. It makes the back page and the writer, to his credit, does not defend himself in print.', effect: { prestige: -2, boardMood: -1, tag: 'mgr-p08-fell-out-with-the-local' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-pundit-played-here', title: 'He Wore The Shirt', icon: '📻', category: 'media',
    when: { minSeason: 2 }, temper: ['tactician', 'firefighter', 'players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The co-commentator on local radio made two hundred appearances here and has spent six weeks saying the side has no shape. He is not wrong. He says it in a voice a lot of the town grew up with.',
        choices: [
          { id: 'call', label: 'Ring him', desc: 'Not to complain. To ask what he sees', outcome: 'Fifty minutes on the phone about the distance between the lines. He is still critical on air and now it is useful.', effect: { prestige: 1, squadMorale: 3, tag: 'mgr-p08-rang-the-pundit' } },
          { id: 'public', label: 'Answer him publicly', desc: 'Two hundred games does not make him right', outcome: 'The town splits along a line that was already there. The station loves it and books him for an extra hour a week.', effect: { prestige: -1, boardMood: -1, squadMorale: 2 } },
          { id: 'nothing', label: 'Let him talk', desc: 'He is paid to have opinions', outcome: 'It goes on all winter and gets no louder. By spring nobody remembers who said what, which was the plan.', effect: { boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-story-that-is-true', title: 'It Happened', icon: '🗞️', category: 'media',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A paper has a story about one of his players. It is small, it is embarrassing, and every word of it is true. The player has already told him so, in his office, looking at the carpet.',
        choices: [
          { id: 'shield', label: 'Defend him publicly anyway', desc: 'Say nothing untrue, say a great deal', outcome: 'He talks for two minutes about the lad’s character and never touches the facts. The player hears it in the car and rings his mother.', effect: { playerMorale: { who: 'unhappiest', delta: 16 }, squadMorale: 6, prestige: -1, tag: 'mgr-p08-covered-for-him' } },
          { id: 'silent', label: 'Say it is a private matter', desc: 'Six words, then football', outcome: 'The story dies in nine days. The player is not sure whether he was protected or dropped and asks a team-mate rather than asking him.', effect: { playerMorale: { who: 'unhappiest', delta: 4 }, boardMood: 1 } },
          { id: 'internal', label: 'Deal with it in the building', desc: 'Fine him, say so, move on', outcome: 'It is the correct process and it reads in print as a manager confirming the story. The lad is never quite the same in that dressing room.', effect: { coins: 60, playerMorale: { who: 'unhappiest', delta: -12 }, boardMood: 2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-story-that-is-false', title: 'None Of It Happened', icon: '📰', category: 'media',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A story about one of his players is on page nine and it is not true. Not exaggerated. Invented, from a source who was not there, about a night the lad spent at his sister’s.',
        choices: [
          { id: 'lawyers', label: 'Go legal', desc: 'The club’s solicitor, a letter, a correction demanded', outcome: 'The correction appears in April, forty words, page thirty-one. The original is what people remember and the legal bill is real.', effect: { coins: -180, playerMorale: { who: 'star', delta: 8 }, prestige: 1 } },
          { id: 'burn', label: 'Take it apart at the press conference', desc: 'Name the paper, walk through the timeline', outcome: 'Six minutes of it, and it is devastating, and it puts the story in three papers that had ignored it.', effect: { prestige: 2, squadMorale: 5, tag: 'mgr-p08-burned-a-paper' } },
          { id: 'ignore', label: 'Do not repeat it', desc: 'Say nothing and let it starve', outcome: 'It is gone by Wednesday, as he knew it would be. The player wanted him to shout and did not know how to ask.', effect: { playerMorale: { who: 'star', delta: -8 }, boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-manager-of-the-month', title: 'The Bottle On The Table', icon: '🏆', category: 'media',
    when: { minSeason: 2, maxPos: 0.35 }, temper: ['chancer', 'builder', 'disciplinarian'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Manager of the month. A photograph with a bottle, a small trophy, and every single person he meets that week telling him about the curse.',
        choices: [
          { id: 'accept', label: 'Do the photograph properly', desc: 'Smile, thank the staff, hold the bottle up', outcome: 'It goes on the wall outside the canteen. They lose the next three and eleven different people mention the bottle.', effect: { prestige: 2, boardMood: 1, squadMorale: -3 } },
          { id: 'staff', label: 'Send the kitman to collect it', desc: 'He has been here longer than anybody', outcome: 'The photograph is the best thing the club puts out all year. The sponsor is confused and the dressing room is not.', effect: { squadMorale: 8, prestige: 1, boardMood: -1, tag: 'mgr-p08-gave-away-the-award' } },
          { id: 'refuse', label: 'Refuse it', desc: 'Nothing has been won yet', outcome: 'It reads as either humility or superstition depending who is writing. His players find it very funny and slightly cold.', effect: { prestige: -1, squadMorale: -2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-fanzine', title: 'The Fanzine Want An Hour', icon: '📗', category: 'media',
    when: { minSeason: 2 }, temper: ['chancer', 'builder', 'players-manager'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A fanzine that sells four hundred copies outside the chip shop has asked for an interview. They have been rude about him twice and right once. The club’s press officer says no on his behalf before he is asked.',
        choices: [
          { id: 'do-it', label: 'Overrule the press officer and do it', desc: 'An hour, no conditions', outcome: 'They ask better questions than the nationals do. Two answers are quoted for years and one of them he would like back.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-p08-did-the-fanzine' } },
          { id: 'conditions', label: 'Do it with copy approval', desc: 'An hour, and he sees it first', outcome: 'They accept and then print the conditions alongside the interview, which is fair and makes him look exactly as careful as he was.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'no', label: 'Let the no stand', desc: 'He has enough people to talk to', outcome: 'The next issue has a blank page where the interview would have been. It is the funniest thing anybody does to him all season.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-schoolboy-reporter', title: 'A Lad With A Notebook', icon: '✏️', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boy of about eleven is at the back of the press room with a school exercise book. His mother is a steward. He has one question and has clearly written it out several times.',
        choices: [
          { id: 'take', label: 'Take his question first', desc: 'Before the nationals, in front of everyone', outcome: 'The question is about why the goalkeeper takes so long over goal kicks and it is a better question than the next four. The room laughs and then does not.', effect: { prestige: 1, boardMood: 1, tag: 'mgr-p08-took-the-boys-question' } },
          { id: 'after', label: 'See him afterwards', desc: 'Properly, with time, away from the cameras', outcome: 'Twenty minutes and a signed team sheet. Nobody reports it, which is the point, and the boy is at every home game for a decade.', effect: { prestige: 1, squadMorale: 2 } },
          { id: 'no', label: 'Have him moved', desc: 'It is a working press conference', outcome: 'The steward says nothing to him about it, ever, in three years of holding a door open for him twice a fortnight.', effect: { prestige: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-tribute-to-an-old-player', title: 'Six Hundred Words By Thursday', icon: '🕯️', category: 'media',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A man who played four hundred games here in the sixties has died. The paper wants six hundred words from the manager. He met him twice and both times it was in a corridor.',
        choices: [
          { id: 'research', label: 'Do it properly', desc: 'Two days, the old programmes, three phone calls to men who knew him', outcome: 'It is a good piece and it is not really about football. His widow writes to the club and the letter is pinned up by the boot room for years.', effect: { prestige: 2, boardMood: 1, clubLegacy: { kind: 'tradition', label: 'the tribute pinned by the boot room' } } },
          { id: 'brief', label: 'Give them a paragraph', desc: 'Honest about how little he knew him', outcome: 'It prints as three sentences under a large photograph. Nobody minds. He minds, in July, when he reads it again.', effect: { prestige: -1 } },
          { id: 'decline', label: 'Say somebody else should write it', desc: 'And name the man who should', outcome: 'The old teammate who writes it instead does it far better than he could have. Two directors read this as a manager avoiding the club’s history.', effect: { boardMood: -1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-television-offer', title: 'A Chair In A Studio', icon: '🎬', category: 'media',
    when: { minSeason: 4, maxPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A broadcaster wants him on a Sunday panel through the international breaks. Good money, a car, and a producer who says the phrase strong opinions twice in one call.',
        choices: [
          { id: 'do', label: 'Take the work', desc: 'The money is his, not the club’s', outcome: 'He is a natural, which is a problem. Every strong opinion is about somebody he may need a favour from in eighteen months.', effect: { coins: 0, prestige: 3, boardMood: -1, tag: 'mgr-p08-on-the-panel' } },
          { id: 'once', label: 'Do one and see', desc: 'A single Sunday, no contract', outcome: 'He hates the make-up chair and enjoys the two hours. They ask again in October and he says he will think about it, which he does, for years.', effect: { prestige: 1 } },
          { id: 'no', label: 'Turn it down flat', desc: 'He has a squad and an international break to use', outcome: 'Two proper weeks of coaching with the six players left in the building. The shape in November is unrecognisable.', effect: { squadMorale: 5, prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-headline-not-his', title: 'He Did Not Say That', icon: '🅰️', category: 'media',
    when: { minSeason: 2 }, temper: ['players-manager', 'disciplinarian', 'tactician'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The interview is fine. The headline above it is a word he never used, about a player he never mentioned, chosen by somebody in an office two hundred miles away who has never met either of them.',
        choices: [
          { id: 'player', label: 'Go straight to the player', desc: 'Before he sees it, with the recording on his phone', outcome: 'He plays him the actual answer in the physio room at half seven in the morning. The lad believes him and half of him does not.', effect: { playerMorale: { who: 'star', delta: 10 }, prestige: 1, tag: 'mgr-p08-played-the-tape' } },
          { id: 'paper', label: 'Take it up with the paper', desc: 'The writer knows he did not say it', outcome: 'The writer apologises privately and is embarrassed and can do nothing. The subs desk does the same thing to somebody else in November.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'nothing', label: 'Let it stand', desc: 'Correcting it doubles the size of it', outcome: 'The dressing room reads the headline and not the interview. It is raised, once, in a meeting in March, and it lands harder than it should.', effect: { squadMorale: -6, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-access-day', title: 'Cameras In The Building', icon: '🎥', category: 'media',
    when: { minSeason: 2, minCoins: 100 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A broadcaster wants a day inside the club. The tunnel, the canteen, one team meeting. Commercial have already told them yes in principle and are telling him now as a courtesy.',
        choices: [
          { id: 'full', label: 'Give them everything', desc: 'Including the meeting', outcome: 'It is the best film about the club anybody has made. Two things he said in that meeting are used against him in interviews for three years.', effect: { coins: 180, prestige: 2, squadMorale: -5, tag: 'mgr-p08-let-them-in' } },
          { id: 'limited', label: 'Everywhere but the meeting', desc: 'The room is the room', outcome: 'They get a canteen, a laundry and an hour of a physio being charming. It is a decent, slight piece of television.', effect: { coins: 120, boardMood: 1 } },
          { id: 'kill', label: 'Kill it', desc: 'Overrule commercial, take the row', outcome: 'The row is worse than he expected because the contract was already initialled. He wins and pays for it in the next four meetings.', effect: { coins: -100, boardMood: -3, squadMorale: 5 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-invented-link', title: 'A Player He Has Never Heard Of', icon: '🔗', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three outlets have him chasing a striker abroad. He has never seen the player and has said his name out loud once, this morning, reading it. Somebody’s agent has had a productive week.',
        choices: [
          { id: 'deny', label: 'Deny it flatly', desc: 'Never seen him, never rang anybody', outcome: 'It is printed as a denial, which keeps the story alive another two days and makes the striker’s people ring the club to ask what the problem is.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'ride', label: 'Let it run', desc: 'A club linked with players looks like a club going somewhere', outcome: 'Season-ticket enquiries go up in a fortnight. In August the supporters are told, in effect, that the club failed to sign a man nobody ever wanted.', effect: { coins: 140, boardMood: 2, prestige: -1, tag: 'mgr-p08-rode-the-rumour' } },
          { id: 'look', label: 'Actually go and watch him', desc: 'If somebody is going to that much trouble', outcome: 'He is quick and he is nineteen and he is not for them. Two years later he is worth eight times what he was that week.', effect: { coins: -60, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-empty-press-room', title: 'Nobody Came', icon: '🪑', category: 'media',
    when: { minSeason: 2, minTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Friday, one o’clock, the press room. Two people. One is the club’s own website and the other is a student on work experience whose recorder is not working.',
        choices: [
          { id: 'full', label: 'Do the full press conference anyway', desc: 'Twenty-five minutes, properly, to two people', outcome: 'The student’s piece is the only preview of the game anywhere and it is careful and good. She is on the nationals within four years.', effect: { prestige: 1, tag: 'mgr-p08-did-it-for-two' } },
          { id: 'short', label: 'Give them five minutes', desc: 'No point performing to an empty room', outcome: 'Fair enough, and it becomes the habit. By March the room is never more than half full and part of that is his.', effect: { prestige: -1, squadMorale: 2 } },
          { id: 'phone', label: 'Ring the ones who did not come', desc: 'Ask what he has to do to be worth the drive', outcome: 'Two of them tell him the truth, which is that his club is not interesting when it is fourteenth. He knew. Hearing it is different.', effect: { prestige: 1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-ghost-column', title: 'Under His Name', icon: '🖊️', category: 'media',
    when: { minSeason: 4 }, temper: ['chancer', 'tactician', 'firefighter'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A paper offers him a weekly column. Somebody else will write it from a fifteen-minute phone call and it will carry his photograph and his name in a typeface larger than his.',
        choices: [
          { id: 'take', label: 'Take it', desc: 'Money, profile, and fifteen minutes a week', outcome: 'The third column says something about a referee he did not say and would not have. He is charged for it by the association and pays it himself.', effect: { coins: -90, prestige: 2, boardMood: -2, tag: 'mgr-p08-has-a-column' } },
          { id: 'write', label: 'Take it and write it himself', desc: 'Badly, slowly, in his own words', outcome: 'It takes four hours a week that he does not have. It is the least polished column in the paper and it is read out loud in pubs.', effect: { prestige: 3, squadMorale: -3, boardMood: -1 } },
          { id: 'no', label: 'Say no', desc: 'His name is not a product', outcome: 'They give it to a former player instead, who is very good at it and mildly critical of him twice a month for two years.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-asked-about-the-referee', title: 'What Did He Think Of The Penalty', icon: '🟨', category: 'media',
    when: { minSeason: 2, minPos: 0.5 }, temper: ['firefighter', 'chancer', 'disciplinarian'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It was not a penalty. Everybody in the ground knows it was not a penalty. The first question after the game is about the penalty and the microphone is already in his face.',
        choices: [
          { id: 'blast', label: 'Say exactly what he thinks', desc: 'On camera, with the adrenaline still in him', outcome: 'Two thousand pounds and a warning. His players read it as him standing up for them and one of them says so to a reporter.', effect: { coins: -120, squadMorale: 8, prestige: 1, boardMood: -1, tag: 'mgr-p08-charged-for-comments' } },
          { id: 'careful', label: 'Say nothing he can be charged for', desc: 'The long careful sentence with the shrug in it', outcome: 'Everybody understands him perfectly and nothing can be done about it. It is the most skilful thing he does that week.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'ourselves', label: 'Blame his own side instead', desc: 'They had eighty minutes to fix it', outcome: 'It is true and it is not what the dressing room wanted to hear at ten past five. Two of them do not speak on the bus.', effect: { squadMorale: -7, boardMood: 2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-anniversary-piece', title: 'Fifty Years Since', icon: '🗓️', category: 'media',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is fifty years since the club’s best afternoon. The paper is doing eight pages. They would like the current manager to say how this side compares, which is a trap with a bow on it.',
        choices: [
          { id: 'honest', label: 'Say this side is nowhere near it', desc: 'Because it is not', outcome: 'The old players like him for it. His own players see the quote on a Thursday morning and it does not help anybody on the Saturday.', effect: { prestige: 1, squadMorale: -6, boardMood: -1 } },
          { id: 'ours', label: 'Turn it towards his own squad', desc: 'That was theirs. This will be ours', outcome: 'It is a good line and it goes in the programme. Three men who played in 1975 think it is a bit much and say so at the dinner.', effect: { squadMorale: 6, prestige: -1 } },
          { id: 'invite', label: 'Get the old side into the dressing room', desc: 'Before a home game, no press', outcome: 'Eleven men in their seventies and a room of footballers who mostly do not know the names. Two of them get it entirely and it changes their season.', effect: { squadMorale: 4, playerMorale: { who: 'youngest', delta: 12 }, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the fiftieth-anniversary visit' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-open-letter', title: 'Printed In Full', icon: '📬', category: 'media',
    when: { minSeason: 3, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporter has written an open letter and the paper has printed all eleven hundred words of it. It is not abusive. It is careful, and detailed, and it says he has taken something from them that he cannot give back.',
        choices: [
          { id: 'reply', label: 'Write back, and let them print it', desc: 'The same length, the same care', outcome: 'It takes him a night. It is better than the letter and it convinces almost nobody, because the letter was not about arguments.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p08-answered-the-letter' } },
          { id: 'meet', label: 'Invite him to the training ground', desc: 'Not to be filmed. To be answered in person', outcome: 'They talk for two hours and disagree about everything. The man buys a season ticket in June and still thinks he is wrong.', effect: { prestige: 1, squadMorale: 2, boardMood: -1 } },
          { id: 'nothing', label: 'Not read it', desc: 'Or say he has not', outcome: 'Everybody in the building has read it. The pretence that he has not becomes its own small problem by the following week.', effect: { squadMorale: -3, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-clip-out-of-context', title: 'Nine Seconds', icon: '📱', category: 'media',
    when: { minSeason: 2 }, temper: ['chancer', 'players-manager', 'builder'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine seconds of him on the touchline, cut from a two-hour feed, is everywhere by Sunday lunchtime. In the nine seconds he looks like a man who does not care. In the two hours he plainly does.',
        choices: [
          { id: 'full', label: 'Put the full clip out', desc: 'Through the club, no comment attached', outcome: 'It gets a fraction of the views the nine seconds got. It matters to the four hundred people who watch it and to nobody else.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'joke', label: 'Make a joke of it on Friday', desc: 'Own it, laugh, move the room on', outcome: 'It works in the room and travels badly in print. The joke becomes the caption on the clip and the clip lives another week.', effect: { prestige: -1, squadMorale: 3 } },
          { id: 'ignore', label: 'Never mention it', desc: 'It is nine seconds', outcome: 'It is nine seconds, and it is gone by Thursday, and it is the thing a certain kind of supporter still brings up years later.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-local-paper-cuts', title: 'They Have Let Him Go', icon: '📉', category: 'media',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The local paper has made its football writer redundant after nineteen years. From next month the club will be covered by whoever is free, from an office in another county.',
        choices: [
          { id: 'accredit', label: 'Give the man his own accreditation', desc: 'He is going to write anyway. Let him do it from the press box', outcome: 'He starts a site with two hundred subscribers and does the best work of his life. The paper’s coverage becomes a match report and a table.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p08-kept-the-reporter-in' } },
          { id: 'club', label: 'Build up the club’s own channel instead', desc: 'If nobody covers them, cover themselves', outcome: 'Two young staff and a camera. It is professional and warm and every word of it is approved by somebody, which everybody can feel.', effect: { coins: -110, boardMood: 2, prestige: -1 } },
          { id: 'nothing', label: 'Nothing to do with him', desc: 'A newspaper’s staffing is a newspaper’s business', outcome: 'Correct. The Friday press conference has one voice in it by December and he can say anything he likes, which turns out to be worth less than he thought.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-national-writer-week', title: 'A Week With Him', icon: '📔', category: 'media',
    when: { minSeason: 4, maxPos: 0.45 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A national writer wants a week. Training, the car, the pre-match hotel, the bit after the game where nobody talks. Three thousand words, and the sort of piece that follows a man around.',
        choices: [
          { id: 'yes', label: 'Give him the week', desc: 'All of it, no conditions', outcome: 'The piece is affectionate and unsparing and there is a paragraph about his hands during a substitution that his wife cuts out.', effect: { prestige: 3, boardMood: -1, squadMorale: -3, tag: 'mgr-p08-the-long-piece' } },
          { id: 'partial', label: 'Give him two days', desc: 'The good ones, arranged in advance', outcome: 'The writer notices immediately and writes about that instead. It is a shorter piece and a cooler one.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'no', label: 'Say not this season', desc: 'There is a relegation fight on', outcome: 'He does the same piece about somebody else, who is very good in it. It runs on the day of the biggest game of the year.', effect: { prestige: -1, squadMorale: 4 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-question-about-family', title: 'They Have Been To The House', icon: '🏠', category: 'media',
    when: { minSeason: 3, minPos: 0.65 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody knocked on his door on Tuesday while he was at work and asked his wife how she was coping. She told them, politely, to go away. She did not tell him until Thursday.',
        choices: [
          { id: 'public', label: 'Say it in the press conference', desc: 'Name what happened, ask for it to stop', outcome: 'Every reporter in the room agrees it is out of order and one of them wrote the commission. It does not happen again this season.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p08-drew-the-line-at-home' } },
          { id: 'quiet', label: 'Handle it privately', desc: 'Two phone calls to two editors', outcome: 'It stops, and it costs him something he was saving. He does not tell his wife that it is dealt with in case it is not.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'move', label: 'Move the family for a while', desc: 'Her mother’s, until the season ends', outcome: 'The house is very quiet and the football is very loud. He is at the training ground until nine most nights and the results do not improve.', effect: { squadMorale: 3, prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-praise-costs', title: 'He Said Their Boy Was Good', icon: '👏', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He said, honestly and in passing, that the opposition’s eighteen-year-old was the best player on the pitch. It is on the front of their programme by the following Saturday and his own number ten has read it.',
        choices: [
          { id: 'stand', label: 'Stand by it', desc: 'It was true and he will say true things', outcome: 'The number ten sulks for a fortnight and then plays the best month of his career out of spite. Neither of them ever discusses it.', effect: { playerMorale: { who: 'star', delta: -10 }, prestige: 2, squadMorale: -2 } },
          { id: 'balance', label: 'Praise his own on Friday', desc: 'Louder, and with more detail', outcome: 'It is transparent and it works anyway. Footballers are not complicated about this and he has always known it.', effect: { playerMorale: { who: 'star', delta: 8 }, prestige: -1 } },
          { id: 'private', label: 'Explain it to him face to face', desc: 'In the office, no audience', outcome: 'Ten minutes and it is settled. The lad tells two team-mates, who take from it that the manager rates a boy at another club.', effect: { playerMorale: { who: 'star', delta: 6 }, squadMorale: -3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-off-the-record', title: 'That Was Not For Printing', icon: '🤫', category: 'media',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He said something in a corridor about the board that he would not have said on Friday. He said it to somebody he trusts. It appears on Sunday, unattributed, and it is word for word.',
        choices: [
          { id: 'cut-off', label: 'Cut the man off', desc: 'No calls, no favours, done', outcome: 'It is the correct professional response and it removes the only reporter who ever warned him about a story before it ran.', effect: { prestige: 1, boardMood: 1, tag: 'mgr-p08-cut-off-a-friend' } },
          { id: 'ask', label: 'Ask him why', desc: 'Face to face, in a car park, no shouting', outcome: 'He says his editor had it from somewhere else and he confirmed it. It may even be true and there is no way to find out.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'own', label: 'Own it upstairs before they ask', desc: 'Walk in on Monday and say he said it', outcome: 'The chairman respects it and does not forgive it. It is on the record now in a room where the record is kept.', effect: { boardMood: -2, prestige: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-nothing-to-say', title: 'A Nil-Nil Nobody Can Describe', icon: '😐', category: 'media',
    when: { minSeason: 2 }, temper: ['tactician', 'builder', 'disciplinarian'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nothing happened. Two shots, both wide, in a wind. Afterwards a man from the radio asks him for his thoughts and he genuinely does not have any.',
        choices: [
          { id: 'honest', label: 'Say it was a poor game', desc: 'And that he is not going to dress it up', outcome: 'Fourteen seconds of audio. The station uses all of it because it is the only honest thing anybody says on the show.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'positive', label: 'Find the positives', desc: 'A clean sheet, a point, a foundation', outcome: 'He says the word foundation and hears himself say it. The supporters walking past the mixed zone hear it too.', effect: { boardMood: 1, prestige: -1, squadMorale: 2 } },
          { id: 'detail', label: 'Talk about the wind', desc: 'Properly, for three minutes, like a coach', outcome: 'It is genuinely interesting and completely unusable. The reporter thanks him and uses eleven words of it.', effect: { prestige: 1, squadMorale: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-rival-fans-song', title: 'They Sing About Him', icon: '🎶', category: 'media',
    when: { minSeason: 3, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The away end has a song about him now. It is funny, it scans, and it is about the fact that he has never won at their ground. Somebody asks him about it on Friday.',
        choices: [
          { id: 'laugh', label: 'Say he liked it', desc: 'And that the tune is better than their side', outcome: 'It is the quote of the week and they sing it louder for it. His own supporters take it up ironically by Easter.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p08-they-sing-about-him' } },
          { id: 'ignore', label: 'Refuse to engage', desc: 'He does not hear the crowd', outcome: 'Everybody knows this is not true. It is a small, flat lie and it costs him a little of the room.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'motivate', label: 'Play it in the dressing room', desc: 'Before the return fixture, loud', outcome: 'Half of them find it funny and half find it embarrassing and one of them plays like a man possessed. They lose anyway.', effect: { squadMorale: 4, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-book-extract', title: 'Chapter Nine Is About Him', icon: '📕', category: 'media',
    when: { minSeason: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A player he moved on three years ago has a book out. There is a chapter about the day he was told, and it is serialised on Saturday. The account is accurate and the tone is not.',
        choices: [
          { id: 'silence', label: 'Say nothing at all', desc: 'A man is entitled to his version', outcome: 'It sells and it fades. Two current players read it and file away that this is how it goes when it ends.', effect: { squadMorale: -4, prestige: 1 } },
          { id: 'correct', label: 'Correct the one thing that is wrong', desc: 'One detail, once, and no more', outcome: 'It reopens the whole thing for four days. The detail was minor and everybody now remembers the chapter better than they did.', effect: { prestige: -1, boardMood: -1 } },
          { id: 'call', label: 'Ring him', desc: 'Not about the book. About how it ended', outcome: 'A long, awkward phone call with three real apologies in it, two of them his. Nobody ever hears about it.', effect: { prestige: 2, squadMorale: 2, tag: 'mgr-p08-made-the-call' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-charity-airtime', title: 'Twelve Minutes On A Wednesday', icon: '🎗️', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A hospice in the town has lost its funding. Local radio offers him twelve minutes on the drive-time show to talk about it, on the condition that he also takes calls about the team.',
        choices: [
          { id: 'do', label: 'Take the deal', desc: 'Twelve minutes for the hospice, whatever comes with it', outcome: 'Nine minutes of hospice and three of a man from a village asking why they play with one striker. The appeal raises more than the club’s in a year.', effect: { prestige: 2, boardMood: 1, tag: 'mgr-p08-the-hospice-appeal' } },
          { id: 'club', label: 'Do it through the club instead', desc: 'A match-day collection, no radio, no calls', outcome: 'It raises less and costs nobody anything. The station notes, on air, that he was invited.', effect: { coins: -50, prestige: 1, boardMood: 1 } },
          { id: 'refuse', label: 'Not this week', desc: 'He cannot take phone-in calls in this run of form', outcome: 'Understandable and true. The hospice does not get its twelve minutes and somebody in the club shop asks him about it in April.', effect: { prestige: -2, squadMorale: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-statue-poll', title: 'A Poll About A Statue', icon: '🗿', category: 'media',
    when: { minSeason: 6, maxPos: 0.4 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The paper is running a poll on who should get a statue outside the ground. He is third, behind two dead men. He is asked, on the record, whether he thinks he deserves one.',
        choices: [
          { id: 'deflect', label: 'Name one of the dead men', desc: 'At length, with a story about him', outcome: 'The story is a good one and the vote moves. The old winger’s family write to him and he keeps the letter in his desk.', effect: { prestige: 1, boardMood: 1, clubLegacy: { kind: 'reputation', label: 'the statue he argued for' } } },
          { id: 'honest', label: 'Say statues are for when you are finished', desc: 'And that he is not', outcome: 'It is the right answer and it is quoted approvingly and it is read by two directors as a man announcing he intends to stay.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'joke', label: 'Ask for it to be a small one', desc: 'Near the away end, in the rain', outcome: 'The line runs everywhere for a day. Somebody makes a plastic one and it appears on the wall of a pub and stays there.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p08-the-pub-statue' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-interviewer-wants-a-row', title: 'He Is Being Baited', icon: '🎤', category: 'media',
    when: { minSeason: 2, minPos: 0.6 }, temper: ['firefighter', 'disciplinarian', 'players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The touchline interviewer has asked the same question three ways in ninety seconds. He is not interested in the answer. There is a producer in his ear and a clip to be made.',
        choices: [
          { id: 'walk', label: 'End the interview', desc: 'Thank him, take the microphone off, walk', outcome: 'It is the clip. It is on every channel by seven and it is exactly what they wanted, and it feels excellent for about four minutes.', effect: { prestige: -1, squadMorale: 5, boardMood: -2, tag: 'mgr-p08-walked-off' } },
          { id: 'flat', label: 'Give the same flat answer three times', desc: 'Bore him out of it', outcome: 'Nothing is usable. The interviewer gives up on the fourth attempt and the clip that runs is of a substitution instead.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'turn', label: 'Answer the question he was not asked', desc: 'Talk about the young lad who played eighty minutes', outcome: 'It is generous and slightly odd and the boy’s father watches it fourteen times. Nobody else remembers it by Monday.', effect: { playerMorale: { who: 'youngest', delta: 14 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-award-vote-leak', title: 'How The Vote Went', icon: '🗳️', category: 'media',
    when: { minSeason: 4, maxPos: 0.4 }, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody has leaked the manager-of-the-year voting. He came second by one, and the man who did not vote for him is on the other end of the phone every fortnight about a loan.',
        choices: [
          { id: 'raise', label: 'Mention it to him', desc: 'Lightly, in the middle of a phone call about something else', outcome: 'The other man laughs and does not deny it. The loan happens anyway and there is a coolness in it that was not there before.', effect: { prestige: -1, coins: 90 } },
          { id: 'nothing', label: 'Never refer to it', desc: 'It is a vote for a dinner', outcome: 'He is genuinely unbothered by March and briefly, on the night, he was not. Nobody ever knows which.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'staff', label: 'Tell his staff they should have won it', desc: 'In the meeting, out loud, and mean it', outcome: 'The fitness coach goes red. It is the closest thing to a speech he makes all season and it costs him nothing.', effect: { squadMorale: 5, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-programme-notes', title: 'Six Hundred Words A Fortnight', icon: '📘', category: 'media',
    when: { minSeason: 2 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The programme notes are written for him by the media department and he signs them off in a lift. This week they have him thanking the supporters for their patience, which is a word he did not choose.',
        choices: [
          { id: 'write', label: 'Start writing them himself', desc: 'Every fortnight, in his own words', outcome: 'They get shorter and better and one of them, in February, is read out on a podcast in full. It takes an hour he does not have.', effect: { prestige: 2, squadMorale: 2, boardMood: -1, tag: 'mgr-p08-writes-his-own-notes' } },
          { id: 'strike', label: 'Strike out the word and sign it', desc: 'One correction, thirty seconds', outcome: 'The word comes back in the next issue. He strikes it out again. This continues, unremarked, for two years.', effect: { boardMood: 1 } },
          { id: 'drop', label: 'Ask to stop doing them', desc: 'Give the page to a player instead', outcome: 'The players’ page is better than his ever was. Two directors take the absence of a manager’s column as a signal and they are not entirely wrong.', effect: { squadMorale: 4, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-radio-on-a-kid', title: 'They Have Named The Boy', icon: '📢', category: 'media',
    when: { minSeason: 2, needs: 'wonderkid' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The commentary on Saturday put two goals on the seventeen-year-old by name, twice, in a tone. His mother heard it in the car on the way to collect him.',
        choices: [
          { id: 'shield', label: 'Take the blame publicly', desc: 'He picked him, he set them up, it is his', outcome: 'Four minutes of it on Friday and not one word about the boy. The lad plays again on Saturday and is fine.', effect: { playerMorale: { who: 'youngest', delta: 16 }, prestige: 1, squadMorale: 4, tag: 'mgr-p08-took-it-for-the-kid' } },
          { id: 'drop', label: 'Take him out of the side for a month', desc: 'Protect him from all of it', outcome: 'Safe, and it teaches him that a bad afternoon costs you your place. He is more careful than he was and slightly less good.', effect: { playerMorale: { who: 'youngest', delta: -10 }, squadMorale: -2, boardMood: 1 } },
          { id: 'station', label: 'Ring the station', desc: 'Ask them not to name academy players like that', outcome: 'They are apologetic and make no promises. The commentator mentions on air the following week that he has been contacted, which is worse.', effect: { prestige: -1, playerMorale: { who: 'youngest', delta: 6 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-podcast-invitation', title: 'Two Hours, No Edit', icon: '🎧', category: 'media',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A supporters’ podcast with a real audience wants two hours. Unedited, live, questions from listeners. They have been hard on him and they have never been stupid.',
        choices: [
          { id: 'go', label: 'Do it live', desc: 'No edit, no press officer, no conditions', outcome: 'Ninety minutes of excellent argument and thirty of him being defensive about January. Both halves are clipped and both travel.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-p08-did-the-podcast' } },
          { id: 'record', label: 'Do it recorded', desc: 'Same questions, an edit, no calls', outcome: 'It is safer and duller. Their audience says so in numbers and the hosts are apologetic about a decision that was not theirs.', effect: { prestige: -1, boardMood: 1 } },
          { id: 'no', label: 'Not while results are like this', desc: 'Ask them again in the summer', outcome: 'They are fine about it and say so on air, generously. He does not do it in the summer either.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },

  // ── CRISIS ───────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p08-both-keepers', title: 'The Week Both Of Them Went', icon: '🧤', category: 'crisis',
    when: { minSeason: 2, minPos: 0.5 }, temper: ['firefighter', 'builder', 'tactician'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The first-choice went on the Tuesday, landing. The second went on the Thursday, in a shooting drill, and lay on the wet grass laughing at how stupid it was before he stopped laughing.',
        choices: [
          { id: 'kid', label: 'Play the seventeen-year-old', desc: 'He is the only keeper left in the building', outcome: 'He makes one mistake and four saves and comes off the pitch shaking. He plays eleven more games and by the last of them he is a footballer.', effect: { playerMorale: { who: 'youngest', delta: 18 }, squadMorale: -4, boardMood: -1, tag: 'mgr-p08-keeper-thrown-in' }, next: 'after' },
          { id: 'emergency', label: 'Take an emergency loan', desc: 'Whoever is available, at whatever it costs', outcome: 'A thirty-four-year-old arrives on the Friday and does not know a single name. He is competent and it is a very long month for everybody.', effect: { coins: -200, squadMorale: 2 }, next: 'after' },
          { id: 'outfield', label: 'Put the centre-half in goal', desc: 'He did it at school. It is one game', outcome: 'It is not one game, it is three, and by the second he is genuinely enjoying it. The defence is a shambles in front of a man who is not there.', effect: { squadMorale: -6, prestige: 1 }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The first-choice is fit in six weeks. He arrives on the Monday expecting his shirt back and nobody has said anything to him about it.',
        choices: [
          { id: 'restore', label: 'Give him the shirt', desc: 'He is the better keeper and everybody knows it', outcome: 'The right call. Whoever kept goal in the meantime learns exactly where he stands and does not sulk, out loud.', effect: { playerMorale: { who: 'best', delta: 8 }, squadMorale: -3 } },
          { id: 'keep', label: 'Keep the one who has been playing', desc: 'He has not lost the shirt on the pitch', outcome: 'The senior man asks for a transfer within a fortnight. The dressing room decides, quietly, that form counts here, and plays like it.', effect: { squadMorale: 7, playerMorale: { who: 'best', delta: -14 }, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-snow-away', title: 'The A66 In February', icon: '🌨️', category: 'crisis',
    when: { minSeason: 2, minPos: 0.55 }, temper: ['firefighter', 'disciplinarian', 'players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach has been stationary for two hours in falling snow and the game is still on. Kick-off is in four hours and there are ninety miles to go.',
        choices: [
          { id: 'push', label: 'Keep going', desc: 'Get there, warm up in the coach if you have to', outcome: 'They arrive at twenty to three. No proper warm-up, no meal, two down inside twenty minutes and a fight back to one that nobody sees.', effect: { squadMorale: -6, prestige: 1, boardMood: -1 } },
          { id: 'call', label: 'Get on the phone and have it called off', desc: 'Safety, and the truth, and a bit of leverage', outcome: 'It goes off at half one. Nine hundred travelling supporters are already there, in it, and a lot of them are still there at four.', effect: { coins: -80, squadMorale: 4, prestige: -1, tag: 'mgr-p08-had-it-called-off' } },
          { id: 'hotel', label: 'Pull into a hotel and play tomorrow', desc: 'Ask for a twenty-four-hour postponement', outcome: 'Two clubs, a division and a broadcaster have to agree. They do, at eleven at night, and the squad spend the evening in a lounge with one television.', effect: { coins: -150, squadMorale: 6, boardMood: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-bereavement', title: 'The Kitman’s Wife', icon: '🕯️', category: 'crisis',
    when: { minSeason: 3 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kitman’s wife died on Sunday night. He was at the ground on Monday morning at seven, doing the washing, because he did not know where else to go.',
        choices: [
          { id: 'send', label: 'Send him home', desc: 'Firmly, with the club car and somebody with him', outcome: 'He goes because he is told to. He is back in eleven days and thanks the manager for making him take them.', effect: { squadMorale: 4, prestige: 2, tag: 'mgr-p08-sent-him-home' } },
          { id: 'let', label: 'Let him work', desc: 'Because he asked to and he knows what he needs', outcome: 'He does the boots and the bibs and the away skips and nobody says anything except good morning. It is the kindest room in the country for a fortnight.', effect: { squadMorale: 7, prestige: 1 } },
          { id: 'squad', label: 'Take the squad to the funeral', desc: 'All of them, in club suits, at the back', outcome: 'The church is full. The players are awkward and correct and the story of it is still told at that club long after everybody in it has gone.', effect: { squadMorale: 9, coins: -40, clubLegacy: { kind: 'tradition', label: 'the day the squad filled the back of the church' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-nobody-fault', title: 'Nobody Did Anything Wrong', icon: '🌧️', category: 'crisis',
    when: { minSeason: 2, minPos: 0.6 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They were the better side. Twenty-one shots. A post, a line clearance, a deflection off a shin at the far end in the eighty-eighth. There is nothing on the video to shout about and it is a defeat all the same.',
        choices: [
          { id: 'truth', label: 'Tell them the truth', desc: 'That they were good and it went against them', outcome: 'They believe him because it is obviously true. They also lose the next one, and the truth is a smaller thing the second time he says it.', effect: { squadMorale: 5, boardMood: -2, prestige: 1 } },
          { id: 'anger', label: 'Find something to be angry about', desc: 'Because a room needs somewhere to put it', outcome: 'He picks on the throw-ins and does it well. Two of them see straight through it and one of them plays furiously for a month.', effect: { squadMorale: -3, prestige: 1, boardMood: 1 } },
          { id: 'nothing', label: 'Say nothing at all', desc: 'Let them shower and go home', outcome: 'The silence does the work. Or it does not, and on Monday nobody can tell him what the meeting on Saturday was supposed to have been.', effect: { squadMorale: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-stopped-listening', title: 'They Have Stopped Hearing Him', icon: '🔇', category: 'crisis',
    when: { minSeason: 3, minPos: 0.7 }, temper: ['disciplinarian', 'players-manager', 'tactician'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The meeting on Thursday was forty minutes long. Nobody argued, nobody asked a question, nobody wrote anything down. They were polite the whole way through and it was the worst thing that has happened to him at this club.',
        choices: [
          { id: 'hand', label: 'Hand the session to the players', desc: 'Let them run Friday. Sit at the back', outcome: 'It is chaotic for twenty minutes and then it is very good. He has to be careful for the rest of the season about how often he does it.', effect: { squadMorale: 8, prestige: -1, tag: 'mgr-p08-gave-them-the-session' } },
          { id: 'change', label: 'Change the voice', desc: 'The assistant takes the meetings for a month', outcome: 'They listen to somebody else, which is progress and is also the thing he was afraid of. The results pick up and the credit goes sideways.', effect: { squadMorale: 6, prestige: -2, boardMood: 1 } },
          { id: 'confront', label: 'Say what he has just noticed', desc: 'Out loud, to their faces, in the room', outcome: 'The silence goes on for a long time and then three of them speak and one of them is honest. It is a bad afternoon and it is the start of something.', effect: { squadMorale: -4, prestige: 2, tag: 'mgr-p08-said-it-in-the-room' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-nothing-season', title: 'A Season Of Nothing At All', icon: '➖', category: 'crisis',
    when: { minSeason: 4, minPos: 0.35, maxPos: 0.7 }, temper: ['builder', 'chancer', 'tactician'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'No injuries worth the name. No rows. No run of six wins and no run of six defeats. Twelfth in August, twelfth in April. There is no crisis and there is nothing to hold on to either, and the ground is very quiet.',
        choices: [
          { id: 'break', label: 'Break something on purpose', desc: 'Change the shape, drop two senior men, force weather', outcome: 'It gets worse for five games and better for eight. It is the only interesting thing anybody does at the club all year.', effect: { squadMorale: -5, boardMood: -1, prestige: 2, tag: 'mgr-p08-forced-the-weather' } },
          { id: 'youth', label: 'Spend the season on the young ones', desc: 'If nothing is at stake, use it', outcome: 'Four debuts in a nothing spring. Two of them are still at the club in five years and neither of them remembers the season as nothing.', effect: { playerMorale: { who: 'youngest', delta: 15 }, squadMorale: -2, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the four who came up in a quiet spring' } } },
          { id: 'hold', label: 'Hold the line and take the points', desc: 'Twelfth is not a failure and he will not apologise for it', outcome: 'They finish twelfth. In June the chairman uses the word stale in a sentence that is otherwise entirely complimentary.', effect: { boardMood: 1, squadMorale: 2, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-hotel-food', title: 'Something In The Hotel', icon: '🤢', category: 'crisis',
    when: { minSeason: 2, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six of them were up in the night. The hotel says nobody else has complained. Kick-off is at three and two of the six are the spine of the team.',
        choices: [
          { id: 'play', label: 'Play them if they can stand', desc: 'Ask each of them and take the answer', outcome: 'Four say yes and two are gone by the hour. They lose a game they were winning and the last twenty minutes are grim to watch.', effect: { squadMorale: -6, boardMood: -1 } },
          { id: 'rest', label: 'Rest all six', desc: 'A reshaped side and three teenagers on the bench', outcome: 'They are beaten by a better-prepared team and nobody is ill on Sunday. It is a defensible afternoon and it costs three points.', effect: { squadMorale: 3, boardMood: -2, playerMorale: { who: 'youngest', delta: 8 } } },
          { id: 'complain', label: 'Go after the hotel', desc: 'Refuse the bill and say why', outcome: 'The club never stays there again and the new place is forty minutes further out. It is not clear, ever, that the hotel did anything.', effect: { coins: 70, prestige: -1, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-power-cut', title: 'No Lights At The Training Ground', icon: '🔌', category: 'crisis',
    when: { minSeason: 2, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The substation went at six in the morning and it will not be back until Thursday. No lights, no heating, no hot water, no video. It is the first week of December.',
        choices: [
          { id: 'outside', label: 'Train outside and go home', desc: 'Two hours, cold showers at home, no meetings', outcome: 'It is the hardest and happiest week of the winter. Somebody brings a flask for the goalkeepers and it becomes a thing they do.', effect: { squadMorale: 7, prestige: 1, tag: 'mgr-p08-the-cold-week' } },
          { id: 'borrow', label: 'Borrow facilities', desc: 'A university pitch, an hour’s drive, both ways', outcome: 'Everything works and nothing is theirs. Four hours a day in a minibus and the sessions are twenty minutes shorter than they look.', effect: { coins: -90, squadMorale: -4 } },
          { id: 'stadium', label: 'Train at the stadium', desc: 'On the match pitch, in December', outcome: 'The groundsman watches from the tunnel with his arms folded for three days. The pitch on Saturday is noticeably worse and the football on it is not.', effect: { squadMorale: 3, boardMood: -2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-coach-collapses', title: 'On Pitch Three', icon: '🚑', category: 'crisis',
    when: { minSeason: 3 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The fitness coach went down during the warm-up on a Wednesday morning. He is fifty-one. The players saw all of it and the ambulance took nineteen minutes.',
        choices: [
          { id: 'stop', label: 'Stop everything for the week', desc: 'No sessions, no meetings, the game can wait', outcome: 'Nobody trains until Monday. The game on Saturday is a shambles and not one person in the building thinks it was the wrong call.', effect: { squadMorale: 6, boardMood: -2, prestige: 1 } },
          { id: 'work', label: 'Give them something to do', desc: 'Train at eleven, keep the shape, keep them together', outcome: 'It is the right thing for about half of them. The other half go through the session somewhere else entirely and one of them says so a year later.', effect: { squadMorale: -3, boardMood: 1, prestige: 1 } },
          { id: 'screen', label: 'Get every member of staff screened', desc: 'This week, at the club’s cost, no exceptions', outcome: 'It finds nothing and costs a fortune and two men’s families are grateful for it in a way that has nothing to do with the results.', effect: { coins: -160, squadMorale: 5, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the staff screening every autumn' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-two-reds-first-half', title: 'Nine Men At Half-Time', icon: '🟥', category: 'crisis',
    when: { minSeason: 2, minPos: 0.55 }, temper: ['chancer', 'disciplinarian', 'firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two sent off inside thirty-five minutes. One was stupid and one was unlucky and both were his players. Level at the break, nine men, and forty-five to go in front of a home crowd that has found its voice.',
        choices: [
          { id: 'defend', label: 'Two banks and a striker in the corner', desc: 'Take a point out of it if it kills them', outcome: 'They hold for thirty-eight minutes and go under twice in the last seven. Everybody in the ground stands up at the end anyway.', effect: { squadMorale: 6, boardMood: -1 } },
          { id: 'go', label: 'Tell them to go and win it', desc: 'Nine men, high line, no fear', outcome: 'It is berserk and it is glorious and it is 3-1 by the seventy-fifth minute. He would do it again and he cannot say that out loud.', effect: { squadMorale: 4, prestige: 2, boardMood: -2, tag: 'mgr-p08-nine-men-went-for-it' } },
          { id: 'blame', label: 'Take the stupid one apart in the dressing room', desc: 'In front of everybody, now', outcome: 'It is deserved and it is heard through the wall. The other nine play the second half for the manager and the lad does not start again until March.', effect: { playerMorale: { who: 'unhappiest', delta: -16 }, squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-fine-mutiny', title: 'The Fines Book', icon: '📕', category: 'crisis',
    when: { minSeason: 2, minPos: 0.6, needs: 'big-squad' }, temper: ['disciplinarian', 'players-manager', 'builder'], weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The senior players want the fines system changed. Late for a meeting, phone in the room, the wrong socks. It has raised a lot of money for a charity and it is now, they say, the only thing anybody talks about.',
        choices: [
          { id: 'scrap', label: 'Scrap it', desc: 'Trust them and see what happens', outcome: 'Nobody is late for a month and then everybody is. The standards go by degrees and it is impossible to say when.', effect: { squadMorale: 8, coins: -60, prestige: -2, tag: 'mgr-p08-scrapped-the-fines' } },
          { id: 'theirs', label: 'Give them the book', desc: 'They set the fines and they collect them', outcome: 'Their fines are harsher than his ever were. Two players are furious and neither of them can be furious with him.', effect: { squadMorale: 4, coins: 80, prestige: 1 } },
          { id: 'hold', label: 'Refuse to change a line of it', desc: 'It is not a negotiation', outcome: 'It holds. The charity gets its cheque in May and a group of six men sit slightly apart from him for the rest of the season.', effect: { coins: 120, squadMorale: -6, prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-caretaker-on-standby', title: 'A Name On Standby', icon: '📇', category: 'crisis',
    when: { minSeason: 3, minPos: 0.75 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy manager has been asked, in confidence, whether he would take the team for a few games if it came to it. He came and told him within the hour, which is the only good news in the sentence.',
        choices: [
          { id: 'thank', label: 'Thank him and say nothing upstairs', desc: 'Let them think the call was not made', outcome: 'The two of them are closer than they have ever been and the manager now knows the exact size of the ledge he is on.', effect: { squadMorale: 3, prestige: 1, tag: 'mgr-p08-knows-about-the-call' } },
          { id: 'confront', label: 'Take it to the chairman', desc: 'Ask him directly whether he wants him gone', outcome: 'He gets an answer that is technically no. Three people now know he knows, and the academy manager is not asked anything again.', effect: { boardMood: -3, prestige: 1 } },
          { id: 'promote', label: 'Put the man on the first-team bench', desc: 'If he is next, let him learn where the seat is', outcome: 'Generous, and it removes any deniability from anybody. The results improve and it is genuinely unclear who is running the sessions.', effect: { squadMorale: 5, prestige: 2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-kit-van', title: 'The Van Is Gone', icon: '🚚', category: 'crisis',
    when: { minSeason: 2, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kit van was taken from a hotel car park overnight. Everything is in it. Boots, strips, the goalkeepers’ gloves, and the medical bag. Kick-off is in six hours, two hundred miles from home.',
        choices: [
          { id: 'borrow', label: 'Borrow from the home club', desc: 'Their spare kit, their gloves, and take the embarrassment', outcome: 'They play in a change strip belonging to somebody else. It is the loosest, funniest ninety minutes of the season and they win it.', effect: { squadMorale: 9, prestige: -1, coins: -60 } },
          { id: 'buy', label: 'Send somebody to a sports shop', desc: 'Whatever they have, in whatever sizes', outcome: 'Eleven pairs of new boots on eleven pairs of feet. Four blisters, one pulled calf, and a bill that gets read out in a boardroom in July.', effect: { coins: -220, squadMorale: -4, boardMood: -1 } },
          { id: 'delay', label: 'Ask for the kick-off to be put back', desc: 'An hour, while the spare kit is driven up', outcome: 'They get forty minutes. The van from home arrives at ten past three and the game starts at twenty past to a ground that has been booing since half two.', effect: { squadMorale: -3, boardMood: -1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-captain-in-warmup', title: 'In The Warm-Up', icon: '🎽', category: 'crisis',
    when: { minSeason: 2, minPos: 0.5 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The captain pulls up in the warm-up. Twelve minutes before kick-off, team sheet already in, a hamstring he has been quiet about for a fortnight.',
        choices: [
          { id: 'reshape', label: 'Reshape the whole side', desc: 'Different system, twelve minutes to tell them', outcome: 'Two of them get it wrong in the first quarter of an hour and then it settles. It is the boldest thing he does all season and nobody notices.', effect: { squadMorale: 2, prestige: 2 } },
          { id: 'straight', label: 'Straight swap and keep the shape', desc: 'The obvious change, no drama', outcome: 'Safe and slightly worse. The replacement plays within himself all afternoon because he knows exactly what he is.', effect: { squadMorale: -2, boardMood: 1 } },
          { id: 'blame', label: 'Ask him why he said nothing for a fortnight', desc: 'Afterwards, in the office, quietly furious', outcome: 'He says he did not want to come out of the side. It is loyalty and it is stupidity and it costs six weeks instead of one.', effect: { playerMorale: { who: 'best', delta: -12 }, squadMorale: -3, prestige: 1, tag: 'mgr-p08-hid-an-injury' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-crowd-trouble-away', title: 'It Went Off In The Away End', icon: '🚨', category: 'crisis',
    when: { minSeason: 2, minPos: 0.6 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Something happened in the away end in the second half. Seats, stewards, eleven ejections. Nobody was badly hurt and the club will be charged and every account of what started it is different.',
        choices: [
          { id: 'condemn', label: 'Condemn it plainly', desc: 'On Friday, no qualifications, no context', outcome: 'It is the correct thing to say and the association take it into account. A section of the support decide he does not know what he is talking about.', effect: { boardMood: 2, prestige: 1, tag: 'mgr-p08-condemned-it' } },
          { id: 'context', label: 'Ask what the stewarding was like', desc: 'Before anybody condemns anybody', outcome: 'Two hundred people thank him for it and the charge gets heavier. The chairman spends a day on the phone because of one sentence.', effect: { boardMood: -3, prestige: 1, coins: -90 } },
          { id: 'quiet', label: 'Say it is not for him to comment', desc: 'He picks a team, he does not police a stand', outcome: 'Perfectly reasonable and it satisfies nobody at all. The story runs for a week without him in it, which was the aim.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-drainage', title: 'Three Inspections In A Fortnight', icon: '💧', category: 'crisis',
    when: { minSeason: 3, minPos: 0.5, maxCoins: 400 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The pitch has failed three inspections in a fortnight. The drainage was put in in 1968 and the last two home games have been called off with the crowd already in the car park.',
        choices: [
          { id: 'fix', label: 'Push for the drainage to be done now', desc: 'Mid-season, groundshare for a month, do it properly', outcome: 'It is expensive and disruptive and it never floods again. He is not there to see the third season of it.', effect: { coins: -380, boardMood: -2, prestige: 2, clubLegacy: { kind: 'tradition', label: 'the winter the drains were dug up' } } },
          { id: 'patch', label: 'Sand it and pray for March', desc: 'Cheap, temporary, gets them to spring', outcome: 'Two more postponements and a fixture pile-up in April that costs more points than the money would have.', effect: { coins: -70, squadMorale: -5, boardMood: 1 } },
          { id: 'use', label: 'Use the backlog', desc: 'Rest the legs now, take the games in a block later', outcome: 'The squad are the freshest in the division in February and the most beaten-up in May. There are eight games in twenty-four days.', effect: { squadMorale: 5, boardMood: -1, tag: 'mgr-p08-took-the-backlog' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-painkillers', title: 'What Is In The Medical Bag', icon: '💊', category: 'crisis',
    when: { minSeason: 3, minPos: 0.65 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two players have been taking anti-inflammatories to get through games all season. It is legal. It is also six weeks running for one of them and the physio has raised it twice, in writing.',
        choices: [
          { id: 'stop', label: 'Stop it', desc: 'Both of them out until they are actually fit', outcome: 'The side is worse for six weeks and both men are available in April, which is when it matters and which nobody will connect.', effect: { squadMorale: -5, boardMood: -2, prestige: 2, tag: 'mgr-p08-stopped-the-tablets' } },
          { id: 'continue', label: 'Let it run to the end of the season', desc: 'They want to play. It is legal. It is April in eight weeks', outcome: 'They get to May. One of them has a problem in that knee for the rest of his career and never once blames anybody.', effect: { squadMorale: 4, boardMood: 2, playerMorale: { who: 'best', delta: -10 }, prestige: -2 } },
          { id: 'one', label: 'Stop one, allow the other', desc: 'The younger one comes out. The thirty-four-year-old chooses', outcome: 'The distinction is defensible and impossible to explain to the man it goes against. He hears about it in the treatment room within a day.', effect: { playerMorale: { who: 'youngest', delta: -8 }, squadMorale: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-agent-in-the-car-park', title: 'He Is Waiting Outside', icon: '🕴️', category: 'crisis',
    when: { minSeason: 2, minPos: 0.6, needs: 'unhappy-player' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An agent has been in the training-ground car park three days running. He is not doing anything. He waves. Two of his clients are in the building and one of them has stopped looking at the manager in meetings.',
        choices: [
          { id: 'ban', label: 'Have him removed and banned', desc: 'The gate, the list, the police if necessary', outcome: 'He is gone by Thursday and his clients are dealt with by phone from a hotel instead. The problem moves rooms and gets no smaller.', effect: { prestige: 1, playerMorale: { who: 'unhappiest', delta: -8 }, squadMorale: -2 } },
          { id: 'invite', label: 'Invite him in for a coffee', desc: 'Better inside than in the car park', outcome: 'Ninety minutes. He is charming and useful and by the end of it he has learned three things about the squad he did not know.', effect: { prestige: -1, coins: 60, tag: 'mgr-p08-let-the-agent-in' } },
          { id: 'player', label: 'Deal with the player instead', desc: 'Ignore the man in the car park entirely', outcome: 'One long conversation that gets to the actual problem, which is not money. The agent stops coming when there is nothing to wait for.', effect: { playerMorale: { who: 'unhappiest', delta: 14 }, squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-tackle-in-training', title: 'One Of Their Own Did It', icon: '💥', category: 'crisis',
    when: { minSeason: 2, minPos: 0.55 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The centre-half went through the winger on Thursday. Not malicious, not necessary either. Six weeks. They are room-mates on away trips and one of them has not said a word since.',
        choices: [
          { id: 'punish', label: 'Fine and drop the defender', desc: 'Make it clear what training is for', outcome: 'The message is heard. The intensity comes out of the sessions for a month and the Saturdays get slower with it.', effect: { playerMorale: { who: 'best', delta: -12 }, squadMorale: -3, coins: 60, prestige: 1 } },
          { id: 'nothing', label: 'Call it football', desc: 'No fine, no meeting, next drill', outcome: 'It is the right principle. The injured lad’s father rings the club twice and neither call reaches the manager.', effect: { squadMorale: 2, playerMorale: { who: 'unhappiest', delta: -10 } } },
          { id: 'sit', label: 'Put the two of them in a room', desc: 'And leave them there', outcome: 'Twenty minutes and they come out fine. The defender drives him to two hospital appointments and never mentions it to anybody.', effect: { squadMorale: 6, prestige: 1, tag: 'mgr-p08-put-them-in-a-room' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-flight-cancelled', title: 'Everything Grounded', icon: '🛫', category: 'crisis',
    when: { minSeason: 3, minPos: 0.5, maxTier: 4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fog. Nothing is flying and the game is in twenty-six hours, four hundred and eighty miles away. There is a coach available and a train with no seats reserved.',
        choices: [
          { id: 'coach', label: 'Nine hours on a coach', desc: 'Leave at four, arrive at one in the morning', outcome: 'Legs like concrete and a squad who arrived together. They are two down at half-time and level at the end.', effect: { squadMorale: 3, coins: -70, boardMood: -1 } },
          { id: 'train', label: 'Put them on the train', desc: 'Standing where necessary, kit by van', outcome: 'Photographs of two internationals sitting on the floor by a luggage rack go everywhere. Everybody loves it except the two internationals.', effect: { prestige: 1, squadMorale: -4, coins: -40 } },
          { id: 'postpone', label: 'Ask for a postponement', desc: 'They cannot physically get there properly', outcome: 'Refused, and it takes four hours of phone calls to be refused. They set off at eight at night having wasted the day.', effect: { squadMorale: -6, boardMood: -1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-star-has-lost-it', title: 'He Cannot Do It Any More', icon: '📉', category: 'crisis',
    when: { minSeason: 3, minPos: 0.6, needs: 'veteran' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best player at the club for six years is a yard short and he knows it. He is still first on the team sheet because of who he has been, and on Saturday he was substituted at half-time to spare him.',
        choices: [
          { id: 'tell', label: 'Tell him', desc: 'In the office, on a Monday, with the clips', outcome: 'He argues for ten minutes and then stops arguing. He asks whether he can still take the young ones for the finishing work, and he is very good at it.', effect: { playerMorale: { who: 'oldest', delta: -8 }, squadMorale: 4, prestige: 2, tag: 'mgr-p08-told-him-straight' } },
          { id: 'carry', label: 'Carry him to the summer', desc: 'Let him finish the season as a starter', outcome: 'Fourteen more games he should not have played and a testimonial atmosphere at the last one. It costs points and it is not nothing.', effect: { playerMorale: { who: 'oldest', delta: 12 }, squadMorale: -5, boardMood: -2 } },
          { id: 'quiet', label: 'Just stop picking him', desc: 'No conversation, no explanation', outcome: 'He works it out in a fortnight. Six years, and it ends with a team sheet on a wall, and he tells a reporter about it in September.', effect: { playerMorale: { who: 'oldest', delta: -18 }, squadMorale: -6, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-goal-difference', title: 'Minus Nineteen', icon: '🔢', category: 'crisis',
    when: { minSeason: 2, minPos: 0.7 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Level on points with the club above and nineteen goals worse off. With six to play, that is worth about a win, and there is nothing to be done about it except win two more games than seems likely.',
        choices: [
          { id: 'attack', label: 'Chase goals', desc: 'Two up front from here to the end', outcome: 'They score more and concede more. The difference closes by four and the points column does not move for a fortnight.', effect: { squadMorale: 4, boardMood: -1, prestige: 1 } },
          { id: 'grind', label: 'Win ugly', desc: 'One-nil is worth the same as four-nil', outcome: 'Three clean sheets in five and two of them are goalless. It is horrible to watch and it very nearly works.', effect: { squadMorale: -3, prestige: 1, boardMood: 1, tag: 'mgr-p08-ground-it-out' } },
          { id: 'honest', label: 'Tell the squad what the number means', desc: 'Put it on the board and leave it up', outcome: 'Nobody in that room is under any illusions for six weeks. Two of them find it clarifying and one of them finds it unbearable.', effect: { squadMorale: -4, prestige: 2, playerMorale: { who: 'unhappiest', delta: -8 } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-training-ground-lease', title: 'They Want The Pitches Back', icon: '🚜', category: 'crisis',
    when: { minSeason: 4, minPos: 0.5, maxCoins: 350 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The training ground is council land on a lease that has been rolling over since 1991. The council want it back for housing and have given twelve months. There is nowhere else within nine miles.',
        choices: [
          { id: 'fight', label: 'Fight it in public', desc: 'The town, the paper, a petition, a meeting', outcome: 'Four hundred people at a meeting in a school hall and a two-year stay of execution. Nothing is solved and everybody has met each other now.', effect: { prestige: 2, boardMood: -1, tag: 'mgr-p08-fought-the-council' } },
          { id: 'buy', label: 'Find land and buy it', desc: 'Whatever it takes out of the football budget', outcome: 'Twenty-two acres of it, badly drained, eleven miles out. It is theirs and it is a decade before it is any good.', effect: { coins: -420, boardMood: -2, prestige: 1, clubLegacy: { kind: 'tradition', label: 'the land the club finally owned' } } },
          { id: 'share', label: 'Move in with a rugby club', desc: 'Two pitches, shared changing, a real saving', outcome: 'It works and it is humiliating and both of those things are true every single morning for two years.', effect: { coins: 120, squadMorale: -7, boardMood: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-fixture-block', title: 'Eight In Twenty-Four Days', icon: '🗓️', category: 'crisis',
    when: { minSeason: 2, minPos: 0.6, needs: 'thin-squad' }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The postponements have all landed in the same month. Eight games in twenty-four days with fifteen fit senior players and one of those is a goalkeeper.',
        choices: [
          { id: 'rotate', label: 'Rotate hard', desc: 'Nobody plays more than five of the eight', outcome: 'Two of the youngsters are out of their depth in different ways. They take eleven points from twenty-four and everybody finishes standing up.', effect: { squadMorale: 4, playerMorale: { who: 'youngest', delta: 10 }, boardMood: -1 } },
          { id: 'same', label: 'Play the strongest side every time', desc: 'Eight games, one team, get through it', outcome: 'Thirteen points from twenty-one and then two hamstrings in the last game. April is played with children.', effect: { squadMorale: -7, boardMood: 2, tag: 'mgr-p08-ran-them-into-the-ground' } },
          { id: 'sacrifice', label: 'Write off two of the eight', desc: 'Pick the two, tell nobody, rest everybody', outcome: 'They lose both and win four of the other six. A supporter works out what he did and puts it online and it is not received well.', effect: { squadMorale: 3, prestige: -2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-two-players-fell-out', title: 'They Will Not Be In The Same Room', icon: '🧊', category: 'crisis',
    when: { minSeason: 2, minPos: 0.55, needs: 'big-squad' }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two of them have fallen out over something that happened away from the club. Neither will say what. They are the two best players in the side and they have not passed to each other in three games.',
        choices: [
          { id: 'sell', label: 'Move one of them on in January', desc: 'Decide which, and do it', outcome: 'The side is worse and the room is lighter. Within a month nobody mentions either the row or the player who went.', effect: { coins: 340, squadMorale: 5, playerMorale: { who: 'best', delta: -10 }, boardMood: 1 } },
          { id: 'force', label: 'Force them to work together', desc: 'Same drills, same hotel room, all season', outcome: 'It is unpleasant for five weeks and then it is not. They never become friends and by March they are a partnership again.', effect: { squadMorale: -4, prestige: 2, tag: 'mgr-p08-forced-it' } },
          { id: 'around', label: 'Build the side so they never overlap', desc: 'One left, one right, and a screen between them', outcome: 'Tactically ingenious and slightly absurd. It works for two months and everybody in the building can see what he has done.', effect: { squadMorale: 2, prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-evacuation', title: 'The Ground Is Cleared', icon: '🚧', category: 'crisis',
    when: { minSeason: 3, minPos: 0.5 }, weight: 2, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A package by the north-west turnstiles. The ground is cleared at ten past two and eleven thousand people are standing in the streets around it in the cold. It is nothing. It takes two hours to be nothing.',
        choices: [
          { id: 'play', label: 'Play at half four', desc: 'Get them back in and get it on', outcome: 'A flat, strange game in front of a crowd that never settles. It is the right decision and nobody enjoys a minute of it.', effect: { squadMorale: -4, boardMood: 2, coins: 90 } },
          { id: 'off', label: 'Call it off', desc: 'Nobody is in a state to play or watch', outcome: 'Refunds, a rearranged Tuesday, and eleven thousand people who get to go home. The club loses money and no one argues with him.', effect: { coins: -180, squadMorale: 4, prestige: 1 } },
          { id: 'street', label: 'Take the players out to the supporters', desc: 'Into the street, while they wait', outcome: 'Twenty footballers and eleven thousand people standing about on a main road for an hour. It is the warmest the club feels all season.', effect: { squadMorale: 6, prestige: 2, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the afternoon on the main road' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-penalties-out', title: 'Out On Penalties', icon: '🎯', category: 'crisis',
    when: { minSeason: 2, minPos: 0.4 }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Out of the cup on penalties, at home, to a side from below them. The one who missed is twenty and had asked to take it. He is in the corner of the dressing room and will not lift his head.',
        choices: [
          { id: 'public', label: 'Praise him publicly', desc: 'Name him, say he was brave to ask', outcome: 'It is the right thing and it puts his name in every report of the defeat. He does not volunteer again for two years.', effect: { playerMorale: { who: 'youngest', delta: 10 }, prestige: 1, squadMorale: 3 } },
          { id: 'takers', label: 'Never let a young one take one again', desc: 'Seniors only, from now on, written down', outcome: 'Sensible and safe and it teaches the whole under-21 group something he did not intend to teach them.', effect: { squadMorale: -3, boardMood: 1, prestige: -1 } },
          { id: 'practice', label: 'Make the whole squad take them every Friday', desc: 'All season, in front of everybody, from now on', outcome: 'Tedious and unpopular and by April there are eight men who genuinely want the ball. Two shoot-outs, two wins, no explanation given.', effect: { squadMorale: -2, prestige: 2, tag: 'mgr-p08-friday-penalties' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-his-own-house', title: 'Something At Home', icon: '🏡', category: 'crisis',
    when: { minSeason: 4, minPos: 0.55 }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His father is ill, two hundred miles away, and it is the kind of ill where there is a number of weeks. He has told nobody at the club. There are nine games left.',
        choices: [
          { id: 'tell', label: 'Tell the chairman and take the time', desc: 'Whatever the club decides to do about it', outcome: 'They are decent about it and the assistant takes three games. He is at the bedside for the last fortnight and he never regrets a day of it.', effect: { boardMood: 1, prestige: -1, squadMorale: -3, tag: 'mgr-p08-took-the-time' } },
          { id: 'both', label: 'Try to do both', desc: 'Drive down and back twice a week, tell nobody', outcome: 'Nine thousand miles in five weeks. He is at the ground every morning and he is not really there for any of it.', effect: { squadMorale: -6, boardMood: -1, prestige: 1 } },
          { id: 'work', label: 'Bury himself in the season', desc: 'Go at the end of it, when there is time', outcome: 'They finish the nine games well. There is no end of the season for the thing he was waiting for and he knows that in April.', effect: { squadMorale: 5, boardMood: 2, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-supporters-turn-on-the-board', title: 'They Are Singing At The Directors’ Box', icon: '📣', category: 'crisis',
    when: { minSeason: 3, minPos: 0.75 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'For twenty minutes on Saturday the ground sang at the directors’ box and not one word of it was about the team or the manager. He was stood in front of it the whole time with his hands in his pockets.',
        choices: [
          { id: 'side', label: 'Side with the supporters', desc: 'Say they have every right, and say it Friday', outcome: 'It is honest and it is a resignation letter written in a different hand. He gets nine more games out of it and they are loud ones.', effect: { prestige: 3, boardMood: -3, squadMorale: 6, tag: 'mgr-p08-sided-with-the-terrace' } },
          { id: 'board', label: 'Defend the board', desc: 'They have kept this club going', outcome: 'It is largely true and it is heard as a man protecting his own job. The song has a new verse about him within a fortnight.', effect: { boardMood: 3, prestige: -2, squadMorale: -4 } },
          { id: 'football', label: 'Refuse to be part of it', desc: 'Talk about the football and only the football', outcome: 'Three questions, three answers about the left-back. The room gives up and the story runs without him, which is what he wanted.', effect: { boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-late-equaliser-run', title: 'Four Times In Six Weeks', icon: '⏱️', category: 'crisis',
    when: { minSeason: 2, minPos: 0.6 }, temper: ['tactician', 'firefighter', 'players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four times in six weeks they have led into the last ten minutes and taken one point instead of three. Eight points. It is the difference between where they are and where they should be.',
        choices: [
          { id: 'fitness', label: 'Treat it as legs', desc: 'Change the week, change the loading', outcome: 'The data says they are not running less at the end. He changes it anyway and it happens twice more before it stops.', effect: { squadMorale: -3, coins: -60, boardMood: -1 } },
          { id: 'heads', label: 'Treat it as heads', desc: 'Talk about the last ten minutes every single day', outcome: 'By naming it he makes the eighty-first minute the loudest thing in the ground. It is fixed by February and it took the whole club to do it.', effect: { squadMorale: 5, prestige: 2, tag: 'mgr-p08-fixed-the-endings' } },
          { id: 'sub', label: 'Change the substitutions', desc: 'Defenders on at eighty, every time, no exceptions', outcome: 'It stops the goals and stops the wins. Three of the next four are draws in which they never look like scoring again.', effect: { boardMood: -1, squadMorale: -2, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p08-youngster-not-coping', title: 'He Is Not Coping', icon: '🫥', category: 'crisis',
    when: { minSeason: 2, minPos: 0.5, needs: 'wonderkid', facility: { key: 'dorm', min: 2 } }, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The eighteen-year-old has played nineteen games this season and he is not sleeping. His landlady rang the club. He has been first to training every morning and he is not eating with the rest of them.',
        choices: [
          { id: 'out', label: 'Take him out of the side', desc: 'Six weeks, no explanation in public', outcome: 'He sleeps. He also spends six weeks certain his career is over, and it takes the whole of the summer to undo that.', effect: { playerMorale: { who: 'youngest', delta: -6 }, squadMorale: -2, boardMood: -1 } },
          { id: 'support', label: 'Put people round him', desc: 'A senior player, a psychologist, his mother in the stand', outcome: 'It costs money the board query and it works slowly. He plays the last nine games and one of them is the best of his life.', effect: { coins: -110, playerMorale: { who: 'youngest', delta: 16 }, prestige: 1, tag: 'mgr-p08-put-people-round-him' } },
          { id: 'home', label: 'Send him home for a fortnight', desc: 'His actual home, two hundred miles away', outcome: 'He comes back lighter. It is mentioned in one paper as a mystery absence and the speculation is worse than the truth.', effect: { playerMorale: { who: 'youngest', delta: 10 }, squadMorale: 2, boardMood: -1 } },
        ],
      },
    },
  },
];
