import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CheckCheck, Clock, Eye, PenLine } from 'lucide-react';
import { AnswerText, Inline } from '@/components/Markdown';
import SummaryCard from '@/components/SummaryCard';
import { Bar, Spinner } from '@/components/ui';
import { getModule, loadExam } from '@/lib/content';
import type { Exam, Summary } from '@/lib/types';
import { cn, fmtClock, fmtScore } from '@/lib/utils';
import { useStore } from '@/state/Store';

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
    setExam(null); setPhase('intro'); loaded.current = false;
    loadExam(m.id, num).then((e) => {
      setExam(e);
      try {
        const d = localStorage.getItem(draftKey);
        if (d) setAnswers(JSON.parse(d));
        else setAnswers({});
      } catch { /* ignore */ }
      loaded.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, num]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(answers)); } catch { /* ignore */ }
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
  const finish = () => {
    const s = finishExam({ moduleId: m.id, n: exam.n, label: exam.title, score, max: exam.points });
    setSum(s);
    setPhase('done');
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    window.scrollTo(0, 0);
  };

  if (phase === 'done' && sum)
    return (
      <SummaryCard s={sum} title={exam.title} unit="" actions={<><Link to={`/m/${m.id}/epreuves`} className="btn btn-primary">Autres épreuves</Link><button className="btn btn-soft" onClick={() => { setGrades({}); setAnswers({}); setPhase('intro'); }}>Refaire</button></>} />
    );

  if (phase === 'intro')
    return (
      <div className="mx-auto max-w-2xl">
        <Link to={`/m/${m.id}/epreuves`} className="text-sm text-muted underline">← Toutes les épreuves</Link>
        <div className="card mt-3 p-7">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">{m.title}</p>
          <h1 className="h-display mt-1 text-3xl">{exam.title}</h1>
          <p className="mt-1 text-muted">Durée : {exam.durationMinutes / 60} h · Barème : /{exam.points}</p>
          <ul className="mt-5 space-y-2">
            {exam.parts.map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl bg-soft px-4 py-2.5 text-sm"><span className="font-semibold">{p.title}</span><b>{p.points} pts</b></li>
            ))}
          </ul>
          {best && <p className="mt-4 text-sm">Ton meilleur score : <b className="text-good">{fmtScore(best.score)}/{best.max}</b></p>}
          {Object.values(answers).some((v) => v.trim()) && <p className="mt-2 text-sm text-accent">✍️ Un brouillon de tes réponses a été retrouvé.</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="btn btn-primary btn-lg" onClick={() => start(true)}><Clock size={18} /> Conditions d'examen (chrono 2 h)</button>
            <button className="btn btn-soft btn-lg" onClick={() => start(false)}><PenLine size={18} /> Sans chronomètre</button>
          </div>
          <p className="mt-4 text-xs text-muted">Méthode : rédige tes réponses, puis compare avec le corrigé et note-toi honnêtement question par question. Les XP dépendent de ta note.</p>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate font-extrabold">{exam.title}</div>
          {phase === 'write' ? (
            <div className="flex items-center gap-3">
              {timed && <span className={cn('chip tabular-nums', left < 600 && 'text-bad')}><Clock size={13} />{fmtClock(left)}</span>}
              <span className="text-xs text-muted">{answered}/{all.length} répondues</span>
              <button className="btn btn-primary" onClick={() => setPhase('correct')}><Eye size={16} /> Voir le corrigé</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold">{fmtScore(score)}/{exam.points}</span>
              <button className="btn btn-good" disabled={graded < all.length} onClick={finish} title={graded < all.length ? 'Note toutes les questions' : ''}><CheckCheck size={16} /> Valider ({graded}/{all.length})</button>
            </div>
          )}
        </div>
        {phase === 'correct' && <Bar value={graded / all.length} h={4} className="mt-2" color="rgb(var(--good))" />}
      </div>

      <div className="space-y-8">
        {exam.parts.map((p) => (
          <section key={p.id}>
            <h2 className="mb-1 text-xl font-extrabold">{p.title} <span className="text-sm font-bold text-muted">({p.points} pts)</span></h2>
            {p.intro && <p className="mb-3 text-sm text-muted">{p.intro}</p>}
            {p.context && <div className="card mb-4 border-l-4 border-l-brand bg-brand/5 p-5 text-[15px]"><Inline text={p.context} /></div>}
            <div className="space-y-4">
              {p.questions.map((q, i) => {
                const g = grades[q.id];
                return (
                  <div key={q.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold"><span className="mr-1 text-brand">{i + 1}.</span><span className="inline-block align-top"><Inline text={q.q} /></span></div>
                      <span className="chip shrink-0">{fmtScore(q.points)} pt{q.points > 1 ? 's' : ''}</span>
                    </div>
                    {phase === 'write' ? (
                      <textarea value={answers[q.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} rows={q.points >= 2 ? 7 : 4} placeholder="Ta réponse…" className="mt-3 w-full resize-y rounded-xl border border-line bg-bg p-3 text-[15px] outline-none focus:border-brand" />
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted">Ta réponse</div>
                          <div className="whitespace-pre-wrap rounded-xl bg-soft p-3 text-sm">{(answers[q.id] ?? '').trim() || <i className="text-muted">Pas de réponse</i>}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-good">Corrigé</div>
                          <div className="rounded-xl border border-good/40 bg-good/5 p-3"><AnswerText text={q.a} /></div>
                        </div>
                        <div>
                          <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Mon évaluation</div>
                          <div className="flex flex-wrap gap-2">
                            {GRADES.map((r) => (
                              <button key={r} onClick={() => setGrades((x) => ({ ...x, [q.id]: r }))} className={cn('chip !text-sm', g === r ? 'border-brand bg-brand text-white' : '')}>
                                {r === 0 ? 'Raté' : r === 1 ? 'Parfait' : `${r * 100} %`} · {fmtScore(q.points * r)}
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
        <div className="mt-8 text-center"><button className="btn btn-primary btn-lg" onClick={() => setPhase('correct')}><Eye size={18} /> J'ai terminé : voir le corrigé</button></div>
      )}
    </div>
  );
}
