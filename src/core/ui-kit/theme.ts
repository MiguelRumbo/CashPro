/**
 * Sistema visual del rediseño 2.1 (ADR-004): tres temas de color elegibles en Ajustes.
 * Todo color de la UI sale del tema activo (usePalette / useThemeColor).
 */

export type ThemeId = 'forest' | 'daylight' | 'wallet';
export type ThemeMode = 'light' | 'dark';

export interface Palette {
  bg: string;
  surface: string;
  surfaceRaised: string;
  chip: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  positive: string;
  negative: string;
  warning: string;
  info: string;
  white: string;
}

export interface AppTheme {
  id: ThemeId;
  mode: ThemeMode;
  palette: Palette;
  /** Tarjeta de saldo del inicio: degradado (o null) + color de fondo y de texto. */
  balanceCard: { gradient: string | null; background: string; ink: string };
  /** Tarjetas de cuenta: degradado por tipo, o tarjeta plana con borde de color. */
  accountCards: 'gradient' | 'outlined';
  tabBar: { background: string; active: string; inactive: string; border: string };
}

/** Colores de marca por tipo de cuenta (de oscuro a claro) para las tarjetas. */
export const accountCardColors = {
  debit: ['#0a3d8f', '#1767d8'],
  credit: ['#5b1a9a', '#8f3fd6'],
  bank: ['#00699b', '#13a3d6'],
  cash: ['#10563a', '#2bbf77'],
} as const;

/** A · Bosque nocturno (por defecto). */
const forest: AppTheme = {
  id: 'forest',
  mode: 'dark',
  palette: {
    bg: '#0e1512',
    surface: '#16201b',
    surfaceRaised: '#1b2620',
    chip: '#1d2a23',
    line: '#24312a',
    ink: '#edf3ef',
    muted: '#8fa59a',
    accent: '#3ee08f',
    onAccent: '#06210f',
    positive: '#3ee08f',
    negative: '#ff8a7a',
    warning: '#ffb36b',
    info: '#7fc0ff',
    white: '#ffffff',
  },
  balanceCard: {
    gradient: 'linear-gradient(135deg, #2bbf77 0%, #10563a 55%, #0f2a20 100%)',
    background: '#10563a',
    ink: '#f2fff8',
  },
  accountCards: 'gradient',
  tabBar: { background: '#121b17', active: '#3ee08f', inactive: '#8fa59a', border: '#1f2b25' },
};

/** B · Claro con números grandes. */
const daylight: AppTheme = {
  id: 'daylight',
  mode: 'light',
  palette: {
    bg: '#f6f5f1',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    chip: '#ebeee7',
    line: '#ecebe5',
    ink: '#17201b',
    muted: '#6c7369',
    accent: '#0f7a4c',
    onAccent: '#ffffff',
    positive: '#0f7a4c',
    negative: '#c2412d',
    warning: '#b45e09',
    info: '#1f5fbf',
    white: '#ffffff',
  },
  balanceCard: { gradient: null, background: '#ffffff', ink: '#17201b' },
  accountCards: 'outlined',
  tabBar: { background: '#17201b', active: '#ffffff', inactive: '#8d968a', border: '#17201b' },
};

/** C · Cartera (índigo). */
const wallet: AppTheme = {
  id: 'wallet',
  mode: 'light',
  palette: {
    bg: '#eef0f6',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    chip: '#e2e5f2',
    line: '#e4e7f0',
    ink: '#141826',
    muted: '#6a7088',
    accent: '#5b5bf0',
    onAccent: '#ffffff',
    positive: '#17a673',
    negative: '#e5484d',
    warning: '#c26a00',
    info: '#2a5bd7',
    white: '#ffffff',
  },
  balanceCard: { gradient: null, background: '#141826', ink: '#ffffff' },
  accountCards: 'gradient',
  tabBar: { background: '#ffffff', active: '#5b5bf0', inactive: '#6a7088', border: '#e4e7f0' },
};

export const themes: Readonly<Record<ThemeId, AppTheme>> = { forest, daylight, wallet };
export const themeIds = ['forest', 'daylight', 'wallet'] as const satisfies readonly ThemeId[];
export const defaultThemeId: ThemeId = 'forest';

export const radii = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Familias cargadas en el arranque (core/ui-kit/fonts.ts). */
export const fontFamilies = {
  body: {
    400: 'Manrope-Regular',
    500: 'Manrope-Medium',
    600: 'Manrope-SemiBold',
    700: 'Manrope-Bold',
    800: 'Manrope-ExtraBold',
  },
  display: { 600: 'Sora-SemiBold', 700: 'Sora-Bold' },
} as const;

/** A partir de este tamaño (pt) los textos usan la fuente de títulos y cifras. */
export const DISPLAY_MIN_FONT_SIZE = 22;

/** Colores con nombre para useThemeColor, derivados del tema activo. */
export function namedColors(palette: Palette) {
  return {
    text: palette.ink,
    background: palette.bg,
    tint: palette.accent,
    icon: palette.muted,
    tabIconDefault: palette.muted,
    tabIconSelected: palette.accent,
    border: palette.line,
    surface: palette.surface,
    inputBackground: palette.surfaceRaised,
  };
}

export type ColorName = keyof ReturnType<typeof namedColors>;
