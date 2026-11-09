import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, GraduationHat, Lock, Mail, User } from '@getpapillon/papicons';
import { useAuth } from '@/state/AuthContext';
import { FILIERES, FiliereId, useTheme } from '@/state/Theme';
import { Mascot, PeekingMascot } from '@/components/Mascot';
import { CornerClouds, CrossedSwordsIcon, FourPointStar } from '@/components/Decor';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    title: 'Bienvenue sur Akademia !',
    sub: 'Apprends, révise et relève des défis en tant qu’étudiant.',
    mood: 'idle' as const,
  },
  {
    title: 'Mémorise durablement',
    sub: 'Cours illustrés, QCM adaptatifs, défis éclair et cartes mémoire.',
    mood: 'happy' as const,
  },
  {
    title: 'Battles de filières',
    sub: 'Défends ARI ou AIP chaque semaine et fais gagner ton camp !',
    mood: 'excited' as const,
    showSwords: true,
  },
  {
    title: 'Grimpe sur le Podium',
    sub: 'Cumule de l’XP, maintiens ta flamme et débloque les 25 badges.',
    mood: 'proud' as const,
  },
];

export default function AuthPage() {
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { theme, filiere, hasFiliere, setCustomPseudo } = useTheme();
  const nav = useNavigate();

  const [screen, setScreen] = useState<'splash' | 'welcome' | 'join'>('splash');
  const [slide, setSlide] = useState(0);
  const [authMode, setAuthMode] = useState<'up' | 'in'>('up');

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState<FiliereId>(hasFiliere ? filiere : 'ARI');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Le Splash se lance automatiquement pendant 2 secondes puis passe à l'écran Bienvenue
  useEffect(() => {
    if (screen !== 'splash') return;
    const timer = window.setTimeout(() => {
      setScreen('welcome');
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [screen]);

  // Adaptation immédiate du thème selon la filière choisie à l'inscription (ARI -> bleu ciel, AIP -> violet)
  useEffect(() => {
    if (screen === 'join' && authMode === 'up') {
      const targetTheme = selectedFiliere === 'AIP' ? 'violet' : 'ciel';
      document.documentElement.setAttribute('data-theme', targetTheme);
    } else if (screen === 'join' && authMode === 'in') {
      document.documentElement.setAttribute('data-theme', 'ciel');
    }
  }, [screen, authMode, selectedFiliere]);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    if (authMode === 'in') {
      const err = await signIn(email.trim(), pw);
      if (err) setMsg({ ok: false, t: err });
      else nav('/');
    } else {
      const cleanName = name.trim();
      if (!/^[\w.\- À-ÿ]{3,24}$/.test(cleanName)) {
        setMsg({ ok: false, t: 'Pseudo : 3 à 24 caractères.' });
        setBusy(false);
        return;
      }
      setCustomPseudo(cleanName);
      const r = await signUp(email.trim(), pw, cleanName, selectedFiliere);
      if (r.error) setMsg({ ok: false, t: r.error });
      else nav('/');
    }
    setBusy(false);
  };

  const inputWrapCls =
    'flex items-center gap-3 rounded-2xl border-2 border-line bg-card px-4 py-3 transition focus-within:border-brand';
  const inputCls =
    'w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:text-muted/70';

  const activeTheme =
    screen === 'join' && authMode === 'up'
      ? selectedFiliere === 'AIP'
        ? 'violet'
        : 'ciel'
      : theme;

  return (
    <div
      className={cn(
        'relative flex min-h-dvh w-full flex-col justify-between overflow-hidden transition-colors duration-300',
        screen === 'splash'
          ? 'bg-brand text-white'
          : screen === 'welcome'
            ? 'bg-bg-tinted text-ink'
            : 'bg-bg text-ink',
      )}
    >
      {/* ==================== ÉCRAN 1 : SPLASH SCREEN (Automatique 2s) ==================== */}
      {screen === 'splash' && (
        <div className="relative flex min-h-dvh w-full flex-col justify-between overflow-hidden">
          <FourPointStar size={36} color="rgb(255 255 255 / 0.25)" className="absolute left-8 top-20 sm:left-1/4" />
          <FourPointStar size={28} color="rgb(255 255 255 / 0.25)" className="absolute right-8 top-16 sm:right-1/4" />

          <div className="relative z-10 my-auto flex flex-col items-center px-6 pt-16 text-center">
            <div
              className={cn(
                'mb-3 flex h-18 w-18 items-center justify-center rounded-3xl',
                activeTheme === 'violet' ? 'text-gold' : 'text-ink',
              )}
            >
              <GraduationHat size={64} />
            </div>
            <h1 className="h-display text-5xl tracking-tight text-white sm:text-6xl">Akademia</h1>
            <p className="mt-2.5 text-base font-bold text-white/90 sm:text-lg">
              Apprends, Progresse, Gagne.
            </p>
          </div>

          <div className="relative z-10 mt-auto flex justify-center pt-4">
            <PeekingMascot size={340} emphasis />
          </div>
        </div>
      )}

      {/* ==================== ÉCRAN 2 : BIENVENUE / ONBOARDING ==================== */}
      {screen === 'welcome' && (
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-between px-6 pb-20 pt-10 text-center">
          <div className="my-auto flex flex-col items-center">
            <Mascot
              mood={SLIDES[slide].mood}
              size={200}
              emphasis="top-left"
              crown={slide === 3}
            />

            <h1 className="h-display mt-5 flex items-center justify-center gap-2 text-3xl leading-tight sm:text-4xl">
              <span>{SLIDES[slide].title}</span>
              {SLIDES[slide].showSwords && <CrossedSwordsIcon size={28} className="text-brand" />}
            </h1>
            <p className="mt-2.5 max-w-[280px] text-sm font-bold leading-relaxed text-muted sm:text-base">
              {SLIDES[slide].sub}
            </p>

            {/* Indicateurs de carrousel (4 points) */}
            <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Étapes de présentation">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={slide === idx}
                  aria-label={`Diapositive ${idx + 1}`}
                  onClick={() => setSlide(idx)}
                  className={cn(
                    'h-2.5 rounded-full transition-all',
                    slide === idx ? 'w-6 bg-brand' : 'w-2.5 bg-brand/25 hover:bg-brand/45',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="relative z-20 mt-6 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode('up');
                setMsg(null);
                setScreen('join');
              }}
              className="btn btn-primary btn-lg w-full"
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('in');
                setMsg(null);
                setScreen('join');
              }}
              className={cn(
                'btn btn-lg w-full',
                activeTheme === 'violet' ? 'btn-dark' : 'btn-soft',
              )}
            >
              Se connecter
            </button>
          </div>

          <CornerClouds />
        </div>
      )}

      {/* ==================== ÉCRAN 3 : INSCRIPTION / CONNEXION E-MAIL & MOT DE PASSE ==================== */}
      {screen === 'join' && (
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-6 pb-20 pt-6">
          {/* Bouton retour */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setScreen('welcome');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink shadow-card transition hover:scale-105"
              aria-label="Retour"
            >
              <ChevronLeft size={22} />
            </button>
          </div>

          <div className="my-auto py-4">
            <div className="mb-6 flex flex-col items-center text-center">
              <Mascot
                mood={authMode === 'up' ? 'happy' : 'idle'}
                size={110}
                color={authMode === 'up' ? (selectedFiliere === 'AIP' ? '#7C3AED' : '#1D6FFF') : undefined}
                animate={false}
              />
              <h1 className="h-display mt-2 text-3xl sm:text-4xl">
                {authMode === 'up' ? 'Rejoindre Akademia' : 'Connexion'}
              </h1>
              <p className="mt-1 text-sm font-bold text-muted">
                {authMode === 'up'
                  ? 'Inscris-toi avec ton e-mail et choisis ta filière'
                  : 'Connecte-toi avec ton e-mail et ton mot de passe'}
              </p>
            </div>

            {/* Sélection de la filière universitaire (uniquement ARI -> Bleu et AIP -> Violet) */}
            {authMode === 'up' && (
              <div className="mb-4 rounded-3xl bg-card p-3.5 shadow-card">
                <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-muted">
                  <span>Ta filière universitaire</span>
                  <span className="text-brand">Définit ton thème</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {FILIERES.map((f) => {
                    const active = selectedFiliere === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFiliere(f.id)}
                        className={cn(
                          'relative flex items-center gap-2.5 rounded-2xl border-2 p-2.5 text-left transition',
                          active
                            ? 'border-brand bg-soft/75 shadow-sm'
                            : 'border-line bg-bg/60 hover:bg-soft/40',
                        )}
                        title={f.full}
                      >
                        <Mascot mood={active ? 'happy' : 'idle'} size={40} color={f.color} animate={false} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 font-display text-base font-extrabold text-ink">
                            <span>{f.name}</span>
                            {active && <Check size={14} className="text-brand" />}
                          </div>
                          <div className="truncate text-[10px] font-bold text-muted">
                            {f.id === 'ARI' ? 'Thème Bleu' : 'Thème Violet'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulaire unique E-mail / Mot de passe connecté au backend */}
            <form onSubmit={submit} className="space-y-3">
              {authMode === 'up' && (
                <label className={inputWrapCls}>
                  <User size={18} className="shrink-0 text-brand" />
                  <input
                    className={inputCls}
                    placeholder="Ton pseudo étudiant (ex. Belmonde)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={3}
                    maxLength={24}
                    autoComplete="nickname"
                  />
                </label>
              )}

              <label className={inputWrapCls}>
                <Mail size={18} className="shrink-0 text-brand" />
                <input
                  className={inputCls}
                  type="email"
                  placeholder="Ton adresse e-mail universitaire"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <label className={inputWrapCls}>
                <Lock size={18} className="shrink-0 text-brand" />
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Mot de passe (6 caractères min.)"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={authMode === 'in' ? 'current-password' : 'new-password'}
                />
              </label>

              {msg && (
                <p
                  role="alert"
                  className={cn(
                    'rounded-2xl p-3 text-xs font-extrabold',
                    msg.ok ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad',
                  )}
                >
                  {msg.t}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
                {busy ? 'Connexion au serveur…' : authMode === 'in' ? 'Se connecter' : 'Créer mon compte'}
              </button>

              {authMode === 'in' && (
                <button
                  type="button"
                  className="w-full text-center text-xs font-bold text-muted underline"
                  onClick={async () => {
                    if (!email.trim()) {
                      setMsg({ ok: false, t: 'Saisis ton adresse e-mail ci-dessus.' });
                      return;
                    }
                    const err = await resetPassword(email.trim(), pw.length >= 6 ? pw : undefined);
                    setMsg(
                      err
                        ? { ok: false, t: err }
                        : {
                            ok: true,
                            t:
                              pw.length >= 6
                                ? 'Mot de passe mis à jour ! Tu peux maintenant te connecter.'
                                : 'Mot de passe réinitialisé par défaut (akademia123).',
                          },
                    );
                  }}
                >
                  Mot de passe oublié ?
                </button>
              )}
            </form>

            <p className="mt-6 text-center text-sm font-bold text-muted">
              {authMode === 'up' ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
              <button
                type="button"
                onClick={() => {
                  setMsg(null);
                  setAuthMode(authMode === 'up' ? 'in' : 'up');
                }}
                className="font-extrabold text-brand underline"
              >
                {authMode === 'up' ? 'Se connecter' : 'Créer un compte'}
              </button>
            </p>
          </div>

          <CornerClouds />
        </div>
      )}
    </div>
  );
}
