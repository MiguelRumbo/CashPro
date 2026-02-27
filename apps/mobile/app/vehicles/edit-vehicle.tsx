import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';

const FUEL_TYPES = [
  { value: 'gasoline', label: 'Gasolina', icon: 'drop.fill', color: '#ef4444' },
  { value: 'diesel', label: 'Diésel', icon: 'drop.fill', color: '#f59e0b' },
  { value: 'electric', label: 'Eléctrico', icon: 'bolt.fill', color: '#10b981' },
  { value: 'hybrid', label: 'Híbrido', icon: 'leaf.fill', color: '#3b82f6' },
];

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelType, setFuelType] = useState('gasoline');
  const [tankCapacity, setTankCapacity] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1f2937' }, 'surface');
  const primary = '#20df60';

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const result = database.getVehicleById(id as string);
        if (result.success && result.data) {
          const vehicle = result.data;
          setName(vehicle.name);
          setBrand(vehicle.brand);
          setModel(vehicle.model);
          setYear(vehicle.year.toString());
          setLicensePlate(vehicle.license_plate || '');
          setOdometer(vehicle.odometer.toString());
          setFuelType(vehicle.fuel_type);
          setTankCapacity(vehicle.tank_capacity?.toString() || '');
        } else {
          Alert.alert('Error', 'No se pudo cargar el vehículo');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el vehículo');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el vehículo');
      return;
    }
    if (!brand.trim()) {
      Alert.alert('Error', 'Ingresa la marca');
      return;
    }
    if (!model.trim()) {
      Alert.alert('Error', 'Ingresa el modelo');
      return;
    }
    if (!year || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Ingresa un año válido');
      return;
    }
    if (!odometer || parseFloat(odometer) < 0) {
      Alert.alert('Error', 'Ingresa el kilometraje actual');
      return;
    }

    setSaving(true);

    try {
      const updates: any = {
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year),
        odometer: parseFloat(odometer),
        fuel_type: fuelType,
      };

      if (licensePlate.trim()) {
        updates.license_plate = licensePlate.trim().toUpperCase();
      } else {
        updates.license_plate = null;
      }

      if (tankCapacity && parseFloat(tankCapacity) > 0) {
        updates.tank_capacity = parseFloat(tankCapacity);
      } else {
        updates.tank_capacity = null;
      }

      const result = database.updateVehicle(parseInt(id as string), updates);

      if (result.success) {
        router.back();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el vehículo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Cargando...', headerShown: true }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Editar Vehículo',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Nombre */}
        <ThemedText style={[styles.label, { color: textMain }]}>Nombre</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Mi Carro, Civic 2020"
          placeholderTextColor={textMuted}
        />

        {/* Marca */}
        <ThemedText style={[styles.label, { color: textMain }]}>Marca</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={brand}
          onChangeText={setBrand}
          placeholder="Ej: Honda, Toyota, Ford"
          placeholderTextColor={textMuted}
        />

        {/* Modelo */}
        <ThemedText style={[styles.label, { color: textMain }]}>Modelo</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={model}
          onChangeText={setModel}
          placeholder="Ej: Civic, Corolla, Focus"
          placeholderTextColor={textMuted}
        />

        {/* Año */}
        <ThemedText style={[styles.label, { color: textMain }]}>Año</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={year}
          onChangeText={setYear}
          placeholder="2020"
          placeholderTextColor={textMuted}
          keyboardType="number-pad"
          maxLength={4}
        />

        {/* Placas */}
        <ThemedText style={[styles.label, { color: textMain }]}>Placas (opcional)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder="ABC-123-D"
          placeholderTextColor={textMuted}
          autoCapitalize="characters"
        />

        {/* Kilometraje */}
        <ThemedText style={[styles.label, { color: textMain }]}>Kilometraje Actual</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={odometer}
          onChangeText={setOdometer}
          placeholder="50000"
          placeholderTextColor={textMuted}
          keyboardType="decimal-pad"
        />

        {/* Tipo de Combustible */}
        <ThemedText style={[styles.label, { color: textMain }]}>Tipo de Combustible</ThemedText>
        <View style={styles.fuelTypeGrid}>
          {FUEL_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.fuelTypeChip,
                {
                  backgroundColor: fuelType === type.value ? type.color + '20' : surfaceColor,
                  borderColor: fuelType === type.value ? type.color : borderColor,
                },
              ]}
              onPress={() => setFuelType(type.value)}
            >
              <IconSymbol
                name={type.icon as any}
                size={20}
                color={fuelType === type.value ? type.color : textMuted}
              />
              <ThemedText
                style={[
                  styles.fuelTypeText,
                  { color: fuelType === type.value ? type.color : textMuted },
                ]}
              >
                {type.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Capacidad del Tanque */}
        <ThemedText style={[styles.label, { color: textMain }]}>
          Capacidad del Tanque (litros, opcional)
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
          value={tankCapacity}
          onChangeText={setTankCapacity}
          placeholder="50"
          placeholderTextColor={textMuted}
          keyboardType="decimal-pad"
        />

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <ThemedText style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
  fuelTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fuelTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  fuelTypeText: {
    fontSize: 14,
    fontWeight: '500',
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
