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
  const { filiere } = useTheme();
  const lp = levelProgress(state.xp);
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        to="/profil"
        className="hidden items-center gap-2 rounded-full bg-soft py-1 pl-1.5 pr-3 transition hover:brightness-95 sm:flex"
        title={`Niveau ${lp.level} · Filière ${filiere}`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-white">
          {lp.level}
        </span>
        <span className="text-xs font-extrabold leading-tight">
          Niv. {lp.level} · {filiere}
          <span className="mt-0.5 block w-16">
            <Bar value={lp.ratio} h={5} />
          </span>
        </span>
      </Link>

      <Link to="/profil" className="chip hover:brightness-95" title="Total XP">
        <Star size={14} className="text-brand" />
        <span>{fmtNum(state.xp)} XP</span>
      </Link>

      <Link
        to="/profil"
        className={cn('chip hover:brightness-95', state.streak > 0 ? 'text-ink' : 'text-muted')}
        title="Série de jours consécutifs"
      >
        <FlameBadgeIcon size={16} />
        <span>{state.streak}</span>
      </Link>
    </div>
  );
}

/**
 * Modale obligatoire affichée à la connexion pour les utilisateurs déjà inscrits
 * qui n'avaient pas encore renseigné leur filière (ARI ou AIP).
 * Le thème s'adapte immédiatement (défaut = rouge corail / ARI -> corail / AIP -> violet).
 */
function FilierePromptModal() {
  const { ready } = useStore();
  const { hasFiliere, setFiliere } = useTheme();
  const [picked, setPicked] = useState<FiliereId>('ARI');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const shouldPrompt = ready && !hasFiliere;

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (shouldPrompt) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [shouldPrompt]);

  // Aperçu immédiat de la couleur du thème pendant le choix dans la modale
  useEffect(() => {
    if (!shouldPrompt) return;
    const previewTheme = picked === 'AIP' ? 'violet' : 'corail';
    document.documentElement.setAttribute('data-theme', previewTheme);
  }, [picked, shouldPrompt]);

  if (!shouldPrompt) return null;

  const confirmFiliere = async () => {
    setSaving(true);
    try {
      await setFiliere(picked);
      fireConfetti(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="filiere-prompt-title"
      onCancel={(e) => e.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-4xl border-0 bg-bg p-6 text-center text-ink shadow-pop outline-none animate-pop"
    >
      <div className="relative flex flex-col items-center">
        <ConfettiBackdrop />

        <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-soft px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-brand">
          <GraduationHat size={15} /> Configuration du profil
        </span>

        <h2 id="filiere-prompt-title" className="h-display relative z-10 mt-3 text-2xl sm:text-3xl">
          Quelle est ta filière ?
        </h2>
        <p className="relative z-10 mt-1.5 max-w-xs text-xs font-bold leading-relaxed text-muted">
          Choisis ton camp universitaire entre <b>ARI</b> et <b>AIP</b>. Ton thème Akademia et tes points de Battle s’adaptent automatiquement !
        </p>

        <div className="relative z-10 mt-5 grid w-full grid-cols-2 gap-3">
          {FILIERES.map((f) => {
            const active = picked === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setPicked(f.id)}
                className={cn(
                  'relative flex flex-col items-center rounded-3xl border-2 p-4 text-center transition',
                  active
                    ? 'border-brand bg-card shadow-pop scale-[1.02]'
                    : 'border-line bg-card/70 opacity-80 hover:opacity-100',
                )}
              >
                {active && (
                  <span
                    className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
                    style={{ background: f.color }}
                  >
                    <Check size={14} />
                  </span>
                )}
                <Mascot
                  mood={active ? 'excited' : 'idle'}
                  size={84}
                  color={f.color}
                  animate={false}
                />
                <span className="h-display mt-2 text-2xl font-extrabold" style={{ color: f.color }}>
                  {f.name}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-tight text-muted">
                  {f.full}
                </span>
                <span
                  className="mt-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white"
                  style={{ background: f.color }}
                >
                  {f.id === 'ARI' ? 'Thème Rouge' : 'Thème Violet'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={confirmFiliere}
          disabled={saving}
          className="btn btn-primary btn-lg relative z-10 mt-6 w-full"
        >
          {saving ? 'Validation…' : `Rejoindre la filière ${picked}`}
        </button>
      </div>
    </dialog>
  );
}

export default function Layout() {
  const { user, signOut } = useAuth();
  const { syncError } = useStore();
  const { customPseudo, filiere } = useTheme();
  const [battle, setBattle] = useState<WeeklyBattleInfo | null>(null);
  const loc = useLocation();
  const inReader = loc.pathname.includes('/lire/');
  const displayName = user?.username || customPseudo;

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchBattle()
        .then((res) => {
          if (alive) setBattle(res.currentBattle);
        })
        .catch(() => {
          /* ignore network errors */
        });
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line/70 bg-card/95 p-5 backdrop-blur lg:flex">
        <div className="flex items-center justify-between">
          <Logo />
        </div>

        {/* Mini carte étudiant avec Custom Avatar selon la filière */}
        <Link
          to="/profil"
          className="mt-5 flex items-center gap-3 rounded-3xl bg-bg-tinted p-3.5 transition hover:brightness-95"
        >
          <CustomAvatar name={displayName} filiere={filiere} size={46} showBadge />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-extrabold text-ink">{displayName}</div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand">
              <span>Filière {filiere}</span>
            </div>
          </div>
        </Link>

        <nav className="mt-5 flex flex-col gap-1" aria-label="Navigation principale">
          {DESKTOP_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-extrabold transition',
                  isActive
                    ? 'bg-brand text-white shadow-btn-brand'
                    : 'text-muted hover:bg-soft hover:text-ink',
                )
              }
            >
              <n.icon size={20} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 text-[11px] font-extrabold uppercase tracking-wider text-muted">
          Mes modules
        </div>
        <div className="mt-2 flex flex-col gap-1.5 overflow-y-auto">
          {modules.map((m) => (
            <NavLink
              key={m.id}
              to={`/m/${m.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-extrabold transition',
                  isActive ? 'bg-soft text-brand' : 'text-muted hover:bg-soft/70 hover:text-ink',
                )
              }
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                style={{ background: m.color }}
              >
                {m.id === 'bdd-oracle' ? 'SQL' : 'IoT'}
              </span>
              <span className="truncate">{m.title}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto space-y-3 border-t border-line pt-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CustomAvatar name={displayName} filiere={filiere} size={28} />
              <span className="truncate text-sm font-extrabold">{displayName}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost !px-2.5"
              onClick={() => void signOut()}
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
            <Link to="/profil" className="ml-1 flex items-center" aria-label="Voir mon profil">
              <CustomAvatar name={displayName} filiere={filiere} size={32} showBadge />
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className={cn('mx-auto px-4 py-5 pb-28 lg:py-7 lg:pb-12', inReader ? 'max-w-6xl' : 'max-w-5xl')}>
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
