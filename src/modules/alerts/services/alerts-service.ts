import type { FrozenAppConfig } from '@/config/schema';
import { failFromError, ok, type Result } from '@/core/contracts/result';

import type { AlertSettingsRepository, NotificationSettings } from '../data/settings-repository';
import { computeAlerts, type AlertSources, type AppAlert } from '../domain/compute-alerts';

export interface AlertSettingsInput {
  daily_reminder?: boolean | number;
  daily_reminder_time?: string;
  credit_card_alerts?: boolean | number;
  budget_alerts?: boolean | number;
  loan_alerts?: boolean | number;
  subscription_alerts?: boolean | number;
  salary_alerts?: boolean | number;
  savings_goal_alerts?: boolean | number;
  vacation_mode?: boolean | number;
  vacation_mode_until?: string | null;
}

const flag = (value: boolean | number | undefined) => (value ? 1 : 0);

export function createAlertsService(deps: {
  repo: AlertSettingsRepository;
  config: FrozenAppConfig;
  sources: () => AlertSources;
  now?: () => Date;
}) {
  const { repo, config, sources } = deps;
  const now = deps.now ?? (() => new Date());

  return {
    ensureSettings: () => repo.ensure(),

    getNotificationSettings(): Result<NotificationSettings> {
      try {
        return ok(repo.ensure());
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Guarda todos los interruptores (comportamiento v1: los no enviados quedan en 0). */
    updateNotificationSettings(input: AlertSettingsInput): Result<NotificationSettings> {
      try {
        const current = repo.ensure();
        const updated = repo.update({
          daily_reminder: flag(input.daily_reminder),
          daily_reminder_time: input.daily_reminder_time ?? current.daily_reminder_time,
          credit_card_alerts: flag(input.credit_card_alerts),
          budget_alerts: flag(input.budget_alerts),
          loan_alerts: flag(input.loan_alerts),
          subscription_alerts: flag(input.subscription_alerts),
          salary_alerts: flag(input.salary_alerts),
          savings_goal_alerts: flag(input.savings_goal_alerts),
          vacation_mode: flag(input.vacation_mode),
          vacation_mode_until: input.vacation_mode_until ?? null,
        });
        return ok(updated ?? current);
      } catch (error) {
        return failFromError(error);
      }
    },

    getPendingNotifications(formatAmount: (amount: number) => string): Result<AppAlert[]> {
      try {
        return ok(computeAlerts(repo.ensure(), sources(), config.alerts, now(), formatAmount));
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type AlertsService = ReturnType<typeof createAlertsService>;
