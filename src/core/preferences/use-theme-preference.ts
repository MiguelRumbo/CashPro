import type { ThemeIdConfig } from '@/config/schema';

import { useCore, usePreferences } from '../registry/react';

/** Tema de color elegido y su setter (se persiste en el perfil vía el módulo settings). */
export function useThemePreference() {
  const { theme } = usePreferences();
  const { preferences } = useCore();
  return { theme, setTheme: (next: ThemeIdConfig) => preferences.set({ theme: next }) };
}
