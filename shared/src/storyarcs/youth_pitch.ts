// ── YOUTH PITCH ARCS — the game itself, ages 10-14 ────────────────────────────────────────────────
// Everything that happens between the white lines before anyone is watching properly: shootouts, hat-tricks,
// misses that live in his head for a decade, weather, kit, awful pitches, no referee, the first time under
// floodlights. No agents, no money, no transfers — children. Meters used are only those active in these
// chapters (authority = Coach, family = Parents, peers = Mates, school = School).
import type { StoryArc } from '../storyarc.js';

export const YOUTH_PITCH_ARCS: StoryArc[] = [
  {
    id: 'youth-pitch-shootout', title: 'Twelve Yards in the Dark', icon: '🥅', category: 'crisis',
    minTurn: 4, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'District cup, one-all, and nobody has explained to a group of eleven-year-olds what a penalty shootout actually is. The coach draws five names on the back of a teamsheet and asks who wants to be on the list. Two hands go up quickly. Then a long silence.',
        choices: [
          { id: 'first', label: 'Ask to go first', desc: 'Before the pressure has anywhere to build', outcome: 'He walks the whole length of the pitch on his own and puts it low to the keeper\'s left before he has time to think about it. Everything after that is somebody else\'s problem.', effect: { attr: { composure: 2 }, form: 0.06, meters: { authority: 5, peers: 5 }, tag: 'shootout-first' }, next: 'after' },
          { id: 'fifth', label: 'Take the fifth', desc: 'The one that might decide it', outcome: 'He waits through four of them with his hands inside his sleeves, and when it comes to five-four he has been rehearsing the same three steps for eleven minutes.', effect: { energy: -5, attr: { composure: 1, leadership: 1 }, meters: { peers: 6 }, tag: 'shootout-fifth' }, next: 'after' },
          { id: 'none', label: 'Keep his hand down', desc: 'Let someone who wants it take it', outcome: 'He does not put his hand up, and spends the next ten minutes on the halfway line with his arm round a lad who missed, wishing very hard that he had.', effect: { form: -0.03, meters: { peers: 4 }, tag: 'shootout-declined' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'They lose it anyway, on the seventh kick, to a boy who barely looks up. In the car park half the team are crying and half are already talking about chips.',
        choices: [
          { id: 'practise', label: 'Start taking twenty a night', desc: 'Never stand in that queue unprepared again', outcome: 'From that week he takes twenty penalties a night at the garage wall, always to the same corner, until the corner is just a thing his foot knows.', effect: { energy: -4, attr: { composure: 1 }, tag: 'penalty-practice' } },
          { id: 'shrug', label: 'Let it go', desc: 'It was a coin toss with studs on', outcome: 'He decides a shootout is weather, not football, and refuses to carry it home. It is a useful thing to have decided at eleven.', effect: { attr: { composure: 1 }, form: 0.03, meters: { peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-hattrick', title: 'The Ball Under His Arm', icon: '⚽', category: 'triumph',
    minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two goals by half time, both scruffy. Twenty minutes left and the third has not come. Then it does — a toe-poke that goes in off the post — and someone on the touchline shouts that he gets to keep the ball.',
        choices: [
          { id: 'keepball', label: 'Take the ball home', desc: 'Write the date on it in biro', outcome: 'He carries it home under his arm the whole bus journey and writes the date on the panel in blue biro, pressing hard enough to dent it.', effect: { form: 0.08, attr: { flair: 1 }, meters: { family: 5, peers: 4 }, tag: 'hattrick-ball' }, next: 'next' },
          { id: 'give', label: 'Give it back to the club', desc: 'It is the only decent match ball they own', outcome: 'He hands it to the kit man, because the club has three balls and one of them is soft. Nobody makes a fuss. He remembers the game perfectly anyway.', effect: { form: 0.06, attr: { teamwork: 1 }, meters: { authority: 6, peers: 5 } }, next: 'next' },
        ],
      },
      next: {
        id: 'next',
        prompt: 'The following Sunday he does not score. Nor the one after. A lad in his year asks, not unkindly, whether the hat-trick was a fluke.',
        choices: [
          { id: 'chase', label: 'Chase the feeling', desc: 'Shoot from everywhere until it comes back', outcome: 'He starts shooting from angles that were never on, and the goals stay away another fortnight before they remember where he lives.', effect: { form: -0.05, attr: { aggression: 1, flair: 1 } } },
          { id: 'build', label: 'Go back to doing the boring things', desc: 'Runs, touches, the stuff before the goal', outcome: 'He goes back to the unglamorous half of it — the near-post run, the first touch away from the centre half — and the goals start again without being asked.', effect: { form: 0.05, attr: { teamwork: 1, composure: 1 }, meters: { authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-weakfoot', title: 'The Other Foot', icon: '🦶', category: 'saga',
    minTurn: 1, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Defenders his own age have worked it out: show him the outside, he will come back inside every single time. His left foot exists mainly for standing on.',
        choices: [
          { id: 'wall', label: 'Left foot only, all winter', desc: 'A wall, a ball, and no right foot allowed', outcome: 'He gives himself a rule at the wall — left foot only, one hundred touches, no cheating — and it is genuinely humiliating for about six weeks. Then it stops being.', effect: { energy: -6, attr: { stamina: 1, flair: 1 }, tag: 'weak-foot-work' }, next: 'test' },
          { id: 'match', label: 'Use it in matches before it is ready', desc: 'The only real practice is under pressure', outcome: 'He starts using it in games while it is still bad, sliced clearances and all, and takes the groans on the chin because he can feel it getting less awful.', effect: { form: -0.05, attr: { composure: 1, aggression: 1 }, meters: { peers: -3 }, tag: 'weak-foot-brave' }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'March, and the ball drops to him on the wrong side of his body six yards out with the keeper set.',
        choices: [
          { id: 'hit', label: 'Hit it left-footed', desc: 'This is what the winter was for', outcome: 'He hits it first time with the left and it goes in, and the odd thing is how ordinary it feels — like a thing he simply does now.', effect: { form: 0.08, attr: { composure: 1, flair: 1 }, meters: { authority: 6 } } },
          { id: 'shift', label: 'Shift it onto the right', desc: 'One touch, then the foot he trusts', outcome: 'He takes the touch back onto his right and the chance is gone by the time he is ready. The coach says nothing. He hears it anyway.', effect: { form: -0.03, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-heading', title: 'Eyes Open', icon: '🧠', category: 'saga',
    minTurn: 2, maxTurn: 36, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He shuts his eyes when the ball comes at his head. He has always shut his eyes. At a corner he ducks under one that a smaller lad wins in front of him, and everybody sees it.',
        choices: [
          { id: 'drill', label: 'Attack the next one properly', desc: 'Eyes open, neck strong, meet it early', outcome: 'He makes himself go early at the next six, gets one on the ear and one on the bridge of the nose, and wins the seventh cleanly.', effect: { energy: -5, attr: { aggression: 1, composure: 1 }, meters: { authority: 5 } } },
          { id: 'avoid', label: 'Play where the ball stays down', desc: 'Not everyone has to be good in the air', outcome: 'He quietly arranges his game so the ball never arrives above his shoulders, and it works fine for about two years.', effect: { attr: { creativity: 1 }, tag: 'aerially-shy' } },
          { id: 'ask', label: 'Get someone to throw them at him', desc: 'Twenty a night in the back garden until the flinch dies', outcome: 'Twenty throws a night at the garden fence, and the flinch dies somewhere in the second week without him noticing it go.', effect: { energy: -4, attr: { stamina: 1, composure: 1 }, meters: { family: 5 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-nutmeg', title: 'Through the Legs', icon: '🪄', category: 'signature',
    minTurn: 5, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He puts it through a big lad\'s legs on the touchline and the whole opposition bench howls. The big lad does not laugh. For the rest of the half he is never more than two yards away, breathing hard.',
        choices: [
          { id: 'again', label: 'Try it again', desc: 'The only answer to being marked is to be better', outcome: 'He does it again in the second half, and this time the boy kicks him properly. He gets up first and gives the ball back to the referee.', effect: { form: 0.06, attr: { flair: 2 }, meters: { peers: 5 }, energy: -5, tag: 'nutmeg-repeat' }, next: 'after' },
          { id: 'simple', label: 'Play simple and let it die', desc: 'Nothing to prove, and a game to win', outcome: 'He plays the ball early for twenty minutes and the temperature comes down. Somebody\'s dad calls him sensible, which at twelve is not a compliment.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 5 }, tag: 'nutmeg-defused' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'They are drawn against the same team in the spring. He recognises the number four in the warm-up, and the number four recognises him.',
        choices: [
          { id: 'hand', label: 'Shake his hand before kickoff', desc: 'Take the feud out of it', outcome: 'He puts a hand out in the tunnel line and the boy takes it, and the game is a proper game instead of a grudge with a ball in it.', effect: { attr: { leadership: 1, composure: 1 }, meters: { authority: 5, peers: 4 } } },
          { id: 'feed', label: 'Let him stew', desc: 'An angry defender is a bad defender', outcome: 'He says nothing, drifts across into his half of the pitch all afternoon, and the boy gets booked inside eight minutes chasing him.', effect: { form: 0.05, attr: { flair: 1, aggression: 1 }, meters: { peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-flood', title: 'Water on the Six-Yard Box', icon: '🌧️', category: 'crisis',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It has rained for three days and half the pitch is under an inch of standing water. The referee walks the surface with his hands in his pockets, drops a ball on the eighteen-yard line and watches it stop dead.',
        choices: [
          { id: 'play', label: 'Beg him to play it', desc: 'They have travelled an hour to be here', outcome: 'Three of them talk the referee into it and the game turns into a wrestling match in a puddle. He loves every filthy minute of it.', effect: { energy: -8, form: 0.05, attr: { stamina: 1, aggression: 1 }, meters: { peers: 6, authority: 3 } } },
          { id: 'adapt', label: 'Change how he plays for the water', desc: 'No dribbling. Everything first time, everything early', outcome: 'He works out inside ten minutes that the ball will not run, and starts hitting everything first time and early. It is the first time he has beaten a pitch instead of a team.', effect: { form: 0.07, attr: { creativity: 1, composure: 1 }, meters: { authority: 7 }, energy: -6 } },
          { id: 'off', label: 'Accept it is off', desc: 'Nobody is playing football on that', outcome: 'It goes off. They stand under the clubhouse eaves in full kit eating crisps, and he watches the rain fill the goalmouth like a bath.', effect: { energy: 4, form: -0.03, meters: { peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-astro', title: 'Grass, and the Other Thing', icon: '🟩', category: 'saga',
    minTurn: 6, maxTurn: 42, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Winter moves them onto the 3G behind the leisure centre. The ball comes off it twice as fast, the rubber crumb gets in his socks and stays there for months, and the boys who were good on mud are suddenly a half-second late.',
        choices: [
          { id: 'love', label: 'Fall in love with the quick surface', desc: 'The ball does what he tells it here', outcome: 'On the carpet everything he tries actually works, and he spends the winter playing the best football of his life on a pitch that smells of burnt tyres.', effect: { form: 0.07, attr: { flair: 1, creativity: 1 }, meters: { peers: 5 }, tag: 'astro-native' }, next: 'spring' },
          { id: 'grind', label: 'Use it to fix his touch', desc: 'A fast surface punishes a heavy first touch', outcome: 'He treats the speed of it as a test rather than a gift, and by February his first touch has quietly become the best part of his game.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 6 }, tag: 'astro-touch' }, next: 'spring' },
        ],
      },
      spring: {
        id: 'spring',
        prompt: 'March, and they go back onto grass — proper grass, cut long, still wet at eleven in the morning. Everything he learned all winter arrives half a yard late.',
        choices: [
          { id: 'relearn', label: 'Relearn the heavy pitch', desc: 'Shorter steps, stronger through contact', outcome: 'He spends two weeks looking ordinary, shortens his stride, gets his weight lower, and comes out of it able to play on anything.', effect: { energy: -6, attr: { stamina: 1, composure: 1 }, form: 0.04, meters: { authority: 5 } } },
          { id: 'complain', label: 'Blame the pitch', desc: 'It is not football, it is a farm', outcome: 'He moans about the surface all spring, which is both true and useless, and the honest truth is he plays worse on grass for a season.', effect: { form: -0.05, attr: { aggression: 1 }, meters: { authority: -4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-fluke', title: 'The One That Went In Off His Shin', icon: '🍀', category: 'triumph',
    minTurn: 4, maxTurn: 40, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He miscontrols it entirely, the ball loops off his shin, over a keeper who has come three yards too far, and drops under the bar. The touchline goes up. He knows exactly what happened and so does everyone within ten feet.',
        choices: [
          { id: 'claim', label: 'Wheel away and claim it', desc: 'It is in the book as a goal either way', outcome: 'He runs off with both arms up like he meant it, and keeps a completely straight face for the rest of the afternoon.', effect: { form: 0.05, attr: { flair: 1 }, meters: { peers: 5 } } },
          { id: 'admit', label: 'Admit it was a shank', desc: 'Laugh at himself before anybody else can', outcome: 'He puts his hands on his head laughing before he has finished celebrating, and the whole team laugh with him rather than at him.', effect: { form: 0.04, attr: { leadership: 1, teamwork: 1 }, meters: { peers: 7, authority: 4 } } },
          { id: 'sour', label: 'Let it bother him', desc: 'He wants goals he has actually scored', outcome: 'It nags at him all week that his best moment of the season was an accident, which is a strange and useful kind of standard to have set for himself.', effect: { attr: { composure: 1 }, meters: { authority: 3 }, tag: 'high-standards' } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-miss', title: 'The Open Goal', icon: '😖', category: 'crisis',
    minTurn: 7, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Last minute, nil-nil, the keeper on the floor behind him and the goal completely empty from four yards. He leans back and puts it over the bar, over the fence, into the allotments. The whistle goes about nine seconds later.',
        choices: [
          { id: 'own', label: 'Own it in front of everyone', desc: 'Say it out loud before it festers', outcome: 'He says it plainly in the huddle — that one was mine, sorry — and something about saying it stops it growing in the dark.', effect: { attr: { leadership: 1, composure: 1 }, meters: { peers: 6, authority: 5 }, tag: 'miss-owned' }, next: 'again' },
          { id: 'hide', label: 'Say nothing, get changed, go home', desc: 'Do not give it any more air', outcome: 'He does not speak in the changing room and he does not speak in the car. It is still there at two in the morning, in perfect detail.', effect: { form: -0.06, energy: -4, tag: 'miss-buried' }, next: 'again' },
        ],
      },
      again: {
        id: 'again',
        prompt: 'Three weeks later, near enough the same ball drops to him in near enough the same place.',
        choices: [
          { id: 'sidefoot', label: 'Side-foot it, no backlift', desc: 'Boring, low, and in', outcome: 'He passes it into the net with the inside of his foot, no celebration at all, and jogs back to the halfway line like a man paying off a debt.', effect: { form: 0.07, attr: { composure: 2 }, meters: { authority: 5 } } },
          { id: 'freeze', label: 'Think about the last one', desc: 'His body remembers before his head does', outcome: 'For half a second he is back on that pitch in front of the allotments, and the half-second is exactly what the defender needed.', effect: { form: -0.04, attr: { composure: 1 }, energy: -3 } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-redcard', title: 'The Long Walk', icon: '🟥', category: 'crisis',
    minTurn: 8, maxTurn: 45, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two footed, late, out of frustration, on a boy who had been kicking him for half an hour. The referee does not even hesitate. There is no tunnel to walk down — just a long diagonal across the pitch to a bag on the grass.',
        choices: [
          { id: 'apologise', label: 'Apologise to the lad first', desc: 'Before he walks, before anyone tells him to', outcome: 'He stops and puts a hand out to the boy on the floor, who takes it. Then he walks the diagonal on his own. It is the longest walk of his life so far.', effect: { form: -0.05, attr: { leadership: 1, composure: 1 }, meters: { authority: 4, peers: 5 }, tag: 'red-apologised' }, next: 'ban' },
          { id: 'argue', label: 'Argue the whole way off', desc: 'He was fouled six times and nothing was given', outcome: 'He argues about the six fouls nobody gave, which is true, and completely beside the point, and makes the ban a week longer.', effect: { form: -0.08, attr: { aggression: 2 }, meters: { authority: -8 }, tag: 'red-argued' }, next: 'ban' },
        ],
      },
      ban: {
        id: 'ban',
        prompt: 'Three matches suspended. He has to stand behind the barrier in a coat and watch, which turns out to be a far worse punishment than not playing.',
        choices: [
          { id: 'watch', label: 'Actually watch', desc: 'Learn the game from outside it for once', outcome: 'From the barrier he can see the shape of it — the spaces, who moves early, who does not — and he comes back understanding things he could not see from inside.', effect: { attr: { creativity: 1, leadership: 1 }, meters: { authority: 6 }, form: 0.04 } },
          { id: 'sulk', label: 'Stand at the far corner with his hood up', desc: 'He does not want to be seen not playing', outcome: 'He watches from the far corner flag with his hood up and his back half turned, and learns nothing at all except how much he hates it.', effect: { form: -0.04, attr: { aggression: 1 }, meters: { peers: -3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-noref', title: 'Nobody in Black', icon: '🤷', category: 'saga',
    minTurn: 1, maxTurn: 34, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The referee does not turn up. Rather than lose the fixture, the two coaches agree to play it with the players calling their own fouls, which lasts about eleven minutes.',
        choices: [
          { id: 'honest', label: 'Give the decisions honestly', desc: 'Including the ones against himself', outcome: 'He gives a corner against himself when nobody saw the touch, and something shifts in how the game is played for the next half hour.', effect: { attr: { leadership: 2 }, meters: { authority: 6, peers: 5 } } },
          { id: 'chance', label: 'Take everything he can get', desc: 'No referee means no punishment', outcome: 'He claims every throw and every corner whether it is his or not, wins about four of them, and the game degenerates into a shouting match by half time.', effect: { form: 0.03, attr: { aggression: 1, flair: 1 }, meters: { peers: -4, authority: -4 } } },
          { id: 'referee', label: 'Try to run the game himself', desc: 'Somebody has to, or it stops', outcome: 'He ends up settling other people\'s arguments all afternoon. Exhausting, thankless, and he is very good at it.', effect: { energy: -6, attr: { leadership: 2, composure: 1 }, meters: { authority: 5, peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-floodlights', title: 'Under the Lights', icon: '💡', category: 'triumph',
    minTurn: 6, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A midweek fixture, kickoff at seven, and the four pylons come on all at once with a thump he can feel through the grass. The pitch looks greener than it has any right to. His breath is visible. He has never played football at night.',
        choices: [
          { id: 'awe', label: 'Stand still and take it in', desc: 'Ten seconds before the whistle to look up', outcome: 'He stands on the halfway line looking up at the moths going mad round the lights, and decides, very seriously, that this is what he wants his whole life to look like.', effect: { form: 0.07, attr: { flair: 1, composure: 1 }, meters: { family: 4, peers: 4 }, tag: 'lights-hooked' }, next: 'play' },
          { id: 'focus', label: 'Get straight into the game', desc: 'It is the same pitch with more electricity', outcome: 'He refuses to be impressed by a light bulb and is into the first tackle inside twenty seconds. The nerves never get a chance to arrive.', effect: { attr: { composure: 1, aggression: 1 }, meters: { authority: 5 }, tag: 'lights-cool' }, next: 'play' },
        ],
      },
      play: {
        id: 'play',
        prompt: 'The trouble with floodlights is the ball comes out of the black without warning, and twice in the first half he loses a high one completely.',
        choices: [
          { id: 'ground', label: 'Keep it on the floor all night', desc: 'What he cannot see he will not play', outcome: 'He plays everything along the ground, one and two touch, and has the best passing game of his season out of pure self-preservation.', effect: { form: 0.06, attr: { teamwork: 1, creativity: 1 }, meters: { authority: 5 } } },
          { id: 'trust', label: 'Judge it earlier and trust it', desc: 'Move to where it will land, not where it is', outcome: 'He starts moving to where the ball is going instead of tracking it through the dark, and it works often enough to be worth the two he gets wrong.', effect: { attr: { creativity: 1, composure: 1 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-theball', title: 'The Ball That Lived Under His Bed', icon: '🧡', category: 'signature',
    minTurn: 0, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cheap orange trainer, size four, going soft at one panel. It goes to school in his bag, to the shop, to the bus stop. He has not walked anywhere in a straight line for a year.',
        choices: [
          { id: 'wall', label: 'The wall, every evening', desc: 'Two hundred against the gable end until it is too dark', outcome: 'He gets to know one square of brickwork better than anyone alive — which side it kicks off, where it comes back low — and his first touch is built entirely out of it.', effect: { energy: -5, attr: { composure: 1, flair: 1 }, tag: 'wall-hours' }, next: 'burst' },
          { id: 'juggle', label: 'Keep it up, everywhere', desc: 'Counting, always counting, out loud', outcome: 'He counts touches everywhere he goes — bus stop, kitchen, corridor — and gets from thirty to four hundred over one summer without ever calling it training.', effect: { attr: { flair: 2 }, meters: { peers: 4 }, tag: 'juggler' }, next: 'burst' },
        ],
      },
      burst: {
        id: 'burst',
        prompt: 'It finally goes on a fence post in October, with a noise like a slap, and deflates in his hands.',
        choices: [
          { id: 'keep', label: 'Keep it anyway', desc: 'Flat, in the bottom of the wardrobe', outcome: 'The flat thing stays in the bottom of the wardrobe for fifteen years and moves house twice, and he never once explains it to anybody.', effect: { attr: { composure: 1 }, meters: { family: 4 }, tag: 'first-ball-kept' } },
          { id: 'replace', label: 'Get another one and start again', desc: 'It was only ever a ball', outcome: 'A new one turns up, harder and shinier, and it takes him three weeks to break it in and about a day to stop mentioning the old one.', effect: { attr: { flair: 1 }, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-ingoal', title: 'Somebody Has To Go In', icon: '🧤', category: 'crisis',
    minTurn: 9, maxTurn: 44, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The keeper is ill, the reserve keeper is on holiday, and there are ten of them in a changing room looking at a pair of gloves on the bench that nobody wants to pick up.',
        choices: [
          { id: 'volunteer', label: 'Put the gloves on', desc: 'Somebody has to, and nobody else will', outcome: 'He puts them on. They are two sizes too big and smell of wet dog, and he keeps the score down to three, and the walk back to halfway after each one is its own private education.', effect: { energy: -7, attr: { keeping: 2, leadership: 1, composure: 1 }, meters: { authority: 7, peers: 6 }, tag: 'went-in-goal' }, next: 'after' },
          { id: 'refuse', label: 'Look at the floor', desc: 'He is not a goalkeeper and they need him outfield', outcome: 'He studies his laces very carefully until somebody else picks them up, and plays a decent hour up the pitch feeling faintly grubby about it.', effect: { form: 0.03, meters: { peers: -4 }, tag: 'ducked-goal' }, next: 'after' },
          { id: 'dive', label: 'Volunteer, and go at everything', desc: 'If he is in there he is not standing still', outcome: 'He throws himself at crosses he has no business reaching, lands badly on his wrist in the second half, and finishes the game with his arm strapped to his chest.', effect: { energy: -9, attr: { keeping: 2, aggression: 1 }, injury: true, meters: { peers: 7, authority: 5 }, tag: 'goal-wrist' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The regular keeper is back the following week and mentions, quietly, that it is horrible in there and nobody ever says thank you.',
        choices: [
          { id: 'respect', label: 'Tell him he is right', desc: 'And mean it', outcome: 'He agrees, out loud, in front of others, and from then on he is the one who claps the keeper first at full time whatever the score was.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 6 } } },
          { id: 'shrug', label: 'Change the subject', desc: 'He would rather not think about it again', outcome: 'He laughs it off and gets his boots on. He does not want to think about that goalmouth ever again, and mostly manages it.', effect: { form: 0.03, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-unbeaten', title: 'The Run Ends on a Tuesday', icon: '📉', category: 'crisis',
    minTurn: 12, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Nineteen games unbeaten, a run so long it stopped feeling like luck and started feeling like a fact about the world. Then a bottom-of-the-table side score in the eighty-first minute and hold on, and the fact stops being true on an ordinary Tuesday.',
        choices: [
          { id: 'relief', label: 'Feel the relief', desc: 'He had stopped enjoying it weeks ago', outcome: 'He is honestly, guiltily relieved. The run had become a thing they were protecting instead of a thing they were doing, and now they can just play again.', effect: { form: 0.05, attr: { composure: 2 }, meters: { peers: 4 }, tag: 'run-relief' }, next: 'next' },
          { id: 'gutted', label: 'Take it badly', desc: 'Nineteen games and it goes like that', outcome: 'He is inconsolable in a way that surprises him, and sits in the corner of the changing room with his shinpads still on long after everyone else has gone.', effect: { form: -0.06, energy: -4, attr: { aggression: 1 }, tag: 'run-hurt' }, next: 'next' },
        ],
      },
      next: {
        id: 'next',
        prompt: 'Saturday comes round regardless. Somebody says, half joking, that they should just start a new one.',
        choices: [
          { id: 'lead', label: 'Say it properly, not as a joke', desc: 'Start a new run, from nil, this week', outcome: 'He repeats it without laughing, and eleven of them believe him because he is not laughing. They win four-one.', effect: { form: 0.07, attr: { leadership: 2 }, meters: { peers: 6, authority: 5 } } },
          { id: 'quiet', label: 'Just play', desc: 'Runs are things you notice afterwards', outcome: 'He says nothing about runs at all and simply plays, which is roughly the lesson, and he keeps it for the next twenty years.', effect: { form: 0.05, attr: { composure: 2 }, meters: { authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-bigground', title: 'A Real Pitch for Ninety Minutes', icon: '🏟️', category: 'triumph',
    minTurn: 14, maxTurn: 47, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The county cup final is played at the league ground — real dugouts, a tannoy, painted lines that have not faded, a dressing room with pegs that have names above them. Four hundred people in a stand built for eight thousand sounds enormous.',
        choices: [
          { id: 'early', label: 'Walk the pitch an hour before', desc: 'In trainers, alone, corner flag to corner flag', outcome: 'He walks it corner to corner in his trainers an hour before anyone else is out, and by kickoff it is just a pitch and he is the only one on his team it is just a pitch to.', effect: { attr: { composure: 2, leadership: 1 }, form: 0.06, meters: { authority: 5 }, tag: 'walked-the-pitch' }, next: 'game' },
          { id: 'stay', label: 'Stay in the dressing room', desc: 'Do not look at it until he has to', outcome: 'He sits under his peg with his headphones on and does not look at it once until the buzzer goes, and then the size of it hits him all in one go in the tunnel.', effect: { energy: -4, attr: { aggression: 1 }, tag: 'tunnel-shock' }, next: 'game' },
        ],
      },
      game: {
        id: 'game',
        prompt: 'The pitch is a full size adult one, twelve yards longer and eight wider than anything they play on. By the hour mark legs are going all over the field.',
        choices: [
          { id: 'run', label: 'Cover every blade of it', desc: 'Let the size of the pitch be his advantage', outcome: 'He runs the big pitch into the ground while everyone else shrinks, and in the last twenty minutes there is simply more of him than anybody else.', effect: { energy: -10, form: 0.08, attr: { stamina: 2 }, meters: { authority: 7, peers: 5 } } },
          { id: 'width', label: 'Use the width, make them run', desc: 'Switch it, every time, and let the pitch do the work', outcome: 'He starts switching it first time to the far touchline, and the tired legs are on the other team by seventy minutes.', effect: { energy: -6, form: 0.07, attr: { creativity: 1, teamwork: 1 }, meters: { authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-sixaside', title: 'Six-a-Side in the Rain', icon: '🌀', category: 'saga',
    minTurn: 10, maxTurn: 44, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A rained-off league fixture becomes a six-a-side tournament on quarter pitches, eight minutes a game, rolling substitutes, boards instead of touchlines. It is chaos, and it is the most football he has played in one afternoon in his life.',
        choices: [
          { id: 'tricks', label: 'Play with everything he has got', desc: 'Small pitch, tight spaces, no fear', outcome: 'In eight-minute games nothing costs anything, so he tries all of it — drag-backs, no-looks, a rabona that goes into a fence — and about a third of it comes off.', effect: { energy: -8, attr: { flair: 2, creativity: 1 }, meters: { peers: 6 }, form: 0.05 } },
          { id: 'engine', label: 'Play all seven games', desc: 'Never come off, not once', outcome: 'He refuses every substitution and plays fifty-six minutes without a break, soaked through, and cannot lift his arms in the car home.', effect: { energy: -12, attr: { stamina: 2, aggression: 1 }, meters: { authority: 6 }, form: 0.04 } },
          { id: 'organise', label: 'Sort out who plays where', desc: 'Six games of nobody knowing is six games lost', outcome: 'He takes it upon himself to sort the rotations and the shape between games, standing in the rain with a soaked bit of paper, and they reach the final.', effect: { energy: -6, attr: { leadership: 2, teamwork: 1 }, meters: { peers: 5, authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'youth-pitch-unwanted-pen', title: 'The Penalty Nobody Wants', icon: '🎯', category: 'crisis',
    minTurn: 16, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eighty-eighth minute, one-nil down, and the referee points to the spot. The lad who normally takes them missed one a fortnight ago and will not look up. Nine faces turn towards him at once, and he does not want it. He genuinely, physically does not want it.',
        choices: [
          { id: 'take', label: 'Pick the ball up', desc: 'Wanting it and taking it are different things', outcome: 'He picks it up because someone has to and being frightened is not a reason. He puts it down the middle, of all places, and does not celebrate.', effect: { form: 0.07, attr: { composure: 2, leadership: 1 }, meters: { authority: 6, peers: 6 }, tag: 'took-the-pen' }, next: 'after' },
          { id: 'giveback', label: 'Give it to the lad who missed', desc: 'He needs it more than the team needs a goal', outcome: 'He puts the ball in the other boy\'s hands and walks away without waiting to see. It goes in. The boy is still talking about it years later.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 8, authority: 5 }, tag: 'gave-the-pen' }, next: 'after' },
          { id: 'defer', label: 'Let someone else sort it out', desc: 'It is not his job to solve this', outcome: 'He steps back and lets the argument resolve itself. It is taken badly by a boy who wanted it far too much, and saved, and nobody blames him at all. Somehow that is worse.', effect: { form: -0.04, meters: { peers: -3 }, tag: 'stepped-back' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'On the bus home he works out that the ninety seconds around that penalty told him something about himself he had not previously known.',
        choices: [
          { id: 'accept', label: 'Decide he is one of the ones who takes them', desc: 'From now on the ball is his', outcome: 'He decides, quietly and permanently, that he is one of the ones who picks the ball up, and he never once ducks it again.', effect: { attr: { composure: 1, leadership: 1 }, meters: { authority: 5 }, tag: 'penalty-taker' } },
          { id: 'honest', label: 'Admit he hated every second', desc: 'And that hating it changes nothing', outcome: 'He admits to himself that he hated all of it and will hate it every time, and that this is simply what the job costs. It is the most grown-up thought he has had.', effect: { attr: { composure: 2 }, form: 0.04 } },
        ],
      },
    },
  },
];
