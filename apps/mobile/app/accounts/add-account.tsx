import { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { formatCardNumber, formatCurrencyInput, getNumericValue } from '@/utils/format';

type AccountType = 'cash' | 'bank' | 'debit' | 'credit';

export default function AddAccountScreen() {
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2e24' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  
  // Campos para banco/débito
  const [clabe, setClabe] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [generatesInterest, setGeneratesInterest] = useState(false);
  const [interestRate, setInterestRate] = useState('');
  
  // Campos para crédito
  const [creditLimit, setCreditLimit] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [cutOffDay, setCutOffDay] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');

  const accountTypes = [
    { id: 'cash', label: 'Efectivo', icon: 'banknote', color: '#16a34a' },
    { id: 'bank', label: 'Banco', icon: 'building.columns.fill', color: '#2563eb' },
    { id: 'debit', label: 'Débito', icon: 'creditcard', color: '#7c3aed' },
    { id: 'credit', label: 'Crédito', icon: 'creditcard.fill', color: '#dc2626' },
  ];

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleBalanceChange = (text: string) => {
    setBalance(formatCurrencyInput(text));
  };

  const handleCreditLimitChange = (text: string) => {
    setCreditLimit(formatCurrencyInput(text));
  };

  const handleCurrentBalanceChange = (text: string) => {
    setCurrentBalance(formatCurrencyInput(text));
  };

  const handleSave = async () => {
    // Validaciones básicas
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la cuenta es requerido');
      return;
    }

    if (accountType !== 'credit' && !balance) {
      Alert.alert('Error', 'El monto es requerido');
      return;
    }

    if (accountType === 'bank' && !clabe) {
      Alert.alert('Error', 'La CLABE es requerida para cuentas bancarias');
      return;
    }

    if ((accountType === 'debit' || accountType === 'credit') && !cardNumber) {
      Alert.alert('Error', 'El número de tarjeta es requerido');
      return;
    }

    if (accountType === 'credit') {
      if (!creditLimit || !currentBalance) {
        Alert.alert('Error', 'El límite de crédito y monto actual son requeridos');
        return;
      }
      if (!cutOffDay || !paymentDueDay) {
        Alert.alert('Error', 'Los días de corte y pago son requeridos');
        return;
      }
    }

    const accountData: any = {
      name: name.trim(),
      type: accountType,
      balance: accountType === 'credit' ? 0 : getNumericValue(balance),
      currency: 'MXN',
    };

    // Agregar campos según el tipo
    if (accountType === 'bank' || accountType === 'debit') {
      accountData.clabe = clabe;
      accountData.bank_name = bankName;
      accountData.generates_interest = generatesInterest ? 1 : 0;
      accountData.interest_rate = generatesInterest ? parseFloat(interestRate) || 0 : 0;
    }

    if (accountType === 'debit' || accountType === 'credit') {
      accountData.card_number = cardNumber.replace(/\s/g, '');
    }

    if (accountType === 'credit') {
      accountData.credit_limit = getNumericValue(creditLimit);
      accountData.current_balance = getNumericValue(currentBalance);
      accountData.cut_off_day = parseInt(cutOffDay) || 1;
      accountData.payment_due_day = parseInt(paymentDueDay) || 1;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Éxito', 'Cuenta creada exitosamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear la cuenta');
      }
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Nueva Cuenta',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo de Cuenta */}
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: textMain }]}>Tipo de Cuenta</ThemedText>
          <View style={styles.typeGrid}>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  { 
                    backgroundColor: surfaceColor,
                    borderColor: accountType === type.id ? primary : borderColor,
                    borderWidth: accountType === type.id ? 2 : 1,
                  }
                ]}
                onPress={() => setAccountType(type.id as AccountType)}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                  <IconSymbol size={24} name={type.icon as any} color={type.color} />
                </View>
                <ThemedText style={[styles.typeLabel, { color: textMain }]}>
                  {type.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nombre */}
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: textMain }]}>Nombre de la Cuenta</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
            placeholder="Ej: Mi Billetera, BBVA Débito"
            placeholderTextColor={textSub}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Campos para Efectivo */}
        {accountType === 'cash' && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: textMain }]}>Monto Inicial</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
              placeholder="0.00"
              placeholderTextColor={textSub}
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={handleBalanceChange}
            />
          </View>
        )}

        {/* Campos para Banco */}
        {accountType === 'bank' && (
          <>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>CLABE</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="18 dígitos"
                placeholderTextColor={textSub}
                keyboardType="number-pad"
                maxLength={18}
                value={clabe}
                onChangeText={setClabe}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Banco</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="Ej: BBVA, Santander"
                placeholderTextColor={textSub}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Monto Inicial</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="0.00"
                placeholderTextColor={textSub}
                keyboardType="decimal-pad"
                value={balance}
                onChangeText={handleBalanceChange}
              />
            </View>

            <View style={[styles.section, styles.switchRow]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.label, { color: textMain }]}>Genera Interés</ThemedText>
                <ThemedText style={[styles.hint, { color: textSub }]}>
                  ¿Esta cuenta genera intereses?
                </ThemedText>
              </View>
              <Switch
                value={generatesInterest}
                onValueChange={setGeneratesInterest}
                trackColor={{ false: borderColor, true: primary }}
                thumbColor="#ffffff"
              />
            </View>

            {generatesInterest && (
              <View style={styles.section}>
                <ThemedText style={[styles.label, { color: textMain }]}>Tasa de Interés (%)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                  placeholder="Ej: 2.5"
                  placeholderTextColor={textSub}
                  keyboardType="decimal-pad"
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>
            )}
          </>
        )}

        {/* Campos para Débito */}
        {accountType === 'debit' && (
          <>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Número de Tarjeta</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={textSub}
                keyboardType="number-pad"
                maxLength={19}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
              />
              <ThemedText style={[styles.hint, { color: textSub }]}>
                Solo se mostrarán los últimos 4 dígitos
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Nombre de la Tarjeta</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="Ej: BBVA Débito"
                placeholderTextColor={textSub}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Monto Disponible</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="0.00"
                placeholderTextColor={textSub}
                keyboardType="decimal-pad"
                value={balance}
                onChangeText={handleBalanceChange}
              />
            </View>

            <View style={[styles.section, styles.switchRow]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.label, { color: textMain }]}>Genera Interés</ThemedText>
              </View>
              <Switch
                value={generatesInterest}
                onValueChange={setGeneratesInterest}
                trackColor={{ false: borderColor, true: primary }}
                thumbColor="#ffffff"
              />
            </View>

            {generatesInterest && (
              <View style={styles.section}>
                <ThemedText style={[styles.label, { color: textMain }]}>Tasa de Interés (%)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                  placeholder="Ej: 2.5"
                  placeholderTextColor={textSub}
                  keyboardType="decimal-pad"
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>
            )}
          </>
        )}

        {/* Campos para Crédito */}
        {accountType === 'credit' && (
          <>
            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Número de Tarjeta</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={textSub}
                keyboardType="number-pad"
                maxLength={19}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Banco</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="Ej: BBVA, Santander"
                placeholderTextColor={textSub}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Límite de Crédito</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="0.00"
                placeholderTextColor={textSub}
                keyboardType="decimal-pad"
                value={creditLimit}
                onChangeText={handleCreditLimitChange}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: textMain }]}>Saldo Actual (Deuda)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="0.00"
                placeholderTextColor={textSub}
                keyboardType="decimal-pad"
                value={currentBalance}
                onChangeText={handleCurrentBalanceChange}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.section, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textMain }]}>Día de Corte</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                  placeholder="1-31"
                  placeholderTextColor={textSub}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={cutOffDay}
                  onChangeText={setCutOffDay}
                />
              </View>

              <View style={[styles.section, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: textMain }]}>Día de Pago</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                  placeholder="1-31"
                  placeholderTextColor={textSub}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={paymentDueDay}
                  onChangeText={setPaymentDueDay}
                />
              </View>
            </View>
          </>
        )}

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.buttonText, { color: textMain }]}>Cancelar</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: primary }]}
            onPress={handleSave}
          >
            <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>Guardar</ThemedText>
          </TouchableOpacity>
        </View>

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
    padding: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
