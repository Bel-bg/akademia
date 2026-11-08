import { useEffect, useState } from 'react';
import { Check, Plus, Sparkles } from '@getpapillon/papicons';
import { Mascot } from './Mascot';
import { ConfettiBackdrop } from './Decor';
import { fireConfetti } from './Celebrations';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'akademia:pwa_prompt_dismissed_at';
const COOLDOWN_DAYS = 3;

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const diffDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return diffDays < COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(ua);
  const isMacTouch =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return isIosDevice || isMacTouch;
}

export function triggerInstallPrompt(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-install-prompt'));
  }
}

export default function InstallPwaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isApple, setIsApple] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Si l'application tourne déjà en mode autonome (installée), pas de modale
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const apple = isIos();
    setIsApple(apple);

    // Écoute de l'événement PWA standard (Android, Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Ouvrir automatiquement après un court délai pour ne pas brusquer l'étudiant
      if (!isDismissedRecently()) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Écoute de l'ouverture manuelle (depuis le profil ou réglages)
    const handleManualOpen = () => setIsOpen(true);
    window.addEventListener('open-install-prompt', handleManualOpen);

    // Écoute si l'application vient d'être installée
    const handleAppInstalled = () => {
      setInstalled(true);
      setIsOpen(false);
      fireConfetti(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Sur iOS (Safari), beforeinstallprompt n'existe pas : on propose l'installation guidée
    if (apple && !isDismissedRecently()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('open-install-prompt', handleManualOpen);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        fireConfetti(true);
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else {
      // Cas générique ou iOS déjà expliqué
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    markDismissed();
    setIsOpen(false);
  };

  if (installed || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/65 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-brand/20 bg-card p-6 shadow-pop sm:p-7">
        <ConfettiBackdrop />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Mascotte avec yeux globuleux */}
          <div className="relative">
            <Mascot mood="excited" size={110} />
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-card">
              <Sparkles size={16} />
            </div>
          </div>

          <h3 className="h-display mt-3 text-2xl text-ink">
            Installe Akademia sur ton {isApple ? 'iPhone' : 'téléphone'} !
          </h3>
          <p className="mt-1.5 text-xs font-semibold text-muted">
            Accède à tes cours, tes révisions et la Battle hebdomadaire en un clic, directement depuis ton écran d'accueil.
          </p>

          {/* Guide spécifique pour iOS / Safari */}
          {isApple ? (
            <div className="mt-4 w-full space-y-2.5 rounded-2xl border border-line/80 bg-soft/60 p-3.5 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card font-display text-xs font-extrabold text-brand shadow-card">
                  1
                </span>
                <span className="text-xs font-bold text-ink">
                  Appuie sur le bouton <b>Partager</b>{' '}
                  <span className="inline-flex items-center justify-center rounded-lg bg-card px-1.5 py-0.5 align-middle shadow-sm">
                    <svg
                      className="h-4 w-4 text-brand inline-block"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </span>{' '}
                  au bas de Safari.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card font-display text-xs font-extrabold text-brand shadow-card">
                  2
                </span>
                <span className="text-xs font-bold text-ink">
                  Fais défiler et sélectionne <b>« Sur l'écran d'accueil »</b>{' '}
                  <span className="inline-flex items-center justify-center rounded-lg bg-card px-1.5 py-0.5 align-middle shadow-sm">
                    <Plus size={14} className="text-brand inline-block" />
                  </span>
                  .
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card font-display text-xs font-extrabold text-brand shadow-card">
                  3
                </span>
                <span className="text-xs font-bold text-ink">
                  Touche <b>« Ajouter »</b> en haut à droite. C'est installé !
                </span>
              </div>
            </div>
          ) : (
            /* Avantages pour Android / Desktop */
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-left">
              <div className="rounded-2xl border border-line/70 bg-soft/50 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-ink">
                  <Check size={14} className="text-brand" />
                  <span>Plein écran</span>
                </div>
                <div className="mt-0.5 text-[10px] font-semibold text-muted">
                  Sans barre d'adresse
                </div>
              </div>
              <div className="rounded-2xl border border-line/70 bg-soft/50 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-ink">
                  <Check size={14} className="text-brand" />
                  <span>Hors ligne</span>
                </div>
                <div className="mt-0.5 text-[10px] font-semibold text-muted">
                  Cours toujours dispo
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="mt-5 flex w-full flex-col gap-2">
            {isApple ? (
              <button
                type="button"
                onClick={handleDismiss}
                className="btn btn-primary btn-lg w-full"
              >
                C'est noté, compris !
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn btn-primary btn-lg w-full"
              >
                Installer l'application
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-extrabold text-muted hover:text-ink transition py-1"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
