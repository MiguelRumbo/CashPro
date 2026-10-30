import { sql } from 'drizzle-orm';
import { check, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const budgets = sqliteTable(
  'budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: ['saving', 'expense'] }).notNull(),
    amount: real('amount').notNull(),
    period: text('period', { enum: ['weekly', 'monthly'] }).notNull(),
    start_date: text('start_date'),
    icon: text('icon'),
    color: text('color'),
    current_amount: real('current_amount').notNull().default(0),
    category_ids: text('category_ids'),
    created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
    updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [
    check('budgets_type_check', sql`${t.type} IN ('saving', 'expense')`),
    check('budgets_period_check', sql`${t.period} IN ('weekly', 'monthly')`),
  ],
);
