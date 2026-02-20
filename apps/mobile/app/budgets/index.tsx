import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { useCurrency } from '@/contexts/CurrencyContext';

type Budget = {
  id: number;
  name: string;
  type: 'expense';
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string | null;
  icon: string;
  color: string;
  current_amount: number;
  category_ids: string | null;
};

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();
  
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';
  const warning = '#f59e0b';
  const danger = '#ef4444';

  const fetchBudgets = () => {
    try {
      const result = database.getBudgets();

      if (result.success) {
        // Filtrar solo presupuestos de tipo expense
        setBudgets(result.data.filter((b: Budget) => b.type === 'expense'));
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      Alert.alert('Error', 'No se pudieron cargar los presupuestos');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [])
  );

  const handleDeleteBudget = (id: number, name: string) => {
    Alert.alert(
      'Eliminar Presupuesto',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              const result = database.deleteBudget(id);

              if (result.success) {
                fetchBudgets();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el presupuesto');
            }
          },
        },
      ]
    );
  };

  const getProgress = (budget: Budget) => {
    if (budget.amount === 0) return 0;
    return (budget.current_amount / budget.amount) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return danger;
    if (progress >= 80) return warning;
    return primary;
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      default: return period;
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          title: 'Presupuestos',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Descripción */}
        <View style={[styles.infoCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={[styles.infoIcon, { backgroundColor: primary + '20' }]}>
            <IconSymbol name="chart.pie.fill" size={24} color={primary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: textMain }]}>
              Control de Gastos
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: textMuted }]}>
              Establece límites de gasto diarios, semanales o mensuales para mantener tus finanzas bajo control
            </ThemedText>
          </View>
        </View>

        {/* Lista de presupuestos */}
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const progress = getProgress(budget);
            const progressColor = getProgressColor(progress);
            const daysRemaining = getDaysRemaining(budget.end_date);
            const remaining = Math.max(0, budget.amount - budget.current_amount);

            return (
              <TouchableOpacity
                key={budget.id}
                style={[styles.budgetCard, { backgroundColor: surfaceColor, borderColor }]}
                onPress={() => router.push(`/budgets/edit-budget?id=${budget.id}`)}
                onLongPress={() => handleDeleteBudget(budget.id, budget.name)}
              >
                {/* Header */}
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: budget.color + '20' }]}>
                      <IconSymbol name={budget.icon as any} size={24} color={budget.color} />
                    </View>
                    <View style={styles.budgetDetails}>
                      <ThemedText style={[styles.budgetName, { color: textMain }]}>
                        {budget.name}
                      </ThemedText>
                      <View style={styles.periodBadge}>
                        <IconSymbol name="calendar" size={12} color={textMuted} />
                        <ThemedText style={[styles.periodText, { color: textMuted }]}>
                          {getPeriodText(budget.period)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  {progress >= 100 && (
                    <View style={[styles.warningBadge, { backgroundColor: danger + '20' }]}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={16} color={danger} />
                    </View>
                  )}
                </View>

                {/* Montos */}
                <View style={styles.amountsRow}>
                  <View style={styles.amountItem}>
                    <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                      Gastado
                    </ThemedText>
                    <ThemedText style={[styles.amountValue, { color: progressColor }]} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(budget.current_amount)}
                    </ThemedText>
                  </View>
                  <View style={[styles.amountDivider, { backgroundColor: borderColor }]} />
                  <View style={[styles.amountItem, { alignItems: 'flex-end' }]}>
                    <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                      Límite
                    </ThemedText>
                    <ThemedText style={[styles.amountValue, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(budget.amount)}
                    </ThemedText>
                  </View>
                </View>

                {/* Barra de progreso */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(progress, 100)}%`, 
                          backgroundColor: progressColor 
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <ThemedText style={[styles.progressText, { color: progressColor }]}>
                      {progress.toFixed(1)}%
                    </ThemedText>
                    {remaining > 0 && (
                      <ThemedText style={[styles.progressText, { color: textMuted }]}>
                        {formatCurrency(remaining)} disponible
                      </ThemedText>
                    )}
                  </View>
                </View>

                {/* Días restantes */}
                {daysRemaining !== null && (
                  <View style={styles.daysContainer}>
                    <IconSymbol 
                      name="clock" 
                      size={14} 
                      color={daysRemaining < 0 ? danger : daysRemaining <= 3 ? warning : textMuted} 
                    />
                    <ThemedText 
                      style={[
                        styles.daysText, 
                        { color: daysRemaining < 0 ? danger : daysRemaining <= 3 ? warning : textMuted }
                      ]}
                    >
                      {daysRemaining < 0 
                        ? `Finalizó hace ${Math.abs(daysRemaining)} días`
                        : daysRemaining === 0
                        ? 'Finaliza hoy'
                        : `${daysRemaining} días restantes`
                      }
                    </ThemedText>
                  </View>
                )}

                {/* Alerta de exceso */}
                {progress >= 100 && (
                  <View style={[styles.alertBanner, { backgroundColor: danger + '10', borderColor: danger + '30' }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={16} color={danger} />
                    <ThemedText style={[styles.alertText, { color: danger }]}>
                      Has excedido tu presupuesto por {formatCurrency(budget.current_amount - budget.amount)}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="chart.pie.fill" size={64} color={textMuted} />
            <ThemedText style={[styles.emptyText, { color: textMuted }]}>
              No hay presupuestos
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Toca el botón + para crear uno
            </ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón flotante */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => router.push('/budgets/add-budget')}
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
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  budgetCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodText: {
    fontSize: 13,
  },
  warningBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountItem: {
    flex: 1,
  },
  amountDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  daysText: {
    fontSize: 13,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
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
