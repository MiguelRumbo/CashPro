import type { FrozenAppConfig } from '@/config/schema';
import type {
  AccountRecord,
  BudgetRecord,
  LoanRecord,
  RecurringPaymentRecord,
  SavingsGoalRecord,
} from '@/core/contracts/finance';
import { daysBetween, daysUntilDayOfMonth } from '@/core/units/dates';

import { alertsTexts as t } from '../texts';

const PERCENT = 100;

export type AlertType =
  | 'credit_cutoff'
  | 'credit_payment'
  | 'budget_exceeded'
  | 'budget_warning'
  | 'loan_due'
  | 'subscription_due'
  | 'savings_goal_behind';

export interface AppAlert {
  type: AlertType;
  title: string;
  message: string;
  data: Readonly<Record<string, number>>;
}

export interface AlertToggles {
  credit_card_alerts: number;
  budget_alerts: number;
  loan_alerts: number;
  subscription_alerts: number;
  savings_goal_alerts: number;
  vacation_mode: number;
}

/** Datos de otros módulos; `undefined` si el módulo está apagado. */
export interface AlertSources {
  accounts?: readonly AccountRecord[];
  budgets?: readonly BudgetRecord[];
  loans?: readonly LoanRecord[];
  subscriptions?: readonly RecurringPaymentRecord[];
  goals?: readonly SavingsGoalRecord[];
}

/** Avisos pendientes calculados al vuelo (reglas v1, umbrales en app.config.alerts). */
export function computeAlerts(
  toggles: AlertToggles,
  sources: AlertSources,
  config: FrozenAppConfig['alerts'],
  today: Date,
  formatAmount: (amount: number) => string,
): AppAlert[] {
  if (toggles.vacation_mode === 1) return [];
  const alerts: AppAlert[] = [];

  if (toggles.credit_card_alerts === 1) {
    for (const account of sources.accounts ?? []) {
      if (account.type !== 'credit' || account.include_in_balance !== 1) continue;
      const debt = formatAmount(account.current_balance || 0);
      if (account.cut_off_day) {
        const d = daysUntilDayOfMonth(account.cut_off_day, today);
        if (config.creditCutoffDaysBefore.includes(d)) {
          alerts.push({
            type: 'credit_cutoff',
            title: d === 0 ? t.creditCutoff.titleToday : t.creditCutoff.titleSoon,
            message: t.creditCutoff.message(account.name, d, debt),
            data: { account_id: account.id },
          });
        }
      }
      if (account.payment_due_day) {
        const d = daysUntilDayOfMonth(account.payment_due_day, today);
        if (config.creditPaymentDaysBefore.includes(d)) {
          alerts.push({
            type: 'credit_payment',
            title: t.creditPayment.title(d),
            message: t.creditPayment.message(account.name, d, debt),
            data: { account_id: account.id },
          });
        }
      }
    }
  }

  if (toggles.budget_alerts === 1) {
    for (const budget of sources.budgets ?? []) {
      const pct = (budget.current_amount / budget.amount) * PERCENT;
      if (pct >= config.budgetExceededPercent) {
        alerts.push({
          type: 'budget_exceeded',
          title: t.budgetExceeded.title,
          message: t.budgetExceeded.message(budget.name, formatAmount(budget.current_amount - budget.amount)),
          data: { budget_id: budget.id },
        });
      } else if (pct >= config.budgetWarningPercent) {
        alerts.push({
          type: 'budget_warning',
          title: t.budgetWarning.title(config.budgetWarningPercent),
          message: t.budgetWarning.message(
            budget.name,
            pct.toFixed(0),
            formatAmount(budget.amount - budget.current_amount),
          ),
          data: { budget_id: budget.id },
        });
      }
    }
  }

  if (toggles.loan_alerts === 1) {
    for (const loan of sources.loans ?? []) {
      if ((loan.status !== 'active' && loan.status !== 'partial') || !loan.due_date) continue;
      const days = daysBetween(today, new Date(loan.due_date));
      if (days >= 0 && days <= config.loanDueWithinDays) {
        alerts.push({
          type: 'loan_due',
          title: t.loanDue.title,
          message: t.loanDue.message(loan.person_name, days, formatAmount(loan.remaining_amount)),
          data: { loan_id: loan.id },
        });
      }
    }
  }

  if (toggles.subscription_alerts === 1) {
    for (const sub of sources.subscriptions ?? []) {
      if (sub.is_active !== 1) continue;
      const days = daysBetween(today, new Date(sub.next_date ?? ''));
      if (config.subscriptionDueDaysBefore.includes(days)) {
        alerts.push({
          type: 'subscription_due',
          title: t.subscriptionDue.title(days),
          message: t.subscriptionDue.message(sub.name, days, formatAmount(sub.amount)),
          data: { subscription_id: sub.id },
        });
      }
    }
  }

  if (toggles.savings_goal_alerts === 1) {
    for (const goal of sources.goals ?? []) {
      if (goal.status !== 'active' || !goal.deadline) continue;
      const daysRemaining = daysBetween(today, new Date(goal.deadline));
      const remaining = goal.target_amount - goal.current_amount;
      if (daysRemaining <= 0 || remaining <= 0) continue;
      const monthly = (remaining / daysRemaining) * config.goalDaysPerMonth;
      if (monthly > remaining * config.goalBehindRatio) {
        alerts.push({
          type: 'savings_goal_behind',
          title: t.goalBehind.title,
          message: t.goalBehind.message(goal.name, formatAmount(monthly)),
          data: { goal_id: goal.id },
        });
      }
    }
  }

  return alerts;
}
