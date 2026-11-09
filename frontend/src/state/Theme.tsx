import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { fetchBackendTheme } from '@/data/repo';
import { themeForFiliere } from '@/lib/progress';
import type { BackendThemeId, FiliereId } from '@/lib/types';
import { useStore } from './Store';

export type ThemeId = BackendThemeId;
export type { FiliereId };

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  subtitle: string;
  brandHex: string;
  mascotHex: string;
  ctaHex: string;
  bgHex: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'ciel',
    name: 'Bleu Azur (ARI)',
    subtitle: 'Architecture des Réseaux & IoT',
    brandHex: '#1D6FFF',
    mascotHex: '#7EB6FF',
    ctaHex: '#1D6FFF',
    bgHex: '#FBF7EF',
  },
  {
    id: 'violet',
    name: 'Violet Royal & Or (AIP)',
    subtitle: 'Automatique & Informatique Industrielle',
    brandHex: '#7C3AED',
    mascotHex: '#8B49F7',
    ctaHex: '#FFD026',
    bgHex: '#FBF7EF',
  },
];

export const FILIERES: { id: FiliereId; name: string; full: string; color: string; theme: ThemeId }[] = [
  {
    id: 'ARI',
    name: 'ARI',
    full: 'Architecture des Réseaux & IoT',
    color: '#1D6FFF',
    theme: 'ciel',
  },
  {
    id: 'AIP',
    name: 'AIP',
    full: 'Automatique & Informatique Industrielle',
    color: '#7C3AED',
    theme: 'violet',
  },
];

interface ThemeContextValue {
  theme: ThemeId;
  themeMeta: ThemeMeta;
  filiere: FiliereId;
  rawFiliere: FiliereId | null;
  hasFiliere: boolean;
  setFiliere(f: FiliereId): Promise<void>;
  customPseudo: string;
  setCustomPseudo(name: string): void;
}

const Ctx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { state, setUserFiliere } = useStore();
  const rawFiliere: FiliereId | null = state.filiere === 'ARI' || state.filiere === 'AIP' ? state.filiere : null;
  const [backendTheme, setBackendTheme] = useState<ThemeId>(() => themeForFiliere(rawFiliere));

  const [customPseudo, setCustomPseudoState] = useState<string>(() => {
    try {
      return localStorage.getItem('akademia:pseudo') || 'Belmonde';
    } catch {
      return 'Belmonde';
    }
  });

  // Synchronisation du thème avec le backend en fonction de la filière (ARI -> ciel, AIP -> violet, défaut -> ciel)
  useEffect(() => {
    let active = true;
    const fallback = themeForFiliere(rawFiliere);
    setBackendTheme(fallback);
    fetchBackendTheme(rawFiliere)
      .then((res) => {
        if (active && (res.theme === 'ciel' || res.theme === 'violet')) {
          setBackendTheme(res.theme);
        }
      })
      .catch(() => {
        if (active) setBackendTheme(fallback);
      });
    return () => {
      active = false;
    };
  }, [rawFiliere]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', backendTheme);
    document.documentElement.classList.remove('dark');
    const metaInfo = THEMES.find((x) => x.id === backendTheme) ?? THEMES[0];
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) metaTag.setAttribute('content', metaInfo.brandHex);
    try {
      if (rawFiliere) {
        localStorage.setItem('akademia:filiere', rawFiliere);
      } else {
        localStorage.removeItem('akademia:filiere');
      }
      localStorage.setItem('akademia:theme', backendTheme);
    } catch {
      /* ignore */
    }
  }, [backendTheme, rawFiliere]);

  const setFiliere = useCallback(
    async (f: FiliereId) => {
      const immediateTheme = themeForFiliere(f);
      setBackendTheme(immediateTheme);
      await setUserFiliere(f);
    },
    [setUserFiliere],
  );

  const setCustomPseudo = (name: string) => {
    const clean = name.trim() || 'Belmonde';
    setCustomPseudoState(clean);
    try {
      localStorage.setItem('akademia:pseudo', clean);
    } catch {
      /* ignore */
    }
  };

  const themeMeta = THEMES.find((t) => t.id === backendTheme) ?? THEMES[0];
  const filiere: FiliereId = rawFiliere ?? 'ARI';

  return (
    <Ctx.Provider
      value={{
        theme: backendTheme,
        themeMeta,
        filiere,
        rawFiliere,
        hasFiliere: rawFiliere !== null,
        setFiliere,
        customPseudo,
        setCustomPseudo,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme hors ThemeProvider');
  return v;
};
