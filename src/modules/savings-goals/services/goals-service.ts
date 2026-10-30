import type { FrozenAppConfig } from '@/config/schema';
import type {
  AccountsQuery,
  MovementsLedger,
  SavingsGoalRecord,
  SavingsGoalsStats,
} from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';

import type { GoalContribution, GoalsRepository, GoalUpdate } from '../data/goals-repository';
import { computeGoalsStats, statusAfterSaving } from '../domain/goal-rules';
import { savingsGoalsTexts } from '../texts';

export interface GoalInput {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
  account_id?: number | null;
  auto_deduct?: boolean | number;
  auto_deduct_amount?: number;
  auto_deduct_period?: string | null;
  status?: string;
}

export interface ContributionInput {
  amount: number;
  account_id: number;
  notes?: string | null;
}

const toFlag = (value: boolean | number | undefined) => (value ? 1 : 0);

export function createGoalsService(deps: {
  db: DbHandle;
  repo: GoalsRepository;
  config: FrozenAppConfig;
  accounts: () => AccountsQuery | undefined;
  ledger: () => MovementsLedger | undefined;
}) {
  const { db, repo, config, accounts, ledger } = deps;
  const { errors, messages, contributionMovement } = savingsGoalsTexts;

  return {
    list: (): SavingsGoalRecord[] => repo.list(),
    stats: (): SavingsGoalsStats => computeGoalsStats(repo.list()),

    getSavingsGoals(): Result<SavingsGoalRecord[]> {
      try {
        return ok(repo.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getSavingsGoalById(id: number): Result<SavingsGoalRecord> {
      const goal = repo.getById(id);
      return goal ? ok(goal) : fail(errors.notFound);
    },

    createSavingsGoal(input: GoalInput): Result<SavingsGoalRecord> {
      const { name, target_amount } = input;
      if (!name || !target_amount) return fail(errors.nameAndTargetRequired);
      if (target_amount <= 0) return fail(errors.targetMustBePositive);
      try {
        const ts = nowIso();
        const created = repo.insert({
          name,
          target_amount,
          current_amount: input.current_amount ?? 0,
          deadline: input.deadline ?? null,
          icon: input.icon || config.savingsGoals.defaults.icon,
          color: input.color || config.savingsGoals.defaults.color,
          account_id: input.account_id ?? null,
          auto_deduct: toFlag(input.auto_deduct),
          auto_deduct_amount: input.auto_deduct_amount || 0,
          auto_deduct_period: input.auto_deduct_period ?? null,
          status: input.status || 'active',
          created_at: ts,
          updated_at: ts,
        });
        return ok(created, messages.created);
      } catch (error) {
        return failFromError(error);
      }
    },

    updateSavingsGoal(id: number, input: GoalInput): Result<SavingsGoalRecord> {
      const goal = repo.getById(id);
      if (!goal) return fail(errors.notFound);
      const fields: GoalUpdate = {
        name: input.name ?? goal.name,
        target_amount: input.target_amount ?? goal.target_amount,
        current_amount: input.current_amount ?? goal.current_amount,
        deadline: input.deadline !== undefined ? input.deadline : goal.deadline,
        icon: input.icon ?? goal.icon,
        color: input.color ?? goal.color,
        account_id: input.account_id !== undefined ? input.account_id : goal.account_id,
        auto_deduct: input.auto_deduct !== undefined ? toFlag(input.auto_deduct) : goal.auto_deduct,
        auto_deduct_amount: input.auto_deduct_amount ?? goal.auto_deduct_amount,
        auto_deduct_period:
          input.auto_deduct_period !== undefined ? input.auto_deduct_period : goal.auto_deduct_period,
        status: input.status ?? goal.status,
      };
      try {
        let updated = repo.update(id, fields);
        if (updated && updated.current_amount >= updated.target_amount && updated.status !== 'completed') {
          updated = repo.update(id, { status: 'completed' });
        }
        return updated ? ok(updated, messages.updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteSavingsGoal(id: number): Result<null> {
      if (!repo.getById(id)) return fail(errors.notFound);
      try {
        db.transaction(() => repo.delete(id));
        return ok(null, messages.deleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Aportar a una meta registra un gasto 'Ahorro' en la cuenta origen. */
    addGoalContribution(goalId: number, input: ContributionInput): Result<{ goal: SavingsGoalRecord }> {
      const { amount, account_id, notes } = input;
      if (!amount || amount <= 0) return fail(errors.amountMustBePositive);
      if (!account_id) return fail(errors.accountRequired);
      const goal = repo.getById(goalId);
      if (!goal) return fail(errors.notFound);
      const accountsQuery = accounts();
      const movementsLedger = ledger();
      if (!accountsQuery || !movementsLedger) return fail(errors.ledgerUnavailable);
      const account = accountsQuery.getById(account_id);
      if (!account) return fail(errors.accountNotFound);
      if (account.type !== 'credit' && account.balance < amount) return fail(errors.insufficientFunds);
      try {
        const updated = db.transaction(() => {
          const ts = nowIso();
          repo.addContribution({ goal_id: goalId, amount, date: ts, notes: notes ?? null, created_at: ts });
          const newAmount = goal.current_amount + amount;
          const row = repo.update(goalId, {
            current_amount: newAmount,
            status: statusAfterSaving(goal, newAmount),
          });
          movementsLedger.record(
            {
              type: 'expense',
              amount,
              title: contributionMovement.title(goal.name),
              category_name: contributionMovement.categoryName,
              category_icon: contributionMovement.categoryIcon,
              category_color: contributionMovement.categoryColor,
              account_id,
              date: ts,
              notes: notes || contributionMovement.notes(goal.name),
            },
            { origin: 'savingsGoals', affectsBalance: true },
          );
          return row;
        });
        return updated ? ok({ goal: updated }, messages.contributionAdded) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    getGoalContributions(goalId: number): Result<GoalContribution[]> {
      try {
        return ok(repo.contributions(goalId));
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type GoalsService = ReturnType<typeof createGoalsService>;
