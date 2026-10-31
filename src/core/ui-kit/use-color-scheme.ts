import type { ThemeMode } from './theme';
import { useAppTheme } from './theme-context';

/** Modo claro u oscuro del tema elegido en Ajustes (ya no depende del sistema). */
export function useColorScheme(): ThemeMode {
  return useAppTheme().mode;
}
