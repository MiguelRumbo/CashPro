import { sql } from 'drizzle-orm';
import { check, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Réplica del esquema v1 (CREATE TABLE IF NOT EXISTS en la migración base).
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: ['cash', 'bank', 'debit', 'credit'] }).notNull(),
    balance: real('balance').notNull().default(0),
    currency: text('currency').notNull().default('MXN'),
    icon: text('icon'),
    color: text('color'),
    clabe: text('clabe'),
    bank_name: text('bank_name'),
    card_last_four: text('card_last_four'),
    generates_interest: integer('generates_interest').notNull().default(0),
    interest_rate: real('interest_rate').notNull().default(0),
    credit_limit: real('credit_limit').notNull().default(0),
    current_balance: real('current_balance').notNull().default(0),
    cut_off_day: integer('cut_off_day'),
    payment_due_day: integer('payment_due_day'),
    is_primary: integer('is_primary').notNull().default(0),
    include_in_balance: integer('include_in_balance').notNull().default(1),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [check('accounts_type_check', sql`${t.type} IN ('cash', 'bank', 'debit', 'credit')`)],
);

export const msiPurchases = sqliteTable('msi_purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  account_id: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  total_amount: real('total_amount').notNull(),
  installments: integer('installments').notNull(),
  monthly_payment: real('monthly_payment').notNull(),
  paid_installments: integer('paid_installments').notNull().default(0),
  remaining_amount: real('remaining_amount').notNull(),
  start_date: text('start_date').notNull(),
  status: text('status').notNull().default('active'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
