/**
 * Couche de communication avec le backend Express (/api) et Supabase.
 * Authentification Bearer Token avec rafraîchissement automatique,
 * persistance garantie dans Supabase (user_state & profiles) + cache hors-ligne.
 */
import { levelFromXp } from '@/lib/gamification';
import { normalizeFiliere, normalizeState, themeForFiliere } from '@/lib/progress';
import type { BackendThemeId, FiliereId, Summary, UserState } from '@/lib/types';
import { API_BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabase';

export const AUTH_TOKEN_KEY = 'akademia:token';
export const REFRESH_TOKEN_KEY = 'akademia:refresh_token';
export const AUTH_USER_KEY = 'akademia:user';

export interface StoredUser {
  id: string;
  email?: string;
  username: string;
  filiere?: FiliereId | null;
  theme?: BackendThemeId;
}

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

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | null): void {
  try {
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    /* ignore */
  }
}

function supabaseHeaders(): Record<string, string> {
  if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('VOTRE-PROJET')) {
    return {
      'x-supabase-url': SUPABASE_URL,
      'x-supabase-anon-key': SUPABASE_ANON_KEY,
    };
  }
  return {};
}

export async function getAccessToken(): Promise<string> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.access_token) {
        setStoredToken(data.session.access_token);
        if (data.session.refresh_token) setStoredRefreshToken(data.session.refresh_token);
        return data.session.access_token;
      }
    } catch {
      /* fallback to stored token */
    }
  }
  const stored = getStoredToken();
  if (stored) return stored;
  throw new Error('Connecte-toi pour accéder aux données en ligne.');
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session?.access_token) {
          setStoredToken(data.session.access_token);
          if (data.session.refresh_token) setStoredRefreshToken(data.session.refresh_token);
          return data.session.access_token;
        }
      } catch {
        /* fallback to backend refresh */
      }
    }

    const rt = getStoredRefreshToken();
    if (!rt) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...supabaseHeaders(),
        },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        token?: string;
        refreshToken?: string;
        user?: StoredUser;
      };
      if (data.token) {
        setStoredToken(data.token);
        if (data.refreshToken) setStoredRefreshToken(data.refreshToken);
        if (data.user) setStoredUser(data.user);
        if (supabase && data.refreshToken) {
          await supabase.auth
            .setSession({ access_token: data.token, refresh_token: data.refreshToken })
            .catch(() => {});
        }
        return data.token;
      }
    } catch {
      /* ignore network error */
    }
    return null;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getStoredToken();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        token = data.session.access_token;
        setStoredToken(token);
        if (data.session.refresh_token) setStoredRefreshToken(data.session.refresh_token);
      }
    } catch {
      /* ignore */
    }
  }

  const doFetch = (authToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...supabaseHeaders(),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  };

  let res = await doFetch(token);

  if (
    res.status === 401 &&
    !path.startsWith('/auth/signin') &&
    !path.startsWith('/auth/signup') &&
    !path.startsWith('/auth/refresh')
  ) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }

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

interface PendingProgressAction {
  id: string;
  action: ProgressAction;
}

interface OfflineSnapshot {
  state: UserState;
  pending: PendingProgressAction[];
}

export const LAST_ACTIVE_STATE_KEY = 'akademia:last_active_state';

function snapshotKey(userId: string) {
  return `akademia:offline:${userId}`;
}

export function readSnapshot(userId: string): OfflineSnapshot | null {
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

export function writeSnapshot(userId: string, snapshot: OfflineSnapshot) {
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(snapshot));
    if (stateScore(snapshot.state) > 0) {
      localStorage.setItem(LAST_ACTIVE_STATE_KEY, JSON.stringify(snapshot.state));
    }
  } catch {
    /* quota or private browsing */
  }
}

/**
 * Récupère la progression locale la plus riche présente dans le navigateur,
 * y compris celle d'un ancien identifiant éphémère (`akademia:offline:u-*`),
 * d'une session invité (`akademia:state:guest`) ou du dernier état actif.
 */
