import { Bar, PageTitle } from '@/components/ui';
import { BADGES, RARITY_STYLE, TIERS, levelProgress, tierFor } from '@/lib/gamification';
import { modules } from '@/lib/content';
import { cn, fmtNum } from '@/lib/utils';
import { useStore } from '@/state/Store';

export default function BadgesPage() {
  const { state } = useStore();
  const lp = levelProgress(state.xp);
  const cur = tierFor(lp.level);
  const got = Object.keys(state.badges).length;
  return (
    <>
      <PageTitle title="Succès & puissance" sub={`${got}/${BADGES.length} badges · ${fmtNum(state.xp)} XP`} emoji="🏅" />
      <section className="card mb-6 p-5">
        <h2 className="mb-3 font-extrabold">Paliers de puissance</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIERS.map((t) => {
            const on = lp.level >= t.min;
            return (
              <div key={t.name} className={cn('rounded-2xl border-2 p-3 text-center', t.name === cur.name ? 'border-brand bg-brand/10' : 'border-line', !on && 'opacity-45 grayscale')}>
                <div className="text-3xl">{t.emoji}</div>
                <div className="text-sm font-extrabold">{t.name}</div>
                <div className="text-xs text-muted">Niveau {t.min}+</div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => {
          const date = state.badges[b.id];
          const p = b.progress?.(state, { modules });
          return (
            <div key={b.id} className={cn('card flex gap-4 p-4', !date && 'opacity-70')}>
              <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl', date ? RARITY_STYLE[b.rarity] : 'from-slate-300 to-slate-400 grayscale dark:from-slate-600 dark:to-slate-700')}>{b.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><b>{b.name}</b><span className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{b.rarity}</span></div>
                <p className="text-sm text-muted">{b.desc}</p>
                {date ? <p className="mt-1 text-xs font-bold text-good">Obtenu le {new Date(date).toLocaleDateString('fr-FR')}</p> : p && <div className="mt-2 flex items-center gap-2"><Bar value={p.cur / p.max} h={6} /><span className="text-xs font-bold text-muted">{p.cur}/{p.max}</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
