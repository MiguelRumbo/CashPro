import { sql } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/** ORM síncrono compartido (expo-sqlite en la app, sql.js en tests). */
export type AppOrm = BaseSQLiteDatabase<'sync', unknown>;

export interface DbHandle {
  readonly orm: AppOrm;
  /**
   * Ejecuta `fn` en una transacción. Las llamadas anidadas se unen a la transacción
   * exterior, así un servicio puede invocar capacidades de otros módulos de forma atómica.
   */
  transaction<T>(fn: () => T): T;
}

export function createDbHandle(orm: AppOrm): DbHandle {
  let depth = 0;
  return {
    orm,
    transaction<T>(fn: () => T): T {
      if (depth > 0) return fn();
      orm.run(sql`BEGIN`);
      depth = 1;
      try {
        const result = fn();
        orm.run(sql`COMMIT`);
        return result;
      } catch (error) {
        orm.run(sql`ROLLBACK`);
        throw error;
      } finally {
        depth = 0;
      }
    },
  };
}

/** Fecha-hora actual en ISO 8601 (formato heredado de v1; v2 migra a ms UTC). */
export function nowIso(): string {
  return new Date().toISOString();
}
