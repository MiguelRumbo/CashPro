import type { FrozenAppConfig } from '@/config/schema';
import type { MovementsLedger, ProfileRecord } from '@/core/contracts/finance';
import type { DataPort } from '@/core/contracts/module';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';
import type { EventBus } from '@/core/events/bus';
import type { PreferencesStore } from '@/core/preferences/store';

import type { ProfileRepository } from '../data/profile-repository';
import { buildBackup, extractTables, type BackupFile } from '../domain/backup';
import { settingsTexts } from '../texts';

export interface ProfileInput {
  name: string;
  email?: string;
  currency?: string;
}

export function createSettingsService(deps: {
  db: DbHandle;
  repo: ProfileRepository;
  events: EventBus;
  config: FrozenAppConfig;
  preferences: PreferencesStore;
  dataPorts: () => readonly { port: DataPort }[];
  ledger: () => MovementsLedger | undefined;
}) {
  const { db, repo, events, config, preferences, dataPorts, ledger } = deps;
  const { errors, messages } = settingsTexts;
  const isCurrency = (value: string | undefined): value is ProfileRecord['currency'] =>
    value !== undefined && value in config.currency.formats;

  const ensureProfile = () => repo.ensure({ name: settingsTexts.defaultProfileName, currency: config.currency.default });
  const syncPreferencesFromProfile = () => preferences.set({ currency: ensureProfile().currency });

  return {
    ensureProfile,

    /** Carga la moneda guardada en las preferencias (sin volver a persistirla). */
    syncPreferencesFromProfile,

    /** Persiste la moneda cuando cambia la preferencia (el selector de moneda vive en la UI). */
    persistCurrency(): void {
      const { currency } = preferences.get();
      const profile = ensureProfile();
      if (profile.currency !== currency) repo.update({ name: profile.name, email: profile.email, currency });
    },

    getProfile(): Result<ProfileRecord> {
      try {
        return ok(ensureProfile());
      } catch (error) {
        return failFromError(error);
      }
    },

    updateProfile(input: ProfileInput): Result<ProfileRecord> {
      const name = input.name?.trim();
      if (!name) return fail(errors.nameRequired);
      try {
        ensureProfile();
        const currency = isCurrency(input.currency) ? input.currency : config.currency.default;
        const updated = repo.update({ name, email: input.email?.trim() || '', currency });
        if (!updated) return fail(errors.nameRequired);
        preferences.set({ currency: updated.currency });
        return ok(updated, messages.profileUpdated);
      } catch (error) {
        return failFromError(error);
      }
    },

    exportAllDataAsJSON(): Result<BackupFile> {
      try {
        const tables = Object.assign({}, ...dataPorts().map(({ port }) => port.exportTables())) as Record<
          string,
          unknown[]
        >;
        return ok(buildBackup(tables, nowIso()));
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Reemplaza TODOS los datos por los del respaldo, de forma atómica. */
    importDataFromJSON(raw: unknown): Result<null> {
      const tables = extractTables(raw);
      if (!tables) return fail(errors.invalidBackup);
      try {
        db.transaction(() => {
          const ports = dataPorts().map(({ port }) => port);
          [...ports].reverse().forEach((port) => port.clear());
          ports.forEach((port) => port.importTables(tables));
          ensureProfile();
          events.emit('data.imported', {});
        });
        syncPreferencesFromProfile();
        return ok(null, messages.dataImported);
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Borra todos los datos de todos los módulos activos y vuelve a sembrar los valores por defecto. */
    resetAllData(): Result<null> {
      try {
        db.transaction(() => {
          [...dataPorts()].reverse().forEach(({ port }) => port.clear());
          ensureProfile();
          events.emit('data.cleared', {});
        });
        syncPreferencesFromProfile();
        return ok(null, messages.dataCleared);
      } catch (error) {
        return failFromError(error);
      }
    },

    exportMovementsAsCSV(): Result<string> {
      const movementsLedger = ledger();
      return movementsLedger ? movementsLedger.exportCsv() : fail(errors.movementsUnavailable);
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
