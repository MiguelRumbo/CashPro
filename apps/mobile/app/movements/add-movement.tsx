import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrencyInput, getNumericValue } from '@/utils/format';
import * as database from '@/services/database';

type MovementType = 'expense' | 'income' | 'transfer';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
};

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  is_primary?: number;
};

const CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', icon: 'fork.knife', color: '#ea580c', bg: '#ffedd5' },
  { id: '2', name: 'Comestibles', icon: 'cart.fill', color: '#16a34a', bg: '#dcfce7' },
  { id: '3', name: 'Compras', icon: 'bag.fill', color: '#dc2626', bg: '#fee2e2' },
  { id: '4', name: 'Transporte', icon: 'car.fill', color: '#2563eb', bg: '#dbeafe' },
  { id: '5', name: 'Entretenimiento', icon: 'film', color: '#db2777', bg: '#fce7f3' },
  { id: '6', name: 'Facturas', icon: 'doc.text.fill', color: '#059669', bg: '#d1fae5' },
  { id: '7', name: 'Regalos', icon: 'gift.fill', color: '#dc2626', bg: '#fee2e2' },
  { id: '8', name: 'Belleza', icon: 'sparkles', color: '#d946ef', bg: '#fae8ff' },
  { id: '9', name: 'Trabajo', icon: 'briefcase.fill', color: '#92400e', bg: '#fef3c7' },
  { id: '10', name: 'Viajes', icon: 'airplane', color: '#0891b2', bg: '#cffafe' },
  { id: '11', name: 'Ingreso', icon: 'dollarsign.circle.fill', color: '#ca8a04', bg: '#fef9c3' },
  { id: '12', name: 'Corrección', icon: 'chart.bar.fill', color: '#7c3aed', bg: '#ede9fe' },
];

