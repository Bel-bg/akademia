import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, supabase, cloudEnabled } from '@/data/supabase';
import { disablePush } from '@/data/push';

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  guest: boolean;
}
interface AuthApi {
  user: AuthUser | null;
  ready: boolean;
  cloud: boolean;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string, username: string): Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut(): Promise<void>;
  continueAsGuest(): void;
  resetPassword(email: string): Promise<string | null>;
}

const Ctx = createContext<AuthApi | null>(null);
const GUEST_KEY = 'akademia:guest';
const guestUser: AuthUser = { id: 'guest', username: 'Invité', guest: true };

function frError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Cet e-mail est déjà utilisé.';
  if (m.includes('password should be')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('email not confirmed')) return 'Confirme ton e-mail (lien reçu par courriel) avant de te connecter.';
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (m.includes('username') || m.includes('profiles')) return 'Ce pseudo est déjà pris. Choisis-en un autre.';
  if (m.includes('database error saving new user')) return 'Ce pseudo est indisponible ou invalide (3 à 24 caractères).';
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const fromSession = useCallback(async (session: { access_token: string; user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null) => {
    if (!session) return null;
    const u = session.user;
    let username = (u.user_metadata?.username as string | undefined) ?? (u.email ? u.email.split('@')[0] : 'Joueur');
    try {
      const response = await fetch(`${API_BASE_URL}/me`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (response.ok) {
        const profile = await response.json() as { username?: string };
        if (profile.username) username = profile.username;
      }
    } catch {
      /* profil pas encore créé : on garde le pseudo des métadonnées */
    }
    return { id: u.id, email: u.email ?? undefined, username, guest: false } as AuthUser;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (cloudEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        const u = await fromSession(data.session);
        if (alive && u) setUser(u);
        else if (alive && localStorage.getItem(GUEST_KEY) === '1') setUser(guestUser);
        const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
          const nu = await fromSession(session);
          if (!alive) return;
          if (nu) setUser(nu);
          else setUser((cur) => (cur && !cur.guest ? (localStorage.getItem(GUEST_KEY) === '1' ? guestUser : null) : cur));
        });
        if (alive) setReady(true);
        return () => sub.subscription.unsubscribe();
      }
      // mode local : on démarre directement en invité
      localStorage.setItem(GUEST_KEY, '1');
      if (alive) {
        setUser(guestUser);
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fromSession]);

  const api = useMemo<AuthApi>(
    () => ({
      user, ready, cloud: cloudEnabled,
      async signIn(email, password) {
        if (!supabase) return 'Le mode en ligne n’est pas configuré.';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? frError(error.message) : null;
      },
      async signUp(email, password, username) {
        if (!supabase) return { error: 'Le mode en ligne n’est pas configuré.' };
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) return { error: frError(error.message) };
        return { needsConfirmation: !data.session };
      },
      async signOut() {
        localStorage.removeItem(GUEST_KEY);
        try { await disablePush(); } catch { /* la déconnexion ne doit pas dépendre du service push */ }
        if (supabase) await supabase.auth.signOut();
        setUser(null);
      },
      continueAsGuest() {
        localStorage.setItem(GUEST_KEY, '1');
        setUser(guestUser);
      },
      async resetPassword(email) {
        if (!supabase) return 'Le mode en ligne n’est pas configuré.';
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        return error ? frError(error.message) : null;
      },
    }),
    [user, ready],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth hors AuthProvider');
  return v;
}
