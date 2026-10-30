import { manifestLoaders } from '@/bootstrap/manifest-loaders';
import { startModules, type AppRuntime } from '@/bootstrap/start';
import { rawAppConfig } from '@/config/app.config';
import { buildConfig, type ModuleId } from '@/config/schema';
import { createTestDb } from '@/core/db/testing';
import { silentLogger } from '@/core/logger/logger';

export const allModuleIds = Object.keys(rawAppConfig.modules) as ModuleId[];

/** Arranca la app real (módulos + BD sql.js con migraciones) con los módulos indicados apagados. */
export async function startApp(disabled: readonly ModuleId[] = []): Promise<AppRuntime> {
  const modules = Object.fromEntries(
    allModuleIds.map((id) => [id, { enabled: !disabled.includes(id) }]),
  );
  const config = buildConfig({ ...rawAppConfig, modules });
  return startModules({ config, db: await createTestDb(), logger: silentLogger, loaders: manifestLoaders });
}
