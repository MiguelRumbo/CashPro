import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TextInput, TouchableOpacity, Alert, Switch, Platform, Modal } from 'react-native';
import { router, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { useCurrency } from '@/contexts/CurrencyContext';

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  is_primary?: number;
};

export default function AddLoanScreen() {
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [createMovement, setCreateMovement] = useState(true);
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useCurrency();

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');
  const primary = '#20df60';
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1f2937' }, 'inputBackground');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const result = database.getAccounts();

      if (result.success) {
        setAccounts(result.data);
        // Preseleccionar la cuenta principal
        const primaryAccount = result.data.find((acc: Account) => acc.is_primary);
        if (primaryAccount) {
          setSelectedAccount(primaryAccount);
        } else if (result.data.length > 0) {
          setSelectedAccount(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    }
  };

  const handleSubmit = async () => {
    if (!personName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre de la persona');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('Error', 'Selecciona una cuenta');
      return;
    }

    setLoading(true);

    try {
      const result = database.createLoan({
        person_name: personName.trim(),
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0],
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
        notes: notes.trim() || null,
        account_id: selectedAccount.id,
        create_movement: createMovement,
      });

      if (result.success) {
        Alert.alert('Éxito', 'Préstamo registrado correctamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el préstamo');
      }
    } catch (error) {
      console.error('Error al crear préstamo:', error);
      Alert.alert('Error', 'No se pudo crear el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          title: 'Nuevo Préstamo',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: surfaceColor }]}>
          {/* Nombre de la persona */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Nombre de la persona *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textMain, borderColor }]}
              value={personName}
              onChangeText={setPersonName}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={textMuted}
            />
          </View>

          {/* Monto */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Monto prestado *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textMain, borderColor }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Fecha del préstamo */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Fecha del préstamo *
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={textMuted} />
              <ThemedText style={[styles.dateButtonText, { color: textMain }]}>
                {date.toLocaleDateString('es-MX', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Fecha límite (opcional) */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Fecha límite de devolución (opcional)
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowDueDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={textMuted} />
              <ThemedText style={[styles.dateButtonText, { color: dueDate ? textMain : textMuted }]}>
                {dueDate 
                  ? dueDate.toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Seleccionar fecha (opcional)'
                }
              </ThemedText>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDueDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDueDateChange}
                minimumDate={date}
              />
            )}
          </View>

          {/* Cuenta */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Cuenta de origen *
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
                      {formatCurrency(selectedAccount.balance)}
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

          {/* Descontar de cuenta */}
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <ThemedText style={[styles.label, { color: textMain }]}>
                  Descontar de la cuenta
                </ThemedText>
                <ThemedText style={[styles.hint, { color: textMuted }]}>
                  Registra automáticamente un movimiento de gasto
                </ThemedText>
              </View>
              <Switch
                value={createMovement}
                onValueChange={setCreateMovement}
                trackColor={{ false: borderColor, true: primary + '80' }}
                thumbColor={createMovement ? primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Notas */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Notas (opcional)
            </ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: inputBg, color: textMain, borderColor }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Agrega detalles adicionales..."
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botón guardar */}
      <View style={[styles.footer, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primary, opacity: loading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Guardando...' : 'Guardar Préstamo'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Seleccionar Cuenta
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <IconSymbol size={24} name="xmark" color={textMuted} />
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
                      borderColor 
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
                      {formatCurrency(account.balance)}
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
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
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
    minHeight: 100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  accountChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Account Selector
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountSelectorInfo: {
    flex: 1,
  },
  accountSelectorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountSelectorBalance: {
    fontSize: 13,
  },
  accountSelectorPlaceholder: {
    fontSize: 16,
  },
  // Account Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
