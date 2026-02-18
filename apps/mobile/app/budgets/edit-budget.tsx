import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrencyInput, getNumericValue } from '@/utils/format';
import { API_CONFIG } from '@/config/api';

type BudgetType = 'saving' | 'expense';
type BudgetPeriod = 'weekly' | 'monthly';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

const CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', icon: 'fork.knife', color: '#ea580c' },
  { id: '2', name: 'Comestibles', icon: 'cart.fill', color: '#16a34a' },
  { id: '3', name: 'Compras', icon: 'bag.fill', color: '#dc2626' },
  { id: '4', name: 'Transporte', icon: 'car.fill', color: '#2563eb' },
  { id: '5', name: 'Entretenimiento', icon: 'film', color: '#db2777' },
  { id: '6', name: 'Facturas', icon: 'doc.text.fill', color: '#059669' },
  { id: '7', name: 'Regalos', icon: 'gift.fill', color: '#dc2626' },
  { id: '8', name: 'Belleza', icon: 'sparkles', color: '#d946ef' },
  { id: '9', name: 'Trabajo', icon: 'briefcase.fill', color: '#92400e' },
  { id: '10', name: 'Viajes', icon: 'airplane', color: '#0891b2' },
];

const BUDGET_ICONS = [
  { icon: 'airplane', color: '#3b82f6', label: 'Viajes' },
  { icon: 'gift.fill', color: '#ec4899', label: 'Regalos' },
  { icon: 'cart.fill', color: '#8b5cf6', label: 'Compras' },
  { icon: 'house.fill', color: '#f59e0b', label: 'Hogar' },
  { icon: 'car.fill', color: '#10b981', label: 'Auto' },
  { icon: 'fork.knife', color: '#ef4444', label: 'Comida' },
  { icon: 'heart.fill', color: '#f43f5e', label: 'Salud' },
  { icon: 'graduationcap.fill', color: '#6366f1', label: 'Educación' },
];

