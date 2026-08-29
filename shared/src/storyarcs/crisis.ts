import type { StoryArc } from '../storyarc.js';

// CRISIS arcs — adversity storylines: injuries, slumps, fall-outs, scandals, pressure to overcome.
export const CRISIS_ARCS: StoryArc[] = [
  {
    id: 'injury-comeback', title: 'The Long Road Back', icon: '🩹', category: 'crisis',
    minTurn: 66, maxTurn: 107, weight: 2, first: 'open',
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
    minTurn: 60, maxTurn: 110, weight: 2, first: 'open',
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
    minTurn: 50, maxTurn: 113, weight: 3, first: 'open',
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
    minTurn: 47, maxTurn: 112, weight: 2, first: 'open',
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
    minTurn: 46, maxTurn: 111, weight: 2, first: 'open',
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
    minTurn: 66, maxTurn: 105, weight: 2, first: 'open',
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
    minTurn: 66, maxTurn: 113, weight: 2, first: 'open',
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
    minTurn: 54, maxTurn: 113, weight: 2, first: 'open',
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
    minTurn: 60, maxTurn: 113, weight: 2, first: 'open',
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
    minTurn: 57, maxTurn: 113, weight: 2, first: 'open',
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
  {
    id: 'crisis-penalty-miss', title: 'The Spot That Sank Him', icon: '🥅', category: 'crisis',
    minTurn: 54, maxTurn: 116, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cup semi, the shoot-out, and his was the one that mattered — skied over the bar into the away end, and the season died with it. The replay loops on every channel by breakfast, his face frozen mid-agony. Sleep won’t come, and the next penalty the team wins is coming whether he’s ready or not.',
        choices: [
          { id: 'own-it', label: 'Volunteer for the next one', desc: 'Get straight back on the horse — take the very next spot-kick', outcome: 'He tells the manager he wants the ball the instant they’re awarded a penalty, no hiding, no delay.', effect: { attr: { composure: 2 }, meters: { authority: 6 }, tag: 'facing-it' }, next: 'retake' },
          { id: 'rebuild', label: 'Drill it in private first', desc: 'Rebuild the technique in the dark, away from the cameras', outcome: 'He stays behind night after night, one keeper, one routine, hammering the doubt out of the run-up.', effect: { energy: -8, attr: { composure: 1, stamina: 1 }, tag: 'rebuilding' }, next: 'retake' },
          { id: 'avoid', label: 'Ask to be taken off the list', desc: 'Let someone else carry it while the wound is raw', outcome: 'He quietly hands the duty away, and the relief is real — but so is the whisper that he’s hiding.', effect: { form: -0.06, meters: { fans: -5, authority: -4 }, tag: 'shirking' }, next: 'retake' },
        ],
      },
      retake: {
        id: 'retake',
        prompt: 'Weeks on, a league game, a penalty, and the ground goes quiet in that knowing way — everyone remembering the miss but him. {RIVAL} loiters on the edge of the box with a smirk, muttering about the bar. The ball is on the spot. This is the ghost he has to bury.',
        choices: [
          { id: 'roof', label: 'Blast it and exorcise it', desc: 'Same corner, more conviction — right through the roof of the net', outcome: 'He batters it high and hard into the exact spot he missed, and wheels away howling at the sky. The ghost is dead.', effect: { form: 0.14, attr: { composure: 1, flair: 1 }, meters: { fans: 15, authority: 8 } } },
          { id: 'cool', label: 'Send the keeper the wrong way', desc: 'Ice in the veins — a slow, certain roll into the corner', outcome: 'He waits, waits, and rolls it the opposite way as the keeper dives. Cold, clinical, redemption without the drama.', effect: { form: 0.1, attr: { composure: 2 }, meters: { fans: 10 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-own-goal', title: 'Into His Own Net', icon: '🙈', category: 'crisis',
    minTurn: 50, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A routine cross, a stretch to clear, and the ball loops off his shin and nestles in his own top corner — the winner, for the other lot, in a game they had to win. The stand behind him falls silent, then turns. By full time his name is a punchline and the montage is already cut.',
        choices: [
          { id: 'shoulder', label: 'Carry it and demand the ball', desc: 'No hiding — get on it, drive the team, make amends this half', outcome: 'He refuses to shrink, calls for every pass, and drags the side up the pitch on his own shoulders looking for a way back in.', effect: { energy: -6, attr: { leadership: 1, composure: 1 }, meters: { peers: 7, authority: 5 }, tag: 'defiant-goat' }, next: 'redeem' },
          { id: 'crumble', label: 'Let it swallow him', desc: 'The head drops, the touch goes, the game passes him by', outcome: 'The error eats him alive; he plays the rest like a man in a fog, flinching at every ball that comes near.', effect: { form: -0.1, meters: { fans: -6, authority: -5 }, tag: 'haunted' }, next: 'redeem' },
        ],
      },
      redeem: {
        id: 'redeem',
        prompt: 'Injury time, still level in the return fixture, and a corner swings toward him at the right end this time — the very same leap, the very same ball, but a whole goal-mouth of redemption in front of him now. The stand holds its breath.',
        choices: [
          { id: 'header', label: 'Attack it like his life depends on it', desc: 'Rise higher than everyone and bury it — the right net this time', outcome: 'He climbs above the pack and thunders it in at the correct end, and the same crowd that jeered him roars his name to the rafters.', effect: { form: 0.13, attr: { aggression: 1, composure: 1 }, meters: { fans: 16, authority: 7 } } },
          { id: 'clear', label: 'Just get it clear and safe', desc: 'No heroics — head it away, protect the point, take no risks', outcome: 'He heads it to safety and settles for the draw, the error not erased but at least not doubled. A quiet, unglamorous peace.', effect: { form: 0.04, attr: { composure: 1 }, meters: { authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-contract-standoff', title: 'Down to the Wire', icon: '📝', category: 'crisis',
    minTurn: 90, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Eighteen months left and the talks have gone cold — the club’s offer an insult, his agent briefing the papers, the fans reading every leak as greed. What was a private negotiation is now a public standoff, and the away end has started singing that he’s only in it for the money.',
        choices: [
          { id: 'dignity', label: 'Rise above the leaks', desc: 'Refuse to negotiate through the media — let it play out quietly', outcome: 'He fronts the cameras and says only that he loves the club and the rest stays behind closed doors. It cools the temperature.', effect: { attr: { composure: 2 }, meters: { fans: 6, sponsors: 4 }, tag: 'above-it' }, next: 'deadline' },
          { id: 'leverage', label: 'Let the agent turn the screw', desc: 'Squeeze every ounce of leverage — deadline is deadline', outcome: 'He greenlights his agent to play hardball and court interest elsewhere, banking on his form to force the club’s hand.', effect: { greed: 6, meters: { agent: 9, fans: -6 }, tag: 'hardball' }, next: 'deadline' },
        ],
      },
      deadline: {
        id: 'deadline',
        prompt: 'The board finally blinks with a proper offer on the table — but there’s a suitor abroad dangling nearly double, and a manager here reminding him what he means to this place. The pen hovers. The decision defines the back half of his career.',
        choices: [
          { id: 'commit', label: 'Sign and become a lifer', desc: 'Put pen to paper, kiss the badge, end the noise for good', outcome: 'He commits his best years to the club, the standoff forgotten in a wave of goodwill, and plays like a man who belongs.', effect: { form: 0.1, attr: { leadership: 1 }, meters: { fans: 14, authority: 8 }, earnings: 6 } },
          { id: 'cashin', label: 'Chase the bigger deal', desc: 'Take the money and the new adventure — sentiment doesn’t pay', outcome: 'He runs down the offer and forces the move for the fortune abroad. The bank balance soars; a section of the terrace never forgives him.', effect: { earnings: 14, market: 4, greed: 6, meters: { fans: -10, agent: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-refusal-freeze', title: 'The Pen He Wouldn’t Lift', icon: '🧊', category: 'crisis',
    minTurn: 90, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'He said no to the extension — wanted to weigh his options — and the club’s answer is exile. Bombed out to train with the kids, locker moved, matchday tickets stopped. No injury, no fall in form, just a punishment for daring to keep his future open. The days stretch long and pointless.',
        choices: [
          { id: 'standards', label: 'Keep his standards immaculate', desc: 'Train like a first-teamer even among the youths — give them nothing', outcome: 'He’s the sharpest man on the reserve pitch by a mile, professional to the last cone, refusing to let the exile rot him.', effect: { energy: -6, attr: { stamina: 1, composure: 1 }, meters: { peers: 6, authority: 5 }, tag: 'unbroken' }, next: 'thaw' },
          { id: 'gowar', label: 'Go public on the freeze-out', desc: 'Blow the whistle — tell the world how a loyal servant is being treated', outcome: 'He gives a raw interview about the shabby treatment, and the fans’ sympathy swings his way even as the boardroom seethes.', effect: { meters: { fans: 8, authority: -5, agent: 5 }, tag: 'whistleblower' }, next: 'thaw' },
        ],
      },
      thaw: {
        id: 'thaw',
        prompt: 'A striker crisis and a run of defeats later, the manager swallows his pride and calls him back into the fold — the same man who banished him now needs him badly. He walks back into a dressing room that watched him get frozen out. How does he return?',
        choices: [
          { id: 'graft-back', label: 'Let his football do the talking', desc: 'Not a word about the exile — just be undroppable again', outcome: 'He slots back in and plays out of his skin, the freeze-out made to look like the mistake it always was. The point is made in goals.', effect: { form: 0.11, attr: { composure: 1, flair: 1 }, meters: { fans: 12, authority: 6 } } },
          { id: 'terms', label: 'Return only on his own terms', desc: 'Back in — but with guarantees, in writing, this time', outcome: 'He agrees to play but extracts assurances first, no longer the trusting soul who got burned. Colder, wiser, and impossible to bully.', effect: { form: 0.06, greed: 4, meters: { agent: 8, authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-gambling', title: 'The Number in His Pocket', icon: '🎰', category: 'crisis',
    minTurn: 47, maxTurn: 105, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The card school on the coach turned into an app on the phone turned into stakes that stopped being funny. A bad week, a chased loss, and suddenly the numbers on the screen are bigger than a fan earns in a year. The buzz of it is starting to feel like the only thing that quiets the noise.',
        choices: [
          { id: 'confess', label: 'Confess and get help', desc: 'Walk into the club welfare office and lay it all out', outcome: 'He tells the club welfare officer everything, hands his phone over, and lets the shame out into the open where it can be fought.', effect: { attr: { composure: 2 }, meters: { family: 6, authority: 4 }, tag: 'in-recovery' }, next: 'edge' },
          { id: 'hide-it', label: 'Bury it and grind it back', desc: 'Tell no one — win it back and no harm done', outcome: 'He keeps it secret and doubles the stakes to claw the losses back, the hole quietly deepening beneath the smiling front.', effect: { greed: 6, form: -0.06, meters: { partner: -6, family: -4 }, tag: 'chasing-losses' }, next: 'edge' },
        ],
      },
      edge: {
        id: 'edge',
        prompt: 'A shadowy contact makes the offer that every gambler in his hole eventually gets — clear the whole debt in one night, all he has to do is see a yellow card at a set minute in a nothing game. No one would ever know. The phone sits heavy in his hand.',
        choices: [
          { id: 'report', label: 'Report the approach at once', desc: 'Ring the integrity line before the sun comes up — no hesitation', outcome: 'He calls it in that night, names the contact, and refuses to let his weakness become a crime. The debt stays; his honour survives whole.', effect: { form: 0.08, attr: { leadership: 1, composure: 1 }, meters: { authority: 10, fans: 8 } } },
          { id: 'refuse-quiet', label: 'Refuse but stay silent', desc: 'Say no, block the number, tell nobody about any of it', outcome: 'He turns it down flat and blocks the man, but keeps it to himself, hoping the shadow never comes knocking twice.', effect: { attr: { composure: 1 }, greed: -2, meters: { family: 4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-burnout', title: 'Running on Empty', icon: '🕯️', category: 'crisis',
    minTurn: 66, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Sixty games in eleven months, three competitions, an international break he didn’t get to rest — and now the legs feel like they belong to someone else and the joy has quietly left the building. He can’t remember the last morning he wanted to train. The tank isn’t low. It’s dry.',
        choices: [
          { id: 'honesty', label: 'Tell the manager the truth', desc: 'Admit he’s cooked and ask to be managed, not flogged', outcome: 'He knocks on the office door and admits he’s empty, trusting the gaffer to rest him rather than punish the honesty.', effect: { energy: 10, attr: { composure: 1 }, meters: { authority: 5 }, tag: 'managed' }, next: 'crossroad' },
          { id: 'mask', label: 'Play through and mask it', desc: 'Say nothing, strap up, drag the carcass out there every week', outcome: 'He hides the exhaustion behind a professional’s mask and keeps starting, the reserves burning down to nothing.', effect: { energy: -12, form: -0.08, meters: { partner: -5 }, tag: 'burning-out' }, next: 'crossroad' },
        ],
      },
      crossroad: {
        id: 'crossroad',
        prompt: 'The body finally files its complaint — a twinge in the hamstring that the physios say is a warning shot, one hard sprint from a real tear. There’s a massive game at the weekend the club are desperate for him to start. The choice is his and the risk is his alone.',
        choices: [
          { id: 'rest', label: 'Sit it out and heal properly', desc: 'Pull himself from the big one — a career is longer than a match', outcome: 'He takes himself out of the firing line, watches from the stand, and comes back in a fortnight feeling human again. Wisdom over ego.', effect: { energy: 12, attr: { composure: 2 }, form: 0.05, meters: { family: 6 } } },
          { id: 'push', label: 'Strap it and start anyway', desc: 'The team needs him — one more big shift on fumes', outcome: 'He plays through the warning and the hamstring goes in the second half, a real tear that could have been avoided. The gamble bites.', effect: { injury: true, form: -0.1, energy: -10, meters: { fans: 6, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-leaked-message', title: 'Screenshot', icon: '📱', category: 'crisis',
    minTurn: 54, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A private message he fired off in temper — moaning about the manager’s tactics to a mate — is suddenly a screenshot on every football account with a hundred thousand shares. The words are unmistakably his, the context stripped away, and the dressing room is reading it over their cornflakes.',
        choices: [
          { id: 'own-words', label: 'Own the words to the manager first', desc: 'Straight to the gaffer’s office before the day’s training — face to face', outcome: 'He gets to the manager before anyone else can poison it, admits he sent it in a strop, and asks to clear the air man to man.', effect: { attr: { composure: 1, leadership: 1 }, meters: { authority: 6 }, tag: 'straight-up' }, next: 'fallout' },
          { id: 'deny', label: 'Claim it was doctored', desc: 'Deny, deny, deny — insist the screenshot is a fake', outcome: 'He puts out a statement calling it fabricated, gambling that no one can prove otherwise as the doubt curdles around him.', effect: { meters: { authority: -6, peers: -4 }, tag: 'denier' }, next: 'fallout' },
        ],
      },
      fallout: {
        id: 'fallout',
        prompt: 'The manager names him in the XI for the next game anyway — a public show of faith, or a test, nobody’s sure which. The cameras will be trained on his every gesture toward the bench, hunting for the next story. He knows exactly how this looks.',
        choices: [
          { id: 'perform', label: 'Repay the faith with a display', desc: 'Play his heart out and celebrate straight to the dugout', outcome: 'He runs himself into the turf, scores, and sprints to embrace the manager in front of the world. The story is dead by Monday.', effect: { form: 0.11, attr: { teamwork: 1, composure: 1 }, meters: { authority: 8, fans: 9 } } },
          { id: 'quiet', label: 'Keep his head down and grind', desc: 'No grand gestures — just an honest, quiet, undeniable shift', outcome: 'He lets the performance speak without theatrics, solid and selfless, and the noise slowly loses interest for lack of oxygen.', effect: { form: 0.06, attr: { teamwork: 1 }, meters: { peers: 6, authority: 4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-false-accusation', title: 'Clearing His Name', icon: '⚖️', category: 'crisis',
    minTurn: 57, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A story breaks accusing him of something he simply did not do — a night out, a stranger’s claim, a headline that skips the word "alleged". The club suspends him "pending", the sponsors go quiet, and a career built over years is on fire because of a lie he can’t un-print.',
        choices: [
          { id: 'lawyer-up', label: 'Fight it hard and legal', desc: 'Hand it to the lawyers, gather the proof, clear his name properly', outcome: 'He goes cold and methodical, lets his lawyers assemble the timestamps and the witnesses, and trusts the truth to hold.', effect: { attr: { composure: 2 }, meters: { agent: 8, family: 5 }, tag: 'lawyered' }, next: 'verdict' },
          { id: 'plead', label: 'Beg the public to believe him', desc: 'An emotional plea to camera — let them see the real man', outcome: 'He sits before the cameras, voice cracking, and swears his innocence to a watching nation. Some believe; some sharpen their knives.', effect: { form: -0.04, meters: { fans: 6, sponsors: -4 }, tag: 'pleaded' }, next: 'verdict' },
        ],
      },
      verdict: {
        id: 'verdict',
        prompt: 'The truth comes out — the claim collapses, no case to answer, fully cleared. But the weeks of poison left marks, and the first match back is at a hostile ground where the away end will test whether he came through it whole or hollow.',
        choices: [
          { id: 'rise', label: 'Channel it into a performance', desc: 'Take every ounce of the anger and pour it into the game', outcome: 'He plays like a man reborn, running the match, and points to the badge at the final whistle. Vindication, earned in full view.', effect: { form: 0.12, attr: { aggression: 1, composure: 1 }, meters: { fans: 12, authority: 7 } } },
          { id: 'weary', label: 'Just try to feel normal again', desc: 'No statement, no fireworks — simply be a footballer once more', outcome: 'He gets through the ninety quietly, more relieved than triumphant, and lets the ordinary rhythm of the game start to heal him.', effect: { form: 0.05, attr: { composure: 2 }, meters: { family: 8, partner: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-yips', title: 'The Simple Pass', icon: '🌀', category: 'crisis',
    minTurn: 60, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It started with one overhit ten-yard ball and it has burrowed into his head. Now the easy pass is the terror — the short square one, the roll to the keeper — and his brain seizes at the very moment his body should be automatic. He can strike a forty-yard diagonal fine. It’s the simple thing he can no longer do.',
        choices: [
          { id: 'science', label: 'Trust a specialist to rewire it', desc: 'Work with a performance psychologist on the mental block', outcome: 'He commits to weeks of sports-psychology drills, retraining the brain to stop watching the hands and let the body take over.', effect: { attr: { composure: 2 }, meters: { authority: 4 }, tag: 'rewiring' }, next: 'test' },
          { id: 'brute', label: 'Play his way out of it', desc: 'Demand the ball more, not less — drown the fear in repetition', outcome: 'He insists on being the outlet, taking possession under pressure again and again, gambling that volume beats the yips.', effect: { energy: -6, form: -0.05, attr: { aggression: 1 }, tag: 'brute-forcing' }, next: 'test' },
        ],
      },
      test: {
        id: 'test',
        prompt: 'Last minute, protecting a one-goal lead, and the ball comes to him deep in his own half with an option screaming for the simple pass out. The whole ground can see it. His mind offers up the old cold flicker of doubt. Everything he’s worked on is in this single touch.',
        choices: [
          { id: 'trust', label: 'Play the simple ball with conviction', desc: 'No overthinking — just roll it, exactly as he’s practised', outcome: 'He plays it clean and crisp to feet without a flicker, the yips broken by a pass no one else would notice. He nearly weeps at how ordinary it felt.', effect: { form: 0.1, attr: { composure: 2 }, meters: { authority: 7, peers: 6 } } },
          { id: 'safe', label: 'Just hoof it clear', desc: 'Take no chances — belt it into row Z and live to fight on', outcome: 'He hammers it into the stand rather than risk the pass, the lead protected but the demon still crouched inside him for another day.', effect: { form: 0.02, attr: { aggression: 1 }, meters: { fans: 3 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-horror-tackle', title: 'The Tackle He Regrets', icon: '💥', category: 'crisis',
    minTurn: 50, maxTurn: 110, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'One late lunge, over the top, and an opponent is carried off with a leg that bends the wrong way — a young player whose season, maybe more, ends under his studs. He didn’t mean it. It doesn’t matter. The stretcher, the silence, the hush in his own gut tell him this one will live with him.',
        choices: [
          { id: 'hospital', label: 'Go to the hospital that night', desc: 'Face the lad and his family — apologise in person, no cameras', outcome: 'He drives to the ward after the game, stands at the bedside, and apologises to the boy and his shattered parents face to face.', effect: { attr: { composure: 1, teamwork: 1 }, meters: { peers: 8, fans: 6 }, tag: 'remorseful' }, next: 'return' },
          { id: 'defend', label: 'Insist it was mistimed, not malicious', desc: 'Protect himself — a bad tackle, yes, but no ill intent', outcome: 'He stands by the honest-mistake line to every microphone, refusing the villain’s role, and the debate rages without warmth.', effect: { attr: { aggression: 1 }, meters: { fans: -5, authority: -3 }, tag: 'defensive' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'Suspension served, he steps back onto the pitch a marked man — the away end chanting his name as a curse, and in the very first minute a fifty-fifty comes screaming toward him. Pull out and he’s soft; go in and he’s that man again. His whole game hangs on the answer.',
        choices: [
          { id: 'clean', label: 'Win it hard but fair', desc: 'Commit fully, but clean — show he can still tackle without the red mist', outcome: 'He goes in strong and takes the ball flush, no follow-through, and rises to help the man up. The jeers can’t argue with clean.', effect: { form: 0.09, attr: { aggression: 1, composure: 1 }, meters: { fans: 8, authority: 6 } } },
          { id: 'shy', label: 'Hold back and play it safe', desc: 'Pull out of the challenge — no more carnage on his conscience', outcome: 'He eases out of the tackle, unwilling to risk it, and a little of the ferocity that defined him quietly drains away for good.', effect: { form: -0.03, attr: { composure: 1 }, meters: { fans: 4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-new-league', title: 'Lost in Translation', icon: '🧭', category: 'crisis',
    minTurn: 50, maxTurn: 107, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Big move, big fee, big expectations — and on the pitch nothing clicks. The league is quicker in some ways and slower in others, the runs he makes go unseen, the ball arrives a half-beat wrong, and a style that made him a star at home looks lost and ordinary abroad. The word "flop" is starting to appear in the local press.',
        choices: [
          { id: 'adapt', label: 'Rip up his game and rebuild it', desc: 'Study the tape, remould his movement to fit the new football', outcome: 'He spends hours with the analysts, humbly relearning where to run and when, willing to become a different player to survive.', effect: { energy: -6, attr: { creativity: 1, teamwork: 1 }, meters: { authority: 5 }, tag: 'adapting' }, next: 'moment' },
          { id: 'impose', label: 'Force them to adapt to him', desc: 'Back his own quality — make the team play his way', outcome: 'He refuses to dilute himself, demanding the ball on his terms and betting that class is class in any country.', effect: { form: -0.04, attr: { flair: 1 }, meters: { peers: -3, authority: 3 }, tag: 'stubborn' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'A televised game, the doubters watching, and the ball breaks to him in the space he’s finally learned to find, one moment to announce that the fee wasn’t madness after all. The new crowd, still unsure of him, leans in. This is where the move turns.',
        choices: [
          { id: 'define', label: 'Produce a moment of magic', desc: 'A piece of brilliance that says he belongs here after all', outcome: 'He conjures something out of nothing, a goal that silences the doubt, and the fickle new crowd finally rises to him as one.', effect: { form: 0.12, attr: { flair: 1, creativity: 1 }, market: 3, meters: { fans: 14 } } },
          { id: 'graft', label: 'Do the unglamorous things well', desc: 'No highlight — just the honest, effective work that wins trust', outcome: 'He puts in a shift of clever selfless running that only the coaches truly value, and quietly turns the corner without fanfare.', effect: { form: 0.07, attr: { teamwork: 2 }, meters: { authority: 6, peers: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-mentee-usurps', title: 'The Boy He Taught', icon: '🐣', category: 'crisis',
    minTurn: 78, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The kid he took under his wing — showed the ropes, drove to training, taught the movement that made him — has been picked ahead of him. His own protégé, in his shirt, in his position, on merit. The manager is kind about it. It doesn’t make the bench any warmer, or the pride any less bruised.',
        choices: [
          { id: 'mentor-on', label: 'Keep mentoring him anyway', desc: 'Swallow the ego — help the lad thrive in the role he took', outcome: 'He keeps whispering the tips and holding the standards, coaching from the shadows the boy who displaced him. Selfless, and it costs him.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 10, authority: 6 }, tag: 'grace-in-decline' }, next: 'twilight' },
          { id: 'reignite', label: 'Use it as fuel to win the shirt back', desc: 'No charity — outwork the kid and take the place back', outcome: 'He turns the hurt into fire, trains like a rookie again, and sets out to prove he isn’t finished by beating his own pupil to the shirt.', effect: { energy: -8, attr: { stamina: 1, aggression: 1 }, meters: { authority: 4 }, tag: 'raging-back' }, next: 'twilight' },
        ],
      },
      twilight: {
        id: 'twilight',
        prompt: 'A cup final, the two of them, and late in the game the manager can keep one on the pitch — the veteran or the kid — for the decisive last ten minutes. The gaffer looks along the bench and, unexpectedly, meets the older man’s eye. It’s his call as much as anyone’s.',
        choices: [
          { id: 'take-stage', label: 'Take the moment for himself', desc: 'One last time — this stage was made for him, not the boy', outcome: 'He goes on and grabs the game by the throat, a masterclass of experience that wins the cup. The old dog’s finest hour, unbowed.', effect: { form: 0.12, attr: { composure: 2, leadership: 1 }, meters: { fans: 13, authority: 8 } } },
          { id: 'pass-torch', label: 'Send the kid out instead', desc: 'Nod toward the boy — the future is his, and he’s ready', outcome: 'He tells the manager to send the lad, and watches his protégé win it, feeling a father’s pride heavier and finer than any medal.', effect: { form: 0.05, attr: { leadership: 2, teamwork: 1 }, meters: { peers: 12, family: 6, fans: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-legend-feud', title: 'Words With a Legend', icon: '🎙️', category: 'crisis',
    minTurn: 60, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A club icon turned pundit — a man whose name is on a stand at this very ground — has spent all season taking him apart on television: not good enough, doesn’t care, an insult to the shirt he once wore. The old hero’s word is gospel to the fans, and the criticism is landing where it hurts most.',
        choices: [
          { id: 'respect', label: 'Answer with respect, not war', desc: 'Acknowledge the legend, disagree with the man, keep it classy', outcome: 'He speaks warmly of what the icon gave the club before politely, firmly rejecting the verdict on him. Grown-up, and it plays well.', effect: { attr: { composure: 2 }, meters: { fans: 6, authority: 5 }, tag: 'dignified' }, next: 'showdown' },
          { id: 'clapback', label: 'Remind him whose team it is now', desc: 'Fire back — the legend’s day is done, this era is his', outcome: 'He hits back sharply that the great man should watch instead of whine, and a generational war erupts across the airwaves.', effect: { attr: { aggression: 1 }, meters: { fans: 4, sponsors: -4 }, tag: 'at-war-legend' }, next: 'showdown' },
        ],
      },
      showdown: {
        id: 'showdown',
        prompt: 'The legend is doing co-commentary on his next home game, microphone hot, ready to narrate any failure to the nation. The stadium hums with the subplot. A moment arrives, on the ball, right under the gantry where the old hero sits watching.',
        choices: [
          { id: 'silence-him', label: 'Deliver the performance of the season', desc: 'Force the legend to praise him through gritted teeth, live on air', outcome: 'He tears the game apart under the great man’s nose until even the icon has to concede it on air. The verdict overturned in ninety minutes.', effect: { form: 0.13, attr: { flair: 1, composure: 1 }, meters: { fans: 15, authority: 7 } } },
          { id: 'humble', label: 'Win, then seek the legend out', desc: 'Play well, then shake the old hero’s hand afterwards', outcome: 'He does the business then climbs to the gantry to shake hands, disarming the feud with grace the old man can’t rebuff. Bridges, not bombs.', effect: { form: 0.08, attr: { leadership: 1, composure: 1 }, meters: { fans: 10, sponsors: 4 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-wage-cut', title: 'The Ultimatum', icon: '✂️', category: 'crisis',
    minTurn: 63, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The club is bleeding money — a relegation, a lawsuit, a stadium half-built — and the letter lands on every senior player’s desk: take a deep wage cut, or be sold to balance the books. He’s a top earner and a leader, and the whole squad is watching to see which way he jumps before they decide their own answer.',
        choices: [
          { id: 'sacrifice', label: 'Take the cut and rally the squad', desc: 'Lead from the front — sign the reduction, keep the club alive', outcome: 'He’s first to sign away a chunk of his wages and stands up in the meeting to ask the others to follow. The club steadies; the debt of gratitude is his.', effect: { earnings: -8, attr: { leadership: 2 }, meters: { fans: 12, authority: 9, peers: 8 }, tag: 'sacrificed' }, next: 'aftermath' },
          { id: 'refuse', label: 'Refuse to subsidise the board’s mess', desc: 'It’s not the players’ job to pay for boardroom failure', outcome: 'He declines to take the hit, arguing the mismanagement wasn’t his, and holds his contract to the letter. Principled to some, greedy to others.', effect: { greed: 5, meters: { fans: -8, authority: -4, agent: 6 }, tag: 'held-firm' }, next: 'aftermath' },
        ],
      },
      aftermath: {
        id: 'aftermath',
        prompt: 'The dust settles and the club scrapes through, but the choice left a mark on how the room sees him. A relegation six-pointer arrives with everything raw and exposed, and the manager hands him the armband for the day — a chance to define what kind of leader the crisis revealed.',
        choices: [
          { id: 'lead-out', label: 'Drag the club to safety himself', desc: 'A captain’s performance when it matters most', outcome: 'He plays like a man possessed, scores the winner that all but secures survival, and the whole crisis becomes the making of his legend here.', effect: { form: 0.13, attr: { leadership: 2, composure: 1 }, meters: { fans: 14, authority: 8 } } },
          { id: 'quiet-pro', label: 'Just be reliable and unshowy', desc: 'No captain’s heroics — simply do the job cleanly and well', outcome: 'He turns in a calm, disciplined shift and sees the game out without drama, earning the point that quietly matters more than glory.', effect: { form: 0.07, attr: { composure: 2, teamwork: 1 }, meters: { authority: 5, peers: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-scapegoat', title: 'The Face of the Defeat', icon: '📰', category: 'crisis',
    minTurn: 57, maxTurn: 116, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A humiliation on the big stage — thrashed, embarrassed, dumped out — and by Sunday the press have chosen their villain, and it’s him. His face on every back page under a one-word headline, his every mistake looped, eleven men’s failure pinned on one pair of shoulders. It isn’t fair. It rarely is.',
        choices: [
          { id: 'take-heat', label: 'Take the bullets for the team', desc: 'Front the media, shield the youngsters, absorb the blame', outcome: 'He stands in the mixed zone and takes every question, refusing to point at anyone else, letting the storm break over him alone.', effect: { attr: { leadership: 2, composure: 1 }, meters: { peers: 10, authority: 6 }, tag: 'shield' }, next: 'response' },
          { id: 'point-out', label: 'Push back at the unfair framing', desc: 'Refuse the scapegoat’s crown — it was a collective collapse', outcome: 'He calmly lays out that the collapse was collective and the narrative is lazy, correcting the record even as it makes him a bigger target.', effect: { attr: { composure: 1 }, meters: { fans: 5, sponsors: -3 }, tag: 'pushed-back' }, next: 'response' },
        ],
      },
      response: {
        id: 'response',
        prompt: 'The next match comes fast, the same reporters in the stand with their knives sharpened, {RIVAL} quoted in the build-up saying he "wouldn’t be surprised if he bottled it again". The whole thing is a referendum on whether the scapegoat can carry the weight or buckle under it.',
        choices: [
          { id: 'silence-critics', label: 'Produce a man-of-the-match display', desc: 'Bury the narrative under ninety minutes of brilliance', outcome: 'He is imperious from the first whistle, dragging the team to a statement win, and the same pens that buried him scramble to praise him.', effect: { form: 0.13, attr: { flair: 1, composure: 1 }, meters: { fans: 13, authority: 8 } } },
          { id: 'steady', label: 'Just be dependable and unbreakable', desc: 'No fireworks — a solid, error-free, quietly defiant shift', outcome: 'He puts in a flawless, undramatic performance that gives the critics nothing to feed on, and lets the story starve for want of a mistake.', effect: { form: 0.07, attr: { composure: 2, teamwork: 1 }, meters: { authority: 6, peers: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-chronic-injury', title: 'The Body That Won’t Hold', icon: '🦴', category: 'crisis',
    minTurn: 72, maxTurn: 119, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'It has gone again — the same joint, the third time in two seasons, the scan showing wear where there should be cartilage. The specialist doesn’t use the word retirement, but it hangs in the room like smoke. Every sprint from here is a negotiation with a body that keeps handing in its notice.',
        choices: [
          { id: 'specialist', label: 'Chase a radical fix abroad', desc: 'See the surgeon everyone whispers about, whatever it costs', outcome: 'He flies out to the clinic that patched up half a generation of broken athletes, and bets his savings on a scalpel and a second chance.', effect: { earnings: -6, energy: -8, attr: { composure: 1 }, tag: 'patched-up' }, next: 'verdict' },
          { id: 'remould', label: 'Rebuild his game around the fragility', desc: 'Less running, more brain — reinvent himself to survive', outcome: 'He accepts the joint will never be whole and remoulds his whole game to spare it, trading yards for cunning and position.', effect: { attr: { creativity: 2, composure: 1 }, meters: { authority: 4 }, tag: 'reinvented' }, next: 'verdict' },
        ],
      },
      verdict: {
        id: 'verdict',
        prompt: 'A huge game, and by the hour mark the old ache is screaming its familiar warning — one more explosive turn and it could be the tear that finishes him for good. The bench is glancing over. Nobody can make this call but him, and the rest of a career rides on it.',
        choices: [
          { id: 'protect', label: 'Signal to come off and live to fight on', desc: 'A career is longer than a fixture — protect what’s left', outcome: 'He raises his hand and walks off on his own two feet, unbeaten by the day, refusing to gamble the years he has left on ninety minutes.', effect: { attr: { composure: 2 }, form: 0.04, meters: { family: 8, authority: 5 } } },
          { id: 'defy', label: 'Push through for one last surge', desc: 'The team needs him now — the body can complain later', outcome: 'He drives on through the warning and drags the side over the line, but the joint pays the bill and the fragility deepens for good.', effect: { injury: true, form: -0.06, attr: { aggression: 1 }, meters: { fans: 10, authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-referee-war', title: 'A Word Too Many', icon: '🗣️', category: 'crisis',
    minTurn: 50, maxTurn: 113, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A decision goes against him and he loses it — nose to nose with the referee, a finger jabbed, a mouthful the lip-readers gleefully translate for the nation. It’s a two-game ban for dissent and a misconduct charge, and overnight the pundits have rebranded him a serial moaner who can’t take a call.',
        choices: [
          { id: 'apologise', label: 'Apologise to the official personally', desc: 'A private letter to the ref, no cameras, no spin', outcome: 'He writes to the referee and the referees’ body admitting he crossed the line, owning it where no one can see him grandstand.', effect: { attr: { composure: 2 }, meters: { authority: 7, fans: 4 }, tag: 'contrite-ref' }, next: 'return' },
          { id: 'crusade', label: 'Turn it into a crusade on standards', desc: 'Argue the officiating is the real scandal here', outcome: 'He doubles down that the refereeing has been a disgrace all season, and a section of the game cheers while the authorities bristle.', effect: { attr: { aggression: 1 }, meters: { fans: 6, authority: -6 }, tag: 'ref-crusader' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'Ban served, first match back, and inside ten minutes a stonewall penalty is waved away right in front of him with {RIVAL} sniggering nearby. The referee is already glancing over, half-expecting the eruption. Every camera in the ground is trained on his face, waiting.',
        choices: [
          { id: 'bite-tongue', label: 'Swallow it and jog away', desc: 'Not a flicker — deny them the reaction entirely', outcome: 'He turns his back without a word and simply gets on with the game, and the maturity of it silences every waiting critic.', effect: { form: 0.09, attr: { composure: 2 }, meters: { authority: 8, fans: 8 } } },
          { id: 'answer-goal', label: 'Answer the injustice with a goal', desc: 'Let the football, not the mouth, do the arguing', outcome: 'He channels the fury into the next attack and buries it, wheeling away with a finger to his lips — the perfect, wordless riposte.', effect: { form: 0.11, attr: { flair: 1, composure: 1 }, meters: { fans: 12, authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-drink-spiral', title: 'Last Orders', icon: '🍺', category: 'crisis',
    minTurn: 47, maxTurn: 107, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The odd unwind after a win became a Wednesday, then a habit, then a grainy phone clip of him being poured out of a bar at four in the morning midweek. The manager has seen it. The physios have seen the numbers. What used to steady the nerves is starting to run the show.',
        choices: [
          { id: 'dry-out', label: 'Go dry and front it with the club', desc: 'Admit it’s a problem, get the welfare team involved', outcome: 'He walks into the club doctor’s office, admits the drink has hold of him, and signs up for the hard, unglamorous work of stopping.', effect: { attr: { composure: 2 }, energy: 6, meters: { family: 8, partner: 6 }, tag: 'on-the-wagon' }, next: 'crossroads' },
          { id: 'deny-drink', label: 'Insist it’s just letting off steam', desc: 'Everyone has a night out — this is overblown nonsense', outcome: 'He waves it away as harmless high spirits and carries on as before, the mask of a man in control slipping a little further each week.', effect: { energy: -8, form: -0.07, meters: { partner: -6, authority: -5 }, tag: 'in-denial' }, next: 'crossroads' },
        ],
      },
      crossroads: {
        id: 'crossroads',
        prompt: 'The night before the biggest game of the season, the old crew are texting about a session, the pull of it as strong as it has ever been. His whole reputation — and maybe his place at the club — turns on which door he walks through tonight.',
        choices: [
          { id: 'stay-in', label: 'Turn the phone off and prepare right', desc: 'Early night, clear head — be the professional he can be', outcome: 'He silences the phone, sleeps like a pro, and tears into the match fresh, proving the man who wants it more than the drink is still in there.', effect: { form: 0.11, attr: { composure: 1, stamina: 1 }, meters: { authority: 8, family: 6 } } },
          { id: 'relapse', label: 'Tell himself one won’t hurt', desc: 'Just a couple, just to take the edge off — he can handle it', outcome: 'One becomes six and he plays the biggest game half a yard slow and grey-faced, the whole ground able to see something is badly wrong.', effect: { form: -0.12, energy: -10, meters: { fans: -8, authority: -6, partner: -5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-family-illness', title: 'The Call at Half-Time', icon: '🏥', category: 'crisis',
    minTurn: 54, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A parent is gravely ill back home, the prognosis frightening, and suddenly the game he has given his life to feels very small. His head is in a hospital ward while his body goes through the motions on the training pitch. The manager notices the light has gone out of him.',
        choices: [
          { id: 'compartment', label: 'Keep playing and dedicate it to them', desc: 'Football as the one place the fear can’t follow — for now', outcome: 'He chooses to keep playing, telling the gaffer the pitch is the only ninety minutes the dread lets him go, and vows every game is for the ward.', effect: { attr: { composure: 1 }, meters: { family: 8, authority: 4 }, tag: 'carrying-it' }, next: 'return' },
          { id: 'leave', label: 'Take compassionate leave to be there', desc: 'Some things are bigger than any team — go home', outcome: 'He asks for time away and drives to the bedside, choosing the people over the plan and trusting the club to understand.', effect: { form: -0.05, meters: { family: 14, partner: 8, authority: 3 }, tag: 'went-home' }, next: 'return' },
        ],
      },
      return: {
        id: 'return',
        prompt: 'The worst has passed — a fragile recovery, a corner turned — and he comes back to a full house that somehow knows what he has been through. The first game feels heavy with everything unsaid. He wants to give the people he loves something to smile about from a hospital chair.',
        choices: [
          { id: 'pour-in', label: 'Pour every ounce of it into the game', desc: 'Let the love and the fear come out through the football', outcome: 'He plays with tears close and a heart wide open, scores, and points both hands to the sky in a moment the whole ground feels in its chest.', effect: { form: 0.12, attr: { leadership: 1, composure: 1 }, meters: { family: 10, fans: 12 } } },
          { id: 'gentle', label: 'Just get through it and be grateful', desc: 'No grand statement — simply be present and whole again', outcome: 'He asks nothing spectacular of himself, just steadies through the ninety, grateful to be a footballer with a family still intact.', effect: { form: 0.05, attr: { composure: 2 }, meters: { family: 12, partner: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-final-blunder', title: 'The Final He Threw Away', icon: '🏆', category: 'crisis',
    minTurn: 60, maxTurn: 118, weight: 3, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The biggest day of the season, the cup final, level and heading for extra time — and his loose touch on the edge of his own box is pounced on and lashed into the corner for the winner. His mistake, his trophy handed over, in front of ninety thousand and a global audience. The medal they hang on him is the wrong colour and it burns.',
        choices: [
          { id: 'front-up', label: 'Front the cameras and take it all', desc: 'Stand in the mixed zone and own the defeat entirely', outcome: 'He refuses to slip out the back, stands before the world red-eyed, and takes the blame squarely so no teammate has to.', effect: { attr: { leadership: 2, composure: 1 }, meters: { peers: 10, fans: 6 }, tag: 'owned-final' }, next: 'redemption' },
          { id: 'shatter', label: 'Let it break something in him', desc: 'Slip away, phone off, the error playing on a loop', outcome: 'He hides from everyone for days, the moment replaying behind his eyes every time he closes them, the doubt sinking deep roots.', effect: { form: -0.1, meters: { fans: -4, partner: -5 }, tag: 'final-scarred' }, next: 'redemption' },
        ],
      },
      redemption: {
        id: 'redemption',
        prompt: 'A year of carrying it, and the draw is cruel and kind at once — the same competition, another final, the ghost of last time standing on the touchline in a suit. Late, tied, the ball drops to him in a near-identical spot. The whole story loops back to this single decision.',
        choices: [
          { id: 'exorcise', label: 'Trust himself and settle it for good', desc: 'This time the touch is sure — write the ending himself', outcome: 'He kills it dead, drives forward, and buries the winner in the exact competition that broke him, roaring a year of pain out of his lungs.', effect: { form: 0.14, attr: { composure: 2, flair: 1 }, meters: { fans: 16, authority: 9 } } },
          { id: 'safe-final', label: 'Do the simple, safe thing this time', desc: 'No repeat of the flourish that cost him — clear it, no risk', outcome: 'He takes no chances, hammers it to safety, and lets others chase glory while he simply makes sure the nightmare never repeats.', effect: { form: 0.06, attr: { composure: 2 }, meters: { authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-doping-scare', title: 'The Sample', icon: '🧪', category: 'crisis',
    minTurn: 57, maxTurn: 114, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A routine test comes back positive for a substance he has never knowingly touched, and the machine does not care about his innocence. A provisional suspension, "DRUG CHEAT" across the back pages, sponsors freezing his deals overnight — a clean career poisoned by a word that sticks whatever the truth turns out to be.',
        choices: [
          { id: 'trace', label: 'Hunt down the contaminated source', desc: 'Test every supplement, build the scientific case coldly', outcome: 'He and his team tear apart every tub and sachet he has swallowed, chasing the tainted batch that can prove he was never a cheat.', effect: { attr: { composure: 2 }, meters: { agent: 8, sponsors: -4 }, tag: 'tracing-it' }, next: 'cleared' },
          { id: 'plead-innocence', label: 'Beg the public to believe him', desc: 'An emotional appeal — swear he’d never dope, ever', outcome: 'He goes on camera swearing on everything he loves that he would never cheat, and the nation splits between belief and suspicion.', effect: { form: -0.05, meters: { fans: 6, sponsors: -5 }, tag: 'protesting' }, next: 'cleared' },
        ],
      },
      cleared: {
        id: 'cleared',
        prompt: 'The lab traces it to a contaminated supplement and the ban is lifted — fully, formally exonerated. But months of "no smoke without fire" left a stain, and the first away trip greets him with a chant calling him a cheat regardless of what any tribunal found.',
        choices: [
          { id: 'burn-it', label: 'Answer the slur with a masterclass', desc: 'Take the anger of the injustice and win the game single-handed', outcome: 'He plays with a cold fire all afternoon, runs the show, and stares down the away end that branded him, the record set straight in studs.', effect: { form: 0.12, attr: { aggression: 1, composure: 1 }, meters: { fans: 11, authority: 7 } } },
          { id: 'rebuild-quiet', label: 'Quietly rebuild what was taken', desc: 'No revenge mission — just clean, honest football again', outcome: 'He lets the chants wash over him and simply gets back to playing, trusting time and clean displays to scrub away the stain.', effect: { form: 0.06, attr: { composure: 2 }, meters: { sponsors: 5, family: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-dressing-mutiny', title: 'The Revolt', icon: '🪧', category: 'crisis',
    minTurn: 63, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The senior players have had enough of the manager — the methods, the mind games, the freezing out of favourites — and they want to march to the board as one and demand his head. As one of the biggest voices in the room, they need his name on the revolt to give it weight. All eyes turn to him.',
        choices: [
          { id: 'loyal', label: 'Refuse to join and back the boss', desc: 'Mutiny isn’t leadership — tell them to look in the mirror', outcome: 'He declines to sign up, tells the ringleaders the answer is on the training pitch not in the boardroom, and stands alone against the tide.', effect: { attr: { leadership: 2, composure: 1 }, meters: { authority: 8, peers: -5 }, tag: 'stood-by-boss' }, next: 'aftermath' },
          { id: 'join-revolt', label: 'Lead the delegation to the board', desc: 'The room has spoken — better to lead it than let it fester', outcome: 'He puts himself at the head of the group and lays the players’ case before the directors, staking his standing on a coup.', effect: { attr: { leadership: 1, aggression: 1 }, meters: { peers: 9, authority: -6 }, tag: 'ringleader' }, next: 'aftermath' },
        ],
      },
      aftermath: {
        id: 'aftermath',
        prompt: 'The board backs the manager and the revolt collapses, leaving a fractured squad, a wounded gaffer, and a dressing room that knows exactly who stood where. The next match is a mess waiting to happen, and how he carries himself now will decide whether the group heals or rots.',
        choices: [
          { id: 'unify', label: 'Drag the fractured room back together', desc: 'Whatever side he took, now be the glue that mends it', outcome: 'He calls a players-only meeting, buries the grievances, and demands they play for each other, forcing unity out of the wreckage.', effect: { form: 0.1, attr: { leadership: 2, teamwork: 1 }, meters: { peers: 10, authority: 7 } } },
          { id: 'coast-out', label: 'Keep his head down and ride it out', desc: 'Say nothing, do his job, let the poison dilute itself', outcome: 'He avoids the politics entirely and just plays, letting the fault lines slowly close over on their own without his fingerprints.', effect: { form: 0.04, attr: { composure: 1 }, meters: { authority: 3 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-keeper-howler', title: 'The Ball Through His Hands', icon: '🧤', category: 'crisis',
    minTurn: 57, maxTurn: 117, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A tame shot, a routine gather, and somehow it squirms through his gloves and trickles over the line — the goal that loses the final, the softest, most humiliating error a keeper can make, on the one day the world is watching. The montage of it will outlive everything else he ever did between the sticks.',
        choices: [
          { id: 'stay-big', label: 'Stand tall and demand the next one', desc: 'A keeper lives with mistakes — get straight back up big and loud', outcome: 'He refuses to shrink into his six-yard box, barking orders louder than ever, determined the next cross will find him certain and commanding.', effect: { attr: { keeping: 1, leadership: 1, composure: 1 }, meters: { peers: 7, authority: 5 }, tag: 'unshaken-keeper' }, next: 'shootout' },
          { id: 'flinch', label: 'Let the doubt into his gloves', desc: 'The hands start to shake, every catch suddenly a threat', outcome: 'The error crawls inside his head; he starts punching what he should catch and flapping at what he should claim, the trust draining away.', effect: { form: -0.1, attr: { keeping: -1 }, meters: { fans: -6 }, tag: 'shaken-keeper' }, next: 'shootout' },
        ],
      },
      shootout: {
        id: 'shootout',
        prompt: 'Weeks on, another knockout tie, and it goes all the way to penalties — the exact stage where a keeper becomes hero or ghost. He stands on his line, the howler still fresh in every mind in the ground, {RIVAL} stepping up first with a smirk that says he remembers.',
        choices: [
          { id: 'hero-save', label: 'Own the spotlight and save the day', desc: 'Read it, spring, and turn the villain’s tale on its head', outcome: 'He guesses right, flies, and claws {RIVAL}’s penalty out of the top corner, then keeps out another — the goat reborn as the hero.', effect: { form: 0.13, attr: { keeping: 2, composure: 1 }, meters: { fans: 15, authority: 8 } } },
          { id: 'solid-keeper', label: 'Just be steady and let the takers miss', desc: 'No showboating — sound positioning, force the error', outcome: 'He makes himself big and calm, saves nothing spectacular but rattles the takers into missing, and comes through it quietly redeemed.', effect: { form: 0.08, attr: { keeping: 1, composure: 2 }, meters: { authority: 6 } } },
        ],
      },
    },
  },
  {
    id: 'crisis-fan-tragedy', title: 'A Minute’s Silence', icon: '🕊️', category: 'crisis',
    minTurn: 54, maxTurn: 116, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A coachload of supporters never made it to the away game — a crash on the motorway, families of the club shattered in an instant. The result feels obscene to even think about. The whole city is in mourning, and the players are asked to carry a grief far heavier than any relegation battle onto the pitch.',
        choices: [
          { id: 'lead-tribute', label: 'Lead the club’s tributes with dignity', desc: 'Speak for the squad, visit the families, wear the grief right', outcome: 'He becomes the voice of the dressing room, lays a wreath at the gates, and sits with the bereaved, carrying the club’s sorrow with real grace.', effect: { attr: { leadership: 2, composure: 1 }, meters: { fans: 10, authority: 6 }, tag: 'mourning-leader' }, next: 'match' },
          { id: 'struggle-focus', label: 'Struggle to find the game inside the grief', desc: 'It feels wrong to care about football at all right now', outcome: 'He can’t reconcile a scoreline with coffins, and drifts through the week hollow, unsure how anyone is meant to just play on.', effect: { form: -0.06, meters: { family: 5, partner: 4 }, tag: 'grieving' }, next: 'match' },
        ],
      },
      match: {
        id: 'match',
        prompt: 'The first game after, the ground a sea of scarves and silence broken only by the names being sung, an empty section left bare for those who never arrived. The players wear black armbands into a wall of raw emotion. Whatever happens now, it has to be for them.',
        choices: [
          { id: 'for-them', label: 'Win it and give the grief somewhere to go', desc: 'Pour the sorrow into a performance the lost would be proud of', outcome: 'He plays as if the missing are watching, scores, and lifts his shirt to the empty seats, giving a broken support one pure moment to hold onto.', effect: { form: 0.12, attr: { leadership: 1, composure: 1 }, meters: { fans: 16, authority: 6 } } },
          { id: 'honour-quiet', label: 'Honour them with quiet, honest effort', desc: 'No theatrics — just heart, sweat, and respect for the day', outcome: 'He asks for nothing showy of himself, only that every man leaves everything out there, and applauds the bereaved long after the whistle.', effect: { form: 0.06, attr: { teamwork: 2 }, meters: { fans: 10, peers: 6 } } },
        ],
      },
    },
  },
];
