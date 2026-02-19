import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useCurrency } from '@/contexts/CurrencyContext';

type RecurringPayment = {
  id: number;
  name: string;
  type: 'subscription' | 'salary' | 'recurring_expense' | 'recurring_income';
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  day_of_week: number | null;
  specific_dates: string | null;
  category_id: string | null;
  account_id: number;
  icon: string;
  color: string;
  is_active: number;
  next_date: string;
  auto_register: number;
  notify_before_days: number;
  created_at: string;
  updated_at: string;
};

export default function SubscriptionsScreen() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/recurring-payments`);
      const result = await response.json();

      if (result.success) {
        setPayments(result.data);
      }
    } catch (error) {
      console.error('Error al cargar pagos recurrentes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [])
  );

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Eliminar',
      `¿Eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/recurring-payments/${id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              if (result.success) fetchPayments();
              else Alert.alert('Error', result.error);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const handleRegister = async (payment: RecurringPayment) => {
    Alert.alert(
      'Registrar Cobro',
      `¿Registrar ${payment.type === 'salary' || payment.type === 'recurring_income' ? 'depósito' : 'cobro'} de ${formatCurrency(payment.amount)} para "${payment.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/recurring-payments/${payment.id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: new Date().toISOString() }),
              });
              const result = await response.json();
              if (result.success) {
                Alert.alert('Registrado', 'Movimiento creado exitosamente');
                fetchPayments();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch {
              Alert.alert('Error', 'No se pudo registrar');
            }
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Suscripción';
      case 'salary': return 'Salario';
      case 'recurring_expense': return 'Gasto Recurrente';
      case 'recurring_income': return 'Ingreso Recurrente';
      default: return 'Recurrente';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quincenal';
      case 'monthly': return 'Mensual';
      case 'yearly': return 'Anual';
      default: return frequency;
    }
  };

  const getDaysUntilNext = (nextDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(nextDate);
    next.setHours(0, 0, 0, 0);
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getNextDateLabel = (nextDate: string) => {
    const days = getDaysUntilNext(nextDate);
    if (days < 0) return 'Vencido';
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    if (days <= 7) return `En ${days} días`;
    return new Date(nextDate).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isIncome = (type: string) => type === 'salary' || type === 'recurring_income';

  const activePayments = payments.filter(p => p.is_active);
  const inactivePayments = payments.filter(p => !p.is_active);

  const subscriptions = activePayments.filter(p => p.type === 'subscription');
  const salaries = activePayments.filter(p => isIncome(p.type));
  const recurringExpenses = activePayments.filter(p => p.type === 'recurring_expense');

  const monthlySubTotal = subscriptions.reduce((sum, p) => sum + p.amount, 0);
  const monthlyExpenseTotal = [...subscriptions, ...recurringExpenses].reduce((sum, p) => {
    if (p.frequency === 'yearly') return sum + p.amount / 12;
    if (p.frequency === 'weekly') return sum + p.amount * 4.33;
    if (p.frequency === 'biweekly') return sum + p.amount * 2;
    return sum + p.amount;
  }, 0);
  const monthlyIncomeTotal = salaries.reduce((sum, p) => {
    if (p.frequency === 'biweekly') return sum + p.amount * 2;
    if (p.frequency === 'weekly') return sum + p.amount * 4.33;
    return sum + p.amount;
  }, 0);

  const renderPaymentCard = (payment: RecurringPayment) => {
    const days = getDaysUntilNext(payment.next_date);
    const isIncomeType = isIncome(payment.type);
    const nextLabel = getNextDateLabel(payment.next_date);

    return (
      <TouchableOpacity
        key={payment.id}
        style={[styles.paymentCard, { backgroundColor: surfaceColor, borderColor }]}
        onPress={() => router.push(`/subscriptions/sub-detail?id=${payment.id}`)}
        onLongPress={() => handleDelete(payment.id, payment.name)}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <View style={[styles.iconContainer, { backgroundColor: payment.color + '20' }]}>
              <IconSymbol name={payment.icon as any} size={22} color={payment.color} />
            </View>
            <View style={styles.paymentDetails}>
              <ThemedText style={[styles.paymentName, { color: textMain }]}>
                {payment.name}
              </ThemedText>
              <ThemedText style={[styles.paymentType, { color: textMuted }]}>
                {getTypeLabel(payment.type)} · {getFrequencyLabel(payment.frequency)}
              </ThemedText>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText style={[styles.paymentAmount, { color: isIncomeType ? '#10b981' : textMain }]}>
              {isIncomeType ? '+' : '-'}{formatCurrency(payment.amount)}
            </ThemedText>
            <View style={[
              styles.nextDateBadge,
              {
                backgroundColor: days <= 1 ? '#ef4444' + '20' :
                  days <= 3 ? '#f59e0b' + '20' : primary + '20'
              }
            ]}>
              <ThemedText style={[
                styles.nextDateText,
                {
                  color: days <= 1 ? '#ef4444' :
                    days <= 3 ? '#f59e0b' : primary
                }
              ]}>
                {nextLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        {payment.auto_register ? (
          <View style={[styles.autoBadge, { backgroundColor: primary + '15' }]}>
            <IconSymbol name="checkmark.circle.fill" size={14} color={primary} />
            <ThemedText style={[styles.autoBadgeText, { color: primary }]}>
              Registro automático
            </ThemedText>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.registerButton, { borderColor: primary }]}
            onPress={() => handleRegister(payment)}
          >
            <ThemedText style={[styles.registerButtonText, { color: primary }]}>
              Registrar Cobro
            </ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Suscripciones y Pagos',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Resumen */}
        <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Suscripciones /mes
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#ef4444' }]}>
                -{formatCurrency(monthlySubTotal)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Gastos Recurrentes /mes
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: textMain }]}>
                -{formatCurrency(monthlyExpenseTotal)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Ingresos Recurrentes /mes
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#10b981' }]}>
                +{formatCurrency(monthlyIncomeTotal)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Activos
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: textMain }]}>
                {activePayments.length}
              </ThemedText>
            </View>
          </View>
          {monthlyIncomeTotal > 0 && (
            <View style={[styles.alertBanner, {
              backgroundColor: monthlyExpenseTotal / monthlyIncomeTotal > 0.3 ? '#fef2f2' : '#f0fdf4'
            }]}>
              <IconSymbol
                name="lightbulb"
                size={16}
                color={monthlyExpenseTotal / monthlyIncomeTotal > 0.3 ? '#ef4444' : '#10b981'}
              />
              <ThemedText style={[styles.alertText, {
                color: monthlyExpenseTotal / monthlyIncomeTotal > 0.3 ? '#ef4444' : '#10b981'
              }]}>
                Tus gastos recurrentes representan el {((monthlyExpenseTotal / monthlyIncomeTotal) * 100).toFixed(0)}% de tus ingresos recurrentes
              </ThemedText>
            </View>
          )}
        </View>

        {/* Suscripciones */}
        {subscriptions.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Suscripciones
            </ThemedText>
            {subscriptions.map(renderPaymentCard)}
          </View>
        )}

        {/* Salarios / Ingresos */}
        {salaries.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Ingresos Recurrentes
            </ThemedText>
            {salaries.map(renderPaymentCard)}
          </View>
        )}

        {/* Gastos Recurrentes */}
        {recurringExpenses.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Gastos Recurrentes
            </ThemedText>
            {recurringExpenses.map(renderPaymentCard)}
          </View>
        )}

        {/* Inactivos */}
        {inactivePayments.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textMuted }]}>
              Inactivos
            </ThemedText>
            {inactivePayments.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.paymentCard, { backgroundColor: surfaceColor, borderColor, opacity: 0.5 }]}
                onPress={() => router.push(`/subscriptions/sub-detail?id=${p.id}`)}
                onLongPress={() => handleDelete(p.id, p.name)}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: '#9ca3af20' }]}>
                      <IconSymbol name={p.icon as any} size={22} color="#9ca3af" />
                    </View>
                    <View style={styles.paymentDetails}>
                      <ThemedText style={[styles.paymentName, { color: textMuted }]}>
                        {p.name}
                      </ThemedText>
                      <ThemedText style={[styles.paymentType, { color: textMuted }]}>
                        Inactivo
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.paymentAmount, { color: textMuted }]}>
                    {formatCurrency(p.amount)}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {payments.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="repeat" size={64} color={textMuted} />
            <ThemedText style={[styles.emptyText, { color: textMuted }]}>
              No hay pagos recurrentes
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Toca + para agregar suscripciones, salarios o gastos fijos
            </ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => router.push('/subscriptions/add-subscription')}
      >
        <IconSymbol name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 13,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  nextDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nextDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  autoBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  registerButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
