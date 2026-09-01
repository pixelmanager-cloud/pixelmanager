// ── YOUTH JOY ARCS — heroes, imagination and who he wants to be, ages 10-14 ───────────────────────
// Why a boy loves the game before anyone is grading him for it: idols and imitation, a name on the back of
// a shirt, a wall he has played against for years, commentary muttered under his breath in the garden,
// rituals, celebrations, a style of his own. No agents, no money, no transfers — children. Meters used are
// only those active in these chapters (authority = Coach, family = Parents, peers = Mates, school = School).
import type { StoryArc } from '../storyarc.js';

export const YOUTH_JOY_ARCS: StoryArc[] = [
  {
    id: 'youth-joy-hero-trick', title: 'Six Months of the Same Turn', icon: '🌀',
    category: 'signature', minTurn: 0, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has watched the same eleven seconds of a highlights clip until he can hear where the crowd noise dips. The winger, drag back, hip drops, gone. He starts doing it on the way to the shops, on the way to the bins, on grass, on gravel.',
        choices: [
          { id: 'grind', label: 'Do nothing else for months', desc: 'Ten thousand of them until it stops being a trick', outcome: 'He does it badly for eleven weeks and then, one damp Tuesday, does it without deciding to. That is the day it stops being Sadiku\'s and becomes his.', effect: { energy: -6, attr: { flair: 2, creativity: 2 }, tag: 'hero-trick-owned' }, next: 'use' },
          { id: 'blend', label: 'Steal the idea, not the move', desc: 'Take the timing and put his own feet on it', outcome: 'He works out the trick is really just a lie about which way his shoulders are going, and starts telling that lie in about six different ways.', effect: { attr: { creativity: 2, flair: 2 }, tag: 'hero-trick-adapted' }, next: 'use' },
          { id: 'drop', label: 'Give it up after a fortnight', desc: 'It keeps ending with the ball in a hedge', outcome: 'He abandons it, and is quietly annoyed with himself for about a year, which turns out to be the useful part.', effect: { form: -0.02, attr: { composure: 1 } }, next: 'use' },
        ],
      },
      use: {
        id: 'use',
        prompt: 'Sunday morning, nil-nil, the touchline is close enough to hear breathing. The moment arrives where the move would work.',
        choices: [
          { id: 'try', label: 'Try it', desc: 'In a real game, with people watching', outcome: 'It comes off. Nobody on the touchline knows where it came from except him, and he does not tell anyone, ever.', effect: { form: 0.08, attr: { flair: 2 }, meters: { authority: -3, peers: 5 } } },
          { id: 'simple', label: 'Play the simple pass', desc: 'Keep it for the garden a while longer', outcome: 'He plays it square and files the moment away. It will keep. Most of the good things he learns, he learns to be patient with first.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { peers: -2, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-name-on-back', title: 'The Name on the Back', icon: '👕',
    category: 'offpitch', minTurn: 0, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a shop on the high street that will heat-press any name onto a shirt for four pounds a letter, and he has been standing at the counter for a while now with the laminated alphabet in front of him.',
        choices: [
          { id: 'idol', label: 'The player he loves', desc: 'SADIKU, 10 — the obvious one, and he does not care', outcome: 'SADIKU 10. He wears it until the collar goes soft, and years later he can still feel exactly which letters had started to peel.', effect: { meters: { family: -2 }, form: 0.05, attr: { flair: 2 }, tag: 'shirt-idol' } },
          { id: 'own', label: 'His own name', desc: 'Which feels either brave or ridiculous', outcome: 'He asks for his own surname and hears himself say it too quietly, then again louder. He walks out of the shop feeling like he has told a small lie he now has to make true.', effect: { attr: { leadership: 1, composure: 1 }, meters: { peers: -2, family: 4 }, tag: 'shirt-own-name' } },
          { id: 'blank', label: 'Leave it blank', desc: 'Just the shirt, no claim on it', outcome: 'He keeps it plain, which nobody comments on, and which he decides privately is the coolest option available to a boy with eleven pounds.', effect: { meters: { peers: -3 }, attr: { composure: 1 }, tag: 'shirt-blank' } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-wall', title: 'The Wall at the End of the Garden', icon: '🧱',
    category: 'signature', minTurn: 0, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The gable end of the garage has a rectangle of paint worn off it roughly the size of a chest. He has been playing against that wall since he was six. It never gets tired, never goes home for tea, and returns everything slightly wrong on purpose.',
        choices: [
          { id: 'weak', label: 'Only the wrong foot, all summer', desc: 'A hundred a day, left foot only', outcome: 'Six weeks of it. The wall does not congratulate him. By August the left one is merely bad instead of useless, and that gap is worth years.', effect: { energy: -6, attr: { stamina: 1 }, form: 0.04, tag: 'wall-weak-foot' } },
          { id: 'first', label: 'First time, never controlling it', desc: 'Take what comes back however it comes back', outcome: 'He bans himself from touching it twice. The wall keeps handing him horrible bouncing returns and he keeps hitting them, and his brain learns to arrive before the ball does.', effect: { energy: -5, attr: { creativity: 2 }, form: 0.05, tag: 'wall-one-touch' } },
          { id: 'game', label: 'Turn it into a game against himself', desc: 'Fifty without a miss or start again', outcome: 'Fifty in a row or begin again. He gets to forty-three so many times that the number stops being funny. When he finally gets it he is alone and it is nearly dark and it is one of the best moments of his childhood.', effect: { energy: -4, attr: { composure: 2 }, form: 0.06, tag: 'wall-fifty' } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-commentary', title: 'The Voice in the Garden', icon: '🎙️',
    category: 'offpitch', minTurn: 0, maxTurn: 30, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Alone on the back grass he is not alone at all. He is ninety-first minute, one down, and he is doing the commentary himself under his breath, including the crowd, which is mostly a hiss through his teeth.',
        choices: [
          { id: 'loud', label: 'Do it properly, out loud', desc: 'Full commentary, name and all', outcome: 'He says his own name in the third person and it makes him laugh, and then he says it again seriously. The imagined stadium is very detailed. He knows exactly where the away end is.', effect: { meters: { school: -3 }, form: 0.06, attr: { flair: 2, creativity: 2 }, tag: 'commentates' }, next: 'heard' },
          { id: 'quiet', label: 'Keep it inside his head', desc: 'Where nobody can hear it', outcome: 'He mouths it silently, which somehow makes it more real, not less. It becomes a habit he will still have at twenty-five, before kick-off, without noticing.', effect: { meters: { peers: -2 }, attr: { composure: 2 }, tag: 'inner-commentary' }, next: 'heard' },
        ],
      },
      heard: {
        id: 'heard',
        prompt: 'His sister has been at the kitchen window for some time. She does a very accurate impression of him at dinner and everybody laughs.',
        choices: [
          { id: 'own-it', label: 'Laugh and carry on doing it', desc: 'It costs nothing to be caught enjoying something', outcome: 'He laughs harder than anyone and is back out there the next evening, narrating. Not being embarrassed by what you love is a small superpower and he has just been handed it.', effect: { form: 0.05, meters: { peers: -3, family: 6 }, attr: { flair: 2 } } },
          { id: 'stop', label: 'Stop doing it out loud', desc: 'Move the whole stadium indoors', outcome: 'The commentary goes silent and lives behind his eyes instead. It never actually stops. It just gets a better sound system.', effect: { attr: { composure: 1, flair: -1 }, meters: { family: 2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-celebration', title: 'Inventing a Celebration', icon: '🙌',
    category: 'signature', minTurn: 0, maxTurn: 33, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He has a celebration ready. He has had it ready for about five months. He has practised it in front of a wardrobe mirror, which is a thing he will deny until he is forty. The problem now is that he has scored.',
        choices: [
          { id: 'full', label: 'Do the whole thing', desc: 'Arms out, slide, the lot', outcome: 'He does the full routine on a pitch with eleven spectators and a dog, and it is magnificent and slightly too long. Two of his mates copy it the following week — the highest honour available.', effect: { form: 0.07, attr: { flair: 2 }, meters: { authority: -4, peers: 6 }, tag: 'signature-celebration' } },
          { id: 'point', label: 'Point at whoever passed it', desc: 'The pass was better than the finish', outcome: 'He turns and points straight at the lad who slid it through, and something about that gets remembered longer than the goal does.', effect: { form: 0.04, attr: { teamwork: 2 }, meters: { authority: -1, peers: 7 } } },
          { id: 'nothing', label: 'Jog back like it is normal', desc: 'Say nothing, do nothing', outcome: 'He picks the ball out and jogs back with a face like a man checking his watch, and enjoys it enormously in private. The wardrobe routine is retired unused.', effect: { meters: { peers: -4 }, attr: { composure: 2 }, form: 0.03, tag: 'celebrates-cold' } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-first-memory', title: 'The First Goal He Can Actually Remember', icon: '🕯️',
    category: 'offpitch', minTurn: 0, maxTurn: 28, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody asks him what his first football memory is, and he finds he has two: one everybody has told him about so often that he might be remembering the telling, and one nobody else was there for — a scuffed goal past a bin bag, wet leaves, six years old, absolutely silent afterwards.',
        choices: [
          { id: 'private', label: 'Keep the quiet one', desc: 'The one with no witnesses', outcome: 'He says the bin-bag one out loud for the first time and it sounds like nothing. He keeps it anyway. Some things are load-bearing precisely because nobody else can see them.', effect: { meters: { family: -3 }, attr: { composure: 2 }, form: 0.04, tag: 'memory-private' } },
          { id: 'shared', label: 'Tell the famous one', desc: 'The story the family already owns', outcome: 'He tells the one everyone knows the ending of, and enjoys the way the room joins in halfway through. He has just learned that a good story is a thing you share out.', effect: { meters: { peers: -2, family: 6 }, attr: { leadership: 1 }, form: 0.03, tag: 'memory-shared' } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-squad-number', title: 'Choosing a Number', icon: '🔢',
    category: 'offpitch', minTurn: 0, maxTurn: 32, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cardboard box of shirts, and everyone gets to claim a number. Seven has already gone. There is a nine, a four, and a twenty-three with a hole in the armpit.',
        choices: [
          { id: 'nine', label: 'Take the nine', desc: 'The number that comes with a job description', outcome: 'He takes the nine and immediately feels obliged to score, which is either a burden or an engine depending on the week. Mostly an engine.', effect: { meters: { authority: -3 }, form: 0.05, attr: { leadership: 1, aggression: 1 }, tag: 'number-nine' } },
          { id: 'four', label: 'Take the four', desc: 'Nobody grows up dreaming of the four', outcome: 'He takes the four because somebody has to, and finds he quite likes being the one the game goes through rather than the one it ends at.', effect: { attr: { teamwork: 2 }, meters: { peers: -2, authority: 5 }, tag: 'number-four' } },
          { id: 'odd', label: 'Take the twenty-three with the hole', desc: 'For no reason he can explain', outcome: 'He takes the broken one because he likes the number, and wears it for three seasons out of pure stubbornness until it means something simply by having lasted.', effect: { attr: { flair: 2 }, meters: { authority: -2, peers: 4 }, tag: 'number-23' } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-ritual', title: 'Left Boot First', icon: '🧦',
    category: 'signature', minTurn: 0, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It started as an accident: left boot first, socks up last, three touches of the crossbar before he leaves the goalmouth. He has done it eleven weeks running and the team have not lost in four, which is obviously unrelated and obviously not.',
        choices: [
          { id: 'keep', label: 'Keep the whole ritual', desc: 'It costs ninety seconds and buys calm', outcome: 'He keeps it. It is not magic and he half knows that; what it actually does is tell his hands the game is starting, and his hands are grateful for the warning.', effect: { meters: { peers: -2 }, attr: { composure: 2 }, form: 0.05, tag: 'ritual-kept' }, next: 'broken' },
          { id: 'test', label: 'Deliberately break it once', desc: 'To prove he is not superstitious', outcome: 'He puts the right boot on first, on purpose, staring at it. He plays fine. He is slightly disappointed by how fine he plays.', effect: { meters: { family: -2 }, attr: { leadership: 1 }, tag: 'ritual-tested' }, next: 'broken' },
        ],
      },
      broken: {
        id: 'broken',
        prompt: 'One Sunday they arrive late, the ritual is impossible, and he is standing in the centre circle with a heartbeat somewhere near his ears.',
        choices: [
          { id: 'improvise', label: 'Invent a smaller one on the spot', desc: 'Three touches of the ball will do', outcome: 'He taps the ball three times with the outside of his boot before kick-off and decides that counts. It counts. It has always been him doing it, not the boots.', effect: { attr: { composure: 1, creativity: 2 }, form: 0.05 } },
          { id: 'nothing', label: 'Play without any of it', desc: 'Find out what is underneath', outcome: 'He plays cold and it is horrible for ten minutes and ordinary after that. He never fully trusts a ritual again, which frees up an enormous amount of Sunday morning.', effect: { attr: { composure: 3 }, form: -0.02, meters: { authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-barefoot', title: 'Barefoot in August', icon: '🌞',
    category: 'offpitch', minTurn: 0, maxTurn: 30, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Hottest week of the year, the grass on the rec burnt yellow, and somebody\'s boots have been abandoned by the goalposts. Within twenty minutes everyone is barefoot and the game has gone on for four hours without anyone agreeing on the score.',
        choices: [
          { id: 'play', label: 'Play until it goes dark', desc: 'No boots, no score, no referee', outcome: 'He plays until the ball is a grey shape and his feet are green to the ankle. He touches the ball more in that one afternoon than in a month of Sundays, and none of it goes in a record anywhere.', effect: { energy: -8, form: 0.09, attr: { flair: 2, stamina: 1 }, meters: { peers: 6 }, tag: 'barefoot-summer' } },
          { id: 'careful', label: 'Keep his boots on', desc: 'There is broken glass down by the trees', outcome: 'He keeps them on and gets called soft for an hour, and is the only one who does not spend the following week limping on a stone bruise.', effect: { form: 0.03, attr: { composure: 1 }, meters: { peers: -2 } } },
          { id: 'ball', label: 'Take charge of the ball', desc: 'Sort out teams, keep the game alive', outcome: 'He is the one who redraws the teams every time somebody has to go in for tea, and the game survives four separate near-deaths because of him.', effect: { energy: -5, attr: { leadership: 2, teamwork: 1 }, meters: { peers: 7 } } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-hero-ordinary', title: 'Meeting Him', icon: '✍️',
    category: 'relationship', minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The player whose clip he has worn out is opening a sports shop on the ring road. There is a queue of ninety people and a folding table. Up close he is smaller than expected, tired-looking, and signing with a marker that keeps drying out.',
        choices: [
          { id: 'ask', label: 'Ask him something real', desc: 'Not an autograph — a question', outcome: 'He asks how long it took him to learn the turn. Sadiku thinks about it properly and says two years, and that it still goes wrong. It is the most useful sentence anyone says to him that whole year.', effect: { meters: { peers: -2 }, attr: { composure: 2, creativity: 2 }, form: 0.05, tag: 'hero-spoke' }, next: 'after' },
          { id: 'sign', label: 'Just get the shirt signed', desc: 'Say nothing, keep the picture', outcome: 'He gets the signature, says thanks in a voice that barely works, and floats to the bus stop. He does not wash the shirt for a very long time.', effect: { form: 0.06, meters: { authority: -2, peers: 4 }, tag: 'hero-signed' }, next: 'after' },
          { id: 'watch', label: 'Stay at the back and watch him', desc: 'How he is with the small kids', outcome: 'He hangs back and watches how the man handles a nervous six-year-old, and notices that the kindness is the effortful bit, not the football.', effect: { meters: { peers: -3 }, attr: { leadership: 2, teamwork: 1 }, tag: 'hero-watched' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'On the bus home it settles on him that his hero is a bloke on a Wednesday afternoon doing a job, with a bad marker pen and somewhere else to be.',
        choices: [
          { id: 'human', label: 'Like him more for it', desc: 'If he is ordinary, the gap is crossable', outcome: 'The idol shrinks and the ambition grows. It is the correct trade. Nothing about that turn is magic. It is two years and it still goes wrong.', effect: { meters: { family: -2 }, attr: { composure: 2, leadership: 1 }, form: 0.05 } },
          { id: 'keep-myth', label: 'Keep the myth', desc: 'Some things are better slightly out of reach', outcome: 'He decides not to think about the folding table, and keeps the clip and the crowd noise instead. There is a use for something to aim at that never quite becomes furniture.', effect: { meters: { authority: -2 }, attr: { flair: 2 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-old-shirt', title: 'The Shirt He Will Not Bin', icon: '🧺',
    category: 'offpitch', minTurn: 1, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is far too small, the badge is more thread than badge, and it has a grass stain on the shoulder from a game he can date exactly. There is a bin bag in the hall marked for the charity shop.',
        choices: [
          { id: 'keep', label: 'Hide it at the back of the drawer', desc: 'Nobody needs to know', outcome: 'He folds it small and buries it under everything else. He will still have it when he is thirty and will not be able to explain it convincingly to anyone.', effect: { attr: { composure: 1 }, meters: { peers: -2, family: 3 }, form: 0.03, tag: 'shirt-kept' } },
          { id: 'give', label: 'Put it in the bag', desc: 'Let a smaller kid have a good shirt', outcome: 'He puts it in and closes the bag quickly. Somewhere in the town a seven-year-old is now wearing his best summer, and he finds he does not mind that at all.', effect: { form: -0.02, attr: { teamwork: 2 }, meters: { family: 5 }, tag: 'shirt-given' } },
          { id: 'frame', label: 'Pin it to the bedroom wall', desc: 'Where he can see it from the bed', outcome: 'Four drawing pins and a slightly crooked hang. It is the first thing he sees every morning for two years, and it is not nostalgia — it is a to-do list.', effect: { meters: { peers: -2 }, attr: { leadership: 1 }, form: 0.04, tag: 'shirt-pinned' } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-what-kind', title: 'What He Wants to Be Known For', icon: '🧭',
    category: 'saga', minTurn: 3, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A boy in his year says, entirely without malice, "you\'re the one who does the stepovers, aren\'t you." He thinks about it all the way home. Being known for something at twelve is a strange gift and he is not sure it is the something he would have picked.',
        choices: [
          { id: 'entertain', label: 'The one who makes it worth watching', desc: 'People remember how you made them feel', outcome: 'He decides he would rather be the reason somebody came than the reason somebody won, and half suspects those are the same thing anyway.', effect: { attr: { flair: 2, creativity: 2 }, form: 0.05, meters: { authority: -4, peers: 5 }, tag: 'wants-entertainer' }, next: 'test' },
          { id: 'reliable', label: 'The one you can depend on', desc: 'Same player in the rain as in the sun', outcome: 'He decides he wants to be the one nobody worries about, which is the least glamorous ambition available and the hardest to fake.', effect: { attr: { teamwork: 2 }, meters: { peers: -3, authority: 6 }, tag: 'wants-reliable' }, next: 'test' },
          { id: 'winner', label: 'The one who decides games', desc: 'Be there at the end, every time', outcome: 'He decides he wants to be the one it goes through when it matters. It is an ambition with teeth in it, and he will find out later exactly where they are.', effect: { meters: { peers: -2 }, attr: { leadership: 2, aggression: 1 }, form: 0.05, tag: 'wants-decider' }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'Three weeks later a game arrives that offers the exact opposite of whatever he chose: a mudbath where the only sensible football is ugly, safe and unrewarding.',
        choices: [
          { id: 'hold', label: 'Stay himself anyway', desc: 'The idea is not weather-dependent', outcome: 'He plays his way in conditions that punish it, and takes a scruffy afternoon on the chin without adjusting a thing. Whether that is character or stubbornness will take a decade to establish.', effect: { form: -0.03, attr: { leadership: 2 }, energy: -4 } },
          { id: 'adapt', label: 'Play what the day asks for', desc: 'Be the other kind of player for ninety minutes', outcome: 'He puts the idea in his pocket and does the ugly job well, and discovers that being able to switch is itself a style. Nobody claps. He knows.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 6 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-imagined-crowd', title: 'Sixty Thousand People', icon: '🏟️',
    category: 'offpitch', minTurn: 0, maxTurn: 32, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They let the district squad walk out on the big pitch at the county ground before the ground staff lock up. Empty, it is enormous and very quiet, and the seats go up much further than they look on television.',
        choices: [
          { id: 'imagine', label: 'Stand in the centre circle and fill it', desc: 'All of it, every seat, out loud in his head', outcome: 'He stands there long enough that a groundsman coughs. In the ninety seconds before that he has heard it full, and it does not frighten him. Worth knowing.', effect: { meters: { school: -2 }, form: 0.06, attr: { composure: 2, flair: 2 }, tag: 'imagined-crowd' } },
          { id: 'measure', label: 'Walk the pitch end to end', desc: 'Find out how far it actually is', outcome: 'He paces it out instead of dreaming on it, counting under his breath, and comes away with a number rather than a feeling. Both are useful. He has picked the one that keeps.', effect: { attr: { composure: 1, stamina: 1 }, meters: { peers: -2, authority: 4 } } },
          { id: 'seats', label: 'Go and sit right at the top', desc: 'Look down at where he was standing', outcome: 'From the back row the pitch is a green stamp and the players would be nothing at all. He decides he would like to be the small figure people lean forward for.', effect: { meters: { authority: -2 }, attr: { leadership: 1, creativity: 2 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-match-changed', title: 'The Game That Changed What He Thought Football Was', icon: '📺',
    category: 'saga', minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A midweek European tie on at eleven at night, a team from somewhere he could not point to, playing a version of the game he did not know was allowed — everyone moving before the ball does, nobody dribbling, and it is beautiful in a way that makes his own football look like shouting.',
        choices: [
          { id: 'obsess', label: 'Watch it again the next day', desc: 'And the day after, looking at the players without the ball', outcome: 'He rewatches it following one man who barely touches it, and spends the rest of that season noticing space instead of opponents. Nobody teaches him this. He just saw it.', effect: { meters: { school: -3 }, attr: { creativity: 2, teamwork: 1 }, form: 0.06, tag: 'saw-the-game' }, next: 'apply' },
          { id: 'talk', label: 'Try to explain it to everyone', desc: 'Badly, at length, for a fortnight', outcome: 'He describes it to anyone who stands still and gets nowhere, because it turns out he does not have the words yet. Trying to find them teaches him more than the game did.', effect: { attr: { leadership: 2, creativity: 2 }, meters: { authority: -2, peers: 3 }, tag: 'tried-to-explain' }, next: 'apply' },
        ],
      },
      apply: {
        id: 'apply',
        prompt: 'On Sunday he tries to play the way he saw. It requires ten other people to also have watched it, and they have not.',
        choices: [
          { id: 'persist', label: 'Keep playing it anyway', desc: 'Pass into space and wait for someone to arrive', outcome: 'Three balls roll harmlessly out for goal kicks and he gets shouted at. By March, two of them are running onto it. That is how it spreads.', effect: { form: -0.02, attr: { creativity: 2, teamwork: 1 }, meters: { peers: 4 } } },
          { id: 'shelve', label: 'Put it away for later', desc: 'Play the football this pitch understands', outcome: 'He goes back to what works on a windy municipal pitch and keeps the other thing folded up. It is still there years later, unwrinkled, waiting for teammates who can read it.', effect: { attr: { composure: 2 }, form: 0.04, meters: { authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-cant-stop', title: 'The Thing He Cannot Stop Doing', icon: '🪄',
    category: 'signature', minTurn: 0, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tennis ball, up the stairs, in the corridor at school, in the queue at the chip shop. Toe, knee, thigh, catch on the neck. He is not practising, exactly. He simply cannot be near a small round object and leave it alone.',
        choices: [
          { id: 'feed', label: 'Feed it — carry a ball everywhere', desc: 'Never be more than a foot away from one', outcome: 'A tennis ball lives in his coat pocket for two years. The touch it builds is not the sort you can be coached into; it arrives through sheer accumulated fiddling.', effect: { attr: { flair: 2, creativity: 2 }, form: 0.06, meters: { school: -3 }, tag: 'always-a-ball' } },
          { id: 'contain', label: 'Keep it out of school', desc: 'Two confiscations is enough', outcome: 'He rations himself to home and the walk, which annoys him and saves him three detentions. The fiddling survives. It just gets better hours.', effect: { attr: { flair: 2 }, meters: { school: 5 } } },
          { id: 'share', label: 'Turn it into a game with whoever is nearby', desc: 'Keepy-up chains in the bus queue', outcome: 'It becomes a thing several of them do, badly, in doorways. He is the reason a small corner of the school is football-mad that winter.', effect: { attr: { teamwork: 1, flair: 2 }, meters: { peers: 6, school: -2 }, form: 0.04 } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-mud-grin', title: 'Playing Like It Is the Park', icon: '😄',
    category: 'triumph', minTurn: 4, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Horizontal rain, a pitch that is essentially soup, and everybody miserable except him. He has been laughing since the first slide tackle put him in a puddle up to the elbow. It is, he realises with some surprise, the best he has felt in months.',
        choices: [
          { id: 'lead-joy', label: 'Drag everyone else into it', desc: 'Make the misery funny', outcome: 'He gets three of them laughing by the twentieth minute and the whole side plays two yards further forward. Nobody can prove joy did it. Everybody knows joy did it.', effect: { form: 0.09, attr: { leadership: 2, teamwork: 1 }, meters: { peers: 7 }, energy: -5, tag: 'joy-carrier' } },
          { id: 'private-joy', label: 'Keep it to himself and play', desc: 'Grin, say nothing, run', outcome: 'He says nothing at all and simply plays like it is the park again, grinning through the mud, and that is the thing people remember about that afternoon years later.', effect: { form: 0.08, attr: { flair: 2 }, energy: -4, tag: 'joy-quiet' } },
          { id: 'serious', label: 'Put the face on', desc: 'Everyone else is treating it seriously', outcome: 'He arranges his features into something suitably grim because that seems to be what is expected, and plays a perfectly good, entirely forgettable game.', effect: { attr: { composure: 1 }, meters: { authority: 4 }, form: -0.02 } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-two-styles', title: 'Two Players He Could Become', icon: '⚖️',
    category: 'saga', minTurn: 6, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Two clips saved on a battered phone. One is a forward who has never done anything complicated in his life and scores every week. The other is a boy from a Dutch side, all shoulders and misdirection, who might score or might get substituted. He watches both about equally and knows he is choosing.',
        choices: [
          { id: 'plain', label: 'Choose the plain one', desc: 'Do the simple thing faster than everyone else', outcome: 'He picks Vennick and spends a season removing things from his game rather than adding them. It is much less fun and it works almost immediately.', effect: { attr: { composure: 1, teamwork: 1 }, form: 0.06, meters: { peers: -3, authority: 6 }, tag: 'style-plain' }, next: 'later' },
          { id: 'risky', label: 'Choose the risky one', desc: 'Be the reason something happens', outcome: 'He picks the other one, and accepts in advance that a lot of afternoons will end with him being the problem. Some will end with him being the only reason.', effect: { attr: { flair: 2, creativity: 2 }, form: 0.04, meters: { authority: -4, peers: 5 }, tag: 'style-risk' }, next: 'later' },
          { id: 'neither', label: 'Refuse to choose', desc: 'Take a bit from each and see', outcome: 'He decides the whole question is a false one invented by people who make highlight clips, and carries on being an unclassifiable twelve-year-old.', effect: { meters: { authority: -2, peers: -2 }, attr: { creativity: 2 }, tag: 'style-undecided' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'Months later somebody describes his game back to him in one sentence, and it is not the sentence he was aiming for.',
        choices: [
          { id: 'accept', label: 'Accept the description', desc: 'Maybe they can see it better from there', outcome: 'He takes the sentence home and finds it fits better than the one he chose. Most players are what they are before they decide what they are.', effect: { attr: { composure: 2 }, form: 0.05, meters: { authority: 4 } } },
          { id: 'push', label: 'Set out to prove it wrong', desc: 'Be the other thing on purpose', outcome: 'He spends the whole spring deliberately being the player nobody said he was, and comes out the far side genuinely wider. Being underestimated is fuel if you can be bothered to burn it.', effect: { attr: { leadership: 2, flair: 2 }, energy: -5, form: 0.05 } },
        ],
      },
    },
  },
  {
    id: 'youth-joy-teaching-kid', title: 'Somebody Copying Him', icon: '👟',
    category: 'relationship', minTurn: 8, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A small lad from two doors down has started doing the drag back. Badly, endlessly, on the pavement outside. He is also wearing his socks over his knees, which is not a coincidence, because that is what the boy at number fourteen does.',
        choices: [
          { id: 'show', label: 'Go out and show him properly', desc: 'Twenty minutes on a pavement', outcome: 'He breaks it into three bits on the kerb and watches the kid get it wrong forty times and then not wrong. Teaching it teaches him what he actually knows: less than he thought, more than he feared.', effect: { attr: { leadership: 2, teamwork: 1 }, form: 0.05, meters: { school: -2, peers: 6 }, tag: 'taught-someone' } },
          { id: 'nothing', label: 'Say nothing, let him work it out', desc: 'Nobody showed him either', outcome: 'He watches from the window and leaves the boy to it, the way he was left to it, and feels a complicated mix of pride and guilt he does not have a word for yet.', effect: { attr: { composure: 1 }, meters: { authority: -3, peers: 2 } } },
          { id: 'careful', label: 'Tell him to make it his own', desc: 'Copy it, then change it', outcome: 'He tells the kid to learn it and then ruin it, which is genuinely the best football advice he will give anyone for about fifteen years.', effect: { attr: { leadership: 1, creativity: 2 }, meters: { school: -2, peers: 5 }, form: 0.04 } },
        ],
      },
    },
  },
];
