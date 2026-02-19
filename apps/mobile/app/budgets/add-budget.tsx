import { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';

type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

const BUDGET_ICONS = [
  { icon: 'cart.fill', color: '#8b5cf6', label: 'Compras' },
  { icon: 'fork.knife', color: '#ef4444', label: 'Comida' },
  { icon: 'car.fill', color: '#10b981', label: 'Transporte' },
  { icon: 'house.fill', color: '#f59e0b', label: 'Hogar' },
  { icon: 'film', color: '#ec4899', label: 'Entretenimiento' },
  { icon: 'heart.fill', color: '#f43f5e', label: 'Salud' },
  { icon: 'briefcase.fill', color: '#6366f1', label: 'Trabajo' },
  { icon: 'sparkles', color: '#d946ef', label: 'Otros' },
];

export default function AddBudgetScreen() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(BUDGET_ICONS[0]);
  const [loading, setLoading] = useState(false);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');
  const primary = '#20df60';
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1f2937' }, 'inputBackground');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el presupuesto');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          type: 'expense',
          amount: parseFloat(amount),
          period,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          icon: selectedIcon.icon,
          color: selectedIcon.color,
          category_ids: null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Éxito', 'Presupuesto creado correctamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el presupuesto');
      }
    } catch (error) {
      console.error('Error al crear presupuesto:', error);
      Alert.alert('Error', 'No se pudo crear el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      // Si la fecha de fin es anterior a la nueva fecha de inicio, resetearla
      if (endDate && endDate < selectedDate) {
        setEndDate(null);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          title: 'Nuevo Presupuesto',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={[styles.card, { backgroundColor: surfaceColor }]}>
          {/* Descripción */}
          <View style={[styles.infoBox, { backgroundColor: primary + '10', borderColor: primary + '30' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={primary} />
            <ThemedText style={[styles.infoText, { color: textMain }]}>
              Establece un límite de gasto para controlar tus finanzas
            </ThemedText>
          </View>

          {/* Nombre */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Nombre del presupuesto *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textMain, borderColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Gastos del mes"
              placeholderTextColor={textMuted}
            />
          </View>

          {/* Monto límite */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Límite de gasto *
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

          {/* Periodo */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Periodo *
            </ThemedText>
            <View style={styles.periodGrid}>
              <TouchableOpacity
                style={[
                  styles.periodChip,
                  { 
                    backgroundColor: period === 'daily' ? primary + '20' : inputBg,
                    borderColor: period === 'daily' ? primary : borderColor,
                  }
                ]}
                onPress={() => setPeriod('daily')}
              >
                <IconSymbol 
                  name="sun.max.fill" 
                  size={20} 
                  color={period === 'daily' ? primary : textMuted} 
                />
                <ThemedText 
                  style={[
                    styles.periodChipText, 
                    { color: period === 'daily' ? primary : textMain }
                  ]}
                >
                  Diario
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodChip,
                  { 
                    backgroundColor: period === 'weekly' ? primary + '20' : inputBg,
                    borderColor: period === 'weekly' ? primary : borderColor,
                  }
                ]}
                onPress={() => setPeriod('weekly')}
              >
                <IconSymbol 
                  name="calendar" 
                  size={20} 
                  color={period === 'weekly' ? primary : textMuted} 
                />
                <ThemedText 
                  style={[
                    styles.periodChipText, 
                    { color: period === 'weekly' ? primary : textMain }
                  ]}
                >
                  Semanal
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodChip,
                  { 
                    backgroundColor: period === 'monthly' ? primary + '20' : inputBg,
                    borderColor: period === 'monthly' ? primary : borderColor,
                  }
                ]}
                onPress={() => setPeriod('monthly')}
              >
                <IconSymbol 
                  name="calendar.badge.clock" 
                  size={20} 
                  color={period === 'monthly' ? primary : textMuted} 
                />
                <ThemedText 
                  style={[
                    styles.periodChipText, 
                    { color: period === 'monthly' ? primary : textMain }
                  ]}
                >
                  Mensual
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fecha de inicio */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Fecha de inicio *
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={textMuted} />
              <ThemedText style={[styles.dateButtonText, { color: textMain }]}>
                {startDate.toLocaleDateString('es-MX', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </ThemedText>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
              />
            )}
          </View>

          {/* Fecha de fin (opcional) */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Fecha de fin (opcional)
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={textMuted} />
              <ThemedText style={[styles.dateButtonText, { color: endDate ? textMain : textMuted }]}>
                {endDate 
                  ? endDate.toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Sin fecha de fin'
                }
              </ThemedText>
              {endDate && (
                <TouchableOpacity onPress={() => setEndDate(null)}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndDateChange}
                minimumDate={startDate}
              />
            )}
            <ThemedText style={[styles.hint, { color: textMuted }]}>
              Si no estableces fecha de fin, el presupuesto se renovará automáticamente según el periodo
            </ThemedText>
          </View>

          {/* Icono */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textMain }]}>
              Icono
            </ThemedText>
            <View style={styles.iconsGrid}>
              {BUDGET_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[
                    styles.iconOption,
                    { 
                      backgroundColor: selectedIcon.icon === item.icon ? item.color + '20' : inputBg,
                      borderColor: selectedIcon.icon === item.icon ? item.color : borderColor,
                    }
                  ]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <IconSymbol name={item.icon as any} size={24} color={item.color} />
                  <ThemedText 
                    style={[
                      styles.iconLabel, 
                      { color: selectedIcon.icon === item.icon ? item.color : textMuted }
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
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
            {loading ? 'Guardando...' : 'Crear Presupuesto'}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
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
    marginTop: 6,
    lineHeight: 16,
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
  periodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
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
});
