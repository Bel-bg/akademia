import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Folder, GraduationHat } from '@getpapillon/papicons';
import { Bar, PageTitle } from '@/components/ui';
import { modules } from '@/lib/content';
import { moduleRatio, readCount } from '@/lib/stats';
import { useStore } from '@/state/Store';
import { Mascot } from '@/components/Mascot';
import { renderWithAnimatedEmojis } from '@/components/AnimatedEmoji';

export default function ModulesPage() {
  const { state } = useStore();
  return (
    <>
      <PageTitle
        title="Modules universitaires"
        sub="Choisis un module pour lire le cours, lancer un QCM, un défi éclair ou une épreuve."
        icon={<Folder size={30} />}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {modules.map((m) => {
          const ratio = moduleRatio(state, m);
          return (
            <Link
              key={m.id}
              to={`/m/${m.id}`}
              className="card group flex flex-col justify-between p-6 transition hover:-translate-y-1 hover:shadow-pop"
            >
              <div>
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl shadow-sm transition-transform group-hover:scale-105"
                    style={{ background: m.color + '26' }}
                  >
                    <Mascot mood="happy" size={68} color={m.color} animate={false} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-0.5 text-xs font-extrabold text-brand">
                      <GraduationHat size={14} /> {m.level}
                    </div>
                    <h2 className="h-display mt-1 text-2xl leading-tight">{renderWithAnimatedEmojis(m.title)}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-muted">
                      <Clock size={13} /> ~{m.estimatedHours} h · {m.chapters.length} chapitres
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-muted">{renderWithAnimatedEmojis(m.description)}</p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Bar value={ratio} color={m.color} h={10} />
                  <span className="font-display text-sm font-extrabold text-ink">
                    {readCount(state, m)}/{m.chapters.length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-line/60 pt-3 text-xs font-extrabold text-brand">
                  <span>Ouvrir le parcours</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
