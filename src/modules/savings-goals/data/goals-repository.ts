import { desc, eq } from 'drizzle-orm';

import type { SavingsGoalRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import { goalContributions, savingsGoals } from './schema';

export type NewGoalRow = typeof savingsGoals.$inferInsert;
export type GoalUpdate = Partial<Omit<NewGoalRow, 'id' | 'created_at'>>;
export type GoalContribution = typeof goalContributions.$inferSelect;

export function createGoalsRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): SavingsGoalRecord[] {
      return orm.select().from(savingsGoals).orderBy(desc(savingsGoals.created_at)).all();
    },
    getById(id: number): SavingsGoalRecord | undefined {
      return orm.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
    },
    insert(row: NewGoalRow): SavingsGoalRecord {
      return orm.insert(savingsGoals).values(row).returning().get();
    },
    update(id: number, fields: GoalUpdate): SavingsGoalRecord | undefined {
      orm
        .update(savingsGoals)
        .set({ ...fields, updated_at: nowIso() })
        .where(eq(savingsGoals.id, id))
        .run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(goalContributions).where(eq(goalContributions.goal_id, id)).run();
      orm.delete(savingsGoals).where(eq(savingsGoals.id, id)).run();
    },
    addContribution(row: typeof goalContributions.$inferInsert): GoalContribution {
      return orm.insert(goalContributions).values(row).returning().get();
    },
    contributions(goalId: number): GoalContribution[] {
      return orm
        .select()
        .from(goalContributions)
        .where(eq(goalContributions.goal_id, goalId))
        .orderBy(desc(goalContributions.date), desc(goalContributions.created_at))
        .all();
    },
  };
}

export type GoalsRepository = ReturnType<typeof createGoalsRepository>;
