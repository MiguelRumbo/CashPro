import { budgetsQueryKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createBudgetsRepository } from './data/budgets-repository';
import { budgets } from './data/schema';
import { createBudgetsService } from './services/budgets-service';

function build(ctx: ModuleContext) {
  return {
    budgets: createBudgetsService({ repo: createBudgetsRepository(ctx.db), config: ctx.config }),
    dataPort: createTableDataPort(ctx.db, [budgets]),
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('budgets');

export function initBudgetsRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(budgetsQueryKey, { list: runtime.budgets.list });
}

export const getBudgetsRuntime = holder.get;
export const disposeBudgetsRuntime = holder.clear;
