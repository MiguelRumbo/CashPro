import { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Switch, Platform, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrencyInput, getNumericValue } from '@/utils/format';
import * as database from '@/services/database';

const GOAL_ICONS = [
  { id: 'target', name: 'target', color: '#20df60' },
  { id: 'house', name: 'house.fill', color: '#3b82f6' },
  { id: 'car', name: 'car.fill', color: '#ef4444' },
  { id: 'airplane', name: 'airplane', color: '#8b5cf6' },
  { id: 'graduationcap', name: 'graduationcap.fill', color: '#f59e0b' },
  { id: 'gift', name: 'gift.fill', color: '#ec4899' },
  { id: 'heart', name: 'heart.fill', color: '#ef4444' },
  { id: 'star', name: 'star.fill', color: '#eab308' },
];

export default function AddGoalScreen() {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const [autoDeduct, setAutoDeduct] = useState(false);
  const [autoDeductAmount, setAutoDeductAmount] = useState('');
  const [autoDeductPeriod, setAutoDeductPeriod] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#0a0f0d' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Sin fecha límite';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleSave = async () => {
    // Validaciones
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!targetAmount || getNumericValue(targetAmount) === 0) {
      Alert.alert('Error', 'El monto objetivo es requerido');
      return;
    }

    if (autoDeduct && (!autoDeductAmount || getNumericValue(autoDeductAmount) === 0)) {
      Alert.alert('Error', 'El monto de descuento automático es requerido');
      return;
    }

    const goalData = {
      name: name.trim(),
      target_amount: getNumericValue(targetAmount),
      current_amount: 0,
      deadline: deadline ? deadline.toISOString() : null,
      icon: selectedIcon.id,
      color: selectedIcon.color,
      account_id: null,
      auto_deduct: autoDeduct,
      auto_deduct_amount: autoDeduct ? getNumericValue(autoDeductAmount) : 0,
      auto_deduct_period: autoDeduct ? autoDeductPeriod : null,
      status: 'active',
    };

    try {
      const result = database.createSavingsGoal(goalData);

      if (result.success) {
        Alert.alert('Éxito', 'Objetivo creado exitosamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el objetivo');
      }
    } catch (error) {
      console.error('Error al crear objetivo:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Nuevo Objetivo',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="text.alignleft" color={textSub} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Nombre del Objetivo</ThemedText>
              <TextInput
                style={[styles.sectionInput, { color: textMain }]}
                placeholder="Ej: Casa nueva, Vacaciones"
                placeholderTextColor={textSub}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
        </View>

        {/* Target Amount */}
        <View style={[styles.amountSection, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.amountLabel, { color: textSub }]}>Monto Objetivo</ThemedText>
          <View style={styles.amountInputContainer}>
            <ThemedText style={[styles.currencySymbol, { color: textMain }]}>$</ThemedText>
            <TextInput
              style={[styles.amountInput, { color: textMain }]}
              placeholder="0"
              placeholderTextColor={textSub}
              keyboardType="decimal-pad"
              value={targetAmount}
              onChangeText={(text) => setTargetAmount(formatCurrencyInput(text))}
            />
          </View>
        </View>

        {/* Icon Selection */}
        <View style={[styles.iconSection, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Icono</ThemedText>
          <View style={styles.iconsGrid}>
            {GOAL_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon.id}
                style={[
                  styles.iconOption,
                  { backgroundColor: icon.color + '20' },
                  selectedIcon.id === icon.id && { borderWidth: 3, borderColor: icon.color }
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <IconSymbol size={28} name={icon.name as any} color={icon.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deadline */}
        <TouchableOpacity
          style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.sectionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="calendar" color={textSub} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Fecha Límite (Opcional)</ThemedText>
              <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                {formatDate(deadline)}
              </ThemedText>
            </View>
          </View>
          <IconSymbol size={20} name="chevron.right" color={textSub} />
        </TouchableOpacity>

        {deadline && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: borderColor }]}
            onPress={() => setDeadline(null)}
          >
            <IconSymbol size={16} name="xmark" color={textSub} />
            <ThemedText style={[styles.clearButtonText, { color: textSub }]}>
              Quitar fecha límite
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Auto Deduct */}
        <View style={[styles.autoDeductSection, { backgroundColor: surfaceColor }]}>
          <View style={styles.autoDeductHeader}>
            <View style={styles.autoDeductHeaderLeft}>
              <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
                <IconSymbol size={20} name="arrow.clockwise" color={textSub} />
              </View>
              <View>
                <ThemedText style={[styles.sectionLabel, { color: textMain }]}>
                  Descuento Automático
                </ThemedText>
                <ThemedText style={[styles.sectionSubtext, { color: textSub }]}>
                  Ahorra automáticamente cada periodo
                </ThemedText>
              </View>
            </View>
            <Switch
              value={autoDeduct}
              onValueChange={setAutoDeduct}
              trackColor={{ false: '#e5e7eb', true: primary }}
              thumbColor="#ffffff"
            />
          </View>

          {autoDeduct && (
            <>
              {/* Auto Deduct Amount */}
              <View style={styles.autoDeductAmount}>
                <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Monto</ThemedText>
                <View style={styles.amountInputContainer}>
                  <ThemedText style={[styles.currencySymbol, { color: textMain, fontSize: 20 }]}>$</ThemedText>
                  <TextInput
                    style={[styles.amountInput, { color: textMain, fontSize: 24 }]}
                    placeholder="0"
                    placeholderTextColor={textSub}
                    keyboardType="decimal-pad"
                    value={autoDeductAmount}
                    onChangeText={(text) => setAutoDeductAmount(formatCurrencyInput(text))}
                  />
                </View>
              </View>

              {/* Period Selection */}
              <View style={styles.periodSelection}>
                <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Frecuencia</ThemedText>
                <View style={styles.periodButtons}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      { borderColor },
                      autoDeductPeriod === 'weekly' && { backgroundColor: primary, borderColor: primary }
                    ]}
                    onPress={() => setAutoDeductPeriod('weekly')}
                  >
                    <ThemedText style={[
                      styles.periodButtonText,
                      { color: autoDeductPeriod === 'weekly' ? '#ffffff' : textMain }
                    ]}>
                      Semanal
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      { borderColor },
                      autoDeductPeriod === 'biweekly' && { backgroundColor: primary, borderColor: primary }
                    ]}
                    onPress={() => setAutoDeductPeriod('biweekly')}
                  >
                    <ThemedText style={[
                      styles.periodButtonText,
                      { color: autoDeductPeriod === 'biweekly' ? '#ffffff' : textMain }
                    ]}>
                      Quincenal
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      { borderColor },
                      autoDeductPeriod === 'monthly' && { backgroundColor: primary, borderColor: primary }
                    ]}
                    onPress={() => setAutoDeductPeriod('monthly')}
                  >
                    <ThemedText style={[
                      styles.periodButtonText,
                      { color: autoDeductPeriod === 'monthly' ? '#ffffff' : textMain }
                    ]}>
                      Mensual
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: primary }]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Crear Objetivo</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
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
  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionSubtext: {
    fontSize: 11,
    marginTop: 2,
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
  // Icon Section
  iconSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  iconOption: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Clear Button
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Auto Deduct
  autoDeductSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  autoDeductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  autoDeductHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  autoDeductAmount: {
    alignItems: 'center',
    marginBottom: 16,
  },
  periodSelection: {
    gap: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});
