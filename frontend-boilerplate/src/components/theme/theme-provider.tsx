import { useEffect, useState, type ReactNode } from 'react';
import { type Theme, ThemeProviderContext } from './theme-context';

const STORAGE_KEY = 'theme';

function systemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme,
  );

  const resolvedTheme = theme === 'system' ? systemTheme() : theme;

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', resolvedTheme === 'dark');
    // `color-scheme` faz o browser pintar scrollbars, inputs e o autofill com
    // a paleta certa. Sem isto, no escuro sobram elementos nativos claros.
    el.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      document.documentElement.classList.toggle('dark', mq.matches);
      document.documentElement.style.colorScheme = mq.matches ? 'dark' : 'light';
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  function setTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
