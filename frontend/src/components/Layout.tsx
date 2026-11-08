import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Check,
  Crown,
  Folder,
  Grades,
  GraduationHat,
  Home,
  Logout,
  Newspaper,
  Sparkles,
  Star,
  TextBubble,
  User,
} from '@getpapillon/papicons';
import { modules } from '@/lib/content';
import { levelProgress } from '@/lib/gamification';
import { cn, fmtNum } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import { FILIERES, FiliereId, useTheme } from '@/state/Theme';
import { Bar } from './ui';
import Celebrations, { fireConfetti } from './Celebrations';
import { Mascot } from './Mascot';
import { ConfettiBackdrop, FlameBadgeIcon } from './Decor';
import { CustomAvatar } from './CustomAvatar';
import { WeeklyBattleWinnerModal } from './WeeklyBattleWinnerModal';
import { fetchBattle, WeeklyBattleInfo } from '@/data/repo';

const MOBILE_NAV = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/actu', label: 'Actu', icon: Newspaper },
  { to: '/classement', label: 'Classement', icon: Crown },
  { to: '/profil', label: 'Profil', icon: User },
];

const DESKTOP_NAV = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/actu', label: 'Actualités & Battles', icon: Newspaper },
  { to: '/modules', label: 'Modules de cours', icon: Folder },
  { to: '/classement', label: 'Classement', icon: Crown },
  { to: '/messages', label: 'Messages', icon: TextBubble },
  { to: '/profil', label: 'Mon Profil', icon: User },
  { to: '/resultats', label: 'Mes statistiques', icon: Grades },
  { to: '/succes', label: 'Mes badges', icon: Sparkles },
];

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-btn-brand transition-transform group-hover:scale-105">
        <GraduationHat size={22} />
      </span>
      <div className="leading-none">
        <span className="h-display block text-xl tracking-tight text-ink">Akademia</span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Université</span>
      </div>
    </Link>
  );
}

function XpChip() {
  const { state } = useStore();
  const lp = levelProgress(state.xp);
  return (
    <Link
      to="/resultats"
      className="flex items-center gap-2 rounded-2xl border border-line/80 bg-card px-3 py-1.5 shadow-card transition hover:border-brand/40"
      title={`${fmtNum(state.xp)} XP cumulés · Niveau ${lp.level}`}
    >
      <FlameBadgeIcon size={22} />
      <div className="leading-none">
        <span className="font-display block text-xs font-extrabold text-ink">{fmtNum(state.xp)} XP</span>
        <span className="text-[10px] font-extrabold text-brand">Niv. {lp.level}</span>
      </div>
    </Link>
  );
}

/**
 * Modale de premier choix de filière (ARI ou AIP) si l'utilisateur n'en a pas encore.
 */
