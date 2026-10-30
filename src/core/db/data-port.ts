import { getTableColumns, getTableName } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

import type { DataPort } from '../contracts/module';
import type { DbHandle } from './handle';

const rowsSchema = z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()])));

export class DataImportError extends Error {
  override name = 'DataImportError';
}

/**
 * Puerto de datos genérico para las tablas de un módulo.
 * `tables` va en orden de dependencia (padres primero); el borrado usa el orden inverso.
 * Las filas importadas se validan en el borde y solo se copian columnas conocidas.
 */
export function createTableDataPort(db: DbHandle, tables: readonly SQLiteTable[]): DataPort {
  const names = tables.map((table) => getTableName(table));
  return {
    tables: names,
    exportTables() {
      return Object.fromEntries(
        tables.map((table) => [getTableName(table), db.orm.select().from(table).all()]),
      );
    },
    importTables(data) {
      for (const table of tables) {
        const name = getTableName(table);
        const raw = data[name];
        if (raw === undefined) continue;
        const parsed = rowsSchema.safeParse(raw);
        if (!parsed.success) throw new DataImportError(`Formato inválido en la tabla ${name}`);
        const columns = Object.keys(getTableColumns(table));
        for (const row of parsed.data) {
          const values = Object.fromEntries(columns.map((c) => [c, row[c] ?? null]).filter(([, v]) => v !== null));
          db.orm.insert(table).values(values as SQLiteTable['$inferInsert']).run();
        }
      }
    },
    clear() {
      for (const table of [...tables].reverse()) db.orm.delete(table).run();
    },
  };
}
