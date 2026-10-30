import type { FrozenAppConfig } from '@/config/schema';
import type { RecurringPaymentRecord, RecurringPaymentsStats } from '@/core/contracts/finance';
import { isoDay, MS_PER_DAY } from '@/core/units/dates';

import { subscriptionsTexts } from '../texts';

type MonthlyFactors = FrozenAppConfig['subscriptions']['monthlyFactor'];

const PERCENT = 100;

export function monthlyAmount(payment: Pick<RecurringPaymentRecord, 'amount' | 'frequency'>, factors: MonthlyFactors): number {
  const factor = factors[payment.frequency as keyof MonthlyFactors];
  return factor === undefined ? payment.amount : payment.amount * factor;
}

export function isIncomeType(type: string): boolean {
  return type === 'salary' || type === 'recurring_income';
}

export function categoryNameFor(type: string): string {
  const names: Record<string, string> = subscriptionsTexts.categoryNames;
  return names[type] ?? subscriptionsTexts.categoryNames.fallback;
}

/**
 * Próxima fecha de cobro (regla v1, AAAA-MM-DD). Nota v1: un día de semana 0 (domingo)
 * se trata como "sin día" y cae al caso por defecto (+1 mes).
 */
export function calculateNextDate(
  frequency: string,
  dayOfMonth: number | null | undefined,
  dayOfWeek: number | null | undefined,
  specificDates: string | null | undefined,
  today: Date,
): string {
  if (frequency === 'monthly' && dayOfMonth) {
    const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    if (next <= today) next.setMonth(next.getMonth() + 1);
    return isoDay(next);
  }
  if (frequency === 'weekly' && dayOfWeek) {
    const next = new Date(today);
    const daysUntil = (dayOfWeek - next.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    return isoDay(next);
  }
  if (frequency === 'biweekly' && specificDates) {
    const candidates = specificDates
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .map((day) => {
        const next = new Date(today.getFullYear(), today.getMonth(), day);
        if (next <= today) next.setMonth(next.getMonth() + 1);
        return next;
      })
      .sort((a, b) => a.getTime() - b.getTime());
    const first = candidates[0];
    if (first) return isoDay(first);
  }
  if (frequency === 'yearly') {
    const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth || today.getDate());
    if (next <= today) next.setFullYear(next.getFullYear() + 1);
    return isoDay(next);
  }
  return isoDay(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()));
}

export function computeRecurringStats(
  payments: readonly RecurringPaymentRecord[],
  config: FrozenAppConfig['subscriptions'],
  today: Date,
): RecurringPaymentsStats {
  const active = payments.filter((p) => p.is_active);
  const subscriptions = active.filter((p) => p.type === 'subscription');
  const salaries = active.filter((p) => isIncomeType(p.type));
  const expenses = active.filter((p) => p.type === 'recurring_expense' || p.type === 'subscription');
  const sumMonthly = (list: readonly RecurringPaymentRecord[]) =>
    list.reduce((s, p) => s + monthlyAmount(p, config.monthlyFactor), 0);
  const totalSubs = sumMonthly(subscriptions);
  const totalIncome = sumMonthly(salaries);
  const windowEnd = new Date(today.getTime() + config.upcomingWindowDays * MS_PER_DAY);
  const upcoming = active
    .filter((p) => {
      const next = new Date(p.next_date ?? '');
      return next >= today && next <= windowEnd;
    })
    .sort((a, b) => new Date(a.next_date ?? '').getTime() - new Date(b.next_date ?? '').getTime());
  return {
    total_active: active.length,
    total_subscriptions: subscriptions.length,
    total_salaries: salaries.length,
    total_recurring_expenses: expenses.length,
    monthly_subscriptions: totalSubs,
    monthly_recurring_expenses: sumMonthly(expenses),
    monthly_recurring_income: totalIncome,
    subscription_percentage: totalIncome > 0 ? (totalSubs / totalIncome) * PERCENT : 0,
    upcoming_payments: upcoming,
  };
}
