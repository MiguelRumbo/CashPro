import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { createDbHandle, type DbHandle } from './handle';

export class DatabaseMigrationError extends Error {
  override name = 'DatabaseMigrationError';
}

/** Abre la BD del dispositivo y aplica las migraciones pendientes. */
export async function openAppDatabase(fileName: string): Promise<DbHandle> {
  const client = openDatabaseSync(fileName);
  client.execSync('PRAGMA journal_mode = WAL;');
  client.execSync('PRAGMA foreign_keys = ON;');
  const orm = drizzle(client);
  try {
    await migrate(orm, migrations);
  } catch (error) {
    throw new DatabaseMigrationError(error instanceof Error ? error.message : String(error));
  }
  return createDbHandle(orm);
}
