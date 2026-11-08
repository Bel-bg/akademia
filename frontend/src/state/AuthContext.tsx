import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredToken, setStoredToken } from '@/data/repo';
import type { BackendThemeId, FiliereId } from '@/lib/types';

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  filiere?: FiliereId | null;
  theme?: BackendThemeId;
  guest: boolean;
}

interface AuthApi {
  user: AuthUser | null;
  ready: boolean;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(
    email: string,
    password: string,
    username: string,
    filiere?: FiliereId,
  ): Promise<{ error?: string }>;
  signOut(): Promise<void>;
  updateProfile(patch: { username?: string; filiere?: FiliereId }): Promise<string | null>;
  resetPassword(email: string, newPassword?: string): Promise<string | null>;
}

const Ctx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const loadSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const me = await apiRequest<{
        id: string;
        email?: string;
        username: string;
        filiere?: FiliereId | null;
        theme?: BackendThemeId;
      }>('/me');
      setUser({
        id: me.id,
        email: me.email,
        username: me.username,
        filiere: me.filiere ?? null,
        theme: me.theme ?? 'corail',
        guest: false,
      });
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const api = useMemo<AuthApi>(
    () => ({
      user,
      ready,
      async signIn(email, password) {
        try {
          const res = await apiRequest<{
            token: string;
            user: {
              id: string;
              email?: string;
              username: string;
              filiere?: FiliereId | null;
              theme?: BackendThemeId;
            };
          }>('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          setStoredToken(res.token);
          setUser({
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            filiere: res.user.filiere ?? null,
            theme: res.user.theme ?? 'corail',
            guest: false,
          });
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : 'E-mail ou mot de passe incorrect.';
        }
      },
      async signUp(email, password, username, filiere) {
        try {
          const res = await apiRequest<{
            token: string;
            user: {
              id: string;
              email?: string;
              username: string;
              filiere?: FiliereId | null;
              theme?: BackendThemeId;
            };
          }>('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, username, filiere }),
          });
          setStoredToken(res.token);
          setUser({
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            filiere: res.user.filiere ?? null,
            theme: res.user.theme ?? 'corail',
            guest: false,
          });
          return {};
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Inscription impossible.' };
        }
      },
      async signOut() {
        try {
          await apiRequest('/auth/signout', { method: 'POST' });
        } catch {
          /* ignore */
        }
        setStoredToken(null);
        setUser(null);
      },
      async updateProfile(patch) {
        try {
          const res = await apiRequest<{
            user: {
              id: string;
              email?: string;
              username: string;
              filiere?: FiliereId | null;
              theme?: BackendThemeId;
            };
          }>('/me', {
            method: 'PATCH',
            body: JSON.stringify(patch),
          });
          setUser({
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            filiere: res.user.filiere ?? null,
            theme: res.user.theme ?? 'corail',
            guest: false,
          });
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : 'Mise à jour impossible.';
        }
      },
      async resetPassword(email, newPassword) {
        try {
          await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, newPassword }),
          });
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : 'Réinitialisation impossible.';
        }
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
