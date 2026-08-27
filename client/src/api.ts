// Thin client for the fm-server async-PvP API. Token (the "code") is kept in
// localStorage; every request sends it as a Bearer header.
import type { Club, Duty, Lineup, Tactics, Team, Player } from '@fm/shared';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8787';

let token = localStorage.getItem('fm_token') ?? '';
export const hasToken = () => !!token;
export function setToken(t: string) { token = t; localStorage.setItem('fm_token', t); }
export function clearToken() { token = ''; localStorage.removeItem('fm_token'); }

export interface ApiError extends Error { status: number; body: any }
export interface LegacyCard { role: string; primeOverall: number; peakOverall: number; seasons: number; apps: number; leagueTitles: number; cupTitles: number; legendRating: number; tier: string; icon: string; testimonial: number; mintable: boolean; note: string; number?: number | null }
export interface Prospect { id: string; name: string; roleHint: string; pedigree: number; potentialStars: number; generation?: number; bornSeason?: number; developed?: boolean; note?: string; genes?: any; careerStarted?: boolean; developedPlayerId?: string | null }
export interface CareerCard { id: string; name: string; tags: string[]; rarity?: string; desc?: string }
export interface Kit { number: number; boots: string; celebration: string; nickname: string; hairstyle?: string; accessory?: string }
/** Immediate feedback on a moment just played: how well the card fit the demand, and how it went. */
export interface CareerOutcome { fit: number; bestFit: number; success: number; tags: string[]; answeredAsk: boolean }
export interface LeagueRow { name: string; mine: boolean; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
export interface CareerState {
  prospectId: string; name: string; pedigree: number; agentId?: string | null; phase: 'play' | 'coach' | 'draft' | 'offer' | 'focus';
  age: number; chapter: string; turn: number; totalTurns: number; finished: boolean;
  seasonEvent?: { id: string; name: string; desc: string } | null; earnings?: number; deck?: CareerCard[];
  scenario?: { id: string; kind: string; demand: Record<string, number>; label: string; stakes: number };
  story?: string; recap?: string; lifeEvent?: string;
  energy?: number; meters?: Array<{ key: string; icon: string; label: string; value: number }>;
  focus?: Array<{ id: string; icon: string; name: string; desc: string; energy: number; effects: Record<string, number>; tag?: string }>;
  side?: boolean;
  lifestyle?: Array<{ id: string; icon: string; name: string; blurb: string; cost: number; recovery?: number; market?: number; greed?: number; perks?: Record<string, number>; clubInvest?: number }>;
  consequences?: string[];
  momentKind?: 'match' | 'training' | 'life';
  matchCtx?: { opponent: string; home: boolean; score: string; minute: number; comp: string; club?: string | null };
  clubSeason?: { pos: number; size: number; me: LeagueRow; table: LeagueRow[]; apps: number; fixtures: number; status: string } | null;
  handoff?: { season: string; apps: number; status: string; overall: number } | null;
  careerScore?: number;
  objective?: { desc: string; target: number; progress: number; done: boolean } | null;
  rival?: { name: string; score: number; lead: number } | null;
  international?: { capped: boolean; caps: number; nation?: string; lastCap?: { oppNation: string; venue: 'H' | 'A' | 'N'; kind: 'friendly' | 'qualifier'; forGoals: number; ourGoals: number; scored: number } } | null;
  offPitch?: {
    image: { score: number; tier: string };
    reputation: { score: number; label: string; edge: 'clean' | 'edgy' };
    endorsements: { brand: string; category: string; tier: 'Local' | 'National' | 'Global'; payout: number; obligation: string }[];
    boots: { owned: { id: string; name: string; edge: string; unlock: string }[]; next: { boot: { id: string; name: string; edge: string; unlock: string }; progress: number; target: number } | null };
    temptation: { kind: string; title: string; blurb: string } | null;
  } | null;
  kit?: Kit | null;
  hand?: CareerCard[]; coach?: { id: string; name: string } | null;
  coaches?: Array<{ id: string; name: string; kind: string; desc: string; specialty: string[]; bonus: number }>;
  options?: CareerCard[]; picksLeft?: number;
  offers?: Array<{ id: string; name: string; desc: string; earn: number; greed: number; market: number; form: number }>;
  profile?: CareerProfile;
}
export interface CareerProfile {
  role: string; currentOverall: number; potential: number; stars: number; physicalCeiling: number;
  attrs: Record<string, number>; personality: { id: string; name: string; desc: string };
  agent: string | null; coach: string | null; earnings: number; traitsForming: string[];
}
export interface ContractInfo { playerId: string; age: number; available: boolean; seasonsLeft: number; lengthSeasons: number; extendCost: number; sellValue: number; stakedSeasons: number; staked?: boolean; morale?: number; moraleLabel?: string; retired?: boolean; legend?: LegacyCard | null; rebornId?: string | null; careerGoals?: number; careerAssists?: number; careerPotm?: number; careerApps?: number }

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, body }) as ApiError;
  }
  return res.json() as Promise<T>;
}

