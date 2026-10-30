import type {
  AccountsQuery,
  MaintenanceRecord,
  MovementsLedger,
  VehicleRecord,
  VehicleStats,
} from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';

import type { FuelLoad, VehiclesRepository } from '../data/vehicles-repository';
import { computeVehicleStats, fuelNotes, maintenanceNotes, toInt, toNumber } from '../domain/vehicle-rules';
import { vehiclesTexts } from '../texts';

type NumericInput = string | number;

export interface VehicleInput {
  name?: string;
  brand?: string;
  model?: string;
  year?: NumericInput;
  license_plate?: string | null;
  odometer?: NumericInput;
  fuel_type?: string;
  tank_capacity?: NumericInput | null;
}

export interface FuelLoadInput {
  liters?: NumericInput;
  price_per_liter?: NumericInput;
  total_cost?: NumericInput;
  odometer?: NumericInput;
  station_name?: string | null;
  is_full_tank?: boolean | number;
  date?: string;
  account_id?: NumericInput;
  notes?: string | null;
}

export interface MaintenanceInput {
  type?: string;
  description?: string;
  cost?: NumericInput;
  odometer?: NumericInput;
  workshop_name?: string | null;
  date?: string;
  next_date?: string | null;
  next_odometer?: NumericInput | null;
  account_id?: NumericInput;
  notes?: string | null;
}

