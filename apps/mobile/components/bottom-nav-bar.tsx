import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const TABS = [
  { name: 'Inicio', icon: 'house.fill' as const, route: '/(tabs)' },
  { name: 'Movimientos', icon: 'receipt' as const, route: '/(tabs)/movements' },
  { name: 'Estadísticas', icon: 'chart.bar.fill' as const, route: '/(tabs)/explore' },
  { name: 'Cuentas', icon: 'creditcard.fill' as const, route: '/(tabs)/accounts' },
  { name: 'Más', icon: 'ellipsis.circle.fill' as const, route: '/(tabs)/more' },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const bgColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');
  const inactiveColor = useThemeColor({ light: '#9ca3af', dark: '#6b7280' }, 'text');
  const primary = '#20df60';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.route || (tab.route === '/(tabs)' && pathname === '/');
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.replace(tab.route as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              size={24}
              name={tab.icon}
              color={isActive ? primary : inactiveColor}
            />
            <ThemedText style={[styles.tabLabel, { color: isActive ? primary : inactiveColor }]}>
              {tab.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
