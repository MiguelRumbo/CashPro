import { ScrollView, View, StyleSheet, TouchableOpacity, Switch, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

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
  const [profileName, setProfileName] = useState('Usuario');
  const [profileEmail, setProfileEmail] = useState('');
  const { currency, setCurrency: setGlobalCurrency } = useCurrency();

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
    { code: 'MXN', label: 'MXN - Peso Mexicano' },
    { code: 'USD', label: 'USD - Dólar Estadounidense' },
    { code: 'EUR', label: 'EUR - Euro' },
  ];

  const getSelectedCurrencyLabel = () => {
    const curr = currencies.find(c => c.code === currency);
    return curr ? curr.label : 'MXN - Peso Mexicano';
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = () => {
    try {
      const result = database.getProfile();
      if (result.success && result.data) {
        setProfileName(result.data.name || 'Usuario');
        setProfileEmail(result.data.email || '');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setShowCurrencyModal(false);
    setGlobalCurrency(currencyCode as 'MXN' | 'USD' | 'EUR');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================
  const handleExportJSON = async () => {
    try {
      const result = database.exportAllDataAsJSON();
      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudieron obtener los datos');
        return;
      }

      const fileName = `cashpro_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(result.data, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Exportar respaldo JSON' });
      } else {
        Alert.alert('Archivo guardado', `Respaldo guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error al exportar JSON:', error);
      Alert.alert('Error', 'No se pudo exportar el respaldo');
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = database.exportMovementsAsCSV();
      if (!result.success) {
        Alert.alert('Sin datos', result.error || 'No hay movimientos para exportar');
        return;
      }

      const fileName = `cashpro_movimientos_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, result.data, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar CSV' });
      } else {
        Alert.alert('Archivo guardado', `CSV guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo CSV');
    }
  };

  const handleExportDB = async () => {
    try {
      const dbPath = database.getDatabasePath();

      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'No se encontró el archivo de base de datos');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dbPath, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: 'Exportar base de datos CashPro',
        });
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error al exportar BD:', error);
      Alert.alert('Error', 'No se pudo exportar la base de datos');
    }
  };

  // ==========================================
  // IMPORT HANDLER
  // ==========================================
  const handleImportData = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'application/x-sqlite3', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) return;

      const file = pickerResult.assets[0];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        Alert.alert(
          'Importar Respaldo JSON',
          'Esto reemplazará TODOS los datos actuales con los del archivo. ¿Continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Importar',
              style: 'destructive',
              onPress: async () => {
                try {
                  const content = await FileSystem.readAsStringAsync(file.uri);
                  const jsonData = JSON.parse(content);
                  const result = database.importDataFromJSON(jsonData);
                  if (result.success) {
                    Alert.alert('Importación exitosa', result.message || 'Datos importados correctamente');
                    fetchProfile();
                  } else {
                    Alert.alert('Error', result.error || 'No se pudieron importar los datos');
                  }
                } catch (e) {
                  Alert.alert('Error', 'El archivo JSON no tiene un formato válido');
                }
              },
            },
          ]
        );
      } else if (fileName.endsWith('.db')) {
        Alert.alert(
          'Importar Base de Datos',
          'Esto reemplazará completamente la base de datos actual. ¿Continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Importar',
              style: 'destructive',
              onPress: async () => {
                try {
                  const dbPath = database.getDatabasePath();
                  await FileSystem.copyAsync({ from: file.uri, to: dbPath });
                  database.initDatabase();
                  Alert.alert('Importación exitosa', 'Base de datos restaurada correctamente. Reinicia la aplicación para ver los cambios.');
                  fetchProfile();
                } catch (e) {
                  Alert.alert('Error', 'No se pudo importar la base de datos');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Formato no soportado', 'Solo se admiten archivos .json y .db');
      }
    } catch (error) {
      console.error('Error al importar datos:', error);
      Alert.alert('Error', 'No se pudo importar el archivo');
    }
  };

  // ==========================================
  // RESET HANDLER
  // ==========================================
  const handleDeleteAllData = () => {
    Alert.alert(
      'Eliminar Todos los Datos',
      '¿Estás seguro de que deseas eliminar TODOS los datos? Esta acción no se puede deshacer.\n\nSe eliminarán:\n• Todas las cuentas\n• Todos los movimientos\n• Todos los presupuestos\n• Todos los objetivos de ahorro\n• Todos los préstamos\n• Todas las suscripciones\n• Todos los vehículos',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: () => {
            try {
              const result = database.resetAllData();
              if (result.success) {
                Alert.alert('Datos eliminados', 'Todos los datos han sido eliminados correctamente');
                fetchProfile();
              } else {
                Alert.alert('Error', result.error || 'No se pudieron eliminar los datos');
              }
            } catch (error) {
              console.error('Error al eliminar datos:', error);
              Alert.alert('Error', 'No se pudieron eliminar los datos');
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
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: surfaceColor }]}
          onPress={() => router.push('/settings/edit-profile')}
        >
          <View style={styles.profileAvatar}>
            <ThemedText style={styles.profileInitials}>{getInitials(profileName)}</ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={[styles.profileName, { color: textMain }]}>{profileName}</ThemedText>
            <ThemedText style={[styles.profileEmail, { color: textMuted }]}>
              {profileEmail || 'Toca para editar perfil'}
            </ThemedText>
          </View>
          <View style={[styles.editButton, { backgroundColor: editButtonBg }]}>
            <IconSymbol size={20} name="pencil" color={textMuted} />
          </View>
        </TouchableOpacity>

        {/* PREFERENCIAS */}
        <ThemedText style={styles.sectionLabel}>PREFERENCIAS</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <TouchableOpacity
            style={[styles.settingsRow]}
            onPress={() => setShowCurrencyModal(true)}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#eff6ff' }]}>
                <IconSymbol size={22} name="banknote" color="#2563eb" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>Moneda</ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  {getSelectedCurrencyLabel()}
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* APARIENCIA */}
        <ThemedText style={styles.sectionLabel}>APARIENCIA</ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
          <TouchableOpacity
            style={[styles.settingsRow]}
            onPress={() => router.push('/settings/notifications')}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#fff7ed' }]}>
                <IconSymbol size={22} name="bell.fill" color="#ea580c" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>Notificaciones</ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Configura tus alertas
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>
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
          {/* Exportar JSON */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
            onPress={handleExportJSON}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#eff6ff' }]}>
                <IconSymbol size={22} name="arrow.down.circle.fill" color="#2563eb" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>
                  Exportar JSON
                </ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Respaldo completo de todos los datos
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>

          {/* Exportar CSV */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
            onPress={handleExportCSV}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: dataIconBg }]}>
                <IconSymbol size={22} name="arrow.down.circle.fill" color={dataIconColor} />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>
                  Exportar CSV
                </ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Movimientos en formato CSV
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>

          {/* Exportar Base de Datos */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
            onPress={handleExportDB}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#f0fdf4' }]}>
                <IconSymbol size={22} name="arrow.up.circle.fill" color="#16a34a" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>
                  Exportar Base de Datos
                </ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Archivo SQLite (.db)
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>

          {/* Importar Datos */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
            onPress={handleImportData}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#faf5ff' }]}>
                <IconSymbol size={22} name="arrow.down.circle.fill" color="#9333ea" />
              </View>
              <View>
                <ThemedText style={[styles.settingsTitle, { color: textMain }]}>
                  Importar Datos
                </ThemedText>
                <ThemedText style={[styles.settingsSubtitle, { color: textMuted }]}>
                  Restaurar desde JSON o SQLite (.db)
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={14} name="chevron.forward" color="#9ca3af" />
          </TouchableOpacity>

          {/* Eliminar Todos los Datos */}
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
        <ThemedText style={styles.versionText}>CashPro v1.1.0 • Build 2602</ThemedText>

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
              {currencies.map((curr, index) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    { borderBottomColor: borderColor },
                    index === currencies.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleCurrencyChange(curr.code)}
                >
                  <ThemedText style={[styles.currencyText, { color: textMain }]}>
                    {curr.label}
                  </ThemedText>
                  {currency === curr.code && (
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
