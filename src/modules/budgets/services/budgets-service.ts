import type { FrozenAppConfig } from '@/config/schema';
import type { BudgetRecord } from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso } from '@/core/db/handle';
import type { MovementSnapshot } from '@/core/events/event-map';

import type { BudgetsRepository, BudgetUpdate } from '../data/budgets-repository';
import {
  budgetCoversCategory,
  isBudgetPeriod,
  isBudgetType,
  nextBudgetAmount,
  serializeCategoryIds,
} from '../domain/budget-rules';
import { budgetsTexts } from '../texts';

export interface BudgetInput {
  name?: string;
  type?: string;
  amount?: number;
  period?: string;
  start_date?: string | null;
  icon?: string | null;
  color?: string | null;
  current_amount?: number;
  category_ids?: unknown;
}

/** Origen de la captura manual: solo esos movimientos suman al crearse (regla v1). */
const MANUAL_ORIGIN = 'movements';

export function createBudgetsService(deps: { repo: BudgetsRepository; config: FrozenAppConfig }) {
  const { repo, config } = deps;
  const { errors, messages } = budgetsTexts;

  const applyExpense = (movement: MovementSnapshot, operation: 'add' | 'subtract') => {
    if (movement.type !== 'expense' || !movement.category_id) return;
    const categoryId = movement.category_id;
    for (const budget of repo.listByType('expense')) {
      if (!budgetCoversCategory(budget, categoryId)) continue;
      repo.update(budget.id, {
        current_amount: nextBudgetAmount(budget.current_amount, movement.amount, operation),
      });
    }
  };

  return {
    list: (): BudgetRecord[] => repo.list(),

    getBudgets(): Result<BudgetRecord[]> {
      try {
        return ok(repo.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getBudgetById(id: number): Result<BudgetRecord> {
      const budget = repo.getById(id);
      return budget ? ok(budget) : fail(errors.notFound);
    },

    createBudget(input: BudgetInput): Result<BudgetRecord> {
      const { name, type, amount, period } = input;
      if (!name || !type || !amount || !period) return fail(errors.requiredFields);
      if (!isBudgetType(type)) return fail(errors.invalidType);
      if (!isBudgetPeriod(period)) return fail(errors.invalidPeriod);
      const defaults = config.budgets.defaults;
      try {
        const ts = nowIso();
        const created = repo.insert({
          name,
          type,
          amount,
          period,
          start_date: input.start_date || ts,
          icon: input.icon || (type === 'saving' ? defaults.savingIcon : defaults.expenseIcon),
          color: input.color || (type === 'saving' ? defaults.savingColor : defaults.expenseColor),
          current_amount: 0,
          category_ids: serializeCategoryIds(input.category_ids),
          created_at: ts,
          updated_at: ts,
        });
        return ok(created, messages.created);
      } catch (error) {
        return failFromError(error);
      }
    },

    updateBudget(id: number, input: BudgetInput): Result<BudgetRecord> {
      if (!repo.getById(id)) return fail(errors.notFound);
      const fields: BudgetUpdate = {};
      if (input.name !== undefined) fields.name = input.name;
      if (input.type !== undefined) {
        if (!isBudgetType(input.type)) return fail(errors.invalidType);
        fields.type = input.type;
      }
      if (input.amount !== undefined) fields.amount = input.amount;
      if (input.period !== undefined) {
        if (!isBudgetPeriod(input.period)) return fail(errors.invalidPeriod);
        fields.period = input.period;
      }
      if (input.start_date !== undefined) fields.start_date = input.start_date;
      if (input.icon !== undefined) fields.icon = input.icon;
      if (input.color !== undefined) fields.color = input.color;
      if (input.current_amount !== undefined) fields.current_amount = input.current_amount;
      if (input.category_ids !== undefined) {
        fields.category_ids = Array.isArray(input.category_ids)
          ? JSON.stringify(input.category_ids)
          : (input.category_ids as string | null);
      }
      if (Object.keys(fields).length === 0) return fail(errors.nothingToUpdate);
      try {
        const updated = repo.update(id, fields);
        return updated ? ok(updated, messages.updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteBudget(id: number): Result<null> {
      if (!repo.getById(id)) return fail(errors.notFound);
      try {
        repo.delete(id);
        return ok(null, messages.deleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    onMovementRecorded(movement: MovementSnapshot, origin: string): void {
      if (origin === MANUAL_ORIGIN) applyExpense(movement, 'add');
    },
    onMovementUpdated(before: MovementSnapshot, after: MovementSnapshot): void {
      applyExpense(before, 'subtract');
      applyExpense(after, 'add');
    },
    onMovementDeleted(movement: MovementSnapshot): void {
      applyExpense(movement, 'subtract');
    },
  };
}

export type BudgetsService = ReturnType<typeof createBudgetsService>;
