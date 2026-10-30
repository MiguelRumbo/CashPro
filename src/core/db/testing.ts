/**
 * BD en memoria para tests (sql.js) con las migraciones reales.
 * NUNCA importar desde código de la app.
 */
import path from 'node:path';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs from 'sql.js';

import { createDbHandle, type DbHandle } from './handle';

export async function createTestDb(): Promise<DbHandle> {
  const SQL = await initSqlJs();
  const orm = drizzle(new SQL.Database());
  orm.run(sql`PRAGMA foreign_keys = ON`);
  migrate(orm, { migrationsFolder: path.resolve(__dirname, '../../../drizzle') });
  return createDbHandle(orm);
}
