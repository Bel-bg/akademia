import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { localRepo, Repo, supabaseRepo } from '@/data/repo';
import { modules } from '@/lib/content';
import { applyCards, applyChapterRead, applyExam, applyQuiz, CardsInput, defaultState, ExamInput, isFresh, QuizInput } from '@/lib/progress';
import type { Summary, UserState } from '@/lib/types';
import { useAuth } from './AuthContext';

export type CelebrationEvent = { type: 'level'; level: number } | { type: 'badge'; id: string } | { type: 'goal' };

interface StoreApi {
  state: UserState;
  ready: boolean;
  syncError: string | null;
  events: CelebrationEvent[];
  dismissEvent(): void;
  chapterRead(moduleId: string, chapterId: string): Summary | null;
  finishQuiz(inp: QuizInput): Summary;
  finishExam(inp: ExamInput): Summary;
  finishCards(inp: CardsInput): Summary;
  resetProgress(): void;
}

const Ctx = createContext<StoreApi | null>(null);
const ctx = { modules };

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<UserState>(defaultState());
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const ref = useRef(state);
  const repoRef = useRef<Repo | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (!dirty.current || !repoRef.current) return;
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
    setReady(false);
    if (!user) return;
    (async () => {
      const repo: Repo = user.guest ? localRepo('guest') : supabaseRepo(user.id);
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
          s = guest;
          dirty.current = true;
        }
      }
      if (!alive) return;
      const st = s ?? defaultState();
      ref.current = st;
      setState(st);
      setReady(true);
      if (dirty.current) flush();
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
    (res: { state: UserState; summary: Summary | null }) => {
      ref.current = res.state;
      setState(res.state);
      schedule();
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

  const api = useMemo<StoreApi>(
    () => ({
      state, ready, syncError, events,
      dismissEvent: () => setEvents((e) => e.slice(1)),
      chapterRead: (m, c) => commit(applyChapterRead(ref.current, ctx, m, c)),
      finishQuiz: (i) => commit(applyQuiz(ref.current, ctx, i)) as Summary,
      finishExam: (i) => commit(applyExam(ref.current, ctx, i)) as Summary,
      finishCards: (i) => commit(applyCards(ref.current, ctx, i)) as Summary,
      resetProgress: () => commit({ state: defaultState(), summary: null }),
    }),
    [state, ready, syncError, events, commit],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore hors StoreProvider');
  return v;
}
