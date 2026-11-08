import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRepo, CloudRepo, localRepo, ProgressAction, Repo } from '@/data/repo';
import { modules } from '@/lib/content';
import { applyCards, applyChapterRead, applyExam, applyQuiz, CardsInput, defaultState, ExamInput, isFresh, QuizInput } from '@/lib/progress';
import type { Summary, UserState } from '@/lib/types';
import { useAuth } from './AuthContext';

export type CelebrationEvent = { type: 'level'; level: number } | { type: 'badge'; id: string } | { type: 'goal' };

interface StoreApi {
  state: UserState;
  ready: boolean;
  online: boolean;
  pendingSync: number;
  syncError: string | null;
  events: CelebrationEvent[];
  dismissEvent(): void;
  chapterRead(moduleId: string, chapterId: string): Promise<Summary | null>;
  finishQuiz(inp: QuizInput): Promise<Summary>;
  finishExam(inp: ExamInput): Promise<Summary>;
  finishCards(inp: CardsInput): Promise<Summary>;
  resetProgress(): Promise<void>;
}

const Ctx = createContext<StoreApi | null>(null);
const ctx = { modules };

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<UserState>(defaultState());
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const ref = useRef(state);
  const repoRef = useRef<Repo | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const syncTimer = useRef<number | undefined>(undefined);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (!dirty.current || !repoRef.current || repoRef.current.mode !== 'local') return;
    dirty.current = false;
    try {
      await repoRef.current.save(ref.current);
      setSyncError(null);
    } catch (e) {
      dirty.current = true;
      setSyncError(e instanceof Error ? e.message : 'Synchronisation impossible');
    }
  }, []);

  const schedule = useCallback(() => {
    dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 700);
  }, [flush]);

  // Chargement quand l'utilisateur change
  useEffect(() => {
    let alive = true;
    if (repoRef.current?.mode === 'local' && dirty.current) void flush();
    setReady(false);
    dirty.current = false;
    if (!user) return;
    (async () => {
      const repo: Repo | CloudRepo = user.guest ? localRepo('guest') : apiRepo(user.id);
      repoRef.current = repo;
      let s: UserState | null = null;
      try {
        s = await repo.load();
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Chargement impossible');
      }
      if (!user.guest && (!s || isFresh(s))) {
        // première connexion : on récupère la progression faite en invité, si elle existe
        const guest = await localRepo('guest').load();
        if (guest && !isFresh(guest)) {
          try {
            s = await (repo as CloudRepo).importState(guest);
          } catch (e) {
            if (e instanceof Error && e.message.includes('existe déjà')) {
              try { s = await repo.load(); } catch (loadError) {
                setSyncError(loadError instanceof Error ? loadError.message : 'Chargement impossible');
              }
            } else {
              setSyncError(e instanceof Error ? e.message : 'Import de la progression impossible');
            }
          }
        }
      }
      if (!alive) return;
      const st = s ?? defaultState();
      setPendingSync(repo.mode === 'cloud' ? (repo as CloudRepo).pendingCount() : 0);
      ref.current = st;
      setState(st);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [user, flush]);

  // Sauvegarde à la fermeture de la page
  useEffect(() => {
    const h = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', h);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', h);
      window.removeEventListener('pagehide', flush);
    };
  }, [flush]);

  const commit = useCallback(
    (res: { state: UserState; summary: Summary | null }, persist = true) => {
      ref.current = res.state;
      setState(res.state);
      if (persist) schedule();
      if (res.summary) {
        const ev: CelebrationEvent[] = [];
        if (res.summary.levelUp) ev.push({ type: 'level', level: res.summary.newLevel });
        res.summary.newBadges.forEach((id) => ev.push({ type: 'badge', id }));
        if (ev.length) setEvents((e) => [...e, ...ev]);
      }
      return res.summary;
    },
    [schedule],
  );

  const dispatch = useCallback(async (
    action: ProgressAction,
    localResult: () => { state: UserState; summary: Summary | null },
  ) => {
    if (user?.guest) return commit(localResult());
    const repo = repoRef.current as CloudRepo | null;
    if (!repo?.applyAction) throw new Error('La connexion au service de progression est indisponible.');
    const optimistic = localResult();
    try {
      const result = await repo.applyAction(action, optimistic);
      setPendingSync(repo.pendingCount());
      if (repo.pendingCount() === 0) setSyncError(null);
      return commit(result, false);
    } catch (error) {
      setPendingSync(repo.pendingCount());
      setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible');
      throw error;
    }
  }, [commit, user]);

  const syncPendingActions = useCallback(async () => {
    window.clearTimeout(syncTimer.current);
    const repo = repoRef.current as CloudRepo | null;
    if (!repo?.syncPending || !navigator.onLine) return;
    try {
      const syncedState = await repo.syncPending();
      const remaining = repo.pendingCount();
      setPendingSync(remaining);
      if (syncedState) {
        ref.current = syncedState;
        setState(syncedState);
      }
      if (remaining > 0) syncTimer.current = window.setTimeout(syncPendingActions, 5000);
      else setSyncError(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible');
    }
  }, []);

  useEffect(() => {
    const onOffline = () => setOnline(false);
    const onOnline = () => {
      setOnline(true);
      void syncPendingActions();
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearTimeout(syncTimer.current);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [syncPendingActions]);

  useEffect(() => {
    if (online && pendingSync > 0) void syncPendingActions();
    return () => window.clearTimeout(syncTimer.current);
  }, [online, pendingSync, syncPendingActions]);

  const api = useMemo<StoreApi>(
    () => ({
      state, ready, online, pendingSync, syncError, events,
      dismissEvent: () => setEvents((e) => e.slice(1)),
      chapterRead: async (moduleId, chapterId) => dispatch(
        { type: 'chapter-read', moduleId, chapterId },
        () => applyChapterRead(ref.current, ctx, moduleId, chapterId),
      ),
      finishQuiz: async (input) => {
        const result = await dispatch(
          {
            type: 'quiz', moduleId: input.moduleId, kind: input.kind, label: input.label,
            results: input.results.map(({ id, answerIndex, elapsedSeconds }) => ({ id, answerIndex, elapsedSeconds })),
          },
          () => applyQuiz(ref.current, ctx, input),
        );
        if (!result) throw new Error('Résultat de quiz manquant.');
        return result;
      },
      finishExam: async (input) => {
        const result = await dispatch(
          { type: 'exam', moduleId: input.moduleId, n: input.n, score: input.score },
          () => applyExam(ref.current, ctx, input),
        );
        if (!result) throw new Error('Résultat d’épreuve manquant.');
        return result;
      },
      finishCards: async (input) => {
        const result = await dispatch(
          { type: 'cards', moduleId: input.moduleId, known: input.known, unknown: input.unknown },
          () => applyCards(ref.current, ctx, input),
        );
        if (!result) throw new Error('Résultat de cartes manquant.');
        return result;
      },
      resetProgress: async () => {
        if (user?.guest) commit({ state: defaultState(), summary: null });
        else {
          const repo = repoRef.current as CloudRepo | null;
          if (!repo?.reset) throw new Error('La connexion au service de progression est indisponible.');
          const resetState = await repo.reset(defaultState());
          setPendingSync(repo.pendingCount());
          commit({ state: resetState, summary: null }, false);
        }
      },
    }),
    [state, ready, online, pendingSync, syncError, events, commit, dispatch, user],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore hors StoreProvider');
  return v;
}
