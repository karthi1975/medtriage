/**
 * Theme mode switcher for staged MD3 rollout.
 *
 * Resolves the active theme in this order:
 *   1. URL param `?theme=m3` or `?theme=legacy` (persisted on read)
 *   2. localStorage key `synaptix.themeMode`
 *   3. Default `legacy`
 *
 * Keeps MD3 opt-in until the full refresh ships, so production visual stays on
 * the legacy theme for end users.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import legacyTheme from './index';
import m3Theme from './m3';

export type ThemeMode = 'legacy' | 'm3';

const STORAGE_KEY = 'synaptix.themeMode';

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'legacy',
  setMode: () => {},
  toggle: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

/**
 * Phase 4 migration complete: M3 is now the default.
 * Legacy theme remains reachable via `?theme=legacy` as a rollback path.
 */
const DEFAULT_MODE: ThemeMode = 'm3';

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get('theme');
    if (fromUrl === 'm3' || fromUrl === 'legacy') {
      window.localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'm3' || stored === 'legacy') return stored;
  } catch {
    // ignore — storage may be unavailable in privacy modes
  }
  return DEFAULT_MODE;
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'm3' ? 'legacy' : 'm3');
  }, [mode, setMode]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'm3' || e.newValue === 'legacy')) {
        setModeState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const theme = mode === 'm3' ? m3Theme : legacyTheme;

  const value = useMemo<ThemeModeContextValue>(
    () => ({ mode, setMode, toggle }),
    [mode, setMode, toggle],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
