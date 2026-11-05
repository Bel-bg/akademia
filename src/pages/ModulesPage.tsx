import { Link } from 'react-router-dom';
import { Bar, PageTitle } from '@/components/ui';
import { modules } from '@/lib/content';
import { moduleRatio, readCount } from '@/lib/stats';
import { useStore } from '@/state/Store';

export default function ModulesPage() {
  const { state } = useStore();
  return (
    <>
      <PageTitle title="Modules" sub="Choisis un cours. D'autres modules arriveront ici automatiquement." emoji="🧩" />
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link key={m.id} to={`/m/${m.id}`} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-pop">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl" style={{ background: m.color + '26' }}>{m.emoji}</span>
              <div>
                <h2 className="text-xl font-extrabold">{m.title}</h2>
                <p className="text-sm text-muted">{m.level} · ~{m.estimatedHours} h · {m.chapters.length} chapitres</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{m.description}</p>
            <div className="mt-4 flex items-center gap-3">
              <Bar value={moduleRatio(state, m)} color={m.color} />
              <span className="text-xs font-bold text-muted">{readCount(state, m)}/{m.chapters.length}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
