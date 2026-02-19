import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, RefreshControl, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
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

type Payment = {
  id: number;
  loan_id: number;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
};

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  icon?: string;
  color?: string;
};

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const { formatCurrency } = useCurrency();

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';
  const success = '#10b981';
  const warning = '#f59e0b';
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1f2937' }, 'inputBackground');

  const fetchLoanData = async () => {
    try {
      const [loanRes, paymentsRes, accountsRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/loans/${id}`),
        fetch(`${API_CONFIG.BASE_URL}/loans/${id}/payments`),
        fetch(`${API_CONFIG.BASE_URL}/accounts`),
      ]);

      const loanResult = await loanRes.json();
      const paymentsResult = await paymentsRes.json();
      const accountsResult = await accountsRes.json();

      if (loanResult.success) {
        setLoan(loanResult.data);
      }

      if (paymentsResult.success) {
        setPayments(paymentsResult.data);
      }

      if (accountsResult.success) {
        setAccounts(accountsResult.data);
        // Seleccionar la cuenta del préstamo por defecto
        if (accountsResult.data.length > 0 && !selectedAccount) {
          const loanAccount = accountsResult.data.find((a: Account) => a.id === loanResult.data?.account_id);
          setSelectedAccount(loanAccount || accountsResult.data[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del préstamo');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoanData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLoanData();
    }, [id])
  );

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (!loan) return;

    if (parseFloat(paymentAmount) > loan.remaining_amount) {
      Alert.alert('Error', 'El monto no puede ser mayor al pendiente');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('Error', 'Selecciona una cuenta');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/loans/${id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          date: paymentDate.toISOString(),
          notes: paymentNotes.trim() || null,
          account_id: selectedAccount.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentDate(new Date());
        await fetchLoanData();
        Alert.alert('Éxito', 'Pago registrado correctamente');
      } else {
        Alert.alert('Error', result.error || 'No se pudo registrar el pago');
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      Alert.alert('Error', 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const onPaymentDateChange = (event: any, selectedDate?: Date) => {
    setShowPaymentDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  const handleForgive = () => {
    Alert.alert(
      'Condonar Préstamo',
      '¿Estás seguro de condonar este préstamo? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Condonar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/loans/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'forgiven',
                  remaining_amount: 0,
                }),
              });

              const result = await response.json();

              if (result.success) {
                await fetchLoanData();
                Alert.alert('Éxito', 'Préstamo condonado');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo condonar el préstamo');
            }
          },
        },
      ]
    );
  };

  if (!loan) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textMuted }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const progress = loan.amount > 0 ? ((loan.amount - loan.remaining_amount) / loan.amount) * 100 : 0;
  const totalPaid = loan.amount - loan.remaining_amount;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          title: loan.person_name,
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={[styles.iconCircle, { backgroundColor: primary + '20' }]}>
            <IconSymbol name="person.fill" size={32} color={primary} />
          </View>

          <ThemedText style={[styles.personName, { color: textMain }]}>
            {loan.person_name}
          </ThemedText>

          <View style={styles.amountContainer}>
            <ThemedText style={[styles.amountLabel, { color: textMuted }]}>
              Monto prestado
            </ThemedText>
            <ThemedText style={[styles.amountValue, { color: textMain }]}>
              {formatCurrency(loan.amount)}
            </ThemedText>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: success }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <ThemedText style={[styles.progressText, { color: success }]}>
                {formatCurrency(totalPaid)} recuperado
              </ThemedText>
              <ThemedText style={[styles.progressText, { color: warning }]}>
                {formatCurrency(loan.remaining_amount)} pendiente
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Información */}
        <View style={[styles.infoCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: textMuted }]}>
              Fecha del préstamo
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: textMain }]}>
              {new Date(loan.date).toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </ThemedText>
          </View>

          {loan.due_date && (
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textMuted }]}>
                Fecha límite
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: textMain }]}>
                {new Date(loan.due_date).toLocaleDateString('es-MX', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: textMuted }]}>
              Estado
            </ThemedText>
            <View style={[styles.statusBadge, { 
              backgroundColor: loan.status === 'paid' ? success + '20' : 
                              loan.status === 'partial' ? warning + '20' : 
                              loan.status === 'forgiven' ? textMuted + '20' : 
                              primary + '20' 
            }]}>
              <ThemedText style={[styles.statusText, { 
                color: loan.status === 'paid' ? success : 
                       loan.status === 'partial' ? warning : 
                       loan.status === 'forgiven' ? textMuted : 
                       primary 
              }]}>
                {loan.status === 'paid' ? 'Pagado' : 
                 loan.status === 'partial' ? 'Parcial' : 
                 loan.status === 'forgiven' ? 'Condonado' : 
                 'Activo'}
              </ThemedText>
            </View>
          </View>

          {loan.notes && (
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textMuted }]}>
                Notas
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: textMain }]}>
                {loan.notes}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Historial de pagos */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
            Historial de Pagos ({payments.length})
          </ThemedText>

          {payments.length > 0 ? (
            payments.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, { backgroundColor: surfaceColor, borderColor }]}>
                <View style={styles.paymentHeader}>
                  <View style={[styles.paymentIcon, { backgroundColor: success + '20' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={success} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <ThemedText style={[styles.paymentAmount, { color: textMain }]}>
                      {formatCurrency(payment.amount)}
                    </ThemedText>
                    <ThemedText style={[styles.paymentDate, { color: textMuted }]}>
                      {new Date(payment.date).toLocaleDateString('es-MX', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </ThemedText>
                  </View>
                </View>
                {payment.notes && (
                  <ThemedText style={[styles.paymentNotes, { color: textMuted }]}>
                    {payment.notes}
                  </ThemedText>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyPayments}>
              <ThemedText style={[styles.emptyText, { color: textMuted }]}>
                No hay pagos registrados
              </ThemedText>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botones de acción */}
      {loan.status !== 'paid' && loan.status !== 'forgiven' && (
        <View style={[styles.footer, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor }]}
            onPress={handleForgive}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: textMain }]}>
              Condonar
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primary }]}
            onPress={() => setShowPaymentModal(true)}
          >
            <ThemedText style={styles.primaryButtonText}>
              Registrar Pago
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de pago */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Registrar Pago
              </ThemedText>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <IconSymbol name="xmark" size={24} color={textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <ThemedText style={[styles.label, { color: textMain }]}>
                  Monto del pago *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textMain, borderColor }]}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder={`Máximo: ${formatCurrency(loan.remaining_amount)}`}
                  placeholderTextColor={textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={[styles.label, { color: textMain }]}>
                  Fecha del pago *
                </ThemedText>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
                  onPress={() => setShowPaymentDatePicker(true)}
                >
                  <IconSymbol name="calendar" size={20} color={textMuted} />
                  <ThemedText style={[styles.dateButtonText, { color: textMain }]}>
                    {paymentDate.toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </ThemedText>
                </TouchableOpacity>
                {showPaymentDatePicker && (
                  <DateTimePicker
                    value={paymentDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPaymentDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Selector de cuenta */}
              <View style={styles.field}>
                <ThemedText style={[styles.label, { color: textMain }]}>
                  Cuenta destino *
                </ThemedText>
                <TouchableOpacity
                  style={[styles.accountSelector, { backgroundColor: inputBg, borderColor }]}
                  onPress={() => setShowAccountPicker(true)}
                >
                  {selectedAccount ? (
                    <>
                      <View style={styles.accountSelectorInfo}>
                        <ThemedText style={[styles.accountSelectorName, { color: textMain }]}>
                          {selectedAccount.name}
                        </ThemedText>
                        <ThemedText style={[styles.accountSelectorBalance, { color: textMuted }]}>
                          {formatCurrency(selectedAccount.type === 'credit' ? 0 : selectedAccount.balance)}
                        </ThemedText>
                      </View>
                      <IconSymbol name="chevron.down" size={20} color={textMuted} />
                    </>
                  ) : (
                    <ThemedText style={[styles.accountSelectorPlaceholder, { color: textMuted }]}>
                      Selecciona una cuenta
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <ThemedText style={[styles.label, { color: textMain }]}>
                  Notas (opcional)
                </ThemedText>
                <TextInput
                  style={[styles.textArea, { backgroundColor: inputBg, color: textMain, borderColor }]}
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                  placeholder="Agrega detalles..."
                  placeholderTextColor={textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primary, opacity: loading ? 0.6 : 1 }]}
                onPress={handleAddPayment}
                disabled={loading}
              >
                <ThemedText style={styles.modalButtonText}>
                  {loading ? 'Guardando...' : 'Guardar Pago'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal selector de cuentas */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Seleccionar Cuenta
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <IconSymbol name="xmark" size={24} color={textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.accountsList}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountItem,
                    {
                      backgroundColor: selectedAccount?.id === account.id ? primary + '10' : 'transparent',
                      borderColor,
                    }
                  ]}
                  onPress={() => {
                    setSelectedAccount(account);
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={styles.accountItemInfo}>
                    <ThemedText style={[styles.accountItemName, { color: textMain }]}>
                      {account.name}
                    </ThemedText>
                    <ThemedText style={[styles.accountItemBalance, { color: textMuted }]}>
                      {account.type === 'credit'
                        ? `Crédito disponible: ${formatCurrency((account as any).credit_limit - (account as any).current_balance)}`
                        : formatCurrency(account.balance)}
                    </ThemedText>
                  </View>
                  {selectedAccount?.id === account.id && (
                    <IconSymbol name="checkmark" size={20} color={primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  personName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  progressSection: {
    width: '100%',
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
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 13,
  },
  paymentNotes: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyPayments: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  dateButton: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Account Selector
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  accountSelectorInfo: {
    flex: 1,
  },
  accountSelectorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountSelectorBalance: {
    fontSize: 12,
    marginTop: 1,
  },
  accountSelectorPlaceholder: {
    fontSize: 16,
  },
  // Account Picker Modal
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  accountsList: {
    maxHeight: 400,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  accountItemInfo: {
    flex: 1,
  },
  accountItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountItemBalance: {
    fontSize: 13,
  },
});
