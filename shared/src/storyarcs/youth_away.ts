// ── YOUTH: AWAY ARCS — travel, tournaments and away days (ages 10-14) ─────────────────────────────
// Everything about going somewhere to play: the minibus at six in the morning, service stations, four
// games in a day, sports hall floors, host families, a first passport, other clubs' facilities, the long
// silent drive home. The journey is the subject — not the parents, not the coach, not the league fixture.
//
// Register: grounded British youth realism. No agents, no money, no fame, no romance. Meters used are only
// those live in these chapters — authority (Coach), family (Parents), peers (Mates), school (School).
import type { StoryArc } from '../storyarc.js';

export const YOUTH_AWAY_ARCS: StoryArc[] = [
  {
    id: 'youth-away-four-in-a-day', title: 'Four Games Before Tea', icon: '⏱️', category: 'saga',
    minTurn: 1, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A festival on eleven pitches cut into one enormous field. The schedule says four group games between nine and two, twenty minutes each way, ten minutes between. By game three his socks are still wet from game one and his legs have stopped answering questions.',
        choices: [
          { id: 'ration', label: 'Ration himself across the four', desc: 'Play at seven-tenths and still be standing at two', outcome: 'He walks bits of the second and third that he would normally run, and in the fourth he is the only one on the pitch who can still pick a pass. Nobody notices the arithmetic he did to get there.', effect: { energy: -10, attr: { composure: 2, stamina: 1 }, tag: 'away-paced-himself' }, next: 'last' },
          { id: 'flat', label: 'Empty himself in every one', desc: 'There is no clever way to play football', outcome: 'He is magnificent for two games, ordinary in the third, and a passenger in the fourth. Somebody\'s dad on the touchline says the boy has run himself into the ground, admiringly, which does not help.', effect: { energy: -22, form: 0.05, attr: { stamina: 2, aggression: 1 }, tag: 'away-emptied-himself' }, next: 'last' },
          { id: 'sub', label: 'Ask to sit one out', desc: 'Say the thing nobody says at a tournament', outcome: 'He asks, quietly, and gets twenty minutes on a kit bag watching his team win without him. It is the most useful and least enjoyable rest of his life.', effect: { energy: -4, meters: { peers: -4, authority: 3 }, attr: { composure: 1 }, tag: 'away-sat-one-out' }, next: 'last' },
        ],
      },
      last: {
        id: 'last',
        prompt: 'Quarter-final, half past three, the eighth hour on that field. The pitch has been played on all day and the grass is gone in the middle. Both teams are moving like men twice their age. Somebody has to do something.',
        choices: [
          { id: 'run', label: 'Make one more run than anyone else', desc: 'Whoever moves first probably wins this', outcome: 'He goes on the half-hour, alone, thirty yards through nobody, and squares it. The celebration is exhausted and enormous. He is sick behind the goal afterwards and does not tell a soul.', effect: { form: 0.1, energy: -14, attr: { stamina: 2, leadership: 1 } } },
          { id: 'simple', label: 'Keep it simple and let the tired ones break', desc: 'Pass it, move, wait for a mistake', outcome: 'He plays fifteen five-yard passes and one twelve-yard one, and the twelve-yard one is the goal. It is the least spectacular good game he ever plays.', effect: { form: 0.07, attr: { composure: 2, teamwork: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-away-kit-left-behind', title: 'The Bag That Stayed in the Hallway', icon: '🎒', category: 'crisis',
    minTurn: 0, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ninety miles from home, in a car park behind a leisure centre, he opens the boot and understands with total clarity where his boots are: by the front door, where he put them so he could not possibly forget them.',
        choices: [
          { id: 'own-up', label: 'Own up straight away', desc: 'Say it out loud in front of everyone', outcome: 'He says it in one flat sentence and stands there while it lands. Two lads laugh, one goes and finds a spare pair in a lost-property crate, and the whole thing is over in ninety seconds.', effect: { meters: { authority: -3, peers: 4 }, attr: { composure: 2 }, tag: 'away-owned-up' }, next: 'borrowed' },
          { id: 'hide', label: 'Say nothing and hope', desc: 'Maybe somebody has spares. Maybe it sorts itself.', outcome: 'He carries the empty boot bag around for forty minutes like it has something in it, until the warm-up starts and there is nowhere left to stand.', effect: { meters: { authority: -8, peers: -3 }, attr: { composure: -1 }, tag: 'away-hid-it' }, next: 'borrowed' },
        ],
      },
      borrowed: {
        id: 'borrowed',
        prompt: 'He plays in boots a size and a half too big, stuffed at the toe with a rolled-up sock. They belong to a boy on the other team who shrugged and said just bring them back.',
        choices: [
          { id: 'play', label: 'Play in them anyway', desc: 'They are boots. Boots are boots.', outcome: 'He slides about for a half and adapts in the second, shortening his stride, and finds that he can play a completely different way when his feet are not his own. He gives them back cleaned.', effect: { attr: { creativity: 1, composure: 1 }, energy: -6, meters: { peers: 4 } } },
          { id: 'list', label: 'Make a packing list that night', desc: 'Never once, ever again', outcome: 'He writes fourteen items on the back of the fixture card and tapes it inside the boot bag. It stays there, greyed and soft, for the next four years.', effect: { attr: { composure: 2 }, meters: { authority: 4, family: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-away-service-station', title: 'Junction 14, Ten to Seven', icon: '⛽', category: 'offpitch',
    minTurn: 0, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The minibus stops at a service station in the dark. Strip lights, a smell of fried bread, a machine that gives out hot chocolate in a thin cardboard cup. They have twelve minutes and everyone is spending them differently.',
        choices: [
          { id: 'eat', label: 'Buy the enormous breakfast', desc: 'It is a long day and he is starving now', outcome: 'He eats a bap the size of his head in nine minutes and regrets it for the entire first half, running with something solid and unfriendly sitting under his ribs.', effect: { energy: -6, form: -0.04, meters: { peers: 5 }, tag: 'away-service-bap' } },
          { id: 'wait', label: 'Just a drink and wait for later', desc: 'Kickoff is at half nine', outcome: 'He sits with a hot chocolate watching the others eat, feeling briefly like the boring one, and starts the game light and sharp. He never eats before a kickoff again.', effect: { attr: { composure: 1 }, form: 0.04, tag: 'away-service-light' } },
          { id: 'wander', label: 'Wander off and look at the map', desc: 'The big one on the wall with the red dot', outcome: 'He stands in front of the motorway map working out how far from home he actually is, and how far the country goes past that. He is last back on the bus and does not mind the shout.', effect: { meters: { authority: -3 }, attr: { creativity: 2 }, tag: 'away-service-map' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-first-abroad', title: 'A Passport With Nothing In It', icon: '🛫', category: 'saga',
    minTurn: 4, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tournament in Holland. His first passport, three weeks old, the photograph making him look startled. At the airport he keeps checking the pocket it is in, then checking again, until a lad tells him to give it a rest.',
        choices: [
          { id: 'stick', label: 'Stick close to the lads he knows', desc: 'Get through the day without anything going wrong', outcome: 'He shadows two mates from gate to gate and arrives having seen nothing but the backs of their heads. It works. It is also a wasted morning he thinks about later.', effect: { meters: { peers: 5 }, attr: { composure: 1, creativity: -1 }, tag: 'away-abroad-cautious' }, next: 'field' },
          { id: 'look', label: 'Look at everything, out loud', desc: 'He has never seen a country before', outcome: 'He is unembarrassed about being amazed — the flat green out of the window, the signs, the coins. Two of the older boys take the mickey and then start pointing things out to him themselves.', effect: { meters: { peers: 3 }, attr: { creativity: 2 }, energy: -6, tag: 'away-abroad-wide-eyed' }, next: 'field' },
        ],
      },
      field: {
        id: 'field',
        prompt: 'The complex has fourteen pitches, all of them flat, all of them the same shade of green, and a clubhouse with a proper canteen. He has never played anywhere that was not on a slope with a fence round it.',
        choices: [
          { id: 'awe', label: 'Let it get to him', desc: 'This is what it looks like somewhere else', outcome: 'He plays the first game two yards off it, still half-looking around. By the second he has stopped seeing the pitches and started seeing the game, but the first is gone.', effect: { form: -0.05, attr: { composure: 1 }, energy: -4 } },
          { id: 'use', label: 'Use the surface', desc: 'It rolls true here. Play the passes that do not survive at home.', outcome: 'He tries balls he would never risk on a bobbling parks pitch and half of them come off. He goes home with a different idea of what a pass is.', effect: { form: 0.08, attr: { creativity: 2, flair: 1 } } },
          { id: 'home', label: 'Miss home, quietly, in the middle of it', desc: 'It is a lot, all at once', outcome: 'Between games he sits on his bag with a foreign chocolate bar feeling flatly, stupidly homesick in the sunshine. It passes by evening and he tells nobody it happened.', effect: { energy: -6, meters: { family: 6 }, attr: { composure: 2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-away-host-family', title: 'A Bedroom That Isn\'t His', icon: '🏠', category: 'relationship',
    minTurn: 6, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'On tour they are billeted with families from the host club. He gets a house with a dog, a boy his own age called Mattis who plays right back, and a dinner at half five involving something he cannot identify.',
        choices: [
          { id: 'polite', label: 'Be flawlessly polite and eat all of it', desc: 'Say please, say thank you, say nothing else', outcome: 'He clears the plate, says thank you four times, and spends the evening sitting very upright. They think he is lovely. He has never been so tired from doing nothing.', effect: { attr: { composure: 2 }, meters: { family: 4 }, energy: -5, tag: 'away-host-polite' }, next: 'goodbye' },
          { id: 'friend', label: 'Try to talk to Mattis', desc: 'Twenty words of English between them, and a ball in the garden', outcome: 'They give up on talking within ten minutes and go outside instead. Two hours of one-touch against a garage door does the job that conversation could not.', effect: { meters: { peers: 8 }, attr: { teamwork: 2, flair: 1 }, tag: 'away-host-mattis' }, next: 'goodbye' },
          { id: 'retreat', label: 'Go up to the room early', desc: 'It is too much and the bed is right there', outcome: 'He lies on a strange duvet listening to a family being a family in a language he does not have, and feels further from home than the map says he is.', effect: { energy: 4, meters: { family: 6, peers: -4 }, attr: { composure: 1 }, tag: 'away-host-retreated' }, next: 'goodbye' },
        ],
      },
      goodbye: {
        id: 'goodbye',
        prompt: 'Sunday morning. The bus is idling and the mother of the house is holding out a bag of food for the journey and taking a photograph he has not agreed to be in.',
        choices: [
          { id: 'address', label: 'Swap addresses', desc: 'Mean it, even if it fades', outcome: 'They write on the backs of two team sheets. Three letters cross the North Sea over the next year, then none. He keeps the last one.', effect: { meters: { peers: 6 }, attr: { teamwork: 1 } } },
          { id: 'shirt', label: 'Give Mattis his shirt', desc: 'He has another. Sort of.', outcome: 'He hands over his club shirt with the number still peeling and gets one back that is far too big. His own kit man is furious for exactly one week.', effect: { meters: { peers: 8, authority: -4 }, attr: { leadership: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-away-sports-hall-floor', title: 'Sleeping on the Badminton Lines', icon: '🛏️', category: 'offpitch',
    minTurn: 2, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The accommodation for the tournament weekend is a school sports hall: forty boys, forty roll mats, one strip of emergency lighting that never goes off, and a floor marked out in four colours of tape.',
        choices: [
          { id: 'early', label: 'Get his head down early', desc: 'Two games tomorrow before eleven', outcome: 'He is asleep by ten and awake at one, three, and half four, as the hall breathes and giggles around him. It counts as rest by the loosest possible definition.', effect: { energy: -6, attr: { composure: 1 }, tag: 'away-hall-early' } },
          { id: 'talk', label: 'Talk rubbish until two in the morning', desc: 'The lad next to him is lying awake too', outcome: 'They start on nothing at all and end up on whether you would rather be brilliant for one season or good for fifteen. By breakfast they are inseparable and by Sunday they are picking each other out on the pitch without looking.', effect: { energy: -12, meters: { peers: 12 }, attr: { teamwork: 2 }, tag: 'away-hall-friend' } },
          { id: 'corner', label: 'Drag his mat to the far corner', desc: 'Behind the stacked benches, out of the light', outcome: 'He finds four square metres of dark behind the vaulting horses and sleeps like the dead. Two lads copy him the following night. He has, accidentally, become useful.', effect: { energy: 6, meters: { peers: 4 }, attr: { creativity: 1 }, tag: 'away-hall-corner' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-penalties-far-from-home', title: 'Penalties, Two Hundred Miles Out', icon: '🎯', category: 'crisis',
    minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A final at the end of a tournament weekend, on a pitch nobody in his team had heard of a week ago, in front of a hundred strangers. Nil-nil after extra time. The coach is walking down the line asking for five hands.',
        choices: [
          { id: 'volunteer', label: 'Put his hand up first', desc: 'Before he can think about it', outcome: 'His arm is up before the question is finished and two others go up after his, which is the only reason he did it. He is given the fourth.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 6 }, energy: -6, tag: 'away-pens-volunteered' }, next: 'walk' },
          { id: 'wait', label: 'Wait to be asked', desc: 'Let the ones who want it take it', outcome: 'He does not raise his hand, and the coach names him fifth anyway, without looking up. Which answers a question he had not asked.', effect: { attr: { composure: 1 }, meters: { peers: -4 }, tag: 'away-pens-named' }, next: 'walk' },
        ],
      },
      walk: {
        id: 'walk',
        prompt: 'The walk from the halfway line is the longest he has ever done. The goal looks the wrong size. Behind it, in a car park, is a minibus that will take five hours to get him home either way.',
        choices: [
          { id: 'corner', label: 'Pick a corner and never look at the keeper', desc: 'Decide on the walk, execute on arrival', outcome: 'He decides at the centre circle and does not change his mind. It goes in off the underside of the bar and he does not remember hitting it.', effect: { form: 0.09, attr: { composure: 3 }, meters: { peers: 6 } } },
          { id: 'miss', label: 'Change his mind at the last second', desc: 'The keeper moved early', outcome: 'He drags it wide by a foot and stands there while the noise happens to somebody else. On the bus home nobody blames him, which he finds almost unbearable, and he replays it for a month.', effect: { form: -0.1, attr: { composure: 2, aggression: 1 }, energy: -6, meters: { peers: 4 }, tag: 'away-pens-missed' } },
          { id: 'panenka', label: 'Try something clever', desc: 'The keeper always goes early at this age', outcome: 'He chips it. The keeper stands still. It is the single most humiliating four seconds of his childhood and the lads never, ever let it go — with something like affection.', effect: { form: -0.12, meters: { peers: 6, authority: -8 }, attr: { flair: 2 }, tag: 'away-pens-chipped' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-long-drive-back', title: 'Five Nil, Five Hours', icon: '🌧️', category: 'offpitch',
    minTurn: 0, maxTurn: 33, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They lost five nil at a place none of them will ever go again, and now there is the drive. Nobody has put music on. The windows have gone opaque with breath and rain and someone at the back is pretending to be asleep.',
        choices: [
          { id: 'music', label: 'Put something on and get the noise back', desc: 'Silence is making it bigger than it is', outcome: 'He reaches forward and puts on the tinny speaker anyway. It is awful for four minutes and then it is fine, and by the second service station they are laughing about the fourth goal.', effect: { meters: { peers: 8, authority: -4 }, attr: { leadership: 2 }, tag: 'away-drive-broke-silence' } },
          { id: 'window', label: 'Sit with it and watch the motorway', desc: 'Some things want an hour of nothing', outcome: 'He watches lorries and lit-up towns for two hundred miles and arrives home with the loss filed somewhere it can be looked at rather than felt.', effect: { attr: { composure: 3 }, energy: 4, meters: { peers: -4 }, tag: 'away-drive-thought' } },
          { id: 'pick', label: 'Start going through what went wrong', desc: 'Out loud, at the back, with whoever will listen', outcome: 'Three of them work it through past Birmingham — the shape, the second goal, who was covering. Two of it is right and one of it is wrong, and it stops feeling like weather and starts feeling like a problem.', effect: { attr: { leadership: 1, teamwork: 2, composure: -1 }, meters: { peers: 3 }, tag: 'away-drive-analysed' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-wrong-ground', title: 'The Wrong Ground', icon: '🗺️', category: 'crisis',
    minTurn: 0, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The address on the fixture list is a training ground; the game is at a school field two miles the other side of a town nobody knows. Kickoff was eleven minutes ago. Half the squad is here, half is somewhere else, and phones are being passed about.',
        choices: [
          { id: 'warm', label: 'Get the seven of them warmed up now', desc: 'Whoever arrives, somebody has to be ready', outcome: 'He starts a rondo in a car park with a squashed ball while the adults sort out the geography. When the rest pile out of a car, the seven of them are sweating and organised and it shows in the first twenty minutes.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { authority: 6, peers: 4 }, energy: -4, tag: 'away-late-organised' } },
          { id: 'panic', label: 'Get wound up about it', desc: 'This is somebody\'s fault and it is not his', outcome: 'He spends the whole delay furious at nobody in particular and takes it onto the pitch, where it lasts about eleven minutes and produces one very silly booking.', effect: { form: -0.06, attr: { aggression: 2 }, meters: { authority: -5 }, tag: 'away-late-furious' } },
          { id: 'calm', label: 'Sit on the ball and stay level', desc: 'It starts when it starts', outcome: 'He sits on the match ball in a bus shelter, boots already on, laces already done, and is the calmest thing on the pitch when they finally kick off at ten to twelve.', effect: { attr: { composure: 3 }, form: 0.04, tag: 'away-late-calm' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-other-clubs-facilities', title: 'The Sign on the Corridor Wall', icon: '🚪', category: 'saga',
    minTurn: 1, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An away trip to a club with a proper building: a corridor of photographs, a laundry that smells of hot cotton, a boot room with names above the pegs. Their own changing room at home is a portakabin with a bucket under one corner.',
        choices: [
          { id: 'look', label: 'Look at all of it properly', desc: 'Walk the corridor slowly on the way back out', outcome: 'He reads every photograph caption on the way to the pitch, working out how old they were, whether any of them made it. He comes out with something between hunger and vertigo.', effect: { attr: { creativity: 1, composure: 1 }, form: -0.04, tag: 'away-facilities-hungry' }, next: 'after' },
          { id: 'unimpressed', label: 'Act like it is nothing', desc: 'It is a building. The pitch is the same size.', outcome: 'He barely lifts his head walking through, which two of the home lads clock and dislike. It is entirely an act and it works on everyone except him.', effect: { attr: { composure: 1, aggression: 1, creativity: -1 }, meters: { peers: 3 }, tag: 'away-facilities-cold' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'They lose narrowly and afterwards there are sandwiches on a table with a cloth on it, and the home lads are just — normal. One of them asks where he plays and what his school is like.',
        choices: [
          { id: 'talk', label: 'Talk to them like they are just lads', desc: 'Because they are just lads', outcome: 'Twenty minutes of ordinary conversation and the whole building shrinks to the right size. He goes home understanding that the corridor is not the football.', effect: { attr: { composure: 2, teamwork: 1 }, meters: { peers: 5 } } },
          { id: 'measure', label: 'Measure himself against them all afternoon', desc: 'Am I as good as this? Am I close?', outcome: 'He works out, honestly, that he is somewhere in among them, and that the difference is the building rather than the boys. It is the most useful thing he learns that season and it keeps him up that night.', effect: { attr: { composure: 1, leadership: 1 }, form: 0.05, energy: -4 } },
        ],
      },
    },
  },
  {
    id: 'youth-away-rain-all-day', title: 'The Festival Where It Never Stopped', icon: '☔', category: 'crisis',
    minTurn: 0, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It starts raining at eight in the morning and does not stop. By the third game the pitch is a brown lake with corner flags in it, kit bags have become sponges, and a gazebo has folded itself over a table of orange squash.',
        choices: [
          { id: 'love', label: 'Absolutely love it', desc: 'Nobody can play. This is the best day of his life.', outcome: 'He slides forty yards on his front after a tackle he did not need to make, comes up unrecognisable, and plays the rest of the day grinning through mud. Two teams refuse to come out. His does not.', effect: { form: 0.06, meters: { peers: 10, authority: 4 }, attr: { aggression: 1, stamina: 1 }, energy: -12, tag: 'away-rain-loved-it' } },
          { id: 'endure', label: 'Get through it without complaining', desc: 'Everyone is wet. Say nothing about being wet.', outcome: 'He does not moan once, in a squad where everyone else moans constantly, and by the last game two of the younger lads have started copying him. Cold sets into his hands and stays for hours.', effect: { attr: { composure: 2, leadership: 1 }, energy: -14, meters: { authority: 5 }, tag: 'away-rain-endured' } },
          { id: 'adapt', label: 'Work out how to play in it', desc: 'The ball stops dead. Change everything.', outcome: 'He stops passing along the floor entirely and starts hitting it early and high, which looks awful and works completely. He scores twice from balls that stick in the mud six yards out.', effect: { form: 0.09, attr: { creativity: 2 }, energy: -10, tag: 'away-rain-adapted' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-different-football', title: 'They Played It Backwards', icon: '🔄', category: 'saga',
    minTurn: 5, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The Spanish side in their tournament group do not clear it. Not once. Their keeper rolls it out under pressure, their centre backs pass to each other eight times in their own box, and his team chase shadows for twenty-five minutes and lose four nil.',
        choices: [
          { id: 'sneer', label: 'Call it soft and move on', desc: 'They would not do that in a proper winter', outcome: 'He says it loudly on the walk back and means about half of it. The half he does not mean sits there all evening, refusing to go.', effect: { attr: { aggression: 1 }, meters: { peers: 3, authority: -4 }, tag: 'away-style-dismissed' }, next: 'watch' },
          { id: 'study', label: 'Ask if he can watch their next game', desc: 'He wants to see it again from the outside', outcome: 'He stands behind their goal with a warm drink for forty minutes watching a twelve-year-old take the ball on the half-turn under pressure over and over. He is quiet all the way back.', effect: { attr: { creativity: 2, composure: 1 }, meters: { peers: -4 }, tag: 'away-style-studied' }, next: 'watch' },
        ],
      },
      watch: {
        id: 'watch',
        prompt: 'Back home, first session on a pitch he knows, the ball comes to him under pressure with his own goal behind him. The old answer is row Z. The new one is a turn he watched a stranger do in another country.',
        choices: [
          { id: 'try', label: 'Try the turn', desc: 'Here, now, where it actually matters', outcome: 'It comes off twice and gets him robbed once, and the once is loud and public. He keeps doing it. Within a season nobody remembers him ever being a hoofer.', effect: { attr: { creativity: 2, composure: 1 }, form: -0.03, meters: { authority: -3 }, tag: 'away-style-adopted' } },
          { id: 'clear', label: 'Clear it, like always', desc: 'Some things are for other people\'s football', outcome: 'He belts it forty yards and gets a nod for it. He is right, in the short term, in the way that is easiest to be right.', effect: { attr: { composure: 1 }, meters: { authority: 4 }, form: 0.03, tag: 'away-style-kept' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-trophy-too-big', title: 'Too Big for the Bus', icon: '🏆', category: 'triumph',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They have won the thing, and the thing is enormous — a cup with handles like a gate, taller sitting down than most of them, and there is genuinely nowhere on the minibus to put it.',
        choices: [
          { id: 'hold', label: 'Hold it on his knees the whole way', desc: 'Four hours, both arms, no complaints', outcome: 'His arms go numb by Northampton and he does not put it down once. He arrives home having lost all feeling from the elbows and would do it again immediately.', effect: { meters: { peers: 8 }, attr: { leadership: 1 }, energy: -5, tag: 'away-trophy-carried' } },
          { id: 'share', label: 'Pass it round the bus', desc: 'Everybody gets twenty minutes', outcome: 'He starts a rota that reaches the two lads who did not get on the pitch in the final, and hands it to them for the longest stretches. Nobody says anything about it. Everybody notices.', effect: { meters: { peers: 12, authority: 5 }, attr: { leadership: 2, teamwork: 1 }, tag: 'away-trophy-shared' } },
          { id: 'boot', label: 'Wrap it in coats and stick it in the back', desc: 'It is a lump of metal. Sit down.', outcome: 'It rattles in the back for four hours under three tracksuit tops and arrives with a dented handle. He is briefly the least popular boy in England.', effect: { meters: { peers: -6, authority: -3 }, attr: { composure: 1 }, tag: 'away-trophy-boxed' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-no-common-language', title: 'The Boy He Couldn\'t Talk To', icon: '🗣️', category: 'relationship',
    minTurn: 6, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Between games two squads end up on the same patch of grass with one ball. A boy from the other team — Polish, maybe, or Czech, nobody establishes which — starts a game of keepy-ups with him without either of them saying a single word that the other understands.',
        choices: [
          { id: 'play', label: 'Just play', desc: 'The ball is a whole language', outcome: 'They get to sixty-one, then eighty-four, then lose count, communicating entirely in eyebrows and small noises. It is the only friendship he ever makes without a conversation in it.', effect: { meters: { peers: 6 }, attr: { flair: 2, teamwork: 1 }, tag: 'away-language-ball' } },
          { id: 'try-talk', label: 'Try to actually talk to him', desc: 'Names, ages, positions, the slow loud way', outcome: 'They swap names, ages and clubs in about eleven minutes of pointing and mangling. He learns two Polish words and gives away one wrong English one. It is exhausting and completely worth it.', effect: { meters: { peers: 5 }, attr: { composure: 1, leadership: 1 }, energy: -3, tag: 'away-language-talked' } },
          { id: 'shy', label: 'Get shy and drift back to his own lot', desc: 'It is too hard and everyone is watching', outcome: 'He hands the ball back with a nod and goes and sits with his own team, and watches the boy start a game with somebody braver. It is a small thing and it bothers him disproportionately.', effect: { meters: { peers: -3 }, attr: { composure: 1 }, tag: 'away-language-retreated' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-last-day-of-tour', title: 'The Last Morning of the Tour', icon: '🧳', category: 'offpitch',
    minTurn: 7, maxTurn: 46, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Five days done, bags in a heap by the door, three hours before the coach. Whatever this week was, it stops at eleven o\'clock, and everybody can feel it and nobody is saying it.',
        choices: [
          { id: 'game', label: 'Get one last game on', desc: 'On the grass by the car park, bags for goals', outcome: 'Twenty-two of them in flip-flops and tour t-shirts playing the loosest, happiest football of the week, until somebody\'s mum makes them stop. He remembers that game longer than the tournament.', effect: { meters: { peers: 10 }, attr: { flair: 2, teamwork: 1 }, energy: -6, tag: 'away-tour-last-game' } },
          { id: 'sit', label: 'Sit on his bag and let it end', desc: 'Some things you should watch finishing', outcome: 'He sits in the doorway watching the others charge about and lets himself be sad about a week ending, which at thirteen is a slightly startling thing to discover you can do.', effect: { attr: { composure: 3 }, energy: 3, tag: 'away-tour-sat' } },
          { id: 'pack', label: 'Get everybody\'s kit sorted', desc: 'Somebody has to, and nobody has', outcome: 'He goes round the sports hall with a bin bag collecting eleven odd socks, a pair of gloves and three shinpads, and matches most of them to owners. It takes an hour and earns him a nickname he keeps for years.', effect: { meters: { peers: 6, authority: 6 }, attr: { leadership: 2 }, tag: 'away-tour-sorted' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-six-am-pickup', title: 'Ten Past Six, End of the Road', icon: '🚐', category: 'saga',
    minTurn: 0, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Standing at the end of the road in the dark with a bag bigger than he is, waiting for headlights. Frost on the wing mirrors of parked cars, nobody else in the world awake, and a whole day of football at the other end of it.',
        choices: [
          { id: 'sleep', label: 'Sleep the whole way', desc: 'Head on the window, three hours gone', outcome: 'He is unconscious before the ring road and wakes up in a different county with a stiff neck and a print of the window on his cheek, fresh in a way nobody else on that bus is.', effect: { energy: 8, form: 0.03, tag: 'away-sixam-slept' } },
          { id: 'watch', label: 'Stay awake and watch it get light', desc: 'The country turning grey, then blue, then ordinary', outcome: 'He watches the sky change over three hours of motorway and arrives tired and oddly full of something. That drive becomes the picture in his head whenever anyone says the word football.', effect: { energy: -5, attr: { creativity: 2, composure: 1 }, tag: 'away-sixam-watched' } },
          { id: 'ready', label: 'Go through the game in his head', desc: 'Who he is up against, what he will do first', outcome: 'He rehearses the first ten minutes about forty times, and when the first ball actually comes he has already played it. The rest of the game is a surprise. The start is not.', effect: { form: 0.06, attr: { composure: 2 }, energy: -3, tag: 'away-sixam-prepared' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-hostile-touchline', title: 'A Touchline That Doesn\'t Like Him', icon: '📣', category: 'crisis',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'An away ground where the parents stand right on the whitewash, four deep, and have decided within ten minutes that he is the one to get at. Every touch draws a noise. His own supporters are forty yards away on the far side and there are eleven of them.',
        choices: [
          { id: 'ball', label: 'Ask for the ball more, not less', desc: 'Make them keep making the noise', outcome: 'He demands it every single time, including in places he should not, and by the second half the noise has gone flat and tired. He has never enjoyed a nil-nil more.', effect: { attr: { composure: 2, leadership: 1 }, form: 0.06, tag: 'away-touchline-fronted' } },
          { id: 'react', label: 'Say something back', desc: 'They are grown men and he is twelve', outcome: 'He turns and answers one of them, and the whole thing gets ugly and adult very fast. He is subbed for his own protection and sits shaking on a bench, half ashamed and half not.', effect: { meters: { authority: -8, peers: 4 }, attr: { aggression: 2 }, form: -0.07, tag: 'away-touchline-answered' } },
          { id: 'shrink', label: 'Play away from that side of the pitch', desc: 'Just stay out of it for eighty minutes', outcome: 'He drifts to the far touchline and has a quiet, useless game. Nothing happens to him. Nothing happens at all, and the nothing is what he thinks about on the way home.', effect: { form: -0.06, attr: { composure: 1 }, tag: 'away-touchline-hid' } },
        ],
      },
    },
  },
  {
    id: 'youth-away-two-teams-one-bus', title: 'The Under-12s Are Coming Too', icon: '👟', category: 'relationship',
    minTurn: 1, maxTurn: 34, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'To save on hiring two, both age groups travel to the tournament on one coach. The little ones get the back seats by force of numbers and volume, and one of them — nine, maybe — attaches himself to the older boys within eleven miles.',
        choices: [
          { id: 'adopt', label: 'Let the kid sit with him', desc: 'He is going to sit somewhere', outcome: 'The boy talks at him for two hours about a hat-trick he scored in March. He hears about it four separate times and by the end knows every detail, and finds he does not mind at all.', effect: { meters: { peers: 6 }, attr: { leadership: 2, teamwork: 1 }, energy: -3, tag: 'away-bus-adopted' } },
          { id: 'ignore', label: 'Put his hood up and ignore him', desc: 'It is six in the morning', outcome: 'The boy gets the message in about a minute and goes quiet, and that quiet sits in the seat next to him for the remaining ninety miles like a third passenger.', effect: { meters: { peers: -4 }, attr: { composure: 1 }, energy: 3, tag: 'away-bus-ignored' } },
          { id: 'watch-them', label: 'Go and watch the little ones play', desc: 'Between his own games, on pitch nine', outcome: 'He stands on the touchline for a whole under-12 game shouting encouragement he half-copied from adults, and afterwards nine boys treat him like something between a player and a god.', effect: { meters: { peers: 8, authority: 5 }, attr: { leadership: 2 }, energy: -4, tag: 'away-bus-watched' } },
        ],
      },
    },
  },
];
