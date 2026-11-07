/**
 * Couche de persistance. Plusieurs implémentations interchangeables :
 *  - localRepo    : localStorage (mode invité, aucun compte requis)
 *  - apiRepo      : API Express (authentification, règles métier et persistance Supabase)
 */
import { normalizeState } from '@/lib/progress';
import type { UserState } from '@/lib/types';
import { API_BASE_URL, supabase } from './supabase';

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error('Le mode en ligne n’est pas configuré.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Connecte-toi pour accéder aux données en ligne.');
  return data.session.access_token;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Erreur API: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface Repo {
  mode: 'local' | 'cloud';
  load(): Promise<UserState | null>;
  save(state: UserState): Promise<void>;
}
export type ProgressAction =
  | { type: 'chapter-read'; moduleId: string; chapterId: string }
  | { type: 'quiz'; moduleId: string; kind: 'qcm' | 'blitz' | 'review'; label: string; results: { id: string; answerIndex: number; elapsedSeconds: number }[] }
  | { type: 'exam'; moduleId: string; n: number; score: number }
  | { type: 'cards'; moduleId: string; known: string[]; unknown: string[] }
  | { type: 'reset' };
export interface CloudRepo extends Repo {
  applyAction(action: ProgressAction): Promise<{ state: UserState; summary: import('@/lib/types').Summary | null }>;
  importState(state: UserState): Promise<UserState>;
  reset(): Promise<UserState>;
}

export function localRepo(key: string): Repo {
  const k = `akademia:state:${key}`;
  return {
    mode: 'local',
    async load() {
      try {
        const raw = localStorage.getItem(k);
        return raw ? normalizeState(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    },
    async save(state) {
      try {
        localStorage.setItem(k, JSON.stringify(state));
      } catch {
        /* quota ou navigation privée : on ignore */
      }
    },
  };
}

export function apiRepo(): CloudRepo {
  return {
    mode: 'cloud',
    async load() {
      const data = await apiRequest<{ state?: UserState }>('/progress');
      return data.state ? normalizeState(data.state) : null;
    },
    async save() {
      throw new Error('La progression en ligne doit être modifiée par une action métier.');
    },
    applyAction(action) {
      return apiRequest('/progress/actions', {
        method: 'POST',
        body: JSON.stringify(action),
      });
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
  xp: number;
  level: number;
  streak: number;
}
export async function fetchLeaderboard(limit = 50): Promise<LeaderRow[]> {
  return apiRequest<LeaderRow[]>(`/leaderboard?limit=${encodeURIComponent(String(limit))}`);
}
