import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'cynexai-theme';

const applyTheme = (t: Theme) => {
  document.documentElement.setAttribute('data-theme', t);
  // Also sync Tailwind's .dark class for any legacy components
  if (t === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Read from localStorage first, then OS preference
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Apply theme on first paint (avoid flash)
  useEffect(() => {
    applyTheme(theme);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Inline script to prevent flash of wrong theme
// Paste this in your index.html <head> BEFORE any stylesheets
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var s = localStorage.getItem('cynexai-theme');
    var t = (s === 'dark' || s === 'light') ? s : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;
