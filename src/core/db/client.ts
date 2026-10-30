import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { getOrCreateDatabaseKey, keyPragma } from './encryption-key';
import { createDbHandle, type DbHandle } from './handle';

export class DatabaseMigrationError extends Error {
  override name = 'DatabaseMigrationError';
}

export class DatabaseOpenError extends Error {
  override name = 'DatabaseOpenError';
}

export interface OpenDatabaseOptions {
  fileName: string;
  /** Nombre de la entrada de secure-store con la llave SQLCipher. */
  keyStorageKey: string;
}

/** Abre la BD cifrada del dispositivo y aplica las migraciones pendientes. */
export async function openAppDatabase({ fileName, keyStorageKey }: OpenDatabaseOptions): Promise<DbHandle> {
  const key = await getOrCreateDatabaseKey(keyStorageKey);
  const client = openDatabaseSync(fileName);
  // La llave debe aplicarse antes de cualquier otra sentencia.
  client.execSync(keyPragma(key));
  try {
    // Con una llave incorrecta, la primera lectura falla ("file is not a database").
    client.getFirstSync('SELECT count(*) FROM sqlite_master');
  } catch (error) {
    client.closeSync();
    throw new DatabaseOpenError(
      `No se pudo abrir la base de datos cifrada: ${error instanceof Error ? error.name : 'desconocido'}`,
    );
  }
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
