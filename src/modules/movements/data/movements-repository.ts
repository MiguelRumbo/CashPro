import { and, desc, eq, sql } from 'drizzle-orm';

import type { MovementMatch, MovementPatch, MovementRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import { movements } from './schema';

export type NewMovementRow = typeof movements.$inferInsert;

/** Tolerancia para comparar montos REAL (heurística v1 de gasolina). */
const AMOUNT_EPSILON = 0.01;

export function createMovementsRepository(db: DbHandle) {
  const { orm } = db;
  return {
    list(): MovementRecord[] {
      return orm.select().from(movements).orderBy(desc(movements.date), desc(movements.created_at)).all();
    },
    getById(id: number): MovementRecord | undefined {
      return orm.select().from(movements).where(eq(movements.id, id)).get();
    },
    insert(row: NewMovementRow): MovementRecord {
      return orm.insert(movements).values(row).returning().get();
    },
    update(id: number, patch: MovementPatch): MovementRecord | undefined {
      orm
        .update(movements)
        .set({ ...patch, updated_at: nowIso() })
        .where(eq(movements.id, id))
        .run();
      return this.getById(id);
    },
    delete(id: number): void {
      orm.delete(movements).where(eq(movements.id, id)).run();
    },
    findLatest(match: MovementMatch): MovementRecord | undefined {
      return orm
        .select()
        .from(movements)
        .where(
          and(
            eq(movements.category_name, match.category_name),
            eq(movements.category_icon, match.category_icon),
            eq(movements.date, match.date),
            sql`ABS(${movements.amount} - ${match.amount}) < ${AMOUNT_EPSILON}`,
          ),
        )
        .orderBy(desc(movements.created_at))
        .limit(1)
        .get();
    },
  };
}

export type MovementsRepository = ReturnType<typeof createMovementsRepository>;
