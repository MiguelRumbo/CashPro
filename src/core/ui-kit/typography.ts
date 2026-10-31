import type { TextStyle } from 'react-native';

import { DISPLAY_MIN_FONT_SIZE, fontFamilies } from './theme';

type Weight = 400 | 500 | 600 | 700 | 800;

/** Normaliza fontWeight de React Native ('bold', '600', 600…) a los pesos cargados. */
export function normalizeWeight(weight: TextStyle['fontWeight']): Weight {
  if (weight === 'bold') return 700;
  const n = typeof weight === 'number' ? weight : parseInt(weight ?? '400', 10);
  if (Number.isNaN(n) || n <= 400) return 400;
  if (n <= 500) return 500;
  if (n <= 600) return 600;
  if (n <= 700) return 700;
  return 800;
}

/**
 * En Android una fuente personalizada no sintetiza negritas: cada peso es una familia.
 * Los textos grandes (títulos y cifras) usan la familia de display.
 */
export function fontFamilyFor(weight: TextStyle['fontWeight'], fontSize: number | undefined): string {
  const w = normalizeWeight(weight);
  if ((fontSize ?? 0) >= DISPLAY_MIN_FONT_SIZE) {
    return w >= 700 ? fontFamilies.display[700] : fontFamilies.display[600];
  }
  return fontFamilies.body[w];
}
