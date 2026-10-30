import { accountsQueryKey, movementsLedgerKey, savingsGoalsQueryKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createGoalsRepository } from './data/goals-repository';
import { goalContributions, savingsGoals } from './data/schema';
import { createGoalsService } from './services/goals-service';

function build(ctx: ModuleContext) {
  return {
    goals: createGoalsService({
      db: ctx.db,
      repo: createGoalsRepository(ctx.db),
      config: ctx.config,
      accounts: () => ctx.resolve(accountsQueryKey),
      ledger: () => ctx.resolve(movementsLedgerKey),
    }),
    dataPort: createTableDataPort(ctx.db, [savingsGoals, goalContributions]),
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('savingsGoals');

export function initSavingsGoalsRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(savingsGoalsQueryKey, { list: runtime.goals.list, stats: runtime.goals.stats });
}

export const getSavingsGoalsRuntime = holder.get;
export const disposeSavingsGoalsRuntime = holder.clear;
