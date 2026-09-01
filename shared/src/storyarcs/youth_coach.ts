// ── YOUTH ARCS: COACHES, SCOUTS & BEING JUDGED (ages 10-14) ───────────────────────────────────────
// A boy this age has no contract, no agent and no price. What he has instead is a set of adults with
// clipboards who decide, weekly, what he is. These arcs are about that: coaches who believe in him and
// coaches who plainly don't, the sessions that are really punishments, the tests he can fail, the men on
// the touchline in club coats, and the sentences said to him in passing that he will still be repeating
// to himself at thirty. Meters used here are authority (his Coach) and, where staff decisions spill over,
// family/peers/school. No money changes hands anywhere in this file — they are children.
import type { StoryArc } from '../storyarc.js';

export const YOUTH_COACH_ARCS: StoryArc[] = [
  {
    id: 'youth-coach-dislikes', title: 'The Coach Who Doesn\'t Fancy Him', icon: '🧊', category: 'crisis',
    minTurn: 2, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It isn\'t shouting. It is smaller than that. The coach says good morning to every other lad by name and to him he says nothing at all, and has done for eleven weeks. Nobody else has noticed. He has counted.',
        choices: [
          { id: 'work', label: 'Be impossible to leave out', desc: 'Make the football answer it', outcome: 'He turns up first, does every drill twice and refuses to give the man a single reason. The silence continues, and he stops needing it to end.', effect: { energy: -8, form: 0.06, attr: { stamina: 1 }, meters: { authority: 3 }, tag: 'coach-cold-worked' }, next: 'why' },
          { id: 'ask', label: 'Ask him what he\'s done wrong', desc: 'Straight out, after training, on his own', outcome: 'He asks. The coach looks briefly caught out, says "nothing, son" — and afterwards uses his name, stiffly, like a word he\'s had to learn.', effect: { attr: { leadership: 1 }, meters: { authority: 6 }, tag: 'coach-cold-asked' }, next: 'why' },
          { id: 'shrink', label: 'Go quiet and hope it passes', desc: 'Stop putting his hand up, stop being seen', outcome: 'He makes himself smaller in every session until he is genuinely hard to notice. A habit that takes years to unlearn.', effect: { form: -0.05, attr: { composure: 1 }, meters: { authority: -4, peers: -3 }, tag: 'coach-cold-shrank' }, next: 'why' },
        ],
      },
      why: {
        id: 'why',
        prompt: 'In March another member of staff lets it slip, half-laughing, that the coach had a lad exactly like him years ago who didn\'t make it, and can\'t seem to look at him without seeing it.',
        choices: [
          { id: 'pity', label: 'Feel sorry for him', desc: 'Understand it isn\'t really about him at all', outcome: 'He decides the man is carrying something older than this season. It stops being a wound and becomes a fact about somebody else.', effect: { attr: { composure: 2 }, meters: { authority: 4 } } },
          { id: 'fuel', label: 'Keep it as fuel', desc: 'File it away and use it for years', outcome: 'He keeps the story like a stone in his pocket. It makes him harder, and slightly worse at trusting the next man with a whistle.', effect: { attr: { aggression: 1, stamina: 1 }, form: 0.06, meters: { authority: -3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-coach-leaves', title: 'The Man Who Found Him Goes', icon: '🚪', category: 'crisis',
    minTurn: 5, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach who first pulled him out of a Sunday side and told him he could be something is leaving for a job up the road. He tells the group in the changing room in about nine words and then starts the session as normal.',
        choices: [
          { id: 'thank', label: 'Catch him at the car', desc: 'Say the thing before he drives off', outcome: 'He gets to the car park in time to say thanks. The man shakes his hand like an adult and says he\'ll be watching. He believes him, and it turns out to be true.', effect: { attr: { leadership: 1 }, meters: { authority: 8 }, tag: 'coach-gone-thanked' }, next: 'after' },
          { id: 'nothing', label: 'Say nothing', desc: 'He wouldn\'t know how to start', outcome: 'He watches the car go from the touchline and doesn\'t wave. He thinks about that particular non-goodbye for a long time.', effect: { attr: { composure: 1 }, meters: { authority: -2 }, form: -0.04, tag: 'coach-gone-silent' }, next: 'after' },
          { id: 'ask-take', label: 'Ask if he can come too', desc: 'A child\'s question, asked seriously', outcome: 'He asks whether he could go with him. The man says it doesn\'t work like that, and that he has to be good enough for whoever walks in next.', effect: { attr: { composure: 1 }, meters: { authority: 4, family: -2 }, tag: 'coach-gone-asked' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'The replacement arrives in September and clearly has no idea who anybody is. On the first Saturday he is named as a substitute for the first time in two years.',
        choices: [
          { id: 'prove', label: 'Start again from zero', desc: 'Accept that nothing carries over', outcome: 'He treats it as a first day and earns it back over eight weeks. It teaches him the hardest lesson in the game: nobody inherits a place.', effect: { energy: -8, form: 0.08, attr: { stamina: 1 }, meters: { authority: 8 } } },
          { id: 'resent', label: 'Resent the new man', desc: 'He isn\'t the one who saw it first', outcome: 'He plays the whole autumn comparing him to the last one, and the new coach reads it exactly as what it is.', effect: { form: -0.06, attr: { aggression: 1 }, meters: { authority: -8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-coachs-son', title: 'The Coach\'s Boy', icon: '👨‍👦', category: 'relationship',
    minTurn: 1, maxTurn: 34, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach\'s son plays every minute of every game in the position that ought to be his. Everyone knows. Nobody says it, because the coach also washes the kit, marks the pitch and pays for the balls out of his own pocket.',
        choices: [
          { id: 'silent', label: 'Keep his mouth shut and play elsewhere', desc: 'Take the position he\'s given, learn it properly', outcome: 'He plays out of position all season without a word and quietly becomes the only lad in the group who can do two jobs.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { authority: 8, peers: 4 }, tag: 'coachs-son-quiet' } },
          { id: 'speak', label: 'Say it out loud, once', desc: 'Ask the coach why, in front of nobody', outcome: 'He asks. The coach goes red and defensive, then plays him there the following week and never fully forgives him for making him see it.', effect: { attr: { leadership: 1 }, form: 0.06, meters: { authority: -5 }, tag: 'coachs-son-spoke' } },
          { id: 'befriend', label: 'Get close to the son', desc: 'The lad didn\'t ask for any of this either', outcome: 'He works out that the boy is more embarrassed than anyone, and they become allies. It costs him nothing and teaches him something about who to blame.', effect: { attr: { teamwork: 1 }, meters: { peers: 8, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-made-to-apologise', title: 'Made to Say Sorry', icon: '🙇', category: 'crisis',
    minTurn: 3, maxTurn: 38, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He answered back in a session — one sentence, not even a bad one — and the coach has stopped everything and told him to apologise to the group. Twenty faces, all of them waiting. He is twelve.',
        choices: [
          { id: 'do-it', label: 'Say it properly', desc: 'Head up, out loud, no mumbling', outcome: 'He says it clearly and means the last half of it. The coach nods once, and the group forgets by Thursday. He does not.', effect: { attr: { composure: 2 }, meters: { authority: 8, peers: 3 }, tag: 'apologised-clean' } },
          { id: 'mumble', label: 'Mumble it and stare at the grass', desc: 'Get through the minute somehow', outcome: 'He gets it out at a volume nobody hears and is made to repeat it. That second time is the part that stays with him.', effect: { attr: { composure: 1 }, form: -0.05, meters: { authority: 2, peers: -3 }, tag: 'apologised-mumbled' } },
          { id: 'refuse', label: 'Refuse', desc: 'He doesn\'t think he did anything wrong', outcome: 'He stands there and says no. He is sent to get changed, and spends the walk to the car realising he was probably right and it will not help him at all.', effect: { attr: { aggression: 1, leadership: 1 }, meters: { authority: -12, peers: 6 }, tag: 'refused-apology' } },
        ],
      },
    },
  },
  {
    id: 'youth-punishment-session', title: 'Everybody Runs', icon: '🏃', category: 'crisis',
    minTurn: 4, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Somebody lost a ball over the fence and lied about it. Nobody owns up, so the balls go away and the whole group runs the touchlines in the dark for forty minutes while the coach stands under the floodlight saying nothing.',
        choices: [
          { id: 'lead', label: 'Set the pace at the front', desc: 'If they\'re running, run properly', outcome: 'He takes the front and drags the stragglers round. The coach doesn\'t mention it, and puts him on the list for the following month\'s squad.', effect: { energy: -14, attr: { stamina: 1, leadership: 1 }, meters: { authority: 10, peers: 4 } } },
          { id: 'back', label: 'Stay at the back with the lad struggling', desc: 'Run at the pace of the worst runner', outcome: 'He drops back and jogs the last ten with the boy who was crying. It costs him nothing on the pitch and buys him something in that changing room forever.', effect: { energy: -10, attr: { teamwork: 1, stamina: 1 }, meters: { peers: 12, authority: 3 } } },
          { id: 'confess', label: 'Take the blame to end it', desc: 'It wasn\'t him. Say it was anyway.', outcome: 'He says it was him and the running stops. The coach believes him, thinks less of him for a fortnight, and the group knows exactly what he did.', effect: { energy: -6, attr: { leadership: 1 }, meters: { peers: 12, authority: -6 }, tag: 'took-the-blame' } },
        ],
      },
    },
  },
  {
    id: 'youth-called-lazy', title: 'The Word He Used Was Lazy', icon: '🗯️', category: 'crisis',
    minTurn: 6, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Feedback after a session, done standing up, in front of two other coaches. "Talented. Lazy." Two words, one of them lovely and one of them a brand. He goes home and looks at himself in the mirror trying to see it.',
        choices: [
          { id: 'accept', label: 'Decide he might be right', desc: 'Look honestly at how hard he actually works', outcome: 'He watches himself for a month and finds three places the man was right. Fixing them is unglamorous and changes everything.', effect: { energy: -10, attr: { stamina: 2 }, form: 0.06, meters: { authority: 8 }, tag: 'lazy-accepted' }, next: 'later' },
          { id: 'reject', label: 'Decide it was unfair', desc: 'He isn\'t lazy — he just makes it look easy', outcome: 'He rejects it flatly. He might even be right, but he loses the chance to find out, and the word follows him up the age groups on a form he never sees.', effect: { attr: { flair: 2 }, meters: { authority: -6 }, tag: 'lazy-rejected' }, next: 'later' },
        ],
      },
      later: {
        id: 'later',
        prompt: 'A year later a different coach, one who has never met the first, uses the same word about him in passing without knowing it has a history.',
        choices: [
          { id: 'answer', label: 'Answer it with a season', desc: 'Say nothing, run for ten months', outcome: 'He never argues the word again; he just makes it impossible to say. By spring nobody remembers who used it first.', effect: { energy: -12, form: 0.1, attr: { stamina: 1 }, meters: { authority: 8 } } },
          { id: 'carry', label: 'Carry it', desc: 'Let it live in him', outcome: 'The sentence lodges somewhere and never comes loose. Years later, on the thin days, it is still the thing he reaches for.', effect: { attr: { aggression: 1, composure: 1 }, form: 0.04, meters: { authority: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-bleep-test-fail', title: 'Level Nine', icon: '📉', category: 'crisis',
    minTurn: 5, maxTurn: 40, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Fitness testing in the sports hall, results written on a whiteboard where everyone can read them. He goes out at level nine. The lad who cannot trap a ball goes to fourteen and the coach writes both numbers up without comment.',
        choices: [
          { id: 'retest', label: 'Ask to do it again on his own', desc: 'Come back on a Thursday and go again', outcome: 'He asks for a retest and does it in an empty hall with one coach counting. He gets to twelve, and the coach writes the new number up next to the old one.', effect: { energy: -12, attr: { stamina: 2 }, meters: { authority: 10 }, tag: 'retested' } },
          { id: 'excuse', label: 'Say he was ill', desc: 'It\'s half true and it saves the afternoon', outcome: 'He says he was ill. It works, in the sense that nobody argues, and fails, in the sense that the number stays on the board.', effect: { attr: { composure: 1 }, meters: { authority: -5, peers: -2 } } },
          { id: 'own-it', label: 'Say out loud that it\'s not good enough', desc: 'Own the number in front of the group', outcome: 'He tells the room it\'s rubbish and he\'ll fix it. Saying it publicly makes it a debt, and he spends the winter paying it.', effect: { energy: -8, attr: { leadership: 1, stamina: 1 }, meters: { authority: 8, peers: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-made-example', title: 'Everybody Watch This One', icon: '👀', category: 'triumph',
    minTurn: 2, maxTurn: 36, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach stops the drill, calls the whole group in, and makes him do it again while twenty lads stand and watch. It could be praise. From the tone, it could just as easily not be. Nobody yet knows which.',
        choices: [
          { id: 'perform', label: 'Do it perfectly', desc: 'Nail it with everybody watching', outcome: 'He does it better than the first time. The coach says "that. That is what I want." He walks back into the group with his ears burning and something new in his chest.', effect: { form: 0.08, attr: { flair: 2 }, meters: { authority: 10, peers: -3 }, tag: 'shown-as-good' } },
          { id: 'fluff', label: 'Fluff it', desc: 'Twenty pairs of eyes and it goes wrong', outcome: 'He mishits it completely. The coach lets the silence sit a beat too long before moving on, and he learns exactly how heavy an audience is.', effect: { form: -0.06, attr: { composure: 1 }, meters: { authority: -4, peers: 3 }, tag: 'shown-and-failed' } },
          { id: 'deflect', label: 'Point at the lad who set it up', desc: 'Push the attention onto someone else', outcome: 'He says the pass made it easy. The group laughs, the coach doesn\'t, and the boy who played the pass stands about an inch taller.', effect: { attr: { teamwork: 1, leadership: 1 }, meters: { peers: 10, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-we-will-let-you-know', title: 'We\'ll Let You Know', icon: '✉️', category: 'crisis',
    minTurn: 8, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Six weeks on trial and it ends with a handshake at the gate and the sentence every boy in the country knows: we\'ll let you know. Nobody ever says how long "know" takes. He checks the post for twenty-six days.',
        choices: [
          { id: 'wait', label: 'Wait properly', desc: 'Say nothing, train, let it come', outcome: 'He waits it out and trains all the way through. The letter comes on a Tuesday and by then he has already decided he will be fine either way.', effect: { attr: { composure: 2 }, meters: { authority: 4, family: 4 }, tag: 'waited-well' }, next: 'letter' },
          { id: 'chase', label: 'Get someone to ring them', desc: 'He can\'t stand not knowing', outcome: 'A call is made. The woman on the phone is kind and says the staff are still deciding — both true and no use to anybody.', effect: { form: -0.04, meters: { family: 4, authority: -3 }, tag: 'chased' }, next: 'letter' },
        ],
      },
      letter: {
        id: 'letter',
        prompt: 'The envelope has the crest on it. It is thin. He knows before he opens it that thin means one thing, and he opens it in the hall on his own anyway.',
        choices: [
          { id: 'read-alone', label: 'Read it alone and then go training', desc: 'Whatever it says, go anyway', outcome: 'It says no, in three careful paragraphs signed by a name he does not recognise. He goes to training that night and is the best player there.', effect: { attr: { composure: 1, stamina: 1 }, form: 0.06, meters: { authority: 6, family: -5 }, tag: 'rejected-and-went' } },
          { id: 'keep', label: 'Keep it', desc: 'Fold it small and put it somewhere', outcome: 'He folds it into the lid of his boot box. It is still there years later, softened at the creases from being taken out.', effect: { attr: { aggression: 1, composure: 1 }, form: 0.04, tag: 'kept-the-letter' } },
        ],
      },
    },
  },
  {
    id: 'youth-bigger-club-scout', title: 'The Coat With the Badge On It', icon: '🧥', category: 'triumph',
    minTurn: 7, maxTurn: 42, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'There is a man on the far side in a training coat with a badge everybody recognises — a club two divisions above anything in this county. He isn\'t hiding it. Half the pitch is playing for him within four minutes.',
        choices: [
          { id: 'normal', label: 'Play exactly as he always does', desc: 'Refuse to notice him', outcome: 'He plays his ordinary game — simple, early, useful. Afterwards the man tells his coach that the boy was the only one out there who didn\'t change, and that is the note he writes down.', effect: { form: 0.08, attr: { composure: 2 }, meters: { authority: 8 }, tag: 'scout-unbothered' } },
          { id: 'show', label: 'Show him something', desc: 'One trick, one shot from distance, make him look', outcome: 'He tries the thing he can do about a third of the time and it comes off. The man watches ten more minutes and leaves. Nobody ever tells him what was in the notebook.', effect: { form: 0.06, attr: { flair: 2 }, meters: { peers: 4, authority: -3 }, tag: 'scout-showed-off' } },
          { id: 'tighten', label: 'Freeze', desc: 'His legs go and he hides for an hour', outcome: 'He does not want the ball for the first time in his life. It is the most frightening forty minutes of football he has ever played, and it teaches him what nerves actually are.', effect: { form: -0.1, attr: { composure: 1 }, meters: { authority: -4 }, tag: 'scout-froze' } },
        ],
      },
    },
  },
  {
    id: 'youth-coach-shields-him', title: 'The Coach Who Sent Him Away', icon: '🛡️', category: 'relationship',
    minTurn: 9, maxTurn: 44, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He finds out by accident that a scout came for him in November and his own coach told the man he wasn\'t ready and to come back in a year. Nobody asked him. Nobody told him. It is May.',
        choices: [
          { id: 'confront', label: 'Ask him why he did that', desc: 'Straight question, no shouting', outcome: 'The coach says he was protecting him from being a small fish in a big pond at thirteen. He might even be right. It doesn\'t stop it being the first time an adult in football decided something about his life without him.', effect: { attr: { leadership: 1 }, meters: { authority: -5 }, tag: 'shielded-confronted' }, next: 'return' },
          { id: 'trust', label: 'Trust that he meant well', desc: 'Let it go without a word', outcome: 'He never brings it up. The coach never learns he knew, and works twice as hard for a boy he thinks is unaware of the favour.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { authority: 8 }, tag: 'shielded-trusted' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'The following November the same scout comes back, exactly as promised, and this time asks to speak to him directly with the coach standing there.',
        choices: [
          { id: 'speak', label: 'Answer for himself', desc: 'Look the man in the eye and talk', outcome: 'He answers every question himself while the coach stands silent behind him. Both men leave thinking he is older than he is.', effect: { attr: { leadership: 2 }, form: 0.06, meters: { authority: 4 } } },
          { id: 'defer', label: 'Let the coach do the talking', desc: 'He\'s fourteen and the man knows him best', outcome: 'He lets his coach speak for him and stares at the grass. It goes fine, and he spends the drive home wishing he had said one thing of his own.', effect: { attr: { teamwork: 1, leadership: -1 }, meters: { authority: 8 } } },
        ],
      },
    },
  },
  {
    id: 'youth-tactical-question', title: 'What Did You See?', icon: '🧠', category: 'triumph',
    minTurn: 9, maxTurn: 44, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The coach stops the session, turns to him — not the captain, not the biggest lad, him — and asks what he thinks is going wrong on the left. It is the first time in his life an adult has asked him a football question expecting a real answer.',
        choices: [
          { id: 'answer', label: 'Say what he actually thinks', desc: 'Even though he might be wrong in front of everyone', outcome: 'He says the winger is standing too close to the touchline for the pass to exist. There is a pause, and then the coach moves the winger five yards. He does not stop thinking about that five yards for years.', effect: { attr: { leadership: 2, creativity: 2 }, meters: { authority: 12 }, form: 0.06, tag: 'asked-and-answered' } },
          { id: 'safe', label: 'Give the answer he thinks is wanted', desc: 'Repeat something the coach said last week', outcome: 'He parrots a phrase from a previous session. The coach says "right" in a flat voice and asks somebody else, and he knows exactly what he threw away.', effect: { attr: { teamwork: 1 }, meters: { authority: 2 } } },
          { id: 'shrug', label: 'Shrug', desc: 'Being asked in front of twenty people is unbearable', outcome: 'He shrugs and looks at his boots. The coach moves on without unkindness, and does not ask him again that season.', effect: { attr: { composure: 1 }, meters: { authority: -5, peers: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-new-coach-system', title: 'The New Man\'s Way', icon: '📐', category: 'saga',
    minTurn: 12, maxTurn: 46, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The new academy coach has a system and a folder full of diagrams. Everything he has ever been praised for — the run off the shoulder, the dribble out of the corner — is now described in team meetings as "a decision that breaks the shape".',
        choices: [
          { id: 'buy-in', label: 'Learn the diagrams', desc: 'Do it exactly his way for a whole season', outcome: 'He plays the shape until it becomes automatic and boring and then, one Tuesday, discovers he can see the whole pitch from inside it.', effect: { attr: { teamwork: 1, creativity: 2 }, form: 0.06, meters: { authority: 12 }, tag: 'bought-the-system' }, next: 'test' },
          { id: 'resist', label: 'Keep playing his own way', desc: 'The thing that got him here is the thing that got him here', outcome: 'He keeps doing it and keeps being taken off. Twice in the folder there is a note beside his name that he is never shown.', effect: { attr: { flair: 2 }, form: -0.06, meters: { authority: -10 }, tag: 'resisted-the-system' }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'A game in March goes badly and the shape is not working. On the touchline the coach looks down the bench and, without much conviction, asks him what he wants to do.',
        choices: [
          { id: 'break', label: 'Ask to break it', desc: 'Tell him the honest answer', outcome: 'He says the shape is the problem. The coach lets him go and play, it works, and neither of them ever refers to it again — but the folder gets thinner after that.', effect: { attr: { leadership: 1, creativity: 2, flair: 2 }, form: 0.08, meters: { authority: 4 } } },
          { id: 'hold', label: 'Say hold the shape', desc: 'Back the man in front of the group', outcome: 'He says stick with it. They lose, and the coach never forgets that the boy backed him in public on a bad day.', effect: { attr: { teamwork: 1 }, form: -0.04, meters: { authority: 12 } } },
        ],
      },
    },
  },
  {
    id: 'youth-assessment-day', title: 'Assessment Day', icon: '📊', category: 'crisis',
    minTurn: 16, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Twice a year they are measured: height, reach, sprint times, a scored game with staff on every side writing on tablets. A whole footballer reduced to a row on a spreadsheet by four o\'clock. Everyone pretends it\'s a normal Wednesday.',
        choices: [
          { id: 'perform', label: 'Treat it as the biggest day of the year', desc: 'Empty himself into six hours', outcome: 'He goes at it like a cup final and posts numbers he never gets near again. Two staff argue about him at the meeting. It is the best thing that could happen.', effect: { energy: -16, form: 0.08, attr: { stamina: 1 }, meters: { authority: 10 }, tag: 'assessment-big' }, next: 'feedback' },
          { id: 'normal', label: 'Treat it as a Wednesday', desc: 'Refuse to let a tablet change how he plays', outcome: 'He plays exactly as he always does. The numbers are unremarkable and the game score is the highest on the sheet, and the room disagrees about which matters.', effect: { attr: { composure: 2 }, form: 0.04, meters: { authority: 4 }, tag: 'assessment-normal' }, next: 'feedback' },
        ],
      },
      feedback: {
        id: 'feedback',
        prompt: 'The feedback is delivered in a small room with a printed sheet turned around to face him. Two columns. One is headed Strengths. The other one is longer.',
        choices: [
          { id: 'questions', label: 'Ask about every line', desc: 'Make them explain what each phrase means', outcome: 'He asks what "lacks presence" actually means, and the coach struggles to answer. Making an adult defend a phrase is a skill he keeps for life.', effect: { attr: { leadership: 1 }, meters: { authority: -6 } } },
          { id: 'take', label: 'Take the sheet and say thank you', desc: 'Read it properly later, on his own', outcome: 'He folds the sheet, says thanks, and reads it four times that night in bed. By the fourth time he has stopped arguing with it.', effect: { attr: { composure: 2 }, form: 0.04, meters: { authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'youth-video-room', title: 'The Video Room', icon: '📺', category: 'crisis',
    minTurn: 15, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Monday analysis. The lights go down and the coach pauses the clip on him — jogging back, four yards off, while the move goes past him. He rewinds it three times. The third time somebody at the back laughs.',
        choices: [
          { id: 'own', label: 'Say it out loud: that\'s on me', desc: 'Before the coach has to say it for him', outcome: 'He says it before anyone else can. The coach un-pauses the clip immediately and moves on, which is the closest thing to mercy that room has.', effect: { attr: { leadership: 1 }, meters: { authority: 10, peers: 4 }, tag: 'video-owned-it' } },
          { id: 'explain', label: 'Explain what he was doing', desc: 'There was a reason and it was a decent one', outcome: 'He explains that he was covering the run inside. Half the room thinks it\'s an excuse; the coach rewinds again, looks, and says "fair enough" in a way that costs him something.', effect: { attr: { creativity: 2, leadership: 1 }, meters: { authority: 3, peers: -3 } } },
          { id: 'burn', label: 'Sit there and take it', desc: 'Say nothing, look at the screen, go red', outcome: 'He watches himself jog back three times in silence. He is never four yards off again for the rest of his career, which was, presumably, the point.', effect: { attr: { stamina: 1 }, form: 0.06, meters: { authority: 4, peers: -2 } } },
        ],
      },
    },
  },
  {
    id: 'youth-secret-trial', title: 'The Tuesday Nobody Was Told About', icon: '🤫', category: 'crisis',
    minTurn: 18, maxTurn: 48, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Another club has asked him to come and train with them. Quietly. On a Tuesday, when his own academy is off. The word "quietly" has been said twice, and he is old enough now to know exactly what that word is doing.',
        choices: [
          { id: 'tell', label: 'Tell his coach first', desc: 'Say it to his face before he goes anywhere', outcome: 'He tells him. The coach is furious for about eleven seconds and then, grudgingly, says go and see. The honesty is worth more than the trial turns out to be.', effect: { attr: { leadership: 1 }, meters: { authority: 10 }, tag: 'trial-declared' }, next: 'after' },
          { id: 'go', label: 'Go quietly', desc: 'Nobody needs to know', outcome: 'He goes and says nothing. It is a good session and he spends the whole ninety minutes looking at the touchline in case somebody who knows somebody is standing there.', effect: { form: 0.06, attr: { composure: 1 }, meters: { authority: -8 }, tag: 'trial-secret' }, next: 'after' },
          { id: 'decline', label: 'Say no', desc: 'He\'s happy where he is and that\'s allowed', outcome: 'He turns it down without telling anyone he was asked. It is the first loyal decision he ever makes, and nobody will ever know he made it.', effect: { attr: { teamwork: 1, composure: 1 }, meters: { authority: 6 }, tag: 'trial-declined' } },
        ],
      },
      after: {
        id: 'after',
        prompt: 'By Friday it has got back to his own academy anyway — these things always do — and the coach asks him, in front of the staff room door, whether he wants to be here.',
        choices: [
          { id: 'honest', label: 'Tell him the truth', desc: 'That he wants to play and he\'s scared of being let go', outcome: 'He admits he\'s frightened of the summer. The coach softens completely, and tells him something about his own release at sixteen that he never tells the group.', effect: { form: -0.05, attr: { composure: 2 }, meters: { authority: 12, family: 3 } } },
          { id: 'commit', label: 'Say yes, flatly', desc: 'No explanation, no apology', outcome: 'He says yes and nothing else. The coach accepts it, and the pair of them never mention Tuesday again.', effect: { attr: { teamwork: 1 }, form: 0.04, meters: { authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'youth-open-day', title: 'Open Day', icon: '🎪', category: 'crisis',
    minTurn: 20, maxTurn: 48, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The academy runs an open trial. Two hundred boys in numbered bibs on four pitches, and his group has been told to play against them. Somewhere out there is a kid who is better than him and does not yet know it.',
        choices: [
          { id: 'ruthless', label: 'Play like his place depends on it', desc: 'Because on some level it does', outcome: 'He goes at fourteen-year-old strangers like it is a final, and the staff see a boy who understands what the day actually is.', effect: { energy: -12, form: 0.08, attr: { aggression: 1, stamina: 1 }, meters: { authority: 8 }, tag: 'open-day-ruthless' } },
          { id: 'kind', label: 'Look after the nervous one', desc: 'One lad is clearly terrified and shaking', outcome: 'He spends the morning talking one frightened boy through it. The lad plays well and gets taken on. He never quite works out whether that cost him something.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { peers: 8, authority: 4 }, tag: 'open-day-kind' } },
          { id: 'watch', label: 'Watch the best of them', desc: 'Find the one who\'s a threat and study him', outcome: 'He picks out the dangerous one within ten minutes and spends the rest of the day learning him. Knowing exactly who is coming is its own kind of calm.', effect: { attr: { creativity: 2, composure: 1 }, form: 0.04, meters: { authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'youth-may-letters', title: 'The Month the Letters Go Out', icon: '🕰️', category: 'crisis',
    minTurn: 22, maxTurn: 48, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It is May, and everyone in the building knows the meetings have started. Boys go in one at a time and come out with a face that says everything. His slot is Thursday at four. Nobody has told him anything.',
        choices: [
          { id: 'train', label: 'Train through the week as if nothing is happening', desc: 'Give them nothing to write down', outcome: 'He trains all week like it is October. Two of the staff mention it to each other, which is not why he did it, but it does not hurt.', effect: { energy: -8, attr: { composure: 1, stamina: 1 }, meters: { authority: 8 }, tag: 'may-trained-through' }, next: 'room' },
          { id: 'ask-early', label: 'Ask on Monday and get it over with', desc: 'He can\'t do four days of this', outcome: 'He asks a coach in the corridor on Monday. The man says he can\'t say, in a tone that gives away nothing at all, and the four days are worse now.', effect: { form: -0.06, energy: -4, meters: { authority: -2 }, tag: 'may-asked-early' }, next: 'room' },
          { id: 'lads', label: 'Sit with the ones who\'ve already been told no', desc: 'Go and find them instead of avoiding them', outcome: 'He goes and sits with two lads who already know. It is the most useful hour of his year and he understands, finally, that the club is not his family.', effect: { attr: { teamwork: 1 }, meters: { peers: 10, authority: -2 }, tag: 'may-sat-with-them' }, next: 'room' },
        ],
      },
      room: {
        id: 'room',
        prompt: 'Thursday, four o\'clock, a small room with three chairs and only two people in it. The coach has a folder he does not open, and starts with the words "so, look".',
        choices: [
          { id: 'listen', label: 'Sit still and let him say it', desc: 'Whatever it is, hear all of it', outcome: 'He is kept on, with conditions attached, listed slowly. He hears every one of them and can still recite the list in his thirties.', effect: { attr: { composure: 2 }, form: 0.06, meters: { authority: 10 } } },
          { id: 'ask-truth', label: 'Ask him for the honest version', desc: 'Not the version they say to parents', outcome: 'He asks what the staff actually say about him when he isn\'t in the room. The coach tells him, and it is harder and more useful than anything on the sheet.', effect: { attr: { leadership: 1 }, form: -0.05, meters: { authority: 8 }, tag: 'heard-the-truth' } },
        ],
      },
    },
  },
];
