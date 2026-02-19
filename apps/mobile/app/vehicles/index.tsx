import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BottomNavBar } from '@/components/bottom-nav-bar';

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
  created_at: string;
};

type VehicleStats = {
  avg_efficiency: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_cost: number;
  month_fuel_cost: number;
  month_maintenance_cost: number;
  month_total_cost: number;
  fuel_loads_count: number;
  maintenance_count: number;
  last_maintenance: any;
  upcoming_maintenance: any;
};

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<{ [key: number]: VehicleStats }>({});
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vehicles`);
      const result = await response.json();

      if (result.success) {
        setVehicles(result.data);
        
        // Cargar estadísticas para cada vehículo
        result.data.forEach(async (vehicle: Vehicle) => {
          const statsResponse = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${vehicle.id}/stats`);
          const statsResult = await statsResponse.json();
          if (statsResult.success) {
            setStats(prev => ({ ...prev, [vehicle.id]: statsResult.data }));
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [])
  );

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Eliminar Vehículo',
      `¿Eliminar "${name}"? Se eliminarán también todas las cargas de gasolina y mantenimientos asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/vehicles/${id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              if (result.success) fetchVehicles();
              else Alert.alert('Error', result.error);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const getFuelTypeLabel = (type: string) => {
    switch (type) {
      case 'gasoline': return 'Gasolina';
      case 'diesel': return 'Diésel';
      case 'electric': return 'Eléctrico';
      case 'hybrid': return 'Híbrido';
      default: return type;
    }
  };

  const getFuelTypeIcon = (type: string) => {
    switch (type) {
      case 'gasoline': return 'drop.fill';
      case 'diesel': return 'drop.fill';
      case 'electric': return 'bolt.fill';
      case 'hybrid': return 'leaf.fill';
      default: return 'car';
    }
  };

  const renderVehicleCard = (vehicle: Vehicle) => {
    const vehicleStats = stats[vehicle.id];

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[styles.vehicleCard, { backgroundColor: surfaceColor, borderColor }]}
        onPress={() => router.push(`/vehicles/vehicle-detail?id=${vehicle.id}`)}
        onLongPress={() => handleDelete(vehicle.id, vehicle.name)}
      >
        <View style={styles.vehicleHeader}>
          <View style={[styles.vehicleIcon, { backgroundColor: '#3b82f6' + '20' }]}>
            <IconSymbol name="car" size={28} color="#3b82f6" />
          </View>
          <View style={styles.vehicleInfo}>
            <ThemedText style={[styles.vehicleName, { color: textMain }]}>
              {vehicle.name}
            </ThemedText>
            <ThemedText style={[styles.vehicleModel, { color: textMuted }]}>
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </ThemedText>
            {vehicle.license_plate && (
              <View style={[styles.licensePlate, { backgroundColor: '#f59e0b' + '20' }]}>
                <ThemedText style={[styles.licensePlateText, { color: '#f59e0b' }]}>
                  {vehicle.license_plate}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.vehicleStats}>
          <View style={styles.statItem}>
            <IconSymbol name="speedometer" size={16} color={textMuted} />
            <ThemedText style={[styles.statValue, { color: textMain }]}>
              {vehicle.odometer.toLocaleString()} km
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name={getFuelTypeIcon(vehicle.fuel_type)} size={16} color={textMuted} />
            <ThemedText style={[styles.statValue, { color: textMain }]}>
              {getFuelTypeLabel(vehicle.fuel_type)}
            </ThemedText>
          </View>
          {vehicleStats && vehicleStats.avg_efficiency > 0 && (
            <View style={styles.statItem}>
              <IconSymbol name="gauge" size={16} color={textMuted} />
              <ThemedText style={[styles.statValue, { color: textMain }]}>
                {vehicleStats.avg_efficiency.toFixed(1)} km/L
              </ThemedText>
            </View>
          )}
        </View>

        {vehicleStats && (
          <View style={[styles.monthCost, { backgroundColor: '#ef4444' + '10', borderColor: '#ef4444' + '30' }]}>
            <ThemedText style={[styles.monthCostLabel, { color: textMuted }]}>
              Gasto este mes
            </ThemedText>
            <ThemedText style={[styles.monthCostValue, { color: '#ef4444' }]}>
              {formatCurrency(vehicleStats.month_total_cost)}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Vehículos',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {vehicles.length > 0 ? (
          <View style={styles.vehiclesList}>
            {vehicles.map(renderVehicleCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="car" size={64} color={textMuted} />
            <ThemedText style={[styles.emptyText, { color: textMuted }]}>
              No hay vehículos registrados
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Toca + para agregar tu primer vehículo
            </ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => router.push('/vehicles/add-vehicle')}
      >
        <IconSymbol name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>

      <BottomNavBar />
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
  vehiclesList: {
    padding: 16,
  },
  vehicleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 14,
    marginBottom: 6,
  },
  licensePlate: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  licensePlateText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  vehicleStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  monthCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  monthCostLabel: {
    fontSize: 13,
  },
  monthCostValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
