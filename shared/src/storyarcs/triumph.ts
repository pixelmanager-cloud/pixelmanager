import type { StoryArc } from '../storyarc.js';

// TRIUMPH arcs — the highs: finals, milestones, awards, first goals, personal glory.
export const TRIUMPH_ARCS: StoryArc[] = [
  {
    id: 'cup-final-day', title: 'The Final', icon: '🏆', category: 'triumph',
    minTurn: 100, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A cup final — the biggest day of his life so far. The night before, sleepless in the team hotel, the enormity of it pressing down. How does he steady himself?',
        choices: [
          { id: 'calm', label: 'Embrace the nerves', desc: 'Accept the fear, breathe, trust the work', outcome: 'He makes peace with it. By kickoff he’s ice — this is exactly where he wants to be.', effect: { attr: { composure: 1 }, meters: { authority: 4 }, tag: 'ready' }, next: 'moment' },
          { id: 'hype', label: 'Channel the fire', desc: 'Let the adrenaline build — go out snarling', outcome: 'He arrives at the ground bouncing off the walls, ready to run through one.', effect: { attr: { aggression: 1 }, form: 0.03, tag: 'fired' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'Extra time, still level, and the final swings on a single chance that falls to him at the back post. A nation watching. The keeper set. This is the moment careers are measured by.',
        choices: [
          { id: 'bury', label: 'Bury it', desc: 'First-time, no hesitation', outcome: 'He lashes it home and lifts the cup as the confetti falls. A day that outlives him.', effect: { form: 0.12, market: 4, attr: { composure: 1, aggression: 1 }, meters: { fans: 22, authority: 8 } } },
          { id: 'dink', label: 'Dink the keeper', desc: 'Audacity on the biggest stage', outcome: 'He chips it, impossibly cool, and the ball floats in. Some men are built for this.', effect: { form: 0.12, market: 4, attr: { flair: 2 }, meters: { fans: 20 } } },
        ],
      },
    },
  },
  {
    id: 'tri-promotion', title: 'Up We Go', icon: '🎉', category: 'triumph',
    minTurn: 95, maxTurn: 175, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A whole season of Tuesday nights in the rain, and it comes down to this: win today and the club goes up. The dressing room is a coiled spring. What does he tell the lads before they walk out?',
        choices: [
          { id: 'lead', label: 'Give the speech', desc: 'Stand up, look each man in the eye, demand it', outcome: 'His voice fills the room and grown men nod like schoolboys. They walk out believing.', effect: { attr: { leadership: 1 }, meters: { peers: 8, authority: 5 }, tag: 'voice' }, next: 'whistle' },
          { id: 'quiet', label: 'Let his boots talk', desc: 'Say nothing, lace up, lead by doing', outcome: 'He says not a word, only tightens his laces. The others read the calm and match it.', effect: { attr: { composure: 1 }, form: 0.04, tag: 'still' }, next: 'whistle' },
        ],
      },
      whistle: {
        id: 'whistle',
        prompt: 'Full time, and the pitch vanishes under a tide of supporters who waited years for this. Promotion is theirs. In the chaos, a touchline reporter shoves a microphone at him. What comes out?',
        choices: [
          { id: 'humble', label: 'Credit the club', desc: 'Point to the badge, the fans, the grind', outcome: 'He talks only of the tea ladies and the away-day faithful. The terraces adore him for it.', effect: { form: 0.08, meters: { fans: 18, authority: 6 }, attr: { teamwork: 1 } } },
          { id: 'hungry', label: 'Aim higher already', desc: 'Say this division was never the ceiling', outcome: 'Champagne in his hair, he vows this is only base camp. The chairman raises an eyebrow, and smiles.', effect: { form: 0.1, market: 3, meters: { sponsors: 8, fans: 10 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-player-of-year', title: 'Player of the Year', icon: '🌟', category: 'triumph',
    minTurn: 110, maxTurn: 185, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The votes are counted and the whisper becomes fact: he has pipped {RIVAL} to the Player of the Year by a single ballot. A black-tie night, the great and the good watching, his name read aloud. How does he take the stage?',
        choices: [
          { id: 'gracious', label: 'Salute {RIVAL}', desc: 'Name his rival from the podium, mean it', outcome: 'He thanks {RIVAL} for dragging the best from him all year. The room warms; even his rival applauds.', effect: { attr: { leadership: 1 }, meters: { peers: 12, fans: 8 }, tag: 'class' }, next: 'after' },
          { id: 'relish', label: 'Savour every second', desc: 'Milk the ovation, let it wash over him', outcome: 'He lingers at the microphone, drinking it in, and the cameras love the glint in his eye.', effect: { form: 0.06, market: 3, meters: { sponsors: 10, fans: 10 }, tag: 'shine' }, next: 'after' },
        ],
      },
      after: {
        id: 'after',
        prompt: 'By morning the trophy sits on his kitchen table and the phone will not stop. An agent from a glossier league is circling; his old coach texts only: "stay hungry, son." Which voice does he heed?',
        choices: [
          { id: 'stay', label: 'Keep the head down', desc: 'Bin the noise, back to the training pitch', outcome: 'He drives to the ground before dawn and runs the extra laps alone. Awards, he decides, are earned again each week.', effect: { form: 0.09, attr: { stamina: 1, composure: 1 }, meters: { authority: 6 } } },
          { id: 'cash', label: 'Cash the moment', desc: 'Let the agent chase the boot deals', outcome: 'The endorsements roll in and his face goes up on billboards. Comfortable, lucrative, and a touch distracting.', effect: { earnings: 5, market: 4, meters: { sponsors: 14, agent: 8 }, form: -0.03 } },
        ],
      },
    },
  },
  {
    id: 'tri-hundredth-goal', title: 'The Hundredth', icon: '💯', category: 'triumph',
    minTurn: 120, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'Ninety-nine career goals, and the whole ground knows it. Late on, the ball breaks to him six yards out with the net gaping — but a teammate on his weaker side has an even simpler tap-in. The hundredth, or the team?',
        choices: [
          { id: 'square', label: 'Square it', desc: 'Give the goal away, put the side first', outcome: 'He rolls it across for the easiest of finishes and wheels away grinning. The milestone can wait; the win cannot.', effect: { attr: { teamwork: 2 }, meters: { peers: 14, authority: 6 }, tag: 'selfless' }, next: 'reach' },
          { id: 'finish', label: 'Take it himself', desc: 'A hundred goals does not come twice', outcome: 'He buries it and the number goes up in lights. A record is a record, and this one is his.', effect: { form: 0.08, market: 2, attr: { aggression: 1 }, meters: { fans: 12 }, tag: 'greedy' } },
        ],
      },
      reach: {
        id: 'reach',
        prompt: 'The hundredth arrives a fortnight later, a scruffy poked finish that will look ugly forever in the highlight reels. Ugly or not, it is done. How does he mark the round number?',
        choices: [
          { id: 'family', label: 'Point to the stand', desc: 'Dedicate it to the folks who drove him everywhere', outcome: 'He sprints to where his family sit and presses the badge to his chest. Every early morning was for this.', effect: { form: 0.07, meters: { family: 16, fans: 8 }, attr: { composure: 1 } } },
          { id: 'crowd', label: 'Feed the frenzy', desc: 'Slide to the corner flag, arms wide', outcome: 'He whips off the shirt and lets the roar break over him, booking and all. Worth every yellow card.', effect: { form: 0.09, market: 2, meters: { fans: 16, sponsors: 6 }, attr: { flair: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-first-cap', title: 'The First Cap', icon: '🎽', category: 'triumph',
    minTurn: 100, maxTurn: 165, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A letter with the crest on it: he has been called up. His country, the senior side, at last. The night before his debut he sits alone with the shirt laid across the bed. What runs through him?',
        choices: [
          { id: 'pride', label: 'Ring home first', desc: 'Phone the family before anyone else knows', outcome: 'He calls his mother and hears her cry down the line. Whatever comes now, that moment is theirs forever.', effect: { attr: { composure: 1 }, meters: { family: 14, fans: 6 }, tag: 'grounded' }, next: 'anthem' },
          { id: 'focus', label: 'Study the opposition', desc: 'Turn nerves into preparation, watch the tapes', outcome: 'He fills a notebook with the winger he must stop, sleeping little and learning much.', effect: { attr: { teamwork: 1 }, form: 0.04, tag: 'primed' }, next: 'anthem' },
        ],
      },
      anthem: {
        id: 'anthem',
        prompt: 'Debut day. The anthem plays and a lump rises in his throat as the cameras pan the line. He gets forty minutes off the bench and does himself proud. Afterwards, how does he carry a full international?',
        choices: [
          { id: 'modest', label: 'Wear it lightly', desc: 'One cap is a start, not an arrival', outcome: 'He frames the shirt but tells reporters the real work begins now. The manager notes the maturity.', effect: { form: 0.08, attr: { composure: 1, leadership: 1 }, meters: { authority: 6, peers: 6 } } },
          { id: 'declare', label: 'Announce himself', desc: 'Tell the nation this is only cap one', outcome: 'He looks the cameras dead-on and promises fifty more. Bold, and the public eats it up.', effect: { form: 0.06, market: 3, meters: { fans: 14, sponsors: 8 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-captain-country', title: 'The Armband', icon: '🎖️', category: 'triumph',
    minTurn: 140, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'The manager pulls him aside in the hotel corridor and hands him the armband. Captain of his country. The boy who was once too small, too slow, too something, will lead the anthem line. How does he shoulder it?',
        choices: [
          { id: 'servant', label: 'Lead by serving', desc: 'A captain carries the kit, not the ego', outcome: 'He tells the squad the armband changes nothing but his workload. They stand a little taller around him.', effect: { attr: { leadership: 2, teamwork: 1 }, meters: { peers: 14, authority: 8 }, tag: 'humble-cap' }, next: 'walkout' },
          { id: 'crown', label: 'Own the honour', desc: 'Let the nation see how much it means', outcome: 'He wears it like a crown, chest out for the cameras, and the country falls in behind him.', effect: { form: 0.06, market: 3, meters: { fans: 16, sponsors: 6 }, attr: { leadership: 1 }, tag: 'proud-cap' }, next: 'walkout' },
        ],
      },
      walkout: {
        id: 'walkout',
        prompt: 'He leads them out under a roaring stadium, mascot by the hand, the whole nation on its feet. At nil-nil a young debutant beside him is visibly shaking. What does the captain do?',
        choices: [
          { id: 'arm', label: 'Steady the kid', desc: 'An arm round the shoulder, a quiet word', outcome: 'He calms the youngster with a joke and a nod, and the boy plays the game of his life. That is what the armband is for.', effect: { form: 0.08, attr: { leadership: 1, composure: 1 }, meters: { peers: 12, authority: 6 } } },
          { id: 'drive', label: 'Drag them forward', desc: 'Demand more, roar the whole side up the pitch', outcome: 'He bellows and gestures and hauls the team by the scruff to a famous win. Fearsome, and effective.', effect: { form: 0.09, attr: { aggression: 1, leadership: 1 }, meters: { fans: 12, authority: 5 } } },
        ],
      },
    },
  },
  {
    id: 'tri-club-record', title: 'Into the Books', icon: '📖', category: 'triumph',
    minTurn: 130, maxTurn: 195, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A name that has stood in the club record books for forty years is about to be erased — and replaced with his. One more appearance, or one more goal, and a legend of the old photographs is overtaken. How does he approach the milestone?',
        choices: [
          { id: 'respect', label: 'Honour the old great', desc: 'Seek out the record-holder before the match', outcome: 'He visits the ageing legend and asks his blessing. The old man grips his hand and passes the torch gladly.', effect: { attr: { leadership: 1, composure: 1 }, meters: { authority: 8, fans: 10 }, tag: 'torch' }, next: 'moment' },
          { id: 'chase', label: 'Hunt it down', desc: 'Fix on the number and go get it', outcome: 'He tells no one and lets his football do the talking, ticking closer with every clean strike.', effect: { form: 0.05, attr: { aggression: 1 }, meters: { peers: 6 }, tag: 'hunt' }, next: 'moment' },
        ],
      },
      moment: {
        id: 'moment',
        prompt: 'It falls on a grey afternoon in front of a half-full ground — no cup, no cameras, just the record quietly broken. The stadium announcer reads out the new number. How does the new record-holder respond?',
        choices: [
          { id: 'club', label: 'Give it to the club', desc: 'Tell them the record belongs to the shirt', outcome: 'He lifts the ball to the main stand and says the number is the club’s, not his. A one-club heart, and the terraces know it.', effect: { form: 0.08, meters: { fans: 16, authority: 8 }, attr: { teamwork: 1 } } },
          { id: 'legacy', label: 'Set the bar higher', desc: 'Vow to leave a mark no one can touch', outcome: 'He promises to push the record so far it outlives him too. Ambition carved into the honours board.', effect: { form: 0.07, market: 3, meters: { sponsors: 8, fans: 8 }, attr: { aggression: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-testimonial', title: 'The Testimonial', icon: '👏', category: 'triumph',
    minTurn: 165, maxTurn: 200, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'A decade and more in the same shirt, and the club grants him a testimonial — a whole evening in his honour, old teammates flying in, the ground selling out to say thank you. What does he want the night to be?',
        choices: [
          { id: 'charity', label: 'Give it all away', desc: 'Send every penny to the local hospital', outcome: 'He donates the entire gate to the children’s ward down the road. The city loves him more than ever, and rightly.', effect: { attr: { leadership: 1, teamwork: 1 }, meters: { fans: 18, authority: 6 }, tag: 'giver' }, next: 'lap' },
          { id: 'reunion', label: 'Make it a reunion', desc: 'Fill the pitch with every old friend', outcome: 'He gathers the whole cast of his career for one last kickabout, laughter echoing round the old ground.', effect: { form: 0.05, meters: { peers: 16, family: 8 }, attr: { composure: 1 }, tag: 'reunion' }, next: 'lap' },
        ],
      },
      lap: {
        id: 'lap',
        prompt: 'Late in the night he takes a lap of the pitch he has called home for so long, the crowd chanting the name they have sung a thousand Saturdays. His eyes sting. How does he close the evening?',
        choices: [
          { id: 'speech', label: 'Thank every soul', desc: 'Grab the mic, name the kitmen and the fans', outcome: 'He thanks the groundsman and the turnstile men by name, and the whole ground weeps with him.', effect: { form: 0.06, meters: { fans: 16, authority: 6 }, attr: { leadership: 1 } } },
          { id: 'kids', label: 'Bring the family on', desc: 'Walk the lap with his children beside him', outcome: 'He carries his youngest on his shoulders round the pitch, and the picture makes every back page.', effect: { form: 0.07, meters: { family: 16, fans: 8 }, attr: { composure: 1 } } },
        ],
      },
    },
  },
  {
    id: 'tri-silence-doubters', title: 'Silence the Doubters', icon: '🤫', category: 'triumph',
    minTurn: 105, maxTurn: 190, weight: 2, first: 'open',
    beats: {
      open: {
        id: 'open',
        prompt: 'They wrote him off — the pundit who called him a waste of a wage, the forum that laughed, the coach who let him go. And here he is, man of the match against the very club that binned him, {RIVAL} watching from the other bench. How does the redemption feel?',
        choices: [
          { id: 'ice', label: 'Play it stone cold', desc: 'No celebration, just a long hard stare', outcome: 'He refuses to celebrate, only fixes {RIVAL} with a look that says everything words could not. Chilling.', effect: { attr: { composure: 1, aggression: 1 }, meters: { peers: 8, authority: 6 }, tag: 'cold' }, next: 'mic' },
          { id: 'roar', label: 'Roar it out', desc: 'Cup the ears at the away end, let it fly', outcome: 'He cups his ears at the doubters and roars until his throat is raw. Every doubt, screamed back at them.', effect: { form: 0.08, attr: { aggression: 1 }, meters: { fans: 14 }, tag: 'loud' }, next: 'mic' },
        ],
      },
      mic: {
        id: 'mic',
        prompt: 'The same pundit who buried him now wants a word on camera, all smiles, pretending the old words were never said. The microphone hovers. What does he give them?',
        choices: [
          { id: 'grace', label: 'Kill them with class', desc: 'Smile, thank the doubters for the fuel', outcome: 'He thanks his critics warmly for the motivation and walks off. Gracious, devastating, unanswerable.', effect: { form: 0.09, attr: { composure: 1, leadership: 1 }, meters: { authority: 8, fans: 10 } } },
          { id: 'receipts', label: 'Read the receipts', desc: 'Quote their own words back at them', outcome: 'He recites the old headline line by line, live on air, and lets the silence do the rest. The clip goes everywhere.', effect: { form: 0.07, market: 3, attr: { aggression: 1 }, meters: { fans: 14, sponsors: 4 } } },
        ],
      },
    },
  },
];
