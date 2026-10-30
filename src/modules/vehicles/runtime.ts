import { accountsQueryKey, movementsLedgerKey, vehiclesQueryKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { fuelLoads, maintenance, vehicles } from './data/schema';
import { createVehiclesRepository } from './data/vehicles-repository';
import { createVehiclesService } from './services/vehicles-service';

function build(ctx: ModuleContext) {
  return {
    vehicles: createVehiclesService({
      db: ctx.db,
      repo: createVehiclesRepository(ctx.db),
      accounts: () => ctx.resolve(accountsQueryKey),
      ledger: () => ctx.resolve(movementsLedgerKey),
    }),
    dataPort: createTableDataPort(ctx.db, [vehicles, fuelLoads, maintenance]),
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('vehicles');

export function initVehiclesRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(vehiclesQueryKey, { list: runtime.vehicles.list, stats: runtime.vehicles.stats });
}

export const getVehiclesRuntime = holder.get;
export const disposeVehiclesRuntime = holder.clear;
