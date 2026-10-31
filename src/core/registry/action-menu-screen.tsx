import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import type { ActionSlot } from '../contracts/module';
import { coreTexts } from '../texts';
import { IconSymbol, type IconSymbolName } from '../ui-kit/icon-symbol';
import { ThemedText } from '../ui-kit/themed-text';
import { ThemedView } from '../ui-kit/themed-view';
import { useThemeColor } from '../ui-kit/use-theme-color';
import { useRegistry } from './react';

type MenuItemProps = {
  icon: IconSymbolName;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  textMain: string;
  textMuted: string;
  borderColor: string;
  isLast?: boolean;
};

function MenuItem({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
  textMain,
  textMuted,
  borderColor,
  isLast,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
          <IconSymbol size={24} name={icon} color={iconColor} />
        </View>
        <View style={styles.menuItemText}>
          <ThemedText style={[styles.menuTitle, { color: textMain }]}>{title}</ThemedText>
          <ThemedText style={[styles.menuSubtitle, { color: textMuted }]}>{subtitle}</ThemedText>
        </View>
      </View>
      <IconSymbol size={16} name="chevron.forward" color="#9ca3af" />
    </TouchableOpacity>
  );
}

/** Menú armado con las acciones que los módulos activos aportan a un slot (pestaña "Más"). */
export function ActionMenuScreen({ slot }: { slot: ActionSlot }) {
  const actions = useRegistry().actions(slot);
  const sections = [
    {
      label: coreTexts.moreSectionFinance,
      items: actions.filter((a) => (a.section ?? 'finance') === 'finance'),
    },
    { label: coreTexts.moreSectionGeneral, items: actions.filter((a) => a.section === 'general') },
  ];
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2b21' }, 'surface');
  const textMain = useThemeColor({ light: '#111827', dark: '#ffffff' }, 'text');
  const textMuted = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: 'rgba(55, 65, 81, 0.5)' }, 'border');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor }]}>
        <ThemedText style={[styles.headerTitle, { color: textMain }]} accessibilityRole="header">
          {coreTexts.moreTitle}
        </ThemedText>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {actions.length === 0 && (
          <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
            <ThemedText style={[styles.menuSubtitle, styles.empty, { color: textMuted }]}>
              {coreTexts.moreEmpty}
            </ThemedText>
          </View>
        )}
        {sections.map(({ label, items }) =>
          items.length === 0 ? null : (
            <View key={label}>
              <ThemedText style={[styles.sectionLabel, { color: textMuted }]}>{label}</ThemedText>
              <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
                {items.map((action, index) => (
                  <MenuItem
                    key={action.id}
                    icon={action.icon}
                    iconColor={action.color}
                    iconBg={action.iconBg}
                    title={action.title}
                    subtitle={action.subtitle}
                    onPress={() => router.push(action.route as Href)}
                    textMain={textMain}
                    textMuted={textMuted}
                    borderColor={borderColor}
                    isLast={index === items.length - 1}
                  />
                ))}
              </View>
            </View>
          ),
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    padding: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
