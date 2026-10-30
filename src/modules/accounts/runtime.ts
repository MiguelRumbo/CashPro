import { accountsQueryKey, movementsLedgerKey } from '@/core/contracts/finance';
import type { ModuleContext } from '@/core/contracts/module';
import { createTableDataPort } from '@/core/db/data-port';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { createAccountsRepository } from './data/accounts-repository';
import { createMsiRepository } from './data/msi-repository';
import { accounts, msiPurchases } from './data/schema';
import { createAccountsService } from './services/accounts-service';
import { createMsiService } from './services/msi-service';

function build(ctx: ModuleContext) {
  const repo = createAccountsRepository(ctx.db);
  const accountsService = createAccountsService({ db: ctx.db, repo, events: ctx.events, config: ctx.config });
  const msi = createMsiService({
    db: ctx.db,
    repo: createMsiRepository(ctx.db),
    accounts: repo,
    ledger: () => ctx.resolve(movementsLedgerKey),
  });
  const dataPort = createTableDataPort(ctx.db, [accounts, msiPurchases]);
  return { accounts: accountsService, msi, dataPort, config: ctx.config };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('accounts');

export function initAccountsRuntime(ctx: ModuleContext): void {
  const runtime = holder.set(build(ctx));
  ctx.provide(accountsQueryKey, {
    list: runtime.accounts.list,
    getById: runtime.accounts.getById,
    stats: runtime.accounts.stats,
  });
}

export const getAccountsRuntime = holder.get;
export const disposeAccountsRuntime = holder.clear;
