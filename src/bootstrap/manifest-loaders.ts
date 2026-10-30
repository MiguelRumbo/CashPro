import type { ModuleId } from '@/config/schema';
import type { ModuleManifest } from '@/core/contracts/module';

export type ManifestLoaders = Readonly<Record<ModuleId, () => ModuleManifest>>;

/**
 * `require` perezoso: el código de un módulo apagado nunca se evalúa.
 * Solo se importa el index.ts (API pública) de cada módulo.
 */
export const manifestLoaders: ManifestLoaders = {
  settings: () => require('@/modules/settings').manifest,
  accounts: () => require('@/modules/accounts').manifest,
  movements: () => require('@/modules/movements').manifest,
  budgets: () => require('@/modules/budgets').manifest,
  savingsGoals: () => require('@/modules/savings-goals').manifest,
  loans: () => require('@/modules/loans').manifest,
  subscriptions: () => require('@/modules/subscriptions').manifest,
  vehicles: () => require('@/modules/vehicles').manifest,
  alerts: () => require('@/modules/alerts').manifest,
  dashboard: () => require('@/modules/dashboard').manifest,
  reports: () => require('@/modules/reports').manifest,
};
