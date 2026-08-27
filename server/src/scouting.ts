// Opposition scout — the PvP-facing "describe their tactics" lean. The pool-gen and
// reveal-tier rules moved to @fm/shared/scouting.ts (phase 1 offline migration);
// this file keeps only the bit that reads a live opponent Club (dies with PvP later).
import type { Club, Tactics } from '@fm/shared';

/** A short, deliberately vague tactical read — a lean, never exact numbers. */
export function describeIntel(club: Club, tactics: Tactics, likelyIds: Set<string>): string {
  const bits: string[] = [];
  const m = tactics.mentality, l = tactics.line, pr = tactics.press, te = tactics.tempo, w = tactics.width;
  bits.push(m >= 1 ? 'attack-minded' : m <= -1 ? 'defensive-minded' : 'balanced');
  if (l >= 1) bits.push('high defensive line'); else if (l <= -1) bits.push('deep line');
  if (pr >= 2) bits.push('gegenpress'); else if (pr >= 1) bits.push('presses high'); else if (pr <= -1) bits.push('sits off');
  if (te >= 1) bits.push('direct tempo'); else if (te <= -1) bits.push('patient build-up');
  if (w >= 1) bits.push('plays wide'); else if (w <= -1) bits.push('plays narrow');
  // one capped squad trait from the likely XI (a lean, not a stat dump)
  const xi = club.players.filter((p) => likelyIds.has(p.id));
  const avg = (rs: string[]) => { const ps = xi.filter((p) => rs.includes(p.role)); return ps.length ? ps.reduce((s, p) => s + p.attrs.pace, 0) / ps.length : 0; };
  const fwPace = avg(['FW']), dfPace = avg(['DF']);
  let trait = '';
  if (fwPace >= 15) trait = 'rapid forwards — wary of balls in behind';
  else if (fwPace && fwPace <= 11) trait = 'slow forwards — hold a high line';
  else if (dfPace && dfPace <= 11) trait = 'slow defenders — pace can hurt them';
  else if (dfPace >= 15) trait = 'quick defenders — hard to run past';
  return `Lean: ${bits.join(', ')}.` + (trait ? ` Read: ${trait}.` : '');
}
