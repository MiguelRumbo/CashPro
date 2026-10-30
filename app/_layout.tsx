import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useBoot } from '@/bootstrap';
import { CoreProvider } from '@/core/registry/react';
import { coreTexts } from '@/core/texts';
import { ThemedText, ThemedView, useColorScheme } from '@/core/ui-kit';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const boot = useBoot();

  if (boot.status === 'loading') return null;
  if (boot.status === 'error') {
    return (
      <ThemedView style={styles.error} accessibilityRole="alert">
        <ThemedText type="subtitle">{coreTexts.bootErrorTitle}</ThemedText>
        <ThemedText style={styles.errorBody}>{coreTexts.bootErrorBody}</ThemedText>
      </ThemedView>
    );
  }

  const { runtime } = boot;
  return (
    <CoreProvider value={runtime}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CoreProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorBody: { marginTop: 8, textAlign: 'center' },
});