function rescueLocalSnapshot(userId: string): OfflineSnapshot | null {
  const own = readSnapshot(userId);
  let bestState: UserState | null = own?.state ?? null;
  const mergedPending: PendingProgressAction[] = [...(own?.pending ?? [])];
  const seenPendingIds = new Set(mergedPending.map((p) => p.id));
  const orphanKeysToCleanup: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === snapshotKey(userId)) continue;

      if (key.startsWith('akademia:offline:')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as OfflineSnapshot;
        if (parsed?.state) {
          const candidate = normalizeState(parsed.state);
          if (stateScore(candidate) > stateScore(bestState)) {
            bestState = pickRicherState(bestState, candidate);
          }
          if (Array.isArray(parsed.pending)) {
            for (const item of parsed.pending) {
              if (item?.id && !seenPendingIds.has(item.id)) {
                seenPendingIds.add(item.id);
                mergedPending.push(item);
              }
            }
          }
          if (key.startsWith('akademia:offline:u-') || key === 'akademia:offline:me') {
            orphanKeysToCleanup.push(key);
          }
        }
      } else if (key === LAST_ACTIVE_STATE_KEY || key === 'akademia:state:guest') {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const candidate = normalizeState(JSON.parse(raw));
        if (stateScore(candidate) > stateScore(bestState)) {
          bestState = pickRicherState(bestState, candidate);
        }
      }
    }

    if (bestState && userId && userId !== 'guest' && userId !== 'me') {
      for (const orphanKey of orphanKeysToCleanup) {
        localStorage.removeItem(orphanKey);
      }
    }
  } catch {
    /* ignore localStorage iteration errors */
  }

  if (!bestState && mergedPending.length === 0) return null;
  const rescued: OfflineSnapshot = {
    state: normalizeState(bestState),
    pending: mergedPending,
  };
  if (userId && (!own || stateScore(rescued.state) > stateScore(own.state) || mergedPending.length > (own?.pending.length ?? 0))) {
    writeSnapshot(userId, rescued);
  }
  return rescued;
}

function stateScore(s: UserState | null | undefined): number {
  if (!s) return -1;
  const chapters = Object.values(s.chaptersRead || {}).reduce((acc, list) => acc + list.length, 0);
  const attempts = Array.isArray(s.attempts) ? s.attempts.length : 0;
  const exams = Object.keys(s.examBest || {}).length;
  const reviews = Object.keys(s.review || {}).length;
  return (s.xp || 0) * 1000 + chapters * 100 + attempts * 10 + exams * 50 + reviews;
}

function pickRicherState(a: UserState | null, b: UserState | null): UserState {
  if (!a && !b) return normalizeState(null);
  if (!a) return normalizeState(b);
  if (!b) return normalizeState(a);
  const primary = stateScore(a) >= stateScore(b) ? a : b;
  const secondary = primary === a ? b : a;
  const filiere = normalizeFiliere(primary.filiere ?? secondary.filiere);
  return normalizeState({
    ...primary,
    filiere,
    theme: themeForFiliere(filiere),
  });
}

export async function saveStateToSupabaseDirect(userId: string, state: UserState): Promise<void> {
  if (!supabase || !userId || userId === 'guest' || userId === 'me') return;
  const normalized = normalizeState(state);
  const now = new Date().toISOString();
  try {
    await supabase.from('user_state').upsert(
      {
        user_id: userId,
        state: normalized,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    );
  } catch {
    /* ignore */
  }
  try {
    const patch: Record<string, unknown> = {
      xp: normalized.xp,
      level: levelFromXp(normalized.xp),
      streak: normalized.streak,
      updated_at: now,
    };
    if (normalized.filiere) patch.filiere = normalized.filiere;
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error && patch.filiere) {
      delete patch.filiere;
      await supabase.from('profiles').update(patch).eq('id', userId);
    }
  } catch {
    /* ignore */
  }
}

