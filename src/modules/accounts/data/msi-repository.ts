import { desc, eq } from 'drizzle-orm';

import { nowIso, type DbHandle } from '@/core/db/handle';

import { msiPurchases } from './schema';

export type MsiPurchase = typeof msiPurchases.$inferSelect;
export type NewMsiPurchase = typeof msiPurchases.$inferInsert;

export function createMsiRepository(db: DbHandle) {
  const { orm } = db;
  return {
    listByAccount(accountId: number): MsiPurchase[] {
      return orm
        .select()
        .from(msiPurchases)
        .where(eq(msiPurchases.account_id, accountId))
        .orderBy(desc(msiPurchases.created_at))
        .all();
    },
    getById(id: number): MsiPurchase | undefined {
      return orm.select().from(msiPurchases).where(eq(msiPurchases.id, id)).get();
    },
    insert(row: NewMsiPurchase): MsiPurchase {
      return orm.insert(msiPurchases).values(row).returning().get();
    },
    updateProgress(id: number, paid: number, remaining: number, status: string): MsiPurchase | undefined {
      orm
        .update(msiPurchases)
        .set({ paid_installments: paid, remaining_amount: remaining, status, updated_at: nowIso() })
        .where(eq(msiPurchases.id, id))
        .run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(msiPurchases).where(eq(msiPurchases.id, id)).run();
    },
  };
}

export type MsiRepository = ReturnType<typeof createMsiRepository>;
