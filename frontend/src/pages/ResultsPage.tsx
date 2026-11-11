import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grades, Trash } from '@getpapillon/papicons';
import { Bar, Empty, PageTitle, Stat } from '@/components/ui';
import { modules } from '@/lib/content';
import { chapterAccuracy } from '@/lib/stats';
import { addDays, cn, fmtDate, fmtScore, pct, todayKey } from '@/lib/utils';
import { useStore } from '@/state/Store';

const KIND: Record<string, string> = {
  qcm: 'QCM',
  blitz: 'Éclair',
  review: 'Révision',
  exam: 'Épreuve',
  cards: 'Cartes',
};

export default function ResultsPage() {
  const { state, resetProgress } = useStore();
  const [kind, setKind] = useState('all');
  const att = state.attempts;

  const week = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => addDays(todayKey(), i - 13));
    const loc: Record<string, number> = {};
    att.forEach((a) => {
      const d = new Date(a.at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      loc[k] = (loc[k] ?? 0) + a.xp;
    });
    return days.map((d) => ({ d, xp: loc[d] ?? 0 }));
  }, [att]);
  const maxXp = Math.max(1, ...week.map((w) => w.xp));

  if (!att.length && !Object.keys(state.chapterStats).length)
    return (
      <>
        <PageTitle title="Mes statistiques" icon={<Grades size={30} />} />
        <Empty mood="thinking" title="Pas encore d’activité enregistrée">
          Lance un QCM, un défi éclair ou une épreuve : tes courbes de progression apparaîtront ici.{' '}
          <Link to="/modules" className="font-extrabold text-brand underline">
            Explorer les modules
          </Link>
        </Empty>
      </>
    );

  const qa = att.filter((a) => a.kind !== 'exam' && a.kind !== 'cards');
  const avg = qa.length
    ? Math.round(qa.reduce((t, a) => t + pct(a.score, a.max), 0) / qa.length)
    : 0;
  const shown = att.filter((a) => kind === 'all' || a.kind === kind);

  return (
    <>
      <PageTitle
        title="Mes statistiques"
        sub="Ta progression par module, tes forces et ton historique d’XP."
        icon={<Grades size={30} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Activités" value={att.length} sub="terminées" />
        <Stat label="Moyenne QCM" value={`${avg} %`} sub="tous modules" />
        <Stat label="Épreuves" value={state.counters.exams} sub="réalisées" />
        <Stat label="Meilleur combo" value={`x${state.counters.maxCombo}`} sub="d'affilée" />
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="h-display mb-4 text-xl">XP gagnés - 14 derniers jours</h2>
        <div
          className="flex h-36 items-end gap-2"
          role="img"
          aria-label="Histogramme des XP par jour"
        >
          {week.map((w) => (
            <div
              key={w.d}
              className="flex flex-1 flex-col items-center justify-end gap-1"
              title={`${w.d} : ${w.xp} XP`}
            >
              <div
                className="w-full rounded-t-xl bg-brand transition-all"
                style={{
                  height: `${(w.xp / maxXp) * 100}%`,
                  minHeight: w.xp ? 6 : 3,
                  opacity: w.xp ? 1 : 0.2,
                }}
              />
              <span className="text-[10px] font-bold text-muted">{w.d.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      {modules.map((m) => (
        <section key={m.id} className="card mt-6 p-5 sm:p-6">
          <h2 className="h-display mb-3 text-xl">{m.title} - maîtrise par chapitre</h2>
          <div className="space-y-3">
            {m.chapters.map((c) => {
              const a = chapterAccuracy(state, m.id, c.id);
              return (
                <div key={c.id} className="flex items-center gap-3 text-sm font-bold">
                  <span className="w-1/2 truncate sm:w-2/5">
                    {c.number} {c.title}
                  </span>
                  <Bar
                    value={a ?? 0}
                    color={
                      a === null
                        ? 'transparent'
                        : a >= 0.8
                          ? 'rgb(var(--good))'
                          : a >= 0.5
                            ? 'rgb(var(--accent))'
                            : 'rgb(var(--bad))'
                    }
                  />
                  <span className="w-12 text-right text-xs font-extrabold text-muted">
                    {a === null ? '-' : `${Math.round(a * 100)} %`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="card mt-6 p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h-display text-xl">Historique des activités</h2>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'qcm', 'blitz', 'review', 'exam', 'cards'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn('chip', kind === k && 'bg-brand text-white')}
              >
                {k === 'all' ? 'Tout' : KIND[k]}
              </button>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-line/60">
          {shown.slice(0, 60).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-3 text-sm font-bold"
            >
              <div className="min-w-0">
                <span className="chip mr-2">{KIND[a.kind]}</span>
                <span>{a.label}</span>
                <div className="mt-0.5 text-xs font-semibold text-muted">{fmtDate(a.at)}</div>
              </div>
              <div className="shrink-0 text-right">
                <b className="font-display text-base">
                  {fmtScore(a.score)}/{fmtScore(a.max)}
                </b>
                <div className="text-xs font-extrabold text-good">+{a.xp} XP</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 text-center">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted underline hover:text-bad"
          onClick={async () => {
            if (confirm('Effacer toute ta progression ? Cette action est définitive.')) {
              try {
                await resetProgress();
              } catch (error) {
                window.alert(
                  error instanceof Error
                    ? error.message
                    : 'Impossible de réinitialiser la progression.',
                );
              }
            }
          }}
        >
          <Trash size={14} /> Réinitialiser ma progression
        </button>
      </div>
    </>
  );
}
