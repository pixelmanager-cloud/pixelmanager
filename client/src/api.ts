// Thin client for the fm-server async-PvP API. Token (the "code") is kept in
// localStorage; every request sends it as a Bearer header.
import type { Club, Duty, Lineup, Tactics, Team } from '@fm/shared';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8787';

let token = localStorage.getItem('fm_token') ?? '';
export const hasToken = () => !!token;
export function setToken(t: string) { token = t; localStorage.setItem('fm_token', t); }
export function clearToken() { token = ''; localStorage.removeItem('fm_token'); }

export interface ApiError extends Error { status: number; body: any }

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

export interface Account { id: string; handle: string; rating: number }
export interface TableRow { id: string; handle: string; rating: number; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics; duties?: Duty[] }
export interface ResultRow { id: string; home_id: string; away_id: string; home_handle: string; away_handle: string; home_score: number; away_score: number; created_at: number }
export interface SeasonMeta { number: number; startsAt: number; endsAt: number; status: string; endsInMs: number }
export interface Fixture { opponentId: string; handle: string; clubName: string; rating: number; venue: 'home' | 'away'; status: 'played' | 'pending'; result: { my: number; opp: number } | null }
export interface ScoutPlayer { name: string; role: string; overall: number; likelyXI: boolean }
export interface Scout { handle: string; clubName: string; rating: number; formation: Lineup['formation']; players: ScoutPlayer[] }
export interface Trialist { index: number; id: string; name: string; role: string; overall: number; band: 'raw' | 'squad' | 'quality' | 'gem'; signed: boolean }
export interface HonourRow { season_number: number; tier: string; final_pos: number; title: number; ended_at: number }
export interface MatchPayload {
  matchId: string; seed: number; result: [number, number]; mySide: 0 | 1;
  home: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
  away: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
}

export const api = {
  register: (handle: string, password: string) => req<{ token: string; account: Account; club: Club; standingOrders: StandingOrders }>(
    '/register', { method: 'POST', body: JSON.stringify({ handle, password }) }),
  login: (handle: string, password: string) => req<{ token: string; account: Account; club: Club; standingOrders: StandingOrders }>(
    '/login', { method: 'POST', body: JSON.stringify({ handle, password }) }),
  me: () => req<{ account: Account; club: Club; standingOrders: StandingOrders }>('/me'),
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
  standings: () => req<{ season: { number: number; endsAt: number }; tier: string; pod: number; promote: number; relegate: number; table: TableRow[] }>('/standings'),
  honours: () => req<{ honours: HonourRow[] }>('/honours'),
};
