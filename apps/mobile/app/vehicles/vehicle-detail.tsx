import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { useCurrency } from '@/contexts/CurrencyContext';

type Vehicle = {
  id: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string | null;
  odometer: number;
  fuel_type: string;
  tank_capacity: number | null;
};

type FuelLoad = {
  id: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer: number;
  station_name: string | null;
  is_full_tank: number;
  date: string;
  notes: string | null;
};

type Maintenance = {
  id: number;
  type: string;
  description: string;
  cost: number;
  odometer: number;
  workshop_name: string | null;
  date: string;
  next_date: string | null;
  next_odometer: number | null;
  notes: string | null;
};

type Account = {
  id: number;
  name: string;
  balance: number;
};

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelLoads, setFuelLoads] = useState<FuelLoad[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'fuel' | 'maintenance'>('fuel');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { formatCurrency } = useCurrency();

  // Estados para modal de gasolina
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelAccount, setFuelAccount] = useState<number | null>(null);
  const [fuelNotes, setFuelNotes] = useState('');

  // Estados para modal de mantenimiento
  const [maintType, setMaintType] = useState('service');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintOdometer, setMaintOdometer] = useState('');
  const [maintWorkshop, setMaintWorkshop] = useState('');
  const [maintAccount, setMaintAccount] = useState<number | null>(null);
  const [maintNotes, setMaintNotes] = useState('');

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const inputBg = useThemeColor({ light: '#f9fafb', dark: '#1f2937' }, 'surface');
  const primary = '#20df60';

  const fetchData = async () => {
    try {
      // Cargar vehículo
      const vehicleData = database.getVehicleById(id as string);

      if (vehicleData.success) {
        setVehicle(vehicleData.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el vehículo');
        return;
      }

      // Cargar cargas de gasolina
      const fuelData = database.getVehicleFuelLoads(id as string);
      if (fuelData.success) {
        setFuelLoads(fuelData.data);
      }

      // Cargar mantenimientos
      const maintData = database.getVehicleMaintenance(id as string);
      if (maintData.success) {
        setMaintenance(maintData.data);
      }

      // Cargar estadísticas
      const statsData = database.getVehicleStats(id as string);
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Cargar cuentas
      const accountsData = database.getAccounts();
      if (accountsData.success) {
        setAccounts(accountsData.data);
        const primaryAcct = accountsData.data.find((a: Account) => (a as any).is_primary === 1);
        if (primaryAcct) {
          setFuelAccount(primaryAcct.id);
          setMaintAccount(primaryAcct.id);
        } else if (accountsData.data.length > 0) {
          setFuelAccount(accountsData.data[0].id);
          setMaintAccount(accountsData.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del vehículo');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const handleAddFuel = async () => {
    if (!fuelLiters || !fuelPrice || !fuelOdometer || !fuelAccount) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }

    const totalCost = parseFloat(fuelLiters) * parseFloat(fuelPrice);

    try {
      const result = database.createFuelLoad(id as string, {
        liters: parseFloat(fuelLiters),
        price_per_liter: parseFloat(fuelPrice),
        total_cost: totalCost,
        odometer: parseFloat(fuelOdometer),
        station_name: fuelStation || null,
        is_full_tank: true,
        account_id: fuelAccount,
        notes: fuelNotes || null,
      });

      if (result.success) {
        setShowFuelModal(false);
        setFuelLiters('');
        setFuelPrice('');
        setFuelOdometer('');
        setFuelStation('');
        setFuelNotes('');
        fetchData();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch {
      Alert.alert('Error', 'No se pudo registrar la carga');
    }
  };

  const handleAddMaintenance = async () => {
    if (!maintDescription || !maintCost || !maintOdometer || !maintAccount) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }

    try {
      const result = database.createMaintenance(id as string, {
        type: maintType,
        description: maintDescription,
        cost: parseFloat(maintCost),
        odometer: parseFloat(maintOdometer),
        workshop_name: maintWorkshop || null,
        account_id: maintAccount,
        notes: maintNotes || null,
      });

      if (result.success) {
        setShowMaintenanceModal(false);
        setMaintDescription('');
        setMaintCost('');
        setMaintOdometer('');
        setMaintWorkshop('');
        setMaintNotes('');
        fetchData();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch {
      Alert.alert('Error', 'No se pudo registrar el mantenimiento');
    }
  };

  if (!vehicle) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Cargando...', headerShown: true }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: vehicle.name, headerShown: true }} />

      <ScrollView style={styles.scrollView}>
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={[styles.vehicleIconBig, { backgroundColor: '#3b82f6' + '20' }]}>
            <IconSymbol name="car" size={36} color="#3b82f6" />
          </View>
          <ThemedText style={[styles.vehicleName, { color: textMain }]}>
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </ThemedText>
          <ThemedText style={[styles.odometer, { color: textMuted }]}>
            {vehicle.odometer.toLocaleString()} km
          </ThemedText>
        </View>

        {/* Stats */}
        {stats && (
          <View style={[styles.statsCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <ThemedText style={[styles.statLabel, { color: textMuted }]}>
                  Rendimiento
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: textMain }]}>
                  {stats.avg_efficiency > 0 ? `${stats.avg_efficiency.toFixed(1)} km/L` : 'N/A'}
                </ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={[styles.statLabel, { color: textMuted }]}>
                  Gasto Total
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: textMain }]}>
                  {formatCurrency(stats.total_cost)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <ThemedText style={[styles.statLabel, { color: textMuted }]}>
                  Gasolina
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>
                  {formatCurrency(stats.total_fuel_cost)}
                </ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={[styles.statLabel, { color: textMuted }]}>
                  Mantenimiento
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: '#f59e0b' }]}>
                  {formatCurrency(stats.total_maintenance_cost)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: surfaceColor, borderColor }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fuel' && { borderBottomColor: primary }]}
            onPress={() => setActiveTab('fuel')}
          >
            <IconSymbol name="drop.fill" size={18} color={activeTab === 'fuel' ? primary : textMuted} />
            <ThemedText style={[styles.tabText, { color: activeTab === 'fuel' ? primary : textMuted }]}>
              Gasolina
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'maintenance' && { borderBottomColor: primary }]}
            onPress={() => setActiveTab('maintenance')}
          >
            <IconSymbol name="wrench" size={18} color={activeTab === 'maintenance' ? primary : textMuted} />
            <ThemedText style={[styles.tabText, { color: activeTab === 'maintenance' ? primary : textMuted }]}>
              Mantenimiento
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'fuel' ? (
            fuelLoads.length > 0 ? (
              fuelLoads.map((load) => (
                <View key={load.id} style={[styles.itemCard, { backgroundColor: surfaceColor, borderColor }]}>
                  <View style={styles.itemHeader}>
                    <View>
                      <ThemedText style={[styles.itemTitle, { color: textMain }]}>
                        {load.liters}L @ {formatCurrency(load.price_per_liter)}/L
                      </ThemedText>
                      <ThemedText style={[styles.itemSubtitle, { color: textMuted }]}>
                        {new Date(load.date).toLocaleDateString('es-MX')} · {load.odometer.toLocaleString()} km
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.itemAmount, { color: '#ef4444' }]}>
                      {formatCurrency(load.total_cost)}
                    </ThemedText>
                  </View>
                  {load.station_name && (
                    <ThemedText style={[styles.itemNotes, { color: textMuted }]}>
                      {load.station_name}
                    </ThemedText>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="drop.fill" size={48} color={textMuted} />
                <ThemedText style={[styles.emptyText, { color: textMuted }]}>
                  No hay cargas registradas
                </ThemedText>
              </View>
            )
          ) : (
            maintenance.length > 0 ? (
              maintenance.map((maint) => (
                <View key={maint.id} style={[styles.itemCard, { backgroundColor: surfaceColor, borderColor }]}>
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.itemTitle, { color: textMain }]}>
                        {maint.description}
                      </ThemedText>
                      <ThemedText style={[styles.itemSubtitle, { color: textMuted }]}>
                        {new Date(maint.date).toLocaleDateString('es-MX')} · {maint.odometer.toLocaleString()} km
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.itemAmount, { color: '#f59e0b' }]}>
                      {formatCurrency(maint.cost)}
                    </ThemedText>
                  </View>
                  {maint.workshop_name && (
                    <ThemedText style={[styles.itemNotes, { color: textMuted }]}>
                      {maint.workshop_name}
                    </ThemedText>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="wrench" size={48} color={textMuted} />
                <ThemedText style={[styles.emptyText, { color: textMuted }]}>
                  No hay mantenimientos registrados
                </ThemedText>
              </View>
            )
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => activeTab === 'fuel' ? setShowFuelModal(true) : setShowMaintenanceModal(true)}
      >
        <IconSymbol name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal Gasolina - Mejorado */}
      <Modal visible={showFuelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>Registrar Carga de Gasolina</ThemedText>
              <TouchableOpacity onPress={() => setShowFuelModal(false)}>
                <IconSymbol name="xmark" size={24} color={textMuted} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Litros */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Litros</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={fuelLiters}
                onChangeText={setFuelLiters}
                placeholder="25.5"
                placeholderTextColor={textMuted}
                keyboardType="decimal-pad"
              />
              
              {/* Precio por litro */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Precio por litro</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={fuelPrice}
                onChangeText={setFuelPrice}
                placeholder="22.50"
                placeholderTextColor={textMuted}
                keyboardType="decimal-pad"
              />
              
              {/* Total calculado */}
              {fuelLiters && fuelPrice && (
                <View style={[styles.totalBox, { backgroundColor: primary + '15', borderColor: primary + '30' }]}>
                  <ThemedText style={[styles.totalLabel, { color: textMuted }]}>Total a pagar</ThemedText>
                  <ThemedText style={[styles.totalValue, { color: primary }]}>
                    {formatCurrency(parseFloat(fuelLiters) * parseFloat(fuelPrice))}
                  </ThemedText>
                </View>
              )}
              
              {/* Kilometraje */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Kilometraje actual</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={fuelOdometer}
                onChangeText={setFuelOdometer}
                placeholder={vehicle?.odometer.toString()}
                placeholderTextColor={textMuted}
                keyboardType="decimal-pad"
              />
              
              {/* Gasolinera */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Gasolinera (opcional)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={fuelStation}
                onChangeText={setFuelStation}
                placeholder="Ej: Pemex, Shell, BP"
                placeholderTextColor={textMuted}
              />
              
              {/* Selector de cuenta */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Cuenta de pago</ThemedText>
              <View style={styles.accountsList}>
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountOption,
                      {
                        backgroundColor: fuelAccount === account.id ? primary + '20' : inputBg,
                        borderColor: fuelAccount === account.id ? primary : borderColor,
                      },
                    ]}
                    onPress={() => setFuelAccount(account.id)}
                  >
                    <View style={styles.accountOptionLeft}>
                      <View style={[
                        styles.accountRadio,
                        {
                          borderColor: fuelAccount === account.id ? primary : borderColor,
                          backgroundColor: fuelAccount === account.id ? primary : 'transparent',
                        },
                      ]}>
                        {fuelAccount === account.id && (
                          <IconSymbol name="checkmark" size={12} color="#ffffff" />
                        )}
                      </View>
                      <View>
                        <ThemedText style={[styles.accountName, { color: textMain }]}>
                          {account.name}
                        </ThemedText>
                        <ThemedText style={[styles.accountBalance, { color: textMuted }]}>
                          {formatCurrency(account.balance)}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Notas */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Notas (opcional)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={fuelNotes}
                onChangeText={setFuelNotes}
                placeholder="Notas adicionales..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={3}
              />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: borderColor }]}
                onPress={() => setShowFuelModal(false)}
              >
                <ThemedText style={[styles.buttonText, { color: textMain }]}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: primary }]}
                onPress={handleAddFuel}
              >
                <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Mantenimiento - Mejorado */}
      <Modal visible={showMaintenanceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>Registrar Mantenimiento</ThemedText>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                <IconSymbol name="xmark" size={24} color={textMuted} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Tipo */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Tipo de mantenimiento</ThemedText>
              <View style={styles.typeGrid}>
                {[
                  { value: 'oil_change', label: 'Aceite', icon: 'drop.fill' },
                  { value: 'tires', label: 'Llantas', icon: 'circle' },
                  { value: 'brakes', label: 'Frenos', icon: 'exclamationmark.triangle' },
                  { value: 'service', label: 'Servicio', icon: 'wrench' },
                  { value: 'repair', label: 'Reparación', icon: 'hammer' },
                  { value: 'other', label: 'Otro', icon: 'ellipsis' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: maintType === t.value ? '#f59e0b' + '20' : inputBg,
                        borderColor: maintType === t.value ? '#f59e0b' : borderColor,
                      },
                    ]}
                    onPress={() => setMaintType(t.value)}
                  >
                    <IconSymbol
                      name={t.icon as any}
                      size={16}
                      color={maintType === t.value ? '#f59e0b' : textMuted}
                    />
                    <ThemedText
                      style={[
                        styles.typeChipText,
                        { color: maintType === t.value ? '#f59e0b' : textMuted },
                      ]}
                    >
                      {t.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Descripción */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Descripción</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={maintDescription}
                onChangeText={setMaintDescription}
                placeholder="Ej: Cambio de aceite y filtro"
                placeholderTextColor={textMuted}
              />
              
              {/* Costo */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Costo</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={maintCost}
                onChangeText={setMaintCost}
                placeholder="0.00"
                placeholderTextColor={textMuted}
                keyboardType="decimal-pad"
              />
              
              {/* Kilometraje */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Kilometraje actual</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={maintOdometer}
                onChangeText={setMaintOdometer}
                placeholder={vehicle?.odometer.toString()}
                placeholderTextColor={textMuted}
                keyboardType="decimal-pad"
              />
              
              {/* Taller */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Taller/Mecánico (opcional)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={maintWorkshop}
                onChangeText={setMaintWorkshop}
                placeholder="Nombre del taller"
                placeholderTextColor={textMuted}
              />
              
              {/* Selector de cuenta */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Cuenta de pago</ThemedText>
              <View style={styles.accountsList}>
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountOption,
                      {
                        backgroundColor: maintAccount === account.id ? primary + '20' : inputBg,
                        borderColor: maintAccount === account.id ? primary : borderColor,
                      },
                    ]}
                    onPress={() => setMaintAccount(account.id)}
                  >
                    <View style={styles.accountOptionLeft}>
                      <View style={[
                        styles.accountRadio,
                        {
                          borderColor: maintAccount === account.id ? primary : borderColor,
                          backgroundColor: maintAccount === account.id ? primary : 'transparent',
                        },
                      ]}>
                        {maintAccount === account.id && (
                          <IconSymbol name="checkmark" size={12} color="#ffffff" />
                        )}
                      </View>
                      <View>
                        <ThemedText style={[styles.accountName, { color: textMain }]}>
                          {account.name}
                        </ThemedText>
                        <ThemedText style={[styles.accountBalance, { color: textMuted }]}>
                          {formatCurrency(account.balance)}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Notas */}
              <ThemedText style={[styles.modalLabel, { color: textMain }]}>Notas (opcional)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textMain }]}
                value={maintNotes}
                onChangeText={setMaintNotes}
                placeholder="Notas adicionales..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={3}
              />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: borderColor }]}
                onPress={() => setShowMaintenanceModal(false)}
              >
                <ThemedText style={[styles.buttonText, { color: textMain }]}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: primary }]}
                onPress={handleAddMaintenance}
              >
                <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  headerCard: { margin: 16, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  vehicleIconBig: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  vehicleName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  odometer: { fontSize: 16 },
  statsCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16 },
  itemCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemSubtitle: { fontSize: 13 },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  itemNotes: { fontSize: 12, marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalScroll: { maxHeight: 500 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  totalBox: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 20, fontWeight: '700' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeChipText: { fontSize: 13, fontWeight: '600' },
  accountsList: { marginBottom: 16 },
  accountOption: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  accountOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountBalance: { fontSize: 13, marginTop: 2 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: {},
  saveButton: {},
  buttonText: { fontSize: 16, fontWeight: '600' },
});