export interface Account { id: string; handle: string; rating: number; coins?: number }
export interface MarketPlayer { name: string; role: string; overall: number; attrs: Record<string, number>; hidden: number }
export interface MarketListing { id: string; playerId: string; price: number; sellerHandle: string; mine: boolean; player: MarketPlayer }
export interface TableRow { id: string; handle: string; rating: number; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics; duties?: Duty[]; captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } }
export interface ResultRow { id: string; home_id: string; away_id: string; home_handle: string; away_handle: string; home_score: number; away_score: number; created_at: number }
export interface SeasonMeta { number: number; startsAt: number; endsAt: number; status: string; endsInMs: number }
export interface Fixture { opponentId: string; handle: string; clubName: string; rating: number; venue: 'home' | 'away'; status: 'played' | 'pending'; result: { my: number; opp: number } | null }
export interface ScoutPlayer { name: string; role: string; overall: number | null; likelyXI: boolean | null }
export interface ScoutReveal { overalls: boolean; likelyXI: boolean; intel: boolean }
export interface Scout {
  handle: string; clubName: string; rating: number; formation: Lineup['formation'];
  tier: 'base' | 'bronze' | 'silver' | 'gold'; reveal: ScoutReveal; intel: string | null; players: ScoutPlayer[];
}
export interface Trialist { index: number; id: string; name: string; role: string; overall: number; band: 'raw' | 'squad' | 'quality' | 'gem'; signed: boolean }
export interface ScoutDestination { id: string; name: string; blurb: string; hitRate: number; upgradeChance: number; weights: Record<string, number>; travelMins: number; cost: number }
export interface MissionProspect { id: string; name: string; role: string; overall: number; attrs: Record<string, number> }
export interface Mission {
  id: string; destination: string; destName: string; dispatchedAt: number; readyAt: number; readyInMs: number;
  revealed: boolean; status: string; found: boolean | null; band: string | null; player: MissionProspect | null;
}
export interface MissionsData {
  season: number; tier: string; tripsPerSeason: number; tripsUsed: number; tripsLeft: number;
  loaneeCap: number; loaneeCount: number; coins: number; destinations: ScoutDestination[]; missions: Mission[];
}
export interface HonourRow { season_number: number; tier: string; final_pos: number; title: number; ended_at: number; coin_reward?: number; kind?: string }
export interface LeaderStat { name: string; club: string; goals: number; assists: number; apps: number; potm: number }
export interface AwardRow { season_number: number; tier: string; pod: number; kind: string; player_name: string; value: number; awarded_at: number }
export interface CupTie { homeId: string; awayId: string; homeHandle: string; awayHandle: string; homeScore: number; awayScore: number; pens: [number, number] | null; winnerId: string }
export interface CupRound { name: string; ties: CupTie[]; byes: { id: string; handle: string }[] }
export interface CupData { season: number; tier: string; pod: number; me: string; size: number; rounds: CupRound[]; championId: string | null; championHandle: string }
export interface Facility {
  key: string; icon: string; name: string; blurb: string; level: number; maxLevel: number;
  effect: string; nextEffect: string | null; upgradeCost: number | null; canAfford: boolean;
}
export interface FacilitiesData { coins: number; facilities: Facility[] }
export interface MatchPayload {
  matchId: string; seed: number; result: [number, number]; mySide: 0 | 1; coinsEarned?: number; gateIncome?: number; injuries?: Array<{ name: string; matches: number }>;
  home: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
  away: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
}

