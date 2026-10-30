import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notificationSettings = sqliteTable('notification_settings', {
  id: integer('id').primaryKey(),
  daily_reminder: integer('daily_reminder').notNull().default(1),
  daily_reminder_time: text('daily_reminder_time').notNull().default('20:00'),
  credit_card_alerts: integer('credit_card_alerts').notNull().default(1),
  budget_alerts: integer('budget_alerts').notNull().default(1),
  loan_alerts: integer('loan_alerts').notNull().default(1),
  subscription_alerts: integer('subscription_alerts').notNull().default(1),
  salary_alerts: integer('salary_alerts').notNull().default(1),
  savings_goal_alerts: integer('savings_goal_alerts').notNull().default(1),
  vacation_mode: integer('vacation_mode').notNull().default(0),
  vacation_mode_until: text('vacation_mode_until'),
  push_token: text('push_token'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});
