import type { FrozenAppConfig } from '@/config/schema';
import {
  accountTypes,
  type AccountRecord,
  type AccountsStats,
  type AccountType,
} from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';
import type { EventBus } from '@/core/events/bus';
import type { MovementSnapshot } from '@/core/events/event-map';

import type { AccountsRepository, AccountUpdate } from '../data/accounts-repository';
import {
  balanceEffects,
  cardLastDigits,
  computeAccountsStats,
  defaultIncludeInBalance,
} from '../domain/balance';
import { accountsTexts } from '../texts';

export interface AccountInput {
  name?: string;
  type?: string;
  balance?: number;
  currency?: string;
  icon?: string | null;
  color?: string | null;
  clabe?: string | null;
  bank_name?: string | null;
  card_number?: string;
  generates_interest?: number;
  interest_rate?: number;
  credit_limit?: number;
  current_balance?: number;
  cut_off_day?: number | null;
  payment_due_day?: number | null;
  is_primary?: number;
  include_in_balance?: number;
}

const isAccountType = (value: string): value is AccountType =>
  (accountTypes as readonly string[]).includes(value);

const UPDATABLE_FIELDS = [
  'name',
  'balance',
  'currency',
  'icon',
  'color',
  'clabe',
  'bank_name',
  'generates_interest',
  'interest_rate',
  'credit_limit',
  'current_balance',
  'cut_off_day',
  'payment_due_day',
  'is_primary',
  'include_in_balance',
] as const satisfies readonly (keyof AccountUpdate & keyof AccountInput)[];

export function createAccountsService(deps: {
  db: DbHandle;
  repo: AccountsRepository;
  events: EventBus;
  config: FrozenAppConfig;
}) {
  const { db, repo, events, config } = deps;
  const { errors, messages } = accountsTexts;

  const applyMovement = (movement: MovementSnapshot, sign: 1 | -1) => {
    const effects = balanceEffects(movement, sign, (id) => repo.getById(id)?.type);
    effects.forEach((e) => repo.adjust(e.accountId, e.column, e.delta));
  };

  return {
    list: (): AccountRecord[] => repo.list(),
    getById: (id: number): AccountRecord | undefined => repo.getById(id),
    stats: (): AccountsStats => computeAccountsStats(repo.list()),

    getAccounts(): Result<AccountRecord[]> {
      try {
        return ok(repo.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getAccountById(id: number): Result<AccountRecord> {
      const account = repo.getById(id);
      return account ? ok(account) : fail(errors.notFound);
    },

    getAccountsStats(): Result<AccountsStats> {
      return ok(computeAccountsStats(repo.list()));
    },

    createAccount(input: AccountInput): Result<AccountRecord> {
      const { name, type } = input;
      if (!name || !type) return fail(errors.nameAndTypeRequired);
      if (!isAccountType(type)) return fail(errors.invalidType);
      try {
        const ts = nowIso();
        const created = repo.insert({
          name,
          type,
          balance: input.balance ?? 0,
          currency: input.currency ?? config.currency.default,
          icon: input.icon ?? null,
          color: input.color ?? null,
          clabe: input.clabe ?? null,
          bank_name: input.bank_name ?? null,
          card_last_four: cardLastDigits(input.card_number, config.accounts.cardLastDigits),
          generates_interest: input.generates_interest ?? 0,
          interest_rate: input.interest_rate ?? 0,
          credit_limit: input.credit_limit ?? 0,
          current_balance: input.current_balance ?? 0,
          cut_off_day: input.cut_off_day ?? null,
          payment_due_day: input.payment_due_day ?? null,
          is_primary: input.is_primary ?? 0,
          include_in_balance: input.include_in_balance ?? defaultIncludeInBalance(type),
          created_at: ts,
          updated_at: ts,
        });
        return ok(created, messages.created);
      } catch (error) {
        return failFromError(error);
      }
    },

    updateAccount(id: number, input: AccountInput): Result<AccountRecord> {
      if (!repo.getById(id)) return fail(errors.notFound);
      const fields: AccountUpdate = {};
      for (const key of UPDATABLE_FIELDS) {
        if (input[key] !== undefined) Object.assign(fields, { [key]: input[key] });
      }
      const lastDigits = cardLastDigits(input.card_number, config.accounts.cardLastDigits);
      if (lastDigits) fields.card_last_four = lastDigits;
      if (Object.keys(fields).length === 0) return fail(errors.nothingToUpdate);
      try {
        const updated = repo.update(id, fields);
        return updated ? ok(updated, messages.updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteAccount(id: number): Result<null> {
      const existing = repo.getById(id);
      if (!existing) return fail(errors.notFound);
      try {
        db.transaction(() => {
          repo.delete(id);
          events.emit('account.deleted', { accountId: id, accountType: existing.type });
        });
        return ok(null, messages.deleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    setAccountPrimary(id: number): Result<AccountRecord> {
      if (!repo.getById(id)) return fail(errors.notFound);
      try {
        const updated = db.transaction(() => {
          repo.clearPrimary();
          return repo.update(id, { is_primary: 1 });
        });
        return updated ? ok(updated, messages.primaryUpdated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Manejadores de eventos de movimientos: mantienen los saldos (regla de v1). */
    onMovementRecorded(movement: MovementSnapshot, affectsBalance: boolean): void {
      if (affectsBalance) applyMovement(movement, 1);
    },
    onMovementUpdated(before: MovementSnapshot, after: MovementSnapshot): void {
      applyMovement(before, -1);
      applyMovement(after, 1);
    },
    onMovementDeleted(movement: MovementSnapshot): void {
      applyMovement(movement, -1);
    },

    adjustBalance: repo.adjust,
  };
}

export type AccountsService = ReturnType<typeof createAccountsService>;
