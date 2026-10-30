import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import type { FrozenAppConfig } from '@/config/schema';

import type { CapabilityKey } from '../contracts/capabilities';
import type { Logger } from '../logger/logger';
import type { Preferences, PreferencesStore } from '../preferences/store';
import type { ModuleRegistry } from './registry';

export interface CoreServices {
  readonly registry: ModuleRegistry;
  readonly preferences: PreferencesStore;
  readonly config: FrozenAppConfig;
  readonly logger: Logger;
}

const CoreContext = createContext<CoreServices | undefined>(undefined);

export class MissingCoreProviderError extends Error {
  override name = 'MissingCoreProviderError';
}

export function CoreProvider({ value, children }: { value: CoreServices; children: ReactNode }) {
  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
}

export function useCore(): CoreServices {
  const value = useContext(CoreContext);
  if (!value) throw new MissingCoreProviderError('Falta <CoreProvider> en el árbol');
  return value;
}

export function useRegistry(): ModuleRegistry {
  return useCore().registry;
}

export function useAppConfig(): FrozenAppConfig {
  return useCore().config;
}

/** Resuelve una capacidad en el render; undefined si su módulo está apagado. */
export function useCapability<T>(key: CapabilityKey<T>): T | undefined {
  return useCore().registry.resolve(key);
}

export function usePreferences(): Preferences {
  const { preferences } = useCore();
  return useSyncExternalStore(preferences.subscribe, preferences.get, preferences.get);
}

/** Registra un error de UI sin datos personales (solo el tipo de error). */
export function useErrorReporter(): (message: string, error?: unknown) => void {
  const { logger } = useCore();
  return (message, error) =>
    logger.error(message, { errorType: error instanceof Error ? error.name : typeof error });
}
