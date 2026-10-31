import type { FrozenAppConfig, ModuleId } from '@/config/schema';
import type { CapabilityKey } from '@/core/contracts/capabilities';
import type { ModuleContext, ModuleManifest } from '@/core/contracts/module';
import type { DbHandle } from '@/core/db/handle';
import { EventBus } from '@/core/events/bus';
import type { EventHandler, EventName } from '@/core/events/event-map';
import type { Logger } from '@/core/logger/logger';
import { createPreferencesStore, type PreferencesStore } from '@/core/preferences/store';
import { ModuleRegistry } from '@/core/registry/registry';

import type { ManifestLoaders } from './manifest-loaders';

export interface AppRuntime {
  readonly config: FrozenAppConfig;
  readonly db: DbHandle;
  readonly registry: ModuleRegistry;
  readonly events: EventBus;
  readonly preferences: PreferencesStore;
  readonly logger: Logger;
  dispose(): void;
}

export interface StartOptions {
  config: FrozenAppConfig;
  db: DbHandle;
  logger: Logger;
  loaders: ManifestLoaders;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Arranque en dos fases: (1) register + suscripciones de todos los módulos activos,
 * (2) onReady. Un módulo que falla al registrarse se descarta y la app sigue sin él.
 */
export async function startModules({ config, db, logger, loaders }: StartOptions): Promise<AppRuntime> {
  const registry = new ModuleRegistry();
  const events = new EventBus(logger);
  const preferences = createPreferencesStore({
    currency: config.currency.default,
    theme: config.ui.defaultTheme,
  });
  const unsubscribers: (() => void)[] = [];

  const enabledIds = (Object.keys(config.modules) as ModuleId[]).filter((id) => config.modules[id].enabled);

  for (const id of enabledIds) {
    const provided: string[] = [];
    let manifest: ModuleManifest | undefined;
    try {
      manifest = loaders[id]();
      const ctx: ModuleContext = {
        config,
        db,
        events,
        logger,
        preferences,
        provide<T>(key: CapabilityKey<T>, impl: T) {
          registry.provide(key, impl);
          provided.push(key.id);
        },
        resolve: (key) => registry.resolve(key),
        dataPorts: () => registry.dataPorts(),
      };
      await manifest.register(ctx);
      registry.add(manifest);
    } catch (error) {
      registry.revoke(provided);
      registry.remove(id, errorMessage(error));
      manifest?.dispose?.();
      logger.error('module register failed', { module: id });
    }
  }

  for (const manifest of registry.activeModules()) {
    const handlers = manifest.subscriptions?.() ?? {};
    for (const [event, handler] of Object.entries(handlers) as [EventName, EventHandler<EventName>][]) {
      unsubscribers.push(events.on(event, handler));
    }
  }

  for (const manifest of registry.activeModules()) {
    try {
      await manifest.onReady?.();
    } catch (error) {
      logger.error('module onReady failed', { module: manifest.id, reason: errorMessage(error) });
    }
  }

  return {
    config,
    db,
    registry,
    events,
    preferences,
    logger,
    dispose() {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      registry.activeModules().forEach((m) => m.dispose?.());
      events.clear();
    },
  };
}