export default function AddMovementScreen() {
  const [movementType, setMovementType] = useState<MovementType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showToAccountModal, setShowToAccountModal] = useState(false);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#0a0f0d' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = () => {
    try {
      const result = database.getAccounts();

      if (result.success) {
        setAccounts(result.data);

        // Preseleccionar la cuenta principal
        const primaryAccount = result.data.find((acc: Account) => acc.is_primary === 1);
        if (primaryAccount && !selectedAccount) {
          setSelectedAccount(primaryAccount);
        }
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    }
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatCurrencyInput(text));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = async () => {
    // Validaciones
    if (!amount || getNumericValue(amount) === 0) {
      Alert.alert('Error', 'La cantidad es requerida');
      return;
    }

    if (movementType !== 'transfer' && !selectedCategory) {
      Alert.alert('Error', 'La categoría es requerida');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('Error', 'La cuenta es requerida');
      return;
    }

    if (movementType === 'transfer' && !selectedToAccount) {
      Alert.alert('Error', 'La cuenta destino es requerida');
      return;
    }

    const movementData: any = {
      type: movementType,
      amount: getNumericValue(amount),
      title: title.trim() || (movementType === 'transfer' ? 'Transferencia' : selectedCategory?.name),
      account_id: selectedAccount.id,
      date: date.toISOString(),
      notes: notes.trim(),
    };

    if (movementType !== 'transfer' && selectedCategory) {
      movementData.category_id = selectedCategory.id;
      movementData.category_name = selectedCategory.name;
      movementData.category_icon = selectedCategory.icon;
      movementData.category_color = selectedCategory.color;
    }

    if (movementType === 'transfer' && selectedToAccount) {
      movementData.to_account_id = selectedToAccount.id;
    }

    try {
      const result = database.createMovement(movementData);

      if (result.success) {
        Alert.alert('Éxito', 'Movimiento creado exitosamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el movimiento');
      }
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      Alert.alert('Error', 'No se pudo crear el movimiento');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Agregar transacción',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              movementType === 'expense' && styles.typeButtonActive,
              { backgroundColor: movementType === 'expense' ? 'rgba(239, 68, 68, 0.1)' : surfaceColor, borderColor }
            ]}
            onPress={() => setMovementType('expense')}
          >
            <IconSymbol size={20} name="arrow.down" color={movementType === 'expense' ? '#ef4444' : textSub} />
            <ThemedText style={[styles.typeButtonText, { color: movementType === 'expense' ? '#ef4444' : textSub }]}>
              Gasto
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              movementType === 'income' && styles.typeButtonActive,
              { backgroundColor: movementType === 'income' ? 'rgba(32, 223, 96, 0.1)' : surfaceColor, borderColor }
            ]}
            onPress={() => setMovementType('income')}
          >
            <IconSymbol size={20} name="arrow.up" color={movementType === 'income' ? primary : textSub} />
            <ThemedText style={[styles.typeButtonText, { color: movementType === 'income' ? primary : textSub }]}>
              Ingreso
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              movementType === 'transfer' && styles.typeButtonActive,
              { backgroundColor: movementType === 'transfer' ? 'rgba(59, 130, 246, 0.1)' : surfaceColor, borderColor }
            ]}
            onPress={() => setMovementType('transfer')}
          >
            <IconSymbol size={20} name="arrow.left.arrow.right" color={movementType === 'transfer' ? '#3b82f6' : textSub} />
            <ThemedText style={[styles.typeButtonText, { color: movementType === 'transfer' ? '#3b82f6' : textSub }]}>
              Transferir
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={[styles.amountSection, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.amountLabel, { color: textSub }]}>Cantidad</ThemedText>
          <View style={styles.amountInputContainer}>
            <ThemedText style={[styles.currencySymbol, { color: textMain }]}>$</ThemedText>
            <TextInput
              style={[styles.amountInput, { color: textMain }]}
              placeholder="0"
              placeholderTextColor={textSub}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>
        </View>

        {/* Category (only for expense/income) */}
        {movementType !== 'transfer' && (
          <TouchableOpacity
            style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.sectionLeft}>
              {selectedCategory ? (
                <View style={[styles.categoryIconSmall, { backgroundColor: selectedCategory.bg }]}>
                  <IconSymbol size={20} name={selectedCategory.icon as any} color={selectedCategory.color} />
                </View>
              ) : (
                <View style={[styles.categoryIconSmall, { backgroundColor: borderColor }]}>
                  <IconSymbol size={20} name="square.grid.2x2" color={textSub} />
                </View>
              )}
              <View style={styles.sectionInfo}>
                <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Categoría</ThemedText>
                <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                  {selectedCategory ? selectedCategory.name : 'Seleccionar'}
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={20} name="chevron.right" color={textSub} />
          </TouchableOpacity>
        )}

        {/* Title */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="text.alignleft" color={textSub} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Título</ThemedText>
              <TextInput
                style={[styles.sectionInput, { color: textMain }]}
                placeholder="Ej: Supermercado"
                placeholderTextColor={textSub}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>
        </View>

        {/* Account (From) */}
        <TouchableOpacity 
          style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}
          onPress={() => setShowAccountModal(true)}
        >
          <View style={styles.sectionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="creditcard" color={textSub} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>
                {movementType === 'transfer' ? 'Desde cuenta' : 'Cuenta'}
              </ThemedText>
              <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                {selectedAccount ? selectedAccount.name : 'Seleccionar cuenta'}
              </ThemedText>
            </View>
          </View>
          <IconSymbol size={20} name="chevron.right" color={textSub} />
        </TouchableOpacity>

        {/* Account (To) - Only for transfer */}
        {movementType === 'transfer' && (
          <TouchableOpacity 
            style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => setShowToAccountModal(true)}
          >
            <View style={styles.sectionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
                <IconSymbol size={20} name="creditcard.fill" color={textSub} />
              </View>
              <View style={styles.sectionInfo}>
                <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Hacia cuenta</ThemedText>
                <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                  {selectedToAccount ? selectedToAccount.name : 'Seleccionar cuenta'}
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={20} name="chevron.right" color={textSub} />
          </TouchableOpacity>
        )}

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateTimeButton, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => setShowDatePicker(true)}
          >
            <IconSymbol size={20} name="calendar" color={textSub} />
            <View style={styles.dateTimeInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Fecha</ThemedText>
              <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                {formatDate(date)}
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateTimeButton, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => setShowTimePicker(true)}
          >
            <IconSymbol size={20} name="clock" color={textSub} />
            <View style={styles.dateTimeInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Hora</ThemedText>
              <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                {formatTime(date)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={[styles.notesSection, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.notesHeader}>
            <IconSymbol size={20} name="note.text" color={textSub} />
            <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Notas</ThemedText>
          </View>
          <TextInput
            style={[styles.notesInput, { color: textMain }]}
            placeholder="Agregar notas (opcional)"
            placeholderTextColor={textSub}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: primary }]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Guardar Movimiento</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Selecciona Una Categoría
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <IconSymbol size={24} name="xmark" color={textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.categoriesGrid}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.bg }]}>
                    <IconSymbol size={28} name={category.icon as any} color={category.color} />
                  </View>
                  <ThemedText style={[styles.categoryName, { color: textMain }]}>
                    {category.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}

              {/* Add Category Button */}
              <TouchableOpacity style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: borderColor, borderWidth: 2, borderStyle: 'dashed', borderColor }]}>
                  <IconSymbol size={28} name="plus" color={textSub} />
                </View>
                <ThemedText style={[styles.categoryName, { color: textSub }]}>
                  Agregar
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Selecciona una Cuenta
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <IconSymbol size={24} name="xmark" color={textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.accountItem, { borderBottomColor: borderColor }]}
                  onPress={() => {
                    setSelectedAccount(account);
                    setShowAccountModal(false);
                  }}
                >
                  <ThemedText style={[styles.accountName, { color: textMain }]}>
                    {account.name}
                  </ThemedText>
                  <ThemedText style={[styles.accountBalance, { color: textSub }]}>
                    ${account.balance.toFixed(2)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* To Account Modal */}
      <Modal
        visible={showToAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowToAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Selecciona Cuenta Destino
              </ThemedText>
              <TouchableOpacity onPress={() => setShowToAccountModal(false)}>
                <IconSymbol size={24} name="xmark" color={textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {accounts.filter(a => a.id !== selectedAccount?.id).map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.accountItem, { borderBottomColor: borderColor }]}
                  onPress={() => {
                    setSelectedToAccount(account);
                    setShowToAccountModal(false);
                  }}
                >
                  <ThemedText style={[styles.accountName, { color: textMain }]}>
                    {account.name}
                  </ThemedText>
                  <ThemedText style={[styles.accountBalance, { color: textSub }]}>
                    ${account.balance.toFixed(2)}
                  </ThemedText>
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
  content: {
    padding: 16,
  },
  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Amount
  amountSection: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  // Section
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionInput: {
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
    marginTop: 2,
  },
  // Date & Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateTimeInfo: {
    flex: 1,
  },
  // Notes
  notesSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesInput: {
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Save Button
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Account Item
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '500',
  },
});
