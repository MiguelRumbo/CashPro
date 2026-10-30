import { accountsQueryKey, movementsLedgerKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createMovementsRepository } from './data/movements-repository';
import { movements } from './data/schema';
import { createMovementsService } from './services/movements-service';

function build(ctx: ModuleContext) {
  const service = createMovementsService({
    db: ctx.db,
    repo: createMovementsRepository(ctx.db),
    events: ctx.events,
    config: ctx.config,
    accounts: () => ctx.resolve(accountsQueryKey),
  });
  return {
    movements: service,
    dataPort: createTableDataPort(ctx.db, [movements]),
    resolve: ctx.resolve,
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('movements');

export function initMovementsRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(movementsLedgerKey, runtime.movements.ledger);
}

export const getMovementsRuntime = holder.get;
export const disposeMovementsRuntime = holder.clear;
