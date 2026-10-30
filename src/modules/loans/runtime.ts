import { loansQueryKey, movementsLedgerKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createLoansRepository } from './data/loans-repository';
import { loanPayments, loans } from './data/schema';
import { createLoansService } from './services/loans-service';

function build(ctx: ModuleContext) {
  return {
    loans: createLoansService({
      db: ctx.db,
      repo: createLoansRepository(ctx.db),
      ledger: () => ctx.resolve(movementsLedgerKey),
    }),
    dataPort: createTableDataPort(ctx.db, [loans, loanPayments]),
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('loans');

export function initLoansRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(loansQueryKey, { list: runtime.loans.list, stats: runtime.loans.stats });
}

export const getLoansRuntime = holder.get;
export const disposeLoansRuntime = holder.clear;
