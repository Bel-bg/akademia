import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Play, Tasks } from '@getpapillon/papicons';
import QuizSession, { QuizResult } from '@/components/QuizSession';
import SummaryCard from '@/components/SummaryCard';
import { Empty, PageTitle, Spinner } from '@/components/ui';
import { DifficultyStars } from '@/components/Decor';
import { getModule, loadQuiz } from '@/lib/content';
import { dueQuestionIds } from '@/lib/progress';
import { buildQuiz, SQ, toSession } from '@/lib/quiz';
import type { Question, Summary } from '@/lib/types';
import { cn, shuffle } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { useAuth } from '@/state/AuthContext';

type Phase =
  | { t: 'setup' }
  | { t: 'play'; qs: SQ[]; label: string; kind: 'qcm' | 'review' }
  | { t: 'done'; s: Summary; wrong: number };

interface SavedQuizPage {
  phase: Phase;
  key: number;
}

function readSavedPage(key: string): SavedQuizPage | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedQuizPage) : null;
  } catch {
    return null;
  }
}

export default function QuizPage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { state, finishQuiz } = useStore();
  const pageSessionKey = `akademia:quiz:${user?.id ?? 'guest'}:${moduleId ?? 'unknown'}`;
  const [savedPage] = useState(() => readSavedPage(pageSessionKey));
  const [pool, setPool] = useState<Question[] | null>(null);
  const [phase, setPhase] = useState<Phase>(savedPage?.phase ?? { t: 'setup' });
  const [chapters, setChapters] = useState<string[]>(() =>
    params.get('chap') ? [params.get('chap')!] : [],
  );
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3>(0);
  const [count, setCount] = useState(10);
  const [key, setKey] = useState(savedPage?.key ?? 0);

  useEffect(() => {
    if (phase.t === 'setup') {
      sessionStorage.removeItem(pageSessionKey);
      return;
    }
    try {
      sessionStorage.setItem(
        pageSessionKey,
        JSON.stringify({ phase, key } satisfies SavedQuizPage),
      );
    } catch {
      /* sessionStorage can be disabled or full */
    }
  }, [pageSessionKey, phase, key]);

  useEffect(() => {
    if (m) loadQuiz(m.id).then(setPool);
  }, [m]);

  const due = useMemo(() => (m ? dueQuestionIds(state, m.id) : []), [state, m]);

  useEffect(() => {
    if (params.get('mode') === 'review' && pool && m && phase.t === 'setup') {
      const ids = new Set(due);
      const qs = shuffle(pool.filter((q) => ids.has(q.id)))
        .slice(0, 15)
        .map(toSession);
      if (qs.length) setPhase({ t: 'play', qs, label: 'Révision espacée', kind: 'review' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!pool) return <Spinner />;

  const available = pool.filter(
    (q) =>
      (!chapters.length || chapters.includes(q.chapter)) &&
      (!difficulty || q.difficulty === difficulty),
  ).length;
  const toggle = (id: string) =>
    setChapters((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const start = () => {
    const qs = buildQuiz(pool, { chapters, difficulty, count });
    if (!qs.length) return;
    const label =
      chapters.length === 1
        ? `QCM · ${m.chapters.find((c) => c.id === chapters[0])?.title}`
        : chapters.length
          ? `QCM · ${chapters.length} chapitres`
          : 'QCM · tous les chapitres';
    setPhase({ t: 'play', qs, label, kind: 'qcm' });
  };

  const startReview = () => {
    const ids = new Set(due);
    const qs = shuffle(pool.filter((q) => ids.has(q.id)))
      .slice(0, 15)
      .map(toSession);
    if (qs.length) setPhase({ t: 'play', qs, label: 'Révision espacée', kind: 'review' });
  };

  if (phase.t === 'play') {
    const p = phase;
    return (
      <QuizSession
        key={key}
        questions={p.qs}
        storageKey={`${pageSessionKey}:attempt:${key}`}
        chapterTitle={(id) => m.chapters.find((c) => c.id === id)?.title ?? ''}
        onFinish={async (r: QuizResult) => {
          try {
            const s = await finishQuiz({
              moduleId: m.id,
              kind: p.kind,
              label: p.label,
              results: r.results,
              answerXp: r.answerXp,
              maxCombo: r.maxCombo,
            });
            setPhase({ t: 'done', s, wrong: r.results.filter((x) => !x.correct).length });
          } catch (error) {
            window.alert(
              error instanceof Error ? error.message : 'Impossible d’enregistrer le résultat.',
            );
            setKey((value) => value + 1);
            setPhase({ t: 'setup' });
          }
        }}
      />
    );
  }

  if (phase.t === 'done') {
    return (
      <SummaryCard
        s={phase.s}
        title="Résultat du QCM"
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary btn-lg flex-1"
              onClick={() => {
                setKey((k) => k + 1);
                setPhase({ t: 'setup' });
              }}
            >
              Continuer
            </button>
            <Link to={`/m/${m.id}`} className="btn btn-soft btn-lg">
              Module
            </Link>
          </>
        }
      />
    );
  }

  return (
    <>
      <PageTitle
        title="QCM interactif"
        sub={`${m.title} · ${pool.length} questions disponibles`}
        icon={<Tasks size={30} />}
      />

      {due.length > 0 && (
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 border-2 border-brand/25 bg-soft/60 p-4">
          <div>
            <b className="font-display text-lg">
              {due.length} question{due.length > 1 ? 's' : ''} à réviser
            </b>
            <div className="text-xs font-bold text-muted">
              Celles que tu as ratées reviennent à intervalles croissants.
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={startReview}>
            Lancer la révision
          </button>
        </div>
      )}

      <div className="card space-y-6 p-6">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Chapitres</h2>
            <button
              type="button"
              className="text-xs font-extrabold text-brand underline"
              onClick={() => setChapters([])}
            >
              Tous les chapitres
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {m.chapters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  'chip !py-1.5 !text-xs transition',
                  chapters.includes(c.id) ? 'bg-brand text-white shadow-sm' : 'hover:brightness-95',
                )}
              >
                {c.number} {c.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2.5 font-display text-lg font-extrabold">Difficulté</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                [0, 'Mixte'],
                [1, 'Facile'],
                [2, 'Moyen'],
                [3, 'Difficile'],
              ] as const
            ).map(([d, l]) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={cn(
                  'chip !py-1.5 !text-xs transition',
                  difficulty === d ? 'bg-brand text-white shadow-sm' : 'hover:brightness-95',
                )}
              >
                {d > 0 && <DifficultyStars level={d} max={d} size={12} />}
                <span>{l}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2.5 font-display text-lg font-extrabold">Nombre de questions</h2>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={cn(
                  'chip !px-5 !py-1.5 !text-xs transition',
                  count === n ? 'bg-brand text-white shadow-sm' : 'hover:brightness-95',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {available === 0 ? (
          <Empty mood="surprised" title="Aucune question avec ces filtres" />
        ) : (
          <button type="button" className="btn btn-primary btn-lg w-full" onClick={start}>
            <Play size={18} /> C’est parti ({Math.min(count, available)} questions)
          </button>
        )}
      </div>
    </>
  );
}
