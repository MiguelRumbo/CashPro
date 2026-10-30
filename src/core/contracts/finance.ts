/**
 * Contratos de datos compartidos entre módulos y las claves de sus capacidades.
 * Los nombres de campo conservan el snake_case de la BD v1 (y del formato de respaldo JSON).
 */
import type { CurrencyCode } from '@/config/schema';

import { createCapabilityKey } from './capabilities';
import type { Result } from './result';

// ---------- Cuentas ----------
export const accountTypes = ['cash', 'bank', 'debit', 'credit'] as const;
export type AccountType = (typeof accountTypes)[number];

export interface AccountRecord {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  clabe: string | null;
  bank_name: string | null;
  card_last_four: string | null;
  generates_interest: number;
  interest_rate: number;
  credit_limit: number;
  current_balance: number;
  cut_off_day: number | null;
  payment_due_day: number | null;
  is_primary: number;
  include_in_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AccountsStats {
  total_balance: number;
  assets: number;
  credit_available: number;
}

export interface AccountsQuery {
  list(): AccountRecord[];
  getById(id: number): AccountRecord | undefined;
  stats(): AccountsStats;
}

export const accountsQueryKey = createCapabilityKey<AccountsQuery>('accounts.query');

// ---------- Movimientos ----------
export const movementTypes = ['expense', 'income', 'transfer'] as const;
export type MovementType = (typeof movementTypes)[number];

export interface MovementRecord {
  id: number;
  type: MovementType;
  amount: number;
  title: string | null;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  account_id: number;
  to_account_id: number | null;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovementWithAccount extends MovementRecord {
  account_name: string | undefined;
  account_type: AccountType | undefined;
}

export type NewMovementInput = Pick<MovementRecord, 'type' | 'amount' | 'account_id'> &
  Partial<
    Pick<
      MovementRecord,
      | 'title'
      | 'category_id'
      | 'category_name'
      | 'category_icon'
      | 'category_color'
      | 'to_account_id'
      | 'date'
      | 'notes'
    >
  >;

export type MovementPatch = Partial<Omit<MovementRecord, 'id' | 'created_at' | 'updated_at'>>;

export interface RecordMovementOptions {
  /** Id del módulo que origina el movimiento ('movements' = captura manual). */
  origin: string;
  /** false cuando el módulo origen ya ajustó el saldo (p. ej. pago de MSI). */
  affectsBalance: boolean;
}

export interface MovementMatch {
  category_name: string;
  category_icon: string;
  date: string;
  amount: number;
}

export interface MovementsLedger {
  list(): MovementWithAccount[];
  getById(id: number): MovementRecord | undefined;
  record(input: NewMovementInput, options: RecordMovementOptions): MovementRecord;
  update(id: number, patch: MovementPatch): MovementRecord | undefined;
  remove(id: number): boolean;
  /** Busca el movimiento más reciente que coincide (heurística heredada de v1 para gasolina). */
  findLatest(match: MovementMatch): MovementRecord | undefined;
  exportCsv(): Result<string>;
}

export const movementsLedgerKey = createCapabilityKey<MovementsLedger>('movements.ledger');

// ---------- Presupuestos ----------
export type BudgetType = 'saving' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly';

export interface BudgetRecord {
  id: number;
  name: string;
  type: BudgetType;
  amount: number;
  period: BudgetPeriod;
  start_date: string | null;
  icon: string | null;
  color: string | null;
  current_amount: number;
  category_ids: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetsQuery {
  list(): BudgetRecord[];
}

export const budgetsQueryKey = createCapabilityKey<BudgetsQuery>('budgets.query');

// ---------- Metas de ahorro ----------
export interface SavingsGoalRecord {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  account_id: number | null;
  auto_deduct: number;
  auto_deduct_amount: number;
  auto_deduct_period: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalsStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target: number;
  total_saved: number;
  total_remaining: number;
  completion_percentage: number;
}

export interface SavingsGoalsQuery {
  list(): SavingsGoalRecord[];
  stats(): SavingsGoalsStats;
}

export const savingsGoalsQueryKey = createCapabilityKey<SavingsGoalsQuery>('savingsGoals.query');

// ---------- Préstamos ----------
export type LoanStatus = 'active' | 'partial' | 'paid' | 'forgiven';

export interface LoanRecord {
  id: number;
  person_name: string;
  amount: number;
  remaining_amount: number;
  date: string;
  due_date: string | null;
  notes: string | null;
  account_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoansStats {
  total_loans: number;
  active_loans: number;
  paid_loans: number;
  forgiven_loans: number;
  total_lent: number;
  total_pending: number;
  total_recovered: number;
  recovery_percentage: number;
}

export interface LoansQuery {
  list(): LoanRecord[];
  stats(): LoansStats;
}

export const loansQueryKey = createCapabilityKey<LoansQuery>('loans.query');

// ---------- Suscripciones y pagos recurrentes ----------
export type RecurringType = 'subscription' | 'salary' | 'recurring_expense' | 'recurring_income';
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringPaymentRecord {
  id: number;
  name: string;
  type: string;
  amount: number;
  frequency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  specific_dates: string | null;
  category_id: string | null;
  account_id: number;
  icon: string;
  color: string;
  is_active: number;
  next_date: string | null;
  auto_register: number;
  notify_before_days: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringPaymentsStats {
  total_active: number;
  total_subscriptions: number;
  total_salaries: number;
  total_recurring_expenses: number;
  monthly_subscriptions: number;
  monthly_recurring_expenses: number;
  monthly_recurring_income: number;
  subscription_percentage: number;
  upcoming_payments: RecurringPaymentRecord[];
}

export interface SubscriptionsQuery {
  list(): RecurringPaymentRecord[];
  stats(): RecurringPaymentsStats;
}

export const subscriptionsQueryKey = createCapabilityKey<SubscriptionsQuery>('subscriptions.query');

// ---------- Vehículos ----------
export interface VehicleRecord {
  id: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string | null;
  odometer: number;
  fuel_type: string;
  tank_capacity: number | null;
  created_at: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  type: string;
  description: string;
  cost: number;
  odometer: number;
  workshop_name: string | null;
  date: string;
  next_date: string | null;
  next_odometer: number | null;
  account_id: number;
  notes: string | null;
  created_at: string;
}

export interface VehicleStats {
  avg_efficiency: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_cost: number;
  month_fuel_cost: number;
  month_maintenance_cost: number;
  month_total_cost: number;
  fuel_loads_count: number;
  maintenance_count: number;
  last_maintenance: MaintenanceRecord | null;
  upcoming_maintenance: MaintenanceRecord | null;
}

export interface VehiclesQuery {
  list(): VehicleRecord[];
  stats(vehicleId: number): VehicleStats | undefined;
}

export const vehiclesQueryKey = createCapabilityKey<VehiclesQuery>('vehicles.query');

// ---------- Perfil ----------
export interface ProfileRecord {
  id: number;
  name: string;
  email: string;
  currency: CurrencyCode;
  created_at: string;
  updated_at: string;
}

export interface ProfileQuery {
  get(): ProfileRecord;
}

export const profileQueryKey = createCapabilityKey<ProfileQuery>('settings.profile');
