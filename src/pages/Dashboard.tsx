import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Target, Zap } from 'lucide-react';
import { Bar, Ring, Stat } from '@/components/ui';
import { modules } from '@/lib/content';
import { levelProgress, nextTier, tierFor, XP } from '@/lib/gamification';
import { dueCardIds, dueQuestionIds } from '@/lib/progress';
import { moduleRatio, nextChapter } from '@/lib/stats';
import { fmtDate, fmtNum, fmtScore } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';

export default function Dashboard() {
  const { state } = useStore();
  const { user, cloud } = useAuth();
  const lp = levelProgress(state.xp);
  const tier = tierFor(lp.level);
  const nt = nextTier(lp.level);
  const goalRatio = Math.min(1, state.daily.xp / state.dailyGoal);
  const due = modules.reduce((n, m) => n + dueQuestionIds(state, m.id).length + dueCardIds(state, m.id).length, 0);
  const last = state.attempts[0];
  const resume = modules.find((m) => (state.chaptersRead[m.id]?.length ?? 0) > 0 && moduleRatio(state, m) < 1) ?? modules[0];
  const nc = resume ? nextChapter(state, resume) : undefined;

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="grid gap-6 bg-gradient-to-br from-brand/15 via-transparent to-accent/10 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
          <Ring value={lp.ratio} size={128} stroke={10} color={tier.color}>
            <div>
              <div className="text-4xl">{tier.emoji}</div>
              <div className="text-xs font-extrabold uppercase tracking-wide text-muted">Niv. {lp.level}</div>
            </div>
          </Ring>
          <div className="self-center">
            <p className="text-sm font-bold text-muted">{user?.guest ? 'Bienvenue sur Akademia' : `Content de te revoir, ${user?.username}`}</p>
            <h1 className="h-display text-3xl sm:text-4xl">Puissance : {tier.name}</h1>
            <p className="mt-1 text-muted">
              {fmtNum(lp.current)} / {fmtNum(lp.needed)} XP vers le niveau {lp.level + 1}
              {nt && <> · prochain palier : <b className="text-ink">{nt.emoji} {nt.name}</b> (niv. {nt.min})</>}
            </p>
            <Bar value={lp.ratio} h={10} color={tier.color} className="mt-3 max-w-md" />
            {nc && resume && (
              <Link to={`/m/${resume.id}/lire/${nc.id}`} className="btn btn-primary btn-lg mt-5">
                {(state.chaptersRead[resume.id]?.length ?? 0) > 0 ? 'Reprendre' : 'Commencer'} : {nc.title} <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat emoji="⚡" label="XP total" value={fmtNum(state.xp)} />
        <Stat emoji="🔥" label="Série" value={`${state.streak} j`} sub={`Record : ${state.bestStreak} j`} />
        <div className="card flex items-center gap-3 p-4">
          <Ring value={goalRatio} size={52} stroke={6} color="rgb(var(--good))"><Target size={16} className="text-good" /></Ring>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Objectif du jour</div>
            <div className="text-lg font-extrabold">{state.daily.xp} / {state.dailyGoal} XP</div>
            <div className="text-xs text-muted">{goalRatio >= 1 ? 'Atteint ! 🎉' : `Bonus +${XP.dailyBonus} XP`}</div>
          </div>
        </div>
        <Stat emoji="🏅" label="Badges" value={Object.keys(state.badges).length} sub="débloqués" />
      </section>

      {due > 0 && (
        <section className="card flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent/10 p-5">
          <div className="flex items-center gap-3">
            <Flame className="text-accent" />
            <div>
              <div className="font-extrabold">{due} élément{due > 1 ? 's' : ''} à réviser aujourd'hui</div>
              <div className="text-sm text-muted">La répétition espacée fixe les notions durablement.</div>
            </div>
          </div>
          {modules.filter((m) => dueQuestionIds(state, m.id).length > 0).slice(0, 1).map((m) => (
            <Link key={m.id} to={`/m/${m.id}/qcm?mode=review`} className="btn btn-primary">Réviser maintenant</Link>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Mes modules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <Link key={m.id} to={`/m/${m.id}`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: m.color + '26' }}>{m.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold">{m.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted">{m.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Bar value={moduleRatio(state, m)} color={m.color} />
                <span className="whitespace-nowrap text-xs font-bold text-muted">{Math.round(moduleRatio(state, m) * 100)} %</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {last && (
        <section className="card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold"><Zap size={18} className="text-accent" /> Dernière activité</h2>
          <div className="flex items-center justify-between text-sm">
            <span>{last.label} · <b>{fmtScore(last.score)}/{fmtScore(last.max)}</b></span>
            <span className="text-muted">{fmtDate(last.at)} · <b className="text-good">+{last.xp} XP</b></span>
          </div>
        </section>
      )}
      {!cloud && (
        <p className="text-center text-xs text-muted">Mode local : ta progression est enregistrée sur cet appareil. Configure Supabase pour la synchroniser et activer le classement.</p>
      )}
    </div>
  );
}
