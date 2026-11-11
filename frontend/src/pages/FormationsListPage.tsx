import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock,
  Filter,
  GraduationHat,
  Play,
  Search,
  Sparkles,
  Star,
} from '@getpapillon/papicons';
import { Bar, PageTitle } from '@/components/ui';
import { localAllFormations, modules, type FormationWithModule } from '@/lib/content';
import { useStore } from '@/state/Store';
import { GlassesCloud } from '@/components/GlassesCloud';
import { AnimatedEmoji, renderWithAnimatedEmojis } from '@/components/AnimatedEmoji';
import { FormationShareAction } from '@/components/FormationShareModal';
import { formationProgress } from '@/components/FormationShowcase';
import { ConfettiBackdrop } from '@/components/Decor';

export default function FormationsListPage() {
  const { state } = useStore();
  const [formations] = useState<FormationWithModule[]>(() => localAllFormations());

  // Filtres
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modules distincts ayant au moins une formation
  const availableModules = useMemo(() => {
    const ids = Array.from(new Set(formations.map((f) => f.moduleId)));
    return modules.filter((m) => ids.includes(m.id));
  }, [formations]);

  // Niveaux distincts
  const availableLevels = useMemo(() => {
    return Array.from(new Set(formations.map((f) => f.level))).filter(Boolean);
  }, [formations]);

  // Statistiques de l'utilisateur
  const stats = useMemo(() => {
    let completedCount = 0;
    let inProgressCount = 0;

    for (const f of formations) {
      const done = state.formations?.[`${f.moduleId}:${f.id}`] ?? [];
      if (done.length === f.lessons.length && f.lessons.length > 0) {
        completedCount++;
      } else if (done.length > 0) {
        inProgressCount++;
      }
    }

    return {
      total: formations.length,
      completed: completedCount,
      inProgress: inProgressCount,
      modulesCount: availableModules.length,
    };
  }, [formations, state.formations, availableModules.length]);

  // Filtrage
  const filteredFormations = useMemo(() => {
    return formations.filter((f) => {
      if (selectedModule !== 'all' && f.moduleId !== selectedModule) return false;
      if (selectedLevel !== 'all' && f.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = f.title.toLowerCase().includes(q);
        const inTagline = f.tagline.toLowerCase().includes(q);
        const inModule = f.moduleTitle.toLowerCase().includes(q);
        const inBenefits = f.benefits?.some((b) => b.toLowerCase().includes(q));
        if (!inTitle && !inTagline && !inModule && !inBenefits) return false;
      }
      return true;
    });
  }, [formations, selectedModule, selectedLevel, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Titre de la page */}
      <PageTitle
        title="Formations coachées"
        sub="Parcours guidés thématiques avec ton coach Nimbo, exercices pratiques et progression étape par étape."
        icon={<GraduationHat size={30} />}
      />

      {/* Bannière Hero / Progression globale */}
      <section className="card relative overflow-hidden p-6 sm:p-7 bg-gradient-to-br from-card via-card to-soft/40 border-2 border-brand/20 shadow-pop">
        <ConfettiBackdrop />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <GlassesCloud size={105} color="rgb(var(--brand))" bob />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-extrabold text-brand">
                <Sparkles size={14} />
                <span>Tous modules confondus</span>
              </div>
              <h2 className="h-display mt-1 text-2xl sm:text-3xl text-ink">
                {stats.total} formations interactives
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-muted max-w-md">
                Pratique le terminal Linux, le routage réseau, ou le SQL Oracle avec des quiz et des exercices codés.
              </p>
            </div>
          </div>

          {/* Badges de stats personnelles */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-end">
            <div className="rounded-2xl border border-line/80 bg-card px-4 py-2.5 text-center shadow-card">
              <span className="font-display block text-xl font-extrabold text-good">
                {stats.completed}
              </span>
              <span className="text-[11px] font-extrabold text-muted">Terminée{stats.completed > 1 ? 's' : ''}</span>
            </div>
            <div className="rounded-2xl border border-line/80 bg-card px-4 py-2.5 text-center shadow-card">
              <span className="font-display block text-xl font-extrabold text-brand">
                {stats.inProgress}
              </span>
              <span className="text-[11px] font-extrabold text-muted">En cours</span>
            </div>
            <div className="rounded-2xl border border-line/80 bg-card px-4 py-2.5 text-center shadow-card">
              <span className="font-display block text-xl font-extrabold text-ink">
                {stats.modulesCount}
              </span>
              <span className="text-[11px] font-extrabold text-muted">Modules</span>
            </div>
          </div>
        </div>
      </section>

      {/* Barre d'outils : Recherche et Filtres */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Champ de recherche */}
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              <Search size={18} />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une formation, une notion…"
              className="w-full rounded-2xl border border-line/80 bg-card py-2.5 pl-10 pr-4 text-sm font-semibold text-ink placeholder:text-muted/70 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
            />
          </div>

          {/* Filtre par niveau */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedLevel('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                selectedLevel === 'all'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-soft text-muted hover:text-ink'
              }`}
            >
              Tous niveaux
            </button>
            {availableLevels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition whitespace-nowrap ${
                  selectedLevel === lvl
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-soft text-muted hover:text-ink'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre par Module sous forme de pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedModule('all')}
            className={`rounded-2xl px-3.5 py-1.5 font-extrabold transition whitespace-nowrap ${
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
                className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 font-extrabold transition whitespace-nowrap ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'border border-line/80 bg-card text-muted hover:text-ink hover:border-brand/40'
                }`}
                style={isSelected ? { background: m.color } : undefined}
              >
                <span>{renderWithAnimatedEmojis(m.emoji)}</span>
                <span>{m.title}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${isSelected ? 'bg-white/25 text-white' : 'bg-soft text-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Grille des Formations */}
      {filteredFormations.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <GlassesCloud size={100} color="rgb(var(--muted))" />
          <h3 className="h-display mt-3 text-xl text-ink">Aucune formation trouvée</h3>
          <p className="mt-1 text-xs font-semibold text-muted">
            Essaie de modifier tes critères de recherche ou de sélectionner un autre module.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedModule('all');
              setSelectedLevel('all');
              setSearchQuery('');
            }}
            className="btn btn-soft mt-4 !px-4 !py-2 text-xs"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFormations.map((f) => {
            const done = state.formations?.[`${f.moduleId}:${f.id}`] ?? [];
            const prog = formationProgress(done, f);
            const isCompleted = prog.n === f.lessons.length && f.lessons.length > 0;
            const cardAccent = f.color || f.moduleColor;

            return (
              <div
                key={`${f.moduleId}:${f.id}`}
                className="card group flex flex-col justify-between overflow-hidden border-2 border-line/70 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-pop relative"
                style={{
                  background: `linear-gradient(175deg, ${cardAccent}12 0%, var(--card) 45%)`,
                }}
              >
                {/* Bordure haute colorée du module */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: cardAccent }}
                  aria-hidden
                />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Badge Module & Niveau */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/m/${f.moduleId}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition hover:opacity-80"
                      style={{ background: `${cardAccent}22`, color: cardAccent }}
                      title={`Voir le module ${f.moduleTitle}`}
                    >
                      <span>{renderWithAnimatedEmojis(f.moduleEmoji)}</span>
                      <span className="truncate max-w-[130px]">{f.moduleTitle}</span>
                    </Link>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
                      <span className="rounded-md bg-soft px-2 py-0.5 font-extrabold text-ink">
                        {f.level}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={12} /> ~{f.minutes}m
                      </span>
                    </div>
                  </div>

                  {/* Titre & Émoji */}
                  <div className="mt-3.5">
                    <Link to={`/m/${f.moduleId}/formation/${f.id}`} className="block">
                      <h3 className="h-display text-xl font-extrabold leading-snug text-ink group-hover:text-brand transition flex items-start gap-2">
                        <span className="text-2xl shrink-0">
                          <AnimatedEmoji emoji={f.emoji} size="1.8rem" />
                        </span>
                        <span>{f.title}</span>
                      </h3>
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-muted">
                      {f.tagline}
                    </p>
                  </div>

                  {/* Progression de l'utilisateur si commencée */}
                  <div className="mt-4 pt-3 border-t border-line/60">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-muted">
                        {isCompleted
                          ? 'Formation validée !'
                          : prog.n > 0
                          ? 'En cours'
                          : 'Non commencée'}
                      </span>
                      <span className={isCompleted ? 'text-good font-extrabold' : 'text-ink'}>
                        {prog.n}/{f.lessons.length} leçon{f.lessons.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-soft">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${prog.pct * 100}%`,
                          background: isCompleted ? 'rgb(var(--good))' : cardAccent,
                        }}
                      />
                    </div>
                  </div>

                  {/* Aperçu des points clés / Bénéfices */}
                  {f.benefits && f.benefits.length > 0 && (
                    <div className="mt-3 space-y-1 text-[11px] font-semibold text-muted">
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: cardAccent }} />
                        <span className="truncate">{f.benefits[0]}</span>
                      </div>
                      {f.benefits[1] && (
                        <div className="flex items-center gap-1.5 line-clamp-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cardAccent }} />
                          <span className="truncate">{f.benefits[1]}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* BAS DES CARDS : OPTIONS PRINCIPALE + OPTION PARTAGE */}
                {/* ======================================================== */}
                <div className="flex items-center justify-between gap-2 border-t border-line/60 bg-bg/50 px-5 py-3">
                  {/* Bouton principal pour entrer dans la formation */}
                  <Link
                    to={`/m/${f.moduleId}/formation/${f.id}`}
                    className="btn btn-primary !px-3.5 !py-2 text-xs font-extrabold gap-1.5 shadow-sm hover:scale-[1.02] transition"
                  >
                    {isCompleted ? (
                      <>
                        <Check size={15} />
                        <span>Revoir</span>
                      </>
                    ) : prog.n > 0 ? (
                      <>
                        <Play size={15} />
                        <span>Continuer</span>
                      </>
                    ) : (
                      <>
                        <Play size={15} />
                        <span>Commencer</span>
                      </>
                    )}
                    <ArrowRight size={14} />
                  </Link>

                  {/* Option Partage (Enregistrer image & Copier lien) */}
                  <FormationShareAction
                    formation={f}
                    moduleTitle={f.moduleTitle}
                    moduleEmoji={f.moduleEmoji}
                    moduleColor={cardAccent}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
