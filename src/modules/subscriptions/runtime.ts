import { movementsLedgerKey, subscriptionsQueryKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createRecurringRepository } from './data/recurring-repository';
import { recurringPayments } from './data/schema';
import { createRecurringService } from './services/recurring-service';

function build(ctx: ModuleContext) {
  return {
    recurring: createRecurringService({
      db: ctx.db,
      repo: createRecurringRepository(ctx.db),
      config: ctx.config,
      ledger: () => ctx.resolve(movementsLedgerKey),
    }),
    dataPort: createTableDataPort(ctx.db, [recurringPayments]),
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('subscriptions');

export function initSubscriptionsRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(subscriptionsQueryKey, { list: runtime.recurring.list, stats: runtime.recurring.stats });
}

export const getSubscriptionsRuntime = holder.get;
export const disposeSubscriptionsRuntime = holder.clear;
