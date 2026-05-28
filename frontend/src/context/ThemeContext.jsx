import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { migrateLegacyStorage, VG_KEYS } from '../services/vgStorage.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  migrateLegacyStorage();
  const [theme, setTheme] = useState(() => localStorage.getItem(VG_KEYS.theme) || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(VG_KEYS.theme, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
