import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';

type NotificationSettings = {
  id: number;
  daily_reminder: number;
  daily_reminder_time: string;
  credit_card_alerts: number;
  budget_alerts: number;
  loan_alerts: number;
  subscription_alerts: number;
  salary_alerts: number;
  savings_goal_alerts: number;
  vacation_mode: number;
  vacation_mode_until: string | null;
  push_token: string | null;
};

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/settings`);
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración de notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  const updateSetting = async (field: keyof NotificationSettings, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [field]: value ? 1 : 0 };
    setSettings(updatedSettings);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      const result = await response.json();
      if (!result.success) {
        Alert.alert('Error', 'No se pudo actualizar la configuración');
        fetchSettings(); // Recargar configuración original
      }
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
      fetchSettings();
    }
  };

  if (loading || !settings) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Notificaciones', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textMuted }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: 'Notificaciones', headerShown: true }} />

      <ScrollView style={styles.scrollView}>
        {/* Recordatorio Diario */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell.fill" size={20} color={primary} />
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Recordatorio Diario
            </ThemedText>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Recordatorio de registro
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Te recordaremos registrar tus gastos diarios
              </ThemedText>
            </View>
            <Switch
              value={settings.daily_reminder === 1}
              onValueChange={(value) => updateSetting('daily_reminder', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.daily_reminder === 1 ? primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Alertas Financieras */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="creditcard.fill" size={20} color="#3b82f6" />
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Alertas Financieras
            </ThemedText>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Tarjetas de crédito
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Fechas de corte y pago
              </ThemedText>
            </View>
            <Switch
              value={settings.credit_card_alerts === 1}
              onValueChange={(value) => updateSetting('credit_card_alerts', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.credit_card_alerts === 1 ? primary : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Presupuestos
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Cuando alcances el 80% o excedas el límite
              </ThemedText>
            </View>
            <Switch
              value={settings.budget_alerts === 1}
              onValueChange={(value) => updateSetting('budget_alerts', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.budget_alerts === 1 ? primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Recordatorios */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="clock.fill" size={20} color="#f59e0b" />
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Recordatorios
            </ThemedText>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Préstamos
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Cuando se acerque la fecha de vencimiento
              </ThemedText>
            </View>
            <Switch
              value={settings.loan_alerts === 1}
              onValueChange={(value) => updateSetting('loan_alerts', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.loan_alerts === 1 ? primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Suscripciones
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Un día antes del cobro
              </ThemedText>
            </View>
            <Switch
              value={settings.subscription_alerts === 1}
              onValueChange={(value) => updateSetting('subscription_alerts', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.subscription_alerts === 1 ? primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Objetivos de ahorro
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Cuando estés atrasado en tu meta
              </ThemedText>
            </View>
            <Switch
              value={settings.savings_goal_alerts === 1}
              onValueChange={(value) => updateSetting('savings_goal_alerts', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.savings_goal_alerts === 1 ? primary : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Salarios e ingresos
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Recordatorio de ingresos programados
              </ThemedText>
            </View>
            <Switch
              value={settings.salary_alerts === 1}
              onValueChange={(value) => updateSetting('salary_alerts', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.salary_alerts === 1 ? primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Modo Vacaciones */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="airplane" size={20} color="#8b5cf6" />
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Modo Vacaciones
            </ThemedText>
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLeft}>
              <ThemedText style={[styles.settingTitle, { color: textMain }]}>
                Silenciar notificaciones
              </ThemedText>
              <ThemedText style={[styles.settingSubtitle, { color: textMuted }]}>
                Desactiva temporalmente todas las notificaciones
              </ThemedText>
            </View>
            <Switch
              value={settings.vacation_mode === 1}
              onValueChange={(value) => updateSetting('vacation_mode', value)}
              trackColor={{ false: borderColor, true: primary + '80' }}
              thumbColor={settings.vacation_mode === 1 ? primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <IconSymbol name="info.circle" size={16} color={textMuted} />
          <ThemedText style={[styles.infoText, { color: textMuted }]}>
            Las notificaciones push requieren permisos del sistema. Asegúrate de tenerlos activados en la configuración de tu dispositivo.
          </ThemedText>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  settingRowLast: { borderBottomWidth: 0 },
  settingLeft: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  settingSubtitle: { fontSize: 13 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, margin: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