export function createVehiclesService(deps: {
  db: DbHandle;
  repo: VehiclesRepository;
  accounts: () => AccountsQuery | undefined;
  ledger: () => MovementsLedger | undefined;
  now?: () => Date;
}) {
  const { db, repo, accounts, ledger } = deps;
  const now = deps.now ?? (() => new Date());
  const { errors, messages, fuelMovement, maintenanceMovement } = vehiclesTexts;

  const stats = (vehicleId: number): VehicleStats | undefined => {
    if (!repo.getById(vehicleId)) return undefined;
    return computeVehicleStats(repo.fuelLoads(vehicleId, 'asc'), repo.maintenance(vehicleId), now());
  };

  /** Dependencias necesarias para registrar un gasto del vehículo. */
  const expenseDeps = (accountId: number) => {
    const accountsQuery = accounts();
    const movementsLedger = ledger();
    if (!accountsQuery || !movementsLedger) return fail<MovementsLedger>(errors.ledgerUnavailable);
    if (!accountsQuery.getById(accountId)) return fail<MovementsLedger>(errors.accountNotFound);
    return ok(movementsLedger);
  };

  return {
    list: (): VehicleRecord[] => repo.list(),
    stats,

    getVehicles(): Result<VehicleRecord[]> {
      try {
        return ok(repo.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getVehicleById(id: number): Result<VehicleRecord> {
      const vehicle = repo.getById(id);
      return vehicle ? ok(vehicle) : fail(errors.notFound);
    },

    getVehicleStats(id: number): Result<VehicleStats> {
      const result = stats(id);
      return result ? ok(result) : fail(errors.notFound);
    },

    createVehicle(input: VehicleInput): Result<VehicleRecord> {
      const { name, brand, model, year, odometer, fuel_type } = input;
      if (!name || !brand || !model || !year || !odometer || !fuel_type) return fail(errors.missingFields);
      try {
        return ok(
          repo.insert({
            name,
            brand,
            model,
            year: toInt(year),
            license_plate: input.license_plate ?? null,
            odometer: toNumber(odometer),
            fuel_type,
            tank_capacity: input.tank_capacity ? toNumber(input.tank_capacity) : null,
            created_at: nowIso(),
          }),
        );
      } catch (error) {
        return failFromError(error);
      }
    },

    updateVehicle(id: number, input: VehicleInput): Result<VehicleRecord> {
      const vehicle = repo.getById(id);
      if (!vehicle) return fail(errors.notFound);
      try {
        const updated = repo.update(id, {
          name: input.name || vehicle.name,
          brand: input.brand || vehicle.brand,
          model: input.model || vehicle.model,
          year: input.year ? toInt(input.year) : vehicle.year,
          license_plate: input.license_plate !== undefined ? input.license_plate : vehicle.license_plate,
          odometer: input.odometer ? toNumber(input.odometer) : vehicle.odometer,
          fuel_type: input.fuel_type || vehicle.fuel_type,
          tank_capacity:
            input.tank_capacity !== undefined
              ? input.tank_capacity
                ? toNumber(input.tank_capacity)
                : null
              : vehicle.tank_capacity,
        });
        return updated ? ok(updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteVehicle(id: number): Result<null> {
      if (!repo.getById(id)) return fail(errors.notFound);
      try {
        db.transaction(() => repo.delete(id));
        return ok(null, messages.deleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    getVehicleFuelLoads(vehicleId: number): Result<FuelLoad[]> {
      try {
        return ok(repo.fuelLoads(vehicleId, 'desc'));
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Una carga actualiza el odómetro y registra un gasto de Transporte. */
    createFuelLoad(vehicleId: number, input: FuelLoadInput): Result<FuelLoad> {
      const { liters, price_per_liter, total_cost, odometer, account_id } = input;
      if (!liters || !price_per_liter || !total_cost || !odometer || !account_id)
        return fail(errors.missingFields);
      const vehicle = repo.getById(vehicleId);
      if (!vehicle) return fail(errors.notFound);
      const accountId = toInt(account_id);
      const deps = expenseDeps(accountId);
      if (!deps.success) return deps;
      try {
        const created = db.transaction(() => {
          const ts = nowIso();
          const date = input.date || ts;
          const row = repo.insertFuelLoad({
            vehicle_id: vehicleId,
            liters: toNumber(liters),
            price_per_liter: toNumber(price_per_liter),
            total_cost: toNumber(total_cost),
            odometer: toNumber(odometer),
            station_name: input.station_name ?? null,
            is_full_tank: input.is_full_tank ? 1 : 0,
            date,
            account_id: accountId,
            notes: input.notes ?? null,
            created_at: ts,
          });
          repo.update(vehicleId, { odometer: toNumber(odometer) });
          deps.data.record(
            {
              type: 'expense',
              amount: toNumber(total_cost),
              title: fuelMovement.title(vehicle.name),
              category_name: fuelMovement.categoryName,
              category_icon: fuelMovement.categoryIcon,
              category_color: fuelMovement.categoryColor,
              account_id: accountId,
              date,
              notes: fuelNotes(
                { liters, price_per_liter, station_name: input.station_name, notes: input.notes },
                true,
              ),
            },
            { origin: 'vehicles', affectsBalance: true },
          );
          return row;
        });
        return ok(created);
      } catch (error) {
        return failFromError(error);
      }
    },

    /**
     * Edita una carga y su movimiento asociado. El movimiento se localiza con la heurística
     * de v1 (categoría + fecha + monto); si no aparece, solo se edita la carga.
     */
    updateFuelLoad(id: number, input: FuelLoadInput): Result<FuelLoad> {
      const { liters, price_per_liter, total_cost, odometer, account_id } = input;
      if (!liters || !price_per_liter || !total_cost || !odometer || !account_id)
        return fail(errors.missingFields);
      const load = repo.getFuelLoad(id);
      if (!load) return fail(errors.fuelLoadNotFound);
      const vehicle = repo.getById(load.vehicle_id);
      if (!vehicle) return fail(errors.notFound);
      try {
        const updated = db.transaction(() => {
          const date = input.date || load.date;
          const accountId = toInt(account_id);
          const row = repo.updateFuelLoad(id, {
            liters: toNumber(liters),
            price_per_liter: toNumber(price_per_liter),
            total_cost: toNumber(total_cost),
            odometer: toNumber(odometer),
            station_name: input.station_name ?? null,
            is_full_tank: input.is_full_tank ? 1 : 0,
            account_id: accountId,
            date,
            notes: input.notes ?? null,
          });
          repo.update(load.vehicle_id, { odometer: toNumber(odometer) });
          const movementsLedger = ledger();
          const movement = movementsLedger?.findLatest({
            category_name: fuelMovement.categoryName,
            category_icon: fuelMovement.categoryIcon,
            date: load.date,
            amount: load.total_cost,
          });
          if (movementsLedger && movement) {
            movementsLedger.update(movement.id, {
              amount: toNumber(total_cost),
              title: fuelMovement.title(vehicle.name),
              account_id: accountId,
              date,
              notes: fuelNotes(
                { liters, price_per_liter, station_name: input.station_name, notes: input.notes },
                false,
              ),
            });
          }
          return row;
        });
        return updated ? ok(updated) : fail(errors.fuelLoadNotFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteFuelLoad(id: number): Result<null> {
      const load = repo.getFuelLoad(id);
      if (!load) return fail(errors.fuelLoadNotFound);
      try {
        db.transaction(() => {
          const movementsLedger = ledger();
          const movement = movementsLedger?.findLatest({
            category_name: fuelMovement.categoryName,
            category_icon: fuelMovement.categoryIcon,
            date: load.date,
            amount: load.total_cost,
          });
          if (movementsLedger && movement) movementsLedger.remove(movement.id);
          repo.deleteFuelLoad(id);
        });
        return ok(null);
      } catch (error) {
        return failFromError(error);
      }
    },

    getVehicleMaintenance(vehicleId: number): Result<MaintenanceRecord[]> {
      try {
        return ok(repo.maintenance(vehicleId));
      } catch (error) {
        return failFromError(error);
      }
    },

    createMaintenance(vehicleId: number, input: MaintenanceInput): Result<MaintenanceRecord> {
      const { type, description, cost, odometer, account_id } = input;
      if (!type || !description || !cost || !odometer || !account_id) return fail(errors.missingFields);
      const vehicle = repo.getById(vehicleId);
      if (!vehicle) return fail(errors.notFound);
      const accountId = toInt(account_id);
      const deps = expenseDeps(accountId);
      if (!deps.success) return deps;
      try {
        const created = db.transaction(() => {
          const ts = nowIso();
          const date = input.date || ts;
          const row = repo.insertMaintenance({
            vehicle_id: vehicleId,
            type,
            description,
            cost: toNumber(cost),
            odometer: toNumber(odometer),
            workshop_name: input.workshop_name ?? null,
            date,
            next_date: input.next_date ?? null,
            next_odometer: input.next_odometer ? toNumber(input.next_odometer) : null,
            account_id: accountId,
            notes: input.notes ?? null,
            created_at: ts,
          });
          repo.update(vehicleId, { odometer: toNumber(odometer) });
          const label = maintenanceMovement.typeLabels[type] ?? maintenanceMovement.fallbackLabel;
          deps.data.record(
            {
              type: 'expense',
              amount: toNumber(cost),
              title: `${label} - ${vehicle.name}`,
              category_name: maintenanceMovement.categoryName,
              category_icon: maintenanceMovement.categoryIcon,
              category_color: maintenanceMovement.categoryColor,
              account_id: accountId,
              date,
              notes: maintenanceNotes({
                description,
                workshop_name: input.workshop_name,
                notes: input.notes,
              }),
            },
            { origin: 'vehicles', affectsBalance: true },
          );
          return row;
        });
        return ok(created);
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type VehiclesService = ReturnType<typeof createVehiclesService>;
