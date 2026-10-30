import { eq } from 'drizzle-orm';

import type { CurrencyCode } from '@/config/schema';
import type { ProfileRecord } from '@/core/contracts/finance';
import { nowIso, type DbHandle } from '@/core/db/handle';

import { userProfile } from './schema';

/** El perfil es una fila única con id = 1 (heredado de v1). */
const PROFILE_ID = 1;

export function createProfileRepository(db: DbHandle) {
  const { orm } = db;
  return {
    get(): ProfileRecord | undefined {
      return orm.select().from(userProfile).where(eq(userProfile.id, PROFILE_ID)).get();
    },
    ensure(defaults: { name: string; currency: CurrencyCode }): ProfileRecord {
      const existing = this.get();
      if (existing) return existing;
      return orm
        .insert(userProfile)
        .values({ id: PROFILE_ID, name: defaults.name, email: '', currency: defaults.currency })
        .returning()
        .get();
    },
    update(fields: { name: string; email: string; currency: CurrencyCode }): ProfileRecord | undefined {
      orm
        .update(userProfile)
        .set({ ...fields, updated_at: nowIso() })
        .where(eq(userProfile.id, PROFILE_ID))
        .run();
      return this.get();
    },
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
