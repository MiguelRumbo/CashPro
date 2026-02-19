import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useCurrency } from '@/contexts/CurrencyContext';

type Loan = {
  id: number;
  person_name: string;
  amount: number;
  remaining_amount: number;
  date: string;
  due_date: string | null;
  notes: string | null;
  account_id: number;
  status: 'active' | 'partial' | 'paid' | 'forgiven';
  created_at: string;
  updated_at: string;
};

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();
  
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';
  const warning = '#f59e0b';
  const success = '#10b981';

  const fetchLoans = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/loans`);
      const result = await response.json();
      
      if (result.success) {
        setLoans(result.data);
      }
    } catch (error) {
      console.error('Error al cargar préstamos:', error);
      Alert.alert('Error', 'No se pudieron cargar los préstamos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLoans();
    }, [])
  );

  const handleDeleteLoan = (id: number, name: string) => {
    Alert.alert(
      'Eliminar Préstamo',
      `¿Estás seguro de eliminar el préstamo a "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/loans/${id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              
              if (result.success) {
                fetchLoans();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el préstamo');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return success;
      case 'partial': return warning;
      case 'forgiven': return textMuted;
      default: return primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'partial': return 'Parcial';
      case 'forgiven': return 'Condonado';
      default: return 'Activo';
    }
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'partial');
  const completedLoans = loans.filter(l => l.status === 'paid' || l.status === 'forgiven');

  const totalPending = activeLoans.reduce((sum, l) => sum + l.remaining_amount, 0);
  const totalLent = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalRecovered = loans.reduce((sum, l) => sum + (l.amount - l.remaining_amount), 0);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          title: 'Préstamos',
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
                Total Prestado
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: textMain }]}>
                {formatCurrency(totalLent)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Pendiente
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: warning }]}>
                {formatCurrency(totalPending)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Recuperado
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: success }]}>
                {formatCurrency(totalRecovered)}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>
                Préstamos Activos
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: textMain }]}>
                {activeLoans.length}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Préstamos Activos */}
        {activeLoans.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Activos
            </ThemedText>
            {activeLoans.map((loan) => {
              const daysRemaining = getDaysRemaining(loan.due_date);
              const progress = loan.amount > 0 ? ((loan.amount - loan.remaining_amount) / loan.amount) * 100 : 0;

              return (
                <TouchableOpacity
                  key={loan.id}
                  style={[styles.loanCard, { backgroundColor: surfaceColor, borderColor }]}
                  onPress={() => router.push(`/loans/loan-detail?id=${loan.id}`)}
                  onLongPress={() => handleDeleteLoan(loan.id, loan.person_name)}
                >
                  <View style={styles.loanHeader}>
                    <View style={styles.loanInfo}>
                      <View style={[styles.iconContainer, { backgroundColor: primary + '20' }]}>
                        <IconSymbol name="person.fill" size={20} color={primary} />
                      </View>
                      <View style={styles.loanDetails}>
                        <ThemedText style={[styles.loanName, { color: textMain }]}>
                          {loan.person_name}
                        </ThemedText>
                        <ThemedText style={[styles.loanDate, { color: textMuted }]}>
                          {new Date(loan.date).toLocaleDateString('es-MX', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
                      <ThemedText style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                        {getStatusText(loan.status)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.loanAmounts}>
                    <View style={styles.amountRow}>
                      <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                        Prestado:
                      </ThemedText>
                      <ThemedText style={[styles.amountValue, { color: textMain }]}>
                        {formatCurrency(loan.amount)}
                      </ThemedText>
                    </View>
                    <View style={styles.amountRow}>
                      <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                        Pendiente:
                      </ThemedText>
                      <ThemedText style={[styles.amountValue, { color: warning }]}>
                        {formatCurrency(loan.remaining_amount)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Barra de progreso */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${progress}%`, backgroundColor: success }
                        ]} 
                      />
                    </View>
                    <ThemedText style={[styles.progressText, { color: textMuted }]}>
                      {progress.toFixed(0)}% recuperado
                    </ThemedText>
                  </View>

                  {daysRemaining !== null && loan.status !== 'paid' && (
                    <View style={styles.dueDateContainer}>
                      <IconSymbol 
                        name="clock" 
                        size={14} 
                        color={daysRemaining < 0 ? '#ef4444' : daysRemaining <= 7 ? warning : textMuted} 
                      />
                      <ThemedText 
                        style={[
                          styles.dueDateText, 
                          { color: daysRemaining < 0 ? '#ef4444' : daysRemaining <= 7 ? warning : textMuted }
                        ]}
                      >
                        {daysRemaining < 0 
                          ? `Vencido hace ${Math.abs(daysRemaining)} días`
                          : daysRemaining === 0
                          ? 'Vence hoy'
                          : `Vence en ${daysRemaining} días`
                        }
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Préstamos Completados */}
        {completedLoans.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Completados
            </ThemedText>
            {completedLoans.map((loan) => (
              <TouchableOpacity
                key={loan.id}
                style={[styles.loanCard, { backgroundColor: surfaceColor, borderColor, opacity: 0.7 }]}
                onPress={() => router.push(`/loans/loan-detail?id=${loan.id}`)}
                onLongPress={() => handleDeleteLoan(loan.id, loan.person_name)}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
                      <IconSymbol name="checkmark.circle.fill" size={20} color={getStatusColor(loan.status)} />
                    </View>
                    <View style={styles.loanDetails}>
                      <ThemedText style={[styles.loanName, { color: textMain }]}>
                        {loan.person_name}
                      </ThemedText>
                      <ThemedText style={[styles.loanDate, { color: textMuted }]}>
                        {new Date(loan.date).toLocaleDateString('es-MX', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
                    <ThemedText style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                      {getStatusText(loan.status)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.loanAmounts}>
                  <View style={styles.amountRow}>
                    <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
                      Monto:
                    </ThemedText>
                    <ThemedText style={[styles.amountValue, { color: textMain }]}>
                      {formatCurrency(loan.amount)}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loans.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={64} color={textMuted} />
            <ThemedText style={[styles.emptyText, { color: textMuted }]}>
              No hay préstamos registrados
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Toca el botón + para agregar uno
            </ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón flotante */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => router.push('/loans/add-loan')}
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
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loanCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanDetails: {
    flex: 1,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loanAmounts: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 13,
    fontWeight: '500',
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
