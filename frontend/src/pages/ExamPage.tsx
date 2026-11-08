import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Paper, Pen } from '@getpapillon/papicons';
import { AnswerText, Inline } from '@/components/Markdown';
import SummaryCard from '@/components/SummaryCard';
import { Bar, Spinner } from '@/components/ui';
import { getModule, loadExam } from '@/lib/content';
import type { Exam, Summary } from '@/lib/types';
import { cn, fmtClock, fmtScore } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { Mascot } from '@/components/Mascot';

type Phase = 'intro' | 'write' | 'correct' | 'done';
const GRADES = [0, 0.25, 0.5, 0.75, 1];

export default function ExamPage() {
  const { moduleId, n } = useParams();
  const m = getModule(moduleId);
  const num = Number(n);
  const { finishExam, state } = useStore();
  const [exam, setExam] = useState<Exam | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [timed, setTimed] = useState(false);
  const [left, setLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [sum, setSum] = useState<Summary | null>(null);
  const draftKey = `akademia:draft:${moduleId}:${n}`;
  const loaded = useRef(false);

  useEffect(() => {
    if (!m) return;
    setExam(null);
    setPhase('intro');
    loaded.current = false;
    loadExam(m.id, num).then((e) => {
      setExam(e);
      try {
        const d = localStorage.getItem(draftKey);
        if (d) setAnswers(JSON.parse(d));
        else setAnswers({});
      } catch {
        /* ignore */
      }
      loaded.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, num]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(answers));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [answers, draftKey]);

  useEffect(() => {
    if (phase !== 'write' || !timed) return;
    const t = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timed]);

  useEffect(() => {
    if (phase === 'write' && timed && left <= 0) setPhase('correct');
  }, [left, phase, timed]);

  const all = useMemo(() => exam?.parts.flatMap((p) => p.questions) ?? [], [exam]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!exam) return <Spinner />;

  const answered = all.filter((q) => (answers[q.id] ?? '').trim().length > 0).length;
  const score = all.reduce((t, q) => t + q.points * (grades[q.id] ?? 0), 0);
  const graded = all.filter((q) => grades[q.id] !== undefined).length;
  const best = state.examBest[`${m.id}:${exam.n}`];

  const start = (withTimer: boolean) => {
    setTimed(withTimer);
    setLeft(exam.durationMinutes * 60);
    setPhase('write');
    window.scrollTo(0, 0);
  };

  const finish = async () => {
    try {
      const result = await finishExam({
        moduleId: m.id,
        n: exam.n,
        label: exam.title,
        score,
        max: exam.points,
      });
      setSum(result);
      setPhase('done');
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      window.scrollTo(0, 0);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Impossible d’enregistrer cette note.',
      );
    }
  };

  if (phase === 'done' && sum)
    return (
      <SummaryCard
        s={sum}
        title={exam.title}
        unit=""
        actions={
          <>
            <Link to={`/m/${m.id}/epreuves`} className="btn btn-primary btn-lg flex-1">
              Autres épreuves
            </Link>
            <button
              type="button"
              className="btn btn-soft btn-lg"
              onClick={() => {
                setGrades({});
                setAnswers({});
                setPhase('intro');
              }}
            >
              Refaire
            </button>
          </>
        }
      />
    );

  if (phase === 'intro')
    return (
      <div className="mx-auto max-w-2xl">
        <Link to={`/m/${m.id}/epreuves`} className="btn btn-soft !px-3.5 !py-1.5 text-xs">
          <ArrowLeft size={15} /> Toutes les épreuves
        </Link>

        <div className="card mt-4 p-7 text-center sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Mascot mood="determined" graduationCap size={115} animate={false} />
            <div>
              <span className="rounded-full bg-soft px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-brand">
                {m.title}
              </span>
              <h1 className="h-display mt-1.5 text-3xl">{exam.title}</h1>
              <p className="mt-1 text-sm font-bold text-muted">
                Durée : {exam.durationMinutes / 60} h · Barème : /{exam.points} pts
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2 text-left">
            {exam.parts.map((p) => (
              <li
                key={p.id}
                className="flex justify-between rounded-2xl bg-soft/75 px-4 py-2.5 text-sm font-bold"
              >
                <span>{p.title}</span>
                <b className="text-brand">{p.points} pts</b>
              </li>
            ))}
          </ul>

          {best && (
            <p className="mt-4 text-sm font-bold">
              Ton meilleur score :{' '}
              <b className="text-good">
                {fmtScore(best.score)}/{best.max}
              </b>
            </p>
          )}
          {Object.values(answers).some((v) => v.trim()) && (
            <p className="mt-2 text-xs font-extrabold text-brand">
              Un brouillon de tes réponses a été retrouvé.
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => start(true)}>
              <Clock size={18} /> Conditions d’examen ({exam.durationMinutes / 60} h)
            </button>
            <button type="button" className="btn btn-soft btn-lg" onClick={() => start(false)}>
              <Pen size={18} /> Mode entraînement libre
            </button>
          </div>
          <p className="mt-4 text-xs font-semibold text-muted">
            Méthode : rédige tes réponses, puis compare avec le corrigé officiel et évalue-toi
            question par question.
          </p>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate font-display text-base font-extrabold">{exam.title}</div>
          {phase === 'write' ? (
            <div className="flex items-center gap-2.5">
              {timed && (
                <span className={cn('chip tabular-nums', left < 600 && 'text-bad')}>
                  <Clock size={13} />
                  {fmtClock(left)}
                </span>
              )}
              <span className="hidden text-xs font-bold text-muted sm:inline">
                {answered}/{all.length} répondues
              </span>
              <button
                type="button"
                className="btn btn-primary !py-2 text-xs"
                onClick={() => setPhase('correct')}
              >
                <Paper size={16} /> Voir le corrigé
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-display text-base font-extrabold">
                {fmtScore(score)}/{exam.points}
              </span>
              <button
                type="button"
                className="btn btn-good !py-2 text-xs"
                disabled={graded < all.length}
                onClick={finish}
                title={graded < all.length ? 'Note toutes les questions' : ''}
              >
                <Check size={16} /> Valider ({graded}/{all.length})
              </button>
            </div>
          )}
        </div>
        {phase === 'correct' && (
          <Bar value={graded / all.length} h={6} className="mt-2" color="rgb(var(--good))" />
        )}
      </div>

      <div className="space-y-8">
        {exam.parts.map((p) => (
          <section key={p.id}>
            <h2 className="h-display mb-1 text-2xl">
              {p.title} <span className="text-sm font-bold text-muted">({p.points} pts)</span>
            </h2>
            {p.intro && <p className="mb-3 text-sm font-semibold text-muted">{p.intro}</p>}
            {p.context && (
              <div className="card mb-4 border-l-4 border-l-brand bg-soft/65 p-5 text-[15px]">
                <Inline text={p.context} />
              </div>
            )}
            <div className="space-y-4">
              {p.questions.map((q, i) => {
                const g = grades[q.id];
                return (
                  <div key={q.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold">
                        <span className="mr-1.5 font-display text-brand">{i + 1}.</span>
                        <span className="inline-block align-top">
                          <Inline text={q.q} />
                        </span>
                      </div>
                      <span className="chip shrink-0">
                        {fmtScore(q.points)} pt{q.points > 1 ? 's' : ''}
                      </span>
                    </div>

                    {phase === 'write' ? (
                      <textarea
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        rows={q.points >= 2 ? 7 : 4}
                        placeholder="Rédige ta réponse (SQL, schéma ou explication)…"
                        className="mt-3 w-full resize-y rounded-2xl border-2 border-line bg-bg p-3.5 text-[15px] font-medium outline-none focus:border-brand"
                      />
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted">
                            Ta réponse
                          </div>
                          <div className="whitespace-pre-wrap rounded-2xl bg-soft/65 p-3.5 text-sm font-medium">
                            {(answers[q.id] ?? '').trim() || (
                              <i className="text-muted">Aucune réponse saisie</i>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-good">
                            Corrigé officiel
                          </div>
                          <div className="rounded-2xl border-2 border-good/35 bg-good/10 p-3.5">
                            <AnswerText text={q.a} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">
                            Mon auto-évaluation
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {GRADES.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setGrades((x) => ({ ...x, [q.id]: r }))}
                                className={cn(
                                  'chip !py-1.5 !text-xs transition',
                                  g === r ? 'bg-brand text-white' : '',
                                )}
                              >
                                {r === 0 ? 'Raté' : r === 1 ? 'Parfait' : `${r * 100} %`} ·{' '}
                                {fmtScore(q.points * r)} pt
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {phase === 'write' && (
        <div className="mt-8 text-center">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setPhase('correct')}
          >
            <Paper size={18} /> J’ai terminé : passer à la correction
          </button>
        </div>
      )}
    </div>
  );
}
