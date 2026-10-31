import { createContext, useContext, type ReactNode } from 'react';

import { defaultThemeId, themes, type AppTheme, type Palette, type ThemeId } from './theme';

const ThemeIdContext = createContext<ThemeId>(defaultThemeId);

/** Fija el tema activo para el árbol (sin provider se usa el tema por defecto, p. ej. en tests). */
export function AppThemeProvider({ themeId, children }: { themeId: ThemeId; children: ReactNode }) {
  return <ThemeIdContext.Provider value={themeId}>{children}</ThemeIdContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return themes[useContext(ThemeIdContext)];
}

export function usePalette(): Palette {
  return useAppTheme().palette;
}
