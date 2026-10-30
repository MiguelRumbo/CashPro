import { asc, desc, eq } from 'drizzle-orm';

import type { MaintenanceRecord, VehicleRecord } from '@/core/contracts/finance';
import type { DbHandle } from '@/core/db/handle';

import { fuelLoads, maintenance, vehicles } from './schema';

export type FuelLoad = typeof fuelLoads.$inferSelect;
export type NewVehicleRow = typeof vehicles.$inferInsert;

export function createVehiclesRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): VehicleRecord[] {
      return orm.select().from(vehicles).all();
    },
    getById(id: number): VehicleRecord | undefined {
      return orm.select().from(vehicles).where(eq(vehicles.id, id)).get();
    },
    insert(row: NewVehicleRow): VehicleRecord {
      return orm.insert(vehicles).values(row).returning().get();
    },
    update(id: number, fields: Partial<Omit<NewVehicleRow, 'id' | 'created_at'>>): VehicleRecord | undefined {
      orm.update(vehicles).set(fields).where(eq(vehicles.id, id)).run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(fuelLoads).where(eq(fuelLoads.vehicle_id, id)).run();
      orm.delete(maintenance).where(eq(maintenance.vehicle_id, id)).run();
      orm.delete(vehicles).where(eq(vehicles.id, id)).run();
    },
    fuelLoads(vehicleId: number, order: 'asc' | 'desc'): FuelLoad[] {
      return orm
        .select()
        .from(fuelLoads)
        .where(eq(fuelLoads.vehicle_id, vehicleId))
        .orderBy(order === 'asc' ? asc(fuelLoads.date) : desc(fuelLoads.date))
        .all();
    },
    getFuelLoad(id: number): FuelLoad | undefined {
      return orm.select().from(fuelLoads).where(eq(fuelLoads.id, id)).get();
    },
    insertFuelLoad(row: typeof fuelLoads.$inferInsert): FuelLoad {
      return orm.insert(fuelLoads).values(row).returning().get();
    },
    updateFuelLoad(id: number, fields: Partial<typeof fuelLoads.$inferInsert>): FuelLoad | undefined {
      orm.update(fuelLoads).set(fields).where(eq(fuelLoads.id, id)).run();
      return this.getFuelLoad(id);
    },
    deleteFuelLoad(id: number): void {
      orm.delete(fuelLoads).where(eq(fuelLoads.id, id)).run();
    },
    maintenance(vehicleId: number): MaintenanceRecord[] {
      return orm
        .select()
        .from(maintenance)
        .where(eq(maintenance.vehicle_id, vehicleId))
        .orderBy(desc(maintenance.date))
        .all();
    },
    insertMaintenance(row: typeof maintenance.$inferInsert): MaintenanceRecord {
      return orm.insert(maintenance).values(row).returning().get();
    },
  };
}

export type VehiclesRepository = ReturnType<typeof createVehiclesRepository>;
