import { desc, eq } from 'drizzle-orm';

import type { RecurringPaymentRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import { recurringPayments } from './schema';

export type NewRecurringRow = typeof recurringPayments.$inferInsert;
export type RecurringUpdate = Partial<Omit<NewRecurringRow, 'id' | 'created_at'>>;

export function createRecurringRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): RecurringPaymentRecord[] {
      return orm.select().from(recurringPayments).orderBy(desc(recurringPayments.created_at)).all();
    },
    getById(id: number): RecurringPaymentRecord | undefined {
      return orm.select().from(recurringPayments).where(eq(recurringPayments.id, id)).get();
    },
    insert(row: NewRecurringRow): RecurringPaymentRecord {
      return orm.insert(recurringPayments).values(row).returning().get();
    },
    update(id: number, fields: RecurringUpdate): RecurringPaymentRecord | undefined {
      orm.update(recurringPayments).set({ ...fields, updated_at: nowIso() }).where(eq(recurringPayments.id, id)).run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(recurringPayments).where(eq(recurringPayments.id, id)).run();
    },
  };
}

export type RecurringRepository = ReturnType<typeof createRecurringRepository>;
