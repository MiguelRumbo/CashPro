import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/core/ui-kit/icon-symbol';
import { radii, spacing, themeIds, themes, type ThemeId } from '@/core/ui-kit/theme';
import { usePalette } from '@/core/ui-kit/theme-context';
import { ThemedText } from '@/core/ui-kit/themed-text';

import { settingsTexts } from '../texts';

export interface ThemePickerViewProps {
  selected: ThemeId;
  onSelect: (theme: ThemeId) => void;
}

const SWATCH_SIZE = 14;

/** Selector de tema de color (componente tonto). Cada opción muestra una vista previa de su paleta. */
export function ThemePickerView({ selected, onSelect }: ThemePickerViewProps) {
  const palette = usePalette();
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {themeIds.map((id) => {
        const theme = themes[id];
        const isSelected = id === selected;
        const { name, description } = settingsTexts.themes[id];
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onSelect(id)}
            accessibilityRole="radio"
            accessibilityLabel={name}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.option,
              {
                backgroundColor: palette.surface,
                borderColor: isSelected ? palette.accent : palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.preview,
                {
                  backgroundColor: theme.palette.bg,
                  experimental_backgroundImage: theme.balanceCard.gradient ?? undefined,
                },
              ]}
            >
              {[theme.palette.surface, theme.palette.accent, theme.palette.negative].map((color) => (
                <View
                  key={color}
                  style={[styles.swatch, { backgroundColor: color, borderColor: theme.palette.line }]}
                />
              ))}
            </View>
            <View style={styles.texts}>
              <ThemedText style={[styles.name, { color: palette.ink }]}>{name}</ThemedText>
              <ThemedText style={[styles.description, { color: palette.muted }]}>{description}</ThemedText>
            </View>
            {isSelected && <IconSymbol name="checkmark.circle.fill" size={22} color={palette.accent} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  preview: {
    width: 64,
    height: 44,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    padding: 6,
  },
  swatch: { width: SWATCH_SIZE, height: SWATCH_SIZE, borderRadius: SWATCH_SIZE / 2, borderWidth: 1 },
  texts: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  description: { fontSize: 12 },
});
