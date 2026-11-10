import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRepo, CloudRepo, ProgressAction } from '@/data/repo';
import { modules } from '@/lib/content';
import {
  applyCards,
  applyChapterRead,
  applyExam,
  applyFormationLesson,
  applyQuiz,
  applySetFiliere,
  CardsInput,
  defaultState,
  ExamInput,
  QuizInput,
  themeForFiliere,
} from '@/lib/progress';
import type { FiliereId, Formation, Summary, UserState } from '@/lib/types';
import { useAuth } from './AuthContext';

export type CelebrationEvent =
  | { type: 'level'; level: number }
  | { type: 'badge'; id: string }
  | { type: 'goal' };

interface StoreApi {
  state: UserState;
  ready: boolean;
  online: boolean;
  pendingSync: number;
  syncError: string | null;
  events: CelebrationEvent[];
  dismissEvent(): void;
  setUserFiliere(filiere: FiliereId): Promise<void>;
  chapterRead(moduleId: string, chapterId: string): Promise<Summary | null>;
  finishFormationLesson(f: Formation, lessonId: string): Promise<Summary | null>;
  finishQuiz(inp: QuizInput): Promise<Summary>;
  finishExam(inp: ExamInput): Promise<Summary>;
  finishCards(inp: CardsInput): Promise<Summary>;
  resetProgress(): Promise<void>;
}

const Ctx = createContext<StoreApi | null>(null);
const progressCtx = { modules };

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<UserState>(defaultState());
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const ref = useRef(state);
  const repoRef = useRef<CloudRepo | null>(null);
  const syncTimer = useRef<number | undefined>(undefined);

  // Chargement depuis le backend & Supabase quand l'utilisateur connecté change
  useEffect(() => {
    let alive = true;
    setReady(false);
    if (!user) {
      const empty = defaultState();
      ref.current = empty;
      setState(empty);
      return;
    }
    (async () => {
      const repo = apiRepo(user.id);
      repoRef.current = repo;
      let s: UserState | null = null;
      try {
        s = await repo.load();
        setSyncError(null);
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Chargement impossible depuis le serveur');
      }
      if (!alive) return;
      let st = s ?? defaultState();
      if (!st.filiere && user.filiere) {
        st = { ...st, filiere: user.filiere, theme: themeForFiliere(user.filiere) };
        if (repo.save) void repo.save(st);
      }
      setPendingSync(repo.pendingCount ? repo.pendingCount() : 0);
      ref.current = st;
      setState(st);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const commit = useCallback((res: { state: UserState; summary: Summary | null }) => {
    ref.current = res.state;
    setState(res.state);
    if (res.summary) {
      const ev: CelebrationEvent[] = [];
      if (res.summary.levelUp) ev.push({ type: 'level', level: res.summary.newLevel });
      res.summary.newBadges.forEach((id) => ev.push({ type: 'badge', id }));
      if (ev.length) setEvents((e) => [...e, ...ev]);
    }
    return res.summary;
  }, []);

  const dispatch = useCallback(
    async (
      action: ProgressAction,
      localResult: () => { state: UserState; summary: Summary | null },
    ) => {
      const repo = repoRef.current ?? apiRepo(user?.id ?? 'me');
      repoRef.current = repo;
      const optimistic = localResult();
      try {
        const result = await repo.applyAction(action, optimistic);
        const remaining = repo.pendingCount ? repo.pendingCount() : 0;
        setPendingSync(remaining);
        if (remaining === 0) setSyncError(null);
        return commit(result);
      } catch (error) {
        setPendingSync(repo.pendingCount ? repo.pendingCount() : 0);
        setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible');
        return commit(optimistic);
      }
    },
    [commit, user?.id],
  );

  const syncPendingActions = useCallback(async () => {
    window.clearTimeout(syncTimer.current);
    const repo = repoRef.current as CloudRepo | null;
    if (!repo?.syncPending || !navigator.onLine) return;
    try {
      const syncedState = await repo.syncPending();
      const remaining = repo.pendingCount ? repo.pendingCount() : 0;
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
      state,
      ready,
      online,
      pendingSync,
      syncError,
      events,
      dismissEvent: () => setEvents((e) => e.slice(1)),
      setUserFiliere: async (filiere) => {
        await dispatch(
          { type: 'set-filiere', filiere },
          () => applySetFiliere(ref.current, filiere),
        );
      },
      chapterRead: async (moduleId, chapterId) =>
        dispatch(
          { type: 'chapter-read', moduleId, chapterId },
          () => applyChapterRead(ref.current, progressCtx, moduleId, chapterId),
        ),
      finishFormationLesson: async (f, lessonId) =>
        dispatch(
          { type: 'formation-lesson', moduleId: f.moduleId, formationId: f.id, lessonId },
          () => applyFormationLesson(ref.current, progressCtx, f, lessonId),
        ),
      finishQuiz: async (input) => {
        const result = await dispatch(
          {
            type: 'quiz',
            moduleId: input.moduleId,
            kind: input.kind,
            label: input.label,
            results: input.results.map(({ id, answerIndex, elapsedSeconds }) => ({
              id,
              answerIndex,
              elapsedSeconds,
            })),
          },
          () => applyQuiz(ref.current, progressCtx, input),
        );
        if (!result) throw new Error('Résultat de quiz manquant.');
        return result;
      },
      finishExam: async (input) => {
        const result = await dispatch(
          {
            type: 'exam',
            moduleId: input.moduleId,
            n: input.n,
            score: input.score,
          },
          () => applyExam(ref.current, progressCtx, input),
        );
        if (!result) throw new Error('Résultat d’épreuve manquant.');
        return result;
      },
      finishCards: async (input) => {
        const result = await dispatch(
          {
            type: 'cards',
            moduleId: input.moduleId,
            known: input.known,
            unknown: input.unknown,
          },
          () => applyCards(ref.current, progressCtx, input),
        );
        if (!result) throw new Error('Résultat de cartes manquant.');
        return result;
      },
      resetProgress: async () => {
        const repo = repoRef.current ?? apiRepo(user?.id ?? 'me');
        const currentFiliere = ref.current.filiere ?? user?.filiere ?? 'ARI';
        const empty = {
          ...defaultState(),
          filiere: currentFiliere,
          theme: themeForFiliere(currentFiliere),
        };
        const resetState = await repo.reset(empty);
        setPendingSync(repo.pendingCount ? repo.pendingCount() : 0);
        commit({ state: resetState, summary: null });
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
