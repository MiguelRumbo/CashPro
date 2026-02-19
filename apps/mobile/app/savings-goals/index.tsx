import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BottomNavBar } from '@/components/bottom-nav-bar';

type SavingsGoal = {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  account_id: number | null;
  auto_deduct: boolean | number;
  auto_deduct_amount: number | null;
  auto_deduct_period: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export default function SavingsGoalsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();
  
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/savings-goals`);
      const result = await response.json();
      
      if (result.success) {
        setGoals(result.data);
      }
    } catch (error) {
      console.error('Error al cargar objetivos:', error);
      Alert.alert('Error', 'No se pudieron cargar los objetivos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [])
  );

  const handleDeleteGoal = (id: number, name: string) => {
    Alert.alert(
      'Eliminar Objetivo',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/savings-goals/${id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              
              if (result.success) {
                fetchGoals();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el objetivo');
            }
          },
        },
      ]
    );
  };

  const getProgress = (goal: SavingsGoal) => {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDailyRequired = (goal: SavingsGoal) => {
    if (!goal.deadline || goal.status === 'completed') return 0;
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0) return 0;
    
    const daysRemaining = getDaysRemaining(goal.deadline);
    if (!daysRemaining || daysRemaining <= 0) return remaining;
    
    return remaining / daysRemaining;
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Objetivos de Ahorro',
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
            Alcanza tus Metas Financieras
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: textMuted }]}>
            Crea objetivos de ahorro y realiza un seguimiento de tu progreso hacia tus metas
          </ThemedText>
        </View>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                Objetivos Activos
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: primary + '20' }]}>
                <ThemedText style={[styles.badgeText, { color: primary }]}>
                  {activeGoals.length}
                </ThemedText>
              </View>
            </View>

            <View style={styles.goalsList}>
              {activeGoals.map((goal) => {
                const progress = getProgress(goal);
                const daysRemaining = getDaysRemaining(goal.deadline);
                const dailyRequired = getDailyRequired(goal);
                
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalCard, { backgroundColor: surfaceColor }]}
                    onPress={() => router.push(`/savings-goals/goal-detail?id=${goal.id}`)}
                    onLongPress={() => handleDeleteGoal(goal.id, goal.name)}
                  >
                    {/* Header */}
                    <View style={styles.goalHeader}>
                      <View style={styles.goalHeaderLeft}>
                        <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                          <IconSymbol size={24} name={goal.icon as any} color={goal.color} />
                        </View>
                        <View style={styles.goalInfo}>
                          <ThemedText style={[styles.goalName, { color: textMain }]} numberOfLines={1}>
                            {goal.name}
                          </ThemedText>
                          {daysRemaining !== null && (
                            <ThemedText style={[styles.goalDeadline, { color: textMuted }]}>
                              {daysRemaining > 0 
                                ? `${daysRemaining} días restantes` 
                                : daysRemaining === 0 
                                  ? 'Vence hoy' 
                                  : `Venció hace ${Math.abs(daysRemaining)} días`}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <View style={[styles.goalBadge, { backgroundColor: goal.color + '20' }]}>
                        <ThemedText style={[styles.goalBadgeText, { color: goal.color }]}>
                          {progress.toFixed(0)}%
                        </ThemedText>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${progress}%`, backgroundColor: goal.color }
                        ]} 
                      />
                    </View>

                    {/* Amounts */}
                    <View style={styles.goalAmounts}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                          Ahorrado
                        </ThemedText>
                        <ThemedText style={[styles.amountValue, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                          {formatCurrency(goal.current_amount)}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                          Meta
                        </ThemedText>
                        <ThemedText style={[styles.amountValue, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                          {formatCurrency(goal.target_amount)}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Daily Required */}
                    {dailyRequired > 0 && (
                      <View style={[styles.dailyRequired, { backgroundColor: goal.color + '10' }]}>
                        <IconSymbol size={16} name="calendar" color={goal.color} />
                        <ThemedText style={[styles.dailyRequiredText, { color: goal.color }]}>
                          Ahorra {formatCurrency(dailyRequired)}/día para alcanzar tu meta
                        </ThemedText>
                      </View>
                    )}

                    {/* Auto Deduct Info */}
                    {Boolean(goal.auto_deduct) && goal.auto_deduct_amount && goal.auto_deduct_amount > 0 && goal.auto_deduct_period && (
                      <View style={[styles.autoDeductInfo, { backgroundColor: borderColor }]}>
                        <IconSymbol size={14} name="arrow.clockwise" color={textMuted} />
                        <ThemedText style={[styles.autoDeductText, { color: textMuted }]}>
                          Descuento automático: {formatCurrency(goal.auto_deduct_amount)} {goal.auto_deduct_period === 'weekly' ? 'semanal' : goal.auto_deduct_period === 'biweekly' ? 'quincenal' : 'mensual'}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                Objetivos Completados
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: '#10b981' + '20' }]}>
                <ThemedText style={[styles.badgeText, { color: '#10b981' }]}>
                  {completedGoals.length}
                </ThemedText>
              </View>
            </View>

            <View style={styles.goalsList}>
              {completedGoals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalCard, styles.completedGoalCard, { backgroundColor: surfaceColor, borderColor: '#10b981' }]}
                  onPress={() => router.push(`/savings-goals/goal-detail?id=${goal.id}`)}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalHeaderLeft}>
                      <View style={[styles.goalIcon, { backgroundColor: '#10b981' + '20' }]}>
                        <IconSymbol size={24} name="checkmark.circle.fill" color="#10b981" />
                      </View>
                      <View style={styles.goalInfo}>
                        <ThemedText style={[styles.goalName, { color: textMain }]}>
                          {goal.name}
                        </ThemedText>
                        <ThemedText style={[styles.goalDeadline, { color: '#10b981' }]}>
                          ¡Meta alcanzada!
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={[styles.completedAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(goal.target_amount)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: surfaceColor }]}>
              <IconSymbol size={48} name="target" color={textMuted} />
            </View>
            <ThemedText style={[styles.emptyText, { color: textMain }]}>
              No hay objetivos de ahorro
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Crea tu primer objetivo para comenzar a ahorrar hacia tus metas
            </ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/savings-goals/add-goal')}
      >
        <IconSymbol size={28} name="plus" color="white" />
      </TouchableOpacity>

      <BottomNavBar />
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
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Goals List
  goalsList: {
    gap: 16,
    marginBottom: 24,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedGoalCard: {
    borderWidth: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalDeadline: {
    fontSize: 12,
    marginTop: 2,
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  goalBadgeText: {
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
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Daily Required
  dailyRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dailyRequiredText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  // Auto Deduct
  autoDeductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
  },
  autoDeductText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Completed
  completedAmount: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
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
