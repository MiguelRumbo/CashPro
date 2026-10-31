import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useBoot } from '@/bootstrap';
import { ThemedApp } from '@/core/preferences/themed-app';
import { ModuleGates } from '@/core/registry/module-gates';
import { CoreProvider } from '@/core/registry/react';
import { coreTexts } from '@/core/texts';
import { ThemedText, ThemedView } from '@/core/ui-kit';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
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

  return (
    <CoreProvider value={boot.runtime}>
      <ThemedApp>
        <ModuleGates>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ModuleGates>
      </ThemedApp>
    </CoreProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorBody: { marginTop: 8, textAlign: 'center' },
});
