import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import QuizSession, { QuizResult } from '@/components/QuizSession';
import SummaryCard from '@/components/SummaryCard';
import { PageTitle, Spinner } from '@/components/ui';
import { getModule, loadQuiz } from '@/lib/content';
import { SQ, toSession } from '@/lib/quiz';
import type { Summary } from '@/lib/types';
import { shuffle } from '@/lib/utils';
import { useStore } from '@/state/Store';

export default function BlitzPage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { state, finishQuiz } = useStore();
  const [qs, setQs] = useState<SQ[] | null>(null);
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [sum, setSum] = useState<Summary | null>(null);
  const [game, setGame] = useState(0);

  useEffect(() => {
    if (m) loadQuiz(m.id).then((p) => setQs(shuffle(p).map(toSession)));
  }, [m, game]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!qs) return <Spinner />;

  if (phase === 'play')
    return (
      <QuizSession
        key={game}
        questions={qs}
        lives={3}
        timeLimit={90}
        chapterTitle={(id) => m.chapters.find((c) => c.id === id)?.title ?? ''}
        onFinish={async (r: QuizResult) => {
          try {
            if (r.results.length) setSum(await finishQuiz({ moduleId: m.id, kind: 'blitz', label: 'Défi éclair', results: r.results, answerXp: r.answerXp, maxCombo: r.maxCombo }));
            else setSum({ xp: 0, lines: [], levelUp: false, prevLevel: 0, newLevel: 0, newBadges: [], score: 0, max: 0 });
            setPhase('done');
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Impossible d’enregistrer le résultat.');
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
            <button className="btn btn-primary" onClick={() => { setQs(null); setGame((g) => g + 1); setPhase('intro'); }}>Retenter</button>
            <Link to={`/m/${m.id}`} className="btn btn-soft">Retour au module</Link>
          </>
        }
      />
    );

  return (
    <>
      <PageTitle title="Défi éclair" sub={m.title} emoji="⚡" />
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="text-6xl">⏱️</div>
        <h2 className="mt-3 text-2xl font-extrabold">90 secondes, 3 vies</h2>
        <p className="mt-2 text-muted">Réponds à un maximum de questions. Chaque erreur coûte une vie ; les bonnes réponses d'affilée et rapides rapportent plus de XP.</p>
        <p className="mt-3 text-sm">Record : <b>{state.counters.blitzBest}</b> bonnes réponses</p>
        <button className="btn btn-primary btn-lg mt-6" onClick={() => setPhase('play')}>Lancer le chrono</button>
      </div>
    </>
  );
}
