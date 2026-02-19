import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

type MenuItemProps = {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
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

function MenuItem({ icon, iconColor, iconBg, title, subtitle, onPress, textMain, textMuted, borderColor, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.6}
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

export default function MoreScreen() {
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2b21' }, 'surface');
  const textMain = useThemeColor({ light: '#111827', dark: '#ffffff' }, 'text');
  const textMuted = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: 'rgba(55, 65, 81, 0.5)' }, 'border');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <ThemedText style={[styles.headerTitle, { color: textMain }]}>Más</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Finanzas Section */}
        <ThemedText style={styles.sectionLabel}>FINANZAS</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <MenuItem
            icon="chart.pie.fill"
            iconColor="#9333ea"
            iconBg="#faf5ff"
            title="Presupuestos"
            subtitle="Control de gastos por categoría"
            onPress={() => router.push('/budgets')}
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <MenuItem
            icon="target"
            iconColor="#10b981"
            iconBg="#ecfdf5"
            title="Objetivos de Ahorro"
            subtitle="Metas de ahorro con seguimiento"
            onPress={() => router.push('/savings-goals')}
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <MenuItem
            icon="doc.text"
            iconColor="#f59e0b"
            iconBg="#fffbeb"
            title="Préstamos"
            subtitle="Dinero prestado y por cobrar"
            onPress={() => router.push('/loans')}
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <MenuItem
            icon="repeat"
            iconColor="#3b82f6"
            iconBg="#eff6ff"
            title="Suscripciones y Pagos"
            subtitle="Pagos recurrentes y suscripciones"
            onPress={() => router.push('/subscriptions')}
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
            isLast
          />
        </View>

        <View style={{ height: 40 }} />
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
    color: '#9ca3af',
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
});
