import type { CurrencyCode } from '@/config/schema';

export interface Preferences {
  readonly currency: CurrencyCode;
}

export interface PreferencesStore {
  get(): Preferences;
  set(patch: Partial<Preferences>): void;
  subscribe(listener: () => void): () => void;
}

/** Store observable e inmutable (snapshot nuevo en cada cambio, apto para useSyncExternalStore). */
export function createPreferencesStore(initial: Preferences): PreferencesStore {
  let snapshot: Preferences = Object.freeze({ ...initial });
  const listeners = new Set<() => void>();
  return {
    get: () => snapshot,
    set(patch) {
      const next = Object.freeze({ ...snapshot, ...patch });
      if (next.currency === snapshot.currency) return;
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
