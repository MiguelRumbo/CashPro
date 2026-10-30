import { StyleSheet, TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/core/ui-kit/icon-symbol';
import { CashProColors } from '@/core/ui-kit/theme';
import { ThemedText } from '@/core/ui-kit/themed-text';
import { ThemedView } from '@/core/ui-kit/themed-view';

import { securityTexts } from '../texts';

export interface LockViewProps {
  /** false mientras se verifica si hay biometría: no se muestra el botón. */
  canUnlock: boolean;
  failed: boolean;
  onUnlock: () => void;
}

/** Pantalla de bloqueo (componente tonto). */
export function LockView({ canUnlock, failed, onUnlock }: LockViewProps) {
  return (
    <ThemedView style={styles.container} accessibilityRole="alert">
      <IconSymbol name="lock.fill" size={48} color={CashProColors.primary} />
      <ThemedText type="subtitle" style={styles.title}>
        {securityTexts.lockTitle}
      </ThemedText>
      <ThemedText style={styles.body}>{securityTexts.lockBody}</ThemedText>
      {failed && <ThemedText style={styles.error}>{securityTexts.failed}</ThemedText>}
      {canUnlock && (
        <TouchableOpacity
          style={styles.button}
          onPress={onUnlock}
          accessibilityRole="button"
          accessibilityLabel={securityTexts.unlockButton}
        >
          <ThemedText style={styles.buttonText}>{securityTexts.unlockButton}</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', opacity: 0.7 },
  error: { textAlign: 'center', color: '#ef4444' },
  button: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CashProColors.primary,
  },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
