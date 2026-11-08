import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Gears,
  Grades,
  GraduationHat,
  Info,
  Lock,
  Logout,
  Sparkles,
  Star,
  TextBubble,
} from '@getpapillon/papicons';
import { fetchLeaderboard } from '@/data/repo';
import { getPublicProfile, PublicProfile } from '@/data/social';
import { levelProgress } from '@/lib/gamification';
import { cn, fmtNum } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import { FILIERES, useTheme } from '@/state/Theme';
import { Mascot } from '@/components/Mascot';
import { FlameBadgeIcon, TrophyBadgeIcon } from '@/components/Decor';
import { CustomAvatar } from '@/components/CustomAvatar';
import { isStandalone, triggerInstallPrompt } from '@/components/InstallPwaModal';
import { Empty, PageTitle, Spinner, Stat } from '@/components/ui';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, signOut, updateProfile, cloud } = useAuth();
  const { state } = useStore();
  const { theme, filiere, hasFiliere, setFiliere, customPseudo, setCustomPseudo } = useTheme();

  // Public Profile State (if viewing someone else)
  const isPublicView = Boolean(userId && userId !== user?.id);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState('');

  // Self Profile State
  const [openSection, setOpenSection] = useState<'settings' | 'help' | null>(null);
  const [pseudoInput, setPseudoInput] = useState(user?.username || customPseudo);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number>(1);

  useEffect(() => {
    if (user?.username) setPseudoInput(user.username);
  }, [user?.username]);

  // Load public profile if in public view mode
  useEffect(() => {
    if (!isPublicView || !userId) return;
    let active = true;
    setPublicLoading(true);
    setPublicError('');
    getPublicProfile(userId)
      .then((res) => {
        if (active) setPublicProfile(res);
      })
      .catch(() => {
        if (active) setPublicError('Impossible de charger ce profil joueur.');
      })
      .finally(() => {
        if (active) setPublicLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isPublicView, userId]);

  // Load leaderboard rank for self
  useEffect(() => {
    if (isPublicView) return;
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
  }, [isPublicView, user, state.xp]);

  // ==================== RENDU PROFIL PUBLIC JOUEUR ====================
  if (isPublicView) {
    if (publicLoading) return <Spinner label="Chargement du profil…" />;
    if (publicError || !publicProfile) {
      return (
        <Empty mood="surprised" title={publicError || 'Profil introuvable'}>
          <Link to="/classement" className="btn btn-soft mt-3">
            <ArrowLeft size={16} /> Retour au classement
          </Link>
        </Empty>
      );
    }

    const publicLp = levelProgress(publicProfile.xp);
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <PageTitle
          title="Profil joueur"
          right={
            <Link to="/classement" className="btn btn-ghost !px-3">
              <ArrowLeft size={16} /> Classement
            </Link>
          }
        />

        <section className="card relative flex flex-col items-center p-6 text-center shadow-pop">
          <div className="relative flex items-center justify-center rounded-full p-1 border-[3px] border-brand bg-card shadow-card">
            <CustomAvatar name={publicProfile.username} size={88} showBadge />
          </div>

          <h2 className="h-display mt-3 text-2xl text-ink">{publicProfile.username}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-extrabold text-white">
              Niveau {publicLp.level}
            </span>
          </div>

          <div className="mt-6 flex w-full justify-center">
            <Link
              to={`/messages/${publicProfile.id}`}
              className="btn btn-primary btn-lg w-full max-w-xs"
            >
              <TextBubble size={18} /> Envoyer un message
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="card flex flex-col items-center justify-center p-4 text-center">
            <FlameBadgeIcon size={26} />
            <span className="font-display mt-2 text-xl font-extrabold text-ink">
              {publicProfile.streak}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Séries
            </span>
          </div>

          <div className="card flex flex-col items-center justify-center p-4 text-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-soft text-brand font-extrabold text-xs">
              XP
            </div>
            <span className="font-display mt-2 text-xl font-extrabold text-ink">
              {fmtNum(publicProfile.xp)}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
              XP
            </span>
          </div>

          <div className="card flex flex-col items-center justify-center p-4 text-center">
            <Clock size={24} className="text-muted" />
            <span className="font-display mt-2 text-xs font-extrabold text-ink">
              {new Date(publicProfile.created_at).toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Membre
            </span>
          </div>
        </section>
      </div>
    );
  }

  // ==================== RENDU MON PROFIL ====================
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
        <div
          className="pointer-events-none absolute -top-2 h-32 w-64 rounded-full bg-soft/65 blur-xl"
          aria-hidden="true"
        />

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
        <div className="card flex flex-col items-center justify-center p-4 text-center">
          <FlameBadgeIcon size={26} />
          <span className="font-display mt-2 text-2xl font-extrabold text-ink">{state.streak}</span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Séries
          </span>
        </div>

        <div className="card flex flex-col items-center justify-center p-4 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-soft text-brand font-extrabold text-xs">
            XP
          </div>
          <span className="font-display mt-2 text-2xl font-extrabold text-ink">{displayXp}</span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            XP Total
          </span>
        </div>

        <div className="card flex flex-col items-center justify-center p-4 text-center">
          <TrophyBadgeIcon size={26} />
          <span className="font-display mt-2 text-2xl font-extrabold text-ink">#{myRank}</span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Classement
          </span>
        </div>
      </section>

      {/* Liste d'actions du Profil */}
      <section className="card divide-y divide-line/60 overflow-hidden p-0">
        <Link
          to="/resultats"
          className="flex items-center justify-between p-4 transition hover:bg-soft/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand">
              <Grades size={18} />
            </span>
            <span className="font-display text-sm font-extrabold text-ink">Mes statistiques</span>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <Link
          to="/succes"
          className="flex items-center justify-between p-4 transition hover:bg-soft/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand">
              <Sparkles size={18} />
            </span>
            <span className="font-display text-sm font-extrabold text-ink">Mes badges</span>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <Link
          to="/messages"
          className="flex items-center justify-between p-4 transition hover:bg-soft/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand">
              <TextBubble size={18} />
            </span>
            <span className="font-display text-sm font-extrabold text-ink">Messagerie</span>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'settings' ? null : 'settings')}
          className="flex w-full items-center justify-between p-4 transition hover:bg-soft/50 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand">
              <Gears size={18} />
            </span>
            <span className="font-display text-sm font-extrabold text-ink">Paramètres</span>
          </div>
          <ChevronRight
            size={18}
            className={cn('text-muted transition-transform', openSection === 'settings' && 'rotate-90')}
          />
        </button>

        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'help' ? null : 'help')}
          className="flex w-full items-center justify-between p-4 transition hover:bg-soft/50 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand">
              <Info size={18} />
            </span>
            <span className="font-display text-sm font-extrabold text-ink">Aide & Support</span>
          </div>
          <ChevronRight
            size={18}
            className={cn('text-muted transition-transform', openSection === 'help' && 'rotate-90')}
          />
        </button>
      </section>

      {/* ==================== TIROIR PARAMÈTRES ==================== */}
      {openSection === 'settings' && (
        <section className="card space-y-4 p-5 animate-fadeIn">
          <h3 className="font-display text-lg font-extrabold">Paramètres du compte</h3>

          <div>
            <label className="block text-xs font-extrabold uppercase text-muted mb-1.5">
              Modifier mon pseudo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pseudoInput}
                onChange={(e) => setPseudoInput(e.target.value)}
                maxLength={30}
                className="input flex-1"
                placeholder="Ton pseudo..."
              />
              <button
                type="button"
                onClick={handleSavePseudo}
                className="btn btn-primary whitespace-nowrap"
              >
                Enregistrer
              </button>
            </div>
            {saveMsg && <p className="mt-1.5 text-xs font-bold text-good">{saveMsg}</p>}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-extrabold uppercase text-muted mb-1.5">
              Filière universitaire
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FILIERES.map((f) => {
                const active = filiere === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={hasFiliere}
                    onClick={() => void handleSelectFiliere(f.id)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border-2 p-3 text-left transition',
                      active
                        ? 'border-brand bg-soft shadow-sm'
                        : 'border-line/70 bg-card hover:border-brand/40',
                      hasFiliere && 'cursor-not-allowed opacity-90',
                    )}
                  >
                    <div>
                      <div className="font-display text-base font-extrabold">{f.id}</div>
                      <div className="text-[10px] font-bold text-muted">{f.name}</div>
                    </div>
                    {active && <Check size={18} className="text-brand" />}
                    {hasFiliere && !active && <Lock size={14} className="text-muted" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-muted flex items-center gap-1">
              <Lock size={12} /> La filière ne peut plus être modifiée une fois définie.
            </p>
          </div>

          <div className="pt-3 border-t border-line/60 space-y-2">
            {!isStandalone() && (
              <button
                type="button"
                onClick={triggerInstallPrompt}
                className="btn btn-primary w-full"
              >
                <Sparkles size={16} /> Installer l'application sur mon téléphone
              </button>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="btn btn-soft w-full text-bad"
            >
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
            Chaque chapitre lu (+25 XP), QCM réussi, Défi Éclair ou Épreuve te fait monter de niveau et
            rapporte des points à ta filière (<b>{filiere}</b>) lors de la Battle hebdomadaire !
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
