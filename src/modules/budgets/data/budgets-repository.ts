import { desc, eq } from 'drizzle-orm';

import type { BudgetRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import { budgets } from './schema';

export type NewBudgetRow = typeof budgets.$inferInsert;
export type BudgetUpdate = Partial<Omit<NewBudgetRow, 'id' | 'created_at'>>;

export function createBudgetsRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): BudgetRecord[] {
      return orm.select().from(budgets).orderBy(desc(budgets.created_at)).all();
    },
    listByType(type: BudgetRecord['type']): BudgetRecord[] {
      return orm.select().from(budgets).where(eq(budgets.type, type)).all();
    },
    getById(id: number): BudgetRecord | undefined {
      return orm.select().from(budgets).where(eq(budgets.id, id)).get();
    },
    insert(row: NewBudgetRow): BudgetRecord {
      return orm.insert(budgets).values(row).returning().get();
    },
    update(id: number, fields: BudgetUpdate): BudgetRecord | undefined {
      orm.update(budgets).set({ ...fields, updated_at: nowIso() }).where(eq(budgets.id, id)).run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(budgets).where(eq(budgets.id, id)).run();
    },
  };
}

export type BudgetsRepository = ReturnType<typeof createBudgetsRepository>;
