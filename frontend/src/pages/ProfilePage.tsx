import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Gears,
  Grades,
  GraduationHat,
  Info,
  Lock,
  Logout,
  Sparkles,
  Star,
} from '@getpapillon/papicons';
import { fetchLeaderboard } from '@/data/repo';
import { levelProgress } from '@/lib/gamification';
import { fmtNum } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import { FILIERES, useTheme } from '@/state/Theme';
import { Mascot } from '@/components/Mascot';
import { FlameBadgeIcon, TrophyBadgeIcon } from '@/components/Decor';
import { CustomAvatar } from '@/components/CustomAvatar';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, signOut, updateProfile } = useAuth();
  const { state } = useStore();
  const { theme, filiere, hasFiliere, setFiliere, customPseudo, setCustomPseudo } = useTheme();
  const [openSection, setOpenSection] = useState<'settings' | 'help' | null>(null);
  const [pseudoInput, setPseudoInput] = useState(user?.username || customPseudo);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number>(1);

  useEffect(() => {
    if (user?.username) setPseudoInput(user.username);
  }, [user?.username]);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard(50)
      .then((rows) => {
        if (!alive || !user) return;
        const idx = rows.findIndex((r) => r.id === user.id);
        if (idx >= 0) setMyRank(idx + 1);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      alive = false;
    };
  }, [user, state.xp]);

  const lp = levelProgress(state.xp);
  const displayName = user?.username || customPseudo;
  const displayXp = state.xp >= 1000 ? `${(state.xp / 1000).toFixed(1)}k` : fmtNum(state.xp);

  const handleSavePseudo = async () => {
    const clean = pseudoInput.trim();
    if (!clean) return;
    setCustomPseudo(clean);
    const err = await updateProfile({ username: clean });
    setSaveMsg(err || 'Profil mis à jour sur le serveur !');
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const handleSelectFiliere = async (f: 'ARI' | 'AIP') => {
    await setFiliere(f);
    await updateProfile({ filiere: f });
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* En-tête Mon Profil + Roue crantée Paramètres */}
      <div className="relative flex items-center justify-center pt-1">
        <h1 className="h-display text-2xl sm:text-3xl">Mon Profil</h1>
        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'settings' ? null : 'settings')}
          className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink shadow-card transition hover:scale-105"
          aria-label="Paramètres"
        >
          <Gears size={22} />
        </button>
      </div>

      {/* Avatar Personnalisé avec Initiales et Couleur Filière + Nom + Pilule Niveau */}
      <section className="relative flex flex-col items-center text-center">
        <div className="pointer-events-none absolute -top-2 h-32 w-64 rounded-full bg-soft/65 blur-xl" aria-hidden="true" />

        <div className="relative flex items-center justify-center rounded-full p-1 border-[3px] border-brand bg-card shadow-card ring-4 ring-soft">
          <CustomAvatar name={displayName} filiere={filiere} size={96} showBadge />
        </div>

        <h2 className="h-display mt-3 text-3xl text-ink">{displayName}</h2>

        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold text-white shadow-sm',
              theme === 'corail' ? 'bg-[#8B5CF6]' : 'bg-brand',
            )}
          >
            <Star size={13} />
            <span>Niveau {lp.level}</span>
          </span>
          <span className="rounded-full bg-soft px-3 py-1 text-xs font-extrabold text-brand">
            Filière {filiere}
          </span>
        </div>
      </section>

      {/* Grille des 3 Tuiles Statistiques (Séries, XP, Classement) */}
      <section className="grid grid-cols-3 gap-3">
        <div className="card flex flex-col items-center justify-center px-3 py-4 text-center">
          <FlameBadgeIcon size={28} />
          <div className="h-display mt-1.5 text-2xl leading-none text-ink">{state.streak}</div>
          <div className="mt-1 text-xs font-bold text-muted">Séries</div>
        </div>

        <div className="card flex flex-col items-center justify-center px-3 py-4 text-center">
          <span className={cn('flex h-7 w-7 items-center justify-center', theme === 'corail' ? 'text-[#6366F1]' : 'text-brand')}>
            <Star size={26} />
          </span>
          <div className="h-display mt-1.5 text-2xl leading-none text-ink">{displayXp}</div>
          <div className="mt-1 text-xs font-bold text-muted">XP</div>
        </div>

        <Link
          to="/classement"
          className="card flex flex-col items-center justify-center px-3 py-4 text-center transition hover:-translate-y-0.5"
        >
          <TrophyBadgeIcon size={28} />
          <div className="h-display mt-1.5 text-2xl leading-none text-ink">#{myRank}</div>
          <div className="mt-1 text-xs font-bold text-muted">Classement</div>
        </Link>
      </section>

      {/* Menu en liste Soft UI (Mes statistiques, Mes badges, Paramètres, Aide & Support) */}
      <section className="card divide-y divide-line/60 overflow-hidden p-1.5">
        <Link
          to="/resultats"
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-extrabold text-ink transition hover:bg-soft/60"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-soft text-brand">
              <Grades size={19} />
            </span>
            <span>Mes statistiques</span>
          </span>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <Link
          to="/succes"
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-extrabold text-ink transition hover:bg-soft/60"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-soft text-brand">
              <Sparkles size={19} />
            </span>
            <span>Mes badges ({Object.keys(state.badges).length}/25)</span>
          </span>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'settings' ? null : 'settings')}
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-extrabold text-ink transition hover:bg-soft/60"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-soft text-brand">
              <Gears size={19} />
            </span>
            <span>Paramètres</span>
          </span>
          <ChevronRight
            size={18}
            className={cn('text-muted transition-transform', openSection === 'settings' && 'rotate-90')}
          />
        </button>

        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'help' ? null : 'help')}
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-extrabold text-ink transition hover:bg-soft/60"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-soft text-brand">
              <Info size={19} />
            </span>
            <span>Aide & Support</span>
          </span>
          <ChevronRight
            size={18}
            className={cn('text-muted transition-transform', openSection === 'help' && 'rotate-90')}
          />
        </button>
      </section>

      {/* ==================== TIROIR PARAMÈTRES (Pseudo & Filière ARI / AIP) ==================== */}
      {openSection === 'settings' && (
        <section className="card space-y-5 p-5 animate-fadeIn">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-muted">
                Ton pseudo étudiant
              </label>
              <div className="flex gap-2">
                <input
                  value={pseudoInput}
                  onChange={(e) => setPseudoInput(e.target.value)}
                  className="flex-1 rounded-2xl border border-line bg-bg px-3.5 py-2 text-sm font-bold outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => void handleSavePseudo()}
                  className="btn btn-primary !px-4 !py-2 text-xs"
                >
                  Enregistrer
                </button>
              </div>
              {saveMsg && (
                <p className="mt-1.5 text-xs font-extrabold text-brand">{saveMsg}</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-extrabold text-muted">
                  <GraduationHat size={15} className="text-brand" />
                  <span>Ta filière universitaire</span>
                </label>
                <span className="text-[11px] font-bold text-brand">
                  {hasFiliere ? 'Définitive (non modifiable)' : 'Pilote le thème du compte'}
                </span>
              </div>

              {hasFiliere ? (
                <div className="flex items-center justify-between rounded-2xl border-2 border-brand/40 bg-soft/75 p-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CustomAvatar name={displayName} filiere={filiere} size={42} showBadge />
                    <div>
                      <div className="font-display text-base font-extrabold text-ink">
                        Filière {filiere} · {FILIERES.find((f) => f.id === filiere)?.name}
                      </div>
                      <div className="text-[11px] font-bold text-muted">
                        Filière permanente fixée pour les battles de campus
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-black text-brand">
                    <Lock size={12} /> Fixée
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {FILIERES.map((f) => {
                    const active = filiere === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => void handleSelectFiliere(f.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition',
                          active
                            ? 'border-brand bg-soft/75 shadow-sm'
                            : 'border-line hover:bg-soft/35',
                        )}
                      >
                        <Mascot mood={active ? 'happy' : 'idle'} size={44} color={f.color} animate={false} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 font-display text-base font-extrabold text-ink">
                            <span>{f.name}</span>
                            {active && <Check size={14} className="text-brand" />}
                          </div>
                          <div className="truncate text-[10px] font-bold text-muted">
                            {f.full}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-line pt-3">
            <button type="button" onClick={() => void signOut()} className="btn btn-soft w-full text-bad">
              <Logout size={18} /> Se déconnecter
            </button>
          </div>
        </section>
      )}

      {/* ==================== TIROIR AIDE & SUPPORT ==================== */}
      {openSection === 'help' && (
        <section className="card space-y-3 p-5 text-sm animate-fadeIn">
          <h3 className="font-display text-lg font-extrabold">Comment fonctionne Akademia ?</h3>
          <p className="font-semibold text-muted">
            Chaque chapitre lu (+25 XP), QCM réussi, Défi Éclair ou Épreuve te fait monter de niveau et rapporte des points à ta filière (<b>{filiere}</b>) lors de la Battle hebdomadaire !
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/modules" className="btn btn-primary !py-2 text-xs">
              Explorer les modules
            </Link>
            <Link to="/actu" className="btn btn-soft !py-2 text-xs">
              Voir la Battle AIP vs ARI
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
