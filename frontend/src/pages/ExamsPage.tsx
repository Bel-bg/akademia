import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Clock, Paper, Search } from '@getpapillon/papicons';
import { PageTitle, Spinner } from '@/components/ui';
import { getModule, loadExamIndex } from '@/lib/content';
import type { ExamIndexItem } from '@/lib/types';
import { cn, fmtScore } from '@/lib/utils';
import { useStore } from '@/state/Store';

export default function ExamsPage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { state } = useStore();
  const [items, setItems] = useState<ExamIndexItem[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  useEffect(() => {
    if (m) loadExamIndex(m.id).then(setItems);
  }, [m]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!items) return <Spinner />;

  const shown = items.filter((e) => {
    const best = state.examBest[`${m.id}:${e.n}`];
    if (filter === 'todo' && best) return false;
    if (filter === 'done' && !best) return false;
    const t = (e.title + e.scenario + e.cas).toLowerCase();
    return !q || t.includes(q.toLowerCase());
  });
  const doneCount = items.filter((e) => state.examBest[`${m.id}:${e.n}`]).length;

  return (
    <>
      <PageTitle
        title="Épreuves d'examen"
        sub={`${m.title} · ${doneCount}/${items.length} réalisées`}
        icon={<Paper size={30} />}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un sujet…"
                className="rounded-full border border-line bg-card py-2 pl-9 pr-4 text-xs font-bold outline-none focus:border-brand"
              />
            </div>
            {(['all', 'todo', 'done'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'chip !py-1.5 !text-xs transition',
                  filter === f ? 'bg-brand text-white' : '',
                )}
              >
                {f === 'all' ? 'Toutes' : f === 'todo' ? 'À faire' : 'Terminées'}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-2">
        {shown.map((e) => {
          const best = state.examBest[`${m.id}:${e.n}`];
          return (
            <Link
              key={e.n}
              to={`/m/${m.id}/epreuves/${e.n}`}
              className="card flex gap-4 p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-pop"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft font-display text-lg font-extrabold text-brand">
                {e.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-extrabold text-ink">{e.title}</div>
                <div className="line-clamp-2 text-xs font-semibold text-muted">
                  {e.scenario} · {e.cas}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs font-bold text-muted">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {e.durationMinutes / 60} h
                  </span>
                  <span>/{e.points} pts</span>
                  {best && (
                    <span className="rounded-full bg-good/15 px-2.5 py-0.5 text-[11px] font-extrabold text-good">
                      Record : {fmtScore(best.score)}/{best.max}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {shown.length === 0 && (
        <p className="py-10 text-center text-sm font-bold text-muted">
          Aucune épreuve ne correspond à ta recherche.
        </p>
      )}
    </>
  );
}