export async function loadStateFromSupabaseDirect(userId: string): Promise<UserState | null> {
  if (!supabase || !userId || userId === 'guest' || userId === 'me') return null;
  try {
    const [stateRes, profileRes] = await Promise.all([
      supabase.from('user_state').select('state').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('filiere').eq('id', userId).maybeSingle(),
    ]);
    const rawState = stateRes.data?.state;
    const profileFiliere = normalizeFiliere(
      (profileRes.data as { filiere?: string } | null)?.filiere,
    );
    if (!rawState && !profileFiliere) return null;
    const normalized = normalizeState(rawState);
    const resolvedFiliere = normalizeFiliere(normalized.filiere ?? profileFiliere);
    if (resolvedFiliere) {
      normalized.filiere = resolvedFiliere;
      normalized.theme = themeForFiliere(resolvedFiliere);
    }
    return normalized;
  } catch {
    return null;
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
  | { type: 'formation-lesson'; moduleId: string; formationId: string; lessonId: string }
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
        const mergedState = pending.length
          ? latest.state
          : pickRicherState(normalizeState(result.state), latest.state);
        snapshot = {
          state: mergedState,
          pending,
        };
        writeSnapshot(userId, snapshot);
        await saveStateToSupabaseDirect(userId, mergedState);
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
      const existing = rescueLocalSnapshot(userId);
      if (existing?.pending.length && navigator.onLine) {
        try {
          await flushPending();
        } catch {
          /* will retry later */
        }
      }

      const [apiResult, directState] = await Promise.all([
        apiRequest<{ state?: UserState }>('/progress')
          .then((d) => (d?.state ? normalizeState(d.state) : null))
          .catch(() => null),
        loadStateFromSupabaseDirect(userId),
      ]);

      const latestSnapshot = rescueLocalSnapshot(userId);
      const bestRemote = pickRicherState(apiResult, directState);
      const bestOverall = pickRicherState(bestRemote, latestSnapshot?.state ?? null);

      if (apiResult === null && directState === null && !latestSnapshot) {
        throw new Error('Chargement impossible depuis le serveur');
      }

      writeSnapshot(userId, {
        state: bestOverall,
        pending: latestSnapshot?.pending ?? [],
      });

      if (stateScore(bestOverall) > stateScore(directState)) {
        void saveStateToSupabaseDirect(userId, bestOverall);
      }
      if (stateScore(bestOverall) > stateScore(apiResult)) {
        void apiRequest('/progress/sync', {
          method: 'POST',
          body: JSON.stringify({ state: bestOverall }),
        }).catch(() => {});
      }

      return bestOverall;
    },
    async save(state) {
      const normalized = normalizeState(state);
      const existing = readSnapshot(userId);
      writeSnapshot(userId, { state: normalized, pending: existing?.pending ?? [] });
      await Promise.all([
        saveStateToSupabaseDirect(userId, normalized),
        apiRequest('/progress/sync', {
          method: 'POST',
          body: JSON.stringify({ state: normalized }),
        }).catch(() => {}),
      ]);
    },
    async applyAction(action, optimistic) {
      const actionId = newActionId();
      if (!optimistic) {
        const res = await apiRequest<{ state: UserState; summary: Summary | null }>(
          '/progress/actions',
          {
            method: 'POST',
            body: JSON.stringify({ actionId, action }),
          },
        );
        const normalized = normalizeState(res.state);
        writeSnapshot(userId, { state: normalized, pending: [] });
        await saveStateToSupabaseDirect(userId, normalized);
        return { state: normalized, summary: res.summary };
      }

      const snapshot = readSnapshot(userId) ?? { state: optimistic.state, pending: [] };
      const pending = { id: actionId, action };
      const next = { state: optimistic.state, pending: [...snapshot.pending, pending] };
      writeSnapshot(userId, next);
      await saveStateToSupabaseDirect(userId, optimistic.state);

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
        if (latest) {
          writeSnapshot(userId, {
            ...latest,
            pending: latest.pending.filter((item) => item.id !== pending.id),
          });
        }
        return optimistic;
      }
    },
    async syncPending() {
      if (!navigator.onLine) return readSnapshot(userId)?.state ?? null;
      const current = readSnapshot(userId);
      if (!current?.pending.length) return null;
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
      const normalized = normalizeState(data.state);
      writeSnapshot(userId, { state: normalized, pending: [] });
      await saveStateToSupabaseDirect(userId, normalized);
      return normalized;
    },
    async reset(optimistic) {
      const resetAction: ProgressAction = { type: 'reset' };
      const fallbackState = normalizeState(optimistic);
      writeSnapshot(userId, { state: fallbackState, pending: [] });
      await saveStateToSupabaseDirect(userId, fallbackState);
      if (!navigator.onLine) return fallbackState;
      try {
        const res = await apiRequest<{ state: UserState }>('/progress/reset', { method: 'POST' });
        const normalized = normalizeState(res.state);
        writeSnapshot(userId, { state: normalized, pending: [] });
        await saveStateToSupabaseDirect(userId, normalized);
        return normalized;
      } catch {
        const snapshot = readSnapshot(userId) ?? { state: fallbackState, pending: [] };
        const reset = { id: newActionId(), action: resetAction };
        writeSnapshot(userId, { state: fallbackState, pending: [...snapshot.pending, reset] });
        return fallbackState;
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
  try {
    const rows = await apiRequest<LeaderRow[]>(
      `/leaderboard?limit=${encodeURIComponent(String(limit))}`,
    );
    if (Array.isArray(rows) && rows.length > 0) return rows;
  } catch {
    /* fallback to direct Supabase query if available */
  }
  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, filiere, xp, level, streak')
        .order('xp', { ascending: false })
        .limit(limit);
      if (data) {
        return data.map((r) => ({
          id: String(r.id),
          username: String(r.username || 'Étudiant'),
          filiere: normalizeFiliere(r.filiere) ?? 'ARI',
          xp: Number(r.xp) || 0,
          level: Number(r.level) || levelFromXp(Number(r.xp) || 0),
          streak: Number(r.streak) || 0,
        }));
      }
    } catch {
      /* ignore */
    }
  }
  return [];
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
