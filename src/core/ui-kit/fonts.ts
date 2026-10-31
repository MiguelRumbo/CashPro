import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import * as Font from 'expo-font';

import { fontFamilies } from './theme';

/** Fuentes empaquetadas (solo los pesos que usa la UI). */
const fontSources = {
  [fontFamilies.body[400]]: Manrope_400Regular,
  [fontFamilies.body[500]]: Manrope_500Medium,
  [fontFamilies.body[600]]: Manrope_600SemiBold,
  [fontFamilies.body[700]]: Manrope_700Bold,
  [fontFamilies.body[800]]: Manrope_800ExtraBold,
  [fontFamilies.display[600]]: Sora_600SemiBold,
  [fontFamilies.display[700]]: Sora_700Bold,
};

export const loadAppFonts = (): Promise<void> => Font.loadAsync(fontSources);
