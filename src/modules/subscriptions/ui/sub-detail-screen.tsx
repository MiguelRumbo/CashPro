import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/core/ui-kit/themed-text';
import { ThemedView } from '@/core/ui-kit/themed-view';
import { useThemeColor } from '@/core/ui-kit/use-theme-color';
import { IconSymbol, type IconSymbolName } from '@/core/ui-kit/icon-symbol';
import { useCurrency } from '@/core/preferences/use-currency';
import { accountsQueryKey, type RecurringPaymentRecord } from '@/core/contracts/finance';
import { ok } from '@/core/contracts/result';
import { useCapability, useErrorReporter } from '@/core/registry/react';
import { getSubscriptionsRuntime } from '../runtime';
import { useStableCallback } from '@/core/ui-kit/use-stable-callback';
import { usePalette } from '@/core/ui-kit/theme-context';

type RecurringPayment = RecurringPaymentRecord;

export function SubscriptionDetailScreen() {
  const palette = usePalette();
  const { recurring: recurringService } = getSubscriptionsRuntime();
  const accountsQuery = useCapability(accountsQueryKey);
  const reportError = useErrorReporter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<RecurringPayment | null>(null);
  const [accountName, setAccountName] = useState('');
  const { formatCurrency } = useCurrency();

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = palette.muted;
  const borderColor = useThemeColor({ light: 'rgba(127,127,127,0.12)', dark: '#374151' }, 'border');
  const primary = palette.accent;

  const fetchPayment = useStableCallback(async () => {
    try {
      const result = recurringService.getRecurringPaymentById(Number(id));
      if (result.success) {
        setPayment(result.data);
        // Fetch account name
        const accResult = ok(accountsQuery?.list() ?? []);
        if (accResult.success) {
          const account = accResult.data.find((a) => a.id === result.data.account_id);
          if (account) {
            setAccountName(account.name);
          }
        }
      }
    } catch (error) {
      reportError('Error:', error);
    }
  });

  useFocusEffect(
    useCallback(() => {
      fetchPayment();
    }, [fetchPayment]),
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'Suscripción';
      case 'salary':
        return 'Salario';
      case 'recurring_expense':
        return 'Gasto Recurrente';
      case 'recurring_income':
        return 'Ingreso Recurrente';
      default:
        return 'Recurrente';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Semanal';
      case 'biweekly':
        return 'Quincenal';
      case 'monthly':
        return 'Mensual';
      case 'yearly':
        return 'Anual';
      default:
        return frequency;
    }
  };

  const getDaysUntilNext = (nextDate: string | null) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(nextDate ?? '');
    next.setHours(0, 0, 0, 0);
    return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getMonthlyAmount = () => {
    if (!payment) return 0;
    switch (payment.frequency) {
      case 'weekly':
        return payment.amount * 4.33;
      case 'biweekly':
        return payment.amount * 2;
      case 'monthly':
        return payment.amount;
      case 'yearly':
        return payment.amount / 12;
      default:
        return payment.amount;
    }
  };

  const getYearlyAmount = () => {
    if (!payment) return 0;
    switch (payment.frequency) {
      case 'weekly':
        return payment.amount * 52;
      case 'biweekly':
        return payment.amount * 26;
      case 'monthly':
        return payment.amount * 12;
      case 'yearly':
        return payment.amount;
      default:
        return payment.amount;
    }
  };

  const handleToggleActive = async () => {
    if (!payment) return;
    try {
      const result = recurringService.updateRecurringPayment(Number(id), { is_active: !payment.is_active });
      if (result.success) {
        setPayment(result.data);
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  const handleRegister = async () => {
    if (!payment) return;
    const isIncome = payment.type === 'salary' || payment.type === 'recurring_income';
    Alert.alert(
      'Registrar',
      `¿Registrar ${isIncome ? 'depósito' : 'cobro'} de ${formatCurrency(payment.amount)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: async () => {
            try {
              const result = recurringService.registerRecurringPayment(Number(id), new Date().toISOString());
              if (result.success) {
                Alert.alert('Registrado', 'Movimiento creado exitosamente');
                fetchPayment();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch {
              Alert.alert('Error', 'No se pudo registrar');
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    if (!payment) return;
    Alert.alert('Eliminar', `¿Eliminar "${payment.name}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = recurringService.deleteRecurringPayment(Number(id));
            if (result.success) {
              router.back();
            } else {
              Alert.alert('Error', result.error);
            }
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (!payment) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Detalle', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textMuted }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const isIncome = payment.type === 'salary' || payment.type === 'recurring_income';
  const days = getDaysUntilNext(payment.next_date);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: payment.name, headerShown: true }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={[styles.iconBig, { backgroundColor: payment.color + '20' }]}>
            <IconSymbol name={payment.icon as IconSymbolName} size={36} color={payment.color} />
          </View>
          <ThemedText style={[styles.paymentName, { color: textMain }]}>{payment.name}</ThemedText>
          <ThemedText style={[styles.paymentAmount, { color: isIncome ? '#10b981' : textMain }]}>
            {isIncome ? '+' : '-'}
            {formatCurrency(payment.amount)}
          </ThemedText>
          <View style={[styles.typeBadge, { backgroundColor: payment.color + '20' }]}>
            <ThemedText style={[styles.typeBadgeText, { color: payment.color }]}>
              {getTypeLabel(payment.type)} · {getFrequencyLabel(payment.frequency)}
            </ThemedText>
          </View>
        </View>

        {/* Próximo cobro */}
        <View style={[styles.infoCard, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText style={[styles.infoTitle, { color: textMain }]}>
            Próximo {isIncome ? 'depósito' : 'cobro'}
          </ThemedText>
          <View style={styles.infoRow}>
            <IconSymbol name="calendar" size={18} color={textMuted} />
            <ThemedText style={[styles.infoValue, { color: textMain }]}>
              {new Date(payment.next_date ?? '').toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </ThemedText>
          </View>
          <View
            style={[
              styles.daysCountdown,
              {
                backgroundColor: days <= 1 ? '#ef4444' + '15' : days <= 3 ? '#f59e0b' + '15' : primary + '15',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.daysCountdownText,
                {
                  color: days <= 1 ? '#ef4444' : days <= 3 ? '#f59e0b' : primary,
                },
              ]}
            >
              {days < 0
                ? `Vencido hace ${Math.abs(days)} días`
                : days === 0
                  ? 'Hoy'
                  : days === 1
                    ? 'Mañana'
                    : `En ${days} días`}
            </ThemedText>
          </View>
        </View>

        {/* Detalles */}
        <View style={[styles.infoCard, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText style={[styles.infoTitle, { color: textMain }]}>Detalles</ThemedText>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textMuted }]}>Cuenta</ThemedText>
            <ThemedText style={[styles.detailValue, { color: textMain }]}>{accountName}</ThemedText>
          </View>

          {payment.day_of_month && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: textMuted }]}>Día del mes</ThemedText>
              <ThemedText style={[styles.detailValue, { color: textMain }]}>
                {payment.day_of_month}
              </ThemedText>
            </View>
          )}

          {payment.specific_dates && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: textMuted }]}>Días</ThemedText>
              <ThemedText style={[styles.detailValue, { color: textMain }]}>
                {payment.specific_dates}
              </ThemedText>
            </View>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textMuted }]}>Costo mensual</ThemedText>
            <ThemedText style={[styles.detailValue, { color: textMain }]}>
              {formatCurrency(getMonthlyAmount())}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textMuted }]}>Costo anual</ThemedText>
            <ThemedText style={[styles.detailValue, { color: textMain }]}>
              {formatCurrency(getYearlyAmount())}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textMuted }]}>Notificar antes</ThemedText>
            <ThemedText style={[styles.detailValue, { color: textMain }]}>
              {payment.notify_before_days} día{payment.notify_before_days !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        </View>

        {/* Toggle activo */}
        <View style={[styles.toggleCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View>
            <ThemedText style={[styles.toggleLabel, { color: textMain }]}>Activo</ThemedText>
            <ThemedText style={[styles.toggleDescription, { color: textMuted }]}>
              {payment.is_active ? 'Este pago está activo' : 'Este pago está pausado'}
            </ThemedText>
          </View>
          <Switch
            value={!!payment.is_active}
            onValueChange={handleToggleActive}
            trackColor={{ false: 'rgba(127,127,127,0.2)', true: primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Auto register */}
        <View style={[styles.toggleCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View>
            <ThemedText style={[styles.toggleLabel, { color: textMain }]}>Registro automático</ThemedText>
            <ThemedText style={[styles.toggleDescription, { color: textMuted }]}>
              {payment.auto_register ? 'Se registra automáticamente' : 'Requiere confirmación manual'}
            </ThemedText>
          </View>
          <View
            style={[styles.statusDot, { backgroundColor: payment.auto_register ? primary : '#ef4444' }]}
          />
        </View>

        {/* Botón registrar */}
        {payment.is_active && !payment.auto_register ? (
          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: primary }]}
            onPress={handleRegister}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#ffffff" />
            <ThemedText style={styles.registerButtonText}>
              Registrar {isIncome ? 'Depósito' : 'Cobro'} Ahora
            </ThemedText>
          </TouchableOpacity>
        ) : null}

        {/* Botón eliminar */}
        <TouchableOpacity style={[styles.deleteButton]} onPress={handleDelete}>
          <IconSymbol name="trash.fill" size={18} color="#ef4444" />
          <ThemedText style={styles.deleteButtonText}>Eliminar</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBig: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  daysCountdown: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  daysCountdownText: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    backgroundColor: 'rgba(239,68,68,0.14)',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
