import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';

import { usePreferences } from '../registry/react';
import { themes } from '../ui-kit/theme';
import { AppThemeProvider } from '../ui-kit/theme-context';

/** Aplica el tema de color elegido a la UI, a la navegación y a la barra de estado. */
export function ThemedApp({ children }: { children: ReactNode }) {
  const { theme: themeId } = usePreferences();
  const theme = themes[themeId];
  const navigationTheme = useMemo<Theme>(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    const { palette } = theme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.bg,
        card: palette.surface,
        text: palette.ink,
        border: palette.line,
      },
    };
  }, [theme]);

  return (
    <AppThemeProvider themeId={themeId}>
      <ThemeProvider value={navigationTheme}>
        {children}
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </AppThemeProvider>
  );
}
