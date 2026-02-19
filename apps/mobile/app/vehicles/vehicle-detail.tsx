import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
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
      console.log('Fetching vehicle data for id:', id);
      
      // Cargar vehículo
      const vehicleRes = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}`);
      const vehicleData = await vehicleRes.json();
      console.log('Vehicle data:', vehicleData);
      
      if (vehicleData.success) {
        setVehicle(vehicleData.data);
      } else {
        console.error('Error loading vehicle:', vehicleData.error);
        Alert.alert('Error', 'No se pudo cargar el vehículo');
        return;
      }

      // Cargar cargas de gasolina
      const fuelRes = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}/fuel-loads`);
      const fuelData = await fuelRes.json();
      console.log('Fuel loads:', fuelData);
      if (fuelData.success) {
        setFuelLoads(fuelData.data);
      }

      // Cargar mantenimientos
      const maintRes = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}/maintenance`);
      const maintData = await maintRes.json();
      console.log('Maintenance:', maintData);
      if (maintData.success) {
        setMaintenance(maintData.data);
      }

      // Cargar estadísticas
      const statsRes = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}/stats`);
      const statsData = await statsRes.json();
      console.log('Stats:', statsData);
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Cargar cuentas
      const accountsRes = await fetch(`${API_CONFIG.BASE_URL}/accounts`);
      const accountsData = await accountsRes.json();
      console.log('Accounts:', accountsData);
      if (accountsData.success) {
        setAccounts(accountsData.data);
        const primary = accountsData.data.find((a: Account) => (a as any).is_primary === 1);
        if (primary) {
          setFuelAccount(primary.id);
          setMaintAccount(primary.id);
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}/fuel-loads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liters: parseFloat(fuelLiters),
          price_per_liter: parseFloat(fuelPrice),
          total_cost: totalCost,
          odometer: parseFloat(fuelOdometer),
          station_name: fuelStation || null,
          is_full_tank: true,
          account_id: fuelAccount,
          notes: fuelNotes || null,
        }),
      });

      const result = await response.json();
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: maintType,
          description: maintDescription,
          cost: parseFloat(maintCost),
          odometer: parseFloat(maintOdometer),
          workshop_name: maintWorkshop || null,
          account_id: maintAccount,
          notes: maintNotes || null,
        }),
      });

      const result = await response.json();
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

      {/* Modal Gasolina - Simplificado */}
      <Modal visible={showFuelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <ThemedText style={[styles.modalTitle, { color: textMain }]}>Registrar Carga</ThemedText>
            
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={fuelLiters}
              onChangeText={setFuelLiters}
              placeholder="Litros"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={fuelPrice}
              onChangeText={setFuelPrice}
              placeholder="Precio por litro"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={fuelOdometer}
              onChangeText={setFuelOdometer}
              placeholder="Kilometraje"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: borderColor }]}
                onPress={() => setShowFuelModal(false)}
              >
                <ThemedText style={{ color: textMain }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primary }]}
                onPress={handleAddFuel}
              >
                <ThemedText style={{ color: '#ffffff' }}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Mantenimiento - Simplificado */}
      <Modal visible={showMaintenanceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <ThemedText style={[styles.modalTitle, { color: textMain }]}>Registrar Mantenimiento</ThemedText>
            
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={maintDescription}
              onChangeText={setMaintDescription}
              placeholder="Descripción"
              placeholderTextColor={textMuted}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={maintCost}
              onChangeText={setMaintCost}
              placeholder="Costo"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textMain }]}
              value={maintOdometer}
              onChangeText={setMaintOdometer}
              placeholder="Kilometraje"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: borderColor }]}
                onPress={() => setShowMaintenanceModal(false)}
              >
                <ThemedText style={{ color: textMain }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primary }]}
                onPress={handleAddMaintenance}
              >
                <ThemedText style={{ color: '#ffffff' }}>Guardar</ThemedText>
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
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 400 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});
