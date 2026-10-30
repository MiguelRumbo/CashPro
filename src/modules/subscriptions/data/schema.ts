import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const recurringPayments = sqliteTable('recurring_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  frequency: text('frequency').notNull(),
  day_of_month: integer('day_of_month'),
  day_of_week: integer('day_of_week'),
  specific_dates: text('specific_dates'),
  category_id: text('category_id'),
  account_id: integer('account_id').notNull(),
  icon: text('icon').notNull().default('creditcard'),
  color: text('color').notNull().default('#6b7280'),
  is_active: integer('is_active').notNull().default(1),
  next_date: text('next_date'),
  auto_register: integer('auto_register').notNull().default(0),
  notify_before_days: integer('notify_before_days').notNull().default(1),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});
