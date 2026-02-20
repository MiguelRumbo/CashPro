import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
};

const TYPES = [
  { value: 'subscription', label: 'Suscripción', icon: 'play.circle', color: '#ec4899' },
  { value: 'salary', label: 'Salario', icon: 'dollarsign.circle.fill', color: '#10b981' },
  { value: 'recurring_expense', label: 'Gasto Recurrente', icon: 'repeat', color: '#f59e0b' },
  { value: 'recurring_income', label: 'Ingreso Recurrente', icon: 'arrow.down', color: '#3b82f6' },
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
];

const ICONS = [
  { name: 'play.circle', label: 'Streaming' },
  { name: 'music.note', label: 'Música' },
  { name: 'dollarsign.circle.fill', label: 'Dinero' },
  { name: 'house', label: 'Vivienda' },
  { name: 'car', label: 'Auto' },
  { name: 'wifi', label: 'Internet' },
  { name: 'bolt', label: 'Luz' },
  { name: 'figure.run', label: 'Gym' },
  { name: 'heart', label: 'Salud' },
  { name: 'book.fill', label: 'Educación' },
  { name: 'bag', label: 'Compras' },
  { name: 'creditcard', label: 'Tarjeta' },
];

const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#eab308',
];

export default function AddSubscriptionScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState('subscription');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [specificDates, setSpecificDates] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [icon, setIcon] = useState('play.circle');
  const [color, setColor] = useState('#ec4899');
  const [autoRegister, setAutoRegister] = useState(false);
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('1');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1f2937' }, 'surface');
  const primary = '#20df60';

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const result = database.getAccounts();
      if (result.success) {
        setAccounts(result.data);
        const primaryAccount = result.data.find((a: Account) => (a as any).is_primary === 1);
        if (primaryAccount) setAccountId(primaryAccount.id);
        else if (result.data.length > 0) setAccountId(result.data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!accountId) {
      Alert.alert('Error', 'Selecciona una cuenta');
      return;
    }

    setSaving(true);

    try {
      const body: any = {
        name: name.trim(),
        type,
        amount: parseFloat(amount),
        frequency,
        account_id: accountId,
        icon,
        color,
        is_active: true,
        auto_register: autoRegister,
        notify_before_days: parseInt(notifyBeforeDays) || 1,
      };

      if (frequency === 'monthly' && dayOfMonth) {
        body.day_of_month = parseInt(dayOfMonth);
      }
      if (frequency === 'biweekly' && specificDates) {
        body.specific_dates = specificDates;
      }

      const result = database.createRecurringPayment(body);

      if (result.success) {
        router.back();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Nuevo Pago Recurrente',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Tipo */}
        <ThemedText style={[styles.label, { color: textMain }]}>Tipo</ThemedText>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeChip,
                {
                  backgroundColor: type === t.value ? t.color + '20' : surfaceColor,
                  borderColor: type === t.value ? t.color : borderColor,
                },
              ]}
              onPress={() => {
                setType(t.value);
                setColor(t.color);
              }}
            >
              <IconSymbol name={t.icon as any} size={18} color={type === t.value ? t.color : textMuted} />
              <ThemedText
                style={[
                  styles.typeChipText,
                  { color: type === t.value ? t.color : textMuted },
                ]}
              >
                {t.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nombre */}
        <ThemedText style={[styles.label, { color: textMain }]}>Nombre</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Netflix, Salario, Renta..."
          placeholderTextColor={textMuted}
        />

        {/* Monto */}
        <ThemedText style={[styles.label, { color: textMain }]}>Monto</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={textMuted}
          keyboardType="decimal-pad"
        />

        {/* Frecuencia */}
        <ThemedText style={[styles.label, { color: textMain }]}>Frecuencia</ThemedText>
        <View style={styles.frequencyRow}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.frequencyChip,
                {
                  backgroundColor: frequency === f.value ? primary + '20' : surfaceColor,
                  borderColor: frequency === f.value ? primary : borderColor,
                },
              ]}
              onPress={() => setFrequency(f.value)}
            >
              <ThemedText
                style={[
                  styles.frequencyChipText,
                  { color: frequency === f.value ? primary : textMuted },
                ]}
              >
                {f.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Día del mes (para mensual) */}
        {frequency === 'monthly' && (
          <>
            <ThemedText style={[styles.label, { color: textMain }]}>Día del mes</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={dayOfMonth}
              onChangeText={setDayOfMonth}
              placeholder="Ej: 15"
              placeholderTextColor={textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
          </>
        )}

        {/* Fechas específicas (para quincenal) */}
        {frequency === 'biweekly' && (
          <>
            <ThemedText style={[styles.label, { color: textMain }]}>Días (separados por coma)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={specificDates}
              onChangeText={setSpecificDates}
              placeholder="Ej: 1,15 o 14,28"
              placeholderTextColor={textMuted}
              keyboardType="default"
            />
          </>
        )}

        {/* Cuenta */}
        <ThemedText style={[styles.label, { color: textMain }]}>Cuenta</ThemedText>
        <View style={styles.accountsGrid}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountChip,
                {
                  backgroundColor: accountId === account.id ? primary + '20' : surfaceColor,
                  borderColor: accountId === account.id ? primary : borderColor,
                },
              ]}
              onPress={() => setAccountId(account.id)}
            >
              <ThemedText
                style={[
                  styles.accountChipText,
                  { color: accountId === account.id ? primary : textMain },
                ]}
              >
                {account.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Icono */}
        <ThemedText style={[styles.label, { color: textMain }]}>Icono</ThemedText>
        <View style={styles.iconsGrid}>
          {ICONS.map((i) => (
            <TouchableOpacity
              key={i.name}
              style={[
                styles.iconChip,
                {
                  backgroundColor: icon === i.name ? color + '20' : surfaceColor,
                  borderColor: icon === i.name ? color : borderColor,
                },
              ]}
              onPress={() => setIcon(i.name)}
            >
              <IconSymbol name={i.name as any} size={22} color={icon === i.name ? color : textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Color */}
        <ThemedText style={[styles.label, { color: textMain }]}>Color</ThemedText>
        <View style={styles.colorsGrid}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorChip,
                { backgroundColor: c },
                color === c && styles.colorChipSelected,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* Registro automático */}
        <View style={[styles.switchRow, { borderColor }]}>
          <View>
            <ThemedText style={[styles.switchLabel, { color: textMain }]}>
              Registro automático
            </ThemedText>
            <ThemedText style={[styles.switchDescription, { color: textMuted }]}>
              Crear movimiento automáticamente al llegar la fecha
            </ThemedText>
          </View>
          <Switch
            value={autoRegister}
            onValueChange={setAutoRegister}
            trackColor={{ false: '#e5e7eb', true: primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Notificar antes */}
        <ThemedText style={[styles.label, { color: textMain }]}>Notificar antes (días)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={notifyBeforeDays}
          onChangeText={setNotifyBeforeDays}
          placeholder="1"
          placeholderTextColor={textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <ThemedText style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar'}
          </ThemedText>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  frequencyChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorChipSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 250,
  },
  saveButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
