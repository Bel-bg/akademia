/**
 * Couche de communication avec le backend Express (/api).
 * Authentification Bearer Token, progression, thème par filière, classement et actualités.
 */
import { normalizeState } from '@/lib/progress';
import type { BackendThemeId, FiliereId, Summary, UserState } from '@/lib/types';
import { API_BASE_URL, supabase } from './supabase';

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

export async function getAccessToken(): Promise<string> {
  const stored = getStoredToken();
  if (stored) return stored;
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.access_token) return data.session.access_token;
    } catch {
      /* ignore */
    }
  }
  throw new Error('Connecte-toi pour accéder aux données en ligne.');
}

interface PendingProgressAction {
  id: string;
  action: ProgressAction;
}

interface OfflineSnapshot {
  state: UserState;
  pending: PendingProgressAction[];
}

function snapshotKey(userId: string) {
  return `akademia:offline:${userId}`;
}

function readSnapshot(userId: string): OfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(snapshotKey(userId));
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as OfflineSnapshot;
    return snapshot?.state
      ? {
          state: normalizeState(snapshot.state),
          pending: Array.isArray(snapshot.pending) ? snapshot.pending : [],
        }
      : null;
  } catch {
    return null;
  }
}

function writeSnapshot(userId: string, snapshot: OfflineSnapshot) {
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(snapshot));
  } catch {
    /* quota or private browsing */
  }
}

function retryable(error: unknown) {
  if (!navigator.onLine || error instanceof TypeError) return true;
  if (
    error instanceof Error &&
    /network|fetch failed|timeout|offline/i.test(`${error.name} ${error.message}`)
  )
    return true;
  if (typeof error !== 'object' || error === null || !('status' in error)) return false;
  const status = Number((error as { status: number }).status);
  return status === 401 || status === 408 || status === 429 || status >= 500;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getStoredToken();
  if (!token && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) token = data.session.access_token;
    } catch {
      /* ignore */
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  if (!res.ok) {
    let message = `Erreur API: ${res.status}`;
    try {
      message = (JSON.parse(text) as { error?: string }).error || message;
    } catch {
      /* non-JSON API error */
    }
    throw Object.assign(new Error(message), { status: res.status });
  }

  if (!text.trim()) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Réponse API invalide.');
  }
}

export type ProgressAction =
  | { type: 'set-filiere'; filiere: FiliereId }
  | { type: 'chapter-read'; moduleId: string; chapterId: string }
  | {
      type: 'quiz';
      moduleId: string;
      kind: 'qcm' | 'blitz' | 'review';
      label: string;
      results: { id: string; answerIndex: number; elapsedSeconds: number }[];
    }
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

export interface Repo {
  mode: 'local';
  load(): Promise<UserState | null>;
  save(state: UserState): Promise<void>;
}

export interface CloudRepo {
  mode: 'cloud';
  load(): Promise<UserState | null>;
  save?(state: UserState): Promise<void>;
  applyAction(
    action: ProgressAction,
    optimistic?: { state: UserState; summary: Summary | null },
  ): Promise<{ state: UserState; summary: Summary | null }>;
  syncPending?(): Promise<UserState | null>;
  pendingCount?(): number;
  importState(state: UserState): Promise<UserState>;
  reset(optimistic?: UserState): Promise<UserState>;
}

