// Thin client for the fm-server async-PvP API. Token (the "code") is kept in
// localStorage; every request sends it as a Bearer header.
import type { Club, Lineup, Tactics, Team } from '@fm/shared';

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
export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics }
export interface MatchPayload {
  matchId: string; seed: number; result: [number, number];
  home: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
  away: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
}

export const api = {
  register: (handle: string) => req<{ token: string; account: Account; club: Club; standingOrders: StandingOrders }>(
    '/register', { method: 'POST', body: JSON.stringify({ handle }) }),
  me: () => req<{ account: Account; club: Club; standingOrders: StandingOrders }>('/me'),
  setStandingOrders: (so: StandingOrders) => req<{ ok: true; standingOrders: StandingOrders }>(
    '/standing-orders', { method: 'PUT', body: JSON.stringify(so) }),
  opponents: () => req<{ opponents: Array<{ id: string; handle: string; rating: number; clubName: string }> }>('/opponents'),
  createMatch: (opponentId: string) => req<MatchPayload>('/matches', { method: 'POST', body: JSON.stringify({ opponentId }) }),
  leaderboard: () => req<{ leaderboard: Array<{ id: string; handle: string; rating: number }> }>('/leaderboard'),
  myMatches: () => req<{ matches: Array<{ id: string; home_id: string; away_id: string; home_score: number; away_score: number; created_at: number }> }>('/me/matches'),
};
