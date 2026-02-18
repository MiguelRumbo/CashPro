import { ScrollView, View, StyleSheet, TouchableOpacity, Switch, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';

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
  const [notifications, setNotifications] = useState(true);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('MXN - Peso Mexicano');

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2b21' }, 'surface');
  const textMain = useThemeColor({ light: '#111827', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: 'rgba(55, 65, 81, 0.5)' }, 'border');
  const textMuted = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
  const editButtonBg = useThemeColor({ light: '#f9fafb', dark: '#374151' }, 'surface');
  const dataIconColor = useThemeColor({ light: '#4b5563', dark: '#d1d5db' }, 'text');
  const dataIconBg = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'surface');
  const primary = '#20df60';

  const currencies = [
    'MXN - Peso Mexicano',
    'USD - Dólar Estadounidense',
    'EUR - Euro',
  ];

  const handleDeleteAllData = () => {
    Alert.alert(
      'Eliminar Todos los Datos',
      '¿Estás seguro de que deseas eliminar TODOS los datos? Esta acción no se puede deshacer.\n\nSe eliminarán:\n• Todas las cuentas\n• Todos los movimientos\n• Todas las categorías',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/reset`, {
                method: 'POST',
              });
              const result = await response.json();
              
              if (result.success) {
                Alert.alert('Éxito', 'Todos los datos han sido eliminados correctamente');
              } else {
                Alert.alert('Error', result.error || 'No se pudieron eliminar los datos');
              }
            } catch (error) {
              console.error('Error al eliminar datos:', error);
              Alert.alert('Error', 'No se pudo conectar con el servidor');
            }
          },
        },
      ]
    );
  };

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
            <ThemedText style={styles.profileInitials}>MR</ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={[styles.profileName, { color: textMain }]}>Miguel Rumbo</ThemedText>
            <ThemedText style={[styles.profileEmail, { color: textMuted }]}>miguel.rumbo@cashpro.com</ThemedText>
          </View>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: editButtonBg }]}>
            <IconSymbol size={20} name="pencil" color={textMuted} />
          </TouchableOpacity>
        </View>

        {/* PREFERENCIAS */}
        <ThemedText style={styles.sectionLabel}>PREFERENCIAS</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
            onPress={() => setShowCurrencyModal(true)}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#eff6ff' }]}>
                <IconSymbol size={22} name="banknote" color="#2563eb" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>Moneda</ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  {selectedCurrency}
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsRow]}
            onPress={() => router.push('/budgets')}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#faf5ff' }]}>
                <IconSymbol size={22} name="chart.pie.fill" color="#9333ea" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>
                  Presupuestos
                </ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Gestionar metas
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* APARIENCIA */}
        <ThemedText style={styles.sectionLabel}>APARIENCIA</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
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
            iconColor={dataIconColor}
            iconBg={dataIconBg}
            title="Exportar CSV"
            hasArrow
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <SettingsRow
            icon="arrow.up.circle.fill"
            iconColor={dataIconColor}
            iconBg={dataIconBg}
            title="Importar Respaldo"
            hasArrow
            textMain={textMain}
            textMuted={textMuted}
            borderColor={borderColor}
          />
          <TouchableOpacity
            style={[styles.settingsRow]}
            onPress={handleDeleteAllData}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#fee2e2' }]}>
                <IconSymbol size={22} name="trash.fill" color="#ef4444" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: '#ef4444' }]}>
                  Eliminar Todos los Datos
                </ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Resetear aplicación
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: surfaceColor }]}>
          <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
        </TouchableOpacity>

        {/* Version */}
        <ThemedText style={styles.versionText}>CashPro v1.0.2 • Build 2405</ThemedText>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Seleccionar Moneda
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <IconSymbol size={24} name="xmark" color={textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.currencyList}>
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.currencyItem,
                    { borderBottomColor: borderColor },
                    currency === currencies[currencies.length - 1] && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setSelectedCurrency(currency);
                    setShowCurrencyModal(false);
                  }}
                >
                  <ThemedText style={[styles.currencyText, { color: textMain }]}>
                    {currency}
                  </ThemedText>
                  {selectedCurrency === currency && (
                    <IconSymbol size={20} name="checkmark" color={primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  currencyList: {
    paddingHorizontal: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
