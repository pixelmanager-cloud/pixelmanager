// ── YOUTH ARCS — the childhood chapters (Grassroots + Academy, ages 10-14) ────────────────────────
// The rest of the arc library was written for players who already have a club, a contract and a rival, so
// nothing fired before ~turn 23 and the first quarter of every career — the part where the bloodline hook
// actually lives — had no stories at all. These fill that gap.
//
// The register is deliberately different from the senior arcs: no agents, no money, no transfers. A kid this
// age has a coach, his parents, his mates and school, and his dramas are about belonging, sacrifice, growing
// up and whether he's good enough. Meters used are only those active in these chapters (authority = Coach,
// family = Parents, peers = Mates/Teammates, school = School) and no arc pays earnings — children don't earn.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_ARCS: StoryArc[] = [
  {
    id: 'youth-first-boots', title: 'The Boots in the Window', icon: '👟', category: 'relationship',
    minTurn: 2, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The proper boots — the ones every kid at training already has — sit in the shop window at a price that makes his mum go quiet. She says they\'ll see. He knows what "we\'ll see" costs, and he\'s seen the envelope where the bills live.',
        choices: [
          { id: 'ask', label: 'Ask for them anyway', desc: 'He wants them badly enough to say it out loud', outcome: 'He asks. She buys them, and skips something of her own to do it — he notices the shoes she doesn\'t replace all winter.', effect: { meters: { family: 8 }, attr: { flair: 1 }, tag: 'boots-bought' }, next: 'wear' },
          { id: 'quiet', label: 'Say nothing and make do', desc: 'Keep playing in the old ones, hand-me-down studs and all', outcome: 'He tells her the old ones are fine. They aren\'t — but he plays in them all season and never once mentions it.', effect: { meters: { family: 5 }, attr: { stamina: 1, composure: 1 }, tag: 'boots-made-do' }, next: 'wear' },
        ],
      },
      wear: {
        id: 'wear',
        prompt: 'Whatever is on his feet, the first proper match of the season comes around, on a pitch heavy with rain.',
        choices: [
          { id: 'repay', label: 'Play like they\'re worth it', desc: 'Leave everything out there — she\'ll hear about it', outcome: 'He runs himself into the ground, and the first thing he does at full time is look for her on the touchline.', effect: { energy: -6, form: 0.08, attr: { stamina: 1 }, meters: { family: 8, authority: 4 } } },
          { id: 'enjoy', label: 'Just enjoy it', desc: 'It\'s a game and he\'s a kid — play like one', outcome: 'He plays like it\'s the park again, grinning through the mud, and the joy of it is the thing people remember.', effect: { form: 0.05, attr: { flair: 1 }, meters: { peers: 8, family: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-smallest', title: 'A Year Behind His Body', icon: '📏', category: 'saga',
    minTurn: 3, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is the smallest in his age group by a head. The bigger lads knock him off the ball without trying, and a parent on the far touchline says — loud enough to carry — that he\'ll get hurt playing with the men.',
        choices: [
          { id: 'think', label: 'Play quicker than they can hit him', desc: 'If he can\'t win it physically, win it earlier', outcome: 'He starts thinking a pass ahead of everyone, moving the ball before contact arrives. Being small teaches him to be sharp.', effect: { attr: { creativity: 1, composure: 1 }, meters: { authority: 6 }, tag: 'small-clever' }, next: 'later' },
          { id: 'fight', label: 'Refuse to be bullied off it', desc: 'Stand in, take the knocks, get back up', outcome: 'He gets flattened, repeatedly, and gets up every time. By spring nobody bothers trying to bully him off the ball.', effect: { energy: -8, attr: { aggression: 1, stamina: 1 }, meters: { peers: 6 }, tag: 'small-tough' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'A year on, he grows four inches over one summer. He comes back to training in a body he hasn\'t learned yet — and for a few weeks he is suddenly, painfully ordinary.',
        choices: [
          { id: 'patient', label: 'Be patient with himself', desc: 'Relearn the game at his new size', outcome: 'He works through the clumsy months without panicking, and comes out the other side with the small boy\'s brain in a bigger frame.', effect: { attr: { composure: 1, creativity: 1 }, form: 0.06, meters: { authority: 6 } } },
          { id: 'force', label: 'Try to play like the big lads now', desc: 'He has the size — use it', outcome: 'He leans on his new body and loses some of the sharpness that made him special. It comes back, mostly.', effect: { attr: { aggression: 1, stamina: 1 }, form: -0.04, meters: { peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-school-clash', title: 'Two Places at Once', icon: '🎒', category: 'crisis',
    minTurn: 13, maxTurn: 45, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy has moved midweek training to the same evening as the exam-revision class his teacher told his parents he cannot afford to miss. Both adults are certain their thing is the important one.',
        choices: [
          { id: 'football', label: 'Go to training', desc: 'Football is the plan — everything else is the backup', outcome: 'He goes to training. His teacher stops asking him about his future, which stings more than a detention would.', effect: { attr: { stamina: 1 }, meters: { authority: 8, school: -10 }, tag: 'chose-football' }, next: 'report' },
          { id: 'school', label: 'Go to the class', desc: 'Keep the backup real', outcome: 'He goes to the class. The coach notices the empty peg and says nothing at all, which is worse than being shouted at.', effect: { meters: { school: 10, authority: -8 }, attr: { composure: 1 }, tag: 'chose-school' }, next: 'report' },
          { id: 'both', label: 'Try to do both', desc: 'Half the class, late to training, exhausted', outcome: 'He does half of each and neither properly, and arrives at training too knackered to be any good.', effect: { energy: -12, meters: { school: 3, authority: -3 }, tag: 'chose-both' }, next: 'report' },
        ],
      },
      report: {
        id: 'report',
        prompt: 'Report evening. His parents sit between a teacher who thinks football is a distraction and a coach who thinks school is, and look at their son to see which way he wants them to argue.',
        choices: [
          { id: 'honest', label: 'Tell them the truth', desc: 'Say out loud what he actually wants', outcome: 'He says he wants to be a footballer, and that he knows what happens if it doesn\'t work. The honesty settles the room.', effect: { attr: { leadership: 1, composure: 1 }, meters: { family: 10, authority: 4 } } },
          { id: 'peace', label: 'Say what keeps the peace', desc: 'Promise everyone what they want to hear', outcome: 'He promises everybody everything, and spends the next year quietly failing to deliver half of it.', effect: { meters: { family: 4, school: 4, authority: 2 }, attr: { teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-better-kid', title: 'The Boy Who Was Better', icon: '😤', category: 'relationship',
    minTurn: 5, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new lad called {RIVAL} joins the group and is, plainly, better than him. The coaches gather round him at finishing drills. For the first time in his life he is the second-best player in the room, and he hates how much it hurts.',
        choices: [
          { id: 'learn', label: 'Watch him and steal everything', desc: 'If he\'s better, learn why', outcome: 'He shadows {RIVAL} for a season, copying his first touch until it stops being a copy. They end up close — which will make what comes later stranger, not easier.', effect: { attr: { creativity: 1, teamwork: 1 }, meters: { peers: 8 }, tag: 'youth-friend' }, next: 'trials' },
          { id: 'race', label: 'Turn it into a private war', desc: 'Beat him at everything, every session', outcome: 'Every drill becomes a contest with {RIVAL}. He gets better fast, and neither of them ever quite relaxes around the other again.', effect: { attr: { aggression: 1, stamina: 1 }, form: 0.06, meters: { peers: -5, authority: 4 }, tag: 'youth-rival' }, next: 'trials' },
        ],
      },
      trials: {
        id: 'trials',
        prompt: 'End of the season. Only one of them — him or {RIVAL} — is being put forward for the district trial, and the coach hasn\'t said which.',
        choices: [
          { id: 'grace', label: 'Wish him well either way', desc: 'Whatever happens, be decent about it', outcome: 'He tells {RIVAL} he deserves it, and means it. The coach hears him say it — and remembers that as much as the football.', effect: { attr: { leadership: 1, composure: 1 }, meters: { authority: 10, peers: 8 } } },
          { id: 'push', label: 'Make the case for himself', desc: 'Ask the coach, straight out, what he needs to do', outcome: 'He knocks on the office door and asks what he\'s missing. The coach gives him a list — and puts him forward.', effect: { attr: { leadership: 1 }, form: 0.08, meters: { authority: 8, peers: -3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-homesick', title: 'The First Night Away', icon: '🌙', category: 'crisis',
    minTurn: 14, maxTurn: 45, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy digs are two hours from home. The room is clean, the food is fine, and at half past ten on the first night he lies in the dark absolutely certain he has made a terrible mistake.',
        choices: [
          { id: 'ring', label: 'Ring home', desc: 'He\'s thirteen. He wants his mum.', outcome: 'He rings home and doesn\'t manage to say much. She stays on the line anyway until he falls asleep.', effect: { meters: { family: 10, peers: -2 }, energy: 4, tag: 'rang-home' }, next: 'settle' },
          { id: 'stick', label: 'Ride it out alone', desc: 'Don\'t let anyone hear it', outcome: 'He puts his head under the pillow and gets through it on his own. He is quieter at breakfast than anyone expects.', effect: { attr: { composure: 2 }, meters: { family: -2 }, energy: -4, tag: 'rode-it-out' }, next: 'settle' },
          { id: 'mates', label: 'Knock on the next room', desc: 'Find out if anyone else is awake', outcome: 'The lad next door is lying awake too. They talk rubbish until 2am and are inseparable by the weekend.', effect: { meters: { peers: 12 }, attr: { teamwork: 1 }, energy: -4, tag: 'found-mates' }, next: 'settle' },
        ],
      },
      settle: {
        id: 'settle',
        prompt: 'Six weeks in, his mother asks on the phone — carefully, so as not to push — whether he wants to come home for good.',
        choices: [
          { id: 'stay', label: 'Tell her he\'s staying', desc: 'He\'s homesick and he\'s staying anyway', outcome: 'He says he\'s staying. Saying it out loud is the moment it stops being someone else\'s plan and becomes his.', effect: { attr: { composure: 1, leadership: 1 }, meters: { family: 6, authority: 6 }, form: 0.06 } },
          { id: 'honest', label: 'Admit how hard it is', desc: 'Tell her the truth and stay anyway', outcome: 'He tells her exactly how hard it is, and that he isn\'t leaving. She cries after she hangs up; so does he.', effect: { attr: { composure: 2 }, meters: { family: 12 } } },
        ],
      },
    },
  },
  {
    id: 'youth-dropped-school', title: 'Left Off the School Team', icon: '📋', category: 'crisis',
    minTurn: 4, maxTurn: 40, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The school team sheet goes up and he isn\'t on it — the PE teacher has left the academy boy out to "give the others a go". Half the year group thinks it\'s fair. He is eleven, and it feels like a public verdict.',
        choices: [
          { id: 'accept', label: 'Take it on the chin', desc: 'Say nothing, support the lads', outcome: 'He carries the water and shouts for his mates all afternoon. The teacher notices, and never leaves him out again.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { school: 8, peers: 8 } } },
          { id: 'ask', label: 'Ask why, politely', desc: 'Go and find out what he did wrong', outcome: 'He asks. The teacher admits it wasn\'t about his football at all — and looks a bit ashamed of himself.', effect: { attr: { leadership: 1 }, meters: { school: 4 }, form: 0.04 } },
          { id: 'sulk', label: 'Let them see he\'s furious', desc: 'Slam the locker and walk', outcome: 'He storms off in front of everyone. It is remembered far longer than the team sheet ever was.', effect: { attr: { aggression: 1 }, meters: { school: -8, peers: -4 }, form: -0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-long-drive', title: 'Two Hundred Miles a Week', icon: '🚗', category: 'relationship',
    minTurn: 6, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Training is three nights a week and an hour each way. His dad does the drive after a full shift, eats his dinner out of a foil tray in the car park, and is back at work at six the next morning. Tonight the car makes a noise it shouldn\'t.',
        choices: [
          { id: 'thanks', label: 'Say thank you, properly', desc: 'Actually put it into words for once', outcome: 'He says thanks — properly, not a mumble. His dad goes quiet, says "you\'re alright", and drives the rest of the way with a smile he thinks nobody sees.', effect: { meters: { family: 12 }, attr: { leadership: 1 }, tag: 'said-thanks' } },
          { id: 'earn', label: 'Make the drive worth it', desc: 'Be the best one out there tonight', outcome: 'He trains like the miles are on his own legs, and his dad watches the whole session through the fence in the cold.', effect: { energy: -8, form: 0.1, attr: { stamina: 1 }, meters: { family: 8, authority: 6 } } },
          { id: 'guilt', label: 'Offer to give it up', desc: 'Tell them it\'s too much, and mean it', outcome: 'He says maybe they should stop. His mum tells him, flatly, that they will decide what is too much — and the subject is closed.', effect: { meters: { family: 10 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-scouted', title: 'The Man With the Clipboard', icon: '🔍', category: 'triumph',
    minTurn: 3, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a man on the touchline who isn\'t anybody\'s dad. He has a coat, a notebook, and no interest in the score — and halfway through the second half every kid on the pitch has worked out what he is.',
        choices: [
          { id: 'showboat', label: 'Show him everything', desc: 'Every trick in the locker, right now', outcome: 'He tries three things he can\'t reliably do. One comes off spectacularly and the other two don\'t, and the notebook stays shut.', effect: { attr: { flair: 2 }, form: -0.05, meters: { peers: 4 }, tag: 'showed-off' }, next: 'after' },
          { id: 'normal', label: 'Play his normal game', desc: 'Do the simple things properly', outcome: 'He plays exactly as he always does — early passes, hard running, one clever turn. The notebook opens after ten minutes.', effect: { attr: { composure: 1, teamwork: 1 }, form: 0.08, meters: { authority: 6 }, tag: 'played-normal' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Afterwards the man speaks to his parents for four minutes by the car, and leaves a card. His mum puts it in her purse and doesn\'t say anything about it for two days.',
        choices: [
          { id: 'dream', label: 'Let himself imagine it', desc: 'Lie awake and picture the whole thing', outcome: 'He doesn\'t sleep much that week. The imagining turns out to be a kind of fuel — he trains like a boy with somewhere to be.', effect: { form: 0.08, energy: -4, attr: { creativity: 1 }, meters: { family: 4 } } },
          { id: 'ground', label: 'Keep his feet on the ground', desc: 'Don\'t get carried away — it\'s one card', outcome: 'He decides not to think about it until something actually happens. It is the first genuinely professional decision of his life.', effect: { attr: { composure: 2 }, meters: { authority: 6, family: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-mate-released', title: 'The Friend Who Got the Call', icon: '💔', category: 'relationship',
    minTurn: 16, maxTurn: 45, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His best mate at the academy — the one who got him through the first months — is called into the office at the end of the session. Everyone knows what the office means in April. He comes out with his bag already packed.',
        choices: [
          { id: 'stay', label: 'Wait for him outside', desc: 'Don\'t let him walk out on his own', outcome: 'He waits by the gate and walks him to the car park, and neither of them says much. His mate never forgets that he waited.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 12, family: 4 }, tag: 'stood-by-mate' }, next: 'after' },
          { id: 'avoid', label: 'Give him space', desc: 'He might not want anyone seeing him like this', outcome: 'He hangs back, unsure what to say. By the time he decides to go after him the car has gone, and it sits badly for months.', effect: { attr: { composure: 1 }, meters: { peers: -4 }, tag: 'let-him-go' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'That night he lies awake doing the arithmetic every academy kid eventually does: if it can happen to him, it can happen to me.',
        choices: [
          { id: 'harder', label: 'Let the fear make him work', desc: 'Never be the one carrying the bag out', outcome: 'He trains that spring like someone is chasing him, because in his head someone is. It shows on the pitch.', effect: { form: 0.1, energy: -8, attr: { stamina: 1 }, meters: { authority: 8 } } },
          { id: 'kind', label: 'Decide what kind of teammate to be', desc: 'If it happens to someone else, be the one who waits', outcome: 'He makes a quiet promise about how he\'ll treat the next lad it happens to — and he keeps it, for the rest of his career.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 10 } } },
        ],
      },
    },
  },
  {
    id: 'youth-different', title: 'The New Boy Accent', icon: '🧒', category: 'crisis',
    minTurn: 12, maxTurn: 44, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is the outsider in the changing room — wrong accent, wrong estate, wrong everything according to a couple of the lads who have decided he\'s an easy afternoon. Today they\'ve hidden his boots.',
        choices: [
          { id: 'laugh', label: 'Laugh it off', desc: 'Refuse to give them the reaction', outcome: 'He laughs, finds the boots himself, and says nothing. Bored of him, they move on inside a fortnight.', effect: { attr: { composure: 2 }, meters: { peers: 4 }, tag: 'laughed-it-off' } },
          { id: 'stand', label: 'Front up to the ringleader', desc: 'Say it to his face, once', outcome: 'He fronts up. It nearly goes badly — and then it doesn\'t, and afterwards the ringleader is oddly respectful.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { peers: 6, authority: -3 } } },
          { id: 'tell', label: 'Tell the coach', desc: 'This isn\'t his to fix alone', outcome: 'He tells the coach, who deals with it properly and quietly. A couple of the lads call him a snitch; the coach calls him sensible.', effect: { attr: { composure: 1 }, meters: { authority: 8, peers: -6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-park-legend', title: 'The Cage on the Estate', icon: '🌇', category: 'signature',
    minTurn: 2, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The concrete cage behind the flats, six on six, no referee, older lads who don\'t care whose son you are. It is where he learned to play — and the academy coach has told him to stop going before he gets hurt.',
        choices: [
          { id: 'keep', label: 'Keep going anyway', desc: 'The cage made him — it isn\'t finished yet', outcome: 'He keeps going. He gets kicked, learns to survive it, and brings back things no coaching manual has ever produced.', effect: { attr: { flair: 2, aggression: 1 }, energy: -6, meters: { peers: 10, authority: -6 }, tag: 'cage-kid' } },
          { id: 'stop', label: 'Do as he\'s told', desc: 'The academy is the pathway now', outcome: 'He stops going. His football gets tidier and safer, and something spiky and improvised in it quietly goes missing.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 10, peers: -8 } } },
          { id: 'secret', label: 'Go, and say nothing', desc: 'What the coach doesn\'t know…', outcome: 'He goes on the quiet, on the nights nobody\'s watching. It works right up until the coach sees the scrape on his shin.', effect: { attr: { flair: 1, creativity: 1 }, meters: { peers: 8, authority: -3 }, tag: 'cage-secret' } },
        ],
      },
    },
  },
  {
    id: 'youth-first-trophy', title: 'The First Thing He Ever Won', icon: '🏆', category: 'triumph',
    minTurn: 6, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A district cup final on a Sunday morning, forty parents on the touchline and a trophy the size of a mug. It is, to him, the biggest game that has ever been played anywhere.',
        choices: [
          { id: 'lead', label: 'Drag them through it', desc: 'Take responsibility for the whole thing', outcome: 'He takes every set piece, organises everyone, and scores the one that wins it. He is eleven and he is enormous.', effect: { form: 0.12, attr: { leadership: 2 }, energy: -8, meters: { peers: 8, authority: 8, family: 6 }, tag: 'first-trophy' }, next: 'after' },
          { id: 'team', label: 'Play for the lads around him', desc: 'Make the others better and let them finish it', outcome: 'He sets up two and never once tries to be the story. The team wins, and everyone knows exactly who made it happen.', effect: { form: 0.08, attr: { teamwork: 2, creativity: 1 }, meters: { peers: 12, authority: 6 }, tag: 'first-trophy' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The trophy goes home in his kit bag. His mum wants it on the shelf in the front room where everyone who visits will see it.',
        choices: [
          { id: 'shelf', label: 'Let her put it up', desc: 'Let his family be proud out loud', outcome: 'It goes on the shelf and stays there for twenty years, getting dusted and pointed at by every relative who ever visits.', effect: { meters: { family: 12 }, attr: { composure: 1 } } },
          { id: 'room', label: 'Keep it in his room', desc: 'This one is his', outcome: 'He keeps it on the windowsill where he can see it from the bed — the first evidence that the thing he wants might actually happen.', effect: { form: 0.06, attr: { leadership: 1 }, meters: { family: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-playing-up', title: 'Playing With the Older Lads', icon: '⬆️', category: 'triumph',
    minTurn: 8, maxTurn: 45, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach wants him training a year up. The older group are bigger, faster, and visibly unimpressed at the small lad who has been parachuted in among them.',
        choices: [
          { id: 'go', label: 'Take the step up', desc: 'Be the worst player in the room and get better fast', outcome: 'He is out of his depth for a month and level with them by Christmas. Being the worst in the room turns out to be the fastest way to improve.', effect: { energy: -10, form: 0.1, attr: { stamina: 1, composure: 1 }, meters: { authority: 10, peers: -4 }, tag: 'played-up' }, next: 'back' },
          { id: 'stay', label: 'Stay with his own age group', desc: 'Be the best in his year instead', outcome: 'He stays, dominates his age group, and is the undisputed best player there — which is comfortable, and teaches him less.', effect: { form: 0.06, attr: { flair: 1 }, meters: { peers: 10, authority: -4 } } },
        ],
      },
      back: {
        id: 'back',
        prompt: 'Come spring he\'s dropped back to his own age group for a tournament, and finds the games strangely, almost embarrassingly, slow.',
        choices: [
          { id: 'boss', label: 'Boss it', desc: 'Show exactly what a year up buys you', outcome: 'He is on a different level and everyone can see it — including the scouts who came to watch somebody else.', effect: { form: 0.1, attr: { creativity: 1 }, meters: { authority: 8, peers: -3 } } },
          { id: 'lift', label: 'Bring the others up to it', desc: 'Use it to make his mates better', outcome: 'He spends the tournament dragging his own age group up to the tempo he learned. Two of them get moved up because of it.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 12, authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-injury-scare', title: 'The Ankle That Went Over', icon: '🩹', category: 'crisis',
    minTurn: 7, maxTurn: 45, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A bad tackle on a frozen January pitch, and his ankle goes over with a noise the whole touchline hears. In the back of the car, in a lot of pain, he asks his mum whether this is it.',
        choices: [
          { id: 'rush', label: 'Rush back for the trial', desc: 'There\'s a trial in three weeks and he is not missing it', outcome: 'He is back in a fortnight, strapped up and half-fit, and gets through the trial on one good leg. The ankle never quite forgives him.', effect: { energy: -12, form: 0.06, injury: true, attr: { aggression: 1 }, meters: { authority: 6 }, tag: 'rushed-back' } },
          { id: 'proper', label: 'Do the rehab properly', desc: 'Miss the trial, come back right', outcome: 'He misses the trial and does every boring exercise on the sheet. He comes back slower than he\'d like — and completely sound.', effect: { energy: 6, attr: { composure: 1, stamina: 1 }, meters: { family: 8, authority: -3 }, tag: 'rehab-properly' } },
        ],
      },
    },
  },
  {
    id: 'youth-sibling', title: 'The One Who Isn\'t Football', icon: '👧', category: 'relationship',
    minTurn: 5, maxTurn: 45, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Every weekend belongs to his football. His sister\'s things get rearranged around it, and tonight — after another Saturday spent on a touchline in the rain for somebody else\'s hobby — she finally says so.',
        choices: [
          { id: 'listen', label: 'Actually listen to her', desc: 'She has a point and he knows it', outcome: 'He hears her out and doesn\'t argue, because she\'s right. He starts turning up to her things, and she starts turning up to his.', effect: { attr: { teamwork: 1, leadership: 1 }, meters: { family: 12 }, tag: 'close-sibling' } },
          { id: 'defend', label: 'Defend his corner', desc: 'This is his shot — it needs the weekends', outcome: 'He argues that it matters more. He wins the argument and loses something with her that takes years to get back.', effect: { attr: { aggression: 1 }, form: 0.04, meters: { family: -8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-coach-faith', title: 'The Coach Who Saw It First', icon: '🧑‍🏫', category: 'saga',
    minTurn: 4, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The Sunday-league coach keeps him back after everyone else has gone, sets out cones in the dark, and says — matter-of-fact, no drama — that he\'s the best young player he has seen in thirty years of doing this.',
        choices: [
          { id: 'believe', label: 'Believe him', desc: 'Let it become part of who he is', outcome: 'He carries that sentence for the rest of his life. On the bad days it is the thing he goes back to.', effect: { attr: { composure: 1, leadership: 1 }, form: 0.08, meters: { authority: 12 }, tag: 'coach-faith' }, next: 'later' },
          { id: 'doubt', label: 'Assume he says that to everyone', desc: 'Don\'t let it go to his head', outcome: 'He nods and says nothing, quietly certain it is the sort of thing coaches say. It isn\'t.', effect: { attr: { composure: 1 }, meters: { authority: 4 }, tag: 'coach-doubted' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'Two years later the old coach turns up at an academy game, stands at the back where he thinks he can\'t be seen, and watches the whole ninety minutes.',
        choices: [
          { id: 'find', label: 'Find him afterwards', desc: 'Go and shake his hand in front of everyone', outcome: 'He walks straight over in front of the whole academy staff and thanks him properly. The old man doesn\'t stop talking about it for a decade.', effect: { attr: { leadership: 2 }, meters: { authority: 8, family: 6 } } },
          { id: 'play', label: 'Play the best half of his life', desc: 'Let the football be the thank-you', outcome: 'He produces forty-five minutes of everything the old coach ever taught him, and they both know exactly what it was for.', effect: { form: 0.12, attr: { creativity: 1, flair: 1 }, meters: { authority: 8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-first-money', title: 'Boot Money', icon: '💷', category: 'offpitch',
    minTurn: 15, maxTurn: 45, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A local sports shop offers to kit him out for nothing — boots, bag, the lot — if he wears their stuff and mentions them. It is not a contract and it is not really money, but it is the first time anyone has offered him something for being good at football.',
        choices: [
          { id: 'take', label: 'Take the kit', desc: 'Free boots are free boots', outcome: 'He takes it, and the free boots quietly save his parents a few hundred pounds a year they never mention.', effect: { meters: { family: 8, peers: 4 }, attr: { flair: 1 }, tag: 'boot-deal' } },
          { id: 'ask', label: 'Ask his parents first', desc: 'This feels like a grown-up decision', outcome: 'He brings it home before saying yes. His dad reads the whole thing twice, asks two good questions, and then lets him take it.', effect: { meters: { family: 12 }, attr: { composure: 1 } } },
          { id: 'decline', label: 'Say no thanks', desc: 'He doesn\'t want to owe anyone anything yet', outcome: 'He turns it down. Nobody quite understands why, including him — but there is something he likes about owing nothing to anyone.', effect: { attr: { composure: 1, leadership: 1 }, meters: { authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-in-goal', title: 'Somebody Has to Go In Goal', icon: '🧤', category: 'saga',
    minTurn: 1, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The regular keeper hasn\'t turned up and the coach is looking along the line for a volunteer. Nobody moves. Going in goal means ninety minutes of being blamed for things.',
        choices: [
          { id: 'volunteer', label: 'Put his hand up', desc: 'Someone has to, and nobody else will', outcome: 'He goes in, makes two saves he has no business making, and learns what it feels like when the team needs you specifically.', effect: { attr: { keeping: 1, leadership: 1 }, meters: { authority: 8, peers: 8 }, tag: 'went-in-goal' } },
          { id: 'refuse', label: 'Stay out of it', desc: 'He\'s an outfield player and everyone knows it', outcome: 'He keeps his eyes down until someone else cracks. It works, and he feels oddly small about it for the rest of the afternoon.', effect: { attr: { flair: 1 }, meters: { peers: -4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-own-goal', title: 'Into His Own Net', icon: '😖', category: 'crisis',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A routine ball across the six-yard box, his own studs, and it\'s in. The other team celebrate at him. Somebody\'s dad laughs. There are thirty minutes still to play and he wants to be anywhere else on earth.',
        choices: [
          { id: 'front', label: 'Demand the ball immediately', desc: 'The only way out is through', outcome: 'He asks for it again straight from the kickoff, and keeps asking. By full time nobody is talking about the own goal.', effect: { attr: { composure: 2, leadership: 1 }, form: 0.08, meters: { authority: 8, peers: 6 }, tag: 'faced-it' } },
          { id: 'hide', label: 'Hide for a bit', desc: 'Stay out of the way until it stops stinging', outcome: 'He drifts to the edge of the game for twenty minutes. Nobody blames him for it — but he knows, and it nags.', effect: { attr: { composure: 1 }, form: -0.06, meters: { peers: -3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-armband', title: 'The First Armband', icon: '🎖️', category: 'triumph',
    minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach hands him a captain\'s armband three sizes too big and says, without ceremony, that he\'s leading them out today. He has never told anybody what to do in his life.',
        choices: [
          { id: 'talk', label: 'Actually say something', desc: 'Try a team talk, aged eleven', outcome: 'He manages four sentences in the changing room, goes bright red, and the team runs out playing for him anyway.', effect: { attr: { leadership: 2 }, form: 0.06, meters: { peers: 10, authority: 6 }, tag: 'first-captain' } },
          { id: 'example', label: 'Lead by doing', desc: 'Say nothing, do everything', outcome: 'He doesn\'t say a word and simply outruns everybody for an hour. It turns out that counts as a team talk too.', effect: { attr: { stamina: 1, leadership: 1 }, energy: -8, form: 0.08, meters: { peers: 6, authority: 8 }, tag: 'first-captain' } },
        ],
      },
    },
  },
  {
    id: 'youth-grandparent', title: 'The Man in the Flat Cap', icon: '👴', category: 'relationship',
    minTurn: 1, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His grandad is at every single game, in the same spot by the corner flag, in the same coat, whatever the weather. He never shouts. He just watches, and afterwards he says one specific thing about the match.',
        choices: [
          { id: 'listen', label: 'Ask him what he saw', desc: 'The old man watched football before any of them were born', outcome: 'He starts asking after every game. The answers are short, unglamorous, and better than most of the coaching he gets.', effect: { attr: { composure: 1, creativity: 1 }, meters: { family: 12 }, tag: 'grandad-watches' } },
          { id: 'play', label: 'Play for the corner flag', desc: 'Do something today worth the trip', outcome: 'He spends the whole game trying to produce one moment worth the old man\'s bus fare. He gets it, late, and looks straight over.', effect: { form: 0.1, attr: { flair: 1 }, meters: { family: 10 } } },
        ],
      },
    },
  },
  {
    id: 'youth-cheat', title: 'The Boy Who Went Down Easy', icon: '⚖️', category: 'signature',
    minTurn: 4, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The lad marking him has spent the game diving, tugging shirts off the ball and getting away with all of it. In the last minute he does it again, wins a penalty, and grins about it. The referee is a teenager with a whistle.',
        choices: [
          { id: 'same', label: 'Give him a taste of it', desc: 'If that\'s the game, play it', outcome: 'He goes down cheaply at the other end and wins one back. It works, and something about it sits wrong with him for years.', effect: { attr: { aggression: 1 }, form: 0.04, meters: { peers: 4, authority: -6 }, tag: 'played-dirty' } },
          { id: 'straight', label: 'Refuse to play that way', desc: 'Beat him properly instead', outcome: 'He stays on his feet, beats the lad three more times before the whistle, and never once looks at the referee.', effect: { attr: { composure: 1, flair: 1 }, meters: { authority: 10, family: 6 }, tag: 'played-straight' } },
          { id: 'word', label: 'Tell the referee', desc: 'The kid with the whistle is fourteen and struggling', outcome: 'He has a quiet word rather than a shout. The young ref is grateful, gets a grip on the game, and remembers him for it.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { authority: 8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-winter', title: 'The Coldest Morning of the Year', icon: '❄️', category: 'crisis',
    minTurn: 2, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Minus two, a frozen pitch, a bag that hasn\'t dried since Thursday, and nine other kids who look like they\'d rather be in bed. For the first time he genuinely wonders why he does this.',
        choices: [
          { id: 'go', label: 'Get up and go', desc: 'Especially on the mornings he doesn\'t want to', outcome: 'He goes. Six of the squad don\'t. The coach says nothing about it at the time and forgets none of it later.', effect: { energy: -8, attr: { stamina: 1, composure: 1 }, meters: { authority: 12 }, tag: 'cold-morning' } },
          { id: 'skip', label: 'Stay in bed', desc: 'One session won\'t matter', outcome: 'He rolls over. One session doesn\'t matter — but the ease of it frightens him a bit, later.', effect: { energy: 8, meters: { authority: -8, family: -3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-thrashing', title: 'Nine-Nil', icon: '💀', category: 'crisis',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nine-nil. Not a game, a demolition — the other side\'s parents stopped celebrating around the sixth. Two of his teammates are crying and the coach has run out of things to say at half time.',
        choices: [
          { id: 'keep', label: 'Keep playing to the whistle', desc: 'Don\'t stop, however bad it gets', outcome: 'He chases everything until the final whistle in a game that was gone by half time. The coach quietly builds the next season around him.', effect: { energy: -10, attr: { stamina: 1, composure: 2 }, meters: { authority: 12, peers: 6 }, tag: 'never-stopped' } },
          { id: 'lift', label: 'Look after the ones crying', desc: 'The scoreline is lost — the lads aren\'t', outcome: 'He spends the last twenty minutes picking teammates up off the floor. Three of them are still playing football years later because of it.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14 } } },
          { id: 'blame', label: 'Let them know whose fault it is', desc: 'He isn\'t the one who stopped running', outcome: 'He tells two of them exactly what he thinks. It is fair, and it is the wrong day, and it takes a long while to undo.', effect: { attr: { aggression: 1 }, meters: { peers: -12, authority: -4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-out-of-position', title: 'Stuck at Right Back', icon: '🔀', category: 'saga',
    minTurn: 3, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach has put him at right back. He is not a right back — everyone knows it, including the coach, who needs a body there and picked the one lad reliable enough to do it.',
        choices: [
          { id: 'master', label: 'Learn the position properly', desc: 'Be the best right back in the league for a season', outcome: 'He learns to defend for real. It costs him a season of goals and gives him something half the forwards he\'ll ever face never had.', effect: { attr: { teamwork: 1, composure: 1, stamina: 1 }, meters: { authority: 12 }, tag: 'learned-defending' } },
          { id: 'roam', label: 'Play there in name only', desc: 'Wander forward the second the ball goes', outcome: 'He spends the season technically at right back and functionally wherever he likes. The coach gives up arguing around March.', effect: { attr: { flair: 1, creativity: 1 }, meters: { authority: -6, peers: 4 } } },
          { id: 'ask', label: 'Ask to move back up', desc: 'Say plainly where he\'s best', outcome: 'He makes his case without sulking. The coach hears him out, says "give me six weeks", and keeps his word.', effect: { attr: { leadership: 1 }, meters: { authority: 6 }, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'youth-birthday', title: 'The Party He Missed', icon: '🎂', category: 'relationship',
    minTurn: 2, maxTurn: 40, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His best mate from school is having the birthday everyone in the year is going to. It clashes with a match. His mate says, half joking, that he\'s always got a match.',
        choices: [
          { id: 'match', label: 'Play the match', desc: 'That\'s the deal, and it always will be', outcome: 'He plays. He also learns something about the shape of the life he\'s chosen, and that not everyone will wait around in it.', effect: { form: 0.06, meters: { peers: -8, authority: 6 }, attr: { composure: 1 }, tag: 'chose-the-match' } },
          { id: 'party', label: 'Go to the party', desc: 'He is eleven, and it\'s his best mate', outcome: 'He goes, and has the best afternoon he\'s had in months. The coach is unimpressed; his mate never forgets he came.', effect: { energy: 8, meters: { peers: 12, authority: -8 } } },
          { id: 'both', label: 'Play, then turn up late', desc: 'Kit bag, muddy legs, still going', outcome: 'He arrives at the party in a tracksuit with mud behind his ears, two hours late, and gets a cheer at the door.', effect: { energy: -6, form: 0.04, meters: { peers: 8, authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-new-town', title: 'A New Team in a New Town', icon: '📦', category: 'crisis',
    minTurn: 4, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The family moves for his dad\'s work. New house, new school, and a new club where the squad has known each other since they were five and doesn\'t obviously need him.',
        choices: [
          { id: 'prove', label: 'Let his football introduce him', desc: 'Say nothing, play well, wait', outcome: 'He is quiet for a month and outstanding for all of it. By October nobody remembers he was ever the new boy.', effect: { form: 0.08, attr: { composure: 1 }, meters: { peers: 8, authority: 6 }, tag: 'settled-in' } },
          { id: 'graft', label: 'Do the unglamorous jobs', desc: 'Carry the nets, chase everything, earn it', outcome: 'He puts the goals away after every session without being asked. It buys him more goodwill than any nutmeg would have.', effect: { attr: { teamwork: 2, stamina: 1 }, meters: { peers: 12, authority: 8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pushy-dad', title: 'Somebody Else\'s Father', icon: '📢', category: 'offpitch',
    minTurn: 3, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One dad on the touchline shouts at his own son for the entire ninety minutes — every mistake, by name, in front of everyone. Today the boy is close to tears at half time and nobody says anything.',
        choices: [
          { id: 'friend', label: 'Go and stand with the lad', desc: 'Say something ordinary and normal to him', outcome: 'He wanders over and talks nonsense about anything else for two minutes. The boy plays the best half of his season.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 12 }, tag: 'stood-with-him' } },
          { id: 'grateful', label: 'Look at his own parents differently', desc: 'Notice what he\'s actually got', outcome: 'He glances at his own mum and dad, who have never once shouted at him, and understands something he\'d taken for granted.', effect: { attr: { composure: 1 }, meters: { family: 12 } } },
        ],
      },
    },
  },
  {
    id: 'youth-county-trial', title: 'The Letter About the County Trial', icon: '✉️', category: 'triumph',
    minTurn: 5, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A letter with a county badge on it. One afternoon, four hundred boys, twelve places, and a hundred parents pretending they aren\'t counting the numbers.',
        choices: [
          { id: 'nerves', label: 'Play through the nerves', desc: 'He is terrified and going anyway', outcome: 'He is sick with nerves for the first twenty minutes and fine for the rest. He does not make the twelve — and is asked back the year after.', effect: { attr: { composure: 2 }, form: 0.06, meters: { family: 6, authority: 6 }, tag: 'county-trial' } },
          { id: 'free', label: 'Play like he\'s got nothing to lose', desc: 'Four hundred kids — go and be memorable', outcome: 'He tries the audacious thing early, it comes off, and one of the men with clipboards writes his number down before half time.', effect: { attr: { flair: 2 }, form: 0.1, meters: { authority: 8 }, tag: 'county-trial' } },
        ],
      },
    },
  },
  {
    id: 'youth-hand-me-down', title: 'A Kit Two Sizes Too Big', icon: '👕', category: 'offpitch',
    minTurn: 1, maxTurn: 32, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His kit is his cousin\'s old one, sleeves past his elbows and shorts past his knees. One of the lads makes a joke about it that gets a bigger laugh than it deserves.',
        choices: [
          { id: 'own', label: 'Make it his thing', desc: 'Roll the sleeves up and get on with it', outcome: 'He rolls the sleeves, plays a blinder, and by the end of the month two other kids are wearing theirs the same way.', effect: { attr: { flair: 1, composure: 1 }, meters: { peers: 10 }, tag: 'owned-it' } },
          { id: 'burn', label: 'Say nothing and remember it', desc: 'File it away and use it', outcome: 'He doesn\'t react at all. He does, however, remember precisely who laughed, and plays like it for the rest of the season.', effect: { attr: { aggression: 1 }, form: 0.08, meters: { peers: -3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-teacher-doubt', title: '"And What If Football Doesn\'t Happen?"', icon: '📚', category: 'signature',
    minTurn: 8, maxTurn: 45, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His form tutor keeps him back and asks, kindly and quite reasonably, what the plan is if football doesn\'t happen. She has seen a lot of boys be sure about this.',
        choices: [
          { id: 'both', label: 'Tell her he\'ll do both', desc: 'Keep the grades up and chase it anyway', outcome: 'He promises to keep the grades up, and — unusually for a boy making that promise — actually does.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { school: 12, family: 6 }, tag: 'kept-grades' } },
          { id: 'certain', label: 'Tell her it\'s going to happen', desc: 'No backup, no hedging', outcome: 'He says it plainly, with no room in it for doubt. She writes something down, and stops asking.', effect: { attr: { leadership: 1 }, form: 0.06, meters: { school: -6, authority: 4 }, tag: 'no-plan-b' } },
          { id: 'honest', label: 'Admit he doesn\'t know', desc: 'He\'s thirteen. Nobody knows.', outcome: 'He says he doesn\'t know, and that he\'s frightened of it not working. She tells him that\'s the most sensible answer she\'s had all year.', effect: { attr: { composure: 2 }, meters: { school: 8, family: 4 } } },
        ],
      },
    },
  },
];
