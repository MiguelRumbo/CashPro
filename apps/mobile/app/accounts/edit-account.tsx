import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { formatCardNumber, formatCurrencyInput, getNumericValue } from '@/utils/format';

interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'debit' | 'credit';
  balance: number;
  clabe?: string;
  bank_name?: string;
  card_number?: string;
  generates_interest?: number;
  interest_rate?: number;
  credit_limit?: number;
  current_balance?: number;
  cut_off_day?: number;
  payment_due_day?: number;
}

export default function EditAccountScreen() {
  const params = useLocalSearchParams();
  const accountId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [clabe, setClabe] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [generatesInterest, setGeneratesInterest] = useState(false);
  const [interestRate, setInterestRate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [cutOffDay, setCutOffDay] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'debit' | 'credit'>('cash');

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2e24' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  useEffect(() => {
    fetchAccount();
  }, [accountId]);

  const fetchAccount = () => {
    try {
      const result = database.getAccountById(Number(accountId));

      if (result.success) {
        const account: Account = result.data;
        setAccountType(account.type);
        setName(account.name);
        setBalance(formatCurrencyInput(account.balance?.toString() || '0'));
        setClabe(account.clabe || '');
        setBankName(account.bank_name || '');
        setCardNumber(account.card_number || '');
        setGeneratesInterest(account.generates_interest === 1);
        setInterestRate(account.interest_rate?.toString() || '');
        setCreditLimit(formatCurrencyInput(account.credit_limit?.toString() || '0'));
        // Mostrar credito disponible = limite - usado
        const available = (account.credit_limit || 0) - (account.current_balance || 0);
        setCurrentBalance(formatCurrencyInput(available.toString()));
        setCutOffDay(account.cut_off_day?.toString() || '');
        setPaymentDueDay(account.payment_due_day?.toString() || '');
      } else {
        Alert.alert('Error', 'No se pudo cargar la cuenta');
        router.back();
      }
    } catch (error) {
      console.error('Error al cargar cuenta:', error);
      Alert.alert('Error', 'No se pudo cargar la cuenta');
      router.back();
    } finally {
      setLoading(false);
    }
  };

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
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la cuenta es requerido');
      return;
    }

    const updateData: any = {
      name: name.trim(),
    };

    // Agregar campos según el tipo
    if (accountType === 'cash') {
      updateData.balance = getNumericValue(balance);
    }

    if (accountType === 'bank') {
      updateData.clabe = clabe;
      updateData.bank_name = bankName;
      updateData.balance = getNumericValue(balance);
      updateData.generates_interest = generatesInterest ? 1 : 0;
      updateData.interest_rate = generatesInterest ? parseFloat(interestRate) || 0 : 0;
    }

    if (accountType === 'debit') {
      updateData.card_number = cardNumber.replace(/\s/g, '');
      updateData.bank_name = bankName;
      updateData.balance = getNumericValue(balance);
      updateData.generates_interest = generatesInterest ? 1 : 0;
      updateData.interest_rate = generatesInterest ? parseFloat(interestRate) || 0 : 0;
    }

    if (accountType === 'credit') {
      updateData.card_number = cardNumber.replace(/\s/g, '');
      updateData.bank_name = bankName;
      const limit = getNumericValue(creditLimit);
      const available = getNumericValue(currentBalance);
      updateData.credit_limit = limit;
      updateData.current_balance = limit - available; // Lo usado = limite - disponible
      updateData.cut_off_day = parseInt(cutOffDay) || 1;
      updateData.payment_due_day = parseInt(paymentDueDay) || 1;
    }

    try {
      const result = database.updateAccount(Number(accountId), updateData);

      if (result.success) {
        Alert.alert('Éxito', 'Cuenta actualizada exitosamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar la cuenta');
      }
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      Alert.alert('Error', 'No se pudo actualizar la cuenta');
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textSub }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Editar Cuenta',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            <ThemedText style={[styles.label, { color: textMain }]}>Monto</ThemedText>
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
              <ThemedText style={[styles.label, { color: textMain }]}>Monto</ThemedText>
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
              <ThemedText style={[styles.label, { color: textMain }]}>Crédito Disponible</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, color: textMain, borderColor }]}
                placeholder="0.00"
                placeholderTextColor={textSub}
                keyboardType="decimal-pad"
                value={currentBalance}
                onChangeText={handleCurrentBalanceChange}
              />
              <ThemedText style={[styles.hint, { color: textSub }]}>
                Cuánto crédito tienes disponible actualmente
              </ThemedText>
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
            <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>Guardar Cambios</ThemedText>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
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
