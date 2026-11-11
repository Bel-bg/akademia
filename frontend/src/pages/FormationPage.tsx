import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Play } from '@getpapillon/papicons';
import { Spinner } from '@/components/ui';
import { GlassesCloud } from '@/components/GlassesCloud';
import { ConfettiBackdrop } from '@/components/Decor';
import { AnimatedEmoji } from '@/components/AnimatedEmoji';
import { FormationShareAction } from '@/components/FormationShareModal';
import { getModule, loadFormations } from '@/lib/content';
import type { Formation } from '@/lib/types';
import { useStore } from '@/state/Store';

export default function FormationPage() {
  const { moduleId, fid } = useParams();
  const m = getModule(moduleId);
  const { state } = useStore();
  const [list, setList] = useState<Formation[] | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    let alive = true;
    loadFormations(moduleId).then((x) => alive && setList(x)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [moduleId]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!list) return <Spinner />;
  const f = list.find((x) => x.id === fid);
  if (!f) return <Navigate to={`/m/${m.id}`} replace />;

  const done = state.formations?.[`${m.id}:${f.id}`] ?? [];
  const nextIdx = f.lessons.findIndex((l) => !done.includes(l.id));
  const finished = nextIdx === -1;
  const pct = done.length / f.lessons.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/m/${m.id}`} className="btn btn-soft !px-3.5 !py-1.5 text-xs"><ArrowLeft size={15} /> {m.title}</Link>
        <FormationShareAction formation={f} moduleTitle={m.title} moduleEmoji={m.emoji} moduleColor={f.color} />
      </div>

      <section className="card relative overflow-hidden p-6 text-center" style={{ background: `linear-gradient(160deg, ${f.color}2e, transparent 70%)` }}>
        {finished && <ConfettiBackdrop />}
        <div className="relative z-10 flex flex-col items-center">
          <GlassesCloud size={150} color={f.color} />
          <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-muted">Formation · {f.level} · ~{f.minutes} min</p>
          <h1 className="h-display mt-1 text-3xl"><AnimatedEmoji emoji={f.emoji} /> {f.title}</h1>
          <p className="mt-1 max-w-md font-semibold text-muted">{f.tagline}</p>
          <div className="mt-4 h-3 w-full max-w-sm overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, background: f.color }} />
          </div>
          <p className="mt-1 text-xs font-extrabold text-muted">{done.length}/{f.lessons.length} leçons</p>
          {finished ? (
            <p className="mt-3 rounded-2xl bg-good/15 px-4 py-2 font-display font-extrabold text-good"><AnimatedEmoji emoji="🎓" /> Formation validée - bravo, tu es passé expert !</p>
          ) : (
            <Link to={`/m/${m.id}/formation/${f.id}/${f.lessons[nextIdx].id}`} className="btn btn-primary btn-lg shine-sweep glow-pulse mt-4">
              <Play size={18} /> {done.length ? 'Continuer la formation' : 'Commencer la formation'}
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Parcours">
        <h2 className="h-display mb-3 text-xl">Ton parcours</h2>
        <ol className="relative space-y-3 pl-1">
          <span className="absolute bottom-6 left-[1.65rem] top-6 w-1 rounded bg-line" aria-hidden />
          {f.lessons.map((l, i) => {
            const isDone = done.includes(l.id);
            const isNext = i === nextIdx;
            return (
              <li key={l.id} className="rise-in relative" style={{ animationDelay: `${i * 70}ms` }}>
                <Link
                  to={`/m/${m.id}/formation/${f.id}/${l.id}`}
                  className={`card group relative flex items-center gap-4 p-3.5 pr-4 transition hover:-translate-y-0.5 hover:shadow-pop ${isNext ? 'ring-2' : ''}`}
                  style={isNext ? { ['--tw-ring-color' as string]: f.color } : undefined}
                >
                  <span
                    className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-white shadow-sm ${isNext ? 'glow-pulse' : ''}`}
                    style={{ background: isDone ? 'rgb(var(--good))' : isNext ? f.color : 'rgb(var(--muted) / .5)' }}
                  >
                    {isDone ? <Check size={22} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-extrabold leading-tight"><AnimatedEmoji emoji={l.emoji} /> {l.title}</span>
                    <span className="text-xs font-bold text-muted">~{l.minutes} min · {l.steps.filter((s) => s.type === 'exercise').length} exercice(s)</span>
                  </span>
                  <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
