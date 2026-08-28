import type { StoryArc } from '../storyarc.js';

// CRISIS arcs — adversity storylines: injuries, slumps, fall-outs, scandals, pressure to overcome.
export const CRISIS_ARCS: StoryArc[] = [
  {
    id: 'injury-comeback', title: 'The Long Road Back', icon: '🩹', category: 'crisis',
    minTurn: 70, maxTurn: 180, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A sickening challenge from {RIVAL}, a twist, a silence in the stadium. The scan confirms the worst — months on the sidelines. How does he face the rehab?',
        choices: [
          { id: 'grind', label: 'Attack the rehab', desc: 'First in, last out — obsess over every session', outcome: 'He throws himself at it, driven by the memory of {RIVAL}’s tackle.', effect: { energy: -10, attr: { stamina: 2 }, meters: { authority: 6 }, tag: 'grinder' }, next: 'return' },
          { id: 'patient', label: 'Trust the process', desc: 'Do exactly what the medics say, no more', outcome: 'He resists the urge to rush, and lets the body heal properly.', effect: { attr: { composure: 1 }, tag: 'patient' }, next: 'return' },
          { id: 'dark', label: 'Struggle with it', desc: 'The dark days come — doubt, frustration, isolation', outcome: 'The mind is harder than the knee. Some nights he wonders if he’ll be the same.', effect: { form: -0.08, meters: { partner: -6, family: 6 }, tag: 'shaken' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'Comeback day, off the bench, the crowd on its feet. The first fifty-fifty is his to win — and {RIVAL} is the man in front of him. Does he go in?',
        choices: [
          { id: 'brave', label: 'Fly into it', desc: 'Show the knee — and himself — there’s no fear left', outcome: 'He wins it clean, and the ground erupts. The demons are buried. He is back.', effect: { form: 0.1, attr: { aggression: 1, composure: 1 }, meters: { fans: 14, authority: 6 } } },
          { id: 'guard', label: 'Protect himself', desc: 'Ease back in — no heroics on day one', outcome: 'He plays it safe and comes through unscathed — the sharpness will return in time.', effect: { form: 0.03, meters: { fans: 4 } } },
        ],
      },
    },
  },
  {
    id: 'manager-fallout', title: 'Out in the Cold', icon: '❄️', category: 'crisis',
    minTurn: 100, maxTurn: 185, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new manager arrives and takes an instant dislike to him — dropped to the bench, frozen out, briefed against in the press. His whole career suddenly hangs on how he reacts.',
        choices: [
          { id: 'graft', label: 'Win him over', desc: 'Head down, train like a demon, force the gaffer’s hand', outcome: 'He becomes impossible to ignore in training — respect grudgingly earned.', effect: { attr: { stamina: 1 }, meters: { authority: 8 }, form: 0.04, tag: 'grafted' }, next: 'crossroads' },
          { id: 'clash', label: 'Confront him', desc: 'Demand to know where he stands — clear the air, or blow it up', outcome: 'A blazing row behind closed doors. It’s honest, at least. The lines are drawn.', effect: { meters: { authority: -6 }, tag: 'clashed' }, next: 'crossroads' },
        ],
      },
      crossroads: {
        id: 'crossroads',
        prompt: 'Weeks of exile later, a chance: an injury crisis means he’s needed, away at {RIVAL}’s club, the gaffer with no other option. One game to change everything.',
        choices: [
          { id: 'statement', label: 'Make a statement', desc: 'Play the game of his life and shame the doubters', outcome: 'He runs the show and silences the lot of them. You can’t drop him now.', effect: { form: 0.1, attr: { composure: 1, creativity: 1 }, meters: { fans: 12, authority: 6 } } },
          { id: 'move-on', label: 'Play for a move', desc: 'A tidy game — enough to remind other clubs he exists', outcome: 'Solid, professional, and the scouts in the stand take note. The exit door beckons.', effect: { market: 3, form: 0.03 } },
        ],
      },
    },
  },
  {
    id: 'crisis-form-slump', title: 'The Goal That Won’t Come', icon: '🌧️', category: 'crisis',
    minTurn: 85, maxTurn: 190, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eight games without a goal, and the touch has deserted him — a heavy first touch, a shot dragged wide, a groan rolling round the ground each time the ball sticks under his feet. The confidence has drained out of his boots. What does he cling to?',
        choices: [
          { id: 'extras', label: 'Stay behind for finishing', desc: 'Cones, a keeper, a bag of balls — hammer it until it clicks', outcome: 'He drills alone after the floodlights dim, ball after ball into the empty net, chasing the old feeling.', effect: { energy: -8, attr: { composure: 1 }, meters: { authority: 5 }, tag: 'grafting' }, next: 'chance' },
          { id: 'headshrink', label: 'See the club psychologist', desc: 'Admit the trouble is between the ears, not the feet', outcome: 'He talks it out in a quiet room, learns to stop replaying the misses on a loop. The knot loosens a little.', effect: { attr: { composure: 2 }, form: 0.03, tag: 'clear-headed' }, next: 'chance' },
          { id: 'hide', label: 'Stop taking the shots', desc: 'Lay it off, play the percentages, wait for the fog to lift', outcome: 'He becomes a passenger — safe, sideways, invisible. The manager notices the shrinking.', effect: { form: -0.1, meters: { fans: -6, authority: -5 }, tag: 'shrinking' }, next: 'chance' },
        ],
      },
      chance: {
        id: 'chance',
        prompt: 'Ninetieth minute, level, and the ball drops to him six yards out with the whole slump balanced on this one swing of his boot. The keeper spreads himself. Everything he’s felt for two months is in his throat.',
        choices: [
          { id: 'first-time', label: 'Hit it first time', desc: 'No thinking, no flinch — trust the instinct that made him', outcome: 'He lashes it in off the underside before the doubt can whisper. He wheels away roaring, the drought drowned in noise.', effect: { form: 0.14, attr: { flair: 1, composure: 1 }, meters: { fans: 16, authority: 8 } } },
          { id: 'compose', label: 'Take a touch, pick a corner', desc: 'Slow it down, be certain, roll it home with his head up', outcome: 'One steadying touch, side-foot into the bottom bin. Not spectacular — but the monkey is finally off his back.', effect: { form: 0.09, attr: { composure: 2 }, meters: { fans: 9 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-red-card', title: 'Seeing Red', icon: '🟥', category: 'crisis',
    minTurn: 80, maxTurn: 188, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A rush of blood — studs up, late, and stupid — and the referee’s arm shoots skyward. Three games banned, the pundits queuing to bury him, the manager fuming on the touchline. The reaction is what people will remember.',
        choices: [
          { id: 'apology', label: 'Front up publicly', desc: 'Own it — a proper apology to the lad, the club, the fans', outcome: 'He stands in front of the cameras and takes it on the chin, no excuses, no lawyer’s words. It lands well.', effect: { attr: { composure: 1 }, meters: { fans: 8, authority: 6 }, tag: 'contrite' }, next: 'appeal' },
          { id: 'defiant', label: 'Insist he got the ball', desc: 'Come out swinging — it was never a red, it’s a witch-hunt', outcome: 'He doubles down on the airwaves, jaw set, blaming the officials. The clip goes everywhere; opinion hardens against him.', effect: { attr: { aggression: 1 }, meters: { fans: -8, authority: -5 }, tag: 'defiant' }, next: 'appeal' },
        ],
      },
      appeal: {
        id: 'appeal',
        prompt: 'The club can appeal for wrongful dismissal — a gamble. Win it and he plays the derby; lose it and the ban stretches to four with a frivolous-appeal charge. The panel meets Thursday.',
        choices: [
          { id: 'accept', label: 'Accept the ban, serve it clean', desc: 'Take the three, train hard, come back sharper', outcome: 'He does the time without a murmur, runs himself into the ground in training, and returns leaner and calmer.', effect: { attr: { stamina: 1, composure: 1 }, form: 0.05, meters: { authority: 7 } } },
          { id: 'gamble', label: 'Roll the dice on appeal', desc: 'Fight it and free himself for the big one', outcome: 'The panel buys the argument by a whisker — dismissal rescinded. He’s cleared for the derby, and he does not waste it.', effect: { form: 0.08, attr: { aggression: 1 }, meters: { fans: 11, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-training-bustup', title: 'Handbags on the Grass', icon: '🥊', category: 'crisis',
    minTurn: 78, maxTurn: 186, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A crunching tackle in a small-sided game, a shove, and then his own teammate has him by the collar with the whole squad piling in to pull them apart. By teatime the phone footage is on every timeline. The dressing room splits down the middle.',
        choices: [
          { id: 'handshake', label: 'Shake on it before he leaves', desc: 'Find the lad in the car park, clear it man to man', outcome: 'He catches him by the cars, sticks out a hand, and they hash it out where no camera can see. Respect, quietly restored.', effect: { attr: { teamwork: 1, leadership: 1 }, meters: { peers: 9 }, tag: 'peacemaker' }, next: 'dressing-room' },
          { id: 'stew', label: 'Let him stew', desc: 'He started it — no way is the apology coming from here', outcome: 'He blanks the lad for days, jaw tight, and the frost seeps through the whole group. Cliques form around the fault line.', effect: { attr: { aggression: 1 }, meters: { peers: -8 }, tag: 'frost' }, next: 'dressing-room' },
        ],
      },
      'dressing-room': {
        id: 'dressing-room',
        prompt: 'Saturday, and the pair are named in the same XI. The gaffer wants to know before kickoff whether he can trust them to play for each other, or whether the feud walks out onto the pitch with them.',
        choices: [
          { id: 'partnership', label: 'Turn it into a partnership', desc: 'Run the legs off each other — for each other', outcome: 'They combine for the winner, the grudge alchemised into something fierce and useful. The bust-up becomes a bonding story.', effect: { form: 0.1, attr: { teamwork: 2 }, meters: { peers: 12, fans: 8 } } },
          { id: 'professional', label: 'Keep it strictly professional', desc: 'No warmth, but no war — just do the job', outcome: 'Cold but competent, they get through it without a flashpoint. Not friends — but the manager’s faith isn’t betrayed.', effect: { form: 0.04, attr: { composure: 1 }, meters: { authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-homesick', title: 'A Long Way From Home', icon: '✈️', category: 'crisis',
    minTurn: 75, maxTurn: 175, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A new country, a language he can’t follow, an empty flat with the heating he can’t work out and a phone full of missed calls from home. The football is fine; it’s the eleven hundred other hours a week that ache. The loneliness starts to leak into his game.',
        choices: [
          { id: 'immerse', label: 'Throw himself in', desc: 'Learn the language, take the local lads up on dinner', outcome: 'He books lessons, stumbles through the small talk, lets a teammate drag him to a proper family Sunday. The city stops feeling foreign.', effect: { attr: { teamwork: 1 }, meters: { peers: 10, partner: 4 }, form: 0.05, tag: 'settled' }, next: 'window' },
          { id: 'family', label: 'Fly the family out', desc: 'Move the people he loves into his corner of the world', outcome: 'He gets them over, fills the silent flat with familiar noise, and suddenly there’s a reason to come home after training.', effect: { meters: { family: 12, partner: 8 }, form: 0.04, tag: 'anchored' }, next: 'window' },
          { id: 'withdraw', label: 'Retreat into himself', desc: 'Curtains drawn, video calls, counting down the days', outcome: 'He hides in his own homesickness, training then straight back to the sofa. The isolation feeds on itself.', effect: { form: -0.09, meters: { peers: -6, family: 5 }, tag: 'adrift' }, next: 'window' },
        ],
      },
      window: {
        id: 'window',
        prompt: 'January, and a club back home comes in — a way out, a soft landing, everyone he misses within an hour’s drive. But the manager here has built the team around him and begs him to stay. Head or heart?',
        choices: [
          { id: 'stay', label: 'Stay and conquer it', desc: 'Plant a flag — make this strange place his own', outcome: 'He turns the transfer down, doubles down on the life he’s building, and repays the faith with the best half-season of his career.', effect: { form: 0.11, attr: { composure: 2, leadership: 1 }, meters: { fans: 12, authority: 8 } } },
          { id: 'return', label: 'Go home', desc: 'Some things matter more than the adventure', outcome: 'He chooses the people over the project and heads back to familiar rain. Lighter in spirit, if the ambition stings a little.', effect: { form: 0.05, meters: { family: 14, partner: 10, fans: -4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-lost-armband', title: 'Stripped of the Stripes', icon: '🎗️', category: 'crisis',
    minTurn: 110, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A quiet word in the manager’s office, and the captaincy is gone — handed to a younger man the gaffer thinks better sets the tone. No scandal, no vote, just a decision that lands like a slap. The armband he wore with pride now sits on another arm.',
        choices: [
          { id: 'grace', label: 'Hand it over with grace', desc: 'Congratulate the new skipper, mean it, lead without the band', outcome: 'He’s first to shake the lad’s hand and tells the room he’ll captain from the ranks. The dignity of it earns more than the title ever did.', effect: { attr: { leadership: 2 }, meters: { peers: 10, authority: 8 }, tag: 'elder' }, next: 'test' },
          { id: 'sulk', label: 'Take it as a betrayal', desc: 'Let the wound show — this is disrespect, plain and simple', outcome: 'He can’t hide the hurt, snipes in team meetings, withdraws his voice. The group feels the leader they had curdle into a grievance.', effect: { form: -0.08, meters: { peers: -7, authority: -6 }, tag: 'bitter' }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'Two down at the break in a game they can’t lose, and the new captain is drowning — too young for this fire. Every head in the dressing room turns, out of habit, to him. The old authority is his to pick up, or let lie.',
        choices: [
          { id: 'rally', label: 'Rouse the room', desc: 'Band or no band, this is a job for the biggest voice', outcome: 'He’s up and roaring, organising, dragging them out for the second half by the scruff. They come back and win it — leadership needs no armband.', effect: { form: 0.12, attr: { leadership: 2, composure: 1 }, meters: { peers: 12, fans: 10, authority: 9 } } },
          { id: 'defer', label: 'Prop up the new skipper', desc: 'Whisper in his ear, let the kid wear the moment', outcome: 'He quietly feeds the young captain the words and lets him deliver them. The comeback is the lad’s — but everyone knows whose steel it was.', effect: { form: 0.07, attr: { leadership: 1, teamwork: 1 }, meters: { peers: 9, authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-rival-feud', title: 'Bad Blood', icon: '🔥', category: 'crisis',
    minTurn: 90, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: '{RIVAL} has been at it in the papers all week — questioning his bottle, mocking his medals, calling him a flat-track bully who goes missing in the big ones. The soundbites are everywhere. The whole country waits to see if he bites.',
        choices: [
          { id: 'warfront', label: 'Fire back in kind', desc: 'Give {RIVAL} both barrels — remind him of the score', outcome: 'He meets fire with fire in the press, a cold and quotable takedown that has the pundits gleeful. The feud goes nuclear.', effect: { attr: { aggression: 1 }, meters: { fans: 6, sponsors: -4 }, tag: 'at-war' }, next: 'derby' },
          { id: 'silence', label: 'Let the football answer', desc: 'Not a word — save every syllable for Saturday', outcome: 'He smiles, says nothing, dead-bats every question about {RIVAL}. The silence somehow says more than any headline could.', effect: { attr: { composure: 2 }, meters: { authority: 7 }, tag: 'ice-cold' }, next: 'derby' },
        ],
      },
      derby: {
        id: 'derby',
        prompt: 'The two of them on the same pitch at last, the ground a wall of noise, {RIVAL} snapping and chirping at his heels from the first whistle, trying to drag him into a red. The moment to settle it arrives on the ball.',
        choices: [
          { id: 'humiliate', label: 'Beat him with the ball', desc: 'Nutmeg, turn, and leave {RIVAL} for dead on the biggest stage', outcome: 'He slips {RIVAL} inside out, sets up the winner past his flailing lunge, and points once to the scoreboard. Answered — in full.', effect: { form: 0.13, attr: { flair: 1, creativity: 1 }, meters: { fans: 15, authority: 6 } } },
          { id: 'baited', label: 'Snap back at him', desc: 'Enough talk — settle it the old-fashioned way', outcome: 'He squares up, foreheads almost touching, and it takes four players to keep them apart. Cathartic — but it’s a fine and a caution he didn’t need.', effect: { form: -0.05, attr: { aggression: 2 }, meters: { fans: 4, authority: -5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-fans-turn', title: 'The Banner in the Kop', icon: '📢', category: 'crisis',
    minTurn: 100, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'His name rings round the ground on Saturday — not sung, but jeered — and unfurled over the stand behind the goal a banner reads that he doesn’t care, that he’s coasting on a fat contract. The boos follow his every touch. It cuts to the bone.',
        choices: [
          { id: 'badge', label: 'Kiss the badge and graft', desc: 'Wear the anger, chase every lost cause, win them back with sweat', outcome: 'He runs until his lungs burn, throws himself into tackles, and slaps the crest after a last-ditch block. A few boos soften into grudging cheers.', effect: { energy: -8, attr: { stamina: 1, aggression: 1 }, meters: { fans: 6, authority: 5 }, tag: 'fighting-back' }, next: 'reckoning' },
          { id: 'letter', label: 'Speak to the supporters directly', desc: 'An open letter — honest about the dip, no PR gloss', outcome: 'He writes to the fanzine in his own words, admits the form’s been unforgivable, promises they’ll see the real him. It disarms a lot of the anger.', effect: { attr: { composure: 1 }, meters: { fans: 8, sponsors: 3 }, tag: 'humble' }, next: 'reckoning' },
        ],
      },
      reckoning: {
        id: 'reckoning',
        prompt: 'Next home game, the same stand, the same watching eyes — and late on the ball sits up for him twenty-five yards out with the score level. Hit it well and the banner is forgotten; miss and it’s ammunition. He steadies.',
        choices: [
          { id: 'thunder', label: 'Let fly and answer them', desc: 'Everything he’s got, top corner, in front of that stand', outcome: 'It flies in off the far post and he sprints straight to the banner’s old spot, arms wide, the whole Kop roaring his name properly now.', effect: { form: 0.13, attr: { flair: 1, composure: 1 }, meters: { fans: 18, sponsors: 4 } } },
          { id: 'unselfish', label: 'Square it for a tap-in', desc: 'The team over the ego — roll it to the man free inside', outcome: 'He resists the glory-shot and slides in the open man. No highlight for him, but the point is won and the terrace notes the selflessness.', effect: { form: 0.07, attr: { teamwork: 2 }, meters: { fans: 10, peers: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-manager-sacking', title: 'Regime Change', icon: '⚡', category: 'crisis',
    minTurn: 95, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A bad run, a boardroom lunch, and the manager who signed him and believed in him is gone by Monday morning. The training ground is a rumour mill, the players rudderless, and nobody knows who the new man will rate. Chaos, and he’s in the eye of it.',
        choices: [
          { id: 'steady', label: 'Steady the dressing room', desc: 'Be the calm voice while the caretaker finds his feet', outcome: 'He gathers the younger lads, keeps standards high, refuses to let the place slide into a free-for-all. The caretaker leans on him hard.', effect: { attr: { leadership: 2, composure: 1 }, meters: { peers: 10, authority: 8 }, tag: 'steadying' }, next: 'newboss' },
          { id: 'agent', label: 'Get his agent working the phones', desc: 'Uncertainty cuts both ways — sound out an exit, just in case', outcome: 'He quietly has his agent test the water elsewhere, hedging against a new boss who might not fancy him. Prudent — if word ever leaks, it won’t look loyal.', effect: { meters: { agent: 8, authority: -4 }, tag: 'hedging' }, next: 'newboss' },
        ],
      },
      newboss: {
        id: 'newboss',
        prompt: 'The new manager sweeps in with his own ideas, his own favourites, and a first team-meeting stare that lingers on him a beat too long. This is the audition that decides the next three years. First impressions are everything.',
        choices: [
          { id: 'buyin', label: 'Buy into the new methods', desc: 'Learn the system inside out, be the manager’s man on the grass', outcome: 'He masters the new shape before anyone else, becomes the gaffer’s on-pitch translator, and nails down his place at the heart of it all.', effect: { form: 0.1, attr: { teamwork: 1, leadership: 1 }, meters: { authority: 10, fans: 6 } } },
          { id: 'prove', label: 'Let his performances do the talking', desc: 'No politics, no charm — just be undroppable', outcome: 'He says little and plays out of his skin, forcing his way into the plans on merit alone. The new boss can’t argue with the numbers.', effect: { form: 0.09, attr: { composure: 1, flair: 1 }, meters: { authority: 6, fans: 5 } } },
        ],
      },
    },
  },
];