export const api = {
  register: (handle: string, password: string, clubName?: string) => req<{ token: string; account: Account; club: Club; standingOrders: StandingOrders }>(
    '/register', { method: 'POST', body: JSON.stringify({ handle, password, clubName }) }),
  login: (handle: string, password: string) => req<{ token: string; account: Account; club: Club; standingOrders: StandingOrders }>(
    '/login', { method: 'POST', body: JSON.stringify({ handle, password }) }),
  me: () => req<{ account: Account; club: Club; standingOrders: StandingOrders; injuries: Array<{ player_id: string; matches_remaining: number }>; contracts: Record<string, ContractInfo>; season: number }>('/me'),
  extendContract: (playerId: string) => req<{ ok: true; coins: number; contract: ContractInfo }>(`/players/${encodeURIComponent(playerId)}/extend`, { method: 'POST' }),
  stake: (playerId: string, on: boolean) => req<{ ok: true; contract: ContractInfo }>(`/players/${encodeURIComponent(playerId)}/${on ? 'stake' : 'unstake'}`, { method: 'POST' }),
  reborn: (playerId: string) => req<{ ok: true; cost: number; legacy?: number; coins: number; prospect: Prospect }>(`/players/${encodeURIComponent(playerId)}/reborn`, { method: 'POST' }),
  careerHandoff: (pid: string) => req<{ ok: true; player: Player }>(`/career/${encodeURIComponent(pid)}/handoff`, { method: 'POST' }),
  succeed: (pid: string, body: { seasons: number; titles: number; mentorship: number }) => req<{ ok: true; legacy?: number; prospect: Prospect }>(`/players/${encodeURIComponent(pid)}/succeed`, { method: 'POST', body: JSON.stringify(body) }),
  spSeasonReward: (body: { pos: number; size: number; sponsor?: string }) => req<{ ok: true; prize: number; sponsorBonus?: number; coins: number }>(`/sp/season-reward`, { method: 'POST', body: JSON.stringify(body) }),
  spSponsor: (deal: string) => req<{ ok: true; upfront: number; coins: number }>(`/sp/sponsor`, { method: 'POST', body: JSON.stringify({ deal }) }),
  developPlayer: (pid: string, body: { focus: string; age: number }) => req<{ ok: true; player: Player; overall: number }>(`/players/${encodeURIComponent(pid)}/develop`, { method: 'POST', body: JSON.stringify(body) }),
  hireStaff: (staffId: string) => req<{ ok: true; cost: number; coins: number }>(`/sp/hire-staff`, { method: 'POST', body: JSON.stringify({ staffId }) }),
  prospects: () => req<{ prospects: Prospect[]; supply: number; cap: number }>('/prospects'),
  genesis: () => req<{ ok: true; supply: number; cap: number; cost?: number; coins?: number; prospect: Prospect }>('/genesis', { method: 'POST' }),
  careerAgents: () => req<{ agents: Array<{ id: string; name: string; desc: string }> }>('/career/agents'),
  startCareer: (pid: string, agentId: string | null) => req<{ ok: true; state: CareerState }>(`/career/${encodeURIComponent(pid)}/start`, { method: 'POST', body: JSON.stringify({ agentId }) }),
  getCareer: (pid: string) => req<{ ok: true; state: CareerState }>(`/career/${encodeURIComponent(pid)}`),
  careerAct: (pid: string, action: { type: string; cardId: string }) => req<{ ok: true; graduated?: boolean; narration?: string | null; outcome?: CareerOutcome | null; clubGain?: number; windfall?: number; epilogue?: string; player?: Player; state?: CareerState }>(`/career/${encodeURIComponent(pid)}/act`, { method: 'POST', body: JSON.stringify(action) }),
  saveKit: (pid: string, kit: Kit) => req<{ ok: true; kit: Kit }>(`/career/${encodeURIComponent(pid)}/kit`, { method: 'PUT', body: JSON.stringify(kit) }),
  legends: () => req<{ legends: Array<{ playerId: string; name: string; card: LegacyCard; retiredSeason: number }> }>('/legends'),
  prestige: () => req<{ prestige: { score: number; levelIdx: number; title: string; icon: string; nextTitle: string | null; nextAt: number | null; progress: number; leagueTitles: number; cupTitles: number }; record: { wins: number; draws: number; losses: number; seasons: number } }>('/prestige'),
  setStandingOrders: (so: StandingOrders) => req<{ ok: true; standingOrders: StandingOrders }>(
    '/standing-orders', { method: 'PUT', body: JSON.stringify(so) }),
  opponents: () => req<{ opponents: Array<{ id: string; handle: string; rating: number; clubName: string }> }>('/opponents'),
  createMatch: (opponentId: string, myLineup?: Lineup, myTactics?: Tactics, venue: 'home' | 'away' = 'home') =>
    req<MatchPayload>('/matches', { method: 'POST', body: JSON.stringify({ opponentId, myLineup, myTactics, venue }) }),
  leaderboard: () => req<{ leaderboard: Array<{ id: string; handle: string; rating: number }> }>('/leaderboard'),
  table: () => req<{ table: TableRow[] }>('/table'),
  myMatches: () => req<{ matches: Array<{ id: string; home_id: string; away_id: string; home_score: number; away_score: number; created_at: number }> }>('/me/matches'),
  results: () => req<{ results: ResultRow[] }>('/results'),
  season: () => req<{ season: SeasonMeta }>('/season'),
  fixtures: () => req<{ fixtures: Fixture[]; played: number; total: number; playedToday: number; dailyCap: number }>('/fixtures'),
  scout: (opponentId: string) => req<Scout>(`/scout/${opponentId}`),
  plan: (opponentId: string) => req<{ plan: StandingOrders | null }>(`/plan/${opponentId}`),
  trials: () => req<{ season: number; cap: number; signedCount: number; pool: Trialist[] }>('/scout/trials'),
  signTrial: (index: number) => req<{ ok: true; player: { name: string; role: string }; signedCount: number }>(`/scout/trials/${index}/sign`, { method: 'POST' }),
  facilities: () => req<FacilitiesData>('/facilities'),
  upgradeFacility: (key: string) => req<{ ok: true; key: string; level: number; coins: number }>(`/facilities/${key}/upgrade`, { method: 'POST' }),
  missions: () => req<MissionsData>('/scout/missions'),
  dispatchScout: (destination: string) => req<{ ok: true; mission: Mission; coins: number }>('/scout/missions', { method: 'POST', body: JSON.stringify({ destination }) }),
  signMission: (id: string) => req<{ ok: true; player: { name: string; role: string }; signedCount: number }>(`/scout/missions/${id}/sign`, { method: 'POST' }),
  standings: () => req<{ season: { number: number; endsAt: number }; tier: string; pod: number; promote: number; relegate: number; table: TableRow[] }>('/standings'),
  diary: () => req<{ entry: string }>('/diary'),
  honours: () => req<{ honours: HonourRow[] }>('/honours'),
  awards: () => req<{ awards: AwardRow[] }>('/awards'),
  cup: () => req<CupData>('/cup'),
  leaders: () => req<{ season: { number: number; endsAt: number }; tier: string; pod: number; scorers: LeaderStat[]; assisters: LeaderStat[]; potm: LeaderStat[] }>('/leaders'),
  market: () => req<{ coins: number; tier: string; listings: MarketListing[]; mine: MarketListing[] }>('/market'),
  listPlayer: (playerId: string, price: number) => req<{ ok: true; id: string }>('/market/list', { method: 'POST', body: JSON.stringify({ playerId, price }) }),
  buyListing: (id: string) => req<{ ok: true; player: { name: string; role: string }; coins: number }>(`/market/${id}/buy`, { method: 'POST' }),
  cancelListing: (id: string) => req<{ ok: true }>(`/market/${id}/cancel`, { method: 'POST' }),
  scoutTiers: () => req<{ opp: string; player: string; nft: { address: string; chainId: number; enabled: boolean } }>('/scout/tiers'),
};
