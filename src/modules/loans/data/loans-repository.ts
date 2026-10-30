import { desc, eq } from 'drizzle-orm';

import type { LoanRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import { loanPayments, loans } from './schema';

export type NewLoanRow = typeof loans.$inferInsert;
export type LoanUpdate = Partial<Omit<NewLoanRow, 'id' | 'created_at'>>;
export type LoanPayment = typeof loanPayments.$inferSelect;

export function createLoansRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): LoanRecord[] {
      return orm.select().from(loans).orderBy(desc(loans.created_at)).all();
    },
    getById(id: number): LoanRecord | undefined {
      return orm.select().from(loans).where(eq(loans.id, id)).get();
    },
    insert(row: NewLoanRow): LoanRecord {
      return orm.insert(loans).values(row).returning().get();
    },
    update(id: number, fields: LoanUpdate): LoanRecord | undefined {
      orm
        .update(loans)
        .set({ ...fields, updated_at: nowIso() })
        .where(eq(loans.id, id))
        .run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(loanPayments).where(eq(loanPayments.loan_id, id)).run();
      orm.delete(loans).where(eq(loans.id, id)).run();
    },
    addPayment(row: typeof loanPayments.$inferInsert): LoanPayment {
      return orm.insert(loanPayments).values(row).returning().get();
    },
    payments(loanId: number): LoanPayment[] {
      return orm
        .select()
        .from(loanPayments)
        .where(eq(loanPayments.loan_id, loanId))
        .orderBy(desc(loanPayments.date), desc(loanPayments.created_at))
        .all();
    },
  };
}

export type LoansRepository = ReturnType<typeof createLoansRepository>;
