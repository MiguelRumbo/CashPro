import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const savingsGoals = sqliteTable('savings_goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  target_amount: real('target_amount').notNull(),
  current_amount: real('current_amount').notNull().default(0),
  deadline: text('deadline'),
  icon: text('icon').notNull().default('target'),
  color: text('color').notNull().default('#20df60'),
  account_id: integer('account_id'),
  auto_deduct: integer('auto_deduct').notNull().default(0),
  auto_deduct_amount: real('auto_deduct_amount').notNull().default(0),
  auto_deduct_period: text('auto_deduct_period'),
  status: text('status').notNull().default('active'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const goalContributions = sqliteTable('goal_contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  goal_id: integer('goal_id')
    .notNull()
    .references(() => savingsGoals.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});
