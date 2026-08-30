// Manager-arc authoring pack 10. ONE author owns this file — nobody else writes to it.
// See shared/src/managerarc.ts for the ManagerArc shape, the situation gates and the effect vocabulary.
//
// This pack carries the thing the other nine packs walked past: the manager has a life. A wife who has moved
// house three times for him, a father in the stand, a daughter at the club’s own academy, a chest that has
// been tight since October and a diary with an anniversary in the middle of eight games in twenty-four days.
// Those arcs sit in `media` and `boardroom` and gate on `minSeason: 3`+, because none of it means anything
// until he has been there long enough to have lost something to the job. The rest is the press room and the
// window: transfer arcs gate on money and on the squad actually containing the player they are about, crisis
// arcs on the club genuinely being in trouble.
import type { ManagerArc } from '../managerarc.js';

export const MGR_ARCS_10: ManagerArc[] = [
  // ── MEDIA ────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p10-supermarket', title: 'Aisle Six, Half Nine', icon: '🛒', category: 'media',
    when: { minSeason: 3, minPos: 0.5 }, temper: ['disciplinarian', 'players-manager', 'firefighter'], weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is buying milk and a birthday card at half nine on a Sunday night. A man in a work coat blocks the trolley and starts on the second half. He is not drunk. That is the part that stays with him.',
        choices: [
          { id: 'stand', label: 'Stand there and take it', desc: 'Let him finish. He has paid for a seat', outcome: 'Six minutes. Somebody films the last of it on a phone and the clip is fourteen seconds long and shows only the manager, saying nothing, holding milk.', effect: { prestige: 1, squadMorale: -2, tag: 'mgr-p10-took-it-in-the-shop' } },
          { id: 'answer', label: 'Answer him properly', desc: 'Shape, substitutions, why the lad came off', outcome: 'The man listens, agrees with most of it, and tells four people at work that the manager talked to him for ten minutes. He tells the fifth what the manager admitted about the full-back.', effect: { prestige: 2, boardMood: -2 } },
          { id: 'walk', label: 'Leave the trolley and go', desc: 'Out through the doors, card unbought', outcome: 'The trolley is still in aisle six on Monday morning and somebody has put a photograph of it online. He does his own shopping at seven in the morning for the next four years.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-father-in-the-stand', title: 'Row H', icon: '🎟️', category: 'media',
    when: { minSeason: 3 }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His father has come. He is eighty-one and he sits in row H with a flask because he will not use the box, and he has never once said whether he thought the team played well.',
        choices: [
          { id: 'box', label: 'Put him in the directors’ box anyway', desc: 'Warm, comfortable, a plate of something', outcome: 'He goes, and hates it, and is polite to everybody for two hours. On the way out he says the pies were nice. It is the only thing he says all day.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'leave', label: 'Leave him in row H', desc: 'It is where he wants to be', outcome: 'A steward tells the manager afterwards that the old man stood up for the equaliser. He was ninety minutes away and did not see it and never will.', effect: { prestige: 1, squadMorale: 2, tag: 'mgr-p10-father-comes' } },
          { id: 'after', label: 'Take him into the dressing room after', desc: 'Show him the job, once', outcome: 'The players are very good with him. He shakes eleven hands and looks at the floor and in the car park he asks whether they are paid weekly or monthly.', effect: { squadMorale: 5, prestige: -1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-anniversary', title: 'Eight Games, One Date', icon: '💐', category: 'media',
    when: { minSeason: 4 }, temper: ['players-manager', 'builder', 'tactician'], weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twenty-five years married falls on the Thursday between the Tuesday and the Saturday. There are eight games in twenty-four days. She has not asked for anything and has not mentioned the date once, which is how he knows.',
        choices: [
          { id: 'go', label: 'Give the Thursday away', desc: 'Assistant takes it. Phone in a drawer', outcome: 'They are back in the same restaurant as the first time and it has changed hands twice. He is present for all of it. The Saturday is a nil-nil and the first question is about the shape.', effect: { squadMorale: -3, boardMood: -1, prestige: -1, tag: 'mgr-p10-took-the-thursday' } },
          { id: 'split', label: 'Two hours in the middle of it', desc: 'Lunch, back for the afternoon session', outcome: 'She is kind about it. He is on the phone twice before the pudding and neither call matters and he takes both anyway.', effect: { squadMorale: 2 } },
          { id: 'work', label: 'Work the day', desc: 'Move it to June, when there is nothing on', outcome: 'June comes and there is a tribunal, a medical and a rebuild. She has stopped putting it in the diary. It is not a row. There is never a row.', effect: { squadMorale: 5, boardMood: 1, prestige: 1, tag: 'mgr-p10-moved-it-to-june' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-not-watched-a-game', title: 'For Nothing', icon: '📺', category: 'media',
    when: { minSeason: 5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boy on work experience asks him what the last game was that he watched just to watch it. He starts to answer and finds nothing there. Every match for a year has been a report, an opponent or a player he might sign.',
        choices: [
          { id: 'sunday', label: 'Go and stand on a park touchline', desc: 'Sunday, under-11s, no notebook', outcome: 'Two hours in the rain watching nothing of any use to anybody. It is the best he has felt since August, and a local reporter photographs him there and asks who he is scouting.', effect: { prestige: -1, squadMorale: 3, tag: 'mgr-p10-went-to-the-park' } },
          { id: 'say-it', label: 'Say it out loud in the press room', desc: 'Honestly, when somebody asks about pressure', outcome: 'It runs on the back page as a manager admitting he has fallen out of love with the game. Three of his players read it before training.', effect: { prestige: 2, squadMorale: -5, boardMood: -2 } },
          { id: 'nothing', label: 'Tell the boy a match from nine years ago', desc: 'Name one, move on, get to the meeting', outcome: 'The boy writes it down like it means something. The manager watches four full games that week and takes notes on all of them.', effect: { boardMood: 1, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-old-club-singing', title: 'They Sang It At The Away End', icon: '🧣', category: 'media',
    when: { minSeason: 5, maxPos: 0.7 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The away support are from a club he managed for three years and left badly. In the sixty-fourth minute, two down and going nowhere, they sing his name. All of it. Twice.',
        choices: [
          { id: 'nothing', label: 'Do nothing at all', desc: 'Eyes on the pitch, hands in pockets', outcome: 'It dies out after a minute. He thinks about it on the coach and at three in the morning and on the following Tuesday, and never mentions it to anyone.', effect: { prestige: 1, squadMorale: -2 } },
          { id: 'clap', label: 'Turn and applaud them', desc: 'In front of his own supporters', outcome: 'The away end goes up. His own end does not, and a section of it remembers it in April when things are bad.', effect: { prestige: 2, boardMood: -2, squadMorale: -3, tag: 'mgr-p10-clapped-the-away-end' } },
          { id: 'after', label: 'Mention it afterwards, properly', desc: 'Say what those three years were', outcome: 'Four honest minutes about a club that is not this one. It is written up warmly everywhere except the town he currently works in.', effect: { prestige: 3, boardMood: -1, clubLegacy: { kind: 'reputation', label: 'the manager two towns claim' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-school-gates', title: 'The Gates At Twenty Past Three', icon: '🎒', category: 'media',
    when: { minSeason: 4 }, temper: ['builder', 'players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His daughter has been getting it at school. Nothing serious and nothing that stops. Somebody’s dad has a strong view about the substitutions and his daughter is eleven and hears the strong view secondhand every Monday.',
        choices: [
          { id: 'collect', label: 'Do the school run himself for a fortnight', desc: 'Stand at the gates. Be a man, not a manager', outcome: 'It stops within four days, because it is much harder to say to a face. He misses six sessions and the assistant runs them better than expected, which is its own problem.', effect: { squadMorale: -3, prestige: 1, tag: 'mgr-p10-did-the-school-run' } },
          { id: 'school', label: 'Ring the school', desc: 'Quietly, through the proper channel', outcome: 'They handle it well and tell the other parent, who tells the pub. It is in a supporters’ forum by Thursday under a heading about being precious.', effect: { prestige: -2, boardMood: 1 } },
          { id: 'toughen', label: 'Tell her it comes with the surname', desc: 'She will hear worse. Better she hears it from him', outcome: 'She takes it on the chin, which is what he asked for. She also stops telling him things, which is not, and he does not notice for two years.', effect: { boardMood: 1, squadMorale: 2, prestige: -1, tag: 'mgr-p10-told-her-to-take-it' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-his-hands-on-television', title: 'A Close-Up At Sixty-One', icon: '🎥', category: 'media',
    when: { minSeason: 5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The highlights hold on him for four seconds during the second goal. He does not recognise the man in the technical area. Grey at the sides, heavier through the face, and the hands are his father’s hands.',
        choices: [
          { id: 'ignore', label: 'Turn it off and go to bed', desc: 'It is a camera angle and a bad light', outcome: 'He is up at five anyway. On Thursday he asks the fitness coach, casually, what the staff do about their own conditioning, and gets a long and enthusiastic answer.', effect: { prestige: 1 } },
          { id: 'change', label: 'Do something about it', desc: 'The gym at six, before the players are in', outcome: 'Eleven weeks of it and he feels better than he has in five years. Two of the senior lads start coming in early too, and one of them is doing it to be seen.', effect: { squadMorale: 4, boardMood: 1, prestige: -1, tag: 'mgr-p10-in-at-six' } },
          { id: 'joke', label: 'Make a joke of it on the Friday', desc: 'Get in front of it before anybody else does', outcome: 'It gets a laugh and a warm little piece in the Sunday paper. From then on the cameras find him more often, because they know he will not mind.', effect: { prestige: 2, boardMood: -1, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-wife-in-the-column', title: 'She Is In The Second Paragraph', icon: '📰', category: 'media',
    when: { minSeason: 4, minPos: 0.55 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A columnist has written about the pressure on him and has put his wife in it. Where she is from, what she does, the fact that she was at the last home game and did not stay to the end. None of it is untrue.',
        choices: [
          { id: 'legal', label: 'Put the club’s solicitor on it', desc: 'A letter, on paper, by Monday', outcome: 'The paper prints nothing further and prints nothing warm about him again either. The letter costs money nobody had allocated.', effect: { coins: -90, prestige: 1, boardMood: -1, tag: 'mgr-p10-lawyered-the-column' } },
          { id: 'ban', label: 'Pull his accreditation', desc: 'He does not come to this ground any more', outcome: 'Every other writer in the room closes ranks within a week. He gets a fortnight of quiet questions and a year of cold ones.', effect: { prestige: -2, boardMood: -2, squadMorale: 3 } },
          { id: 'nothing', label: 'Say nothing and eat it', desc: 'Anything he says keeps it alive another week', outcome: 'It dies by Wednesday, exactly as he predicted. She cuts it out and keeps it, which he finds in a drawer eighteen months later and does not ask about.', effect: { prestige: 1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-old-manager-died', title: 'The Man Who Gave Him His Debut', icon: '🕯️', category: 'media',
    when: { minSeason: 3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager who put him in at seventeen died on Wednesday night. By Thursday morning four broadcasters want him and the funeral is on a Saturday with a home game on it.',
        choices: [
          { id: 'speak', label: 'Do all of it', desc: 'Every interview, the full story, properly told', outcome: 'He is superb and it takes everything he has. He is no use to anybody at training on Friday and the players notice and say nothing.', effect: { prestige: 3, squadMorale: -3 } },
          { id: 'funeral', label: 'Go to the funeral and miss the game', desc: 'Two hundred miles, back for the last twenty minutes', outcome: 'He gets there for the second half of a game he has not prepared. Nobody in the building says a word against it and one director says several, elsewhere.', effect: { boardMood: -2, prestige: 2, squadMorale: 4, tag: 'mgr-p10-went-to-the-funeral' } },
          { id: 'brief', label: 'One statement, then nothing', desc: 'Six lines through the club, and work', outcome: 'It is a good six lines. He watches the coverage in an empty office with the sound off and is back on the grass at ten.', effect: { boardMood: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-press-officer-goes', title: 'She Has Handed Her Notice In', icon: '🗂️', category: 'media',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The press officer has resigned in January. She has stood between him and about four hundred bad afternoons and she is going to a club with a communications department of nine.',
        choices: [
          { id: 'match', label: 'Get the board to match it', desc: 'Go upstairs today and make a fuss', outcome: 'They find two thirds of it and she stays for a year out of loyalty. Everyone in that office now knows exactly what a fuss is worth.', effect: { coins: -160, boardMood: -2, prestige: 1, tag: 'mgr-p10-kept-the-press-officer' } },
          { id: 'let-go', label: 'Let her go well', desc: 'A reference, a send-off, no guilt', outcome: 'The replacement is twenty-four and keen and puts him in front of a microphone eleven minutes after a five-nil.', effect: { prestige: -2, boardMood: 1, squadMorale: -2 } },
          { id: 'himself', label: 'Do the media himself for the rest of the season', desc: 'No buffer, no post, save the wage', outcome: 'He is better at it than expected and it eats a morning a week. In April he says something on a Friday that he would have been talked out of on a Thursday.', effect: { coins: 140, prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-embargo-broken', title: 'It Was For The Sunday', icon: '⏱️', category: 'media',
    when: { minSeason: 2 }, temper: ['disciplinarian', 'tactician', 'firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A reporter three months into the job has run the injury on the Friday night. It was given for the Sunday. It is the kind of mistake a young man makes once and the opposition manager reads it on the Saturday morning.',
        choices: [
          { id: 'ban', label: 'Bar him from the building', desc: 'The rule exists or it does not', outcome: 'His paper moves him off football within a month. The room learns the lesson and something goes cold in it that does not warm back up.', effect: { prestige: 1, boardMood: 1, squadMorale: -1, tag: 'mgr-p10-barred-a-reporter' } },
          { id: 'quiet', label: 'Take him aside and frighten him', desc: 'Ten minutes, no witnesses, no ban', outcome: 'He apologises properly and never does it again and is the one who rings the manager first, four years later, when the sack is coming.', effect: { prestige: 1, boardMood: -1 } },
          { id: 'use', label: 'Use it', desc: 'Owe him nothing, feed him a story he wants out', outcome: 'It works twice. The second time the story is about a player’s future and the player finds out where it came from.', effect: { playerMorale: { who: 'unhappiest', delta: -12 }, prestige: -1, boardMood: 2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-charity-requests', title: 'The Fifth One This Month', icon: '✉️', category: 'media',
    when: { minSeason: 3, minCoins: 120 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Another letter. A hospice, a school roof, a lad in the town who needs a wheelchair. All of them real and all of them addressed to him personally, and there is no system for any of it.',
        choices: [
          { id: 'system', label: 'Build a proper system', desc: 'A committee, a budget, one refusal letter', outcome: 'It is fair, it is defensible and it is cold. The next time a family gets a no it comes on club paper and there is nobody to shout at.', effect: { coins: -70, boardMood: 2, prestige: -1, tag: 'mgr-p10-charity-committee' } },
          { id: 'all', label: 'Say yes to all five', desc: 'Personally, out of his own week', outcome: 'Five visits in eleven days and one of them he will not talk about afterwards. The word gets round and there are nineteen letters the following month.', effect: { coins: -110, prestige: 3, squadMorale: -2, clubLegacy: { kind: 'tradition', label: 'the manager who answered the letters' } } },
          { id: 'players', label: 'Give them to the players', desc: 'Two each, in pairs, no cameras', outcome: 'The senior men are magnificent. Two of the young lads treat it as an afternoon off and one of them is photographed on his phone the whole way round.', effect: { squadMorale: 4, prestige: 1, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-obituary-call', title: 'They Are Writing It Early', icon: '📇', category: 'media',
    when: { minSeason: 3, needs: 'veteran' }, weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A national rings for warm words about a former player of the club. He is not dead. He is ill, and they are getting the file ready, and they say so in the same tone they would use to book a table.',
        choices: [
          { id: 'give', label: 'Give them four good sentences', desc: 'They will run it whatever he does', outcome: 'They are the best four sentences anybody will say about the man and they sit in a file for two years. He has to shake the man’s hand at a dinner in between.', effect: { prestige: 1, squadMorale: -2 } },
          { id: 'refuse', label: 'Refuse and tell them what he thinks of it', desc: 'On the phone, at length, unrecorded', outcome: 'The paper runs the piece with a line noting that the manager declined to comment. It reads worse than anything he could have said.', effect: { prestige: -1, boardMood: -1, tag: 'mgr-p10-refused-the-obituary' } },
          { id: 'tell-him', label: 'Ring the old player first', desc: 'Tell him what has been asked, then decide together', outcome: 'The old man laughs for a long time and dictates his own quote. It is filthy and unusable and the manager keeps it written on a card.', effect: { prestige: 2, playerMorale: { who: 'oldest', delta: 10 }, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-fan-channel-gate', title: 'The Camera At The Gate', icon: '📱', category: 'media',
    when: { minSeason: 3, minPos: 0.45 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two lads with a camera stand at the training ground entrance most mornings now. They are polite, they have thirty thousand people watching them, and they ask every player through the window whether the manager has lost the dressing room.',
        choices: [
          { id: 'invite', label: 'Bring them in for an hour', desc: 'Sit down, let them ask it to his face', outcome: 'He is good and they are fair and the numbers are enormous. Now every question he takes in the proper press room has already been asked somewhere better.', effect: { prestige: 2, boardMood: -2, tag: 'mgr-p10-did-the-fan-channel' } },
          { id: 'move', label: 'Move the players in through the back', desc: 'A different gate, no announcement', outcome: 'It works for nine days. The video of the new gate arrangement is the most watched thing they have ever made.', effect: { prestige: -1, boardMood: 1, squadMorale: 2 } },
          { id: 'ignore', label: 'Leave it alone', desc: 'It is a public road and a free country', outcome: 'The senior men handle it and the young ones do not. One nineteen-year-old says eleven words in February that follow him for the rest of his career here.', effect: { playerMorale: { who: 'youngest', delta: -14 }, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-award-while-losing', title: 'A Dinner In March', icon: '🏆', category: 'media',
    when: { minSeason: 4, minPos: 0.55 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The regional writers have voted him a service award. Twenty years in the game, black tie, a Thursday in March. The team have won twice since Boxing Day.',
        choices: [
          { id: 'go', label: 'Go and take it', desc: 'A suit, a speech, a photograph', outcome: 'The photograph of him holding a trophy runs beside a league table on the Friday and somebody in the away end has it on a banner by April.', effect: { prestige: 2, boardMood: -2, squadMorale: -3, tag: 'mgr-p10-took-the-award' } },
          { id: 'decline', label: 'Decline it until the summer', desc: 'Not while it looks like that', outcome: 'The writers understand and print that he understands. The award is presented in June to a much smaller room and it means less to everybody, including him.', effect: { prestige: 1, boardMood: 1 } },
          { id: 'send', label: 'Send the kit man in his place', desc: 'Forty years of service, one dinner', outcome: 'The old man makes a two-minute speech that the room stands up for. The manager watches a clip of it on a phone at eleven at night in an empty office.', effect: { prestige: 1, squadMorale: 6, boardMood: -1, clubLegacy: { kind: 'tradition', label: 'the night the kit man went instead' } } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-club-account-speaks-for-him', title: 'In His Voice', icon: '💬', category: 'media',
    when: { minSeason: 2 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club’s account has posted a quote from him about the supporters that he did not say. It is a nice quote. It is roughly what he thinks. Somebody in the commercial department wrote it on a Tuesday afternoon.',
        choices: [
          { id: 'stop', label: 'Stop it dead', desc: 'Nothing goes out in his name he has not said', outcome: 'The rule is written down and followed. The output drops by half and the commercial manager mentions the figure at every meeting for a year.', effect: { boardMood: -2, prestige: 1, tag: 'mgr-p10-owns-his-own-words' } },
          { id: 'allow', label: 'Let it go', desc: 'It is close enough and it is only a post', outcome: 'By November they are putting sentences about transfers in his mouth. He is asked about one at a press conference and has to guess what he apparently meant.', effect: { boardMood: 2, prestige: -2 } },
          { id: 'record', label: 'Give them ten real ones a week', desc: 'Sit down Monday, record, done', outcome: 'It takes twenty minutes and solves it entirely. It also means there is always something of his out there in a week he would rather have said nothing at all.', effect: { boardMood: 1, prestige: 1, squadMorale: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-kept-waiting', title: 'Kept In A Corridor', icon: '🚧', category: 'media',
    when: { minSeason: 2, minPos: 0.5 }, temper: ['chancer', 'firefighter', 'disciplinarian'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Four-nil. The broadcaster wants him last and it is now forty minutes since the whistle. He is stood in a breeze-block corridor next to a trolley of empty bottles being told it will be two more minutes for the third time.',
        choices: [
          { id: 'wait', label: 'Wait', desc: 'They pay for the rights. Stand there', outcome: 'Fifty-one minutes in the end. He is calm, flat and unusable, and the interviewer calls him a class act on the way out, which is what people say when nothing happened.', effect: { boardMood: 1, prestige: -1 } },
          { id: 'go', label: 'Walk to the coach', desc: 'The players are on it. So is his job', outcome: 'The broadcaster complains to the league and there is a fine with his name attached to it. The dressing room hears the version where he chose them.', effect: { coins: -120, squadMorale: 7, boardMood: -2, tag: 'mgr-p10-walked-out-on-the-cameras' } },
          { id: 'say-it', label: 'Do it and say how long he waited', desc: 'First sentence, on air, no heat', outcome: 'It is the only part of the interview anybody clips. He is a difficult man to work with by Tuesday and a man with a point by Thursday.', effect: { prestige: 2, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-old-teammate-on-air', title: 'He Is On The Panel Now', icon: '🎧', category: 'media',
    when: { minSeason: 4, minPos: 0.5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A man he shared a room with for four years on away trips has spent ninety seconds on television saying the team have no idea what they are doing. He is not wrong. He was best man at the wedding.',
        choices: [
          { id: 'ring', label: 'Ring him that night', desc: 'Not angry. Just ring him', outcome: 'They talk for an hour and forty and about eleven minutes of it is football. He says the same thing again three weeks later and the manager finds he minds less.', effect: { prestige: 1, squadMorale: -1, tag: 'mgr-p10-rang-the-old-mate' } },
          { id: 'public', label: 'Answer it publicly', desc: 'Name him. Ask what he ever won', outcome: 'It is the best line of his week and it is on every bulletin. The friendship does not survive it and neither man is able to say when exactly it ended.', effect: { prestige: 2, squadMorale: 4, boardMood: -2, tag: 'mgr-p10-burned-the-old-mate' } },
          { id: 'nothing', label: 'Nothing at all', desc: 'It is a job. He is doing his job', outcome: 'He is asked about it four times in one press conference and gives four versions of the same shrug. Somebody writes that he looked tired.', effect: { prestige: -1, boardMood: 1 } },
        ],
      },
    },
  },
  // ── BOARDROOM ────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p10-offer-he-cannot-mention', title: 'A Hotel Room He Cannot Mention', icon: '🤐', category: 'boardroom',
    when: { minSeason: 4, maxPos: 0.55 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He met two people from another club in a hotel off a motorway on Wednesday. Nobody knows. Not the chairman, not his assistant, not his wife, because telling her makes it a thing she has to carry through Christmas.',
        choices: [
          { id: 'tell-wife', label: 'Tell her first', desc: 'Before he decides anything', outcome: 'She asks one question about the schools and one about whether he actually wants it, and he cannot answer the second. They sit with it for three weeks.', effect: { prestige: 1, squadMorale: -2 }, next: 'after' },
          { id: 'tell-chairman', label: 'Tell the chairman', desc: 'Get it in the open and take the consequence', outcome: 'He respects it enormously and never fully trusts him again. Two directors are told within the hour, in confidence, separately.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-p10-declared-the-approach' }, next: 'after' },
          { id: 'nobody', label: 'Tell nobody', desc: 'It may come to nothing. Most of them do', outcome: 'He carries it alone for eleven days and takes a training session on the Friday that his assistant describes, much later, as the worst he ever saw him take.', effect: { squadMorale: -4, prestige: -1, tag: 'mgr-p10-carried-it-alone' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'They come back with a number and a date. It is more money than his father earned in a working life, and it is four hours from where his daughter goes to school.',
        choices: [
          { id: 'stay', label: 'Stay', desc: 'And never tell anyone what it cost', outcome: 'He takes training on the Monday and nobody knows anything happened. He is short with people for a month and puts it down to the fixtures.', effect: { boardMood: 2, squadMorale: 3, prestige: -1, tag: 'mgr-p10-stayed-quietly' } },
          { id: 'push', label: 'Use it upstairs without saying where it came from', desc: 'Ask for the budget. Do not explain why now', outcome: 'He gets some of it. The chairman knows exactly what has happened and lets him believe otherwise, which is a kind of generosity and also a debt.', effect: { coins: 380, boardMood: -1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-his-own-boy-in-the-academy', title: 'The Name On The Under-15 Sheet', icon: '👦', category: 'boardroom',
    when: { minSeason: 4 }, temper: ['builder', 'disciplinarian', 'players-manager'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His son is in the under-15s. He was taken on before anybody thought twice about the surname and he is, by the honest reckoning of two coaches, about the eighth best player in the group.',
        choices: [
          { id: 'release', label: 'Have him released with the rest', desc: 'Same meeting, same letter, same day', outcome: 'The boy is fifteen and does not speak to him properly until he is nineteen. Every coach in the building understands exactly what the standard is now.', effect: { prestige: 3, boardMood: 2, squadMorale: -2, tag: 'mgr-p10-released-his-own-son', clubLegacy: { kind: 'reputation', label: 'the academy that let the manager’s boy go' } } },
          { id: 'keep', label: 'Leave it to the academy staff and stay out', desc: 'Not his decision. Never was', outcome: 'They keep him a year, which nobody believes was independent, least of all the boy. He hears the word anyway, in a car park, in March.', effect: { boardMood: -1, prestige: -2 } },
          { id: 'move', label: 'Move him to another club himself', desc: 'Ring somebody. Get him a clean start', outcome: 'He is happier within a fortnight and plays every week. The manager sees him play eleven times in three years because the fixtures never fall right.', effect: { prestige: 1, squadMorale: 2, boardMood: 1, tag: 'mgr-p10-moved-his-boy-on' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-third-house', title: 'The Third House In Nine Years', icon: '🏠', category: 'boardroom',
    when: { minSeason: 5 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They are still in the rented place. Boxes in the garage from two clubs ago, pictures never hung, a garden somebody else cuts. She has found a house she likes and it needs a decision and a deposit.',
        choices: [
          { id: 'buy', label: 'Buy it', desc: 'Sign the papers. Live somewhere', outcome: 'She plants things that take four years. He looks at them on a Sunday in October and understands, for the first time, that being sacked would now cost more than a job.', effect: { coins: -220, squadMorale: 4, prestige: 1, tag: 'mgr-p10-bought-the-house' } },
          { id: 'rent', label: 'Another year of renting', desc: 'See where the club is in June', outcome: 'The garage stays full. It is the sensible call and it is the fourth time he has made it, and she says nothing at all about that.', effect: { coins: 90, squadMorale: -3 } },
          { id: 'club', label: 'Ask the club to help with it', desc: 'A relocation allowance, in the contract', outcome: 'They agree and it is written down and it appears, itemised, in the accounts a supporters’ group reads out at the AGM.', effect: { coins: 160, boardMood: -2, prestige: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-the-chest', title: 'Since October', icon: '🩺', category: 'boardroom',
    when: { minSeason: 4 }, weight: 4, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Something in his chest goes tight on the stairs at the training ground and has done since October. The club doctor is forty feet away and asks him twice a week how he is, and twice a week he says fine.',
        choices: [
          { id: 'tell', label: 'Tell the club doctor', desc: 'Today, in the medical room, with the door shut', outcome: 'Tests within a week and nothing that cannot be managed, and a note on a file that the insurers eventually see. He is told to stop doing three things and stops one.', effect: { boardMood: -2, prestige: 1, squadMorale: 2, tag: 'mgr-p10-saw-the-doctor' } },
          { id: 'outside', label: 'Go outside the club for it', desc: 'His own GP, his own time, nobody told', outcome: 'A Tuesday morning appointment forty miles away and a prescription in a coat pocket. He misses one session and says it was a family thing, which it was.', effect: { coins: -50, prestige: 1, tag: 'mgr-p10-hid-the-chest' } },
          { id: 'ignore', label: 'Get on with the season', desc: 'April. He will look at it in April', outcome: 'April comes and it is a run-in. It gets no worse and no better and he learns exactly which staircase to avoid.', effect: { squadMorale: 3, boardMood: 1, prestige: -1, tag: 'mgr-p10-left-it' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-old-teammate-needs-work', title: 'He Needs A Job', icon: '🧰', category: 'boardroom',
    when: { minSeason: 3, minCoins: 100 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A man he played with for six years is in the car park at half nine in the morning. Two divorces, a failed business, no badges and nothing since 2019. He gets to the point faster than either of them wants.',
        choices: [
          { id: 'staff', label: 'Find him something on the staff', desc: 'Kit, minibus, under-14s on a Tuesday', outcome: 'He is grateful and useless and everybody is kind about it. In February the manager has to have a conversation with him that ends a friendship of thirty years.', effect: { coins: -90, squadMorale: -2, prestige: -1, tag: 'mgr-p10-hired-the-old-mate' } },
          { id: 'money', label: 'Give him money and no job', desc: 'Out of his own pocket, no paperwork', outcome: 'He takes it badly and takes it. They do not speak for two years and then they do, at a funeral, and it is fine.', effect: { coins: -60, prestige: 1 } },
          { id: 'honest', label: 'Tell him no and tell him why', desc: 'In the car park, standing up, the whole truth', outcome: 'It is the hardest twenty minutes of his year. Eighteen months later the man has a job with a county association and rings to say the twenty minutes did it.', effect: { prestige: 2, boardMood: 1, squadMorale: -1, tag: 'mgr-p10-said-no-properly' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-wife-at-the-sponsors-dinner', title: 'A Table For Twelve', icon: '🍽️', category: 'boardroom',
    when: { minSeason: 3, minCoins: 150 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The commercial department would like his wife at the sponsors’ dinner. There is a seating plan with her on it already. She has been to four of these in nine years and has hated every one.',
        choices: [
          { id: 'ask', label: 'Ask her, honestly, and take the answer', desc: 'Including if the answer is no', outcome: 'She says no and means it. He goes alone and is asked where she is eleven times, and by the ninth he stops explaining.', effect: { boardMood: -1, prestige: 1 } },
          { id: 'push', label: 'Ask her to do it for him', desc: 'One night. It matters upstairs', outcome: 'She is charming for four hours and the sponsors renew. In the taxi she says nothing and he counts it as a win for eleven years.', effect: { coins: 260, boardMood: 2, squadMorale: -1, tag: 'mgr-p10-she-did-the-dinner' } },
          { id: 'refuse', label: 'Tell them she is not part of the deal', desc: 'To the commercial director, in writing', outcome: 'They take it out of the plan and take him out of two other things he would have enjoyed. The line, once drawn, is respected exactly.', effect: { boardMood: -2, prestige: 2, tag: 'mgr-p10-drew-the-line' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-licence-week', title: 'The Licence Renewal', icon: '📜', category: 'boardroom',
    when: { minSeason: 2 }, temper: ['tactician', 'builder', 'chancer'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His coaching licence needs renewing and the only course before the deadline is four days in a hotel in the middle of a run of three games. There is no exemption for being busy.',
        choices: [
          { id: 'go', label: 'Go, and hand the week over', desc: 'Assistant takes two of the three', outcome: 'The course is better than expected and he comes back with two ideas he uses for a decade. They take four points without him and somebody upstairs notices that too.', effect: { boardMood: -1, prestige: 2, squadMorale: 3, tag: 'mgr-p10-did-the-course' } },
          { id: 'defer', label: 'Get it deferred', desc: 'A letter from the club, an exception asked for', outcome: 'They allow it once, coldly. It is on his file and it is mentioned, lightly, the next time he applies for anything at all.', effect: { boardMood: 1, prestige: -2 } },
          { id: 'half', label: 'Drive back each night', desc: 'Four hundred miles a day, do both', outcome: 'He passes and he takes the games and he is asleep in a chair in the analysts’ room on the Thursday when two players walk in.', effect: { squadMorale: -3, prestige: 1, coins: -40 } },
        ],
      },
    },
  },
  // ── TRANSFER ─────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p10-family-will-not-move', title: 'She Has Seen The Town', icon: '🚗', category: 'transfer',
    when: { minSeason: 2, minCoins: 200 }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Everything is agreed. Fee, wages, medical booked. His wife came up on Tuesday, looked at the town for six hours and got back in the car, and now the agent is talking about the schools.',
        choices: [
          { id: 'sell-town', label: 'Sell the place himself', desc: 'A day out, the good streets, the two schools that work', outcome: 'It swings it. He signs, plays fifty-one games and is superb, and she is unhappy for every one of them and everyone in the building knows.', effect: { coins: -260, squadMorale: 3, prestige: 1, tag: 'mgr-p10-sold-the-town' } },
          { id: 'commute', label: 'Let him commute', desc: 'Digs in the week, home Saturday night', outcome: 'He does three hundred miles every weekend for a season. By March he is arriving on Mondays with nothing in his legs and it is nobody’s fault.', effect: { coins: -220, squadMorale: -2, playerMorale: { who: 'star', delta: -8 } } },
          { id: 'walk', label: 'Walk away from it', desc: 'A man who does not want to be here never is', outcome: 'The money goes on two lesser players who both want to be there. The one who got away scores twelve for somebody else and it is mentioned all season.', effect: { coins: 140, boardMood: -2, squadMorale: 2, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-medical-finds-something', title: 'Not The Knee They Scanned For', icon: '🧪', category: 'transfer',
    when: { minSeason: 2, minCoins: 180 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The medical was routine and the bloods were not. It has nothing to do with football, it is treatable, and the boy is twenty-three and does not know yet because the club doctor rang the manager first.',
        choices: [
          { id: 'tell-him', label: 'Tell him first, before anybody', desc: 'In a room, with the doctor, today', outcome: 'He is frightened and then relieved and then, three days later, signs anyway. He never tells the manager it mattered and never has to.', effect: { coins: -240, squadMorale: 5, prestige: 3, tag: 'mgr-p10-told-him-first', clubLegacy: { kind: 'reputation', label: 'a club that rings the player first' } } },
          { id: 'renegotiate', label: 'Use it on the fee', desc: 'The medical flagged something. Reduce the price', outcome: 'The selling club drop forty and the agent works out why within a fortnight. That agent has eleven players and none of them come here again.', effect: { coins: 130, prestige: -3, tag: 'mgr-p10-used-the-bloods' } },
          { id: 'walk', label: 'Fail the medical and say nothing more', desc: 'Standard, clean, no detail', outcome: 'He goes elsewhere and their doctor finds it in October, later than he should have. Nobody ever connects the two things except the manager.', effect: { coins: 200, boardMood: 1, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-sell-to-build', title: 'The Roof Or The Number Nine', icon: '🧱', category: 'transfer',
    when: { minSeason: 3, maxCoins: 350 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The main stand roof has a report on it with a number at the bottom. There is one player in the building worth that number and he is the reason eleven thousand people come.',
        choices: [
          { id: 'sell', label: 'Sell him and fix the roof', desc: 'Steel over sentiment', outcome: 'The roof is done by September and nobody ever cheers a roof. He is asked about it at every press conference until Christmas.', effect: { coins: 520, playerMorale: { who: 'star', delta: -20 }, squadMorale: -6, prestige: -2, tag: 'mgr-p10-sold-for-the-roof' } },
          { id: 'keep', label: 'Keep him and patch it', desc: 'Buckets, netting, another year', outcome: 'They finish above where anybody expected and a section of the stand is closed in February for six weeks. The refunds are handled badly by somebody else.', effect: { coins: -180, squadMorale: 5, boardMood: -3 } },
          { id: 'loan', label: 'Loan him out with a fee attached', desc: 'Keep the asset, take the money now', outcome: 'It funds half the roof and he plays a season somewhere better and comes back knowing exactly what he is worth.', effect: { coins: 240, playerMorale: { who: 'star', delta: -8 }, boardMood: 1, squadMorale: -3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-free-agent-in-a-park', title: 'Training On His Own In November', icon: '🌲', category: 'transfer',
    when: { minSeason: 2, maxCoins: 400 }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A scout has seen a free agent doing runs on his own on a public park at eight in the morning. Twenty-nine, released in June, no club since. He is doing it in a bin bag under a top because it is cold.',
        choices: [
          { id: 'trial', label: 'Bring him in for a fortnight', desc: 'No promises, no wages, a locker', outcome: 'He is fitter than four of the squad and it embarrasses them, which is the point. He is also short of a yard and both things are true in every session.', effect: { coins: -20, squadMorale: 4, prestige: 1, tag: 'mgr-p10-took-the-park-runner' } },
          { id: 'sign', label: 'Sign him now, cheap, till the end', desc: 'Before somebody else has the same scout', outcome: 'He plays nineteen times and gives everything and is not quite good enough. Releasing him in May is the worst hour of the manager’s summer.', effect: { coins: -110, squadMorale: 6, boardMood: -1 } },
          { id: 'pass', label: 'Pass, and tell the scout why', desc: 'There is a reason nobody has him', outcome: 'The scout accepts it. In March the man is scoring in the division below and every report on him mentions who looked and did not act.', effect: { coins: 40, prestige: -2, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-buy-back', title: 'The Clause They Wrote In', icon: '↩️', category: 'transfer',
    when: { minSeason: 4, minCoins: 300 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Three years ago the club sold a boy and insisted on a buy-back. It expires on the last day of this window. He is better than anything here and he has been on the bench since Christmas.',
        choices: [
          { id: 'trigger', label: 'Trigger it', desc: 'Pay it, take him, worry after', outcome: 'It empties the budget for eighteen months. He is worth it on the pitch and the squad quietly work out what he is on within a fortnight.', effect: { coins: -540, squadMorale: -4, prestige: 2, tag: 'mgr-p10-bought-him-back' } },
          { id: 'sell-clause', label: 'Sell the clause back to them', desc: 'They pay to make it go away', outcome: 'It is good business and it takes four minutes. He wins a cup with them in April and the clip of the clause being discussed is on a fan channel by May.', effect: { coins: 300, boardMood: 2, prestige: -2 } },
          { id: 'lapse', label: 'Let it lapse', desc: 'The squad he has is the squad he wants', outcome: 'Nothing happens. A supporters’ meeting in October asks why and he gives an answer about balance that convinces nobody in the room including him.', effect: { boardMood: -1, squadMorale: 3, prestige: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-scout-wants-his-name-on-it', title: 'Who Found Him, In Writing', icon: '🔎', category: 'transfer',
    when: { minSeason: 3 }, temper: ['builder', 'tactician', 'disciplinarian'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The part-time scout who found the best signing of the last four years wants it acknowledged. Not money. A line in a contract saying he found him, and a percentage if the boy goes on.',
        choices: [
          { id: 'give', label: 'Write it in', desc: 'A finder’s clause, properly drawn up', outcome: 'It costs the club when the boy is sold and the scout weeps on the phone. Every other part-timer asks for the same within a month and two of them deserve it.', effect: { coins: -160, prestige: 2, boardMood: -2, tag: 'mgr-p10-finders-clause' } },
          { id: 'credit', label: 'Give him the credit publicly instead', desc: 'Name him, on the record, in the programme', outcome: 'He has it framed. A bigger club reads it, offers him full-time work in April, and he is gone by June with the manager’s blessing and nobody to replace him.', effect: { prestige: 2, squadMorale: -1, boardMood: 1 } },
          { id: 'refuse', label: 'Refuse it', desc: 'That is what the retainer is for', outcome: 'He carries on, correctly and without warmth. The reports keep coming and they stop containing the sentence at the bottom that used to say go and watch him yourself.', effect: { boardMood: 2, prestige: -2, tag: 'mgr-p10-refused-the-scout' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-sell-to-the-rivals', title: 'Their Money Is The Best Money', icon: '⚔️', category: 'transfer',
    when: { minSeason: 3, maxCoins: 300 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two bids on the table for the same player. The one from eleven miles away is a hundred and ten better than the one from four hundred. The chairman has already said he does not care where the money comes from.',
        choices: [
          { id: 'take-it', label: 'Take the local money', desc: 'A pound is a pound', outcome: 'He scores against them in November and does not celebrate, which somehow makes it worse. There is a banner about the manager by Boxing Day.', effect: { coins: 430, prestige: -3, squadMorale: -4, tag: 'mgr-p10-sold-to-them', clubLegacy: { kind: 'rivalry', label: 'the year we sold him to them' } } },
          { id: 'other', label: 'Take the smaller offer', desc: 'Four hundred miles away, and worth every penny of the difference', outcome: 'The supporters get it immediately. The finance director works out the shortfall to the pound and writes it in a paper for the board.', effect: { coins: 320, boardMood: -2, prestige: 2, squadMorale: 2 } },
          { id: 'block', label: 'Block both and keep him', desc: 'He has two years left. Let him run them', outcome: 'He sulks until January and is excellent from February. In June he leaves for nothing and there is no bid at all to talk about.', effect: { playerMorale: { who: 'best', delta: -10 }, boardMood: -3, squadMorale: 3, prestige: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-veteran-one-more', title: 'One More Year, At Half', icon: '🧓', category: 'transfer',
    when: { minSeason: 3, needs: 'veteran' }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The oldest man in the squad wants another season and knows what he is asking. He has offered to take half of what he is on. He is asking in the corridor rather than the office, so it can be a conversation and not a meeting.',
        choices: [
          { id: 'yes', label: 'Give him the year', desc: 'Half the money, no promises on games', outcome: 'He plays fourteen times and runs the dressing room for all thirty-eight. The half he gave up is the reason a young winger gets a contract.', effect: { coins: -70, playerMorale: { who: 'oldest', delta: 16 }, squadMorale: 5, boardMood: -1, tag: 'mgr-p10-gave-the-year' } },
          { id: 'no', label: 'Tell him it finishes in May', desc: 'In the office, properly, with a date', outcome: 'He shakes his hand and thanks him for being straight and does not train the same way again for four months.', effect: { playerMorale: { who: 'oldest', delta: -18 }, squadMorale: -4, coins: 110, prestige: 1 } },
          { id: 'coach', label: 'Offer him a year on the coaching staff instead', desc: 'Boots off in May, tracksuit in July', outcome: 'He says yes because he cannot say no. He is out of the changing room for good and finds out in September what that actually meant.', effect: { coins: -40, squadMorale: 3, playerMorale: { who: 'oldest', delta: -6 }, boardMood: 1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-wonderkid-clause', title: 'The Figure In His Contract', icon: '💎', category: 'transfer',
    when: { minSeason: 3, needs: 'wonderkid' }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The best sixteen-year-old anybody here has seen signed a deal last summer with a compensation figure in it that looked enormous at the time. It now looks like a bargain and three clubs have read it.',
        choices: [
          { id: 'renegotiate', label: 'Get him on a new deal now', desc: 'Whatever it takes, this week', outcome: 'It is done in nine days and costs three times the plan. The rest of the squad find the number out and the wage structure never recovers.', effect: { coins: -300, squadMorale: -6, playerMorale: { who: 'youngest', delta: 14 }, tag: 'mgr-p10-locked-the-kid-in' } },
          { id: 'play', label: 'Play him every week and take the consequence', desc: 'Let him be worth ten times it', outcome: 'He is magnificent from October. The bid that arrives in January is at the clause figure and there is not a thing anybody can do about it.', effect: { playerMorale: { who: 'youngest', delta: 12 }, squadMorale: 3, coins: 260, boardMood: -2 } },
          { id: 'hide', label: 'Keep him in the under-18s', desc: 'Out of sight until the deal is fixed', outcome: 'It buys four months. He is bored, his father is on the phone weekly, and the boy who was going to be special turns eighteen having played nine minutes.', effect: { playerMorale: { who: 'youngest', delta: -16 }, prestige: -2, boardMood: 1, tag: 'mgr-p10-hid-the-wonderkid' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-bid-for-the-unhappy-one', title: 'Somebody Wants The Problem', icon: '📤', category: 'transfer',
    when: { minSeason: 2, needs: 'unhappy-player' }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club has bid for the man who has made every Monday harder since August. The fee is fair. He is also, on his day, in the best three players at the club.',
        choices: [
          { id: 'sell', label: 'Take it', desc: 'Money in, poison out', outcome: 'The building is lighter within a week. They lose four of the next six and two of the defeats are directly about a player who is not there.', effect: { coins: 340, playerMorale: { who: 'unhappiest', delta: 12 }, squadMorale: 6, prestige: -1, tag: 'mgr-p10-sold-the-problem' } },
          { id: 'keep', label: 'Reject it and put an arm round him', desc: 'Tell him he is wanted here, and mean it', outcome: 'He is brilliant for eleven weeks. In the twelfth he is dropped and everything that was fixed comes back with interest.', effect: { playerMorale: { who: 'unhappiest', delta: 16 }, squadMorale: -3, boardMood: -2 } },
          { id: 'stall', label: 'Ask for a great deal more', desc: 'Price him out and see who blinks', outcome: 'They walk away and he finds out the club valued him at nearly double the bid, which he takes as an insult and a compliment on alternate days.', effect: { playerMorale: { who: 'unhappiest', delta: -8 }, boardMood: 1, coins: 60 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-thin-squad-window-shuts', title: 'Twenty-Two Hours Left', icon: '⌛', category: 'transfer',
    when: { minSeason: 2, needs: 'thin-squad' }, weight: 5, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fourteen fit outfield players and the window closes tomorrow at eleven. There is one loan on the table, from a club who want the wages covered and a guarantee about minutes.',
        choices: [
          { id: 'take', label: 'Take the loan and sign the guarantee', desc: 'Bodies now, problems later', outcome: 'He plays every week whether he deserves it or not. In March a better player sits on the bench because of a sentence signed in a hurry in January.', effect: { coins: -180, squadMorale: -3, boardMood: 1, tag: 'mgr-p10-signed-the-guarantee' } },
          { id: 'refuse', label: 'Refuse the guarantee and lose the deal', desc: 'Nobody picks his team but him', outcome: 'The window shuts on fourteen men. Three of them play every minute until April and one of them does not get through it.', effect: { squadMorale: -5, prestige: 2, coins: 100, tag: 'mgr-p10-kept-selection' } },
          { id: 'kids', label: 'Promote three from the under-18s instead', desc: 'Numbers, at eighteen, for nothing', outcome: 'One of them can play. The other two are found out inside a month and it is done in front of four thousand people each time.', effect: { playerMorale: { who: 'youngest', delta: 12 }, squadMorale: -2, coins: 40, boardMood: -1 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-big-squad-cull', title: 'Twenty-Six Into Eighteen', icon: '📉', category: 'transfer',
    when: { minSeason: 2, needs: 'big-squad' }, temper: ['disciplinarian', 'tactician', 'firefighter'], weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The squad is too big and eight men know they are not in the eighteen. They train on the far pitch on Fridays. Somebody has started calling it the annexe and it has stuck.',
        choices: [
          { id: 'move-them', label: 'Get them all out, at a loss', desc: 'Pay some of it up, clear the space', outcome: 'The wage bill drops and the far pitch is empty and the group that is left trains better than it has all year. Two of the eight are excellent elsewhere by March.', effect: { coins: -240, squadMorale: 6, boardMood: 1, tag: 'mgr-p10-cleared-the-annexe' } },
          { id: 'keep-them', label: 'Bring them back in', desc: 'One group, one pitch, all week', outcome: 'It is the right thing and it makes every session harder to run. Two of them are training to be seen by other clubs and it shows in the tackles.', effect: { squadMorale: 4, prestige: 1, boardMood: -2, coins: -120 } },
          { id: 'harden', label: 'Leave it exactly as it is', desc: 'They know where they stand. That is not cruelty', outcome: 'It is efficient. The word annexe is in a newspaper by February with a quote from an unnamed player underneath it.', effect: { coins: 80, squadMorale: -5, prestige: -2, tag: 'mgr-p10-kept-the-annexe' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-boy-out-of-the-institution', title: 'Out In Six Weeks', icon: '🔑', category: 'transfer',
    when: { minSeason: 3, maxCoins: 450 }, temper: ['players-manager', 'builder', 'chancer'], weight: 3, rare: true, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A probation officer has written to the club about a nineteen-year-old who is out in six weeks and who two people the manager trusts say can play. What he did is in the letter, in one sentence, without decoration.',
        choices: [
          { id: 'take', label: 'Take him on', desc: 'Digs, a wage, and rules that do not bend', outcome: 'He is in at seven every morning for a year. There is a meeting about it upstairs, a piece in a paper, and a photograph of him with the under-14s that the club cannot use.', effect: { coins: -80, prestige: 1, boardMood: -3, squadMorale: 4, tag: 'mgr-p10-took-the-boy-on', clubLegacy: { kind: 'tradition', label: 'the club that gave him the year' } } },
          { id: 'train', label: 'Let him train, nothing more', desc: 'No contract, no announcement, no promise', outcome: 'He is with them for five months and never signs. He is grateful anyway and a bigger club takes him in the summer without a single awkward question.', effect: { squadMorale: 2, prestige: -1, boardMood: 1 } },
          { id: 'no', label: 'Write back and say no', desc: 'The club cannot carry it', outcome: 'It is defensible in every meeting he will ever sit in. The letter he writes takes him three attempts and he does not keep a copy.', effect: { boardMood: 2, prestige: -1, squadMorale: -2 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-window-and-the-holiday', title: 'Booked Since March', icon: '✈️', category: 'transfer',
    when: { minSeason: 3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The family holiday was booked in March for the second week of the window. It is the first one in four years that everybody can actually make. There are two deals live and neither will close itself.',
        choices: [
          { id: 'go', label: 'Go, and work from a balcony', desc: 'Phone on, family there, both half-done', outcome: 'He is on the phone for a good deal of it and neither deal collapses. His daughter takes a photograph of him on a lounger with a phone to his ear and it is on the fridge for years.', effect: { coins: -60, squadMorale: 2, prestige: -1, tag: 'mgr-p10-worked-the-balcony' } },
          { id: 'stay', label: 'Send them without him', desc: 'Both deals done properly by Friday', outcome: 'Both signings are good and one of them is a real player. They come back brown and cheerful and full of a week he was not in.', effect: { coins: -200, squadMorale: 6, boardMood: 2, prestige: 1, tag: 'mgr-p10-missed-the-holiday' } },
          { id: 'delegate', label: 'Hand both to the sporting director', desc: 'Phone off. Actually off', outcome: 'One deal is done well and the other is done for forty more than it should have been, on a player he would not have picked. He says nothing about it in August.', effect: { coins: -260, boardMood: -1, squadMorale: 3 } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-one-agent-four-players', title: 'The Same Man Four Times', icon: '🧷', category: 'transfer',
    when: { minSeason: 3 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One agent represents the goalkeeper, both centre-halves and the captain. He is pleasant, he is competent, and he now knows more about the wage structure than three of the directors.',
        choices: [
          { id: 'break', label: 'Break it up', desc: 'No more of his players, starting now', outcome: 'It is the correct decision and it costs a defender they wanted in July. Four contract talks in eighteen months are harder than they needed to be.', effect: { coins: -140, boardMood: 1, prestige: 1, tag: 'mgr-p10-broke-the-agent-block' } },
          { id: 'work', label: 'Work with him properly', desc: 'One relationship, four renewals, done in a week', outcome: 'It is astonishingly efficient. It also means one man can walk into the building in January and empty a back four with four phone calls.', effect: { coins: 180, boardMood: 2, squadMorale: 2, prestige: -2, tag: 'mgr-p10-in-with-the-agent' } },
          { id: 'players', label: 'Tell the four players what it looks like', desc: 'Individually, no pressure, just the picture', outcome: 'Two of them change agent within a year and one of them tells the agent exactly who suggested it.', effect: { squadMorale: -3, prestige: 1, boardMood: -1 } },
        ],
      },
    },
  },
  // ── CRISIS ───────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'mgr-p10-effigy', title: 'On The Railings', icon: '🔥', category: 'crisis',
    when: { minSeason: 3, minPos: 0.8 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody has hung a shirt stuffed with newspaper on the railings by the car park with his name on the back. It is not funny and it is not clever and two of his staff saw it before he did.',
        choices: [
          { id: 'take-down', label: 'Take it down himself', desc: 'In front of whoever is watching', outcome: 'He folds it and carries it inside and it is photographed from a bedroom window across the road. He looks calm in the picture and does not sleep that night.', effect: { prestige: 1, squadMorale: -2, boardMood: -1, tag: 'mgr-p10-took-it-down-himself' } },
          { id: 'police', label: 'Let the club report it', desc: 'Cameras, statement, the proper route', outcome: 'It becomes a story about the club and the police rather than about a bad season. It also becomes a story about a manager who could not take it.', effect: { prestige: -2, boardMood: 1, squadMorale: 2 } },
          { id: 'joke', label: 'Use it in the press conference', desc: 'Say it needed better stuffing', outcome: 'The room laughs and the clip travels and it defuses the week entirely. Two supporters’ groups feel mocked and are colder to him from then on.', effect: { prestige: 2, squadMorale: 4, boardMood: -2, tag: 'mgr-p10-laughed-at-the-effigy' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-bailiffs', title: 'A Van At The Training Ground', icon: '🚨', category: 'crisis',
    when: { minSeason: 2, minPos: 0.65, maxCoins: 180 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two men with paperwork are at the training ground about an unpaid invoice for the gym equipment. The players are eighty yards away doing a warm-up and one of them has already noticed.',
        choices: [
          { id: 'pay', label: 'Pay it out of the playing budget', desc: 'Today, on the spot, gone by ten', outcome: 'They leave in eleven minutes and nobody in a tracksuit ever knows. In January there is nine hundred less than there should be and a defender they cannot sign.', effect: { coins: -190, squadMorale: 3, boardMood: -1, tag: 'mgr-p10-paid-the-bailiffs' } },
          { id: 'upstairs', label: 'Send them upstairs', desc: 'Not his invoice, not his building', outcome: 'It is dealt with in four days and the equipment is gone for two of them. The senior players ask him a question in the canteen that he cannot honestly answer.', effect: { squadMorale: -6, boardMood: 1, prestige: -1 } },
          { id: 'tell-them', label: 'Tell the squad what is happening', desc: 'Straight, in the room, before it leaks', outcome: 'They are better about it than he expected and two of them offer to defer money, which he refuses. The story is in a paper on Sunday, sourced from somebody in that room.', effect: { squadMorale: 5, boardMood: -3, prestige: 1, tag: 'mgr-p10-told-them-the-truth' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-captain-asks-him-to-go', title: 'He Asked Him To Resign', icon: '🥀', category: 'crisis',
    when: { minSeason: 3, minPos: 0.75 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The captain has asked for ten minutes and used four of them to say that the players think it has gone and that he should go before he is pushed. He is not enjoying saying it. That is what makes it serious.',
        choices: [
          { id: 'fight', label: 'Tell him he will have to carry him out', desc: 'And take the armband off him', outcome: 'The room hardens behind one of them and it is not obvious for three weeks which. They win at home in front of eight thousand and nothing is resolved by it.', effect: { playerMorale: { who: 'star', delta: -18 }, squadMorale: -4, prestige: 2, boardMood: -1, tag: 'mgr-p10-fought-the-captain' } },
          { id: 'ask', label: 'Ask him to say more', desc: 'Two hours, no defence, take notes', outcome: 'Most of it is fair and about a third of it is about a man who left in August. He changes four things and two of them work.', effect: { squadMorale: 6, prestige: -1, boardMood: -1 } },
          { id: 'upstairs', label: 'Take it upstairs himself', desc: 'Tell the board what the captain said', outcome: 'It is honest and it is the beginning of the end. The chairman thanks him for the candour and starts a list of names that evening.', effect: { boardMood: -3, prestige: 1, squadMorale: 2, tag: 'mgr-p10-reported-the-captain' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-assistant-offered-the-job', title: 'They Have Sounded Out His Number Two', icon: '🪑', category: 'crisis',
    when: { minSeason: 3, minPos: 0.7 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A director has asked the assistant, over a coffee that was described as nothing, whether he would take it until the end of the season. The assistant has told him. It took him four days to do it.',
        choices: [
          { id: 'thank', label: 'Thank him and carry on as normal', desc: 'Same car, same sessions, nothing said', outcome: 'They work side by side for eleven weeks and it is almost the same as it was. Almost is doing a great deal of work in that sentence.', effect: { prestige: 1, squadMorale: -2, tag: 'mgr-p10-assistant-told-him' } },
          { id: 'confront', label: 'Go and see the director', desc: 'Say what he knows and who told him', outcome: 'The director denies it flatly and knows exactly where it came from. The assistant is out of two meetings he used to be in by the end of the month.', effect: { boardMood: -3, prestige: 1, squadMorale: -1 } },
          { id: 'push-him', label: 'Tell him to take it if it comes', desc: 'And to do it properly when it does', outcome: 'It is generous and it is genuinely meant. The assistant repeats it to two people and it reaches the board as the manager expecting to be sacked.', effect: { boardMood: -2, squadMorale: 4, prestige: 2, tag: 'mgr-p10-blessed-the-assistant' } },
        ],
      },
    },
  },
  {
    id: 'mgr-p10-family-at-a-bad-one', title: 'They Were In The Stand For That', icon: '😶', category: 'crisis',
    when: { minSeason: 4, minPos: 0.75 }, weight: 4, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His wife and both children came to the six-nil. They were four rows in front of a man who spent the second half describing what should happen to their father. They have not mentioned it and he knows anyway.',
        choices: [
          { id: 'ban-family', label: 'Tell them not to come again', desc: 'Not this season. Not while it is like this', outcome: 'They agree too quickly, which tells him they had already decided. He looks for them in the same seats for the rest of the year without meaning to.', effect: { squadMorale: -2, prestige: -1, tag: 'mgr-p10-stopped-them-coming' } },
          { id: 'box', label: 'Put them in the box', desc: 'Away from it, with the directors', outcome: 'They are safe and bored and surrounded by people talking about him in the third person. His son asks on the way home why nobody up there stood up.', effect: { boardMood: 1, squadMorale: -1, prestige: -1 } },
          { id: 'nothing-said', label: 'Say nothing and let them choose', desc: 'They are grown enough to know what it is', outcome: 'They come to the next one and sit in exactly the same seats. Nothing happens and he watches that part of the stand for ninety minutes instead of the game.', effect: { squadMorale: 2, prestige: 1, boardMood: -1, tag: 'mgr-p10-let-them-choose' } },
        ],
      },
    },
  },
];
