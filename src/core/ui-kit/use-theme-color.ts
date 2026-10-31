import { namedColors, type ColorName } from './theme';
import { useAppTheme } from './theme-context';

/**
 * Grises que las pantallas heredadas de v1 usaban como "texto secundario". Con el sistema de
 * temas, esos pares se traducen al color `muted` del tema activo.
 */
const MUTED_TEXT_HINTS = new Set([
  '#94a3b8',
  '#9ca3af',
  '#cbd5e1',
  '#d1d5db',
  '#475569',
  '#6b7280',
  '#64748b',
]);

/**
 * Color con nombre del tema activo. Los colores `light`/`dark` que reciben las pantallas
 * heredadas ya no se usan como valor: solo sirven para distinguir texto secundario.
 */
export function useThemeColor(props: { light?: string; dark?: string }, colorName: ColorName): string {
  const { palette } = useAppTheme();
  const hint = (props.dark ?? props.light)?.toLowerCase();
  if (colorName === 'text' && hint && MUTED_TEXT_HINTS.has(hint)) return palette.muted;
  return namedColors(palette)[colorName];
}
