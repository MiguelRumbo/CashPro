import { desc, eq, sql } from 'drizzle-orm';

import type { AccountRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import type { BalanceColumn } from '../domain/balance';
import { accounts } from './schema';

export type NewAccountRow = typeof accounts.$inferInsert;
export type AccountUpdate = Partial<Omit<NewAccountRow, 'id' | 'type' | 'created_at'>>;

export function createAccountsRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): AccountRecord[] {
      return orm.select().from(accounts).orderBy(desc(accounts.is_primary), desc(accounts.created_at)).all();
    },
    getById(id: number): AccountRecord | undefined {
      return orm.select().from(accounts).where(eq(accounts.id, id)).get();
    },
    insert(row: NewAccountRow): AccountRecord {
      return orm.insert(accounts).values(row).returning().get();
    },
    update(id: number, fields: AccountUpdate): AccountRecord | undefined {
      orm.update(accounts).set({ ...fields, updated_at: nowIso() }).where(eq(accounts.id, id)).run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(accounts).where(eq(accounts.id, id)).run();
    },
    clearPrimary(): void {
      orm.update(accounts).set({ is_primary: 0, updated_at: nowIso() }).run();
    },
    adjust(accountId: number, column: BalanceColumn, delta: number): void {
      const target = accounts[column];
      orm
        .update(accounts)
        .set({ [column]: sql`${target} + ${delta}`, updated_at: nowIso() })
        .where(eq(accounts.id, accountId))
        .run();
    },
  };
}

export type AccountsRepository = ReturnType<typeof createAccountsRepository>;
