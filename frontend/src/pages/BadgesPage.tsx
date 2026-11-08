import { Check, Lock, Sparkles, Star } from '@getpapillon/papicons';
import { Bar, PageTitle } from '@/components/ui';
import { BADGES, RARITY_STYLE, TIERS, levelProgress, tierFor } from '@/lib/gamification';
import { modules } from '@/lib/content';
import { cn, fmtNum } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { Mascot } from '@/components/Mascot';

export default function BadgesPage() {
  const { state } = useStore();
  const lp = levelProgress(state.xp);
  const cur = tierFor(lp.level);
  const got = Object.keys(state.badges).length;

  return (
    <>
      <PageTitle
        title="Mes Badges & Paliers"
        sub={`${got}/${BADGES.length} badges débloqués · ${fmtNum(state.xp)} XP`}
        icon={<Sparkles size={30} />}
      />

      {/* Paliers de puissance avec mascottes évolutives */}
      <section className="card mb-6 p-5 sm:p-6">
        <h2 className="h-display mb-4 text-xl">Paliers de puissance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIERS.map((t) => {
            const on = lp.level >= t.min;
            const isCurrent = t.name === cur.name;
            return (
              <div
                key={t.name}
                className={cn(
                  'flex flex-col items-center rounded-3xl border-2 p-3.5 text-center transition',
                  isCurrent
                    ? 'border-brand bg-soft/75 shadow-sm'
                    : 'border-line bg-card',
                  !on && 'opacity-50 grayscale',
                )}
              >
                <Mascot
                  mood={isCurrent ? 'proud' : on ? 'happy' : 'sleepy'}
                  crown={t.min >= 20}
                  size={64}
                  color={t.color}
                  animate={false}
                />
                <div className="font-display mt-1 text-base font-extrabold">{t.name}</div>
                <div className="text-xs font-bold text-muted">Niveau {t.min}+</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grille des 25 Badges */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => {
          const date = state.badges[b.id];
          const p = b.progress?.(state, { modules });
          return (
            <div
              key={b.id}
              className={cn('card flex items-start gap-4 p-4 transition', !date && 'opacity-75')}
            >
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm',
                  date ? RARITY_STYLE[b.rarity] : 'from-slate-200 to-slate-300 text-slate-500',
                )}
              >
                {date ? <Star size={26} /> : <Lock size={22} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <b className="font-display text-base font-extrabold text-ink">{b.name}</b>
                  <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand">
                    {b.rarity}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted">{b.desc}</p>
                {date ? (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-extrabold text-good">
                    <Check size={14} /> Obtenu le {new Date(date).toLocaleDateString('fr-FR')}
                  </p>
                ) : (
                  p && (
                    <div className="mt-2 flex items-center gap-2">
                      <Bar value={p.cur / p.max} h={7} />
                      <span className="text-xs font-extrabold text-muted">
                        {p.cur}/{p.max}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
