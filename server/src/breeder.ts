// Server-authoritative Career sim (Layer 1). A prospect's development is a deterministic play LOG
// (seed + agent + actions) persisted on the prospect row; the server replays it to get the current
// state, applies the human's next action, and — at age 25 — GRADUATES it into a manager Player NFT.
// Because it's a pure function of (seed, genes, actions) the whole career is replayable + verifiable.
import { Career, graduate, AGENTS, TOTAL_TURNS, type CareerPlayer, type Track, type Player } from '@fm/shared';
import type { ProspectRow } from './store.js';

export type CareerAction = { type: 'play' | 'draft' | 'coach' | 'offer'; cardId: string };

function seedFrom(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }
export const careerSeedFor = (prospectId: string) => seedFrom(prospectId + ':career');
export const trackFor = (roleHint: string): Track => (roleHint === 'GK' ? 'goalkeeper' : 'outfield');
export const agentsList = () => AGENTS.map((a) => ({ id: a.id, name: a.name, desc: a.desc }));

/** Reconstruct the in-progress Career by replaying the prospect's stored actions (deterministic). */
export function loadCareer(p: ProspectRow): Career {
  const c = new Career(p.career_seed!, (p.track as Track) ?? 'outfield', p.agent_id ?? undefined);
  const actions: CareerAction[] = JSON.parse(p.career_actions ?? '[]');
  for (const a of actions) {
    if (a.type === 'draft') c.draft(a.cardId);
    else if (a.type === 'coach') c.appointCoach(a.cardId);
    else if (a.type === 'offer') c.resolveOffer(a.cardId);
    else c.play(a.cardId);
  }
  return c;
}

/** Apply one human action to the live Career (throws on an illegal move). */
export function applyAction(c: Career, a: CareerAction) {
  if (a.type === 'draft') c.draft(a.cardId);
  else if (a.type === 'coach') c.appointCoach(a.cardId);
  else if (a.type === 'offer') c.resolveOffer(a.cardId);
  else c.play(a.cardId);
}

/** The playable state the client renders (phase + options + progress + narrative). */
export function careerState(p: ProspectRow, c: Career) {
  const st = c.current() as any;
  return {
    prospectId: p.id, name: p.name, pedigree: p.pedigree, agentId: p.agent_id, track: p.track,
    turn: c.turn, totalTurns: TOTAL_TURNS, seasonEvent: c.seasonEvent, earnings: c.earnings,
    ...st, // phase, age, chapter, finished, + scenario/hand/coaches/options/offers/deck per phase
  };
}

/** Finish the career into a manager Player NFT (prime, age 25), inheriting the prospect's genes +
 *  pedigree development bonus. Returns the CareerPlayer + a ready-to-store manager Player. */
export function graduateProspect(p: ProspectRow, c: Career): { grad: CareerPlayer; player: Player; tokenId: number } {
  const genes = JSON.parse(p.genes_json);
  const devBonus = JSON.parse(p.dev_bonus_json ?? '{}');
  const grad = graduate(c.log, p.career_seed!, genes, undefined, { ...c.finContext(), legacyBonus: devBonus });
  const tokenId = Math.abs(careerSeedFor(p.id)) % 1000000;
  const player: Player = {
    id: `nft:career-${tokenId}`, name: p.name, role: grad.role,
    attrs: { ...grad.attrs }, anchor: { x: 0, y: 0 },
    traits: grad.traits, personality: grad.personality, greed: grad.greed, marketability: grad.marketability, earnings: grad.earnings,
  };
  return { grad, player, tokenId };
}