export default function EditBudgetScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [budgetType, setBudgetType] = useState<BudgetType>('saving');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(BUDGET_ICONS[0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#0a0f0d' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/budgets/${id}`);
      const result = await response.json();
      
      if (result.success) {
        const budget = result.data;
        setBudgetType(budget.type);
        setName(budget.name);
        setAmount(formatCurrencyInput(budget.amount.toString()));
        setPeriod(budget.period);
        setStartDate(new Date(budget.start_date));
        
        // Cargar categorías si existen
        if (budget.category_ids) {
          try {
            const categoryIds = typeof budget.category_ids === 'string' 
              ? JSON.parse(budget.category_ids) 
              : budget.category_ids;
            setSelectedCategories(categoryIds || []);
          } catch (e) {
            setSelectedCategories([]);
          }
        }
        
        const icon = BUDGET_ICONS.find(i => i.icon === budget.icon);
        if (icon) {
          setSelectedIcon(icon);
        }
      } else {
        Alert.alert('Error', 'No se pudo cargar el presupuesto');
        router.back();
      }
    } catch (error) {
      console.error('Error al cargar presupuesto:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatCurrencyInput(text));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    // Validaciones
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!amount || getNumericValue(amount) === 0) {
      Alert.alert('Error', 'El monto es requerido');
      return;
    }

    const budgetData = {
      name: name.trim(),
      type: budgetType,
      amount: getNumericValue(amount),
      period,
      start_date: startDate.toISOString(),
      icon: selectedIcon.icon,
      color: selectedIcon.color,
      category_ids: budgetType === 'expense' && selectedCategories.length > 0 ? selectedCategories : null,
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/budgets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Éxito', 'Presupuesto actualizado exitosamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el presupuesto');
      }
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Editar Presupuesto',
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
              budgetType === 'saving' && styles.typeButtonActive,
              { 
                backgroundColor: budgetType === 'saving' ? 'rgba(32, 223, 96, 0.1)' : surfaceColor, 
                borderColor 
              }
            ]}
            onPress={() => setBudgetType('saving')}
          >
            <IconSymbol size={20} name="arrow.up.circle.fill" color={budgetType === 'saving' ? primary : textSub} />
            <ThemedText style={[styles.typeButtonText, { color: budgetType === 'saving' ? primary : textSub }]}>
              Ahorro
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              budgetType === 'expense' && styles.typeButtonActive,
              { 
                backgroundColor: budgetType === 'expense' ? 'rgba(239, 68, 68, 0.1)' : surfaceColor, 
                borderColor 
              }
            ]}
            onPress={() => setBudgetType('expense')}
          >
            <IconSymbol size={20} name="arrow.down.circle.fill" color={budgetType === 'expense' ? '#ef4444' : textSub} />
            <ThemedText style={[styles.typeButtonText, { color: budgetType === 'expense' ? '#ef4444' : textSub }]}>
              Gasto
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="text.alignleft" color={textSub} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Nombre</ThemedText>
              <TextInput
                style={[styles.sectionInput, { color: textMain }]}
                placeholder={budgetType === 'saving' ? 'Ej: Vacaciones' : 'Ej: Salidas'}
                placeholderTextColor={textSub}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
        </View>

        {/* Amount */}
        <View style={[styles.amountSection, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.amountLabel, { color: textSub }]}>
            {budgetType === 'saving' ? 'Meta de Ahorro' : 'Límite de Gasto'}
          </ThemedText>
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

        {/* Period */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'weekly' && styles.periodButtonActive,
              { backgroundColor: period === 'weekly' ? primary : surfaceColor, borderColor }
            ]}
            onPress={() => setPeriod('weekly')}
          >
            <ThemedText style={[styles.periodButtonText, { color: period === 'weekly' ? '#ffffff' : textMain }]}>
              Semanal
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'monthly' && styles.periodButtonActive,
              { backgroundColor: period === 'monthly' ? primary : surfaceColor, borderColor }
            ]}
            onPress={() => setPeriod('monthly')}
          >
            <ThemedText style={[styles.periodButtonText, { color: period === 'monthly' ? '#ffffff' : textMain }]}>
              Mensual
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Start Date */}
        <TouchableOpacity
          style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.sectionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="calendar" color={textSub} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText style={[styles.sectionLabel, { color: textSub }]}>Fecha de Inicio</ThemedText>
              <ThemedText style={[styles.sectionValue, { color: textMain }]}>
                {formatDate(startDate)}
              </ThemedText>
            </View>
          </View>
          <IconSymbol size={20} name="chevron.right" color={textSub} />
        </TouchableOpacity>

        {/* Category Selector - Solo para presupuestos de gasto */}
        {budgetType === 'expense' && (
          <View style={[styles.categorySection, { backgroundColor: surfaceColor }]}>
            <View style={styles.categorySectionHeader}>
              <ThemedText style={[styles.categorySectionTitle, { color: textMain }]}>
                Categorías a Rastrear
              </ThemedText>
              <ThemedText style={[styles.categorySectionSubtitle, { color: textSub }]}>
                {selectedCategories.length === 0 
                  ? 'Opcional - Rastrea todas las categorías' 
                  : `${selectedCategories.length} seleccionada${selectedCategories.length > 1 ? 's' : ''}`}
              </ThemedText>
            </View>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionActive,
                      { 
                        backgroundColor: isSelected ? category.color + '20' : borderColor,
                        borderColor: isSelected ? category.color : 'transparent'
                      }
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <IconSymbol size={20} name={category.icon as any} color={category.color} />
                    <ThemedText 
                      style={[
                        styles.categoryOptionText, 
                        { color: isSelected ? category.color : textSub }
                      ]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </ThemedText>
                    {isSelected && (
                      <View style={[styles.categoryCheck, { backgroundColor: category.color }]}>
                        <IconSymbol size={12} name="checkmark" color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Icon Selector */}
        <View style={[styles.iconSection, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.iconSectionTitle, { color: textMain }]}>
            Selecciona un Ícono
          </ThemedText>
          <View style={styles.iconGrid}>
            {BUDGET_ICONS.map((item) => (
              <TouchableOpacity
                key={item.icon}
                style={[
                  styles.iconOption,
                  selectedIcon.icon === item.icon && styles.iconOptionActive,
                  { 
                    backgroundColor: selectedIcon.icon === item.icon ? item.color + '20' : borderColor,
                    borderColor: selectedIcon.icon === item.icon ? item.color : 'transparent'
                  }
                ]}
                onPress={() => setSelectedIcon(item)}
              >
                <IconSymbol size={28} name={item.icon as any} color={item.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: primary }]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Guardar Cambios</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
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
  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  // Period
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodButtonActive: {
    borderWidth: 0,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Icon Section
  iconSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  iconSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconOptionActive: {
    borderWidth: 2,
  },
  // Category Section
  categorySection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  categorySectionHeader: {
    marginBottom: 16,
  },
  categorySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  categorySectionSubtitle: {
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    position: 'relative',
  },
  categoryOptionActive: {
    borderWidth: 2,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
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
