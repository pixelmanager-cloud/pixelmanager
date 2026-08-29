// ── YOUTH: WORLD ARCS — school, the town, and growing up (ages 10-14) ─────────────────────────────
// Everything in a boy's life that ISN'T the football: lessons and teachers, exams and reports, other
// sports he's good at, the town he's from, the club he supports from the terrace, playground politics,
// the hobbies quietly being put down, the first strange moments of being known for something.
//
// Register: grounded British youth realism. No agents, no money, no fame, no romance. Meters used are only
// those live in these chapters — authority (Coach), family (Parents), peers (Mates), school (School).
import type { StoryArc } from '../storyarc.js';

export const YOUTH_WORLD_ARCS: StoryArc[] = [
  {
    id: 'youth-other-sport', title: 'The Other Thing He Was Good At', icon: '🏏', category: 'saga',
    minTurn: 3, maxTurn: 20, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The PE department has worked out he can bowl. Properly bowl — a long run-up, an arm like a whip, a school record in a summer term he barely thought about. The cricket master starts leaving letters about county trials in his bag, and the trials are in the same weeks football is.',
        choices: [
          { id: 'football', label: 'Say no to the cricket', desc: 'One thing, done properly', outcome: 'He tells the cricket master no. The man takes it well, says the door stays open, and never mentions it again — which is somehow worse than if he had argued.', effect: { meters: { school: -4, authority: 6 }, attr: { composure: 1 }, tag: 'world-one-sport' }, next: 'summer' },
          { id: 'both', label: 'Try to keep both going', desc: 'It is one summer. He can have one summer.', outcome: 'He does both for a term, and by July he is sunburnt, shattered, and slightly worse at each of them than he was in April.', effect: { energy: -12, meters: { school: 8, peers: 6 }, attr: { stamina: 1 }, tag: 'world-two-sports' }, next: 'summer' },
          { id: 'cricket', label: 'Go to the cricket trial', desc: 'Just to see. Just to know.', outcome: 'He goes, takes three wickets, and gets a card with a phone number on it. He puts it in a drawer and does not throw it away for years.', effect: { meters: { school: 10, authority: -6 }, attr: { creativity: 1 }, tag: 'world-cricket-card' }, next: 'summer' },
        ],
      },
      summer: {
        id: 'summer',
        prompt: 'August. The cricket season winds down without him in it, and a lad from his form is in the local paper for the county under-13s — a photograph, a name, a life he could have had a version of.',
        choices: [
          { id: 'peace', label: 'Be glad for him and mean it', desc: 'It was never really a choice, and he knows it', outcome: 'He cuts the picture out and sticks it in his own room, which he cannot fully explain to himself. It becomes a thing he looks at when he needs reminding what choosing costs.', effect: { attr: { composure: 2 }, meters: { peers: 8 } } },
          { id: 'sting', label: 'Let it sting', desc: 'Use it — never be the one in someone else\'s cutting', outcome: 'It nags at him all autumn and he trains like it. The edge is useful. It is not, on the whole, comfortable.', effect: { form: 0.07, attr: { aggression: 1, stamina: 1 }, energy: -6 } },
        ],
      },
    },
  },
  {
    id: 'youth-school-trip', title: 'The Trip He Isn\'t Going On', icon: '🚌', category: 'crisis',
    minTurn: 2, maxTurn: 18, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The whole year is going to France for a week in October. He has had the letter in his bag for a fortnight. The week clashes with everything, and the cost is a number he has already decided not to say out loud at home.',
        choices: [
          { id: 'skip', label: 'Bin the letter', desc: 'Do not make it anyone else\'s problem', outcome: 'He tells his form tutor he is not going, and does not give a reason. For five days in October he is one of nine kids left in a school built for a thousand.', effect: { meters: { peers: -8, family: 4 }, attr: { composure: 1 }, tag: 'world-trip-missed' }, next: 'return' },
          { id: 'ask', label: 'Ask at home anyway', desc: 'Give them the choice instead of making it for them', outcome: 'They find the money the way people find money — slowly, and by not mentioning what it came out of. He goes, and spends the week guilty and happy in roughly equal measure.', effect: { meters: { family: 8, peers: 10 }, energy: -6, attr: { teamwork: 1 }, tag: 'world-trip-went' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'They come back full of a week he was or wasn\'t part of — the ferry, the hypermarket, the thing that happened on the coach. In the corridor on Monday there is a whole conversation running that he can only half join in with.',
        choices: [
          { id: 'own', label: 'Say plainly why', desc: 'No shame in it, no drama about it', outcome: 'He says it cost too much and he had football, in a voice that closes the subject without slamming it. Nobody makes anything of it. He learns something about how to carry a thing.', effect: { attr: { leadership: 1, composure: 1 }, meters: { peers: 6 } } },
          { id: 'joke', label: 'Turn it into a joke', desc: 'Get in first, laugh loudest', outcome: 'He gets the joke in before anyone else can, and it works, and it costs him a small amount of something he does not have a word for yet.', effect: { attr: { flair: 1 }, meters: { peers: 8, school: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-rival-teacher', title: 'Mr Deakin Supports the Other Lot', icon: '📐', category: 'relationship',
    minTurn: 4, maxTurn: 22, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His maths teacher has a mug, a lanyard and thirty years of allegiance to the club up the road — the one his own town has spent a century resenting. Every Monday after a derby, the man teaches quadratics with a smirk that could strip paint.',
        choices: [
          { id: 'banter', label: 'Give it back', desc: 'Monday morning is a two-way street', outcome: 'He starts returning fire. Two terms of low-grade needling later they get on better than he does with any other teacher in the building, and his maths quietly improves out of pure competitiveness.', effect: { meters: { school: 10 }, attr: { flair: 1, composure: 1 }, tag: 'world-deakin-banter' }, next: 'letter' },
          { id: 'ignore', label: 'Keep his head down', desc: 'It is maths. Do the maths.', outcome: 'He lets it wash over him and does the work. Mr Deakin, who was mostly after a reaction, decides he is a serious kid and starts treating him like one.', effect: { meters: { school: 8 }, attr: { composure: 2 }, tag: 'world-deakin-quiet' }, next: 'letter' },
        ],
      },
      letter: {
        id: 'letter',
        prompt: 'End of year. The school needs a teacher to sign the form that lets him take Friday afternoons off for football, and the only one free is Deakin.',
        choices: [
          { id: 'ask', label: 'Go and ask him', desc: 'Straight to the desk, no messing', outcome: 'Deakin signs it without looking up, says "you\'ll be wasted there, mind", and hands it back. It is the closest thing to a blessing anyone at that school gives him.', effect: { meters: { school: 8, authority: 4 }, attr: { leadership: 1 } } },
          { id: 'avoid', label: 'Find another way round it', desc: 'Ask his tutor to do it instead', outcome: 'He gets the form signed elsewhere, and Deakin notices, and something small that had been getting friendlier goes back to being just a teacher and just a boy.', effect: { meters: { school: -4 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-bad-report', title: 'Could Do Better', icon: '📄', category: 'crisis',
    minTurn: 6, maxTurn: 24, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The report comes home in a sealed envelope. Two greens, a row of ambers, and one line in history that says he is capable and absent and that the two are probably connected. He reads it on the bus before anyone else does.',
        choices: [
          { id: 'hand', label: 'Hand it over unopened-looking', desc: 'Give it up straight away and stand there while it is read', outcome: 'He gives it over at the door and waits. The reading takes four minutes and feels like a season. Nothing much is said, which he finds he prefers to shouting.', effect: { meters: { family: 6, school: 4 }, attr: { composure: 1 }, tag: 'world-report-owned' }, next: 'fix' },
          { id: 'delay', label: 'Sit on it for a week', desc: 'The right moment will come along', outcome: 'It stays in his bag for nine days and gets worse every one of them. When it finally surfaces, the lateness is a bigger row than the ambers ever were.', effect: { meters: { family: -8, school: -4 }, energy: -4, tag: 'world-report-hidden' }, next: 'fix' },
        ],
      },
      fix: {
        id: 'fix',
        prompt: 'The history teacher who wrote the line keeps him back and asks, without any edge in it, what he thinks the honest version of that sentence is.',
        choices: [
          { id: 'truth', label: 'Tell her the honest version', desc: 'He is not absent. He is somewhere else in his head.', outcome: 'He says he is thinking about football in her lessons and that he does not know how to stop. She says that is the most useful thing a boy has told her all year, and moves him to the front.', effect: { meters: { school: 12 }, attr: { composure: 1, leadership: 1 } } },
          { id: 'promise', label: 'Promise to do better', desc: 'The answer that ends the conversation', outcome: 'He says the right words and she lets him go, and both of them know exactly what has just happened. He does improve a bit, out of embarrassment.', effect: { meters: { school: 4 }, attr: { teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-playground-fight', title: 'Behind the Sports Hall', icon: '💢', category: 'crisis',
    minTurn: 5, maxTurn: 24, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A lad in the year above has spent a fortnight calling him a big-time Charlie, and at half twelve on a Thursday, behind the sports hall, he says something about his family instead. There is a ring of thirty kids and about a second and a half to decide.',
        choices: [
          { id: 'swing', label: 'Swing', desc: 'Some things you do not stand there and take', outcome: 'It lasts eleven seconds and neither of them wins. He gets three days\' isolation, a split lip, and a reputation he did not entirely want and does not entirely mind.', effect: { meters: { school: -12, peers: 8, family: -6 }, attr: { aggression: 2 }, energy: -6, tag: 'world-fought' }, next: 'after' },
          { id: 'walk', label: 'Walk away', desc: 'Through the ring, out the other side, don\'t look back', outcome: 'He walks. Thirty kids watch him do it and half of them call him something for it. It takes about a fortnight for that to stop mattering, and it does stop.', effect: { attr: { composure: 2 }, meters: { peers: -6, school: 6 }, tag: 'world-walked' }, next: 'after' },
          { id: 'words', label: 'Answer him with words', desc: 'Say the one thing that ends it without a punch', outcome: 'He says something quiet and precise, and the crowd laughs at the wrong boy, and it is over. He is a bit frightened of how good he was at that.', effect: { attr: { flair: 1, composure: 1 }, meters: { peers: 10 }, tag: 'world-talked' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The head of year wants a version of events on paper by Friday, and the other lad has already handed one in.',
        choices: [
          { id: 'honest', label: 'Write what actually happened', desc: 'All of it, including his own part', outcome: 'He writes it straight, own share included. The punishment is the same either way, but the way the school talks to him afterwards is not.', effect: { meters: { school: 10, family: 6 }, attr: { leadership: 1 } } },
          { id: 'shield', label: 'Leave out what was said about his family', desc: 'Keep home out of a school corridor', outcome: 'He gives them a flat, incomplete account and takes the extra day for it. Some things are not for the head of year\'s filing cabinet.', effect: { meters: { school: -4, family: 10 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-instrument', title: 'The Trumpet in the Cupboard', icon: '🎺', category: 'relationship',
    minTurn: 1, maxTurn: 16, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has played the trumpet since he was eight and he is, by the standards of a school band, good at it. Rehearsals have moved to Tuesdays. Everything has moved to Tuesdays. The case has been shut for five weeks.',
        choices: [
          { id: 'quit', label: 'Tell Mrs Hallam he\'s stopping', desc: 'Do it properly, to her face', outcome: 'He goes to the music room and says it. She says she is sorry to lose him and asks him to keep the instrument, in case. It lives under his bed for the next decade.', effect: { meters: { school: -4, authority: 6 }, attr: { composure: 1 }, tag: 'world-trumpet-quit' }, next: 'concert' },
          { id: 'keep', label: 'Keep it going somehow', desc: 'Practise late, turn up when he can', outcome: 'He plays badly and irregularly and refuses to give it up, and is knackered on Wednesdays for a year. He also has one hour a week that belongs to nobody but him.', effect: { energy: -8, meters: { school: 8 }, attr: { creativity: 1 }, tag: 'world-trumpet-kept' }, next: 'concert' },
        ],
      },
      concert: {
        id: 'concert',
        prompt: 'The Christmas concert. He is in the audience or in the back row of the brass, and either way there is a moment in the second half where he thinks, clearly and without self-pity, that he is becoming a boy who only does one thing.',
        choices: [
          { id: 'accept', label: 'Decide that\'s the deal', desc: 'One thing, all the way in', outcome: 'He accepts it as the price and stops mourning it. There is a hardness to that which serves him well and which he will have to unlearn later.', effect: { attr: { composure: 2, stamina: 1 }, form: 0.05 } },
          { id: 'resist', label: 'Refuse to be only one thing', desc: 'Keep a corner of himself for something else', outcome: 'He promises himself he will always keep something that is not football, and mostly keeps the promise. It makes him harder to knock over than the boys who have nothing else.', effect: { attr: { creativity: 1, composure: 1 }, meters: { school: 6, family: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-terrace', title: 'The Corner Where His Grandad Stood', icon: '🎟️', category: 'saga',
    minTurn: 0, maxTurn: 14, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Saturday, three o\'clock, the town\'s ground. Fourteen thousand and a wet stand and a chant he has known longer than he has known his times tables. From this corner the pitch looks enormous, and full of men who are not, when you actually watch them, all that much better than the best boy at his club.',
        choices: [
          { id: 'watch', label: 'Watch one player all game', desc: 'Ignore the ball. Watch what a man does when he hasn\'t got it.', outcome: 'He spends ninety minutes watching the number eight walk, point, and arrive. He learns more from that afternoon than from a month of drills and cannot explain any of it out loud.', effect: { attr: { creativity: 1, composure: 1 }, meters: { authority: 4 }, tag: 'world-terrace-studied' }, next: 'after' },
          { id: 'sing', label: 'Sing until his voice goes', desc: 'Be twelve. Be one of fourteen thousand.', outcome: 'He loses his voice by the hour mark and does not care. Something about belonging to a place gets welded on that afternoon and never comes off.', effect: { meters: { peers: 8, family: 8 }, attr: { teamwork: 1 }, energy: -4, tag: 'world-terrace-sang' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'Walking back to the car park past the players\' gate, a man in a club coat asks if he plays, and when he says yes, asks which shirt he wants when he\'s older — this one, or a big one.',
        choices: [
          { id: 'home', label: '"This one."', desc: 'Say it and mean it, at twelve, in the rain', outcome: 'He says this one. The man laughs kindly and says everyone says that. He carries the sentence around for years, mostly as a promise, occasionally as a burden.', effect: { attr: { leadership: 1 }, meters: { family: 8, peers: 6 }, tag: 'world-town-vow' } },
          { id: 'big', label: '"The biggest one there is."', desc: 'No point pretending otherwise', outcome: 'He says it without blinking, and the man\'s face does something complicated. His dad, two steps behind, says nothing at all the whole way home.', effect: { attr: { leadership: 1, aggression: 1 }, form: 0.06, meters: { family: -2 }, tag: 'world-big-vow' } },
        ],
      },
    },
  },
  {
    id: 'youth-bully', title: 'The Boy at the Bus Stop', icon: '🚏', category: 'crisis',
    minTurn: 4, maxTurn: 22, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a lad who waits at the same stop and has decided that a kid with a kit bag is worth ten minutes of his afternoon. Nothing you could report — a shove, the bag on the floor, the same joke about being on telly one day. Every day for a term.',
        choices: [
          { id: 'route', label: 'Change his route', desc: 'Walk the long way. Twenty minutes. Every day.', outcome: 'He walks the long way for a whole term and tells nobody why. He is never late and never complains, and by spring he is the fittest boy in his year without having tried to be.', effect: { attr: { stamina: 2 }, energy: -6, meters: { peers: -2 }, tag: 'world-bully-avoided' }, next: 'end' },
          { id: 'tell', label: 'Tell someone', desc: 'Say it out loud to an adult he trusts', outcome: 'He tells someone, which costs him more than the shoves did. It gets dealt with in about four days, and he spends longer than that feeling odd about having asked for help.', effect: { meters: { school: 8, family: 8 }, attr: { composure: 1 }, tag: 'world-bully-told' }, next: 'end' },
          { id: 'stand', label: 'Stand there and take it', desc: 'Same stop, same time, every day, until he gets bored', outcome: 'He keeps turning up at the same stop and refuses to look away, and after five weeks the other lad simply stops. Neither of them ever mentions it again.', effect: { attr: { composure: 2, aggression: 1 }, energy: -6, tag: 'world-bully-outlasted' }, next: 'end' },
        ],
      },
      end: {
        id: 'end',
        prompt: 'Two years on, the same lad is on the touchline at a Sunday game — his little brother is on the other team — and he looks over and gives a nod, as if none of it ever happened.',
        choices: [
          { id: 'nod', label: 'Nod back', desc: 'Let it go. It costs nothing.', outcome: 'He nods back and gets on with the warm-up. Letting it go turns out to be a skill, and one he uses a great deal more than he expects to.', effect: { attr: { composure: 2, leadership: 1 }, meters: { peers: 6 } } },
          { id: 'blank', label: 'Look straight through him', desc: 'He remembers. Why pretend otherwise?', outcome: 'He looks through him like glass and plays the best forty-five minutes of his month. Some fuel is cheap and burns very hot.', effect: { form: 0.08, attr: { aggression: 1 }, energy: -4 } },
        ],
      },
    },
  },
  {
    id: 'youth-two-shirts', title: 'Two Shirts, One Saturday', icon: '👕', category: 'crisis',
    minTurn: 8, maxTurn: 26, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The school has reached a county semi-final for the first time since 1994, and the PE staff have asked for him. The academy\'s letter about outside fixtures is in his bag, unsigned, and says what those letters always say.',
        choices: [
          { id: 'school', label: 'Play for the school', desc: 'Thirty lads he sees every day of his life', outcome: 'He plays. The school loses on penalties and he is the last one off the pitch, and nobody at the academy says a word about it for a month, which is not the same as it being fine.', effect: { meters: { school: 14, peers: 10, authority: -10 }, energy: -8, attr: { teamwork: 1 }, tag: 'world-school-shirt' }, next: 'monday' },
          { id: 'academy', label: 'Follow the letter', desc: 'The rules exist for a reason and he is inside them', outcome: 'He hands the letter back signed and does not play. The PE teacher says he understands, in the voice teachers use when they understand and are disappointed anyway.', effect: { meters: { authority: 10, school: -10, peers: -8 }, attr: { composure: 1 }, tag: 'world-academy-shirt' }, next: 'monday' },
          { id: 'ask', label: 'Ask for permission properly', desc: 'Go to both sets of adults and make them talk to each other', outcome: 'He makes two phone calls he is far too young to be making, and ends up with a compromise — one half, no penalties. Everyone is mildly annoyed, which is roughly what a compromise is.', effect: { meters: { school: 6, authority: 4, peers: 4 }, attr: { leadership: 2 }, energy: -6, tag: 'world-brokered' }, next: 'monday' },
        ],
      },
      monday: {
        id: 'monday',
        prompt: 'Monday morning, form room. Whatever he chose, the boys who were in that team are talking about the semi-final, and he is either in the story or a hole in it.',
        choices: [
          { id: 'in', label: 'Sit in it with them', desc: 'Take whatever version of it belongs to him', outcome: 'He sits in the middle of it and takes what he is given, applause or silence. Being in a room and not managing the room is a thing he is quietly getting good at.', effect: { meters: { peers: 8 }, attr: { teamwork: 1, composure: 1 } } },
          { id: 'out', label: 'Keep out of the way', desc: 'Not his to claim either way', outcome: 'He keeps his head in a book at the back and lets them have it. It is the decent thing and it is also, slightly, hiding.', effect: { attr: { composure: 1 }, meters: { school: 4, peers: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-empty-summer', title: 'Six Weeks and Nothing In Them', icon: '🌾', category: 'saga',
    minTurn: 7, maxTurn: 24, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The season ended in May and nothing starts again until August. No school, no sessions, no fixtures. Six weeks of a town with one shut leisure centre, a rec with a broken net, and a heat that makes the whole place feel abandoned.',
        choices: [
          { id: 'work', label: 'Get himself a summer job', desc: 'Stacking shelves, washing vans, anything', outcome: 'He does four weeks at a garden centre lifting bags of compost, and comes back to pre-season with forearms and an entirely new understanding of what a long day is.', effect: { attr: { stamina: 2 }, meters: { family: 8 }, energy: -6, tag: 'world-summer-job' }, next: 'august' },
          { id: 'wall', label: 'Spend it against a wall', desc: 'Same wall, same foot, every afternoon until dark', outcome: 'Six weeks, one wall, and a left foot that comes back in August noticeably less useless than it went away. Nobody sees any of it happen.', effect: { attr: { flair: 1, creativity: 1 }, form: 0.08, tag: 'world-summer-wall' }, next: 'august' },
          { id: 'nothing', label: 'Do absolutely nothing', desc: 'Be a kid for six weeks. It might be the last chance.', outcome: 'He does nothing at all — the rec, the shop, the long light evenings, lying on the grass talking rubbish. He is never quite this free again and he half knows it at the time.', effect: { energy: 12, meters: { peers: 12 }, attr: { creativity: 1 }, tag: 'world-summer-free' }, next: 'august' },
        ],
      },
      august: {
        id: 'august',
        prompt: 'First week back. Someone in the group has plainly done nothing for six weeks, and someone has plainly done nothing else, and the running test is on Thursday.',
        choices: [
          { id: 'front', label: 'Set the pace from the front', desc: 'Whatever the summer was, answer for it now', outcome: 'He goes to the front and stays there, lungs burning, and finishes the summer question in about nine minutes of running.', effect: { energy: -10, form: 0.07, attr: { stamina: 1, leadership: 1 }, meters: { authority: 8 } } },
          { id: 'pace', label: 'Run it sensibly', desc: 'August is not the month that matters', outcome: 'He runs a measured, unspectacular test and saves himself for a season that is eleven months long. Nobody notices, which was the point.', effect: { attr: { composure: 2 }, energy: 4, meters: { authority: 2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-big-school', title: 'First Day at the Big School', icon: '🏫', category: 'saga',
    minTurn: 9, maxTurn: 20, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twelve hundred kids, a blazer bought two sizes too big, and a building where nobody knows that he is the boy who scored forty goals last year. On the first morning he is nothing at all, and the corridors are very loud.',
        choices: [
          { id: 'quiet', label: 'Say nothing about football', desc: 'Let them find out, or not', outcome: 'He gets through six weeks as an anonymous kid at the back, and finds he rather likes the version of himself that exists when nobody is watching for anything.', effect: { attr: { composure: 2 }, meters: { school: 8 }, tag: 'world-anon' }, next: 'trial' },
          { id: 'stake', label: 'Plant his flag early', desc: 'First break, biggest game on the yard, walk on', outcome: 'He walks onto the biggest game on the yard at first break, uninvited, and by Wednesday twelve hundred kids have a rough idea who he is.', effect: { meters: { peers: 12, school: -2 }, attr: { leadership: 1, flair: 1 }, tag: 'world-flag' }, next: 'trial' },
        ],
      },
      trial: {
        id: 'trial',
        prompt: 'Year seven trials, second week of term. A PE teacher with a clipboard and ninety hopeful boys on one bald pitch, and about four minutes each to make an impression.',
        choices: [
          { id: 'show', label: 'Do the flashy thing', desc: 'Four minutes. Make them memorable.', outcome: 'He does the thing he can do, in front of ninety kids and a man with a whistle. It works, and it also means that from that afternoon on there is an expectation attached to his name.', effect: { form: 0.06, attr: { flair: 2 }, meters: { peers: 8, school: 6 } } },
          { id: 'simple', label: 'Keep it simple and let it show', desc: 'Two-touch, head up, nothing wasted', outcome: 'He plays it plain and the teacher writes something down anyway. The lads who tried tricks do not get written down.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { school: 8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-paper-round', title: 'Half Six on a Wednesday', icon: '📰', category: 'offpitch',
    minTurn: 6, maxTurn: 24, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The newsagent on the parade wants someone for the morning round. Half six starts, a bag that cuts into the shoulder, and a wage that would make him the first person in his year with his own money.',
        choices: [
          { id: 'take', label: 'Take the round', desc: 'Up at six, out in the dark, back for eight', outcome: 'He does it for eleven months, through a winter that is genuinely horrible. He is tired in a new way and he never once has to ask anyone at home for anything again.', effect: { attr: { stamina: 2, composure: 1 }, energy: -10, meters: { family: 10 }, tag: 'world-round-taken' }, next: 'winter' },
          { id: 'pass', label: 'Turn it down', desc: 'Sleep is not a luxury when you train four nights a week', outcome: 'He says no, and a lad in his form takes it instead, and turns up to school in January looking like a man who has aged four years. He does not regret it, exactly.', effect: { energy: 8, attr: { composure: 1 }, meters: { authority: 4 }, tag: 'world-round-passed' }, next: 'winter' },
        ],
      },
      winter: {
        id: 'winter',
        prompt: 'January. Dark at half seven in the morning, dark again by four, and a session on Tuesday he can feel coming towards him all day like weather.',
        choices: [
          { id: 'through', label: 'Get through it without mentioning it', desc: 'Nobody needs the running commentary', outcome: 'He says nothing to anyone about being tired, all winter. It is admirable and it is also how boys learn to be no good at saying when something is wrong.', effect: { attr: { composure: 1, stamina: 1 }, energy: -6, meters: { authority: 4 } } },
          { id: 'say', label: 'Admit he\'s knackered', desc: 'Say it out loud to somebody', outcome: 'He admits it, and the world does not end, and something in the week gets rearranged to make it survivable. It is a small and genuinely useful lesson.', effect: { energy: 8, meters: { family: 8, school: 4 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-the-screen', title: 'One in the Morning, Still Watching', icon: '📱', category: 'offpitch',
    minTurn: 8, maxTurn: 26, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A phone in the dark, and an endless supply of fourteen-year-olds in other countries doing things he cannot do. Twenty seconds each, best moments only, no bad touches ever. It is one in the morning and there is school in six hours.',
        choices: [
          { id: 'learn', label: 'Watch it like homework', desc: 'One move, wound back forty times, taken to the park on Saturday', outcome: 'He starts using it properly — one thing at a time, watched to death, then dragged out into the cold and failed at for a month until it isn\'t a failure any more.', effect: { attr: { creativity: 2 }, form: 0.05, energy: -4, tag: 'world-screen-tool' }, next: 'compare' },
          { id: 'binge', label: 'Keep scrolling', desc: 'Just a bit more. It is nearly two.', outcome: 'He goes to bed at half two and is useless at school and worse at training on Wednesday. It happens three nights a week for a season before he notices the pattern.', effect: { energy: -12, meters: { school: -6, authority: -4 }, tag: 'world-screen-lost' }, next: 'compare' },
          { id: 'off', label: 'Put it face down and sleep', desc: 'None of those boys are in his league', outcome: 'He turns it over and goes to sleep, which at fourteen is a genuine act of discipline. He is one of the only lads at training on Wednesday who is not grey.', effect: { energy: 10, attr: { composure: 2 }, meters: { authority: 4 }, tag: 'world-screen-off' }, next: 'compare' },
        ],
      },
      compare: {
        id: 'compare',
        prompt: 'One of the clips has a caption saying the boy in it is a year younger than him. He watches it four times and then sits on the edge of his bed doing sums about his own life.',
        choices: [
          { id: 'own', label: 'Measure himself against Saturday', desc: 'The only comparison that means anything is the next game', outcome: 'He decides the only opponent is the version of himself that turned up last Saturday. It is not a cure but it is a way of standing up.', effect: { attr: { composure: 2 }, form: 0.06, meters: { authority: 4 } } },
          { id: 'chase', label: 'Try to close the gap', desc: 'Do more. Do it now. Do it in the garden in the dark.', outcome: 'He goes out at half ten at night to work on it, in November, on his own. It helps and it also starts a habit of never thinking he has done enough.', effect: { attr: { flair: 1, stamina: 1 }, energy: -10, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'youth-recognised', title: 'The Woman in the Chemist', icon: '👀', category: 'relationship',
    minTurn: 12, maxTurn: 28, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He is buying plasters in the chemist on the high street when a woman he has never met says his surname, as a question, and then tells him her nephew is in his year and that everyone round here knows who he is now. He is fourteen and holding a box of plasters.',
        choices: [
          { id: 'polite', label: 'Be polite and get out', desc: 'Thanks, yeah, cheers, bye', outcome: 'He manages four words and leaves with his ears burning, and thinks about it for the rest of the day. It is the first time his name has arrived somewhere before he did.', effect: { attr: { composure: 1 }, meters: { peers: 4 }, tag: 'world-first-recognised' }, next: 'town' },
          { id: 'chat', label: 'Stop and talk to her', desc: 'She is somebody\'s aunt in his own town', outcome: 'He stands in the chemist for ten minutes talking about her nephew\'s team, and she tells three people about it by teatime, and the town decides he is all right.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 8, family: 6 }, tag: 'world-town-likes-him' }, next: 'town' },
        ],
      },
      town: {
        id: 'town',
        prompt: 'It keeps happening — the barber, the bloke on the market, someone\'s dad in the queue at the chippy. The town has quietly decided he belongs to it, and has opinions about how he is getting on.',
        choices: [
          { id: 'carry', label: 'Carry it', desc: 'Let a town have a share in him', outcome: 'He decides it is a good thing to be watched over by a place, and lets them have it. When things go badly later, that same town does not put him down.', effect: { attr: { leadership: 1, composure: 1 }, meters: { peers: 10, family: 8 } } },
          { id: 'shrink', label: 'Keep his head down in town', desc: 'Hood up, other side of the road, home', outcome: 'He starts taking the back streets and going to the big Tesco two towns over. It works, and it also makes his own high street a slightly smaller place for him.', effect: { attr: { composure: 1 }, meters: { peers: -6 }, energy: -2 } },
        ],
      },
    },
  },
  {
    id: 'youth-careers-lesson', title: 'The Careers Lesson', icon: '🧭', category: 'offpitch',
    minTurn: 15, maxTurn: 29, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A double period in the ICT room with a woman from the council and a questionnaire that turns thirty answers into three job titles. His comes out as: warehouse operative, groundsman, PE teacher. There is a box at the bottom for "other".',
        choices: [
          { id: 'write', label: 'Write it in the box', desc: 'Footballer. In pen. In front of everyone.', outcome: 'He writes it in and hands it in, and half the room sees, and two of them laugh. He hands it in anyway, which is the whole of the thing really.', effect: { attr: { leadership: 2 }, meters: { peers: -2, school: 4 }, tag: 'world-wrote-it' }, next: 'talk' },
          { id: 'sensible', label: 'Tick a sensible one', desc: 'PE teacher. Easier. Nobody asks a follow-up.', outcome: 'He ticks PE teacher and the lesson moves on, and he sits there for forty minutes annoyed at himself in a way he cannot quite justify.', effect: { meters: { school: 6 }, attr: { composure: 1 }, tag: 'world-ticked-safe' }, next: 'talk' },
          { id: 'joke', label: 'Put down something daft', desc: 'Astronaut. Get a laugh. Move on.', outcome: 'He writes astronaut, gets his laugh, and the woman from the council writes something in her own notes that he does not get to see.', effect: { attr: { flair: 1 }, meters: { peers: 8, school: -4 }, tag: 'world-joked' }, next: 'talk' },
        ],
      },
      talk: {
        id: 'talk',
        prompt: 'At the end she keeps him back for two minutes and asks, quite gently, what he will do at eighteen if the football has not happened by then.',
        choices: [
          { id: 'afraid', label: 'Tell her he doesn\'t know', desc: 'And that the not-knowing frightens him', outcome: 'He admits he has no idea, and that the blankness where the answer should be scares him. She tells him that is the most sensible answer she has had all year, and gives him a leaflet he actually reads.', effect: { attr: { composure: 2 }, meters: { school: 12, family: 6 } } },
          { id: 'certain', label: 'Tell her it will have happened', desc: 'No hedge, no maybe', outcome: 'He says it will have happened. She writes it down without arguing, and he walks out into the corridor feeling brilliant and, an hour later, slightly sick.', effect: { attr: { leadership: 1, aggression: 1 }, form: 0.06, meters: { school: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-the-video', title: 'Forty Seconds, Round the Whole Year', icon: '🎬', category: 'crisis',
    minTurn: 14, maxTurn: 29, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody filmed him at a Sunday game on a phone. Forty seconds, wobbly, someone\'s dad shouting over it — and by Tuesday break it has gone round the entire year group, with a caption he did not write.',
        choices: [
          { id: 'enjoy', label: 'Enjoy it', desc: 'It is a good forty seconds. Let it be good.', outcome: 'He lets himself enjoy it for about a week, and it is genuinely one of the better weeks of his school life. Then it stops, the way these things do, in about nine days.', effect: { meters: { peers: 12 }, attr: { flair: 1 }, form: 0.05, tag: 'world-video-enjoyed' }, next: 'after' },
          { id: 'cringe', label: 'Want it to stop', desc: 'Forty seconds is not him and he knows it', outcome: 'He asks the lad who filmed it to take it down, which does absolutely nothing, and spends a fortnight being introduced to strangers as a video.', effect: { meters: { peers: -4, school: 4 }, attr: { composure: 2 }, tag: 'world-video-hated' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The next Sunday there are four phones up behind the goal before kick-off, held by kids from his school who have never watched him play before.',
        choices: [
          { id: 'ignore', label: 'Play as if they aren\'t there', desc: 'The game does not change because it is being filmed', outcome: 'He plays a completely normal, useful, unspectacular game and does not once look at the touchline. It is the least fun and most professional ninety minutes of his childhood.', effect: { attr: { composure: 2, teamwork: 1 }, meters: { authority: 8 }, form: 0.05 } },
          { id: 'perform', label: 'Give them something', desc: 'They came to see it. Let them see it.', outcome: 'He plays for the phones, tries three things that are not on, and pulls one of them off. The clip is superb. The game is not one of his better ones.', effect: { attr: { flair: 2 }, meters: { peers: 10, authority: -6 }, form: -0.03 } },
        ],
      },
    },
  },
  {
    id: 'youth-autograph', title: 'Sign My Planner Then', icon: '✍️', category: 'relationship',
    minTurn: 16, maxTurn: 30, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Registration. A lad from the back slides his school planner across the desk and says, deadpan, that he wants it signed before it is worth something. Half the form is watching to see what he does with it.',
        choices: [
          { id: 'sign', label: 'Sign it', desc: 'Big daft signature, all the way across the page', outcome: 'He signs it enormously, wrong way up, and the room falls apart. The lad keeps the planner. Years later it is still in a drawer at his mum\'s house.', effect: { meters: { peers: 12 }, attr: { flair: 1, leadership: 1 }, tag: 'world-signed-it' }, next: 'later' },
          { id: 'refuse', label: 'Slide it back', desc: 'He hasn\'t done anything yet and they both know it', outcome: 'He pushes it back and says ask him when he has actually done something. It lands somewhere between humble and cold, and the room cannot decide which.', effect: { attr: { composure: 2 }, meters: { peers: -4, authority: 4 }, tag: 'world-refused-it' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'The joke does not go away. For the rest of the term he is "the famous one" in every lesson, said with affection about eighty per cent of the time.',
        choices: [
          { id: 'lean', label: 'Take the nickname', desc: 'Let them have it. It is only a name.', outcome: 'He answers to it, does the bit, and it wears out by Easter like every school nickname does. Being laughed at fondly turns out to be quite good practice.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { peers: 10 } } },
          { id: 'weight', label: 'Feel the weight of it', desc: 'Every joke about it is also an expectation', outcome: 'He hears the other thing underneath the joke — that a whole year group is now waiting to find out — and it sits on him for a while. He starts training on Sunday mornings as well.', effect: { attr: { stamina: 1, composure: 1 }, energy: -8, form: 0.06, meters: { authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-town-name', title: 'What They Say About His Town', icon: '🏭', category: 'saga',
    minTurn: 18, maxTurn: 30, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'At a tournament forty miles away, a boy from a leafier place asks where he is from, and when he says it, laughs and says a thing about it that he has heard on television. Everyone else in the room is from somewhere nobody makes jokes about.',
        choices: [
          { id: 'proud', label: 'Say it louder', desc: 'Say the name of the town again, properly', outcome: 'He repeats the name of his town like it is a fact rather than an apology, and the joke dies of embarrassment. He is surprised at how much he meant it.', effect: { attr: { leadership: 2 }, meters: { peers: 6, family: 8 }, tag: 'world-town-proud' }, next: 'home' },
          { id: 'laugh', label: 'Laugh along', desc: 'Easier. Everyone else is laughing.', outcome: 'He laughs with them, and spends the coach home going quietly over it, and decides — somewhere on the A-road — that he will not do that again.', effect: { attr: { composure: 1 }, meters: { peers: 4, family: -6 }, tag: 'world-town-laughed' }, next: 'home' },
          { id: 'play', label: 'Answer him on the pitch', desc: 'Nothing to say. Sixty minutes to say it in.', outcome: 'He does not answer at all, and then spends an hour taking the boy\'s team apart with a face like a closed door. Nobody asks him where he is from again all weekend.', effect: { form: 0.09, attr: { aggression: 1, stamina: 1 }, energy: -8, tag: 'world-town-answered' }, next: 'home' },
        ],
      },
      home: {
        id: 'home',
        prompt: 'The coach comes back over the hill at nine at night and the town is laid out below in orange lights — the retail park, the two chimneys, the estate, the ground with its floodlights off. Every other lad on the bus is asleep.',
        choices: [
          { id: 'stay', label: 'Decide it is his', desc: 'Whatever anyone says about it', outcome: 'He decides that whatever the place is, it is his, and that he would quite like to be the reason somebody stops making that joke. It is the closest thing to an ambition he has ever had that is not about himself.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { family: 10, peers: 8 } } },
          { id: 'leave', label: 'Decide he is getting out', desc: 'Football is the door and he can see it from here', outcome: 'He looks at the orange lights and thinks: not for ever. It is a harder, colder fuel than the other kind, and it burns just as well.', effect: { form: 0.07, attr: { aggression: 1, composure: 1 }, meters: { family: -2 } } },
        ],
      },
    },
  },
];
