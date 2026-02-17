import { ScrollView, View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

type SettingsRowProps = {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  hasArrow?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isLast?: boolean;
  textMain: string;
  textMuted: string;
  borderColor: string;
};

function SettingsRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  hasArrow,
  hasSwitch,
  switchValue,
  onSwitchChange,
  isLast,
  textMain,
  textMuted,
  borderColor,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
      activeOpacity={hasSwitch ? 1 : 0.6}
    >
      <View style={styles.settingsRowLeft}>
        <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
          <IconSymbol size={22} name={icon} color={iconColor} />
        </View>
        <View>
          <ThemedText style={[styles.settingsTitle, { color: textMain }]}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>{subtitle}</ThemedText>
          )}
        </View>
      </View>
      {hasArrow && (
        <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
      )}
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#e5e7eb', true: '#20df60' }}
          thumbColor="#ffffff"
        />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [faceId, setFaceId] = useState(true);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2b21' }, 'surface');
  const textMain = useThemeColor({ light: '#111827', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: 'rgba(55, 65, 81, 0.5)' }, 'border');
  const textMuted = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
  const primary = '#20df60';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity style={styles.headerBackButton}>
          <IconSymbol size={24} name="arrow.backward" color={textMain} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textMain }]}>Ajustes</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.profileAvatar}>
            <ThemedText style={styles.profileInitials}>JD</ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={[styles.profileName, { color: textMain }]}>John Doe</ThemedText>
            <ThemedText style={[styles.profileEmail, { color: textMuted }]}>john.doe@cashpro.app</ThemedText>
          </View>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: useThemeColor({ light: '#f9fafb', dark: '#374151' }, 'surface') }]}>
            <IconSymbol size={20} name="pencil" color={textMuted} />
          </TouchableOpacity>
        </View>

        {/* PREFERENCIAS */}
        <ThemedText style={styles.sectionLabel}>PREFERENCIAS</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <SettingsRow
            icon="banknote"
            iconColor="#2563eb"
            iconBg="#eff6ff"
            title="Moneda"
            subtitle="USD - Dólar Estadounidense"
            hasArrow
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <SettingsRow
            icon="chart.pie.fill"
            iconColor="#9333ea"
            iconBg="#faf5ff"
            title="Presupuesto Mensual"
            subtitle="$2,000.00 / Mes"
            hasArrow
            isLast
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
        </View>

        {/* APARIENCIA */}
        <ThemedText style={styles.sectionLabel}>APARIENCIA</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <SettingsRow
            icon="moon.fill"
            iconColor="#4f46e5"
            iconBg="#eef2ff"
            title="Modo Oscuro"
            hasSwitch
            switchValue={darkMode}
            onSwitchChange={setDarkMode}
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <SettingsRow
            icon="bell.fill"
            iconColor="#ea580c"
            iconBg="#fff7ed"
            title="Notificaciones"
            hasSwitch
            switchValue={notifications}
            onSwitchChange={setNotifications}
            isLast
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
        </View>

        {/* SEGURIDAD */}
        <ThemedText style={styles.sectionLabel}>SEGURIDAD</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <SettingsRow
            icon="faceid"
            iconColor="#16a34a"
            iconBg="#f0fdf4"
            title="Face ID"
            subtitle="Para iniciar sesión"
            hasSwitch
            switchValue={faceId}
            onSwitchChange={setFaceId}
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <SettingsRow
            icon="number"
            iconColor="#0d9488"
            iconBg="#f0fdfa"
            title="Cambiar PIN"
            hasArrow
            isLast
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
        </View>

        {/* DATOS */}
        <ThemedText style={styles.sectionLabel}>DATOS</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <SettingsRow
            icon="arrow.down.circle.fill"
            iconColor={useThemeColor({ light: '#4b5563', dark: '#d1d5db' }, 'text')}
            iconBg={useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'surface')}
            title="Exportar CSV"
            hasArrow
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <SettingsRow
            icon="arrow.up.circle.fill"
            iconColor={useThemeColor({ light: '#4b5563', dark: '#d1d5db' }, 'text')}
            iconBg={useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'surface')}
            title="Importar Respaldo"
            hasArrow
            isLast
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: surfaceColor }]}>
          <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
        </TouchableOpacity>

        {/* Version */}
        <ThemedText style={styles.versionText}>CashPro v1.0.2 • Build 2405</ThemedText>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
    paddingRight: 8,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20df60',
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInitials: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  // Sections
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
  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // Logout
  logoutButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
  // Version
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});
