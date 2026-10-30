import { eq } from 'drizzle-orm';

import { nowIso, type DbHandle } from '@/core/db/handle';

import { notificationSettings } from './schema';

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type NotificationSettingsUpdate = Partial<
  Omit<NotificationSettings, 'id' | 'created_at' | 'updated_at'>
>;

/** Fila única con id = 1 (heredado de v1). */
const SETTINGS_ID = 1;

export function createAlertSettingsRepository(db: DbHandle) {
  const { orm } = db;
  const get = () =>
    orm.select().from(notificationSettings).where(eq(notificationSettings.id, SETTINGS_ID)).get();
  return {
    ensure(): NotificationSettings {
      return get() ?? orm.insert(notificationSettings).values({ id: SETTINGS_ID }).returning().get();
    },
    update(fields: NotificationSettingsUpdate): NotificationSettings | undefined {
      orm
        .update(notificationSettings)
        .set({ ...fields, updated_at: nowIso() })
        .where(eq(notificationSettings.id, SETTINGS_ID))
        .run();
      return get();
    },
  };
}

export type AlertSettingsRepository = ReturnType<typeof createAlertSettingsRepository>;
