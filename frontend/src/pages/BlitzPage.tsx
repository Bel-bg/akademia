import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Play, Sparkles } from '@getpapillon/papicons';
import QuizSession, { QuizResult } from '@/components/QuizSession';
import SummaryCard from '@/components/SummaryCard';
import { PageTitle, Spinner } from '@/components/ui';
import { getModule, loadQuiz } from '@/lib/content';
import { SQ, toSession } from '@/lib/quiz';
import type { Summary } from '@/lib/types';
import { shuffle } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { useAuth } from '@/state/AuthContext';
import { Mascot } from '@/components/Mascot';

interface SavedBlitzPage {
  qs: SQ[] | null;
  phase: 'intro' | 'play' | 'done';
  sum: Summary | null;
  game: number;
}

function readSavedBlitz(key: string): SavedBlitzPage | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedBlitzPage) : null;
  } catch {
    return null;
  }
}

export default function BlitzPage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { user } = useAuth();
  const { state, finishQuiz } = useStore();
  const pageSessionKey = `akademia:blitz:${user?.id ?? 'guest'}:${moduleId ?? 'unknown'}`;
  const [savedPage] = useState(() => readSavedBlitz(pageSessionKey));
  const [qs, setQs] = useState<SQ[] | null>(savedPage?.qs ?? null);
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>(savedPage?.phase ?? 'intro');
  const [sum, setSum] = useState<Summary | null>(savedPage?.sum ?? null);
  const [game, setGame] = useState(savedPage?.game ?? 0);

  useEffect(() => {
    if (m && !qs) loadQuiz(m.id).then((p) => setQs(shuffle(p).map(toSession)));
  }, [m, game, qs]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        pageSessionKey,
        JSON.stringify({ qs, phase, sum, game } satisfies SavedBlitzPage),
      );
    } catch {
      /* sessionStorage can be disabled or full */
    }
  }, [pageSessionKey, qs, phase, sum, game]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!qs) return <Spinner />;

  if (phase === 'play')
    return (
      <QuizSession
        key={game}
        questions={qs}
        storageKey={`${pageSessionKey}:attempt:${game}`}
        lives={3}
        timeLimit={90}
        chapterTitle={(id) => m.chapters.find((c) => c.id === id)?.title ?? ''}
        onFinish={async (r: QuizResult) => {
          try {
            if (r.results.length)
              setSum(
                await finishQuiz({
                  moduleId: m.id,
                  kind: 'blitz',
                  label: 'Défi éclair',
                  results: r.results,
                  answerXp: r.answerXp,
                  maxCombo: r.maxCombo,
                }),
              );
            else
              setSum({
                xp: 0,
                lines: [],
                levelUp: false,
                prevLevel: 0,
                newLevel: 0,
                newBadges: [],
                score: 0,
                max: 0,
              });
            setPhase('done');
          } catch (error) {
            window.alert(
              error instanceof Error ? error.message : 'Impossible d’enregistrer le résultat.',
            );
            setQs(null);
            setGame((value) => value + 1);
            setPhase('intro');
          }
        }}
      />
    );

  if (phase === 'done' && sum)
    return (
      <SummaryCard
        s={sum}
        title="Défi éclair terminé"
        mentionOn={false}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary btn-lg flex-1"
              onClick={() => {
                setQs(null);
                setGame((g) => g + 1);
                setPhase('intro');
              }}
            >
              Retenter
            </button>
            <Link to={`/m/${m.id}`} className="btn btn-soft btn-lg">
              Module
            </Link>
          </>
        }
      />
    );

  return (
    <>
      <PageTitle title="Défi éclair" sub={m.title} icon={<Sparkles size={30} />} />
      <div className="card mx-auto flex max-w-xl flex-col items-center p-8 text-center">
        <Mascot mood="determined" size={160} />
        <h2 className="h-display mt-3 text-3xl">90 secondes, 3 vies</h2>
        <p className="mt-2 max-w-md text-sm font-semibold text-muted">
          Réponds à un maximum de questions avant la fin du décompte. Chaque erreur coûte une vie ;
          les combos rapides rapportent un bonus d’XP massif !
        </p>
        <div className="mt-4 rounded-full bg-soft px-4 py-1.5 text-xs font-extrabold text-brand">
          Ton record : {state.counters.blitzBest} bonnes réponses
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-6 w-full max-w-xs"
          onClick={() => setPhase('play')}
        >
          <Play size={18} /> Lancer le chrono
        </button>
      </div>
    </>
  );
}
