import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import { PageTitle, Spinner } from '@/components/ui';
import { getModule, loadExamIndex } from '@/lib/content';
import type { ExamIndexItem } from '@/lib/types';
import { fmtScore } from '@/lib/utils';
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
      <PageTitle title="Épreuves" sub={`${m.title} · ${doneCount}/${items.length} réalisées`} emoji="📝"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un thème…" className="rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-brand" />
            </div>
            {(['all', 'todo', 'done'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`chip !text-sm ${filter === f ? 'border-brand bg-brand text-white' : ''}`}>{f === 'all' ? 'Toutes' : f === 'todo' ? 'À faire' : 'Faites'}</button>
            ))}
          </div>
        } />
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((e) => {
          const best = state.examBest[`${m.id}:${e.n}`];
          return (
            <Link key={e.n} to={`/m/${m.id}/epreuves/${e.n}`} className="card flex gap-4 p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-pop">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft text-lg font-extrabold">{e.n}</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{e.title}</div>
                <div className="line-clamp-2 text-sm text-muted">{e.scenario} · {e.cas}</div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><Clock size={12} />{e.durationMinutes / 60} h</span>
                  <span>/{e.points}</span>
                  {best && <span className="chip !py-0 text-good">Meilleur : {fmtScore(best.score)}/{best.max}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted">Aucune épreuve ne correspond.</p>}
    </>
  );
}