function FilierePromptModal() {
  const { filiere, hasFiliere, setFiliere } = useTheme();
  const { updateProfile } = useAuth();
  const { setUserFiliere } = useStore();
  const [selected, setSelected] = useState<FiliereId>(filiere);
  const [saving, setSaving] = useState(false);

  if (hasFiliere) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await setFiliere(selected);
      await updateProfile({ filiere: selected });
      await setUserFiliere(selected);
      fireConfetti(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-brand/20 bg-card p-6 shadow-pop sm:p-8">
        <ConfettiBackdrop />

        <div className="relative z-10 flex flex-col items-center text-center">
          <Mascot mood="thinking" size={120} />

          <h3 className="h-display mt-3 text-2xl text-ink">Bienvenue sur Akademia !</h3>
          <p className="mt-2 text-sm font-semibold text-muted">
            Choisis ta filière universitaire pour adapter le thème de ton application et faire gagner des points à ton département lors de la Battle hebdomadaire !
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            {FILIERES.map((f) => {
              const active = selected === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelected(f.id)}
                  className={cn(
                    'flex flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition',
                    active
                      ? 'border-brand bg-soft shadow-card'
                      : 'border-line/70 bg-card hover:border-brand/40',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-display text-lg font-extrabold">{f.id}</span>
                    {active && <Check size={18} className="text-brand" />}
                  </div>
                  <span className="mt-1 text-xs font-semibold text-muted">{f.name}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] font-bold text-muted">
            Attention : la filière ne pourra plus être modifiée par la suite.
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="btn btn-primary btn-lg mt-5 w-full"
          >
            {saving ? 'Enregistrement…' : 'Confirmer ma filière'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, signOut } = useAuth();
  const { state, online, pendingSync, syncError } = useStore();
  const { filiere, customPseudo } = useTheme();
  const loc = useLocation();
  const inReader = loc.pathname.includes('/lire/');

  const [battle, setBattle] = useState<WeeklyBattleInfo | null>(null);

  useEffect(() => {
    let alive = true;
    fetchBattle()
      .then((res) => {
        if (alive) setBattle(res.currentBattle);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      alive = false;
    };
  }, []);

  const totalChapters = modules.reduce((acc, m) => acc + m.chapters.length, 0);
  const readChapters = Object.values(state.chaptersRead ?? {}).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0,
  );
  const globalPct = totalChapters ? Math.min(100, Math.round((readChapters / totalChapters) * 100)) : 0;
  const lp = levelProgress(state.xp);
  const displayName = user?.username || customPseudo;

  return (
    <div className="min-h-screen bg-bg text-ink transition-colors duration-300">
      {/* Sidebar Desktop Playful Soft UI */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-68 flex-col border-r border-line/70 bg-card/80 p-4 shadow-sm backdrop-blur-md lg:flex">
        <div className="px-2 pt-2">
          <Logo />
        </div>

        {/* Carte de Statut Étudiant & Mascotte */}
        <div className="mt-6 rounded-3xl border border-line/60 bg-soft/60 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <CustomAvatar name={displayName} filiere={filiere} size={44} showBadge />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-extrabold text-ink">{displayName}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
                <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                  {filiere}
                </span>
                <span>Niv. {lp.level}</span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] font-bold text-muted">
              <span>Progression cours</span>
              <span>{globalPct}%</span>
            </div>
            <Bar value={globalPct} />
          </div>
        </div>

        {/* Liens de Navigation Desktop */}
        <nav className="mt-6 flex flex-1 flex-col gap-1.5 overflow-y-auto px-1">
          {DESKTOP_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 rounded-2xl px-3.5 py-2.5 font-display text-sm font-extrabold transition-all',
                  isActive
                    ? 'bg-brand text-white shadow-btn-brand'
                    : 'text-muted hover:bg-soft hover:text-ink',
                )}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bas de Sidebar : Mascotte d'encouragement + Déconnexion */}
        <div className="mt-auto pt-3 border-t border-line/60">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Mascot mood="happy" size={38} />
              <span className="text-[11px] font-extrabold text-muted">Prêt à réviser ?</span>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-bad/10 hover:text-bad transition"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <Logout size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Header Mobile & Desktop */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="lg:hidden flex items-center gap-2">
            <Logo />
          </div>
          <div className="hidden items-center gap-2 text-sm font-extrabold text-muted lg:flex">
            <span>
              Salut <b className="text-ink">{displayName}</b> · Prêt à gagner de l'XP pour la filière{' '}
              <b className="text-brand">{filiere}</b> ?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XpChip />
            <Link
              to="/messages"
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-line/80 bg-card text-muted hover:text-brand shadow-card transition"
              aria-label="Messagerie"
              title="Messagerie"
            >
              <TextBubble size={18} />
            </Link>
            <Link to="/profil" className="ml-1 flex items-center" aria-label="Voir mon profil">
              <CustomAvatar name={displayName} filiere={filiere} size={34} showBadge />
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className={cn('mx-auto px-4 py-5 pb-28 lg:py-7 lg:pb-12', inReader ? 'max-w-6xl' : 'max-w-5xl')}>
        {!online && (
          <p role="status" className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-bold text-accent">
            Hors connexion : les cours disponibles restent lisibles et ta progression sera synchronisée au retour du réseau.
          </p>
        )}
        {online && pendingSync > 0 && (
          <p role="status" className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-bold text-accent">
            Synchronisation en attente : {pendingSync} action{pendingSync > 1 ? 's' : ''} à envoyer.
          </p>
        )}
        {syncError && (
          <p role="alert" className="mb-4 rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm font-bold text-bad">
            Synchronisation : {syncError}
          </p>
        )}
        <Outlet />
      </main>

      {/* Bottom Navigation Bar Mobile-First (4 Onglets : Accueil, Actu, Classement, Profil) */}
      <nav
        aria-label="Navigation mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line/70 bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-4px_20px_rgb(0_0_0/0.05)] backdrop-blur-md lg:hidden"
      >
        {MOBILE_NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[11px] font-extrabold transition',
                isActive ? 'text-brand' : 'text-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-full transition-all',
                    isActive && 'bg-soft scale-105',
                  )}
                >
                  <n.icon size={22} />
                </span>
                <span>{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <WeeklyBattleWinnerModal battle={battle} />
      <FilierePromptModal />
      <Celebrations />
    </div>
  );
}
