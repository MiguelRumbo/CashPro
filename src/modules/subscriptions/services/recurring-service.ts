import type { FrozenAppConfig } from '@/config/schema';
import type { MovementsLedger, RecurringPaymentRecord, RecurringPaymentsStats } from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';

import type { RecurringRepository, RecurringUpdate } from '../data/recurring-repository';
import { calculateNextDate, categoryNameFor, computeRecurringStats, isIncomeType } from '../domain/recurring-rules';
import { subscriptionsTexts } from '../texts';

export interface RecurringInput {
  name?: string;
  type?: string;
  amount?: number;
  frequency?: string;
  day_of_month?: number | null;
  day_of_week?: number | null;
  specific_dates?: string | null;
  category_id?: string | null;
  account_id?: number;
  icon?: string;
  color?: string;
  is_active?: boolean | number;
  next_date?: string | null;
  auto_register?: boolean | number;
  notify_before_days?: number;
}

const toFlag = (value: boolean | number | undefined) => (value ? 1 : 0);

export function createRecurringService(deps: {
  db: DbHandle;
  repo: RecurringRepository;
  config: FrozenAppConfig;
  ledger: () => MovementsLedger | undefined;
  now?: () => Date;
}) {
  const { db, repo, config, ledger } = deps;
  const now = deps.now ?? (() => new Date());
  const { errors, messages } = subscriptionsTexts;
  const defaults = config.subscriptions.defaults;

  return {
    list: (): RecurringPaymentRecord[] => repo.list(),
    stats: (): RecurringPaymentsStats => computeRecurringStats(repo.list(), config.subscriptions, now()),

    getRecurringPayments(): Result<RecurringPaymentRecord[]> {
      try {
        return ok(repo.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getRecurringPaymentById(id: number): Result<RecurringPaymentRecord> {
      const payment = repo.getById(id);
      return payment ? ok(payment) : fail(errors.notFound);
    },

    createRecurringPayment(input: RecurringInput): Result<RecurringPaymentRecord> {
      const { name, type, amount, frequency, account_id } = input;
      if (!name || !type || !amount || !frequency || !account_id) return fail(errors.missingFields);
      if (amount <= 0) return fail(errors.amountMustBePositive);
      try {
        const ts = nowIso();
        const created = repo.insert({
          name,
          type,
          amount,
          frequency,
          day_of_month: input.day_of_month ?? null,
          day_of_week: input.day_of_week ?? null,
          specific_dates: input.specific_dates ?? null,
          category_id: input.category_id ?? null,
          account_id,
          icon: input.icon || defaults.icon,
          color: input.color || defaults.color,
          is_active: input.is_active !== undefined ? toFlag(input.is_active) : 1,
          next_date:
            input.next_date ||
            calculateNextDate(frequency, input.day_of_month, input.day_of_week, input.specific_dates, now()),
          auto_register: toFlag(input.auto_register),
          notify_before_days: input.notify_before_days || defaults.notifyBeforeDays,
          created_at: ts,
          updated_at: ts,
        });
        return ok(created);
      } catch (error) {
        return failFromError(error);
      }
    },

    updateRecurringPayment(id: number, input: RecurringInput): Result<RecurringPaymentRecord> {
      const payment = repo.getById(id);
      if (!payment) return fail(errors.notFound);
      const fields: RecurringUpdate = {
        name: input.name ?? payment.name,
        type: input.type ?? payment.type,
        amount: input.amount ?? payment.amount,
        frequency: input.frequency ?? payment.frequency,
        day_of_month: input.day_of_month !== undefined ? input.day_of_month : payment.day_of_month,
        day_of_week: input.day_of_week !== undefined ? input.day_of_week : payment.day_of_week,
        specific_dates: input.specific_dates !== undefined ? input.specific_dates : payment.specific_dates,
        category_id: input.category_id !== undefined ? input.category_id : payment.category_id,
        account_id: input.account_id ?? payment.account_id,
        icon: input.icon ?? payment.icon,
        color: input.color ?? payment.color,
        is_active: input.is_active !== undefined ? toFlag(input.is_active) : payment.is_active,
        next_date: input.next_date !== undefined ? input.next_date : payment.next_date,
        auto_register: input.auto_register !== undefined ? toFlag(input.auto_register) : payment.auto_register,
        notify_before_days: input.notify_before_days ?? payment.notify_before_days,
      };
      try {
        const updated = repo.update(id, fields);
        return updated ? ok(updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteRecurringPayment(id: number): Result<null> {
      if (!repo.getById(id)) return fail(errors.notFound);
      try {
        repo.delete(id);
        return ok(null, messages.deleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Registra el cobro/abono como movimiento y avanza la próxima fecha. */
    registerRecurringPayment(id: number, paymentDate?: string): Result<{ payment: RecurringPaymentRecord }> {
      const payment = repo.getById(id);
      if (!payment) return fail(errors.notFound);
      const movementsLedger = ledger();
      if (!movementsLedger) return fail(errors.ledgerUnavailable);
      try {
        const updated = db.transaction(() => {
          const ts = nowIso();
          movementsLedger.record(
            {
              type: isIncomeType(payment.type) ? 'income' : 'expense',
              amount: payment.amount,
              title: payment.name,
              category_id: payment.category_id,
              category_name: categoryNameFor(payment.type),
              category_icon: payment.icon,
              category_color: payment.color,
              account_id: payment.account_id,
              date: paymentDate || ts,
              notes: subscriptionsTexts.movementNotes(payment.name),
            },
            { origin: 'subscriptions', affectsBalance: true },
          );
          const nextDate = calculateNextDate(
            payment.frequency,
            payment.day_of_month,
            payment.day_of_week,
            payment.specific_dates,
            now(),
          );
          return repo.update(id, { next_date: nextDate });
        });
        return updated ? ok({ payment: updated }) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type RecurringService = ReturnType<typeof createRecurringService>;
