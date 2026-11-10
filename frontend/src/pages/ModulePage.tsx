import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Card,
  Check,
  Clock,
  Folder,
  Paper,
  Play,
  Sparkles,
  Tasks,
} from '@getpapillon/papicons';
import { Bar } from '@/components/ui';
import { getModule, localFormations, loadFormations } from '@/lib/content';
import FormationShowcase from '@/components/FormationShowcase';
import { useEffect, useState } from 'react';
import type { Formation } from '@/lib/types';
import { dueCardIds, dueQuestionIds } from '@/lib/progress';
import { chapterAccuracy, moduleRatio, nextChapter } from '@/lib/stats';
import { useStore } from '@/state/Store';
import { Mascot } from '@/components/Mascot';
import { cn } from '@/lib/utils';

export default function ModulePage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { state } = useStore();
  const [formations, setFormations] = useState<Formation[]>(() => (moduleId ? localFormations(moduleId) : []));
  useEffect(() => {
    if (!moduleId) return;
    let alive = true;
    loadFormations(moduleId).then((x) => alive && x.length && setFormations(x)).catch(() => undefined);
    return () => { alive = false; };
  }, [moduleId]);
  if (!m) return <Navigate to="/modules" replace />;
  const read = new Set(state.chaptersRead[m.id] ?? []);
  const nc = nextChapter(state, m);
  const dueQ = dueQuestionIds(state, m.id).length;
  const dueC = dueCardIds(state, m.id).length;

  const modes = [
    m.features.quiz && {
      to: `/m/${m.id}/qcm`,
      icon: Tasks,
      title: 'QCM',
      text: 'Entraîne-toi par chapitre et par difficulté.',
      badge: dueQ ? `${dueQ} à réviser` : undefined,
    },
    m.features.blitz && {
      to: `/m/${m.id}/eclair`,
      icon: Sparkles,
      title: 'Défi éclair',
      text: '90 secondes, 3 vies : combien de points ?',
    },
    m.features.exams && {
      to: `/m/${m.id}/epreuves`,
      icon: Paper,
      title: 'Épreuves',
      text: 'Sujets complets au format examen, avec corrigé.',
    },
    m.features.flashcards && {
      to: `/m/${m.id}/cartes`,
      icon: Card,
      title: 'Cartes mémoire',
      text: 'Définitions et formules clés à retenir.',
      badge: dueC ? `${dueC} à revoir` : undefined,
    },
  ].filter(Boolean) as {
    to: string;
    icon: typeof Sparkles;
    title: string;
    text: string;
    badge?: string;
  }[];

  return (
    <div className="space-y-8">
      {/* Bannière Hero du Module */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl shadow-sm"
            style={{ background: m.color + '26' }}
          >
            <Mascot mood="happy" graduationCap size={82} color={m.color} animate={false} />
          </div>

          <div className="min-w-0 flex-1">
            <span className="rounded-full bg-soft px-3 py-0.5 text-xs font-extrabold text-brand">
              {m.level} · ~{m.estimatedHours} h
            </span>
            <h1 className="h-display mt-1.5 text-3xl sm:text-4xl">{m.title}</h1>
            <p className="font-semibold text-muted">{m.subtitle}</p>
            <div className="mt-3 flex items-center gap-3">
              <Bar value={moduleRatio(state, m)} color={m.color} h={10} className="max-w-xs" />
              <span className="font-display text-sm font-extrabold text-ink">
                {read.size}/{m.chapters.length} chapitres
              </span>
            </div>
          </div>

          {nc && (
            <Link to={`/m/${m.id}/lire/${nc.id}`} className="btn btn-primary btn-lg">
              <Play size={18} />
              <span>{read.size ? 'Reprendre' : 'Commencer'}</span>
            </Link>
          )}
        </div>
        <p className="mt-4 max-w-3xl text-sm font-semibold text-muted">{m.description}</p>
      </section>

      {formations.length > 0 && <FormationShowcase module={m} formations={formations} />}

      {/* Modes d'entraînement gamifiés */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((x) => (
          <Link
            key={x.to}
            to={x.to}
            className="card group relative p-5 transition hover:-translate-y-1 hover:shadow-pop"
          >
            {x.badge && (
              <span className="chip absolute right-3.5 top-3.5 bg-gold/25 text-ink">
                {x.badge}
              </span>
            )}
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ background: m.color }}
            >
              <x.icon size={24} />
            </span>
            <h3 className="h-display mt-3.5 text-xl">{x.title}</h3>
            <p className="mt-0.5 text-xs font-semibold text-muted">{x.text}</p>
          </Link>
        ))}
      </section>

      {/* Parcours de chapitres */}
      <section>
        <h2 className="h-display mb-4 flex items-center gap-2 text-2xl">
          <Folder size={24} className="text-brand" />
          <span>Parcours du cours</span>
        </h2>

        <div className="space-y-6">
          {m.parts.map((p) => (
            <div key={p.id}>
              <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-brand">
                {p.title}
              </h3>
              <div className="grid gap-2.5">
                {p.chapters.map((cid) => {
                  const c = m.chapters.find((x) => x.id === cid);
                  if (!c) return null;
                  const done = read.has(c.id);
                  const acc = chapterAccuracy(state, m.id, c.id);
                  return (
                    <Link
                      key={c.id}
                      to={`/m/${m.id}/lire/${c.id}`}
                      className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-pop"
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-base font-extrabold shadow-sm',
                          done ? 'bg-good text-white' : 'bg-soft text-brand',
                        )}
                      >
                        {done ? <Check size={20} /> : c.number}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-extrabold text-ink">
                          {c.title}
                        </div>
                        <div className="line-clamp-1 text-xs font-semibold text-muted">
                          {c.summary}
                        </div>
                      </div>

                      <div className="hidden shrink-0 text-right text-xs font-bold text-muted sm:block">
                        <div className="flex items-center justify-end gap-1">
                          <Clock size={13} /> {c.minutes} min
                        </div>
                        {acc !== null && (
                          <div className="font-extrabold text-brand">
                            QCM : {Math.round(acc * 100)} %
                          </div>
                        )}
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-muted" />
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