export function localRepo(key = 'guest'): Repo {
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

/** UUID v4 ; repli si crypto.randomUUID est absent (contexte non sécurisé, anciens navigateurs). */
function newActionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function apiRepo(userId = 'me'): CloudRepo {
  let flushing: Promise<{
    state: UserState | null;
    summary: Summary | null;
  }> | null = null;

  const submit = (pending: PendingProgressAction) =>
    apiRequest<{ state: UserState; summary: Summary | null }>('/progress/actions', {
      method: 'POST',
      body: JSON.stringify({ actionId: pending.id, action: pending.action }),
    });

  async function flushPending(): Promise<{
    state: UserState | null;
    summary: Summary | null;
  }> {
    if (flushing) return flushing;
    flushing = (async () => {
      let snapshot = readSnapshot(userId);
      let lastSummary: Summary | null = null;
      while (snapshot?.pending.length) {
        const current = snapshot.pending[0];
        const result = await submit(current);
        const latest = readSnapshot(userId) ?? snapshot;
        const pending = latest.pending.filter((item) => item.id !== current.id);
        snapshot = {
          state: pending.length ? latest.state : normalizeState(result.state),
          pending,
        };
        writeSnapshot(userId, snapshot);
        lastSummary = result.summary;
      }
      return { state: snapshot?.state ?? null, summary: lastSummary };
    })();
    try {
      return await flushing;
    } finally {
      flushing = null;
    }
  }

  return {
    mode: 'cloud',
    async load() {
      try {
        const data = await apiRequest<{ state?: UserState }>('/progress');
        const serverState = normalizeState(data.state);
        const existing = readSnapshot(userId);
        writeSnapshot(userId, { state: serverState, pending: existing?.pending ?? [] });
        if (existing?.pending.length) {
          const synced = await flushPending();
          return synced.state ?? serverState;
        }
        return serverState;
      } catch (error) {
        const cached = readSnapshot(userId);
        if (cached) return cached.state;
        throw error;
      }
    },
    async save() {
      throw new Error('La progression en ligne doit être modifiée par une action métier.');
    },
    async applyAction(action, optimistic) {
      if (!optimistic) {
        const res = await apiRequest<{ state: UserState; summary: Summary | null }>(
          '/progress/actions',
          {
            method: 'POST',
            body: JSON.stringify({ actionId: newActionId(), action }),
          },
        );
        return { state: normalizeState(res.state), summary: res.summary };
      }

      const snapshot = readSnapshot(userId) ?? { state: optimistic.state, pending: [] };
      const pending = { id: newActionId(), action };
      const next = { state: optimistic.state, pending: [...snapshot.pending, pending] };
      writeSnapshot(userId, next);
      if (!navigator.onLine) return optimistic;
      try {
        const synced = await flushPending();
        return {
          state: synced.state ?? optimistic.state,
          summary: synced.summary ?? optimistic.summary,
        };
      } catch (error) {
        if (retryable(error)) return optimistic;
        const latest = readSnapshot(userId);
        if (latest)
          writeSnapshot(userId, {
            ...latest,
            pending: latest.pending.filter((item) => item.id !== pending.id),
          });
        throw error;
      }
    },
    async syncPending() {
      if (!navigator.onLine) return readSnapshot(userId)?.state ?? null;
      if (!readSnapshot(userId)?.pending.length) return null;
      try {
        const synced = await flushPending();
        return synced.state;
      } catch (error) {
        if (retryable(error)) return null;
        throw error;
      }
    },
    pendingCount() {
      return readSnapshot(userId)?.pending.length ?? 0;
    },
    async importState(state) {
      const data = await apiRequest<{ state: UserState }>('/progress/import', {
        method: 'POST',
        body: JSON.stringify({ state }),
      });
      return normalizeState(data.state);
    },
    async reset(optimistic) {
      const resetAction: ProgressAction = { type: 'reset' };
      if (!optimistic) {
        const res = await apiRequest<{ state: UserState }>('/progress/reset', { method: 'POST' });
        return normalizeState(res.state);
      }
      const snapshot = readSnapshot(userId) ?? { state: optimistic, pending: [] };
      const reset = { id: newActionId(), action: resetAction };
      writeSnapshot(userId, { state: optimistic, pending: [...snapshot.pending, reset] });
      if (!navigator.onLine) return optimistic;
      try {
        const synced = await flushPending();
        return synced.state ?? optimistic;
      } catch (error) {
        if (retryable(error)) return optimistic;
        throw error;
      }
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
