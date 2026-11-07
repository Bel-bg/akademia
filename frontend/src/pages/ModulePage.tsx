import { Link, Navigate, useParams } from 'react-router-dom';
import { BookOpen, Check, Layers, ScrollText, Timer, Zap, Gamepad2 } from 'lucide-react';
import { Bar } from '@/components/ui';
import { getModule } from '@/lib/content';
import { dueCardIds, dueQuestionIds } from '@/lib/progress';
import { chapterAccuracy, moduleRatio, nextChapter } from '@/lib/stats';
import { useStore } from '@/state/Store';

export default function ModulePage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { state } = useStore();
  if (!m) return <Navigate to="/modules" replace />;
  const read = new Set(state.chaptersRead[m.id] ?? []);
  const nc = nextChapter(state, m);
  const dueQ = dueQuestionIds(state, m.id).length;
  const dueC = dueCardIds(state, m.id).length;

  const modes = [
    m.features.quiz && { to: `/m/${m.id}/qcm`, icon: Gamepad2, title: 'QCM', text: 'Entraîne-toi par chapitre et par difficulté.', badge: dueQ ? `${dueQ} à réviser` : undefined },
    m.features.blitz && { to: `/m/${m.id}/eclair`, icon: Zap, title: 'Défi éclair', text: '90 secondes, 3 vies : combien de points ?' },
    m.features.exams && { to: `/m/${m.id}/epreuves`, icon: ScrollText, title: 'Épreuves', text: 'Sujets complets au format examen, avec corrigé.' },
    m.features.flashcards && { to: `/m/${m.id}/cartes`, icon: Layers, title: 'Cartes mémoire', text: 'Définitions et formules à retenir.', badge: dueC ? `${dueC} à revoir` : undefined },
  ].filter(Boolean) as { to: string; icon: typeof Zap; title: string; text: string; badge?: string }[];

  return (
    <div className="space-y-8">
      <section className="card p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${m.color}22, transparent 60%)` }}>
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl text-5xl" style={{ background: m.color + '33' }}>{m.emoji}</span>
          <div className="min-w-0 flex-1">
            <h1 className="h-display text-3xl">{m.title}</h1>
            <p className="text-muted">{m.subtitle}</p>
            <div className="mt-3 flex items-center gap-3">
              <Bar value={moduleRatio(state, m)} color={m.color} className="max-w-xs" />
              <span className="text-xs font-bold text-muted">{read.size}/{m.chapters.length} chapitres</span>
            </div>
          </div>
          {nc && <Link to={`/m/${m.id}/lire/${nc.id}`} className="btn btn-primary btn-lg"><BookOpen size={18} /> {read.size ? 'Reprendre' : 'Commencer'}</Link>}
        </div>
        <p className="mt-4 max-w-3xl text-sm text-muted">{m.description}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((x) => (
          <Link key={x.to} to={x.to} className="card relative p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
            {x.badge && <span className="chip absolute right-3 top-3 bg-accent/15 text-accent">{x.badge}</span>}
            <x.icon size={26} style={{ color: m.color }} />
            <h3 className="mt-3 font-extrabold">{x.title}</h3>
            <p className="text-sm text-muted">{x.text}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold"><BookOpen size={20} /> Le cours</h2>
        <div className="space-y-5">
          {m.parts.map((p) => (
            <div key={p.id}>
              <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">{p.title}</h3>
              <div className="grid gap-2">
                {p.chapters.map((cid) => {
                  const c = m.chapters.find((x) => x.id === cid);
                  if (!c) return null;
                  const done = read.has(c.id);
                  const acc = chapterAccuracy(state, m.id, c.id);
                  return (
                    <Link key={c.id} to={`/m/${m.id}/lire/${c.id}`} className="card flex items-center gap-4 p-4 transition hover:border-brand">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${done ? 'bg-good text-white' : 'bg-soft text-muted'}`}>
                        {done ? <Check size={18} /> : c.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{c.title}</div>
                        <div className="line-clamp-1 text-sm text-muted">{c.summary}</div>
                      </div>
                      <div className="hidden shrink-0 text-right text-xs text-muted sm:block">
                        <div className="flex items-center justify-end gap-1"><Timer size={12} /> {c.minutes} min</div>
                        {acc !== null && <div className="font-bold">QCM : {Math.round(acc * 100)} %</div>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
