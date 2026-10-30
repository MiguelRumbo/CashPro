-- Migración base: replica el esquema de CashPro v1. IF NOT EXISTS (editado a mano) hace que
-- sea un no-op en dispositivos que ya tienen la BD de v1, sin tocar sus datos.
CREATE TABLE IF NOT EXISTS `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`icon` text,
	`color` text,
	`clabe` text,
	`bank_name` text,
	`card_last_four` text,
	`generates_interest` integer DEFAULT 0 NOT NULL,
	`interest_rate` real DEFAULT 0 NOT NULL,
	`credit_limit` real DEFAULT 0 NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`cut_off_day` integer,
	`payment_due_day` integer,
	`is_primary` integer DEFAULT 0 NOT NULL,
	`include_in_balance` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "accounts_type_check" CHECK("accounts"."type" IN ('cash', 'bank', 'debit', 'credit'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `msi_purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`description` text NOT NULL,
	`total_amount` real NOT NULL,
	`installments` integer NOT NULL,
	`monthly_payment` real NOT NULL,
	`paid_installments` integer DEFAULT 0 NOT NULL,
	`remaining_amount` real NOT NULL,
	`start_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notification_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`daily_reminder` integer DEFAULT 1 NOT NULL,
	`daily_reminder_time` text DEFAULT '20:00' NOT NULL,
	`credit_card_alerts` integer DEFAULT 1 NOT NULL,
	`budget_alerts` integer DEFAULT 1 NOT NULL,
	`loan_alerts` integer DEFAULT 1 NOT NULL,
	`subscription_alerts` integer DEFAULT 1 NOT NULL,
	`salary_alerts` integer DEFAULT 1 NOT NULL,
	`savings_goal_alerts` integer DEFAULT 1 NOT NULL,
	`vacation_mode` integer DEFAULT 0 NOT NULL,
	`vacation_mode_until` text,
	`push_token` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`period` text NOT NULL,
	`start_date` text,
	`icon` text,
	`color` text,
	`current_amount` real DEFAULT 0 NOT NULL,
	`category_ids` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "budgets_type_check" CHECK("budgets"."type" IN ('saving', 'expense')),
	CONSTRAINT "budgets_period_check" CHECK("budgets"."period" IN ('weekly', 'monthly'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `loan_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`loan_id` integer NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person_name` text NOT NULL,
	`amount` real NOT NULL,
	`remaining_amount` real NOT NULL,
	`date` text NOT NULL,
	`due_date` text,
	`notes` text,
	`account_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`title` text,
	`category_id` text,
	`category_name` text,
	`category_icon` text,
	`category_color` text,
	`account_id` integer NOT NULL,
	`to_account_id` integer,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "movements_type_check" CHECK("movements"."type" IN ('expense', 'income', 'transfer'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `goal_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`goal_id` integer NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `savings_goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `savings_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` text,
	`icon` text DEFAULT 'target' NOT NULL,
	`color` text DEFAULT '#20df60' NOT NULL,
	`account_id` integer,
	`auto_deduct` integer DEFAULT 0 NOT NULL,
	`auto_deduct_amount` real DEFAULT 0 NOT NULL,
	`auto_deduct_period` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'Usuario' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `recurring_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`frequency` text NOT NULL,
	`day_of_month` integer,
	`day_of_week` integer,
	`specific_dates` text,
	`category_id` text,
	`account_id` integer NOT NULL,
	`icon` text DEFAULT 'creditcard' NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`next_date` text,
	`auto_register` integer DEFAULT 0 NOT NULL,
	`notify_before_days` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fuel_loads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`liters` real NOT NULL,
	`price_per_liter` real NOT NULL,
	`total_cost` real NOT NULL,
	`odometer` real NOT NULL,
	`station_name` text,
	`is_full_tank` integer DEFAULT 0 NOT NULL,
	`date` text NOT NULL,
	`account_id` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `maintenance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`cost` real NOT NULL,
	`odometer` real NOT NULL,
	`workshop_name` text,
	`date` text NOT NULL,
	`next_date` text,
	`next_odometer` real,
	`account_id` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`license_plate` text,
	`odometer` real NOT NULL,
	`fuel_type` text NOT NULL,
	`tank_capacity` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
