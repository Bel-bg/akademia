import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationHat, Play, Check } from '@getpapillon/papicons';
import { PageTitle } from '@/components/ui';
import { localAllFormations, modules, type FormationWithModule } from '@/lib/content';
import { useStore } from '@/state/Store';
import { AnimatedEmoji, renderWithAnimatedEmojis } from '@/components/AnimatedEmoji';
import { FormationShareAction } from '@/components/FormationShareModal';

export default function FormationsListPage() {
  const { state } = useStore();
  const [formations] = useState<FormationWithModule[]>(() => localAllFormations());
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Modules distincts
  const availableModules = useMemo(() => {
    const ids = Array.from(new Set(formations.map((f) => f.moduleId)));
    return modules.filter((m) => ids.includes(m.id));
  }, [formations]);

  // Filtrage simple par module
  const filteredFormations = useMemo(() => {
    if (selectedModule === 'all') return formations;
    return formations.filter((f) => f.moduleId === selectedModule);
  }, [formations, selectedModule]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Formations"
        sub="Parcours guidés thématiques tous modules confondus."
        icon={<GraduationHat size={28} />}
      />

      {/* Filtres épurés par module */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedModule('all')}
          className={`rounded-2xl px-4 py-2 font-extrabold transition whitespace-nowrap ${
            selectedModule === 'all'
              ? 'bg-brand text-white shadow-btn-brand'
              : 'border border-line/80 bg-card text-muted hover:text-ink hover:border-brand/40'
          }`}
        >
          Tous les modules ({formations.length})
        </button>
        {availableModules.map((m) => {
          const count = formations.filter((f) => f.moduleId === m.id).length;
          const isSelected = selectedModule === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModule(m.id)}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 font-extrabold transition whitespace-nowrap ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'border border-line/80 bg-card text-muted hover:text-ink hover:border-brand/40'
              }`}
              style={isSelected ? { background: m.color } : undefined}
            >
              <span>{renderWithAnimatedEmojis(m.emoji)}</span>
              <span>{m.title}</span>
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-soft text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grille de cartes épurées : Juste l'essentiel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFormations.map((f) => {
          const done = state.formations?.[`${f.moduleId}:${f.id}`] ?? [];
          const isCompleted = done.length === f.lessons.length && f.lessons.length > 0;
          const hasStarted = done.length > 0;
          const cardAccent = f.color || f.moduleColor;

          return (
            <div
              key={`${f.moduleId}:${f.id}`}
              className="card group flex flex-col justify-between p-5 border border-line/70 transition-all hover:-translate-y-0.5 hover:shadow-card hover:border-brand/40"
            >
              <div>
                {/* Module discret */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted mb-3">
                  <span>{renderWithAnimatedEmojis(f.moduleEmoji)}</span>
                  <span className="truncate">{f.moduleTitle}</span>
                </div>

                {/* Titre de la formation */}
                <Link to={`/m/${f.moduleId}/formation/${f.id}`} className="block">
                  <h3 className="h-display text-xl leading-snug text-ink group-hover:text-brand transition flex items-center gap-2.5">
                    <span className="text-2xl shrink-0">
                      <AnimatedEmoji emoji={f.emoji} size="1.8rem" />
                    </span>
                    <span>{f.title}</span>
                  </h3>
                </Link>
              </div>

              {/* Actions en bas : Commencer & Partager (copie directe) */}
              <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-line/60">
                <Link
                  to={`/m/${f.moduleId}/formation/${f.id}`}
                  className="btn btn-primary !px-4 !py-2 text-xs font-extrabold gap-1.5"
                >
                  {isCompleted ? <Check size={14} /> : <Play size={14} />}
                  <span>{isCompleted ? 'Revoir' : hasStarted ? 'Continuer' : 'Commencer'}</span>
                </Link>

                <FormationShareAction formation={f} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
