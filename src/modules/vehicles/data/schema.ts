import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  license_plate: text('license_plate'),
  odometer: real('odometer').notNull(),
  fuel_type: text('fuel_type').notNull(),
  tank_capacity: real('tank_capacity'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const fuelLoads = sqliteTable('fuel_loads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicle_id: integer('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  liters: real('liters').notNull(),
  price_per_liter: real('price_per_liter').notNull(),
  total_cost: real('total_cost').notNull(),
  odometer: real('odometer').notNull(),
  station_name: text('station_name'),
  is_full_tank: integer('is_full_tank').notNull().default(0),
  date: text('date').notNull(),
  account_id: integer('account_id').notNull(),
  notes: text('notes'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const maintenance = sqliteTable('maintenance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicle_id: integer('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  description: text('description').notNull(),
  cost: real('cost').notNull(),
  odometer: real('odometer').notNull(),
  workshop_name: text('workshop_name'),
  date: text('date').notNull(),
  next_date: text('next_date'),
  next_odometer: real('next_odometer'),
  account_id: integer('account_id').notNull(),
  notes: text('notes'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
