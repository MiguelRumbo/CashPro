import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';

type Notification = {
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
};

const NOTIF_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  credit_cutoff: { icon: 'calendar', color: '#f59e0b', bg: '#fef3c7' },
  credit_payment: { icon: 'creditcard', color: '#ef4444', bg: '#fee2e2' },
  budget_exceeded: { icon: 'exclamationmark.triangle', color: '#ef4444', bg: '#fee2e2' },
  budget_warning: { icon: 'chart.bar.fill', color: '#f59e0b', bg: '#fef3c7' },
  loan_due: { icon: 'banknote', color: '#7c3aed', bg: '#ede9fe' },
  subscription_due: { icon: 'repeat', color: '#3b82f6', bg: '#dbeafe' },
  savings_goal_behind: { icon: 'target', color: '#059669', bg: '#d1fae5' },
};

const GROUP_LABELS: Record<string, string> = {
  credit: 'Tarjetas de Crédito',
  budget: 'Presupuestos',
  loan: 'Préstamos',
  subscription: 'Suscripciones',
  savings: 'Objetivos de Ahorro',
};

function getGroup(type: string): string {
  if (type.startsWith('credit')) return 'credit';
  if (type.startsWith('budget')) return 'budget';
  if (type.startsWith('loan')) return 'loan';
  if (type.startsWith('subscription')) return 'subscription';
  if (type.startsWith('savings')) return 'savings';
  return 'other';
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchNotifications = () => {
    const result = database.getPendingNotifications();
    if (result.success) {
      setNotifications(result.data);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  // Group notifications by type prefix
  const grouped: Record<string, Notification[]> = {};
  notifications.forEach((n) => {
    const group = getGroup(n.type);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(n);
  });

  const groupKeys = Object.keys(grouped);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Notificaciones',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings/notifications')}
              style={{ marginRight: 8 }}
            >
              <IconSymbol name="gearshape" size={20} color={primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: primary + '15' }]}>
              <IconSymbol name="bell" size={48} color={primary} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: textMain }]}>
              Sin notificaciones
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: textMuted }]}>
              No tienes alertas pendientes. Todas tus finanzas están al día.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                <IconSymbol name="bell.badge.fill" size={24} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.summaryTitle, { color: textMain }]}>
                  {notifications.length} {notifications.length === 1 ? 'alerta pendiente' : 'alertas pendientes'}
                </ThemedText>
                <ThemedText style={[styles.summarySubtitle, { color: textMuted }]}>
                  Revisa tus finanzas para mantenerlas al día
                </ThemedText>
              </View>
            </View>

            {groupKeys.map((group) => (
              <View key={group} style={styles.groupSection}>
                <ThemedText style={[styles.groupTitle, { color: textMuted }]}>
                  {GROUP_LABELS[group] || group}
                </ThemedText>
                {grouped[group].map((notif, idx) => {
                  const config = NOTIF_CONFIG[notif.type] || { icon: 'bell', color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <TouchableOpacity
                      key={`${notif.type}-${idx}`}
                      style={[styles.notifCard, { backgroundColor: surfaceColor, borderColor }]}
                      onPress={() => {
                        if (notif.data.account_id) {
                          router.push(`/accounts/account-detail?id=${notif.data.account_id}`);
                        } else if (notif.data.budget_id) {
                          router.back();
                        } else if (notif.data.loan_id) {
                          router.back();
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                        <IconSymbol name={config.icon as any} size={20} color={config.color} />
                      </View>
                      <View style={styles.notifContent}>
                        <ThemedText style={[styles.notifTitle, { color: textMain }]}>
                          {notif.title}
                        </ThemedText>
                        <ThemedText style={[styles.notifMessage, { color: textMuted }]}>
                          {notif.message}
                        </ThemedText>
                      </View>
                      <IconSymbol name="chevron.right" size={14} color={borderColor} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  summaryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  summarySubtitle: { fontSize: 13 },
  groupSection: { marginBottom: 16 },
  groupTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  notifMessage: { fontSize: 13, lineHeight: 19 },
});
