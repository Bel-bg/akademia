import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRepo, CloudRepo, ProgressAction } from '@/data/repo';
import { defaultState, CardsInput, ExamInput, QuizInput, themeForFiliere } from '@/lib/progress';
import type { FiliereId, Summary, UserState } from '@/lib/types';
import { useAuth } from './AuthContext';

export type CelebrationEvent = { type: 'level'; level: number } | { type: 'badge'; id: string } | { type: 'goal' };

interface StoreApi {
  state: UserState;
  ready: boolean;
  syncError: string | null;
  events: CelebrationEvent[];
  dismissEvent(): void;
  setUserFiliere(filiere: FiliereId): Promise<void>;
  chapterRead(moduleId: string, chapterId: string): Promise<Summary | null>;
  finishQuiz(inp: QuizInput): Promise<Summary>;
  finishExam(inp: ExamInput): Promise<Summary>;
  finishCards(inp: CardsInput): Promise<Summary>;
  resetProgress(): Promise<void>;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<UserState>(defaultState());
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const ref = useRef(state);
  const repoRef = useRef<CloudRepo | null>(null);

  // Chargement depuis le backend quand l'utilisateur connecté change
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
      const repo = apiRepo();
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
      }
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
    async (action: ProgressAction) => {
      const repo = repoRef.current ?? apiRepo();
      repoRef.current = repo;
      try {
        const result = await repo.applyAction(action);
        setSyncError(null);
        return commit(result);
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible');
        throw error;
      }
    },
    [commit],
  );

  const api = useMemo<StoreApi>(
    () => ({
      state,
      ready,
      syncError,
      events,
      dismissEvent: () => setEvents((e) => e.slice(1)),
      setUserFiliere: async (filiere) => {
        await dispatch({ type: 'set-filiere', filiere });
      },
      chapterRead: async (moduleId, chapterId) =>
        dispatch({ type: 'chapter-read', moduleId, chapterId }),
      finishQuiz: async (input) => {
        const result = await dispatch({
          type: 'quiz',
          moduleId: input.moduleId,
          kind: input.kind,
          label: input.label,
          results: input.results.map(({ id, answerIndex, elapsedSeconds }) => ({
            id,
            answerIndex,
            elapsedSeconds,
          })),
        });
        if (!result) throw new Error('Résultat de quiz manquant.');
        return result;
      },
      finishExam: async (input) => {
        const result = await dispatch({
          type: 'exam',
          moduleId: input.moduleId,
          n: input.n,
          score: input.score,
        });
        if (!result) throw new Error('Résultat d’épreuve manquant.');
        return result;
      },
      finishCards: async (input) => {
        const result = await dispatch({
          type: 'cards',
          moduleId: input.moduleId,
          known: input.known,
          unknown: input.unknown,
        });
        if (!result) throw new Error('Résultat de cartes manquant.');
        return result;
      },
      resetProgress: async () => {
        const repo = repoRef.current ?? apiRepo();
        commit({ state: await repo.reset(), summary: null });
      },
    }),
    [state, ready, syncError, events, commit, dispatch],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore hors StoreProvider');
  return v;
}
