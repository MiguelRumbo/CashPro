import { StyleSheet } from 'react-native';

import type { ScreenId } from '../contracts/module';
import { ThemedText } from '../ui-kit/themed-text';
import { ThemedView } from '../ui-kit/themed-view';
import { coreTexts } from '../texts';
import { useRegistry } from './react';

/** Pinta la pantalla aportada por un módulo; si el módulo está apagado muestra un aviso. */
export function ModuleScreen({ screenId }: { screenId: ScreenId }) {
  const Screen = useRegistry().screen(screenId);
  if (!Screen) {
    return (
      <ThemedView style={styles.container} accessibilityRole="summary">
        <ThemedText type="subtitle">{coreTexts.moduleDisabledTitle}</ThemedText>
        <ThemedText style={styles.body}>{coreTexts.moduleDisabledBody}</ThemedText>
      </ThemedView>
    );
  }
  return <Screen />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  body: { marginTop: 8, textAlign: 'center', opacity: 0.7 },
});
