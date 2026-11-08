/**
 * Couche de communication avec le backend Express (/api).
 * Authentification Bearer Token, progression, thème par filière, classement et actualités.
 */
import { normalizeState } from '@/lib/progress';
import type { BackendThemeId, FiliereId, Summary, UserState } from '@/lib/types';
import { API_BASE_URL } from './supabase';

export const AUTH_TOKEN_KEY = 'akademia:token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Erreur API (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export type ProgressAction =
  | { type: 'set-filiere'; filiere: FiliereId }
  | { type: 'chapter-read'; moduleId: string; chapterId: string }
  | { type: 'quiz'; moduleId: string; kind: 'qcm' | 'blitz' | 'review'; label: string; results: { id: string; answerIndex: number; elapsedSeconds: number }[] }
  | { type: 'exam'; moduleId: string; n: number; score: number }
  | { type: 'cards'; moduleId: string; known: string[]; unknown: string[] }
  | { type: 'reset' };

export interface ThemeResponse {
  filiere: FiliereId | null;
  theme: BackendThemeId;
  defaultTheme: BackendThemeId;
}

export async function fetchBackendTheme(filiere: FiliereId | null): Promise<ThemeResponse> {
  const query = filiere ? `?filiere=${encodeURIComponent(filiere)}` : '';
  const res = await fetch(`${API_BASE_URL}/theme${query}`);
  if (!res.ok) throw new Error(`Erreur thème: ${res.status}`);
  return res.json() as Promise<ThemeResponse>;
}

export interface CloudRepo {
  load(): Promise<UserState | null>;
  applyAction(action: ProgressAction): Promise<{ state: UserState; summary: Summary | null }>;
  importState(state: UserState): Promise<UserState>;
  reset(): Promise<UserState>;
}

export function apiRepo(): CloudRepo {
  return {
    async load() {
      const data = await apiRequest<{ state?: UserState }>('/progress');
      return data.state ? normalizeState(data.state) : null;
    },
    async applyAction(action) {
      const res = await apiRequest<{ state: UserState; summary: Summary | null }>('/progress/actions', {
        method: 'POST',
        body: JSON.stringify(action),
      });
      return { state: normalizeState(res.state), summary: res.summary };
    },
    async importState(state) {
      const data = await apiRequest<{ state: UserState }>('/progress/import', {
        method: 'POST',
        body: JSON.stringify({ state }),
      });
      return normalizeState(data.state);
    },
    async reset() {
      const data = await apiRequest<{ state: UserState }>('/progress', { method: 'DELETE' });
      return normalizeState(data.state);
    },
  };
}

export interface LeaderRow {
  id: string;
  username: string;
  filiere: FiliereId;
  xp: number;
  level: number;
  streak: number;
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderRow[]> {
  return apiRequest<LeaderRow[]>(`/leaderboard?limit=${encodeURIComponent(String(limit))}`);
}

export interface WeeklyBattleInfo {
  id: string;
  weekLabel: string;
  startsAt: string;
  endsAt: string;
  nextStartsAt?: string;
  isFinished: boolean;
  status: 'active' | 'completed';
  ariScore: number;
  aipScore: number;
  ariMembers: number;
  aipMembers: number;
  winner: FiliereId | 'EGALITE' | null;
}

export interface BattleHistoryItem {
  id: string;
  weekLabel: string;
  startsAt: string;
  endsAt: string;
  ariScore: number;
  aipScore: number;
  ariMembers: number;
  aipMembers: number;
  winner: FiliereId | 'EGALITE';
  status: 'completed';
}

export interface BattleApiResponse {
  currentBattle: WeeklyBattleInfo;
  history: BattleHistoryItem[];
}

export async function fetchBattle(): Promise<BattleApiResponse> {
  return apiRequest<BattleApiResponse>('/battle');
}

export async function fetchFeed(): Promise<BattleApiResponse> {
  return fetchBattle();
}
