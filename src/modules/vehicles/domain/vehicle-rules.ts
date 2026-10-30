import type { MaintenanceRecord, VehicleStats } from '@/core/contracts/finance';
import { startOfMonth } from '@/core/units/dates';

export interface FuelLoadLike {
  liters: number;
  odometer: number;
  total_cost: number;
  date: string;
}

/** Convierte entradas de formulario (texto o número) como lo hacía v1 con parseFloat. */
export const toNumber = (value: string | number): number => (typeof value === 'number' ? value : parseFloat(value));
export const toInt = (value: string | number): number => (typeof value === 'number' ? Math.trunc(value) : parseInt(value, 10));

/** Notas del movimiento de gasolina. `withCurrencySign` replica la diferencia v1 entre alta y edición. */
export function fuelNotes(
  load: { liters: string | number; price_per_liter: string | number; station_name?: string | null; notes?: string | null },
  withCurrencySign: boolean,
): string {
  const price = `${withCurrencySign ? '$' : ''}${load.price_per_liter}`;
  return `${load.liters}L @ ${price}/L${load.station_name ? ` - ${load.station_name}` : ''}${load.notes ? ` - ${load.notes}` : ''}`;
}

export function maintenanceNotes(m: { description: string; workshop_name?: string | null; notes?: string | null }): string {
  return `${m.description}${m.workshop_name ? ` - ${m.workshop_name}` : ''}${m.notes ? ` - ${m.notes}` : ''}`;
}

/** Rendimiento promedio km/L entre cargas consecutivas (cargas ordenadas por fecha ascendente). */
export function averageEfficiency(loadsAsc: readonly FuelLoadLike[]): number {
  const efficiencies: number[] = [];
  for (let i = 1; i < loadsAsc.length; i++) {
    const prev = loadsAsc[i - 1];
    const curr = loadsAsc[i];
    if (!prev || !curr) continue;
    const km = curr.odometer - prev.odometer;
    if (km > 0 && prev.liters > 0) efficiencies.push(km / prev.liters);
  }
  return efficiencies.length > 0 ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length : 0;
}

export function computeVehicleStats(
  loadsAsc: readonly FuelLoadLike[],
  maintenance: readonly MaintenanceRecord[],
  today: Date,
): VehicleStats {
  const monthStart = startOfMonth(today);
  const totalFuel = loadsAsc.reduce((s, l) => s + l.total_cost, 0);
  const totalMaint = maintenance.reduce((s, m) => s + m.cost, 0);
  const monthFuel = loadsAsc.filter((l) => new Date(l.date) >= monthStart).reduce((s, l) => s + l.total_cost, 0);
  const monthMaint = maintenance.filter((m) => new Date(m.date) >= monthStart).reduce((s, m) => s + m.cost, 0);
  const byDateDesc = [...maintenance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const upcoming = maintenance
    .filter((m) => m.next_date || m.next_odometer)
    .sort((a, b) => {
      if (a.next_date && b.next_date) return new Date(a.next_date).getTime() - new Date(b.next_date).getTime();
      if (a.next_odometer && b.next_odometer) return a.next_odometer - b.next_odometer;
      return 0;
    });
  return {
    avg_efficiency: averageEfficiency(loadsAsc),
    total_fuel_cost: totalFuel,
    total_maintenance_cost: totalMaint,
    total_cost: totalFuel + totalMaint,
    month_fuel_cost: monthFuel,
    month_maintenance_cost: monthMaint,
    month_total_cost: monthFuel + monthMaint,
    fuel_loads_count: loadsAsc.length,
    maintenance_count: maintenance.length,
    last_maintenance: byDateDesc[0] ?? null,
    upcoming_maintenance: upcoming[0] ?? null,
  };
}
