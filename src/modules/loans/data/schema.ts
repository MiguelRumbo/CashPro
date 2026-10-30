import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const loans = sqliteTable('loans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  person_name: text('person_name').notNull(),
  amount: real('amount').notNull(),
  remaining_amount: real('remaining_amount').notNull(),
  date: text('date').notNull(),
  due_date: text('due_date'),
  notes: text('notes'),
  account_id: integer('account_id'),
  status: text('status').notNull().default('active'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const loanPayments = sqliteTable('loan_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loan_id: integer('loan_id')
    .notNull()
    .references(() => loans.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
