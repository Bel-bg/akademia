import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Award, BarChart3, Bell, BellOff, BookOpen, Flame, Home, LogIn, LogOut, MessageCircle, Moon, Sun, Trophy, Zap, Monitor } from 'lucide-react';
import { modules } from '@/lib/content';
import { levelProgress, tierFor } from '@/lib/gamification';
import { cn, fmtNum } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import { useTheme } from '@/state/Theme';
import { disablePush, enablePush, getPushEnabled } from '@/data/push';
import { Bar } from './ui';
import Celebrations from './Celebrations';

const NAV = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/modules', label: 'Modules', icon: BookOpen },
  { to: '/resultats', label: 'Résultats', icon: BarChart3 },
  { to: '/succes', label: 'Succès', icon: Award },
  { to: '/classement', label: 'Classement', icon: Trophy },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
];
const MOBILE_NAV = NAV.filter((item) => item.to !== '/messages');

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span aria-hidden="true" className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-card">
        <img src="/img.png" alt="" className="absolute left-1/2 top-[43%] w-[250%] max-w-none -translate-x-1/2 -translate-y-[43%]" />
      </span>
      <span className="text-xl font-extrabold tracking-tight">Akademia</span>
    </Link>
  );
}

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  return (
    <button className="btn btn-ghost !px-2.5" onClick={() => setMode(next)} title={`Thème : ${mode === 'system' ? 'automatique' : mode === 'dark' ? 'sombre' : 'clair'}`} aria-label="Changer de thème">
      <Icon size={18} />
    </button>
  );
}

function PushToggle() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPushEnabled().then((value) => {
      if (active) { setEnabled(value); setReady(true); }
    }).catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (enabled) await disablePush();
      else await enablePush();
      setEnabled(!enabled);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de modifier les notifications.');
    } finally {
      setBusy(false);
    }
  };

  const Icon = enabled ? Bell : BellOff;
  return (
    <button
      className="btn btn-ghost !px-2.5"
      onClick={toggle}
      disabled={!ready || busy}
      aria-label={enabled ? 'Désactiver les notifications push' : 'Activer les notifications push'}
      title={enabled ? 'Notifications push activées' : 'Activer les notifications push'}
    >
      <Icon size={18} />
    </button>
  );
}

function XpChip() {
  const { state } = useStore();
  const lp = levelProgress(state.xp);
  const t = tierFor(lp.level);
  return (
    <div className="flex items-center gap-2">
      <Link to="/succes" className="hidden items-center gap-2 rounded-full bg-soft py-1 pl-1 pr-3 sm:flex" title={`${t.name} · niveau ${lp.level}`}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm" style={{ background: t.color + '33' }}>{t.emoji}</span>
        <span className="text-xs font-bold leading-tight">
          Niv. {lp.level}
          <span className="block w-20"><Bar value={lp.ratio} h={4} color={t.color} /></span>
        </span>
      </Link>
      <span className="chip" title="Puissance totale (XP)"><Zap size={13} className="text-accent" />{fmtNum(state.xp)}</span>
      <span className={cn('chip', state.streak > 0 ? 'text-accent' : 'text-muted')} title="Série de jours consécutifs"><Flame size={13} />{state.streak}</span>
    </div>
  );
}

export default function Layout() {
  const { user, signOut, cloud } = useAuth();
  const { syncError } = useStore();
  const loc = useLocation();
  const inReader = loc.pathname.includes('/lire/');

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-card/90 p-5 backdrop-blur lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.filter((item) => item.to !== '/messages' || (cloud && !user?.guest)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-brand text-white shadow-card' : 'text-muted hover:bg-soft hover:text-ink')}>
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 text-[11px] font-bold uppercase tracking-wider text-muted">Mes modules</div>
        <div className="mt-2 flex flex-col gap-1 overflow-y-auto">
          {modules.map((m) => (
            <NavLink key={m.id} to={`/m/${m.id}`} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold', isActive ? 'bg-soft text-ink' : 'text-muted hover:bg-soft hover:text-ink')}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-base" style={{ background: m.color + '26' }}>{m.emoji}</span>
              <span className="truncate">{m.title}</span>
            </NavLink>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          {user?.guest ? (
            cloud ? (
              <Link to="/connexion" className="btn btn-soft w-full"><LogIn size={16} /> Se connecter</Link>
            ) : (
              <span className="text-xs text-muted">Mode local · progression sur cet appareil</span>
            )
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <span className="truncate text-sm font-bold">{user?.username}</span>
              <button className="btn btn-ghost !px-2.5" onClick={() => signOut()} title="Se déconnecter" aria-label="Se déconnecter"><LogOut size={17} /></button>
            </div>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden text-sm font-semibold text-muted lg:block">{user?.guest ? 'Bienvenue 👋' : `Salut ${user?.username} 👋`}</div>
          <div className="flex items-center gap-1">
            <XpChip />
            {cloud && !user?.guest && <>
              <Link to="/messages" className="btn btn-ghost !px-2.5" aria-label="Messages" title="Messages"><MessageCircle size={18} /></Link>
              <PushToggle />
            </>}
            <ThemeToggle />
            {cloud && (user?.guest ? (
              <Link to="/connexion" className="btn btn-ghost !px-2.5 lg:hidden" aria-label="Se connecter"><LogIn size={18} /></Link>
            ) : (
              <button className="btn btn-ghost !px-2.5 lg:hidden" onClick={() => signOut()} aria-label="Se déconnecter"><LogOut size={18} /></button>
            ))}
          </div>
        </div>
      </header>

      <main className={cn('mx-auto px-4 py-6 pb-28 lg:pb-10', inReader ? 'max-w-6xl' : 'max-w-6xl')}>
        {syncError && <p role="alert" className="mb-4 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">Synchronisation : {syncError}</p>}
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE_NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', isActive ? 'text-brand' : 'text-muted')}>
            <n.icon size={20} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Celebrations />
    </div>
  );
}
