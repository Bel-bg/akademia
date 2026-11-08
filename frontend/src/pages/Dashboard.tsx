import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Crown,
  Folder,
  GraduationHat,
  Newspaper,
  Sparkles,
  Star,
  Tasks,
} from '@getpapillon/papicons';
import { Bar, Ring } from '@/components/ui';
import { modules } from '@/lib/content';
import { levelProgress, nextTier, tierFor, XP } from '@/lib/gamification';
import { dueCardIds, dueQuestionIds } from '@/lib/progress';
import { moduleRatio, nextChapter } from '@/lib/stats';
import { fmtDate, fmtNum, fmtScore } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import { useTheme } from '@/state/Theme';
import { Mascot } from '@/components/Mascot';
import { CrossedSwordsIcon, FlameBadgeIcon, FourPointStar, PartyPopperIcon, TrophyBadgeIcon } from '@/components/Decor';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { state } = useStore();
  const { user } = useAuth();
  const { theme, filiere, customPseudo } = useTheme();
  const lp = levelProgress(state.xp);
  const tier = tierFor(lp.level);
  const nt = nextTier(lp.level);
  const goalRatio = Math.min(1, state.daily.xp / state.dailyGoal);
  const due = modules.reduce(
    (n, m) => n + dueQuestionIds(state, m.id).length + dueCardIds(state, m.id).length,
    0,
  );
  const last = state.attempts[0];
  const resume =
    modules.find((m) => (state.chaptersRead[m.id]?.length ?? 0) > 0 && moduleRatio(state, m) < 1) ??
    modules[0];
  const nc = resume ? nextChapter(state, resume) : undefined;
  const displayName = user && !user.guest ? user.username : customPseudo;

  return (
    <div className="space-y-6">
      {/* ==================== HERO BOLD COLOR-BLOCK + MASCOTTE ==================== */}
      <section className="relative overflow-hidden rounded-4xl bg-brand p-6 text-white shadow-pop sm:p-8">
        <FourPointStar size={28} color="rgb(255 255 255 / 0.22)" className="absolute right-8 top-6" />
        <FourPointStar size={18} color="rgb(255 255 255 / 0.18)" className="absolute left-6 bottom-6" />

        <div className="relative z-10 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto flex flex-col items-center sm:mx-0">
            <Mascot mood="happy" graduationCap size={145} />
          </div>

          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
              <GraduationHat size={15} />
              <span>
                Filière {filiere} · Niveau {lp.level} ({tier.name})
              </span>
            </div>

            <h1 className="h-display mt-2.5 text-3xl leading-tight sm:text-4xl">
              Salut {displayName} ! Prêt à relever le défi ?
            </h1>

            <p className="mt-1 text-sm font-bold text-white/90">
              {fmtNum(lp.current)} / {fmtNum(lp.needed)} XP vers le niveau {lp.level + 1}
              {nt && (
                <>
                  {' '}
                  · prochain palier : <b className="text-white">{nt.name}</b> (niv. {nt.min})
                </>
              )}
            </p>

            {/* Barre d'XP contrastée sur aplat de marque */}
            <div className="mx-auto mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-black/20 sm:mx-0">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${Math.max(8, lp.ratio * 100)}%` }}
              />
            </div>

            {nc && resume && (
              <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
                <Link
                  to={`/m/${resume.id}/lire/${nc.id}`}
                  className={cn(
                    'btn btn-lg',
                    theme === 'violet'
                      ? 'btn-primary'
                      : 'bg-white text-ink shadow-[0_4px_0_0_rgba(0,0,0,0.18)] hover:brightness-95',
                  )}
                >
                  <span>
                    {(state.chaptersRead[resume.id]?.length ?? 0) > 0 ? 'Reprendre' : 'Commencer'} :{' '}
                    {nc.title}
                  </span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== TUILES DE GAMIFICATION (Séries, XP, Objectif, Classement) ==================== */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card flex items-center gap-3.5 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft">
            <FlameBadgeIcon size={28} />
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-muted">Série</div>
            <div className="h-display text-2xl leading-tight">{state.streak} j</div>
            <div className="text-[11px] font-bold text-muted">Record : {state.bestStreak} j</div>
          </div>
        </div>

        <div className="card flex items-center gap-3.5 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-brand">
            <Star size={26} />
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-muted">XP Total</div>
            <div className="h-display text-2xl leading-tight">{fmtNum(state.xp)}</div>
            <div className="text-[11px] font-bold text-muted">Puissance {tier.name}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3.5 p-4">
          <Ring value={goalRatio} size={50} stroke={6} color="rgb(var(--good))">
            <Tasks size={18} className="text-good" />
          </Ring>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Objectif du jour
            </div>
            <div className="h-display text-xl leading-tight">
              {state.daily.xp} / {state.dailyGoal} XP
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-muted">
              {goalRatio >= 1 ? (
                <>
                  <span>Atteint !</span>
                  <PartyPopperIcon size={14} />
                </>
              ) : (
                <span>Bonus +{XP.dailyBonus} XP</span>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/classement"
          className="card flex items-center gap-3.5 p-4 transition hover:-translate-y-0.5 hover:shadow-pop"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft">
            <TrophyBadgeIcon size={28} />
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Classement
            </div>
            <div className="h-display text-2xl leading-tight">#5 · {filiere}</div>
            <div className="text-[11px] font-bold text-brand">Voir le podium →</div>
          </div>
        </Link>
      </section>

      {/* ==================== BANNIÈRE BATTLE DE LA SEMAINE (AIP vs ARI) ==================== */}
      <section className="card overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-btn-brand">
              <Crown size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-extrabold text-brand">
                  Battle de la semaine
                </span>
                <span className="text-xs font-bold text-muted">En direct</span>
              </div>
              <h2 className="h-display mt-0.5 flex items-center gap-1.5 text-xl">
                <span>Duel des filières : AIP vs ARI</span>
                <CrossedSwordsIcon size={20} className="text-brand" />
              </h2>
              <p className="text-xs font-bold text-muted">
                Vote pour ta filière et gagne des XP pour hisser ton camp sur la 1re marche !
              </p>
            </div>
          </div>
          <Link to="/actu" className="btn btn-primary">
            <Newspaper size={18} /> Participer au duel
          </Link>
        </div>
      </section>

      {/* ==================== RÉVISIONS ESPACÉES DUES ==================== */}
      {due > 0 && (
        <section className="card flex flex-wrap items-center justify-between gap-3 border-2 border-brand/25 bg-soft/60 p-5">
          <div className="flex items-center gap-3">
            <FlameBadgeIcon size={28} />
            <div>
              <div className="font-display text-lg font-extrabold">
                {due} élément{due > 1 ? 's' : ''} à réviser aujourd’hui
              </div>
              <div className="text-xs font-bold text-muted">
                La répétition espacée fixe tes notions durablement avant les examens.
              </div>
            </div>
          </div>
          {modules
            .filter((m) => dueQuestionIds(state, m.id).length > 0)
            .slice(0, 1)
            .map((m) => (
              <Link key={m.id} to={`/m/${m.id}/qcm?mode=review`} className="btn btn-primary">
                Réviser maintenant <ArrowRight size={16} />
              </Link>
            ))}
        </section>
      )}

      {/* ==================== MES MODULES UNIVERSITAIRES ==================== */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h-display flex items-center gap-2 text-2xl">
            <Folder size={22} className="text-brand" />
            <span>Mes modules</span>
          </h2>
          <Link to="/modules" className="text-xs font-extrabold text-brand underline">
            Tout voir
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => {
            const ratio = moduleRatio(state, m);
            return (
              <Link
                key={m.id}
                to={`/m/${m.id}`}
                className="card group relative overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-pop"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-3xl text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ background: m.color }}
                  >
                    <Mascot mood="idle" size={54} color={m.color} animate={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-soft px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-brand">
                        {m.level}
                      </span>
                      <span className="text-xs font-bold text-muted">
                        {m.chapters.length} chapitres
                      </span>
                    </div>
                    <h3 className="h-display mt-1 text-xl leading-snug text-ink">{m.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-muted">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Bar value={ratio} color={m.color} h={10} />
                  <span className="whitespace-nowrap font-display text-sm font-extrabold text-ink">
                    {Math.round(ratio * 100)} %
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ==================== DERNIÈRE ACTIVITÉ ==================== */}
      {last && (
        <section className="card p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold">
            <Sparkles size={19} className="text-brand" /> Dernière activité
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
            <span>
              {last.label} ·{' '}
              <b className="text-ink">
                {fmtScore(last.score)}/{fmtScore(last.max)}
              </b>
            </span>
            <span className="text-muted">
              {fmtDate(last.at)} · <b className="text-good">+{last.xp} XP</b>
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
