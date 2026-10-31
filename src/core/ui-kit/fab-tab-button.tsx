import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from './icon-symbol';
import { radii } from './theme';
import { usePalette } from './theme-context';

const FAB_SIZE = 52;
const FAB_LIFT = 18;
const FAB_ICON_SIZE = 28;

/** Botón central "+" de la barra de pestañas. En lugar de abrir una pestaña ejecuta `onAction`. */
export function FabTabButton({ onAction, label }: { onAction: () => void; label: string }) {
  const palette = usePalette();
  return (
    <View style={styles.slot}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onAction();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.accent, shadowColor: palette.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <IconSymbol name="plus" size={FAB_ICON_SIZE} color={palette.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center' },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radii.md,
    marginTop: -FAB_LIFT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
