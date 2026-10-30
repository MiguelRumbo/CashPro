import { z } from 'zod';

/** Versión del formato de respaldo JSON (compatible con los respaldos de v1). */
export const BACKUP_FORMAT_VERSION = '2.0.0';

const tablesSchema = z.record(z.string(), z.unknown());

/** Acepta `{ version, exportDate, data: {...} }` o directamente `{ tabla: filas }` (como v1). */
export const backupFileSchema = z.union([
  z.object({ data: tablesSchema }).passthrough(),
  tablesSchema,
]);

export function extractTables(raw: unknown): Record<string, unknown> | undefined {
  const parsed = backupFileSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  const value = parsed.data;
  const data = (value as { data?: unknown }).data;
  if (data !== undefined && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

export interface BackupFile {
  version: string;
  exportDate: string;
  data: Record<string, unknown[]>;
}

export function buildBackup(tables: Record<string, unknown[]>, exportDate: string): BackupFile {
  return { version: BACKUP_FORMAT_VERSION, exportDate, data: tables };
}
