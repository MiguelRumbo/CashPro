import {
  accountsQueryKey,
  budgetsQueryKey,
  loansQueryKey,
  savingsGoalsQueryKey,
  subscriptionsQueryKey,
} from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createAlertSettingsRepository } from './data/settings-repository';
import { notificationSettings } from './data/schema';
import { createAlertsService } from './services/alerts-service';

function build(ctx: ModuleContext) {
  return {
    alerts: createAlertsService({
      repo: createAlertSettingsRepository(ctx.db),
      config: ctx.config,
      sources: () => ({
        accounts: ctx.resolve(accountsQueryKey)?.list(),
        budgets: ctx.resolve(budgetsQueryKey)?.list(),
        loans: ctx.resolve(loansQueryKey)?.list(),
        subscriptions: ctx.resolve(subscriptionsQueryKey)?.list(),
        goals: ctx.resolve(savingsGoalsQueryKey)?.list(),
      }),
    }),
    dataPort: createTableDataPort(ctx.db, [notificationSettings]),
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('alerts');

export function initAlertsRuntime(ctx: ModuleContext): void {
  holder.set(build(ctx));
}

export const getAlertsRuntime = holder.get;
export const disposeAlertsRuntime = holder.clear;
