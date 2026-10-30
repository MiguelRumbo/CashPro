import { sql } from 'drizzle-orm';
import { check, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const movements = sqliteTable(
  'movements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type', { enum: ['expense', 'income', 'transfer'] }).notNull(),
    amount: real('amount').notNull(),
    title: text('title'),
    category_id: text('category_id'),
    category_name: text('category_name'),
    category_icon: text('category_icon'),
    category_color: text('category_color'),
    account_id: integer('account_id').notNull(),
    to_account_id: integer('to_account_id'),
    date: text('date').notNull(),
    notes: text('notes'),
    created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
    updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [check('movements_type_check', sql`${t.type} IN ('expense', 'income', 'transfer')`)],
);
