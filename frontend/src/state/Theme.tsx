import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';
const Ctx = createContext<{ mode: Mode; dark: boolean; setMode(m: Mode): void } | null>(null);

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return (localStorage.getItem('akademia:theme') as Mode) || 'system';
    } catch {
      return 'system';
    }
  });
  const [dark, setDark] = useState(mode === 'dark' || (mode === 'system' && systemDark()));

  useEffect(() => {
    const apply = () => {
      const d = mode === 'dark' || (mode === 'system' && systemDark());
      setDark(d);
      document.documentElement.classList.toggle('dark', d);
    };
    apply();
    try {
      localStorage.setItem('akademia:theme', mode);
    } catch {
      /* ignore */
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [mode]);

  return <Ctx.Provider value={{ mode, dark, setMode }}>{children}</Ctx.Provider>;
}

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme hors ThemeProvider');
  return v;
};
