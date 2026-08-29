// EVENT_PREFIX — see shared/src/prompts/README for the authoring rules.
// season-event prefixes (weave the chapter's story into the beat)
// A season-long event colours EVERY scenario while it runs, so each needs a small pool of lead-ins —
// otherwise one line ("Riding the wave of a breakout season") opens every prompt for a whole season and
// dominates the text (PT-9/PT-42). Turn-strided selection walks the pool so it varies turn to turn.
export const EVENT_PREFIX: Record<string, string[]> = {
  'serious-injury': ['Still fighting his way back from a bad injury, ', 'Body not yet all the way healed, ', 'Every stride still a question after the injury, ', 'Barely back in full training, ', 'The doubts about his fitness not quite silenced, '],
  'hot-streak': ['In the form of his life, ', 'Riding a hot streak he daren’t question, ', 'Everything he touches turning to gold lately, ', 'Unable to stop scoring at the minute, ', 'Playing with the freedom of a man who can’t miss, '],
  slump: ['Low on confidence, ', 'Stuck in a rut he can’t explain, ', 'Goals and form having dried up, ', 'Second-guessing every touch lately, ', 'Desperate to end a barren run, '],
  'new-gaffer': ['Desperate to catch the new gaffer’s eye, ', 'With a new manager still making his mind up on him, ', 'Everything to prove to a boss who didn’t sign him, ', 'Learning a whole new system on the fly, ', 'One good game from the new manager’s trust, '],
  knock: ['Carrying a knock he wouldn’t admit to, ', 'Strapped up and playing through the pain, ', 'One bad tackle from the treatment table, ', 'Nursing a niggle the staff don’t know about, ', 'Not quite at his sharpest with the injury, '],
  breakthrough: ['Riding the wave of a breakout season, ', 'The breakout year rolling on beneath him, ', 'Suddenly the name on everyone’s lips, ', 'The hype around him building week on week, ', 'Every eye in the academy on him now, '],
  'cup-run': ['Buzzing off a thrilling cup run, ', 'Swept up in a cup run nobody saw coming, ', 'The whole town dreaming of a cup upset, ', 'Another cup tie, another shot at glory, ', 'The giant-killing talk following the club around, '],
  'transfer-links': ['Trying to tune out the transfer talk, ', 'His name in the transfer pages again, ', 'With bigger clubs reportedly circling, ', 'A price tag suddenly attached to his name, ', 'The speculation about his future refusing to die, '],
  'fan-favourite': ['Roared on by supporters who adore him, ', 'A terrace song already sung in his name, ', 'The crowd firmly on his side these days, ', 'Cult-hero status growing on the terraces, ', 'The supporters ready to forgive him anything, '],
  'international-honour': ['Still pinching himself over the international honour, ', 'The national-team call-up still sinking in, ', 'A country’s expectation newly on his shoulders, ', 'The weight of a nation’s badge freshly on his chest, ', 'Back at his club after a proud week away, '],
};
