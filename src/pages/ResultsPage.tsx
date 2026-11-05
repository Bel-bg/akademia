import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, PageTitle, Stat } from '@/components/ui';
import { modules } from '@/lib/content';
import { chapterAccuracy } from '@/lib/stats';
import { addDays, cn, fmtDate, fmtScore, pct, todayKey } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { Bar } from '@/components/ui';

const KIND: Record<string, string> = { qcm: 'QCM', blitz: 'Éclair', review: 'Révision', exam: 'Épreuve', cards: 'Cartes' };

export default function ResultsPage() {
  const { state, resetProgress } = useStore();
  const [kind, setKind] = useState('all');
  const att = state.attempts;

  const week = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => addDays(todayKey(), i - 13));
    const map: Record<string, number> = {};
    att.forEach((a) => { const d = a.at.slice(0, 10); map[d] = (map[d] ?? 0) + a.xp; });
    // dates locales : on recalcule via Date locale
    const loc: Record<string, number> = {};
    att.forEach((a) => { const d = new Date(a.at); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; loc[k] = (loc[k] ?? 0) + a.xp; });
    return days.map((d) => ({ d, xp: loc[d] ?? 0 }));
  }, [att]);
  const maxXp = Math.max(1, ...week.map((w) => w.xp));

  if (!att.length && !Object.keys(state.chapterStats).length)
    return (<><PageTitle title="Résultats" emoji="📊" /><Empty emoji="🌱" title="Rien à afficher pour l'instant">Termine un QCM ou une épreuve : tes résultats apparaîtront ici. <Link to="/modules" className="text-brand underline">Choisir un module</Link></Empty></>);

  const qa = att.filter((a) => a.kind !== 'exam' && a.kind !== 'cards');
  const avg = qa.length ? Math.round(qa.reduce((t, a) => t + pct(a.score, a.max), 0) / qa.length) : 0;
  const shown = att.filter((a) => kind === 'all' || a.kind === kind);

  return (
    <>
      <PageTitle title="Résultats" sub="Ta progression, tes forces et tes points à travailler." emoji="📊" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Activités" value={att.length} sub="(300 dernières)" />
        <Stat label="Moyenne QCM" value={`${avg} %`} />
        <Stat label="Épreuves faites" value={state.counters.exams} />
        <Stat label="Meilleur combo" value={`x${state.counters.maxCombo}`} />
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-4 font-extrabold">XP gagnés — 14 derniers jours</h2>
        <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Histogramme des XP par jour">
          {week.map((w) => (
            <div key={w.d} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${w.d} : ${w.xp} XP`}>
              <div className="w-full rounded-t-md bg-brand/80" style={{ height: `${(w.xp / maxXp) * 100}%`, minHeight: w.xp ? 4 : 2, opacity: w.xp ? 1 : 0.25 }} />
              <span className="text-[10px] text-muted">{w.d.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      {modules.map((m) => (
        <section key={m.id} className="card mt-6 p-5">
          <h2 className="mb-3 font-extrabold">{m.emoji} {m.title} — réussite par chapitre</h2>
          <div className="space-y-2.5">
            {m.chapters.map((c) => {
              const a = chapterAccuracy(state, m.id, c.id);
              return (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="w-1/2 truncate sm:w-2/5">{c.number} {c.title}</span>
                  <Bar value={a ?? 0} color={a === null ? 'transparent' : a >= 0.8 ? 'rgb(var(--good))' : a >= 0.5 ? 'rgb(var(--accent))' : 'rgb(var(--bad))'} />
                  <span className="w-12 text-right text-xs font-bold text-muted">{a === null ? '—' : `${Math.round(a * 100)} %`}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="card mt-6 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold">Historique</h2>
          <div className="flex gap-1.5">
            {['all', 'qcm', 'blitz', 'review', 'exam', 'cards'].map((k) => (
              <button key={k} onClick={() => setKind(k)} className={cn('chip', kind === k && 'border-brand bg-brand text-white')}>{k === 'all' ? 'Tout' : KIND[k]}</button>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-line">
          {shown.slice(0, 60).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0"><span className="chip mr-2">{KIND[a.kind]}</span><span className="font-semibold">{a.label}</span><div className="text-xs text-muted">{fmtDate(a.at)}</div></div>
              <div className="shrink-0 text-right"><b>{fmtScore(a.score)}/{fmtScore(a.max)}</b><div className="text-xs font-bold text-good">+{a.xp} XP</div></div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 text-center">
        <button className="text-xs text-muted underline" onClick={() => { if (confirm('Effacer toute ta progression ? Cette action est définitive.')) resetProgress(); }}>Réinitialiser ma progression</button>
      </div>
    </>
  );
}
