import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { formatCurrency } from '@/utils/format';

type Budget = {
  id: number;
  name: string;
  type: 'saving' | 'expense';
  amount: number;
  period: 'weekly' | 'monthly';
  start_date: string;
  icon: string;
  color: string;
  current_amount: number;
};

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchBudgets = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/budgets`);
      const result = await response.json();
      
      if (result.success) {
        setBudgets(result.data);
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      Alert.alert('Error', 'No se pudieron cargar los presupuestos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
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
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/budgets/${id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              
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
    return Math.min((budget.current_amount / budget.amount) * 100, 100);
  };

  const getPeriodText = (period: string) => {
    return period === 'weekly' ? 'Semanal' : 'Mensual';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Presupuestos',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Header Info */}
        <View style={[styles.headerCard, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.headerTitle, { color: textMain }]}>
            Gestiona tus Metas
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: textMuted }]}>
            Crea presupuestos de ahorro o límites de gasto para alcanzar tus objetivos financieros
          </ThemedText>
        </View>

        {/* Budget List */}
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: surfaceColor }]}>
              <IconSymbol size={48} name="chart.pie" color={textMuted} />
            </View>
            <ThemedText style={[styles.emptyText, { color: textMain }]}>
              No hay presupuestos
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Crea tu primer presupuesto para comenzar a gestionar tus finanzas
            </ThemedText>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {budgets.map((budget) => {
              const progress = getProgress(budget);
              const isOverBudget = budget.type === 'expense' && progress >= 100;
              const progressColor = isOverBudget ? '#ef4444' : budget.color;
              
              return (
                <TouchableOpacity
                  key={budget.id}
                  style={[styles.budgetCard, { backgroundColor: surfaceColor }]}
                  onPress={() => router.push(`/budgets/edit-budget?id=${budget.id}`)}
                  onLongPress={() => handleDeleteBudget(budget.id, budget.name)}
                >
                  {/* Header */}
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetHeaderLeft}>
                      <View style={[styles.budgetIcon, { backgroundColor: budget.color + '20' }]}>
                        <IconSymbol size={24} name={budget.icon as any} color={budget.color} />
                      </View>
                      <View style={styles.budgetInfo}>
                        <ThemedText style={[styles.budgetName, { color: textMain }]}>
                          {budget.name}
                        </ThemedText>
                        <ThemedText style={[styles.budgetPeriod, { color: textMuted }]}>
                          {getPeriodText(budget.period)} • {budget.type === 'saving' ? 'Ahorro' : 'Gasto'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.budgetBadge, { backgroundColor: budget.color + '20' }]}>
                      <ThemedText style={[styles.budgetBadgeText, { color: budget.color }]}>
                        {progress.toFixed(0)}%
                      </ThemedText>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress}%`, backgroundColor: progressColor }
                      ]} 
                    />
                  </View>

                  {/* Amounts */}
                  <View style={styles.budgetAmounts}>
                    <View>
                      <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                        {budget.type === 'saving' ? 'Ahorrado' : 'Gastado'}
                      </ThemedText>
                      <ThemedText style={[styles.amountValue, { color: textMain }]}>
                        {formatCurrency(budget.current_amount)}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                        {budget.type === 'saving' ? 'Meta' : 'Límite'}
                      </ThemedText>
                      <ThemedText style={[styles.amountValue, { color: textMain }]}>
                        {formatCurrency(budget.amount)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Warning */}
                  {isOverBudget && (
                    <View style={[styles.warningBanner, { backgroundColor: '#fee2e2' }]}>
                      <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#ef4444" />
                      <ThemedText style={[styles.warningText, { color: '#ef4444' }]}>
                        Has excedido tu límite de gasto
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/budgets/add-budget')}
      >
        <IconSymbol size={28} name="plus" color="white" />
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
  content: {
    padding: 16,
  },
  // Header Card
  headerCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Budget List
  budgetList: {
    gap: 16,
  },
  budgetCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '700',
  },
  budgetPeriod: {
    fontSize: 12,
    marginTop: 2,
  },
  budgetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  budgetBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Progress
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Amounts
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#20df60',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
