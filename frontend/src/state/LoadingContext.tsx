import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import Loader from '@/components/Loader';

export interface LoadingState {
  isLoading: boolean;
  activeCount: number;
  message: string | null;
}

export interface LoadingContextValue extends LoadingState {
  startLoading: (message?: string) => () => void;
  stopLoading: () => void;
  withLoading: <T>(promiseOrFn: Promise<T> | (() => Promise<T>), message?: string) => Promise<T>;
}

type Listener = (state: LoadingState) => void;

class GlobalLoadingManager {
  private activeCount = 0;
  private messageStack: string[] = [];
  private listeners = new Set<Listener>();

  public getState(): LoadingState {
    return {
      isLoading: this.activeCount > 0,
      activeCount: this.activeCount,
      message: this.messageStack.length > 0 ? this.messageStack[this.messageStack.length - 1] : null,
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        /* ignore listener error */
      }
    });
  }

  public start(message?: string): () => void {
    this.activeCount++;
    if (message) {
      this.messageStack.push(message);
    }
    this.notify();

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      if (message) {
        const idx = this.messageStack.lastIndexOf(message);
        if (idx !== -1) {
          this.messageStack.splice(idx, 1);
        }
      }
      this.stop();
    };
  }

  public stop(): void {
    if (this.activeCount > 0) {
      this.activeCount--;
      if (this.activeCount === 0) {
        this.messageStack = [];
      }
      this.notify();
    }
  }

  public async track<T>(promiseOrFn: Promise<T> | (() => Promise<T>), message?: string): Promise<T> {
    const done = this.start(message);
    try {
      const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
      return await promise;
    } finally {
      done();
    }
  }
}

export const globalLoadingManager = new GlobalLoadingManager();

/**
 * Détermine un libellé élégant et contextuel pour la requête API
 */
export function getApiLoadingMessage(url: string, method: string = 'GET'): string {
  const cleanUrl = url.toLowerCase();
  const m = method.toUpperCase();

  if (cleanUrl.includes('/auth/signin')) return 'Connexion en cours…';
  if (cleanUrl.includes('/auth/signup')) return 'Création de votre compte…';
  if (cleanUrl.includes('/auth/refresh')) return 'Actualisation de la session…';
  if (cleanUrl.includes('/auth/reset-password')) return 'Envoi des instructions de réinitialisation…';
  if (cleanUrl.includes('/auth/update-password')) return 'Mise à jour du mot de passe…';
  if (cleanUrl.includes('/progress/sync') || cleanUrl.includes('/progress/save')) return 'Synchronisation de votre progression…';
  if (cleanUrl.includes('/quiz/submit')) return 'Vérification de vos réponses…';
  if (cleanUrl.includes('/exam/submit')) return 'Correction et notation de l’examen…';
  if (cleanUrl.includes('/formation/complete')) return 'Validation de votre leçon…';
  if (cleanUrl.includes('/users/me/filiere')) return 'Enregistrement de votre filière…';
  if (cleanUrl.includes('/users/me/profile')) return 'Mise à jour de votre profil…';
  if (cleanUrl.includes('/leaderboard')) return 'Chargement du classement…';
  if (cleanUrl.includes('/battle')) return 'Chargement des données de battle…';
  if (cleanUrl.includes('/feed') && m === 'POST') return 'Publication en cours…';
  if (cleanUrl.includes('/messages') && m === 'POST') return 'Envoi de votre message…';
  if (cleanUrl.includes('/m/') || cleanUrl.includes('/modules')) return 'Chargement des contenus…';

  return m === 'GET' ? 'Chargement en cours…' : 'Traitement en cours…';
}

/**
 * Initialise l'interception automatique de `window.fetch` pour les requêtes API et Supabase.
 * Empêche les doubles clics et affiche immédiatement le spinner global.
 */
let isFetchIntercepted = false;
export function initGlobalFetchInterceptor() {
  if (typeof window === 'undefined' || isFetchIntercepted) return;
  isFetchIntercepted = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

    // Vérifier si le header x-skip-loader est présent
    let shouldSkip = false;
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        shouldSkip = init.headers.get('x-skip-loader') === 'true';
      } else if (Array.isArray(init.headers)) {
        shouldSkip = init.headers.some(([k, v]) => k.toLowerCase() === 'x-skip-loader' && v === 'true');
      } else if (typeof init.headers === 'object') {
        shouldSkip = (init.headers as Record<string, string>)['x-skip-loader'] === 'true';
      }
    }

    // Cibler les requêtes vers l'API backend (/api, http://localhost:4000/api, etc.) ou Supabase REST/Auth
    const isApi = url.includes('/api/') || url.includes('/api') || url.includes('supabase.co');

    if (!isApi || shouldSkip) {
      return originalFetch(input, init);
    }

    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    const message = getApiLoadingMessage(url, method);

    return globalLoadingManager.track(originalFetch(input, init), message);
  };
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LoadingState>(() => globalLoadingManager.getState());

  useEffect(() => {
    initGlobalFetchInterceptor();
    return globalLoadingManager.subscribe((next) => {
      setState(next);
    });
  }, []);

  const startLoading = useCallback((message?: string) => {
    return globalLoadingManager.start(message);
  }, []);

  const stopLoading = useCallback(() => {
    globalLoadingManager.stop();
  }, []);

  const withLoading = useCallback(async <T,>(promiseOrFn: Promise<T> | (() => Promise<T>), message?: string) => {
    return globalLoadingManager.track(promiseOrFn, message);
  }, []);

  const value = useMemo<LoadingContextValue>(
    () => ({
      ...state,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [state, startLoading, stopLoading, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoaderOverlay state={state} />
    </LoadingContext.Provider>
  );
};

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading doit être utilisé au sein d’un LoadingProvider');
  }
  return ctx;
}

/**
 * Overlay plein écran interactif qui bloque les interactions utilisateur (clics multiples)
 * et affiche le Dot Spinner adapté au thème actif de l'application.
 */
export const GlobalLoaderOverlay: React.FC<{ state: LoadingState }> = ({ state }) => {
  if (!state.isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(18, 32, 58, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        pointerEvents: 'all',
        cursor: 'wait',
      }}
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-busy="true"
      aria-label={state.message || 'Chargement en cours'}
    >
      <div
        className="card flex flex-col items-center gap-4 rounded-3xl p-7 max-w-sm w-full mx-auto text-center border-2 border-line bg-card shadow-2xl transition-transform duration-200 scale-100"
        style={{
          boxShadow: '0 20px 40px -15px rgba(var(--brand), 0.35), 0 0 0 1px rgb(var(--line))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Loader size="4.8rem" speed="0.9s" />
        <div className="flex flex-col gap-1 items-center">
          <p className="font-display text-lg font-extrabold text-ink leading-tight">
            {state.message || 'Chargement en cours…'}
          </p>
          <p className="text-xs font-semibold text-muted">
            Veuillez patienter un instant…
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingProvider;
