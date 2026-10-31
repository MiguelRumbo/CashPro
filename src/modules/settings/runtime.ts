import { movementsLedgerKey, profileQueryKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createProfileRepository } from './data/profile-repository';
import { userProfile } from './data/schema';
import { createSettingsService } from './services/settings-service';

function build(ctx: ModuleContext) {
  return {
    settings: createSettingsService({
      db: ctx.db,
      repo: createProfileRepository(ctx.db),
      events: ctx.events,
      config: ctx.config,
      preferences: ctx.preferences,
      dataPorts: ctx.dataPorts,
      ledger: () => ctx.resolve(movementsLedgerKey),
    }),
    dataPort: createTableDataPort(ctx.db, [userProfile]),
    preferences: ctx.preferences,
    dbFileName: ctx.config.db.fileName,
    unsubscribe: undefined as (() => void) | undefined,
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('settings');

export function initSettingsRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(profileQueryKey, { get: runtime.settings.ensureProfile });
}

/** Sincroniza la moneda guardada y empieza a persistir los cambios de preferencia. */
export function startSettingsRuntime(): void {
  const runtime = holder.get();
  runtime.settings.syncPreferencesFromProfile();
  runtime.unsubscribe = runtime.preferences.subscribe(runtime.settings.persistPreferences);
}

export const getSettingsRuntime = holder.get;

export function disposeSettingsRuntime(): void {
  try {
    holder.get().unsubscribe?.();
  } finally {
    holder.clear();
  }
}
