import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState } from
'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'nexas-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Resolve the first paint: explicit choice wins, otherwise follow the OS. */
function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Private mode or blocked storage — fall through to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ?
  'light' :
  'dark';
}

export function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Push the choice onto <html> and crossfade — but only after the first paint,
  // so the initial render doesn't animate from the wrong palette.
  useEffect(() => {
    const root = document.documentElement;
    const isFirst = root.dataset.theme === undefined;
    root.dataset.theme = theme;

    if (isFirst) return;
    root.classList.add('theme-transition');
    const timer = window.setTimeout(
      () => root.classList.remove('theme-transition'),
      340
    );
    return () => window.clearTimeout(timer);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not fatal — the theme still applies for this session.
    }
  }, []);

  // Follow the OS while the visitor hasn't made an explicit choice.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === 'dark' || stored === 'light') return;

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (event: MediaQueryListEvent) =>
    setThemeState(event.matches ? 'light' : 'dark');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>);

}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context;
}
